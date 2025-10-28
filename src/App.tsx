import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CreateProblem from "./pages/CreateProblem";
import SystemDesignPlayground from "./pages/SystemDesignPlayground";
import { useTheme } from "./hooks/useTheme";

const App: React.FC = () => {
  useTheme(); // initialize theme globally

  return (
    <HashRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/problems" element={<Dashboard />} />
        <Route path="/create-problem" element={<CreateProblem />} />
        <Route path="/playground/:id" element={<SystemDesignPlayground />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
