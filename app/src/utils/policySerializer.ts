import type { Node, Edge } from 'reactflow';
import type { Policy, PolicyMeta, State } from '../types/policy';
import type { IODMNodeData, TaskNodeData } from '../types/flow';
import type { Condition } from '../types/policy/condition';

function getDefaultNext(nodeId: string, edges: Edge[], idToLabel: Map<string, string>): string | null {
  const edge = edges.find((e) => e.source === nodeId && e.type === 'default');
  if (!edge) return null;
  return idToLabel.get(edge.target) ?? edge.target;
}

function buildConditions(nodeId: string, edges: Edge[], idToLabel: Map<string, string>): Condition[] {
  return edges
    .filter((e) => e.source === nodeId && e.type === 'conditional')
    .sort((a, b) => {
      const aIdx = parseInt(a.sourceHandle?.replace('condition-', '') ?? '0', 10);
      const bIdx = parseInt(b.sourceHandle?.replace('condition-', '') ?? '0', 10);
      return aIdx - bIdx;
    })
    .map((e) => ({
      expression: (e.data?.expression as string) ?? String(e.label ?? ''),
      next: idToLabel.get(e.target) ?? e.target,
      resultPath: (e.data?.resultPath as string | null) ?? null,
    }));
}

function nodeToState(node: Node<IODMNodeData>, edges: Edge[], idToLabel: Map<string, string>): State {
  // Strip UI-only fields (label, stateType, isStart) from node data
  const UI_FIELDS = new Set(['label', 'stateType', 'isStart']);
  const stateFields = Object.fromEntries(
    Object.entries(node.data).filter(([key]) => !UI_FIELDS.has(key))
  ) as Record<string, unknown>;

  const nodeId = node.id;

  if (stateFields.type === 'task') {
    const taskData = node.data as TaskNodeData;
    return {
      type: 'task',
      end: taskData.end,
      next: getDefaultNext(nodeId, edges, idToLabel),
      ...(taskData.loopOver !== undefined && { loopOver: taskData.loopOver }),
      ...(taskData.allowFailOnLoopOver !== undefined && { allowFailOnLoopOver: taskData.allowFailOnLoopOver }),
      conditions: buildConditions(nodeId, edges, idToLabel),
    };
  }

  // For DataBase, API, Response — derive next from edges
  const next = stateFields.type === 'Response' ? null : getDefaultNext(nodeId, edges, idToLabel);

  return { ...stateFields, next } as State;
}

export function serializePolicy(
  nodes: Node<IODMNodeData>[],
  edges: Edge[],
  policyMeta: PolicyMeta,
): Policy {
  const idToLabel = new Map(nodes.map((n) => [n.id, n.data.label]));
  const states: Record<string, State> = {};

  for (const node of nodes) {
    const key = node.data.label || node.id;
    states[key] = nodeToState(node, edges, idToLabel);
  }

  const startAtNode = nodes.find((n) => n.data.isStart === true);
  const startAt = startAtNode ? (startAtNode.data.label || startAtNode.id) : policyMeta.startAt;

  return { ...policyMeta, startAt, states };
}
