import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdChat, MdClose, MdRefresh } from "react-icons/md";
import { HiSparkles, HiLightBulb, HiPencilSquare, HiFlag, HiChartBar } from "react-icons/hi2";
import type { Node, Edge } from "@xyflow/react";
import { useChatBot } from "../hooks/useChatBot";
import { useChatSuggestions } from "../hooks/useChatSuggestions";
import { useAuth } from "../hooks/useAuth";
import { WelcomeDialog } from "./WelcomeDialog";
import SuggestionCard from "./SuggestionCard";
import type { CanvasContext, Suggestion } from "../types/chatBot";

interface ChatBotProps {
  canvasContext?: CanvasContext;
  nodes?: Node[];
  edges?: Edge[];
  onAddComponent?: (componentId: string) => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({
  canvasContext,
  nodes = [],
  edges = [],
  onAddComponent,
}) => {
  const { isAuthenticated } = useAuth();
  const {
    isOpen,
    showWelcome,
    userIntent,
    toggleChatBot,
    updateCanvasContext,
  } = useChatBot();

  const { suggestions, refreshAISuggestions, isLoadingAI, lastAIRefresh } =
    useChatSuggestions(userIntent, canvasContext ?? null, nodes, edges);
  const [addedSuggestionId, setAddedSuggestionId] = useState<string | null>(
    null,
  );

  // Update canvas context when it changes
  useEffect(() => {
    if (canvasContext) {
      updateCanvasContext(canvasContext);
    }
  }, [canvasContext, updateCanvasContext]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (
      suggestion.actionType === "add-component" &&
      suggestion.componentId &&
      onAddComponent
    ) {
      onAddComponent(suggestion.componentId);
      // Show success feedback
      setAddedSuggestionId(suggestion.id);
      setTimeout(() => setAddedSuggestionId(null), 2000);
    } else if (
      suggestion.actionType === "add-pattern" &&
      suggestion.componentIds &&
      onAddComponent
    ) {
      // Add multiple components for patterns
      for (const componentId of suggestion.componentIds) {
        onAddComponent(componentId);
      }
      // Show success feedback
      setAddedSuggestionId(suggestion.id);
      setTimeout(() => setAddedSuggestionId(null), 2000);
    }
    // For 'info-only' tips, do nothing (just visual feedback)
  };

  return (
    <>
      {/* Chat Bot Icon */}
      <motion.button
        onClick={toggleChatBot}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[var(--brand)]
          text-white rounded-full shadow-lg flex items-center justify-center
          z-50 transition-all hover:shadow-xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle assistant"
      >
        {isOpen ? (
          <MdClose className="w-8 h-8" />
        ) : (
          <MdChat className="w-8 h-8" />
        )}
        {suggestions.length > 0 && !isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold">
            {suggestions.length}
          </div>
        )}
      </motion.button>

      {/* Chat Bot Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-20 right-6 w-88 max-h-[560px]
              bg-[var(--surface)] rounded-xl shadow-xl
              border border-theme/10
              flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--brand)]">
              <div className="flex items-center gap-2">
                <HiSparkles className="w-4 h-4 text-white/80" />
                <h3 className="font-semibold text-white text-sm">Design Assistant</h3>
              </div>
              <button
                onClick={toggleChatBot}
                className="text-white/70 hover:text-white transition-colors p-1 rounded"
                aria-label="Close"
              >
                <MdClose className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 chatbot-scroll">
              <AnimatePresence mode="wait">
                {showWelcome ? (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <WelcomeDialog />
                  </motion.div>
                ) : (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* User Intent Summary */}
                    {userIntent && (
                      <div className="bg-[var(--bg)] border border-theme/10 rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2">
                        <HiFlag className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-theme truncate">{userIntent.title || "Your Project"}</p>
                          {userIntent.description && (
                            <p className="text-xs text-muted mt-0.5 line-clamp-2">{userIntent.description}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {suggestions.length > 0 ? (
                      <>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                          Suggestions
                        </p>

                        {/* AI Refresh Button - Only show for authenticated users with 5+ nodes */}
                        {isAuthenticated &&
                          canvasContext &&
                          canvasContext.nodeCount >= 5 && (
                            <div className="flex items-center justify-between mb-3 p-3 bg-[var(--brand)]/10 rounded-lg border border-[var(--brand)]/30">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-[var(--brand)] flex items-center gap-1">
                                  <HiLightBulb className="w-3.5 h-3.5" /> AI recommendations
                                </p>
                                <p className="text-xs text-[var(--brand)]/70">
                                  {lastAIRefresh
                                    ? `Updated ${lastAIRefresh.toLocaleTimeString()}`
                                    : "Refresh for AI-powered suggestions"}
                                </p>
                              </div>
                              <button
                                onClick={refreshAISuggestions}
                                disabled={isLoadingAI}
                                className="ml-3 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                                text-white rounded-lg transition-colors duration-200
                                flex items-center gap-1 text-xs font-medium
                                disabled:cursor-not-allowed"
                                title="Get AI recommendations"
                              >
                                {isLoadingAI ? (
                                  <>
                                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Loading...</span>
                                  </>
                                ) : (
                                  <>
                                    <MdRefresh className="w-3 h-3" />
                                    <span>AI Suggest</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                        <div className="space-y-2">
                          {suggestions.map((suggestion) => (
                            <SuggestionCard
                              key={suggestion.id}
                              suggestion={suggestion}
                              wasAdded={addedSuggestionId === suggestion.id}
                              onClick={handleSuggestionClick}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <div
                          className="w-16 h-16 mx-auto mb-4 bg-theme/5 rounded-full 
                          flex items-center justify-center text-[var(--brand)]/40"
                        >
                          <HiPencilSquare className="w-8 h-8" />
                        </div>
                        <p className="text-muted text-sm">
                          Add components to your canvas to get started.
                        </p>
                        <p className="text-muted text-xs mt-1">
                          Suggestions will appear as you build.
                        </p>
                      </motion.div>
                    )}

                    {/* Canvas Stats */}
                    {canvasContext && !canvasContext.isEmpty && (
                      <div className="mt-4 pt-3 border-t border-theme/10 flex items-center gap-4 text-xs text-muted">
                        <HiChartBar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span><span className="font-semibold text-theme">{canvasContext.nodeCount}</span> components</span>
                        <span><span className="font-semibold text-theme">{canvasContext.edgeCount}</span> connections</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
