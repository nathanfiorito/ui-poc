import React from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import { useFlowStore } from './store/flowStore';

function App() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useFlowStore();

  return (
    <div className="w-full h-screen flex">
      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}

export default App;
