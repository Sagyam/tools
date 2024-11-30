'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import React, { useState } from 'react'
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

// Type definitions
type MultiplierN = 'Items' | 'Thousand' | 'Million' | 'Billion'
type MultiplierM = 'Bit' | 'KB' | 'MB' | 'GB' | 'TB'

// Multiplier conversion factors
const MULTIPLIERS_N: Record<MultiplierN, number> = {
    Items: 1,
    Thousand: 1_000,
    Million: 1_000_000,
    Billion: 1_000_000_000,
}

const MULTIPLIERS_M: Record<MultiplierM, number> = {
    Bit: 1,
    KB: 8_000,
    MB: 8_000_000,
    GB: 8_000_000_000,
    TB: 8_000_000_000,
}

// Utility function to format probability
const formatProbability = (p: number | null): string => {
    if (p === null) return 'N/A'

    // Convert to percentage for probabilities >= 0.001 (0.1%)
    if (p >= 0.001) {
        return `${(p * 100).toFixed(2)}%`
    }

    // Use "1 in X" format for very small probabilities
    const oneInX = formatLargeNumber(Math.round(1 / p))
    return `1 in ${oneInX.toLocaleString()}`
}

// Utility function for calculating false positive probability
const calculateFalsePositiveProbability = (
    n: number | null,
    m: number | null,
    k: number | null
): number | null => {
    // Validate inputs
    if (!n || !m || !k) return null

    // Probability calculation based on Bloom filter theory
    // p = (1 - e^(-k*n/m))^k
    const prob = Math.pow(1 - Math.exp((-k * n) / m), k)

    return prob > 0 ? prob : null
}

