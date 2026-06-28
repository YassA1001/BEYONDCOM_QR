import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import Navbar from '../components/Navbar.jsx'
import Flash from '../components/Flash.jsx'
import slugify from 'slugify'

async function generateSlug(name) {
  const base = slugify(name, { lower: true, strict: true })
  let slug = base
  let i = 1
  while (true) {
    const { data } = await supabase.from('events').select('id').eq('slug', slug).limit(1)
    if (!data || data.length === 0) return slug
    slug = `${base}-${i++}`
  }
}

export default function EventCreate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', description: '', location: '', city: '',
    startDate: '', endDate: '', logo: '', banner: '',
    primaryColor: '#0ea5e9', isActive: true,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Le nom est requis.'); return }
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      setError('La date de fin doit être après la date de début.'); return
    }
    setLoading(true)
    try {
      const slug = await generateSlug(form.name)
      const now = new Date().toISOString()
      const { data, error: err } = await supabase.from('events').insert({
        name: form.name.trim(),
        slug,
        description: form.description || null,
        location: form.location || null,
        city: form.city || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        logo: form.logo || null,
        banner: form.banner || null,
        primaryColor: form.primaryColor || '#0ea5e9',
        isActive: form.isActive,
        createdById: user?.id || null,
        createdAt: now,
        updatedAt: now,
      }).select('id').single()
      if (err) { setError(err.message); return }
      navigate(`/admin/events/${data.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar title="Créer un événement" actions={
        <Link to="/admin/events" className="btn btn-light"><i className="bi bi-arrow-left me-1"></i> Retour</Link>
      } />
      <div className="page-content">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <Flash type="error" message={error} onDismiss={() => setError('')} />
            <form onSubmit={handleSubmit} noValidate>
              <div className="card mb-4">
                <div className="card-header"><h6 className="card-title mb-0">Informations générales</h6></div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-medium">Nom de l'événement *</label>
                    <input type="text" className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Description</label>
                    <textarea className="form-control" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Ville</label>
                      <input type="text" className="form-control" value={form.city} onChange={e => set('city', e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Lieu / Salle</label>
                      <input type="text" className="form-control" value={form.location} onChange={e => set('location', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mb-4">
                <div className="card-header"><h6 className="card-title mb-0">Dates</h6></div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Date de début</label>
                      <input type="datetime-local" className="form-control" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">Date de fin</label>
                      <input type="datetime-local" className="form-control" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mb-4">
                <div className="card-header"><h6 className="card-title mb-0">Apparence</h6></div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-medium">URL du logo</label>
                      <input type="url" className="form-control" placeholder="https://..." value={form.logo} onChange={e => set('logo', e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium">URL de la bannière</label>
                      <input type="url" className="form-control" placeholder="https://..." value={form.banner} onChange={e => set('banner', e.target.value)} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium">Couleur principale</label>
                      <div className="input-group">
                        <input type="color" className="form-control form-control-color" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} />
                        <input type="text" className="form-control" value={form.primaryColor} onChange={e => set('primaryColor', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mb-4">
                <div className="card-body">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isActive"
                      checked={form.isActive}
                      onChange={e => set('isActive', e.target.checked)}
                    />
                    <label className="form-check-label fw-medium" htmlFor="isActive">Événement actif (page publique visible)</label>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <Link to="/admin/events" className="btn btn-light">Annuler</Link>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Création...</> : <><i className="bi bi-check-lg me-1"></i>Créer l'événement</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
