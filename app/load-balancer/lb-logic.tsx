// Server representation
import { SimulationMetrics } from '@/app/load-balancer/lb-app'

interface Server {
    id: number
    currentConnections: number
    totalResponseTime: number
    requestsServed: number
}

// Simulation Configuration
interface SimulationConfig {
    algorithm: string
    clientCount: number
    serverCount: number
    rpsVariance: number
    requestCostVariance: number
    simulationDuration: number
}

class LoadBalancerLogic {
    private servers: Server[]
    private config: SimulationConfig

    constructor(config: SimulationConfig) {
        this.config = config
        this.servers = Array.from({ length: config.serverCount }, (_, i) => ({
            id: i,
            currentConnections: 0,
            totalResponseTime: 0,
            requestsServed: 0,
        }))
    }

    // Static method to create and run simulation
    static simulate(config: SimulationConfig): SimulationMetrics {
        const simulator = new LoadBalancerLogic(config)
        return simulator.runSimulation()
    }

    // Main simulation method
    runSimulation(): SimulationMetrics {
        const metrics: SimulationMetrics = {
            requestsServed: [],
            requestsDropped: [],
            avgTurnAroundTime: [],
        }

        let totalRequestsServed = 0
        let totalRequestsDropped = 0
        let totalTurnAroundTime = 0

        for (let time = 0; time < this.config.simulationDuration; time++) {
            // Generate requests based on Poisson-like distribution
            const requestCount = Math.round(
                this.generateGaussianRandom(
                    this.config.clientCount,
                    this.config.rpsVariance
                )
            )

            let servedRequests = 0
            let droppedRequests = 0

            // Process each request
            for (let i = 0; i < requestCount; i++) {
                // Generate request cost with variance
                const requestCost = this.generateGaussianRandom(
                    1,
                    this.config.requestCostVariance
                )

                // Select server based on algorithm
                let selectedServer: Server
                switch (this.config.algorithm) {
                    case 'Round Robin':
                        selectedServer = this.selectServerRoundRobin(time)
                        break
                    case 'Least Connections':
                        selectedServer = this.selectServerLeastConnections()
                        break
                    case 'Weighted Random':
                        selectedServer = this.selectServerWeightedRandom()
                        break
                    case 'Least Response Time':
                        selectedServer = this.selectServerLeastResponseTime()
                        break
                    default:
                        selectedServer = this.servers[0]
                }

                // Check if server can handle the request
                if (
                    selectedServer.currentConnections < this.config.serverCount
                ) {
                    // Process request
                    selectedServer.currentConnections++
                    selectedServer.requestsServed++
                    selectedServer.totalResponseTime += requestCost

                    // Simulate request processing
                    setTimeout(() => {
                        selectedServer.currentConnections--
                    }, requestCost * 100) // Simulated processing time

                    servedRequests++
                    totalRequestsServed++
                    totalTurnAroundTime += requestCost
                } else {
                    // Request dropped
                    droppedRequests++
                    totalRequestsDropped++
                }
            }

            // Record metrics for this time step
            metrics.requestsServed.push({
                time,
                value: servedRequests,
            })
            metrics.requestsDropped.push({
                time,
                value: droppedRequests,
            })
            metrics.avgTurnAroundTime.push({
                time,
                value: totalTurnAroundTime / (totalRequestsServed || 1),
            })
        }

        return metrics
    }

    // Gaussian random generation (same as in original component)
    private generateGaussianRandom(mean: number, stdDev: number): number {
        const u1 = Math.random()
        const u2 = Math.random()
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
        return Math.max(0, mean + z0 * stdDev)
    }

    // Load balancing algorithms
    private selectServerRoundRobin(currentTime: number): Server {
        return this.servers[currentTime % this.servers.length]
    }

    private selectServerLeastConnections(): Server {
        return this.servers.reduce((least, current) =>
            current.currentConnections < least.currentConnections
                ? current
                : least
        )
    }

    private selectServerWeightedRandom(): Server {
        const totalConnections = this.servers.reduce(
            (sum, server) => sum + server.currentConnections,
            0
        )
        const randomValue = Math.random() * totalConnections

        let cumulativeWeight = 0
        for (const server of this.servers) {
            cumulativeWeight += server.currentConnections
            if (randomValue <= cumulativeWeight) {
                return server
            }
        }

        return this.servers[0] // Fallback
    }

    private selectServerLeastResponseTime(): Server {
        return this.servers.reduce((least, current) =>
            current.totalResponseTime / (current.requestsServed || 1) <
            least.totalResponseTime / (least.requestsServed || 1)
                ? current
                : least
        )
    }
}

export default LoadBalancerLogic
