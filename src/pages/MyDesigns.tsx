import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { AuthModal } from "../components/AuthModal";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import SEO from "../components/SEO";
import { apiService } from "../services/api";
import type { SavedDiagram } from "../types/auth";

const MyDesigns: React.FC = () => {
  useTheme();
  const navigate = useNavigate();
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
  const [loadingDiagrams, setLoadingDiagrams] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title">(
    "updated"
  );
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  // Load diagrams
  useEffect(() => {
    const loadDiagrams = async () => {
      if (!isAuth) {
        setSavedDiagrams([]);
        return;
      }
      setLoadingDiagrams(true);
      try {
        const diagrams = await apiService.getUserDiagrams();
        setSavedDiagrams(diagrams);
      } catch (error) {
        console.error("Failed to load diagrams:", error);
      } finally {
        setLoadingDiagrams(false);
      }
    };
    loadDiagrams();
  }, [isAuth]);

  const handleOpenDiagram = (diagramId: string) => {
    navigate(`/playground/free?diagramId=${diagramId}`);
  };

  const handleDeleteDiagram = async (
    diagramId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!globalThis.confirm("Are you sure you want to delete this diagram?")) {
      return;
    }

    try {
      await apiService.deleteDiagram(diagramId);
      setSavedDiagrams((prev) => prev.filter((d) => d.id !== diagramId));
    } catch (error) {
      console.error("Failed to delete diagram:", error);
      alert("Failed to delete diagram. Please try again.");
    }
  };

  // Filter and sort diagrams
  const filteredDiagrams = savedDiagrams
    .filter((diagram) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        diagram.title.toLowerCase().includes(searchLower) ||
        diagram.description?.toLowerCase().includes(searchLower) ||
        false
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "created":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "updated":
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });

  return (
    <>
      <SEO
        title="My Designs | Diagrammatic"
        description="View and manage your saved system design projects"
        url="https://satya00089.github.io/diagrammatic/#/diagrams"
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
                  <button
                    type="button"
                    onClick={() => navigate("/problems")}
                    className="hidden md:block px-4 py-2 text-sm font-medium text-white hover:text-white/80 transition-colors cursor-pointer"
                  >
                    Problems
                  </button>
                )}

                <div className="hidden md:block text-sm text-white/90">
                  {loadingDiagrams
                    ? "Loading..."
                    : `${filteredDiagrams.length} design${filteredDiagrams.length === 1 ? "" : "s"}`}
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/playground/free")}
                  className="px-4 py-2 bg-white/20 text-white text-sm font-semibold rounded-lg hover:bg-white/30 transition-all cursor-pointer"
                >
                  New Design
                </button>

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
                My Designs
              </h1>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                View and manage your saved system design projects
              </p>
            </div>

            {/* Filters */}
            {!loadingDiagrams && (
              <>
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
                        placeholder="Search designs..."
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
                            e.target.value as "updated" | "created" | "title"
                          )
                        }
                        className="w-full px-4 py-3 border-2 border-[var(--theme)]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent bg-[var(--surface)] text-theme appearance-none cursor-pointer transition-all duration-300 hover:border-[var(--brand)]/30"
                      >
                        <option value="updated">Last Updated</option>
                        <option value="created">Date Created</option>
                        <option value="title">Title (A-Z)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {loadingDiagrams && (
                  <div className="text-center py-20">
                    <div className="inline-block w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-theme text-xl mb-2">
                      Loading designs...
                    </div>
                    <div className="text-muted text-sm">
                      Please wait while we fetch your designs
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!loadingDiagrams && filteredDiagrams.length === 0 && (
                  <div className="text-center py-20">
                    <div className="text-7xl mb-6">
                      {searchTerm ? "🔍" : "🎨"}
                    </div>
                    <div className="text-theme text-2xl font-bold mb-2">
                      {searchTerm ? "No designs found" : "No designs yet"}
                    </div>
                    <div className="text-muted text-lg mb-6">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Start creating your first system design project"}
                    </div>
                    {!searchTerm && (
                      <button
                        type="button"
                        onClick={() => navigate("/playground/free")}
                        className="px-6 py-3 bg-gradient-to-r from-[var(--brand)] to-[#BD6CD5] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
                      >
                        Create Your First Design →
                      </button>
                    )}
                  </div>
                )}

                {/* Diagrams Grid */}
                {!loadingDiagrams && filteredDiagrams.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    {filteredDiagrams.map((diagram, index) => (
                      <div
                        key={diagram.id}
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
                            onClick={(e) => handleDeleteDiagram(diagram.id, e)}
                            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/10 rounded-lg z-10"
                            title="Delete diagram"
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
                            onClick={() => handleOpenDiagram(diagram.id)}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 pr-8">
                                <h3 className="text-lg font-bold text-theme group-hover:text-[var(--brand)] transition-colors duration-300 line-clamp-2 mb-1">
                                  {diagram.title}
                                </h3>
                                {diagram.description && (
                                  <p className="text-muted text-sm line-clamp-2 leading-relaxed">
                                    {diagram.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-3xl">📐</div>
                            </div>

                            <div className="flex items-center justify-between text-sm text-muted mb-4 pb-4 border-b border-[var(--theme)]/10">
                              <span className="flex items-center gap-1">
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
                                {diagram.nodes.length} node
                                {diagram.nodes.length === 1 ? "" : "s"}
                              </span>
                              <span className="flex items-center gap-1">
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
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                  />
                                </svg>
                                {diagram.edges.length} connection
                                {diagram.edges.length === 1 ? "" : "s"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted mb-6">
                              <span>
                                Updated{" "}
                                {new Date(diagram.updatedAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </span>
                              <span>
                                Created{" "}
                                {new Date(diagram.createdAt).toLocaleDateString(
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
                                handleOpenDiagram(diagram.id);
                              }}
                              className="w-full px-6 py-3 bg-gradient-to-r from-[var(--brand)] to-[#BD6CD5] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group-hover:shadow-xl"
                            >
                              Open Design →
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
    </>
  );
};

export default MyDesigns;
