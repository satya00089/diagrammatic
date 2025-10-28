import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";

import type { SystemDesignProblem } from "../types/systemDesign";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTheme } from "../hooks/useTheme";

const Dashboard: React.FC = () => {
  useTheme();
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [problems, setProblems] = useState<SystemDesignProblem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch problems from API
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiUrl =
          import.meta.env.VITE_ASSESSMENT_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/v1/all-problems`);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch problems: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        setProblems(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching problems",
        );
        console.error("Error fetching problems:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  const filteredProblems = useMemo(() => {
    const q = searchTerm?.trim() ?? "";
    let results = problems;

    if (q.length > 0) {
      const fuse = new Fuse(problems, {
        keys: [
          { name: "title", weight: 0.6 },
          { name: "description", weight: 0.25 },
          { name: "tags", weight: 0.15 },
        ],
        includeScore: true,
        threshold: 0.45,
      });

      results = fuse.search(q).map((r) => r.item);
    }

    return results.filter((problem: SystemDesignProblem) => {
      const matchesDifficulty =
        selectedDifficulty === "All" ||
        problem.difficulty === selectedDifficulty;
      const matchesCategory =
        selectedCategory === "All" || problem.category === selectedCategory;
      return matchesDifficulty && matchesCategory;
    });
  }, [selectedDifficulty, selectedCategory, searchTerm, problems]);

  const categories = [
    "All",
    ...Array.from(
      new Set(problems.map((p: SystemDesignProblem) => p.category)),
    ),
  ];
  const difficulties = ["All", "Easy", "Medium", "Hard"];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] via-[var(--bg)] to-[var(--surface)] text-theme relative grid-pattern-overlay">
      {/* Header */}
      <header className='fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] transition-all duration-300'>
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
              <div className="hidden md:block text-sm text-white/90">
                {loading
                  ? "Loading..."
                  : `${filteredProblems.length} problems available`}
              </div>
              <ThemeSwitcher />
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
              <div className="text-theme text-xl mb-2">Loading problems...</div>
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
              <div className="elevated-card-bg backdrop-blur-md rounded-2xl shadow-lg p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
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
                      onChange={(e) => setSelectedCategory(e.target.value)}
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

              {/* Problems Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                {filteredProblems.map((problem, index) => (
                  <div
                    key={problem.id}
                    className={`group elevated-card-bg backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden ${
                      index === 0 ? 'delay-0' : index === 1 ? 'delay-100' : index === 2 ? 'delay-200' : ''
                    }`}
                  >
                    {/* Gradient glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--brand)] to-[#BD6CD5] rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
                    
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-bold text-theme group-hover:text-[var(--brand)] transition-colors duration-300 line-clamp-2 flex-1">
                          {problem.title}
                        </h3>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ml-2 ${getDifficultyColor(problem.difficulty)}`}
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
                            className="px-3 py-1 bg-[var(--brand)]/10 text-[var(--brand)] text-xs font-semibold rounded-full"
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
                        className="w-full px-6 py-3 bg-gradient-to-r from-[var(--brand)] to-[#BD6CD5] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group-hover:shadow-xl"
                      >
                        Start Problem →
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
  );
};

export default Dashboard;
