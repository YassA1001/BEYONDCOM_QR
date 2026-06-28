export default function Navbar({ title, actions }) {
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar')
    const backdrop = document.getElementById('sidebar-backdrop')
    sidebar?.classList.toggle('open')
    backdrop?.classList.toggle('show')
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="btn btn-icon btn-ghost d-lg-none me-2" onClick={toggleSidebar}>
          <i className="bi bi-list"></i>
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>
      <div className="topbar-right">
        {actions}
      </div>
    </header>
  )
}
