import type { Client, ServerState } from '@/app/load-balancer/types'

export const initialClients: Client[] = [
    { name: 'Client A', rate: 1 },
    { name: 'Client B', rate: 1 },
    { name: 'Client C', rate: 1 },
]

export const initialServers: ServerState[] = [
    {
        name: 'Server 1',
        cores: 1,
        usedCores: 0,
        drops: 0,
        queue: [],
        metrics: {
            turnaroundTimes: [],
            droppedRequests: 0,
            queueLengthHistory: [0],
            totalProcessed: 0,
        },
    },
    {
        name: 'Server 2',
        cores: 2,
        usedCores: 0,
        drops: 0,
        queue: [],
        metrics: {
            turnaroundTimes: [],
            droppedRequests: 0,
            queueLengthHistory: [0],
            totalProcessed: 0,
        },
    },
    {
        name: 'Server 3',
        cores: 3,
        usedCores: 0,
        drops: 0,
        queue: [],
        metrics: {
            turnaroundTimes: [],
            droppedRequests: 0,
            queueLengthHistory: [0],
            totalProcessed: 0,
        },
    },
]

export const requestColors: string[] = ['#EF4444', '#3B82F6', '#10B981']

export const algorithms: Record<string, string> = {
    RR: 'Round Robin',
    WRR: 'Weighted Round Robin',
}

export const weights: number[] = [1, 2, 3]
