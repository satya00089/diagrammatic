import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MdPublic,
  MdBusiness,
  MdPhoneAndroid,
  MdSettings,
  MdSearch,
  MdTune,
  MdLabel,
  MdAccessTime,
  MdWarningAmber,
  MdSearchOff,
  MdSmartToy,
} from "react-icons/md";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { useOnboarding } from "../hooks/useOnboarding";
import { useTour } from "../hooks/useTour";
import { MdHelpOutline } from "react-icons/md";
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
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { isNewToPage, markPageVisited } = useOnboarding();
  const { startTour } = useTour("dashboard");

  // Mark visited + auto-start tour for new users
  useEffect(() => {
    const isNew = isNewToPage("dashboard");
    markPageVisited("dashboard");
    if (isNew || searchParams.get("tour") === "1") {
      // Slight delay so DOM elements with data-tour attrs are rendered
      const t = setTimeout(() => startTour(), 800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      case "aiml":
        return <MdSmartToy className="inline" />;
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
      case "aiml":
        return "AI & ML";
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
        title="System Design & AI/ML Practice Problems | Diagrammatic"
        description="Master system design, AI/ML architectures, and MLOps with 200+ curated problems. Practice infrastructure design, application architecture, machine learning systems, and AIOps with real-world scenarios and interactive diagrams."
        keywords="system design problems, AI ML design problems, machine learning architecture, MLOps, AIOps, recommendation systems, fraud detection, NLP, computer vision, distributed systems, scalable architecture, system design interview prep, infrastructure design, application architecture"
        url="https://satya00089.github.io/diagrammatic/#/problems"
      />
      <div className="min-h-screen bg-[var(--bg)] text-theme relative grid-pattern-overlay">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--brand)] transition-all duration-300">
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

                {/* Tour trigger button */}
                <button
                  type="button"
                  onClick={startTour}
                  data-tooltip="Take a tour"
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors cursor-pointer"
                >
                  <MdHelpOutline className="h-4 w-4" />
                  <span className="hidden sm:inline">Tour</span>
                </button>

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
                System Design & AI/ML Problems
              </h1>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                Master Infrastructure, Application, AI & ML architectures.
                Practice with 200+ curated problems in an interactive canvas.
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
                  Fetching the latest problems…
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="elevated-card-bg backdrop-blur-md rounded-2xl p-8 mb-6 border-2 border-red-500/20 shadow-lg max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="flex justify-center mb-4 text-red-400">
                    <MdWarningAmber className="w-14 h-14" />
                  </div>
                  <div className="text-theme text-xl font-semibold mb-2">
                    Couldn't load problems
                  </div>
                  <div className="text-muted text-sm mb-6">{error}</div>
                  <button
                    type="button"
                    onClick={() => globalThis.location.reload()}
                    className="px-6 py-3 bg-[var(--brand)] text-white font-semibold rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    Try again
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
                    <div data-tour="search-box">
                      <label
                        htmlFor="search-input"
                        className="flex items-center gap-1.5 text-sm font-semibold text-theme mb-2"
                      >
                        <MdSearch className="w-4 h-4" /> Search
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
                    <div data-tour="difficulty-filter">
                      <label
                        htmlFor="difficulty-select"
                        className="flex items-center gap-1.5 text-sm font-semibold text-theme mb-2"
                      >
                        <MdTune className="w-4 h-4" /> Difficulty
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
                    <div data-tour="category-filter">
                      <label
                        htmlFor="category-select"
                        className="flex items-center gap-1.5 text-sm font-semibold text-theme mb-2"
                      >
                        <MdLabel className="w-4 h-4" /> Category
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
                <div className="mb-4" data-tour="domain-filter">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-theme mb-2">
                    <MdPublic className="w-4 h-4" /> Domain
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
                      {...(index === 0 ? { "data-tour": "problem-card" } : {})}
                      className={`group elevated-card-bg backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative ${
                        index === 0
                          ? "delay-0"
                          : index === 1
                            ? "delay-100"
                            : index === 2
                              ? "delay-200"
                              : ""
                      }`}
                    >
                      {problem.has_guided_walkthrough ? (
                        <div className="flex items-center justify-between px-4 py-2 bg-sky-100 rounded-t-2xl">
                          <span className="flex items-center gap-1.5 text-sky-700 text-sm font-semibold tracking-wide">
                            <span>🗺️</span>
                            Guided Walkthrough
                          </span>
                          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                        </div>
                      ) : null}
                      <div className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-bold text-theme group-hover:text-[var(--brand)] transition-colors duration-300 line-clamp-2 flex-1 pr-2">
                            {problem.title}
                          </h3>
                          {!problem.has_guided_walkthrough && (
                            <div className="flex-shrink-0 ml-2">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                                {problem.difficulty}
                              </span>
                            </div>
                          )}
                        </div>

                        <p className="text-muted text-sm mb-4 line-clamp-3 leading-relaxed">
                          {problem.description}
                        </p>

                        <div className="flex items-center justify-between text-sm text-muted mb-4 pb-4 border-b border-[var(--theme)]/10">
                          <span className="flex items-center gap-1">
                            <MdLabel className="w-4 h-4 text-muted/60" />{" "}
                            {problem.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <MdAccessTime className="w-4 h-4 text-muted/60" />{" "}
                            {problem.estimated_time}
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
                            if (!isAuth) {
                              setShowAuthModal(true);
                              return;
                            }
                            navigate(`/playground/${problem.id}`);
                          }}
                          aria-label={`Start ${problem.title}`}
                          className={`w-full px-6 py-3 font-semibold rounded-xl transition-all duration-300 cursor-pointer group-hover:shadow-xl ${
                            isAuth && attemptedProblems.has(problem.id)
                              ? "bg-blue-600 text-white hover:shadow-md"
                              : "bg-[var(--brand)] text-white hover:shadow-md"
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
                    <div className="flex justify-center mb-6 text-muted/40">
                      <MdSearchOff className="w-16 h-16" />
                    </div>
                    <div className="text-theme text-xl font-semibold mb-2">
                      No problems found
                    </div>
                    <div className="text-muted">
                      Try adjusting your filters or search terms.
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
