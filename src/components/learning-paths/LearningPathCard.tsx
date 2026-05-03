import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MdCheckCircle } from "react-icons/md";
import type { LearningPath } from "../../services/contentLoader";
import { useLearningProgress } from "../../hooks/useLearningProgress";
import { AuthModal } from "../AuthModal";
import { useAuth } from "../../hooks/useAuth";

type Props = {
  path: LearningPath;
  /** Optional: if provided, parent controls whether the user is authenticated */
  isAuthenticated?: boolean;
  /** Optional: parent callback to open auth modal; if provided it will be used for gating links */
  onRequireAuth?: () => void;
};

const LearningPathCard: React.FC<Props> = ({ path, isAuthenticated: isAuthProp, onRequireAuth }) => {
  const totalLessons = path.modules.reduce(
    (acc, m) => acc + (m.lessons?.length || 0),
    0,
  );
  const { isCompleted } = useLearningProgress(path.id);
  const authCtx = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // pick up to first 2 lessons across modules for a quick preview
  const previewLessons: {
    moduleId: string;
    lessonId: string;
    title: string;
  }[] = [];
  for (const m of path.modules) {
    for (const l of m.lessons || []) {
      if (previewLessons.length >= 2) break;
      previewLessons.push({ moduleId: m.id, lessonId: l.id, title: l.title });
    }
    if (previewLessons.length >= 2) break;
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      case "Very Hard":
        return "bg-orange-200 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isAuthenticated = typeof isAuthProp === "boolean" ? isAuthProp : authCtx.isAuthenticated;

  return (
    <div className="group relative rounded-xl border border-theme/8 p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 elevated-card-bg">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getDifficultyColor(path.difficulty ?? "Beginner")}`}>
            {path.difficulty || "Beginner"}
          </div>
          <div className="text-xs px-2 py-1 bg-surface rounded text-muted hover:brightness-105 transition-colors">
            {totalLessons} lesson{totalLessons === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 mt-2">
        <div>
          <h3 className="text-xl font-semibold">
            <Link
              to={`/learning-paths/${path.slug}`}
              className="text-[var(--brand)] hover:underline"
              onClick={(e) => {
                if (!isAuthenticated) {
                  e.preventDefault();
                  if (onRequireAuth) {
                    onRequireAuth();
                  } else {
                    setShowAuthModal(true);
                  }
                }
              }}
            >
              {path.title}
            </Link>
          </h3>
          <p className="text-sm text-muted mt-2">{path.summary}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {path.tags?.slice(0, 4).map((t) => (
            <div
              key={t}
              className="text-xs px-2 py-1 bg-surface rounded text-muted capitalize hover:brightness-105 transition-colors"
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      {previewLessons.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-muted mb-2">Preview lessons</div>
          <div className="flex gap-2">
            {previewLessons.map((pl) => (
              <Link
                  key={pl.lessonId}
                  to={`/learning-paths/${path.slug}?module=${encodeURIComponent(pl.moduleId)}`}
                  className="flex-1 min-w-0 p-3 bg-surface rounded-md border border-theme/8 hover:shadow-sm transition-colors flex items-center justify-between"
                  onClick={(e) => {
                    if (!isAuthenticated) {
                      e.preventDefault();
                      if (onRequireAuth) {
                        onRequireAuth();
                      } else {
                        setShowAuthModal(true);
                      }
                    }
                  }}
                >
                <div className="text-sm truncate text-[var(--brand)] hover:underline">{pl.title}</div>
                <div className="ml-3">
                  {isCompleted(pl.lessonId) ? (
                    <MdCheckCircle className="text-emerald-500 h-5 w-5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-200/60" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {path.modules && path.modules.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-muted mb-1">Modules</div>
          <div className="flex flex-wrap gap-2">
            {path.modules.slice(0, 3).map((m) => (
              <Link
                key={m.id}
                to={`/learning-paths/${path.slug}?module=${encodeURIComponent(m.id)}`}
                className="text-xs px-2 py-1 bg-surface rounded text-[var(--brand)] hover:brightness-105 transition-colors"
                onClick={(e) => {
                  if (!isAuthenticated) {
                    e.preventDefault();
                    if (onRequireAuth) onRequireAuth(); else setShowAuthModal(true);
                  }
                }}
              >
                {m.title}
              </Link>
            ))}
            {path.modules.length > 3 && (
              <Link
                to={`/learning-paths/${path.slug}`}
                className="text-xs px-2 py-1 bg-surface rounded text-muted hover:brightness-105"
                onClick={(e) => {
                  if (!isAuthenticated) {
                    e.preventDefault();
                    if (onRequireAuth) onRequireAuth(); else setShowAuthModal(true);
                  }
                }}
              >
                View all
              </Link>
            )}
          </div>
        </div>
      )}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={async (email, password) => authCtx.login({ email, password })}
          onSignup={async (email, password, name) => authCtx.signup({ email, password, name })}
          onGoogleLogin={async (credential) => authCtx.googleLogin(credential)}
        />
      )}
    </div>
  );
};

export default LearningPathCard;
