import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
  addEdge,
} from 'reactflow';
import type { IODMNode, IODMEdge, IODMNodeData, TaskNodeData } from '../types/flow';
import type { PolicyMeta, StateType } from '../types/policy';
import type { Condition } from '../types/policy/condition';
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

  onEdgesChange: (changes) => {
    const { nodes, edges } = get();

    const removedEdges = changes
      .filter((c): c is { type: 'remove'; id: string } => c.type === 'remove')
      .map((c) => edges.find((e) => e.id === c.id))
      .filter((e): e is IODMEdge => e !== undefined);

    let updatedNodes = nodes;
    if (removedEdges.length > 0) {
      updatedNodes = nodes.map((n) => {
        const defaultRemoval = removedEdges.find((e) => e.source === n.id && e.type === 'default');
        const conditionalRemovals = removedEdges.filter((e) => e.source === n.id && e.type === 'conditional');

        if (!defaultRemoval && conditionalRemovals.length === 0) return n;

        let data = { ...n.data };

        if (defaultRemoval) {
          data = { ...data, next: null };
        }

        if (conditionalRemovals.length > 0 && n.data.stateType === 'task') {
          const conditions = [...((n.data as TaskNodeData).conditions ?? [])];
          conditionalRemovals.forEach((e) => {
            const idx = parseInt(e.sourceHandle?.replace('condition-', '') ?? '-1', 10);
            if (idx >= 0 && conditions[idx]) {
              conditions[idx] = { ...conditions[idx], next: '' };
            }
          });
          data = { ...(n.data as TaskNodeData), conditions };
        }

        return { ...n, data } as IODMNode;
      });
    }

    set({ nodes: updatedNodes, edges: applyEdgeChanges(changes, edges) });
  },

  onConnect: (connection) => {
    const { nodes, edges } = get();
    const isConditional = connection.sourceHandle?.startsWith('condition-');

    const newEdge = isConditional
      ? { ...connection, type: 'conditional' as const, data: { expression: '', resultPath: null }, label: '' }
      : { ...connection, type: 'default' as const, sourceHandle: 'default' };

    const targetNode = nodes.find((n) => n.id === connection.target);
    const targetLabel = targetNode?.data.label ?? connection.target ?? '';

    const updatedNodes = nodes.map((n) => {
      if (n.id !== connection.source) return n;

      if (isConditional && n.data.stateType === 'task') {
        const idx = parseInt(connection.sourceHandle!.replace('condition-', ''), 10);
        const conditions = [...((n.data as TaskNodeData).conditions ?? [])];
        if (conditions[idx]) {
          conditions[idx] = { ...conditions[idx], next: targetLabel };
        }
        return { ...n, data: { ...n.data, conditions } } as IODMNode;
      }

      if (!isConditional) {
        return { ...n, data: { ...n.data, next: targetLabel } } as IODMNode;
      }

      return n;
    });

    set({ nodes: updatedNodes, edges: addEdge(newEdge, edges) });
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setPolicyMeta: (meta) =>
    set({ policyMeta: { ...get().policyMeta, ...meta } }),

  updateNodeData: (id, data) => {
    const { nodes, edges } = get();

    let updatedEdges = edges;
    if ('conditions' in data && Array.isArray(data.conditions)) {
      updatedEdges = edges.map((e) => {
        if (e.source !== id || e.type !== 'conditional') return e;
        const idx = parseInt(e.sourceHandle?.replace('condition-', '') ?? '-1', 10);
        const condition = (data.conditions as Condition[])[idx];
        if (!condition) return e;
        return {
          ...e,
          label: condition.expression,
          data: { ...e.data, expression: condition.expression, resultPath: condition.resultPath },
        };
      });
    }

    set({
      nodes: nodes.map((n) =>
        n.id === id ? ({ ...n, data: { ...n.data, ...data } } as IODMNode) : n
      ),
      edges: updatedEdges,
    });
  },

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
