'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Background, Controls, MiniMap, ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import React, { useCallback, useMemo, useState } from 'react'
import {
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

// Load Balancing Algorithms
const LOAD_BALANCING_ALGORITHMS = [
    'Round Robin',
    'Least Connections',
    'Weighted Random',
    'Least Response Time',
]

// Gaussian (Normal) Distribution Generator
const generateGaussianRandom = (mean: number, stdDev: number) => {
    const u1 = Math.random()
    const u2 = Math.random()

    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)

    return mean + z0 * stdDev
}

// Load Balancer Simulator Component
const LoadBalancerSimulator = () => {
    // Simulation Configuration State
    const [algorithm, setAlgorithm] = useState(LOAD_BALANCING_ALGORITHMS[0])
    const [clientCount, setClientCount] = useState(3)
    const [serverCount, setServerCount] = useState(3)
    const [rps, setRps] = useState(10)
    const [rpsVariance, setRpsVariance] = useState(2)
    const [requestCostVariance, setRequestCostVariance] = useState(0.5)
    const [serverPowerVariance, setServerPowerVariance] = useState(0.5)

    // Metrics State
    const [metrics, setMetrics] = useState({
        requestsServed: [],
        requestsDropped: [],
        avgTurnAroundTime: [],
    })

    // Simulation Runner
    const runSimulation = useCallback(() => {
        const newMetrics = {
            requestsServed: [],
            requestsDropped: [],
            avgTurnAroundTime: [],
        }

        // Simulate load balancing logic here
        for (let i = 0; i < 10; i++) {
            // Placeholder simulation logic
            const served = generateGaussianRandom(rps, rpsVariance)
            const dropped = Math.max(
                0,
                generateGaussianRandom(0, rpsVariance / 2)
            )
            const turnAround = generateGaussianRandom(
                100,
                requestCostVariance * 20
            )

            newMetrics.requestsServed.push({ time: i, value: served })
            newMetrics.requestsDropped.push({ time: i, value: dropped })
            newMetrics.avgTurnAroundTime.push({ time: i, value: turnAround })
        }

        setMetrics(newMetrics)
    }, [rps, rpsVariance, requestCostVariance])

    // React Flow Nodes
    const nodes = useMemo(() => {
        const clientNodes = Array.from({ length: clientCount }, (_, i) => ({
            id: `client-${i}`,
            type: 'default',
            position: { x: 100, y: 100 * (i + 1) },
            data: { label: `Client ${i + 1}` },
        }))

        const loadBalancerNode = {
            id: 'load-balancer',
            type: 'default',
            position: { x: 300, y: 250 },
            data: { label: 'Load Balancer' },
        }

        const serverNodes = Array.from({ length: serverCount }, (_, i) => ({
            id: `server-${i}`,
            type: 'default',
            position: { x: 500, y: 100 * (i + 1) },
            data: { label: `Server ${i + 1}` },
        }))

        return [...clientNodes, loadBalancerNode, ...serverNodes]
    }, [clientCount, serverCount])

    const edges = useMemo(() => {
        const clientEdges = nodes
            .filter((node) => node.id.startsWith('client'))
            .map((clientNode) => ({
                id: `${clientNode.id}-to-lb`,
                source: clientNode.id,
                target: 'load-balancer',
            }))

        const lbToServerEdges = nodes
            .filter((node) => node.id.startsWith('server'))
            .map((serverNode) => ({
                id: `lb-to-${serverNode.id}`,
                source: 'load-balancer',
                target: serverNode.id,
            }))

        return [...clientEdges, ...lbToServerEdges]
    }, [nodes])

    return (
        <div className="max-w-4xl mx-auto my-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Load Balancer Simulator</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                        <label>Load Balancing Algorithm</label>
                        <Select value={algorithm} onValueChange={setAlgorithm}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Algorithm" />
                            </SelectTrigger>
                            <SelectContent>
                                {LOAD_BALANCING_ALGORITHMS.map((algo) => (
                                    <SelectItem key={algo} value={algo}>
                                        {algo}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label>Clients: {clientCount}</label>
                        <Slider
                            value={[clientCount]}
                            onValueChange={(val) => setClientCount(val[0])}
                            min={1}
                            max={10}
                            step={1}
                        />

                        <label>Servers: {serverCount}</label>
                        <Slider
                            value={[serverCount]}
                            onValueChange={(val) => setServerCount(val[0])}
                            min={1}
                            max={10}
                            step={1}
                        />
                    </div>

                    <div>
                        <label>Requests Per Second (RPS): {rps}</label>
                        <Slider
                            value={[rps]}
                            onValueChange={(val) => setRps(val[0])}
                            min={1}
                            max={100}
                            step={1}
                        />
                    </div>

                    <div>
                        <button
                            className="bg-blue-500 text-white p-2 rounded"
                            onClick={runSimulation}
                        >
                            Run Simulation
                        </button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Simulation Flow</CardTitle>
                </CardHeader>
                <CardContent>
                    <div style={{ height: '400px' }}>
                        <ReactFlow
                            colorMode="system"
                            nodes={nodes}
                            edges={edges}
                            fitView
                        >
                            <Background />
                            <Controls />
                            <MiniMap />
                        </ReactFlow>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="requestsServed">
                <TabsList>
                    <TabsTrigger value="requestsServed">
                        Requests Served
                    </TabsTrigger>
                    <TabsTrigger value="requestsDropped">
                        Requests Dropped
                    </TabsTrigger>
                    <TabsTrigger value="avgTurnAroundTime">
                        Avg Turn Around Time
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="requestsServed">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={metrics.requestsServed}>
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#8884d8"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="requestsDropped">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={metrics.requestsDropped}>
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#82ca9d"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="avgTurnAroundTime">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={metrics.avgTurnAroundTime}>
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#ffc658"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default LoadBalancerSimulator
