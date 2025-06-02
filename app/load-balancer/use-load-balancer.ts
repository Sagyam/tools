'use client'

import {
    getNextServerRR,
    getNextServerWRR,
} from '@/app/load-balancer/algorithms'
import { requestColors } from '@/app/load-balancer/data'
import type {
    Client,
    Request,
    ServerState,
    SystemMetrics,
} from '@/app/load-balancer/types'
import { useEffect, useRef, useState } from 'react'

const MAX_HISTORY_LENGTH = 50

// Generate some initial sample data
const generateSampleData = () => {
    const turnaroundTimes: Record<string, number[]> = {}
    const droppedRequests: Record<string, number> = {}
    const queueLengths: Record<string, number[]> = {}
    const totalProcessed: Record<string, number> = {}

    // Generate sample data for 3 servers
    for (let i = 1; i <= 3; i++) {
        const serverName = `Server ${i}`
        turnaroundTimes[serverName] = Array.from(
            { length: 10 },
            () => 500 + Math.random() * 500
        )
        droppedRequests[serverName] = Math.floor(Math.random() * 5)
        queueLengths[serverName] = Array.from({ length: 10 }, () =>
            Math.floor(Math.random() * 5)
        )
        totalProcessed[serverName] = 10 + Math.floor(Math.random() * 20)
    }

    return {
        turnaroundTimes,
        droppedRequests,
        queueLengths,
        totalProcessed,
        aggregated: {
            avgTurnaroundTime: 750,
            totalDroppedRequests: 6,
            avgQueueLength: 2.5,
            totalProcessedRequests: 45,
        },
    }
}

