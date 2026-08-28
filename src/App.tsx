import React, { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatBotProvider } from "./contexts/ChatBotContext";
import { OnboardingProvider } from "./contexts/OnboardingContext";

const OnboardingChecklist = lazy(
  () => import("./components/OnboardingChecklist"),
);
const FeatureAnnouncement = lazy(
  () => import("./components/FeatureAnnouncement"),
);
const QuickSetupModal = lazy(() => import("./components/QuickSetupModal"));
const StoreBoundary = lazy(() => import("./components/StoreBoundary"));

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
  <output className="min-h-screen bg-[var(--bg)] text-theme grid place-items-center px-6">
    <span className="block text-center">
      <span
        className="mx-auto mb-4 block h-9 w-9 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent"
        aria-hidden
      />
      <span className="block text-sm font-semibold text-muted">
        Loading Diagrammatic…
      </span>
    </span>
  </output>
);

const GlobalProductChrome: React.FC = () => {
  const { pathname } = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load non-critical product chrome only after the route has had a quiet
    // startup window. This keeps animation libraries and modal code out of
    // the critical render and interaction path.
    let idleId: number | undefined;
    let hasScheduled = false;
    const scheduleChrome = () => {
      if (hasScheduled) return;
      hasScheduled = true;
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(() => setIsReady(true), {
          timeout: 3000,
        });
      } else {
        setIsReady(true);
      }
    };

    const timer = window.setTimeout(scheduleChrome, 12000);
    const engagementEvents: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "scroll",
    ];
    engagementEvents.forEach((eventName) =>
      window.addEventListener(eventName, scheduleChrome, {
        once: true,
        passive: true,
      }),
    );

    return () => {
      window.clearTimeout(timer);
      engagementEvents.forEach((eventName) =>
        window.removeEventListener(eventName, scheduleChrome),
      );
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

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
    !isReady ||
    pathname.startsWith("/public/") ||
    pathname === "/verify-email" ||
    !isKnownRoute
  ) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <OnboardingChecklist />
      <FeatureAnnouncement />
      <QuickSetupModal />
    </Suspense>
  );
};

const App: React.FC = () => {
  useTheme(); // initialize theme globally

  return (
    <AuthProvider>
      <ChatBotProvider>
        <OnboardingProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/problems"
                  element={
                    <StoreBoundary>
                      <Dashboard />
                    </StoreBoundary>
                  }
                />
                <Route
                  path="/problems/:slug"
                  element={
                    <StoreBoundary>
                      <ProblemLanding />
                    </StoreBoundary>
                  }
                />
                <Route
                  path="/system-design-interview"
                  element={
                    <StoreBoundary>
                      <SeoGuide />
                    </StoreBoundary>
                  }
                />
                <Route
                  path="/system-design-practice"
                  element={
                    <StoreBoundary>
                      <SeoGuide />
                    </StoreBoundary>
                  }
                />
                <Route
                  path="/ai-system-design-interview"
                  element={
                    <StoreBoundary>
                      <SeoGuide />
                    </StoreBoundary>
                  }
                />
                <Route
                  path="/create-problem"
                  element={
                    <StoreBoundary>
                      <CreateProblem />
                    </StoreBoundary>
                  }
                />
                <Route
                  path="/learning-paths"
                  element={
                    <StoreBoundary>
                      <LearningPaths />
                    </StoreBoundary>
                  }
                />
                <Route
                  path="/learning-paths/:slug"
                  element={
                    <StoreBoundary>
                      <LearningPath />
                    </StoreBoundary>
                  }
                />
                <Route
                  path="/diagrams"
                  element={
                    <StoreBoundary>
                      <MyDesigns />
                    </StoreBoundary>
                  }
                />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route
                  path="/playground/:id"
                  element={
                    <StoreBoundary>
                      <SystemDesignPlayground />
                    </StoreBoundary>
                  }
                />
                <Route
                  path="/public/:id"
                  element={
                    <StoreBoundary>
                      <SharedCanvasPage />
                    </StoreBoundary>
                  }
                />
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
