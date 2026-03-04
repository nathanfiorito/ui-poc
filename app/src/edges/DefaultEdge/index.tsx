import { BaseEdge, getBezierPath, type EdgeProps } from 'reactflow';

export function DefaultEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style }: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: 2, stroke: '#94a3b8', ...style }} />;
}
