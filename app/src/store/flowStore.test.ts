import { describe, it, expect, beforeEach } from 'vitest';
import type { NodeChange, EdgeChange, Connection } from 'reactflow';
import { useFlowStore } from './flowStore';
import type { IODMNode, IODMEdge } from '../types/flow';

const initialPolicyMeta = {
  id: '',
  name: 'New Policy',
  description: '',
  version: '1.0.0',
  startAt: '',
};

const makeNode = (id: string): IODMNode => ({
  id,
  type: 'task',
  position: { x: 0, y: 0 },
  data: {
    label: id,
    stateType: 'task',
    type: 'task',
    conditions: [],
    next: null,
    end: false,
  },
});

const makeEdge = (id: string, source: string, target: string): IODMEdge => ({
  id,
  source,
  target,
});

beforeEach(() => {
  useFlowStore.setState({
    nodes: [],
    edges: [],
    policyMeta: { ...initialPolicyMeta },
    selectedNodeId: null,
  });
});

describe('flowStore — initial state', () => {
  it('starts with empty nodes and edges', () => {
    const { nodes, edges } = useFlowStore.getState();
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });

  it('starts with default policyMeta', () => {
    const { policyMeta } = useFlowStore.getState();
    expect(policyMeta).toEqual(initialPolicyMeta);
  });

  it('starts with selectedNodeId as null', () => {
    const { selectedNodeId } = useFlowStore.getState();
    expect(selectedNodeId).toBeNull();
  });
});

describe('flowStore — setNodes', () => {
  it('replaces nodes array', () => {
    const node = makeNode('n1');
    useFlowStore.getState().setNodes([node]);
    expect(useFlowStore.getState().nodes).toEqual([node]);
  });

  it('replaces existing nodes with a new set', () => {
    useFlowStore.getState().setNodes([makeNode('n1'), makeNode('n2')]);
    useFlowStore.getState().setNodes([makeNode('n3')]);
    const { nodes } = useFlowStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('n3');
  });
});

describe('flowStore — setEdges', () => {
  it('replaces edges array', () => {
    const edge = makeEdge('e1', 'n1', 'n2');
    useFlowStore.getState().setEdges([edge]);
    expect(useFlowStore.getState().edges).toEqual([edge]);
  });

  it('replaces existing edges with a new set', () => {
    useFlowStore.getState().setEdges([makeEdge('e1', 'a', 'b')]);
    useFlowStore.getState().setEdges([makeEdge('e2', 'c', 'd')]);
    const { edges } = useFlowStore.getState();
    expect(edges).toHaveLength(1);
    expect(edges[0].id).toBe('e2');
  });
});

describe('flowStore — onNodesChange', () => {
  it('applies position change to a node', () => {
    const node = makeNode('n1');
    useFlowStore.getState().setNodes([node]);

    const change: NodeChange = {
      type: 'position',
      id: 'n1',
      position: { x: 100, y: 200 },
    };
    useFlowStore.getState().onNodesChange([change]);

    const { nodes } = useFlowStore.getState();
    expect(nodes[0].position).toEqual({ x: 100, y: 200 });
  });

  it('removes a node on remove change', () => {
    useFlowStore.getState().setNodes([makeNode('n1'), makeNode('n2')]);

    const change: NodeChange = { type: 'remove', id: 'n1' };
    useFlowStore.getState().onNodesChange([change]);

    const { nodes } = useFlowStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('n2');
  });
});

describe('flowStore — onEdgesChange', () => {
  it('removes an edge on remove change', () => {
    useFlowStore.getState().setEdges([makeEdge('e1', 'n1', 'n2'), makeEdge('e2', 'n2', 'n3')]);

    const change: EdgeChange = { type: 'remove', id: 'e1' };
    useFlowStore.getState().onEdgesChange([change]);

    const { edges } = useFlowStore.getState();
    expect(edges).toHaveLength(1);
    expect(edges[0].id).toBe('e2');
  });
});

describe('flowStore — onConnect', () => {
  it('adds a new edge from a connection', () => {
    useFlowStore.getState().setNodes([makeNode('n1'), makeNode('n2')]);

    const connection: Connection = {
      source: 'n1',
      target: 'n2',
      sourceHandle: null,
      targetHandle: null,
    };
    useFlowStore.getState().onConnect(connection);

    const { edges } = useFlowStore.getState();
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('n1');
    expect(edges[0].target).toBe('n2');
  });

  it('does not duplicate an edge that already exists', () => {
    const connection: Connection = {
      source: 'n1',
      target: 'n2',
      sourceHandle: null,
      targetHandle: null,
    };
    useFlowStore.getState().onConnect(connection);
    useFlowStore.getState().onConnect(connection);

    // reactflow's addEdge deduplicates by source+target+handles
    const { edges } = useFlowStore.getState();
    expect(edges).toHaveLength(1);
  });
});

describe('flowStore — setSelectedNodeId', () => {
  it('sets a selected node id', () => {
    useFlowStore.getState().setSelectedNodeId('n1');
    expect(useFlowStore.getState().selectedNodeId).toBe('n1');
  });

  it('clears the selected node id with null', () => {
    useFlowStore.getState().setSelectedNodeId('n1');
    useFlowStore.getState().setSelectedNodeId(null);
    expect(useFlowStore.getState().selectedNodeId).toBeNull();
  });
});

describe('flowStore — setPolicyMeta', () => {
  it('merges partial meta into existing policyMeta', () => {
    useFlowStore.getState().setPolicyMeta({ name: 'My Policy', startAt: 'StateA' });
    const { policyMeta } = useFlowStore.getState();
    expect(policyMeta.name).toBe('My Policy');
    expect(policyMeta.startAt).toBe('StateA');
    expect(policyMeta.version).toBe('1.0.0'); // unchanged
  });

  it('does not overwrite unrelated fields', () => {
    useFlowStore.getState().setPolicyMeta({ id: 'policy-123' });
    const { policyMeta } = useFlowStore.getState();
    expect(policyMeta.id).toBe('policy-123');
    expect(policyMeta.name).toBe('New Policy');
  });
});

describe('flowStore — updateNodeData', () => {
  it('merges data into the target node', () => {
    useFlowStore.getState().setNodes([makeNode('n1'), makeNode('n2')]);
    useFlowStore.getState().updateNodeData('n1', { label: 'Updated Label' });

    const { nodes } = useFlowStore.getState();
    expect(nodes.find((n) => n.id === 'n1')?.data.label).toBe('Updated Label');
    expect(nodes.find((n) => n.id === 'n2')?.data.label).toBe('n2'); // unchanged
  });

  it('does not modify other nodes', () => {
    useFlowStore.getState().setNodes([makeNode('n1'), makeNode('n2')]);
    useFlowStore.getState().updateNodeData('n1', { label: 'Changed' });

    const n2 = useFlowStore.getState().nodes.find((n) => n.id === 'n2');
    expect(n2?.data.label).toBe('n2');
  });

  it('is a no-op for unknown node id', () => {
    useFlowStore.getState().setNodes([makeNode('n1')]);
    useFlowStore.getState().updateNodeData('nonexistent', { label: 'X' });

    const { nodes } = useFlowStore.getState();
    expect(nodes[0].data.label).toBe('n1');
  });
});
