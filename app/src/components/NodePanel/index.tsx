import { useFlowStore } from '../../store/flowStore';
import { NODE_COLORS } from '../../constants/defaults';
import { DatabaseForm } from './DatabaseForm';
import { TaskForm } from './TaskForm';
import { ApiForm } from './ApiForm';
import { ResponseForm } from './ResponseForm';
import type { StateType } from '../../types/policy';
import type { IODMNode } from '../../types/flow';

const TYPE_LABEL: Record<StateType, string> = {
  DataBase: 'DataBase',
  task: 'Task',
  API: 'API',
  Response: 'Response',
};

function PanelHeader({ stateType, label, onClose }: { stateType: StateType; label: string; onClose: () => void }) {
  const color = NODE_COLORS[stateType];
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded text-white flex-shrink-0"
          style={{ backgroundColor: color }}
        >
          {TYPE_LABEL[stateType]}
        </span>
        <span className="text-xs text-gray-600 truncate font-medium">{label}</span>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 text-base leading-none"
        aria-label="Fechar painel"
      >
        ×
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="text-gray-300 text-4xl mb-3">⬡</div>
      <p className="text-xs font-medium text-gray-400">Selecione um nó para editar</p>
      <p className="text-xs text-gray-300 mt-1">Clique em qualquer nó no canvas</p>
    </div>
  );
}

function NodeForm({ node }: { node: IODMNode }) {
  const stateType = node.data.stateType;
  if (stateType === 'DataBase') return <DatabaseForm node={node} />;
  if (stateType === 'task') return <TaskForm node={node} />;
  if (stateType === 'API') return <ApiForm node={node} />;
  if (stateType === 'Response') return <ResponseForm node={node} />;
  return null;
}

export function NodePanel() {
  const nodes = useFlowStore((s) => s.nodes);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <aside className="w-72 h-full bg-gray-50 border-l border-gray-200 flex flex-col flex-shrink-0">
      {selectedNode ? (
        <>
          <PanelHeader
            stateType={selectedNode.data.stateType}
            label={selectedNode.data.label}
            onClose={() => setSelectedNodeId(null)}
          />
          <div className="flex-1 overflow-y-auto p-4">
            <NodeForm node={selectedNode} />
          </div>
        </>
      ) : (
        <>
          <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Propriedades
            </h2>
          </div>
          <EmptyState />
        </>
      )}
    </aside>
  );
}
