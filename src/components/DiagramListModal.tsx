import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SavedDiagram } from "../types/auth";

interface DiagramListModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagrams: SavedDiagram[];
  onLoad: (diagram: SavedDiagram) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const DiagramListModal: React.FC<DiagramListModalProps> = ({
  isOpen,
  onClose,
  diagrams,
  onLoad,
  onDelete,
  isLoading,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this diagram?")) return;

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-surface rounded-2xl shadow-2xl p-6 max-w-3xl w-full max-h-[80vh] flex flex-col border border-theme/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-theme">My Diagrams</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-muted hover:text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-muted">Loading diagrams...</div>
                </div>
              ) : diagrams.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-muted mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-muted text-lg mb-2">No diagrams yet</p>
                  <p className="text-muted text-sm">
                    Create your first diagram and save it to see it here
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {diagrams.map((diagram) => (
                    <div
                      key={diagram.id}
                      onClick={() => {
                        onLoad(diagram);
                        onClose();
                      }}
                      className="p-4 bg-theme/5 hover:bg-theme/10 border border-theme/10 rounded-lg cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-theme truncate group-hover:text-[var(--brand)] transition-colors">
                            {diagram.title}
                          </h3>
                          {diagram.description && (
                            <p className="text-sm text-muted mt-1 line-clamp-2">
                              {diagram.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                            <span>
                              {diagram.nodes.length} node
                              {diagram.nodes.length !== 1 ? "s" : ""}
                            </span>
                            <span>
                              {diagram.edges.length} connection
                              {diagram.edges.length !== 1 ? "s" : ""}
                            </span>
                            <span>Updated {formatDate(diagram.updatedAt)}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(diagram.id, e)}
                          disabled={deletingId === diagram.id}
                          className="ml-4 p-2 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                          aria-label="Delete diagram"
                        >
                          {deletingId === diagram.id ? (
                            <svg
                              className="animate-spin h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
