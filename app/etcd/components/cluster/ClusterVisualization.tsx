'use client'

import React, { useCallback, useEffect, useMemo, useRef } from 'react'
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
import { RaftMessage, EtcdNode as EtcdNodeType } from '../../types'
import { ClusterNode } from './ClusterNode'
import { MessageVisualization } from './MessageVisualization'
import { LearningGuide } from '../LearningGuide'
import { ClusterControls } from './ClusterControls'
import { ClusterStatusBar } from './ClusterStatusBar'

const nodeTypes = {
    clusterNode: ClusterNode,
}

// Layout configuration
const LAYOUT_CONFIG = {
    centerX: 400,
    centerY: 300,
    radius: 220,
} as const

// Helper: Calculate positions for nodes in a circular layout
const calculateNodePositions = (
    etcdNodes: Map<string, EtcdNodeType>,
    config = LAYOUT_CONFIG
): Node[] => {
    const nodeArray = Array.from(etcdNodes.values())
    const leader = nodeArray.find((n) => n.status === 'leader')
    const followers = nodeArray.filter((n) => n.status !== 'leader')
    const flowNodes: Node[] = []

    // Place leader in the center
    if (leader) {
        flowNodes.push({
            id: leader.id,
            type: 'clusterNode',
            position: { x: config.centerX, y: config.centerY },
            data: { node: leader },
        })
    }

    // Place followers in a circle around the leader
    followers.forEach((node, index) => {
        const angle = (index * 2 * Math.PI) / followers.length
        const x = config.centerX + config.radius * Math.cos(angle)
        const y = config.centerY + config.radius * Math.sin(angle)

        flowNodes.push({
            id: node.id,
            type: 'clusterNode',
            position: { x, y },
            data: { node },
        })
    })

    return flowNodes
}

// Helper: Update node data without changing positions
const updateNodeData = (
    currentNodes: Node[],
    etcdNodes: Map<string, EtcdNodeType>,
    handlers: { onFailover: (id: string) => void; onTogglePartition: (id: string) => void }
): Node[] => {
    return currentNodes.map((flowNode) => {
        const etcdNode = etcdNodes.get(flowNode.id)
        if (!etcdNode) return flowNode

        return {
            ...flowNode,
            data: {
                node: etcdNode,
                onFailover: handlers.onFailover,
                onTogglePartition: handlers.onTogglePartition,
            },
        }
    })
}

// Helper: Create replication edges from leader to followers
const createReplicationEdges = (etcdNodes: Map<string, EtcdNodeType>): Edge[] => {
    const leader = Array.from(etcdNodes.values()).find((n) => n.status === 'leader')

    if (!leader) return []

    const followers = Array.from(etcdNodes.values()).filter((n) => n.status === 'follower')

    return followers.map((follower) => ({
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
}

// Custom hook: Track topology changes (leader changes, node count changes)
const useTopologyTracker = (etcdNodes: Map<string, EtcdNodeType>) => {
    const prevLeaderIdRef = useRef<string | null>(null)
    const prevNodeCountRef = useRef<number>(0)
    const [topologyChangeFlag, setTopologyChangeFlag] = React.useState(0)

    // Calculate current topology
    const leader = Array.from(etcdNodes.values()).find((n) => n.status === 'leader')
    const currentLeaderId = leader?.id || null
    const currentNodeCount = etcdNodes.size

    // Check if topology changed
    const hasTopologyChanged =
        currentLeaderId !== prevLeaderIdRef.current ||
        currentNodeCount !== prevNodeCountRef.current

    // Update refs in useEffect after detecting change
    useEffect(() => {
        if (hasTopologyChanged) {
            prevLeaderIdRef.current = currentLeaderId
            prevNodeCountRef.current = currentNodeCount
            // Increment flag to force dependent effects to re-run
            setTopologyChangeFlag((prev) => prev + 1)
        }
    }, [currentLeaderId, currentNodeCount, hasTopologyChanged])

    return {
        topology: { leaderId: currentLeaderId, nodeCount: currentNodeCount },
        hasTopologyChanged,
        topologyChangeFlag,
    }
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

    // Track topology changes (leader changes, node count changes)
    const { hasTopologyChanged, topologyChangeFlag } = useTopologyTracker(etcdNodes)

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Initialize cluster on mount
    useEffect(() => {
        if (etcdNodes.size === 0) {
            initializeCluster(5)
        }
    }, [etcdNodes.size, initializeCluster])

    // Event handlers
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

    const handlers = useMemo(
        () => ({ onFailover: handleFailover, onTogglePartition: handleTogglePartition }),
        [handleFailover, handleTogglePartition]
    )

    // Update node positions and data based on topology changes
    useEffect(() => {
        if (nodes.length === 0) {
            // Initial render - create nodes with positions
            const flowNodes = calculateNodePositions(etcdNodes)
            const nodesWithHandlers = updateNodeData(flowNodes, etcdNodes, handlers)
            setNodes(nodesWithHandlers)
        } else if (hasTopologyChanged) {
            // Topology changed - recalculate positions with new layout
            const flowNodes = calculateNodePositions(etcdNodes)
            const nodesWithHandlers = updateNodeData(flowNodes, etcdNodes, handlers)
            setNodes(nodesWithHandlers)
        } else {
            // Topology unchanged - only update node data, preserve positions
            setNodes((currentNodes) => updateNodeData(currentNodes, etcdNodes, handlers))
        }
    }, [etcdNodes, hasTopologyChanged, handlers, nodes.length, setNodes])

    // Auto-fit view only when topology changes
    useEffect(() => {
        if (nodes.length > 0 && topologyChangeFlag > 0) {
            setTimeout(() => {
                fitView({
                    padding: isMobile ? 0.3 : 0.15,
                    duration: 200,
                })
            }, 50)
        }
    }, [topologyChangeFlag, nodes.length, fitView, isMobile])

    // Update replication edges when cluster state changes
    useEffect(() => {
        const edges = createReplicationEdges(etcdNodes)
        setEdges(edges)
    }, [etcdNodes, setEdges])

    // Heartbeat mechanism: leader sends periodic heartbeats to followers
    useEffect(() => {
        const leader = Array.from(etcdNodes.values()).find(
            (n) => n.status === 'leader' && !n.isPartitioned
        )
        if (!leader) return

        const sendHeartbeats = () => {
            // Leader sends heartbeat to itself
            simulateHeartbeat(leader.id)

            // Leader sends heartbeat to all non-partitioned followers
            const activeFollowers = Array.from(etcdNodes.values()).filter(
                (n) => n.status === 'follower' && !n.isPartitioned
            )

            activeFollowers.forEach((follower) => {
                simulateHeartbeat(follower.id)

                // Occasionally send visual heartbeat message (10% chance to avoid clutter)
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
        }

        const interval = setInterval(sendHeartbeats, 1000)
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
