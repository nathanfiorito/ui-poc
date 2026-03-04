import type { Node, Edge } from 'reactflow';
import type { DatabaseState, TaskState, ApiState, ResponseState, StateType } from './policy';

// Extended node data with IODM domain info
export interface IODMBaseNodeData {
  label: string;
  stateType: StateType;
  isStart?: boolean;
}

export type DatabaseNodeData = IODMBaseNodeData & DatabaseState;
export type TaskNodeData = IODMBaseNodeData & TaskState;
export type ApiNodeData = IODMBaseNodeData & ApiState;
export type ResponseNodeData = IODMBaseNodeData & ResponseState;

export type IODMNodeData =
  | DatabaseNodeData
  | TaskNodeData
  | ApiNodeData
  | ResponseNodeData;

export type IODMNode = Node<IODMNodeData>;
export type IODMEdge = Edge;
