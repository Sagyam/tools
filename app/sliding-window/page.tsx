'use client'

import { Card } from '@/components/ui/card'
import { Pause, Play, RotateCcw, Send } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

interface Request {
    id: number
    timestamp: number
    status: 'served' | 'rejected'
    windowCount?: number
}

const SlidingWindowRateLimiter = () => {
    const [isRunning, setIsRunning] = useState<boolean>(false)
    const [currentTime, setCurrentTime] = useState<number>(0)
    const [requests, setRequests] = useState<Request[]>([])
    const [windowLimit, setWindowLimit] = useState<number>(5)
    const [windowDuration, setWindowDuration] = useState<number>(3000)
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

    const getRequestsInSlidingWindow = (time: number) => {
        const windowStart = time - windowDuration
        return requests.filter(
            (req) =>
                req.timestamp > windowStart &&
                req.timestamp <= time &&
                req.status === 'served'
        ).length
    }

    const handleSendRequest = () => {
        const requestTime = currentTime
        const requestsInWindow = getRequestsInSlidingWindow(requestTime)
        const shouldServe = requestsInWindow < windowLimit

        const newRequest = {
            id: requestIdRef.current++,
            timestamp: requestTime,
            status: shouldServe ? 'served' : 'rejected',
            windowCount: requestsInWindow, // Store count at the time of request
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
    const displayDuration = 6000 // Show 6 seconds
    const pixelsPerMs = 600 / displayDuration // 600 px width for time axis
    const timeOffset = Math.max(0, currentTime - displayDuration)

    // Filter visible requests
    const visibleRequests = requests.filter(
        (req) =>
            req.timestamp >= timeOffset && req.timestamp <= currentTime + 500
    )

    // Get requests currently in the sliding window
    const currentWindowRequests = requests.filter(
        (req) =>
            req.timestamp > currentTime - windowDuration &&
            req.timestamp <= currentTime &&
            req.status === 'served'
    )

    return (
        <div className="p-6 max-w-6xl mx-auto min-h-screen">
            <div className="bg-primary rounded-lg shadow-lg p-6">
                <h1 className="text-3xl font-bold text-center mb-2">
                    Sliding Window Rate Limiter
                </h1>
                <p className="text-secondary-foreground text-center mb-6">
                    Click "Send Request" to test the rate limiter. The sliding
                    window continuously moves with time, maintaining a rolling
                    count of recent requests.
                </p>

                {/* Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-accent p-4 rounded-lg">
                        <label className="block text-sm font-medium mb-2">
                            Window Limit (requests)
                        </label>
                        <input
                            type="number"
                            value={windowLimit}
                            onChange={(e) =>
                                setWindowLimit(
                                    Math.max(1, parseInt(e.target.value) || 1)
                                )
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                            min="1"
                            max="20"
                        />
                    </div>
                    <div className="bg-accent p-4 rounded-lg">
                        <label className="block text-sm font-medium mb-2">
                            Window Duration (ms)
                        </label>
                        <input
                            type="number"
                            value={windowDuration}
                            onChange={(e) =>
                                setWindowDuration(
                                    Math.max(
                                        1000,
                                        parseInt(e.target.value) || 2000
                                    )
                                )
                            }
                            className="w-full px-3 py-2 border rounded-lg"
                            min="1000"
                            max="10000"
                            step="500"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {servedCount}
                        </div>
                        <div className="text-sm text-green-800">Served</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {rejectedCount}
                        </div>
                        <div className="text-sm text-red-800">Rejected</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {getRequestsInSlidingWindow(currentTime)}
                        </div>
                        <div className="text-sm text-purple-800">
                            In Sliding Window
                        </div>
                    </div>
                </div>

                {/* Timeline Visualization */}
                <div className="bg-stone-200 border-2 border-stone-400 rounded-lg p-4">
                    <h3 className="text-lg text-gray-500 font-semibold mb-4">
                        Request Timeline
                    </h3>

                    <div
                        className="relative"
                        style={{ height: '300px', overflow: 'hidden' }}
                    >
                        {/* Background grid */}
                        <svg className="absolute inset-0 w-full h-full">
                            <defs>
                                <pattern
                                    id="timeGrid"
                                    width="60"
                                    height="20"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <path
                                        d="M 60 0 L 0 0 0 20"
                                        fill="none"
                                        stroke="#f3f4f6"
                                        strokeWidth="1"
                                    />
                                </pattern>
                            </defs>
                            <rect
                                width="100%"
                                height="100%"
                                fill="url(#timeGrid)"
                            />

                            {/* Current time indicator */}
                            <line
                                x1={(currentTime - timeOffset) * pixelsPerMs}
                                y1="0"
                                x2={(currentTime - timeOffset) * pixelsPerMs}
                                y2="300"
                                stroke="#8b5cf6"
                                strokeWidth="3"
                            />

                            {/* Sliding window range */}
                            <rect
                                x={Math.max(
                                    0,
                                    (currentTime -
                                        windowDuration -
                                        timeOffset) *
                                        pixelsPerMs
                                )}
                                y="0"
                                width={windowDuration * pixelsPerMs}
                                height="300"
                                fill="rgba(139, 92, 246, 0.15)"
                                stroke="rgba(139, 92, 246, 0.4)"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                            />

                            {/* Window start line */}
                            <line
                                x1={Math.max(
                                    0,
                                    (currentTime -
                                        windowDuration -
                                        timeOffset) *
                                        pixelsPerMs
                                )}
                                y1="0"
                                x2={Math.max(
                                    0,
                                    (currentTime -
                                        windowDuration -
                                        timeOffset) *
                                        pixelsPerMs
                                )}
                                y2="300"
                                stroke="#8b5cf6"
                                strokeWidth="2"
                                strokeDasharray="3,3"
                            />
                        </svg>

                        {/* Request blocks */}
                        {visibleRequests.map((request) => {
                            const x =
                                (request.timestamp - timeOffset) * pixelsPerMs
                            const y = 50 + (request.timestamp % 180) // Stagger vertically
                            const isServed = request.status === 'served'
                            const isInCurrentWindow =
                                request.timestamp >
                                    currentTime - windowDuration &&
                                request.timestamp <= currentTime

                            return (
                                <div
                                    key={request.id}
                                    className={`absolute w-8 h-8 rounded transition-all duration-300 ${
                                        isServed
                                            ? isInCurrentWindow
                                                ? 'bg-green-500 border-2 border-green-700 shadow-lg'
                                                : 'bg-green-300 border-2 border-green-500'
                                            : 'bg-red-500 border-2 border-red-700'
                                    }`}
                                    style={{
                                        left: `${x - 16}px`,
                                        top: `${Math.min(y, 250)}px`,
                                        transform: `scale(${isInCurrentWindow ? 1 : 0.7})`,
                                        opacity: isInCurrentWindow ? 1 : 0.5,
                                        zIndex: isInCurrentWindow ? 10 : 5,
                                    }}
                                    title={`${isServed ? 'Served' : 'Rejected'} at ${request.timestamp}ms${isInCurrentWindow ? ' (In Window)' : ''}`}
                                >
                                    {/* Highlight requests in the current window */}
                                    {isInCurrentWindow && isServed && (
                                        <div className="absolute -inset-1 bg-purple-400 rounded opacity-30 animate-pulse"></div>
                                    )}
                                </div>
                            )
                        })}

                        {/* Window edge labels */}
                        <div className="absolute top-2 left-0 right-0">
                            <div
                                className="absolute text-xs font-medium text-purple-600 bg-white px-2 py-1 rounded shadow-sm"
                                style={{
                                    left: `${Math.max(10, (currentTime - windowDuration - timeOffset) * pixelsPerMs)}px`,
                                    transform: 'translateX(-50%)',
                                }}
                            >
                                Window Start
                            </div>
                            <div
                                className="absolute text-xs font-medium text-purple-600 bg-white px-2 py-1 rounded shadow-sm"
                                style={{
                                    left: `${(currentTime - timeOffset) * pixelsPerMs}px`,
                                    transform: 'translateX(-50%)',
                                }}
                            >
                                Now
                            </div>
                        </div>

                        {/* Time labels */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center">
                            {Array.from({ length: 7 }, (_, i) => {
                                const time =
                                    timeOffset + (i * displayDuration) / 6
                                return (
                                    <div
                                        key={i}
                                        className="absolute text-md font-medium text-gray-500"
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
                    <div className="flex justify-center gap-6 mt-4 text-sm">
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
                                Sliding Window
                            </span>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-4 justify-center my-6">
                    <button
                        onClick={handleToggleTimer}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        {isRunning ? <Pause size={20} /> : <Play size={20} />}
                        {isRunning ? 'Pause' : 'Start'} Timer
                    </button>

                    <button
                        onClick={handleSendRequest}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        <Send size={20} />
                        Send Request
                    </button>

                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    >
                        <RotateCcw size={20} />
                        Reset
                    </button>
                </div>

                {/* Current Status */}
                <Card className="mt-6 p-4 bg-cyan-50 border border-cyan-200">
                    <div className="text-sm text-cyan-600 space-y-1">
                        <div>
                            <strong>Current Time:</strong>{' '}
                            {(currentTime / 1000).toFixed(1)}s
                        </div>
                        <div>
                            <strong>Window Range:</strong>{' '}
                            {(
                                Math.max(0, currentTime - windowDuration) / 1000
                            ).toFixed(1)}
                            s - {(currentTime / 1000).toFixed(1)}s
                        </div>
                        <div>
                            <strong>Window Duration:</strong>{' '}
                            {(windowDuration / 1000).toFixed(1)}s
                        </div>
                        <div>
                            <strong>Requests in Sliding Window:</strong>{' '}
                            {getRequestsInSlidingWindow(currentTime)} /{' '}
                            {windowLimit}
                        </div>
                        {currentWindowRequests.length > 0 && (
                            <div className="mt-2 transition-all duration-300">
                                <strong>Active Window Requests:</strong>
                                <div className="text-xl text-green-600 font-bold mt-1">
                                    {currentWindowRequests
                                        .map(
                                            (req) =>
                                                `${(req.timestamp / 1000).toFixed(1)}s`
                                        )
                                        .join(', ')}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Algorithm Explanation */}
                <Card className="mt-6 p-4 bg-blue-50 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">
                        How Sliding Window Works:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            • The window continuously slides with the current
                            time
                        </li>
                        <li>
                            • Only requests within the last{' '}
                            {windowDuration / 1000}s are counted
                        </li>
                        <li>
                            • As time progresses, old requests automatically
                            "fall out" of the window
                        </li>
                        <li>
                            • This provides more accurate rate limiting compared
                            to fixed windows
                        </li>
                        <li>
                            • No sudden resets - the rate limit is enforced
                            smoothly over time
                        </li>
                    </ul>
                </Card>
            </div>
        </div>
    )
}

export default SlidingWindowRateLimiter
