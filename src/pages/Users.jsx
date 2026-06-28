import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Flash from '../components/Flash.jsx'
import { useConfirm } from '../components/ConfirmModal.jsx'
import { formatDate } from '../utils/formatDate.js'

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState(null)
  const { confirm, ConfirmModal } = useConfirm()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('users').select('id, name, email, role, isActive, createdAt').order('createdAt')
    setUsers(data || [])
    setLoading(false)
  }

  async function handleToggle(u) {
    await supabase.from('users').update({ isActive: !u.isActive, updatedAt: new Date().toISOString() }).eq('id', u.id)
    setUsers(us => us.map(x => x.id === u.id ? { ...x, isActive: !x.isActive } : x))
    setFlash({ type: 'success', message: `Compte ${!u.isActive ? 'activé' : 'désactivé'}` })
  }

  async function handleDelete(u) {
    const superAdmins = users.filter(x => x.role === 'SUPER_ADMIN' && x.isActive)
    if (u.role === 'SUPER_ADMIN' && superAdmins.length <= 1) {
      setFlash({ type: 'error', message: 'Impossible de supprimer le dernier super admin.' })
      return
    }
    if (u.id === currentUser?.id) {
      setFlash({ type: 'error', message: 'Vous ne pouvez pas supprimer votre propre compte.' })
      return
    }
    const ok = await confirm(`Supprimer le compte de "${u.name}" ?`)
    if (!ok) return
    await supabase.from('users').delete().eq('id', u.id)
    setUsers(us => us.filter(x => x.id !== u.id))
    setFlash({ type: 'success', message: 'Compte supprimé' })
  }

  return (
    <>
      <Navbar title="Administrateurs" actions={
        <Link to="/admin/users/create" className="btn btn-primary">
          <i className="bi bi-person-plus me-1"></i> Ajouter un admin
        </Link>
      } />

      <div className="page-content">
        <Flash type={flash?.type} message={flash?.message} onDismiss={() => setFlash(null)} />

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : (
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold"
                            style={{ width: 34, height: 34, flexShrink: 0 }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="fw-medium">{u.name}</span>
                          {u.id === currentUser?.id && <span className="badge bg-info text-white">Vous</span>}
                        </div>
                      </td>
                      <td className="text-secondary">{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'SUPER_ADMIN' ? 'bg-primary' : 'bg-secondary'}`}>
                          {u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'bg-success' : 'bg-danger'}`}>
                          {u.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="text-secondary">{formatDate(u.createdAt)}</td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          {u.id !== currentUser?.id && (
                            <button
                              className="btn btn-sm btn-light"
                              title={u.isActive ? 'Désactiver' : 'Activer'}
                              onClick={() => handleToggle(u)}
                            >
                              <i className={`bi ${u.isActive ? 'bi-person-dash' : 'bi-person-check'}`}></i>
                            </button>
                          )}
                          {u.id !== currentUser?.id && (
                            <button className="btn btn-sm btn-light text-danger" title="Supprimer" onClick={() => handleDelete(u)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <ConfirmModal />
    </>
  )
}
