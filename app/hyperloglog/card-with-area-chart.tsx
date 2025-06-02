import { getFormattedNumber } from '@/app/hyperloglog/helper'
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
    ChartTooltipContent,
} from '@/components/ui/chart'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import React from 'react'
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip as ChartTooltip,
    XAxis,
    YAxis,
} from 'recharts'

interface CardWithAreaChartProps {
    chartName: string
    subtitle: string
    tooltipDescription: string
    data: any[]
    dataLabels: string[]
    colorOverrides?: Record<string, string>
}

export const CardWitAreaChart: React.FC<CardWithAreaChartProps> = ({
    chartName,
    subtitle,
    tooltipDescription,
    data,
    dataLabels,
    colorOverrides = {},
}) => {
    // Generate chart configuration dynamically
    const chartConfig: ChartConfig = dataLabels.reduce(
        (config, label, index) => {
            config[label] = {
                label,
                color:
                    colorOverrides[label] || `var(--chart-${(index % 5) + 1})`,
            }
            return config
        },
        {} as ChartConfig
    )

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{chartName}</CardTitle>
                    <CardDescription>{subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <p>No data available</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <Card>
                        <CardHeader>
                            <CardTitle>{chartName}</CardTitle>
                            <CardDescription>{subtitle}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ChartContainer config={chartConfig}>
                                    <AreaChart
                                        accessibilityLayer
                                        data={data}
                                        margin={{
                                            top: 20,
                                            right: 20,
                                            left: 20,
                                            bottom: 20,
                                        }}
                                    >
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="index"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={getFormattedNumber}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            content={
                                                <ChartTooltipContent indicator="dashed" />
                                            }
                                        />
                                        <Legend />
                                        {dataLabels.map((label) => (
                                            <Area
                                                key={label}
                                                dataKey={label}
                                                fill={`var(--color-${label})`}
                                                fillOpacity={0.9}
                                            />
                                        ))}
                                    </AreaChart>
                                </ChartContainer>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                <TooltipContent>{tooltipDescription}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export default CardWitAreaChart
