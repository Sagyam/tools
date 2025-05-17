import { algorithms } from '@/app/load-balancer/data'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import React from 'react'

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
    return (
        <div className="flex items-center gap-4">
            <Select defaultValue={algorithm}>
                <SelectTrigger>
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

            <label className="font-semibold ml-8">Speed:</label>
            <div className="w-48">
                <Slider
                    min={0.5}
                    max={3}
                    step={0.1}
                    value={[speed]}
                    onValueChange={([val]: number[]) => setSpeed(val)}
                />
            </div>
        </div>
    )
}
