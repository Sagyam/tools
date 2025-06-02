import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { NetworkIcon } from 'lucide-react'
import type React from 'react'

export const LB: React.FC = () => {
    return (
        <div className="flex items-center justify-center">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center justify-center w-16 h-16 bg-indigo-500 rounded-full">
                            <NetworkIcon />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>Load Balancer</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}
