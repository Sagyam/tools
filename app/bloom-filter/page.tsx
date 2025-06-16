'use client'

import { AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Trash2, TriangleAlert } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'

// Type definitions
interface BloomFilterParams {
    size?: number
    hashFunctions?: number
}

class BloomFilter {
    private readonly size: number
    private readonly hashFunctions: number
    private readonly bitArray: boolean[]

    constructor({ size = 40, hashFunctions = 5 }: BloomFilterParams = {}) {
        this.size = size
        this.hashFunctions = hashFunctions
        this.bitArray = new Array(size).fill(false)
    }

    // Method to add an item with type safety
    public add(item: string): void {
        for (let i = 0; i < this.hashFunctions; i++) {
            const hash = this._hash(item, i)
            this.bitArray[hash] = true
        }
    }

    // Method to check if an item might be in the filter
    public mightContain(item: string): boolean {
        for (let i = 0; i < this.hashFunctions; i++) {
            const hash = this._hash(item, i)
            if (!this.bitArray[hash]) {
                return false
            }
        }
        return true
    }

    // Calculate false positive probability
    public calculateFalseProbability(numInsertedItems: number): number {
        const m = this.size // Total bits in array
        const k = this.hashFunctions // Number of hash functions
        // Number of inserted items
        // p = (1 - e^(-k*n/m))^k
        const falseProbability = Math.pow(
            1 - Math.exp((-k * numInsertedItems) / m),
            k
        )

        return falseProbability * 100
    }

    // Getter for bit array
    public getBitArray(): boolean[] {
        return [...this.bitArray]
    }

    // Hash functions with explicit return type
    private _hash(item: string, salt: number): number {
        let hash = 0
        for (let i = 0; i < item.length; i++) {
            hash = (hash * (salt + 31) + item.charCodeAt(i)) % this.size
        }
        return hash
    }
}

