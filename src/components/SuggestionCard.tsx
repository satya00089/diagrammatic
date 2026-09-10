import React from "react";
import { MdAdd, MdCheck, MdLayers, MdLightbulbOutline } from "react-icons/md";
import type { Suggestion } from "../types/chatBot";

interface SuggestionCardProps {
  suggestion: Suggestion;
  wasAdded: boolean;
  onClick: (suggestion: Suggestion) => void;
  canAdd?: boolean;
}

const getSuggestionIcon = (isActionable: boolean, isPattern: boolean) => {
  if (!isActionable) return MdLightbulbOutline;
  if (isPattern) return MdLayers;
  return MdAdd;
};

const getActionLabel = (wasAdded: boolean, isPattern: boolean): string => {
  if (wasAdded) return "Added to canvas";
  if (isPattern) return "Add components";
  return "Add to canvas";
};

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  wasAdded,
  onClick,
  canAdd = true,
}) => {
  const isPattern = suggestion.actionType === "add-pattern";
  const isActionable =
    (suggestion.actionType === "add-component" && !!suggestion.componentId) ||
    (isPattern && !!suggestion.componentIds?.length);
  const Icon = getSuggestionIcon(isActionable, isPattern);
  const actionLabel = getActionLabel(wasAdded, isPattern);
  const actionAriaLabel = wasAdded
    ? `Added ${suggestion.title}`
    : `Add ${suggestion.title} to canvas`;

  return (
    <article className={`assistant-suggestion${wasAdded ? " is-added" : ""}`}>
      <Icon className="assistant-suggestion__icon" aria-hidden="true" />
      <div className="assistant-suggestion__body">
        <h4>{suggestion.title}</h4>
        <p>{suggestion.description}</p>
        {isActionable && (
          <button
            type="button"
            className="assistant-add"
            onClick={() => {
              if (!wasAdded) onClick(suggestion);
            }}
            disabled={!canAdd}
            aria-disabled={wasAdded || !canAdd}
            aria-label={actionAriaLabel}
          >
            {wasAdded ? (
              <MdCheck aria-hidden="true" />
            ) : (
              <MdAdd aria-hidden="true" />
            )}
            {actionLabel}
          </button>
        )}
      </div>
    </article>
  );
};

export default SuggestionCard;
