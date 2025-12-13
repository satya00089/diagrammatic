import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  MdBook,
  MdChevronLeft,
  MdChevronRight,
  MdCheckCircle,
  MdAccessTime,
  MdArrowBack,
  MdDashboard,
} from "react-icons/md";
import type {
  LearningModule as LearningModuleType,
  Lesson,
  UserProgress,
} from "../types/learning";
import { InteractiveSection } from "../components/InteractiveSection";
import { useAuth } from "../hooks/useAuth";

const LearningModule: React.FC = () => {
  const { moduleId, lessonSlug } = useParams<{
    moduleId: string;
    lessonSlug: string;
  }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [modules, setModules] = useState<LearningModuleType[]>([]);
  const [currentModule, setCurrentModule] =
    useState<LearningModuleType | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonContent, setLessonContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [showInteractive, setShowInteractive] = useState(false);

  // Load module index
  useEffect(() => {
    const loadModules = async () => {
      try {
        const response = await fetch("/learning-content/module-index.json");
        const data = await response.json();
        setModules(data.modules);
      } catch (error) {
        console.error("Failed to load modules:", error);
      }
    };
    loadModules();
  }, []);

  // Find current module and lesson
  useEffect(() => {
    if (modules.length === 0 || !moduleId) return;

    const module = modules.find((m) => m.id === moduleId);
    if (!module) {
      setLoading(false);
      return;
    }

    setCurrentModule(module);

    if (lessonSlug) {
      const lesson = module.lessons.find((l) => l.slug === lessonSlug);
      setCurrentLesson(lesson || module.lessons[0]);
    } else {
      // Default to first lesson
      setCurrentLesson(module.lessons[0]);
      navigate(`/learn/${moduleId}/${module.lessons[0].slug}`, {
        replace: true,
      });
    }

    setLoading(false);
  }, [modules, moduleId, lessonSlug, navigate]);

  // Load lesson content
  useEffect(() => {
    if (!currentLesson) return;

    const loadContent = async () => {
      try {
        const response = await fetch(currentLesson.contentUrl);
        const text = await response.text();
        setLessonContent(text);
      } catch (error) {
        console.error("Failed to load lesson content:", error);
        setLessonContent("# Error\n\nFailed to load lesson content.");
      }
    };

    loadContent();
  }, [currentLesson]);

  // Load user progress
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const loadProgress = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/learning/progress/${user.id}`,
        );
        if (response.ok) {
          const data = await response.json();
          setProgress(data);
        }
      } catch (error) {
        console.error("Failed to load progress:", error);
      }
    };

    loadProgress();
  }, [isAuthenticated, user]);

  const isLessonCompleted = (lessonId: string) => {
    return progress.some((p) => p.lessonId === lessonId && p.completed);
  };

  const markLessonComplete = async () => {
    if (!isAuthenticated || !user || !currentLesson || !currentModule) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/learning/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            moduleId: currentModule.id,
            lessonId: currentLesson.id,
            completed: true,
          }),
        },
      );

      if (response.ok) {
        setProgress((prev) => [
          ...prev.filter((p) => p.lessonId !== currentLesson.id),
          {
            userId: user.id,
            moduleId: currentModule.id,
            lessonId: currentLesson.id,
            completed: true,
            completedAt: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to mark lesson complete:", error);
    }
  };

  const goToNextLesson = () => {
    if (!currentModule || !currentLesson) return;

    const currentIndex = currentModule.lessons.findIndex(
      (l) => l.id === currentLesson.id,
    );
    if (currentIndex < currentModule.lessons.length - 1) {
      const nextLesson = currentModule.lessons[currentIndex + 1];
      navigate(`/learn/${currentModule.id}/${nextLesson.slug}`);
    }
  };

  const goToPreviousLesson = () => {
    if (!currentModule || !currentLesson) return;

    const currentIndex = currentModule.lessons.findIndex(
      (l) => l.id === currentLesson.id,
    );
    if (currentIndex > 0) {
      const prevLesson = currentModule.lessons[currentIndex - 1];
      navigate(`/learn/${currentModule.id}/${prevLesson.slug}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!currentModule || !currentLesson) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <MdBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Module Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The requested learning module could not be found.
          </p>
          <Link
            to="/learn"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to Learning Modules
          </Link>
        </div>
      </div>
    );
  }

  const currentLessonIndex = currentModule.lessons.findIndex(
    (l) => l.id === currentLesson.id,
  );
  const progressPercentage =
    ((currentLessonIndex + 1) / currentModule.lessons.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/learn"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdArrowBack className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {currentModule.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentLesson.title}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <MdAccessTime className="w-4 h-4 mr-1" />
                {currentLesson.estimatedTime}
              </span>
              {currentLesson.type === "interactive" && (
                <button
                  onClick={() => setShowInteractive(!showInteractive)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <MdDashboard className="w-4 h-4" />
                  <span>{showInteractive ? "Hide" : "Show"} Canvas</span>
                </button>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Module Navigation */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-80px)] p-4">
          <nav>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Lessons
            </h3>
            <ul className="space-y-1">
              {currentModule.lessons.map((lesson, index) => (
                <li key={lesson.id}>
                  <Link
                    to={`/learn/${currentModule.id}/${lesson.slug}`}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      lesson.id === currentLesson.id
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium bg-gray-200 dark:bg-gray-700 rounded-full">
                      {isLessonCompleted(lesson.id) ? (
                        <MdCheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="text-sm truncate">{lesson.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 ${showInteractive ? "max-w-2xl" : "max-w-4xl"} mx-auto px-8 py-8`}
        >
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code: ({ inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {lessonContent}
            </ReactMarkdown>
          </article>

          {/* Interactive Section */}
          {currentLesson.type === "interactive" &&
            currentLesson.interactiveConfig && (
              <div className="mt-8">
                <InteractiveSection config={currentLesson.interactiveConfig} />
              </div>
            )}

          {/* Navigation Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousLesson}
                disabled={currentLessonIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <MdChevronLeft className="w-5 h-5" />
                <span>Previous</span>
              </button>

              {isAuthenticated && !isLessonCompleted(currentLesson.id) && (
                <button
                  onClick={markLessonComplete}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <MdCheckCircle className="w-5 h-5" />
                  <span>Mark Complete</span>
                </button>
              )}

              <button
                onClick={goToNextLesson}
                disabled={
                  currentLessonIndex === currentModule.lessons.length - 1
                }
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <MdChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>

        {/* Interactive Canvas Panel */}
        {showInteractive && currentLesson.interactiveConfig && (
          <aside className="w-1/2 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
            <div className="h-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Interactive Canvas
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg h-[calc(100vh-180px)]">
                {/* Interactive playground will be embedded here */}
                <div className="h-full flex items-center justify-center text-gray-500">
                  Interactive canvas will be integrated here
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default LearningModule;
