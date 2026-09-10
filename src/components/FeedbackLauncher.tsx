import React from "react";
import { MdFeedback } from "react-icons/md";
import { useFeedback } from "../contexts/FeedbackContext";
import "../styles/feedback-overrides.css";

const FeedbackLauncher: React.FC = () => {
  const { openFeedback } = useFeedback();

  return (
    <button
      type="button"
      onClick={() => openFeedback()}
      className="feedback-launcher"
      aria-label="Give feedback"
      data-analytics="feedback:feedback_launcher_clicked"
    >
      <MdFeedback className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Feedback</span>
    </button>
  );
};

export default FeedbackLauncher;
