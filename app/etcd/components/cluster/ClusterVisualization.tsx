'use client'

import React, { useCallback, useEffect } from 'react'
import ReactFlow, {
    Background,
    Controls,
    Edge,
    MarkerType,
    Node,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useEtcdStore } from '../../store/etcdStore'
import { RaftMessage } from '../../types'
import { ClusterNode } from './ClusterNode'
import { MessageVisualization } from './MessageVisualization'
import { LearningGuide } from '../LearningGuide'
import { ClusterControls } from './ClusterControls'
import { ClusterStatusBar } from './ClusterStatusBar'

const nodeTypes = {
    clusterNode: ClusterNode,
}

// Inner component that has access to ReactFlow context
const ClusterFlow: React.FC = () => {
    const {
        nodes: etcdNodes,
        messages,
        initializeCluster,
        startElection,
        simulateHeartbeat,
        togglePartition,
    } = useEtcdStore()

    const { fitView } = useReactFlow()
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [isMobile, setIsMobile] = React.useState(false)

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Auto-fit view when nodes change (zoomed out more on mobile)
    useEffect(() => {
        if (nodes.length > 0) {
            setTimeout(() => {
                fitView({
                    padding: isMobile ? 0.3 : 0.15,
                    duration: 200,
                })
            }, 50)
        }
    }, [nodes, fitView, isMobile])

    useEffect(() => {
        if (etcdNodes.size === 0) {
            initializeCluster(5)
        }
    }, [])

    const handleFailover = useCallback(
        async (nodeId: string) => {
            await startElection(nodeId)
        },
        [startElection]
    )

    const handleTogglePartition = useCallback(
        async (nodeId: string) => {
            await togglePartition(nodeId)
        },
        [togglePartition]
    )

    useEffect(() => {
        const nodeArray = Array.from(etcdNodes.values())

        // Find leader and followers
        const leader = nodeArray.find((n) => n.status === 'leader')
        const followers = nodeArray.filter((n) => n.status !== 'leader')

        const flowNodes: Node[] = []
        const centerX = 400
        const centerY = 300
        const radius = 220

        // Place leader in the center
        if (leader) {
            flowNodes.push({
                id: leader.id,
                type: 'clusterNode',
                position: { x: centerX, y: centerY },
                data: {
                    node: leader,
                    onFailover: handleFailover,
                    onTogglePartition: handleTogglePartition,
                },
            })
        }

        // Place followers in a circle around the leader
        followers.forEach((node, index) => {
            const angle = (index * 2 * Math.PI) / followers.length
            const x = centerX + radius * Math.cos(angle)
            const y = centerY + radius * Math.sin(angle)

            flowNodes.push({
                id: node.id,
                type: 'clusterNode',
                position: { x, y },
                data: {
                    node,
                    onFailover: handleFailover,
                    onTogglePartition: handleTogglePartition,
                },
            })
        })

        setNodes(flowNodes)
    }, [etcdNodes, handleFailover, handleTogglePartition, setNodes])

    useEffect(() => {
        const leader = Array.from(etcdNodes.values()).find(
            (n) => n.status === 'leader'
        )
        if (!leader) {
            setEdges([])
            return
        }

        const replicationEdges: Edge[] = Array.from(etcdNodes.values())
            .filter((n) => n.status === 'follower')
            .map((follower) => ({
                id: `${leader.id}-${follower.id}`,
                source: leader.id,
                target: follower.id,
                animated: true,
                style: { stroke: '#0ea5e9', strokeWidth: 2 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#0ea5e9',
                },
            }))

        setEdges(replicationEdges)
    }, [etcdNodes, setEdges])

    useEffect(() => {
        const leader = Array.from(etcdNodes.values()).find(
            (n) => n.status === 'leader' && !n.isPartitioned
        )
        if (!leader) return

        const interval = setInterval(() => {
            // Leader sends heartbeat to itself
            simulateHeartbeat(leader.id)

            // Leader sends heartbeat to all non-partitioned followers (simulating Raft heartbeat)
            Array.from(etcdNodes.values())
                .filter((n) => n.status === 'follower' && !n.isPartitioned)
                .forEach((follower) => {
                    simulateHeartbeat(follower.id)

                    // Optionally send visual heartbeat message (less frequently to avoid clutter)
                    if (Math.random() < 0.1) {
                        const heartbeat: RaftMessage = {
                            id: `heartbeat-${Date.now()}-${Math.random()}`,
                            type: 'AppendEntries',
                            from: leader.id,
                            to: follower.id,
                            term: leader.term,
                            entries: [],
                            leaderCommit: leader.commitIndex,
                            timestamp: Date.now(),
                        }
                        useEtcdStore.getState().sendMessage(heartbeat)
                    }
                })
        }, 1000)

        return () => clearInterval(interval)
    }, [etcdNodes, simulateHeartbeat])

    return (
        <>
            <div className="w-full h-150 border border-border rounded-lg relative">
                {/* Interactive Controls - Hidden on small mobile, visible on md+ */}
                {!isMobile && (
                    <div className="absolute top-4 left-4 z-10 bg-background/95 backdrop-blur-sm border border-border px-3 py-2 rounded-lg text-xs space-y-1 max-w-50">
                        <div className="font-semibold text-foreground">
                            Interactive Controls:
                        </div>
                        <div className="text-muted-foreground">
                            Click "Trigger Election" on nodes to start election
                        </div>
                        <div className="text-muted-foreground">
                            Click WiFi icon to partition/restore network
                        </div>
                        <div className="text-muted-foreground">
                            Use "Try It" to see log replication
                        </div>
                        <div className="text-muted-foreground">
                            Watch nodes turn purple during replication
                        </div>
                    </div>
                )}

                {/* Legend - Stacked on mobile */}
                <div
                    className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'} z-10 bg-background/95 backdrop-blur-sm border border-border px-2 py-2 rounded-lg text-xs space-y-1`}
                >
                    <div className="font-semibold text-foreground">Legend:</div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-sky-600 rounded"></div>
                        <span className="text-muted-foreground">Leader</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-600 rounded"></div>
                        <span className="text-muted-foreground">
                            Replicating
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-600 rounded"></div>
                        <span className="text-muted-foreground">Candidate</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-slate-600 rounded"></div>
                        <span className="text-muted-foreground">Follower</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-800 rounded"></div>
                        <span className="text-muted-foreground">
                            Partitioned
                        </span>
                    </div>
                    <div className="border-t border-border mt-2 pt-2 text-[10px] text-muted-foreground italic">
                        {isMobile ? 'Pinch to zoom, drag to pan' : 'Scroll to zoom, drag to pan'}
                    </div>
                </div>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    minZoom={0.1}
                    maxZoom={2}
                    attributionPosition="bottom-left"
                >
                    <Background />
                    <Controls />
                </ReactFlow>

                {messages.map((message) => {
                    const sourceNode = nodes.find((n) => n.id === message.from)
                    const targetNode = nodes.find((n) => n.id === message.to)
                    if (!sourceNode || !targetNode) return null

                    return (
                        <MessageVisualization
                            key={message.id}
                            message={message}
                            sourceNode={sourceNode}
                            targetNode={targetNode}
                        />
                    )
                })}
            </div>
        </>
    )
}

