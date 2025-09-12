import React from "react";
import { HashRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SystemDesignPlayground from "./pages/SystemDesignPlayground";
import { systemDesignProblems } from "./data/problems";
import type { SystemDesignProblem } from "./types/systemDesign";
import { useTheme } from "./hooks/useTheme";

const App: React.FC = () => {
  useTheme(); // initialize theme globally

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DashboardWrapper />} />
        <Route path="/playground/:id" element={<PlaygroundWrapper />} />
        <Route path="*" element={<DashboardWrapper />} />
      </Routes>
    </HashRouter>
  );
};

function DashboardWrapper() {
  const navigate = useNavigate();
  const handleSelectProblem = (problem: SystemDesignProblem) => {
    navigate(`/playground/${problem.id}`);
  };
  return <Dashboard onSelectProblem={handleSelectProblem} />;
}

function PlaygroundWrapper() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const problem = id ? systemDesignProblems.find((p) => p.id === id) ?? null : null;
  const navigate = useNavigate();
  const handleBack = () => navigate("/");
  return <SystemDesignPlayground problem={problem} onBack={handleBack} />;
}

export default App;
