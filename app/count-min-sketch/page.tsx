'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Pause, Play, RotateCcw } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type Item = string

interface HighlightedCell {
    row: number
    col: number
}

interface DataStreamItem {
    item: Item
    id: number
}

interface ExactCounts {
    [key: string]: number
}

// Simple hash functions for Count-Min Sketch
const hashFunctions = [
    (item: Item, width: number): number => {
        let hash = 0
        for (let i = 0; i < item.length; i++) {
            hash = ((hash << 5) - hash + item.charCodeAt(i)) & 0xffffffff
        }
        return Math.abs(hash) % width
    },
    (item: Item, width: number): number => {
        let hash = 5381
        for (let i = 0; i < item.length; i++) {
            hash = ((hash << 5) + hash + item.charCodeAt(i)) & 0xffffffff
        }
        return Math.abs(hash) % width
    },
    (item: Item, width: number): number => {
        let hash = 0
        for (let i = 0; i < item.length; i++) {
            hash = hash * 31 + item.charCodeAt(i)
        }
        return Math.abs(hash) % width
    },
    (item: Item, width: number): number => {
        let hash = 2166136261
        for (let i = 0; i < item.length; i++) {
            hash ^= item.charCodeAt(i)
            hash *= 16777619
        }
        return Math.abs(hash) % width
    },
]

class CountMinSketch {
    width: number
    depth: number
    table: number[][]
    hashFunctions: ((item: Item, width: number) => number)[]

    constructor(width: number = 20, depth: number = 4) {
        this.width = width
        this.depth = depth
        this.table = Array(depth)
            .fill(null)
            .map(() => Array(width).fill(0))
        this.hashFunctions = hashFunctions.slice(0, depth)
    }

    add(item: Item): HighlightedCell[] {
        const positions: HighlightedCell[] = []
        for (let i = 0; i < this.depth; i++) {
            const pos = this.hashFunctions[i](item, this.width)
            this.table[i][pos]++
            positions.push({ row: i, col: pos })
        }
        return positions
    }

    query(item: Item): number {
        let minCount = Infinity
        for (let i = 0; i < this.depth; i++) {
            const pos = this.hashFunctions[i](item, this.width)
            minCount = Math.min(minCount, this.table[i][pos])
        }
        return minCount
    }

    reset(): void {
        this.table = Array(this.depth)
            .fill(null)
            .map(() => Array(this.width).fill(0))
    }
}

