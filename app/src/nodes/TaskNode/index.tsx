import { useEffect, useRef, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { useFlowStore } from '../../store/flowStore';
import type { TaskNodeData } from '../../types/flow';

export function TaskNode({ id, data, selected }: NodeProps<TaskNodeData>) {
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const isSelected = selected || selectedNodeId === id;

  const conditions = data.conditions ?? [];

  const conditionRowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const defaultRowRef = useRef<HTMLDivElement | null>(null);
  const [conditionTops, setConditionTops] = useState<number[]>([]);
  const [defaultTop, setDefaultTop] = useState<number | null>(null);

  useEffect(() => {
    const tops = conditionRowRefs.current.map((ref) =>
      ref ? ref.offsetTop + ref.offsetHeight / 2 : 0
    );
    setConditionTops(tops);
    if (defaultRowRef.current) {
      setDefaultTop(defaultRowRef.current.offsetTop + defaultRowRef.current.offsetHeight / 2);
    }
  }, [conditions.length]);

  return (
    <div
      className={`relative rounded-lg border-2 border-amber-500 bg-white dark:bg-gray-800 shadow-md min-w-[200px] cursor-pointer ${
        isSelected ? 'ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-gray-900' : ''
      }`}
      onClick={() => setSelectedNodeId(id)}
    >
      <Handle type="target" position={Position.Top} id="target" />

      <div className="bg-amber-500 text-white text-sm font-semibold px-3 py-1.5 rounded-t-md">
        Task
      </div>

      <div className="px-3 py-2 space-y-1">
        {conditions.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">No conditions</p>
        ) : (
          conditions.map((condition, index) => (
            <div
              key={index}
              ref={(el) => { conditionRowRefs.current[index] = el; }}
              className="flex items-center gap-1.5"
            >
              <span className="inline-block text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded px-1.5 py-0.5 font-mono truncate max-w-[140px]">
                {condition.expression}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">→ {condition.next}</span>
            </div>
          ))
        )}

        <div
          ref={defaultRowRef}
          className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-700"
        >
          <span className="text-xs text-gray-500 dark:text-gray-400 italic">default</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">→ {data.next ?? '—'}</span>
        </div>
      </div>

      {/* Condition handles — positioned inline with each condition row */}
      {conditions.map((_, index) => (
        <Handle
          key={`condition-${index}`}
          type="source"
          position={Position.Right}
          id={`condition-${index}`}
          style={{
            top: conditionTops[index] ?? '50%',
            transform: 'translateX(50%)',
          }}
        />
      ))}

      {/* Default handle — positioned inline with the default row */}
      <Handle
        type="source"
        position={Position.Right}
        id="default"
        style={{
          top: defaultTop ?? '50%',
          transform: 'translateX(50%)',
          borderStyle: 'dashed',
        }}
      />
    </div>
  );
}
