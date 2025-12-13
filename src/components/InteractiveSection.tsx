import React, { useState } from "react";
import { MdLightbulb, MdFlag, MdCheckCircle, MdCancel } from "react-icons/md";
import type { InteractiveConfig, ValidationResult } from "../types/learning";

interface InteractiveSectionProps {
  config: InteractiveConfig;
}

export const InteractiveSection: React.FC<InteractiveSectionProps> = ({
  config,
}) => {
  const [currentHint, setCurrentHint] = useState(0);
  const [showHints, setShowHints] = useState(false);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
      <div className="flex items-start space-x-3 mb-4">
        <MdFlag className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Interactive Exercise
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {config.instructions}
          </p>
        </div>
      </div>

      {/* Hints Section */}
      {config.hints && config.hints.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowHints(!showHints)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            <MdLightbulb className="w-4 h-4" />
            <span>{showHints ? "Hide Hints" : "Show Hints"}</span>
          </button>

          {showHints && (
            <div className="mt-3 space-y-2">
              {config.hints.map((hint, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-2 p-3 rounded-lg ${
                    index <= currentHint
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-100 dark:bg-gray-700 opacity-50"
                  }`}
                >
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {hint}
                  </p>
                </div>
              ))}
              {currentHint < config.hints.length - 1 && (
                <button
                  onClick={() => setCurrentHint(currentHint + 1)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Show next hint →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Exercise Type Specific Content */}
      {config.type === "comparison" && (
        <ComparisonView config={config} />
      )}
      {config.type === "exercise" && (
        <GuidedExercise config={config} />
      )}
      {config.type === "simulation" && (
        <SimulationView config={config} />
      )}
    </div>
  );
};

const ComparisonView: React.FC<{ config: InteractiveConfig }> = ({
  config,
}) => {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Before Scaling
          </h4>
          <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500">
            Use canvas to design →
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            After Scaling
          </h4>
          <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500">
            Use canvas to design →
          </div>
        </div>
      </div>
    </div>
  );
};

const GuidedExercise: React.FC<{ config: InteractiveConfig }> = ({
  config,
}) => {
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);

  const validateSolution = () => {
    // This will be connected to the actual canvas validation
    // For now, showing placeholder
    setValidationResult({
      isValid: false,
      message: "Connect to canvas to validate your solution",
      details: [
        "Add required components",
        "Create necessary connections",
        "Test your architecture",
      ],
    });
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Success Criteria */}
      {config.successCriteria && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Success Criteria
          </h4>
          <ul className="space-y-2">
            {config.successCriteria.requiredComponents && (
              <li className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <MdCheckCircle className="w-4 h-4 text-gray-400" />
                <span>
                  Include:{" "}
                  {config.successCriteria.requiredComponents.join(", ")}
                </span>
              </li>
            )}
            {config.successCriteria.minConnections && (
              <li className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <MdCheckCircle className="w-4 h-4 text-gray-400" />
                <span>
                  Create at least {config.successCriteria.minConnections}{" "}
                  connections
                </span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Validation Button */}
      <button
        onClick={validateSolution}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Validate Solution
      </button>

      {/* Validation Result */}
      {validationResult && (
        <div
          className={`rounded-lg p-4 ${
            validationResult.isValid
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
          }`}
        >
          <div className="flex items-start space-x-3">
            {validationResult.isValid ? (
              <MdCheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <MdCancel className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            )}
            <div>
              <h4
                className={`font-semibold mb-2 ${
                  validationResult.isValid
                    ? "text-green-900 dark:text-green-100"
                    : "text-yellow-900 dark:text-yellow-100"
                }`}
              >
                {validationResult.message}
              </h4>
              {validationResult.details && (
                <ul className="space-y-1">
                  {validationResult.details.map((detail, index) => (
                    <li
                      key={index}
                      className={`text-sm ${
                        validationResult.isValid
                          ? "text-green-700 dark:text-green-300"
                          : "text-yellow-700 dark:text-yellow-300"
                      }`}
                    >
                      • {detail}
                    </li>
                  ))}
                </ul>
              )}
              {validationResult.score !== undefined && (
                <div className="mt-2">
                  <span className="text-sm font-medium">
                    Score: {validationResult.score}/100
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SimulationView: React.FC<{ config: InteractiveConfig }> = ({
  config,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="mt-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">
              Interactive simulation will appear here
            </p>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isPlaying ? "Pause" : "Play"} Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