const CountMinSketchDemo: React.FC = () => {
    const [cms, setCms] = useState<CountMinSketch>(new CountMinSketch(20, 4))
    const [exactCounts, setExactCounts] = useState<ExactCounts>({})
    const [isPlaying, setIsPlaying] = useState<boolean>(false)
    const [dataStream, setDataStream] = useState<DataStreamItem[]>([])
    const [currentItem, setCurrentItem] = useState<string>('')
    const [highlightedCells, setHighlightedCells] = useState<HighlightedCell[]>(
        []
    )
    const [speed, setSpeed] = useState<number>(150)
    const [recentItems, setRecentItems] = useState<
        Array<{ item: string; id: number; timestamp: number }>
    >([])
    const streamContainerRef = useRef<HTMLDivElement>(null)

    // Available fruits for random selection with emojis
    const availableFruits: Array<{ name: string; emoji: string }> = [
        { name: 'apple', emoji: '🍎' },
        { name: 'banana', emoji: '🍌' },
        { name: 'cherry', emoji: '🍒' },
        { name: 'coconut', emoji: '🥥' },
        { name: 'date', emoji: '🌴' },
        { name: 'elderberry', emoji: '🫐' },
        { name: 'fig', emoji: '🌰' },
        { name: 'grape', emoji: '🍇' },
        { name: 'kiwi', emoji: '🥝' },
        { name: 'lemon', emoji: '🍋' },
        { name: 'mango', emoji: '🥭' },
        { name: 'melon', emoji: '🍈' },
        { name: 'orange', emoji: '🍊' },
        { name: 'peach', emoji: '🍑' },
        { name: 'pineapple', emoji: '🍍' },
        { name: 'tangerine', emoji: '🍊' },
        { name: 'quince', emoji: '🍐' },
        { name: 'strawberry', emoji: '🍓' },
        { name: 'watermelon', emoji: '🍉' },
    ]
    const [processedCount, setProcessedCount] = useState<number>(0)
    const maxItems: number = 5000

    // Function to get speed label based on value
    const getSpeedLabel = (value: number): string => {
        if (value <= 50) return 'Very Fast'
        if (value <= 100) return 'Fast'
        if (value <= 150) return 'Normal'
        if (value <= 200) return 'Slow'
        return 'Very Slow'
    }

    // Scroll current item into view when new items are added
    useEffect(() => {
        if (streamContainerRef.current && recentItems.length > 0) {
            const container = streamContainerRef.current
            const containerHeight = container.clientHeight
            const scrollTop = container.scrollTop
            const scrollHeight = container.scrollHeight

            // If we're not near the bottom, scroll to show the latest item
            if (scrollHeight - scrollTop - containerHeight > 50) {
                container.scrollTo({
                    top: scrollHeight - containerHeight,
                    behavior: 'smooth',
                })
            }
        }
    }, [recentItems])

    const processNextItem = useCallback(() => {
        if (processedCount >= maxItems) {
            setIsPlaying(false)
            return
        }

        // pick a random fruit form exponential distribution
        const randomIndex = Math.floor(Math.random() * availableFruits.length)
        const item = availableFruits[randomIndex].name

        setCurrentItem(item)

        // Add to recent items for animation
        const timestamp = Date.now()
        setRecentItems((prev) =>
            [...prev, { item, id: timestamp, timestamp }].slice(-8)
        )

        // Add to data stream for visualization
        setDataStream((prev) => [...prev.slice(-10), { item, id: timestamp }])

        // Update exact counts
        setExactCounts((prev) => ({
            ...prev,
            [item]: (prev[item] || 0) + 1,
        }))

        // Update Count-Min Sketch
        const newCms = new CountMinSketch(cms.width, cms.depth)
        newCms.table = cms.table.map((row) => [...row])
        const positions = newCms.add(item)

        setHighlightedCells(positions)
        setCms(newCms)
        setProcessedCount((prev) => prev + 1)

        // Clear highlights after a delay
        setTimeout(() => setHighlightedCells([]), 200)
    }, [processedCount, maxItems, cms, availableFruits])

    // Clean up old items periodically
    useEffect(() => {
        const cleanup = setInterval(() => {
            const now = Date.now()
            setRecentItems((prev) =>
                prev.filter((item) => now - item.timestamp < 4000)
            )
        }, 1000)
        return () => clearInterval(cleanup)
    }, [])

    useEffect(() => {
        if (!isPlaying) return

        const timer = setTimeout(processNextItem, speed)
        return () => clearTimeout(timer)
    }, [isPlaying, processNextItem, speed])

    const reset = (): void => {
        setCms(new CountMinSketch(20, 4))
        setExactCounts({})
        setDataStream([])
        setCurrentItem('')
        setProcessedCount(0)
        setIsPlaying(false)
        setHighlightedCells([])
        setRecentItems([])
    }

    const togglePlay = (): void => {
        setIsPlaying(!isPlaying)
    }

    const uniqueItems: string[] = [...new Set(Object.keys(exactCounts))]

    // Sort items by error (descending) for frequency comparison
    const sortedItems = uniqueItems.sort((a, b) => {
        const errorA = cms.query(a) - exactCounts[a]
        const errorB = cms.query(b) - exactCounts[b]
        return errorB - errorA
    })

    return (
        <div className="container mx-auto p-4 space-y-4">
            <div className="max-w-6xl mx-auto transform duration-500">
                <h1 className="text-4xl font-bold mb-2">
                    Count-Min Sketch Demo
                </h1>
                <p className="mb-6">
                    Watch how the Count-Min Sketch probabilistic data structure
                    estimates frequencies compared to exact counting
                </p>

                {/* Controls */}
                <Card className="bg-primary rounded-lg shadow-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={togglePlay}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isPlaying
                                        ? 'bg-red-500 hover:bg-red-600 text-white'
                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                            >
                                {isPlaying ? (
                                    <Pause size={18} />
                                ) : (
                                    <Play size={18} />
                                )}
                                <span>{isPlaying ? 'Pause' : 'Play'}</span>
                            </Button>

                            <Button
                                onClick={reset}
                                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                            >
                                <RotateCcw size={18} />
                                <span>Reset</span>
                            </Button>
                        </div>

                        <div className="text-sm">
                            Progress: {processedCount}/{maxItems}
                        </div>
                    </div>

                    {/* Speed Control with Slider */}
                    <div className="p-4 rounded-lg">
                        <div className="flex items-center space-x-6">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-2">
                                    Speed: {getSpeedLabel(speed)}
                                </label>
                                <div className="flex items-center space-x-4">
                                    <span className="text-xs">Fast</span>
                                    <input
                                        type="range"
                                        min="25"
                                        max="250"
                                        step="25"
                                        value={speed}
                                        onChange={(e) =>
                                            setSpeed(parseInt(e.target.value))
                                        }
                                        className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                                    />
                                    <span className="text-xs">Slow</span>
                                </div>
                            </div>
                            <div className="text-sm max-w-xs">
                                <p className="font-medium mb-1">
                                    Random Selection:
                                </p>
                                <p className="text-xs">
                                    Fruits are selected with weighted
                                    probabilities to create realistic patterns.
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 gap-6">
                    {/* Current Items Display */}
                    <Card className="bg-primary rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            Stream of Recent Items
                        </h2>
                        <div
                            ref={streamContainerRef}
                            className="relative h-64 overflow-auto"
                        >
                            <div className="min-h-full flex flex-col justify-center items-center space-y-2 py-4">
                                {recentItems.map((itemData, index) => {
                                    const age = Date.now() - itemData.timestamp
                                    const opacity = Math.max(0, 1 - age / 4000)
                                    const scale = Math.max(0.5, 1 - age / 8000)
                                    const isNewest =
                                        index === recentItems.length - 1

                                    return (
                                        <div
                                            key={itemData.id}
                                            className={`transition-all duration-500 ease-out ${isNewest ? 'text-2xl font-bold text-blue-400' : 'text-lg'}`}
                                            style={{
                                                opacity,
                                                transform: `scale(${scale})`,
                                            }}
                                        >
                                            {
                                                availableFruits.find(
                                                    (f) =>
                                                        f.name === itemData.item
                                                )?.emoji
                                            }{' '}
                                            {itemData.item}
                                        </div>
                                    )
                                })}
                                {recentItems.length === 0 && (
                                    <div className="text-gray-400 text-center">
                                        <p className="text-xl mb-2">🍎</p>
                                        <p>Waiting for items...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Count-Min Sketch Table - Flipped */}
                    <Card className="bg-primary rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            Count-Min Sketch Table
                        </h2>
                        <div className="overflow-auto max-h-80">
                            <table className="w-full border-collapse bg-primary">
                                <thead>
                                    <tr>
                                        <th className="border  p-2 text-sm">
                                            Col
                                        </th>
                                        {Array.from(
                                            { length: cms.depth },
                                            (_, i) => (
                                                <th
                                                    key={i}
                                                    className="border  p-2 text-xs"
                                                >
                                                    Row {i}
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-primary">
                                    {Array.from(
                                        { length: cms.width },
                                        (_, colIdx) => (
                                            <tr key={colIdx}>
                                                <td className="bg-primary border p-2 text-sm font-medium">
                                                    {colIdx}
                                                </td>
                                                {Array.from(
                                                    { length: cms.depth },
                                                    (_, rowIdx) => {
                                                        const cell =
                                                            cms.table[rowIdx][
                                                                colIdx
                                                            ]
                                                        const isHighlighted =
                                                            highlightedCells.some(
                                                                (h) =>
                                                                    h.row ===
                                                                        rowIdx &&
                                                                    h.col ===
                                                                        colIdx
                                                            )
                                                        return (
                                                            <td
                                                                key={rowIdx}
                                                                className={`border p-2 text-center text-xs transition-colors duration-200 ${
                                                                    isHighlighted
                                                                        ? 'bg-yellow-300 animate-pulse'
                                                                        : cell >
                                                                            0
                                                                          ? 'bg-blue-500'
                                                                          : 'bg-primary'
                                                                }`}
                                                            >
                                                                {cell}
                                                            </td>
                                                        )
                                                    }
                                                )}
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs font-bold text-gray-500 mt-2">
                            Yellow cells show where the current item is being
                            incremented
                        </p>
                    </Card>

                    {/* Frequency Comparison */}
                    <Card className="bg-primary rounded-lg shadow-lg p-6 h-96">
                        <h2 className="text-xl font-semibold mb-4">
                            Frequency Comparison
                            <span className="text-md ml-2">
                                (Sorted by Error)
                            </span>
                        </h2>
                        <div className="overflow-y-auto h-80 space-y-3 pr-2">
                            {sortedItems.map((item: string, index: number) => {
                                const exactCount = exactCounts[item]
                                const cmsCount = cms.query(item)
                                const error = cmsCount - exactCount

                                return (
                                    <div
                                        key={item}
                                        className="border border-gray-400 shadow-lg rounded-lg p-3 transform transition-all duration-500 ease-in-out"
                                        style={{
                                            transitionDelay: `${index * 50}ms`,
                                        }}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-white">
                                                {item}
                                            </span>
                                            <div className="flex space-x-4 text-sm">
                                                <span className="font-semibold text-green-600">
                                                    Exact: {exactCount}
                                                </span>
                                                <span className="font-semibold text-blue-600">
                                                    CMS: {cmsCount}
                                                </span>
                                                <span
                                                    className={`font-semibold ${error < 0 ? 'text-red-600' : 'text-yellow-600'}`}
                                                >
                                                    Error: +{error}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-green-600 w-12">
                                                    Exact
                                                </span>
                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${Math.min(100, (exactCount / Math.max(1, Math.max(...Object.values(exactCounts)))) * 100)}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs w-8">
                                                    {exactCount}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-blue-600 w-12">
                                                    CMS
                                                </span>
                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${Math.min(100, (cmsCount / Math.max(1, Math.max(...Object.values(exactCounts)))) * 100)}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs w-8">
                                                    {cmsCount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {sortedItems.length === 0 && (
                            <div className="flex items-center justify-center h-80">
                                <p className="text-center">
                                    No data processed yet. Click Play to start!
                                </p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: 2px solid #1e40af;
                }

                .slider::-moz-range-thumb {
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: 2px solid #1e40af;
                }
            `}</style>
        </div>
    )
}

export default CountMinSketchDemo
