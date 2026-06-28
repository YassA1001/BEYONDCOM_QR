import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

export default function AdminLayout() {
  function handleBackdropClick() {
    document.getElementById('sidebar')?.classList.remove('open')
    document.getElementById('sidebar-backdrop')?.classList.remove('show')
  }

  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="sidebar-backdrop" id="sidebar-backdrop" onClick={handleBackdropClick}></div>
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}
