import { Handle, Position, type NodeProps } from 'reactflow';
import { useFlowStore } from '../../store/flowStore';
import type { ApiNodeData } from '../../types/flow';

export function ApiNode({ id, data, selected }: NodeProps<ApiNodeData>) {
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const isSelected = selected || selectedNodeId === id;

  const route = data.resource?.route ?? '';
  const method = data.resource?.method ?? 'GET';
  const responsePath = data.resource?.responsePath ?? '—';
  const authentication = data.resource?.authentication;

  let domain = '—';
  if (route) {
    try {
      domain = new URL(route).hostname;
    } catch {
      domain = route;
    }
  }

  return (
    <div
      className={`rounded-lg border-2 border-green-500 bg-white dark:bg-gray-800 shadow-md min-w-[200px] cursor-pointer ${
        isSelected ? 'ring-2 ring-green-400 ring-offset-1 dark:ring-offset-gray-900' : ''
      }`}
      onClick={() => setSelectedNodeId(id)}
    >
      <Handle type="target" position={Position.Top} id="target" />

      <div className="bg-green-500 text-white text-sm font-semibold px-3 py-1.5 rounded-t-md flex items-center justify-between">
        <span>API{data.label ? ` — ${data.label}` : ''}</span>
        {authentication === true && (
          <span className="text-xs bg-green-700 rounded px-1.5 py-0.5">🔒 Auth</span>
        )}
      </div>

      <div className="px-3 py-2 space-y-1">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
          <span className="font-mono text-green-700 dark:text-green-400 text-xs font-bold mr-1">{method}</span>
          {domain}
        </p>
        <span className="inline-block text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded px-1.5 py-0.5 font-mono">
          {responsePath}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} id="source" />
    </div>
  );
}
