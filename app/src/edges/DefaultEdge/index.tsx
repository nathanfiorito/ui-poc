import { BaseEdge, getSmoothStepPath, type EdgeProps } from 'reactflow';

export function DefaultEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style }: EdgeProps) {
  const [edgePath] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: 2, stroke: '#94a3b8', strokeDasharray: '5 5', animation: 'edge-flow 0.6s linear infinite', ...style }} />;
}
