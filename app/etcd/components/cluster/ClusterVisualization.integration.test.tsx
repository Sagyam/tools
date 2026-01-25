import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor, act } from '@testing-library/react'
import { ReactFlowProvider } from 'reactflow'
import { ClusterVisualization } from './ClusterVisualization'
import { useEtcdStore } from '../../store/etcdStore'
import { EtcdNode } from '../../types'

// Mock ReactFlow components
vi.mock('reactflow', async () => {
    const actual = await vi.importActual('reactflow')
    return {
        ...actual,
        ReactFlow: ({ nodes, edges }: any) => (
            <div data-testid="react-flow">
                <div data-testid="nodes" data-nodes={JSON.stringify(nodes)} />
                <div data-testid="edges" data-edges={JSON.stringify(edges)} />
            </div>
        ),
        Background: () => <div data-testid="background" />,
        Controls: () => <div data-testid="controls" />,
        ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
        useReactFlow: () => ({
            fitView: vi.fn(),
        }),
        useNodesState: (initialNodes: any) => {
            const [nodes, setNodes] = vi.importActual('react').useState(initialNodes)
            return [nodes, setNodes, vi.fn()]
        },
        useEdgesState: (initialEdges: any) => {
            const [edges, setEdges] = vi.importActual('react').useState(initialEdges)
            return [edges, setEdges, vi.fn()]
        },
        MarkerType: {
            ArrowClosed: 'ArrowClosed',
        },
    }
})

// Mock other components
vi.mock('./ClusterNode', () => ({
    ClusterNode: () => <div>ClusterNode</div>,
}))

vi.mock('./MessageVisualization', () => ({
    MessageVisualization: () => <div>MessageVisualization</div>,
}))

vi.mock('../LearningGuide', () => ({
    LearningGuide: () => <div>LearningGuide</div>,
}))

vi.mock('./ClusterControls', () => ({
    ClusterControls: () => <div>ClusterControls</div>,
}))

vi.mock('./ClusterStatusBar', () => ({
    ClusterStatusBar: () => <div>ClusterStatusBar</div>,
}))

// Helper to create mock EtcdNode
const createMockNode = (
    id: string,
    status: 'leader' | 'follower' | 'candidate' = 'follower'
): EtcdNode => ({
    id,
    status,
    term: 1,
    commitIndex: 0,
    lastHeartbeat: Date.now(),
    log: [],
    isPartitioned: false,
})

// Store state
let mockNodes = new Map<string, EtcdNode>()
let mockMessages: any[] = []
let mockInitializeCluster: any
let mockStartElection: any
let mockSimulateHeartbeat: any
let mockTogglePartition: any
let mockPutWithReplication: any

// Mock the zustand store
vi.mock('../../store/etcdStore', () => ({
    useEtcdStore: vi.fn(() => ({
        nodes: mockNodes,
        messages: mockMessages,
        initializeCluster: mockInitializeCluster,
        startElection: mockStartElection,
        simulateHeartbeat: mockSimulateHeartbeat,
        togglePartition: mockTogglePartition,
        putWithReplication: mockPutWithReplication,
    })),
}))

