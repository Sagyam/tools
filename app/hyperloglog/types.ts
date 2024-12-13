export interface HLLHistory {
    entries: {
        index: number
        trueValue: number
        estimate: number
        delta: number
        error: number
        timestamp: number
    }[]
    maxEntries?: number
}
