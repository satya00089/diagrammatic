import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CreateProblem from "./pages/CreateProblem";
import MyDesigns from "./pages/MyDesigns";
import SystemDesignPlayground from "./pages/SystemDesignPlayground";
import LearningDashboard from "./pages/LearningDashboard";
import LearningModule from "./pages/LearningModule";
import { useTheme } from "./hooks/useTheme";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatBotProvider } from "./contexts/ChatBotContext";

const App: React.FC = () => {
  useTheme(); // initialize theme globally

  return (
    <AuthProvider>
      <ChatBotProvider>
        <BrowserRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/problems" element={<Dashboard />} />
            <Route path="/create-problem" element={<CreateProblem />} />
            <Route path="/diagrams" element={<MyDesigns />} />
            <Route
              path="/playground/:id"
              element={<SystemDesignPlayground />}
            />
            <Route path="/learn" element={<LearningDashboard />} />
            <Route
              path="/learn/:moduleId/:lessonSlug"
              element={<LearningModule />}
            />
            <Route path="*" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </ChatBotProvider>
    </AuthProvider>
  );
};

export default App;
