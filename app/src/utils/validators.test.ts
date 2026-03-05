import { describe, it, expect } from 'vitest';
import { validatePolicy } from './validators';
import type { Policy } from '../types/policy';

// Canonical valid policy used as baseline for all tests
const validPolicy: Policy = {
  id: 'test-001',
  name: 'Test Policy',
  version: '1.0',
  startAt: 'FetchData',
  states: {
    FetchData: {
      type: 'DataBase',
      next: 'Decide',
      end: false,
      loopOver: null,
      allowFailOnLoopOver: null,
      resource: {
        type: 'DynamoDB',
        dynamoDb: {
          tableName: 'myTable',
          PK: 'pk',
          SK: null,
          resultPath: 'dbResult',
          fullScan: false,
        },
      },
    },
    Decide: {
      type: 'task',
      next: 'CallApi',
      end: false,
      conditions: [
        { expression: 'input.age > 18', next: 'Done', resultPath: null },
      ],
    },
    CallApi: {
      type: 'API',
      next: 'Done',
      end: false,
      resource: {
        route: 'https://api.example.com/data',
        method: 'GET',
        responsePath: 'apiResult',
        authentication: false,
      },
    },
    Done: {
      type: 'Response',
      next: null,
      end: true,
      responseBody: { result: 'ok' },
    },
  },
};

function clonePolicy(policy: Policy): Policy {
  return JSON.parse(JSON.stringify(policy));
}

// ─── Happy path ──────────────────────────────────────────────────────────────

describe('happy path', () => {
  it('returns no errors for a valid policy', () => {
    expect(validatePolicy(validPolicy)).toHaveLength(0);
  });
});

// ─── Rule 1: no_end_state ─────────────────────────────────────────────────────

describe('no_end_state', () => {
  it('reports error when no state has end: true', () => {
    const policy = clonePolicy(validPolicy);
    (policy.states['Done'] as { end: boolean }).end = false;
    const errors = validatePolicy(policy);
    expect(errors.some((e) => e.type === 'no_end_state')).toBe(true);
  });

  it('does not report error when at least one state has end: true', () => {
    const errors = validatePolicy(validPolicy);
    expect(errors.some((e) => e.type === 'no_end_state')).toBe(false);
  });
});

// ─── Rule 2: end_with_next ────────────────────────────────────────────────────

describe('end_with_next', () => {
  it('reports error when end: true state has a non-null next', () => {
    const policy = clonePolicy(validPolicy);
    (policy.states['Done'] as { next: string | null }).next = 'FetchData';
    const errors = validatePolicy(policy);
    expect(errors.some((e) => e.type === 'end_with_next' && e.stateKey === 'Done')).toBe(true);
  });

  it('does not report error when end: true state has next: null', () => {
    const errors = validatePolicy(validPolicy);
    expect(errors.some((e) => e.type === 'end_with_next')).toBe(false);
  });
});

// ─── Rule 3: invalid_start_at ────────────────────────────────────────────────

describe('invalid_start_at', () => {
  it('reports error when startAt references a non-existent state', () => {
    const policy = clonePolicy(validPolicy);
    policy.startAt = 'NonExistent';
    const errors = validatePolicy(policy);
    expect(errors.some((e) => e.type === 'invalid_start_at' && e.value === 'NonExistent')).toBe(true);
  });

  it('does not report error when startAt references an existing state', () => {
    const errors = validatePolicy(validPolicy);
    expect(errors.some((e) => e.type === 'invalid_start_at')).toBe(false);
  });
});

// ─── Rule 4: invalid_next ─────────────────────────────────────────────────────

describe('invalid_next', () => {
  it('reports error when state.next references a non-existent state', () => {
    const policy = clonePolicy(validPolicy);
    (policy.states['FetchData'] as { next: string }).next = 'Ghost';
    const errors = validatePolicy(policy);
    expect(errors.some((e) => e.type === 'invalid_next' && e.stateKey === 'FetchData' && e.value === 'Ghost')).toBe(true);
  });

  it('does not report error when state.next is null', () => {
    const errors = validatePolicy(validPolicy);
    expect(errors.some((e) => e.type === 'invalid_next' && e.stateKey === 'Done')).toBe(false);
  });

  it('does not report error when state.next references a valid state', () => {
    const errors = validatePolicy(validPolicy);
    expect(errors.some((e) => e.type === 'invalid_next')).toBe(false);
  });
});

// ─── Rule 5: invalid_condition_next ──────────────────────────────────────────

