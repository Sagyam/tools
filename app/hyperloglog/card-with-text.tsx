import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import React from 'react'

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
                            <CardTitle className="text-5xl">{title}</CardTitle>
                        </CardHeader>
                    </Card>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 text-white transition-all duration-500 ease-in-out">
                    {description}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
