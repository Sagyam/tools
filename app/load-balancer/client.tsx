'use client'

import { mapToScale } from '@/app/load-balancer/sever'
import type { Client } from '@/app/load-balancer/types'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    ComputerIcon,
    LaptopIcon,
    Minus,
    Plus,
    SmartphoneIcon,
} from 'lucide-react'
import type React from 'react'

export interface ClientProps {
    clients: Client[]
    onAdjustClientRate: (index: number, delta: number) => void
}

const getIcon = (idx: number) => {
    const icons = [
        <SmartphoneIcon key="smartphone" />,
        <LaptopIcon key="laptop" />,
        <ComputerIcon key="computer" />,
    ]
    return icons[idx % icons.length]
}

const getClientColor = (rate: number) => {
    switch (true) {
        case rate === 0:
            return 'bg-stone-500'
        case rate > 0 && rate <= 3:
            return 'bg-blue-500'
        case rate >= 4 && rate <= 6:
            return 'bg-emerald-500'
        case rate >= 7 && rate <= 9:
            return 'bg-lime-500'
        case rate >= 10 && rate <= 12:
            return 'bg-yellow-500'
        case rate >= 13 && rate <= 15:
            return 'bg-orange-500'
        case rate >= 16:
            return 'bg-rose-500'
    }
}

export const ClientComponent: React.FC<ClientProps> = ({
    clients,
    onAdjustClientRate,
}) => {
    return (
        <TooltipProvider>
            <div className="space-y-6 flex flex-col justify-center items-start">
                {clients.map((c, i) => (
                    <Tooltip key={c.name}>
                        <TooltipTrigger asChild>
                            <div className="flex flex-col items-center">
                                <div
                                    className={`flex items-center justify-center ring-2 ring-offset-2 w-12 h-12 z-0 rounded-full transition-all duration-300 ease-in-out
                                ${getClientColor(c.rate)}`}
                                    style={{
                                        scale: mapToScale(c.rate),
                                    }}
                                >
                                    {getIcon(i)}
                                </div>
                                <div className="flex space-x-2 mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            onAdjustClientRate(i, -1)
                                        }
                                    >
                                        <Minus />
                                    </Button>

                                    <div className="text-md">
                                        {c.rate} req/s
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onAdjustClientRate(i, 1)}
                                    >
                                        <Plus />
                                    </Button>
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-md">
                                {c.name}: {c.rate} req/s
                            </div>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    )
}
