import React, { useState } from "react";
import Dashboard from "./pages/Dashboard";
import SystemDesignPlayground from "./pages/SystemDesignPlayground";
import { type SystemDesignProblem } from "./types/systemDesign";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<"dashboard" | "playground">(
    "dashboard"
  );
  const [selectedProblem, setSelectedProblem] =
    useState<SystemDesignProblem | null>(null);

  const handleSelectProblem = (problem: SystemDesignProblem) => {
    setSelectedProblem(problem);
    setCurrentView("playground");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedProblem(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === "dashboard" ? (
        <Dashboard onSelectProblem={handleSelectProblem} />
      ) : (
        <SystemDesignPlayground
          problem={selectedProblem}
          onBack={handleBackToDashboard}
        />
      )}
    </div>
  );
};

export default App;
