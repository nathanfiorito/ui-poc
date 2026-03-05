import { useCallback } from 'react';
import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap, useReactFlow, type Node } from 'reactflow';
import { useFlowStore } from '../../store/flowStore';
import { nodeTypes } from '../../nodes';
import { edgeTypes } from '../../edges';
import { useTheme } from '../../contexts/ThemeContext';
import type { StateType } from '../../types/policy';

export function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useFlowStore();
  const setSelectedNodeId = useFlowStore((s) => s.setSelectedNodeId);
  const { screenToFlowPosition } = useReactFlow();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as StateType;
      if (!type) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  return (
    <div className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          color={isDark ? '#4b5563' : '#d1d5db'}
          gap={16}
          size={1}
        />
        <Controls />
        <MiniMap
          style={{
            backgroundColor: isDark ? '#1f2937' : '#f9fafb',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          }}
          maskColor={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(200,210,220,0.5)'}
          nodeColor={isDark ? '#4b5563' : '#9ca3af'}
        />
      </ReactFlow>
    </div>
  );
}
