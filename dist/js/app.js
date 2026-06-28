/* ============================================================
   BeyondCom QR Event Platform - shared client-side UI
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Toast notifications ---------- */
  window.toast = function (message, type) {
    type = type || 'success';
    const root = document.getElementById('toastRoot');
    if (!root) {
      // Minimal fallback if container is missing.
      alert(message);
      return;
    }
    const palette = {
      success: { bg: '#0f172a', icon: 'check-circle', accent: '#10b981' },
      danger: { bg: '#b91c1c', icon: 'exclamation-triangle', accent: '#ef4444' },
      info: { bg: '#0f172a', icon: 'info', accent: '#0ea5e9' },
    }[type] || { bg: '#0f172a', icon: 'info', accent: '#0ea5e9' };

    const el = document.createElement('div');
    el.className = 'toast align-items-center text-white border-0';
    el.style.background = palette.bg;
    el.style.borderLeft = `4px solid ${palette.accent}`;
    el.style.borderRadius = '10px';
    el.style.minWidth = '260px';
    el.innerHTML =
      `<div class="d-flex align-items-center gap-2 px-2 py-2">
         <i class="bi bi-${palette.icon}" style="color:${palette.accent};font-size:18px;"></i>
         <div class="toast-body small">${escapeHtml(message)}</div>
       </div>`;
    root.appendChild(el);
    const toast = new bootstrap.Toast(el, { delay: 3200 });
    toast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  /* ---------- Sidebar (mobile) ---------- */
  function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    const backdrop = document.getElementById('sidebarBackdrop');
    const closeBtn = document.getElementById('sidebarClose');
    if (!sidebar) return;

    const open = () => { sidebar.classList.add('show'); backdrop && backdrop.classList.add('show'); };
    const hide = () => { sidebar.classList.remove('show'); backdrop && backdrop.classList.remove('show'); };

    if (toggle) toggle.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', hide);
    if (backdrop) backdrop.addEventListener('click', hide);
  }

  /* ---------- Password visibility toggle ---------- */
  function initTogglePwd() {
    document.querySelectorAll('.toggle-pwd').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const wrap = btn.closest('.field-with-icon');
        if (!wrap) return;
        const input = wrap.querySelector('input');
        if (!input) return;
        if (input.type === 'password') {
          input.type = 'text';
          btn.querySelector('i').className = 'bi bi-eye-slash';
        } else {
          input.type = 'password';
          btn.querySelector('i').className = 'bi bi-eye';
        }
      });
    });
  }

  /* ---------- Confirm modal (shared) ---------- */
  let confirmModal = null;
  function initConfirmModals() {
    const modalEl = document.getElementById('confirmModal');
    if (!modalEl) return;
    confirmModal = bootstrap.Modal.getOrCreateInstance(modalEl);

    const actionBtn = document.getElementById('confirmAction');
    const formEl = document.getElementById('confirmForm');

    document.addEventListener('click', function (e) {
      const trigger = e.target.closest('[data-confirm]');
      if (!trigger) return;
      e.preventDefault();

      const action = trigger.getAttribute('data-action-label') || 'Supprimer';
      document.getElementById('confirmTitle').textContent =
        trigger.getAttribute('data-title') || 'Confirmer';
      document.getElementById('confirmMessage').textContent =
        trigger.getAttribute('data-message') || 'Êtes-vous sûr ?';
      actionBtn.textContent = '';
      actionBtn.innerHTML =
        `<span class="spinner-border spinner-border-sm d-none"></span>${action}`;
      formEl.setAttribute('action', trigger.getAttribute('data-form-action'));

      confirmModal.show();
    });

    actionBtn && formEl && formEl.addEventListener('submit', function () {
      const spinner = actionBtn.querySelector('.spinner-border');
      if (spinner) spinner.classList.remove('d-none');
      actionBtn.setAttribute('disabled', 'true');
    });
  }

  /* ---------- Loading buttons ---------- */
  function initLoadingButtons() {
    document.querySelectorAll('form').forEach(function (form) {
      form.addEventListener('submit', function () {
        const loader = form.querySelector('.btn-with-loader, .auth-submit');
        if (!loader) return;
        if (loader.classList.contains('btn-with-loader') || loader.classList.contains('auth-submit')) {
          loader.classList.add('is-loading');
        }
      });
    });
  }

  /* ---------- Flash -> Toast redirect ---------- */
  function flashFromServer() {
    // Auto-disappear for alerts, handled via admin layout & flash partial.
    // Optionally convert to toast on auth pages:
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSidebar();
    initTogglePwd();
    initConfirmModals();
    initLoadingButtons();

    // Auto dismiss flash alerts after 5s.
    document.querySelectorAll('.alert .btn-close').forEach(function (btn) {
      setTimeout(function () {
        const alert = btn.closest('.alert');
        if (alert) alert.classList.add('fade-out');
      }, 5000);
    });
  });
})();
