import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true },
  { to: "/analyze", label: "Analyze", icon: "🫀" },
  { to: "/results", label: "Results", icon: "📊" },
  { to: "/diet", label: "Diet & Calories", icon: "🥗" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function Sidebar({ user, onSignOut, open, onNavigate }) {
  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="sidebar-brand">
        <div className="logo">🧬</div>
        <div>
          <h1>BodyWise</h1>
          <p>Intelligence</p>
        </div>
      </div>

      <div>
        <div className="nav-section-label">Workspace</div>
        <nav className="nav-list">
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        {user?.email && (
          <div>
            <div className="section-label" style={{ marginBottom: 4 }}>Signed in</div>
            <div className="user-email">{user.email}</div>
          </div>
        )}
        <button className="btn btn-ghost" style={{ marginTop: 0 }} onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
