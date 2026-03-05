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
});
