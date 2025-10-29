import React from "react";
import {
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  ConnectionMode,
} from "@xyflow/react";

type DiagramCanvasProps = {
  reactFlowWrapperRef: React.RefObject<HTMLDivElement>;
  nodes: Node[];
  edges: Edge[];
  nodeTypes: NodeTypes;
  edgeTypes?: EdgeTypes;
  onNodesChange: (...changes: unknown[]) => void;
  onEdgesChange: (...changes: unknown[]) => void;
  onConnect: (c: Connection) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
};

const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  reactFlowWrapperRef,
  nodes,
  edges,
  nodeTypes,
  edgeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDragOver,
  onDrop,
}) => {
  return (
    <div className="flex-1 relative bg-theme min-h-0">
      <section
        className="w-full h-full"
        ref={reactFlowWrapperRef}
        onDragOver={onDragOver}
        onDrop={onDrop}
        aria-label="Diagram canvas drop area"
      >
        <ReactFlow
          className="w-full h-full"
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          connectionMode={ConnectionMode.Loose}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <MiniMap nodeStrokeWidth={3} />
          <Controls />
          <Background gap={16} />
        </ReactFlow>
      </section>
    </div>
  );
};

export default DiagramCanvas;
