'use client'

import { Pause, Play, RotateCcw, Settings } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'

// Simple hash functions for Count-Min Sketch
const hashFunctions = [
    (item, width) => {
        let hash = 0
        for (let i = 0; i < item.length; i++) {
            hash = ((hash << 5) - hash + item.charCodeAt(i)) & 0xffffffff
        }
        return Math.abs(hash) % width
    },
    (item, width) => {
        let hash = 5381
        for (let i = 0; i < item.length; i++) {
            hash = ((hash << 5) + hash + item.charCodeAt(i)) & 0xffffffff
        }
        return Math.abs(hash) % width
    },
    (item, width) => {
        let hash = 0
        for (let i = 0; i < item.length; i++) {
            hash = hash * 31 + item.charCodeAt(i)
        }
        return Math.abs(hash) % width
    },
    (item, width) => {
        let hash = 2166136261
        for (let i = 0; i < item.length; i++) {
            hash ^= item.charCodeAt(i)
            hash *= 16777619
        }
        return Math.abs(hash) % width
    },
]

class CountMinSketch {
    constructor(width = 20, depth = 4) {
        this.width = width
        this.depth = depth
        this.table = Array(depth)
            .fill()
            .map(() => Array(width).fill(0))
        this.hashFunctions = hashFunctions.slice(0, depth)
    }

    add(item) {
        const positions = []
        for (let i = 0; i < this.depth; i++) {
            const pos = this.hashFunctions[i](item, this.width)
            this.table[i][pos]++
            positions.push({ row: i, col: pos })
        }
        return positions
    }

    query(item) {
        let minCount = Infinity
        for (let i = 0; i < this.depth; i++) {
            const pos = this.hashFunctions[i](item, this.width)
            minCount = Math.min(minCount, this.table[i][pos])
        }
        return minCount
    }

    reset() {
        this.table = Array(this.depth)
            .fill()
            .map(() => Array(this.width).fill(0))
    }
}

