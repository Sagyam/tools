import { ServerState } from '@/app/load-balancer/types'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip'
import { Minus, Plus, Server as ServerIcon } from 'lucide-react'
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

export const getServerColor = (used: number, total: number) => {
    const ratio = used / total
    switch (true) {
        case ratio === 0:
            return 'bg-stone-500'
        case ratio > 0 && ratio <= 3:
            return 'bg-blue-500'
        case ratio >= 4 && ratio <= 6:
            return 'bg-emerald-500'
        case ratio >= 7 && ratio <= 9:
            return 'bg-lime-500'
        case ratio >= 10 && ratio <= 12:
            return 'bg-yellow-500'
        case ratio >= 13 && ratio <= 15:
            return 'bg-orange-500'
        case ratio >= 16:
            return 'bg-rose-500'
    }
}

export const ServerComponent: React.FC<ServerProps> = ({
    servers,
    onAdjustCores,
}) => {
    return (
        <div className="space-y-6 flex flex-col justify-center items-end">
            {servers.map((s, i) => (
                <Tooltip key={s.name}>
                    <TooltipTrigger asChild>
                        <div className="flex flex-col items-center">
                            <div
                                className={`flex items-center justify-center ring-2 ring-offset-2 w-12 h-12 z-0 rounded-full transition-all duration-300 ease-in-out
                                            ${getServerColor(s.usedCores, s.cores)}`}
                                style={{
                                    scale: mapToScale(s.cores),
                                }}
                            >
                                <ServerIcon />
                            </div>
                            <div className="flex space-x-3 mt-1 z-10">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onAdjustCores(i, -1)}
                                >
                                    <Minus />
                                </Button>

                                <div className="text-md">{s.cores} cores</div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onAdjustCores(i, 1)}
                                >
                                    <Plus />
                                </Button>
                            </div>
                        </div>
                    </TooltipTrigger>
                </Tooltip>
            ))}
        </div>
    )
}
