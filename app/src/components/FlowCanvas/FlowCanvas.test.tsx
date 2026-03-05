import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { FlowCanvas } from './index';
import { useFlowStore } from '../../store/flowStore';
import { parsePolicy } from '../../utils/policyParser';
import { serializePolicy } from '../../utils/policySerializer';
import { validatePolicy } from '../../utils/validators';
import type { Policy } from '../../types/policy';
import type { IODMNode } from '../../types/flow';

// Captured props from ReactFlow mocks
let capturedProps: Record<string, unknown> = {};
let capturedBgProps: Record<string, unknown> = {};

vi.mock('reactflow', async (importOriginal) => {
  const actual = await importOriginal<typeof import('reactflow')>();
  return {
    ...actual,
    default: vi.fn((props: { children?: React.ReactNode }) => {
      capturedProps = props as Record<string, unknown>;
      return React.createElement(React.Fragment, null, props.children);
    }),
    Background: vi.fn((props) => {
      capturedBgProps = props;
      return null;
    }),
    Controls: vi.fn(() => null),
    MiniMap: vi.fn(() => null),
    useReactFlow: vi.fn(() => ({
      screenToFlowPosition: vi.fn(({ x, y }: { x: number; y: number }) => ({ x, y })),
    })),
  };
});

const mockToggleTheme = vi.fn();
let mockTheme = 'light';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(() => ({ theme: mockTheme, toggleTheme: mockToggleTheme })),
}));

const testPolicy: Policy = {
  id: 'test-policy',
  name: 'Test Policy',
  description: '',
  version: '1.0.0',
  startAt: 'QueryUser',
  states: {
    QueryUser: {
      type: 'DataBase',
      next: 'CheckAge',
      end: false,
      resource: {
        type: 'DynamoDB',
        dynamoDb: { tableName: 'Users', PK: 'userId', resultPath: 'user' },
      },
    },
    CheckAge: {
      type: 'task',
      next: null,
      end: false,
      conditions: [{ expression: 'input.user.age >= 18', next: 'Approved', resultPath: null }],
    },
    Approved: {
      type: 'Response',
      next: null,
      end: true,
      responseBody: {},
    },
  },
};

const defaultMeta = {
  id: 'test-id',
  name: 'Test Policy',
  description: '',
  version: '1.0.0',
  startAt: '',
};

beforeEach(() => {
  capturedProps = {};
  capturedBgProps = {};
  mockTheme = 'light';
  useFlowStore.setState({
    nodes: [],
    edges: [],
    policyMeta: defaultMeta,
    selectedNodeId: null,
  });
});

// ──────────────────────────────────────────────
// Group 1 — Store Integration
// ──────────────────────────────────────────────
describe('FlowCanvas — Store Integration', () => {
  it('renders with nodes from the store', () => {
    const mockNode: IODMNode = {
      id: 'node-1',
      type: 'DataBase',
      position: { x: 0, y: 0 },
      data: {
        label: 'QueryUser',
        stateType: 'DataBase',
        type: 'DataBase',
        next: 'CheckAge',
        end: false,
        resource: {
          type: 'DynamoDB',
          dynamoDb: { tableName: 'Users', PK: 'userId', resultPath: 'user' },
        },
      },
    };

    useFlowStore.setState({ nodes: [mockNode] });
    render(<FlowCanvas />);

    const nodes = capturedProps.nodes as IODMNode[];
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('node-1');
  });

  it('renders with edges from the store', () => {
    const mockEdge = {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'default' as const,
    };

    useFlowStore.setState({ edges: [mockEdge] });
    render(<FlowCanvas />);

    const edges = capturedProps.edges as typeof mockEdge[];
    expect(edges).toHaveLength(1);
    expect(edges[0].id).toBe('edge-1');
  });

  it('re-renders when store nodes are updated', async () => {
    render(<FlowCanvas />);
    expect((capturedProps.nodes as unknown[]).length).toBe(0);

    const mockNode: IODMNode = {
      id: 'node-2',
      type: 'Response',
      position: { x: 0, y: 0 },
      data: {
        label: 'Done',
        stateType: 'Response',
        type: 'Response',
        next: null,
        end: true,
        responseBody: {},
      },
    };

    await act(async () => {
      useFlowStore.setState({ nodes: [mockNode] });
    });

    const nodes = capturedProps.nodes as IODMNode[];
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('node-2');
  });
});

