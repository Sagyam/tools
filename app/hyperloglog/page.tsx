'use client'

import { CardWithText } from '@/app/hyperloglog/components'
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
    ArrowUpRight,
    Ban,
    CheckCheck,
    Dices,
    Diff,
    Plus,
    RefreshCcw,
    Triangle,
} from 'lucide-react'
import React, { useMemo, useState } from 'react'

const HyperLogLogDemo = () => {
    const [input, setInput] = useState<string>('')
    const [bucketCount, setBucketCount] = useState<number>(7)
    const [hll, setHll] = useState(new HyperLogLog(bucketCount))
    const [uniqueSet, setUniqueSet] = useState<Set<string>>(new Set())
    const [clickMultiplier] = useState<number>(1_000)
    const [lastAddedIP, setLastAddedIP] = useState<string | null>(null)
    const [history, setHistory] = useState<HLLHistory>({
        trueValue: [],
        estimate: [],
        deltas: [],
        error: [],
    })

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
        }
    }

    const appendToHistory = () => {
        const trueValue = uniqueSet.size
        const estimate = hll.estimateCardinality()
        const delta = hll.getDelta(trueValue)
        const error = hll.getErrorPercentage(trueValue)

        const newHistory = {
            trueValue: [...history.trueValue, trueValue],
            estimate: [...history.estimate, estimate],
            deltas: [...history.deltas, delta],
            error: [...history.error, parseFloat(error)],
        }

        // TODO: Keep only last 5 records

        setHistory(newHistory)
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
        appendToHistory()
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
            trueValue: [],
            estimate: [],
            deltas: [],
            error: [],
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
                    <div>
                        <label className="block mb-2">
                            Number of Buckets: {Math.pow(2, bucketCount)}
                        </label>
                        <Slider
                            defaultValue={[bucketCount]}
                            min={1}
                            max={12}
                            step={1}
                            onValueChange={(value) => {
                                resetHLL(value[0])
                            }}
                        />
                    </div>
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

                    {/* Buckets Display */}
                    <ScrollArea className="h-60 py-4 overflow-y-auto rounded-md border-primary-foreground">
                        <div className="grid grid-flow-dense grid-cols-12 gap-2">
                            {hll.buckets.map(
                                (maxRunLength: number, index: number) => (
                                    <Card
                                        key={index}
                                        className={cn(
                                            'transition-all duration-300',
                                            index === hll.lastAddedBucket
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
                    {/* Random IPs Button */}
                    <Button
                        onClick={() => addMultipleInputsToHLL(clickMultiplier)}
                    >
                        <ArrowUpRight className="mr-2" /> Add {clickMultiplier}{' '}
                        Random IPs
                    </Button>
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
                </CardContent>
            </Card>
        </div>
    )
}

export default HyperLogLogDemo
