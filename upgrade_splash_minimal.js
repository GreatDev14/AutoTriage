const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// The Elegant Minimalist V4 Splash Screen HTML
const newSplashHTML = `
<!-- ELEGANT MINIMALIST SPLASH SCREEN V4 (3 SECONDS) -->
<div id="premiumSplashScreen" style="position: fixed; inset: 0; z-index: 999999; background: radial-gradient(circle at 50% 40%, #1a1a1c 0%, #050505 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; transition: opacity 0.8s ease-in-out, transform 0.8s ease-in-out;">
  
  <style>
    @keyframes slowReveal {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  </style>

  <!-- Elegant Brand Typography -->
  <div style="font-family: 'Bebas Neue', sans-serif; font-size: 52px; color: white; letter-spacing: 14px; margin-left: 14px; text-shadow: 0 10px 30px rgba(0,0,0,0.8); animation: slowReveal 1s ease-out forwards;">
    AUTOTRIAGE
  </div>
  
  <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #888; margin-top: 12px; letter-spacing: 8px; margin-left: 8px; animation: slowReveal 1s ease-out 0.2s forwards; opacity: 0;">
    DIAGNOSTIC ENGINE
  </div>

  <!-- Ultra-Thin Elegant Loading Line -->
  <div style="width: 160px; height: 2px; background: rgba(255,255,255,0.06); border-radius: 2px; margin-top: 50px; overflow: hidden; position: relative; animation: slowReveal 1s ease-out 0.4s forwards; opacity: 0;">
    <div id="splashProgressBar" style="height: 100%; width: 0%; background: #E63946; box-shadow: 0 0 8px rgba(230,57,70,0.6); transition: width 0.05s linear;"></div>
  </div>

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
          splash.style.transform = 'scale(1.04)'; // Extremely subtle, luxurious push-back effect
          splash.style.pointerEvents = 'none';
          setTimeout(() => splash.remove(), 800);
        }, 150); // Tiny pause before fading
      }
    }, intervalMs);
  });
</script>
`;

// Safely remove the old V3 Splash Screen
html = html.replace(/<!-- CYBERNETIC SPLASH SCREEN V3[\s\S]*?<\/script>/, '');

// Inject the beautiful minimalist splash screen
html = html.replace(/(<body[^>]*>)/i, `$1\n${newSplashHTML}`);

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Elegant Minimalist Splash Screen V4 injected successfully!');
