import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdBook, MdAccessTime, MdFlag, MdLock } from "react-icons/md";
import type { LearningModule } from "../types/learning";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import ThemeSwitcher from "../components/ThemeSwitcher";
import SEO from "../components/SEO";

const LearningDashboard: React.FC = () => {
  useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load modules
        const modulesResponse = await fetch(
          "/learning-content/module-index.json"
        );
        const modulesData = await modulesResponse.json();
        setModules(modulesData.modules);

        // Load user progress if authenticated
        if (isAuthenticated && user) {
          // Learning progress tracking temporarily disabled
        }
      } catch (error) {
        console.error("Failed to load learning data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user]);

  const isModuleLocked = (): boolean => {
    // Temporarily disabled - all modules unlocked
    return false;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const renderModuleAction = (module: LearningModule, locked: boolean) => {
    if (locked) {
      return (
        <div className="text-center">
          <MdLock className="w-8 h-8 text-muted mx-auto mb-1" />
          <p className="text-xs text-muted">Locked</p>
        </div>
      );
    }

    if (module.lessons && module.lessons.length > 0) {
      const lessonSlug = module.lessons[0].slug || module.lessons[0].id;
      return (
        <Link
          to={`/learn/${module.id}/${lessonSlug}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand)] text-white text-sm font-medium rounded-lg hover:bg-[var(--brand)]/90 transition-colors"
        >
          <span>Start</span>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      );
    }

    return <p className="text-xs text-muted">No lessons</p>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] via-[var(--bg)] to-[var(--surface)] flex items-center justify-center grid-pattern-overlay">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-theme text-xl mb-2">Loading learning modules...</p>
          <p className="text-muted text-sm">
            Please wait while we prepare your learning path
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Learn System Design | Diagrammatic"
        description="Master system design from fundamentals to advanced patterns with interactive lessons and hands-on practice"
        keywords="system design learning, architecture tutorials, distributed systems course, scalability patterns"
        url="https://satya00089.github.io/diagrammatic/#/learn"
      />
      <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] via-[var(--bg)] to-[var(--surface)] text-theme relative grid-pattern-overlay">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] transition-all duration-300 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
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
              <div className="flex items-center gap-4">
                {isAuthenticated && (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate("/problems")}
                      className="hidden md:block px-4 py-2 text-sm font-medium text-white hover:text-white/80 transition-colors cursor-pointer"
                    >
                      Problems
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/diagrams")}
                      className="hidden md:block px-4 py-2 text-sm font-medium text-white hover:text-white/80 transition-colors cursor-pointer"
                    >
                      My Designs
                    </button>
                  </>
                )}

                <div className="hidden md:block text-sm text-white/90">
                  {modules.length} learning modules
                </div>

                <ThemeSwitcher />

                {/* Authentication UI */}
                {isAuthenticated && user ? (
                  <div className="relative">
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-[var(--elevated)] backdrop-blur-sm ring-1 ring-black/5 border border-[var(--border)]">
                        <div className="py-1">
                          <div className="px-4 py-3 border-b border-[var(--border)]">
                            <p className="text-sm font-medium text-theme">
                              {user?.name}
                            </p>
                            <p className="text-sm text-muted truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="pt-16 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Learn System Design
              </h1>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                Master system design from fundamentals to advanced patterns with
                interactive lessons
              </p>
            </div>
            {/* Learning Path */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-theme mb-6">
                Learning Path
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {modules.map((module) => {
                  const locked = isModuleLocked();

                  return (
                    <div
                      key={module.id}
                      className={`group bg-[var(--elevated)] backdrop-blur-md hover:bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:border-[var(--brand)]/40 transition-all duration-200 ${
                        locked ? "opacity-60" : ""
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-start gap-4 mb-4">
                              <span className="text-3xl">{module.icon}</span>

                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-theme mb-2">
                                  {module.title}
                                </h3>
                                <div className="flex items-center flex-wrap gap-2">
                                  <span
                                    className={`px-2.5 py-1 text-xs font-medium rounded ${getLevelColor(module.level)}`}
                                  >
                                    {module.level}
                                  </span>
                                  <span className="text-sm text-muted flex items-center gap-1">
                                    <MdAccessTime className="w-4 h-4" />
                                    {module.estimatedTime}
                                  </span>
                                  <span className="text-sm text-muted flex items-center gap-1">
                                    <MdBook className="w-4 h-4" />
                                    {module.lessons.length} lessons
                                  </span>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {renderModuleAction(module, locked)}
                              </div>
                            </div>

                            <p className="text-muted text-sm leading-relaxed">
                              {module.description}
                            </p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mt-4">
                              {module.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs font-medium bg-[var(--surface)] text-muted rounded border border-[var(--border)]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Prerequisites */}
                        {module.prerequisites.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-[var(--border)]">
                            <p className="text-sm text-muted flex items-center gap-2">
                              <MdFlag className="w-4 h-4" />
                              <span>
                                <span className="font-medium">
                                  Prerequisites:
                                </span>{" "}
                                {module.prerequisites
                                  .map(
                                    (id) =>
                                      modules.find((m) => m.id === id)?.title
                                  )
                                  .join(", ")}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LearningDashboard;
