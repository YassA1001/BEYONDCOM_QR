import { useState } from 'react'

let resolveRef = null

export function useConfirm() {
  const [state, setState] = useState({ open: false, message: '' })

  function confirm(message) {
    setState({ open: true, message })
    return new Promise((resolve) => { resolveRef = resolve })
  }

  function handleConfirm() {
    setState({ open: false, message: '' })
    resolveRef?.(true)
  }

  function handleCancel() {
    setState({ open: false, message: '' })
    resolveRef?.(false)
  }

  function ConfirmModal() {
    if (!state.open) return null
    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0 pb-0">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded-circle bg-danger bg-opacity-10 p-2">
                  <i className="bi bi-exclamation-triangle text-danger fs-5"></i>
                </div>
                <h5 className="modal-title mb-0">Confirmer la suppression</h5>
              </div>
            </div>
            <div className="modal-body pt-3">
              <p className="text-secondary mb-0">{state.message}</p>
            </div>
            <div className="modal-footer border-0">
              <button className="btn btn-light" onClick={handleCancel}>Annuler</button>
              <button className="btn btn-danger" onClick={handleConfirm}>Supprimer</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return { confirm, ConfirmModal }
}
