import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import { Chart, registerables } from 'chart.js'
import { supabase } from '../lib/supabase.js'
import Navbar from '../components/Navbar.jsx'
import { formatDate } from '../utils/formatDate.js'
import { iconFor, osIcon, browserIcon } from '../utils/icons.js'

Chart.register(...registerables)

const RANGES = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: 'all', label: 'Tout' },
]

function getRangeStart(range) {
  const d = new Date()
  if (range === 'today') { d.setHours(0, 0, 0, 0); return d.toISOString() }
  if (range === '7d') { d.setDate(d.getDate() - 7); return d.toISOString() }
  if (range === '30d') { d.setDate(d.getDate() - 30); return d.toISOString() }
  return null
}

function countBy(arr, key) {
  const m = {}
  arr.forEach(r => { const v = r[key] || 'Inconnu'; m[v] = (m[v] || 0) + 1 })
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8)
}

export default function EventStats() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [range, setRange] = useState('7d')
  const [scans, setScans] = useState([])
  const [clicks, setClicks] = useState([])
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadEvent() }, [id])
  useEffect(() => { if (event) loadStats() }, [range, event])

  async function loadEvent() {
    const { data } = await supabase.from('events').select('*').eq('id', id).single()
    setEvent(data)
  }

  async function loadStats() {
    setLoading(true)
    const since = getRangeStart(range)
    let scansQ = supabase.from('scan_logs').select('*').eq('eventId', id)
    let clicksQ = supabase.from('click_logs').select('*').eq('eventId', id)
    if (since) { scansQ = scansQ.gte('scannedAt', since); clicksQ = clicksQ.gte('clickedAt', since) }

    const [scansRes, clicksRes, linksRes] = await Promise.all([
      scansQ.order('scannedAt', { ascending: false }),
      clicksQ,
      supabase.from('event_links').select('id, title, type, color').eq('eventId', id),
    ])
    setScans(scansRes.data || [])
    setClicks(clicksRes.data || [])
    setLinks(linksRes.data || [])
    setLoading(false)
  }

  const totalScans = scans.length
  const totalClicks = clicks.length
  const clickRate = totalScans > 0 ? Math.round((totalClicks / totalScans) * 100) : 0

  // 7-day scan series
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0); days.push(d)
  }
  const scanSeries = days.map(d => scans.filter(s => new Date(s.scannedAt).toDateString() === d.toDateString()).length)

  const scanChartData = {
    labels: days.map(d => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
    datasets: [{
      label: 'Scans',
      data: scanSeries,
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14,165,233,0.1)',
      fill: true, tension: 0.4,
    }],
  }

  const clicksByLink = links.map(lk => ({
    ...lk,
    count: clicks.filter(c => c.eventLinkId === lk.id).length,
  })).sort((a, b) => b.count - a.count)

  const deviceCounts = countBy(scans, 'deviceType')
  const osCounts = countBy(scans, 'os')
  const browserCounts = countBy(scans, 'browser')

  return (
    <>
      <Navbar title={`Stats – ${event?.name || ''}`} actions={
        <Link to={`/admin/events/${id}`} className="btn btn-light"><i className="bi bi-arrow-left me-1"></i>Retour</Link>
      } />

      <div className="page-content">
        {/* Range selector */}
        <div className="d-flex gap-2 mb-4 flex-wrap">
          {RANGES.map(r => (
            <button
              key={r.key}
              className={`btn btn-sm ${range === r.key ? 'btn-primary' : 'btn-light'}`}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : (
          <>
            {/* Stats summary */}
            <div className="row g-3 mb-4">
              {[
                { icon: 'bi-qr-code-scan', label: 'Scans QR', value: totalScans, color: 'primary' },
                { icon: 'bi-cursor-fill', label: 'Clics totaux', value: totalClicks, color: 'success' },
                { icon: 'bi-bar-chart-fill', label: 'Taux de clic', value: `${clickRate}%`, color: 'warning' },
              ].map(s => (
                <div className="col-4" key={s.label}>
                  <div className="stat-card">
                    <div className={`stat-icon text-${s.color}`}><i className={`bi ${s.icon}`}></i></div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Scan chart */}
            <div className="card mb-4">
              <div className="card-header"><h6 className="card-title mb-0">Évolution des scans (7 derniers jours)</h6></div>
              <div className="card-body">
                <Line data={scanChartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} height={60} />
              </div>
            </div>

            {/* Clicks by link */}
            <div className="card mb-4">
              <div className="card-header"><h6 className="card-title mb-0">Clics par lien</h6></div>
              {clicksByLink.length === 0
                ? <div className="card-body text-secondary">Aucun clic enregistré</div>
                : <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr><th>Lien</th><th>Type</th><th className="text-end">Clics</th></tr>
                      </thead>
                      <tbody>
                        {clicksByLink.map(lk => (
                          <tr key={lk.id}>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <span className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                  style={{ width: 28, height: 28, background: lk.color || '#e2e8f0' }}>
                                  <i className={`bi ${iconFor(lk.type)} text-white`} style={{ fontSize: 13 }}></i>
                                </span>
                                {lk.title}
                              </div>
                            </td>
                            <td><span className="badge bg-light text-dark">{lk.type}</span></td>
                            <td className="text-end fw-bold">{lk.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              }
            </div>

            {/* Device / OS / Browser breakdown */}
            <div className="row g-4">
              {[
                { title: 'Appareils', items: deviceCounts, icon: (v) => v?.toLowerCase().includes('mobile') ? 'bi-phone' : 'bi-display' },
                { title: 'Systèmes', items: osCounts, icon: (v) => osIcon(v) },
                { title: 'Navigateurs', items: browserCounts, icon: (v) => browserIcon(v) },
              ].map(section => (
                <div className="col-md-4" key={section.title}>
                  <div className="card">
                    <div className="card-header"><h6 className="card-title mb-0">{section.title}</h6></div>
                    {section.items.length === 0
                      ? <div className="card-body text-secondary small">Aucune donnée</div>
                      : <div className="list-group list-group-flush">
                          {section.items.map(([label, count]) => (
                            <div key={label} className="list-group-item d-flex justify-content-between align-items-center py-2">
                              <div className="d-flex align-items-center gap-2">
                                <i className={`bi ${section.icon(label)} text-secondary`}></i>
                                <span className="small">{label}</span>
                              </div>
                              <span className="badge bg-primary rounded-pill">{count}</span>
                            </div>
                          ))}
                        </div>
                    }
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
