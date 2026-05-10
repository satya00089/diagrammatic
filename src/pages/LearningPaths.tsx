import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthModal } from "../components/AuthModal";
import { MdHelpOutline } from "react-icons/md";
import SEO from "../components/SEO";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTheme } from "../hooks/useTheme";
import { useOnboarding } from "../hooks/useOnboarding";
import { useTour } from "../hooks/useTour";
import useAnalytics from "../hooks/useAnalytics";
import { fetchLearningPaths } from "../services/contentLoader";
import type { LearningPath } from "../services/contentLoader";
import LearningPathCard from "../components/learning-paths/LearningPathCard";

const LearningPaths: React.FC = () => {
  useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated: isAuth, login, signup, googleLogin, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isNewToPage, markPageVisited } = useOnboarding();
  const { startTour } = useTour("learning_paths");
  const { trackPageView } = useAnalytics({ isEnabled: true });

  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // mark visited + optional tour
    const isNew = isNewToPage("learning_paths");
    markPageVisited("learning_paths");
    if (isNew) {
      const t = setTimeout(() => startTour(), 800);
      return () => clearTimeout(t);
    }
    // track page view
    try {
      trackPageView();
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchLearningPaths()
      .then((data) => setPaths(data))
      .catch((err) => console.error("Failed to load learning paths", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO
        title="Learning Paths | Diagrammatic"
        description="Structured learning paths to master system design concepts, modules, and exercises."
        keywords="system design learning path, system design tutorial, learning path"
        url="/learning-paths"
      />

      <div className="min-h-screen bg-[var(--bg)] text-theme relative grid-pattern-overlay">
        {/* Header */}
        <header className="fixed left-0 right-0 z-50 bg-[var(--brand)] transition-all duration-300" style={{ top: 'var(--announcement-h, 0px)' }}>
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
                <span className="text-xl font-bold text-white">Diagrammatic</span>
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
                  {loading ? "Loading..." : `${paths.length} paths available`}
                </div>

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
                            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <span className="hidden sm:inline">{user?.name || user?.email}</span>
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
                          <div className="px-4 py-2">
                            <p className="text-sm font-medium text-theme">{user?.name || "User"}</p>
                            <p className="text-xs text-muted truncate">{user?.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              globalThis.dispatchEvent(new Event("open-quick-setup"));
                              setShowUserMenu(false);
                            }}
                            aria-label="Edit preferences"
                            className="w-full px-4 py-2 text-left text-sm text-theme hover:bg-[var(--bg-hover,var(--bg))] transition-colors border-b border-theme/10"
                          >
                            Edit preferences
                          </button>

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
        <div className="pt-16 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-3">Learning Paths</h1>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                Follow curated sequences of modules and lessons that teach system design from first principles to advanced patterns.
              </p>
            </div>

            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-muted">{loading ? "Loading paths..." : `${paths.length} path${paths.length !== 1 ? "s" : ""}`}</div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <div className="col-span-3 flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand)]" />
                </div>
              ) : (
                paths.map((p) => (
                  <LearningPathCard
                    key={p.id}
                    path={p}
                    isAuthenticated={isAuth}
                    onRequireAuth={() => setShowAuthModal(true)}
                  />
                ))
              )}
            </div>
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

export default LearningPaths;
