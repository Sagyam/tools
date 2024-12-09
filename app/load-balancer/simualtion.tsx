import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Background, Controls, MiniMap, ReactFlow } from '@xyflow/react'
import React, { useMemo } from 'react'

export interface SimulationProps {
    clientCount: number
    serverCount: number
}

const LoadBalancerSimulation: React.FC<SimulationProps> = ({
    clientCount,
    serverCount,
}) => {
    const nodes = useMemo(() => {
        const clientNodes = Array.from({ length: clientCount }, (_, i) => ({
            id: `client-${i}`,
            type: 'default',
            position: { x: 100, y: 100 * (i + 1) },
            data: { label: `Client ${i + 1}` },
        }))

        const loadBalancerNode = {
            id: 'load-balancer',
            type: 'default',
            position: { x: 300, y: 250 },
            data: { label: 'Load Balancer' },
        }

        const serverNodes = Array.from({ length: serverCount }, (_, i) => ({
            id: `server-${i}`,
            type: 'default',
            position: { x: 500, y: 100 * (i + 1) },
            data: { label: `Server ${i + 1}` },
        }))

        return [...clientNodes, loadBalancerNode, ...serverNodes]
    }, [clientCount, serverCount])

    const edges = useMemo(() => {
        const clientEdges = nodes
            .filter((node) => node.id.startsWith('client'))
            .map((clientNode) => ({
                id: `${clientNode.id}-to-lb`,
                source: clientNode.id,
                target: 'load-balancer',
            }))

        const lbToServerEdges = nodes
            .filter((node) => node.id.startsWith('server'))
            .map((serverNode) => ({
                id: `lb-to-${serverNode.id}`,
                source: 'load-balancer',
                target: serverNode.id,
            }))

        return [...clientEdges, ...lbToServerEdges]
    }, [nodes])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Simulation Flow</CardTitle>
            </CardHeader>
            <CardContent>
                <div style={{ height: '400px' }}>
                    <ReactFlow
                        colorMode="dark"
                        nodes={nodes}
                        edges={edges}
                        fitView
                    >
                        <Background />
                        <Controls />
                        <MiniMap />
                    </ReactFlow>
                </div>
            </CardContent>
        </Card>
    )
}

export default LoadBalancerSimulation
