import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdPublic,
  MdBusiness,
  MdPhoneAndroid,
  MdSettings,
} from "react-icons/md";

import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { AuthModal } from "../components/AuthModal";
import SEO from "../components/SEO";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchProblems,
  fetchAttemptedProblems,
  setSelectedDifficulty,
  setSelectedCategory,
  setSelectedDomain,
  setSearchQuery,
} from "../store/slices/problemsSlice";
import {
  selectFilteredProblems,
  selectProblemsLoading,
  selectProblemsError,
  selectCategories,
  selectDomains,
  selectDifficulties,
  selectSelectedDifficulty,
  selectSelectedCategory,
  selectSelectedDomain,
  selectSearchQuery,
  selectAttemptedProblems,
} from "../store/slices/problemsSelectors";

const Dashboard: React.FC = () => {
  useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Local UI state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Redux state
  const filteredProblems = useAppSelector(selectFilteredProblems);
  const loading = useAppSelector(selectProblemsLoading);
  const error = useAppSelector(selectProblemsError);
  const categories = useAppSelector(selectCategories);
  const domains = useAppSelector(selectDomains);
  const difficulties = selectDifficulties();
  const selectedDifficulty = useAppSelector(selectSelectedDifficulty);
  const selectedCategory = useAppSelector(selectSelectedCategory);
  const selectedDomain = useAppSelector(selectSelectedDomain);
  const searchQuery = useAppSelector(selectSearchQuery);
  const attemptedProblems = useAppSelector(selectAttemptedProblems);

  const {
    user,
    isAuthenticated: isAuth,
    login,
    signup,
    googleLogin,
    logout,
  } = useAuth();

  // Fetch problems from API on mount
  useEffect(() => {
    dispatch(fetchProblems());
  }, [dispatch]);

  // Fetch attempted problems when user is authenticated
  useEffect(() => {
    if (isAuth) {
      dispatch(fetchAttemptedProblems());
    }
  }, [isAuth, dispatch]);

  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case "All":
        return <MdPublic className="inline" />;
      case "infra":
        return <MdBusiness className="inline" />;
      case "application":
        return <MdPhoneAndroid className="inline" />;
      default:
        return <MdSettings className="inline" />;
    }
  };

  const getDomainText = (domain: string) => {
    switch (domain) {
      case "All":
        return "All";
      case "infra":
        return "Infrastructure";
      case "application":
        return "Application";
      default:
        return domain;
    }
  };

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

  return (
    <>
      <SEO
        title="System Design Practice Problems | Diagrammatic"
        description="Browse and solve curated system design problems with real-world scenarios. Master distributed systems, scalable architectures, and ace your tech interviews with hands-on practice."
        keywords="system design problems, architecture challenges, distributed systems practice, system design interview prep, scalable architecture exercises"
        url="https://satya00089.github.io/diagrammatic/#/problems"
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
                  src="/logo.png"
                  alt="Logo"
                  className="h-10 transition-transform group-hover:scale-110 duration-300"
                />
                <span className="text-xl font-bold text-white">
                  Diagrammatic
                </span>
              </button>
              <div className="flex items-center gap-4">
                {isAuth && (
                  <button
                    type="button"
                    onClick={() => navigate("/diagrams")}
                    className="hidden md:block px-4 py-2 text-sm font-medium text-white hover:text-white/80 transition-colors cursor-pointer"
                  >
                    My Designs
                  </button>
                )}

                <div className="hidden md:block text-sm text-white/90">
                  {loading
                    ? "Loading..."
                    : `${filteredProblems.length} problems available`}
                </div>

                <ThemeSwitcher />

                {/* Authentication UI */}
                <div className="relative">
                  {isAuth ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 rounded-md transition-colors"
                      >
                        {user?.picture ? (
                          <img
                            src={user.picture}
                            alt={user.name || "User"}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center font-bold">
                            {user?.name?.[0]?.toUpperCase() ||
                              user?.email?.[0]?.toUpperCase() ||
                              "U"}
                          </div>
                        )}
                        <span className="hidden sm:inline">
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

                      {showUserMenu && (
                        <div className="absolute top-full right-0 mt-1 bg-[var(--surface)] shadow-lg rounded-lg border border-theme/10 py-1 z-50 min-w-[180px]">
                          <div className="px-4 py-2 border-b border-theme/10">
                            <p className="text-sm font-medium text-theme">
                              {user?.name || "User"}
                            </p>
                            <p className="text-xs text-muted truncate">
                              {user?.email}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                      className="px-4 py-2 text-sm font-medium bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors"
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
                System Design Problems
              </h1>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                Master system design through interactive problem solving
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-20">
                <div className="inline-block w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-theme text-xl mb-2">
                  Loading problems...
                </div>
                <div className="text-muted text-sm">
                  Please wait while we fetch the latest problems
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="elevated-card-bg backdrop-blur-md rounded-2xl p-8 mb-6 border-2 border-red-500/20 shadow-lg max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <div className="text-theme text-xl font-semibold mb-2">
                    Error Loading Problems
                  </div>
                  <div className="text-muted text-sm mb-6">{error}</div>
                  <button
                    type="button"
                    onClick={() => globalThis.location.reload()}
                    className="px-6 py-3 bg-gradient-to-r from-[var(--brand)] to-[#BD6CD5] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Filters - Only show when not loading and no error */}
            {!loading && !error && (
              <>
                <div className="elevated-card-bg backdrop-blur-md rounded-2xl shadow-lg p-6 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                        value={searchQuery}
                        onChange={(e) =>
                          dispatch(setSearchQuery(e.target.value))
                        }
                        className="w-full px-4 py-3 border-2 border-[var(--theme)]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent bg-[var(--surface)] text-theme transition-all duration-300 hover:border-[var(--brand)]/30"
                      />
                    </div>

                    {/* Difficulty Filter */}
                    <div>
                      <label
                        htmlFor="difficulty-select"
                        className="block text-sm font-semibold text-theme mb-2"
                      >
                        📊 Difficulty
                      </label>
                      <select
                        id="difficulty-select"
                        value={selectedDifficulty}
                        onChange={(e) =>
                          dispatch(setSelectedDifficulty(e.target.value))
                        }
                        className="w-full px-4 py-3 border-2 border-[var(--theme)]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent bg-[var(--surface)] text-theme appearance-none cursor-pointer transition-all duration-300 hover:border-[var(--brand)]/30"
                      >
                        {difficulties.map((difficulty) => (
                          <option key={difficulty} value={difficulty}>
                            {difficulty}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <label
                        htmlFor="category-select"
                        className="block text-sm font-semibold text-theme mb-2"
                      >
                        🏷️ Category
                      </label>
                      <select
                        id="category-select"
                        value={selectedCategory}
                        onChange={(e) =>
                          dispatch(setSelectedCategory(e.target.value))
                        }
                        className="w-full px-4 py-3 border-2 border-[var(--theme)]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent bg-[var(--surface)] text-theme appearance-none cursor-pointer transition-all duration-300 hover:border-[var(--brand)]/30"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Domain Filter - Below the other filters */}
                <div className="mb-4">
                  <div className="text-sm font-semibold text-theme mb-2">
                    🌐 Domain
                  </div>
                  <div className="flex flex-wrap gap-2 p-1 rounded-xl">
                    {domains.map((domain) => (
                      <button
                        key={domain}
                        type="button"
                        onClick={() => dispatch(setSelectedDomain(domain))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedDomain === domain
                            ? "bg-[var(--brand)] text-white shadow-md transform scale-105"
                            : "bg-[var(--bg-hover)] text-theme hover:bg-[var(--brand)]/10 hover:text-[var(--brand)]"
                        }`}
                      >
                        {getDomainIcon(domain)}
                        <span className="hidden sm:inline">
                          {getDomainText(domain)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Problems Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                  {filteredProblems.map((problem, index) => (
                    <div
                      key={problem.id}
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
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-bold text-theme group-hover:text-[var(--brand)] transition-colors duration-300 line-clamp-2 flex-1 pr-2">
                            {problem.title}
                          </h3>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ml-2 flex-shrink-0 ${getDifficultyColor(problem.difficulty)}`}
                          >
                            {problem.difficulty}
                          </span>
                        </div>

                        <p className="text-muted text-sm mb-4 line-clamp-3 leading-relaxed">
                          {problem.description}
                        </p>

                        <div className="flex items-center justify-between text-sm text-muted mb-4 pb-4 border-b border-[var(--theme)]/10">
                          <span className="flex items-center gap-1">
                            <span>🏷️</span> {problem.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <span>⏱️</span> {problem.estimated_time}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                          {problem.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 uppercase bg-[var(--brand)]/10 text-[var(--brand)] text-xs font-semibold rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {problem.tags.length > 3 && (
                            <span className="px-3 py-1 bg-[var(--theme)]/5 text-muted text-xs font-medium rounded-full">
                              +{problem.tags.length - 3} more
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/playground/${problem.id}`);
                          }}
                          aria-label={`Start ${problem.title}`}
                          className={`w-full px-6 py-3 font-semibold rounded-xl transition-all duration-300 cursor-pointer group-hover:shadow-xl ${
                            isAuth && attemptedProblems.has(problem.id)
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:scale-105"
                              : "bg-gradient-to-r from-[var(--brand)] to-[#BD6CD5] text-white hover:shadow-lg hover:scale-105"
                          }`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            {isAuth && attemptedProblems.has(problem.id) && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            )}
                            {isAuth && attemptedProblems.has(problem.id)
                              ? "Continue Problem"
                              : "Start Problem"}{" "}
                            →
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredProblems.length === 0 && !loading && (
                  <div className="text-center py-20">
                    <div className="text-7xl mb-6">🔍</div>
                    <div className="text-theme text-2xl font-bold mb-2">
                      No problems found
                    </div>
                    <div className="text-muted text-lg">
                      Try adjusting your filters or search terms
                    </div>
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
    </>
  );
};

export default Dashboard;
