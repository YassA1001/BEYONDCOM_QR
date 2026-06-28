import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { formatRange, formatDate } from '../utils/formatDate.js'
import { iconFor } from '../utils/icons.js'

export default function EventPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { load() }, [slug])

  async function load() {
    setLoading(true)
    const { data: ev } = await supabase.from('events').select('*').eq('slug', slug).eq('isActive', true).single()
    if (!ev) { setNotFound(true); setLoading(false); return }
    setEvent(ev)

    const { data: lks } = await supabase
      .from('event_links')
      .select('*')
      .eq('eventId', ev.id)
      .eq('isActive', true)
      .order('sortOrder')
    setLinks(lks || [])

    // Log scan (fire and forget)
    const ua = navigator.userAgent
    const deviceType = /Mobi|Android/i.test(ua) ? 'mobile' : /Tablet|iPad/i.test(ua) ? 'tablet' : 'desktop'
    supabase.from('scan_logs').insert({
      eventId: ev.id,
      userAgent: ua,
      deviceType,
      scannedAt: new Date().toISOString(),
    }).then(() => {})

    setLoading(false)
  }

  async function handleLinkClick(lk) {
    // Log click (fire and forget)
    supabase.from('click_logs').insert({
      eventId: event.id,
      eventLinkId: lk.id,
      userAgent: navigator.userAgent,
      clickedAt: new Date().toISOString(),
    }).then(() => {})
    window.open(lk.url, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border" style={{ color: '#0ea5e9' }}></div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 text-center p-4">
        <i className="bi bi-calendar-x" style={{ fontSize: 64, color: '#94a3b8' }}></i>
        <h2 className="mt-3 fw-bold">Page introuvable</h2>
        <p className="text-secondary">Cet événement n'existe pas ou n'est plus disponible.</p>
      </div>
    )
  }

  const color = event.primaryColor || '#0ea5e9'

  return (
    <div className="event-public" style={{ '--primary': color }}>
      {/* Banner */}
      <div
        className="event-public-banner"
        style={{
          background: event.banner
            ? `url(${event.banner}) center/cover no-repeat`
            : `linear-gradient(135deg, ${color}, ${color}99)`,
        }}
      >
        <div className="event-public-banner-overlay"></div>
        {event.logo && (
          <img src={event.logo} alt={event.name} className="event-public-logo" />
        )}
      </div>

      {/* Content */}
      <div className="event-public-content">
        <h1 className="event-public-title">{event.name}</h1>

        {(event.city || event.location) && (
          <p className="event-public-meta">
            <i className="bi bi-geo-alt me-1"></i>
            {[event.city, event.location].filter(Boolean).join(' · ')}
          </p>
        )}

        {(event.startDate || event.endDate) && (
          <p className="event-public-meta">
            <i className="bi bi-calendar me-1"></i>
            {formatRange(event.startDate, event.endDate)}
          </p>
        )}

        {event.description && (
          <p className="event-public-description">{event.description}</p>
        )}

        {/* Links */}
        <div className="event-public-links">
          {links.length === 0 ? (
            <p className="text-center text-secondary">Aucun lien disponible pour cet événement.</p>
          ) : (
            links.map((lk, i) => (
              <button
                key={lk.id}
                className="event-link-btn"
                style={{
                  '--btn-color': lk.color || color,
                  animationDelay: `${i * 80}ms`,
                }}
                onClick={() => handleLinkClick(lk)}
              >
                <span className="event-link-icon" style={{ background: lk.color || color }}>
                  <i className={`bi ${iconFor(lk.type)}`}></i>
                </span>
                <span className="event-link-title">{lk.title}</span>
                <i className="bi bi-chevron-right event-link-arrow"></i>
              </button>
            ))
          )}
        </div>

        <footer className="event-public-footer">
          <span>Propulsé par <strong>BeyondCom</strong></span>
        </footer>
      </div>
    </div>
  )
}
