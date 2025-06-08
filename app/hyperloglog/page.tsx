'use client'

import { CardWithText } from '@/app/hyperloglog/card-with-text'
import {
    generateRandomIPv4,
    getFormattedNumber,
} from '@/app/hyperloglog/helper'
import { HyperLogLog } from '@/app/hyperloglog/hll'
import {
    HLLDetailsCard,
    HLLDetailsCardProps,
} from '@/app/hyperloglog/hll-details-card'
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
import { cn } from '@/lib/utils'
import {
    Ban,
    CheckCheck,
    Dices,
    Diff,
    LucideDices,
    Plus,
    RefreshCcw,
    Triangle,
} from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const HyperLogLogDemo = () => {
    const [input, setInput] = useState<string>('')
    const [bucketCount, setBucketCount] = useState<number>(7)
    const [hll, setHll] = useState(new HyperLogLog(bucketCount))
    const [uniqueSet, setUniqueSet] = useState<Set<string>>(new Set())
    const [maxEntries, setMaxEntries] = useState<number>(50)
    const [hllDetails, setHllDetails] = useState<HLLDetailsCardProps>({})
    const [history, setHistory] = useState<HLLHistory>({
        entries: [],
        maxEntries: maxEntries,
    })

    const bucketRefs = useRef<Record<number, HTMLDivElement>>({})
    useEffect(() => {
        if (
            hll.lastAddedBucket !== null &&
            bucketRefs.current[hll.lastAddedBucket]
        ) {
            bucketRefs.current[hll.lastAddedBucket]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center',
            })
        }
    }, [hll.lastAddedBucket])

    const calculateMaxEntries = useCallback(() => {
        if (typeof window === 'undefined') return 50

        const screenWidth = window.innerWidth
        if (screenWidth < 640) {
            // Mobile
            return 10
        } else if (screenWidth < 1024) {
            // Tablet
            return 30
        } else {
            // Desktop
            return 50
        }
    }, [])

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const newMaxEntries = calculateMaxEntries()
            setMaxEntries(newMaxEntries)

            // Trim history if necessary
            setHistory((prevHistory) => ({
                ...prevHistory,
                maxEntries: newMaxEntries,
                entries: prevHistory.entries.slice(-newMaxEntries),
            }))
        }

        // Set initial max entries
        handleResize()

        // Add resize listener
        window.addEventListener('resize', handleResize)

        // Cleanup listener
        return () => window.removeEventListener('resize', handleResize)
    }, [calculateMaxEntries])

    const generateRandomIP = () => {
        const newIP = generateRandomIPv4()
        setInput(newIP)
    }

    const addSingleInputToHLL = () => {
        const newSet = new Set(uniqueSet)

        if (input) {
            const result = hll.add(input, true)
            setUniqueSet((prevSet) => new Set(prevSet).add(input))
            hll.detectOutOfBoundError(newSet.size)
            appendToHistory(newSet.size)

            if (!result) return

            setHllDetails({
                hash: result.hash,
                currentRunLength: result.currentRunLength,
                lastRunLength: result.lastRunLength,
                selectedBucket: result.selectedBucket,
                wasAdded: result.wasAdded,
                isSingleIP: true,
            })
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

        setUniqueSet(newSet)
        hll.detectOutOfBoundError(newSet.size)
        appendToHistory(newSet.size)

        const result = hll.add(ip, true)

        if (!result) return

        setHllDetails({
            hash: result.hash,
            currentRunLength: result.currentRunLength,
            lastRunLength: result.lastRunLength,
            selectedBucket: result.selectedBucket,
            wasAdded: result.wasAdded,
            isSingleIP: false,
        })
    }

    const resetHLL = (value: number) => {
        setBucketCount(value)
        setHll(new HyperLogLog(value))
        setUniqueSet(new Set())
        setHistory({
            entries: [],
            maxEntries: maxEntries,
        })
    }

    return (
        <div className="container mx-auto p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg md:text-xl lg:text-2xl">
                        HyperLogLog Demonstration
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base">
                        Explore unique IP address counting
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Input Section - Stacked on mobile, inline on larger screens */}
                    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter IPv4 Address"
                            className="flex-1 border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md md:w-1/2 lg:w-1/3 xl:w-1/4"
                        />
                        <div className="flex space-x-2">
                            <Button
                                variant="default"
                                size="sm"
                                className="w-full bg-blue-400 hover:bg-blue-700 text-white"
                                onClick={generateRandomIP}
                            >
                                <RefreshCcw className="mr-2 size-4" /> Random IP
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full bg-green-400 hover:bg-green-700 text-white"
                                onClick={addSingleInputToHLL}
                            >
                                <Plus className="mr-2 size-4" /> Add to HLL
                            </Button>
                        </div>
                    </div>

                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="text-base md:text-lg">
                                Number of Buckets: {Math.pow(2, bucketCount)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                type="number"
                                value={bucketCount}
                                onChange={(e) =>
                                    resetHLL(parseInt(e.target.value, 10))
                                }
                                min={1}
                                max={12}
                                className="w-full mt-2 border border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                            />
                        </CardContent>
                    </Card>
                    {/* Random IPs Buttons - Responsive grid layout */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base md:text-lg">
                                These button will generate random IPs and add
                                them to the HyperLogLog.
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                <Button
                                    variant={'outline'}
                                    size={'sm'}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => addMultipleInputsToHLL(1000)}
                                >
                                    <LucideDices className="mr-1 size-4" /> 1K
                                    IPs
                                </Button>
                                <Button
                                    variant={'outline'}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    size={'sm'}
                                    onClick={() => addMultipleInputsToHLL(5000)}
                                >
                                    <LucideDices className="mr-1 size-4" /> 5K
                                    IPs
                                </Button>
                                <Button
                                    variant={'outline'}
                                    className="w-full bg-amber-500 hover:bg-amber-700 text-white"
                                    size={'sm'}
                                    onClick={() =>
                                        addMultipleInputsToHLL(10000)
                                    }
                                >
                                    <LucideDices className="mr-1 size-4" /> 10K
                                    IPs
                                </Button>
                                <Button
                                    variant={'outline'}
                                    size={'sm'}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() =>
                                        addMultipleInputsToHLL(50000)
                                    }
                                >
                                    <LucideDices className="mr-1 size-4" />
                                    50K IPs
                                </Button>
                                <Button
                                    variant={'outline'}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                    size={'sm'}
                                    onClick={() =>
                                        addMultipleInputsToHLL(100000)
                                    }
                                >
                                    <LucideDices className="mr-1 size-4" /> 100K
                                    IPs
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    {/* HLL Details Card - Responsive layout */}
                    <HLLDetailsCard
                        hash={hllDetails.hash}
                        currentRunLength={hllDetails.currentRunLength}
                        lastRunLength={hllDetails.lastRunLength}
                        selectedBucket={hllDetails.selectedBucket}
                        wasAdded={hllDetails.wasAdded}
                        isSingleIP={hllDetails.isSingleIP}
                    />
                    {/* Buckets Display - Responsive scroll area */}
                    <Card className="p-2">
                        <CardHeader>
                            <CardTitle className="text-base md:text-lg">
                                Buckets
                            </CardTitle>
                            <CardDescription className="text-xs">
                                This HyperLogLog uses {Math.pow(2, bucketCount)}{' '}
                                buckets to estimate unique count.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[150px] rounded-md border-primary-foreground">
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 xl:gap-4 sm:gap-1">
                                    {hll.buckets.map(
                                        (
                                            maxRunLength: number,
                                            index: number
                                        ) => (
                                            <Card
                                                key={index}
                                                ref={(el) => {
                                                    bucketRefs.current[index] =
                                                        el as HTMLDivElement
                                                }}
                                                className={cn(
                                                    'transition-all duration-1000 w-20 h-20',
                                                    index ===
                                                        hll.lastAddedBucket
                                                        ? 'scale-110 ring-2 ring-primary bg-blue-500 animate-pulse'
                                                        : ''
                                                )}
                                            >
                                                <CardHeader className="p-2">
                                                    <CardTitle className="text-sm">
                                                        {maxRunLength}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs">
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
                    {/* Metrics Cards - Responsive grid layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        <CardWithText
                            title={getFormattedNumber(uniqueSet.size)}
                            subtitle={'Actual Count'}
                            description="Actual number of unique IPs as counted by a Set"
                            icon={<CheckCheck className="size-6" />}
                        />

                        <CardWithText
                            title={getFormattedNumber(
                                hll.estimateCardinality()
                            )}
                            subtitle={'Estimated Count'}
                            description={`Estimated number of unique IPs as counted by HyperLogLog.`}
                            icon={<Dices className="size-6" />}
                        />

                        <CardWithText
                            title={getFormattedNumber(
                                hll.getDelta(uniqueSet.size)
                            )}
                            subtitle={'Difference'}
                            description={`Difference between actual and estimated count.`}
                            icon={<Triangle className="size-6" />}
                        />

                        <CardWithText
                            title={`${Math.round(hll.stdError * 100)}%`}
                            subtitle={'Margin of error'}
                            description={`The estimated count should be within ± ${Math.round(hll.stdError * 100)}% of the actual count.`}
                            icon={<Diff className="size-6" />}
                        />

                        <CardWithText
                            title={`${hll.getErrorPercentage(uniqueSet.size)}%`}
                            subtitle={'Actual error'}
                            description={`Percentage by which the estimated count is off from the actual count.`}
                            icon={<Ban className="size-6" />}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default HyperLogLogDemo
