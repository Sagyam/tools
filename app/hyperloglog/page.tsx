'use client'

import CardWitAreaChart from '@/app/hyperloglog/card-with-area-chart'
import CardWithBarGraph from '@/app/hyperloglog/card-with-bar-graph'
import { CardWithText } from '@/app/hyperloglog/card-with-text'
import {
    generateRandomIPv4,
    getFormattedNumber,
} from '@/app/hyperloglog/helper'
import { HyperLogLog } from '@/app/hyperloglog/hll'
import { HLLHistory } from '@/app/hyperloglog/types'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import {
    ArrowDown,
    Ban,
    CheckCheck,
    Dices,
    Diff,
    Plus,
    RefreshCcw,
    Triangle,
} from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'

const HyperLogLogDemo = () => {
    const [input, setInput] = useState<string>('')
    const [bucketCount, setBucketCount] = useState<number>(7)
    const [hll, setHll] = useState(new HyperLogLog(bucketCount))
    const [uniqueSet, setUniqueSet] = useState<Set<string>>(new Set())
    const [lastAddedIP, setLastAddedIP] = useState<string | null>(null)
    const [history, setHistory] = useState<HLLHistory>({
        entries: [],
        maxEntries: 50,
    })

    const bucketRefs = useRef<Record<number, HTMLDivElement>>({})
    useEffect(() => {
        if (
            hll.lastAddedBucket !== null &&
            bucketRefs.current[hll.lastAddedBucket]
        ) {
            bucketRefs.current[hll.lastAddedBucket]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest',
            })
        }
    }, [hll.lastAddedBucket])

    const generateRandomIP = () => {
        const newIP = generateRandomIPv4()
        setInput(newIP)
    }

    const addSingleInputToHLL = () => {
        const newSet = new Set(uniqueSet)

        if (input) {
            hll.add(input)
            setUniqueSet((prevSet) => new Set(prevSet).add(input))
            setLastAddedIP(input)
            hll.detectOutOfBoundError(newSet.size)
            appendToHistory(newSet.size)
        }
    }

    const appendToHistory = (freshTrueValue: number) => {
        const estimate = hll.estimateCardinality()
        const delta = hll.getDelta(freshTrueValue)
        const error = parseFloat(hll.getErrorPercentage(freshTrueValue))

        setHistory((prevHistory) => {
            const newEntry = {
                index:
                    prevHistory.entries.length > 0
                        ? prevHistory.entries[prevHistory.entries.length - 1]
                              .index + 1
                        : 1,
                trueValue: freshTrueValue,
                estimate,
                delta,
                error,
                timestamp: Date.now(),
            }

            const updatedEntries = prevHistory.maxEntries
                ? [
                      ...prevHistory.entries.slice(
                          -(prevHistory.maxEntries - 1)
                      ),
                      newEntry,
                  ]
                : [...prevHistory.entries, newEntry]

            return {
                ...prevHistory,
                entries: updatedEntries,
            }
        })
    }

    const addMultipleInputsToHLL = (count: number): void => {
        const newIPs = Array.from({ length: count }, generateRandomIPv4)
        let ip = ''
        const newSet = new Set(uniqueSet)

        for (let i = 0; i < newIPs.length; i++) {
            ip = newIPs[i]
            newSet.add(ip)
            hll.add(ip)
        }

        setLastAddedIP(ip)
        setUniqueSet(newSet)
        hll.detectOutOfBoundError(newSet.size)
        appendToHistory(newSet.size)
    }

    const lastHashDetails = useMemo(() => {
        if (!lastAddedIP) return null

        const hashedValue = hll.hash(lastAddedIP)
        const bucketIndex = (hashedValue >>> 0) % hll.m
        const runLength = hll.leadingZeros(hashedValue) + 1
        const binaryHash = hashedValue.toString(2).padStart(32, '0')

        return {
            hash: binaryHash,
            bucketIndex,
            runLength,
        }
    }, [lastAddedIP, hll])

    const resetHLL = (value: number) => {
        setBucketCount(value)
        setHll(new HyperLogLog(value))
        setUniqueSet(new Set())
        setLastAddedIP(null)
        setHistory({
            entries: [],
            maxEntries: 50,
        })
    }

    return (
        <div className="container mx-auto p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>HyperLogLog Demonstration</CardTitle>
                    <CardDescription>
                        Explore unique IP address counting
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter IPv4 Address"
                        />
                        <Button variant="outline" onClick={generateRandomIP}>
                            <RefreshCcw className="mr-2" /> Random IP
                        </Button>
                        <Button onClick={addSingleInputToHLL}>
                            <Plus className="mr-2" /> Add to HLL
                        </Button>
                    </div>

                    {/* Bucket Count Slider */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Number of Buckets: {Math.pow(2, bucketCount)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Slider
                                defaultValue={[bucketCount]}
                                min={1}
                                max={12}
                                step={1}
                                onValueChange={(value) => {
                                    resetHLL(value[0])
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* Hash Visualization */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hash Representation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="font-mono text-sm">
                                    {lastHashDetails &&
                                        lastHashDetails.hash
                                            .split('')
                                            .map(
                                                (
                                                    bit: string,
                                                    index: number
                                                ) => (
                                                    <span
                                                        key={index}
                                                        className={`${index < 16 ? 'text-blue-500' : 'text-green-500'}
                                                              ${bit === '1' ? 'font-bold' : 'text-opacity-50'}`}
                                                    >
                                                        {bit}
                                                    </span>
                                                )
                                            )}
                                </div>
                                <div className="text-sm">
                                    <strong>Bucket:</strong>{' '}
                                    {lastHashDetails &&
                                        lastHashDetails.bucketIndex}{' '}
                                    |<strong> Run Length:</strong>{' '}
                                    {lastHashDetails &&
                                        lastHashDetails.runLength}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Random IPs Button */}
                    <div className="flex space-x-4">
                        <Button
                            size={'lg'}
                            onClick={() => addMultipleInputsToHLL(1000)}
                        >
                            <ArrowDown className="mr-1" /> Add 1000 Random IPs
                        </Button>
                        <Button
                            variant={'outline'}
                            className={
                                'bg-green-600 hover:bg-green-700 text-white'
                            }
                            size={'lg'}
                            onClick={() => addMultipleInputsToHLL(5000)}
                        >
                            <ArrowDown className="mr-1" /> Add 5K Random IPs
                        </Button>
                        <Button
                            className={
                                'bg-amber-500 hover:bg-amber-700 text-white'
                            }
                            size={'lg'}
                            onClick={() => addMultipleInputsToHLL(10000)}
                        >
                            <ArrowDown className="mr-1" /> Add 10K Random IPs
                        </Button>{' '}
                        <Button
                            variant={'destructive'}
                            size={'lg'}
                            onClick={() => addMultipleInputsToHLL(50000)}
                        >
                            <ArrowDown className="mr-1" /> Add 50K Random IPs
                        </Button>{' '}
                        <Button
                            className={
                                'bg-black border-2 hover:bg-gray-900 text-white'
                            }
                            size={'lg'}
                            onClick={() => addMultipleInputsToHLL(100000)}
                        >
                            <ArrowDown className="mr-1" /> Add 100K Random IPs
                        </Button>{' '}
                    </div>

                    {/* Buckets Display */}
                    <Card className="p-2">
                        <CardContent>
                            <ScrollArea className="h-32 rounded-md border-primary-foreground">
                                <div className="grid grid-flow-dense grid-cols-12 gap-2">
                                    {hll.buckets.map(
                                        (
                                            maxRunLength: number,
                                            index: number
                                        ) => (
                                            <Card
                                                key={index}
                                                ref={(el) =>
                                                    (bucketRefs.current[index] =
                                                        el as HTMLDivElement)
                                                }
                                                className={cn(
                                                    'transition-all duration-300',
                                                    index ===
                                                        hll.lastAddedBucket
                                                        ? 'scale-105 ring-2 ring-primary bg-accent'
                                                        : ''
                                                )}
                                            >
                                                <CardHeader>
                                                    <CardTitle>
                                                        {maxRunLength}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Bucket {index}
                                                    </CardDescription>
                                                </CardHeader>
                                            </Card>
                                        )
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Metrics Cards */}
                    <div className="grid md:grid-cols-5 gap-4">
                        <CardWithText
                            title={getFormattedNumber(uniqueSet.size)}
                            subtitle={'Actual Count'}
                            description="Actual number of unique IPs as counted by a Set"
                            icon={<CheckCheck />}
                        />

                        <CardWithText
                            title={getFormattedNumber(
                                hll.estimateCardinality()
                            )}
                            subtitle={'Estimated Count'}
                            description={`Estimated number of unique IPs as counted by HyperLogLog.`}
                            icon={<Dices />}
                            extraStyle={
                                hll.warningMessage.length > 0
                                    ? 'border-destructive/50 text-destructive dark:border-destructive'
                                    : ''
                            }
                        />

                        <CardWithText
                            title={getFormattedNumber(
                                hll.getDelta(uniqueSet.size)
                            )}
                            subtitle={'Difference'}
                            description={`Difference between actual and estimated count.`}
                            icon={<Triangle />}
                        />

                        <CardWithText
                            title={`${hll.stdError * 100}%`}
                            subtitle={' Margin of error'}
                            description={`
                                          The estimated count should be within ± ${hll.stdError * 100}% of the actual count.
                                          Do note that this is not a guarantee.
                                        `}
                            icon={<Diff />}
                        />

                        <CardWithText
                            title={`${hll.getErrorPercentage(uniqueSet.size)}%`}
                            subtitle={'Actual error'}
                            description={`Percentage by which the estimated count is off from the actual count.`}
                            icon={<Ban />}
                            extraStyle={
                                hll.warningMessage.length > 0
                                    ? 'border-destructive/50 text-destructive dark:border-destructive'
                                    : ''
                            }
                        />
                    </div>

                    {/* Graph */}

                    <div className="grid md:grid-cols-1 gap-4">
                        <CardWitAreaChart
                            chartName="Estimate vs Actual Count"
                            subtitle="Closer these values, better the estimate"
                            tooltipDescription={`Estimated count should be within ± ${hll.stdError * 100}% of the actual count.`}
                            data={history.entries.map((entry) => ({
                                index: entry.index,
                                Estimate: entry.estimate,
                                Actual: entry.trueValue,
                            }))}
                            dataLabels={['Estimate', 'Actual']}
                            colorOverrides={{
                                Estimate: 'hsl(var(--chart-1))',
                                Actual: 'hsl(var(--chart-3))',
                            }}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <CardWithBarGraph
                            chartName="Difference in Count"
                            subtitle={`Difference between estimated and actual count`}
                            data={history.entries.map((entry) => ({
                                index: entry.index,
                                Delta: entry.delta,
                            }))}
                            dataLabels={['Delta']}
                            tooltipDescription={`Difference between estimated and actual count`}
                        />

                        <CardWithBarGraph
                            chartName="Percentage Error"
                            subtitle={`Ideally this value should be within ${hll.stdError * 100}%`}
                            data={history.entries.map((entry) => ({
                                index: entry.index,
                                Error: entry.error,
                            }))}
                            dataLabels={['Error']}
                            tooltipDescription={`Estimated count should be within ± ${hll.stdError * 100}% of the actual count.`}
                            colorOverrides={{
                                Error: 'hsl(var(--chart-5))',
                            }}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default HyperLogLogDemo
