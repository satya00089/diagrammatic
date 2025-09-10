import React from 'react';
import type { SystemDesignProblem } from '../types/systemDesign';

interface SystemDesignPlaygroundProps {
  problem: SystemDesignProblem | null;
  onBack: () => void;
}

const SystemDesignPlayground: React.FC<SystemDesignPlaygroundProps> = ({ problem, onBack }) => {
  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No problem selected</h2>
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              ← Back to Dashboard
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{problem.title}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className={`px-2 py-1 rounded text-xs ${
                  problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                  problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {problem.difficulty}
                </span>
                <span>{problem.estimatedTime}</span>
                <span>•</span>
                <span>{problem.category}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Component Palette */}
        <div className="w-64 bg-white border-r p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Components</h3>
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm font-medium text-gray-900">🗄️ Database</div>
              <div className="text-xs text-gray-500">Data storage</div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm font-medium text-gray-900">⚖️ Load Balancer</div>
              <div className="text-xs text-gray-500">Traffic distribution</div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm font-medium text-gray-900">⚡ Cache</div>
              <div className="text-xs text-gray-500">Fast data access</div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm font-medium text-gray-900">🌐 Web Server</div>
              <div className="text-xs text-gray-500">HTTP requests</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <div className="font-medium mb-1">💡 Coming Soon:</div>
            <div className="text-blue-700">Drag & drop components to canvas</div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 relative bg-gray-100">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-4">🏗️</div>
              <div className="text-xl font-medium mb-2">System Design Canvas</div>
              <div className="text-sm mb-4">Interactive diagramming coming soon...</div>
              <div className="bg-white p-4 rounded-lg shadow-sm max-w-md">
                <div className="text-left text-gray-700 text-sm">
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
        <div className="w-80 bg-white border-l p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{problem.title}</h3>
          <p className="text-gray-700 text-sm leading-relaxed mb-4">{problem.description}</p>
          
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Requirements</h4>
            <ul className="space-y-1">
              {problem.requirements.map((req, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-500 mt-0.5 text-xs">✓</span>
                  <span className="text-xs text-gray-700">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Constraints</h4>
            <ul className="space-y-1">
              {problem.constraints.map((constraint, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-yellow-500 mt-0.5 text-xs">⚠</span>
                  <span className="text-xs text-gray-700">{constraint}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Hints</h4>
            <div className="space-y-2">
              {problem.hints.map((hint, index) => (
                <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded-r-lg">
                  <div className="text-xs text-gray-700">{hint}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-1">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
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
