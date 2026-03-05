import { useState } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { NODE_COLORS } from '../../constants/defaults';
import { DatabaseForm } from './DatabaseForm';
import { TaskForm } from './TaskForm';
import { ApiForm } from './ApiForm';
import { ResponseForm } from './ResponseForm';
import { JsonPreview } from '../JsonPreview';
import type { StateType } from '../../types/policy';
import type { IODMNode } from '../../types/flow';

type Tab = 'properties' | 'json';

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

function TabBar({ tab, onTabChange }: { tab: Tab; onTabChange: (t: Tab) => void }) {
  const base = 'flex-1 py-2 text-xs font-medium transition-colors border-b-2';
  const active = 'border-blue-500 text-blue-600';
  const inactive = 'border-transparent text-gray-500 hover:text-gray-700';
  return (
    <div className="flex border-b border-gray-200 flex-shrink-0">
      <button
        className={`${base} ${tab === 'properties' ? active : inactive}`}
        onClick={() => onTabChange('properties')}
      >
        Propriedades
      </button>
      <button
        className={`${base} ${tab === 'json' ? active : inactive}`}
        onClick={() => onTabChange('json')}
      >
        JSON
      </button>
    </div>
  );
}

export function NodePanel() {
  const nodes = useFlowStore((s) => s.nodes);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId);

  const [tab, setTab] = useState<Tab>('properties');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <aside className="w-72 h-full bg-gray-50 border-l border-gray-200 flex flex-col flex-shrink-0">
      <TabBar tab={tab} onTabChange={setTab} />
      {tab === 'json' ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <JsonPreview />
        </div>
      ) : selectedNode ? (
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
        <EmptyState />
      )}
    </aside>
  );
}
