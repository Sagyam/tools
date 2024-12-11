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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import React from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList } from 'recharts'

export interface TextCardProps {
    title: string
    subtitle: string
    description: string
    icon?: React.ReactNode
    extraStyle?: string
}

export const CardWithText: React.FC<TextCardProps> = ({
    title,
    subtitle,
    description,
    icon,
    extraStyle,
}) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <Card className={`py-4 ${extraStyle}`}>
                        <CardContent className="flex flex-row content-start justify-between font-bold">
                            {subtitle}
                            {icon}
                        </CardContent>
                        <CardHeader>
                            <CardTitle className="text-6xl overflow-hidden">
                                {title}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </TooltipTrigger>
                <TooltipContent>{description}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

export interface CardWithBarGraphProps {
    title: string
    subtitle: string
    chartData: number[]
}

export const CardWithBarGraph: React.FC<CardWithBarGraphProps> = ({
    title,
    subtitle,
    chartData,
}) => {
    const chartConfig = {
        desktop: {
            label: title,
            color: 'hsl(var(--chart-1))',
        },
    } satisfies ChartConfig

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent hideLabel hideIndicator />
                            }
                        />
                        <Bar dataKey="visitors">
                            <LabelList
                                position="top"
                                dataKey="month"
                                fillOpacity={1}
                            />
                            {chartData.map((item) => (
                                <Cell
                                    key={item.month}
                                    fill={
                                        item.visitors > 0
                                            ? 'hsl(var(--chart-1))'
                                            : 'hsl(var(--chart-2))'
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