const BloomFilterDemo: React.FC = () => {
    const [filterSize, setFilterSize] = useState<number>(30)
    const [hashFunctions, setHashFunctions] = useState<number>(3)

    const [bloomFilter, setBloomFilter] = useState<BloomFilter>(
        new BloomFilter({ size: filterSize, hashFunctions })
    )
    const [input, setInput] = useState<string>('')
    const [addedItems, setAddedItems] = useState<string[]>([
        '42',
        '69',
        '420',
        '1337',
        '80085',
    ])
    const [checkItem, setCheckItem] = useState<string>('')
    const [bitArray, setBitArray] = useState<boolean[]>(
        bloomFilter.getBitArray()
    )
    const [checkResult, setCheckResult] = useState<boolean | null>(null)
    const [falseProbability, setFalseProbability] = useState<number>(0)

    // Recreate Bloom Filter when size or hash functions change
    const recreateBloomFilter = useCallback(
        (newSize?: number, newHashFunctions?: number) => {
            const size = newSize ?? filterSize
            const functions = newHashFunctions ?? hashFunctions

            const newBloomFilter = new BloomFilter({
                size,
                hashFunctions: functions,
            })

            // Re-add existing items
            addedItems.forEach((item) => newBloomFilter.add(item))

            setBloomFilter(newBloomFilter)
            setBitArray(newBloomFilter.getBitArray())

            // Recalculate false probability
            const newFalseProbability =
                newBloomFilter.calculateFalseProbability(addedItems.length)
            setFalseProbability(newFalseProbability)
        },

        [addedItems, filterSize, hashFunctions]
    )

    useEffect(() => {
        recreateBloomFilter()
    }, [])

    const handleAddItem = useCallback(() => {
        if (input.trim()) {
            const newBloomFilter = new BloomFilter({
                size: filterSize,
                hashFunctions,
            })

            // Add previously added items
            ;[...addedItems, input].forEach((item) => newBloomFilter.add(item))

            setBloomFilter(newBloomFilter)
            setAddedItems((prev) => [...prev, input])
            setInput('')
            setBitArray(newBloomFilter.getBitArray())

            // Recalculate false probability
            const newFalseProbability =
                newBloomFilter.calculateFalseProbability(addedItems.length + 1)
            setFalseProbability(newFalseProbability)
        }
    }, [input, addedItems, filterSize, hashFunctions])

    const handleCheckItem = useCallback(() => {
        const result = bloomFilter.mightContain(checkItem)
        setCheckResult(result)
    }, [bloomFilter, checkItem])

    const handleClearAll = () => {
        const newBloomFilter = new BloomFilter({
            size: filterSize,
            hashFunctions,
        })
        setBloomFilter(newBloomFilter)
        setAddedItems([])
        setBitArray(newBloomFilter.getBitArray())
        setCheckResult(null)
        setFalseProbability(0)
        setInput('')
        setCheckItem('')
    }

    const getConfidenceColor = () => {
        if (falseProbability === 0) return 'bg-gray-100 dark:bg-gray-800'
        if (falseProbability < 1)
            return 'bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800'
        if (falseProbability < 5)
            return 'bg-yellow-100 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800'
        return 'bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800'
    }

    return (
        <Card className="container mx-auto p-4 space-y-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Bloom Filter Demonstration</CardTitle>
                <Button
                    variant={'destructive'}
                    size="sm"
                    onClick={handleClearAll}
                    className="bg-red-500 hover:bg-red-600 text-white"
                >
                    <Trash2 className="h-4 w-4" /> Clear All
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Filter Configuration Sliders */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Filter Size: {filterSize}</Label>
                            <Input
                                type="number"
                                value={filterSize}
                                onChange={(e) => {
                                    const newSize = parseInt(e.target.value, 10)
                                    if (!isNaN(newSize) && newSize > 0) {
                                        setFilterSize(newSize)
                                        recreateBloomFilter(newSize)
                                    }
                                }}
                                className="w-full"
                                placeholder="Enter filter size"
                                min={10}
                                max={100}
                                step={1}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hash Functions: {hashFunctions}</Label>
                            {/* <Slider */}
                            {/*     defaultValue={[hashFunctions]} */}
                            {/*     min={1} */}
                            {/*     max={10} */}
                            {/*     step={1} */}
                            {/*     onValueChange={(value) => { */}
                            {/*         setHashFunctions(value[0]) */}
                            {/*         recreateBloomFilter(undefined, value[0]) */}
                            {/*     }} */}
                            {/* /> */}
                            <Input
                                type="number"
                                value={hashFunctions}
                                onChange={(e) => {
                                    const newHashFunctions = parseInt(
                                        e.target.value,
                                        10
                                    )
                                    if (
                                        !isNaN(newHashFunctions) &&
                                        newHashFunctions > 0
                                    ) {
                                        setHashFunctions(newHashFunctions)
                                        recreateBloomFilter(
                                            undefined,
                                            newHashFunctions
                                        )
                                    }
                                }}
                                className="w-full"
                                placeholder="Enter number of hash functions"
                                min={1}
                                max={10}
                                step={1}
                            />
                        </div>
                    </div>
                    {/* Add Item Section */}
                    <div className="flex space-x-2">
                        <Input
                            placeholder="Enter item to add to Bloom Filter"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="grow"
                        />
                        <Button
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={handleAddItem}
                        >
                            Add Item
                        </Button>
                    </div>

                    {/* Added Items Display */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">
                            Added Items:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {addedItems.map((item, index) => (
                                <span
                                    key={index}
                                    className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium border border-blue-300 dark:border-blue-600 flex items-center space-x-2"
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                    {/* Bit Array Visualization */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2">
                            Bloom Filter Bit Array:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {bitArray.map((bit, index) => (
                                <div
                                    key={index}
                                    className={`w-6 h-6 rounded flex items-center justify-center border ${
                                        bit
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700'
                                    }`}
                                >
                                    {bit ? '1' : '0'}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Check Item Section */}
                    <div className="flex space-x-2">
                        <Input
                            placeholder="Enter item to check"
                            value={checkItem}
                            onChange={(e) => setCheckItem(e.target.value)}
                            className="grow"
                        />
                        <Button
                            className="bg-purple-500 hover:bg-purple-600 text-white"
                            onClick={handleCheckItem}
                        >
                            Check Item
                        </Button>
                    </div>

                    {/* Check Result and False Probability */}
                    {checkResult !== null && (
                        <div
                            className={`p-4 rounded-lg border ${getConfidenceColor()}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {checkResult ? (
                                        <TriangleAlert className="h-4 w-4 text-amber-500" />
                                    ) : (
                                        <Check className="h-4 w-4 text-green-600" />
                                    )}
                                    <span className="font-semibold text-lg">
                                        {checkResult
                                            ? 'It maybe present'
                                            : 'Definitely not present'}
                                    </span>
                                </div>
                            </div>
                            <AlertDescription className="mt-2 text-md">
                                {falseProbability > 1 &&
                                    checkResult &&
                                    `There is a ${falseProbability.toFixed(1)}% chance I could be wrong. `}
                            </AlertDescription>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default BloomFilterDemo
