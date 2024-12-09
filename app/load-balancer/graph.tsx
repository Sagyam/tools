import { SimulationMetrics } from '@/app/load-balancer/lb-app'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React from 'react'
import {
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

export interface LoadBalancerProps {
    metrics: SimulationMetrics
}

const LoadBalancerGraphs: React.FC<LoadBalancerProps> = ({ metrics }) => {
    return (
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
                        <Line type="monotone" dataKey="value" stroke="#fff" />
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
                        <Line type="monotone" dataKey="value" />
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
                        <Line type="monotone" dataKey="value" />
                    </LineChart>
                </ResponsiveContainer>
            </TabsContent>
        </Tabs>
    )
}

export default LoadBalancerGraphs
