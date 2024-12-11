'use client'

import {
    generateRandomIPv4,
    getFormattedNumber,
} from '@/app/hyperloglog/helper'
import { HyperLogLog } from '@/app/hyperloglog/hll'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { AlertCircle, ArrowUpRight, Plus, RefreshCcw } from 'lucide-react'
import React, { useMemo, useState } from 'react'

const HyperLogLogDemo = () => {
    const [input, setInput] = useState<string>('')
    const [bucketCount, setBucketCount] = useState<number>(7)
    const [hll, setHll] = useState(new HyperLogLog(bucketCount))
    const [uniqueSet, setUniqueSet] = useState<Set<string>>(new Set())
    const [clickMultiplier] = useState<number>(100)
    const [lastAddedIP, setLastAddedIP] = useState<string | null>(null)

    const generateRandomIP = () => {
        const newIP = generateRandomIPv4()
        setInput(newIP)
    }

    const addSingleInputToHLL = () => {
        if (input) {
            hll.add(input)
            setUniqueSet((prevSet) => new Set(prevSet).add(input))
            setLastAddedIP(input)
            hll.detectOutOfBoundError(uniqueSet.size)
        }
    }

    const addMultipleInputsToHLL = (count: number): void => {
        const newSet = new Set(uniqueSet)

        let ip = ''

        for (let i = 0; i < count; i++) {
            ip = generateRandomIPv4()
            hll.add(ip)
            newSet.add(ip)
        }
        setLastAddedIP(ip)
        setUniqueSet(newSet)
        hll.detectOutOfBoundError(newSet.size)
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
        setUniqueSet(new Set<string>())
        setLastAddedIP(null)
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
                            max={14}
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
                    <ScrollArea className="h-60 overflow-y-auto rounded-md border-primary-foreground">
                        <div className="grid grid-flow-dense grid-cols-12 gap-1 ">
                            {hll.buckets.map(
                                (maxRunLength: number, index: number) => (
                                    <Card
                                        key={index}
                                        className={cn(
                                            'transition-all duration-300',
                                            index === hll.lastAddedBucket
                                                ? 'border-4 border-primary shadow-border'
                                                : 'border-accent'
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
                        <ArrowUpRight className="mr-2" /> Add{' '}
                        {getFormattedNumber(clickMultiplier)} Random IPs
                    </Button>
                    {/* Metrics Cards */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Actual Unique IP Count</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {getFormattedNumber(uniqueSet.size)}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Estimated Unique IPs Count
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {getFormattedNumber(hll.estimateCardinality())}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>HLL Statistics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-2">
                                    Current Delta {'  '}
                                    {getFormattedNumber(
                                        hll.calculateDelta(uniqueSet.size)
                                    )}
                                </div>
                                <div className="space-2">
                                    Current Error {'  '}
                                    {hll.calculateErrorPercentage(
                                        uniqueSet.size
                                    )}
                                    %
                                </div>
                                <div className="space-2">
                                    Acceptable Error {'  ± '}
                                    {hll.stdError * 100}%
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Alert Box */}
                    <Alert
                        className={`transition-all duration-200 animate-accordion-down 
                                    ${hll.warningMessage ? '' : 'opacity-0'}`}
                        variant="warning"
                    >
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                            {hll.warningMessage}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    )
}

export default HyperLogLogDemo
