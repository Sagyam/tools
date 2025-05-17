'use client'

import { ClientComponent } from '@/app/load-balancer/client'
import {
    initialClients,
    initialServers,
    requestColors,
} from '@/app/load-balancer/data'
import { LB } from '@/app/load-balancer/lb'
import { LBControls } from '@/app/load-balancer/lb-controls'
import { ServerComponent } from '@/app/load-balancer/sever'
import { Client, Request, ServerState } from '@/app/load-balancer/types'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { getNextServerRR, getNextServerWRR } from './algorithms'

export default function LoadBalancer(): JSX.Element {
    const [clients, setClients] = useState<Client[]>(initialClients)
    const [algorithm, setAlgorithm] = useState<string>('WRR')
    const [requestIndex, setRequestIndex] = useState<number>(0)
    const [speed, setSpeed] = useState<number>(1)
    const [activeRequests, setActiveRequests] = useState<Request[]>([])
    const [servers, setServers] = useState<ServerState[]>(initialServers)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const interval = setInterval(() => {
            let localIndex = requestIndex
            const newRequests: Request[] = []

            clients.forEach((client, clientIndex) => {
                for (let i = 0; i < client.rate; i++) {
                    const serverIndex =
                        algorithm === 'RR'
                            ? getNextServerRR(localIndex)
                            : getNextServerWRR(localIndex)

                    const id = Date.now() + i
                    const color =
                        requestColors[clientIndex % requestColors.length]
                    const weight =
                        Math.floor(Math.random() * (1000 - 10 + 1)) + 10

                    newRequests.push({
                        id,
                        clientIndex,
                        serverIndex,
                        color,
                        phase: 'toLB',
                        weight,
                    })

                    localIndex++
                }
            })

            setActiveRequests((prev) => [...prev, ...newRequests])
            setRequestIndex(localIndex)
        }, 1000 / speed)

        return () => clearInterval(interval)
    }, [clients, algorithm, requestIndex, speed])

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveRequests(
                (prev) =>
                    prev
                        .map((r) =>
                            r.phase === 'toLB'
                                ? { ...r, phase: 'toServer' as const }
                                : r.phase === 'toServer'
                                  ? null
                                  : r
                        )
                        .filter(Boolean) as Request[]
            )
        }, 1000 / speed)
        return () => clearInterval(timer)
    }, [speed])

    const getCoords = (
        type: 'client' | 'server' | 'lb',
        index = 0
    ): { x: number; y: number } => {
        const bounds = containerRef.current?.getBoundingClientRect()
        if (!bounds) return { x: 0, y: 0 }

        const spacing = 80
        const offsetY = 100

        if (type === 'client') {
            return { x: 80, y: offsetY + index * spacing }
        } else if (type === 'server') {
            return { x: bounds.width - 80, y: offsetY + index * spacing }
        }
        return { x: bounds.width / 2, y: bounds.height / 2 }
    }

    const adjustServerCores = (index: number, delta: number): void => {
        setServers((prev) => {
            const copy = [...prev]
            copy[index].cores = Math.max(1, copy[index].cores + delta)
            return copy
        })
    }

    const adjustClientRate = (index: number, delta: number): void => {
        setClients((prev) => {
            const copy = [...prev]
            copy[index].rate = Math.max(1, copy[index].rate + delta)
            return copy
        })
    }

    return (
        <TooltipProvider>
            <div className="p-6 space-y-6">
                <h1 className="text-2xl font-bold">Load Balancer Demo</h1>

                <LBControls
                    algorithm={algorithm}
                    setAlgorithm={setAlgorithm}
                    speed={speed}
                    setSpeed={setSpeed}
                />

                <div
                    className="relative h-96 grid grid-cols-3 gap-8"
                    ref={containerRef}
                >
                    <ClientComponent
                        clients={clients}
                        onAdjustClientRate={(i: number, delta: number) =>
                            adjustClientRate(i, delta)
                        }
                    />

                    <LB />

                    <ServerComponent
                        servers={servers}
                        onAdjustCores={(i: number, delta: number) =>
                            adjustServerCores(i, delta)
                        }
                    />

                    {/* Request Animation */}
                    <AnimatePresence>
                        {activeRequests.map(
                            ({
                                id,
                                clientIndex,
                                serverIndex,
                                color,
                                phase,
                                weight,
                            }) => {
                                const from =
                                    phase === 'toLB'
                                        ? getCoords('client', clientIndex)
                                        : getCoords('lb')
                                const to =
                                    phase === 'toLB'
                                        ? getCoords('lb')
                                        : getCoords('server', serverIndex)
                                const size = 10 + weight / 200
                                return (
                                    <motion.div
                                        key={`${id}-${phase}`}
                                        initial={{ x: from.x, y: from.y }}
                                        animate={{ x: to.x, y: to.y }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 1 / speed }}
                                        className="absolute rounded-full"
                                        style={{
                                            backgroundColor: color,
                                            width: size,
                                            height: size,
                                        }}
                                    />
                                )
                            }
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </TooltipProvider>
    )
}
