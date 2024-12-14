import { x86 as MurmurHash3 } from 'murmurhash3js'

interface AddResult {
    hash?: number | string
    currentRunLength?: number
    lastRunLength?: number
    selectedBucket?: number
    wasAdded?: boolean
}

export class HyperLogLog {
    buckets: number[]
    lastAddedBucket: number | null
    m: number
    alpha: number
    stdError: number
    age: 'Immature' | 'Prime' | 'Exhausted'
    warningMessage: string
    private lastRunLength: number

    constructor(buckets: number) {
        this.m = Math.pow(2, buckets)
        this.buckets = new Array(this.m).fill(0)
        this.lastAddedBucket = null
        this.alpha = this.calculateAlpha(this.m)
        this.stdError = this.calculateStdError()
        this.age = 'Immature'
        this.warningMessage = ''
        this.lastRunLength = 0
    }

    calculateStdError(): number {
        const err = 1.04 / Math.sqrt(this.m)
        return parseFloat(err.toFixed(2))
    }

    hash(value: string) {
        return MurmurHash3.hash32(value)
    }

    // Calculate alpha for cardinality estimation
    calculateAlpha(m: number) {
        switch (m) {
            case 16:
                return 0.673
            case 32:
                return 0.697
            case 64:
                return 0.709
            default:
                return 0.7213 / (1 + 1.079 / m)
        }
    }

    // Count leading zeros
    leadingZeros(num: number): number {
        if (num === 0) return 32
        return 31 - Math.floor(Math.log2(num))
    }

    add(value: string, detailed: boolean = false): AddResult | void {
        const hashedValue = this.hash(value)
        const bucketIndex = hashedValue % this.m
        const currentRunLength = this.leadingZeros(hashedValue) + 1

        // Store the previous run length for this bucket
        const lastBucketRunLength = this.buckets[bucketIndex]
        const wasAdded = currentRunLength > lastBucketRunLength

        // Update max run length for bucket if necessary
        if (wasAdded) {
            this.buckets[bucketIndex] = currentRunLength
        }

        // Track last added bucket for UI
        this.lastAddedBucket = bucketIndex
        this.lastRunLength = lastBucketRunLength

        // If detailed mode is on, return additional information
        if (detailed) {
            return {
                hash: hashedValue,
                currentRunLength,
                selectedBucket: bucketIndex,
                wasAdded,
                lastRunLength: lastBucketRunLength,
            }
        }
    }

    estimateCardinality() {
        const sumBuckets = this.buckets.reduce(
            (sum: number, val: number) => sum + Math.pow(2, -val),
            0
        )
        const estimate = (this.alpha * this.m * this.m) / sumBuckets

        this.age = 'Prime'

        // Small range correction
        if (estimate <= 2.5 * this.m) {
            this.age = 'Immature'
            const zeroBuckets = this.buckets.filter(
                (val: number) => val === 0
            ).length
            return zeroBuckets > 0
                ? Math.round(this.m * Math.log(this.m / zeroBuckets))
                : Math.round(estimate)
        }

        // Large range correction (when estimate > 2^32 / 30)
        const threshold = Math.pow(2, 32) / 30
        if (estimate > threshold) {
            this.age = 'Exhausted'
            return Math.round(
                -Math.pow(2, 32) * Math.log(1 - estimate / Math.pow(2, 32))
            )
        }

        return Math.round(estimate)
    }

    detectOutOfBoundError(groundTruth: number) {
        const estimated = this.estimateCardinality()

        const lowerBound = groundTruth * (1 - this.stdError)
        const upperBound = groundTruth * (1 + this.stdError)

        this.warningMessage = ''

        if (estimated < lowerBound || estimated > upperBound) {
            this.warningMessage = `Estimation (${estimated}) is outside the expected range [${Math.round(
                lowerBound
            )}, ${Math.round(upperBound)}] with standard error ${this.stdError * 100}%.`
        }
    }

    getDelta(groundTruth: number): number {
        if (!groundTruth) return 0
        const estimated = this.estimateCardinality()
        return estimated - groundTruth
    }

    getErrorPercentage(groundTruth: number): string {
        if (!groundTruth) return '0 '
        const estimated = this.estimateCardinality()
        const error = (Math.abs(estimated - groundTruth) / groundTruth) * 100
        return error.toFixed(2)
    }
}
