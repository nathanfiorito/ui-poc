import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import './index.css';
import App from './App.tsx';
import { useFlowStore } from './store/flowStore';

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__store = useFlowStore;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  </StrictMode>
);
