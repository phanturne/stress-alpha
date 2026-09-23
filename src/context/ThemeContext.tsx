"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export type Theme = "cyber" | "light";

export const THEME_STORAGE_KEY = "stress_alpha_theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeToDocument(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  if (theme === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("cyber");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === "light" || stored === "cyber") {
        applyThemeToDocument(stored);
        Promise.resolve().then(() => {
          setThemeState(stored);
        });
      } else {
        // Fall back to DOM attribute if set by inline script
        const domTheme = document.documentElement.getAttribute(
          "data-theme"
        ) as Theme | null;
        if (domTheme === "light" || domTheme === "cyber") {
          Promise.resolve().then(() => {
            setThemeState(domTheme);
          });
        } else {
          applyThemeToDocument("cyber");
        }
      }
    } catch {
      // Fallback for private browsing or storage errors
      applyThemeToDocument("cyber");
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDocument(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => {
      const nextTheme: Theme = prevTheme === "cyber" ? "light" : "cyber";
      applyThemeToDocument(nextTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Ignore storage errors
      }
      return nextTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