// ──────────────────────────────────────────────
// Group 2 — Event Handler Integration
// ──────────────────────────────────────────────
describe('FlowCanvas — Event Handler Integration', () => {
  it('onNodeClick sets selectedNodeId in store', () => {
    render(<FlowCanvas />);

    const onNodeClick = capturedProps.onNodeClick as (e: MouseEvent, node: { id: string }) => void;
    act(() => {
      onNodeClick({} as MouseEvent, { id: 'node-1' });
    });

    expect(useFlowStore.getState().selectedNodeId).toBe('node-1');
  });

  it('onPaneClick clears selectedNodeId', () => {
    useFlowStore.setState({ selectedNodeId: 'node-1' });
    render(<FlowCanvas />);

    const onPaneClick = capturedProps.onPaneClick as () => void;
    act(() => {
      onPaneClick();
    });

    expect(useFlowStore.getState().selectedNodeId).toBeNull();
  });

  it('onDragOver sets dropEffect to move and calls preventDefault', () => {
    render(<FlowCanvas />);

    const onDragOver = capturedProps.onDragOver as (e: React.DragEvent<HTMLDivElement>) => void;
    const mockEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: '' },
    } as unknown as React.DragEvent<HTMLDivElement>;

    act(() => {
      onDragOver(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.dataTransfer.dropEffect).toBe('move');
  });

  it('onDrop with valid type adds node to store', () => {
    render(<FlowCanvas />);

    const onDrop = capturedProps.onDrop as (e: React.DragEvent<HTMLDivElement>) => void;
    const mockEvent = {
      preventDefault: vi.fn(),
      clientX: 100,
      clientY: 200,
      dataTransfer: {
        getData: vi.fn((key: string) => (key === 'application/reactflow' ? 'DataBase' : '')),
      },
    } as unknown as React.DragEvent<HTMLDivElement>;

    act(() => {
      onDrop(mockEvent);
    });

    expect(useFlowStore.getState().nodes).toHaveLength(1);
    expect(useFlowStore.getState().nodes[0].type).toBe('DataBase');
  });

  it('onDrop with empty type does not add node', () => {
    render(<FlowCanvas />);

    const onDrop = capturedProps.onDrop as (e: React.DragEvent<HTMLDivElement>) => void;
    const mockEvent = {
      preventDefault: vi.fn(),
      clientX: 100,
      clientY: 200,
      dataTransfer: {
        getData: vi.fn(() => ''),
      },
    } as unknown as React.DragEvent<HTMLDivElement>;

    act(() => {
      onDrop(mockEvent);
    });

    expect(useFlowStore.getState().nodes).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// Group 3 — Theme Integration
// ──────────────────────────────────────────────
describe('FlowCanvas — Theme Integration', () => {
  it('uses dark colors for Background in dark mode', () => {
    mockTheme = 'dark';
    render(<FlowCanvas />);
    expect(capturedBgProps.color).toBe('#4b5563');
  });

  it('uses light colors for Background in light mode', () => {
    mockTheme = 'light';
    render(<FlowCanvas />);
    expect(capturedBgProps.color).toBe('#d1d5db');
  });
});

// ──────────────────────────────────────────────
// Group 4 — Full Policy Round-Trip Integration
// ──────────────────────────────────────────────
describe('FlowCanvas — Full Policy Round-Trip Integration', () => {
  it('importing a policy populates store with correct nodes and edges', () => {
    const { nodes, edges } = parsePolicy(testPolicy);

    act(() => {
      useFlowStore.getState().setNodes(nodes as IODMNode[]);
      useFlowStore.getState().setEdges(edges);
    });

    const state = useFlowStore.getState();
    expect(state.nodes).toHaveLength(3);
    expect(state.edges.length).toBeGreaterThan(0);

    const nodeTypes = state.nodes.map((n) => n.type);
    expect(nodeTypes).toContain('DataBase');
    expect(nodeTypes).toContain('task');
    expect(nodeTypes).toContain('Response');
  });

  it('FlowCanvas receives imported nodes from store', () => {
    const { nodes, edges } = parsePolicy(testPolicy);

    act(() => {
      useFlowStore.getState().setNodes(nodes as IODMNode[]);
      useFlowStore.getState().setEdges(edges);
    });

    render(<FlowCanvas />);

    const capturedNodes = capturedProps.nodes as IODMNode[];
    expect(capturedNodes).toHaveLength(3);
    const labels = capturedNodes.map((n) => n.data.label);
    expect(labels).toContain('QueryUser');
    expect(labels).toContain('CheckAge');
    expect(labels).toContain('Approved');
  });

  it('parse → serialize → validate produces no errors', () => {
    const { nodes, edges } = parsePolicy(testPolicy);

    act(() => {
      useFlowStore.getState().setNodes(nodes as IODMNode[]);
      useFlowStore.getState().setEdges(edges);
      useFlowStore.getState().setPolicyMeta({ startAt: testPolicy.startAt });
    });

    const state = useFlowStore.getState();
    const serialized = serializePolicy(state.nodes, state.edges, state.policyMeta);
    const errors = validatePolicy(serialized);

    expect(errors).toHaveLength(0);
  });
});
