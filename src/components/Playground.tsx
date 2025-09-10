// Playground.tsx
import React, { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";
import type { Node, Edge, Connection } from "@xyflow/react";

import { toPng } from "html-to-image";

import Toolbar from "./Toolbar";
import { useTheme } from "../hooks/useTheme";

const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 100, y: 100 },
    data: { label: "Start" },
    type: "input",
  },
];

const initialEdges: Edge[] = [];

const Playground: React.FC = () => {
  useTheme(); // Just apply the theme
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleSaveAsImage = async () => {
    if (!wrapperRef.current) return;
    const dataUrl = await toPng(wrapperRef.current);
    const link = document.createElement("a");
    link.download = "diagram.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="h-screen flex flex-col">
      <Toolbar onSaveImage={handleSaveAsImage} />
      {/* ensure the flow area has visible height */}
      <div ref={wrapperRef} className="flex-1 relative min-h-[600px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
};

export default Playground;
