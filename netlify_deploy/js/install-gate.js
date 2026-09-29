/* ============================================
   AUTO TRIAGE — INSTALL GATE v5 (CLEAN)
   Registers Service Worker for PWA install.
   Guarantees old SWs are removed before registering the new one.
   ============================================ */

(function () {
  'use strict';

  // Remove the body‑hiding style immediately (if still present)
  const gateStyle = document.getElementById('gate-hide');
  if (gateStyle) gateStyle.remove();

  // Unregister any previously installed Service Workers, then register the new one
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(regs => Promise.all(regs.map(r => r.unregister())))
      .finally(() => {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[AutoTriage] SW registered:', reg.scope))
            .catch(err => console.warn('[AutoTriage] SW registration failed:', err));
        });
      });
  }
})();
