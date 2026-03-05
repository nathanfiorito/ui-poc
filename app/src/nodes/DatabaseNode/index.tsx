import { Handle, Position, type NodeProps } from 'reactflow';
import { useFlowStore } from '../../store/flowStore';
import type { DatabaseNodeData } from '../../types/flow';

export function DatabaseNode({ id, data, selected }: NodeProps<DatabaseNodeData>) {
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const isSelected = selected || selectedNodeId === id;

  const tableName = data.resource?.dynamoDb?.tableName ?? '—';
  const resultPath = data.resource?.dynamoDb?.resultPath ?? '—';

  return (
    <div
      className={`rounded-lg border-2 border-blue-500 bg-white dark:bg-gray-800 shadow-md min-w-[180px] cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-gray-900' : ''
      }`}
      onClick={() => setSelectedNodeId(id)}
    >
      <Handle type="target" position={Position.Top} id="target" />

      <div className="bg-blue-500 text-white text-sm font-semibold px-3 py-1.5 rounded-t-md">
        DataBase
      </div>

      <div className="px-3 py-2 space-y-1">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{tableName}</p>
        <span className="inline-block text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded px-1.5 py-0.5 font-mono">
          {resultPath}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} id="source" />
    </div>
  );
}
