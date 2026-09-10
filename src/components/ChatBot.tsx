import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  MdChatBubbleOutline,
  MdClose,
  MdRefresh,
  MdOutlineAccountTree,
} from "react-icons/md";
import type { Node, Edge } from "@xyflow/react";
import { useChatBot } from "../hooks/useChatBot";
import { useChatSuggestions } from "../hooks/useChatSuggestions";
import { useAuth } from "../hooks/useAuth";
import { WelcomeDialog } from "./WelcomeDialog";
import SuggestionCard from "./SuggestionCard";
import type { CanvasContext, Suggestion } from "../types/chatBot";
import "./DesignAssistant.css";

interface ChatBotProps {
  canvasContext?: CanvasContext;
  nodes?: Node[];
  edges?: Edge[];
  onAddComponent?: (componentId: string) => void;
}

const getSuggestionComponentIds = (suggestion: Suggestion): string[] => {
  if (suggestion.actionType === "add-component" && suggestion.componentId) {
    return [suggestion.componentId];
  }
  if (suggestion.actionType === "add-pattern") {
    return suggestion.componentIds ?? [];
  }
  return [];
};

const getRefreshMessage = (
  isLoadingAI: boolean,
  lastAIRefresh: Date | null,
): string => {
  if (isLoadingAI) return "Reviewing your canvas…";
  if (lastAIRefresh) {
    return `Updated ${lastAIRefresh.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  return "Get suggestions for your current design.";
};

interface AssistantRefreshProps {
  isLoadingAI: boolean;
  lastAIRefresh: Date | null;
  onRefresh: () => void;
}

const AssistantRefresh: React.FC<AssistantRefreshProps> = ({
  isLoadingAI,
  lastAIRefresh,
  onRefresh,
}) => (
  <div className="assistant-refresh">
    <div>
      <h4>AI recommendations</h4>
      <output aria-live="polite">
        {getRefreshMessage(isLoadingAI, lastAIRefresh)}
      </output>
    </div>
    <button
      type="button"
      onClick={onRefresh}
      disabled={isLoadingAI}
      className="assistant-primary"
      aria-label="Refresh AI recommendations"
    >
      <MdRefresh
        className={isLoadingAI ? "assistant-spin" : ""}
        aria-hidden="true"
      />
      {isLoadingAI ? "Loading…" : "Refresh"}
    </button>
  </div>
);

interface AssistantSuggestionsProps {
  suggestions: Suggestion[];
  addedSuggestionId: string | null;
  onAddSuggestion: (suggestion: Suggestion) => void;
  canAdd: boolean;
}

const AssistantSuggestions: React.FC<AssistantSuggestionsProps> = ({
  suggestions,
  addedSuggestionId,
  onAddSuggestion,
  canAdd,
}) => {
  if (suggestions.length === 0) {
    return (
      <div className="assistant-empty">
        <MdOutlineAccountTree aria-hidden="true" />
        <h4>Start with a component</h4>
        <p>
          Add components to your canvas to get started. Suggestions will appear
          as you build.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="assistant-section-title">
        <h4>Suggestions</h4>
        <span>{suggestions.length}</span>
      </div>
      <div className="assistant-suggestions">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            wasAdded={addedSuggestionId === suggestion.id}
            onClick={onAddSuggestion}
            canAdd={canAdd}
          />
        ))}
      </div>
    </>
  );
};

interface AssistantContentProps {
  showWelcome: boolean;
  userIntent: ReturnType<typeof useChatBot>["userIntent"];
  isAuthenticated: boolean;
  canvasContext?: CanvasContext;
  isLoadingAI: boolean;
  lastAIRefresh: Date | null;
  onRefresh: () => void;
  suggestions: Suggestion[];
  addedSuggestionId: string | null;
  onAddSuggestion: (suggestion: Suggestion) => void;
  canAdd: boolean;
}

const AssistantContent: React.FC<AssistantContentProps> = ({
  showWelcome,
  userIntent,
  isAuthenticated,
  canvasContext,
  isLoadingAI,
  lastAIRefresh,
  onRefresh,
  suggestions,
  addedSuggestionId,
  onAddSuggestion,
  canAdd,
}) => {
  if (showWelcome) return <WelcomeDialog />;

  const shouldShowRefresh =
    isAuthenticated && canvasContext && canvasContext.nodeCount >= 5;

  return (
    <>
      {userIntent && (
        <div className="assistant-project">
          <h4>{userIntent.title || "Your Project"}</h4>
          {userIntent.description && <p>{userIntent.description}</p>}
        </div>
      )}
      {shouldShowRefresh && (
        <AssistantRefresh
          isLoadingAI={isLoadingAI}
          lastAIRefresh={lastAIRefresh}
          onRefresh={onRefresh}
        />
      )}
      <AssistantSuggestions
        suggestions={suggestions}
        addedSuggestionId={addedSuggestionId}
        onAddSuggestion={onAddSuggestion}
        canAdd={canAdd}
      />
    </>
  );
};

interface AssistantStatsProps {
  showWelcome: boolean;
  canvasContext?: CanvasContext;
}

const AssistantStats: React.FC<AssistantStatsProps> = ({
  showWelcome,
  canvasContext,
}) => {
  if (showWelcome || !canvasContext || canvasContext.isEmpty) return null;

  const componentLabel =
    canvasContext.nodeCount === 1 ? "component" : "components";
  const connectionLabel =
    canvasContext.edgeCount === 1 ? "connection" : "connections";

  return (
    <footer className="assistant-stats">
      <span>
        <strong>{canvasContext.nodeCount}</strong> {componentLabel}
      </span>
      <span>
        <strong>{canvasContext.edgeCount}</strong> {connectionLabel}
      </span>
    </footer>
  );
};

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
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (canvasContext) updateCanvasContext(canvasContext);
  }, [canvasContext, updateCanvasContext]);

  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  const closeAssistant = () => {
    toggleChatBot();
    launcherRef.current?.focus({ preventScroll: true });
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (!onAddComponent) return;
    const componentIds = getSuggestionComponentIds(suggestion);
    if (!componentIds.length) return;
    componentIds.forEach((componentId) => onAddComponent(componentId));
    setAddedSuggestionId(suggestion.id);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setAddedSuggestionId(null), 2000);
  };

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={toggleChatBot}
        className="assistant-launcher"
        aria-label={isOpen ? "Close Design Assistant" : "Open Design Assistant"}
        aria-expanded={isOpen}
        aria-controls={isOpen ? "design-assistant" : undefined}
      >
        {isOpen ? (
          <MdClose aria-hidden="true" />
        ) : (
          <MdChatBubbleOutline aria-hidden="true" />
        )}
        {suggestions.length > 0 && !isOpen && (
          <span className="assistant-launcher__count">
            {suggestions.length}
            <span className="sr-only"> suggestions</span>
          </span>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.section
            id="design-assistant"
            aria-labelledby="design-assistant-title"
            className="design-assistant"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                closeAssistant();
              }
            }}
          >
            <header className="assistant-header">
              <div>
                <h3 id="design-assistant-title">Design Assistant</h3>
                <p>Guidance for your canvas</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={closeAssistant}
                className="assistant-icon-button"
                aria-label="Close Design Assistant"
              >
                <MdClose aria-hidden="true" />
              </button>
            </header>
            <div className="assistant-content chatbot-scroll">
              <AssistantContent
                showWelcome={showWelcome}
                userIntent={userIntent}
                isAuthenticated={isAuthenticated}
                canvasContext={canvasContext}
                isLoadingAI={isLoadingAI}
                lastAIRefresh={lastAIRefresh}
                onRefresh={refreshAISuggestions}
                suggestions={suggestions}
                addedSuggestionId={addedSuggestionId}
                onAddSuggestion={handleSuggestionClick}
                canAdd={!!onAddComponent}
              />
            </div>
            <AssistantStats
              showWelcome={showWelcome}
              canvasContext={canvasContext}
            />
            <output className="sr-only" aria-live="polite">
              {addedSuggestionId ? "Added to canvas" : ""}
            </output>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
};
