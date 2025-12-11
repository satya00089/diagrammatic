import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdChat, MdClose, MdRefresh } from "react-icons/md";
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
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-[var(--brand)] to-[var(--accent)]
          text-white rounded-full shadow-xl flex items-center justify-center
          z-50 transition-all hover:shadow-2xl"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle chat bot"
      >
        {isOpen ? (
          <MdClose className="w-8 h-8" />
        ) : (
          <MdChat className="w-8 h-8" />
        )}
        {suggestions.length > 0 && !isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full 
              flex items-center justify-center text-xs font-bold"
          >
            {suggestions.length}
          </motion.div>
        )}
      </motion.button>

      {/* Chat Bot Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 max-h-[600px] 
              bg-[var(--surface)] rounded-2xl shadow-2xl
              border border-theme/10 backdrop-blur-sm
              flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 
              bg-gradient-to-r from-[var(--brand)] to-[var(--accent)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    Design Assistant
                  </h3>
                  <p className="text-xs text-white/80">
                    Smart suggestions for you
                  </p>
                </div>
              </div>
              <button
                onClick={toggleChatBot}
                className="text-white/80 hover:text-white transition-colors 
                  w-8 h-8 flex items-center justify-center rounded-full
                  hover:bg-white/10"
                aria-label="Close chat bot"
              >
                <MdClose className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 bg-gradient-to-b from-transparent to-theme/5 chatbot-scroll">
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
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gradient-to-br from-accent/10 to-accent/5 
                          border border-accent/20 rounded-xl p-4 mb-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🎯</span>
                          <div className="flex-1">
                            <h4 className="font-bold text-theme text-base mb-1">
                              {userIntent.title || "Your Project"}
                            </h4>
                            {userIntent.description && (
                              <p className="text-sm text-muted leading-relaxed">
                                {userIntent.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Suggestions */}
                    {suggestions.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">✨</span>
                          <h4 className="text-sm font-bold text-theme">
                            Suggestions for you
                          </h4>
                          <span
                            className="ml-auto text-xs px-2 py-1 bg-accent/10
                            text-accent rounded-full font-medium"
                          >
                            {suggestions.length}
                          </span>
                        </div>

                        {/* AI Refresh Button - Only show for authenticated users with 5+ nodes */}
                        {isAuthenticated &&
                          canvasContext &&
                          canvasContext.nodeCount >= 5 && (
                            <div className="flex items-center justify-between mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                              <div className="flex-1">
                                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                  💡 Get AI-powered recommendations
                                </p>
                                <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                                  {lastAIRefresh
                                    ? `Last updated: ${lastAIRefresh.toLocaleTimeString()}`
                                    : "Click refresh for personalized suggestions"}
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
                          {suggestions.map((suggestion, index) => (
                            <motion.div
                              key={suggestion.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <SuggestionCard
                                suggestion={suggestion}
                                wasAdded={addedSuggestionId === suggestion.id}
                                onClick={handleSuggestionClick}
                              />
                            </motion.div>
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
                          flex items-center justify-center"
                        >
                          <span className="text-4xl opacity-50">🎨</span>
                        </div>
                        <p className="text-muted text-sm">
                          Start adding components to your canvas!
                        </p>
                        <p className="text-muted text-xs mt-1">
                          I'll provide smart suggestions as you design
                        </p>
                      </motion.div>
                    )}

                    {/* Canvas Stats */}
                    {canvasContext && !canvasContext.isEmpty && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-5 pt-4 border-t border-theme/10"
                      >
                        <h5 className="text-xs font-bold text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
                          <span>📊</span>
                          <span>Canvas Overview</span>
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div
                            className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 
                            border border-blue-500/20 rounded-lg p-3 text-center"
                          >
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {canvasContext.nodeCount}
                            </div>
                            <div className="text-xs text-muted mt-1">
                              Components
                            </div>
                          </div>
                          <div
                            className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 
                            border border-purple-500/20 rounded-lg p-3 text-center"
                          >
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {canvasContext.edgeCount}
                            </div>
                            <div className="text-xs text-muted mt-1">
                              Connections
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-theme/10 bg-theme/5">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">💡</span>
                <p className="text-xs text-muted font-medium">
                  Suggestions adapt to your design
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
