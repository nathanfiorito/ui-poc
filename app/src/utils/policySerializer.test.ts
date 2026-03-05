import { describe, it, expect } from 'vitest';
import { serializePolicy } from './policySerializer';
import { parsePolicy } from './policyParser';
import type { Policy, PolicyMeta } from '../types/policy';

const policyMeta: PolicyMeta = {
  id: '9218fd27-a11f-4b8d-ba31-41c4bd599a4f',
  name: 'Hello World Policy',
  description: 'This is a example of policy from the IODM application.',
  version: '1.0',
  startAt: 'DatabaseStateExample',
};

const helloWorldPolicy: Policy = {
  ...policyMeta,
  states: {
    DatabaseStateExample: {
      type: 'DataBase',
      next: 'TaskStateExample',
      end: false,
      loopOver: null,
      allowFailOnLoopOver: null,
      resource: {
        type: 'DynamoDB',
        dynamoDb: {
          tableName: 'exampleTable',
          PK: 'primaryKeyExample',
          SK: null,
          columns: ['firstColumnExample', 'secondColumnExample'],
          resultPath: 'outputDatabase',
          fullScan: false,
        },
      },
    },
    TaskStateExample: {
      type: 'task',
      next: 'APIStateExample',
      end: false,
      conditions: [
        { expression: 'input.age > 18', next: 'ReturnHigherThan', resultPath: null },
        { expression: 'input.age < 18', next: 'ReturnLowerThan', resultPath: null },
      ],
    },
    APIStateExample: {
      type: 'API',
      next: 'ResponseStateExample',
      end: false,
      resource: {
        route: 'https://api.example.com/clientes',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { cpf: 'input.client.cpf' },
        responsePath: 'outputApi',
        authentication: 'true',
      },
    },
    ReturnHigherThan: {
      type: 'Response',
      next: null,
      end: true,
      responseBody: { result: 'higher' },
    },
    ReturnLowerThan: {
      type: 'Response',
      next: null,
      end: true,
      responseBody: { result: 'lower' },
    },
    ResponseStateExample: {
      type: 'Response',
      next: null,
      end: true,
      responseBody: { clientData: 'outputApi', databaseData: 'outputDatabase' },
      resultPath: 'data',
    },
  },
};

