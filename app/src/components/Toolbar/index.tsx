import { useState } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { serializePolicy } from '../../utils/policySerializer';
import { parsePolicy } from '../../utils/policyParser';
import { validateNodeNames } from '../../utils/validators';
import { useTheme } from '../../contexts/ThemeContext';
import { PolicyJsonModal } from '../PolicyJsonModal';
import type { Policy } from '../../types/policy';

export function Toolbar() {
  const { policyMeta, setPolicyMeta, nodes, edges, setNodes, setEdges } = useFlowStore();
  const { theme, toggleTheme } = useTheme();
  const [modalMode, setModalMode] = useState<'import' | 'export' | null>(null);

  function getExportJson(): string | null {
    const errors = validateNodeNames(nodes);
    if (errors.length > 0) {
      const messages = errors.map((e) =>
        e.type === 'empty_name'
          ? `- Nó sem nome (ID: ${e.nodeId})`
          : `- Nome duplicado: "${e.label}"`
      );
      alert(`Não foi possível exportar. Corrija os problemas:\n\n${messages.join('\n')}`);
      return null;
    }
    const policy = serializePolicy(nodes, edges, policyMeta);
    return JSON.stringify(policy, null, 2);
  }

  function handleImport(json: string) {
    const policy = JSON.parse(json) as Policy;
    const { nodes: parsedNodes, edges: parsedEdges } = parsePolicy(policy);
    setNodes(parsedNodes);
    setEdges(parsedEdges);
    setPolicyMeta({
      id: policy.id,
      name: policy.name,
      description: policy.description,
      version: policy.version,
      startAt: policy.startAt,
    });
  }

  return (
    <>
      <header className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4 shrink-0">
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 select-none">Policy:</span>
        <input
          type="text"
          value={policyMeta.name}
          onChange={(e) => setPolicyMeta({ name: e.target.value })}
          className="text-sm font-medium text-gray-800 dark:text-gray-100 dark:bg-transparent border border-transparent rounded px-2 py-1 hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-400 focus:outline-none transition-colors w-56"
          placeholder="Nome da Policy"
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.07-.707.707M6.343 17.657l-.707.707m12.728 0-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => setModalMode('import')}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Importar
          </button>

          <button
            onClick={() => { if (getExportJson() !== null) setModalMode('export'); }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar
          </button>
        </div>
      </header>

      {modalMode !== null && (
        <PolicyJsonModal
          mode={modalMode}
          json={modalMode === 'export' ? (getExportJson() ?? undefined) : undefined}
          onImport={handleImport}
          onClose={() => setModalMode(null)}
        />
      )}
    </>
  );
}
