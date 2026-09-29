const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// The Emerald Prestige V5 Splash Screen HTML
const newSplashHTML = `
<!-- EMERALD PRESTIGE SPLASH SCREEN V5 (3 SECONDS) -->
<div id="premiumSplashScreen" style="position: fixed; inset: 0; z-index: 999999; background: radial-gradient(circle at 50% 50%, #0a1510 0%, #020503 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; transition: opacity 0.8s ease-in-out, transform 0.8s ease-in-out;">
  
  <!-- Subtle Green Bokeh Particles -->
  <div style="position: absolute; width: 300px; height: 300px; background: rgba(45, 190, 96, 0.05); filter: blur(50px); border-radius: 50%; top: -100px; left: -100px; animation: floatParticle 8s ease-in-out infinite alternate;"></div>
  <div style="position: absolute; width: 400px; height: 400px; background: rgba(45, 190, 96, 0.03); filter: blur(60px); border-radius: 50%; bottom: -150px; right: -100px; animation: floatParticle 10s ease-in-out infinite alternate-reverse;"></div>

  <!-- Elegant Green Shield Logo -->
  <div style="margin-bottom: 24px; animation: slowReveal 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0;">
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#2DBE60" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 15px rgba(45,190,96,0.5));">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
  </div>

  <!-- Brand Typography -->
  <div style="font-family: 'Bebas Neue', sans-serif; font-size: 54px; color: white; letter-spacing: 14px; margin-left: 14px; text-shadow: 0 10px 30px rgba(0,0,0,0.8); animation: slowReveal 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s forwards; opacity: 0;">
    AUTOTRIAGE
  </div>
  
  <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 12px; letter-spacing: 8px; margin-left: 8px; animation: slowReveal 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s forwards; opacity: 0;">
    DIAGNOSTIC ENGINE
  </div>

  <!-- Neon Green Loading Line -->
  <div style="width: 180px; height: 3px; background: rgba(255,255,255,0.08); border-radius: 3px; margin-top: 50px; overflow: hidden; position: relative; animation: slowReveal 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.45s forwards; opacity: 0;">
    <div id="splashProgressBar" style="height: 100%; width: 0%; background: #2DBE60; box-shadow: 0 0 12px #2DBE60; transition: width 0.05s linear;"></div>
  </div>

  <style>
    @keyframes slowReveal {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes floatParticle {
      0% { transform: translate(0, 0); }
      100% { transform: translate(40px, 50px); }
    }
  </style>
</div>

<script>
  window.addEventListener('load', () => {
    const splash = document.getElementById('premiumSplashScreen');
    const bar = document.getElementById('splashProgressBar');
    
    if(!splash || !bar) return;

    let progress = 0;
    const intervalMs = 30;
    const duration = 3000; // Exactly 3 seconds
    const increment = 100 / (duration / intervalMs); 
    
    const bootInterval = setInterval(() => {
      progress += increment;
      if (progress > 100) progress = 100;
      
      bar.style.width = progress + '%';
      
      // When the 3 seconds is up
      if (progress >= 100) {
        clearInterval(bootInterval);
        setTimeout(() => {
          splash.style.opacity = '0';
          splash.style.transform = 'scale(1.05)'; // Elegant push-back effect
          splash.style.pointerEvents = 'none';
          setTimeout(() => splash.remove(), 800);
        }, 150); // Tiny pause at 100% before fading
      }
    }, intervalMs);
  });
</script>
`;

// Safely remove the old Minimalist V4 Splash Screen
html = html.replace(/<!-- ELEGANT MINIMALIST SPLASH SCREEN V4[\s\S]*?<\/script>/, '');

// Inject the beautiful Emerald splash screen
html = html.replace(/(<body[^>]*>)/i, `$1\n${newSplashHTML}`);

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Emerald Prestige Splash Screen V5 injected successfully!');
