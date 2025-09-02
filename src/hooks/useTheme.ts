import { useEffect, useState } from "react";
import type { ColorMode } from "@xyflow/react";

export type Theme = "system" | "light" | "dark";

const isValidTheme = (v: unknown): v is Theme =>
  v === "system" || v === "light" || v === "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (isValidTheme(stored)) return stored;
  return "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;

    const apply = (t: Theme) => {
      if (t === "system") {
        const prefersDark =
          typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", !!prefersDark);
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
  }, [theme]);

  // map to @xyflow/react ColorMode; v12 commonly uses "auto" for system
  const flowColorMode = ((): ColorMode => {
    return theme as ColorMode;
  })();

  return { theme, setTheme, flowColorMode };
}
