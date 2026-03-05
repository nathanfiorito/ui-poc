import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  addEdge,
} from 'reactflow';
import type { IODMNode, IODMEdge, IODMNodeData } from '../types/flow';
import type { PolicyMeta, StateType } from '../types/policy';
import {
  DEFAULT_DATABASE_STATE,
  DEFAULT_TASK_STATE,
  DEFAULT_API_STATE,
  DEFAULT_RESPONSE_STATE,
} from '../constants/defaults';

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
  addNode: (type: StateType, position: { x: number; y: number }) => void;
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

  addNode: (type, position) => {
    const id = `${type}-${Math.random().toString(36).slice(2, 9)}`;
    let data: IODMNodeData;

    switch (type) {
      case 'DataBase':
        data = { ...DEFAULT_DATABASE_STATE, label: 'DataBase', stateType: 'DataBase', next: null, end: false };
        break;
      case 'task':
        data = { ...DEFAULT_TASK_STATE, label: 'Task', stateType: 'task', next: null, end: false };
        break;
      case 'API':
        data = { ...DEFAULT_API_STATE, label: 'API', stateType: 'API', next: null, end: false };
        break;
      case 'Response':
        data = { ...DEFAULT_RESPONSE_STATE, label: 'Response', stateType: 'Response' };
        break;
    }

    const newNode: IODMNode = { id, type, position, data };
    set({ nodes: [...get().nodes, newNode] });
  },
}));
