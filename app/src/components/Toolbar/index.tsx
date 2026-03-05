import { useRef, type ChangeEvent } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { serializePolicy } from '../../utils/policySerializer';
import { parsePolicy } from '../../utils/policyParser';
import type { Policy } from '../../types/policy';

export function Toolbar() {
  const { policyMeta, setPolicyMeta, nodes, edges, setNodes, setEdges } = useFlowStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const policy = serializePolicy(nodes, edges, policyMeta);
    const blob = new Blob([JSON.stringify(policy, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${policyMeta.name || 'policy'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const policy = JSON.parse(e.target?.result as string) as Policy;
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
      } catch {
        alert('Arquivo JSON inválido.');
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    event.target.value = '';
  }

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0">
      <span className="text-sm font-semibold text-gray-500 select-none">Policy:</span>
      <input
        type="text"
        value={policyMeta.name}
        onChange={(e) => setPolicyMeta({ name: e.target.value })}
        className="text-sm font-medium text-gray-800 border border-transparent rounded px-2 py-1 hover:border-gray-300 focus:border-blue-400 focus:outline-none transition-colors w-56"
        placeholder="Nome da Policy"
      />

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Importar
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleImport}
        />

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar
        </button>
      </div>
    </header>
  );
}
