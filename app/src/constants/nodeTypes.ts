export const NODE_TYPES = {
  DataBase: 'DataBase',
  task: 'task',
  API: 'API',
  Response: 'Response',
} as const;

export type NodeTypeKey = keyof typeof NODE_TYPES;
