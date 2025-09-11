import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type ReactFlowInstance
} from '@xyflow/react';
import Palette, { type PaletteItem } from '../components/Palette';
import EditorToolbar from '../components/EditorToolbar';

interface NodeData extends Record<string, unknown> {
  componentType: string;
  tokens: Record<string, string>;
}

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

const EditorWithPalette: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds || !reactFlowInstance) return;

      const data = event.dataTransfer.getData('application/reactflow');
      if (!data) return;

      try {
        const item: PaletteItem = JSON.parse(data);
        
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode: Node<NodeData> = {
          id: `${item.componentType.toLowerCase()}_${Date.now()}`,
          type: 'default',
          position,
          data: {
            componentType: item.componentType,
            tokens: { ...item.tokens }
          },
          style: {
            background: item.tokens['--color-bg'] || '#ffffff',
            color: item.tokens['--color-text'] || '#000000',
            border: `1px solid ${item.tokens['--color-border'] || '#e5e7eb'}`,
            borderRadius: item.tokens['--border-radius'] || '6px',
            padding: item.tokens['--padding'] || '12px',
            fontSize: item.tokens['--font-size'] || '14px'
          }
        };

        setNodes((nds) => nds.concat(newNode));
      } catch (error) {
        console.error('Failed to parse dropped data:', error);
      }
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeToken = useCallback((tokenKey: string, tokenValue: string) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          const nodeData = node.data as NodeData;
          const updatedTokens = {
            ...nodeData.tokens,
            [tokenKey]: tokenValue
          };
          
          return {
            ...node,
            data: {
              ...node.data,
              tokens: updatedTokens
            },
            style: {
              ...node.style,
              background: updatedTokens['--color-bg'] || '#ffffff',
              color: updatedTokens['--color-text'] || '#000000',
              border: `1px solid ${updatedTokens['--color-border'] || '#e5e7eb'}`,
              borderRadius: updatedTokens['--border-radius'] || '6px',
              padding: updatedTokens['--padding'] || '12px',
              fontSize: updatedTokens['--font-size'] || '14px'
            }
          };
        }
        return node;
      })
    );

    // Update selected node reference
    setSelectedNode((prev) => {
      if (!prev || prev.id !== selectedNode.id) return prev;
      const prevData = prev.data as NodeData;
      return {
        ...prev,
        data: {
          ...prevData,
          tokens: {
            ...prevData.tokens,
            [tokenKey]: tokenValue
          }
        }
      };
    });
  }, [selectedNode, setNodes]);

  const exportJSON = useCallback(() => {
    const exportData = {
      nodes: nodes.map(node => ({
        id: node.id,
        position: node.position,
        data: node.data
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target
      }))
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Copy to clipboard
    navigator.clipboard.writeText(jsonString).then(() => {
      alert('JSON exported to clipboard!');
    }).catch(() => {
      // Fallback: create downloadable file
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diagram-export.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [nodes, edges]);

  // Toolbar handlers
  const handleClearAll = useCallback(() => {
    if (nodes.length > 0 && confirm('Are you sure you want to clear all components?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
    }
  }, [nodes.length, setNodes, setEdges]);

  const handleZoomIn = useCallback(() => {
    reactFlowInstance?.zoomIn();
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance?.zoomOut();
  }, [reactFlowInstance]);

  const handleFitView = useCallback(() => {
    reactFlowInstance?.fitView();
  }, [reactFlowInstance]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <EditorToolbar 
        onClearAll={handleClearAll}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        nodeCount={nodes.length}
      />
      
      <div style={{ display: 'flex', flex: 1 }}>
        <Palette />
        
        <div style={{ flex: 1, display: 'flex' }}>
        <div 
          ref={reactFlowWrapper}
          style={{ flex: 1, height: '100%' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
          />
        </div>

        {/* Inspector Panel */}
        <div style={{
          width: '300px',
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderLeft: '1px solid #e5e7eb',
          overflowY: 'auto'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Inspector
          </h3>

          {selectedNode ? (
            <div>
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Component Type
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  {(selectedNode.data as NodeData).componentType}
                </div>
              </div>

              <div style={{
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Design Tokens
                </div>
                
                {Object.entries((selectedNode.data as NodeData).tokens).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: '8px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px'
                    }}>
                      {key}
                    </label>
                    <input
                      type="text"
                      value={value as string}
                      onChange={(e) => updateNodeToken(key, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Select a node to edit its properties
            </div>
          )}

          <button
            onClick={exportJSON}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              marginTop: '16px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            Export JSON
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default EditorWithPalette;
