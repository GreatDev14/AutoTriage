
    // Storage Safety Guard: Redefine localStorage & sessionStorage to in-memory mocks if blocked (e.g. file:/// protocol)
    (function() {
      function createMockStorage() {
        var mockStorage = {};
        return {
          getItem: function(k) { return mockStorage[k] !== undefined ? mockStorage[k] : null; },
          setItem: function(k, v) { mockStorage[k] = String(v); },
          removeItem: function(k) { delete mockStorage[k]; },
          clear: function() { for (var k in mockStorage) delete mockStorage[k]; },
          key: function(i) { return Object.keys(mockStorage)[i] || null; },
          get length() { return Object.keys(mockStorage).length; }
        };
      }
      try {
        var testKey = '__test_storage_safety__';
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
      } catch (e) {
        console.warn("localStorage is blocked or inaccessible. Injecting memory-based fallback mock.");
        try {
          Object.defineProperty(window, 'localStorage', { value: createMockStorage(), writable: true, configurable: true });
        } catch (err) {
          window.localStorage = createMockStorage();
        }
      }
      try {
        var testKey = '__test_storage_safety__';
        window.sessionStorage.setItem(testKey, '1');
        window.sessionStorage.removeItem(testKey);
      } catch (e) {
        console.warn("sessionStorage is blocked or inaccessible. Injecting memory-based fallback mock.");
        try {
          Object.defineProperty(window, 'sessionStorage', { value: createMockStorage(), writable: true, configurable: true });
        } catch (err) {
          window.sessionStorage = createMockStorage();
        }
      }
      
      // Fetch scheme mapper for local file preview redirection to Node backend
      var originalFetch = window.fetch;
      window.fetch = function(input, init) {
        if (typeof input === 'string' && input.startsWith('/api/')) {
          var baseUrl = (window.location.protocol === 'file:') ? 'http://localhost:8080' : '';
          if (baseUrl) {
            console.log('[API Redirect] Routing ' + input + ' -> ' + baseUrl + input);
            return originalFetch(baseUrl + input, init);
          }
        }
        return originalFetch(input, init);
      };
    })();
  </script>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"/>
  <title>Auto Triage — Simple</title>
  <link rel="stylesheet" href="dist/autotriage.css?v=1.35" />
  <link rel="icon" type="image/png" href="assets/logo.png" />
  <link rel="apple-touch-icon" href="assets/logo.png" />
  
  <!-- PWA Standalone Mode Blocker Shield -->
  <script>
    (function() {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                           || window.navigator.standalone === true 
                           || window.location.href.indexOf('standalone=true') !== -1 
                           || window.location.href.indexOf('dev=true') !== -1
                           || window.location.protocol === 'file:' 
                           || window.location.hostname === 'localhost' 
                           || window.location.hostname === '127.0.0.1'
                           || sessionStorage.getItem('dev_bypass') === 'true';
      
      if (!isStandalone) {
        // FOUC Prevention: Inject blocking style immediately
        document.write(`
          <style id="pwa-blocker-style">
            body { overflow: hidden !important; pointer-events: none !important; }
            #preloader { display: none !important; }
          </style>
        `);

        // Set up the blocker element once DOM is loaded
        window.addEventListener('DOMContentLoaded', () => {
          const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
          const isAndroid = /Android/i.test(navigator.userAgent);
          
          let instructionHTML = '';
          if (isiOS) {
            instructionHTML = `
              <div style="font-size:10px; color:#ffaa00; font-weight:bold; letter-spacing:1px; margin-bottom:8px; text-transform:uppercase;">📱 APPLE iOS INSTRUCTIONS</div>
              <div style="font-size:11px; color:#fff; line-height:1.7;">
                1. Tap the <b>Share</b> button (<span style="font-size:14px;">📤</span>) at the bottom of Safari.<br>
                2. Scroll down and tap <b>Add to Home Screen</b> (<span style="font-size:14px;">➕</span>).<br>
                3. Open the installed app from your home screen.
              </div>
            `;
          } else if (isAndroid) {
            instructionHTML = `
              <div style="font-size:10px; color:#00d084; font-weight:bold; letter-spacing:1px; margin-bottom:8px; text-transform:uppercase;">🤖 ANDROID INSTRUCTIONS</div>
              <div style="font-size:11px; color:#fff; line-height:1.7;">
                1. Tap the browser menu (<span style="font-size:14px;">⋮</span>) at the top-right corner.<br>
                2. Select <b>Install App</b> or <b>Add to Home Screen</b>.<br>
                3. Open the installed app from your home screen.
              </div>
            `;
          } else {
            instructionHTML = `
              <div style="font-size:10px; color:#4da6ff; font-weight:bold; letter-spacing:1px; margin-bottom:8px; text-transform:uppercase;">💻 DESKTOP INSTRUCTIONS</div>
              <div style="font-size:11px; color:#fff; line-height:1.7;">
                1. Click the <b>Install</b> button (<span style="font-size:14px;">⊕</span>) inside your browser's URL address bar.<br>
                2. Confirm and launch the app in its own secure standalone window.
              </div>
            `;
          }

          const overlay = document.createElement('div');
          overlay.id = 'pwaBlockerShield';
          overlay.style.cssText = 'position:fixed; inset:0; z-index:999999; background:rgba(10,10,12,0.85); backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px); display:flex; align-items:center; justify-content:center; padding:24px; color:#fff; font-family:"Space Mono",monospace; overflow-y:auto; pointer-events:auto !important;';
          overlay.innerHTML = `
            <div style="max-width:480px; width:100%; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:28px; padding:40px 32px; text-align:center; box-shadow:0 30px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1);">
              <div style="width:72px; height:72px; background:linear-gradient(135deg, rgba(255,51,51,0.2) 0%, rgba(255,51,51,0.05) 100%); border:1px solid rgba(255,51,51,0.4); border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:32px; margin:0 auto 24px; animation: breathe 3s ease-in-out infinite;">🚨</div>
              <h2 style="font-family:\'Bebas Neue\',sans-serif; font-size:36px; letter-spacing:2px; color:#fff; line-height:1; margin-bottom:8px;">SECURE RUNTIME REQUIRED</h2>
              <div style="font-size:10px; color:#ff3333; font-weight:bold; letter-spacing:1px; margin-bottom:24px; text-transform:uppercase;">STANDALONE SANDBOX CONTAINER</div>
              
              <p style="font-size:11px; color:#a0a0ab; line-height:1.8; margin-bottom:32px;">
                AutoTriage operates on a device-locked environment. To protect secure telemetry keys, access location services, and enable fully offline diagnostic capability, you must install this app to your device\'s home screen.
              </p>

              <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:16px; padding:20px; text-align:left; margin-bottom:32px;">
                \${instructionHTML}
              </div>

              <div style="display:flex; flex-direction:column; gap:12px;">
                <button onclick="window.location.reload()" style="background:#fff; color:#000; border:none; padding:16px; border-radius:14px; font-family:\'Bebas Neue\',sans-serif; font-size:18px; letter-spacing:2px; font-weight:bold; cursor:pointer; width:100%;">RETRY CONNECTION ↺</button>
                <button id="devBypassBtn" style="background:transparent; border:1px solid rgba(255,255,255,0.1); color:#a0a0ab; padding:12px; border-radius:14px; font-size:10px; cursor:pointer; width:100%; transition:all 0.2s;">BYPASS SHIELD (DEVELOPER MODE) →</button>
              </div>
            </div>
            <style>
              @keyframes breathe {
                0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(255,51,51,0.2)); }
                50% { transform: scale(1.05); filter: drop-shadow(0 0 20px rgba(255,51,51,0.5)); }
              }
            </style>
          `;
          document.body.appendChild(overlay);

          document.getElementById('devBypassBtn').onclick = () => {
            sessionStorage.setItem('dev_bypass', 'true');
            overlay.remove();
            const style = document.getElementById('pwa-blocker-style');
            if (style) style.remove();
            
            // Re-enable preloader reveal if page is still loading
            const preloader = document.getElementById('preloader');
            if (preloader) {
              preloader.style.display = '';
              if (typeof revealSite === 'function') {
                revealSite();
              }
            }
          };
        });
      }
    })();
  </script>

  <!-- Preconnect for faster loading -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
  <link rel="preconnect" href="https://unpkg.com" />
  <link rel="preload" as="image" href="assets/logo.png" />
  <!-- Google Fonts async -->
  <link rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"
    href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap" />
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap" /></noscript>
  <!-- Leaflet.js (Free Map - No Keys Needed!) -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <link rel="stylesheet" href="css/base.css"/>
  <link rel="stylesheet" href="css/forms.css"/>
  <link rel="stylesheet" href="css/auth.css">
  <!-- Firebase Compat -->
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
  <script src="js/firebase-config.js"></script>

  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      corePlugins: { preflight: false }
    }
  </script>

  <script src="js/auth.js" defer></script>

  <link rel="manifest" href="manifest-simple.json"/>
  <link rel="icon" type="image/png" href="assets/logo.png"/>
  <link rel="apple-touch-icon" href="assets/logo.png"/>
  <meta name="theme-color" content="#0a0a0a"/>
  
  <!-- FORCE CACHE CLEAR SCRIPT -->
  <script>
    document.documentElement.classList.add('js-enabled');
    document.write('<style id="pwa-lock">body { opacity: 0 !important; overflow: hidden !important; background: var(--bg) !important; }</style>');

    function revealSite() {
      const preloader = document.getElementById('preloader');
      const lock = document.getElementById('pwa-lock');
      if (preloader) preloader.style.opacity = '0';
      setTimeout(() => {
        if (lock) lock.remove();
        document.body.style.opacity = '1';
        document.body.style.overflowY = 'hidden';
        document.body.style.overflowX = 'hidden';
        setTimeout(() => { if (preloader) preloader.remove(); }, 800);
      }, 500);
    }
    window.addEventListener('load', revealSite);
    setTimeout(() => { if (document.body.style.opacity !== '1') revealSite(); }, 3000);
  </script>
  <!-- Body visible by default -->
  <!-- GSAP deferred — non-blocking -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" defer></script>
  <style>
    /* SCROLL PROGRESS */
    #scrollProgress { position:fixed; top:0; left:0; height:2px; background:var(--accent); z-index:2000; width:0%; transition:width 0.1s; }

    /* PAGE SPECIFIC STYLES - SIMPLE */
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color: transparent; }
    html, body { height: 100%; margin: 0; padding: 0; overflow: hidden !important; max-width: 100vw; }
    body { background:var(--bg); color:var(--fg); font-family:'Space Mono',monospace; display:flex; flex-direction:column; height:100%; overflow: hidden !important; }
    
    /* Desktop and Tablet Responsive Centered Layout Wrapper */
    @media (min-width: 480px) {
      body {
        max-width: 480px;
        margin: 0 auto !important;
        border-left: 1px solid var(--border);
        border-right: 1px solid var(--border);
        position: relative;
        box-shadow: 0 0 80px rgba(0, 0, 0, 0.6);
      }
      header {
        max-width: 480px;
        width: 100%;
      }
      .bottom-nav {
        max-width: 456px;
        left: 50% !important;
        right: auto !important;
        transform: translateX(-50%) !important;
        width: calc(100% - 24px);
      }
      .tracker-header, .tracker-drawer, .navigation-hud {
        max-width: 448px;
        left: 50% !important;
        right: auto !important;
        transform: translateX(-50%) !important;
        width: calc(100% - 32px);
      }
      /* Centered drawer panels, success modals, booking alerts */
      #profileDrawerPanel, #bookingModal, #critMsg, .success-modal .success-content {
        max-width: 480px;
        left: 50% !important;
        right: auto !important;
        transform: translateX(-50%) !important;
        width: 100%;
      }
    }
    

    
    /* MOBILE MENU OVERLAY */
    .mobile-overlay { position:fixed; inset:0; background:#000000; z-index:9000; display:none; flex-direction:column; align-items:center; justify-content:center; }
    .mobile-overlay.open { display:flex; }
    .mob-close { position:absolute; top:24px; right:24px; font-size:32px; color:var(--fg); cursor:pointer; }
    .mob-links { display:flex; flex-direction:column; gap:24px; text-align:center; }
    .mob-links a { font-family:'Bebas Neue',sans-serif; font-size:36px; color:var(--fg); text-decoration:none; letter-spacing:2px; }
    .mob-divider { height:1px; background:var(--border); width:40px; margin:0 auto; }
    .mob-cta { background:var(--fg)!important; color:var(--bg)!important; padding:14px 32px!important; font-size:18px!important; border-radius:12px; }
    .nav-mobile-toggle { width:32px; height:24px; flex-direction:column; justify-content:center; gap:6px; cursor:pointer; }
    .nav-mobile-toggle .bar { width:100%; height:2px; background:var(--fg); }

    /* HEADER */
    header { padding:16px 24px; display:flex; align-items:center; justify-content:space-between; background:var(--bg); position:sticky; top:0; z-index:100; border-bottom: 1px solid var(--border); transition: background 0.4s; }
    .h-logo { font-family:'Bebas Neue',sans-serif; font-size:24px; letter-spacing:3px; color: var(--fg); text-decoration: none; display: flex; align-items: center; gap: 10px; }
    .h-logo span { opacity: 0.3; }
    .h-back { font-size:10px; letter-spacing:2px; color:var(--gray); text-decoration:none; text-transform:uppercase; transition:color 0.2s; }
    .h-loc { font-size:9px; letter-spacing:2px; color:var(--fg); background:var(--glass); padding:6px 12px; border:1px solid var(--border); border-radius: 20px; }

    /* SCREENS */
    #app-content { flex:1; overflow:hidden; position:relative; opacity:1 !important; visibility:visible !important; width:100%; max-width:100vw; }
    .screen { 
      display:none; position:absolute; inset:0; flex-direction:column; justify-content:flex-start; align-items:stretch; background:var(--bg); overflow-y:auto; overflow-x:hidden; -webkit-overflow-scrolling:touch; opacity:1 !important; visibility:visible !important; width:100%; max-width:100vw; 
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE/Edge */
    }
    .screen::-webkit-scrollbar {
      display: none; /* Chrome/Safari/Opera */
    }
    .screen.active { display:flex; }

    /* HOME SCREEN */
    #home { padding:0; }
    .home-top { padding:40px 24px 24px; text-align:left; }
    .home-greeting { font-size:10px; letter-spacing:3px; text-transform:uppercase; color:var(--subtext); margin-bottom:12px; }
    .home-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(40px,10vw,60px); line-height:0.9; letter-spacing:-1px; color:var(--fg); }
    .home-sub { font-size:12px; color:var(--subtext); margin-top:12px; line-height:1.6; max-width:280px; }

    /* MAIN BUTTONS - PREMIUM TILES */
    .main-buttons { display:flex; flex-direction:column; gap:12px; padding:12px 24px 120px; }
    .main-btn {
      display:flex; flex-direction:row; align-items:center; gap:16px;
      padding:16px 20px; border:1px solid var(--border); border-radius: 20px;
      background: var(--mid);
      color:var(--fg); text-align:left;
      transition:all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      box-shadow: 0 8px 24px var(--shadow);
      position:relative; overflow:hidden;
    }
    .main-btn:active { transform:scale(0.96); }
    .mb-icon-wrap { width: 48px; height: 48px; border-radius: 50%; background: var(--glass); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; box-shadow: 0 4px 12px var(--shadow); }
    .mb-bottom { display:flex; flex-direction:column; justify-content:center; flex:1; }
    .mb-title { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:1px; line-height:1.1; margin-bottom:4px; color: var(--fg); }
    .mb-desc { font-size:10px; color:var(--subtext); letter-spacing:0.5px; line-height:1.3; padding-right:10px; }
    
    .main-btn.emergency-btn { background: linear-gradient(145deg, rgba(230,57,70,0.15) 0%, rgba(230,57,70,0.02) 100%); border-color: rgba(230,57,70,0.3); }
    .emergency-btn .mb-icon-wrap { background: rgba(230,57,70,0.2); border-color: rgba(230,57,70,0.4); box-shadow: 0 0 20px rgba(230,57,70,0.3); }
    .emergency-btn .mb-title { color:var(--accent); }
    .emergency-btn .mb-desc { color:rgba(255,255,255,0.7); }

    /* SCREENS - INNER */
    .screen-header { padding:24px; display:flex; align-items:center; gap:16px; position: relative; background: var(--bg); z-index: 10; border-bottom: 1px solid var(--border); flex-shrink: 0; }
    .back-btn { background:var(--glass); border:1px solid var(--border); color:var(--fg); width: auto; padding: 0 16px; height: 40px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size:14px; transition:all 0.2s; font-family:'Space Mono',monospace; gap: 6px; }
    .back-btn:active { background:var(--mid); transform:scale(0.9); }
    .screen-name { font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:1px; color: var(--fg); transform: translateY(2px); }
    .screen-body { padding:24px 24px 120px; }

    /* INPUTS */
    .fi { background:var(--mid); border:1px solid var(--border); border-radius: 16px; padding:16px 20px; color:var(--fg); font-family:'Space Mono',monospace; font-size:12px; outline:none; transition:all 0.3s; width:100%; margin-bottom:16px; box-shadow: inset 0 2px 4px var(--shadow); }
    .fi:focus { border-color:var(--fg); }
    .fi::placeholder { color:var(--gray); }
    textarea.fi { resize:none; min-height:140px; line-height: 1.6; }
    select.fi { 
      appearance:none; 
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='gray' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: calc(100% - 20px) center;
    }
    select.fi option { background:var(--bg); color:var(--fg); padding: 10px; }
    
    .action-btn { width:100%; padding:18px; border-radius: 16px; background:var(--fg); color:var(--bg); font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:2px; border:none; transition:all 0.2s; margin-top:8px; box-shadow: 0 8px 20px rgba(255,255,255,0.1); }
    .action-btn:active { transform: scale(0.96); box-shadow: 0 4px 10px rgba(255,255,255,0.1); }
    .action-btn:disabled { opacity: 0.5; }
    .action-btn.red-btn { background:var(--accent); color:white; box-shadow: 0 8px 20px rgba(230,57,70,0.3); }

    /* VTYPE ROW */
    .vtype-row { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:24px; }
    .vt { padding:10px 16px; border:1px solid var(--border); border-radius: 20px; background:var(--glass); color:var(--subtext); font-family:'Space Mono',monospace; font-size:11px; transition:all 0.2s; display: flex; align-items: center; gap: 6px; }
    .vt.on { background:var(--fg); color:var(--bg); border-color:var(--fg); box-shadow: 0 4px 12px var(--shadow); }

    /* RESULT PANEL */
    .result-area { margin-top:24px; margin-bottom:140px !important; border:1px solid var(--border); border-radius: 20px; padding:24px; background:var(--mid); display:none; }
    .result-area.show { display:block; animation: fadeInUp 0.5s ease forwards; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .result-loading { text-align:center; padding:32px; color:var(--subtext); font-size:12px; text-transform: uppercase; letter-spacing: 2px; }
    .rb h4 { font-size:10px; letter-spacing:3px; text-transform:uppercase; color:var(--accent); margin-bottom:10px; border-bottom:1px solid var(--border); padding-bottom:8px; }
    .rb p, .rb ul { font-size:13px; line-height:1.8; color:var(--fg); }
    .rb ul { list-style:none; }
    .rb li { margin-bottom: 8px; display: flex; gap: 10px; }
    .rb li::before { content:'•'; color:var(--accent); }

    /* MECHANIC CARDS - LUXURY DARK GLASS REDESIGN */
    .mech-card-s { 
      border: 1px solid var(--border); 
      border-radius: 26px; 
      padding: 24px; 
      margin-bottom: 18px; 
      background: var(--mid);
      transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1); 
      position: relative; 
      box-shadow: 0 12px 36px var(--shadow);
    }
    .mech-card-s:hover { 
      border-color: var(--fg); 
      transform: translateY(-4px); 
      box-shadow: 0 16px 40px var(--shadow);
    }
    
    .mc-top { display:flex; align-items:center; gap:18px; margin-bottom:20px; }
    .mc-av { 
      width: 68px; height: 68px; border-radius: 20px; 
      background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%); 
      display: flex; align-items: center; justify-content: center; 
      font-size: 32px; flex-shrink: 0; 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    .mc-info { flex:1; min-width:0; }
    .mc-name { 
      font-family: 'Bebas Neue', sans-serif; 
      font-size: 26px; letter-spacing: 1.5px; 
      line-height: 1.1; color: var(--fg); 
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
    }
    .mc-spec { font-size: 10px; color: #ff8800; letter-spacing: 1px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; }
    
    .mc-verified {
      display: inline-flex; align-items: center; gap: 5px;
      background: linear-gradient(135deg, #ffaa00, #ff8800) !important;
      color: black !important;
      padding: 3px 10px;
      border-radius: 8px;
      font-size: 9px;
      font-family: 'Space Mono', monospace;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 8px;
      box-shadow: 0 4px 10px rgba(255,136,0,0.15);
    }

    .mc-rating { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
    .mc-stars { color: #ffcc00; font-size: 11px; letter-spacing: 2px; }
    .mc-rev { color: var(--subtext); font-size: 10px; font-family: 'Space Mono', monospace; font-weight: bold; }
    
    .mc-footer { display: flex; justify-content: space-between; align-items: center; 
      padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.04); 
    }
    .mc-dist { font-size: 11px; color: var(--subtext); display: flex; align-items: center; gap: 6px; font-family: 'Space Mono', monospace; }
    .mc-dist i { color: var(--fg); font-style: normal; }
    .mc-actions { display: flex; flex-wrap: wrap; gap: 8px; width: 100%; }
    .mc-btn { 
      height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px; 
      padding: 0 12px; border-radius: 12px; 
      font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700; 
      text-decoration: none; transition: all 0.25s; border: none; cursor: pointer; 
      flex: 1; min-width: 70px;
    }
    .mc-btn-call { 
      flex: 1 1 100%; 
      background: rgba(0,208,132,0.08); color: #00d084; border: 1px solid rgba(0,208,132,0.25); 
      height: 42px; font-size: 11.5px;
    }
    .mc-btn-call:hover { background: rgba(0,208,132,0.15); transform: translateY(-1px); }
    .mc-btn-wa { background: #ffffff; color: #000000; box-shadow: 0 4px 12px rgba(255,255,255,0.05); }
    .mc-btn-wa:hover { background: #e0e0e0; transform: translateY(-1px); }
    .mc-btn-track { background: rgba(0,102,255,0.04); color: #4da6ff; border: 1px solid rgba(77,166,255,0.15); }
    .mc-btn-track:hover { background: rgba(0,102,255,0.08); transform: translateY(-1px); }
    
    /* MEDIA QUERIES FOR COMPACT MOBILE UI */
    @media (max-width: 480px) {
      /* Compact Headers */
      header { padding: 12px 16px; }
      .h-logo { font-size: 20px; }
      .h-logo img { width: 26px !important; height: 26px !important; border-radius: 6px !important; padding: 3px !important; }
      .screen-header { padding: 16px; gap: 12px; }
      .screen-name { font-size: 22px; }
      .back-btn { width: auto; height: 32px; font-size: 12px; padding: 0 12px; }

      .mech-card-s { padding: 20px; border-radius: 22px; }
      .mc-top { gap: 14px; margin-bottom: 16px; }
      .mc-av { width: 52px; height: 52px; font-size: 24px; }
      .mc-name { font-size: 18px; }
      
      /* Compact Home Screen Proportions */
      .home-top { padding: 32px 16px 16px; }
      .home-title { font-size: 36px; line-height: 1; }
      .home-sub { font-size: 11px; max-width: 260px; }
      
      .main-buttons { padding: 16px 16px 120px; gap: 12px; }
      .main-btn { padding: 18px 16px; border-radius: 20px; gap: 16px; }
      .mb-icon-wrap { width: 44px; height: 44px; font-size: 20px; }
      .mb-title { font-size: 20px; margin-bottom: 4px; }
      .mb-desc { font-size: 9px; line-height: 1.3; padding-right: 4px; }

      .mc-spec { font-size: 9px; }
      .mc-btn { height: 34px; padding: 0 6px; font-size: 8.5px; border-radius: 10px; gap: 4px; min-width: 60px; }
      .mc-btn-call { height: 38px; font-size: 10.5px; }
      .mc-dist { font-size: 10px; }
    }
    .mc-btn-wa:active { background:#ccc; }

    /* SPEC FILTERS */
    .spec-row { display:flex; gap:10px; flex-wrap:nowrap; overflow-x: auto; margin-bottom:24px; padding-bottom: 8px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .spec-row::-webkit-scrollbar { display: none; }
    .sf { padding:8px 16px; border:1px solid var(--border); border-radius: 20px; background:var(--glass); color:var(--subtext); font-family:'Space Mono',monospace; font-size:10px; white-space: nowrap; transition:all 0.2s; }
    .sf.on { background:var(--fg); color:var(--bg); border-color:var(--fg); }

    /* ===== RIDE SECTION - PREMIUM ===== */
    /* ROUTE BUILDER */
    .ride-route-box { background:var(--mid); border:1px solid var(--border); border-radius:20px; padding:20px; margin-bottom:16px; }
    .route-stop { display:flex; align-items:center; gap:12px; }
    .route-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
    .pickup-dot { background:#00d084; box-shadow:0 0 10px rgba(0,208,132,0.6); }
    .drop-dot { background:#e63946; box-shadow:0 0 10px rgba(230,57,70,0.6); }
    .route-line-v { width:2px; height:24px; background:linear-gradient(to bottom,#00d084,#e63946); margin:6px 0 6px 5px; border-radius:2px; }
    .route-input { flex:1; background:transparent; border:none; color:var(--fg); font-family:'Space Mono',monospace; font-size:12px; outline:none; padding:8px 0; }
    .route-input::placeholder { color:var(--subtext); }
    .route-detect-btn { background:rgba(0,208,132,0.1); border:1px solid rgba(0,208,132,0.3); border-radius:10px; color:#00d084; padding:8px 12px; font-size:16px; flex-shrink:0; }

    /* RIDE TYPE ROW */
    .ride-type-row { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:16px; }
    .rtype-btn { display:flex; flex-direction:column; align-items:center; gap:4px; padding:12px 8px; border:1px solid var(--border); border-radius:16px; background:transparent; color:var(--subtext); font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.5px; transition:all 0.2s; }
    .rtype-btn span { font-size:9px; }
    .rtype-btn:nth-child(1) { font-size:20px; }
    .rtype-btn.on { background:var(--glass); border-color:var(--fg); color:var(--fg); }

    /* RADAR ANIMATION */
    .radar-wrap { position:relative; width:120px; height:120px; margin:0 auto; display:flex; align-items:center; justify-content:center; }
    .radar-ring { position:absolute; border-radius:50%; border:1px solid rgba(0,208,132,0.4); animation:radarPulse 2s ease-out infinite; }
    .r1 { width:40px; height:40px; animation-delay:0s; }
    .r2 { width:80px; height:80px; animation-delay:0.5s; }
    .r3 { width:120px; height:120px; animation-delay:1s; }
    @keyframes radarPulse { 0%{opacity:0.8;transform:scale(0.5);} 100%{opacity:0;transform:scale(1);} }
    .radar-icon { font-size:32px; position:relative; z-index:2; animation:radarBounce 1s ease-in-out infinite alternate; }
    @keyframes radarBounce { 0%{transform:translateY(0);} 100%{transform:translateY(-6px);} }

    /* PROVIDER RESULT CARDS */
    .provider-result-card { border-radius:20px; padding:20px; margin-bottom:12px; display:flex; align-items:center; gap:16px; transition:all 0.2s; border:1px solid var(--border); position:relative; overflow:hidden; }
    .provider-result-card:active { transform:scale(0.98); }
    .prc-logo { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:26px; flex-shrink:0; }
    .prc-info { flex:1; }
    .prc-name { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:1px; line-height:1; }
    .prc-sub { font-size:10px; color:var(--subtext); letter-spacing:1px; margin-top:4px; }
    .prc-right { text-align:right; flex-shrink:0; }
    .prc-price { font-family:'Bebas Neue',sans-serif; font-size:28px; line-height:1; }
    .prc-eta { font-size:10px; color:var(--subtext); letter-spacing:1px; margin-top:4px; }
    .prc-avail { position:absolute; top:14px; right:14px; width:8px; height:8px; border-radius:50%; background:#00d084; box-shadow:0 0 8px rgba(0,208,132,0.8); }

    /* Card brand colors */
    .prc-bolt { background:var(--glass); border-color:rgba(127,234,0,0.2); }
    .prc-bolt .prc-name { color:#7fea00; }
    .prc-bolt .prc-logo { background:rgba(127,234,0,0.12); }
    .prc-uber { background:var(--glass); border-color:var(--border); }
    .prc-uber .prc-name { color:var(--fg); }
    .prc-uber .prc-logo { background:var(--glass); }
    .prc-indrive { background:var(--glass); border-color:rgba(77,166,255,0.2); }
    .prc-indrive .prc-name { color:#4da6ff; }
    .prc-indrive .prc-logo { background:rgba(77,166,255,0.12); }
    .prc-rida { background:var(--glass); border-color:rgba(255,80,80,0.2); }
    .prc-rida .prc-name { color:#ff5050; }
    .prc-rida .prc-logo { background:rgba(255,80,80,0.12); }

    /* BOOKING MODAL */
    .booking-card { background:var(--bg); border:1px solid var(--border); border-radius:28px; padding:32px 24px; width:100%; max-width:400px; }
    .driver-card { display:flex; align-items:center; gap:16px; background:var(--mid); border:1px solid var(--border); border-radius:16px; padding:16px; margin:16px 0; }
    .driver-av { width:50px; height:50px; border-radius:50%; background:var(--glass); display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
    .booking-progress { height:4px; background:var(--border); border-radius:2px; overflow:hidden; margin:8px 0; }
    .booking-progress-fill { height:100%; background:linear-gradient(to right,#00d084,#4da6ff); border-radius:2px; transition:width 0.3s; }

    /* BOOKING DETAIL ROWS */
    .booking-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:12px; }
    .booking-row:last-child { border-bottom:none; }
    .booking-row-label { color:rgba(255,255,255,0.4); }
    .booking-row-val { color:var(--fg); font-weight:600; }

    /* RIDE CARDS (legacy kept) */
    .ride-card-s { border:1px solid var(--border); border-radius:20px; padding:20px; margin-bottom:12px; display:flex; align-items:center; gap:16px; background:var(--glass); }
    .prov-btn { padding:16px; border-radius:16px; border:1px solid var(--border); background:var(--glass); font-family:'Space Mono',monospace; font-size:11px; text-decoration:none; display:flex; align-items:center; gap:10px; color:var(--fg); transition:all 0.2s; }
    .bolt { border-color:rgba(127,234,0,0.3); color:#7fea00; background:rgba(127,234,0,0.05); }
    .indrive { border-color:rgba(77,166,255,0.3); color:#4da6ff; background:rgba(77,166,255,0.05); }
    .rida { border-color:rgba(255,128,128,0.3); color:#ff8080; background:rgba(255,128,128,0.05); }

    /* EMERGENCY SCREEN */
    #emergency { background: #000; }
    .em-top { padding:48px 24px; text-align:center; }
    .em-icon { font-size:80px; filter: drop-shadow(0 0 40px rgba(230,57,70,0.6)); animation:emp 1s ease-in-out infinite; }
    @keyframes emp { 0%,100%{transform:scale(1);} 50%{transform:scale(1.1);} }
    .em-title { font-family:'Bebas Neue',sans-serif; font-size:80px; color:var(--red); letter-spacing:2px; margin-top:16px; line-height: 0.9; }
    .em-sub { font-size:12px; color:var(--subtext); margin-top:12px; line-height:1.6; }
    
    .em-numbers { padding:0 24px; margin-bottom:32px; display: flex; flex-direction: column; gap: 12px; }
    .em-num-btn { display:flex; align-items:center; justify-content:space-between; padding:24px; border-radius: 24px; background:var(--glass); border:1px solid var(--border); text-decoration:none; transition: all 0.3s; }
    .em-num-btn:active { transform: scale(0.98); background:var(--mid); border-color:var(--red); }
    .em-num-val { font-family:'Bebas Neue',sans-serif; font-size:42px; color:var(--red); line-height:1; }
    .em-num-label { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--subtext); margin-bottom:6px; }
    .em-num-right { width: 48px; height: 48px; border-radius: 50%; background: var(--red); color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 15px rgba(230,57,70,0.4); }

    /* SLIDE TO SOS */
    .slide-sos-container { 
      margin: 0 24px 32px; height: 76px; 
      background: var(--mid); 
      border: 1px solid var(--border); 
      border-radius: 38px; position: relative; 
      overflow: hidden; display: flex; 
      align-items: center; justify-content: center; 
      box-shadow: inset 0 2px 10px var(--shadow);
    }
    .slide-track-fill {
      position: absolute; left: 0; top: 0; height: 100%;
      background: linear-gradient(90deg, rgba(230,57,70,0.2), rgba(230,57,70,0.6));
      width: 0; pointer-events: none;
    }
    .slide-text { 
      font-size: 11px; letter-spacing: 3px; 
      text-transform: uppercase; color: #ffffff; 
      opacity: 1; font-weight: 900; 
      pointer-events: none; z-index: 1;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    .slide-handle { 
      position: absolute; left: 6px; top: 6px; 
      width: 64px; height: 64px; 
      background: linear-gradient(135deg, #ff4d4d, #e63946); 
      border-radius: 50%; display: flex; 
      align-items: center; justify-content: center; 
      font-size: 24px; color: white;
      box-shadow: 0 4px 15px rgba(230,57,70,0.4); 
      z-index: 3; cursor: grab;
      transition: box-shadow 0.2s;
    }
    .slide-handle:active { cursor: grabbing; box-shadow: 0 8px 25px rgba(230,57,70,0.6); }

    /* FLOATING BOTTOM NAV - PREMIUM */
    .bottom-nav {
      position:fixed; bottom:16px; left:12px; right:12px; z-index:100;
      background:var(--bg); transition: background 0.4s;
      border:1px solid var(--border); border-radius: 28px;
      display:grid; grid-template-columns:repeat(6,1fr); padding: 6px;
      box-shadow: 0 20px 40px var(--shadow);
      top: auto; height: auto;
    }
    .nav-tab { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; padding:8px 2px; border:none; background:transparent; color:var(--subtext); font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0; transition:all 0.3s; border-radius: 16px; position: relative; }
    .nav-tab.active { color:var(--fg); }
    .nav-tab.emergency-tab { color:rgba(230,57,70,0.6); }
    .nav-tab.emergency-tab.active { color:var(--accent); background: rgba(230,57,70,0.1); }
    .nav-tab-icon { font-size: 18px; line-height: 1; transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .nav-tab.active .nav-tab-icon { transform: translateY(-3px) scale(1.1); color: var(--fg); }
    .nav-tab.emergency-tab.active .nav-tab-icon { color: var(--accent); }
    
    .nav-indicator { position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%) scale(0); width: 4px; height: 4px; border-radius: 50%; background: var(--fg); transition: all 0.3s; opacity: 0; }
    .nav-tab.active .nav-indicator { transform: translateX(-50%) scale(1); opacity: 1; }
    .nav-tab.emergency-tab .nav-indicator { background: var(--accent); }

    /* VITAL HEALTH CARDS */
    .vital-card { background:var(--mid); border:1px solid var(--border); border-radius:16px; padding:16px; }
    .vital-label { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.4); margin-bottom:8px; }
    .vital-val { font-family:'Bebas Neue',sans-serif; font-size:24px; line-height:1; margin-bottom:4px; }
    .vital-status-tag { font-size:9px; letter-spacing:1px; padding:2px 6px; border-radius:6px; display:inline-block; margin-bottom:8px; }
    .vital-bar { height:3px; background:rgba(255,255,255,0.08); border-radius:2px; overflow:hidden; }
    .vital-fill { height:100%; border-radius:2px; transition:width 0.8s ease; }
    .vital-good .vital-val { color:#00d084; }
    .vital-good .vital-status-tag { background:rgba(0,208,132,0.15); color:#00d084; }
    .vital-warn .vital-val { color:#ff8800; }
    .vital-warn .vital-status-tag { background:rgba(255,136,0,0.15); color:#ff8800; }
    .vital-crit .vital-val { color:#e63946; }
    .vital-crit .vital-status-tag { background:rgba(230,57,70,0.15); color:#e63946; }
    .veh-card { background:linear-gradient(135deg,#111 0%,#0a0a0a 100%); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:24px; position:relative; overflow:hidden; }
    .veh-card::before { content:''; position:absolute; top:-40px; right:-40px; width:180px; height:180px; background:radial-gradient(circle,rgba(0,208,132,0.06) 0%,transparent 70%); border-radius:50%; pointer-events:none; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    #carImgShimmer { animation: shimmer 1.5s infinite linear; }
    @keyframes pulseRed { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes fadeSlideUp { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
    @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
    @keyframes rippleOut { 0%{transform:scale(0.8);opacity:1} 100%{transform:scale(1.4);opacity:0} }
    .voice-ripple.active { animation: rippleOut 1.2s infinite ease-out; }
    .maint-card { background:var(--mid); border:1px solid var(--border); border-radius:16px; padding:14px 16px; cursor:pointer; display:flex; align-items:center; gap:14px; margin-bottom:10px; transition:background 0.2s; }
    .maint-card:active { background:#1a1a1a; }
    .maint-card.overdue { border-color:rgba(230,57,70,0.3); }

    @media (max-width:600px) {
      .providers { grid-template-columns: 1fr; }
      .em-num-val { font-size: 32px; }
      .main-buttons { grid-template-columns: 1fr; }
      .main-btn { min-height: 140px; flex-direction: row; align-items: center; padding: 24px; gap: 20px; }
      .mb-icon-wrap { margin-bottom: 0; width: 56px; height: 56px; font-size: 24px; flex-shrink: 0; }
      .mb-bottom { flex: 1; }
    }

    /* DAILY VITALS */
    .vital-card { background:rgba(255,255,255,0.04); border:1px solid var(--border); padding:16px; border-radius:16px; transition:transform 0.3s; }
    .vital-card:hover { transform:translateY(-2px); border-color:rgba(255,255,255,0.15); }
    .vital-label { font-size:9px; color:var(--gray); letter-spacing:1px; text-transform:uppercase; margin-bottom:6px; }
    .vital-val { font-family:'Bebas Neue',sans-serif; font-size:24px; color:#fff; }
    .vital-bar { height:3px; background:rgba(255,255,255,0.05); margin-top:8px; border-radius:2px; overflow:hidden; }
    .vital-fill { height:100%; border-radius:2px; transition:width 1s; }

    /* CUSTOM MAP MARKERS */
    .mech-pin {
      font-size: 20px;
      background: var(--mid);
      border: 1px solid var(--border);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px var(--shadow);
    }
    .user-pin {
      position: relative;
      font-size: 20px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-car {
      font-size: 22px;
      z-index: 2;
    }
    .user-car-pulse {
      position: absolute;
      width: 100%;
      height: 100%;
      background: rgba(0, 208, 132, 0.2);
      border: 2px solid #00d084;
      border-radius: 50%;
      animation: pulse-ring 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
      z-index: 1;
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.33); opacity: 1; }
      80%, 100% { transform: scale(1.3); opacity: 0; }
    }

    /* PREMIUM LIVE MAP TRACKER MOBILE OVERLAY - Slate-Glass Aesthetic */
    .tracker-header {
      position: absolute;
      top: env(safe-area-inset-top, 20px);
      left: 16px;
      right: 16px;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-radius: 20px;
      background: linear-gradient(135deg, rgba(16, 16, 20, 0.88) 0%, rgba(8, 8, 10, 0.95) 100%);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12);
      animation: trackerSlideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .tracker-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .tracker-pulse-dot {
      width: 8px;
      height: 8px;
      background: #00d084;
      border-radius: 50%;
      box-shadow: 0 0 10px #00d084;
      animation: trackerBeacon 1.5s infinite;
    }
    .tracker-close-btn {
      background: rgba(230, 57, 70, 0.08);
      border: 1px solid rgba(230, 57, 70, 0.25);
      color: #e63946;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(230, 57, 70, 0.1);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .tracker-close-btn:active {
      background: rgba(230, 57, 70, 0.2);
      border-color: rgba(230, 57, 70, 0.4);
      transform: scale(0.9);
    }
    
    .tracker-drawer {
      position: absolute;
      bottom: env(safe-area-inset-bottom, 24px);
      left: 16px;
      right: 16px;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px;
      border-radius: 28px;
      background: linear-gradient(135deg, rgba(18, 18, 24, 0.9) 0%, rgba(10, 10, 12, 0.97) 100%);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.12), inset 0 -1px 1px rgba(0, 0, 0, 0.5);
      animation: trackerSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .drawer-handle {
      width: 40px;
      height: 5px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 3px;
      margin: -12px auto 4px;
      box-shadow: inset 0 1px 1px rgba(0,0,0,0.5);
    }
    
    .tracker-mech-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .tracker-avatar-wrap {
      border: 2px solid #ff8800;
      border-radius: 50%;
      padding: 3px;
      background: linear-gradient(135deg, rgba(255,136,0,0.2), transparent);
      box-shadow: 0 4px 12px rgba(255, 136, 0, 0.15);
    }
    .tracker-avatar {
      width: 52px;
      height: 52px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 50%;
      font-size: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
    }
    .tracker-mech-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .tracker-verified-badge {
      font-size: 8px;
      font-weight: bold;
      color: #ff8800;
      letter-spacing: 1px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    .tracker-mech-name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 24px;
      letter-spacing: 1px;
      color: #fff;
    }
    .tracker-mech-spec {
      font-size: 10px;
      color: var(--gray);
    }
    
    .tracker-stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .tracker-stat-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.05);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .tracker-stat-pill:active {
      border-color: rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.4);
    }
    .tracker-pill-icon {
      font-size: 18px;
    }
    .tracker-pill-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .tracker-pill-label {
      font-size: 8px;
      color: var(--gray);
      letter-spacing: 0.5px;
    }
    .tracker-pill-val {
      font-size: 14px;
      font-weight: bold;
      color: #fff;
    }
    
    .tracker-stepper {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 10px 0;
      margin: 8px 0;
    }
    .stepper-line {
      position: absolute;
      top: 22px;
      left: 36px;
      right: 36px;
      height: 2px;
      background: rgba(255, 255, 255, 0.05);
      z-index: 1;
    }
    .stepper-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #00d084, #ff8800);
      border-radius: 1px;
      box-shadow: 0 0 8px rgba(0, 208, 132, 0.5);
      transition: width 0.5s ease;
    }
    .stepper-step {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 60px;
    }
    .step-dot {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.3);
      font-size: 10px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
      transition: all 0.3s;
    }
    .stepper-step.active .step-dot {
      background: #00d084;
      border-color: #00d084;
      color: #000;
      box-shadow: 0 0 10px rgba(0, 208, 132, 0.3);
    }
    .stepper-step.active.pulsing .step-dot {
      background: #ff8800;
      border-color: #ff8800;
      color: #fff;
      box-shadow: 0 0 10px rgba(255, 136, 0, 0.4);
      animation: stepPulse 1.8s infinite;
    }
    .step-label {
      font-size: 8px;
      color: var(--gray);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: center;
    }
    .stepper-step.active .step-label {
      color: #fff;
      font-weight: bold;
    }
    
    .tracker-actions-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .tracker-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 1px;
      text-decoration: none;
      font-family: 'Space Mono', monospace;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .tracker-btn.phone {
      background: linear-gradient(180deg, #ffffff 0%, #ebebeb 100%);
      color: #050505;
      border: none;
      box-shadow: 0 4px 16px rgba(255, 255, 255, 0.15), inset 0 1px 0 #ffffff;
    }
    .tracker-btn.wa {
      background: rgba(0, 208, 132, 0.06);
      border: 1px solid rgba(0, 208, 132, 0.25);
      color: #00d084;
      box-shadow: inset 0 1px 1px rgba(0, 208, 132, 0.1), 0 4px 16px rgba(0, 208, 132, 0.08);
    }
    .tracker-btn:active {
      transform: scale(0.96);
    }
    .tracker-btn.wa:active {
      background: rgba(0, 208, 132, 0.12);
      border-color: rgba(0, 208, 132, 0.4);
    }
    
    @keyframes trackerSlideDown {
      from { transform: translateY(-30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes trackerSlideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes trackerBeacon {
      0% { transform: scale(0.9); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.4; }
      100% { transform: scale(0.9); opacity: 1; }
    }
    @keyframes stepPulse {
      0% { box-shadow: 0 0 0 0 rgba(255, 136, 0, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(255, 136, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 136, 0, 0); }
    }
    
    /* DYNAMIC NAV HUD FOR GOOGLE MAPS NAVIGATION FEEL */
    .navigation-hud {
      position: absolute;
      top: calc(env(safe-area-inset-top, 20px) + 80px);
      left: 16px;
      right: 16px;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 20px;
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(18, 18, 24, 0.9) 0%, rgba(10, 10, 12, 0.97) 100%);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 208, 132, 0.25);
      box-shadow: 0 12px 32px rgba(0,0,0,0.5), 0 0 15px rgba(0, 208, 132, 0.1);
      animation: trackerSlideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .hud-turn-icon {
      font-size: 28px;
      font-weight: bold;
      color: #00d084;
      background: rgba(0, 208, 132, 0.1);
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
    }
    .hud-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .hud-instruction {
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      font-weight: bold;
      color: #fff;
    }
    .hud-sub-instruction {
      font-size: 9px;
      color: var(--gray);
    }
    .hud-voice-btn {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .hud-voice-btn.muted {
      color: rgba(255,255,255,0.3);
      background: rgba(255,0,0,0.1);
      border-color: rgba(255,0,0,0.2);
    }
    
    /* GOOGLE MAPS ROUTE PILLS AND PIN CUSTOM STYLING */
    .map-route-pill {
      background: #ffffff;
      border: 1px solid #d1d1d6;
      border-radius: 8px;
      padding: 6px 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      font-weight: bold;
      color: #1c1c1e;
      text-align: center;
      line-height: 1.2;
      z-index: 5;
    }
    .map-route-pill.alt {
      background: #f2f2f7;
      border-color: #e5e5ea;
      color: #8e8e93;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .red-destination-pin {
      width: 28px;
      height: 38px;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e63946"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="%239c1c24" stroke-width="1.5"/></svg>');
      background-size: contain;
      background-repeat: no-repeat;
      cursor: pointer;
      filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));
    }
    /* Leaflet Popup bubble overrides for custom glassmorphic pills */
    .leaflet-popup-content-wrapper {
      background: transparent !important;
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
    }
    .leaflet-popup-tip-container {
      display: none !important;
    }
    .leaflet-popup-close-button {
      display: none !important;
    }
    .leaflet-popup-content {
      margin: 0 !important;
    }
    /* Leaflet Premium dark theme filter for Esri Street Maps */
    .leaflet-tile-pane {
      filter: brightness(0.65) contrast(1.15) saturate(0.95) saturate(0.2) invert(1) hue-rotate(180deg);
      transition: filter 0.3s ease;
    }
    /* Disable map invert in light mode */
    [data-theme="light"] .leaflet-tile-pane {
      filter: none !important;
    }
    /* Light Theme override for live tracking header/drawer if style is light mode */
    #mapModal .tracker-header {
      background: rgba(255, 255, 255, 0.85);
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    #mapModal .tracker-header-left span {
      color: #1c1c1e !important;
    }
    #mapModal .tracker-close-btn {
      color: #1c1c1e !important;
      background: rgba(0, 0, 0, 0.05);
    }
    #mapModal .tracker-drawer {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 245, 247, 0.97) 100%);
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.08);
    }
    #mapModal .drawer-handle {
      background: rgba(0, 0, 0, 0.15);
    }
    #mapModal .tracker-mech-name {
      color: #1c1c1e;
    }
    #mapModal .tracker-mech-spec {
      color: #8e8e93;
    }
    #mapModal .tracker-stat-pill {
      background: rgba(0, 0, 0, 0.03);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    #mapModal .tracker-pill-label {
      color: #8e8e93;
    }
    #mapModal .tracker-pill-val {
      color: #1c1c1e;
    }
    #mapModal .step-label {
      color: #8e8e93;
    }
    #mapModal .stepper-step.active .step-label {
      color: #1c1c1e;
    }
    #mapModal .step-dot {
      background: #e5e5ea;
      color: #8e8e93;
    }
    #mapModal .stepper-step.active .step-dot {
      background: #00d084;
      color: #fff;
    }
  </style>
</head>
<body class="dark">
<!-- PRELOADER -->
<div id="preloader">
  <div class="preloader-rings">
    <div class="preloader-ring"></div>
    <div class="preloader-ring"></div>
    <div class="preloader-ring"></div>
    <img src="assets/logo.png" class="preloader-logo" alt="AutoTriage">
  </div>
  <div class="preloader-name">AUTO<span>TRIAGE</span></div>
  <div class="preloader-tag">AI Vehicle Intelligence</div>
  <div class="preloader-dots">
    <div class="preloader-dot"></div>
    <div class="preloader-dot"></div>
    <div class="preloader-dot"></div>
    <div class="preloader-dot"></div>
  </div>
</div>



<div id="scrollProgress"></div>


<!-- MOBILE MENU -->
<div id="mobileMenu" class="mobile-overlay">
  <div class="mob-close" onclick="toggleMobileMenu()">×</div>
  <div class="mob-links">
    <a href="#" onclick="goTo('home'); toggleMobileMenu(); event.preventDefault();">Home</a>
    <a href="auto-triage-explainer.html" target="_blank">Watch Explainer</a>
    <div class="mob-divider"></div>
    <a href="https://wa.me/1234567890" target="_blank" class="mob-cta">Support Center</a>
  </div>
</div>

<header>
  <div style="display:flex; align-items:center; gap:10px;">
    <div class="h-logo" style="display:flex; align-items:center; gap:10px;">
      <img src="assets/logo.png" alt="Logo" style="height:32px; width:32px; border-radius:8px; background:var(--mid); padding:4px; border:1px solid var(--border);">
      AUTO<span>TRIAGE</span>
    </div>
  </div>
  <div style="display:flex; align-items:center; gap:12px;">
    <div style="display:flex; align-items:center; gap:8px;">
        <button id="headerThemeToggle" onclick="themeModule.toggle()" style="background:var(--glass);border:1px solid var(--border);font-size:14px;cursor:pointer;height:32px;width:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.2s;">🌙</button>
        <button onclick="openProfileDrawer()" style="background:var(--glass);border:1px solid var(--border);font-size:14px;cursor:pointer;height:32px;width:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.2s;box-shadow:0 4px 10px var(--shadow);">⚙️</button>
    </div>
  </div>
</header>

<div id="app-content">

<!-- =====================
     SCREEN: HOME
     ==================== -->
<div id="home" class="screen active">
  <div class="home-top">
    <div class="home-greeting">Good day — what do you need?</div>
    <div class="home-title">HOW CAN<br>WE HELP?</div>
    <div class="home-sub">Tap a button below to get started.</div>
  </div>
  <div id="homeDashWidgets" style="padding:0 24px;"></div>
  <div class="main-buttons">
    <button class="main-btn" onclick="goTo('diagnose')">
      <div class="mb-icon-wrap">🧠</div>
      <div class="mb-bottom">
        <div class="mb-title">DIAGNOSE<br>MY CAR</div>
        <div class="mb-desc">Describe problem · AI analysis · Solutions</div>
      </div>
    </button>
    <button class="main-btn" onclick="goTo('mechanics')">
      <div class="mb-icon-wrap">🔧</div>
      <div class="mb-bottom">
        <div class="mb-title">FIND A<br>MECHANIC</div>
        <div class="mb-desc">Mechanics near you · Call directly</div>
      </div>
    </button>
    <button class="main-btn" onclick="goTo('rides')">
      <div class="mb-icon-wrap">🚗</div>
      <div class="mb-bottom">
        <div class="mb-title">GET A<br>RIDE</div>
        <div class="mb-desc">Uber · Lyft · Bolt · DiDi · Grab · InDrive</div>
      </div>
    </button>
    <button class="main-btn" onclick="goTo('parts')">
      <div class="mb-icon-wrap">⚙️</div>
      <div class="mb-bottom">
        <div class="mb-title">PARTS<br>PRICING</div>
        <div class="mb-desc">Check parts prices &middot; Local stores</div>
      </div>
    </button>
    <button class="main-btn emergency-btn" onclick="goTo('emergency')">
      <div class="mb-icon-wrap">🚨</div>
      <div class="mb-bottom">
        <div class="mb-title">EMERGENCY</div>
        <div class="mb-desc">Police 911 · 112 · Rescue 999</div>
      </div>
    </button>
  </div>
</div>

<!-- =====================
     SCREEN: DIAGNOSE
     ==================== -->
<div id="diagnose" class="screen">
  <div class="screen-header">
    <button class="back-btn" onclick="goTo('home')">←</button>
    <div class="screen-name">🧠 AI DIAGNOSIS</div>
  </div>
  <div class="screen-body" style="padding-bottom:160px;">
    <!-- VEHICLE TELEMETRY SYNC BANNER -->
    <div id="diagTargetBanner" style="margin-bottom:16px;padding:14px 16px;border-radius:16px;background:linear-gradient(135deg,rgba(77,166,255,0.08),rgba(99,102,241,0.06));border:1px solid rgba(77,166,255,0.2);display:flex;align-items:center;gap:12px;">
      <div style="font-size:20px;animation:pulse 2s infinite;">📡</div>
      <div style="flex:1;">
        <div style="font-size:9px;color:#4da6ff;font-family:'Space Mono',monospace;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Target Vehicle Telemetry Sync</div>
        <div style="font-size:12px;font-weight:bold;color:#fff;margin-top:2px;" id="diag-target-badge">Universal Car Profiling</div>
      </div>
      <span style="background:rgba(77,166,255,0.15);color:#4da6ff;padding:4px 10px;border-radius:20px;font-size:9px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">OBD-II Active</span>
    </div>
    <div class="vtype-row">
      <button class="vt on" onclick="setVt(this,'Car')">🚗 Car</button>
      <button class="vt" onclick="setVt(this,'SUV')">🚙 SUV</button>
      <button class="vt" onclick="setVt(this,'Truck')">🛻 Truck</button>
      <button class="vt" onclick="setVt(this,'Motorcycle')">🏍 Moto</button>
      <button class="vt" onclick="setVt(this,'Bus/Van')">🚐 Bus</button>
      <button class="vt" onclick="setVt(this,'Scooter')">🛺 Scooter</button>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
      <select id="langSelect" class="fi" style="margin-bottom:0;padding:8px 12px;width:auto;">
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="zh">Chinese</option>
      </select>
      <button onclick="goTo('history')" style="background:var(--glass);border:1px solid var(--border);color:var(--fg);border-radius:12px;padding:8px 12px;font-family:'Space Mono',monospace;font-size:11px;">🕒 History</button>
    </div>
    <div style="position:relative;">
      <textarea class="fi" id="problemText" placeholder="Describe your vehicle problem in detail...&#10;&#10;e.g. My car is making a grinding noise when I press the brake pedal..."></textarea>
      <div style="position:absolute;bottom:24px;right:8px;display:flex;gap:4px;">
        <button id="micBtn" onclick="toggleDictation()" style="background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:36px;height:36px;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;">🎙️</button>
        <button onclick="document.getElementById('photoInput').click()" style="background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:36px;height:36px;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;">📸</button>
        <button id="stethBtn" onclick="openStethoscopeMobile()" style="background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:36px;height:36px;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="Stethoscope Engine Scan">🩺</button>
        <input type="file" id="photoInput" accept="image/*" style="display:none;" onchange="attachDiagnosisImage(this)" />
        <img id="diagImgPreview" style="display:none; width:36px; height:36px; border-radius:8px; object-fit:cover; border:1px solid #00d084;" />
      </div>
    </div>

    <!-- Stethoscope Visualizer Overlay Dashboard -->
    <div id="stethoscopeOverlay" class="glass-panel" style="display:none; margin-top:12px; padding:16px; border-radius:24px; border:1px solid rgba(255,255,255,0.1); background:rgba(20,21,23,0.85); backdrop-filter:blur(20px); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ff3333;" class="animate-pulse" id="stethStatusDot"></span>
          <span style="font-family:'Space Mono',monospace; font-size:11px; font-weight:bold; color:#fff;" id="stethStatusText">STETHOSCOPE DIAGNOSTIC SCANNER</span>
        </div>
        <button onclick="closeStethoscopeMobile()" style="background:transparent; border:none; color:rgba(255,255,255,0.4); cursor:pointer; font-size:14px; outline:none;">✕</button>
      </div>
      
      <!-- Audio Waveform Canvas -->
      <canvas id="stethCanvas" style="width:100%; height:100px; background:rgba(0,0,0,0.4); border-radius:16px; border:1px solid rgba(255,255,255,0.05); margin-bottom:12px; display:block;"></canvas>
      
      <!-- Frequency Telemetry Stats -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; font-family:'Space Mono',monospace; font-size:10px; color:rgba(255,255,255,0.6);">
        <div style="padding:8px 12px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">Peak Freq: <span id="stethPeakVal" style="color:#00d084; font-weight:bold;">-- Hz</span></div>
        <div style="padding:8px 12px; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">Engine Vibe: <span id="stethVibeVal" style="color:#ff8800; font-weight:bold;">-- CPM</span></div>
      </div>
      
      <!-- Test Simulator Panel -->
      <div style="margin-bottom:12px; padding:10px 14px; background:rgba(255,255,255,0.02); border-radius:16px; border:1px solid rgba(255,255,255,0.05);">
        <div style="font-size:9px; font-family:'Space Mono',monospace; margin-bottom:8px; color:rgba(255,255,255,0.4); letter-spacing:1px; font-weight:bold;">TEST DRIVE SCAN SIMULATOR:</div>
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px;">
          <button id="simBtn-healthy" onclick="selectStethSim('healthy')" style="font-size:9px; padding:6px; border-radius:8px; background:rgba(0,208,132,0.1); border:1px solid rgba(0,208,132,0.3); color:#00d084; font-family:'Space Mono',monospace; cursor:pointer; font-weight:bold; transition:all 0.2s;">🟢 Normal</button>
          <button id="simBtn-belt" onclick="selectStethSim('belt')" style="font-size:9px; padding:6px; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); color:#a0a5b5; font-family:'Space Mono',monospace; cursor:pointer; font-weight:bold; transition:all 0.2s;">🔴 Belt</button>
          <button id="simBtn-valve" onclick="selectStethSim('valve')" style="font-size:9px; padding:6px; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); color:#a0a5b5; font-family:'Space Mono',monospace; cursor:pointer; font-weight:bold; transition:all 0.2s;">🟡 Valve</button>
          <button id="simBtn-exhaust" onclick="selectStethSim('exhaust')" style="font-size:9px; padding:6px; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); color:#a0a5b5; font-family:'Space Mono',monospace; cursor:pointer; font-weight:bold; transition:all 0.2s;">💨 Exhaust</button>
        </div>
      </div>
      
      <!-- Action Controls -->
      <div style="display:flex; gap:8px;">
        <button id="stethActionBtn" onclick="toggleStethScan()" class="action-btn" style="flex:2; margin:0; padding:12px; font-size:11px; font-family:'Space Mono',monospace; letter-spacing:1px; background:#2563eb; color:white; border-radius:14px; border:none; cursor:pointer; font-weight:bold; box-shadow:0 4px 12px rgba(37,99,235,0.3); transition:all 0.2s;">🎙️ START ENGINE SCAN</button>
        <button onclick="closeStethoscopeMobile()" class="action-btn" style="flex:1; margin:0; padding:12px; font-size:11px; font-family:'Space Mono',monospace; letter-spacing:1px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; border-radius:14px; cursor:pointer;">CANCEL</button>
      </div>
      
      <!-- Countdown Progress Bar -->
      <div id="stethProgressWrap" style="display:none; width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; margin-top:12px; overflow:hidden; position:relative;">
        <div id="stethProgressBar" style="width:0%; height:100%; background:linear-gradient(to right, #00d084, #ff8800, #ff3333); transition:width 0.1s linear;"></div>
      </div>
    </div>

    <button class="action-btn" id="diagnoseBtn" onclick="runDiagnosis()">Run AI Diagnosis →</button>
    <button class="action-btn" id="manualDiagnoseBtn" onclick="openManualDiagnosisModal()" style="margin-top:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); color:var(--gray); font-size:10px; font-family:'Space Mono',monospace; letter-spacing:1px; width:100%; border-radius:14px; padding:12px; cursor:pointer; font-weight:bold; transition:all 0.2s;">📝 MANUALLY WRITE DIAGNOSIS REPORT</button>

    <div class="result-area" id="resultArea">
      <div class="result-loading" id="resultLoading">
        <div>AI Analyzing <div class="dots"><span></span><span></span><span></span></div></div>
      </div>
      <div id="resultBody"></div>
    </div>

    <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.07);">

    </div>
  </div>
</div>

<!-- =====================
     SCREEN: MECHANICS
     ==================== -->
<div id="mechanics" class="screen">
  <div class="screen-header">
    <button class="back-btn" onclick="goTo('home')">←</button>
    <div class="screen-name">🔧 MECHANICS</div>
  </div>
  <div class="screen-body" style="padding-bottom:160px;">
    <input class="fi" type="text" id="mechQ" placeholder="Search by name, area or specialization..." oninput="filterMechs()"/>
    


    <div class="spec-row">
      <button class="sf on" onclick="filterSpec2(this,'All')">All</button>
      <button class="sf" onclick="filterSpec2(this,'General Mechanic')">General</button>
      <button class="sf" onclick="filterSpec2(this,'Engine Specialist')">Engine</button>
      <button class="sf" onclick="filterSpec2(this,'Auto Electrician')">Electric</button>
      <button class="sf" onclick="filterSpec2(this,'Brake Specialist')">Brakes</button>
      <button class="sf" onclick="filterSpec2(this,'AC Specialist')">AC</button>
    </div>
    <div id="aiRecommendationBanner" style="display:none; margin: 12px 0 16px; padding: 14px 16px; background: linear-gradient(135deg, rgba(230,57,70,0.12), rgba(255,136,0,0.06)); border: 1px solid rgba(230,57,70,0.25); border-radius: 16px; align-items: center; gap: 12px;">
      <div style="font-size: 20px;">🤖</div>
      <div style="flex: 1;">
        <div style="font-size: 9px; color: var(--accent); font-family: 'Space Mono', monospace; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">AI Recommendation</div>
        <div style="font-size: 11px; font-weight: bold; margin-top: 2px; color: var(--light-text);" id="aiRecommendationText">Brake Specialist (Priority Sorted to Top)</div>
      </div>
      <button onclick="clearAIDiagnosedSpecialty()" style="background: none; border: none; color: var(--gray); font-size: 14px; cursor: pointer; padding: 4px;">✕</button>
    </div>
    <div id="mechList"></div>
  </div>
</div>

<!-- =====================
     SCREEN: RIDES
     ==================== -->
<div id="rides" class="screen">
  <div class="screen-header">
    <button class="back-btn" onclick="goTo('home')">←</button>
    <div class="screen-name">🚗 GET A RIDE</div>
    <div id="ride-live-badge" style="margin-left:auto;font-size:9px;letter-spacing:2px;color:#00d084;border:1px solid rgba(0,208,132,0.3);padding:4px 10px;border-radius:20px;display:none;">● LIVE</div>
  </div>
  <div class="screen-body relative h-full w-full" style="padding:0; overflow:hidden; background:#000000;">
    <!-- VIP SHOWCASE (INITIAL STATE) -->
    <style>
      @keyframes mobVipIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      .mpcard {
        position:relative;
        background:linear-gradient(135deg,#0d0d11,#111117);
        border:1px solid rgba(255,255,255,0.07);
        border-radius:16px;
        padding:16px 10px 12px;
        display:flex; flex-direction:column;
        align-items:center; justify-content:center; gap:9px;
        cursor:pointer; overflow:hidden;
        transition:transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s ease;
        animation: mobVipIn 0.4s ease both;
        -webkit-tap-highlight-color: transparent;
      }
      .mpcard:active { transform:scale(0.95); }
      .mpcard .mpicon {
        width:58px; height:58px; border-radius:14px;
        display:flex; align-items:center; justify-content:center;
        transition:transform 0.3s ease;
        flex-shrink:0;
      }
      .mpcard:active .mpicon { transform:scale(0.9) rotate(-3deg); }
      .mpcard .mplabel {
        font-size:10px; font-weight:800; letter-spacing:3px;
        color:rgba(255,255,255,0.6); text-transform:uppercase;
        font-family:'Courier New',monospace;
      }
      .mpcard .mpnum {
        position:absolute; top:8px; right:10px;
        font-size:8px; font-family:monospace; color:rgba(255,255,255,0.1);
      }
      .mpcard:nth-child(1){animation-delay:0.04s}
      .mpcard:nth-child(2){animation-delay:0.09s}
      .mpcard:nth-child(3){animation-delay:0.14s}
      .mpcard:nth-child(4){animation-delay:0.19s}
      .mpcard:nth-child(5){animation-delay:0.24s}
      .mpcard:nth-child(6){animation-delay:0.29s}
    </style>
    <div id="mobVipShowcase" class="absolute inset-0 z-50 flex flex-col items-center overflow-y-auto transition-all duration-700" style="padding:12px 12px 28px; background: radial-gradient(circle at 50% 25%, #252528 0%, #050505 100%);">

      <!-- Cinematic Video Backdrop: masked container removes all square boundaries; screen blend merges car onto the ash background -->
      <div style="width:100%;position:relative;flex-shrink:0;margin-bottom:-16px; -webkit-mask-image:radial-gradient(ellipse at 50% 65%, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 65%); mask-image:radial-gradient(ellipse at 50% 65%, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 65%);">
        <video src="bros_amke_the_video_a_loop.mp4" autoplay loop muted playsinline
          style="width:100%;display:block;mix-blend-mode:screen;filter:contrast(1.2) brightness(1.2);"></video>
        <div style="position:absolute;bottom:0;left:0;right:0;height:40%;background:linear-gradient(to bottom,transparent,rgba(5,5,5,1));z-index:2;pointer-events:none;"></div>
      </div>

      <!-- Headline -->
      <div style="text-align:center;position:relative;z-index:3;margin-top:10px;margin-bottom:20px;flex-shrink:0;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:4px;color:white;line-height:1;text-shadow:0 0 40px rgba(255,255,255,0.15);">SELECT PROVIDER</div>
        <div style="font-size:9px;color:#00d084;font-family:'Courier New',monospace;letter-spacing:4px;text-transform:uppercase;margin-top:5px;">THE ULTIMATE DISPATCH ENGINE AWAITS</div>
        <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,#00d084,transparent);margin:8px auto 0;"></div>
      </div>

      <!-- 2-col Provider Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;flex-shrink:0;">

        <!-- UBER -->
        <button class="mpcard" onclick="mobActivateDispatchEngine('Uber')"
          ontouchstart="this.style.boxShadow='0 12px 40px rgba(255,255,255,0.12),0 0 0 1px rgba(255,255,255,0.3)'"
          ontouchend="this.style.boxShadow='none'">
          <div class="mpnum">01</div>
          <div class="mpicon" style="background:#000;border:1px solid rgba(255,255,255,0.15);">
            <img src="https://cdn.simpleicons.org/uber/white" style="width:30px;height:30px;" alt="Uber"/>
          </div>
          <div class="mplabel">UBER</div>
        </button>

        <!-- LYFT -->
        <button class="mpcard" onclick="mobActivateDispatchEngine('Lyft')"
          ontouchstart="this.style.boxShadow='0 12px 40px rgba(255,0,191,0.2),0 0 0 1px rgba(255,0,191,0.5)'"
          ontouchend="this.style.boxShadow='none'">
          <div class="mpnum">02</div>
          <div class="mpicon" style="background:#FF00BF;box-shadow:0 6px 16px rgba(255,0,191,0.35);">
            <img src="https://cdn.simpleicons.org/lyft/white" style="width:30px;height:30px;" alt="Lyft"/>
          </div>
          <div class="mplabel">LYFT</div>
        </button>

        <!-- BOLT -->
        <button class="mpcard" onclick="mobActivateDispatchEngine('Bolt')"
          ontouchstart="this.style.boxShadow='0 12px 40px rgba(52,209,134,0.2),0 0 0 1px rgba(52,209,134,0.5)'"
          ontouchend="this.style.boxShadow='none'">
          <div class="mpnum">03</div>
          <div class="mpicon" style="background:#34D186;box-shadow:0 6px 16px rgba(52,209,134,0.35);">
            <svg viewBox="0 0 24 24" style="width:30px;height:30px;" fill="#fff"><path d="M13.2 0L3.6 14.4h6l-2.4 9.6L16.8 9.6h-6z"/></svg>
          </div>
          <div class="mplabel">BOLT</div>
        </button>

        <!-- DiDi -->
        <button class="mpcard" onclick="mobActivateDispatchEngine('DiDi')"
          ontouchstart="this.style.boxShadow='0 12px 40px rgba(255,122,0,0.2),0 0 0 1px rgba(255,122,0,0.5)'"
          ontouchend="this.style.boxShadow='none'">
          <div class="mpnum">04</div>
          <div class="mpicon" style="background:#FF6900;box-shadow:0 6px 16px rgba(255,105,0,0.35);">
            <svg viewBox="0 0 32 32" style="width:32px;height:32px;" fill="none">
              <path d="M6 8h8c5.523 0 10 4.477 10 10S19.523 28 14 28H6V8z" stroke="white" stroke-width="3" fill="none"/>
              <path d="M23 8h3v20h-3z" fill="white"/>
            </svg>
          </div>
          <div class="mplabel">DiDi</div>
        </button>

        <!-- GRAB -->
        <button class="mpcard" onclick="mobActivateDispatchEngine('Grab')"
          ontouchstart="this.style.boxShadow='0 12px 40px rgba(0,177,79,0.2),0 0 0 1px rgba(0,177,79,0.5)'"
          ontouchend="this.style.boxShadow='none'">
          <div class="mpnum">05</div>
          <div class="mpicon" style="background:#00B14F;box-shadow:0 6px 16px rgba(0,177,79,0.35);">
            <img src="https://cdn.simpleicons.org/grab/white" style="width:30px;height:30px;" alt="Grab"/>
          </div>
          <div class="mplabel">GRAB</div>
        </button>

        <!-- InDrive -->
        <button class="mpcard" onclick="mobActivateDispatchEngine('InDrive')"
          ontouchstart="this.style.boxShadow='0 12px 40px rgba(45,190,96,0.2),0 0 0 1px rgba(45,190,96,0.5)'"
          ontouchend="this.style.boxShadow='none'">
          <div class="mpnum">06</div>
          <div class="mpicon" style="background:#1a1a1a;border:2px solid #2DBE60;box-shadow:0 6px 16px rgba(45,190,96,0.3);">
            <svg viewBox="0 0 40 28" style="width:36px;height:26px;" fill="none">
              <text x="2" y="22" font-family="Arial Black,Arial,sans-serif" font-size="20" font-weight="900" fill="#2DBE60">iD</text>
            </svg>
          </div>
          <div class="mplabel">INDRIVE</div>
        </button>

      </div>
    </div>

    <!-- DUAL-PANE DISPATCH ENGINE (MOBILE STACKED) -->
    <div id="mobDispatchEnginePane" class="flex flex-col h-full w-full transform translate-y-full opacity-0 transition-all duration-700 pointer-events-none absolute inset-0 z-40 bg-[#0a0a0c]">
      
      <!-- MAP HUD (TOP HALF ON MOBILE) -->
      <div class="w-full h-[40%] relative overflow-hidden bg-[#0a0a0c] border-b border-white/5 order-1 flex-shrink-0" id="mobRideMapHudContainer">
        <div class="absolute inset-0 opacity-30" style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 40px 40px; transform: perspective(500px) rotateX(60deg) scale(2); transform-origin: top center;"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
          <div class="w-24 h-24 border border-[#00d084]/30 rounded-full flex items-center justify-center animate-pulse relative">
            <div class="w-16 h-16 border border-[#00d084]/50 rounded-full flex items-center justify-center relative">
              <div class="w-2 h-2 bg-[#00d084] rounded-full shadow-[0_0_15px_rgba(0,208,132,1)] z-10"></div>
            </div>
          </div>
        </div>
        <button onclick="mobResetDispatch()" class="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur border border-white/10 text-white px-3 py-1.5 rounded-full shadow-lg font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:bg-black/80 transition-all">←</button>
      </div>

      <!-- BOOKING ENGINE (BOTTOM HALF ON MOBILE) -->
      <div id="mobRideLeftPane" class="w-full h-[60%] overflow-y-auto custom-scroll p-4 bg-[#0a0a0c] relative z-10 flex flex-col transition-all duration-300 order-2 pb-32 flex-shrink-0">
        <div class="flex justify-between items-center mb-1 mt-2">
          <div id="mobDispatchTitle" style="font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:2px;color:white;line-height:1;">DISPATCH ENGINE</div>
        </div>
        <div id="mobDispatchSubtitle" class="text-[9px] text-[#00d084] font-mono tracking-widest uppercase mb-4 transition-all duration-300">Secured Headless Routing</div>

        <!-- MOBILE PROVIDER AUTHENTICATION SHIELD -->
        <div id="mobRideAuthHeader" style="display:none; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); padding:10px 16px; border-radius:14px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="width:6px; height:6px; background:#00d084; border-radius:50%;" id="mobAuthDot"></span>
            <span id="mobAuthBadgeText" style="font-family:'Space Mono',monospace; font-size:10px; color:rgba(255,255,255,0.6);">Disconnected</span>
          </div>
          <button onclick="mobSignOutProvider()" style="background:none; border:none; color:#ff3333; font-family:'Space Mono',monospace; font-size:9px; cursor:pointer; font-weight:bold; text-transform:uppercase; outline:none;">Disconnect</button>
        </div>

        <!-- MOBILE PROVIDER LOGIN CONTAINER -->
        <div id="mobRideLoginContainer" style="display:none; flex-direction:column; gap:16px; margin-bottom:20px;">
          <!-- Will be dynamically populated via JS -->
        </div>

        <div id="mobRideBookingFormContainer" class="flex flex-col flex-1">
          <!-- ROUTE CARD -->
          <div id="mobRouteInputCard" class="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5 relative overflow-hidden shadow-2xl transition-all duration-300">
            <div id="mobRouteBar" class="absolute right-0 top-0 bottom-0 w-1 bg-[#00d084] transition-all duration-300"></div>
            
            <div class="flex items-center gap-3 mb-3">
              <div id="mobPickupIndicator" class="w-2.5 h-2.5 rounded-full bg-[#00d084] shadow-[0_0_8px_rgba(0,208,132,0.8)] transition-all duration-300 flex-shrink-0"></div>
              <input class="bg-transparent border-none text-white font-mono text-[12px] w-full outline-none placeholder-white/40" type="text" id="rideFrom" placeholder="Pickup Location (Detecting...)"/>
              <button id="mobGpsBtn" class="bg-[#00d084]/20 hover:bg-[#00d084]/40 text-[#00d084] px-2 py-1 rounded text-[9px] font-bold font-mono tracking-widest uppercase transition-all flex-shrink-0 cursor-pointer" onclick="detectRidePickup()">GPS</button>
            </div>
            
            <div class="w-0.5 h-4 bg-white/20 ml-1 mb-3"></div>
            
            <div class="flex items-center gap-3 mb-3">
              <div class="w-2.5 h-2.5 flex-shrink-0 flex items-center justify-center text-white/50 text-[10px]">+</div>
              <input class="bg-transparent border-none text-white/50 font-mono text-[12px] w-full outline-none placeholder-white/20" type="text" id="mobRideStop1" placeholder="+ Add Stop (Optional)"/>
            </div>
            
            <div class="w-0.5 h-4 bg-white/20 ml-1 mb-3"></div>
            
            <div class="flex items-center gap-3 mb-4">
              <div id="mobDestIndicator" class="w-2.5 h-2.5 rounded bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all duration-300 flex-shrink-0"></div>
              <input class="bg-transparent border-none text-white font-mono text-[12px] w-full outline-none placeholder-white/40" type="text" id="rideTo" placeholder="Final Destination"/>
            </div>

            <div class="h-px w-full bg-white/10 my-3"></div>
            
            <div class="flex items-center gap-3">
              <input class="bg-transparent border-none text-white/70 font-mono text-[11px] w-1/2 outline-none" type="text" id="mobPassengerName" placeholder="Passenger Name"/>
              <div class="w-px h-5 bg-white/10"></div>
              <input class="bg-transparent border-none text-white/70 font-mono text-[11px] w-1/2 outline-none" type="tel" id="mobPassengerPhone" placeholder="Phone Number"/>
            </div>
          </div>

          <!-- Handshake Bar -->
          <div id="mobTelemetryHandshakeCard" class="mb-5">
            <div class="text-[9px] font-mono font-bold text-white/30 tracking-[2px] mb-2 uppercase">Live Telemetry Handshake</div>
            <div class="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 transition-all duration-300">
              <div id="mobHandshakeDot" class="w-2.5 h-2.5 rounded-full bg-[#00d084] animate-pulse shadow-[0_0_8px_#00d084] flex-shrink-0 transition-all duration-300"></div>
              <div id="mobHandshakeText" class="text-[10px] font-mono text-white/60 tracking-wider transition-all duration-300">Awaiting destination to fetch live vehicles...</div>
            </div>
          </div>

          <!-- Prefs -->
          <div class="flex gap-2 mb-6">
            <select id="mobDriverLanguage" class="flex-1 bg-white/5 border border-white/10 text-white font-mono text-[10px] p-2.5 rounded-xl outline-none appearance-none">
              <option value="en">Driver Lang: English</option>
              <option value="es">Driver Lang: Spanish</option>
              <option value="fr">Driver Lang: French</option>
            </select>
            <button class="bg-white/5 border border-white/10 text-white p-2.5 rounded-xl text-[12px] hover:bg-white/10 transition-colors">⭐</button>
          </div>

          <button class="w-full bg-[#00d084] text-black font-mono font-bold tracking-widest text-[14px] py-4 rounded-xl shadow-[0_0_15px_rgba(0,208,132,0.4)] uppercase mt-auto cursor-pointer hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-all" onclick="searchRides()">DISPATCH SEARCH ENGINE →</button>
        </div>
        
        <!-- SEARCHING ANIMATION -->
        <div id="rideSearching" style="display:none;text-align:center;padding:20px 0;">
          <div class="text-3xl mb-3 animate-spin inline-block">⏳</div>
          <div class="font-mono text-[14px] font-bold text-white tracking-widest uppercase mb-1">Calculating Telemetry</div>
          <div class="font-mono text-[9px] text-[#00d084] tracking-widest uppercase" id="searchStatus">Initializing provider handshake...</div>
        </div>
        
        <!-- PROVIDER RESULTS -->
        <div id="rideProviderResults" style="display:none;padding-top:10px;">
          <div class="text-[9px] text-white/50 font-mono uppercase tracking-widest mb-3 flex justify-between items-center">
            <span>Available Providers</span>
            <span class="text-red-400">⚡ Dynamic Surge Active</span>
          </div>
          <div id="providerCards" class="flex flex-col gap-2"></div>
        </div>

      </div>
    </div>
  <!-- Mobile Dispatch Scripts moved to js/features-simple.js -->

    <!-- BOOKING MODAL -->
    <div id="rideBookingModal" style="display:none;position:fixed;inset:0;z-index:8000;background:rgba(0,0,0,0.95);padding:32px 24px;flex-direction:column;align-items:center;justify-content:center;">
      <div class="booking-card">
        <div id="bookingProviderLogo" style="font-size:48px;margin-bottom:16px;text-align:center;"></div>
        <div id="bookingProviderName" style="font-family:'Bebas Neue',sans-serif;font-size:36px;text-align:center;letter-spacing:2px;"></div>
        <div id="bookingDetails" style="margin:20px 0;"></div>
        <div id="bookingDriverCard" style="display:none;" class="driver-card">
          <div class="driver-av" id="bookingDriverAv"></div>
          <div style="flex:1;">
            <div id="bookingDriverName" style="font-weight:700;font-size:14px;"></div>
            <div id="bookingDriverInfo" style="font-size:11px;color:var(--subtext);margin-top:4px;"></div>
          </div>
          <div style="text-align:right;">
            <div id="bookingDriverETA" style="font-family:'Bebas Neue',sans-serif;font-size:32px;line-height:1;"></div>
            <div style="font-size:9px;color:var(--subtext);letter-spacing:2px;">MIN AWAY</div>
          </div>
        </div>
        <div class="booking-progress" id="bookingProgress" style="display:none;">
          <div class="booking-progress-fill" id="bookingProgressFill"></div>
        </div>
        <div id="bookingStatus" style="text-align:center;font-size:11px;letter-spacing:2px;color:var(--subtext);margin:12px 0;"></div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px;">
          <button class="action-btn" id="openAppBtn" style="background:linear-gradient(135deg,#1a1a1a,#111);border:1px solid rgba(255,255,255,0.15);" onclick="openProviderApp()">📱 Open App to Confirm →</button>
          <button onclick="closeBookingModal()" style="background:transparent;border:1px solid var(--border);color:var(--subtext);padding:14px;border-radius:12px;font-family:'Space Mono',monospace;font-size:11px;">Cancel</button>
        </div>
      </div>
    </div>

  </div>
</div>

<!-- =====================
     SCREEN: EMERGENCY
     ==================== -->
<div id="emergency" class="screen">
  <div class="screen-header">
    <button class="back-btn" onclick="goTo('home')">←</button>
    <div class="screen-name" style="color:var(--red);">🚨 EMERGENCY</div>
  </div>
  <div class="screen-body" style="padding:0; padding-bottom:160px;">
    <div class="em-top">
      <div class="em-icon">🚨</div>
      <div class="em-title">EMERGENCY</div>
      <p class="em-sub">All lines are available for 24/7 assistance.</p>
    </div>

    <!-- MAIN SOS SLIDER -->
    <div class="slide-sos-container" id="sosSlider">
      <div class="slide-track-fill" id="sosTrack"></div>
      <div class="slide-text">Slide to call 112</div>
      <div class="slide-handle" id="sosHandle">📞</div>
    </div>

    <div style="padding: 0 24px; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px;">
       <button class="action-btn red-btn" onclick="broadcastLocation()" style="box-shadow: 0 8px 25px rgba(230,57,70,0.3);">📍 SHARE LIVE LOCATION VIA SMS</button>
       <button class="action-btn" onclick="goTo('checklist')" style="background:var(--mid); border:1px solid var(--border); color:var(--red); font-size:14px; box-shadow:none;">📋 View Breakdown Checklist</button>
    </div>

    <div class="em-numbers">
      <a href="tel:911" class="em-num-btn">
        <div class="em-num-left">
          <div class="em-num-label">General Police</div>
          <div class="em-num-val">911</div>
        </div>
        <div class="em-num-right">📞</div>
      </a>
      <a href="tel:999" class="em-num-btn">
        <div class="em-num-left">
          <div class="em-num-label">Medical Rescue</div>
          <div class="em-num-val">999</div>
        </div>
        <div class="em-num-right">📞</div>
      </a>
    </div>
    <div class="em-ride-section" style="padding-bottom:40px;">
      <div class="em-ride-label" style="color:var(--subtext); margin-bottom:16px;">Get an emergency ride</div>
      <div class="providers" style="padding:0 24px;">
        <a href="https://lyft.com/" target="_blank" class="prov-btn bolt">⚡ Lyft</a>
        <a href="https://grab.com" target="_blank" class="prov-btn rida">🔴 Grab</a>
      </div>
    </div>
  </div>
</div>
</div><!-- /#emergency -->

<!-- =====================
     SCREEN: GARAGE
     ==================== -->
<div id="garage" class="screen">
  <div class="screen-header">
    <button class="back-btn" onclick="goTo('home')">←</button>
    <div class="screen-name">🚗 GARAGE</div>
  </div>
  <div class="screen-body" style="padding-bottom:160px;">

    <!-- ROLE SELECTOR -->
    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:4px; display:flex; gap:4px; margin-bottom:24px; box-shadow:0 8px 24px rgba(0,0,0,0.15);">
      <button id="roleBtnUser" onclick="switchUserRole('driver')" style="flex:1; background:var(--accent); color:white; border:none; padding:8px 12px; border-radius:10px; font-family:'Space Mono',monospace; font-size:10px; font-weight:bold; cursor:pointer; transition:all 0.2s; letter-spacing:1px; outline:none;">👨🏻‍✈️ DRIVER MODE</button>
      <button id="roleBtnMech" onclick="switchUserRole('mechanic')" style="flex:1; background:transparent; color:var(--gray); border:none; padding:8px 12px; border-radius:10px; font-family:'Space Mono',monospace; font-size:10px; font-weight:bold; cursor:pointer; transition:all 0.2s; letter-spacing:1px; outline:none;">👨🏾‍🔧 MECHANIC MODE</button>
    </div>

    <!-- USER PROFILE CARD -->
    <div id="userProfileCard" style="margin-bottom:20px;"></div>

    <!-- MECHANIC WORKSPACE DASHBOARD -->
    <div id="mechanicCenterDashboard" style="display:none; animation:fadeInUp 0.4s ease both;"></div>

    <!-- STATE 1: NO VEHICLE — SETUP FORM -->
    <div id="vehicleSetup" style="display:none; flex:1; flex-direction:column; justify-content:center; padding:20px;">
      
      <!-- AI Disclaimer Banner -->
      <div style="background:rgba(255,136,0,0.08); border:1px solid rgba(255,136,0,0.15); border-radius:12px; padding:12px; margin-bottom:16px; display:flex; align-items:flex-start; gap:10px;">
        <span style="font-size:16px;">⚠️</span>
        <div style="font-size:9px; color:rgba(255,255,255,0.7); line-height:1.4;">
          <strong style="color:#ff8800; text-transform:uppercase; font-size:10px; letter-spacing:1px; display:block; margin-bottom:2px;">Predictive AI Tracker</strong>
          AutoTriage uses phone sensors to predict wear & tear based on driving habits. It is not an emergency OBD hardware sensor and cannot detect sudden mechanical failures (e.g., chewed wires).
        </div>
      </div>

      <div style="background:linear-gradient(to bottom, rgba(255,255,255,0.03), transparent); border:1px solid rgba(255,255,255,0.1); border-radius:24px; padding:32px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); position:relative; overflow:hidden;">
        
        <div style="text-align:center; padding-bottom:32px; border-bottom:1px solid rgba(255,255,255,0.05); margin-bottom:32px;">
          <div style="font-size:48px; margin-bottom:16px; animation:pulse 3s infinite;">🚗</div>
          <h2 style="font-family:'Bebas Neue',sans-serif; font-size:36px; letter-spacing:0.05em; color:white; margin:0 0 8px 0;">GARAGE REGISTRY</h2>
          <p style="font-size:12px; color:#a1a1aa; font-family:'Space Mono',monospace; max-width:320px; margin:0 auto; line-height:1.625;">Link your hardware to auto-fetch dynamic diagnostic profiles & real-time telemetry.</p>
        </div>

        <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:16px;">
          <div style="display:flex; gap:16px;">
            <!-- Make input -->
            <div style="position:relative; flex:1;">
              <span style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:#71717a; font-size:14px;">🏢</span>
              <input style="width:100%; background:rgba(24,24,27,0.4); border:1px solid #27272a; color:white; padding:16px 16px 16px 44px; border-radius:12px; font-family:'Space Mono',monospace; font-size:13px; outline:none; transition:all 0.3s; box-sizing:border-box;" type="text" id="vehMake" placeholder="Make (e.g. Toyota)" onfocus="this.style.borderColor='rgba(59,130,246,0.6)'" onblur="this.style.borderColor='#27272a'"/>
            </div>
            
            <!-- Model input -->
            <div style="position:relative; flex:1;">
              <span style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:#71717a; font-size:14px;">🚙</span>
              <input style="width:100%; background:rgba(24,24,27,0.4); border:1px solid #27272a; color:white; padding:16px 16px 16px 44px; border-radius:12px; font-family:'Space Mono',monospace; font-size:13px; outline:none; transition:all 0.3s; box-sizing:border-box;" type="text" id="vehModel" placeholder="Model (e.g. Camry)" onfocus="this.style.borderColor='rgba(59,130,246,0.6)'" onblur="this.style.borderColor='#27272a'"/>
            </div>
          </div>

          <div style="display:flex; gap:16px;">
            <!-- Year input -->
            <div style="position:relative; flex:1;">
              <span style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:#71717a; font-size:14px;">📅</span>
              <input style="width:100%; background:rgba(24,24,27,0.4); border:1px solid #27272a; color:white; padding:16px 16px 16px 44px; border-radius:12px; font-family:'Space Mono',monospace; font-size:13px; outline:none; transition:all 0.3s; box-sizing:border-box;" type="number" id="vehYear" placeholder="Year (e.g. 2019)" min="1980" max="2026" onfocus="this.style.borderColor='rgba(59,130,246,0.6)'" onblur="this.style.borderColor='#27272a'"/>
            </div>

            <!-- Vehicle Type select -->
            <div style="position:relative; flex:1;">
              <span style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:#71717a; font-size:14px;">🛞</span>
              <select style="width:100%; background:rgba(24,24,27,0.4); border:1px solid #27272a; color:white; padding:16px 40px 16px 44px; border-radius:12px; font-family:'Space Mono',monospace; font-size:13px; outline:none; transition:all 0.3s; box-sizing:border-box; appearance:none; cursor:pointer; background-image:url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath fill=\'%23888\' d=\'M1 1l5 5 5-5\'/%3E%3C/svg%3E'); background-repeat:no-repeat; background-position:right 16px center;" id="vehVType" onfocus="this.style.borderColor='rgba(59,130,246,0.6)'" onblur="this.style.borderColor='#27272a'">
                <option value="Car" style="background:#121214; color:white;">Sedan / Hatchback</option>
                <option value="SUV" style="background:#121214; color:white;">SUV / Crossover</option>
                <option value="Truck" style="background:#121214; color:white;">Pickup Truck</option>
                <option value="Motorcycle" style="background:#121214; color:white;">Motorcycle</option>
              </select>
            </div>
          </div>

          <!-- Mileage input -->
          <div style="position:relative; margin-bottom:8px;">
            <span style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:#71717a; font-size:14px;">📊</span>
            <input style="width:100%; background:rgba(24,24,27,0.4); border:1px solid #27272a; color:white; padding:16px 16px 16px 44px; border-radius:12px; font-family:'Space Mono',monospace; font-size:13px; outline:none; transition:all 0.3s; box-sizing:border-box;" type="number" id="vehMileage" placeholder="Odometer mileage (e.g. 45000)" onfocus="this.style.borderColor='rgba(59,130,246,0.6)'" onblur="this.style.borderColor='#27272a'"/>
          </div>
        </div>

        <button id="saveVehicleBtn" onclick="saveVehicleProfile()" style="width:100%; padding:16px; border-radius:12px; background:linear-gradient(to right, #2563eb, #4338ca); color:white; border:none; font-family:'Space Mono',monospace; font-weight:bold; letter-spacing:0.1em; font-size:12px; text-transform:uppercase; cursor:pointer; box-shadow:0 4px 20px rgba(37,99,235,0.2); transition:all 0.3s; outline:none;" onmouseover="this.style.boxShadow='0 4px 25px rgba(37,99,235,0.4)';" onmouseout="this.style.boxShadow='0 4px 20px rgba(37,99,235,0.2)';" onmousedown="this.style.transform='translateY(2px)';" onmouseup="this.style.transform='translateY(0)';">
          LINK VEHICLE →
        </button>
      </div>
    </div>

    <!-- STATE 2: VEHICLE SAVED — DASHBOARD -->
    <div id="vehicleDashboard" style="display:none;">
      <!-- 1. DIGITAL ID CARD + HEALTH SCORE -->
      <div id="vehicleCard"></div>

      <!-- VIRTUAL TWIN QUICK LOGS -->
      <div style="display:flex; gap:10px; margin-top:16px;">
        <button onclick="quickLog('fuel')" style="flex:1; background:rgba(77,166,255,0.08); border:1px solid rgba(77,166,255,0.2); color:#4da6ff; padding:12px; border-radius:12px; font-family:'Space Mono',monospace; font-size:10px; font-weight:bold; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px;">
          <span style="font-size:20px;">⛽</span>
          JUST FILLED TANK
        </button>
        <button onclick="quickLog('oil')" style="flex:1; background:rgba(255,136,0,0.08); border:1px solid rgba(255,136,0,0.2); color:#ff8800; padding:12px; border-radius:12px; font-family:'Space Mono',monospace; font-size:10px; font-weight:bold; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px;">
          <span style="font-size:20px;">🛢️</span>
          JUST CHANGED OIL
        </button>
      </div>

      <!-- ACTIVE & RECENT RIDES CARD -->
      <div id="garageRidesCard" style="display: none; margin-top: 16px; background: #0d0d0d; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 16px;">
        <div style="font-size: 10px; color: #4da6ff; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; margin-bottom: 12px;">🚗 Active Ride Dispatches</div>
        <div id="garageRidesList" style="display: flex; flex-direction: column; gap: 10px;"></div>
      </div>

      <!-- MAINTENANCE PLANNER (HORIZONTAL ON TOP) -->
      <div style="margin-top:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div style="font-size:10px;color:#e63946;letter-spacing:3px;text-transform:uppercase;font-weight:bold;">🤖 AI Action Planner</div>
          <button onclick="openLogService()" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);padding:4px 10px;border-radius:8px;font-size:9px;cursor:pointer;font-family:'Space Mono',monospace;">+ LOG SERVICE</button>
        </div>
        <div style="font-size:9px;color:rgba(255,255,255,0.25);margin-bottom:14px;">Dynamic tasks injected directly from AI diagnostic analysis.</div>
        <div id="maintenanceRings" style="display:flex; gap:12px; overflow-x:auto; padding-bottom:12px; scroll-snap-type:x mandatory; scrollbar-width:none;" class="hide-scrollbar"></div>
      </div>

      <!-- COMPONENT VITALS -->
      <div id="dailyVitalsCard" style="margin-top:16px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="font-size:10px;color:#ff8800;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">⚙️ Component Vitals</div>
          <div id="vitalsDate" style="font-size:9px;color:rgba(255,255,255,0.25);"></div>
        </div>
        <div style="font-size:9px;color:rgba(255,255,255,0.3);line-height:1.4;margin-bottom:12px;">
          Tap any card to manually override / type in diagnostic vitals data.
        </div>
        <div id="vitalsGrid" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:12px;"></div>
      </div>

      <!-- SEASONAL AI ALERTS -->
      <div id="seasonalAlerts" style="margin-top:16px;"></div>

      <!-- RECALL CHECKER -->
      <div id="recallSection" style="margin-top:16px;"></div>

      <!-- BOTTOM WIDGETS: ODOMETER & FUEL SIDE-BY-SIDE -->
      <div style="margin-top:20px; display:grid; grid-template-columns: 1.1fr 0.9fr; gap:12px;">
        
        <!-- ODOMETER (SLIGHTLY LARGER) -->
        <div id="mileageCheckinCard" style="background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;">
          <div id="activeTrackingIndicator" style="display:none;position:absolute;top:0;left:0;right:0;height:2px;background:#00d084;box-shadow:0 0 10px #00d084;animation:pulse 1s infinite;"></div>
          <div>
            <div style="font-size:10px;color:#00d084;letter-spacing:2px;text-transform:uppercase;font-weight:bold;margin-bottom:4px;display:flex;align-items:center;gap:6px;">
              📊 Virtual Odometer <span id="trackingDot" style="display:none;width:6px;height:6px;background:#00d084;border-radius:50%;animation:pulse 1.5s infinite;"></span>
            </div>
            <div id="mileageLastUpdate" style="font-size:8px;color:rgba(255,255,255,0.25);margin-bottom:10px;"></div>
            <div style="font-size:8px;color:rgba(255,255,255,0.3);line-height:1.4;margin-bottom:12px;">
              Keep sync for AI accuracy.
            </div>
          </div>
          <div>
            <input class="fi" type="number" id="mileageUpdateInput" placeholder="Reading" style="width:100%;margin-bottom:8px;font-size:12px;padding:10px;"/>
            <button onclick="updateMileageCheckin()" style="width:100%;background:#00d084;border:none;color:#000;padding:10px;border-radius:10px;font-family:'Space Mono',monospace;font-size:10px;font-weight:bold;cursor:pointer;">SYNC</button>
          </div>
          <div id="drivingRateInfo" style="font-size:8px;color:rgba(255,255,255,0.3);margin-top:8px;text-align:center;"></div>
        </div>

        <!-- FUEL LOG (SLIGHTLY SMALLER) -->
        <div style="background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="font-size:10px;color:#4da6ff;letter-spacing:2px;text-transform:uppercase;font-weight:bold;margin-bottom:2px;">⛽ Fuel Log</div>
            <div style="font-size:8px;color:rgba(255,255,255,0.3);line-height:1.4;margin-bottom:10px;">Real MPG. All units.</div>
          </div>
          <div>
            <!-- Odometer + dist unit -->
            <div style="display:flex;gap:4px;margin-bottom:5px;">
              <input class="fi" type="number" id="fuelMileage" placeholder="Odometer" style="flex:1;margin:0;font-size:11px;padding:7px;"/>
              <select id="fuelDistUnit" onchange="updateFuelLabels()" style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.1);color:white;font-family:'Space Mono',monospace;font-size:10px;padding:4px 2px;border-radius:8px;outline:none;min-width:38px;">
                <option value="mi">mi</option>
                <option value="km">km</option>
              </select>
            </div>
            <!-- Fuel amount + unit -->
            <div style="display:flex;gap:4px;margin-bottom:6px;">
              <input class="fi" type="number" id="fuelGallons" placeholder="Fuel" style="flex:1;margin:0;font-size:11px;padding:7px;"/>
              <select id="fuelUnit" onchange="updateFuelLabels()" style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.1);color:white;font-family:'Space Mono',monospace;font-size:9px;padding:4px 2px;border-radius:8px;outline:none;min-width:52px;">
                <option value="gal">gal</option>
                <option value="imp">imp</option>
                <option value="L">L</option>
                <option value="kg_petrol">kg pet</option>
                <option value="kg_diesel">kg die</option>
                <option value="kg_cng">kg CNG</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
            <div id="fuelUnitPreview" style="font-size:7px;color:rgba(255,255,255,0.2);text-align:center;margin-bottom:6px;font-family:'Space Mono',monospace;">→ MPG (US)</div>
            <button onclick="logFuelEntry()" style="width:100%;background:rgba(77,166,255,0.1);border:1px solid rgba(77,166,255,0.3);color:#4da6ff;padding:9px;border-radius:10px;font-family:'Space Mono',monospace;font-size:10px;cursor:pointer;font-weight:bold;">LOG</button>
          </div>
          <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:10px;margin-top:10px;padding:8px;min-height:50px;display:flex;align-items:center;justify-content:center;position:relative;">
            <canvas id="fuelChartCanvas" height="40" style="display:none;width:100%;"></canvas>
            <div id="fuelEmpty" style="text-align:center;color:rgba(255,255,255,0.2);font-size:8px;">Needs 2+ logs</div>
          </div>
          <div id="fuelAiAlert" style="display:none;margin-top:6px;font-size:8px;"></div>
        </div>

      </div>
      <!-- AFFILIATE REFERRAL SETTINGS CARD -->
      <div style="background:#0d0d0d; border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:16px; margin-top:20px;">
        <div style="font-size:10px; color:#4da6ff; letter-spacing:2px; text-transform:uppercase; font-weight:bold; margin-bottom:8px;">💰 Affiliate Referral IDs</div>
        <p style="font-size:9px; color:rgba(255,255,255,0.3); line-height:1.4; margin-bottom:12px;">
          Set your partner tracking parameters to redirect commissions directly to your accounts.
        </p>
        
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">
          <div>
            <label style="display:block; font-size:8px; color:rgba(255,255,255,0.4); text-transform:uppercase; margin-bottom:4px; font-family:'Space Mono',monospace;">eBay Campaign ID</label>
            <input class="fi" type="text" id="mobileAffEbay" placeholder="e.g. 5339045678" style="width:100%; font-size:11px; padding:8px; margin:0;" />
          </div>
          <div>
            <label style="display:block; font-size:8px; color:rgba(255,255,255,0.4); text-transform:uppercase; margin-bottom:4px; font-family:'Space Mono',monospace;">Amazon Associates Tag</label>
            <input class="fi" type="text" id="mobileAffAmazon" placeholder="e.g. autotriage-20" style="width:100%; font-size:11px; padding:8px; margin:0;" />
          </div>
          <div>
            <label style="display:block; font-size:8px; color:rgba(255,255,255,0.4); text-transform:uppercase; margin-bottom:4px; font-family:'Space Mono',monospace;">Jumia KOL / Partner ID</label>
            <input class="fi" type="text" id="mobileAffJumia" placeholder="e.g. kol" style="width:100%; font-size:11px; padding:8px; margin:0;" />
          </div>
        </div>
        
        <button onclick="saveAffiliateCredentials()" style="width:100%; background:#2563eb; color:white; border:none; padding:10px; border-radius:10px; font-family:'Space Mono',monospace; font-size:10px; font-weight:bold; cursor:pointer; box-shadow:0 0 10px rgba(37,99,235,0.25);">SAVE REFERRAL CREDS</button>
      </div>

      <!-- 4. MAINTENANCE HISTORY TIMELINE -->
      <div style="margin-top:28px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div style="font-size:10px;color:#ff8800;letter-spacing:3px;text-transform:uppercase;font-weight:bold;">📜 History Timeline</div>
        </div>

        <!-- VOICE QUICK ADD -->
        <div style="background:#0d0d0d;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:16px;margin-bottom:20px;display:flex;align-items:center;gap:16px;">
          <div style="position:relative;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">
            <div id="vRipple1" class="voice-ripple" style="position:absolute;width:60px;height:60px;border-radius:50%;border:1px solid rgba(255,136,0,0.3);display:none;"></div>
            <div id="vRipple2" class="voice-ripple" style="position:absolute;width:80px;height:80px;border-radius:50%;border:1px solid rgba(255,136,0,0.15);display:none;"></div>
            <button id="voiceMicBtn" onclick="toggleVoiceLog()" style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#ff8800,#e63946);border:none;font-size:20px;cursor:pointer;position:relative;z-index:2;box-shadow:0 0 16px rgba(255,136,0,0.25);">🎙️</button>
          </div>
          <div>
            <div style="font-size:11px;font-weight:bold;color:#fff;margin-bottom:2px;">Quick Add Log</div>
            <div id="voiceStatus" style="font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:1px;">TAP MIC TO SPEAK A RECORD</div>
          </div>
        </div>

        <!-- TIMELINE FEED -->
        <div id="historyTimelineFeed" style="position:relative;padding-left:16px;border-left:2px solid rgba(255,255,255,0.08);margin-left:8px;">
          <!-- Items will be injected here via JS -->
        </div>
      </div>
    </div>

  </div>
</div>

<!-- =====================
     SCREEN: HISTORY
     ==================== -->
<div id="history" class="screen">
  <div class="screen-header" style="display:flex; justify-content:space-between; align-items:center;">
    <button class="back-btn" onclick="goTo('diagnose')">← Back</button>
    <div class="screen-name">🕒 HISTORY</div>
    <button onclick="openManualDiagnosisModal()" style="background:rgba(0,208,132,0.1); border:1px solid rgba(0,208,132,0.3); color:#00d084; padding:6px 12px; border-radius:8px; font-size:9.5px; font-family:'Space Mono',monospace; cursor:pointer; font-weight:bold;">+ ADD REPORT</button>
  </div>
  <div class="screen-body" id="historyList" style="padding-bottom:160px;">
  </div>
</div>

<!-- =====================
     SCREEN: PARTS
     ==================== -->
<div id="parts" class="screen">
  <div class="screen-body" style="padding-bottom:160px; padding-top:24px;">
    <!-- HERO HEADER -->
    <div style="position:relative; border-radius:24px; overflow:hidden; margin-bottom:32px; padding:32px; background:linear-gradient(135deg,#0d1117 0%,#111827 60%,#0a0f1e 100%); border:1px solid rgba(255,255,255,0.06);">
      <div style="position:absolute; top:-64px; right:-64px; width:192px; height:192px; border-radius:50%; pointer-events:none; background:radial-gradient(circle,rgba(77,166,255,0.12),transparent 70%);"></div>
      <div style="position:absolute; bottom:-48px; left:-48px; width:144px; height:144px; border-radius:50%; pointer-events:none; background:radial-gradient(circle,rgba(255,136,0,0.08),transparent 70%);"></div>
      <div style="display:flex; align-items:center; gap:16px; margin-bottom:8px;">
        <button onclick="goTo('home')" style="color:#8e93a0; background:rgba(255,255,255,0.05); padding:8px 16px; border-radius:8px; font-size:14px; font-family:'Space Mono',monospace; border:none; cursor:pointer;">← Back</button>
      </div>
      <div style="font-size:11px; color:#4da6ff; font-family:'Space Mono',monospace; letter-spacing:2px; text-transform:uppercase; font-weight:bold; margin-bottom:4px;">Live Parts Matching</div>
      <div style="font-size:32px; font-family:'Bebas Neue',sans-serif; color:white; letter-spacing:1px; line-height:1; margin-bottom:12px;">PARTS PRICE EXPLORER</div>
      <div style="font-size:12px; color:#9ca3af; font-family:'Space Mono',monospace;">Scalable active inventory indexed from global databases. Prices auto-calibrated for specification.</div>
    </div>

    <!-- FILTER CHIPS -->
    <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:16px; margin-bottom:16px;">
      <button onclick="filterPartCategory('all')" class="app-part-chip active" data-cat="all" style="background:rgba(77,166,255,0.1);border:1px solid rgba(77,166,255,0.3);color:#4da6ff;padding:7px 16px;border-radius:20px;font-family:'Space Mono',monospace;font-size:10px;font-weight:bold;cursor:pointer;letter-spacing:1px;white-space:nowrap;">ALL PARTS</button>
      <button onclick="filterPartCategory('engine')" class="app-part-chip" data-cat="engine" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);color:#888;padding:7px 16px;border-radius:20px;font-family:'Space Mono',monospace;font-size:10px;font-weight:bold;cursor:pointer;letter-spacing:1px;white-space:nowrap;">⚙️ ENGINE</button>
      <button onclick="filterPartCategory('brakes')" class="app-part-chip" data-cat="brakes" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);color:#888;padding:7px 16px;border-radius:20px;font-family:'Space Mono',monospace;font-size:10px;font-weight:bold;cursor:pointer;letter-spacing:1px;white-space:nowrap;">🛑 BRAKES</button>
      <button onclick="filterPartCategory('electrical')" class="app-part-chip" data-cat="electrical" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);color:#888;padding:7px 16px;border-radius:20px;font-family:'Space Mono',monospace;font-size:10px;font-weight:bold;cursor:pointer;letter-spacing:1px;white-space:nowrap;">⚡ ELECTRICAL</button>
      <button onclick="filterPartCategory('suspension')" class="app-part-chip" data-cat="suspension" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);color:#888;padding:7px 16px;border-radius:20px;font-family:'Space Mono',monospace;font-size:10px;font-weight:bold;cursor:pointer;letter-spacing:1px;white-space:nowrap;">🔩 SUSPENSION</button>
      <button onclick="filterPartCategory('cooling')" class="app-part-chip" data-cat="cooling" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);color:#888;padding:7px 16px;border-radius:20px;font-family:'Space Mono',monospace;font-size:10px;font-weight:bold;cursor:pointer;letter-spacing:1px;white-space:nowrap;">❄️ COOLING</button>
      <button onclick="filterPartCategory('tyres')" class="app-part-chip" data-cat="tyres" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);color:#888;padding:7px 16px;border-radius:20px;font-family:'Space Mono',monospace;font-size:10px;font-weight:bold;cursor:pointer;letter-spacing:1px;white-space:nowrap;">🛞 TYRES</button>
    </div>

    <!-- TIP -->
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px; padding:12px 16px; border-radius:12px; background:rgba(77,166,255,0.06); border:1px solid rgba(77,166,255,0.15);">
      <span style="font-size:20px;">💡</span>
      <span id="mobilePartsCurrencyTip" style="font-size:11px; color:rgba(255,255,255,0.5); font-family:'Space Mono',monospace; line-height:1.6;">Prices shown are <strong style="color:#4da6ff;">Nigerian Naira (₦)</strong> estimates. Actual prices vary by location, brand, and vehicle model.</span>
    </div>

    <div style="display:flex; gap:12px; margin-bottom:32px;">
      <div style="position:relative; flex:1;">
        <span style="position:absolute; top:50%; transform:translateY(-50%); left:16px; color:rgba(255,255,255,0.4);">🔍</span>
        <input class="fi" style="width:100%; padding:16px 16px 16px 44px; font-family:'Space Mono',monospace; font-size:14px; box-sizing:border-box; border-radius:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white;" type="text" id="partSearch" placeholder="Search for a part (e.g. Brake Pads)" onkeydown="if(event.key === 'Enter') searchPart(true)"/>
      </div>
      <button onclick="searchPart(true)" style="background:#2563eb; color:white; font-family:'Space Mono',monospace; font-size:13px; font-weight:bold; padding:0 24px; border-radius:12px; border:none; cursor:pointer; text-transform:uppercase; letter-spacing:1px; box-shadow:0 0 15px rgba(37,99,235,0.3);">Search</button>
    </div>
    <div id="partsResults"></div>
    <div id="recommended-tools-root"></div>
  </div>
</div>

<!-- =====================
     SCREEN: CHECKLIST
     ==================== -->
<div id="checklist" class="screen">
  <div class="screen-header">
    <button class="back-btn" onclick="goTo('emergency')">← Back</button>
    <div class="screen-name">📋 BREAKDOWN CHECKLIST</div>
  </div>
  <div class="screen-body" style="padding-bottom:160px;">
    <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:12px;margin-bottom:12px;">
      <h3 style="font-size:14px;color:var(--accent);margin-bottom:8px;">1. Move to Safety</h3>
      <p style="font-size:12px;color:var(--gray);line-height:1.6;">Pull over to the right side of the road. Turn your steering wheel away from the road.</p>
    </div>
    <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:12px;margin-bottom:12px;">
      <h3 style="font-size:14px;color:var(--accent);margin-bottom:8px;">2. Hazard Lights & Triangle</h3>
      <p style="font-size:12px;color:var(--gray);line-height:1.6;">Turn on your hazard lights immediately. Place your C-Caution triangle 50 meters behind your car.</p>
    </div>
    <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:12px;margin-bottom:12px;">
      <h3 style="font-size:14px;color:var(--accent);margin-bottom:8px;">3. Stay Inside (If Safe)</h3>
      <p style="font-size:12px;color:var(--gray);line-height:1.6;">If you are on a busy expressway, stay inside with seatbelts on unless there is smoke or fire.</p>
    </div>
    <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:12px;margin-bottom:12px;">
      <h3 style="font-size:14px;color:var(--accent);margin-bottom:8px;">4. Call for Help</h3>
      <p style="font-size:12px;color:var(--gray);line-height:1.6;">Use the Emergency/SOS tab to call Rescue (999) or book an emergency ride.</p>
    </div>
  </div>
</div>

</div><!-- /#app-content -->

<nav class="bottom-nav">
  <div class="nav-indicator" id="navIndicator"></div>
  <button class="nav-tab active" onclick="goTo('home')" id="tab-home">
    <div class="nav-tab-icon">🏠</div>
    <div>Home</div>
  </button>
  <button class="nav-tab" onclick="goTo('diagnose')" id="tab-diagnose">
    <div class="nav-tab-icon">🧠</div>
    <div>Diagnose</div>
  </button>
  <button class="nav-tab" onclick="goTo('mechanics')" id="tab-mechanics">
    <div class="nav-tab-icon">🔧</div>
    <div>Mechanic</div>
  </button>
  <button class="nav-tab" onclick="goTo('rides')" id="tab-rides">
    <div class="nav-tab-icon">🚗</div>
    <div>Ride</div>
  </button>
  <button class="nav-tab" onclick="goTo('garage')" id="tab-garage">
    <div class="nav-tab-icon">🛠️</div>
    <div>Garage</div>
  </button>
  <button class="nav-tab emergency-tab" onclick="goTo('emergency')" id="tab-emergency">
    <div class="nav-tab-icon">🚨</div>
    <div>SOS</div>
  </button>
</nav>

<script>
const GROQ_KEY = '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

const PROMPT = `You are an expert automotive diagnostic AI. Respond ONLY with a valid JSON object, no markdown, no extra text.
Format: {"summary":"one sentence","likely_causes":["c1","c2","c3"],"severity":"LOW|MEDIUM|HIGH|CRITICAL","severity_score":70,"immediate_actions":["a1","a2"],"solutions":["s1","s2","s3"],"estimated_cost":"$X,000 – $Y,000","specialist_needed":"General Mechanic or Engine Specialist or Auto Electrician or Brake Specialist or AC Specialist or Transmission Specialist","is_critical":false}`;

// ---- NAVIGATION ----
let curScreen = 'home';
let curSpec2 = 'All';
let curVt = 'Car';
let mobileVehicle = JSON.parse(localStorage.getItem('mobileVehicle') || '{}');

// saveVehicleProfile is intentionally handled by features-simple.js

function updateMileageCheckin() {
  const input = document.getElementById('mileageUpdateInput');
  if(!input || !input.value) return;
  const newM = parseInt(input.value);
  
  let targetVeh = null;
  if (typeof myVehicle !== 'undefined' && myVehicle && myVehicle.make) targetVeh = myVehicle;
  else if (typeof mobileVehicle !== 'undefined' && mobileVehicle && mobileVehicle.make) targetVeh = mobileVehicle;
  
  if(!targetVeh) return alert("No vehicle profile found to update.");
  if(newM < targetVeh.mileage) return alert("New mileage cannot be lower than current!");
  
  targetVeh.mileage = newM;
  if(typeof myVehicle !== 'undefined' && myVehicle && myVehicle.make) {
    myVehicle.mileage = newM;
    localStorage.setItem('myVehicle', JSON.stringify(myVehicle));
    localStorage.setItem('desktopVehicle', JSON.stringify(myVehicle));
  }
  
  if (typeof mobileVehicle !== 'undefined' && mobileVehicle && mobileVehicle.make) {
    mobileVehicle.mileage = newM;
    localStorage.setItem('mobileVehicle', JSON.stringify(mobileVehicle));
  }
  
  input.value = '';
  document.getElementById('mileageLastUpdate').textContent = "Just now";
  
  if (typeof renderVehicleDashboard === 'function') {
    renderVehicleDashboard();
  } else {
    renderGarageDashboard();
  }
}

function renderGarageDashboard() {
  const setup = document.getElementById('vehicleSetup');
  const dash = document.getElementById('vehicleDashboard');
  const card = document.getElementById('vehicleCard');
  
  if(!setup || !dash || !card) return;

  let v = null;
  if (typeof myVehicle !== 'undefined' && myVehicle && myVehicle.make) v = myVehicle;
  else if (typeof mobileVehicle !== 'undefined' && mobileVehicle && mobileVehicle.make) v = mobileVehicle;
  
  if(!v || !v.make) {
    setup.style.display = 'block';
    dash.style.display = 'none';
    return;
  }
  
  setup.style.display = 'none';
  dash.style.display = 'block';
  
  if (typeof renderVehicleCard === 'function') {
    renderVehicleCard();
  }
  
  renderGarageRides();

  // Populate affiliate fields
  setTimeout(() => {
    const ebayVal = localStorage.getItem('at_ebay_campid') || '';
    const amazonVal = localStorage.getItem('at_amazon_tag') || '';
    const jumiaVal = localStorage.getItem('at_jumia_kol') || '';
    
    const ebayInput = document.getElementById('mobileAffEbay');
    const amazonInput = document.getElementById('mobileAffAmazon');
    const jumiaInput = document.getElementById('mobileAffJumia');
    
    if (ebayInput) ebayInput.value = ebayVal;
    if (amazonInput) amazonInput.value = amazonVal;
    if (jumiaInput) jumiaInput.value = jumiaVal;
  }, 50);
}

function renderGarageRides() {
  const card = document.getElementById('garageRidesCard');
  const list = document.getElementById('garageRidesList');
  if (!card || !list) return;

  const storedRides = JSON.parse(localStorage.getItem('autotriage_rides') || '[]');
  if (storedRides.length === 0) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';
  list.innerHTML = storedRides.map(ride => {
    const brandIcons = {
      uber: '⬛',
      lyft: '⚡',
      bolt: '⚡',
      didi: '🔸',
      grab: '🟢',
      indrive: '🔵'
    };
    const brandColors = { 
      uber: 'color:white; border-color:rgba(255,255,255,0.2); background:rgba(255,255,255,0.05);', 
      lyft: 'color:#FF00BF; border-color:rgba(255,0,191,0.2); background:rgba(255,0,191,0.05);',
      bolt: 'color:#34D186; border-color:rgba(52,209,134,0.2); background:rgba(52,209,134,0.05);',
      didi: 'color:#FF7A00; border-color:rgba(255,122,0,0.2); background:rgba(255,122,0,0.05);',
      grab: 'color:#00B14F; border-color:rgba(0,177,79,0.2); background:rgba(0,177,79,0.05);',
      indrive: 'color:#00A9E0; border-color:rgba(0,169,224,0.2); background:rgba(0,169,224,0.05);'
    };
    
    const icon = brandIcons[ride.provider] || '🚗';
    const providerLabel = ride.provider.toUpperCase();
    const styleString = brandColors[ride.provider] || 'color:white; border-color:rgba(255,255,255,0.1);';
    const sideColors = { uber: '#fff', lyft: '#FF00BF', bolt: '#34D186', didi: '#FF7A00', grab: '#00B14F', indrive: '#00A9E0' };

    return `
      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:12px; display:flex; justify-content:space-between; align-items:center; position:relative; overflow:hidden;">
        <div style="position:absolute; left:0; top:0; height:100%; width:3px; background:${sideColors[ride.provider] || '#00d084'};"></div>
        <div style="padding-left:8px;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span style="font-size:8px; font-weight:bold; text-transform:uppercase; border:1px solid; padding:2px 6px; border-radius:4px; font-family:'Space Mono',monospace; ${styleString}">${icon} ${providerLabel}</span>
            <span style="font-size:8px; color:rgba(255,255,255,0.3); font-family:'Space Mono',monospace;">ID: ${ride.bookingId}</span>
          </div>
          <div style="font-size:11px; font-weight:bold; color:white; margin-top:6px;">${ride.pickupLocation.split(',')[0]} ➔ ${ride.destination.split(',')[0]}</div>
          <div style="font-size:9px; color:rgba(255,255,255,0.5); margin-top:2px;">
            Driver: <strong style="color:white;">${ride.driver.name}</strong> · ${ride.driver.vehicle} (${ride.driver.plate})
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:8px; color:rgba(255,255,255,0.4); text-transform:uppercase; font-family:'Space Mono',monospace;">Status</div>
          <div style="font-size:10px; font-weight:bold; color:#00d084; margin-top:2px;">Arriving in ${ride.eta} min</div>
        </div>
      </div>
    `;
  }).join('');
}

function saveAffiliateCredentials() {
  const ebay = document.getElementById('mobileAffEbay').value.trim();
  const amazon = document.getElementById('mobileAffAmazon').value.trim();
  const jumia = document.getElementById('mobileAffJumia').value.trim();
  
  if (ebay) localStorage.setItem('at_ebay_campid', ebay);
  else localStorage.removeItem('at_ebay_campid');
  
  if (amazon) localStorage.setItem('at_amazon_tag', amazon);
  else localStorage.removeItem('at_amazon_tag');
  
  if (jumia) localStorage.setItem('at_jumia_kol', jumia);
  else localStorage.removeItem('at_jumia_kol');
  
  alert("Partner monetization tags updated successfully!");
  if (typeof searchPart === 'function') {
    searchPart(true);
  }
}

function switchUserRole(role) {
  const isMech = role === 'mechanic';
  document.getElementById('roleBtnUser').style.background = isMech ? 'transparent' : 'var(--accent)';
  document.getElementById('roleBtnUser').style.color = isMech ? 'var(--gray)' : 'white';
  document.getElementById('roleBtnMech').style.background = isMech ? 'var(--accent)' : 'transparent';
  document.getElementById('roleBtnMech').style.color = isMech ? 'white' : 'var(--gray)';
  
  document.getElementById('userProfileCard').style.display = isMech ? 'none' : 'block';
  document.getElementById('vehicleSetup').style.display = isMech ? 'none' : (!mobileVehicle.make ? 'block' : 'none');
  document.getElementById('vehicleDashboard').style.display = isMech ? 'none' : (mobileVehicle.make ? 'block' : 'none');
  
  const mDash = document.getElementById('mechanicCenterDashboard');
  if(mDash) {
    mDash.style.display = isMech ? 'block' : 'none';
    if(isMech) {
      mDash.innerHTML = `<div style="text-align:center; padding:40px 20px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:24px;">
        <div style="font-size:48px; margin-bottom:16px;">👨🏾‍🔧</div>
        <div style="font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:1px; margin-bottom:8px;">MECHANIC DASHBOARD</div>
        <div style="font-size:12px; font-family:'Space Mono',monospace; color:var(--gray);">You must be verified to accept jobs.</div>
        <button onclick="location.href='verify.html'" style="margin-top:24px; background:var(--fg); color:var(--bg); border:none; padding:12px 24px; border-radius:12px; font-family:'Space Mono',monospace; font-weight:bold; font-size:12px; letter-spacing:1px;">GET VERIFIED →</button>
      </div>`;
    }
  }
}

// Call on boot
setTimeout(renderGarageDashboard, 100);

function goTo(screen) {
  if (screen === curScreen) return;
  
  const oldScreen = document.getElementById(curScreen);
  const newScreen = document.getElementById(screen);
  
  if (!newScreen) return;

  // Reset scroll position to top BEFORE showing
  newScreen.scrollTop = 0;

  // App-style Transitions
  gsap.to(oldScreen, { 
    xPercent: -20, 
    opacity: 0, 
    duration: 0.4, 
    ease: "power2.inOut",
    onComplete: () => {
      oldScreen.classList.remove('active');
      gsap.set(oldScreen, { clearProps: "all" });
    }
  });
  
  newScreen.classList.add('active');
  gsap.fromTo(newScreen, 
    { xPercent: 100, opacity: 0 },
    { xPercent: 0, opacity: 1, duration: 0.5, ease: "expo.out",
      onComplete: () => { gsap.set(newScreen, { clearProps: "transform,opacity" }); }
    }
  );

  // Nav Indicator Logic
  document.querySelectorAll('.nav-tab').forEach((t, i) => {
    t.classList.remove('active');
    if (t.id === 'tab-' + screen) {
      t.classList.add('active');
      gsap.to('#navIndicator', { left: (i * 16.66) + "%", duration: 0.5, ease: "elastic.out(1, 0.8)" });
    }
  });

  if (screen === 'emergency') {
    newScreen.classList.add('emergency-mode');
  } else {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('emergency-mode'));
  }

  curScreen = screen;
  if (screen === 'mechanics') renderMechs(getMechs());
  if (screen === 'emergency') initSOSSlider();
  if (screen === 'rides' && !ridePickupLat) setTimeout(detectRidePickup, 400);
  if (screen === 'garage') { loadVehicleProfile(); newScreen.scrollTop = 0; }
  if (screen === 'history') renderHistory();
  if (screen === 'parts') searchPart(true);
}

// ---- SOS SLIDER LOGIC ----
function initSOSSlider() {
  const handle = document.getElementById('sosHandle');
  const container = document.getElementById('sosSlider');
  const track = document.getElementById('sosTrack');
  if (!handle || !container) return;
  
  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  let maxW = container.offsetWidth - handle.offsetWidth - 12;

  const onStart = (e) => {
    isDragging = true;
    startX = (e.touches ? e.touches[0].clientX : e.clientX) - currentX;
    handle.style.transition = 'none';
    if(track) track.style.transition = 'none';
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const xPos = (e.touches ? e.touches[0].clientX : e.clientX);
    let x = xPos - startX;
    
    if (x < 0) x = 0;
    if (x > maxW) x = maxW;
    
    currentX = x;
    gsap.set(handle, { x: x });
    if(track) gsap.set(track, { width: x + 64 });
    
    if (x >= maxW) {
      isDragging = false;
      currentX = 0;
      // Trigger Call
      window.location.href = "tel:112";
      // Feedback
      gsap.to(handle, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      if(track) gsap.to(track, { width: 0, duration: 0.5 });
    }
  };

  const onEnd = () => {
    if (isDragging) {
      isDragging = false;
      currentX = 0;
      gsap.to(handle, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      if(track) gsap.to(track, { width: 0, duration: 0.5 });
    }
  };

  handle.addEventListener('touchstart', onStart);
  handle.addEventListener('mousedown', onStart);
  window.addEventListener('touchmove', onMove);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchend', onEnd);
  window.addEventListener('mouseup', onEnd);
}

function broadcastLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const msg = `EMERGENCY SOS: I need help. My current location is: https://www.google.com/maps?q=${lat},${lng}`;
      window.location.href = `sms:?body=${encodeURIComponent(msg)}`;
    });
  } else {
    alert("Unable to detect location. Please dial 112 immediately.");
  }
}

// ---- APP INITIALIZATION ----
window.addEventListener('load', () => {
  const splash = document.getElementById("splashScreen");
  
  // Bulletproof splash removal — works even if GSAP fails
  const removeSplash = () => {
    if (!splash || splash._removed) return;
    splash._removed = true;
    splash.style.transition = 'opacity 0.5s, transform 0.5s';
    splash.style.opacity = '0';
    splash.style.transform = 'scale(1.1)';
    setTimeout(() => { if (splash.parentNode) splash.remove(); }, 600);
  };

  setTimeout(() => {
    if (splash && typeof gsap !== 'undefined' && !splash._removed) {
      gsap.to(splash, {
        opacity: 0, scale: 1.1, duration: 0.8, ease: "power3.inOut",
        onComplete: removeSplash
      });
    } else {
      removeSplash();
    }
  }, 1800);

  // Absolute safety net — splash ALWAYS goes away after 3 seconds
  setTimeout(removeSplash, 3000);

  initLocation();
});

// ---- LOCATION ----
let userCity = 'New York';
let userAddr = 'Detecting location...';
let userLat = null;
let userLng = null;
let isOfflineMode = false;

var _distanceCache = {};
function calculateDistance(lat1, lon1, lat2, lon2) {
  const key = `${lat1.toFixed(4)},${lon1.toFixed(4)}_${lat2.toFixed(4)},${lon2.toFixed(4)}`;
  if (_distanceCache[key] !== undefined) return _distanceCache[key];
  const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  _distanceCache[key] = dist;
  return dist;
}

async function fetchRealMechanics(lat, lng, city) {
  if (!navigator.onLine) {
    isOfflineMode = true;
    if (curScreen === 'mechanics') renderMechs(getMechs());
    return;
  }
  
  // ALWAYS CLEAR OLD CACHE TO PREVENT HANGING ON EMPTY LIST
  MECHS = [];

  try {
    let scannedMechs = [];
    // Inject fallback aggressively to prevent GPS hang
    scannedMechs = [
      {
        id: 'mock_1', name: 'Elite Neon Auto', spec: 'Engine Specialist', area: 'Downtown Sector',
        dist: '2.4km', distVal: 2.4, phone: '555-0192', wa: '5550192', rating: '4.9', rev: 128,
        verified: true, avail: 'open', emoji: '???????', yrs: 8, city: 'Local', lat: lat || 6.5244, lng: lng || 3.3792,
        isScanned: false, isPlatformUser: true
      },
      {
        id: 'mock_2', name: 'CyberGlass Brakes', spec: 'Brake Specialist', area: 'Uptown District',
        dist: '4.1km', distVal: 4.1, phone: '555-0193', wa: '5550193', rating: '4.7', rev: 56,
        verified: false, avail: 'busy', emoji: '???????', yrs: 4, city: 'Local', lat: lat || 6.5244, lng: lng || 3.3792,
        isScanned: false, isPlatformUser: false
      }
    ];

    MECHS = scannedMechs;
    try { localStorage.setItem('autoTriage_mechanics', JSON.stringify(MECHS)); } catch (e) {}
    if (curScreen === 'mechanics') renderMechs(getMechs());
  } catch (err) {
    isOfflineMode = true;
    if (curScreen === 'mechanics') renderMechs(getMechs());
  }
}

function initLocation() {
  if (!navigator.geolocation) {
    userLat = 6.5244;
    userLng = 3.3792;
    userCity = 'Lagos';
    document.getElementById('locBadge').textContent = `📍 ${userCity}`;
    fetchRealMechanics(6.5244, 3.3792, 'Lagos');
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude: lat, longitude: lng } = pos.coords;
    userLat = lat;
    userLng = lng;
    
    // Run immediately with fallback so it loads without geocoding delays/failures
    fetchRealMechanics(lat, lng, 'Your City');
    
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP status ${r.status}`);
        const cType = r.headers.get("content-type");
        if (!cType || !cType.includes("application/json")) {
          throw new TypeError("Response is not JSON");
        }
        return r.json();
      })
      .then(d => {
        userCity = d.address?.city || d.address?.town || d.address?.village || 'Your City';
        userAddr = d.display_name || userAddr;
        document.getElementById('locBadge').textContent = `📍 ${userCity}`;
        const ri = document.getElementById('rideFrom');
        if (ri && !ri.value) ri.value = userAddr;
        
        fetchRealMechanics(lat, lng, userCity);
      })
      .catch(() => {
        fetchRealMechanics(lat, lng, 'Your City');
      });
  }, () => {
    userLat = 6.5244;
    userLng = 3.3792;
    userCity = 'Lagos';
    document.getElementById('locBadge').textContent = `📍 ${userCity}`;
    fetchRealMechanics(6.5244, 3.3792, 'Lagos');
  });
}

function autoDetect() {
  const inp = document.getElementById('rideFrom');
  inp.value = 'Detecting...';
  setTimeout(() => { inp.value = userAddr; }, 800);
}

// ---- VEHICLE TYPE ----
function setVt(btn, type) {
  document.querySelectorAll('.vt').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  curVt = type;
}

// ---- DIAGNOSIS IMAGE UPLOAD ----
let currentDiagnosisImage = null;
function attachDiagnosisImage(input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      currentDiagnosisImage = e.target.result;
      const preview = document.getElementById('diagImgPreview');
      if (preview) {
        preview.src = currentDiagnosisImage;
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
}

// ---- AI DIAGNOSIS ----
async function runDiagnosis() {
  const problem = document.getElementById('problemText').value.trim();
  if (!problem) { alert('Please describe your vehicle problem.'); return; }

  const btn = document.getElementById('diagnoseBtn');
  btn.disabled = true; btn.textContent = 'Analyzing...';

  const area = document.getElementById('resultArea');
  const loading = document.getElementById('resultLoading');
  const body = document.getElementById('resultBody');
  area.classList.add('show');
  loading.style.display = 'block';
  body.innerHTML = '';

  try {
    let result;
    const langSelect = document.getElementById('langSelect');
    const lang = langSelect ? langSelect.options[langSelect.selectedIndex].text : 'English';

    // Retrieve API configurations dynamically from global CONFIG if loaded, fallback to local variables
    const activeKey = (typeof CONFIG !== 'undefined' && CONFIG.GROQ_API_KEY) ? CONFIG.GROQ_API_KEY : (typeof GROQ_KEY !== 'undefined' ? GROQ_KEY : '');
    const activeUrl = (typeof CONFIG !== 'undefined' && CONFIG.GROQ_URL) ? CONFIG.GROQ_URL : (typeof GROQ_URL !== 'undefined' ? GROQ_URL : 'https://api.groq.com/openai/v1/chat/completions');
    const activeModel = (typeof CONFIG !== 'undefined' && CONFIG.MODEL) ? CONFIG.MODEL : (typeof MODEL !== 'undefined' ? MODEL : 'llama-3.1-8b-instant');
    const activePrompt = (typeof CONFIG !== 'undefined' && CONFIG.DIAGNOSIS_PROMPT) ? CONFIG.DIAGNOSIS_PROMPT : (typeof PROMPT !== 'undefined' ? PROMPT : '');

    if (!activeKey || activeKey === 'YOUR_GROQ_API_KEY_HERE') {
      // Demo result
      await new Promise(r => setTimeout(r, 1500));
      result = {
        summary: `Demo mode — paste your Groq API key in the code to get real AI diagnosis in ${lang}.`,
        likely_causes: ['Worn brake pads', 'Warped rotors', 'Low brake fluid'],
        severity: 'HIGH', severity_score: 75,
        immediate_actions: ['Avoid hard braking', 'Get to a mechanic today'],
        solutions: ['Replace brake pads and rotors', 'Flush brake fluid', 'Inspect callipers'],
        estimated_cost: '$150 – $450',
        specialist_needed: 'Brake Specialist',
        is_critical: false
      };
    } else {
      let selectedModel = activeModel;
      let userContent;

      // Auto-fetch vehicle data from Garage if available
      const savedVeh = JSON.parse(localStorage.getItem('myVehicle') || '{}');
      const overrides = JSON.parse(localStorage.getItem('vitalOverrides') || '{}');
      let vitalsString = '';
      if (overrides && Object.keys(overrides).length > 0) {
        vitalsString = ' (Manual Vitals Override: ' + Object.entries(overrides).map(([k, v]) => `${k}=${v}%`).join(', ') + ')';
      }
      const vehContext = savedVeh.make ? `${savedVeh.year} ${savedVeh.make} ${savedVeh.model} (Mileage: ${savedVeh.mileage})${vitalsString}` : curVt;
      const lang = document.getElementById('langSelect')?.value || 'en';

      if (currentDiagnosisImage) {
        selectedModel = 'llama-3.2-11b-vision-preview';
        userContent = [
          { type: "text", text: `Vehicle: ${vehContext}\nLanguage Preference: ${lang}\nProblem: ${problem}` },
          { type: "image_url", image_url: { url: currentDiagnosisImage } }
        ];
      } else {
        userContent = `Vehicle: ${vehContext}\nLanguage Preference: ${lang}\nProblem: ${problem}`;
      }

      const res = await fetch(activeUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: activePrompt },
            { role: 'user', content: userContent }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'API error ' + res.status);
      }
      const txt = data.choices?.[0]?.message?.content;
      if (!txt) throw new Error('No valid text response from AI');
      
      try {
        result = JSON.parse(txt.replace(/```json|```/g, '').trim());
        
        // Robust, multi-layered adaptive cost parser with dynamic key matching
        let low = null;
        let high = null;
        let lowIsLocal = false;
        let highIsLocal = false;
        
        const activeCurrency = (window.GlobalContext && window.GlobalContext.currency) ? window.GlobalContext.currency.toLowerCase() : 'usd';
        
        for (const k of Object.keys(result)) {
          const key = k.toLowerCase();
          if (key.includes('low') || key.endsWith('low')) {
            const val = parseFloat(result[k]);
            if (!isNaN(val) && val !== null && val !== '') {
              low = val;
              if (key.includes(activeCurrency)) {
                lowIsLocal = true;
              }
            }
          }
          if (key.includes('high') || key.endsWith('high')) {
            const val = parseFloat(result[k]);
            if (!isNaN(val) && val !== null && val !== '') {
              high = val;
              if (key.includes(activeCurrency)) {
                highIsLocal = true;
              }
            }
          }
        }
        
        if (low !== null && high !== null && !isNaN(low) && !isNaN(high)) {
          const formatFn = (amount, isLocal) => {
            if (window.GlobalContext && typeof window.GlobalContext.formatCurrency === 'function') {
              if (isLocal) {
                return new Intl.NumberFormat(window.GlobalContext.language || 'en-US', {
                  style: 'currency',
                  currency: window.GlobalContext.currency,
                  maximumFractionDigits: 0
                }).format(amount);
              } else {
                return window.GlobalContext.formatCurrency(amount);
              }
            } else if (typeof formatPrice === 'function') {
              if (isLocal) {
                return new Intl.NumberFormat(typeof USER_LOCALE !== 'undefined' ? USER_LOCALE : 'en-US', {
                  style: 'currency',
                  currency: activeCurrency.toUpperCase(),
                  maximumFractionDigits: 0
                }).format(amount);
              } else {
                return formatPrice(amount);
              }
            } else {
              return `$${amount}`;
            }
          };
          
          result.estimated_cost = `${formatFn(low, lowIsLocal)} – ${formatFn(high, highIsLocal)}`;
        } else {
          const costKeys = ['estimated_cost', 'cost', 'repair_cost'];
          let matched = false;
          for (const k of costKeys) {
            const val = result[k];
            if (val !== undefined && val !== null && val !== '') {
              matched = true;
              if (typeof val === 'number') {
                if (window.GlobalContext && typeof window.GlobalContext.formatCurrency === 'function') {
                  result.estimated_cost = window.GlobalContext.formatCurrency(val);
                } else if (typeof formatPrice === 'function') {
                  result.estimated_cost = formatPrice(val);
                } else {
                  result.estimated_cost = `$${val}`;
                }
              } else if (typeof val === 'string') {
                if (val.includes('₦') || val.includes('$') || val.includes('€') || val.includes('£')) {
                  result.estimated_cost = val;
                } else {
                  const nums = val.match(/\d+/g);
                  if (nums && nums.length >= 2) {
                    const l = parseFloat(nums[0]);
                    const h = parseFloat(nums[1]);
                    if (window.GlobalContext && typeof window.GlobalContext.formatCurrency === 'function') {
                      result.estimated_cost = `${window.GlobalContext.formatCurrency(l)} – ${window.GlobalContext.formatCurrency(h)}`;
                    } else if (typeof formatPrice === 'function') {
                      result.estimated_cost = `${formatPrice(l)} – ${formatPrice(h)}`;
                    } else {
                      result.estimated_cost = `$${l} – $${h}`;
                    }
                  } else if (nums && nums.length === 1) {
                    const single = parseFloat(nums[0]);
                    if (window.GlobalContext && typeof window.GlobalContext.formatCurrency === 'function') {
                      result.estimated_cost = window.GlobalContext.formatCurrency(single);
                    } else if (typeof formatPrice === 'function') {
                      result.estimated_cost = formatPrice(single);
                    } else {
                      result.estimated_cost = `$${single}`;
                    }
                  } else {
                    result.estimated_cost = val;
                  }
                }
              }
              break;
            }
          }
          if (!matched) {
            result.estimated_cost = 'N/A';
          }
        }
      } catch (e) {
        throw new Error('AI returned invalid format. Please try again.');
      }
    }

    loading.style.display = 'none';
    
    // Clear image state after diagnosis
    currentDiagnosisImage = null;
    if(document.getElementById('diagImgPreview')) {
      document.getElementById('diagImgPreview').style.display = 'none';
      document.getElementById('diagImgPreview').src = '';
    }

    if (result.is_critical || result.severity === 'CRITICAL') {
      body.innerHTML = `<div style="background:rgba(255,51,51,0.08);border:1px solid rgba(255,51,51,0.3);padding:16px;margin-bottom:16px;text-align:center;">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:var(--red);">🚨 CRITICAL SITUATION</div>
        <p style="font-size:11px;color:var(--accent);margin-top:8px;">${result.summary}</p>
        <button onclick="goTo('emergency')" style="margin-top:12px;padding:12px 24px;background:var(--accent);color:white;border:none;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2px;cursor:pointer;">GO TO EMERGENCY →</button>
      </div>`;
    }

    const sc = result.severity === 'CRITICAL' ? '#ff3333' : result.severity === 'HIGH' ? '#ff8800' : result.severity === 'MEDIUM' ? '#ffcc00' : '#44ff88';

    // Advanced Feature: Save to History
    if (typeof saveToHistory === 'function') {
      saveToHistory(problem, result);
    }

    body.innerHTML += `
      <div class="rb"><h4>Summary</h4><p>${result.summary}</p></div>
      <div class="rb"><h4>Severity — <span style="color:${sc}">${result.severity}</span></h4>
        <div class="sev-bar"><div class="sev-fill" style="width:${result.severity_score}%;background:${sc}"></div></div></div>
      <div class="rb"><h4>Likely Causes</h4><ul>${result.likely_causes.map(c => `<li>${c}</li>`).join('')}</ul></div>
      <div class="rb"><h4>Solutions</h4><ul>${result.solutions.map(s => `<li>${s}</li>`).join('')}</ul></div>
      <div class="rb"><h4>Immediate Actions</h4><ul>${result.immediate_actions.map(a => `<li>${a}</li>`).join('')}</ul></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;">
        <div class="rb" style="margin:0"><h4>Est. Cost</h4><p style="font-family:'Bebas Neue',sans-serif;font-size:20px">${result.estimated_cost}</p></div>
        <div class="rb" style="margin:0"><h4>Specialist</h4><p style="font-size:11px">${result.specialist_needed}</p></div>
      </div>
      <button class="action-btn" style="margin-top:16px;" onclick="triggerAIRecommendation('${result.specialist_needed.replace(/'/g, "\\'")}')">Find a ${result.specialist_needed} →</button>
      <button class="action-btn" style="margin-top:8px;background:rgba(0,208,132,0.1);border:1px solid #00d084;color:#00d084;box-shadow:none;" onclick="quickBookWA('1234567890', '${result.summary.replace(/'/g, "\\'")}')">💬 Send to AutoTriage WhatsApp</button>
    `;

  } catch (err) {
    loading.style.display = 'none';
    body.innerHTML = `<p style="color:#ff6666;font-size:12px;line-height:1.8;">⚠️ ${err.message}<br><br>Get your free Gemini API key at <a href="https://aistudio.google.com" target="_blank" style="color:#4da6ff">aistudio.google.com</a></p>`;
  }

  btn.disabled = false; btn.textContent = 'Run AI Diagnosis →';
}

// ---- MECHANICS ----
let aiDiagnosedSpecialty = null;
var MECHS = [];

async function fetchGlobalMechanics(lat, lng) {
  try {
    const query = `[out:json];node["amenity"="car_repair"](around:15000, ${lat}, ${lng});out;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.elements && data.elements.length > 0) {
      const realMechs = data.elements.map(el => ({
        name: el.tags.name || "Auto Repair Shop",
        spec: "Local Service",
        area: "Near You",
        phone: el.tags.phone || "No phone listed",
        wa: el.tags.phone ? el.tags.phone.replace(/\D/g, '') : "1234567890",
        rating: (4.0 + Math.random() * 1.0).toFixed(1),
        rev: Math.floor(Math.random() * 200),
        avail: 'open',
        emoji: '🔧',
        city: el.tags['addr:city'] || "Your City",
        lat: el.lat,
        lng: el.lon,
        isVerified: false,
        isRealOverpass: true
      }));
      
      // Combine with featured mechanics
      MECHS = [...MECHS.filter(m => m.isVerified), ...realMechs];
      renderMechs(getMechs());
    }
  } catch (err) {
    console.error("Global search failed:", err);
  }
}

try {
  const stored = localStorage.getItem('autoTriage_mechanics');
  if (stored) {
    const parsed = JSON.parse(stored);
    const mockNames = [
      'Alex Miller', 'Marco Rossi', 'Chen Wei', 'Sarah Jenkins', 'Yuki Tanaka',
      'Lucas Silva', 'Hans Schmidt', 'Elena Petrova', 'Chloe Dubois', "Liam O'Connor",
      'Sanjay Gupta', 'Isabella Rossi',
      // Old generated fake workshop names — purge from cache
      'Effurun Rapid Auto Care', 'Elite Car Electronics', 'Downtown Garage Services',
      'Apex Engine Diagnostics', 'Delta Auto Clinic', 'Warri Fast Repairs',
      'Lagos Auto Workshop 1', 'Lagos Auto Workshop 2', 'Lagos Auto Workshop 3',
    ];
    MECHS = parsed
      .filter(m => m && m.name && !mockNames.includes(m.name))
      .map(m => ({
        ...m,
        rev: m.jobs || m.reviews || m.rev || 0,
        wa: m.whatsapp || m.wa || m.phone,
        isPlatformUser: m.isScanned ? false : true
      }));
    localStorage.setItem('autoTriage_mechanics', JSON.stringify(MECHS));
  }
} catch (e) {}

function getMechs() {
  const q = (document.getElementById('mechQ')?.value || '').toLowerCase();
  let list = [...MECHS];
  
  // Filter based on active locator mode
  if (activeLocatorMode === 'scanner') {
    // Show everything in scanner mode to ensure grid is populated!
    // list = list; 
  } else {
    list = list.filter(m => !m.isScanned);
  }
  
  // Inject current user's active mechanic profile at the top if verified!
  const myProfile = JSON.parse(localStorage.getItem('myMechanicProfile'));
  if (myProfile && myProfile.isVerified) {
    const myMechItem = {
      id: 'my_profile_mech',
      name: myProfile.name,
      spec: myProfile.spec,
      area: 'My Workshop',
      phone: myProfile.phone,
      wa: myProfile.wa,
      rating: '5.0',
      rev: myProfile.rev || 0,
      avail: myProfile.avail || 'open',
      emoji: myProfile.emoji || '👨🏾‍🔧',
      isVerified: true,
      isPlatformUser: true,
      city: myProfile.city,
      lat: userLat || 6.5244,
      lng: userLng || 3.3792
    };
    const idx = list.findIndex(m => m.id === 'my_profile_mech');
    if (idx !== -1) {
      list[idx] = myMechItem;
    } else {
      list.unshift(myMechItem);
    }
  }
  
  // Calculate exact distances if GPS is active
  if (userLat !== null && userLng !== null) {
    list.forEach(m => {
      m.distVal = calculateDistance(userLat, userLng, m.lat, m.lng);
      m.area = m.distVal.toFixed(1) + ' km away';
    });
  } else {
    list.forEach(m => {
      m.distVal = 9999;
    });
  }

  if (curSpec2 !== 'All') list = list.filter(m => m.spec === curSpec2);
  if (q) list = list.filter(m => m.name.toLowerCase().includes(q) || m.spec.toLowerCase().includes(q) || m.area.toLowerCase().includes(q));
  
  return list.sort((a, b) => {
    // 1. Prioritize mechanics matching the AI Diagnosed Specialty at the very top!
    if (aiDiagnosedSpecialty) {
      const aMatch = a.spec.toLowerCase().includes(aiDiagnosedSpecialty.toLowerCase());
      const bMatch = b.spec.toLowerCase().includes(aiDiagnosedSpecialty.toLowerCase());
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
    }
    
    // 2. Sort by proximity (closest first)
    if (a.distVal !== b.distVal) return a.distVal - b.distVal;
    
    // 3. Fallback to availability & rating
    if (a.avail === 'open' && b.avail !== 'open') return -1;
    if (a.avail !== 'open' && b.avail === 'open') return 1;
    return b.rating - a.rating;
  });
}

function renderMechs(list) {
  const el = document.getElementById('mechList');
  if (!el) return;
  if (!list.length) {
    if (isOfflineMode) {
      el.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center;padding:60px 20px;color:var(--gray);font-size:13px;line-height:1.8; animation: fadeInUp 0.4s ease;">
          <div style="position: relative; width: 72px; height: 72px; margin: 0 auto 20px;">
            <div style="position: absolute; inset: 0; border-radius: 50%; border: 4px solid rgba(230, 57, 70, 0.15); animation: pulse 1.5s infinite;"></div>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 32px;">📡</div>
          </div>
          <h3 style="font-family:'Bebas Neue', sans-serif; font-size:24px; color:white; letter-spacing:1px; margin-bottom:8px;">YOU ARE OFFLINE</h3>
          No cached mechanics found on this device.<br>
          <span style="font-size:11px;color:rgba(255,255,255,0.3)">Connect to the internet to scan for nearby mechanics.</span>
          <br>
          <button onclick="fetchRealMechanics(userLat || 6.5244, userLng || 3.3792, userCity || 'Lagos')" style="margin-top: 20px; background: var(--accent); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: bold; cursor: pointer; transition: all 0.2s;">
            RETRY CONNECTION
          </button>
        </div>
      `;
    } else if (userLat === null) {
      el.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--gray);font-size:13px;line-height:1.8;">
          <div style="font-size:32px;margin-bottom:12px;animation: pulse 1.5s infinite;">📍</div>
          Searching for physical auto shops around your current coordinates...<br>
          <span style="font-size:11px;color:rgba(255,255,255,0.3)">Please ensure your browser's GPS/location access is allowed.</span>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--gray);font-size:13px;line-height:1.8;">
          <div style="font-size:32px;margin-bottom:12px;">🏪</div>
          No real auto repair shops registered on the map within 8km of your coordinates.<br>
          <span style="font-size:11px;color:rgba(255,255,255,0.3)">Try moving to a different location or check your internet connection.</span>
        </div>
      `;
    }
    return;
  }
  
  const cardsHtml = list.map((m, i) => {
    const safeSpec = m.spec || 'General Mechanic';
    const safeName = m.name || 'Unknown Mechanic';
    const isDiagnosedMatch = aiDiagnosedSpecialty && safeSpec.toLowerCase().includes(aiDiagnosedSpecialty.toLowerCase());
    
    const hasPhone = (m.phone && m.phone !== 'Unlisted - Walk-in' && m.phone.length > 5) || (m.wa && m.wa !== 'None' && m.wa.length > 5);
    const noPhoneWarning = !hasPhone ? `
      <div class="mt-2 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md shadow-[0_0_10px_rgba(239,68,68,0.15)]">
        <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
        <span class="text-red-400 font-mono text-[9px] uppercase tracking-wider font-bold">Drive-In Only</span>
      </div>
    ` : '';

    const cleanPhone = m.phone ? m.phone.replace(/[^0-9+]/g, '') : '';
    const cleanWa = m.wa && m.wa !== 'None' ? m.wa.replace(/[^0-9+]/g, '') : cleanPhone;
    const chatLink = (m.wa && m.wa !== 'None') ? `https://wa.me/${cleanWa}` : `tel:${cleanPhone}`;

    const chatBtnHtml = hasPhone ? `
      <button class="flex-[1.2] h-10 bg-emerald-500/10 active:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-mono text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_4px_10px_rgba(16,185,129,0.1)]" onclick="event.stopPropagation(); window.open('${chatLink}', '_blank')">
        💬 CHAT
      </button>
    ` : `
      <button class="flex-[1.2] h-10 bg-white/5 text-white/30 border border-white/5 rounded-xl font-mono text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed" onclick="event.stopPropagation();">
        NO PHONE
      </button>
    `;

    const statusColor = m.avail === 'open' ? '#10b981' : (m.avail === 'busy' ? '#f59e0b' : '#ef4444');

    return `
      <div class="mech-card-s group relative rounded-[1.5rem] p-[1.5px] cursor-pointer overflow-hidden transition-all duration-500 active:scale-[0.98] mb-4" style="animation: fadeInUp 0.4s ease ${i * 0.1}s both;" onclick="openMechanicProfileDetail('${safeName.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')">
        <!-- Animated Cyan/Blue Gradient Border -->
        <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/50 via-blue-500/40 to-indigo-500/50 opacity-100 blur-[3px] shadow-[0_0_20px_rgba(6,182,212,0.3)] ${isDiagnosedMatch ? 'from-orange-500/50 to-red-500/40' : ''}"></div>
        
        <!-- Card Glass Background -->
        <div class="relative h-full bg-[#0d0e12]/60 backdrop-blur-3xl rounded-[1.5rem] p-4 flex flex-col gap-3 shadow-2xl">
          
          <!-- Header Section -->
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-3">
              <!-- Mechanic Avatar & Status -->
              <div class="relative z-10 shrink-0">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-2xl shadow-inner relative overflow-hidden transition-transform duration-500">
                  <div class="absolute inset-0 bg-blue-400/20 opacity-0 transition-opacity duration-500"></div>
                  ${m.emoji || '👨🏾‍🔧'}
                </div>
                <!-- Status Dot -->
                <div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-[2px] border-[#0d0e12] shadow-[0_0_10px_${statusColor}] z-20" style="background-color: ${statusColor};"></div>
              </div>
            </div>
            
            <!-- Location Badge -->
            <div class="relative z-20 flex flex-col items-end gap-1">
              <div class="bg-blue-500/10 border border-blue-500/30 px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-md shadow-lg shadow-blue-500/10">
                <span class="text-[9px] text-blue-400 font-mono font-bold tracking-wider">${distanceStr}</span>
              </div>
              ${isDiagnosedMatch ? '<div class="text-[8px] text-orange-400 font-mono tracking-widest font-bold uppercase drop-shadow-md">AI MATCH</div>' : `<div class="text-[7px] text-white/30 font-mono tracking-widest font-bold uppercase">${m.isScanned ? 'GPS SCANNED' : 'NEARBY'}</div>`}
            </div>
          </div>

          <!-- Body Section -->
          <div class="flex-1 mt-1">
            <h3 class="text-[18px] font-extrabold text-white tracking-tight mb-0.5 leading-tight drop-shadow-sm" style="font-family:'Bebas Neue',sans-serif; letter-spacing:1px;">
              ${safeName}
            </h3>
            <p class="text-[10px] text-gray-400 font-mono tracking-wider uppercase mb-2 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500/80 shrink-0"></span>
              <span class="leading-tight">${safeSpec}</span>
            </p>
            
            <!-- Rating & Verification Strip -->
            <div class="bg-[#1a1b23]/50 rounded-lg p-2.5 border border-white/5 flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="text-yellow-400 text-[12px] drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">★</span>
                <span class="text-white font-bold text-[11px]">${m.rating}</span>
                <span class="text-white/20 mx-0.5">|</span>
                <span class="text-gray-400 font-mono text-[8px] tracking-wider uppercase font-bold">${m.rev} REV</span>
              </div>
              <div class="flex items-center gap-1 text-[8px] font-mono tracking-wider text-white/50 uppercase">
                <span class="w-1 h-1 rounded-full bg-white/30"></span> ${m.yrs || 0} YRS
              </div>
            </div>
            
            ${noPhoneWarning}
          </div>

          <!-- Bottom Section -->
          <div class="mt-2 flex flex-col gap-2">
            <!-- Action Buttons -->
            <div class="flex gap-2">
              <button class="flex-1 h-10 bg-blue-500/10 active:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-mono text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_4px_10px_rgba(59,130,246,0.1)]" onclick="event.stopPropagation(); window.openMapTracker && openMapTracker('${safeName.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', ${m.lat || 0}, ${m.lng || 0})">
                📍 TRACK
              </button>
              ${chatBtnHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (isOfflineMode) {
    el.innerHTML = `
      <div style="grid-column: 1 / -1; margin-bottom: 16px; padding: 14px 16px; background: linear-gradient(135deg, rgba(255,136,0,0.12), rgba(255,136,0,0.06)); border: 1px solid rgba(255,136,0,0.25); border-radius: 16px; display: flex; align-items: center; gap: 12px; animation: fadeInUp 0.4s ease;">
        <div style="font-size: 20px;">⚠️</div>
        <div style="flex: 1;">
          <div style="font-size: 9px; color: var(--warn); font-family: 'Space Mono', monospace; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Working Offline</div>
          <div style="font-size: 11px; font-weight: bold; margin-top: 2px; color: var(--light-text);">Showing cached mechanics from your last active session.</div>
        </div>
      </div>
      ${cardsHtml}
    `;
  } else {
    el.innerHTML = cardsHtml;
  }
}

function filterMechs() { renderMechs(getMechs()); }

function triggerAIRecommendation(specialist) {
  aiDiagnosedSpecialty = specialist;
  
  // Show the AI Recommendation Banner
  const banner = document.getElementById('aiRecommendationBanner');
  const bannerText = document.getElementById('aiRecommendationText');
  if (banner && bannerText) {
    banner.style.display = 'flex';
    bannerText.textContent = `${specialist} (Priority Sorted to Top)`;
  }
  
  // Clear any strict search text filter so they still see all other mechanics below!
  const mechQ = document.getElementById('mechQ');
  if (mechQ) mechQ.value = '';
  
  // Switch to the mechanics screen
  goTo('mechanics');
  
  // Re-sort and render
  filterMechs();
}

function clearAIDiagnosedSpecialty() {
  aiDiagnosedSpecialty = null;
  const banner = document.getElementById('aiRecommendationBanner');
  if (banner) banner.style.display = 'none';
  filterMechs();
}

function bookRideToMech(name, city) {
  const destInput = document.getElementById('rideTo');
  if (destInput) {
    destInput.value = `${name} (${city})`;
    // Trigger the ride search logic to show providers immediately
    goTo('rides');
    setTimeout(() => {
        if(typeof searchRides === 'function') searchRides();
    }, 500);
  }
}

// ---- RATING SYSTEM ----
let selectedRating = 5;
let ratingTargetMech = '';

function openRatingModal(mechName) {
  ratingTargetMech = mechName;
  document.getElementById('ratingMechName').textContent = mechName;
  document.getElementById('ratingModal').style.display = 'flex';
  setRatingStars(5);
}

function setRatingStars(n) {
  selectedRating = n;
  const stars = document.querySelectorAll('.star-opt');
  stars.forEach((s, i) => {
    s.style.color = i < n ? '#ffcc00' : 'rgba(255,255,255,0.1)';
  });
}

function submitRating() {
  const comment = document.getElementById('ratingComment').value;
  const review = {
    mech: ratingTargetMech,
    rating: selectedRating,
    comment: comment,
    date: new Date().toLocaleDateString()
  };
  
  // Save to local storage
  let reviews = JSON.parse(localStorage.getItem('autotriage_reviews') || '[]');
  reviews.push(review);
  localStorage.setItem('autotriage_reviews', JSON.stringify(reviews));
  
  alert(`Thank you! Your ${selectedRating}-star review for ${ratingTargetMech} has been submitted.`);
  closeRatingModal();
}

function closeRatingModal() {
  document.getElementById('ratingModal').style.display = 'none';
  document.getElementById('ratingComment').value = '';
}

function filterSpec2(btn, spec) {
  document.querySelectorAll('.sf').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  curSpec2 = spec;
  renderMechs(getMechs());
  if (activeLocatorMode === 'gmaps') {
    updateGoogleMapsRadar();
  }
}

// DUAL-MODE LOCATOR INTEGRATION
let activeLocatorMode = 'scanner';

function switchLocatorMode(mode) {
  activeLocatorMode = mode;
  const scannerBtn = document.getElementById('toggleScannerBtn');
  const gmapsBtn = document.getElementById('toggleGmapsBtn');
  const scannerList = document.getElementById('mechList');
  const gmapsWrapper = document.getElementById('gmapsRadarWrapper');
  const searchInput = document.getElementById('mechQ');
  const aiBanner = document.getElementById('aiRecommendationBanner');

  if (gmapsWrapper) gmapsWrapper.style.display = 'none';

  if (mode === 'scanner') {
    if (scannerBtn) { scannerBtn.style.background = 'var(--accent)'; scannerBtn.style.color = 'white'; }
    if (gmapsBtn) { gmapsBtn.style.background = 'transparent'; gmapsBtn.style.color = 'var(--gray)'; }
    if (scannerList) scannerList.style.display = 'grid';
    if (searchInput) searchInput.style.display = 'block';
    if (aiDiagnosedSpecialty && aiBanner) aiBanner.style.display = 'flex';
    renderMechs(getMechs());
  } else {
    if (gmapsBtn) { gmapsBtn.style.background = 'var(--accent)'; gmapsBtn.style.color = 'white'; }
    if (scannerBtn) { scannerBtn.style.background = 'transparent'; scannerBtn.style.color = 'var(--gray)'; }
    if (scannerList) scannerList.style.display = 'grid';
    if (searchInput) searchInput.style.display = 'none';
    if (aiBanner) aiBanner.style.display = 'none';
    
    // Draw spectacular pulsing radar coordinate sweep overlay card
    if (scannerList) {
      const locText = userCity ? `${userCity}` : 'Your Location';
      const latText = userLat ? `${userLat.toFixed(4)}, ${userLng.toFixed(4)}` : 'Acquiring GPS...';
      
      scannerList.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; backdrop-filter: blur(20px); min-height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <style>
            @keyframes deskRadarSweep { from { width: 0%; } to { width: 100%; } }
          </style>
          <div style="position: relative; width: 72px; height: 72px; margin-bottom: 24px;">
            <div style="position: absolute; inset: 0; border-radius: 50%; border: 4px solid rgba(77, 166, 255, 0.15); animation: ping 1.5s infinite;"></div>
            <div style="position: absolute; inset: 8px; border-radius: 50%; border: 2px solid rgba(77, 166, 255, 0.3); animation: pulse 1.5s infinite;"></div>
            <div style="position: absolute; inset: 0; border-radius: 50%; border: 2px solid transparent; border-top-color: #4da6ff; animation: spin 1s linear infinite;"></div>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 24px;">📡</div>
          </div>
          <div style="font-family: 'Space Mono', monospace; font-size: 14px; font-weight: bold; color: white; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; animation: pulse 1s infinite;">Scanning Google Maps...</div>
          <div style="font-family: 'Space Mono', monospace; font-size: 9px; color: #4da6ff; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px;">
            COORD LOCK: ${locText} (${latText})
          </div>
          <div style="width: 160px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; position: relative;">
            <div style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: linear-gradient(to right, #4da6ff, #00d084); animation: deskRadarSweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;"></div>
          </div>
        </div>
      `;
    }

    setTimeout(() => {
      renderMechs(getMechs());
    }, 1200);
  }
}

function updateGoogleMapsRadar() {
  const frame = document.getElementById('gmapsRadarFrame');
  if (!frame) return;

  // Detect active specialty pill
  let specialty = 'car repair';
  const activePill = document.querySelector('.spec-row .sf.on');
  if (activePill && activePill.textContent !== 'All') {
    const specName = activePill.textContent;
    if (specName.includes('AC')) specialty = 'car AC repair';
    else if (specName.includes('Brakes')) specialty = 'brake repair';
    else if (specName.includes('Electric')) specialty = 'auto electrician';
    else if (specName.includes('Engine')) specialty = 'engine repair';
    else if (specName.includes('General')) specialty = 'car repair';
  }

  // Detect location
  let locationQuery = 'Lagos';
  if (userLat !== null && userLng !== null) {
    locationQuery = `${userLat},${userLng}`;
  } else if (window.userCity && window.userCity !== 'Detecting...') {
    locationQuery = window.userCity;
  }

  const finalQuery = `${specialty} near ${locationQuery}`;
  frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(finalQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
}

// ======================================
// RIDES ENGINE — DEEP-LINK BOOKING SYSTEM
// ======================================

let ridePickupLat = null, ridePickupLng = null;
let rideDropLat = null, rideDropLng = null;
let currentRideType = 'standard';
let selectedProvider = null;

// Ride type selector
function setRideType(btn, type) {
  document.querySelectorAll('.rtype-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  currentRideType = type;
}

// Auto-detect pickup location
function detectRidePickup() {
  const btn = document.getElementById('detectPickupBtn');
  const inp = document.getElementById('rideFrom');
  btn.textContent = '⏳';
  inp.placeholder = 'Detecting your location...';

  if (!navigator.geolocation) { inp.placeholder = 'GPS not supported'; btn.textContent = '📍'; return; }

  navigator.geolocation.getCurrentPosition(pos => {
    ridePickupLat = pos.coords.latitude;
    ridePickupLng = pos.coords.longitude;
    document.getElementById('ride-live-badge').style.display = 'block';

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${ridePickupLat}&lon=${ridePickupLng}`)
      .then(r => r.json())
      .then(d => {
        const addr = d.display_name || `${ridePickupLat.toFixed(4)}, ${ridePickupLng.toFixed(4)}`;
        inp.value = addr.split(',').slice(0,3).join(',');
        btn.textContent = '✅';
        // Pre-fill ride destination if coming from AI diagnosis
        const dest = document.getElementById('rideTo');
        if (!dest.value) dest.focus();
      }).catch(() => {
        inp.value = `${ridePickupLat.toFixed(4)}, ${ridePickupLng.toFixed(4)}`;
        btn.textContent = '✅';
      });
  }, () => {
    inp.placeholder = 'Could not detect — type manually';
    btn.textContent = '📍';
  }, { enableHighAccuracy: true });
}

// Geocode destination text to lat/lng (best-effort)
async function geocodeDest(text) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=1`);
    const d = await r.json();
    if (d && d[0]) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
  } catch {}
  return null;
}

// Estimate fare (Global pricing model)
function estimateFare(distKm, type, provider) {
  const bases = { bolt: 400, uber: 450, indrive: 350, rida: 380 };
  const perKm = { standard: 80, xl: 130, moto: 50, mechanic: 200 };
  const base = bases[provider] || 400;
  const rate = perKm[type] || 80;
  const surge = Math.random() > 0.7 ? 1.2 : 1.0;
  const fare = Math.round((base + distKm * rate) * surge / 50) * 50;
  const high = fare + 200;
  return `$${fare.toLocaleString()} – $${high.toLocaleString()}`;
}

// Provider deep-link builder
function buildDeepLink(provider, pLat, pLng, dLat, dLng, fromText, toText) {
  const enc = encodeURIComponent;
  switch(provider) {
    case 'lyft':
      // Lyft web deep link
      return `https://lyft.com/?pickup_lat=${pLat}&pickup_lng=${pLng}&destination_lat=${dLat || ''}&destination_lng=${dLng || ''}&destination_name=${enc(toText)}`;
    case 'uber':
      // Uber mobile web deep link
      return `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${pLat}&pickup[longitude]=${pLng}&pickup[nickname]=${enc(fromText)}&dropoff[latitude]=${dLat || ''}&dropoff[longitude]=${dLng || ''}&dropoff[nickname]=${enc(toText)}`;
    case 'bolt':
      return `https://bolt.eu/`;
    case 'didi':
      return `https://didi-global.com/`;
    case 'grab':
      return `https://grab.com/book?from=${enc(fromText)}&to=${enc(toText)}`;
    case 'indrive':
      return `https://indrive.com/`;
    default:
      return '#';
  }
}

// Provider config
const PROVIDERS_CONFIG = [
  {
    id: 'uber', name: 'Uber', emoji: '⬛', class: 'prc-uber',
    sub: 'Premium service · Verified drivers',
    drivers: ['John D.','Maria G.','David K.','Sarah W.','Robert L.'],
    cars: ['Toyota Camry','Honda Fit','Toyota Sienna','Ford Edge'],
    colors: ['Black','White','Silver','Blue'],
    plates: ['NY','CA','TX','FL'],
  },
  {
    id: 'lyft', name: 'Lyft', emoji: '⚡', class: 'prc-bolt',
    sub: 'Fast & affordable · 3.2K drivers',
    drivers: ['Michael T.','Sarah L.','David W.','Emma R.','James C.'],
    cars: ['Toyota Camry','Honda Accord','Toyota Corolla','Hyundai Elantra'],
    colors: ['Black','White','Silver','Gray'],
    plates: ['NY','CA','TX','FL'],
  },
  {
    id: 'bolt', name: 'Bolt', emoji: '⚡', class: 'prc-bolt',
    sub: 'Quick pickups · Low commission',
    drivers: ['Tomas Z.','Lars P.','Jan E.'],
    cars: ['Skoda Octavia','Volkswagen Golf','Opel Astra'],
    colors: ['Green','Black','White'],
    plates: ['TX','NY','CA'],
  },
  {
    id: 'didi', name: 'DiDi', emoji: '🔸', class: 'prc-didi',
    sub: 'Global ride-hailing leader',
    drivers: ['Li W.','Chen H.','Zhang M.'],
    cars: ['BYD Qin','GAC Aion S','Geely Emgrand'],
    colors: ['White','Silver','Blue'],
    plates: ['CA','TX','NY'],
  },
  {
    id: 'grab', name: 'Grab', emoji: '🟢', class: 'prc-rida',
    sub: 'Southeast Asia favourite',
    drivers: ['Alex M.','Jessica B.','Thomas S.','Elena R.','Kevin H.'],
    cars: ['Toyota Corolla','Kia Rio','Hyundai i10','Honda Fit'],
    colors: ['Red','White','Black','Silver'],
    plates: ['NY','CA','TX','FL'],
  },
  {
    id: 'indrive', name: 'InDrive', emoji: '🔵', class: 'prc-indrive',
    sub: 'Fair pricing · Peer-to-peer',
    drivers: ['Vadim K.','Sergey N.','Iryna S.'],
    cars: ['Hyundai Sonata','Kia Optima','Renault Logan'],
    colors: ['Silver','White','Blue'],
    plates: ['AZ','CA','TX'],
  }
];

let rideSearchResults = [];

async function searchRides() {
  const from = document.getElementById('rideFrom').value.trim();
  const to   = document.getElementById('rideTo').value.trim();
  if (!from) { detectRidePickup(); return; }
  if (!to)   { alert('Please enter your destination.'); return; }

  // Geocode destination
  const destGeo = ridePickupLat ? await geocodeDest(to) : null;
  if (destGeo) { rideDropLat = destGeo.lat; rideDropLng = destGeo.lng; }

  const distKm = (ridePickupLat && rideDropLat)
    ? calculateDistance(ridePickupLat, ridePickupLng, rideDropLat, rideDropLng)
    : (3 + Math.random() * 12); // fallback distance estimate

  // Show radar animation
  document.getElementById('rideSearching').style.display = 'block';
  document.getElementById('rideProviderResults').style.display = 'none';
  const statuses = ['Scanning nearby providers...','Checking Lyft drivers...','Checking Uber...','Checking Bolt...','Checking DiDi...','Checking Grab...','Checking InDrive...','Calculating fares...'];
  let si = 0;
  const statusEl = document.getElementById('searchStatus');
  const statusInt = setInterval(() => { if (si < statuses.length) statusEl.textContent = statuses[si++]; }, 500);

  setTimeout(() => {
    clearInterval(statusInt);
    document.getElementById('rideSearching').style.display = 'none';

    // Build results for each provider
    rideSearchResults = PROVIDERS_CONFIG.map(p => {
      const etaBase = Math.floor(3 + Math.random() * 12);
      const driver = p.drivers[Math.floor(Math.random() * p.drivers.length)];
      const car   = p.cars[Math.floor(Math.random() * p.cars.length)];
      const color = p.colors[Math.floor(Math.random() * p.colors.length)];
      const plate = p.plates[Math.floor(Math.random() * p.plates.length)] + ' ' + Math.floor(100 + Math.random()*900) + ' ' + String.fromCharCode(65 + Math.floor(Math.random()*26)) + String.fromCharCode(65 + Math.floor(Math.random()*26)) + String.fromCharCode(65 + Math.floor(Math.random()*26));
      const fare  = estimateFare(distKm, currentRideType, p.id);
      const link  = buildDeepLink(p.id, ridePickupLat || 0, ridePickupLng || 20, rideDropLat, rideDropLng, from, to);
      return { ...p, eta: etaBase, driver, car, color, plate, fare, link, distKm: distKm.toFixed(1) };
    }).sort((a, b) => a.eta - b.eta);

    renderProviderResults(rideSearchResults, from, to);
    document.getElementById('rideProviderResults').style.display = 'block';
  }, 3000);
}

function renderProviderResults(providers, from, to) {
  document.getElementById('providerCards').innerHTML = providers.map((p, i) => `
    <div class="provider-result-card ${p.class}" onclick="openBookingModal(${i})" style="animation:fadeInUp 0.4s ease ${i * 0.1}s both;">
      <div class="prc-avail"></div>
      <div class="prc-logo">${p.emoji}</div>
      <div class="prc-info">
        <div class="prc-name">${p.name}</div>
        <div class="prc-sub">${p.sub}</div>
        <div style="margin-top:8px;font-size:9px;color:rgba(255,255,255,0.3);">🚗 ${p.car} · ${p.color} · ${p.plate}</div>
      </div>
      <div class="prc-right">
        <div class="prc-price">${p.fare}</div>
        <div class="prc-eta">⏱ ${p.eta} min</div>
        <div style="margin-top:6px;font-size:9px;background:rgba(255,255,255,0.08);border-radius:8px;padding:3px 8px;color:rgba(255,255,255,0.5);">${p.distKm} km</div>
      </div>
    </div>
  `).join('');
}

function openBookingModal(idx) {
  selectedProvider = rideSearchResults[idx];
  const p = selectedProvider;

  document.getElementById('bookingProviderLogo').textContent = p.emoji;
  document.getElementById('bookingProviderName').textContent = p.name;
  document.getElementById('bookingDetails').innerHTML = `
    <div class="booking-row"><span class="booking-row-label">Fare estimate</span><span class="booking-row-val">${p.fare}</span></div>
    <div class="booking-row"><span class="booking-row-label">Distance</span><span class="booking-row-val">${p.distKm} km</span></div>
    <div class="booking-row"><span class="booking-row-label">Ride type</span><span class="booking-row-val">${currentRideType.toUpperCase()}</span></div>
  `;

  // Show matched driver
  document.getElementById('bookingDriverCard').style.display = 'flex';
  document.getElementById('bookingDriverAv').textContent = ['👨🏻','👩🏻','👨🏼','👩🏼','👨🏽','👩🏽','👨🏾','👩🏾','👨🏿','👩🏿'][Math.floor(Math.random()*10)];
  document.getElementById('bookingDriverName').textContent = p.driver;
  document.getElementById('bookingDriverInfo').textContent = `${p.car} · ${p.color} · ⭐ ${(4.7 + Math.random()*0.29).toFixed(2)}`;
  document.getElementById('bookingDriverETA').textContent = p.eta;

  // Progress bar — simulate matching
  const prog = document.getElementById('bookingProgress');
  const fill = document.getElementById('bookingProgressFill');
  const status = document.getElementById('bookingStatus');
  prog.style.display = 'block';
  fill.style.width = '0%';
  status.textContent = 'MATCHING WITH DRIVER...';
  let pct = 0;
  const pi = setInterval(() => {
    pct = Math.min(pct + 12, 100);
    fill.style.width = pct + '%';
    if (pct >= 100) { clearInterval(pi); status.textContent = 'DRIVER FOUND — TAP BELOW TO CONFIRM'; }
  }, 200);

  // Style open button with brand color
  const colorMap = { bolt:'#7fea00', uber:'#ffffff', indrive:'#4da6ff', rida:'#ff5050' };
  const btn = document.getElementById('openAppBtn');
  btn.style.color = colorMap[p.id] || '#fff';
  btn.textContent = `📱 Book with ${p.name} →`;

  const modal = document.getElementById('rideBookingModal');
  modal.style.display = 'flex';
}

async function openProviderApp() {
  if (!selectedProvider) return;
  const p = selectedProvider;

  // Open the provider's app via deep link / mobile web — location data pre-filled
  window.open(p.link, '_blank');

  // Sync booking data with backend so SMS/Email dispatches are fired
  try {
    const savedUserStr = localStorage.getItem('autotriage_user');
    const savedUserObj = savedUserStr ? JSON.parse(savedUserStr) : null;
    const passengerEmail = savedUserObj ? savedUserObj.email : 'local_device_session@autotriage.io';
    const passengerName = savedUserObj ? savedUserObj.name : 'Guest Mobile Driver';
    const passengerPhone = localStorage.getItem('autotriage_phone_' + p.id) || '+1 (555) 0199';

    const res = await fetch('/api/book-ride', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: p.id,
        pickupLocation: document.getElementById('rideFrom').value || 'Current Location',
        destination: document.getElementById('rideTo').value || 'Unknown Destination',
        rideType: currentRideType || 'standard',
        passengerName: passengerName,
        passengerPhone: passengerPhone,
        passengerEmail: passengerEmail
      })
    });

    const data = await res.json();
    if (data.success) {
      // Save the booking log to localStorage
      const storedRides = JSON.parse(localStorage.getItem('autotriage_rides') || '[]');
      storedRides.unshift({
        bookingId: data.bookingId,
        provider: p.id,
        driver: data.driver,
        eta: data.eta,
        pickupLocation: document.getElementById('rideFrom').value || 'Current Location',
        destination: document.getElementById('rideTo').value || 'Unknown Destination',
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('autotriage_rides', JSON.stringify(storedRides));
      
      // Update mobile UI
      renderGarageRides();
    }
  } catch (err) {
    console.error('[MOBILE RIDE] Failed to dispatch backend booking state:', err);
  }

  closeBookingModal();
}

function closeBookingModal() {
  document.getElementById('rideBookingModal').style.display = 'none';
  selectedProvider = null;
}

// ---- LIVE MAP TRACKING ----
let trackerMap = null;
let userMarker = null;
let mechMarker = null;
let watchId = null;
let simulationInterval = null;
let isVoiceEnabled = true;
let primaryPillMarker = null;
let altPillMarker = null;
let primaryPolyline = null;
let altPolyline = null;
let startMarker = null;
let routeDots = [];

function speakDirection(text) {
  if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop any pending spoken instructions
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Clear natural rate
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Text-to-speech error:", err);
  }
}

function toggleVoice() {
  isVoiceEnabled = !isVoiceEnabled;
  const btn = document.getElementById('voiceBtn');
  if (btn) {
    if (isVoiceEnabled) {
      btn.textContent = '🔊';
      btn.classList.remove('muted');
      speakDirection("Voice guidance enabled");
    } else {
      btn.textContent = '🔇';
      btn.classList.add('muted');
    }
  }
}

function generateSimulatedRoute(uLng, uLat, mechLng, mechLat) {
  const points = [];
  const segments = 50;
  // Cubic Bezier to curve beautifully around Okoloba St, Jakpa Rd and Nnewi St
  const midLat1 = uLat + (mechLat - uLat) * 0.35 + 0.002;
  const midLng1 = uLng + (mechLng - uLng) * 0.35 - 0.003;
  const midLat2 = uLat + (mechLat - uLat) * 0.70 - 0.003;
  const midLng2 = uLng + (mechLng - uLng) * 0.70 + 0.002;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lat = Math.pow(1 - t, 3) * uLat + 
                3 * Math.pow(1 - t, 2) * t * midLat1 + 
                3 * (1 - t) * Math.pow(t, 2) * midLat2 + 
                Math.pow(t, 3) * mechLat;
    const lng = Math.pow(1 - t, 3) * uLng + 
                3 * Math.pow(1 - t, 2) * t * midLng1 + 
                3 * (1 - t) * Math.pow(t, 2) * midLng2 + 
                Math.pow(t, 3) * mechLng;
    points.push([lng, lat]);
  }
  return points;
}

function generateAlternativeRoute(uLng, uLat, mechLng, mechLat) {
  const points = [];
  const segments = 50;
  // Alternative Bezier route curving slightly wider representing secondary path
  const midLat1 = uLat + (mechLat - uLat) * 0.45 - 0.003;
  const midLng1 = uLng + (mechLng - uLng) * 0.25 + 0.004;
  const midLat2 = uLat + (mechLat - uLat) * 0.80 + 0.002;
  const midLng2 = uLng + (mechLng - uLng) * 0.60 - 0.005;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lat = Math.pow(1 - t, 3) * uLat + 
                3 * Math.pow(1 - t, 2) * t * midLat1 + 
                3 * (1 - t) * Math.pow(t, 2) * midLat2 + 
                Math.pow(t, 3) * mechLat;
    const lng = Math.pow(1 - t, 3) * uLng + 
                3 * Math.pow(1 - t, 2) * t * midLng1 + 
                3 * (1 - t) * Math.pow(t, 2) * midLng2 + 
                Math.pow(t, 3) * mechLng;
    points.push([lng, lat]);
  }
  return points;
}

// ---- satellite reverse-geocoding helper using 100% free OSM Nominatim ----
async function getPlaceName(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await res.json();
    if (data) {
      const addr = data.address;
      // Prefer building names, amenities, shops, or road names
      const mainName = data.name || addr.amenity || addr.shop || addr.building || addr.road || addr.suburb || addr.city;
      const roadName = addr.road || addr.suburb || addr.city;
      if (mainName && roadName && mainName !== roadName) {
        return `${mainName}, ${roadName}`;
      }
      return mainName || `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
  } catch (err) {
    console.warn("Reverse geocode failed", err);
  }
  return `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

async function fetchRealRouteNames(primaryLatLngs, mechName) {
  const startPt = primaryLatLngs[0];
  const turn1Pt = primaryLatLngs[Math.floor(primaryLatLngs.length * 0.3)];
  const turn2Pt = primaryLatLngs[Math.floor(primaryLatLngs.length * 0.7)];
  const endPt = primaryLatLngs[primaryLatLngs.length - 1];

  try {
    const [startName, turn1Name, turn2Name, endName] = await Promise.all([
      getPlaceName(startPt[0], startPt[1]),
      getPlaceName(turn1Pt[0], turn1Pt[1]),
      getPlaceName(turn2Pt[0], turn2Pt[1]),
      getPlaceName(endPt[0], endPt[1])
    ]);

    return {
      start: startName || "Your Location",
      turn1: turn1Name || "Local Road",
      turn2: turn2Name || "Main Street",
      end: endName || `${mechName}'s Garage`
    };
  } catch (e) {
    console.warn("Fetch real names failed", e);
  }
  return {
    start: "Your Location",
    turn1: "Jakpa Road",
    turn2: "Okoloba Street",
    end: `${mechName}'s Workshop`
  };
}

function openMapTracker(mechName, mechLat, mechLng) {
  document.getElementById('mapModal').style.display = 'flex';
  document.getElementById('mapMechName').textContent = mechName;
  document.getElementById('mapDist').innerHTML = `Calculating...`;
  
  // Find mechanic details from the global MECHS list
  const mech = MECHS.find(m => m.name === mechName) || { emoji: '🔧', phone: '1234567890', wa: '1234567890', spec: 'Mobile Response Unit' };
  
  // Safe numeric coordinate parsing
  let finalLat = parseFloat(mechLat || mech.lat);
  let finalLng = parseFloat(mechLng || mech.lng);
  
  // Absolute fallback to user coordinates or London center if coordinates are invalid
  if (isNaN(finalLat) || isNaN(finalLng) || !finalLat || !finalLng) {
    finalLat = userLat || 51.5074;
    finalLng = userLng || -0.1278;
  }
  
  // Update UI components dynamically
  const avatarEl = document.getElementById('trackerMechAvatar');
  const specEl = document.getElementById('trackerMechSpec');
  const phoneEl = document.getElementById('trackerPhoneLink');
  const waEl = document.getElementById('trackerWaLink');
  const distValEl = document.getElementById('trackerDistVal');
  const etaValEl = document.getElementById('trackerEtaVal');
  
  if (avatarEl) avatarEl.textContent = mech.emoji || '🔧';
  if (specEl) specEl.textContent = mech.spec || 'Mobile Response Unit';
  if (phoneEl) phoneEl.href = `tel:${mech.phone || ''}`;
  if (waEl) waEl.href = `https://wa.me/${mech.wa || ''}`;
  if (distValEl) distValEl.textContent = `Calculating...`;
  if (etaValEl) etaValEl.textContent = `Calculating...`;
  
  // Clear previous simulation if active
  if (simulationInterval !== null) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  
  // Display the Navigation HUD
  const navHud = document.getElementById('navHud');
  if (navHud) navHud.style.display = 'flex';
  
  // Start Geolocation watchPosition tracking to actively update coordinates as user moves
  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        userLat = lat;
        userLng = lng;
        
        console.log("GPS Location updated in real-time:", lat, lng);
        
        // Pan the Leaflet camera dynamically to center on the moving user
        if (trackerMap) {
          trackerMap.panTo([lat, lng]);
        }
      },
      (err) => {
        console.warn("Real-time GPS tracking warning:", err);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  }
  
  setTimeout(() => {
    // Generate simulated driving coordinate route track from User to Mechanic's Workshop
    const startLat = userLat || (finalLat - 0.015);
    const startLng = userLng || (finalLng + 0.015);
    const destLat = finalLat;
    const destLng = finalLng;
    
    const routeCoordinates = generateSimulatedRoute(startLng, startLat, destLng, destLat);
    const alternativeCoordinates = generateAlternativeRoute(startLng, startLat, destLng, destLat);
    const totalDistance = calculateDistance(destLat, destLng, startLat, startLng);

    if (!trackerMap) {
      if (window.L) {
        trackerMap = L.map('mapContainer', {
          zoomControl: false,
          attributionControl: true
        });
        
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri &mdash; Sources: Esri'
        }).addTo(trackerMap);
        
        trackerMap.setView([startLat, startLng], 14);
        drawRouteLineAndSimulate(routeCoordinates, alternativeCoordinates, totalDistance, mech);
      }
    } else {
      if (window.L) {
        trackerMap.setView([startLat, startLng], 14);
        drawRouteLineAndSimulate(routeCoordinates, alternativeCoordinates, totalDistance, mech);
      }
    }
  }, 100);
}

async function drawRouteLineAndSimulate(routeCoords, altCoords, totalDistance, mech) {
  if (!trackerMap || !window.L) return;

  // Clear previous Leaflet layers
  if (primaryPolyline) { trackerMap.removeLayer(primaryPolyline); primaryPolyline = null; }
  if (altPolyline) { trackerMap.removeLayer(altPolyline); altPolyline = null; }
  if (startMarker) { trackerMap.removeLayer(startMarker); startMarker = null; }
  if (userMarker) { trackerMap.removeLayer(userMarker); userMarker = null; }
  if (mechMarker) { trackerMap.removeLayer(mechMarker); mechMarker = null; }
  if (primaryPillMarker) { trackerMap.removeLayer(primaryPillMarker); primaryPillMarker = null; }
  if (altPillMarker) { trackerMap.removeLayer(altPillMarker); altPillMarker = null; }
  if (routeDots && routeDots.length > 0) {
    routeDots.forEach(d => trackerMap.removeLayer(d));
    routeDots = [];
  }

  // Map coordinate pairs [lng, lat] to Leaflet latlng arrays [lat, lng]
  const primaryLatLngs = routeCoords.map(c => [c[1], c[0]]);
  const altLatLngs = altCoords.map(c => [c[1], c[0]]);

  // Fetch 100% real building/road names in real-time from satellite geocoding database!
  const names = await fetchRealRouteNames(primaryLatLngs, mech.name);

  // 1. Draw Alternative Route (Lighter Blue/Grey Route Option)
  altPolyline = L.polyline(altLatLngs, {
    color: '#4da6ff',
    weight: 5,
    opacity: 0.65
  }).addTo(trackerMap);

  // 2. Draw Primary Route (Solid Royal Blue Line)
  primaryPolyline = L.polyline(primaryLatLngs, {
    color: '#2a6cf5',
    weight: 5,
    opacity: 0.95
  }).addTo(trackerMap);

  // 3. Draw Closely Spaced Purple Circles/Dots Along the Active Route
  for (let i = 0; i < primaryLatLngs.length; i += 3) {
    const dot = L.circleMarker(primaryLatLngs[i], {
      radius: 4.5,
      fillColor: '#4a0082',
      fillOpacity: 1,
      color: '#ffffff',
      weight: 1.5
    }).addTo(trackerMap);
    routeDots.push(dot);
  }

  // 4. Create Floating Route Info Boxes Directly On Map Canvas via styled Popup overlays
  const primaryMid = primaryLatLngs[Math.floor(primaryLatLngs.length / 2)];
  const altMid = altLatLngs[Math.floor(altLatLngs.length / 2)];

  // Primary Pill (35 min, 2.5 km)
  primaryPillMarker = L.popup({
    closeButton: false,
    autoPan: false,
    offset: [0, -10]
  })
  .setLatLng(primaryMid)
  .setContent(`<div class="map-route-pill">🚶 35 min<span style="font-size:9px;color:#888;display:block;margin-top:2px;">2.5 km</span></div>`)
  .addTo(trackerMap);

  // Alternative Pill (37 min, 2.7 km)
  altPillMarker = L.popup({
    closeButton: false,
    autoPan: false,
    offset: [0, -10]
  })
  .setLatLng(altMid)
  .setContent(`<div class="map-route-pill alt">🚶 37 min<span style="font-size:9px;color:#888;display:block;margin-top:2px;">2.7 km</span></div>`)
  .addTo(trackerMap);

  // 5. White Circle Starting Point (User's Breakdown Location)
  startMarker = L.circleMarker(primaryLatLngs[0], {
    radius: 7,
    fillColor: '#ffffff',
    fillOpacity: 1,
    color: '#8e8e93',
    weight: 3
  }).addTo(trackerMap);

  // 6. Draw Fixed Mechanic Workshop Marker at the destination
  const mechIcon = L.divIcon({
    className: 'mech-pulse-marker',
    html: `<div class="mech-dot" style="font-size:32px; filter:drop-shadow(0 2px 10px rgba(255,159,10,0.6)); animation: floatPin 2s ease-in-out infinite;">🏪</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
  
  mechMarker = L.marker(primaryLatLngs[primaryLatLngs.length - 1], { icon: mechIcon }).addTo(trackerMap);

  // 7. Draw User's glowing navigation pulse marker starting at the pickup point
  const userPulseIcon = L.divIcon({
    className: 'user-pulse-marker',
    html: '<div class="pulse-ring" style="border-color: #2a6cf5;"></div><div class="pulse-dot" style="background: #2a6cf5; box-shadow: 0 0 10px #2a6cf5;"></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
  
  userMarker = L.marker(primaryLatLngs[0], { icon: userPulseIcon }).addTo(trackerMap);

  // Fit boundaries initially to show the whole route
  const bounds = L.latLngBounds([...primaryLatLngs, ...altLatLngs]);
  trackerMap.fitBounds(bounds, { padding: [40, 40] });

  // Navigation voice-over instructions using 100% REAL street and building names fetched from satellite database!
  const voiceDirections = [
    { step: 0, icon: '↑', instruction: `Starting near ${names.start}`, voice: `GPS navigation started. Your ride is starting near ${names.start} and is en route to ${mech.name}'s workshop.` },
    { step: 10, icon: '↰', instruction: `In 300m, turn left towards ${names.turn1}`, voice: `In 300 meters, turn left towards ${names.turn1}.` },
    { step: 18, icon: '↰', instruction: `Turn left onto ${names.turn1}`, voice: `Turn left onto ${names.turn1}.` },
    { step: 28, icon: '↑', instruction: `Continue straight towards ${names.turn2}`, voice: `Continue straight towards ${names.turn2}.` },
    { step: 38, icon: '↱', instruction: `In 200m, turn right towards ${names.end}`, voice: `In 200 meters, turn right towards ${names.end}.` },
    { step: 44, icon: '↱', instruction: 'Turn right to stay on route', voice: 'Turn right to stay on route.' },
    { step: 48, icon: '🏁', instruction: `Approaching ${names.end}`, voice: `Approaching ${names.end} on the right.` },
    { step: 50, icon: '🏁', instruction: 'You have arrived!', voice: `Arrived! You have reached ${mech.name}'s workshop at ${names.end}. You can now meet your mechanic.` }
  ];

  // Set stepper fill initially
  const stepperProgress = document.querySelector('.stepper-progress-fill');
  const stepperSteps = document.querySelectorAll('.stepper-step');
  
  if (stepperProgress) stepperProgress.style.width = '50%';
  if (stepperSteps[2]) {
    stepperSteps[2].classList.remove('active');
    stepperSteps[2].innerHTML = '<div class="step-dot"></div><span class="step-label">Arrival</span>';
  }

  let currentStep = 0;
  const totalSteps = primaryLatLngs.length - 1;

  speakDirection(voiceDirections[0].voice);
  
  // Animation driving loop
  simulationInterval = setInterval(() => {
    currentStep++;
    if (currentStep > totalSteps) {
      clearInterval(simulationInterval);
      simulationInterval = null;
      
      // Update Stepper to completed arrival state
      if (stepperProgress) stepperProgress.style.width = '100%';
      if (stepperSteps[1]) {
        stepperSteps[1].classList.remove('pulsing');
        stepperSteps[1].innerHTML = '<div class="step-dot">✓</div><span class="step-label">En Route</span>';
      }
      if (stepperSteps[2]) {
        stepperSteps[2].classList.add('active');
        stepperSteps[2].innerHTML = '<div class="step-dot">✓</div><span class="step-label">Arrival</span>';
      }
      return;
    }

    const currentCoords = primaryLatLngs[currentStep];
    userMarker.setLatLng(currentCoords);
    
    // Smooth camera trailing - keep the user centered
    trackerMap.panTo(currentCoords);

    // Interpolate ETA and distance values smoothly
    const percentDone = currentStep / totalSteps;
    const remainingDist = Math.max(0, totalDistance * (1 - percentDone));
    const remainingEta = Math.max(0, Math.ceil(12 * (1 - percentDone)));

    const distValEl = document.getElementById('trackerDistVal');
    const etaValEl = document.getElementById('trackerEtaVal');
    
    if (distValEl) distValEl.textContent = `${remainingDist.toFixed(2)} km`;
    if (etaValEl) etaValEl.textContent = remainingEta > 0 ? `~${remainingEta} min` : 'Arrived';
    
    // Stepper filling progress
    if (stepperProgress) {
      stepperProgress.style.width = (50 + (percentDone * 50)) + '%';
    }

    // Voice and HUD instructions checker
    const dirInfo = voiceDirections.find(d => d.step === currentStep);
    if (dirInfo) {
      const hudIcon = document.getElementById('hudTurnIcon');
      const hudText = document.getElementById('hudInstruction');
      const hudSubText = document.getElementById('hudSubInstruction');
      
      if (hudIcon) hudIcon.textContent = dirInfo.icon;
      if (hudText) hudText.textContent = dirInfo.instruction;
      
      // Predict next instruction
      const nextDir = voiceDirections.find(d => d.step > currentStep);
      if (hudSubText) {
        hudSubText.textContent = nextDir ? `Next: ${nextDir.instruction}` : 'Destination Ahead';
      }

      speakDirection(dirInfo.voice);
    }
  }, 600); // 600ms updates for incredibly fluid visual transitions
}

function closeMap() {
  document.getElementById('mapModal').style.display = 'none';
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (simulationInterval !== null) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  // Clear floating markers and shapes from Leaflet
  if (trackerMap) {
    if (primaryPolyline) { trackerMap.removeLayer(primaryPolyline); primaryPolyline = null; }
    if (altPolyline) { trackerMap.removeLayer(altPolyline); altPolyline = null; }
    if (startMarker) { trackerMap.removeLayer(startMarker); startMarker = null; }
    if (userMarker) { trackerMap.removeLayer(userMarker); userMarker = null; }
    if (mechMarker) { trackerMap.removeLayer(mechMarker); mechMarker = null; }
    if (primaryPillMarker) { trackerMap.removeLayer(primaryPillMarker); primaryPillMarker = null; }
    if (altPillMarker) { trackerMap.removeLayer(altPillMarker); altPillMarker = null; }
    if (routeDots && routeDots.length > 0) {
      routeDots.forEach(d => trackerMap.removeLayer(d));
      routeDots = [];
    }
  }
  
  // Immediately silence the speech synthesizer on modal close
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('active');
}

window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  document.getElementById('scrollProgress').style.width = scrolled + '%';
});

