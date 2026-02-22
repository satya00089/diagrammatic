import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";

import "@xyflow/react/dist/style.css";
import "./index.css";
import App from "./App.tsx";

// Rewrite legacy hash-based URLs (e.g. /#/solutions/<id>) produced by the
// old GitHub Pages deployment so that BrowserRouter can match routes.
// This must run before React mounts so the router sees the correct pathname.
(() => {
  const hash = window.location.hash || "";
  if (hash.startsWith("#/")) {
    const second = hash.indexOf("#", 1);
    const path = second > 0 ? hash.slice(1, second) : hash.slice(1);
    const fragment = second > 0 ? "#" + hash.slice(second + 1) : "";
    window.history.replaceState(null, document.title, path + fragment + window.location.search);
  }
})();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
