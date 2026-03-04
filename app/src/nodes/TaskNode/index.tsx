import { Handle, Position, type NodeProps } from 'reactflow';
import { useFlowStore } from '../../store/flowStore';
import type { TaskNodeData } from '../../types/flow';

export function TaskNode({ id, data, selected }: NodeProps<TaskNodeData>) {
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const isSelected = selected || selectedNodeId === id;

  const conditions = data.conditions ?? [];
  const total = conditions.length;

  return (
    <div
      className={`rounded-lg border-2 border-amber-500 bg-white shadow-md min-w-[200px] cursor-pointer ${
        isSelected ? 'ring-2 ring-amber-400 ring-offset-1' : ''
      }`}
      onClick={() => setSelectedNodeId(id)}
    >
      <Handle type="target" position={Position.Top} id="target" />

      <div className="bg-amber-500 text-white text-sm font-semibold px-3 py-1.5 rounded-t-md">
        Task
      </div>

      <div className="px-3 py-2 space-y-1">
        {conditions.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No conditions</p>
        ) : (
          conditions.map((condition, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <span className="inline-block text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 font-mono truncate max-w-[140px]">
                {condition.expression}
              </span>
              <span className="text-xs text-gray-400">→ {condition.next}</span>
            </div>
          ))
        )}

        <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
          <span className="text-xs text-gray-500 italic">default</span>
          <span className="text-xs text-gray-400">→ {data.next ?? '—'}</span>
        </div>
      </div>

      {/* Condition handles */}
      {conditions.map((_, index) => (
        <Handle
          key={`condition-${index}`}
          type="source"
          position={Position.Bottom}
          id={`condition-${index}`}
          style={{ left: `${((index + 1) / (total + 1)) * 100}%` }}
        />
      ))}

      {/* Fallback handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="fallback"
        style={{
          left: `${(total / (total + 1)) * 100}%`,
          borderStyle: 'dashed',
        }}
      />
    </div>
  );
}
