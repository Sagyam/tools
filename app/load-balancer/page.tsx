'use client'

import { ClientComponent } from '@/app/load-balancer/client'
import { initialClients, initialServers } from '@/app/load-balancer/data'
import { LB } from '@/app/load-balancer/lb'
import { LBControls } from '@/app/load-balancer/lb-controls'
import { MetricsDashboard } from '@/app/load-balancer/metrics-dashboard'
import { ServerQueue } from '@/app/load-balancer/server-queue'
import { ServerComponent } from '@/app/load-balancer/sever'
import { useLoadBalancer } from '@/app/load-balancer/use-load-balancer'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef } from 'react'

export default function LoadBalancer(): JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null)

    const {
        clients,
        algorithm,
        speed,
        activeRequests,
        servers,
        systemMetrics,
        setAlgorithm,
        setSpeed,
        adjustServerCores,
        adjustClientRate,
    } = useLoadBalancer(initialClients, initialServers)

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
                        onAdjustClientRate={adjustClientRate}
                    />

                    <LB />

                    <ServerComponent
                        servers={servers}
                        onAdjustCores={adjustServerCores}
                    />

                    {/* Server Queues */}
                    <AnimatePresence>
                        {servers.map((server, index) => (
                            <ServerQueue
                                key={`queue-${server.name}`}
                                serverIndex={index}
                                queue={server.queue}
                                position={getCoords('server', index)}
                            />
                        ))}
                    </AnimatePresence>

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
                                const size = 10 + weight / 100
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

                {/* Metrics Dashboard */}
                <div className="mt-8">
                    <MetricsDashboard metrics={systemMetrics} />
                </div>
            </div>
        </TooltipProvider>
    )
}
