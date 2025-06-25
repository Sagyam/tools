'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dice5Icon, Grid3X3Icon, HashIcon, Tally5Icon } from 'lucide-react'
import GearIcon from 'next/dist/client/components/react-dev-overlay/ui/icons/gear-icon'
import React, { useEffect, useState } from 'react'

interface UpdatedCell {
    row: number
    col: number
}

interface FrequencyData {
    [key: string]: number
}

const CountMinSketchWorking: React.FC = () => {
    const [rows, setRows] = useState<number>(4)
    const [cols, setCols] = useState<number>(8)
    const [sketch, setSketch] = useState<number[][]>([])
    const [recentNumbers, setRecentNumbers] = useState<number[]>([])
    const [lastUpdatedCells, setLastUpdatedCells] = useState<UpdatedCell[]>([])
    const [animatingCells, setAnimatingCells] = useState<UpdatedCell[]>([])
    const [actualFrequencies, setActualFrequencies] = useState<FrequencyData>(
        {}
    )
    const [lastAddedNumber, setLastAddedNumber] = useState<number | null>(null)
    const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
    const [highlightedCells, setHighlightedCells] = useState<UpdatedCell[]>([])

    // Generate hash functions dynamically based on number of rows
    const generateHashFunctions = (numRows: number) => {
        const primes = [
            7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67,
        ]
        const offsets = [
            3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59,
        ]

        return Array.from({ length: numRows }, (_, i) => {
            const prime = primes[i % primes.length]
            const offset = offsets[i % offsets.length]
            return (item: number, cols: number): number =>
                (item * prime + offset) % cols
        })
    }

    const [hashFunctions, setHashFunctions] = useState(
        generateHashFunctions(rows)
    )

    // Update hash functions when rows change
    useEffect(() => {
        setHashFunctions(generateHashFunctions(rows))
    }, [rows])

    // Initialize sketch
    useEffect(() => {
        const newSketch: number[][] = Array(rows)
            .fill(null)
            .map(() => Array(cols).fill(0))
        setSketch(newSketch)
        setRecentNumbers([])
        setLastUpdatedCells([])
        setActualFrequencies({})
        setLastAddedNumber(null)
        setSelectedNumber(null)
        setHighlightedCells([])
    }, [rows, cols])

    // Update highlighted cells when selected number changes
    useEffect(() => {
        if (selectedNumber !== null && sketch.length > 0) {
            const cells: UpdatedCell[] = []
            for (let i = 0; i < rows; i++) {
                const col = hashFunctions[i](selectedNumber, cols)
                cells.push({ row: i, col })
            }
            setHighlightedCells(cells)
        } else {
            setHighlightedCells([])
        }
    }, [selectedNumber, rows, cols, hashFunctions, sketch])

    const generateRandomNumber = (): void => {
        const randomNum = Math.floor(Math.random() * 10) // 0-9
        addNumber(randomNum)
    }

    const addNumber = (num: number): void => {
        const newSketch: number[][] = sketch.map((row) => [...row])
        const updatedCells: UpdatedCell[] = []

        // Apply each hash function
        for (let i = 0; i < rows; i++) {
            const col = hashFunctions[i](num, cols)
            newSketch[i][col]++
            updatedCells.push({ row: i, col })
        }

        // Update actual frequencies
        const newActualFreqs = { ...actualFrequencies }
        const numStr = num.toString()
        newActualFreqs[numStr] = (newActualFreqs[numStr] || 0) + 1

        // Update recent numbers (keep last 10)
        const newRecentNumbers = [num, ...recentNumbers].slice(0, 10)

        setSketch(newSketch)
        setLastUpdatedCells(updatedCells)
        setAnimatingCells(updatedCells)
        setRecentNumbers(newRecentNumbers)
        setActualFrequencies(newActualFreqs)
        setLastAddedNumber(num)

        // Remove animation after delay
        setTimeout(() => setAnimatingCells([]), 800)
    }

    const resetSketch = (): void => {
        const newSketch: number[][] = Array(rows)
            .fill(null)
            .map(() => Array(cols).fill(0))
        setSketch(newSketch)
        setRecentNumbers([])
        setLastUpdatedCells([])
        setAnimatingCells([])
        setActualFrequencies({})
        setLastAddedNumber(null)
        setSelectedNumber(null)
        setHighlightedCells([])
    }

    const isUpdatedCell = (row: number, col: number): boolean => {
        return lastUpdatedCells.some(
            (cell) => cell.row === row && cell.col === col
        )
    }

    const isAnimatingCell = (row: number, col: number): boolean => {
        return animatingCells.some(
            (cell) => cell.row === row && cell.col === col
        )
    }

    const isHighlightedCell = (row: number, col: number): boolean => {
        return highlightedCells.some(
            (cell) => cell.row === row && cell.col === col
        )
    }

    const getHashValue = (item: number, hashIndex: number): number | string => {
        if (hashIndex >= hashFunctions.length) return '?'
        return hashFunctions[hashIndex](item, cols)
    }

    const getCMSEstimate = (num: number): number => {
        if (sketch.length === 0) return 0

        const estimates: number[] = []
        for (let i = 0; i < rows; i++) {
            const col = hashFunctions[i](num, cols)
            estimates.push(sketch[i][col])
        }

        return Math.min(...estimates)
    }

    const getEstimateDetails = (num: number) => {
        if (sketch.length === 0) return []

        const details = []
        for (let i = 0; i < rows; i++) {
            const col = hashFunctions[i](num, cols)
            details.push({
                row: i,
                col: col,
                value: sketch[i][col],
            })
        }
        return details
    }

    const handleRowsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setRows(Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))
    }

    const handleColsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setCols(Math.max(4, parseInt(e.target.value) || 4))
    }

    return (
        <div className="container mx-auto p-2 sm:p-4 space-y-4 max-w-7xl">
            <div className="transform duration-500">
                <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-white">
                    Count-Min Sketch Visualizer
                </h1>
                <p className="text-sm sm:text-base text-blue-100 mb-4 sm:mb-6">
                    Generate random numbers to see how CMS estimates frequencies
                </p>
            </div>

            {/* Controls */}
            <Card className="bg-primary p-2 sm:p-4">
                <CardTitle className="flex items-center gap-x-2 text-base sm:text-xl mb-4">
                    <GearIcon />
                    Controls
                </CardTitle>

                <CardContent className="flex flex-col sm:flex-row gap-4 p-0">
                    <div className="space-y-2">
                        <Label htmlFor="rows" className="text-sm">
                            Rows (Hash Functions)
                        </Label>
                        <Input
                            id="rows"
                            type="number"
                            min="1"
                            max="8"
                            value={rows}
                            onChange={handleRowsChange}
                            className="w-full sm:w-40"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cols" className="text-sm">
                            Columns
                        </Label>
                        <Input
                            id="cols"
                            type="number"
                            min="4"
                            max="16"
                            value={cols}
                            onChange={handleColsChange}
                            className="w-full sm:w-40"
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4 p-0">
                    <Button
                        className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto text-sm sm:text-base"
                        onClick={generateRandomNumber}
                    >
                        <Dice5Icon className="w-4 h-4 mr-2" />
                        Generate Random
                    </Button>
                    <Button
                        className="bg-gray-500 hover:bg-gray-600 text-white w-full sm:w-auto text-sm sm:text-base"
                        onClick={resetSketch}
                    >
                        Reset
                    </Button>
                </CardFooter>
            </Card>

            {/* Hash Functions Display */}
            <Card className="bg-primary p-2 sm:p-4">
                <CardTitle className="flex items-center gap-x-2 text-base sm:text-xl mb-4">
                    <HashIcon />
                    Hash Functions for {lastAddedNumber ?? '_'}
                </CardTitle>

                <CardContent className="grid grid-cols-1 gap-2 sm:gap-4 p-0">
                    {Array.from({ length: rows }, (_, i) => (
                        <div
                            key={i}
                            className="text-xs sm:text-sm p-2 rounded border"
                        >
                            <span className="font-mono">
                                h
                                <sub className="text-xs text-yellow-400">
                                    {i + 1}
                                </sub>
                                ({lastAddedNumber ?? '?'}) ={' '}
                                {lastAddedNumber !== null
                                    ? getHashValue(lastAddedNumber, i)
                                    : '?'}
                                <sup className="text-xs text-yellow-400">
                                    th{' '}
                                </sup>
                                column
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Count-Min Sketch Grid */}
            <Card className="overflow-x-auto p-2 sm:p-4">
                <CardTitle className="flex items-center gap-x-2 text-base sm:text-xl mb-4">
                    <Grid3X3Icon />
                    Count-Min Sketch Grid
                </CardTitle>

                <CardContent className="overflow-x-auto p-0">
                    <div className="inline-block min-w-full">
                        {/* Sketch rows */}
                        {sketch.map((row: number[], rowIndex: number) => (
                            <div key={rowIndex} className="flex mb-1">
                                {/* Row label */}
                                <div className="w-20 sm:w-32 h-12 sm:h-16 flex items-center justify-center bg-primary border border-green-300 rounded-l text-xs sm:text-sm font-semibold">
                                    <div className="text-center">
                                        <div className="text-xs text-green-700">
                                            Row {rowIndex + 1}
                                        </div>
                                        <div className="text-green-800 text-xs sm:text-sm">
                                            h{rowIndex + 1}
                                        </div>
                                    </div>
                                </div>

                                {/* Sketch cells */}
                                {row.map((value: number, colIndex: number) => {
                                    const isUpdated = isUpdatedCell(
                                        rowIndex,
                                        colIndex
                                    )
                                    const isAnimating = isAnimatingCell(
                                        rowIndex,
                                        colIndex
                                    )
                                    const isHighlighted = isHighlightedCell(
                                        rowIndex,
                                        colIndex
                                    )

                                    return (
                                        <div
                                            key={colIndex}
                                            className={`w-10 h-12 sm:w-16 sm:h-16 border flex items-center justify-center text-sm sm:text-lg font-semibold transition-all duration-300 ${
                                                isHighlighted
                                                    ? 'bg-purple-200 border-purple-500 border-2 shadow-lg scale-105 z-10'
                                                    : isUpdated
                                                      ? 'bg-orange-200 border-orange-400'
                                                      : 'bg-primary border-blue-300'
                                            } ${
                                                isAnimating
                                                    ? 'scale-110 bg-orange-300'
                                                    : ''
                                            }`}
                                        >
                                            {value > 0 && (
                                                <span
                                                    className={
                                                        isHighlighted
                                                            ? 'text-purple-800'
                                                            : isUpdated
                                                              ? 'text-orange-800'
                                                              : 'text-blue-500'
                                                    }
                                                >
                                                    {value}
                                                    {isUpdated && (
                                                        <sup className="text-xs">
                                                            +1
                                                        </sup>
                                                    )}
                                                </span>
                                            )}
                                            {value === 0 && (
                                                <span
                                                    className={
                                                        isHighlighted
                                                            ? 'text-purple-800'
                                                            : 'text-blue-500'
                                                    }
                                                >
                                                    0
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Frequency Estimation Card */}
            <Card className="bg-primary p-2 sm:p-4">
                <CardTitle className="flex items-center gap-x-2 text-base sm:text-xl mb-4">
                    <Tally5Icon />
                    Frequency Estimation
                </CardTitle>

                <CardContent className="space-y-4 p-0">
                    {/* Number selector */}
                    <div className="space-y-2">
                        <Label className="text-sm">
                            Select a number to see its frequency estimate:
                        </Label>
                        <div className="flex gap-1 sm:gap-2 flex-wrap">
                            {Array.from({ length: 10 }, (_, i) => (
                                <Button
                                    key={i}
                                    variant={
                                        selectedNumber === i
                                            ? 'default'
                                            : 'outline'
                                    }
                                    className="w-8 h-8 sm:w-12 sm:h-12 p-0 text-xs sm:text-base"
                                    onClick={() => setSelectedNumber(i)}
                                    disabled={!actualFrequencies[i.toString()]}
                                >
                                    {i}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {selectedNumber !== null && (
                        <div className="space-y-4 border-t pt-4">
                            {/* Estimation process */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm sm:text-base">
                                    Estimation Process for {selectedNumber}:
                                </h4>
                                <div className="space-y-1">
                                    {getEstimateDetails(selectedNumber).map(
                                        (detail, i) => (
                                            <div
                                                key={i}
                                                className="text-xs sm:text-sm p-2 rounded border "
                                            >
                                                Row {i + 1}: h<sub>{i + 1}</sub>
                                                ({selectedNumber}) = column{' '}
                                                {detail.col} → value ={' '}
                                                <span className="font-bold text-purple-700">
                                                    {detail.value}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Result */}
                            <div className="p-3 sm:p-4 bg-primary rounded-lg border">
                                <div className="text-sm sm:text-lg font-semibold">
                                    CMS Estimate = min(
                                    {getEstimateDetails(selectedNumber)
                                        .map((d) => d.value)
                                        .join(', ')}
                                    ) = {getCMSEstimate(selectedNumber)}
                                </div>
                                <div className="text-xs sm:text-sm mt-2">
                                    Actual frequency:{' '}
                                    {actualFrequencies[
                                        selectedNumber.toString()
                                    ] || 0}
                                </div>
                                {getCMSEstimate(selectedNumber) >
                                    (actualFrequencies[
                                        selectedNumber.toString()
                                    ] || 0) && (
                                    <div className="text-xs sm:text-sm text-orange-600 mt-1">
                                        Note: CMS can overestimate but never
                                        underestimates
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default CountMinSketchWorking