// Utility function to format large numbers
const formatLargeNumber = (value: number) => {
    if (value >= 1_000_000_000_000)
        return `${(value / 1_000_000_000_000).toFixed(1)}Trillion`
    if (value >= 1_000_000_000)
        return `${(value / 1_000_000_000).toFixed(1)}Billion`
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Million`
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
    return value.toString()
}

// Utility function to generate X axis labels
const getXAxisLabel = (selectedGraph: 'p_vs_n' | 'p_vs_k' | 'p_vs_m') => {
    switch (selectedGraph) {
        case 'p_vs_n':
            return 'Number of Items'
        case 'p_vs_k':
            return 'Number of Hash Functions'
        case 'p_vs_m':
            return 'Filter Size (Bits)'
    }
}

const generateGraphData = (
    param: 'n' | 'm' | 'k',
    n: number | null,
    m: number | null,
    k: number | null
) => {
    const data: any[] = []

    // Adjust range based on the parameter
    const range =
        param === 'n'
            ? [10, 100, 1000, 10000, 100000]
            : param === 'm'
              ? [1000, 10000, 100000, 1000000, 10000000]
              : [1, 2, 3, 4, 5, 6, 7, 8, 9]

    range.forEach((value) => {
        let currentN = n,
            currentM = m,
            currentK = k

        switch (param) {
            case 'n':
                currentN = value
                break
            case 'm':
                currentM = value
                break
            case 'k':
                currentK = value
                break
        }

        const p = calculateFalsePositiveProbability(
            currentN,
            currentM,
            currentK
        )

        // Only add data points that have a meaningful false positive rate
        if (p !== null) {
            // Adjust threshold as needed
            data.push({
                [param]: value,
                'False Positive Rate': p,
            })
        }
    })
    return data
}

const BloomFilterCalculator: React.FC = () => {
    const [inputs, setInputs] = useState({
        n: { value: '100', multiplier: 'Items' as MultiplierN },
        m: { value: '1000', multiplier: 'Bit' as MultiplierM },
        k: '7',
    })
    const [selectedGraph, setSelectedGraph] = useState<
        'p_vs_n' | 'p_vs_k' | 'p_vs_m'
    >('p_vs_n')

    // Calculate parameters on every change
    const calculatedParams = {
        n: inputs.n.value
            ? parseFloat(inputs.n.value) * MULTIPLIERS_N[inputs.n.multiplier]
            : null,
        m: inputs.m.value
            ? parseFloat(inputs.m.value) * MULTIPLIERS_M[inputs.m.multiplier]
            : null,
        k: inputs.k ? parseFloat(inputs.k) : null,
        p: null as number | null,
    }

    // Calculate false positive probability
    calculatedParams.p = calculateFalsePositiveProbability(
        calculatedParams.n,
        calculatedParams.m,
        calculatedParams.k
    )

    // Generate graph data
    const graphData =
        calculatedParams.n && calculatedParams.m && calculatedParams.k
            ? generateGraphData(
                  selectedGraph.split('_')[2] as 'n' | 'm' | 'k',
                  calculatedParams.n,
                  calculatedParams.m,
                  calculatedParams.k
              )
            : []

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: 'n' | 'm'
    ) => {
        const { value } = e.target
        setInputs((prev) => ({
            ...prev,
            [type]: { ...prev[type], value },
        }))
    }

    const handleMultiplierChange = (value: string, type: 'n' | 'm') => {
        setInputs((prev) => ({
            ...prev,
            [type]: {
                ...prev[type],
                multiplier: value as MultiplierN | MultiplierM,
            },
        }))
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Bloom Filter Calculator</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {/* Number of Items (n) */}
                    <div className="space-y-2">
                        <Label>n - Number of Items</Label>
                        <div className="flex space-x-2">
                            <Input
                                type="number"
                                value={inputs.n.value}
                                onChange={(e) => handleInputChange(e, 'n')}
                                placeholder="Number of Items"
                                min={1}
                                className="flex-grow"
                            />
                            <Select
                                value={inputs.n.multiplier}
                                onValueChange={(value) =>
                                    handleMultiplierChange(value, 'n')
                                }
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Multiplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(
                                        [
                                            'Items',
                                            'Thousand',
                                            'Million',
                                            'Billion',
                                        ] as MultiplierN[]
                                    ).map((mult) => (
                                        <SelectItem key={mult} value={mult}>
                                            {mult}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Number of Bits (m) */}
                    <div className="space-y-2">
                        <Label>m - Size of the filter</Label>
                        <div className="flex space-x-2">
                            <Input
                                type="number"
                                value={inputs.m.value}
                                onChange={(e) => handleInputChange(e, 'm')}
                                placeholder="Size of the filter"
                                min={1}
                                className="flex-grow"
                            />
                            <Select
                                value={inputs.m.multiplier}
                                onValueChange={(value) =>
                                    handleMultiplierChange(value, 'm')
                                }
                            >
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(
                                        [
                                            'Bit',
                                            'KB',
                                            'MB',
                                            'GB',
                                        ] as MultiplierM[]
                                    ).map((mult) => (
                                        <SelectItem key={mult} value={mult}>
                                            {mult}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Number of Hash Functions (k) */}
                    <div className="space-y-2">
                        <Label>k - Number of Hash Functions</Label>
                        <Input
                            type="number"
                            name="k"
                            placeholder="Number of Hash Functions"
                            min={1}
                            value={inputs.k}
                            onChange={(e) =>
                                setInputs((prev) => ({
                                    ...prev,
                                    k: e.target.value,
                                }))
                            }
                        />
                    </div>
                </div>

                {/* Calculated Parameters */}
                <div className="grid grid-cols-1 gap-4 mb-4 bg-muted p-4 rounded text-center">
                    <div>
                        <strong>Chance of a mistake</strong>{' '}
                        <kbd>(false positive)</kbd>:{' '}
                        {formatProbability(calculatedParams.p)}
                    </div>
                </div>

                {/* Graph Selection */}
                <div className="flex space-x-2 mb-4">
                    <Button
                        variant={
                            selectedGraph === 'p_vs_n' ? 'default' : 'outline'
                        }
                        onClick={() => setSelectedGraph('p_vs_n')}
                    >
                        False Positive Rate vs Number of Items
                    </Button>
                    <Button
                        variant={
                            selectedGraph === 'p_vs_k' ? 'default' : 'outline'
                        }
                        onClick={() => setSelectedGraph('p_vs_k')}
                    >
                        False Positive Rate vs Hash Functions
                    </Button>
                    <Button
                        variant={
                            selectedGraph === 'p_vs_m' ? 'default' : 'outline'
                        }
                        onClick={() => setSelectedGraph('p_vs_m')}
                    >
                        False Positive Rate vs Filter Size
                    </Button>
                </div>

                {/* Line Chart */}
                {graphData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart
                            data={graphData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey={selectedGraph.split('_')[2]}
                                type="number"
                                domain={['auto', 'auto']}
                                scale="log"
                                tickFormatter={formatLargeNumber}
                                label={getXAxisLabel(selectedGraph)}
                                dy={20}
                            />
                            <YAxis
                                type="number"
                                domain={['auto', 'auto']}
                                scale="log"
                                tickFormatter={formatProbability}
                                width={90}
                                dx={-10}
                            />
                            <Tooltip
                                formatter={(value) => [
                                    formatProbability(
                                        parseFloat(value.toString())
                                    ),
                                    'False Positive Rate',
                                ]}
                            />
                            <Legend verticalAlign={'top'} />
                            <Line
                                type="monotone"
                                dataKey="False Positive Rate"
                                strokeWidth={2}
                                dot={true}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-red-500">
                        No graph data available. Debug info:
                        <pre>
                            {JSON.stringify(
                                {
                                    n: calculatedParams.n,
                                    m: calculatedParams.m,
                                    k: calculatedParams.k,
                                    graphDataLength: graphData.length,
                                },
                                null,
                                2
                            )}
                        </pre>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default BloomFilterCalculator
