import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Events from './pages/Events.jsx'
import EventCreate from './pages/EventCreate.jsx'
import EventEdit from './pages/EventEdit.jsx'
import EventShow from './pages/EventShow.jsx'
import EventLinks from './pages/EventLinks.jsx'
import EventQR from './pages/EventQR.jsx'
import EventStats from './pages/EventStats.jsx'
import Users from './pages/Users.jsx'
import UserCreate from './pages/UserCreate.jsx'
import EventPage from './pages/EventPage.jsx'

function RequireAuth({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function GuestOnly({ children }) {
  const { user } = useAuth()
  return user ? <Navigate to="/admin/dashboard" replace /> : children
}

function RequireSuperAdmin({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'SUPER_ADMIN') return <Navigate to="/admin/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

          <Route path="/e/:slug" element={<EventPage />} />

          <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="events" element={<Events />} />
            <Route path="events/create" element={<EventCreate />} />
            <Route path="events/:id" element={<EventShow />} />
            <Route path="events/:id/edit" element={<EventEdit />} />
            <Route path="events/:id/links" element={<EventLinks />} />
            <Route path="events/:id/qr" element={<EventQR />} />
            <Route path="events/:id/stats" element={<EventStats />} />
            <Route path="users" element={<RequireSuperAdmin><Users /></RequireSuperAdmin>} />
            <Route path="users/create" element={<RequireSuperAdmin><UserCreate /></RequireSuperAdmin>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
