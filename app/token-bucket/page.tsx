'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pause, Play, RefreshCw, Server, User } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

interface Packet {
    id: string
    status: 'moving' | 'accepted' | 'dropped'
    timestamp: number
}

export default function TokenBucketSimulator() {
    const [capacity, setCapacity] = useState<number>(15)
    const [refillRate, setRefillRate] = useState<number>(3)
    const [tokens, setTokens] = useState<number>(capacity)
    const [processed, setProcessed] = useState<number>(0)
    const [dropped, setDropped] = useState<number>(0)
    const [running, setRunning] = useState<boolean>(true)
    const [packets, setPackets] = useState<Packet[]>([])

    const containerRef = useRef<HTMLDivElement>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setTokens((prev) => Math.min(prev + refillRate, capacity))
            }, 1000)
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [running, refillRate, capacity])

    useEffect(() => {
        const timer = setInterval(() => {
            setPackets((prev) =>
                prev.filter((p) => Date.now() - p.timestamp < 3000)
            )
        }, 500)
        return () => clearInterval(timer)
    }, [])

    const sendRequest = () => {
        const id = Math.random().toString(36).substring(2, 15)
        const packet: Packet = {
            id,
            status: 'moving',
            timestamp: Date.now(),
        }
        setPackets((prev) => [...prev, packet])

        setTimeout(() => {
            setTokens((prev) => {
                if (prev > 0) {
                    setProcessed((p) => p + 1)
                    setPackets((pkts) =>
                        pkts.map((p) =>
                            p.id === id ? { ...p, status: 'accepted' } : p
                        )
                    )
                    return prev - 1
                } else {
                    setDropped((d) => d + 1)
                    setPackets((pkts) =>
                        pkts.map((p) =>
                            p.id === id ? { ...p, status: 'dropped' } : p
                        )
                    )
                    return prev
                }
            })
        }, 800)
    }

    const reset = () => {
        setTokens(capacity)
        setProcessed(0)
        setDropped(0)
        setPackets([])
        setRunning(true)
    }

    const successRate =
        processed + dropped === 0
            ? 100
            : Math.round((processed / (processed + dropped)) * 100)

    const isTooSmall =
        containerRef.current?.offsetWidth &&
        containerRef.current.offsetWidth < 500

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-bold text-center">
                Token Bucket Rate Limiter Simulator
            </h1>

            <Card>
                <CardContent className="grid grid-row-2 gap-y-4 p-4">
                    <div className="flex flex-row items-center justify-start gap-6">
                        <div>
                            <Label>Bucket Capacity</Label>
                            <Input
                                className="w-48"
                                type="number"
                                value={capacity}
                                onChange={(e) =>
                                    setCapacity(Number(e.target.value))
                                }
                                min={1}
                                max={20}
                            />
                            <div className="text-xs text-muted-foreground">
                                {capacity} tokens
                            </div>
                        </div>
                        <div>
                            <Label>Refill Rate</Label>
                            <Input
                                className="w-48"
                                type="number"
                                value={refillRate}
                                onChange={(e) =>
                                    setRefillRate(Number(e.target.value))
                                }
                                min={1}
                                max={5}
                            />
                            <div className="text-xs text-muted-foreground">
                                {refillRate}/second
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-row gap-4 items-center justify-start">
                        <Button
                            className="w-fit bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={sendRequest}
                        >
                            <Play className="mr-2 w-4 h-4" />
                            Send Request
                        </Button>

                        <Button
                            className={`${
                                running
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-yellow-500 hover:bg-yellow-600'
                            } text-white w-fit`}
                            onClick={() => setRunning(!running)}
                        >
                            {running ? (
                                <>
                                    <Pause className="mr-2 w-4 h-4" />
                                    Pause
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 w-4 h-4" />
                                    Resume
                                </>
                            )}
                        </Button>
                        <Button
                            className="w-fit bg-gray-500 hover:bg-gray-600 text-white"
                            onClick={reset}
                        >
                            <RefreshCw className="mr-2 w-4 h-4" />
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6" ref={containerRef}>
                    {isTooSmall ? (
                        <div className="text-red-500 text-center">
                            Screen too small. Minimum 500px width required to
                            run the simulation.
                        </div>
                    ) : (
                        <div className="flex justify-between items-center relative h-48 min-w-[500px]">
                            <div className="text-center text-sm">
                                <div className="font-semibold text-blue-500 border-2 border-blue-500 rounded-sm mb-2 flex flex-col justify-center items-center p-4 gap-2">
                                    <User scale={4} />
                                    User
                                </div>
                            </div>

                            <div className="flex-1 h-full relative">
                                <div className="absolute left-[40%] top-1/2 -translate-y-1/2 z-10">
                                    <div className="border-lime-500 border-2 rounded-lg p-2 grid grid-cols-4 gap-2 min-w-16 min-h-24">
                                        {Array.from({ length: capacity }).map(
                                            (_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-4 w-4 rounded-md transition-all duration-500 ${i < tokens ? 'bg-lime-500 border-lime-600 border-2 opacity-100' : 'opacity-0'}`}
                                                    style={{
                                                        transitionDelay: `${i * 30}ms`,
                                                    }}
                                                ></div>
                                            )
                                        )}
                                    </div>
                                    <div className="text-xs text-center mt-1">
                                        {tokens}/{capacity} tokens
                                    </div>
                                </div>
                                {packets.map((packet) => (
                                    <div
                                        key={packet.id}
                                        className={`absolute h-4 w-4 rounded-full transition-all duration-700 ease-in-out
                                                      ${packet.status === 'moving' ? 'left-0 bg-background top-1/2 -translate-y-1/2 opacity-100' : ''}
                                                      ${packet.status === 'accepted' ? 'left-[80%] bg-background top-1/2 -translate-y-1/2 opacity-100' : ''}
                                                      ${packet.status === 'dropped' ? 'left-[40%] top-[85%] bg-background opacity-100' : ''}`}
                                        style={{
                                            backgroundColor:
                                                packet.status === 'moving'
                                                    ? '#facc15'
                                                    : packet.status ===
                                                        'accepted'
                                                      ? '#22c55e'
                                                      : '#ef4444',
                                        }}
                                    ></div>
                                ))}
                            </div>

                            <div className="text-center text-sm">
                                <div className="font-semibold text-green-500 border-2 border-green-500 rounded-sm mb-2 flex flex-col justify-center items-center p-4 gap-2">
                                    <Server scale={4} />
                                    Server
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">
                            Current Tokens
                        </div>
                        <div className="text-2xl font-bold text-green-500">
                            {tokens}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">
                            Processed
                        </div>
                        <div className="text-2xl font-bold">{processed}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">
                            Dropped
                        </div>
                        <div className="text-2xl font-bold text-red-500">
                            {dropped}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">
                            Success Rate
                        </div>
                        <div className="text-2xl font-bold">{successRate}%</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
