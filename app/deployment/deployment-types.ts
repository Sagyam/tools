// Type definitions
export interface Instance {
    id: number
    version: string
    status: 'healthy' | 'unhealthy' | 'terminating' | 'shadow'
    traffic: number
}

export interface Metrics {
    errorRate: number
    responseTime: number
}

export interface Config {
    totalInstances: number
    batchSize: number
    canaryPercentage: number
    buggyVersion: boolean
    errorThreshold: number
    rollbackEnabled: boolean
    autoPromote: boolean
    deploymentSpeed: number
    manualTrafficSplit?: number
}

export interface Log {
    id: number
    timestamp: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error' | 'deployment'
    icon: string
    color: string
}

export type Strategy =
    | 'rolling'
    | 'bluegreen'
    | 'canary'
    | 'ab'
    | 'shadow'
    | 'ramped'
    | 'recreate'

export interface StrategyInfo {
    id: Strategy
    name: string
    icon: string
}
