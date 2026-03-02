import { describe, it, expect } from 'vitest'
import type { Policy, DatabaseState, TaskState, ApiState, ResponseState } from '../../types/policy'

describe('Policy types', () => {
  it('should accept a valid DatabaseState', () => {
    const state: DatabaseState = {
      type: 'DataBase',
      next: 'NextState',
      end: false,
      resource: {
        type: 'DynamoDB',
        dynamoDb: {
          tableName: 'Users',
          PK: 'user#001',
          resultPath: 'outputDatabase',
        },
      },
    }
    expect(state.type).toBe('DataBase')
    expect(state.resource.dynamoDb.tableName).toBe('Users')
  })

  it('should accept a valid TaskState', () => {
    const state: TaskState = {
      type: 'task',
      next: 'DefaultNext',
      end: false,
      conditions: [
        { expression: 'input.age > 18', next: 'AdultFlow', resultPath: null },
      ],
    }
    expect(state.conditions).toHaveLength(1)
    expect(state.conditions[0].expression).toBe('input.age > 18')
  })

  it('should accept a valid ApiState', () => {
    const state: ApiState = {
      type: 'API',
      next: 'NextState',
      end: false,
      resource: {
        route: 'https://api.example.com/data',
        method: 'POST',
        responsePath: 'outputApi',
      },
    }
    expect(state.resource.method).toBe('POST')
  })

  it('should accept a valid ResponseState', () => {
    const state: ResponseState = {
      type: 'Response',
      next: null,
      end: true,
      responseBody: { data: 'outputDatabase' },
    }
    expect(state.end).toBe(true)
    expect(state.next).toBeNull()
  })

  it('should accept the Hello World Policy payload', () => {
    const policy: Policy = {
      id: '9218fd27-a11f-4b8d-ba31-41c4bd599a4f',
      name: 'Hello World Policy',
      description: 'Test policy',
      version: '1.0',
      startAt: 'DatabaseStateExample',
      states: {
        DatabaseStateExample: {
          type: 'DataBase',
          next: 'TaskStateExample',
          end: false,
          resource: {
            type: 'DynamoDB',
            dynamoDb: {
              tableName: 'exampleTable',
              PK: 'primaryKeyExample',
              columns: ['col1', 'col2'],
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
          ],
        },
        APIStateExample: {
          type: 'API',
          next: 'ResponseStateExample',
          end: false,
          resource: {
            route: 'https://api.example.com/clientes',
            method: 'POST',
            responsePath: 'outputApi',
          },
        },
        ResponseStateExample: {
          type: 'Response',
          next: null,
          end: true,
          responseBody: { clientData: 'outputApi', databaseData: 'outputDatabase' },
          resultPath: 'data',
        },
      },
    }

    expect(policy.startAt).toBe('DatabaseStateExample')
    expect(Object.keys(policy.states)).toHaveLength(4)
  })
})
