import { Sidebar } from './components/Sidebar';
import { FlowCanvas } from './components/FlowCanvas';
import { NodePanel } from './components/NodePanel';
import { Toolbar } from './components/Toolbar';

function App() {
  return (
    <div className="w-full h-screen flex flex-col bg-white dark:bg-gray-900">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <FlowCanvas />
        <NodePanel />
      </div>
    </div>
  );
}

export default App;
