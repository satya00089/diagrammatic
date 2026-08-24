import React from "react";
import {
  MdArrowForward,
  MdCheckCircle,
  MdRecordVoiceOver,
  MdRefresh,
  MdSkipNext,
} from "react-icons/md";
import type {
  InterviewResponse,
  InterviewSession,
} from "../types/systemDesign";
import TiptapAnswerEditor from "./TiptapAnswerEditor";

type InterviewPanelProps = {
  questions: string[];
  session: InterviewSession;
  answer: string;
  response: InterviewResponse | null;
  isSubmitting: boolean;
  error: string | null;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  onSkip: () => void;
  onRetry: () => void;
};

const InterviewPanel: React.FC<InterviewPanelProps> = ({
  questions,
  session,
  answer,
  response,
  isSubmitting,
  error,
  onAnswerChange,
  onSubmit,
  onNext,
  onSkip,
  onRetry,
}) => {
  const currentQuestion = questions[session.currentQuestionIndex];
  const isLastQuestion = session.currentQuestionIndex >= questions.length - 1;

  if (!currentQuestion) {
    return (
      <div className="flex h-full min-h-52 flex-col items-center justify-center px-4 text-center">
        <MdCheckCircle className="mb-3 h-10 w-10 text-green-500" aria-hidden />
        <h3 className="text-base font-semibold text-theme">
          Interview queue complete
        </h3>
        <p className="mt-1 max-w-[28ch] text-xs leading-relaxed text-muted">
          Run another assessment after changing the design to generate a fresh
          set of architecture-specific questions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)]/10 text-[var(--brand)]">
              <MdRecordVoiceOver className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-theme">
                Interview mode
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Defend one decision at a time against the current review
                context.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--brand)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--brand)]">
            {session.currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-theme/10"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-[var(--brand)] transition-[width] duration-200"
            style={{
              width: `${((session.currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <section className="rounded-xl border border-[var(--brand)]/25 bg-[var(--brand)]/5 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--brand)]">
          Interview question
        </p>
        <p className="mt-2 text-sm font-medium leading-relaxed text-theme">
          {currentQuestion}
        </p>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/35 bg-red-500/8 px-3 py-2 text-xs leading-relaxed text-theme"
        >
          <div>{error}</div>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 font-semibold text-[var(--brand)] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/60"
          >
            Try again
          </button>
        </div>
      )}

      {!response ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="space-y-3"
        >
          <label
            htmlFor="interview-answer"
            className="block text-xs font-semibold text-theme"
          >
            Your answer
          </label>
          <TiptapAnswerEditor
            id="interview-answer"
            value={answer}
            onChange={onAnswerChange}
            placeholder="Explain the decision, the failure mode you considered, and the trade-off you accepted."
            disabled={isSubmitting}
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onSkip}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-muted transition-colors hover:bg-[var(--bg-hover)] hover:text-theme focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MdSkipNext className="h-4 w-4" aria-hidden />
              Not sure? Skip question
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !answer.trim()}
              className="flex items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <MdRefresh className="h-4 w-4 animate-spin" aria-hidden />
                  Reviewing answer...
                </>
              ) : (
                <>
                  Submit answer{" "}
                  <MdArrowForward className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <section
          className="space-y-3"
          aria-labelledby="interview-critique-title"
        >
          <div>
            <h4
              id="interview-critique-title"
              className="text-xs font-bold uppercase tracking-[0.12em] text-muted"
            >
              Interviewer critique
            </h4>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-theme">
              {response.critique}
            </p>
          </div>

          {response.strengths.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-green-500">
                What worked
              </h5>
              <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-theme">
                {response.strengths.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-green-500" aria-hidden>
                      OK
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {response.gaps.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-amber-500">
                Explore next
              </h5>
              <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-theme">
                {response.gaps.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-amber-500" aria-hidden>
                      -
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="button"
            onClick={onNext}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-theme px-3 py-2.5 text-xs font-semibold text-theme transition-colors hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/60"
          >
            {isLastQuestion && !response.nextQuestion
              ? "Finish interview"
              : "Continue interview"}
            <MdArrowForward className="h-4 w-4" aria-hidden />
          </button>
        </section>
      )}
    </div>
  );
};

export default InterviewPanel;
