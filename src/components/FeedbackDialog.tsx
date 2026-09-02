import React, { useEffect, useMemo, useRef, useState } from "react";
import { MdClose, MdSend, MdStar, MdStarBorder } from "react-icons/md";
import { useAuth } from "../hooks/useAuth";
import TiptapAnswerEditor from "./TiptapAnswerEditor";
import type {
  FeedbackCategory,
  FeedbackLaunchOptions,
  FeedbackReason,
  FeedbackSubmission,
} from "../types/feedback";

interface FeedbackDialogProps {
  initialOptions: FeedbackLaunchOptions;
  onClose: () => void;
  onSubmit: (submission: FeedbackSubmission) => Promise<void>;
}

const CATEGORY_OPTIONS: Array<{ value: FeedbackCategory; label: string }> = [
  { value: "bug", label: "Report a bug" },
  { value: "feature_request", label: "Suggest an improvement" },
  { value: "usability", label: "Something was confusing" },
  { value: "content", label: "Content or problem issue" },
  { value: "other", label: "Something else" },
];

const REASON_OPTIONS: Array<{ value: FeedbackReason; label: string }> = [
  { value: "inaccurate", label: "It felt inaccurate" },
  { value: "too_generic", label: "It was too generic" },
  { value: "not_actionable", label: "It was not actionable" },
  { value: "missing_context", label: "It missed important context" },
  { value: "hard_to_understand", label: "It was hard to understand" },
];

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  initialOptions,
  onClose,
  onSubmit,
}) => {
  const { user } = useAuth();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [category, setCategory] = useState<FeedbackCategory>(
    initialOptions.category ??
      (initialOptions.source === "assessment" ? "assessment" : "other"),
  );
  const [rating, setRating] = useState<number | undefined>();
  const [hoveredRating, setHoveredRating] = useState<number | undefined>();
  const [message, setMessage] = useState("");
  const [messageText, setMessageText] = useState("");
  const [reasons, setReasons] = useState<FeedbackReason[]>([]);
  const [contactEmail, setContactEmail] = useState(user?.email ?? "");
  const [requestContact, setRequestContact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const source = initialOptions.source ?? "global";
  const isAssessment = source === "assessment";
  const title = isAssessment
    ? "Help us improve this review"
    : "Help us improve Diagrammatic";
  const description = isAssessment
    ? "Tell us what would make the architecture review more useful."
    : "Your feedback helps us make the design and learning experience better.";

  const canSubmit = useMemo(
    () =>
      isAssessment || messageText.trim().length >= 5 || rating !== undefined,
    [isAssessment, messageText, rating],
  );

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>(
          'button, select, textarea, input, [contenteditable="true"]',
        )
        ?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      previousFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled]), [contenteditable="true"]:not([aria-disabled="true"])',
        ),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  const toggleReason = (reason: FeedbackReason) => {
    setReasons((current) =>
      current.includes(reason)
        ? current.filter((item) => item !== reason)
        : [...current, reason],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        source,
        category,
        rating,
        helpful: initialOptions.helpful,
        reasons,
        message: messageText.trim() ? message : "",
        contactEmail: requestContact ? contactEmail.trim() : undefined,
        context: initialOptions.context ?? {},
      });
      setSubmitted(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Feedback could not be sent. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-3 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
        aria-describedby="feedback-dialog-description"
        tabIndex={-1}
        className="max-h-[min(700px,calc(100vh-1.5rem))] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-theme shadow-2xl sm:max-h-[calc(100vh-3rem)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 id="feedback-dialog-title" className="text-xl font-bold">
              {submitted ? "Thank you" : title}
            </h2>
            <p
              id="feedback-dialog-description"
              className="mt-1 text-sm leading-relaxed text-muted"
            >
              {submitted ? "Your feedback was received." : description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-[var(--bg-hover)] hover:text-theme focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close feedback dialog"
          >
            <MdClose className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {submitted ? (
          <div className="px-5 py-8 sm:px-6">
            <p className="text-sm leading-relaxed text-muted">
              We’ll use this to improve the experience over time. No further
              action is needed.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4 sm:space-y-5 sm:px-6 sm:py-6">
            {!isAssessment && (
              <label className="block text-sm font-semibold">
                What would you like to tell us?
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-3 font-normal text-theme outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <fieldset>
              <legend className="text-sm font-semibold">How was your experience?</legend>
              <div
                className="mt-2 flex items-center gap-1"
                role="radiogroup"
                aria-label="Star rating"
              >
                {[1, 2, 3, 4, 5].map((value) => {
                  const displayRating = hoveredRating ?? rating;
                  const isFilled = displayRating !== undefined && value <= displayRating;

                  return (
                    <label
                      key={value}
                      htmlFor={`feedback-rating-${value}`}
                      title={`${value} star${value === 1 ? "" : "s"}`}
                      onMouseEnter={() => setHoveredRating(value)}
                      onMouseLeave={() => setHoveredRating(undefined)}
                      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-amber-400 transition hover:bg-amber-500/10 focus-within:bg-amber-500/10 focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--brand)]"
                    >
                      <input
                        id={`feedback-rating-${value}`}
                        type="radio"
                        name="feedback-rating"
                        value={value}
                        checked={rating === value}
                        onChange={() => setRating(value)}
                        className="sr-only"
                        aria-label={`${value} star${value === 1 ? "" : "s"}`}
                      />
                      {isFilled ? (
                        <MdStar className="pointer-events-none h-7 w-7" aria-hidden="true" />
                      ) : (
                        <MdStarBorder className="pointer-events-none h-7 w-7 text-muted" aria-hidden="true" />
                      )}
                    </label>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-muted">
                {rating ? "Rating selected" : "Select a rating"}
              </p>
            </fieldset>

            {isAssessment && (
              <fieldset>
                <legend className="text-sm font-semibold">What could be better?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {REASON_OPTIONS.map((option) => {
                    const selected = reasons.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleReason(option.value)}
                        aria-pressed={selected}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] ${selected ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)]" : "border-[var(--border)] text-muted hover:border-[var(--brand)] hover:text-theme"}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div className="block text-sm font-semibold">
              <span>{isAssessment ? "Anything else?" : "Tell us more"}</span>
              <TiptapAnswerEditor
                id="feedback-description"
                value={message}
                contentFormat="html"
                ariaLabel="Feedback description"
                maxLength={4000}
                disabled={isSubmitting}
                placeholder={
                  isAssessment
                    ? "What should the review explain, catch, or prioritize differently?"
                    : "What happened, or what would make this better?"
                }
                onChange={setMessageText}
                onHtmlChange={(html) => setMessage(html)}
              />
              <span className="mt-1 block text-right text-xs font-normal text-muted">
                {messageText.length}/4000
              </span>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2.5 sm:p-3">
              <label className="flex items-start gap-2 text-sm text-theme">
                <input
                  type="checkbox"
                  checked={requestContact}
                  onChange={(event) => setRequestContact(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--border)] accent-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]"
                />
                <span>
                  You may contact me about this feedback
                  <span className="mt-0.5 block text-xs text-muted">
                    Optional. We only use your email for this follow-up.
                  </span>
                </span>
              </label>
              {requestContact && (
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-2.5 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-theme outline-none transition placeholder:text-muted focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 sm:mt-3"
                  aria-label="Email address for feedback follow-up"
                />
              )}
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MdSend className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "Sending…" : "Send feedback"}
            </button>
            <p className="text-center text-xs text-muted">
              Please avoid including passwords, secrets, or private customer data.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackDialog;
