import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./index.css";
import App from "./App.tsx";
import AppLoadErrorFallback from "./components/AppLoadErrorFallback";
import { initMonitoring, Sentry } from "./monitoring";

initMonitoring();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<AppLoadErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
