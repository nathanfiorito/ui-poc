import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from 'reactflow';

export function ConditionalEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, markerEnd, style }: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: 2, stroke: '#f59e0b', strokeDasharray: '5 5', animation: 'edge-flow 0.6s linear infinite', ...style }} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all', position: 'absolute' }}
            className="bg-amber-100 border border-amber-400 text-amber-800 text-xs font-mono px-1.5 py-0.5 rounded nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
