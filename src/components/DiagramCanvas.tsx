import React from 'react';
import * as XY from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';

type DiagramCanvasProps = {
  reactFlowWrapperRef: React.RefObject<HTMLDivElement>;
  nodes: Node[];
  edges: Edge[];
  // Node types are passed through to the library — accept unknown component shapes
  nodeTypes: Record<string, React.ComponentType<unknown>>;
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
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDragOver,
  onDrop,
}) => {
  // runtime shape of the module may vary; use the exports defensively
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RF: any = (XY as any).ReactFlow || (XY as any).default || (XY as any).ReactFlowRenderer || (XY as any).Flow || null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MiniMap: any = (XY as any).MiniMap || (XY as any).MiniMapRenderer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Controls: any = (XY as any).Controls || (XY as any).FlowControls;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Background: any = (XY as any).Background || (XY as any).FlowBackground;

  return (
    <div className="flex-1" ref={reactFlowWrapperRef}>
      <section aria-label="diagram-canvas" className="h-full">
        {RF
          ? React.createElement(
              RF,
              {
                nodes,
                edges,
                onNodesChange,
                onEdgesChange,
                onConnect,
                // pass nodeTypes through — the library expects a specific NodeTypes shape
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                nodeTypes: nodeTypes as any,
                onDragOver,
                onDrop,
              },
              MiniMap ? React.createElement(MiniMap) : null,
              Controls ? React.createElement(Controls) : null,
              Background ? React.createElement(Background) : null
            )
          : null}
      </section>
    </div>
  );
};

export default DiagramCanvas;
