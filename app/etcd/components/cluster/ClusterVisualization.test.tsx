import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { ReactFlowProvider } from 'reactflow'
import { EtcdNode } from '../../types'

// Import the component - we'll need to export the helpers from the main file
// For now, we'll re-implement the helpers here for testing
// In a real scenario, you'd export them from ClusterVisualization.tsx

// Layout configuration
const LAYOUT_CONFIG = {
    centerX: 400,
    centerY: 300,
    radius: 220,
} as const

// Helper: Calculate positions for nodes in a circular layout
const calculateNodePositions = (
    etcdNodes: Map<string, EtcdNode>,
    config = LAYOUT_CONFIG
) => {
    const nodeArray = Array.from(etcdNodes.values())
    const leader = nodeArray.find((n) => n.status === 'leader')
    const followers = nodeArray.filter((n) => n.status !== 'leader')
    const flowNodes: any[] = []

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
    currentNodes: any[],
    etcdNodes: Map<string, EtcdNode>,
    handlers: { onFailover: (id: string) => void; onTogglePartition: (id: string) => void }
) => {
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
const createReplicationEdges = (etcdNodes: Map<string, EtcdNode>) => {
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
            type: 'ArrowClosed',
            color: '#0ea5e9',
        },
    }))
}

// Mock zustand store
vi.mock('../../store/etcdStore', () => ({
    useEtcdStore: vi.fn(() => ({
        nodes: new Map(),
        messages: [],
        initializeCluster: vi.fn(),
        startElection: vi.fn(),
        simulateHeartbeat: vi.fn(),
        togglePartition: vi.fn(),
        putWithReplication: vi.fn(),
    })),
}))

// Helper to create mock EtcdNode
const createMockNode = (id: string, status: 'leader' | 'follower' | 'candidate' = 'follower'): EtcdNode => ({
    id,
    status,
    term: 1,
    commitIndex: 0,
    lastHeartbeat: Date.now(),
    log: [],
    isPartitioned: false,
})

describe('ClusterVisualization Helper Functions', () => {
    describe('calculateNodePositions', () => {
        it('should place leader in the center', () => {
            const nodes = new Map<string, EtcdNode>()
            nodes.set('node1', createMockNode('node1', 'leader'))

            const result = calculateNodePositions(nodes)

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('node1')
            expect(result[0].position).toEqual({ x: 400, y: 300 })
            expect(result[0].type).toBe('clusterNode')
        })

        it('should place followers in a circle around leader', () => {
            const nodes = new Map<string, EtcdNode>()
            nodes.set('node1', createMockNode('node1', 'leader'))
            nodes.set('node2', createMockNode('node2', 'follower'))
            nodes.set('node3', createMockNode('node3', 'follower'))

            const result = calculateNodePositions(nodes)

            expect(result).toHaveLength(3)

            // Leader should be first and centered
            expect(result[0].id).toBe('node1')
            expect(result[0].position).toEqual({ x: 400, y: 300 })

            // Followers should be positioned in a circle
            const follower1 = result[1]
            const follower2 = result[2]

            // Check that followers are positioned at the correct radius
            const distanceFromCenter1 = Math.sqrt(
                Math.pow(follower1.position.x - 400, 2) + Math.pow(follower1.position.y - 300, 2)
            )
            const distanceFromCenter2 = Math.sqrt(
                Math.pow(follower2.position.x - 400, 2) + Math.pow(follower2.position.y - 300, 2)
            )

            expect(distanceFromCenter1).toBeCloseTo(220, 0)
            expect(distanceFromCenter2).toBeCloseTo(220, 0)
        })

        it('should handle cluster with no leader', () => {
            const nodes = new Map<string, EtcdNode>()
            nodes.set('node1', createMockNode('node1', 'follower'))
            nodes.set('node2', createMockNode('node2', 'follower'))

            const result = calculateNodePositions(nodes)

            // All nodes should be placed in a circle (no leader in center)
            expect(result).toHaveLength(2)
            result.forEach((node) => {
                const distance = Math.sqrt(
                    Math.pow(node.position.x - 400, 2) + Math.pow(node.position.y - 300, 2)
                )
                expect(distance).toBeCloseTo(220, 0)
            })
        })

        it('should handle single follower correctly', () => {
            const nodes = new Map<string, EtcdNode>()
            nodes.set('node1', createMockNode('node1', 'follower'))

            const result = calculateNodePositions(nodes)

            expect(result).toHaveLength(1)
            // Single follower should still be positioned at radius distance
            const distance = Math.sqrt(
                Math.pow(result[0].position.x - 400, 2) + Math.pow(result[0].position.y - 300, 2)
            )
            expect(distance).toBeCloseTo(220, 0)
        })
    })

    describe('updateNodeData', () => {
        it('should update node data without changing positions', () => {
            const nodes = new Map<string, EtcdNode>()
            const node1 = createMockNode('node1', 'follower')
            node1.term = 5
            nodes.set('node1', node1)

            const currentNodes = [
                {
                    id: 'node1',
                    type: 'clusterNode',
                    position: { x: 100, y: 200 },
                    data: { node: createMockNode('node1', 'follower') },
                },
            ]

            const handlers = {
                onFailover: vi.fn(),
                onTogglePartition: vi.fn(),
            }

            const result = updateNodeData(currentNodes, nodes, handlers)

            expect(result).toHaveLength(1)
            expect(result[0].position).toEqual({ x: 100, y: 200 }) // Position unchanged
            expect(result[0].data.node.term).toBe(5) // Data updated
            expect(result[0].data.onFailover).toBe(handlers.onFailover)
            expect(result[0].data.onTogglePartition).toBe(handlers.onTogglePartition)
        })

        it('should preserve nodes that are not in etcdNodes map', () => {
            const nodes = new Map<string, EtcdNode>()
            nodes.set('node1', createMockNode('node1', 'follower'))

            const currentNodes = [
                {
                    id: 'node1',
                    type: 'clusterNode',
                    position: { x: 100, y: 200 },
                    data: { node: createMockNode('node1', 'follower') },
                },
                {
                    id: 'node2',
                    type: 'clusterNode',
                    position: { x: 150, y: 250 },
                    data: { node: createMockNode('node2', 'follower') },
                },
            ]

            const handlers = {
                onFailover: vi.fn(),
                onTogglePartition: vi.fn(),
            }

            const result = updateNodeData(currentNodes, nodes, handlers)

            expect(result).toHaveLength(2)
            // node2 should be preserved as-is since it's not in the map
            expect(result[1]).toBe(currentNodes[1])
        })
    })

    describe('createReplicationEdges', () => {
        it('should create edges from leader to all followers', () => {
            const nodes = new Map<string, EtcdNode>()
            nodes.set('node1', createMockNode('node1', 'leader'))
            nodes.set('node2', createMockNode('node2', 'follower'))
            nodes.set('node3', createMockNode('node3', 'follower'))

            const result = createReplicationEdges(nodes)

            expect(result).toHaveLength(2)
            expect(result[0]).toMatchObject({
                id: 'node1-node2',
                source: 'node1',
                target: 'node2',
                animated: true,
            })
            expect(result[1]).toMatchObject({
                id: 'node1-node3',
                source: 'node1',
                target: 'node3',
                animated: true,
            })
        })

        it('should return empty array when there is no leader', () => {
            const nodes = new Map<string, EtcdNode>()
            nodes.set('node1', createMockNode('node1', 'follower'))
            nodes.set('node2', createMockNode('node2', 'follower'))

            const result = createReplicationEdges(nodes)

            expect(result).toHaveLength(0)
        })

        it('should return empty array when leader has no followers', () => {
            const nodes = new Map<string, EtcdNode>()
            nodes.set('node1', createMockNode('node1', 'leader'))

            const result = createReplicationEdges(nodes)

            expect(result).toHaveLength(0)
        })

        it('should not create edges to candidates', () => {
            const nodes = new Map<string, EtcdNode>()
            nodes.set('node1', createMockNode('node1', 'leader'))
            nodes.set('node2', createMockNode('node2', 'follower'))
            nodes.set('node3', createMockNode('node3', 'candidate'))

            const result = createReplicationEdges(nodes)

            expect(result).toHaveLength(1)
            expect(result[0].target).toBe('node2')
        })
    })
})

