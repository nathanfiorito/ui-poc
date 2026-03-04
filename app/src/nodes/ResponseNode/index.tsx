import { Handle, Position, type NodeProps } from 'reactflow';
import { useFlowStore } from '../../store/flowStore';
import type { ResponseNodeData } from '../../types/flow';

export function ResponseNode({ id, data, selected }: NodeProps<ResponseNodeData>) {
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const isSelected = selected || selectedNodeId === id;

  const responseBody = data.responseBody ?? {};
  const entries = Object.entries(responseBody);

  return (
    <div
      className={`rounded-lg border-2 border-violet-500 bg-white shadow-md min-w-[200px] cursor-pointer ${
        isSelected ? 'ring-2 ring-violet-400 ring-offset-1' : ''
      }`}
      onClick={() => setSelectedNodeId(id)}
    >
      <Handle type="target" position={Position.Top} id="target" />

      <div className="bg-violet-500 text-white text-sm font-semibold px-3 py-1.5 rounded-t-md flex items-center justify-between">
        <span>Response</span>
        <span className="text-xs bg-violet-700 rounded px-1.5 py-0.5">END</span>
      </div>

      <div className="px-3 py-2 space-y-1">
        {entries.length > 0 ? (
          entries.map(([key, value]) => (
            <div key={key} className="flex items-center gap-1 text-xs">
              <span className="font-medium text-gray-700">{key}</span>
              <span className="text-gray-400">←</span>
              <span className="font-mono text-violet-600 bg-violet-50 rounded px-1">{value}</span>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 italic">sem responseBody</p>
        )}
        {data.resultPath && (
          <span className="inline-block text-xs bg-violet-100 text-violet-700 rounded px-1.5 py-0.5 font-mono mt-1">
            {data.resultPath}
          </span>
        )}
      </div>
    </div>
  );
}
