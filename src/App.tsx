import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CreateProblem from "./pages/CreateProblem";
import MyDesigns from "./pages/MyDesigns";
import SystemDesignPlayground from "./pages/SystemDesignPlayground";
import LearningPaths from "./pages/LearningPaths";
import LearningPath from "./pages/LearningPath";
import { useTheme } from "./hooks/useTheme";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatBotProvider } from "./contexts/ChatBotContext";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import OnboardingChecklist from "./components/OnboardingChecklist";
import FeatureAnnouncement from "./components/FeatureAnnouncement";
import QuickSetupModal from "./components/QuickSetupModal";

const App: React.FC = () => {
  useTheme(); // initialize theme globally


  return (
    <AuthProvider>
      <ChatBotProvider>
        <OnboardingProvider>
          <BrowserRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/problems" element={<Dashboard />} />
              <Route path="/create-problem" element={<CreateProblem />} />
              <Route path="/learning-paths" element={<LearningPaths />} />
              <Route path="/learning-paths/:slug" element={<LearningPath />} />
              <Route path="/diagrams" element={<MyDesigns />} />
              <Route
                path="/playground/:id"
                element={<SystemDesignPlayground />}
              />
              <Route path="/public/:publicId" element={<SystemDesignPlayground />} />
              <Route path="*" element={<Home />} />
            </Routes>
            {/* Global onboarding UI — rendered outside page routes so they persist across navigation */}
            <OnboardingChecklist />
            <FeatureAnnouncement />
            <QuickSetupModal />
          </BrowserRouter>
        </OnboardingProvider>
      </ChatBotProvider>
    </AuthProvider>
  );
};

export default App;
