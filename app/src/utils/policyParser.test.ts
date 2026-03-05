import { describe, it, expect } from 'vitest';
import { parsePolicy } from './policyParser';
import type { Policy } from '../types/policy';

const minimalPolicy: Policy = {
  id: 'min-001',
  name: 'Minimal Policy',
  version: '1.0',
  startAt: 'End',
  states: {
    End: {
      type: 'Response',
      next: null,
      end: true,
      responseBody: {},
    },
  },
};

const databasePolicy: Policy = {
  id: 'db-001',
  name: 'DB Policy',
  version: '1.0',
  startAt: 'FetchData',
  states: {
    FetchData: {
      type: 'DataBase',
      next: 'End',
      end: false,
      resource: {
        type: 'DynamoDB',
        dynamoDb: { tableName: 'Users', PK: 'user#1', resultPath: 'userData' },
      },
    },
    End: {
      type: 'Response',
      next: null,
      end: true,
      responseBody: { user: 'userData' },
    },
  },
};

const taskPolicy: Policy = {
  id: 'task-001',
  name: 'Task Policy',
  version: '1.0',
  startAt: 'Decide',
  states: {
    Decide: {
      type: 'task',
      next: 'DefaultEnd',
      end: false,
      conditions: [
        { expression: 'input.age > 18', next: 'Adult', resultPath: null },
        { expression: 'input.age < 18', next: 'Minor', resultPath: null },
      ],
    },
    Adult: { type: 'Response', next: null, end: true, responseBody: { result: 'adult' } },
    Minor: { type: 'Response', next: null, end: true, responseBody: { result: 'minor' } },
    DefaultEnd: { type: 'Response', next: null, end: true, responseBody: { result: 'default' } },
  },
};

const helloWorldPolicy: Policy = {
  id: '9218fd27-a11f-4b8d-ba31-41c4bd599a4f',
  name: 'Hello World Policy',
  description: 'This is a example of policy from the IODM application.',
  version: '1.0',
  startAt: 'DatabaseStateExample',
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

describe('parsePolicy', () => {
  it('parses a minimal policy with a single ResponseNode', () => {
    const { nodes, edges } = parsePolicy(minimalPolicy);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('End');
    expect(nodes[0].type).toBe('Response');
    expect(nodes[0].data.isStart).toBe(true);
    expect(edges).toHaveLength(0);
  });

  it('parses a policy with DatabaseNode and creates a DefaultEdge', () => {
    const { nodes, edges } = parsePolicy(databasePolicy);

    expect(nodes).toHaveLength(2);

    const dbNode = nodes.find(n => n.id === 'FetchData');
    expect(dbNode).toBeDefined();
    expect(dbNode?.type).toBe('DataBase');
    expect(dbNode?.data.isStart).toBe(true);

    const responseNode = nodes.find(n => n.id === 'End');
    expect(responseNode?.data.isStart).toBe(false);

    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('FetchData');
    expect(edges[0].target).toBe('End');
    expect(edges[0].type).toBe('default');
  });

  it('parses a TaskNode and creates ConditionalEdges plus a fallback DefaultEdge', () => {
    const { nodes, edges } = parsePolicy(taskPolicy);

    expect(nodes).toHaveLength(4);

    const taskNode = nodes.find(n => n.id === 'Decide');
    expect(taskNode?.type).toBe('task');

    // 2 conditional edges + 1 default (fallback next)
    const conditionalEdges = edges.filter(e => e.type === 'conditional');
    const defaultEdges = edges.filter(e => e.type === 'default');

    expect(conditionalEdges).toHaveLength(2);
    expect(defaultEdges).toHaveLength(1);

    expect(conditionalEdges[0].source).toBe('Decide');
    expect(conditionalEdges[0].target).toBe('Adult');
    expect(conditionalEdges[0].sourceHandle).toBe('condition-0');
    expect(conditionalEdges[0].label).toBe('input.age > 18');

    expect(conditionalEdges[1].source).toBe('Decide');
    expect(conditionalEdges[1].target).toBe('Minor');
    expect(conditionalEdges[1].sourceHandle).toBe('condition-1');
    expect(conditionalEdges[1].label).toBe('input.age < 18');

    expect(defaultEdges[0].source).toBe('Decide');
    expect(defaultEdges[0].target).toBe('DefaultEnd');
  });

  it('marks the startAt state as isStart=true and others as false', () => {
    const { nodes } = parsePolicy(helloWorldPolicy);

    const startNode = nodes.find(n => n.id === 'DatabaseStateExample');
    expect(startNode?.data.isStart).toBe(true);

    const nonStartNodes = nodes.filter(n => n.id !== 'DatabaseStateExample');
    nonStartNodes.forEach(n => expect(n.data.isStart).toBe(false));
  });

  it('parses the full Hello World policy with all 4 node types and correct edges', () => {
    const { nodes, edges } = parsePolicy(helloWorldPolicy);

    expect(nodes).toHaveLength(6);

    const nodeIds = nodes.map(n => n.id);
    expect(nodeIds).toContain('DatabaseStateExample');
    expect(nodeIds).toContain('TaskStateExample');
    expect(nodeIds).toContain('APIStateExample');
    expect(nodeIds).toContain('ResponseStateExample');
    expect(nodeIds).toContain('ReturnHigherThan');
    expect(nodeIds).toContain('ReturnLowerThan');

    const conditionalEdges = edges.filter(e => e.type === 'conditional');
    const defaultEdges = edges.filter(e => e.type === 'default');

    // DatabaseStateExample→Task, Task(fallback)→API, API→Response = 3 default edges
    expect(defaultEdges).toHaveLength(3);
    // 2 conditions in TaskStateExample
    expect(conditionalEdges).toHaveLength(2);

    // ResponseNode generates no outgoing edge
    const responseEdges = edges.filter(e => e.source === 'ResponseStateExample');
    expect(responseEdges).toHaveLength(0);
  });

  it('applies Dagre layout so all node positions are numeric coordinates', () => {
    const { nodes } = parsePolicy(helloWorldPolicy);
    nodes.forEach(node => {
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
      expect(isFinite(node.position.x)).toBe(true);
      expect(isFinite(node.position.y)).toBe(true);
    });
  });
});