export const useLoadBalancer = (
    initialClients: Client[],
    initialServers: ServerState[],
    initialAlgorithm = 'WRR',
    initialSpeed = 1
) => {
    const [clients, setClients] = useState<Client[]>(initialClients)
    const [algorithm, setAlgorithm] = useState<string>(initialAlgorithm)
    const [requestIndex, setRequestIndex] = useState<number>(0)
    const [speed, setSpeed] = useState<number>(initialSpeed)
    const [activeRequests, setActiveRequests] = useState<Request[]>([])
    const [servers, setServers] = useState<ServerState[]>(
        initialServers.map((server) => ({
            ...server,
            queue: [],
            metrics: {
                turnaroundTimes: Array.from(
                    { length: 10 },
                    () => 500 + Math.random() * 500
                ),
                droppedRequests: Math.floor(Math.random() * 5),
                queueLengthHistory: Array.from({ length: 10 }, () =>
                    Math.floor(Math.random() * 5)
                ),
                totalProcessed: 10 + Math.floor(Math.random() * 20),
            },
        }))
    )

    // Initialize with sample data
    const [systemMetrics, setSystemMetrics] =
        useState<SystemMetrics>(generateSampleData())

    const requestTimersRef = useRef<NodeJS.Timeout[]>([])
    const processingTimersRef = useRef<NodeJS.Timeout[]>([])
    const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            requestTimersRef.current.forEach((timer) => clearTimeout(timer))
            processingTimersRef.current.forEach((timer) => clearTimeout(timer))
            if (metricsIntervalRef.current)
                clearInterval(metricsIntervalRef.current)
        }
    }, [])

    // Update system metrics periodically
    useEffect(() => {
        const updateSystemMetrics = () => {
            const metrics: SystemMetrics = {
                turnaroundTimes: {},
                droppedRequests: {},
                queueLengths: {},
                totalProcessed: {},
                aggregated: {
                    avgTurnaroundTime: 0,
                    totalDroppedRequests: 0,
                    avgQueueLength: 0,
                    totalProcessedRequests: 0,
                },
            }

            let totalTurnaroundTime = 0
            let totalTurnaroundSamples = 0
            let totalDropped = 0
            let totalQueueLength = 0
            let totalQueueSamples = 0
            let totalProcessed = 0

            servers.forEach((server) => {
                // Store individual server metrics
                metrics.turnaroundTimes[server.name] = [
                    ...server.metrics.turnaroundTimes,
                ]
                metrics.droppedRequests[server.name] =
                    server.metrics.droppedRequests
                metrics.queueLengths[server.name] = [
                    ...server.metrics.queueLengthHistory,
                ]
                metrics.totalProcessed[server.name] =
                    server.metrics.totalProcessed

                // Accumulate for aggregated metrics
                totalTurnaroundTime += server.metrics.turnaroundTimes.reduce(
                    (sum, time) => sum + time,
                    0
                )
                totalTurnaroundSamples += server.metrics.turnaroundTimes.length
                totalDropped += server.metrics.droppedRequests
                totalQueueLength += server.metrics.queueLengthHistory.reduce(
                    (sum, length) => sum + length,
                    0
                )
                totalQueueSamples += server.metrics.queueLengthHistory.length
                totalProcessed += server.metrics.totalProcessed
            })

            // Calculate aggregated metrics
            metrics.aggregated = {
                avgTurnaroundTime:
                    totalTurnaroundSamples > 0
                        ? totalTurnaroundTime / totalTurnaroundSamples
                        : 0,
                totalDroppedRequests: totalDropped,
                avgQueueLength:
                    totalQueueSamples > 0
                        ? totalQueueLength / totalQueueSamples
                        : 0,
                totalProcessedRequests: totalProcessed,
            }

            setSystemMetrics(metrics)

            // Log metrics for debugging
            console.log('Updated metrics:', metrics)
        }

        // Update metrics every second
        metricsIntervalRef.current = setInterval(updateSystemMetrics, 1000)

        // Initial update
        updateSystemMetrics()

        return () => {
            if (metricsIntervalRef.current)
                clearInterval(metricsIntervalRef.current)
        }
    }, [servers])

    // Generate requests with random intervals
    useEffect(() => {
        const generateRequest = (clientIndex: number) => {
            const client = clients[clientIndex]
            if (!client) return

            // Generate a request
            const serverIndex =
                algorithm === 'RR'
                    ? getNextServerRR(requestIndex)
                    : getNextServerWRR(requestIndex)

            const id = Date.now() + Math.random()
            const color = requestColors[clientIndex % requestColors.length]
            const weight = Math.floor(Math.random() * (1000 - 10 + 1)) + 10
            const processingTime = Math.floor(100 + Math.random() * 200) / speed // 1-3 seconds processing time

            const newRequest: Request = {
                id,
                clientIndex,
                serverIndex,
                color,
                phase: 'toLB',
                weight,
                processingTime,
                arrivalTime: Date.now(),
            }

            setActiveRequests((prev) => [...prev, newRequest])
            setRequestIndex((prev) => prev + 1)

            // Schedule next request with random interval
            const nextInterval =
                Math.max(
                    500,
                    Math.floor((1000 / client.rate) * (0.5 + Math.random()))
                ) / speed
            const timer = setTimeout(
                () => generateRequest(clientIndex),
                nextInterval
            )
            requestTimersRef.current.push(timer)
        }

        // Clear existing timers
        requestTimersRef.current.forEach((timer) => clearTimeout(timer))
        requestTimersRef.current = []

        // Start generating requests for each client
        clients.forEach((_, index) => {
            const initialDelay = (Math.random() * 1000) / speed
            const timer = setTimeout(() => generateRequest(index), initialDelay)
            requestTimersRef.current.push(timer)
        })

        return () => {
            requestTimersRef.current.forEach((timer) => clearTimeout(timer))
            requestTimersRef.current = []
        }
    }, [clients, algorithm, requestIndex, speed])

    // Handle request phase transitions
    useEffect(() => {
        const moveRequestsToNextPhase = () => {
            setActiveRequests((prev) => {
                const updatedRequests = [...prev]
                const newRequests: Request[] = []

                // Process each request based on its current phase
                for (let i = updatedRequests.length - 1; i >= 0; i--) {
                    const request = updatedRequests[i]

                    if (request.phase === 'toLB') {
                        // Move from client to load balancer
                        updatedRequests[i] = {
                            ...request,
                            phase: 'toServer' as const,
                        }
                    } else if (request.phase === 'toServer') {
                        // Move from load balancer to server queue
                        updatedRequests.splice(i, 1) // Remove from active requests

                        // Add to server queue
                        setServers((prevServers) => {
                            const newServers = [...prevServers]
                            const server = newServers[request.serverIndex]
                            if (server) {
                                server.queue.push({
                                    ...request,
                                    phase: 'waiting',
                                })

                                // Update queue length history
                                server.metrics.queueLengthHistory.push(
                                    server.queue.length
                                )
                                if (
                                    server.metrics.queueLengthHistory.length >
                                    MAX_HISTORY_LENGTH
                                ) {
                                    server.metrics.queueLengthHistory.shift()
                                }
                            }
                            return newServers
                        })
                    }
                }

                return [...updatedRequests, ...newRequests]
            })

            // Process server queues
            setServers((prevServers) => {
                const newServers = [...prevServers]

                newServers.forEach((server, serverIndex) => {
                    // Process waiting requests if there are available cores
                    while (
                        server.queue.length > 0 &&
                        server.usedCores < server.cores
                    ) {
                        const request = server.queue.shift()
                        if (request) {
                            server.usedCores++

                            // Schedule request completion
                            const processingTime =
                                request.processingTime || 2000 / speed
                            const timer = setTimeout(() => {
                                setServers((servers) => {
                                    const updatedServers = [...servers]
                                    const server = updatedServers[serverIndex]
                                    if (server) {
                                        server.usedCores = Math.max(
                                            0,
                                            server.usedCores - 1
                                        )

                                        // Calculate turnaround time and update metrics
                                        const completionTime = Date.now()
                                        const arrivalTime =
                                            request.arrivalTime ||
                                            completionTime
                                        const turnaroundTime =
                                            completionTime - arrivalTime

                                        // Add some randomness to turnaround time for visualization purposes
                                        const adjustedTurnaroundTime = Math.max(
                                            100,
                                            turnaroundTime +
                                                Math.random() * 200 -
                                                100
                                        )

                                        server.metrics.turnaroundTimes.push(
                                            adjustedTurnaroundTime
                                        )
                                        server.metrics.totalProcessed++

                                        // Keep history at a reasonable size
                                        if (
                                            server.metrics.turnaroundTimes
                                                .length > MAX_HISTORY_LENGTH
                                        ) {
                                            server.metrics.turnaroundTimes.shift()
                                        }

                                        // Update queue length history
                                        server.metrics.queueLengthHistory.push(
                                            server.queue.length
                                        )
                                        if (
                                            server.metrics.queueLengthHistory
                                                .length > MAX_HISTORY_LENGTH
                                        ) {
                                            server.metrics.queueLengthHistory.shift()
                                        }
                                    }
                                    return updatedServers
                                })
                            }, processingTime)

                            processingTimersRef.current.push(timer)
                        }
                    }
                })

                return newServers
            })
        }

        const interval = setInterval(moveRequestsToNextPhase, 1000 / speed)
        return () => clearInterval(interval)
    }, [speed])

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

    return {
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
    }
}
