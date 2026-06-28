import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Navbar from '../components/Navbar.jsx'
import Flash from '../components/Flash.jsx'
import { useConfirm } from '../components/ConfirmModal.jsx'
import { formatDate, formatRange } from '../utils/formatDate.js'
import { iconFor } from '../utils/icons.js'

export default function EventShow() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [links, setLinks] = useState([])
  const [scanCount, setScanCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState(null)
  const { confirm, ConfirmModal } = useConfirm()

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [evRes, linksRes, scansRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('event_links').select('*').eq('eventId', id).order('sortOrder'),
      supabase.from('scan_logs').select('id', { count: 'exact', head: true }).eq('eventId', id),
    ])
    setEvent(evRes.data)
    setLinks(linksRes.data || [])
    setScanCount(scansRes.count || 0)
    setLoading(false)
  }

  async function handleToggleLink(lk) {
    await supabase.from('event_links').update({ isActive: !lk.isActive, updatedAt: new Date().toISOString() }).eq('id', lk.id)
    setLinks(ls => ls.map(l => l.id === lk.id ? { ...l, isActive: !l.isActive } : l))
  }

  async function handleDeleteLink(lk) {
    const ok = await confirm(`Supprimer le lien "${lk.title}" ?`)
    if (!ok) return
    await supabase.from('event_links').delete().eq('id', lk.id)
    setLinks(ls => ls.filter(l => l.id !== lk.id))
    setFlash({ type: 'success', message: 'Lien supprimé' })
  }

  const publicUrl = `${window.location.origin}/e/${event?.slug}`

  if (loading) return (
    <>
      <Navbar title="Événement" />
      <div className="page-content text-center py-5"><div className="spinner-border text-primary"></div></div>
    </>
  )

  if (!event) return (
    <>
      <Navbar title="Événement introuvable" />
      <div className="page-content"><p className="text-secondary">Cet événement n'existe pas.</p></div>
    </>
  )

  return (
    <>
      <Navbar title={event.name} actions={
        <div className="d-flex gap-2">
          <Link to="/admin/events" className="btn btn-light"><i className="bi bi-arrow-left me-1"></i>Retour</Link>
          <Link to={`/admin/events/${id}/edit`} className="btn btn-light"><i className="bi bi-pencil me-1"></i>Modifier</Link>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <i className="bi bi-box-arrow-up-right me-1"></i>Voir la page
          </a>
        </div>
      } />

      <div className="page-content">
        <Flash type={flash?.type} message={flash?.message} onDismiss={() => setFlash(null)} />

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card mb-4">
              {event.banner && (
                <img src={event.banner} alt="" className="card-img-top" style={{ height: 140, objectFit: 'cover' }} />
              )}
              <div className="card-body">
                {event.logo && <img src={event.logo} alt="" style={{ height: 48, maxWidth: 120, objectFit: 'contain', marginBottom: 12 }} />}
                <h5 className="fw-semibold">{event.name}</h5>
                {event.city && <p className="text-secondary mb-1"><i className="bi bi-geo-alt me-1"></i>{event.city}</p>}
                {event.location && <p className="text-secondary mb-1"><i className="bi bi-building me-1"></i>{event.location}</p>}
                <p className="text-secondary mb-2"><i className="bi bi-calendar me-1"></i>{formatRange(event.startDate, event.endDate)}</p>
                {event.description && <p className="text-secondary small mb-3">{event.description}</p>}
                <span className={`badge ${event.isActive ? 'bg-success' : 'bg-secondary'}`}>
                  {event.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Scans QR</span>
                  <strong>{scanCount}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary">Liens actifs</span>
                  <strong>{links.filter(l => l.isActive).length}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Créé le</span>
                  <strong>{formatDate(event.createdAt)}</strong>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="small text-secondary mb-2">URL publique</p>
                <div className="input-group input-group-sm">
                  <input type="text" className="form-control" value={publicUrl} readOnly />
                  <button className="btn btn-outline-secondary" onClick={() => navigator.clipboard.writeText(publicUrl)}>
                    <i className="bi bi-clipboard"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0">Liens de l'événement</h6>
                <Link to={`/admin/events/${id}/links`} className="btn btn-sm btn-primary">
                  <i className="bi bi-plus-lg me-1"></i>Gérer les liens
                </Link>
              </div>
              {links.length === 0 ? (
                <div className="card-body text-center py-4">
                  <i className="bi bi-link-45deg display-5 text-secondary"></i>
                  <p className="mt-2 text-secondary">Aucun lien ajouté</p>
                  <Link to={`/admin/events/${id}/links`} className="btn btn-primary btn-sm">Ajouter des liens</Link>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {links.map(lk => (
                    <div key={lk.id} className="list-group-item d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 36, height: 36, background: lk.color || '#e2e8f0', flexShrink: 0 }}>
                        <i className={`bi ${iconFor(lk.type)} text-white`} style={{ fontSize: 16 }}></i>
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-medium text-truncate">{lk.title}</div>
                        <div className="text-secondary small text-truncate">{lk.url}</div>
                      </div>
                      <span className={`badge ${lk.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {lk.isActive ? 'Actif' : 'Inactif'}
                      </span>
                      <button className="btn btn-icon btn-ghost" onClick={() => handleToggleLink(lk)}>
                        <i className={`bi ${lk.isActive ? 'bi-toggle-on text-success' : 'bi-toggle-off text-secondary'}`}></i>
                      </button>
                      <button className="btn btn-icon btn-ghost text-danger" onClick={() => handleDeleteLink(lk)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="row g-3 mt-1">
              {[
                { icon: 'bi-qr-code', label: 'QR Code', to: `/admin/events/${id}/qr`, color: 'primary' },
                { icon: 'bi-bar-chart', label: 'Statistiques', to: `/admin/events/${id}/stats`, color: 'success' },
                { icon: 'bi-link-45deg', label: 'Gérer les liens', to: `/admin/events/${id}/links`, color: 'warning' },
                { icon: 'bi-pencil', label: 'Modifier', to: `/admin/events/${id}/edit`, color: 'info' },
              ].map(a => (
                <div className="col-6 col-lg-3" key={a.label}>
                  <Link to={a.to} className={`card text-center py-3 text-decoration-none text-${a.color} card-hover`}>
                    <i className={`bi ${a.icon} fs-4 mb-1`}></i>
                    <div className="small fw-medium">{a.label}</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal />
    </>
  )
}