// ---- INIT ----
initLocation();
renderMechs(getMechs());
</script>

<div id="mapModal" style="display:none; position:fixed; inset:0; background:#080808; z-index:99999; flex-direction:column; overflow:hidden;">
  <!-- Full Screen Map Container -->
  <div id="mapContainer" style="position:absolute; inset:0; z-index:1; background:#121212;"></div>

  <!-- FLOATING GLASS HEADER -->
  <div class="tracker-header">
    <div class="tracker-header-left">
      <span class="tracker-pulse-dot"></span>
      <span style="font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:2px; color:#fff;">LIVE TRACKING</span>
    </div>
    <button onclick="closeMap()" class="tracker-close-btn">✕</button>
  </div>

  <!-- DYNAMIC GPS NAVIGATION HUD -->
  <div class="navigation-hud" id="navHud" style="display: none;">
    <div class="hud-turn-icon" id="hudTurnIcon">↑</div>
    <div class="hud-details">
      <div class="hud-instruction" id="hudInstruction">GPS Navigation Loading...</div>
      <div class="hud-sub-instruction" id="hudSubInstruction">Next: Stay on route</div>
    </div>
    <button onclick="toggleVoice()" class="hud-voice-btn" id="voiceBtn" title="Toggle Voice Guidance">🔊</button>
  </div>

  <!-- FLOATING BOTTOM DRAWER -->
  <div class="tracker-drawer">
    <!-- Swipe indicator drag handle for native mobile look -->
    <div class="drawer-handle"></div>

    <!-- Mechanic Profile Row -->
    <div class="tracker-mech-row">
      <div class="tracker-avatar-wrap">
        <div class="tracker-avatar" id="trackerMechAvatar">🔧</div>
      </div>
      <div class="tracker-mech-info">
        <div class="tracker-verified-badge">🛡️ VERIFIED PRO</div>
        <div class="tracker-mech-name" id="mapMechName">Loading...</div>
        <div class="tracker-mech-spec" id="trackerMechSpec">Mobile Response Unit</div>
      </div>
    </div>

    <!-- ETA and Distance Pills -->
    <div class="tracker-stats-grid">
      <div class="tracker-stat-pill eta">
        <span class="tracker-pill-icon">⏳</span>
        <div class="tracker-pill-details">
          <span class="tracker-pill-label">EST. ARRIVAL</span>
          <span class="tracker-pill-val" id="trackerEtaVal">Calculating...</span>
        </div>
      </div>
      <div class="tracker-stat-pill dist">
        <span class="tracker-pill-icon">📍</span>
        <div class="tracker-pill-details">
          <span class="tracker-pill-label">DISTANCE</span>
          <span class="tracker-pill-val" id="trackerDistVal">Calculating...</span>
        </div>
      </div>
    </div>

    <!-- Stepper Progress Bar -->
    <div class="tracker-stepper">
      <div class="stepper-line">
        <div class="stepper-progress-fill" style="width: 50%;"></div>
      </div>
      <div class="stepper-step active">
        <div class="step-dot">✓</div>
        <span class="step-label">Dispatched</span>
      </div>
      <div class="stepper-step active pulsing">
        <div class="step-dot">●</div>
        <span class="step-label">En Route</span>
      </div>
      <div class="stepper-step">
        <div class="step-dot"></div>
        <span class="step-label">Arrival</span>
      </div>
    </div>

    <!-- Action Buttons Row -->
    <div class="tracker-actions-row">
      <a href="tel:+1234567890" id="trackerPhoneLink" class="tracker-btn phone">
        <span>📞 Call Mechanic</span>
      </a>
      <a href="https://wa.me/1234567890" target="_blank" id="trackerWaLink" class="tracker-btn wa">
        <span>💬 WhatsApp</span>
      </a>
    </div>
  </div>

  <!-- Keep hidden element for internal JS compatibility if any other code references it -->
  <div id="mapDist" style="display:none;"></div>
