import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  addEdge,
} from 'reactflow';
import type { IODMNode, IODMEdge } from '../types/flow';
import type { PolicyMeta } from '../types/policy';

interface FlowState {
  nodes: IODMNode[];
  edges: IODMEdge[];
  policyMeta: PolicyMeta;
  selectedNodeId: string | null;

  setNodes: (nodes: IODMNode[]) => void;
  setEdges: (edges: IODMEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setSelectedNodeId: (id: string | null) => void;
  setPolicyMeta: (meta: Partial<PolicyMeta>) => void;
  updateNodeData: (id: string, data: Partial<IODMNode['data']>) => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  policyMeta: {
    id: '',
    name: 'New Policy',
    description: '',
    version: '1.0.0',
    startAt: '',
  },
  selectedNodeId: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) as IODMNode[] }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) =>
    set({ edges: addEdge(connection, get().edges) }),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setPolicyMeta: (meta) =>
    set({ policyMeta: { ...get().policyMeta, ...meta } }),

  updateNodeData: (id, data) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? ({ ...n, data: { ...n.data, ...data } } as IODMNode) : n
      ),
    }),
}));
