import { DetailsTooltip } from '@/app/tracing/details-tooltip'
import { BarDetailsProps } from '@/app/tracing/types'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Info } from 'lucide-react'
import React from 'react'
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

export const BarDetails: React.FC<BarDetailsProps> = ({
    programName,
    totalExecutionTime,
    data,
}) => {
    return (
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{programName} Syscall Profile</CardTitle>
                        <CardDescription>
                            Total execution time: {totalExecutionTime}{' '}
                            microseconds
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Info size={16} />
                        <span>Hover over bars for details</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 50,
                            }}
                        >
                            <XAxis
                                dataKey="syscall"
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis
                                yAxisId="time"
                                label={{
                                    value: 'Execution Time (µs)',
                                    angle: -90,
                                    position: 'insideLeft',
                                }}
                            />
                            <YAxis
                                yAxisId="calls"
                                orientation="right"
                                label={{
                                    value: 'Number of Calls',
                                    angle: 90,
                                    position: 'insideRight',
                                }}
                            />
                            <Tooltip content={<DetailsTooltip />} />
                            <Bar
                                yAxisId="time"
                                dataKey="time"
                                fill="#2563eb"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                yAxisId="calls"
                                dataKey="calls"
                                fill="#60a5fa"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
