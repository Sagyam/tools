import { syscallInfo } from '@/app/tracing/syscall-info'
import { TooltipProps } from '@/app/tracing/types'
import React from 'react'

export const DetailsTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                <h3 className="font-bold text-lg mb-2">{data.syscall}</h3>
                <p className="text-sm text-gray-600 mb-1">
                    {syscallInfo[data.syscall] || 'System call'}
                </p>
                <div className="space-y-1">
                    <p>
                        Time: {data.time} µs ({data.percentage.toFixed(2)}%)
                    </p>
                    <p>Calls: {data.calls}</p>
                    {data.errors > 0 && (
                        <p className="text-red-500">Errors: {data.errors}</p>
                    )}
                </div>
            </div>
        )
    }
    return null
}
