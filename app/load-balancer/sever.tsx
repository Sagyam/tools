'use client'

import type { ServerState } from '@/app/load-balancer/types'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Minus, Plus, ServerIcon } from 'lucide-react'
import React from 'react'

export interface ServerProps {
    servers: ServerState[]
    onAdjustCores: (index: number, delta: number) => void
}

export const mapToScale = (cores: number) => {
    const minScale = 0.5
    const maxScale = 1.5
    const scale = 1 / (1 + Math.exp(-0.1 * (cores - 5)))
    return minScale + (maxScale - minScale) * scale
}

export const ServerComponent: React.FC<ServerProps> = ({
    servers,
    onAdjustCores,
}) => {
    return (
        <TooltipProvider>
            <div className="space-y-6 flex flex-col justify-center items-end">
                {servers.map((s, i) => {
                    const utilizationPercent =
                        s.cores > 0 ? (s.usedCores / s.cores) * 100 : 0

                    return (
                        <Tooltip key={s.name}>
                            <TooltipTrigger asChild>
                                <div className="flex flex-col items-center">
                                    <div
                                        className="relative flex items-center justify-center ring-2 ring-offset-2 w-12 h-12 z-0 rounded-full transition-all duration-300 ease-in-out"
                                        style={{
                                            scale: mapToScale(s.cores),
                                        }}
                                    >
                                        {/* CPU utilization fill */}
                                        <div
                                            className="absolute bottom-0 left-0 right-0 rounded-full overflow-clip transition-all duration-300 ease-in-out bg-rose-500"
                                            style={{
                                                height: `${utilizationPercent}%`,
                                            }}
                                        />

                                        {/* Server icon */}
                                        <ServerIcon className="relative z-10" />
                                    </div>
                                    <div className="flex space-x-3 mt-1 z-10">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onAdjustCores(i, -1)}
                                        >
                                            <Minus />
                                        </Button>

                                        <div className="text-md">
                                            {s.cores} cores
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onAdjustCores(i, 1)}
                                        >
                                            <Plus />
                                        </Button>
                                    </div>
                                    <div className="mt-1 text-xs">
                                        <span className="font-semibold">
                                            Used:{' '}
                                        </span>
                                        {s.usedCores}/{s.cores}
                                        <span className="ml-2 font-semibold">
                                            Queue:{' '}
                                        </span>
                                        {s.queue.length}
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div>
                                    <div>{s.name}</div>
                                    <div>
                                        Cores: {s.usedCores}/{s.cores}
                                    </div>
                                    <div>Queue: {s.queue.length}</div>
                                    <div>
                                        Utilization:{' '}
                                        {Math.round(utilizationPercent)}%
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </div>
        </TooltipProvider>
    )
}
