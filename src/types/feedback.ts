export type FeedbackSource = "global" | "assessment";

export type FeedbackCategory =
  | "bug"
  | "feature_request"
  | "usability"
  | "content"
  | "assessment"
  | "other";

export type FeedbackReason =
  | "inaccurate"
  | "too_generic"
  | "not_actionable"
  | "missing_context"
  | "hard_to_understand"
  | "other";

export interface FeedbackContext {
  problemId?: string;
  assessmentId?: string;
  diagramId?: string;
  lessonId?: string;
}

export interface FeedbackLaunchOptions {
  source?: FeedbackSource;
  category?: FeedbackCategory;
  helpful?: boolean;
  context?: FeedbackContext;
}

export interface FeedbackSubmission {
  source: FeedbackSource;
  category: FeedbackCategory;
  rating?: number;
  helpful?: boolean;
  reasons: FeedbackReason[];
  /** Tiptap-generated HTML; empty when feedback is rating-only. */
  message: string;
  contactEmail?: string;
  route?: string;
  appVersion?: string;
  context: FeedbackContext;
}

export interface FeedbackResponse {
  id: string;
  createdAt: string;
  message: string;
}
