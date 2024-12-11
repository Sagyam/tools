import { x86 as MurmurHash3 } from 'murmurhash3js'

export class HyperLogLog {
    buckets: number[]
    lastAddedBucket: number
    m: number
    alpha: number
    stdError: number
    warningMessage: string

    constructor(buckets: number) {
        this.m = Math.pow(2, buckets)
        this.buckets = new Array(this.m).fill(0)
        this.lastAddedBucket = -1
        this.alpha = this.calculateAlpha(this.m)
        this.stdError = this.calculateStdError()
        this.warningMessage = ''
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

    add(value: string) {
        const hashedValue = this.hash(value)
        const bucketIndex = hashedValue % this.m
        const runLength = this.leadingZeros(hashedValue)

        // Update max run length for bucket
        this.buckets[bucketIndex] = Math.max(
            this.buckets[bucketIndex],
            runLength + 1
        )

        // Track last added bucket for UI
        this.lastAddedBucket = bucketIndex
    }

    estimateCardinality() {
        const sumBuckets = this.buckets.reduce(
            (sum: number, val: number) => sum + Math.pow(2, -val),
            0
        )
        const estimate = (this.alpha * this.m * this.m) / sumBuckets

        // Small range correction
        if (estimate <= 2.5 * this.m) {
            const zeroBuckets = this.buckets.filter(
                (val: number) => val === 0
            ).length
            return zeroBuckets > 0
                ? Math.round(this.m * Math.log(this.m / zeroBuckets))
                : Math.round(estimate)
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

    calculateDelta(groundTruth: number): number {
        if (!groundTruth) return 0
        const estimated = this.estimateCardinality()
        return estimated - groundTruth
    }

    calculateErrorPercentage(groundTruth: number): string {
        if (!groundTruth) return '0 '
        const estimated = this.estimateCardinality()
        const error = (Math.abs(estimated - groundTruth) / groundTruth) * 100
        return error.toFixed(2)
    }
}
