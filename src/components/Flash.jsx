import { useState, useEffect } from 'react'

export default function Flash({ type, message, onDismiss }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, 5000)
    return () => clearTimeout(t)
  }, [message])

  if (!message || !visible) return null

  const alertClass = type === 'success' ? 'alert-success' : 'alert-danger'
  const iconClass = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'

  return (
    <div className={`alert ${alertClass} alert-dismissible d-flex align-items-center mb-3`} role="alert">
      <i className={`bi ${iconClass} me-2`}></i>
      <span>{message}</span>
      <button
        type="button"
        className="btn-close"
        onClick={() => { setVisible(false); onDismiss?.() }}
      ></button>
    </div>
  )
}