const CountMinSketchDemo = () => {
    const [cms, setCms] = useState(new CountMinSketch(20, 4))
    const [exactCounts, setExactCounts] = useState({})
    const [isPlaying, setIsPlaying] = useState(false)
    const [dataStream, setDataStream] = useState([])
    const [currentItem, setCurrentItem] = useState('')
    const [highlightedCells, setHighlightedCells] = useState([])
    const [speed, setSpeed] = useState(500)
    const [showSettings, setShowSettings] = useState(false)

    // Available fruits for random selection
    const availableFruits = [
        'apple',
        'banana',
        'cherry',
        'date',
        'elderberry',
        'fig',
        'grape',
        'kiwi',
        'lemon',
        'mango',
        'orange',
        'papaya',
        'quince',
        'raspberry',
        'strawberry',
    ]
    const [processedCount, setProcessedCount] = useState(0)
    const [maxItems] = useState(1000) // Process up to 1000 items

    const processNextItem = useCallback(() => {
        if (processedCount >= maxItems) {
            setIsPlaying(false)
            return
        }

        // Randomly select a fruit with weighted probability to create interesting patterns
        const weights = [
            0.2, 0.15, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04, 0.04, 0.04, 0.03,
            0.03, 0.02, 0.02, 0.02,
        ]
        let random = Math.random()
        let item = availableFruits[0]

        for (let i = 0; i < availableFruits.length; i++) {
            random -= weights[i]
            if (random <= 0) {
                item = availableFruits[i]
                break
            }
        }

        setCurrentItem(item)

        // Add to data stream for visualization
        setDataStream((prev) => [...prev.slice(-10), { item, id: Date.now() }])

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
    }, [processedCount, maxItems, cms])

    useEffect(() => {
        if (!isPlaying) return

        const timer = setTimeout(processNextItem, speed)
        return () => clearTimeout(timer)
    }, [isPlaying, processNextItem, speed])

    const reset = () => {
        setCms(new CountMinSketch(20, 4))
        setExactCounts({})
        setDataStream([])
        setCurrentItem('')
        setProcessedCount(0)
        setIsPlaying(false)
        setHighlightedCells([])
    }

    const togglePlay = () => {
        setIsPlaying(!isPlaying)
    }

    const uniqueItems = [...new Set(Object.keys(exactCounts))]

    return (
        <div className="min-h-screen bg-gradient-to-br bg-primary p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">
                    Count-Min Sketch Demo
                </h1>
                <p className="text-white mb-6">
                    Watch how the Count-Min Sketch probabilistic data structure
                    estimates frequencies compared to exact counting
                </p>

                {/* Controls */}
                <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
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
                            </button>

                            <button
                                onClick={reset}
                                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                            >
                                <RotateCcw size={18} />
                                <span>Reset</span>
                            </button>

                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                            >
                                <Settings size={18} />
                                <span>Settings</span>
                            </button>
                        </div>

                        <div className="text-sm text-gray-600">
                            Progress: {processedCount}/{maxItems}
                        </div>
                    </div>

                    {showSettings && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Speed: {speed}ms
                                    </label>
                                    <input
                                        type="range"
                                        min="50"
                                        max="1000"
                                        step="50"
                                        value={speed}
                                        onChange={(e) =>
                                            setSpeed(Number(e.target.value))
                                        }
                                        className="w-full"
                                    />
                                </div>
                                <div className="text-sm text-gray-600">
                                    <p className="font-medium mb-1">
                                        Random Selection:
                                    </p>
                                    <p>
                                        Fruits are selected with weighted
                                        probabilities to create realistic
                                        distribution patterns and demonstrate
                                        hash collisions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Data Stream Visualization */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl text-black font-semibold mb-4">
                        Data Stream (Random Selection)
                    </h2>
                    <div className="flex items-center space-x-2 overflow-hidden">
                        <span className="text-sm text-black whitespace-nowrap">
                            Stream:
                        </span>
                        <div className="flex space-x-2">
                            {dataStream.map((data, idx) => (
                                <div
                                    key={data.id}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                                        idx === dataStream.length - 1
                                            ? 'bg-blue-500 text-white scale-110'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}
                                    style={{
                                        opacity: Math.max(
                                            0.3,
                                            (idx + 1) / dataStream.length
                                        ),
                                    }}
                                >
                                    {data.item}
                                </div>
                            ))}
                        </div>
                        {currentItem && (
                            <div className="ml-4 text-lg font-bold text-blue-600">
                                Current: {currentItem}
                            </div>
                        )}
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                        <p>
                            Items are randomly selected with weighted
                            probabilities. Common items like 'apple' appear more
                            frequently, while rare items like 'quince' appear
                            less often.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Count-Min Sketch Table */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-black">
                            Count-Min Sketch Table
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border border-gray-300 p-2 bg-gray-50 text-sm">
                                            Row
                                        </th>
                                        {Array.from(
                                            { length: cms.width },
                                            (_, i) => (
                                                <th
                                                    key={i}
                                                    className="border border-gray-300 p-1 bg-gray-50 text-xs w-8"
                                                >
                                                    {i}
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {cms.table.map((row, rowIdx) => (
                                        <tr key={rowIdx}>
                                            <td className="border border-gray-300 p-2 bg-gray-50 text-sm font-medium">
                                                {rowIdx}
                                            </td>
                                            {row.map((cell, colIdx) => {
                                                const isHighlighted =
                                                    highlightedCells.some(
                                                        (h) =>
                                                            h.row === rowIdx &&
                                                            h.col === colIdx
                                                    )
                                                return (
                                                    <td
                                                        key={colIdx}
                                                        className={`border border-gray-300 p-1 text-center text-xs transition-colors duration-200 ${
                                                            isHighlighted
                                                                ? 'bg-yellow-300 animate-pulse'
                                                                : cell > 0
                                                                  ? 'bg-blue-100'
                                                                  : 'bg-white'
                                                        }`}
                                                    >
                                                        {cell}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Yellow cells show where the current item is being
                            incremented
                        </p>
                    </div>

                    {/* Frequency Comparison */}
                    <div className="bg-white rounded-lg shadow-lg p-6 overflow-y-auto max-h-[500px]">
                        <h2 className="text-xl font-semibold mb-4 text-black">
                            Frequency Comparison
                        </h2>
                        <div className="space-y-3">
                            {uniqueItems.map((item) => {
                                const exactCount = exactCounts[item]
                                const cmsCount = cms.query(item)
                                const error = cmsCount - exactCount

                                return (
                                    <div
                                        key={item}
                                        className="border border-gray-200 rounded-lg p-3"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-gray-800">
                                                {item}
                                            </span>
                                            <div className="flex space-x-4 text-sm">
                                                <span className="text-green-600">
                                                    Exact: {exactCount}
                                                </span>
                                                <span className="text-blue-600">
                                                    CMS: {cmsCount}
                                                </span>
                                                <span
                                                    className={`${error > 0 ? 'text-red-600' : 'text-gray-500'}`}
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

                        {uniqueItems.length === 0 && (
                            <p className="text-gray-500 text-center py-8">
                                No data processed yet. Click Play to start!
                            </p>
                        )}
                    </div>
                </div>

                {/* Information Panel */}
                <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                    <h2 className="text-xl font-semibold mb-4">
                        How Count-Min Sketch Works
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h3 className="font-semibold mb-2">Algorithm</h3>
                            <ul className="space-y-1">
                                <li>
                                    • Uses multiple hash functions (rows in
                                    table)
                                </li>
                                <li>
                                    • Each item hashes to one position per row
                                </li>
                                <li>
                                    • Increments all corresponding positions
                                </li>
                                <li>
                                    • Query returns minimum of all positions
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Properties</h3>
                            <ul className="space-y-1">
                                <li>
                                    • Space-efficient probabilistic structure
                                </li>
                                <li>• Never underestimates frequency</li>
                                <li>
                                    • May overestimate due to hash collisions
                                </li>
                                <li>• Error decreases with table width</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CountMinSketchDemo
