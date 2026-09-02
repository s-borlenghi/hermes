import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AppShell() {
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div className="app-nav-brand">
          <span className="dot" /> Hermes
        </div>
        <div className="app-nav-links">
          <NavLink to="/app" end>
            Dashboard
          </NavLink>
          <NavLink to="/app/applications">Applications</NavLink>
          <NavLink to="/app/companies">Companies</NavLink>
        </div>
        <div className="app-nav-user">
          <span className="mono">{user?.email}</span>
          <button type="button" className="btn ghost small" onClick={logout}>
            Log out
          </button>
        </div>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
