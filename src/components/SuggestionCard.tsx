import React from "react";
import { motion } from "framer-motion";
import type { Suggestion } from "../types/chatBot";

interface SuggestionCardProps {
  suggestion: Suggestion;
  wasAdded: boolean;
  onClick: (suggestion: Suggestion) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  wasAdded,
  onClick,
}) => {
  const isClickable =
    suggestion.actionType === "add-component" ||
    suggestion.actionType === "add-pattern";

  const getCardClassName = () => {
    let className = `bg-theme/50 rounded-xl p-3.5
      transition-all duration-300 border shadow-sm`;

    if (isClickable) {
      className += ` hover:shadow-md hover:scale-[1.02] hover:border-accent/40 
        hover:bg-accent/5 cursor-pointer transform`;
    } else {
      className += ` border-theme/10`;
    }

    if (wasAdded) {
      className += ` bg-green-500/10 border-green-500/30 shadow-green-500/20`;
    } else {
      className += ` border-theme/10`;
    }

    return className;
  };

  const renderStatusBadge = () => {
    if (isClickable && !wasAdded) {
      return (
        <span
          className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full 
          font-medium border border-accent/20"
        >
          Click to add
        </span>
      );
    }

    if (wasAdded) {
      return (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 
            rounded-full font-medium border border-green-500/20 flex items-center gap-1"
        >
          <span>✓</span>
          <span>Added</span>
        </motion.span>
      );
    }

    return null;
  };

  return (
    <motion.div
      whileHover={isClickable ? { x: 4 } : {}}
      className={getCardClassName()}
      onClick={() => onClick(suggestion)}
    >
      <div className="flex items-start gap-3">
        {suggestion.icon && (
          <div
            className="w-8 h-8 flex-shrink-0 bg-accent/10 rounded-lg 
            flex items-center justify-center"
          >
            <span className="text-lg">{suggestion.icon}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h5 className="font-semibold text-sm text-theme">
              {suggestion.title}
            </h5>
            {renderStatusBadge()}
          </div>
          <p className="text-xs text-muted leading-relaxed">
            {suggestion.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SuggestionCard;
