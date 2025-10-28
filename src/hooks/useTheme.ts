import { useEffect, useLayoutEffect, useState } from "react";
import type { ColorMode } from "@xyflow/react";

export type Theme = "system" | "light" | "dark";

const isValidTheme = (v: unknown): v is Theme =>
  v === "system" || v === "light" || v === "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize theme state from localStorage immediately
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("theme");
    return isValidTheme(stored) ? stored : "light";
  });

  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  useLayoutEffect(() => {
    const root = document.documentElement;

    const apply = (t: Theme) => {
      if (t === "system") {
        root.classList.toggle("dark", systemDark);
      } else {
        root.classList.toggle("dark", t === "dark");
      }
    };

    apply(theme);

    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme, systemDark]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // map to @xyflow/react ColorMode
  const flowColorMode = ((): ColorMode => {
    if (theme === "system") {
      return systemDark ? "dark" : "light";
    }
    return theme as ColorMode;
  })();

  return { theme, setTheme, flowColorMode };
}
