import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'
import type { Policy } from '../types/policy'

// ─── Metadata ────────────────────────────────────────────────────────────────

export interface WorkflowMetadata {
  id: string
  name: string
  description: string
  version: string
}

// ─── Store shape ─────────────────────────────────────────────────────────────

interface WorkflowState {
  nodes: Node[]
  edges: Edge[]
  metadata: WorkflowMetadata
  selectedNodeId: string | null

  // Actions
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setSelectedNodeId: (id: string | null) => void
  setMetadata: (metadata: Partial<WorkflowMetadata>) => void
  loadPolicy: (policy: Policy) => void
  reset: () => void
}

// ─── Default values ───────────────────────────────────────────────────────────

const defaultMetadata: WorkflowMetadata = {
  id: crypto.randomUUID(),
  name: 'Novo Workflow',
  description: '',
  version: '1.0',
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWorkflowStore = create<WorkflowState>((set) => ({
  nodes: [],
  edges: [],
  metadata: { ...defaultMetadata },
  selectedNodeId: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setMetadata: (metadata) =>
    set((state) => ({ metadata: { ...state.metadata, ...metadata } })),

  loadPolicy: (_policy: Policy) => {
    // Will be implemented in Phase 4 (deserialization)
    set({ nodes: [], edges: [] })
  },

  reset: () =>
    set({
      nodes: [],
      edges: [],
      metadata: { ...defaultMetadata, id: crypto.randomUUID() },
      selectedNodeId: null,
    }),
}))
