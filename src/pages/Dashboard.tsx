import React, { useState, useMemo } from "react";
import type { SystemDesignProblem } from "../types/systemDesign";
import { systemDesignProblems } from "../data/problems";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTheme } from "../hooks/useTheme";

interface DashboardProps {
  onSelectProblem: (problem: SystemDesignProblem) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelectProblem }) => {
  useTheme(); // ensure theme applied when Dashboard mounts
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredProblems = useMemo(() => {
    return systemDesignProblems.filter((problem) => {
      const matchesDifficulty =
        selectedDifficulty === "All" ||
        problem.difficulty === selectedDifficulty;
      const matchesCategory =
        selectedCategory === "All" || problem.category === selectedCategory;
      const matchesSearch =
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesDifficulty && matchesCategory && matchesSearch;
    });
  }, [selectedDifficulty, selectedCategory, searchTerm]);

  const categories = [
    "All",
    ...Array.from(new Set(systemDesignProblems.map((p) => p.category))),
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
    <div className="min-h-screen bg-theme text-theme">
      {/* Header */}
      <div className="bg-surface shadow-sm border-b border-theme">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-theme">
                System Design Learning
              </h1>
              <p className="mt-2 text-muted">
                Master system design through interactive problem solving
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted">
                {filteredProblems.length} problems available
              </div>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                  <h3 className="text-lg font-semibold text-theme line-clamp-2">
                    {problem.title}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(problem.difficulty)}`}
                  >
                    {problem.difficulty}
                  </span>
                </div>

                <p className="text-muted text-sm mb-4 line-clamp-3">
                  {problem.description}
                </p>

                <div className="flex items-center justify-between text-sm text-muted mb-4">
                  <span>{problem.category}</span>
                  <span>{problem.estimatedTime}</span>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {problem.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-[var(--bg-secondary, #eef2ff)] text-[var(--brand, #6366f1)] text-xs rounded"
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
                    onSelectProblem(problem);
                  }}
                  aria-label={`Start ${problem.title}`}
                  className="w-full px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:brightness-90 transition-colors"
                >
                  Start Problem
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProblems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted text-lg mb-2">No problems found</div>
            <div className="text-muted text-sm">Try adjusting your filters</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
