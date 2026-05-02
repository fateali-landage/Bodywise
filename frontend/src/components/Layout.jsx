import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { BodyWiseProvider } from "../context/BodyWiseContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { supabase } from "../services/supabaseClient";

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      id="theme-toggle-btn"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <span className="text-[14px]">{isDark ? "☀️" : "🌙"}</span>
      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}

function AppShell({ user }) {
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <BodyWiseProvider user={user}>
      <div className="mesh-bg">
        <div className="topbar">
          <button
            className="topbar-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <span className="display font-bold text-[var(--text-primary)]">
            BodyWise <span className="text-[var(--cyan)]">AI</span>
          </span>
          <ThemeToggle />
        </div>

        <div className="app-shell">
          <Sidebar
            user={user}
            onSignOut={signOut}
            open={open}
            onNavigate={() => setOpen(false)}
          />
          <div
            className={`sidebar-overlay${open ? " show" : ""}`}
            onClick={() => setOpen(false)}
          />
          <main className="main-content">
            {/* Desktop theme toggle in top-right of main area */}
            <div className="hidden md:flex justify-end mb-2 sticky top-0 z-[3] pointer-events-none">
              <div className="pointer-events-auto">
                <ThemeToggle />
              </div>
            </div>
            <Outlet />
          </main>
        </div>
      </div>
    </BodyWiseProvider>
  );
}

export default function Layout({ user }) {
  return (
    <ThemeProvider>
      <AppShell user={user} />
    </ThemeProvider>
  );
}
