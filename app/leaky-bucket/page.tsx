'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pause, Play, RotateCcw, Send, Server, User } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

interface Request {
    id: number
    timestamp: number
    processTime: number
    dropTime: number
}

const LeakyBucketSimulator = () => {
    const [bucketSize, setBucketSize] = useState<number>(10)
    const [fillRate, setFillRate] = useState<number>(2) // requests per second
    const [bucket, setBucket] = useState<Request[]>([])
    const [isRunning, setIsRunning] = useState<boolean>(false)
    const [stats, setStats] = useState({
        totalRequests: 0,
        processedRequests: 0,
        droppedRequests: 0,
        currentBucketSize: 0,
    })
    const [animatingRequests, setAnimatingRequests] = useState<Request[]>([])
    const [processingRequests, setProcessingRequests] = useState<Request[]>([])
    const [droppedRequests, setDroppedRequests] = useState<Request[]>([])

    const intervalRef = useRef<NodeJS.Timeout>(
        null as unknown as NodeJS.Timeout
    )
    const requestIdRef = useRef<0>(0)

    // Leaky bucket processing
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setBucket((prev) => {
                    const newBucket = [...prev]
                    const processCount = Math.min(fillRate, newBucket.length)

                    // Process requests (leak from bucket)
                    const processed = newBucket.splice(0, processCount)

                    if (processed.length > 0) {
                        setProcessingRequests((prev) => [
                            ...prev,
                            ...processed.map((req: Request) => ({
                                ...req,
                                processTime: Date.now(),
                            })),
                        ])

                        setStats((prev) => ({
                            ...prev,
                            processedRequests:
                                prev.processedRequests + processed.length,
                            currentBucketSize: newBucket.length,
                        }))
                    }

                    return newBucket
                })
            }, 1000)
        } else {
            clearInterval(intervalRef.current)
        }

        return () => clearInterval(intervalRef.current)
    }, [isRunning, fillRate])

    // Animation cleanup
    useEffect(() => {
        const cleanup = setInterval(() => {
            setAnimatingRequests((prev) =>
                prev.filter((req: Request) => Date.now() - req.timestamp < 2000)
            )
            setProcessingRequests((prev) =>
                prev.filter(
                    (req: Request) => Date.now() - req.processTime < 2000
                )
            )
            setDroppedRequests((prev) =>
                prev.filter((req: Request) => Date.now() - req.dropTime < 2000)
            )
        }, 100)

        return () => clearInterval(cleanup)
    }, [])

    const sendRequest = () => {
        const requestId = requestIdRef.current++
        const newRequest: Request = {
            id: requestId,
            timestamp: Date.now(),
            processTime: 0,
            dropTime: 0,
        }

        // Add to animation queue
        setAnimatingRequests((prev) => [...prev, newRequest])

        // Simulate request reaching bucket after animation
        setTimeout(() => {
            setBucket((prev) => {
                if (prev.length < bucketSize) {
                    // Request accepted
                    const updatedBucket = [...prev, newRequest]
                    setStats((prevStats) => ({
                        ...prevStats,
                        totalRequests: prevStats.totalRequests + 1,
                        currentBucketSize: updatedBucket.length,
                    }))
                    return updatedBucket
                } else {
                    // Request dropped - add to dropped animation
                    setDroppedRequests((prevDropped) => [
                        ...prevDropped,
                        {
                            ...newRequest,
                            dropTime: Date.now(),
                        },
                    ])
                    setStats((prevStats) => ({
                        ...prevStats,
                        totalRequests: prevStats.totalRequests + 1,
                        droppedRequests: prevStats.droppedRequests + 1,
                    }))
                    return prev
                }
            })
        }, 1000)
    }

    const reset = () => {
        setIsRunning(false)
        setBucket([])
        setAnimatingRequests([])
        setProcessingRequests([])
        setDroppedRequests([])
        setStats({
            totalRequests: 0,
            processedRequests: 0,
            droppedRequests: 0,
            currentBucketSize: 0,
        })
        requestIdRef.current = 0
    }

    const bucketFillPercentage = (bucket.length / bucketSize) * 100

    return (
        <div className="min-h-screen bg-primary flex items-start justify-center">
            <div className="max-w-6xl">
                <h1 className="text-3xl font-bold text-center my-2 p-8">
                    Leaky Bucket Rate Limiting Simulator
                </h1>

                {/* Controls */}
                <Card className="bg-primary rounded-lg shadow-lg my-4 p-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <Label className="block text-sm font-medium mb-2">
                                Bucket Size
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                max="20"
                                value={bucketSize}
                                onChange={(e) =>
                                    setBucketSize(parseInt(e.target.value))
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            <span className="text-sm text-gray-400">
                                {bucketSize} tokens
                            </span>
                        </div>

                        <div>
                            <Label className="block text-sm font-medium mb-2">
                                Fill Rate (req/sec)
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                max="10"
                                value={fillRate}
                                onChange={(e) =>
                                    setFillRate(parseInt(e.target.value))
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            <span className="text-sm text-gray-400">
                                {fillRate}/second
                            </span>
                        </div>

                        <div className="flex items-center justify-center gap-x-4">
                            <Button
                                onClick={sendRequest}
                                className="w-fit bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium"
                            >
                                <Send size={20} />
                                Send Request
                            </Button>

                            <Button
                                onClick={() => setIsRunning(!isRunning)}
                                className={`w-24 px-4 py-2 rounded-lg font-medium ${
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
                                {isRunning ? 'Pause' : 'Start'}
                            </Button>

                            <Button
                                onClick={reset}
                                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-md transition-colors"
                            >
                                <RotateCcw size={16} />
                                Reset
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Animation Container */}
                <Card
                    className="bg-primary relative rounded-lg shadow-lg my-4 p-8"
                    style={{ height: '500px' }}
                >
                    <div className="relative h-full flex items-center justify-between">
                        {/* User */}
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                                <User size={32} />
                            </div>
                            <span className="text-md font-semibold">User</span>
                        </div>

                        {/* Animating Requests */}
                        {animatingRequests.map((request: Request) => {
                            const age = Date.now() - request.timestamp
                            const progress = Math.min(age / 1000, 1) // 1-second animation
                            const leftPosition = 15 + progress * 35 // Move from user (15%) to bucket (50%)

                            return (
                                <div
                                    key={request.id}
                                    className="absolute w-4 h-4 bg-yellow-500 rounded-full transition-all duration-100 animate-pulse"
                                    style={{
                                        left: `${leftPosition}%`,
                                        top: '45%',
                                        transform: 'translateY(-50%)',
                                    }}
                                />
                            )
                        })}

                        {/* Bucket */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-24 h-32 border-4 border-gray-400 rounded-b-lg overflow-hidden mb-2">
                                {/* Water level */}
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-blue-400 transition-all duration-300"
                                    style={{
                                        height: `${bucketFillPercentage}%`,
                                    }}
                                />
                                {/* Bucket capacity indicator */}
                                <div className="absolute inset-0 flex flex-col justify-between p-1">
                                    {Array.from(
                                        { length: bucketSize },
                                        (_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 w-full border-t border-gray-300 ${
                                                    i < bucket.length
                                                        ? 'bg-blue-200'
                                                        : ''
                                                }`}
                                            />
                                        )
                                    )}
                                </div>
                                {/* Leak holes at the bottom */}
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                                    {Array.from(
                                        { length: Math.min(fillRate, 3) },
                                        (_, i) => (
                                            <div
                                                key={i}
                                                className="w-1 h-1 bg-gray-600 rounded-full mx-0.5 inline-block"
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                            <span className="text-sm text-gray-600">
                                Bucket ({bucket.length}/{bucketSize})
                            </span>
                        </div>
                        {/* Processing Requests */}
                        {processingRequests.map(
                            (request: Request, idx: number) => {
                                const age = Date.now() - request.processTime
                                const progress = Math.min(age / 1000, 1) // 1-second animation
                                const leftPosition = 50 + progress * 35 // Move from bucket (50%) to server (85%)

                                return (
                                    <div
                                        key={idx}
                                        className="absolute w-4 h-4 bg-green-500 rounded-full transition-all duration-100"
                                        style={{
                                            left: `${leftPosition}%`,
                                            top: '45%',
                                            transform: 'translateY(-50%)',
                                        }}
                                    />
                                )
                            }
                        )}
                        {/* Dropped Requests */}
                        {droppedRequests.map(
                            (request: Request, idx: number) => {
                                const age = Date.now() - request.dropTime
                                const progress = Math.min(age / 1500, 1) // 1.5-second fall animation
                                const topPosition = 45 + progress * 40 // Fall down from bucket level

                                return (
                                    <div
                                        key={idx}
                                        className="absolute w-4 h-4 bg-red-500 rounded-full transition-all duration-100 animate-bounce"
                                        style={{
                                            left: '50%',
                                            top: `${topPosition}%`,
                                            transform: 'translateX(-50%)',
                                            opacity: 1 - progress, // Fade out as it falls
                                        }}
                                    />
                                )
                            }
                        )}

                        {/* Server */}
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mb-2">
                                <Server size={32} />
                            </div>
                            <span className="text-md font-semibold">
                                {fillRate} req/s
                            </span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-4 right-4 bg-secondary bg-opacity-50 rounded-lg p-3 text-sm">
                        <div className="font-semibold mb-2 text-white">
                            Request Status:
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
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

                {/* Stats */}
                <div className="grid grid-cols-3 gap-x-4">
                    <Card className="bg-primary p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {stats.processedRequests}
                        </div>
                        <div className="text-sm ">Processed</div>
                    </Card>

                    <Card className="bg-primary p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {stats.droppedRequests}
                        </div>
                        <div className="text-sm ">Dropped</div>
                    </Card>

                    <Card className="bg-primary p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {stats.currentBucketSize}
                        </div>
                        <div className="text-sm">In Bucket</div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default LeakyBucketSimulator
