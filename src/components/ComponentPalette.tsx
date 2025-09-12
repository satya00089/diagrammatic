import React from 'react';
import type { CanvasComponent } from '../types/canvas';

interface Props {
  components: CanvasComponent[];
  onAdd: (id: string) => void;
}

export default function ComponentPalette({ components, onAdd }: Props) {
  return (
    <div className="w-64 bg-surface border-r border-theme p-4 overflow-y-auto component-palette">
      <h3 className="text-lg font-semibold text-theme mb-4">System Components</h3>
      <div className="space-y-2">
        {components.map((c) => (
          <button
            key={c.id}
            type="button"
            draggable
            aria-label={`Add ${c.label} to canvas`}
            onDragStart={(e) => {
              e.dataTransfer?.setData('application/reactflow', JSON.stringify({ type: c.id }));
              e.dataTransfer?.setData('text/plain', c.id);
              if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
            }}
            onKeyDown={(e) => {
              if ((e as React.KeyboardEvent).key === 'Enter' || (e as React.KeyboardEvent).key === ' ') {
                (e as React.KeyboardEvent).preventDefault();
                onAdd(c.id);
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
  );
}