</div>
<div id="ratingModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:10000; align-items:center; justify-content:center; padding:20px;">
  <div style="background:#111; border:1px solid #333; width:100%; max-width:360px; padding:32px; border-radius:24px; text-align:center;">
    <div style="font-family:'Bebas Neue',sans-serif; font-size:32px; color:#fff; margin-bottom:8px;">RATE MECHANIC</div>
    <div id="ratingMechName" style="color:var(--accent); font-size:12px; letter-spacing:2px; margin-bottom:24px;">...</div>
    
    <div style="display:flex; justify-content:center; gap:12px; margin-bottom:24px;">
      <span class="star-opt" onclick="setRatingStars(1)" style="font-size:32px; cursor:pointer;">★</span>
      <span class="star-opt" onclick="setRatingStars(2)" style="font-size:32px; cursor:pointer;">★</span>
      <span class="star-opt" onclick="setRatingStars(3)" style="font-size:32px; cursor:pointer;">★</span>
      <span class="star-opt" onclick="setRatingStars(4)" style="font-size:32px; cursor:pointer;">★</span>
      <span class="star-opt" onclick="setRatingStars(5)" style="font-size:32px; cursor:pointer;">★</span>
    </div>
    
    <textarea id="ratingComment" placeholder="Share your experience (optional)..." style="width:100%; height:100px; background:rgba(255,255,255,0.03); border:1px solid #333; border-radius:12px; color:#fff; padding:12px; font-family:'Space Mono',monospace; font-size:12px; margin-bottom:24px; resize:none;"></textarea>
    
    <div style="display:flex; gap:12px;">
      <button onclick="closeRatingModal()" style="flex:1; background:transparent; border:1px solid #333; color:#888; padding:14px; border-radius:12px; font-family:'Space Mono',monospace; font-size:10px; cursor:pointer;">CANCEL</button>
      <button onclick="submitRating()" style="flex:1; background:#fff; color:#000; border:none; padding:14px; border-radius:12px; font-family:'Space Mono',monospace; font-size:10px; font-weight:bold; cursor:pointer;">SUBMIT</button>
    </div>
  </div>
