import { DatabaseNode } from './DatabaseNode';
import { TaskNode } from './TaskNode';
import { ApiNode } from './ApiNode';

export const nodeTypes = {
  DataBase: DatabaseNode,
  task: TaskNode,
  API: ApiNode,
};