describe('ClusterVisualization Integration Tests', () => {
    beforeEach(() => {
        mockNodes = new Map<string, EtcdNode>()
        mockMessages = []
        mockInitializeCluster = vi.fn()
        mockStartElection = vi.fn()
        mockSimulateHeartbeat = vi.fn()
        mockTogglePartition = vi.fn()
        mockPutWithReplication = vi.fn()

        // Reset the mock implementation
        vi.mocked(useEtcdStore).mockReturnValue({
            nodes: mockNodes,
            messages: mockMessages,
            initializeCluster: mockInitializeCluster,
            startElection: mockStartElection,
            simulateHeartbeat: mockSimulateHeartbeat,
            togglePartition: mockTogglePartition,
            putWithReplication: mockPutWithReplication,
        } as any)
    })

    it('should initialize cluster when nodes are empty', () => {
        render(<ClusterVisualization />)

        expect(mockInitializeCluster).toHaveBeenCalledWith(5)
    })

    it('should display leader in center position', async () => {
        mockNodes.set('node1', createMockNode('node1', 'leader'))
        mockNodes.set('node2', createMockNode('node2', 'follower'))

        const { rerender } = render(<ClusterVisualization />)

        await waitFor(() => {
            const nodesElement = document.querySelector('[data-testid="nodes"]')
            if (nodesElement) {
                const nodesData = JSON.parse(nodesElement.getAttribute('data-nodes') || '[]')
                const leaderNode = nodesData.find((n: any) => n.id === 'node1')

                expect(leaderNode).toBeDefined()
                expect(leaderNode.position).toEqual({ x: 400, y: 300 })
            }
        })
    })

    it('should update node positions when leader changes', async () => {
        // Start with node1 as leader
        mockNodes.set('node1', createMockNode('node1', 'leader'))
        mockNodes.set('node2', createMockNode('node2', 'follower'))

        const { rerender } = render(<ClusterVisualization />)

        await waitFor(() => {
            const nodesElement = document.querySelector('[data-testid="nodes"]')
            if (nodesElement) {
                const nodesData = JSON.parse(nodesElement.getAttribute('data-nodes') || '[]')
                const leaderNode = nodesData.find((n: any) => n.id === 'node1')
                expect(leaderNode?.position).toEqual({ x: 400, y: 300 })
            }
        })

        // Change leader to node2
        mockNodes.clear()
        mockNodes.set('node1', createMockNode('node1', 'follower'))
        mockNodes.set('node2', createMockNode('node2', 'leader'))

        // Update the mock to return new nodes
        vi.mocked(useEtcdStore).mockReturnValue({
            nodes: mockNodes,
            messages: mockMessages,
            initializeCluster: mockInitializeCluster,
            startElection: mockStartElection,
            simulateHeartbeat: mockSimulateHeartbeat,
            togglePartition: mockTogglePartition,
            putWithReplication: mockPutWithReplication,
        } as any)

        rerender(<ClusterVisualization />)

        await waitFor(() => {
            const nodesElement = document.querySelector('[data-testid="nodes"]')
            if (nodesElement) {
                const nodesData = JSON.parse(nodesElement.getAttribute('data-nodes') || '[]')
                const newLeaderNode = nodesData.find((n: any) => n.id === 'node2')

                // BUG CHECK: New leader should be in center
                expect(newLeaderNode?.position).toEqual({ x: 400, y: 300 })
            }
        })
    })

    it('should add new nodes when node count increases', async () => {
        // Start with 2 nodes
        mockNodes.set('node1', createMockNode('node1', 'leader'))
        mockNodes.set('node2', createMockNode('node2', 'follower'))

        const { rerender } = render(<ClusterVisualization />)

        await waitFor(() => {
            const nodesElement = document.querySelector('[data-testid="nodes"]')
            if (nodesElement) {
                const nodesData = JSON.parse(nodesElement.getAttribute('data-nodes') || '[]')
                expect(nodesData).toHaveLength(2)
            }
        })

        // Add a third node
        mockNodes.set('node3', createMockNode('node3', 'follower'))

        // Update the mock to return new nodes
        vi.mocked(useEtcdStore).mockReturnValue({
            nodes: mockNodes,
            messages: mockMessages,
            initializeCluster: mockInitializeCluster,
            startElection: mockStartElection,
            simulateHeartbeat: mockSimulateHeartbeat,
            togglePartition: mockTogglePartition,
            putWithReplication: mockPutWithReplication,
        } as any)

        rerender(<ClusterVisualization />)

        await waitFor(() => {
            const nodesElement = document.querySelector('[data-testid="nodes"]')
            if (nodesElement) {
                const nodesData = JSON.parse(nodesElement.getAttribute('data-nodes') || '[]')

                // BUG CHECK: Should now have 3 nodes
                expect(nodesData).toHaveLength(3)

                // Leader should still be centered
                const leaderNode = nodesData.find((n: any) => n.id === 'node1')
                expect(leaderNode?.position).toEqual({ x: 400, y: 300 })

                // Followers should be in circle
                const followers = nodesData.filter((n: any) => n.id !== 'node1')
                followers.forEach((follower: any) => {
                    const distance = Math.sqrt(
                        Math.pow(follower.position.x - 400, 2) +
                            Math.pow(follower.position.y - 300, 2)
                    )
                    expect(distance).toBeCloseTo(220, 0)
                })
            }
        })
    })

    it('should remove nodes when node count decreases', async () => {
        // Start with 3 nodes
        mockNodes.set('node1', createMockNode('node1', 'leader'))
        mockNodes.set('node2', createMockNode('node2', 'follower'))
        mockNodes.set('node3', createMockNode('node3', 'follower'))

        const { rerender } = render(<ClusterVisualization />)

        await waitFor(() => {
            const nodesElement = document.querySelector('[data-testid="nodes"]')
            if (nodesElement) {
                const nodesData = JSON.parse(nodesElement.getAttribute('data-nodes') || '[]')
                expect(nodesData).toHaveLength(3)
            }
        })

        // Remove node3
        mockNodes.delete('node3')

        // Update the mock
        vi.mocked(useEtcdStore).mockReturnValue({
            nodes: mockNodes,
            messages: mockMessages,
            initializeCluster: mockInitializeCluster,
            startElection: mockStartElection,
            simulateHeartbeat: mockSimulateHeartbeat,
            togglePartition: mockTogglePartition,
            putWithReplication: mockPutWithReplication,
        } as any)

        rerender(<ClusterVisualization />)

        await waitFor(() => {
            const nodesElement = document.querySelector('[data-testid="nodes"]')
            if (nodesElement) {
                const nodesData = JSON.parse(nodesElement.getAttribute('data-nodes') || '[]')

                // BUG CHECK: Should now have 2 nodes
                expect(nodesData).toHaveLength(2)
            }
        })
    })

    it('should preserve node positions when only node data changes', async () => {
        mockNodes.set('node1', createMockNode('node1', 'leader'))
        mockNodes.set('node2', createMockNode('node2', 'follower'))

        const { rerender } = render(<ClusterVisualization />)

        let initialPositions: any = {}

        await waitFor(() => {
            const nodesElement = document.querySelector('[data-testid="nodes"]')
            if (nodesElement) {
                const nodesData = JSON.parse(nodesElement.getAttribute('data-nodes') || '[]')
                initialPositions = Object.fromEntries(
                    nodesData.map((n: any) => [n.id, n.position])
                )
            }
        })

        // Update node data (not topology)
        const node1 = mockNodes.get('node1')!
        const node2 = mockNodes.get('node2')!
        node1.term = 5
        node1.commitIndex = 10
        node2.term = 5
        node2.commitIndex = 10

        // Update the mock
        vi.mocked(useEtcdStore).mockReturnValue({
            nodes: mockNodes,
            messages: mockMessages,
            initializeCluster: mockInitializeCluster,
            startElection: mockStartElection,
            simulateHeartbeat: mockSimulateHeartbeat,
            togglePartition: mockTogglePartition,
            putWithReplication: mockPutWithReplication,
        } as any)

        rerender(<ClusterVisualization />)

        await waitFor(() => {
            const nodesElement = document.querySelector('[data-testid="nodes"]')
            if (nodesElement) {
                const nodesData = JSON.parse(nodesElement.getAttribute('data-nodes') || '[]')
                const newPositions = Object.fromEntries(
                    nodesData.map((n: any) => [n.id, n.position])
                )

                // Positions should NOT have changed
                expect(newPositions).toEqual(initialPositions)
            }
        })
    })

    it('should create replication edges from leader to followers', async () => {
        mockNodes.set('node1', createMockNode('node1', 'leader'))
        mockNodes.set('node2', createMockNode('node2', 'follower'))
        mockNodes.set('node3', createMockNode('node3', 'follower'))

        render(<ClusterVisualization />)

        await waitFor(() => {
            const edgesElement = document.querySelector('[data-testid="edges"]')
            if (edgesElement) {
                const edgesData = JSON.parse(edgesElement.getAttribute('data-edges') || '[]')

                expect(edgesData).toHaveLength(2)
                expect(edgesData[0]).toMatchObject({
                    source: 'node1',
                    target: 'node2',
                })
                expect(edgesData[1]).toMatchObject({
                    source: 'node1',
                    target: 'node3',
                })
            }
        })
    })

    it('should update edges when leader changes', async () => {
        mockNodes.set('node1', createMockNode('node1', 'leader'))
        mockNodes.set('node2', createMockNode('node2', 'follower'))

        const { rerender } = render(<ClusterVisualization />)

        await waitFor(() => {
            const edgesElement = document.querySelector('[data-testid="edges"]')
            if (edgesElement) {
                const edgesData = JSON.parse(edgesElement.getAttribute('data-edges') || '[]')
                expect(edgesData[0].source).toBe('node1')
            }
        })

        // Change leader
        mockNodes.clear()
        mockNodes.set('node1', createMockNode('node1', 'follower'))
        mockNodes.set('node2', createMockNode('node2', 'leader'))

        vi.mocked(useEtcdStore).mockReturnValue({
            nodes: mockNodes,
            messages: mockMessages,
            initializeCluster: mockInitializeCluster,
            startElection: mockStartElection,
            simulateHeartbeat: mockSimulateHeartbeat,
            togglePartition: mockTogglePartition,
            putWithReplication: mockPutWithReplication,
        } as any)

        rerender(<ClusterVisualization />)

        await waitFor(() => {
            const edgesElement = document.querySelector('[data-testid="edges"]')
            if (edgesElement) {
                const edgesData = JSON.parse(edgesElement.getAttribute('data-edges') || '[]')
                expect(edgesData[0].source).toBe('node2')
            }
        })
    })
})
