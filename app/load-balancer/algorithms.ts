import { initialServers, weights } from '@/app/load-balancer/data'

export const getNextServerRR = (index: number): number =>
    index % initialServers.length

export const getNextServerWRR = (count: number): number => {
    const totalWeight = weights.reduce((a, b) => a + b, 0)
    let position = count % totalWeight
    for (let i = 0; i < weights.length; i++) {
        if (position < weights[i]) return i
        position -= weights[i]
    }
    return 0
}
