import React from "react";
import { Link } from "react-router-dom";
import { MdCheckCircle } from "react-icons/md";
import type { LearningPath } from "../../services/contentLoader";
import { useLearningProgress } from "../../hooks/useLearningProgress";

type Props = {
  path: LearningPath;
};

const LearningPathCard: React.FC<Props> = ({ path }) => {
  const totalLessons = path.modules.reduce(
    (acc, m) => acc + (m.lessons?.length || 0),
    0,
  );
  const { isCompleted } = useLearningProgress(path.id);

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
        return "learning-path-difficulty learning-path-difficulty--easy";
      case "Medium":
        return "learning-path-difficulty learning-path-difficulty--medium";
      case "Hard":
        return "learning-path-difficulty learning-path-difficulty--hard";
      case "Very Hard":
        return "learning-path-difficulty learning-path-difficulty--very-hard";
      default:
        return "learning-path-difficulty";
    }
  };

  return (
    <div className="learning-path-card group relative min-w-0 rounded-xl p-5 transition-all duration-200">
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border border-transparent ${getDifficultyColor(path.difficulty ?? "Beginner")}`}
          >
            {path.difficulty || "Beginner"}
          </div>
          <div className="text-xs px-2 py-1 rounded border border-theme/10 bg-[var(--bg)] text-theme/90 font-medium transition-colors">
            {totalLessons} lesson{totalLessons === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 mt-2">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold">
            <Link
              to={`/learning-paths/${path.slug}/`}
              className="learning-path-card-title font-semibold hover:underline underline-offset-4 decoration-[1.5px]"
            >
              {path.title}
            </Link>
          </h3>
          <p className="text-sm text-muted mt-2">{path.summary}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="min-w-0 flex flex-wrap gap-2">
          {path.tags?.slice(0, 4).map((t) => (
            <div
              key={t}
              className="learning-path-tag break-words text-xs px-2 py-1 rounded-full font-semibold capitalize transition-colors"
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
                to={`/learning-paths/${path.slug}/?module=${encodeURIComponent(pl.moduleId)}`}
                className="learning-path-preview flex-1 min-w-0 p-3 rounded-md transition-colors flex items-center justify-between"
              >
                <div className="learning-path-preview-title text-sm truncate font-semibold hover:underline underline-offset-4">
                  {pl.title}
                </div>
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
                to={`/learning-paths/${path.slug}/?module=${encodeURIComponent(m.id)}`}
                className="learning-path-tag break-words text-xs px-2 py-1 rounded-full font-semibold transition-colors"
              >
                {m.title}
              </Link>
            ))}
            {path.modules.length > 3 && (
              <Link
                to={`/learning-paths/${path.slug}/`}
                className="text-xs px-2 py-1 rounded-full border border-theme/10 bg-[var(--bg)] text-theme/90 font-medium hover:bg-[var(--bg-hover)]"
              >
                View all
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathCard;
