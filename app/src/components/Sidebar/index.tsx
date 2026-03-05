import type { DragEvent } from 'react';
import { NODE_COLORS } from '../../constants/defaults';
import type { StateType } from '../../types/policy';

interface NodeItem {
  type: StateType;
  label: string;
  description: string;
  color: string;
  icon: string;
}

const NODE_ITEMS: NodeItem[] = [
  {
    type: 'DataBase',
    label: 'DataBase',
    description: 'Consulta ao DynamoDB',
    color: NODE_COLORS.DataBase,
    icon: '🗄',
  },
  {
    type: 'task',
    label: 'Task',
    description: 'Decisão condicional',
    color: NODE_COLORS.task,
    icon: '⚡',
  },
  {
    type: 'API',
    label: 'API',
    description: 'Chamada HTTP externa',
    color: NODE_COLORS.API,
    icon: '🌐',
  },
  {
    type: 'Response',
    label: 'Response',
    description: 'Estado final do fluxo',
    color: NODE_COLORS.Response,
    icon: '✅',
  },
];

function onDragStart(event: DragEvent<HTMLDivElement>, nodeType: StateType) {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
}

export function Sidebar() {
  return (
    <aside className="w-52 h-full bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Nós Disponíveis
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Arraste para o canvas</p>
      </div>

      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {NODE_ITEMS.map(({ type, label, description, color, icon }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className="cursor-grab active:cursor-grabbing rounded-lg border-2 bg-white shadow-sm p-3 select-none hover:shadow-md transition-shadow"
            style={{ borderColor: color }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base leading-none">{icon}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: color }}
              >
                {label}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-snug">{description}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
