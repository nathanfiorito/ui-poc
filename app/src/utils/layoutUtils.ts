import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';
import type { IODMNodeData, TaskNodeData } from '../types/flow';

const NODE_WIDTH = 240;
const NODE_HEIGHT_DEFAULT = 120;
const NODE_HEIGHT_TASK_BASE = 100;
const NODE_HEIGHT_TASK_PER_CONDITION = 36;

function getNodeHeight(node: Node<IODMNodeData>): number {
  if (node.type === 'task') {
    const taskData = node.data as TaskNodeData;
    const conditionCount = taskData.conditions?.length ?? 0;
    return NODE_HEIGHT_TASK_BASE + conditionCount * NODE_HEIGHT_TASK_PER_CONDITION;
  }
  return NODE_HEIGHT_DEFAULT;
}

export function applyDagreLayout(nodes: Node<IODMNodeData>[], edges: Edge[]): Node<IODMNodeData>[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });

  nodes.forEach(node => {
    const height = getNodeHeight(node);
    g.setNode(node.id, { width: NODE_WIDTH, height });
  });

  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map(node => {
    const { x, y } = g.node(node.id);
    const height = getNodeHeight(node);
    return {
      ...node,
      position: {
        x: x - NODE_WIDTH / 2,
        y: y - height / 2,
      },
    };
  });
}
