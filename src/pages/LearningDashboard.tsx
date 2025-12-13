import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MdBook,
  MdAccessTime,
  MdTrendingUp,
  MdEmojiEvents,
  MdFlag,
  MdCheckCircle,
  MdLock,
} from "react-icons/md";
import type {
  LearningModule,
  ModuleProgress,
  LearningStats,
} from "../types/learning";
import { useAuth } from "../hooks/useAuth";

const LearningDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [moduleProgress, setModuleProgress] = useState<
    Map<string, ModuleProgress>
  >(new Map());
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load modules
        const modulesResponse = await fetch(
          "/learning-content/module-index.json",
        );
        const modulesData = await modulesResponse.json();
        setModules(modulesData.modules);

        // Load user progress if authenticated
        if (isAuthenticated && user) {
          const progressResponse = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/learning/progress/${user.id}`,
          );
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();

            // Calculate module progress
            const progressMap = new Map<string, ModuleProgress>();
            modulesData.modules.forEach((module: LearningModule) => {
              const completedLessons = progressData
                .filter(
                  (p: any) => p.moduleId === module.id && p.completed,
                )
                .map((p: any) => p.lessonId);

              progressMap.set(module.id, {
                moduleId: module.id,
                completedLessons,
                totalLessons: module.lessons.length,
                progress: (completedLessons.length / module.lessons.length) * 100,
              });
            });
            setModuleProgress(progressMap);

            // Load stats
            const statsResponse = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/learning/stats/${user.id}`,
            );
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              setStats(statsData);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load learning data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user]);

  const isModuleLocked = (module: LearningModule): boolean => {
    if (module.prerequisites.length === 0) return false;

    return module.prerequisites.some((prereqId) => {
      const prereqProgress = moduleProgress.get(prereqId);
      return !prereqProgress || prereqProgress.progress < 100;
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading learning modules...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Learn System Design
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Master system design from fundamentals to advanced patterns with
            interactive lessons
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        {isAuthenticated && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.completedLessons}/{stats.totalLessons}
                  </p>
                </div>
                <MdCheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Time Spent
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {Math.floor(stats.totalTimeSpent / 3600)}h
                  </p>
                </div>
                <MdAccessTime className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Streak
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.streak} days
                  </p>
                </div>
                <MdTrendingUp className="w-10 h-10 text-orange-600" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Achievements
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.achievements.length}
                  </p>
                </div>
                <MdEmojiEvents className="w-10 h-10 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        {/* Learning Path */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Learning Path
          </h2>
          <div className="space-y-6">
            {modules.map((module) => {
              const progress = moduleProgress.get(module.id);
              const locked = isModuleLocked(module);

              return (
                <div
                  key={module.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${
                    locked ? "opacity-60" : ""
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-3xl">{module.icon}</span>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                              {module.title}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded ${getLevelColor(module.level)}`}
                              >
                                {module.level.toUpperCase()}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <MdAccessTime className="w-3 h-3 mr-1" />
                                {module.estimatedTime}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {module.lessons.length} lessons
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                          {module.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {module.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Progress bar */}
                        {progress && progress.progress > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600 dark:text-gray-400">
                                Progress
                              </span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {progress.completedLessons.length}/
                                {progress.totalLessons} completed
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${progress.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-6">
                        {locked ? (
                          <div className="text-center">
                            <MdLock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Complete prerequisites
                            </p>
                          </div>
                        ) : (
                          <Link
                            to={`/learn/${module.id}/${module.lessons[0].slug}`}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                          >
                            <MdBook className="w-5 h-5" />
                            <span>
                              {progress && progress.progress > 0
                                ? "Continue"
                                : "Start"}
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Prerequisites */}
                    {module.prerequisites.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <MdFlag className="w-4 h-4 inline mr-1" />
                          Prerequisites:{" "}
                          {module.prerequisites
                            .map(
                              (id) =>
                                modules.find((m) => m.id === id)?.title,
                            )
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA for non-authenticated users */}
        {!isAuthenticated && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
            <MdEmojiEvents className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Sign in to track your progress
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create an account to save your progress, earn achievements, and
              compete on leaderboards
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningDashboard;
