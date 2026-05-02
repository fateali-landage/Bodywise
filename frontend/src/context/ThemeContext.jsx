/**
 * ThemeContext.jsx
 * Provides dark/light mode toggle with localStorage persistence.
 * Default mode: dark. Applies 'light' class to <html> in light mode.
 */
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

const THEME_KEY = "bw_theme";

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    // Default to dark if nothing stored
    return stored !== "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("light");
      localStorage.setItem(THEME_KEY, "dark");
    } else {
      root.classList.add("light");
      localStorage.setItem(THEME_KEY, "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((v) => !v);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