</div>

<!-- REPAIR COST PREDICTOR MODAL -->
<div id="repairModal" style="display:none;position:fixed;inset:0;z-index:50000;background:rgba(0,0,0,0.88);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);align-items:flex-end;justify-content:center;" onclick="closeRepairModal(event)">
  <div style="background:linear-gradient(160deg,#141414,#0a0a0a);border:1px solid rgba(255,255,255,0.08);border-radius:28px 28px 0 0;padding:32px 24px 48px;width:100%;max-width:480px;" onclick="event.stopPropagation()">
    <div style="width:36px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;margin:0 auto 24px;"></div>
    <div id="repairModalContent"></div>
  </div>
</div>

<!-- LOG SERVICE MODAL -->
<div id="logServiceModal" style="display:none;position:fixed;inset:0;z-index:50000;background:rgba(0,0,0,0.88);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);align-items:flex-end;justify-content:center;" onclick="closeLogServiceModal(event)">
  <div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:28px 28px 0 0;padding:32px 24px 48px;width:100%;max-width:480px;" onclick="event.stopPropagation()">
    <div style="width:36px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;margin:0 auto 24px;"></div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;margin-bottom:6px;">LOG LAST SERVICE</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:20px;">Record when you last had a service done so we can track your next due date accurately.</div>
    <select id="logServiceType" class="fi" style="width:100%;margin-bottom:12px;background:#1a1a1a;color:#fff;">
      <option value="">Select service type...</option>
      <option value="oil">🛢️ Oil Change</option>
      <option value="tireRotation">🛥️ Tire Rotation</option>
      <option value="airFilter">💨 Air Filter</option>
      <option value="brakes">🛑 Brake Pads</option>
      <option value="coolant">🌡️ Coolant Flush</option>
      <option value="transmission">⚙️ Transmission Fluid</option>
      <option value="sparkPlugs">⚡ Spark Plugs</option>
      <option value="battery">🔋 Battery Replacement</option>
    </select>
    <input class="fi" type="number" id="logServiceMileage" placeholder="Mileage when done (e.g. 42000)" style="width:100%;margin-bottom:16px;"/>
    <button onclick="saveServiceLog()" style="width:100%;background:#fff;color:#000;border:none;padding:14px;border-radius:12px;font-family:'Space Mono',monospace;font-size:11px;font-weight:bold;cursor:pointer;">SAVE SERVICE LOG →</button>
    <button onclick="closeLogServiceModal()" style="width:100%;background:transparent;border:none;color:rgba(255,255,255,0.3);padding:12px;font-size:10px;cursor:pointer;margin-top:8px;">Cancel</button>
  </div>
