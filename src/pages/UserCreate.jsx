import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EDGE_BASE } from '../lib/supabase.js'
import Navbar from '../components/Navbar.jsx'
import Flash from '../components/Flash.jsx'

export default function UserCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ADMIN' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Tous les champs sont requis.'); return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.'); return
    }
    setLoading(true)
    try {
      const res = await fetch(`${EDGE_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_user', ...form }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erreur lors de la création'); return }
      navigate('/admin/users')
    } catch {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar title="Créer un administrateur" actions={
        <Link to="/admin/users" className="btn btn-light"><i className="bi bi-arrow-left me-1"></i>Retour</Link>
      } />

      <div className="page-content">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <Flash type="error" message={error} onDismiss={() => setError('')} />
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleSubmit} noValidate>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Nom complet *</label>
                    <input type="text" className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Email *</label>
                    <input type="email" className="form-control" value={form.email} onChange={e => set('email', e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Mot de passe *</label>
                    <div className="input-group">
                      <input
                        type={showPw ? 'text' : 'password'}
                        className="form-control"
                        value={form.password}
                        onChange={e => set('password', e.target.value)}
                        minLength={8}
                        required
                      />
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                        <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-medium">Rôle</label>
                    <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </div>
                  <div className="d-flex gap-2 justify-content-end">
                    <Link to="/admin/users" className="btn btn-light">Annuler</Link>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading
                        ? <><span className="spinner-border spinner-border-sm me-2"></span>Création...</>
                        : <><i className="bi bi-person-plus me-1"></i>Créer l'administrateur</>
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
