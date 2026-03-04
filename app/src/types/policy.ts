// State types supported by IODM
export type StateType = 'DataBase' | 'task' | 'API' | 'Response';

// Condition used in TaskNode
export interface Condition {
  expression: string;
  next: string;
}

// Base state fields common to all types
interface BaseState {
  type: StateType;
  next?: string | null;
  end?: boolean;
  resultPath?: string;
}

export interface DatabaseState extends BaseState {
  type: 'DataBase';
  table: string;
  operation: 'get' | 'query' | 'scan' | 'put' | 'update' | 'delete';
  key?: Record<string, unknown>;
  resultPath: string;
}

export interface TaskState extends BaseState {
  type: 'task';
  conditions: Condition[];
  default?: string;
}

export interface ApiState extends BaseState {
  type: 'API';
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  resultPath: string;
}

export interface ResponseState extends BaseState {
  type: 'Response';
  end: true;
  next: null;
  statusCode?: number;
  body?: unknown;
}

export type State = DatabaseState | TaskState | ApiState | ResponseState;

export interface PolicyMeta {
  id: string;
  name: string;
  description?: string;
  version?: string;
  startAt: string;
}

export interface Policy extends PolicyMeta {
  states: Record<string, State>;
}