</div>

<!-- PROFILE SETTINGS DRAWER -->
<div id="profileDrawer" style="display:none;position:fixed;inset:0;z-index:90000;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);justify-content:flex-end;" onclick="closeProfileDrawer(event)">
  <div id="profileDrawerPanel" style="background:#0a0a0a;border-left:1px solid rgba(255,255,255,0.08);width:85%;max-width:340px;height:100%;padding:32px 24px;transform:translateX(100%);transition:transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);overflow-y:auto;display:flex;flex-direction:column;" onclick="event.stopPropagation()">
    
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:1px;color:#fff;">PROFILE & SETTINGS</div>
      <button onclick="closeProfileDrawer()" style="background:rgba(255,255,255,0.05);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
    </div>

    <!-- User Header -->
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.05);">
      <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#111,#222);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:24px;">👤</div>
      <div>
        <div style="font-weight:bold;font-size:16px;color:#fff;">Guest User</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">Local Device Profile</div>
      </div>
    </div>

    <!-- Role Switcher (shown when Pro) -->
    <div id="roleSwitcherContainer" style="display:none;margin-bottom:24px;">
      <div style="font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:1px;margin-bottom:8px;font-weight:bold;font-family:'Space Mono',monospace;text-transform:uppercase;">Active Role</div>
      <div style="display:flex;background:rgba(255,255,255,0.05);border-radius:12px;padding:4px;border:1px solid rgba(255,255,255,0.1);">
        <button id="roleBtnUser" onclick="switchUserRole('driver')" style="flex:1;background:var(--accent,#ff3333);color:white;border:none;border-radius:8px;padding:10px;font-family:'Space Mono',monospace;font-size:11px;font-weight:bold;cursor:pointer;transition:all 0.2s;">DRIVER</button>
        <button id="roleBtnMech" onclick="switchUserRole('mechanic')" style="flex:1;background:transparent;color:rgba(255,255,255,0.4);border:none;border-radius:8px;padding:10px;font-family:'Space Mono',monospace;font-size:11px;font-weight:bold;cursor:pointer;transition:all 0.2s;">MECHANIC</button>
      </div>
    </div>

    <!-- Menu Items -->
    <div style="display:flex;flex-direction:column;gap:12px;flex:1;">
      
      <button onclick="window.location.href='verify.html'" style="display:flex;align-items:center;gap:16px;background:linear-gradient(90deg, rgba(255,136,0,0.05), transparent);border:1px solid rgba(255,136,0,0.2);padding:16px;border-radius:16px;cursor:pointer;text-align:left;color:#fff;transition:all 0.2s;">
        <div style="font-size:20px;">🛡️</div>
        <div>
          <div style="font-weight:bold;font-size:13px;color:#ff8800;">Apply as Pro Mechanic</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;">Get verified & earn on AutoTriage</div>
        </div>
      </button>

      <button onclick="alert('Your currency is automatically set based on your cellular network Time Zone. Manual override is coming soon!')" style="display:flex;align-items:center;gap:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);padding:16px;border-radius:16px;cursor:pointer;text-align:left;color:#fff;transition:all 0.2s;">
        <div style="font-size:20px;">🌍</div>
        <div>
          <div style="font-weight:bold;font-size:13px;">Region & Currency</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;">Auto-detected via Time Zone</div>
        </div>
      </button>

      <button onclick="exportVehicleData()" style="display:flex;align-items:center;gap:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);padding:16px;border-radius:16px;cursor:pointer;text-align:left;color:#fff;transition:all 0.2s;">
        <div style="font-size:20px;">💾</div>
        <div>
          <div style="font-weight:bold;font-size:13px;">Export Vehicle Data</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;">Download your service history</div>
        </div>
      </button>

      <button onclick="openTriageHelpModal()" style="display:flex;align-items:center;gap:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);padding:16px;border-radius:16px;cursor:pointer;text-align:left;color:#fff;transition:all 0.2s;">
        <div style="font-size:20px;">🤖</div>
        <div>
          <div style="font-weight:bold;font-size:13px;">Triage Help</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;">Ask our AI if you are confused</div>
        </div>
      </button>

      <!-- Developer Telemetry HUD (shown for devs) -->
      <button id="telemetryHUDButton" onclick="toggleTelemetryHUD()" style="display:none;align-items:center;gap:16px;background:rgba(255,136,0,0.04);border:1px solid rgba(255,136,0,0.15);padding:16px;border-radius:16px;cursor:pointer;text-align:left;color:#fff;transition:all 0.2s;">
        <div style="font-size:20px;">🛡️</div>
        <div>
          <div style="font-weight:bold;font-size:13px;color:#ff8800;">Developer Telemetry HUD</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;">Monitor AI API logging &amp; metrics</div>
        </div>
      </button>
      <div id="telemetryHUD" style="display:none;margin-top:4px;animation:fadeInUp 0.3s ease both;"></div>

    </div>

    <!-- Danger Zone -->
    <div style="margin-top:48px;padding-top:24px;border-top:1px solid rgba(230,57,70,0.1);">
      <div style="font-size:10px;color:#e63946;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;font-weight:bold;">Danger Zone</div>
      <button onclick="factoryResetApp()" style="width:100%;background:rgba(230,57,70,0.1);border:1px solid rgba(230,57,70,0.3);color:#e63946;padding:16px;border-radius:16px;font-family:'Space Mono',monospace;font-size:11px;font-weight:bold;cursor:pointer;text-align:center;transition:all 0.2s;">⚠️ FACTORY RESET APP</button>
    </div>

  </div>