describe('invalid_condition_next', () => {
  it('reports error when condition.next references a non-existent state', () => {
    const policy = clonePolicy(validPolicy);
    if (policy.states['Decide'].type === 'task') {
      policy.states['Decide'].conditions[0].next = 'NoSuchState';
    }
    const errors = validatePolicy(policy);
    expect(errors.some((e) => e.type === 'invalid_condition_next' && e.stateKey === 'Decide')).toBe(true);
  });

  it('reports errors for all invalid condition nexts', () => {
    const policy = clonePolicy(validPolicy);
    if (policy.states['Decide'].type === 'task') {
      policy.states['Decide'].conditions.push({ expression: 'input.age === 18', next: 'AlsoMissing', resultPath: null });
    }
    const errors = validatePolicy(policy);
    const condErrors = errors.filter((e) => e.type === 'invalid_condition_next');
    expect(condErrors).toHaveLength(1);
    expect(condErrors[0].value).toBe('AlsoMissing');
  });

  it('does not report error when all condition nexts reference valid states', () => {
    const errors = validatePolicy(validPolicy);
    expect(errors.some((e) => e.type === 'invalid_condition_next')).toBe(false);
  });
});

// ─── Rule 6: duplicate_result_path ───────────────────────────────────────────

describe('duplicate_result_path', () => {
  it('reports error when two DataBase states write the same resultPath', () => {
    const policy = clonePolicy(validPolicy);
    policy.states['FetchData2'] = {
      type: 'DataBase',
      next: 'Done',
      end: false,
      loopOver: null,
      allowFailOnLoopOver: null,
      resource: {
        type: 'DynamoDB',
        dynamoDb: { tableName: 'other', PK: 'pk', SK: null, resultPath: 'dbResult', fullScan: false },
      },
    };
    const errors = validatePolicy(policy);
    expect(errors.some((e) => e.type === 'duplicate_result_path' && e.value === 'dbResult')).toBe(true);
  });

  it('reports error when a DataBase and an API state write the same resultPath', () => {
    const policy = clonePolicy(validPolicy);
    if (policy.states['CallApi'].type === 'API') {
      policy.states['CallApi'].resource.responsePath = 'dbResult';
    }
    const errors = validatePolicy(policy);
    expect(errors.some((e) => e.type === 'duplicate_result_path' && e.value === 'dbResult')).toBe(true);
  });

  it('reports error when a condition resultPath collides with a DataBase resultPath', () => {
    const policy = clonePolicy(validPolicy);
    if (policy.states['Decide'].type === 'task') {
      policy.states['Decide'].conditions[0].resultPath = 'dbResult';
    }
    const errors = validatePolicy(policy);
    expect(errors.some((e) => e.type === 'duplicate_result_path' && e.value === 'dbResult')).toBe(true);
  });

  it('reports error when a Response resultPath collides with another state', () => {
    const policy = clonePolicy(validPolicy);
    (policy.states['Done'] as { resultPath: string }).resultPath = 'dbResult';
    const errors = validatePolicy(policy);
    expect(errors.some((e) => e.type === 'duplicate_result_path' && e.value === 'dbResult')).toBe(true);
  });

  it('does not report error for a unique Response resultPath', () => {
    const policy = clonePolicy(validPolicy);
    (policy.states['Done'] as { resultPath: string }).resultPath = 'uniquePath';
    const errors = validatePolicy(policy);
    expect(errors.some((e) => e.type === 'duplicate_result_path')).toBe(false);
  });
});

// ─── Multiple errors ──────────────────────────────────────────────────────────

describe('multiple errors', () => {
  it('collects multiple violations at once', () => {
    const policy = clonePolicy(validPolicy);
    // Violation 1: startAt points to non-existent state
    policy.startAt = 'Missing';
    // Violation 2: FetchData.next points to non-existent state
    (policy.states['FetchData'] as { next: string }).next = 'AlsoMissing';
    // Violation 3: condition.next points to non-existent state
    if (policy.states['Decide'].type === 'task') {
      policy.states['Decide'].conditions[0].next = 'NoState';
    }

    const errors = validatePolicy(policy);
    expect(errors.some((e) => e.type === 'invalid_start_at')).toBe(true);
    expect(errors.some((e) => e.type === 'invalid_next')).toBe(true);
    expect(errors.some((e) => e.type === 'invalid_condition_next')).toBe(true);
    expect(errors.length).toBeGreaterThanOrEqual(3);
  });
});
