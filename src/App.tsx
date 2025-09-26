import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SystemDesignPlayground from "./pages/SystemDesignPlayground";
import { useTheme } from "./hooks/useTheme";

const App: React.FC = () => {
  useTheme(); // initialize theme globally

  return (
    <HashRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/playground/:id" element={<SystemDesignPlayground />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
