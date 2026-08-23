import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatBotProvider } from "./contexts/ChatBotContext";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import OnboardingChecklist from "./components/OnboardingChecklist";
import FeatureAnnouncement from "./components/FeatureAnnouncement";
import QuickSetupModal from "./components/QuickSetupModal";

const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProblemLanding = lazy(() => import("./pages/ProblemLanding"));
const SeoGuide = lazy(() => import("./pages/SeoGuide"));
const CreateProblem = lazy(() => import("./pages/CreateProblem"));
const MyDesigns = lazy(() => import("./pages/MyDesigns"));
const SystemDesignPlayground = lazy(
  () => import("./pages/SystemDesignPlayground"),
);
const SharedCanvasPage = lazy(() => import("./pages/SharedCanvasPage"));
const LearningPaths = lazy(() => import("./pages/LearningPaths"));
const LearningPath = lazy(() => import("./pages/LearningPath"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const RouteLoading: React.FC = () => (
  <div
    className="min-h-screen bg-[var(--bg)] text-theme grid place-items-center px-6"
    role="status"
  >
    <div className="text-center">
      <div className="mx-auto mb-4 h-9 w-9 rounded-full border-2 border-[var(--brand)] border-t-transparent animate-spin" />
      <span className="text-sm font-semibold text-muted">
        Loading Diagrammatic…
      </span>
    </div>
  </div>
);

const GlobalProductChrome: React.FC = () => {
  const { pathname } = useLocation();
  const isKnownRoute =
    [
      "/",
      "/problems",
      "/create-problem",
      "/learning-paths",
      "/diagrams",
      "/system-design-interview",
      "/system-design-practice",
      "/ai-system-design-interview",
    ].includes(pathname) ||
    ["/learning-paths/", "/playground/", "/problems/"].some((prefix) =>
      pathname.startsWith(prefix),
    );

  if (
    pathname.startsWith("/public/") ||
    pathname === "/verify-email" ||
    !isKnownRoute
  ) {
    return null;
  }

  return (
    <>
      <OnboardingChecklist />
      <FeatureAnnouncement />
      <QuickSetupModal />
    </>
  );
};

const App: React.FC = () => {
  useTheme(); // initialize theme globally

  return (
    <AuthProvider>
      <ChatBotProvider>
        <OnboardingProvider>
          <BrowserRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/problems" element={<Dashboard />} />
                <Route path="/problems/:slug" element={<ProblemLanding />} />
                <Route path="/system-design-interview" element={<SeoGuide />} />
                <Route path="/system-design-practice" element={<SeoGuide />} />
                <Route path="/ai-system-design-interview" element={<SeoGuide />} />
                <Route path="/create-problem" element={<CreateProblem />} />
                <Route path="/learning-paths" element={<LearningPaths />} />
                <Route path="/learning-paths/:slug" element={<LearningPath />} />
                <Route path="/diagrams" element={<MyDesigns />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route
                  path="/playground/:id"
                  element={<SystemDesignPlayground />}
                />
                <Route path="/public/:id" element={<SharedCanvasPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <GlobalProductChrome />
          </BrowserRouter>
        </OnboardingProvider>
      </ChatBotProvider>
    </AuthProvider>
  );
};

export default App;
