import type { Node, Edge } from 'reactflow';
import type { Policy, State } from '../types/policy';
import type { IODMNodeData, DatabaseNodeData, TaskNodeData, ApiNodeData, ResponseNodeData } from '../types/flow';
import type { DatabaseState } from '../types/policy/database';
import type { TaskState } from '../types/policy/task';
import type { ApiState } from '../types/policy/api';
import type { ResponseState } from '../types/policy/response';

export interface ParseResult {
  nodes: Node<IODMNodeData>[];
  edges: Edge[];
}

function buildNodeData(stateName: string, state: State, isStart: boolean): IODMNodeData {
  const base = { label: stateName, stateType: state.type, isStart };

  switch (state.type) {
    case 'DataBase':
      return { ...base, ...(state as DatabaseState) } as DatabaseNodeData;
    case 'task':
      return { ...base, ...(state as TaskState) } as TaskNodeData;
    case 'API':
      return { ...base, ...(state as ApiState) } as ApiNodeData;
    case 'Response':
      return { ...base, ...(state as ResponseState) } as ResponseNodeData;
  }
}

export function parsePolicy(policy: Policy): ParseResult {
  const nodes: Node<IODMNodeData>[] = [];
  const edges: Edge[] = [];

  const stateEntries = Object.entries(policy.states);

  stateEntries.forEach(([stateName, state]) => {
    const isStart = stateName === policy.startAt;

    nodes.push({
      id: stateName,
      type: state.type,
      position: { x: 0, y: 0 },
      data: buildNodeData(stateName, state, isStart),
    });

    // Default edge from `next` field (non-task states, or task fallback)
    if (state.next) {
      edges.push({
        id: `edge-${stateName}-default`,
        source: stateName,
        target: state.next,
        type: 'default',
        sourceHandle: 'default',
      });
    }

    // Conditional edges from task conditions
    if (state.type === 'task') {
      const taskState = state as TaskState;
      taskState.conditions.forEach((condition, index) => {
        edges.push({
          id: `edge-${stateName}-condition-${index}`,
          source: stateName,
          target: condition.next,
          type: 'conditional',
          sourceHandle: `condition-${index}`,
          label: condition.expression,
          data: { expression: condition.expression, resultPath: condition.resultPath },
        });
      });
    }
  });

  return { nodes, edges };
}
