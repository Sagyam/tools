export interface Metric {
    time: number
    value: number
}

export interface SimulationMetrics {
    requestsServed: Metric[]
    requestsDropped: Metric[]
    avgTurnAroundTime: Metric[]
}

export interface Server {
    id: number
    currentConnections: number
    totalResponseTime: number
    requestsServed: number
}

export interface SimulationConfig {
    algorithm: string
    clientCount: number
    serverCount: number
    rpsVariance: number
    requestCostVariance: number
}
