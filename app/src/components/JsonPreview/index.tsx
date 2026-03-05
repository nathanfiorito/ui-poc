import { useState, useMemo } from 'react';
import { useFlowStore } from '../../store/flowStore';
import { serializePolicy } from '../../utils/policySerializer';
import { highlightJson } from '../../utils/jsonHighlight';

export function JsonPreview() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const policyMeta = useFlowStore((s) => s.policyMeta);

  const json = useMemo(
    () => JSON.stringify(serializePolicy(nodes, edges, policyMeta), null, 2),
    [nodes, edges, policyMeta],
  );

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 flex-shrink-0">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Policy JSON
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3 bg-gray-900 rounded-b">
        <pre
          className="text-xs font-mono leading-relaxed whitespace-pre"
          dangerouslySetInnerHTML={{ __html: highlightJson(json) }}
        />
      </div>
    </div>
  );
}