describe('serializePolicy', () => {
  it('round-trips a full policy through parse → serialize', () => {
    const { nodes, edges } = parsePolicy(helloWorldPolicy);
    const result = serializePolicy(nodes, edges, policyMeta);

    expect(result.id).toBe(helloWorldPolicy.id);
    expect(result.name).toBe(helloWorldPolicy.name);
    expect(result.startAt).toBe(helloWorldPolicy.startAt);
    expect(Object.keys(result.states)).toHaveLength(6);
  });

  it('serializes DataBase state with correct next', () => {
    const { nodes, edges } = parsePolicy(helloWorldPolicy);
    const result = serializePolicy(nodes, edges, policyMeta);

    const dbState = result.states['DatabaseStateExample'];
    expect(dbState.type).toBe('DataBase');
    expect(dbState.next).toBe('TaskStateExample');
    expect(dbState.end).toBe(false);
  });

  it('serializes task state with conditions reconstructed from edges', () => {
    const { nodes, edges } = parsePolicy(helloWorldPolicy);
    const result = serializePolicy(nodes, edges, policyMeta);

    const taskState = result.states['TaskStateExample'];
    expect(taskState.type).toBe('task');
    expect(taskState.next).toBe('APIStateExample');

    if (taskState.type === 'task') {
      expect(taskState.conditions).toHaveLength(2);
      expect(taskState.conditions[0].expression).toBe('input.age > 18');
      expect(taskState.conditions[0].next).toBe('ReturnHigherThan');
      expect(taskState.conditions[1].expression).toBe('input.age < 18');
      expect(taskState.conditions[1].next).toBe('ReturnLowerThan');
    }
  });

  it('serializes API state with correct next', () => {
    const { nodes, edges } = parsePolicy(helloWorldPolicy);
    const result = serializePolicy(nodes, edges, policyMeta);

    const apiState = result.states['APIStateExample'];
    expect(apiState.type).toBe('API');
    expect(apiState.next).toBe('ResponseStateExample');
    expect(apiState.end).toBe(false);
  });

  it('serializes Response state with next=null and end=true', () => {
    const { nodes, edges } = parsePolicy(helloWorldPolicy);
    const result = serializePolicy(nodes, edges, policyMeta);

    const responseState = result.states['ResponseStateExample'];
    expect(responseState.type).toBe('Response');
    expect(responseState.next).toBeNull();
    expect(responseState.end).toBe(true);

    if (responseState.type === 'Response') {
      expect(responseState.resultPath).toBe('data');
      expect(responseState.responseBody).toEqual({
        clientData: 'outputApi',
        databaseData: 'outputDatabase',
      });
    }
  });

  it('serializes a minimal policy with a single ResponseNode', () => {
    const minimalPolicy: Policy = {
      id: 'min-001',
      name: 'Minimal',
      version: '1.0',
      startAt: 'End',
      states: {
        End: { type: 'Response', next: null, end: true, responseBody: {} },
      },
    };
    const minimalMeta: PolicyMeta = {
      id: 'min-001',
      name: 'Minimal',
      version: '1.0',
      startAt: 'End',
    };

    const { nodes, edges } = parsePolicy(minimalPolicy);
    const result = serializePolicy(nodes, edges, minimalMeta);

    expect(Object.keys(result.states)).toHaveLength(1);
    expect(result.states['End'].type).toBe('Response');
    expect(result.states['End'].next).toBeNull();
  });

  it('does not include label, stateType, or isStart in the output states', () => {
    const { nodes, edges } = parsePolicy(helloWorldPolicy);
    const result = serializePolicy(nodes, edges, policyMeta);

    for (const state of Object.values(result.states)) {
      expect(state).not.toHaveProperty('label');
      expect(state).not.toHaveProperty('stateType');
      expect(state).not.toHaveProperty('isStart');
    }
  });

  it('uses node.data.label as state key instead of node.id when they differ', () => {
    const { nodes, edges } = parsePolicy(helloWorldPolicy);
    // Simulate drag-and-drop: change node IDs to random ones while keeping labels
    const remappedNodes = nodes.map((n) => ({ ...n, id: `random-${Math.random()}` }));
    // Remap edges to use the new random IDs
    const idMap = new Map(nodes.map((n, i) => [n.id, remappedNodes[i].id]));
    const remappedEdges = edges.map((e) => ({
      ...e,
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
    }));

    const result = serializePolicy(remappedNodes, remappedEdges, policyMeta);

    // Keys should be labels (original state names), not random IDs
    expect(result.states['DatabaseStateExample']).toBeDefined();
    expect(result.states['TaskStateExample']).toBeDefined();
    expect(result.states['APIStateExample']).toBeDefined();
  });

  it('derives startAt from the node with isStart=true, overriding policyMeta.startAt', () => {
    const { nodes, edges } = parsePolicy(helloWorldPolicy);
    // Flip isStart to a different node while keeping policyMeta.startAt as 'DatabaseStateExample'
    const tweakedNodes = nodes.map((n) => ({
      ...n,
      data: { ...n.data, isStart: n.data.label === 'TaskStateExample' },
    }));

    const result = serializePolicy(tweakedNodes, edges, policyMeta);

    expect(result.startAt).toBe('TaskStateExample');
  });

  it('serializes task with empty conditions as conditions: []', () => {
    const emptyCondPolicy: Policy = {
      id: 'ec-001',
      name: 'Empty',
      version: '1.0',
      startAt: 'Decide',
      states: {
        Decide: { type: 'task', next: 'End', end: false, conditions: [] },
        End: { type: 'Response', next: null, end: true, responseBody: {} },
      },
    };
    const emptyCondMeta: PolicyMeta = { id: 'ec-001', name: 'Empty', version: '1.0', startAt: 'Decide' };

    const { nodes, edges } = parsePolicy(emptyCondPolicy);
    const result = serializePolicy(nodes, edges, emptyCondMeta);

    const taskState = result.states['Decide'];
    expect(taskState.type).toBe('task');
    if (taskState.type === 'task') {
      expect(taskState.conditions).toEqual([]);
    }
  });

  it('serializes task next as null when no default edge exists', () => {
    const noFallbackPolicy: Policy = {
      id: 'nf-001',
      name: 'No Fallback',
      version: '1.0',
      startAt: 'Decide',
      states: {
        Decide: {
          type: 'task',
          next: null,
          end: false,
          conditions: [{ expression: 'input.x > 0', next: 'End', resultPath: null }],
        },
        End: { type: 'Response', next: null, end: true, responseBody: {} },
      },
    };
    const noFallbackMeta: PolicyMeta = { id: 'nf-001', name: 'No Fallback', version: '1.0', startAt: 'Decide' };

    const { nodes, edges } = parsePolicy(noFallbackPolicy);
    const result = serializePolicy(nodes, edges, noFallbackMeta);

    const taskState = result.states['Decide'];
    expect(taskState.next).toBeNull();
  });

  it('preserves non-null resultPath in condition output', () => {
    const rpPolicy: Policy = {
      id: 'rp-001',
      name: 'RP Policy',
      version: '1.0',
      startAt: 'Decide',
      states: {
        Decide: {
          type: 'task',
          next: null,
          end: false,
          conditions: [{ expression: 'input.x > 0', next: 'End', resultPath: 'myResult' }],
        },
        End: { type: 'Response', next: null, end: true, responseBody: {} },
      },
    };
    const rpMeta: PolicyMeta = { id: 'rp-001', name: 'RP Policy', version: '1.0', startAt: 'Decide' };

    const { nodes, edges } = parsePolicy(rpPolicy);
    const result = serializePolicy(nodes, edges, rpMeta);

    const taskState = result.states['Decide'];
    if (taskState.type === 'task') {
      expect(taskState.conditions[0].resultPath).toBe('myResult');
    }
  });

  it('includes loopOver and allowFailOnLoopOver when present in node data', () => {
    const loopPolicy: Policy = {
      id: 'lp-001',
      name: 'Loop Policy',
      version: '1.0',
      startAt: 'LoopTask',
      states: {
        LoopTask: {
          type: 'task',
          next: 'End',
          end: false,
          loopOver: 'input.items',
          allowFailOnLoopOver: true,
          conditions: [],
        },
        End: { type: 'Response', next: null, end: true, responseBody: {} },
      },
    };
    const loopMeta: PolicyMeta = { id: 'lp-001', name: 'Loop Policy', version: '1.0', startAt: 'LoopTask' };

    const { nodes, edges } = parsePolicy(loopPolicy);
    const result = serializePolicy(nodes, edges, loopMeta);

    const taskState = result.states['LoopTask'];
    expect(taskState.type).toBe('task');
    if (taskState.type === 'task') {
      expect((taskState as unknown as Record<string, unknown>).loopOver).toBe('input.items');
      expect((taskState as unknown as Record<string, unknown>).allowFailOnLoopOver).toBe(true);
    }
  });

  it('falls back to node.id as state key when label is empty', () => {
    const { nodes, edges } = parsePolicy(helloWorldPolicy);
    // Clear the label on one node to trigger the fallback
    const tweakedNodes = nodes.map((n) =>
      n.id === 'APIStateExample' ? { ...n, data: { ...n.data, label: '' } } : n
    );

    const result = serializePolicy(tweakedNodes, edges, policyMeta);

    // The state should be keyed by node.id ('APIStateExample') because label is empty
    expect(result.states['APIStateExample']).toBeDefined();
  });

  it('sorts conditions by handle index even when edges are out of order', () => {
    const { nodes, edges } = parsePolicy(helloWorldPolicy);
    // Reverse the order of conditional edges to simulate out-of-order storage
    const taskEdges = edges.filter((e) => e.source === 'TaskStateExample' && e.type === 'conditional');
    const otherEdges = edges.filter((e) => !(e.source === 'TaskStateExample' && e.type === 'conditional'));
    const reversedEdges = [...otherEdges, ...taskEdges.reverse()];

    const result = serializePolicy(nodes, reversedEdges, policyMeta);

    const taskState = result.states['TaskStateExample'];
    if (taskState.type === 'task') {
      // condition-0 should always come first regardless of edge order
      expect(taskState.conditions[0].expression).toBe('input.age > 18');
      expect(taskState.conditions[1].expression).toBe('input.age < 18');
    }
  });

  it('resolves next references to labels, not internal node IDs', () => {
    const { nodes, edges } = parsePolicy(helloWorldPolicy);
    const remappedNodes = nodes.map((n) => ({ ...n, id: `id-${n.data.label}` }));
    const idMap = new Map(nodes.map((n, i) => [n.id, remappedNodes[i].id]));
    const remappedEdges = edges.map((e) => ({
      ...e,
      source: idMap.get(e.source) ?? e.source,
      target: idMap.get(e.target) ?? e.target,
    }));

    const result = serializePolicy(remappedNodes, remappedEdges, policyMeta);

    expect(result.states['DatabaseStateExample'].next).toBe('TaskStateExample');
    expect(result.states['APIStateExample'].next).toBe('ResponseStateExample');

    const taskState = result.states['TaskStateExample'];
    if (taskState.type === 'task') {
      expect(taskState.conditions[0].next).toBe('ReturnHigherThan');
      expect(taskState.conditions[1].next).toBe('ReturnLowerThan');
    }
  });
});
