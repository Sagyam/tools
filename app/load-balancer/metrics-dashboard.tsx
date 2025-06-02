'use client'

import type { SystemMetrics } from '@/app/load-balancer/types'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type React from 'react'
import { useEffect, useState } from 'react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

interface MetricsDashboardProps {
    metrics: SystemMetrics
}

// Sample data to ensure charts render initially
const sampleTimeData = [
    { time: '0s', value: 500 },
    { time: '3s', value: 700 },
    { time: '6s', value: 900 },
]

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
    metrics,
}) => {
    const [activeTab, setActiveTab] = useState('turnaround')
    const [selectedServer, setSelectedServer] = useState('aggregate')
    const [chartData, setChartData] = useState(sampleTimeData)
    const [timeSeriesData, setTimeSeriesData] = useState<Record<string, any[]>>(
        {
            'Server 1': [],
            'Server 2': [],
            'Server 3': [],
            aggregate: [],
        }
    )

    // Update time series data every 3 seconds
    useEffect(() => {
        const updateTimeSeriesData = () => {
            const currentTime = new Date()
            const timeLabel = `${currentTime.getMinutes()}:${currentTime.getSeconds()}`

            const newTimeSeriesData = { ...timeSeriesData }

            // Add data points for each server
            Object.keys(metrics.turnaroundTimes || {}).forEach((serverName) => {
                if (!newTimeSeriesData[serverName]) {
                    newTimeSeriesData[serverName] = []
                }

                let value = 0
                if (activeTab === 'turnaround') {
                    const times = metrics.turnaroundTimes[serverName] || []
                    value = times.length > 0 ? times[times.length - 1] || 0 : 0
                } else if (activeTab === 'dropped') {
                    value = metrics.droppedRequests[serverName] || 0
                } else if (activeTab === 'queue') {
                    const lengths = metrics.queueLengths[serverName] || []
                    value =
                        lengths.length > 0
                            ? lengths[lengths.length - 1] || 0
                            : 0
                }

                newTimeSeriesData[serverName].push({
                    time: timeLabel,
                    value,
                })

                // Keep only the last 10 data points
                if (newTimeSeriesData[serverName].length > 10) {
                    newTimeSeriesData[serverName].shift()
                }
            })

            // Add aggregate data point
            if (!newTimeSeriesData.aggregate) {
                newTimeSeriesData.aggregate = []
            }

            let aggregateValue = 0
            if (activeTab === 'turnaround') {
                aggregateValue = metrics.aggregated?.avgTurnaroundTime || 0
            } else if (activeTab === 'dropped') {
                aggregateValue = metrics.aggregated?.totalDroppedRequests || 0
            } else if (activeTab === 'queue') {
                aggregateValue = metrics.aggregated?.avgQueueLength || 0
            }

            newTimeSeriesData.aggregate.push({
                time: timeLabel,
                value: aggregateValue,
            })

            // Keep only the last 10 data points
            if (newTimeSeriesData.aggregate.length > 10) {
                newTimeSeriesData.aggregate.shift()
            }

            setTimeSeriesData(newTimeSeriesData)
        }

        // Initial update
        updateTimeSeriesData()

        // Set up interval for updates
        const intervalId = setInterval(updateTimeSeriesData, 3000)

        return () => clearInterval(intervalId)
    }, [metrics, activeTab])

    // Update chart data when time series data or selected server changes
    useEffect(() => {
        const data = timeSeriesData[selectedServer] || sampleTimeData
        setChartData(data.length > 0 ? data : sampleTimeData)
    }, [timeSeriesData, selectedServer])

    // Get the title and description for the active tab
    const getCardInfo = () => {
        switch (activeTab) {
            case 'turnaround':
                return {
                    title: 'Turnaround Time',
                    description:
                        selectedServer !== 'aggregate'
                            ? `Time (ms) from request arrival to completion for ${selectedServer}`
                            : 'System-wide average turnaround time (ms)',
                }
            case 'dropped':
                return {
                    title: 'Dropped Requests',
                    description:
                        selectedServer !== 'aggregate'
                            ? `Number of requests dropped by ${selectedServer}`
                            : 'Total number of dropped requests across all servers',
                }
            case 'queue':
                return {
                    title: 'Queue Length',
                    description:
                        selectedServer !== 'aggregate'
                            ? `Number of requests waiting in queue for ${selectedServer}`
                            : 'System-wide average queue length',
                }
            default:
                return {
                    title: 'Metrics',
                    description: 'System performance metrics',
                }
        }
    }

    const cardInfo = getCardInfo()
    const getBarFill = () => {
        switch (activeTab) {
            case 'turnaround':
                return '#3b82f6' // blue
            case 'dropped':
                return '#ef4444' // red
            case 'queue':
                return '#10b981' // green
            default:
                return '#3b82f6'
        }
    }

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{cardInfo.title}</CardTitle>
                    <CardDescription>{cardInfo.description}</CardDescription>
                </div>
                <Select
                    value={selectedServer}
                    onValueChange={setSelectedServer}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Server" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Server 1">Server 1</SelectItem>
                        <SelectItem value="Server 2">Server 2</SelectItem>
                        <SelectItem value="Server 3">Server 3</SelectItem>
                        <SelectItem value="aggregate">Aggregate</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <Tabs
                    defaultValue="turnaround"
                    value={activeTab}
                    onValueChange={setActiveTab}
                >
                    <TabsList className="mb-4">
                        <TabsTrigger value="turnaround">
                            Turnaround Time
                        </TabsTrigger>
                        <TabsTrigger value="dropped">
                            Dropped Requests
                        </TabsTrigger>
                        <TabsTrigger value="queue">Queue Length</TabsTrigger>
                    </TabsList>
                    <TabsContent value={activeTab} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="time"
                                    label={{
                                        value: 'Time',
                                        position: 'insideBottomRight',
                                        offset: -5,
                                    }}
                                />
                                <YAxis
                                    label={{
                                        value:
                                            activeTab === 'turnaround'
                                                ? 'Time (ms)'
                                                : activeTab === 'dropped'
                                                  ? 'Count'
                                                  : 'Length',
                                        angle: -90,
                                        position: 'insideLeft',
                                    }}
                                />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="value"
                                    name={
                                        activeTab === 'turnaround'
                                            ? 'Time (ms)'
                                            : activeTab === 'dropped'
                                              ? 'Count'
                                              : 'Length'
                                    }
                                    fill={getBarFill()}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
