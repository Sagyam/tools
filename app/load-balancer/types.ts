export interface Request {
    id: number
    clientIndex: number
    serverIndex: number
    color: string
    phase: 'toLB' | 'toServer' | 'waiting' | 'processing'
    weight: number
    arrivalTime?: number
    processingTime?: number
    completionTime?: number
}

export interface Client {
    name: string
    rate: number
}

export interface ServerMetrics {
    turnaroundTimes: number[]
    droppedRequests: number
    queueLengthHistory: number[]
    totalProcessed: number
}

export interface ServerState {
    name: string
    cores: number
    usedCores: number
    drops: number
    queue: Request[]
    metrics: ServerMetrics
}

export interface AggregatedMetrics {
    avgTurnaroundTime: number
    totalDroppedRequests: number
    avgQueueLength: number
    totalProcessedRequests: number
}

export interface SystemMetrics {
    turnaroundTimes: Record<string, number[]>
    droppedRequests: Record<string, number>
    queueLengths: Record<string, number[]>
    totalProcessed: Record<string, number>
    aggregated: AggregatedMetrics
}

export type MetricsViewMode = 'aggregate' | 'serverWise'
