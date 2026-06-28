import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Line, Doughnut } from 'react-chartjs-2'
import { Chart, registerables } from 'chart.js'
import { supabase } from '../lib/supabase.js'
import Navbar from '../components/Navbar.jsx'
import { formatDate } from '../utils/formatDate.js'

Chart.register(...registerables)

const CHART_COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

export default function Dashboard() {
  const [stats, setStats] = useState({ events: 0, scans: 0, clicks: 0, rate: 0 })
  const [topEvents, setTopEvents] = useState([])
  const [topLinks, setTopLinks] = useState([])
  const [recentEvents, setRecentEvents] = useState([])
  const [scanSeries, setScanSeries] = useState({ labels: [], data: [] })
  const [clicksType, setClicksType] = useState({ labels: [], data: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [eventsRes, scansRes, clicksRes] = await Promise.all([
      supabase.from('events').select('id, name, slug, isActive, createdAt', { count: 'exact' }),
      supabase.from('scan_logs').select('id', { count: 'exact', head: true }),
      supabase.from('click_logs').select('id, eventLinkId', { count: 'exact' }),
    ])

    const totalScans = scansRes.count || 0
    const totalClicks = clicksRes.count || 0
    setStats({
      events: eventsRes.count || 0,
      scans: totalScans,
      clicks: totalClicks,
      rate: totalScans > 0 ? Math.round((totalClicks / totalScans) * 100) : 0,
    })

    const allEvents = eventsRes.data || []
    setRecentEvents(allEvents.slice(-5).reverse())

    // 7-day scan series
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      days.push(d)
    }
    const sevenDaysAgo = days[0].toISOString()
    const { data: recentScans } = await supabase
      .from('scan_logs')
      .select('scannedAt')
      .gte('scannedAt', sevenDaysAgo)

    const dayCounts = days.map(d => {
      const key = d.toDateString()
      return (recentScans || []).filter(s => new Date(s.scannedAt).toDateString() === key).length
    })
    setScanSeries({
      labels: days.map(d => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
      data: dayCounts,
    })

    // Clicks by type
    if (clicksRes.data && clicksRes.data.length > 0) {
      const linkIds = [...new Set(clicksRes.data.map(c => c.eventLinkId))]
      const { data: links } = await supabase.from('event_links').select('id, type').in('id', linkIds)
      const typeCounts = {}
      clicksRes.data.forEach(c => {
        const link = (links || []).find(l => l.id === c.eventLinkId)
        const t = link?.type || 'other'
        typeCounts[t] = (typeCounts[t] || 0) + 1
      })
      setClicksType({
        labels: Object.keys(typeCounts),
        data: Object.values(typeCounts),
      })
    }

    // Top scanned events
    const { data: scanLogs } = await supabase.from('scan_logs').select('eventId')
    const scanCounts = {}
    ;(scanLogs || []).forEach(s => { scanCounts[s.eventId] = (scanCounts[s.eventId] || 0) + 1 })
    const topEventIds = Object.entries(scanCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const topEventData = topEventIds.map(([id, count]) => {
      const ev = allEvents.find(e => e.id === parseInt(id))
      return { name: ev?.name || `Event #${id}`, count }
    })
    setTopEvents(topEventData)

    // Top clicked links
    const { data: clickLogs } = await supabase.from('click_logs').select('eventLinkId')
    const clickCounts = {}
    ;(clickLogs || []).forEach(c => { clickCounts[c.eventLinkId] = (clickCounts[c.eventLinkId] || 0) + 1 })
    const topLinkIds = Object.entries(clickCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    if (topLinkIds.length > 0) {
      const { data: linkData } = await supabase.from('event_links').select('id, title, type').in('id', topLinkIds.map(([id]) => parseInt(id)))
      setTopLinks(topLinkIds.map(([id, count]) => {
        const link = (linkData || []).find(l => l.id === parseInt(id))
        return { title: link?.title || `Link #${id}`, type: link?.type || 'other', count }
      }))
    }

    setLoading(false)
  }

  const scanChartData = {
    labels: scanSeries.labels,
    datasets: [{
      label: 'Scans',
      data: scanSeries.data,
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14,165,233,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#0ea5e9',
    }],
  }

  const clicksChartData = {
    labels: clicksType.labels,
    datasets: [{
      data: clicksType.data,
      backgroundColor: CHART_COLORS,
      borderWidth: 2,
      borderColor: '#fff',
    }],
  }

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  }

  const doughnutOptions = {
    responsive: true,
    plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } },
    cutout: '65%',
  }

  return (
    <>
      <Navbar title="Tableau de bord" actions={
        <Link to="/admin/events/create" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1"></i> Nouvel événement
        </Link>
      } />

      <div className="page-content">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="row g-4 mb-4">
              {[
                { icon: 'bi-calendar-event-fill', label: 'Événements', value: stats.events, color: 'primary' },
                { icon: 'bi-qr-code-scan', label: 'Scans QR', value: stats.scans, color: 'success' },
                { icon: 'bi-cursor-fill', label: 'Clics de liens', value: stats.clicks, color: 'warning' },
                { icon: 'bi-bar-chart-fill', label: 'Taux de clic', value: `${stats.rate}%`, color: 'info' },
              ].map(s => (
                <div className="col-6 col-xl-3" key={s.label}>
                  <div className="stat-card">
                    <div className={`stat-icon text-${s.color}`}>
                      <i className={`bi ${s.icon}`}></i>
                    </div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="row g-4 mb-4">
              <div className="col-lg-8">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="card-title mb-0">Scans QR – 7 derniers jours</h6>
                  </div>
                  <div className="card-body">
                    <Line data={scanChartData} options={chartOptions} height={80} />
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="card h-100">
                  <div className="card-header">
                    <h6 className="card-title mb-0">Clics par type de lien</h6>
                  </div>
                  <div className="card-body d-flex align-items-center">
                    {clicksType.data.length > 0
                      ? <Doughnut data={clicksChartData} options={doughnutOptions} />
                      : <p className="text-secondary text-center w-100 mb-0">Aucun clic enregistré</p>
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Top tables */}
            <div className="row g-4 mb-4">
              <div className="col-lg-6">
                <div className="card">
                  <div className="card-header">
                    <h6 className="card-title mb-0">Top événements scannés</h6>
                  </div>
                  {topEvents.length === 0
                    ? <div className="card-body text-secondary">Aucune donnée</div>
                    : <div className="list-group list-group-flush">
                        {topEvents.map((ev, i) => (
                          <div key={i} className="list-group-item d-flex justify-content-between align-items-center">
                            <span className="fw-medium">{ev.name}</span>
                            <span className="badge bg-primary rounded-pill">{ev.count}</span>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>
              <div className="col-lg-6">
                <div className="card">
                  <div className="card-header">
                    <h6 className="card-title mb-0">Top liens cliqués</h6>
                  </div>
                  {topLinks.length === 0
                    ? <div className="card-body text-secondary">Aucune donnée</div>
                    : <div className="list-group list-group-flush">
                        {topLinks.map((lk, i) => (
                          <div key={i} className="list-group-item d-flex justify-content-between align-items-center">
                            <span className="fw-medium">{lk.title}</span>
                            <span className="badge bg-success rounded-pill">{lk.count}</span>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>
            </div>

            {/* Recent events */}
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h6 className="card-title mb-0">Événements récents</h6>
                <Link to="/admin/events" className="btn btn-sm btn-light">Voir tout</Link>
              </div>
              {recentEvents.length === 0
                ? <div className="card-body text-secondary">Aucun événement</div>
                : <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Nom</th>
                          <th>Statut</th>
                          <th>Créé le</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentEvents.map(ev => (
                          <tr key={ev.id}>
                            <td className="fw-medium">{ev.name}</td>
                            <td>
                              <span className={`badge ${ev.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                {ev.isActive ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            <td className="text-secondary">{formatDate(ev.createdAt)}</td>
                            <td>
                              <Link to={`/admin/events/${ev.id}`} className="btn btn-sm btn-light">
                                <i className="bi bi-eye"></i>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              }
            </div>
          </>
        )}
      </div>
    </>
  )
}
