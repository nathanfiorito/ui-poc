// State types supported by IODM
export type StateType = 'DataBase' | 'task' | 'API' | 'Response';

// Condition used in TaskNode (task state)
export interface Condition {
  expression: string;
  next: string;
  resultPath?: string | null;
}

// Base state fields common to all types
interface BaseState {
  type: StateType;
  next: string | null;
  end: boolean;
  loopOver?: string | null;
  allowFailOnLoopOver?: boolean | null;
}

// --- DataBase state ---

export interface DynamoDbConfig {
  tableName: string;
  PK: string;
  SK?: string | null;
  columns?: string[];
  resultPath: string;
  fullScan?: boolean;
}

export interface DatabaseResource {
  type: 'DynamoDB';
  dynamoDb: DynamoDbConfig;
}

export interface DatabaseState extends BaseState {
  type: 'DataBase';
  resource: DatabaseResource;
}

// --- task state ---

export interface TaskState extends BaseState {
  type: 'task';
  conditions: Condition[];
}

// --- API state ---

export interface ApiResource {
  route: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  responsePath: string;
  authentication?: string;
}

export interface ApiState extends BaseState {
  type: 'API';
  resource: ApiResource;
}

// --- Response state ---

export interface ResponseState extends BaseState {
  type: 'Response';
  end: true;
  next: null;
  responseBody: Record<string, string>;
  resultPath?: string;
}

export type State = DatabaseState | TaskState | ApiState | ResponseState;

// --- Policy root ---

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
