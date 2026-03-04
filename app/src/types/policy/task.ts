import type { BaseState } from './base';
import type { Condition } from './condition';

export interface TaskState extends BaseState {
  type: 'task';
  conditions: Condition[];
}
