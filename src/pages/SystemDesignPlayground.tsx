import React, { useRef } from 'react';
import type { SystemDesignProblem } from '../types/systemDesign';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useTheme } from '../hooks/useTheme';
import { ReactFlow, Background, Controls, MiniMap, Handle, addEdge, useNodesState, useEdgesState, Position } from "@xyflow/react";
import type { Node, Edge, Connection } from "@xyflow/react";
import { COMPONENTS } from '../config/components';

interface SystemDesignPlaygroundProps {
  problem: SystemDesignProblem | null;
  onBack: () => void;
}

const SystemDesignPlayground: React.FC<SystemDesignPlaygroundProps> = ({ problem, onBack }) => {
  useTheme(); // ensure theme applied for this page

  // determine difficulty badge classes in one place to avoid nested ternary in JSX
  const difficultyBadgeClass = (() => {
    if (!problem) return '';
    const d = problem.difficulty;
    if (d === 'Easy') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (d === 'Medium' ) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  })();

  // start with empty canvas state — the user will drag & drop components
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);

  const onConnect = (connection: Connection) => setEdges((eds) => addEdge(connection, eds));

  // ref to the reactflow wrapper to compute drop position
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    const data = event.dataTransfer?.getData('application/reactflow') || event.dataTransfer?.getData('text/plain');
    let type = data;
    try {
      if (data) {
        const parsed = JSON.parse(data);
        type = parsed.type || data;
      }
    } catch {
      // not json, keep data as-is
    }

    const x = event.clientX - (reactFlowBounds?.left ?? 0);
    const y = event.clientY - (reactFlowBounds?.top ?? 0);
    const position = { x, y };

    const id = `${type}-${Date.now()}`;
    const comp = COMPONENTS.find((c) => c.id === type);
    const newNode: Node = {
      id,
      position,
      type: 'custom',
      // include icon so the custom node can render it
      data: { label: comp?.label ?? type, icon: comp?.icon },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  // accessible fallback to add a node from palette via keyboard (touch/click still supported via keyboard handlers)
  const addNodeFromPalette = (typeId: string) => {
    const comp = COMPONENTS.find((c) => c.id === typeId);
    const id = `${typeId}-${Date.now()}`;
    const newNode: Node = {
      id,
      position: { x: 250 + Math.floor(Math.random() * 80), y: 150 + Math.floor(Math.random() * 80) },
      type: 'custom',
      data: { label: comp?.label ?? typeId, icon: comp?.icon },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Minimal custom node for the canvas (icon + label, minimal design)
  const MinimalNode: React.FC<{ data: { label: string; icon?: string } }> = ({ data }) => {
    return (
      <div className="min-w-[100px] max-w-xs px-3 py-2 bg-[var(--surface)] border border-theme rounded-md text-theme text-sm shadow-sm">
        <Handle type="target" position={Position.Left} className="-ml-2" />
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{data.icon}</span>
          <span className="truncate">{data.label}</span>
        </div>
        <Handle type="source" position={Position.Right} className="-mr-2" />
      </div>
    );
  };

  // register node types
  const nodeTypes = { custom: MinimalNode };

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No problem selected</h2>
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-theme">
      {/* Header */}
      <div className="bg-surface shadow-sm border-b border-theme px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="px-3 py-2 text-muted hover:text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors"
            >
              ← Back to Dashboard
            </button>
            <div>
              <h1 className="text-lg font-semibold text-theme">{problem.title}</h1>
              <div className="flex items-center space-x-2 text-sm text-muted">
                <span className={`px-2 py-1 rounded text-xs ${difficultyBadgeClass}`}>
                  {problem.difficulty}
                </span>
                <span className="text-muted">{problem.estimatedTime}</span>
                <span className="text-muted">•</span>
                <span className="text-muted">{problem.category}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Component Palette */}
        <div className="w-64 bg-surface border-r border-theme p-4">
          <h3 className="text-lg font-semibold text-theme mb-4">System Components</h3>
          <div className="space-y-2">
            {COMPONENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                draggable
                aria-label={`Add ${c.label} to canvas`}
                onDragStart={(e) => {
                  // set a small payload so the canvas can handle drops later
                  e.dataTransfer?.setData('application/reactflow', JSON.stringify({ type: c.id }));
                  e.dataTransfer?.setData('text/plain', c.id);
                  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
                }}
                onKeyDown={(e) => {
                  // support Enter and Space to activate
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    addNodeFromPalette(c.id);
                  }
                }}
                className="w-full text-left p-3 bg-[var(--surface)] border border-theme rounded-lg cursor-grab select-none"
              >
                <div className="text-sm font-medium text-theme">{c.icon} {c.label}</div>
                <div className="text-xs text-muted">{c.description}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[var(--brand, #eaf0ff)] border border-theme rounded-lg text-xs text-brand">
            <div className="font-medium mb-1">💡 Coming Soon:</div>
            <div className="text-brand">Drag & drop components to canvas</div>
          </div>
        </div>

        {/* Center - ReactFlow Canvas */}
        <div className="flex-1 relative bg-theme min-h-0">
          <div className="w-full h-full" ref={reactFlowWrapper} onDragOver={onDragOver} onDrop={onDrop}>
            <ReactFlow
              className="w-full h-full"
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <MiniMap nodeStrokeWidth={3} />
              <Controls />
              <Background gap={16} />
            </ReactFlow>
          </div>
        </div>

        {/* Right Sidebar - Problem Details */}
        <div className="w-80 bg-surface border-l border-theme p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-theme mb-3">{problem.title}</h3>
          <p className="text-muted text-sm leading-relaxed mb-4">{problem.description}</p>
          
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-theme mb-2">Requirements</h4>
            <ul className="space-y-1">
              {problem.requirements.map((req) => (
                <li key={req} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5 text-xs">✓</span>
                  <span className="text-xs text-muted">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-theme mb-2">Constraints</h4>
            <ul className="space-y-1">
              {problem.constraints.map((constraint) => (
                <li key={constraint} className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-0.5 text-xs">⚠</span>
                  <span className="text-xs text-muted">{constraint}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-theme mb-2">Hints</h4>
            <div className="space-y-2">
              {problem.hints.map((hint) => (
                <div key={hint} className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 dark:border-yellow-600 p-2 rounded-r-lg">
                  <div className="text-xs text-muted">{hint}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-theme mb-2">Tags</h4>
            <div className="flex flex-wrap gap-1">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemDesignPlayground;
