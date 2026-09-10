import React from "react";
import { MdAdd, MdCheck, MdLayers, MdLightbulbOutline } from "react-icons/md";
import type { Suggestion } from "../types/chatBot";

interface SuggestionCardProps {
  suggestion: Suggestion;
  wasAdded: boolean;
  onClick: (suggestion: Suggestion) => void;
  canAdd?: boolean;
}

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
  const Icon = isActionable
    ? isPattern
      ? MdLayers
      : MdAdd
    : MdLightbulbOutline;

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
            aria-label={`${wasAdded ? "Added" : "Add"} ${suggestion.title}${wasAdded ? "" : " to canvas"}`}
          >
            {wasAdded ? (
              <MdCheck aria-hidden="true" />
            ) : (
              <MdAdd aria-hidden="true" />
            )}
            {wasAdded
              ? "Added to canvas"
              : isPattern
                ? "Add components"
                : "Add to canvas"}
          </button>
        )}
      </div>
    </article>
  );
};

export default SuggestionCard;
