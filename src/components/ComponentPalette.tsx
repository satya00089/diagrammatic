import React from "react";
import type { CanvasComponent } from "../types/canvas";
import { PiCaretLeftBold, PiCaretRightBold } from "react-icons/pi";

interface Props {
  readonly components: readonly CanvasComponent[];
  readonly onAdd: (id: string) => void;
}

export default function ComponentPalette({ components, onAdd }: Props) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="relative z-40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={
          open ? "Collapse component palette" : "Expand component palette"
        }
        aria-controls="component-palette-panel"
        className="absolute top-5 -right-3 h-6 w-6 flex items-center justify-center rounded-full border border-theme bg-surface text-theme shadow cursor-pointer hover:bg-[var(--bg-hover)] transition-colors z-50"
      >
        {open ? <PiCaretLeftBold size={16} /> : <PiCaretRightBold size={16} />}
      </button>
      <div
        className={`relative shrink-0 group h-full flex flex-col bg-surface border-r border-theme overflow-y-auto overflow-x-hidden component-palette transition-[width] duration-300 ease-in-out z-40 ${
          open ? "w-56 p-4" : "w-6 p-1"
        }`}
        aria-label="Component palette"
        id="component-palette-panel"
      >
        {open ? (
          <>
            <h3 className="text-lg font-semibold text-theme mb-4">
              Components
            </h3>
            <div className="space-y-2">
              {components.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  draggable
                  aria-label={`Add ${c.label} to canvas`}
                  onDragStart={(e) => {
                    e.dataTransfer?.setData(
                      "application/reactflow",
                      JSON.stringify({ type: c.id })
                    );
                    e.dataTransfer?.setData("text/plain", c.id);
                    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
                  }}
                  onKeyDown={(e) => {
                    if (
                      (e as React.KeyboardEvent).key === "Enter" ||
                      (e as React.KeyboardEvent).key === " "
                    ) {
                      (e as React.KeyboardEvent).preventDefault();
                      onAdd(c.id);
                    }
                  }}
                  className="w-full text-left p-3 bg-[var(--surface)] border border-theme rounded-lg cursor-grab select-none"
                >
                  <div className="text-sm font-medium text-theme">
                    {c.icon} {c.label}
                  </div>
                  <div className="text-xs text-muted">{c.description}</div>
                </button>
              ))}

              <div className="mt-4 p-3 rounded-lg text-xs border border-theme bg-[var(--surface)]">
                <div className="font-medium mb-1 text-brand">
                  💡 Coming Soon:
                </div>
                <div className="text-muted">
                  Drag & drop components to canvas
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <span className="sr-only">Component palette collapsed</span>
          </div>
        )}
      </div>
    </div>
  );
}
