import React from "react";
import { MdArrowForward, MdOutlineAccountTree } from "react-icons/md";
import { useChatBot } from "../hooks/useChatBot";

export const WelcomeDialog: React.FC = () => {
  const { dismissWelcome } = useChatBot();
  return (
    <div className="assistant-welcome">
      <MdOutlineAccountTree
        className="assistant-welcome__icon"
        aria-hidden="true"
      />
      <h4>A little guidance as you build</h4>
      <p>Add components to your canvas and I’ll suggest what to build next.</p>
      <button
        type="button"
        onClick={dismissWelcome}
        className="assistant-primary"
      >
        Get started <MdArrowForward aria-hidden="true" />
      </button>
    </div>
  );
};
