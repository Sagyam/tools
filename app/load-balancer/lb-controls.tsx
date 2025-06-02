'use client'

import { algorithms } from '@/app/load-balancer/data'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type React from 'react'

export interface LBControlsProps {
    algorithm: string
    setAlgorithm: (algorithm: string) => void
    speed: number
    setSpeed: (speed: number) => void
}

export const LBControls: React.FC<LBControlsProps> = ({
    algorithm,
    setAlgorithm,
    speed,
    setSpeed,
}: LBControlsProps) => {
    // Speed options from 0.25x to 2x in increments of 0.25
    const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

    return (
        <div className="flex items-center gap-4 flex-wrap">
            <Select defaultValue={algorithm}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a algorithm" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {Object.entries(algorithms).map(([key, label]) => (
                            <SelectItem
                                key={key}
                                value={key}
                                onClick={() => setAlgorithm(key)}
                            >
                                {label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-8">
                <label className="font-semibold">Speed:</label>
                <div className="flex gap-1">
                    {speedOptions.map((option) => (
                        <Button
                            key={option}
                            variant={speed === option ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSpeed(option)}
                            className="px-2 py-1 h-8"
                        >
                            {option}x
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}
