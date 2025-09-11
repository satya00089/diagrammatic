import React from 'react';
import type { SystemDesignProblem } from '../types/systemDesign';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useTheme } from '../hooks/useTheme';

interface SystemDesignPlaygroundProps {
  problem: SystemDesignProblem | null;
  onBack: () => void;
}

const SystemDesignPlayground: React.FC<SystemDesignPlaygroundProps> = ({ problem, onBack }) => {
  useTheme(); // ensure theme applied for this page

  // determine difficulty badge classes in one place to avoid nested ternary in JSX
  const difficultyBadgeClass = (() => {
    if (!problem) return '';
    const d = problem.difficulty;
    if (d === 'Easy') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (d === 'Medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  })();

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No problem selected</h2>
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-theme">
      {/* Header */}
      <div className="bg-surface shadow-sm border-b border-theme px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="px-3 py-2 text-muted hover:text-theme hover:bg-[var(--bg-hover)] rounded-md transition-colors"
            >
              ← Back to Dashboard
            </button>
            <div>
              <h1 className="text-lg font-semibold text-theme">{problem.title}</h1>
              <div className="flex items-center space-x-2 text-sm text-muted">
                <span className={`px-2 py-1 rounded text-xs ${difficultyBadgeClass}`}>
                  {problem.difficulty}
                </span>
                <span className="text-muted">{problem.estimatedTime}</span>
                <span className="text-muted">•</span>
                <span className="text-muted">{problem.category}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Component Palette */}
        <div className="w-64 bg-surface border-r border-theme p-4">
          <h3 className="text-lg font-semibold text-theme mb-4">System Components</h3>
          <div className="space-y-2">
            <div className="p-3 bg-[var(--surface)] border border-theme rounded-lg">
              <div className="text-sm font-medium text-theme">🗄️ Database</div>
              <div className="text-xs text-muted">Data storage</div>
            </div>
            <div className="p-3 bg-[var(--surface)] border border-theme rounded-lg">
              <div className="text-sm font-medium text-theme">⚖️ Load Balancer</div>
              <div className="text-xs text-muted">Traffic distribution</div>
            </div>
            <div className="p-3 bg-[var(--surface)] border border-theme rounded-lg">
              <div className="text-sm font-medium text-theme">⚡ Cache</div>
              <div className="text-xs text-muted">Fast data access</div>
            </div>
            <div className="p-3 bg-[var(--surface)] border border-theme rounded-lg">
              <div className="text-sm font-medium text-theme">🌐 Web Server</div>
              <div className="text-xs text-muted">HTTP requests</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-[var(--brand, #eaf0ff)] border border-theme rounded-lg text-xs text-brand">
            <div className="font-medium mb-1">💡 Coming Soon:</div>
            <div className="text-brand">Drag & drop components to canvas</div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 relative bg-theme">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted">
              <div className="text-4xl mb-4">🏗️</div>
              <div className="text-xl font-medium mb-2 text-theme">System Design Canvas</div>
              <div className="text-sm mb-4 text-muted">Interactive diagramming coming soon...</div>
              <div className="bg-surface p-4 rounded-lg shadow-sm max-w-md">
                <div className="text-left text-muted text-sm">
                  <div className="font-medium mb-2">For now, think about:</div>
                  <ul className="space-y-1">
                    <li>• What components do you need?</li>
                    <li>• How will they communicate?</li>
                    <li>• Where are the bottlenecks?</li>
                    <li>• How will you scale?</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Problem Details */}
        <div className="w-80 bg-surface border-l border-theme p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-theme mb-3">{problem.title}</h3>
          <p className="text-muted text-sm leading-relaxed mb-4">{problem.description}</p>
          
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-theme mb-2">Requirements</h4>
            <ul className="space-y-1">
              {problem.requirements.map((req) => (
                <li key={req} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5 text-xs">✓</span>
                  <span className="text-xs text-muted">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-theme mb-2">Constraints</h4>
            <ul className="space-y-1">
              {problem.constraints.map((constraint) => (
                <li key={constraint} className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-0.5 text-xs">⚠</span>
                  <span className="text-xs text-muted">{constraint}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-theme mb-2">Hints</h4>
            <div className="space-y-2">
              {problem.hints.map((hint) => (
                <div key={hint} className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 dark:border-yellow-600 p-2 rounded-r-lg">
                  <div className="text-xs text-muted">{hint}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-theme mb-2">Tags</h4>
            <div className="flex flex-wrap gap-1">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemDesignPlayground;
