// ====================================
// PWA PURE INSTALL MODULE
// ====================================

const PWA = (() => {
  let deferredPrompt = null;

  let autoTrigger = false;

  // Android/Chrome fires this before showing install prompt
  window.addEventListener('beforeinstallprompt', e => {
    console.log('[PWA] Native prompt captured');
    e.preventDefault();
    deferredPrompt = e;
    
    if (autoTrigger) {
      install('auto');
      autoTrigger = false;
    }
  });

  // Fires after user installs
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Installation successful');
    deferredPrompt = null;
    showToast('✅ Auto Triage installed successfully!');
  });

  // Main install function — called by buttons
  async function install(type, btn = null) {
    if (!window.isSecureContext) {
      alert('⚠️ SECURITY BLOCK: Browsers only allow "Install" on secure HTTPS connections.');
      return;
    }

    if (btn) {

      const originalHTML = btn.innerHTML;
      const originalStyle = btn.getAttribute('style') || '';
      btn.style.pointerEvents = 'none';
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      
      const bar = document.createElement('div');
      bar.style.cssText = 'position:absolute;left:0;top:0;height:100%;width:0%;background:rgba(255,255,255,0.2);transition:width 1s ease-in-out;z-index:0;';
      
      const txt = document.createElement('span');
      txt.style.cssText = 'position:relative;z-index:1;';
      txt.textContent = 'Downloading...';
      
      btn.innerHTML = '';
      btn.appendChild(bar);
      btn.appendChild(txt);
      
      setTimeout(() => { bar.style.width = '100%'; }, 50);
      
      await new Promise(r => setTimeout(r, 1200));
      
      btn.innerHTML = originalHTML;
      btn.setAttribute('style', originalStyle);
      btn.style.pointerEvents = 'auto';
    }

    // DIRECTLY TRIGGER CORRESPONDING FILE DOWNLOAD (BYPASSING BROWSER PWA WEBPAGE INSTALLEE!)
    const ua = navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(ua) || type === 'ios';
    const isAndroid = /android/.test(ua) || type === 'android';
    const platform = isiOS ? 'ios' : (isAndroid ? 'android' : 'desktop');
    
    if (platform === 'ios') {
      if (typeof showInstallGuide === 'function') {
        showInstallGuide('ios');
      } else {
        showToast('🍏 iPhone: Tap Share ↑ then "Add to Home Screen"');
      }
    } else if (platform === 'android') {
      showToast('📥 Starting Android APK Download...');
      const link = document.createElement('a');
      link.href = 'autotriage.apk';
      link.download = 'autotriage.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      showToast('📥 Starting Windows Launcher Download...');
      const link = document.createElement('a');
      link.href = 'AutoTriage_App.hta';
      link.download = 'AutoTriage_App.hta';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Toast notification
  function showToast(msg) {
    const existing = document.getElementById('pwaToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'pwaToast';
    toast.textContent = msg;
    toast.style.cssText = `
      position:fixed;bottom:32px;left:50%;transform:translateX(-50%);
      background:#f5f5f0;color:#0a0a0a;
      padding:14px 24px;
      font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1px;
      z-index:9999;white-space:nowrap;
      animation:toastIn 0.3s forwards;
      box-shadow:0 8px 32px rgba(0,0,0,0.4);
    `;

    if (!document.getElementById('toastStyle')) {
      const s = document.createElement('style');
      s.id = 'toastStyle';
      s.textContent = `
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(16px);} to{opacity:1;transform:translateX(-50%) translateY(0);} }
        @keyframes toastOut { from{opacity:1;} to{opacity:0;} }
      `;
      document.head.appendChild(s);
    }

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.4s forwards';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // Register service worker with update detection
  function registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => {
            console.log('[PWA] Engine Live');
            
            // 1. Check for updates on every page load
            reg.update();

            // 2. Listen for a new service worker version
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              newWorker.addEventListener('statechange', () => {
                // If a new worker is successfully installed, show update prompt
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showUpdatePrompt(reg);
                }
              });
            });
          })
          .catch(err => console.error('[PWA] Engine Error:', err));
      });

      // 3. Listen for the swap to the new version
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }
  }

  // Persistent Update Prompt
  function showUpdatePrompt(reg) {
    const banner = document.createElement('div');
    banner.id = 'updateBanner';
    banner.innerHTML = `
      <div style="flex:1;">
        <strong style="display:block;margin-bottom:4px;font-size:12px;">NEW VERSION AVAILABLE</strong>
        <span style="font-size:9px;color:rgba(0,0,0,0.6);">Updates include new AI logic and mechanics.</span>
      </div>
      <button onclick="PWA.applyUpdate()" style="background:#0a0a0a;color:#fff;border:none;padding:8px 16px;border-radius:8px;font-family:'Bebas Neue',sans-serif;font-size:14px;letter-spacing:1px;cursor:pointer;">UPDATE NOW</button>
    `;
    
    banner.style.cssText = `
      position:fixed;bottom:20px;left:20px;right:20px;
      background:#00d084;color:#0a0a0a;
      padding:20px;
      font-family:'Space Mono',monospace;
      z-index:20000;
      display:flex;align-items:center;gap:16px;
      border-radius:24px;
      box-shadow:0 15px 40px rgba(0,208,132,0.4);
      animation:slideUp 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    `;

    if (!document.getElementById('pwaUpdateStyle')) {
      const s = document.createElement('style');
      s.id = 'pwaUpdateStyle';
      s.textContent = `@keyframes slideUp { from{transform:translateY(100px);opacity:0;} to{transform:translateY(0);opacity:1;} }`;
      document.head.appendChild(s);
    }

    document.body.appendChild(banner);
    
    // Store registration to apply update later
    window._swRegistration = reg;
  }

  function applyUpdate() {
    if (window._swRegistration && window._swRegistration.waiting) {
      window._swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  function init() {
    registerSW();
    // Auto-trigger install if coming from landing page "Download"
    if (window.location.hash === '#install' || window.location.search.includes('install=true')) {
      console.log('[PWA] Auto-install requested');
      autoTrigger = true;
      if (deferredPrompt) install('auto');
    }
  }

  return { 
    init, 
    install,
    applyUpdate,
    get installPromptReady() { return !!deferredPrompt; }
  };
})();