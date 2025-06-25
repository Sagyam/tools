'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dice5Icon } from 'lucide-react'
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

    // Simple hash functions (for demonstration)
    const hashFunctions = [
        (item: number, cols: number): number => (item * 7 + 3) % cols,
        (item: number, cols: number): number => (item * 11 + 5) % cols,
        (item: number, cols: number): number => (item * 13 + 7) % cols,
        (item: number, cols: number): number => (item * 17 + 11) % cols,
    ]

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
    }, [rows, cols])

    const generateRandomNumber = (): void => {
        const randomNum = Math.floor(Math.random() * 10) // 0-9
        addNumber(randomNum)
    }

    const addNumber = (num: number): void => {
        const newSketch: number[][] = sketch.map((row) => [...row])
        const updatedCells: UpdatedCell[] = []

        // Apply each hash function
        for (let i = 0; i < Math.min(rows, hashFunctions.length); i++) {
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

    const getHashValue = (item: number, hashIndex: number): number | string => {
        if (hashIndex >= hashFunctions.length) return '?'
        return hashFunctions[hashIndex](item, cols)
    }

    const getCMSEstimate = (num: number): number => {
        if (sketch.length === 0) return 0

        const estimates: number[] = []
        for (let i = 0; i < Math.min(rows, hashFunctions.length); i++) {
            const col = hashFunctions[i](num, cols)
            estimates.push(sketch[i][col])
        }

        return Math.min(...estimates)
    }

    const handleRowsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setRows(Math.max(1, parseInt(e.target.value) || 1))
    }

    const handleColsChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setCols(Math.max(4, parseInt(e.target.value) || 4))
    }

    return (
        <div className="container mx-auto p-4 space-y-4 w-fit">
            <div className="max-w-6xl mx-auto transform duration-500">
                <h1 className="text-4xl font-bold mb-2 text-white">
                    Count-Min Sketch Visualizer
                </h1>
                <p className="text-blue-100 mb-6">
                    Generate random numbers to see how CMS estimates frequencies
                </p>
            </div>

            {/* Controls */}
            <Card className="bg-primary p-4 flex flex-col items-start gap-y-4">
                <CardTitle className="flex items-center gap-x-2">
                    <GearIcon />
                    Controls
                </CardTitle>

                <CardContent className="flex gap-x-4">
                    <div className="space-y-2">
                        <Label htmlFor="rows">Rows</Label>
                        <Input
                            id="rows"
                            type="number"
                            min="1"
                            max="8"
                            value={rows}
                            onChange={handleRowsChange}
                            className="w-40"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cols">Columns</Label>
                        <Input
                            id="cols"
                            type="number"
                            min="4"
                            max="16"
                            value={cols}
                            onChange={handleColsChange}
                            className="w-40"
                        />
                    </div>
                </CardContent>

                <CardFooter className="flex justify-evenly items-center gap-x-4">
                    <Button
                        className={`bg-green-500 hover:bg-green-600 text-white`}
                        onClick={generateRandomNumber}
                    >
                        <Dice5Icon className="w-4 h-4" />
                        Generate Random Number
                    </Button>
                    <Button
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                        onClick={resetSketch}
                    >
                        Reset
                    </Button>
                </CardFooter>
            </Card>

            {/* Hash Functions Display */}
            <Card className={`bg-primary p-4`}>
                <CardTitle className="mb-4">
                    Hash of {lastAddedNumber ?? '_'}{' '}
                </CardTitle>

                <CardContent className="grid grid-cols-1 gap-4">
                    {Array.from({ length: Math.min(rows, 4) }, (_, i) => (
                        <div key={i} className="text-sm p-2 rounded border">
                            <span className="font-mono">
                                h
                                <sub className="text-xs text-yellow-400">
                                    {i + 1}
                                </sub>
                                ({lastAddedNumber}) ={' '}
                                {getHashValue(lastAddedNumber, i)}
                                <sup className="text-xs text-yellow-400">
                                    th{' '}
                                </sup>
                                {''}
                                column
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Count-Min Sketch Grid */}
            <Card className="overflow-x-auto p-4">
                <CardTitle className="mb-4">Count-Min Sketch Grid</CardTitle>

                <CardContent className="inline-block min-w-full">
                    {/* Sketch rows */}
                    {sketch.map((row: number[], rowIndex: number) => (
                        <div key={rowIndex} className="flex mb-1">
                            {/* Row label */}
                            <div className="w-32 h-16 flex items-center justify-center bg-primary border border-green-300 rounded-l text-sm font-semibold">
                                <div className="text-center">
                                    <div className="text-xs text-green-700">
                                        Row {rowIndex + 1}
                                    </div>
                                    <div className="text-green-800">
                                        {lastAddedNumber !== null
                                            ? `h${rowIndex + 1}(${lastAddedNumber}) = ${getHashValue(lastAddedNumber, rowIndex)}`
                                            : `h${rowIndex + 1}(?)`}
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

                                return (
                                    <div
                                        key={colIndex}
                                        className={`w-16 h-16 border border-blue-300 flex items-center justify-center text-lg font-semibold transition-all duration-300 ${
                                            isUpdated
                                                ? 'bg-orange-200 border-orange-400'
                                                : 'bg-primary'
                                        } ${
                                            isAnimating
                                                ? 'scale-110 bg-orange-300'
                                                : ''
                                        }`}
                                    >
                                        {value > 0 && (
                                            <span
                                                className={
                                                    isUpdated
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
                                            <span className="text-blue-500">
                                                0
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export default CountMinSketchWorking
