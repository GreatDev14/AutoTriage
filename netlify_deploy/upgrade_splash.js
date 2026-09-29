const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// The new V2 Ultimate Splash Screen HTML
const newSplashHTML = `
<!-- ULTIMATE SPLASH SCREEN V2 -->
<div id="premiumSplashScreen" style="position: fixed; inset: 0; z-index: 999999; background: #050505; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);">
  
  <!-- Animated Tech Grid Background -->
  <div style="position: absolute; inset: 0; opacity: 0.15; background-image: linear-gradient(rgba(230, 57, 70, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(230, 57, 70, 0.5) 1px, transparent 1px); background-size: 30px 30px; transform: perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px); animation: gridMove 10s linear infinite;"></div>
  
  <!-- Center Hologram Graphic -->
  <div style="position: relative; width: 160px; height: 160px; display: flex; justify-content: center; align-items: center; margin-bottom: 30px; z-index: 2;">
    <!-- Outer Ring -->
    <div style="position: absolute; inset: 0; border: 2px dashed rgba(230, 57, 70, 0.4); border-radius: 50%; animation: spinSlow 8s linear infinite;"></div>
    <!-- Middle Ring -->
    <div style="position: absolute; inset: 10px; border: 2px solid rgba(230, 57, 70, 0.1); border-top: 2px solid #E63946; border-bottom: 2px solid #E63946; border-radius: 50%; animation: spinFast 3s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;"></div>
    <!-- Inner Core Glow -->
    <div style="position: absolute; width: 80px; height: 80px; background: rgba(230, 57, 70, 0.2); filter: blur(20px); border-radius: 50%; animation: pulse 2s infinite;"></div>
    <!-- Car Engine Icon -->
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="z-index: 3;">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
  </div>

  <!-- Brand Typography -->
  <div style="font-family: 'Bebas Neue', sans-serif; font-size: 56px; color: white; letter-spacing: 12px; text-shadow: 0 0 30px rgba(230,57,70,0.8); z-index: 2; margin-left: 12px;">AUTOTRIAGE</div>
  
  <!-- Loading Bar Container -->
  <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 40px; overflow: hidden; z-index: 2; position: relative; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
    <div id="splashProgressBar" style="height: 100%; width: 0%; background: #E63946; box-shadow: 0 0 10px #E63946; transition: width 0.1s linear;"></div>
  </div>

  <!-- Terminal Output Text -->
  <div id="splashTerminalText" style="font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 16px; letter-spacing: 2px; z-index: 2; text-transform: uppercase;">BOOTING SYSTEM CORE...</div>

  <!-- Keyframes for this specific screen -->
  <style>
    @keyframes spinSlow { 100% { transform: rotate(360deg); } }
    @keyframes spinFast { 100% { transform: rotate(-360deg); } }
    @keyframes gridMove { 100% { transform: perspective(500px) rotateX(60deg) translateY(0px) translateZ(-200px); } }
  </style>
</div>

<script>
  window.addEventListener('load', () => {
    const splash = document.getElementById('premiumSplashScreen');
    const bar = document.getElementById('splashProgressBar');
    const term = document.getElementById('splashTerminalText');
    
    if(!splash || !bar || !term) return;

    // The rapid terminal text sequence
    const bootSequence = [
      "CALIBRATING GPS SENSORS...",
      "CONNECTING TO SATELLITES...",
      "LOADING MECHANIC REGISTRY...",
      "INITIALIZING OBD2 PROTOCOLS...",
      "SYSTEM READY."
    ];

    let progress = 0;
    let sequenceIndex = 0;
    
    // Animate progress bar and terminal text over exactly 2 seconds
    const bootInterval = setInterval(() => {
      progress += 2; // Increases by 2% every 40ms = 100% in 2000ms
      if (progress > 100) progress = 100;
      bar.style.width = progress + '%';
      
      // Change text every 20%
      if (progress % 20 === 0 && sequenceIndex < bootSequence.length) {
        term.innerText = bootSequence[sequenceIndex];
        term.style.color = sequenceIndex === bootSequence.length - 1 ? "#2DBE60" : "rgba(255,255,255,0.5)"; // Turn green at the end
        sequenceIndex++;
      }

      if (progress >= 100) {
        clearInterval(bootInterval);
        setTimeout(() => {
          splash.style.opacity = '0';
          splash.style.transform = 'scale(1.1)'; // Cinematic zoom out
          splash.style.pointerEvents = 'none';
          setTimeout(() => splash.remove(), 800);
        }, 200); // Tiny pause at 100% before fading
      }
    }, 40);
  });
</script>
`;

// First, safely remove the old splash screen logic I injected earlier
html = html.replace(/<!-- PREMIUM SPLASH SCREEN -->[\s\S]*?<\/script>/, '');

// Now inject the Ultimate Splash Screen right after the body tag opens
html = html.replace(/(<body[^>]*>)/i, `$1\n${newSplashHTML}`);

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Ultimate Splash Screen V2 injected successfully!');
