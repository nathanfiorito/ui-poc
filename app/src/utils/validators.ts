import type { Node } from 'reactflow';
import type { IODMNodeData } from '../types/flow';
import type { Policy } from '../types/policy';
import type { DatabaseState } from '../types/policy/database';
import type { ApiState } from '../types/policy/api';
import type { ResponseState } from '../types/policy/response';
import type { TaskState } from '../types/policy/task';

export interface ValidationError {
  type: 'empty_name' | 'duplicate_name';
  nodeId: string;
  label: string;
}

export function validateNodeNames(nodes: Node<IODMNodeData>[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Map<string, string>();

  for (const node of nodes) {
    const label = node.data.label?.trim() ?? '';

    if (!label) {
      errors.push({ type: 'empty_name', nodeId: node.id, label: node.data.label });
      continue;
    }

    if (seen.has(label)) {
      errors.push({ type: 'duplicate_name', nodeId: node.id, label });
    } else {
      seen.set(label, node.id);
    }
  }

  return errors;
}

export type PolicyValidationErrorType =
  | 'no_end_state'
  | 'end_with_next'
  | 'invalid_start_at'
  | 'invalid_next'
  | 'invalid_condition_next'
  | 'duplicate_result_path';

export interface PolicyValidationError {
  type: PolicyValidationErrorType;
  message: string;
  stateKey?: string;
  value?: string;
}

function checkResultPath(
  resultPath: string,
  stateKey: string,
  resultPathMap: Map<string, string>,
  errors: PolicyValidationError[],
): void {
  const owner = resultPathMap.get(resultPath);
  if (owner !== undefined && owner !== stateKey) {
    errors.push({
      type: 'duplicate_result_path',
      message: `resultPath "${resultPath}" is already written by state "${owner}"`,
      stateKey,
      value: resultPath,
    });
  } else {
    resultPathMap.set(resultPath, stateKey);
  }
}

export function validatePolicy(policy: Policy): PolicyValidationError[] {
  const errors: PolicyValidationError[] = [];
  const stateKeys = new Set(Object.keys(policy.states));
  const resultPathMap = new Map<string, string>();

  // Rule 1 & 2: end state checks
  const endStates = Object.entries(policy.states).filter(([, s]) => s.end);
  if (endStates.length === 0) {
    errors.push({ type: 'no_end_state', message: 'Policy must have at least one state with end: true' });
  }
  for (const [key, state] of endStates) {
    if (state.next !== null) {
      errors.push({
        type: 'end_with_next',
        message: `State "${key}" has end: true but also has next: "${state.next}"`,
        stateKey: key,
        value: state.next,
      });
    }
  }

  // Rule 3: startAt references an existing state
  if (!stateKeys.has(policy.startAt)) {
    errors.push({
      type: 'invalid_start_at',
      message: `startAt references unknown state "${policy.startAt}"`,
      value: policy.startAt,
    });
  }

  for (const [key, state] of Object.entries(policy.states)) {
    // Rule 4: next references an existing state
    if (state.next !== null && !stateKeys.has(state.next)) {
      errors.push({
        type: 'invalid_next',
        message: `State "${key}" has next: "${state.next}" which does not exist`,
        stateKey: key,
        value: state.next,
      });
    }

    // Rule 5 & 6 per type
    if (state.type === 'DataBase') {
      const db = state as DatabaseState;
      checkResultPath(db.resource.dynamoDb.resultPath, key, resultPathMap, errors);
    } else if (state.type === 'API') {
      const api = state as ApiState;
      checkResultPath(api.resource.responsePath, key, resultPathMap, errors);
    } else if (state.type === 'task') {
      const task = state as TaskState;
      for (const condition of task.conditions) {
        // Rule 5: condition.next must reference an existing state
        if (!stateKeys.has(condition.next)) {
          errors.push({
            type: 'invalid_condition_next',
            message: `State "${key}" has a condition with next: "${condition.next}" which does not exist`,
            stateKey: key,
            value: condition.next,
          });
        }
        // Rule 6: condition resultPath
        if (condition.resultPath) {
          checkResultPath(condition.resultPath, key, resultPathMap, errors);
        }
      }
    } else if (state.type === 'Response') {
      const response = state as ResponseState;
      if (response.resultPath) {
        checkResultPath(response.resultPath, key, resultPathMap, errors);
      }
    }
  }

  return errors;
}
