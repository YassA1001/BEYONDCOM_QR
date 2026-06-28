import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Navbar from '../components/Navbar.jsx'
import Flash from '../components/Flash.jsx'
import { useConfirm } from '../components/ConfirmModal.jsx'
import { iconFor, LINK_TYPES } from '../utils/icons.js'

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function EventLinks() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dragIdx, setDragIdx] = useState(null)
  const [form, setForm] = useState({ title: '', type: 'website', url: '', color: COLORS[0] })
  const { confirm, ConfirmModal } = useConfirm()

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [evRes, linksRes] = await Promise.all([
      supabase.from('events').select('id, name').eq('id', id).single(),
      supabase.from('event_links').select('*').eq('eventId', id).order('sortOrder'),
    ])
    setEvent(evRes.data)
    setLinks(linksRes.data || [])
    setLoading(false)
  }

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function openCreate() {
    setEditId(null)
    setForm({ title: '', type: 'website', url: '', color: COLORS[links.length % COLORS.length] })
    setShowForm(true)
  }

  function openEdit(lk) {
    setEditId(lk.id)
    setForm({ title: lk.title, type: lk.type, url: lk.url, color: lk.color || COLORS[0] })
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.url.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    try {
      if (editId) {
        await supabase.from('event_links').update({
          title: form.title, type: form.type, url: form.url,
          color: form.color, icon: iconFor(form.type), updatedAt: now,
        }).eq('id', editId)
        setLinks(ls => ls.map(l => l.id === editId ? { ...l, ...form, icon: iconFor(form.type) } : l))
        setFlash({ type: 'success', message: 'Lien mis à jour' })
      } else {
        const maxOrder = links.reduce((m, l) => Math.max(m, l.sortOrder || 0), 0)
        const { data } = await supabase.from('event_links').insert({
          eventId: parseInt(id), title: form.title, type: form.type,
          url: form.url, color: form.color, icon: iconFor(form.type),
          sortOrder: maxOrder + 1, isActive: true, createdAt: now, updatedAt: now,
        }).select('*')
        if (data) setLinks(ls => [...ls, data[0]])
        setFlash({ type: 'success', message: 'Lien ajouté' })
      }
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function handleToggle(lk) {
    await supabase.from('event_links').update({ isActive: !lk.isActive, updatedAt: new Date().toISOString() }).eq('id', lk.id)
    setLinks(ls => ls.map(l => l.id === lk.id ? { ...l, isActive: !l.isActive } : l))
  }

  async function handleDelete(lk) {
    const ok = await confirm(`Supprimer le lien "${lk.title}" ?`)
    if (!ok) return
    await supabase.from('event_links').delete().eq('id', lk.id)
    setLinks(ls => ls.filter(l => l.id !== lk.id))
    setFlash({ type: 'success', message: 'Lien supprimé' })
  }

  async function handleDrop(targetIdx) {
    if (dragIdx === null || dragIdx === targetIdx) return
    const reordered = [...links]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    const updated = reordered.map((l, i) => ({ ...l, sortOrder: i }))
    setLinks(updated)
    setDragIdx(null)
    const now = new Date().toISOString()
    await Promise.all(updated.map(l => supabase.from('event_links').update({ sortOrder: l.sortOrder, updatedAt: now }).eq('id', l.id)))
  }

  if (loading) return (
    <>
      <Navbar title="Liens" />
      <div className="page-content text-center py-5"><div className="spinner-border text-primary"></div></div>
    </>
  )

  return (
    <>
      <Navbar title={`Liens – ${event?.name || ''}`} actions={
        <div className="d-flex gap-2">
          <Link to={`/admin/events/${id}`} className="btn btn-light"><i className="bi bi-arrow-left me-1"></i>Retour</Link>
          <button className="btn btn-primary" onClick={openCreate}><i className="bi bi-plus-lg me-1"></i>Ajouter un lien</button>
        </div>
      } />

      <div className="page-content">
        <Flash type={flash?.type} message={flash?.message} onDismiss={() => setFlash(null)} />

        {showForm && (
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="card-title mb-0">{editId ? 'Modifier le lien' : 'Nouveau lien'}</h6>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowForm(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Titre *</label>
                    <input type="text" className="form-control" value={form.title} onChange={e => setF('title', e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-medium">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setF('type', e.target.value)}>
                      {LINK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label fw-medium">URL *</label>
                    <input type="url" className="form-control" value={form.url} onChange={e => setF('url', e.target.value)} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-medium">Couleur</label>
                    <div className="d-flex gap-2 flex-wrap mt-1">
                      {COLORS.map(c => (
                        <button key={c} type="button"
                          className={`rounded-circle border-0 ${form.color === c ? 'outline' : ''}`}
                          style={{ width: 28, height: 28, background: c, outline: form.color === c ? '3px solid #334155' : 'none', outlineOffset: 2 }}
                          onClick={() => setF('color', c)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-2 justify-content-end mt-3">
                  <button type="button" className="btn btn-light" onClick={() => setShowForm(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="spinner-border spinner-border-sm"></span> : editId ? 'Enregistrer' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {links.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-link-45deg display-4 text-secondary"></i>
            <p className="mt-3 text-secondary">Aucun lien pour cet événement</p>
            <button className="btn btn-primary" onClick={openCreate}>Ajouter le premier lien</button>
          </div>
        ) : (
          <div className="card">
            <div className="card-body p-0">
              {links.map((lk, idx) => (
                <div
                  key={lk.id}
                  className={`d-flex align-items-center gap-3 p-3 border-bottom ${dragIdx === idx ? 'bg-primary bg-opacity-10' : ''}`}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(idx)}
                  style={{ cursor: 'grab' }}
                >
                  <i className="bi bi-grip-vertical text-secondary" style={{ fontSize: 18, flexShrink: 0 }}></i>
                  <div className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, background: lk.color || '#e2e8f0', flexShrink: 0 }}>
                    <i className={`bi ${iconFor(lk.type)}`} style={{ color: '#fff', fontSize: 16 }}></i>
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <div className="fw-medium text-truncate">{lk.title}</div>
                    <div className="text-secondary small text-truncate">{lk.url}</div>
                  </div>
                  <span className={`badge ${lk.isActive ? 'bg-success' : 'bg-secondary'} d-none d-sm-inline`}>
                    {lk.isActive ? 'Actif' : 'Inactif'}
                  </span>
                  <button className="btn btn-icon btn-ghost" onClick={() => openEdit(lk)} title="Modifier">
                    <i className="bi bi-pencil text-secondary"></i>
                  </button>
                  <button className="btn btn-icon btn-ghost" onClick={() => handleToggle(lk)} title="Activer/Désactiver">
                    <i className={`bi ${lk.isActive ? 'bi-toggle-on text-success' : 'bi-toggle-off text-secondary'}`}></i>
                  </button>
                  <button className="btn btn-icon btn-ghost text-danger" onClick={() => handleDelete(lk)} title="Supprimer">
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <ConfirmModal />
    </>
  )
}