const LEARNING_CONCEPTS = [
    {
        title: 'Log Entries',
        description:
            'All proposed operations, including uncommitted ones. Can be ahead of commits during replication.',
    },
    {
        title: 'Commit Index',
        description:
            'Operations replicated to majority and safe to apply. All nodes eventually reach same commit index.',
    },
    {
        title: 'Replicating State',
        description:
            'Followers turn purple when receiving log entries. They commit once majority confirms the entry.',
    },
]

const LEARNING_STEPS = [
    {
        action: 'Observe the initial cluster',
        learn: 'One node is the leader (blue), others are followers (gray)',
    },
    {
        action: 'Click "Add Key (Replicate)" and watch counters',
        learn: 'Log count increases first, then Commit follows after majority - this is the 2-phase commit',
    },
    {
        action: 'Partition a follower, then add keys',
        learn: 'Partitioned node keeps its old logs - when restored, it receives missed entries via catch-up',
    },
    {
        action: 'Click "Trigger Election" on any node',
        learn: 'Watch the Raft election: candidate requests votes, collects majority, becomes leader',
    },
    {
        action: 'Partition the leader node',
        learn: 'Cluster automatically elects new leader from healthy nodes after 2s timeout',
    },
    {
        action: 'Restore the partitioned node',
        learn: 'Watch it catch up - Leader sends all missed log entries (catch-up messages), then syncs commit index',
    },
    {
        action: 'Watch message labels',
        learn: 'Vote? = vote request, Yes/No = vote response, Log = log entry, HB = heartbeat, OK = success response',
    },
]

export const ClusterVisualization: React.FC = () => {
    const { putWithReplication } = useEtcdStore()

    const [isReplicating, setIsReplicating] = React.useState(false)

    const handleAddKey = useCallback(async () => {
        setIsReplicating(true)
        const timestamp = Date.now()
        await putWithReplication(
            `/config/key-${timestamp}`,
            `value-${timestamp}`
        )
        setIsReplicating(false)
    }, [putWithReplication])

    return (
        <div className="space-y-4">
            <LearningGuide
                steps={LEARNING_STEPS}
                concepts={LEARNING_CONCEPTS}
            />

            <ClusterControls
                onAddKey={handleAddKey}
                isReplicating={isReplicating}
            />

            <ClusterStatusBar />

            <ReactFlowProvider>
                <ClusterFlow />
            </ReactFlowProvider>
        </div>
    )
}
