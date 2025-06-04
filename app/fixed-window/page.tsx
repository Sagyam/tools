'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pause, Play, RotateCcw, Send } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

interface Request {
    id: number
    timestamp: number
    status: 'served' | 'rejected'
    windowCount?: number
}

const FixedWindowRateLimiter = () => {
    const [isRunning, setIsRunning] = useState<boolean>(false)
    const [currentTime, setCurrentTime] = useState<number>(0)
    const [requests, setRequests] = useState<Request[]>([])
    const [windowLimit, setWindowLimit] = useState<number>(5)
    const [windowDuration, setWindowDuration] = useState<number>(3000) // Default to 1 second
    const [servedCount, setServedCount] = useState<number>(0)
    const [rejectedCount, setRejectedCount] = useState<number>(0)

    const intervalRef = useRef<NodeJS.Timeout>(
        null as unknown as NodeJS.Timeout
    )
    const requestIdRef = useRef(0)
    const startTimeRef = useRef<number>(Date.now())

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setCurrentTime(Date.now() - startTimeRef.current)
            }, 50)
        } else {
            clearInterval(intervalRef.current)
        }

        return () => clearInterval(intervalRef.current)
    }, [isRunning])

    const getCurrentWindow = (time: number) => {
        return Math.floor(time / windowDuration)
    }

    const getRequestsInCurrentWindow = (time: number) => {
        const currentWindow = getCurrentWindow(time)
        const windowStart = currentWindow * windowDuration
        const windowEnd = windowStart + windowDuration

        return requests.filter(
            (req) =>
                req.timestamp >= windowStart &&
                req.timestamp < windowEnd &&
                req.status === 'served'
        ).length
    }

    const handleSendRequest = () => {
        const requestTime = currentTime
        const requestsInWindow = getRequestsInCurrentWindow(requestTime)
        const shouldServe = requestsInWindow < windowLimit

        const newRequest = {
            id: requestIdRef.current++,
            timestamp: requestTime,
            status: shouldServe ? 'served' : 'rejected',
            window: getCurrentWindow(requestTime),
        } as Request

        setRequests((prev) => [...prev, newRequest])

        if (shouldServe) {
            setServedCount((prev) => prev + 1)
        } else {
            setRejectedCount((prev) => prev + 1)
        }
    }

    const handleReset = () => {
        setIsRunning(false)
        setCurrentTime(0)
        setRequests([])
        setServedCount(0)
        setRejectedCount(0)
        startTimeRef.current = Date.now()
    }

    const handleToggleTimer = () => {
        if (!isRunning) {
            startTimeRef.current = Date.now() - currentTime
        }
        setIsRunning(!isRunning)
    }

    // Calculate display parameters
    const displayDuration = 5000 // Show 5 seconds
    const pixelsPerMs = 600 / displayDuration // 600px width for time axis
    const currentWindowStart = getCurrentWindow(currentTime) * windowDuration
    const timeOffset = Math.max(0, currentTime - displayDuration)

    // Filter visible requests
    const visibleRequests = requests.filter(
        (req) =>
            req.timestamp >= timeOffset && req.timestamp <= currentTime + 500
    )

    return (
        <div className="min-h-screen bg-background flex items-start justify-center">
            <div className="max-w-6xl">
                <h1 className="text-3xl font-bold text-center my-2 p-8">
                    Fixed Window Counter Rate Limiter
                </h1>
                <p className="text-secondary-foreground text-center mb-6">
                    Click "Send Request" to test the rate limiter. Watch how
                    requests are served or rejected based on the window limit.
                </p>

                {/* Configuration */}
                <Card className="bg-primary my-4 p-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <Label className="block text-sm font-medium mb-2">
                                Window Limit (requests)
                            </Label>
                            <Input
                                type="number"
                                value={windowLimit}
                                onChange={(e) =>
                                    setWindowLimit(
                                        Math.max(
                                            1,
                                            parseInt(e.target.value) || 1
                                        )
                                    )
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                                min="1"
                                max="20"
                            />
                            <span className="text-sm text-gray-400">
                                {windowLimit} requests per window
                            </span>
                        </div>
                        <div>
                            <Label className="block text-sm font-medium mb-2">
                                Window Duration (ms)
                            </Label>
                            <Input
                                type="number"
                                value={windowDuration}
                                onChange={(e) =>
                                    setWindowDuration(
                                        Math.max(
                                            500,
                                            parseInt(e.target.value) || 1000
                                        )
                                    )
                                }
                                className="w-full px-3 py-2 border rounded-lg"
                                min="500"
                                max="5000"
                                step="100"
                            />
                            <span className="text-sm text-gray-400">
                                {windowDuration} ms per window
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-start my-4 gap-x-4">
                        <Button
                            onClick={handleToggleTimer}
                            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors
                                 ${
                                     isRunning
                                         ? 'bg-yellow-600 hover:bg-yellow-700'
                                         : 'bg-green-600 hover:bg-green-700'
                                 }`}
                        >
                            {isRunning ? (
                                <Pause size={20} />
                            ) : (
                                <Play size={20} />
                            )}
                            {isRunning ? 'Pause' : 'Start'} Timer
                        </Button>

                        <Button
                            onClick={handleSendRequest}
                            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium"
                        >
                            <Send size={20} />
                            Send Request
                        </Button>

                        <Button
                            onClick={handleReset}
                            className="w-full items-center gap-2 px-4 py-2 bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors"
                        >
                            <RotateCcw size={20} />
                            Reset
                        </Button>
                    </div>
                </Card>

                {/* Timeline Visualization */}
                <Card className="bg-primary p-4">
                    <h3 className="text-lg font-semibold mb-4">
                        Request Timeline
                    </h3>

                    <div
                        className="relative"
                        style={{ height: '300px', overflow: 'hidden' }}
                    >
                        {/* Grid lines for time windows */}
                        <svg className="absolute inset-0 w-full h-full">
                            <defs>
                                <pattern
                                    id="grid"
                                    width={windowDuration * pixelsPerMs}
                                    height="20"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <path
                                        d={`M ${windowDuration * pixelsPerMs} 0 L 0 0 0 20`}
                                        fill="none"
                                        stroke="#e5e7eb"
                                        strokeWidth="1"
                                        strokeDasharray="2,2"
                                    />
                                </pattern>
                            </defs>
                            <rect
                                width="100%"
                                height="100%"
                                fill="url(#grid)"
                            />

                            {/* Current time indicator */}
                            <line
                                x1={(currentTime - timeOffset) * pixelsPerMs}
                                y1="0"
                                x2={(currentTime - timeOffset) * pixelsPerMs}
                                y2="300"
                                stroke="#3b82f6"
                                strokeWidth="2"
                            />

                            {/* Current window highlight */}
                            <rect
                                x={
                                    (currentWindowStart - timeOffset) *
                                    pixelsPerMs
                                }
                                y="0"
                                width={windowDuration * pixelsPerMs}
                                height="300"
                                fill="rgba(59, 130, 246, 0.1)"
                                stroke="rgba(59, 130, 246, 0.3)"
                                strokeWidth="2"
                            />
                        </svg>

                        {/* Request blocks */}
                        {visibleRequests.map((request) => {
                            const x =
                                (request.timestamp - timeOffset) * pixelsPerMs
                            const y = 50 + (request.timestamp % 200) // Stagger vertically
                            const isServed = request.status === 'served'

                            return (
                                <div
                                    key={request.id}
                                    className={`absolute w-8 h-8 rounded transition-all duration-300 ${
                                        isServed
                                            ? 'bg-green-500 border-2 border-green-700'
                                            : 'bg-red-500 border-2 border-red-700'
                                    }`}
                                    style={{
                                        left: `${x - 16}px`,
                                        top: `${Math.min(y, 250)}px`,
                                        transform: `scale(${Math.max(0.5, 1 - (currentTime - request.timestamp) / 2000)})`,
                                        opacity: Math.max(
                                            0.3,
                                            1 -
                                                (currentTime -
                                                    request.timestamp) /
                                                    3000
                                        ),
                                    }}
                                    title={`${isServed ? 'Served' : 'Rejected'} at ${request.timestamp}ms`}
                                />
                            )
                        })}

                        {/* Time labels */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center">
                            {Array.from({ length: 6 }, (_, i) => {
                                const time =
                                    timeOffset + (i * displayDuration) / 5
                                return (
                                    <div
                                        key={i}
                                        className="absolute text-md font-semibold"
                                        style={{
                                            left: `${(time - timeOffset) * pixelsPerMs}px`,
                                        }}
                                    >
                                        {(time / 1000).toFixed(1)}s
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 border-2 border-green-700 rounded shadow-lg"></div>
                            <span className="text-green-500">Served</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 border-2 border-red-700 rounded"></div>
                            <span className="text-red-500">Rejected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-purple-200 border border-purple-400 rounded"></div>
                            <span className="text-purple-500">
                                Current Window
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 my-4">
                    <Card className="bg-primary p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {servedCount}
                        </div>
                        <div className="text-md font-semibold text-green-800">
                            Served
                        </div>
                    </Card>
                    <Card className="bg-primary p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {rejectedCount}
                        </div>
                        <div className="text-md font-semibold text-red-800">
                            Rejected
                        </div>
                    </Card>
                    <Card className="bg-primary rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {getRequestsInCurrentWindow(currentTime)}
                        </div>
                        <div className="text-md font-semibold text-purple-800">
                            Current Window
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default FixedWindowRateLimiter
