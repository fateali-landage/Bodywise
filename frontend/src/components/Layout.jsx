import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { BodyWiseProvider } from "../context/BodyWiseContext";
import { supabase } from "../services/supabaseClient";

export default function Layout({ user }) {
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
          <span className="display" style={{ fontWeight: 700 }}>
            BodyWise <span style={{ color: "var(--cyan)" }}>AI</span>
          </span>
          <span style={{ width: 32 }} />
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
            <Outlet />
          </main>
        </div>
      </div>
    </BodyWiseProvider>
  );
}