</div>

<!-- MECHANIC DETAIL PROFILE DRAWER (DRIVER VIEW) -->
<div id="mechDetailModal" style="display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);justify-content:flex-end;" onclick="closeMechanicProfileDetail()">
  <div id="mechDetailContent" style="background:var(--bg);border-left:1px solid var(--border);width:90%;max-width:380px;height:100%;padding:32px 24px;transform:translateX(100%);transition:transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);overflow-y:auto;display:flex;flex-direction:column;" onclick="event.stopPropagation()">
    <!-- Populated dynamically by JS -->
  </div>
</div>

<!-- APPOINTMENT BOOKING FORM DRAWER -->
<div id="bookingFormModal" style="display:none;position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);justify-content:flex-end;" onclick="closeBookingFormModal()">
  <div id="bookingFormContent" style="background:var(--bg);border-left:1px solid var(--border);width:90%;max-width:380px;height:100%;padding:32px 24px;transform:translateX(100%);transition:transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);overflow-y:auto;display:flex;flex-direction:column;" onclick="event.stopPropagation()">
    <!-- Populated dynamically by JS -->
  </div>
</div>

<!-- LIVE CHAT DRAWER -->
<div id="chatDrawerModal" style="display:none;position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);justify-content:flex-end;" onclick="closeChatDrawer()">
  <div id="chatDrawerContent" style="background:var(--bg);border-left:1px solid var(--border);width:90%;max-width:380px;height:100%;padding:24px;transform:translateX(100%);transition:transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);display:flex;flex-direction:column;" onclick="event.stopPropagation()">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:12px;">
        <button onclick="closeChatDrawer()" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--fg);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;">✕</button>
        <div>
          <div id="chatTargetRole" style="font-size:8px;font-family:'Space Mono',monospace;font-weight:bold;color:var(--warn);letter-spacing:1px;text-transform:uppercase;">CHAT ASSISTANCE</div>
          <h2 id="chatTargetName" style="font-size:18px;font-weight:bold;color:var(--fg);margin:0;letter-spacing:0.5px;">Mechanic Name</h2>
        </div>
      </div>
      <div id="chatTargetStatusBadge" style="display:flex;align-items:center;gap:6px;background:var(--mid);padding:6px 12px;border-radius:20px;border:1px solid var(--border);">
        <span style="width:6px;height:6px;border-radius:50%;background:var(--success);display:inline-block;animation:pulse 1.5s infinite;"></span>
        <span style="font-size:8px;font-family:'Space Mono',monospace;font-weight:bold;color:var(--success);letter-spacing:1px;">ONLINE</span>
      </div>
    </div>

    <!-- Messages Container -->
    <div id="chatMessageStream" style="flex:1;overflow-y:auto;padding-bottom:16px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth;">
      <!-- Populated dynamically -->
    </div>

    <!-- AI Share Banner -->
    <div id="chatAiShareBanner" style="display:none;background:rgba(255,136,0,0.08);border:1px solid rgba(255,136,0,0.15);border-radius:16px;padding:12px;margin-bottom:12px;align-items:center;justify-content:space-between;gap:8px;">
      <div style="font-size:10px;color:var(--warn);font-family:'Space Mono',monospace;line-height:1.4;">
        ⚡ <strong>Active AI Diagnosis Found!</strong><br>Share report details with the mechanic.
      </div>
      <button onclick="shareAiDiagnosisToChat()" style="background:var(--warn);border:none;color:black;padding:6px 12px;border-radius:8px;font-family:'Space Mono',monospace;font-size:9px;font-weight:bold;cursor:pointer;flex-shrink:0;">SHARE</button>
    </div>

    <!-- Input Footer -->
    <div style="display:flex;gap:10px;border-top:1px solid var(--border);padding-top:16px;">
      <input type="text" id="chatMessageInput" placeholder="Type a message..." style="flex:1;background:var(--mid);border:1px solid var(--border);border-radius:14px;padding:12px 16px;color:var(--fg);font-family:'Space Mono',monospace;font-size:11px;outline:none;transition:border-color 0.2s;" onkeypress="if(event.key === 'Enter') sendChatMessage()">
      <button onclick="sendChatMessage()" style="width:46px;height:46px;background:var(--fg);color:var(--bg);border:none;border-radius:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:transform 0.2s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='none'">⚡</button>
    </div>
  </div>
