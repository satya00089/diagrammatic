import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CreateProblem from "./pages/CreateProblem";
import MyDesigns from "./pages/MyDesigns";
import SystemDesignPlayground from "./pages/SystemDesignPlayground";
import { useTheme } from "./hooks/useTheme";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatBotProvider } from "./contexts/ChatBotContext";

const App: React.FC = () => {
  useTheme(); // initialize theme globally

  return (
    <AuthProvider>
      <ChatBotProvider>
        <HashRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/problems" element={<Dashboard />} />
            <Route path="/create-problem" element={<CreateProblem />} />
            <Route path="/diagrams" element={<MyDesigns />} />
            <Route path="/playground/:id" element={<SystemDesignPlayground />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </HashRouter>
      </ChatBotProvider>
    </AuthProvider>
  );
};

export default App;
