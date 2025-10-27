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
        const apiUrl = import.meta.env.VITE_ASSESSMENT_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/v1/all-problems`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch problems: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setProblems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching problems');
        console.error('Error fetching problems:', err);
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
    ...Array.from(new Set(problems.map((p: SystemDesignProblem) => p.category))),
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
    <div className="h-screen bg-theme text-theme flex flex-col">
      {/* Header */}
      <div className="bg-surface shadow-sm border-b border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="./logo.png" alt="Logo" className="h-16" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-theme">
                  System Design Playground
                </h1>
                <p className="mt-1 text-muted">
                  Master system design through interactive problem solving
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted">
                {loading ? "Loading..." : `${filteredProblems.length} problems available`}
              </div>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="overflow-y-auto component-palette">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="text-muted text-lg mb-2">Loading problems...</div>
              <div className="text-muted text-sm">
                Please wait while we fetch the latest problems
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800 text-lg font-medium mb-2">
                Error Loading Problems
              </div>
              <div className="text-red-700 text-sm">
                {error}
              </div>
              <button
                onClick={() => globalThis.location.reload()}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Filters - Only show when not loading and no error */}
          {!loading && !error && (
            <>
              <div className="bg-surface rounded-lg shadow-sm p-6 mb-6 border border-theme">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div>
                    <label
                      htmlFor="search-input"
                      className="block text-sm font-medium text-theme mb-2"
                    >
                      Search
                    </label>
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search problems..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand)] bg-[var(--surface)] text-theme text-[var(--text)]"
                    />
                  </div>

                  {/* Difficulty Filter */}
                  <div>
                    <label
                      htmlFor="difficulty-select"
                      className="block text-sm font-medium text-theme mb-2"
                    >
                      Difficulty
                    </label>
                    <select
                      id="difficulty-select"
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand)] bg-[var(--surface)] text-theme text-[var(--text)] appearance-none"
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
                      className="block text-sm font-medium text-theme mb-2"
                    >
                      Category
                    </label>
                    <select
                      id="category-select"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-theme rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand)] bg-[var(--surface)] text-theme text-[var(--text)] appearance-none"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProblems.map((problem) => (
                  <div
                    key={problem.id}
                    className="bg-surface rounded-lg shadow-sm border border-theme hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-[var(--brand)] line-clamp-2">
                          {problem.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(problem.difficulty)}`}
                        >
                          {problem.difficulty}
                        </span>
                      </div>

                      <p className="text-muted text-sm mb-4 line-clamp-2">
                        {problem.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-muted mb-4">
                        <span>{problem.category}</span>
                        <span>{problem.estimated_time}</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {problem.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-[var(--brand)]/10 text-[var(--brand)] text-xs capitalize font-bold rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {problem.tags.length > 3 && (
                          <span className="px-2 py-1 bg-[var(--surface)] text-muted text-xs rounded">
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
                        className="w-full px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:brightness-90 transition-colors cursor-pointer"
                      >
                        Start Problem
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProblems.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-muted text-lg mb-2">No problems found</div>
                  <div className="text-muted text-sm">
                    Try adjusting your filters
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
