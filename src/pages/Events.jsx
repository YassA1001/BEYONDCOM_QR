import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Navbar from '../components/Navbar.jsx'
import Flash from '../components/Flash.jsx'
import { useConfirm } from '../components/ConfirmModal.jsx'
import { formatDate } from '../utils/formatDate.js'

export default function Events() {
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState(null)
  const { confirm, ConfirmModal } = useConfirm()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('id, name, slug, city, startDate, endDate, isActive, primaryColor, logo, banner, createdAt')
      .order('createdAt', { ascending: false })
    setEvents(data || [])
    setLoading(false)
  }

  async function handleToggle(ev) {
    await supabase.from('events').update({ isActive: !ev.isActive, updatedAt: new Date().toISOString() }).eq('id', ev.id)
    setEvents(es => es.map(e => e.id === ev.id ? { ...e, isActive: !e.isActive } : e))
    setFlash({ type: 'success', message: `Événement ${!ev.isActive ? 'activé' : 'désactivé'}` })
  }

  async function handleDelete(ev) {
    const ok = await confirm(`Supprimer l'événement "${ev.name}" ? Cette action est irréversible.`)
    if (!ok) return
    await supabase.from('events').delete().eq('id', ev.id)
    setEvents(es => es.filter(e => e.id !== ev.id))
    setFlash({ type: 'success', message: 'Événement supprimé' })
  }

  const filtered = events.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.city || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Navbar title="Événements" actions={
        <Link to="/admin/events/create" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1"></i> Nouvel événement
        </Link>
      } />

      <div className="page-content">
        <Flash type={flash?.type} message={flash?.message} onDismiss={() => setFlash(null)} />

        <div className="mb-4">
          <div className="input-group" style={{ maxWidth: 360 }}>
            <span className="input-group-text bg-white"><i className="bi bi-search text-secondary"></i></span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Rechercher un événement..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-calendar-x display-4 text-secondary"></i>
            <p className="mt-3 text-secondary">{search ? 'Aucun résultat' : 'Aucun événement créé'}</p>
            {!search && <Link to="/admin/events/create" className="btn btn-primary">Créer le premier événement</Link>}
          </div>
        ) : (
          <div className="row g-4">
            {filtered.map(ev => (
              <div className="col-md-6 col-xl-4" key={ev.id}>
                <div className="event-card">
                  <div
                    className="event-card-banner"
                    style={{
                      background: ev.banner
                        ? `url(${ev.banner}) center/cover`
                        : `linear-gradient(135deg, ${ev.primaryColor || '#0ea5e9'}, ${ev.primaryColor || '#0ea5e9'}aa)`,
                    }}
                  >
                    <span className={`badge ${ev.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {ev.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="event-card-body">
                    {ev.logo && (
                      <img src={ev.logo} alt="" className="event-card-logo" />
                    )}
                    <h5 className="event-card-title">{ev.name}</h5>
                    {ev.city && <p className="text-secondary small mb-1"><i className="bi bi-geo-alt me-1"></i>{ev.city}</p>}
                    <p className="text-secondary small mb-3">{formatDate(ev.startDate)}</p>

                    <div className="d-flex gap-2 flex-wrap">
                      <Link to={`/admin/events/${ev.id}`} className="btn btn-sm btn-light" title="Voir">
                        <i className="bi bi-eye"></i>
                      </Link>
                      <Link to={`/admin/events/${ev.id}/links`} className="btn btn-sm btn-light" title="Liens">
                        <i className="bi bi-link-45deg"></i>
                      </Link>
                      <Link to={`/admin/events/${ev.id}/qr`} className="btn btn-sm btn-light" title="QR Code">
                        <i className="bi bi-qr-code"></i>
                      </Link>
                      <Link to={`/admin/events/${ev.id}/stats`} className="btn btn-sm btn-light" title="Stats">
                        <i className="bi bi-bar-chart"></i>
                      </Link>
                      <Link to={`/admin/events/${ev.id}/edit`} className="btn btn-sm btn-light" title="Modifier">
                        <i className="bi bi-pencil"></i>
                      </Link>
                      <button
                        className="btn btn-sm btn-light ms-auto"
                        title={ev.isActive ? 'Désactiver' : 'Activer'}
                        onClick={() => handleToggle(ev)}
                      >
                        <i className={`bi ${ev.isActive ? 'bi-toggle-on text-success' : 'bi-toggle-off text-secondary'}`}></i>
                      </button>
                      <button className="btn btn-sm btn-light text-danger" title="Supprimer" onClick={() => handleDelete(ev)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal />
    </>
  )
}
