import type { DatabaseState, TaskState, ApiState, ResponseState } from '../types/policy';

export const NODE_COLORS = {
  DataBase: '#3b82f6',  // blue-500
  task: '#f59e0b',      // amber-500
  API: '#22c55e',       // green-500
  Response: '#8b5cf6',  // violet-500
} as const;

export const DEFAULT_DATABASE_STATE: Omit<DatabaseState, 'next' | 'end'> = {
  type: 'DataBase',
  table: '',
  operation: 'get',
  resultPath: '',
};

export const DEFAULT_TASK_STATE: Omit<TaskState, 'next' | 'end'> = {
  type: 'task',
  conditions: [],
};

export const DEFAULT_API_STATE: Omit<ApiState, 'next' | 'end'> = {
  type: 'API',
  method: 'GET',
  url: '',
  resultPath: '',
};

export const DEFAULT_RESPONSE_STATE: ResponseState = {
  type: 'Response',
  end: true,
  next: null,
  statusCode: 200,
};
