import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <i className="bi bi-qr-code-scan"></i>
        </div>
        <div>
          <div className="sidebar-brand-name">BeyondCom</div>
          <div className="sidebar-brand-sub">QR Event Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>

        <NavLink to="/admin/dashboard" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <i className="bi bi-grid-1x2-fill sidebar-icon"></i>
          <span>Tableau de bord</span>
        </NavLink>

        <NavLink to="/admin/events" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          <i className="bi bi-calendar-event-fill sidebar-icon"></i>
          <span>Événements</span>
        </NavLink>

        {user?.role === 'SUPER_ADMIN' && (
          <>
            <div className="sidebar-section-label mt-3">Administration</div>
            <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <i className="bi bi-people-fill sidebar-icon"></i>
              <span>Administrateurs</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-role">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}</div>
        </div>
        <button
          className="btn btn-icon btn-ghost ms-auto"
          onClick={handleLogout}
          title="Déconnexion"
        >
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </aside>
  )
}
