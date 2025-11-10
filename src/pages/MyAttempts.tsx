import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { AuthModal } from "../components/AuthModal";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import SEO from "../components/SEO";
import { apiService } from "../services/api";

interface ProblemAttempt {
  id: string;
  userId: string;
  problemId: string;
  title: string;
  difficulty?: string;
  category?: string;
  nodes: unknown[];
  edges: unknown[];
  elapsedTime: number;
  lastAssessment?: {
    score: number;
    isValid: boolean;
    feedback: unknown[];
  };
  assessmentCount: number;
  createdAt: string;
  updatedAt: string;
  lastAttemptedAt: string;
}

const MyAttempts: React.FC = () => {
  useTheme();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<ProblemAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "difficulty" | "score">(
    "recent"
  );
  const [filterBy, setFilterBy] = useState<"all" | "assessed" | "inprogress">(
    "all"
  );
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [attemptToDelete, setAttemptToDelete] = useState<ProblemAttempt | null>(
    null
  );
  const {
    user,
    isAuthenticated: isAuth,
    login,
    signup,
    googleLogin,
    logout,
  } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuth) {
      navigate("/");
    }
  }, [isAuth, navigate]);

  // Load attempts
  useEffect(() => {
    const loadAttempts = async () => {
      if (!isAuth) {
        setAttempts([]);
        return;
      }
      setLoadingAttempts(true);
      try {
        const userAttempts =
          (await apiService.getUserAttempts()) as ProblemAttempt[];
        setAttempts(userAttempts);
      } catch (error) {
        console.error("Failed to load attempts:", error);
      } finally {
        setLoadingAttempts(false);
      }
    };
    loadAttempts();
  }, [isAuth]);

  const handleOpenAttempt = (problemId: string) => {
    navigate(`/playground/${problemId}`);
  };

  const handleDeleteAttempt = async (
    attempt: ProblemAttempt,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setAttemptToDelete(attempt);
    setShowDeleteDialog(true);
  };

  const confirmDeleteAttempt = async () => {
    if (!attemptToDelete) return;

    try {
      await apiService.deleteAttempt(attemptToDelete.id);
      setAttempts((prev) => prev.filter((a) => a.id !== attemptToDelete.id));
      setShowDeleteDialog(false);
      setAttemptToDelete(null);
    } catch (error) {
      console.error("Failed to delete attempt:", error);
      alert("Failed to delete attempt. Please try again.");
    }
  };

  const cancelDeleteAttempt = () => {
    setShowDeleteDialog(false);
    setAttemptToDelete(null);
  };

  // Format elapsed time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Filter and sort attempts
  const filteredAttempts = attempts
    .filter((attempt) => {
      // Filter by assessment status
      if (filterBy === "assessed" && !attempt.lastAssessment) return false;
      if (filterBy === "inprogress" && attempt.lastAssessment) return false;

      // Filter by search term
      const searchLower = searchTerm.toLowerCase();
      return (
        attempt.title.toLowerCase().includes(searchLower) ||
        attempt.category?.toLowerCase().includes(searchLower) ||
        attempt.difficulty?.toLowerCase().includes(searchLower) ||
        false
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "difficulty": {
          const difficultyOrder: Record<string, number> = {
            easy: 1,
            medium: 2,
            hard: 3,
            "very hard": 4,
          };
          return (
            difficultyOrder[a.difficulty?.toLowerCase() || "medium"] -
            difficultyOrder[b.difficulty?.toLowerCase() || "medium"]
          );
        }
        case "score": {
          const scoreA = a.lastAssessment?.score || 0;
          const scoreB = b.lastAssessment?.score || 0;
          return scoreB - scoreA;
        }
        case "recent":
        default:
          return (
            new Date(b.lastAttemptedAt).getTime() -
            new Date(a.lastAttemptedAt).getTime()
          );
      }
    });

  // Count attempts
  const assessedCount = attempts.filter((a) => a.lastAssessment).length;
  const inProgressCount = attempts.filter((a) => !a.lastAssessment).length;

  return (
    <>
      <SEO
        title="My Attempts | Diagrammatic"
        description="View your attempted system design problems and track your progress"
        url="https://satya00089.github.io/diagrammatic/#/attempts"
      />
      <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] via-[var(--bg)] to-[var(--surface)] text-theme relative grid-pattern-overlay">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex items-center space-x-3 group cursor-pointer"
              >
                <img
                  src="./logo.png"
                  alt="Logo"
                  className="h-10 transition-transform group-hover:scale-110 duration-300"
                />
                <span className="text-xl font-bold text-white">
                  Diagrammatic
                </span>
              </button>
              <div className="flex items-center gap-4">
                {isAuth && (
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
                  {loadingAttempts
                    ? "Loading..."
                    : `${attempts.length} attempt${attempts.length === 1 ? "" : "s"}`}
                </div>

                <ThemeSwitcher />

                {/* Authentication UI */}
                <div className="relative">
                  {isAuth ? (
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
                            <button
                              type="button"
                              onClick={() => {
                                setShowUserMenu(false);
                                logout();
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                            >
                              Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      className="px-4 py-2 bg-white/20 text-white text-sm font-medium rounded-md hover:bg-white/30 transition-all cursor-pointer"
                    >
                      Sign In
                    </button>
                  )}
                </div>
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
                My Attempts
              </h1>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                Track your progress and continue working on system design
                problems
              </p>
            </div>

            {/* Filters */}
            {!loadingAttempts && (
              <>
                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 justify-center flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFilterBy("all")}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                      filterBy === "all"
                        ? "bg-gradient-to-r from-[var(--brand)] to-[#BD6CD5] text-white shadow-lg"
                        : "bg-[var(--surface)] text-muted hover:bg-[var(--theme)]/5 border border-[var(--theme)]/10"
                    }`}
                  >
                    All Attempts ({attempts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterBy("assessed")}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                      filterBy === "assessed"
                        ? "bg-gradient-to-r from-[var(--brand)] to-[#BD6CD5] text-white shadow-lg"
                        : "bg-[var(--surface)] text-muted hover:bg-[var(--theme)]/5 border border-[var(--theme)]/10"
                    }`}
                  >
                    Assessed ({assessedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterBy("inprogress")}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                      filterBy === "inprogress"
                        ? "bg-gradient-to-r from-[var(--brand)] to-[#BD6CD5] text-white shadow-lg"
                        : "bg-[var(--surface)] text-muted hover:bg-[var(--theme)]/5 border border-[var(--theme)]/10"
                    }`}
                  >
                    In Progress ({inProgressCount})
                  </button>
                </div>

                <div className="elevated-card-bg backdrop-blur-md rounded-2xl shadow-lg p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Search */}
                    <div>
                      <label
                        htmlFor="search-input"
                        className="block text-sm font-semibold text-theme mb-2"
                      >
                        🔍 Search
                      </label>
                      <input
                        id="search-input"
                        type="text"
                        placeholder="Search problems..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-[var(--theme)]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent bg-[var(--surface)] text-theme transition-all duration-300 hover:border-[var(--brand)]/30"
                      />
                    </div>

                    {/* Sort */}
                    <div>
                      <label
                        htmlFor="sort-select"
                        className="block text-sm font-semibold text-theme mb-2"
                      >
                        📊 Sort By
                      </label>
                      <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(
                            e.target.value as "recent" | "difficulty" | "score"
                          )
                        }
                        className="w-full px-4 py-3 border-2 border-[var(--theme)]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent bg-[var(--surface)] text-theme appearance-none cursor-pointer transition-all duration-300 hover:border-[var(--brand)]/30"
                      >
                        <option value="recent">Recently Attempted</option>
                        <option value="difficulty">Difficulty</option>
                        <option value="score">Assessment Score</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {loadingAttempts && (
                  <div className="text-center py-20">
                    <div className="inline-block w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-theme text-xl mb-2">
                      Loading attempts...
                    </div>
                    <div className="text-muted text-sm">
                      Please wait while we fetch your problem attempts
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!loadingAttempts && filteredAttempts.length === 0 && (
                  <div className="text-center py-20">
                    <div className="text-7xl mb-6">
                      {searchTerm
                        ? "🔍"
                        : filterBy === "assessed"
                          ? "📊"
                          : "🎯"}
                    </div>
                    <div className="text-theme text-2xl font-bold mb-2">
                      {searchTerm
                        ? "No attempts found"
                        : filterBy === "assessed"
                          ? "No assessed problems yet"
                          : filterBy === "inprogress"
                            ? "No problems in progress"
                            : "No attempts yet"}
                    </div>
                    <div className="text-muted text-lg mb-6">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Start solving system design problems to see your progress here"}
                    </div>
                    {!searchTerm && (
                      <button
                        type="button"
                        onClick={() => navigate("/problems")}
                        className="px-6 py-3 bg-gradient-to-r from-[var(--brand)] to-[#BD6CD5] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
                      >
                        Browse Problems →
                      </button>
                    )}
                  </div>
                )}

                {/* Attempts Grid */}
                {!loadingAttempts && filteredAttempts.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    {filteredAttempts.map((attempt, index) => (
                      <div
                        key={attempt.id}
                        className={`group elevated-card-bg backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden ${
                          index === 0
                            ? "delay-0"
                            : index === 1
                              ? "delay-100"
                              : index === 2
                                ? "delay-200"
                                : ""
                        }`}
                      >
                        {/* Gradient glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--brand)] to-[#BD6CD5] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />

                        <div className="relative p-6">
                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteAttempt(attempt, e)}
                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-lg z-10"
                            title="Delete attempt"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-red-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>

                          <div
                            className="cursor-pointer"
                            onClick={() => handleOpenAttempt(attempt.problemId)}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 pr-8">
                                <h3 className="text-lg font-bold text-theme group-hover:text-[var(--brand)] transition-colors duration-300 line-clamp-2 mb-2">
                                  {attempt.title}
                                </h3>

                                {/* Difficulty and Category */}
                                <div className="flex items-center gap-2 flex-wrap mb-3">
                                  {attempt.difficulty && (
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        attempt.difficulty.toLowerCase() ===
                                        "easy"
                                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                          : attempt.difficulty.toLowerCase() ===
                                              "medium"
                                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                      }`}
                                    >
                                      {attempt.difficulty}
                                    </span>
                                  )}
                                  {attempt.category && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                      {attempt.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-3xl">🎯</div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-3 mb-4 pb-4 border-b border-[var(--theme)]/10">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted flex items-center gap-1">
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
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  Time spent
                                </span>
                                <span className="font-semibold text-theme">
                                  {formatTime(attempt.elapsedTime)}
                                </span>
                              </div>

                              {attempt.lastAssessment && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted flex items-center gap-1">
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
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    Assessment score
                                  </span>
                                  <span
                                    className={`font-bold ${
                                      attempt.lastAssessment.score >= 80
                                        ? "text-green-600 dark:text-green-400"
                                        : attempt.lastAssessment.score >= 60
                                          ? "text-yellow-600 dark:text-yellow-400"
                                          : "text-red-600 dark:text-red-400"
                                    }`}
                                  >
                                    {attempt.lastAssessment.score}/100
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted flex items-center gap-1">
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
                                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                                    />
                                  </svg>
                                  Components
                                </span>
                                <span className="font-semibold text-theme">
                                  {attempt.nodes.length}
                                </span>
                              </div>

                              {attempt.assessmentCount > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted">
                                    Assessments run
                                  </span>
                                  <span className="font-semibold text-theme">
                                    {attempt.assessmentCount}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted mb-6">
                              <span>
                                Last worked{" "}
                                {new Date(
                                  attempt.lastAttemptedAt
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span>
                                Started{" "}
                                {new Date(attempt.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAttempt(attempt.problemId);
                              }}
                              className="w-full px-6 py-3 bg-gradient-to-r from-[var(--brand)] to-[#BD6CD5] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group-hover:shadow-xl"
                            >
                              Continue Working →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
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

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && attemptToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface)] rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-[var(--theme)]/10">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--theme)]">
                  Delete Attempt?
                </h3>
                <p className="text-sm text-muted">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-muted mb-6">
              Are you sure you want to delete your attempt for{" "}
              <strong>"{attemptToDelete.title}"</strong>? This will permanently
              remove your progress and assessment data.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={cancelDeleteAttempt}
                className="flex-1 px-4 py-2 bg-[var(--theme)]/5 hover:bg-[var(--theme)]/10 text-[var(--theme)] font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAttempt}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                Delete Attempt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyAttempts;
