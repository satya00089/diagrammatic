import React from "react";
import { MdFeedback } from "react-icons/md";
import { useFeedback } from "../contexts/FeedbackContext";

const FeedbackLauncher: React.FC = () => {
  const { openFeedback } = useFeedback();

  return (
    <button
      type="button"
      onClick={() => openFeedback()}
      className="fixed bottom-4 left-4 z-[60] inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm font-semibold text-theme shadow-[0_8px_24px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
      aria-label="Give feedback"
      data-analytics="feedback:feedback_launcher_clicked"
    >
      <MdFeedback className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Feedback</span>
    </button>
  );
};

export default FeedbackLauncher;
