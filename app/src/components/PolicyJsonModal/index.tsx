import { useEffect, useRef, useState } from 'react';

interface PolicyJsonModalProps {
  mode: 'import' | 'export';
  json?: string;
  onImport?: (json: string) => void;
  onClose: () => void;
}

export function PolicyJsonModal({ mode, json = '', onImport, onClose }: PolicyJsonModalProps) {
  const [value, setValue] = useState(mode === 'export' ? json : '');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleImport() {
    try {
      JSON.parse(value);
      onImport?.(value);
      onClose();
    } catch {
      setError('JSON inválido. Verifique o conteúdo e tente novamente.');
    }
  }

  const title = mode === 'export' ? 'Exportar Policy JSON' : 'Importar Policy JSON';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Textarea */}
        <div className="flex-1 overflow-hidden px-5 py-4">
          <textarea
            ref={textareaRef}
            value={value}
            readOnly={mode === 'export'}
            onChange={(e) => { setValue(e.target.value); setError(null); }}
            className="w-full h-full min-h-[300px] resize-none text-xs font-mono bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded p-3 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500"
            placeholder={mode === 'import' ? 'Cole o JSON da Policy aqui...' : ''}
            spellCheck={false}
          />
          {error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          {mode === 'export' ? (
            <>
              <button
                onClick={onClose}
                className="text-xs font-medium px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={handleCopy}
                className="text-xs font-medium px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="text-xs font-medium px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                className="text-xs font-medium px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Importar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