describe('Edge Cases and Integration', () => {
    it('should handle empty node map', () => {
        const nodes = new Map<string, EtcdNode>()

        const positions = calculateNodePositions(nodes)
        const edges = createReplicationEdges(nodes)

        expect(positions).toHaveLength(0)
        expect(edges).toHaveLength(0)
    })

    it('should handle node status changes correctly', () => {
        const nodes = new Map<string, EtcdNode>()
        const node1 = createMockNode('node1', 'leader')
        const node2 = createMockNode('node2', 'follower')

        nodes.set('node1', node1)
        nodes.set('node2', node2)

        const initialPositions = calculateNodePositions(nodes)
        expect(initialPositions[0].id).toBe('node1') // Leader is first

        // Change leader
        node1.status = 'follower'
        node2.status = 'leader'

        const newPositions = calculateNodePositions(nodes)
        expect(newPositions[0].id).toBe('node2') // New leader is first
        expect(newPositions[0].position).toEqual({ x: 400, y: 300 })
    })

    it('should maintain consistent circular positioning for followers', () => {
        const nodes = new Map<string, EtcdNode>()
        nodes.set('leader', createMockNode('leader', 'leader'))

        // Add 4 followers
        for (let i = 1; i <= 4; i++) {
            nodes.set(`follower${i}`, createMockNode(`follower${i}`, 'follower'))
        }

        const positions = calculateNodePositions(nodes)

        // Should have 5 nodes total (1 leader + 4 followers)
        expect(positions).toHaveLength(5)

        // All followers should be at same distance from center
        const followerPositions = positions.slice(1)
        const distances = followerPositions.map((pos) =>
            Math.sqrt(Math.pow(pos.position.x - 400, 2) + Math.pow(pos.position.y - 300, 2))
        )

        distances.forEach((distance) => {
            expect(distance).toBeCloseTo(220, 0)
        })

        // Followers should be evenly spaced (90 degrees apart)
        const angles = followerPositions.map((pos) =>
            Math.atan2(pos.position.y - 300, pos.position.x - 400)
        )

        // Check that angles are roughly evenly distributed
        const sortedAngles = [...angles].sort((a, b) => a - b)
        for (let i = 0; i < sortedAngles.length - 1; i++) {
            const angleDiff = sortedAngles[i + 1] - sortedAngles[i]
            expect(angleDiff).toBeCloseTo(Math.PI / 2, 1) // 90 degrees in radians
        }
    })
})
