'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pause, Play, RotateCcw, Send, Server, User, Zap } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

enum RequestStatus {
    Moving = 'moving',
    Accepted = 'accepted',
    Completed = 'completed',
    Dropped = 'dropped',
    Fading = 'fading',
}

interface Request {
    id: number
    status: RequestStatus
    x: number // position on the x-axis (0-100%)
    timestamp: number // time when request was created
}

interface Token {
    id: number
    isVisible: boolean
    isAnimating: boolean
}

const TokenBucketRateLimiter = () => {
    const [bucketCapacity, setBucketCapacity] = useState(5)
    const [refillRate, setRefillRate] = useState(1)
    const [currentTokens, setCurrentTokens] = useState(5)
    const [tokens, setTokens] = useState<Token[]>([])
    const [requests, setRequests] = useState<Request[]>([])
    const [stats, setStats] = useState({ processed: 0, dropped: 0 })
    const [isRunning, setIsRunning] = useState(true)

    const requestIdRef = useRef(0)
    const tokenIdRef = useRef(0)
    const intervalRef = useRef<NodeJS.Timeout>(
        null as unknown as NodeJS.Timeout
    )
    const containerRef = useRef(null)

    // Initialize tokens with animation support
    useEffect(() => {
        const initialTokens = Array.from({ length: bucketCapacity }, () => ({
            id: tokenIdRef.current++,
            isVisible: true,
            isAnimating: false,
        }))
        setTokens(initialTokens)
    }, [bucketCapacity])

    // Update tokens when currentTokens changes
    useEffect(() => {
        setTokens((prevTokens) => {
            const newTokens = [...prevTokens]
            const currentVisibleCount = newTokens.filter(
                (t) => t.isVisible
            ).length

            if (currentTokens > currentVisibleCount) {
                // Add tokens with animation
                const tokensToAdd = currentTokens - currentVisibleCount
                for (let i = 0; i < tokensToAdd; i++) {
                    const hiddenTokenIndex = newTokens.findIndex(
                        (t) => !t.isVisible
                    )
                    if (hiddenTokenIndex !== -1) {
                        newTokens[hiddenTokenIndex] = {
                            ...newTokens[hiddenTokenIndex],
                            isVisible: true,
                            isAnimating: true,
                        }
                        // Remove animation flag after animation completes
                        setTimeout(() => {
                            setTokens((prev) =>
                                prev.map((t) =>
                                    t.id === newTokens[hiddenTokenIndex].id
                                        ? { ...t, isAnimating: false }
                                        : t
                                )
                            )
                        }, 300)
                    } else {
                        // Create new token if none available
                        newTokens.push({
                            id: tokenIdRef.current++,
                            isVisible: true,
                            isAnimating: true,
                        })
                        // Remove an animation flag after animation completes
                        setTimeout(() => {
                            setTokens((prev) =>
                                prev.map((t) =>
                                    t.id === tokenIdRef.current - 1
                                        ? { ...t, isAnimating: false }
                                        : t
                                )
                            )
                        }, 300)
                    }
                }
            } else if (currentTokens < currentVisibleCount) {
                // Remove tokens with animation
                const tokensToRemove = currentVisibleCount - currentTokens
                let removed = 0
                for (
                    let i = newTokens.length - 1;
                    i >= 0 && removed < tokensToRemove;
                    i--
                ) {
                    if (newTokens[i].isVisible) {
                        newTokens[i] = {
                            ...newTokens[i],
                            isAnimating: true,
                        }
                        // Hide token after animation
                        setTimeout(() => {
                            setTokens((prev) =>
                                prev.map((t) =>
                                    t.id === newTokens[i].id
                                        ? {
                                              ...t,
                                              isVisible: false,
                                              isAnimating: false,
                                          }
                                        : t
                                )
                            )
                        }, 300)
                        removed++
                    }
                }
            }

            return newTokens
        })
    }, [currentTokens])

    // Refill tokens at a specified rate
    useEffect(() => {
        if (!isRunning) return

        intervalRef.current = setInterval(() => {
            setCurrentTokens((prev) =>
                Math.min(prev + refillRate, bucketCapacity)
            )
        }, 1000)

        return () => clearInterval(intervalRef.current)
    }, [refillRate, bucketCapacity, isRunning])

    // Clean up completed requests with fade out
    useEffect(() => {
        const cleanup = setInterval(() => {
            setRequests((prev) => {
                const updated = prev.map((req: Request) => {
                    if (req.status === 'completed') {
                        return { ...req, status: RequestStatus.Fading }
                    }
                    return req
                })

                // Remove fading requests after fade animation
                setTimeout(() => {
                    setRequests((current) =>
                        current.filter((req) => req.status !== 'fading')
                    )
                }, 500)

                return updated
            })
        }, 1500)

        return () => clearInterval(cleanup)
    }, [])

    const createRequest = () => {
        const newRequest = {
            id: requestIdRef.current++,
            status: 'moving',
            x: 0,
            timestamp: Date.now(),
        } as Request

        setRequests((prev) => [...prev, newRequest])

        // Animate request movement (to 60%)
        setTimeout(() => {
            setRequests((prev) =>
                prev.map((req) =>
                    req.id === newRequest.id ? { ...req, x: 60 } : req
                )
            )
        }, 50)
    }

    const processRequest = (requestId: number) => {
        setCurrentTokens((prev) => {
            if (prev > 0) {
                // Token available - accept the request
                setStats((s) => ({ ...s, processed: s.processed + 1 }))
                setRequests((r) =>
                    r.map((req) =>
                        req.id === requestId
                            ? { ...req, status: RequestStatus.Accepted, x: 85 }
                            : req
                    )
                )
                // Complete the request after reaching server
                setTimeout(() => {
                    setRequests((r) =>
                        r.map((req) =>
                            req.id === requestId
                                ? { ...req, status: RequestStatus.Completed }
                                : req
                        )
                    )
                }, 1000)
                return prev - 1
            } else {
                // No tokens available - drop the request at the bucket
                setStats((s) => ({ ...s, dropped: s.dropped + 1 }))
                setRequests((r) =>
                    r.map((req) =>
                        req.id === requestId
                            ? { ...req, status: RequestStatus.Dropped, x: 50 } // Stay at bucket position
                            : req
                    )
                )
                // Start fade out immediately for dropped requests
                setTimeout(() => {
                    setRequests((r) =>
                        r.map((req) =>
                            req.id === requestId
                                ? { ...req, status: RequestStatus.Fading }
                                : req
                        )
                    )
                }, 800) // Short delay to show the red state
                return prev
            }
        })
    }

    useEffect(() => {
        const movingRequests = requests.filter(
            (req) => req.status === 'moving' && req.x >= 60
        )
        movingRequests.forEach((req) => {
            setTimeout(() => processRequest(req.id), 500)
        })
    }, [requests])

    const resetStats = () => {
        setStats({ processed: 0, dropped: 0 })
        setRequests([])
        setCurrentTokens(bucketCapacity)
    }

    const toggleSimulation = () => {
        setIsRunning(!isRunning)
    }

    return (
        <div className="min-h-screen bg-background flex items-start justify-center">
            <div className="max-w-6xl">
                <h1 className="text-3xl font-bold text-center my-2 p-8">
                    Token Bucket Rate Limiter Simulator
                </h1>

                <Card className="bg-primary rounded-lg shadow-lg my-4 p-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <Label className="block text-sm font-medium mb-2">
                                Bucket Capacity
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                max="15"
                                value={bucketCapacity}
                                onChange={(e) =>
                                    setBucketCapacity(parseInt(e.target.value))
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            <span className="text-sm text-primary-foreground">
                                {bucketCapacity} tokens
                            </span>
                        </div>
                        <div>
                            <Label className="block text-sm font-medium mb-2">
                                Refill Rate
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                max="5"
                                value={refillRate}
                                onChange={(e) =>
                                    setRefillRate(parseInt(e.target.value))
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            <span className="text-sm text-primary-foreground">
                                {refillRate}/second
                            </span>
                        </div>
                        <div className="flex items-center justify-center gap-x-4">
                            <Button
                                onClick={createRequest}
                                className="w-fit bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium"
                            >
                                <Send size={20} />
                                Send Request
                            </Button>

                            <Button
                                onClick={toggleSimulation}
                                className={`w-24 px-4 py-2 rounded-lg font-medium transition-colors
                                 ${
                                     isRunning
                                         ? 'bg-yellow-600 hover:bg-yellow-700'
                                         : 'bg-green-600 hover:bg-green-700'
                                 }`}
                            >
                                {isRunning ? (
                                    <Pause size={16} />
                                ) : (
                                    <Play size={16} />
                                )}
                                {isRunning ? 'Pause' : 'Resume'}
                            </Button>

                            <Button
                                onClick={resetStats}
                                className="w-fit bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium"
                            >
                                <RotateCcw size={20} />
                                Reset
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card
                    className="bg-primary relative rounded-lg shadow-lg my-4 p-8"
                    ref={containerRef}
                    style={{ height: '500px' }}
                >
                    <div className="absolute left-8 top-1/2 transform -translate-y-1/2 text-center">
                        <div className="bg-blue-600 rounded-full p-4 mb-2">
                            <User size={32} />
                        </div>
                        <div className="text-sm font-medium">User</div>
                    </div>

                    <div className="absolute left-1/2 top-16 transform -translate-x-1/2">
                        <div className="text-center mb-4">
                            <div className="text-sm mb-2">
                                Tokens are added at fixed rate
                            </div>
                            <Zap className="mx-auto text-green-400" size={24} />
                        </div>
                        <div className="relative">
                            <div className="w-32 h-48 border-4 border-red-400 rounded-lg bg-primary relative overflow-hidden">
                                <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center items-end p-2">
                                    {tokens.map((token, i) => (
                                        <div
                                            key={token.id}
                                            className={`w-6 h-6 bg-green-400 transform rotate-45 m-1 transition-all duration-300 ease-in-out ${
                                                token.isVisible
                                                    ? 'opacity-100 scale-100'
                                                    : 'opacity-0 scale-0'
                                            } ${
                                                token.isAnimating &&
                                                token.isVisible
                                                    ? 'animate-bounce'
                                                    : ''
                                            }`}
                                            style={{
                                                animationDelay: `${i * 0.1}s`,
                                                animationDuration:
                                                    token.isAnimating
                                                        ? '0.6s'
                                                        : '2s',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="text-center mt-2 text-md">
                                <div className="text-primary-foreground">
                                    {currentTokens}/{bucketCapacity} tokens
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute right-8 top-1/2 text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mb-2">
                            <Server size={32} />
                        </div>
                        <div className="text-sm font-medium">Server</div>
                    </div>

                    {requests.map((request) => (
                        <div
                            key={request.id}
                            className={`absolute transition-all duration-1000 ease-in-out ${
                                request.status === 'fading'
                                    ? 'opacity-0 transition-opacity duration-500'
                                    : 'opacity-100'
                            }`}
                            style={{
                                left: `${request.x}%`,
                                top:
                                    request.status === 'dropped'
                                        ? '65%' // Position dropped requests below the bucket
                                        : '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-colors duration-300 ${
                                    request.status === 'accepted' ||
                                    request.status === 'completed'
                                        ? 'bg-green-500'
                                        : request.status === 'dropped'
                                          ? 'bg-red-500 animate-pulse'
                                          : 'bg-blue-500'
                                }`}
                            >
                                {request.status === 'dropped' ? '✕' : 'R'}
                            </div>
                        </div>
                    ))}

                    {/* Legend */}
                    <div className="absolute bottom-4 right-4 bg-secondary bg-opacity-50 rounded-lg p-3 text-sm">
                        <div className="font-semibold mb-2 text-white">
                            Request Status:
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                            <span className="text-white">Moving to Bucket</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                            <span className="text-white">
                                Accepted & Processed
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                            <span className="text-white">
                                Dropped (No Tokens)
                            </span>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                    <Card className="bg-primary rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">
                            {currentTokens}
                        </div>
                        <div className="text-sm ">Current Tokens</div>
                    </Card>
                    <Card className="bg-primary rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">
                            {stats.processed}
                        </div>
                        <div className="text-sm ">Processed</div>
                    </Card>
                    <Card className="bg-primary rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-red-400">
                            {stats.dropped}
                        </div>
                        <div className="text-sm ">Dropped</div>
                    </Card>
                    <Card className="bg-primary rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                            {stats.processed + stats.dropped > 0
                                ? Math.round(
                                      (stats.processed /
                                          (stats.processed + stats.dropped)) *
                                          100
                                  )
                                : 100}
                            %
                        </div>
                        <div className="text-sm ">Success Rate</div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default TokenBucketRateLimiter
