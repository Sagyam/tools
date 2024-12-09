'use client'

import LoadBalancerControls from '@/app/load-balancer/controls'
import LoadBalancerGraphs from '@/app/load-balancer/graph'
import '@xyflow/react/dist/style.css'
import LoadBalancerLogic from '@/app/load-balancer/lb-logic'
import LoadBalancerSimulation from '@/app/load-balancer/simualtion'
import { SimulationMetrics } from '@/app/load-balancer/types'
import React, { useCallback, useEffect, useState } from 'react'

const LOAD_BALANCING_ALGORITHMS = [
    'Round Robin',
    'Least Connections',
    'Weighted Random',
    'Least Response Time',
    'IP Hash',
]

const LoadBalancerSimulator = () => {
    const [algorithm, setAlgorithm] = useState<string>(
        LOAD_BALANCING_ALGORITHMS[0]
    )
    const [clientCount, setClientCount] = useState<number>(3)
    const [serverCount, setServerCount] = useState<number>(3)
    const [rpsVariance, setRpsVariance] = useState<number>(2)
    const [requestCostVariance, setRequestCostVariance] = useState<number>(0.1)
    const [metrics, setMetrics] = useState<SimulationMetrics>({
        requestsServed: [],
        requestsDropped: [],
        avgTurnAroundTime: [],
    })

    const runSimulation = useCallback(() => {
        const simulationConfig = {
            algorithm,
            clientCount,
            serverCount,
            rpsVariance,
            requestCostVariance,
        }

        const newMetrics = LoadBalancerLogic.simulate(simulationConfig, metrics)
        setMetrics(newMetrics)
        console.debug(newMetrics.requestsServed[0])
        console.debug(newMetrics.requestsDropped[0])
        console.debug(newMetrics.avgTurnAroundTime[0])
    }, [
        algorithm,
        clientCount,
        serverCount,
        rpsVariance,
        requestCostVariance,
        metrics,
    ])

    useEffect(() => {
        // Set up continuous simulation with interval
        const simulationInterval = setInterval(runSimulation, 100)

        // Cleanup interval on component unmount
        return () => clearInterval(simulationInterval)
    }, [runSimulation])

    return (
        <div className="max-w-5xl mx-auto my-auto flex gap-x-8">
            <div className="flex flex-col gap-4">
                <LoadBalancerControls
                    algorithm={algorithm}
                    availableAlgorithms={LOAD_BALANCING_ALGORITHMS}
                    clientCount={clientCount}
                    serverCount={serverCount}
                    rpsVariance={rpsVariance}
                    requestCostVariance={requestCostVariance}
                    onAlgorithmChange={(value) => setAlgorithm(value)}
                    onClientCountChange={(value) => setClientCount(value)}
                    onServerCountChange={(value) => setServerCount(value)}
                    onRpsVarianceChange={(value) => setRpsVariance(value)}
                    onRequestCostVarianceChange={(value) =>
                        setRequestCostVariance(value)
                    }
                />
                <LoadBalancerSimulation
                    serverCount={serverCount}
                    clientCount={clientCount}
                />
            </div>

            <LoadBalancerGraphs metrics={metrics} />
        </div>
    )
}

export default LoadBalancerSimulator