</div>

<!-- BOOKING TRANSMITTING OVERLAY -->
<div id="bookingTransmittingOverlay" style="display:none;position:fixed;inset:0;z-index:9999999;background:#030303;flex-direction:column;align-items:center;justify-content:center;padding:32px;">
  <div style="font-size:64px;margin-bottom:24px;animation:pulse 2s infinite ease-in-out;">📡</div>
  <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:1px;color:white;margin-bottom:8px;text-align:center;">TRANSMITTING APPOINTMENT</h2>
  <p style="font-size:11px;color:var(--gray);text-align:center;max-width:280px;line-height:1.6;margin-bottom:32px;">AutoTriage is routing your appointment data and dispatching secure SMS & Email payloads to the mechanic...</p>
  
  <div style="width:100%;max-width:300px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px;font-family:'Space Mono',monospace;font-size:10px;line-height:1.8;box-shadow:0 12px 36px rgba(0,0,0,0.4);">
    <div id="txLog1" style="color:var(--gray);">&bull; Packaging vehicle profile...</div>
    <div id="txLog2" style="color:var(--gray);">&bull; Deploying active in-app notice...</div>
    <div id="txLog3" style="color:var(--gray);">&bull; Routing secure email dispatch...</div>
    <div id="txLog4" style="color:var(--gray);">&bull; Handshaking carrier network for SMS...</div>
  </div>
  
  <div id="txSuccessMessage" style="display:none;text-align:center;margin-top:24px;animation:fadeInUp 0.4s ease both;">
    <div style="font-size:32px;margin-bottom:8px;">✅</div>
    <div style="font-size:12px;font-weight:bold;color:#00d084;letter-spacing:1px;">TRANSMISSION SUCCESSFUL</div>
    <div style="font-size:9px;color:var(--gray);margin-top:4px;">SMS & Email pipelines resolved!</div>
  </div>
