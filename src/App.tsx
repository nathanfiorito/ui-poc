import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorkflowStore } from './store/workflowStore'
import './index.css'

function App() {
  const { nodes, edges, setNodes, setEdges } = useWorkflowStore()

  return (
    <div className="w-screen h-screen bg-gray-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          // Handled in Phase 2 with applyNodeChanges
          console.log('nodes changed', changes)
        }}
        onEdgesChange={(changes) => {
          // Handled in Phase 2 with applyEdgeChanges
          console.log('edges changed', changes)
        }}
        onConnect={(connection) => {
          console.log('connected', connection)
          setEdges([
            ...edges,
            { id: `e-${connection.source}-${connection.target}`, ...connection },
          ])
        }}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}

export default App
