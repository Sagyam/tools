import { SimulationMetrics } from '@/app/load-balancer/types'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'
import React from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

export interface LoadBalancerProps {
    metrics: SimulationMetrics
}

const LoadBalancerGraphs: React.FC<LoadBalancerProps> = ({ metrics }) => {
    // Define chart configuration with contrasting colors
    const chartConfig = {
        requestsServed: {
            label: 'Requests Served',
            color: 'hsl(var(--chart-1))', // Blue
        },
        requestsDropped: {
            label: 'Requests Dropped',
            color: 'hsl(var(--chart-2))', // Orange/Red
        },
        avgTurnAroundTime: {
            label: 'Avg Turn Around Time',
            color: 'hsl(var(--chart-3))', // Green
        },
    } satisfies ChartConfig

    // State for active chart
    const [activeChart, setActiveChart] =
        React.useState<keyof typeof chartConfig>('requestsServed')

    // Calculate averages for each metric
    const averages = React.useMemo(
        () => ({
            requestsServed: metrics.requestsServed.reduce(
                (sum, metric) => sum + metric.value,
                0
            ),

            requestsDropped: metrics.requestsDropped.reduce(
                (sum, metric) => sum + metric.value,
                0
            ),

            avgTurnAroundTime: metrics.avgTurnAroundTime.reduce(
                (sum, metric) => sum + metric.value,
                0
            ),
        }),
        [metrics]
    )

    return (
        <Card>
            <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
                    <CardTitle>Load Balancer Performance</CardTitle>
                    <CardDescription>
                        Metrics from load balancer simulation
                    </CardDescription>
                </div>
                <div className="flex">
                    {(
                        Object.keys(chartConfig) as Array<
                            keyof typeof chartConfig
                        >
                    ).map((key) => (
                        <button
                            key={key}
                            data-active={activeChart === key}
                            className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                            onClick={() => setActiveChart(key)}
                        >
                            <span className="text-xs text-muted-foreground">
                                {chartConfig[key].label}
                            </span>
                            <span className="text-lg font-bold leading-none sm:text-3xl">
                                {averages[key].toLocaleString()}
                            </span>
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="px-4 sm:p-8">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <BarChart
                        accessibilityLayer
                        data={metrics[activeChart]}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={true} />
                        <XAxis
                            dataKey="time"
                            label={{
                                value: 'Time (s)',
                                position: 'insideBottom',
                                offset: 0,
                            }}
                            tickLine={true}
                            axisLine={true}
                            tickMargin={8}
                            minTickGap={32}
                        />
                        <YAxis
                            dataKey="value"
                            label={{
                                value: chartConfig[activeChart].label,
                                angle: -90,
                                position: 'outsideLeft',
                            }}
                            tickLine={true}
                            axisLine={true}
                            tickMargin={8}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-[150px]"
                                    nameKey="metric"
                                    labelKey="time"
                                    cursor={true}
                                />
                            }
                        />
                        <Bar
                            dataKey="value"
                            fill={chartConfig[activeChart].color}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

export default LoadBalancerGraphs
