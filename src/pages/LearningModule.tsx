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
import ThemeSwitcher from "../components/ThemeSwitcher";
import { AuthModal } from "../components/AuthModal";

const LearningModule: React.FC = () => {
  const { moduleId, lessonSlug } = useParams<{
    moduleId: string;
    lessonSlug: string;
  }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, login, signup, googleLogin, logout } = useAuth();

  const [modules, setModules] = useState<LearningModuleType[]>([]);
  const [currentModule, setCurrentModule] =
    useState<LearningModuleType | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonContent, setLessonContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [showInteractive, setShowInteractive] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] via-[var(--bg)] to-[var(--surface)] flex items-center justify-center grid-pattern-overlay relative">
        <div className="absolute inset-0 opacity-[0.03] hero-grid-overlay pointer-events-none" />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-theme">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!currentModule || !currentLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] via-[var(--bg)] to-[var(--surface)] flex items-center justify-center grid-pattern-overlay relative">
        <div className="absolute inset-0 opacity-[0.03] hero-grid-overlay pointer-events-none" />
        <div className="text-center relative z-10">
          <MdBook className="w-16 h-16 text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-theme mb-2">
            Module Not Found
          </h2>
          <p className="text-muted mb-4">
            The requested learning module could not be found.
          </p>
          <Link
            to="/learn"
            className="text-brand hover:opacity-80 transition-opacity"
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
    <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] via-[var(--bg)] to-[var(--surface)] text-theme relative grid-pattern-overlay">
      {/* Grid overlay for design aesthetic */}
      <div className="absolute inset-0 opacity-[0.03] hero-grid-overlay pointer-events-none" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] transition-all duration-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex items-center space-x-3 group cursor-pointer"
              >
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-10 transition-transform group-hover:scale-110 duration-300"
                />
                <span className="text-xl font-bold text-white">
                  Diagrammatic
                </span>
              </button>

              <div className="h-6 w-px bg-white/30"></div>

              <Link
                to="/learn"
                className="text-white hover:text-white/80 transition-colors flex items-center gap-2"
              >
                <MdArrowBack className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Back</span>
              </Link>

              <div className="hidden lg:flex items-center gap-3">
                <span className="text-white font-semibold text-sm">
                  {currentModule.title}
                </span>
                <span className="text-white/50">|</span>
                <span className="text-white/90 text-sm">
                  {currentLesson.title}
                </span>
                <span className="text-white/50">|</span>
                <span className="text-white/80 text-sm flex items-center gap-1">
                  <MdAccessTime className="w-4 h-4" />
                  {currentLesson.estimatedTime}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {currentLesson.type === "interactive" && (
                <button
                  type="button"
                  onClick={() => setShowInteractive(!showInteractive)}
                  className="hidden md:flex px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all items-center gap-2 font-medium cursor-pointer text-sm"
                >
                  <MdDashboard className="w-4 h-4" />
                  <span>{showInteractive ? "Hide" : "Show"} Canvas</span>
                </button>
              )}

              <ThemeSwitcher />

              {/* Authentication UI */}
              <div className="relative">
                {isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      {user?.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name || "User"}
                          className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
                          {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <span className="hidden sm:inline text-sm">
                        {user?.name || user?.email}
                      </span>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            navigate("/diagrams");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          My Designs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all font-medium cursor-pointer text-sm"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="pb-2">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen pt-[72px]">
        {/* Sidebar - Module Navigation */}
        <aside className="fixed left-0 top-[72px] bottom-0 shrink-0 group flex flex-col bg-surface border-r border-theme overflow-y-auto overflow-x-hidden transition-[width] duration-300 ease-in-out z-30 w-56 p-3 pr-0">
          <nav className="pr-3">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
              Lessons
            </h3>
            <ul className="space-y-1">
              {currentModule.lessons.map((lesson, index) => (
                <li key={lesson.id}>
                  <Link
                    to={`/learn/${currentModule.id}/${lesson.slug}`}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      lesson.id === currentLesson.id
                        ? "bg-[var(--brand)]/10 text-brand border border-[var(--brand)]/20"
                        : "text-theme hover:bg-surface"
                    }`}
                  >
                    <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full ${
                      lesson.id === currentLesson.id
                        ? "bg-[var(--brand)] text-white"
                        : isLessonCompleted(lesson.id)
                        ? "bg-green-500 text-white"
                        : "bg-surface text-muted"
                    }`}>
                      {isLessonCompleted(lesson.id) ? (
                        <MdCheckCircle className="w-4 h-4" />
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
        <main className="flex-1 ml-56 px-8 py-8">
          <div className={`${showInteractive ? "max-w-2xl" : "max-w-7xl"} mx-auto`}>
            <div className="elevated-card-bg rounded-xl border border-theme p-8 md:p-12 shadow-lg">
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
                <div className="mt-8 p-6 bg-surface rounded-lg border border-theme">
                  <InteractiveSection config={currentLesson.interactiveConfig} />
                </div>
              )}

            {/* Navigation Footer */}
            <div className="mt-12 pt-8 border-t border-theme">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={goToPreviousLesson}
                  disabled={currentLessonIndex === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-surface text-theme hover:bg-[var(--brand)]/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <MdChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>

                {isAuthenticated && !isLessonCompleted(currentLesson.id) && (
                  <button
                    type="button"
                    onClick={markLessonComplete}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                  >
                    <MdCheckCircle className="w-5 h-5" />
                    <span>Mark Complete</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={goToNextLesson}
                  disabled={
                    currentLessonIndex === currentModule.lessons.length - 1
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-[var(--brand)] text-white rounded-lg hover:bg-[var(--brand)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <MdChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
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

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={async (email, password) => {
            await login({ email, password });
          }}
          onSignup={async (email, password, name) => {
            await signup({ email, password, name });
          }}
          onGoogleLogin={async (credential) => {
            await googleLogin(credential);
          }}
        />
      )}
    </div>
  );
};

export default LearningModule;
