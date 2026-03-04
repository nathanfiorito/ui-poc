export type { StateType, BaseState } from './base';
export type { Condition } from './condition';
export type { DynamoDbConfig, DatabaseResource, DatabaseState } from './database';
export type { TaskState } from './task';
export type { ApiResource, ApiState } from './api';
export type { ResponseState } from './response';

import type { DatabaseState } from './database';
import type { TaskState } from './task';
import type { ApiState } from './api';
import type { ResponseState } from './response';

export type State = DatabaseState | TaskState | ApiState | ResponseState;

export interface PolicyMeta {
  id: string;
  name: string;
  description?: string;
  version: string;
  startAt: string;
}

export interface Policy extends PolicyMeta {
  states: Record<string, State>;
}
