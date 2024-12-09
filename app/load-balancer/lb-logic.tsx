import random from 'random'
import { Server, SimulationConfig, SimulationMetrics } from './types'

class LoadBalancerLogic {
    private readonly servers: Server[]
    private config: SimulationConfig
    private time: number = 0

    constructor(config: SimulationConfig) {
        this.config = config
        this.servers = Array.from({ length: config.serverCount }, (_, i) => ({
            id: i,
            currentConnections: 0,
            totalResponseTime: 0,
            requestsServed: 0,
        }))
    }

    // Static method to create and run simulation step
    static simulate(
        config: SimulationConfig,
        previousMetrics?: SimulationMetrics
    ): SimulationMetrics {
        const simulator = new LoadBalancerLogic(config)
        return simulator.runSimulationStep(previousMetrics)
    }

    // Continuous simulation step method
    runSimulationStep(previousMetrics?: SimulationMetrics): SimulationMetrics {
        const metrics: SimulationMetrics = previousMetrics || {
            requestsServed: [],
            requestsDropped: [],
            avgTurnAroundTime: [],
        }

        // Use Poisson distribution for request generation
        const requestCount = random.poisson(this.config.clientCount)()

        let servedRequests = 0
        let droppedRequests = 0
        let totalTurnAroundTime = 0
        let totalRequestsServed = metrics.requestsServed.reduce(
            (sum, metric) => sum + metric.value,
            0
        )

        // Process each request
        for (let i = 0; i < requestCount; i++) {
            // Use Normal distribution for request cost
            const requestCost = random.normal(
                100,
                this.config.requestCostVariance
            )()

            // Select server based on algorithm
            let selectedServer: Server
            switch (this.config.algorithm) {
                case 'Round Robin':
                    selectedServer = this.selectServerRoundRobin(this.time)
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
            if (selectedServer.currentConnections < this.config.serverCount) {
                // Process request
                selectedServer.currentConnections++
                selectedServer.requestsServed++
                selectedServer.totalResponseTime += requestCost

                // Simulate request processing
                setTimeout(() => {
                    selectedServer.currentConnections--
                }, requestCost * 100)

                servedRequests++
                totalRequestsServed++
                totalTurnAroundTime += requestCost
            } else {
                // Request dropped
                droppedRequests++
            }
        }

        // Manage metrics array size (keep last 100)
        const updateMetricArray = (arr: { time: number; value: number }[]) => {
            arr.push({
                time: this.time,
                value:
                    arr === metrics.requestsServed
                        ? servedRequests
                        : droppedRequests,
            })
            return arr.slice(-100)
        }

        metrics.requestsServed = updateMetricArray(metrics.requestsServed)
        metrics.requestsDropped = updateMetricArray(metrics.requestsDropped)

        // Calculate and update average turn-around time
        metrics.avgTurnAroundTime.push({
            time: this.time,
            value:
                totalRequestsServed > 0
                    ? totalTurnAroundTime / totalRequestsServed
                    : 0,
        })
        metrics.avgTurnAroundTime = metrics.avgTurnAroundTime.slice(-100)

        this.time++

        return metrics
    }

    // Existing server selection methods remain the same
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

        return this.servers[0]
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
