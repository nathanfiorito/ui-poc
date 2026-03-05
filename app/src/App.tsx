import { Sidebar } from './components/Sidebar';
import { FlowCanvas } from './components/FlowCanvas';
import { NodePanel } from './components/NodePanel';

function App() {
  return (
    <div className="w-full h-screen flex">
      <Sidebar />
      <FlowCanvas />
      <NodePanel />
    </div>
  );
}

export default App;
