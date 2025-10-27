import React from "react";
import ReactDOM from "react-dom";
import Fuse from "fuse.js";
import type { CanvasComponent } from "../types/canvas";
import { PiCaretLeftBold, PiCaretRightBold, PiCaretDownBold } from "react-icons/pi";

interface Props {
  readonly components: readonly CanvasComponent[];
  readonly onAdd: (id: string) => void;
}

export default function ComponentPalette({ components, onAdd }: Props) {
  const [open, setOpen] = React.useState(true);
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  const [hoveredComponent, setHoveredComponent] = React.useState<{ label: string; description: string; rect: DOMRect } | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fuse.js instance for fuzzy search
  const fuse = React.useMemo(() => {
    return new Fuse(Array.from(components), {
      keys: [
        { name: "label", weight: 0.5 },
        { name: "description", weight: 0.3 },
        { name: "group", weight: 0.2 },
      ],
      threshold: 0.3,
      includeScore: true,
    });
  }, [components]);

  // Filter components based on search
  const filteredComponents = React.useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return Array.from(components);
    
    const results = fuse.search(query);
    return results.map(result => result.item);
  }, [components, fuse, searchQuery]);

  // Group components by their group property
  const grouped = React.useMemo(() => {
    const map = new Map<string, CanvasComponent[]>();
    for (const c of filteredComponents) {
      const g = c.group ?? "Other";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(c);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [filteredComponents]);

  // Initialize all groups as expanded on first render
  React.useEffect(() => {
    if (grouped.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(grouped.map(([groupName]) => groupName)));
    }
  }, [grouped, expandedGroups.size]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

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
          open ? "w-56 p-3 pr-0" : "w-6 p-1"
        }`}
        aria-label="Component palette"
        id="component-palette-panel"
      >
        {open ? (
          <>
            <h3 className="text-lg font-semibold text-theme mb-3">
              Components
            </h3>
            
            {/* Search Input */}
            <div className="mr-3 mb-3">
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-theme rounded bg-[var(--bg)] text-theme placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
              />
            </div>

            <div className="space-y-1 flex-1 overflow-y-auto">
              {grouped.length === 0 ? (
                <div className="text-center py-8 text-muted text-sm">
                  No components found
                </div>
              ) : (
                grouped.map(([groupName, list]) => {
                const isExpanded = expandedGroups.has(groupName);
                return (
                  <div key={groupName}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(groupName)}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-left hover:bg-[var(--bg-hover)] rounded transition-colors"
                      aria-expanded={isExpanded}
                      aria-controls={`group-${groupName}`}
                    >
                      <span className="text-xs font-medium uppercase tracking-wide text-muted">
                        {groupName}
                      </span>
                      <PiCaretDownBold
                        size={12}
                        className={`text-muted transition-transform duration-150 ${
                          isExpanded ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <div id={`group-${groupName}`} className="mt-1 mb-3 px-1">
                        <div className="grid grid-cols-2 gap-1.5">
                          {list.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              draggable
                              aria-label={`Add ${c.label} to canvas`}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredComponent({ label: c.label, description: c.description || '', rect });
                              }}
                              onMouseLeave={() => setHoveredComponent(null)}
                              onDragStart={(e) => {
                                setHoveredComponent(null);
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
                              className="text-left p-2 border border-theme rounded-md cursor-grab select-none hover:border-[var(--brand)] hover:bg-[var(--bg-hover)] transition-all group/item"
                            >
                              <div className="text-center mb-1">
                                <span className="text-2xl">{c.icon}</span>
                              </div>
                              <div className="text-xs font-medium text-theme text-center group-hover/item:text-[var(--brand)] transition-colors line-clamp-1">
                                {c.label}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
              )}

              <div className="mt-4 px-2 py-2.5 rounded text-xs bg-[var(--bg-hover)]">
                <div className="font-medium mb-1 text-theme">💡 Tip</div>
                <div className="text-muted">
                  Drag a component to the canvas to start designing
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

      {/* Portal Tooltip - renders at body level to avoid clipping */}
      {hoveredComponent && ReactDOM.createPortal(
        <div 
          className="fixed px-3 py-2 bg-[var(--bg)] border border-theme rounded shadow-lg text-xs z-[9999] min-w-max max-w-xs pointer-events-none -translate-y-1/2"
          style={{
            left: `${hoveredComponent.rect.right + 8}px`,
            top: `${hoveredComponent.rect.top + hoveredComponent.rect.height / 2}px`
          } as React.CSSProperties}
        >
          <div className="font-semibold text-theme mb-0.5">{hoveredComponent.label}</div>
          <div className="text-muted">{hoveredComponent.description}</div>
          <div 
            className="absolute right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-[var(--bg)]"
          ></div>
        </div>,
        document.body
      )}
    </div>
  );
}
