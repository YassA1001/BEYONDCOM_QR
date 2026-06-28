import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase.js'
import Navbar from '../components/Navbar.jsx'
import Flash from '../components/Flash.jsx'

export default function EventQR() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState(null)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('events').select('id, name, slug').eq('id', id).single()
    setEvent(data)
    if (data) await generateQR(data.slug)
    setLoading(false)
  }

  async function generateQR(slug) {
    const url = `${window.location.origin}/e/${slug}`
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
    setQrDataUrl(dataUrl)
    setFlash({ type: 'success', message: 'QR code généré avec succès' })
  }

  async function handleRegenerate() {
    if (!event) return
    await generateQR(event.slug)
  }

  function handleDownload() {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qr-${event?.slug || 'event'}.png`
    a.click()
  }

  if (loading) return (
    <>
      <Navbar title="QR Code" />
      <div className="page-content text-center py-5"><div className="spinner-border text-primary"></div></div>
    </>
  )

  return (
    <>
      <Navbar title={`QR Code – ${event?.name || ''}`} actions={
        <Link to={`/admin/events/${id}`} className="btn btn-light"><i className="bi bi-arrow-left me-1"></i>Retour</Link>
      } />

      <div className="page-content">
        <Flash type={flash?.type} message={flash?.message} onDismiss={() => setFlash(null)} />

        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card text-center">
              <div className="card-header">
                <h6 className="card-title mb-0">Code QR de l'événement</h6>
              </div>
              <div className="card-body py-4">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="img-fluid rounded"
                    style={{ maxWidth: 280 }}
                  />
                ) : (
                  <div className="py-5 text-secondary">
                    <i className="bi bi-qr-code display-4"></i>
                    <p className="mt-2">Aucun QR code généré</p>
                  </div>
                )}

                <div className="mt-3 text-secondary small">
                  <i className="bi bi-link-45deg me-1"></i>
                  <span className="font-monospace">{window.location.origin}/e/{event?.slug}</span>
                </div>
              </div>
              <div className="card-footer bg-transparent">
                <div className="d-flex gap-2 justify-content-center">
                  <button className="btn btn-light" onClick={handleRegenerate}>
                    <i className="bi bi-arrow-clockwise me-1"></i>Régénérer
                  </button>
                  <button className="btn btn-primary" onClick={handleDownload} disabled={!qrDataUrl}>
                    <i className="bi bi-download me-1"></i>Télécharger PNG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
