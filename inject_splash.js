const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

const splashScreenHTML = `
<!-- PREMIUM SPLASH SCREEN -->
<div id="premiumSplashScreen" style="position: fixed; inset: 0; z-index: 999999; background: radial-gradient(circle at center, #1a1a1c 0%, #050505 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);">
  <div style="position: relative; display: flex; justify-content: center; align-items: center;">
    <div style="position: absolute; width: 120px; height: 120px; background: rgba(230, 57, 70, 0.2); filter: blur(30px); border-radius: 50%; animation: pulse 2s infinite;"></div>
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#E63946" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="z-index: 2; margin-bottom: 20px;">
      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
      <path d="M2 17l10 5 10-5"></path>
      <path d="M2 12l10 5 10-5"></path>
    </svg>
  </div>
  <div style="font-family: 'Bebas Neue', sans-serif; font-size: 42px; color: white; letter-spacing: 8px; text-shadow: 0 0 20px rgba(255,255,255,0.1); z-index: 2; margin-left: 8px;">AUTOTRIAGE</div>
  <div style="font-family: 'Space Mono', monospace; font-size: 10px; color: #E63946; margin-top: 12px; letter-spacing: 4px; z-index: 2; opacity: 0.8;">INITIALIZING ENGINE...</div>
</div>
<script>
  // Splash Screen Logic: Wait 2 seconds, then fade out and remove
  window.addEventListener('load', () => {
    setTimeout(() => {
      const splash = document.getElementById('premiumSplashScreen');
      if(splash) {
        splash.style.opacity = '0';
        splash.style.transform = 'scale(1.05)'; // slight zoom out effect
        setTimeout(() => splash.remove(), 600); // wait for CSS transition to finish before removing from DOM
      }
    }, 2000);
  });
</script>
`;

// Inject right after the body tag opens
html = html.replace(/(<body[^>]*>)/i, `$1\n${splashScreenHTML}`);

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Premium Splash Screen injected successfully!');
