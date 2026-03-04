import { DatabaseNode } from './DatabaseNode';
import { TaskNode } from './TaskNode';
import { ApiNode } from './ApiNode';
import { ResponseNode } from './ResponseNode';

export const nodeTypes = {
  DataBase: DatabaseNode,
  task: TaskNode,
  API: ApiNode,
  Response: ResponseNode,
};
