import { Sidebar } from './components/Sidebar';
import { FlowCanvas } from './components/FlowCanvas';

function App() {
  return (
    <div className="w-full h-screen flex">
      <Sidebar />
      <FlowCanvas />
    </div>
  );
}

export default App;