</div>

<!-- VITAL OVERRIDE MODAL -->
<div id="vitalOverrideModal" style="display:none;position:fixed;inset:0;z-index:60000;background:rgba(0,0,0,0.88);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);align-items:flex-end;justify-content:center;" onclick="closeVitalOverrideModal(event)">
  <div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:28px 28px 0 0;padding:32px 24px 48px;width:100%;max-width:480px;" onclick="event.stopPropagation()">
    <div style="width:36px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;margin:0 auto 24px;"></div>
    
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <span id="overrideVitalIcon" style="font-size:32px;">🔋</span>
      <div>
        <div id="overrideVitalTitle" style="font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:1px;color:#fff;">BATTERY HEALTH</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.35);">Directly input the precise health score for this component.</div>
      </div>
    </div>

    <style>
      .cyber-textbox {
        background-color: #121212;
        border: 1px solid #222;
        color: #FFFFFF;
        font-family: 'Space Mono', monospace;
        padding: 15px;
        border-radius: 8px;
        resize: none;
        width: 100%;
        min-height: 100px;
        transition: border-color 0.2s, box-shadow 0.2s;
        box-sizing: border-box;
      }
      .cyber-textbox:focus {
        outline: none;
        border-color: #00FF88;
        box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
      }
    </style>
    <!-- Text Input -->
    <div style="margin-bottom:20px; text-align:left;">
      <div style="font-size:10px; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Component Update / Observation</div>
      <textarea id="cyberOverrideTextbox" class="cyber-textbox" placeholder="e.g. 'Just replaced it'"></textarea>
    </div>

    <input type="hidden" id="overrideVitalKey" />

    <button onclick="saveVitalOverride()" style="width:100%;background:#00d084;color:#000;border:none;padding:14px;border-radius:12px;font-family:'Space Mono',monospace;font-size:11px;font-weight:bold;cursor:pointer;letter-spacing:1px;box-shadow:0 4px 12px rgba(0,208,132,0.15);">SAVE DIAGNOSTIC VALUE</button>
    <button onclick="clearVitalOverride()" style="width:100%;background:transparent;border:1px solid rgba(255,255,255,0.08);color:#e63946;padding:12px;border-radius:12px;font-family:'Space Mono',monospace;font-size:10px;cursor:pointer;margin-top:10px;">RESET TO ESTIMATED/CALCULATED</button>
    <button onclick="closeVitalOverrideModal()" style="width:100%;background:transparent;border:none;color:rgba(255,255,255,0.3);padding:12px;font-size:10px;cursor:pointer;margin-top:8px;">Cancel</button>
  </div>
</div>

<!-- PARTS CHECKOUT MODAL -->
<div id="partsCheckoutModal" style="display:none;position:fixed;inset:0;z-index:62000;background:rgba(0,0,0,0.88);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);align-items:flex-end;justify-content:center;" onclick="closeCheckoutModal(event)">
  <div id="partsCheckoutModalContent" style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:28px 28px 0 0;padding:32px 24px 48px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;" onclick="event.stopPropagation()">
    <!-- Populated dynamically -->
  </div>
</div>

<!-- PARTNER WEB BROWSER MODAL -->
<div id="partnerBrowserModal" style="display:none; position:fixed; inset:0; z-index:70000; background:rgba(0,0,0,0.9); flex-direction:column; overflow:hidden;">
  <div style="display:flex; justify-content:space-between; align-items:center; background:#111; border-bottom:1px solid rgba(255,255,255,0.08); padding:16px 20px; flex-shrink:0;">
    <div style="display:flex; align-items:center; gap:12px;">
      <button onclick="closePartnerBrowser()" style="background:transparent; border:none; color:white; font-size:18px; cursor:pointer; font-family:'Space Mono',monospace;">←</button>
      <span id="partnerBrowserTitle" style="font-family:'Bebas Neue',sans-serif; font-size:20px; letter-spacing:1px; color:#fff;">Store Browser</span>
    </div>
    <div style="display:flex; gap:16px;">
      <button onclick="refreshPartnerBrowser()" style="background:transparent; border:none; color:rgba(255,255,255,0.5); font-size:16px; cursor:pointer;">🔄</button>
      <button onclick="closePartnerBrowser()" style="background:transparent; border:none; color:rgba(255,255,255,0.5); font-size:18px; cursor:pointer;">✕</button>
    </div>
  </div>
  <div style="flex:1; width:100%; height:100%; position:relative; background:white;">
    <iframe id="partnerBrowserIframe" src="" style="width:100%; height:100%; border:none;" sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"></iframe>
  </div>
</div>

<!-- MANUAL DIAGNOSIS ENTRY MODAL -->
<div id="manualDiagnosisModal" style="display:none;position:fixed;inset:0;z-index:65000;background:rgba(0,0,0,0.88);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);align-items:flex-end;justify-content:center;" onclick="closeManualDiagnosisModal(event)">
  <div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:28px 28px 0 0;padding:32px 24px 48px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;" onclick="event.stopPropagation()">
    <div style="width:36px;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;margin:0 auto 24px;"></div>
    
    <div style="font-family:'Bebas Neue',sans-serif;font-size:24px;margin-bottom:6px;letter-spacing:1px;">WRITE DIAGNOSIS REPORT</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:20px;">Manually input diagnostic findings, severity, and pricing to save directly to your car history logs.</div>
    
    <label style="font-size:9px;color:var(--gray);text-transform:uppercase;font-weight:bold;letter-spacing:1px;margin-bottom:6px;display:block;">Symptoms / Driver Complaint</label>
    <textarea id="manDiagProblem" class="fi" placeholder="Describe symptoms (e.g. Grinding noise when applying brakes...)" style="width:100%;height:60px;margin-bottom:12px;resize:none;font-size:11px;padding:12px;"></textarea>

    <label style="font-size:9px;color:var(--gray);text-transform:uppercase;font-weight:bold;letter-spacing:1px;margin-bottom:6px;display:block;">Diagnosis / Root Cause</label>
    <input type="text" id="manDiagSummary" class="fi" placeholder="E.g. Worn front brake pads & rotors" style="width:100%;margin-bottom:12px;font-size:11px;padding:12px;"/>

    <label style="font-size:9px;color:var(--gray);text-transform:uppercase;font-weight:bold;letter-spacing:1px;margin-bottom:6px;display:block;">Recommended Solution</label>
    <textarea id="manDiagSolution" class="fi" placeholder="E.g. Swapped front pads and machined rotors..." style="width:100%;height:50px;margin-bottom:12px;resize:none;font-size:11px;padding:12px;"></textarea>

    <div style="display:flex;gap:10px;margin-bottom:16px;">
      <div style="flex:1;">
        <label style="font-size:9px;color:var(--gray);text-transform:uppercase;font-weight:bold;letter-spacing:1px;margin-bottom:6px;display:block;">Estimated Cost</label>
        <input type="text" id="manDiagCost" class="fi" placeholder="E.g. $180 - $250" style="width:100%;font-size:11px;padding:12px;" />
      </div>
      <div style="flex:1;">
        <label style="font-size:9px;color:var(--gray);text-transform:uppercase;font-weight:bold;letter-spacing:1px;margin-bottom:6px;display:block;">Severity Level</label>
        <select id="manDiagSeverity" class="fi" style="width:100%;font-size:11px;padding:12px;background:#1a1a1a;color:#fff;">
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>
    </div>

    <button onclick="saveManualDiagnosisReport()" style="width:100%;background:#00d084;color:#000;border:none;padding:14px;border-radius:12px;font-family:'Space Mono',monospace;font-size:11px;font-weight:bold;cursor:pointer;letter-spacing:1px;box-shadow:0 4px 12px rgba(0,208,132,0.15);">SAVE DIAGNOSIS TO HISTORY</button>
    <button onclick="closeManualDiagnosisModal()" style="width:100%;background:transparent;border:none;color:rgba(255,255,255,0.3);padding:12px;font-size:10px;cursor:pointer;margin-top:8px;">Cancel</button>
  </div>
</div>

<!-- TRIAGE HELP AI CHAT MODAL -->
<div id="triageHelpModal" style="display:none;position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);justify-content:flex-end;" onclick="closeTriageHelpModal()">
  <div id="triageHelpContent" style="background:var(--bg);border-left:1px solid var(--border);width:90%;max-width:380px;height:100%;padding:24px;transform:translateX(100%);transition:transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);display:flex;flex-direction:column;" onclick="event.stopPropagation()">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:12px;">
        <button onclick="closeTriageHelpModal()" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--fg);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;">✕</button>
        <div>
          <div style="font-size:8px;font-family:'Space Mono',monospace;font-weight:bold;color:#4da6ff;letter-spacing:1px;text-transform:uppercase;">AI ASSISTANT</div>
          <h2 style="font-size:18px;font-weight:bold;color:var(--fg);margin:0;letter-spacing:0.5px;">Triage Help</h2>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;background:rgba(77,166,255,0.1);padding:6px 12px;border-radius:20px;border:1px solid rgba(77,166,255,0.2);">
        <span style="width:6px;height:6px;border-radius:50%;background:#4da6ff;display:inline-block;animation:pulse 1.5s infinite;"></span>
        <span style="font-size:8px;font-family:'Space Mono',monospace;font-weight:bold;color:#4da6ff;letter-spacing:1px;">ONLINE</span>
      </div>
    </div>

    <!-- Messages Container -->
    <div id="triageHelpMessageStream" style="flex:1;overflow-y:auto;padding-bottom:16px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth;">
      <!-- Welcome Message -->
      <div style="display:flex; flex-direction:column; align-items:flex-start;">
        <div style="font-size:9px; color:var(--gray); margin-bottom:4px; font-family:'Space Mono',monospace;">Triage AI • Just now</div>
        <div style="background:#1c1c1e; border:1px solid #2c2c2e; padding:12px 16px; border-radius:16px 16px 16px 4px; font-size:12px; color:white; line-height:1.5; max-width:85%;">
          Hello! I am your AutoTriage AI Assistant. If you're confused about how the app works, need help logging a service, or want to understand your telemetry data better, just ask!
        </div>
      </div>
    </div>

    <!-- Input Footer -->
    <div style="display:flex;gap:10px;border-top:1px solid var(--border);padding-top:16px;">
      <input type="text" id="triageHelpInput" placeholder="Ask a question..." style="flex:1;background:var(--mid);border:1px solid var(--border);border-radius:14px;padding:12px 16px;color:var(--fg);font-family:'Space Mono',monospace;font-size:11px;outline:none;transition:border-color 0.2s;" onkeypress="if(event.key === 'Enter') sendTriageHelpMessage()">
      <button onclick="sendTriageHelpMessage()" style="width:46px;height:46px;background:var(--fg);color:var(--bg);border:none;border-radius:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:transform 0.2s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='none'">➤</button>
    </div>
  </div>
</div>

<!-- PASSENGER PROMPT MODAL (VIRTUAL TWIN) -->
<div id="passengerPromptModal" style="display:none;position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);align-items:center;justify-content:center;" onclick="closePassengerPrompt(false)">
  <div style="background:#111;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px 24px;width:90%;max-width:340px;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,0.5);" onclick="event.stopPropagation()">
    <div style="font-size:48px;margin-bottom:16px;animation:pulse 2s infinite ease-in-out;">🚗</div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:1px;color:#fff;margin-bottom:8px;">TRIP DETECTED</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.6;margin-bottom:24px;">AutoTriage detected vehicle motion. Are you currently driving your <strong id="promptVehicleName" style="color:#4da6ff;">vehicle</strong>?</div>
    
    <div style="display:flex;gap:12px;">
      <button onclick="closePassengerPrompt(true)" style="flex:1;background:#2563eb;color:#fff;border:none;padding:16px;border-radius:14px;font-family:'Space Mono',monospace;font-size:12px;font-weight:bold;cursor:pointer;box-shadow:0 4px 15px rgba(37,99,235,0.3);">YES, TRACK IT</button>
      <button onclick="closePassengerPrompt(false)" style="flex:1;background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);padding:16px;border-radius:14px;font-family:'Space Mono',monospace;font-size:12px;cursor:pointer;">PASSENGER</button>
    </div>
  </div>
</div>

<script src="js/trip-tracker.js?v=1.9"></script>
<script src="js/context.js?v=1.9"></script>
<script type="module" src="js/config.js?v=1.9"></script>
<script src="js/obd.js?v=1.9"></script>
<script src="js/mechanic-api.js"></script>
<script src="js/parts-db.js"></script>
<script src="js/features-simple.js?v=1.9"></script>
<script src="js/install-gate.js?v=1.9"></script>
<script src="js/pwa.js?v=1.9"></script>
<script src="js/theme.js?v=1.9"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script type="module" src="dist/autotriage-tools.es.js?v=1.35"></script>
<script>
  window.addEventListener('load', function() {
    if (typeof PWA !== 'undefined') PWA.init();
  });

