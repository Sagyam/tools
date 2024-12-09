import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import React from 'react'

export interface ControlsProps {
    algorithm: string
    availableAlgorithms: string[]
    clientCount: number
    serverCount: number
    rpsVariance: number
    requestCostVariance: number
    onAlgorithmChange: (algo: string) => void
    onClientCountChange: (count: number) => void
    onServerCountChange: (count: number) => void
    onRpsVarianceChange: (rps: number) => void
    onRequestCostVarianceChange: (cost: number) => void
}

const LoadBalancerControls: React.FC<ControlsProps> = ({
    algorithm,
    availableAlgorithms,
    clientCount,
    requestCostVariance,
    serverCount,
    rpsVariance,
    onAlgorithmChange,
    onClientCountChange,
    onServerCountChange,
    onRpsVarianceChange,
    onRequestCostVarianceChange,
}) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Load Balancer Simulator</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div>
                    <label>Load Balancing Algorithm</label>
                    <Select
                        value={algorithm}
                        onValueChange={(val) => onAlgorithmChange(val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Algorithm" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableAlgorithms.map((algo: string) => (
                                <SelectItem key={algo} value={algo}>
                                    {algo}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label>Clients: {clientCount}</label>
                    <Slider
                        value={[clientCount]}
                        onValueChange={(val) => onClientCountChange(val[0])}
                        min={1}
                        max={10}
                        step={1}
                    />

                    <label>Servers: {serverCount}</label>
                    <Slider
                        value={[serverCount]}
                        onValueChange={(val) => onServerCountChange(val[0])}
                        min={1}
                        max={10}
                        step={1}
                    />
                </div>

                <div>
                    <label>Requests per second (RPS): {rpsVariance}</label>
                    <Slider
                        value={[rpsVariance]}
                        onValueChange={(val) => onRpsVarianceChange(val[0])}
                        min={1}
                        max={100}
                        step={1}
                    />
                </div>

                <div>
                    <label>Requests cost: {requestCostVariance}</label>
                    <Slider
                        value={[requestCostVariance]}
                        onValueChange={(val) =>
                            onRequestCostVarianceChange(val[0])
                        }
                        min={1}
                        max={100}
                        step={1}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

export default LoadBalancerControls
