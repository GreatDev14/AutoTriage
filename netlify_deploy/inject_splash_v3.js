const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// The Ultimate V3 Splash Screen HTML (3 Seconds, Hyper-Premium)
const newSplashHTML = `
<!-- CYBERNETIC SPLASH SCREEN V3 (3 SECONDS) -->
<div id="premiumSplashScreen" style="position: fixed; inset: 0; z-index: 999999; background: #020202; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; transition: opacity 0.8s cubic-bezier(0.8, 0, 0.2, 1), transform 0.8s cubic-bezier(0.8, 0, 0.2, 1);">
  
  <!-- Sweeping Radar Background -->
  <div style="position: absolute; inset: 0; opacity: 0.2; background: conic-gradient(from 0deg at 50% 50%, transparent 270deg, rgba(230, 57, 70, 0.8) 360deg); border-radius: 50%; animation: radarSweep 3s linear infinite; transform: scale(2);"></div>
  <div style="position: absolute; inset: 0; background: radial-gradient(circle, transparent 30%, #020202 70%); z-index: 1;"></div>
  <div style="position: absolute; inset: 0; opacity: 0.05; background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px); z-index: 1;"></div>

  <!-- Frosted Glass Core -->
  <div style="position: relative; z-index: 3; background: rgba(20, 20, 22, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); border-top: 1px solid rgba(230, 57, 70, 0.3); border-bottom: 1px solid rgba(230, 57, 70, 0.3); border-radius: 30px; padding: 50px 40px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(230, 57, 70, 0.05);">
    
    <!-- Floating Hexagon Logo -->
    <div style="position: relative; width: 100px; height: 100px; display: flex; justify-content: center; align-items: center; margin-bottom: 20px;">
      <svg width="100" height="100" viewBox="0 0 100 100" style="position: absolute; animation: spinReverse 10s linear infinite;">
        <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="rgba(230, 57, 70, 0.2)" stroke-width="2"/>
        <polygon points="50,15 85,32 85,68 50,85 15,68 15,32" fill="none" stroke="rgba(230, 57, 70, 0.5)" stroke-width="1" stroke-dasharray="5 5"/>
      </svg>
      <div style="position: absolute; width: 60px; height: 60px; background: rgba(230, 57, 70, 0.15); filter: blur(15px); border-radius: 50%; animation: pulse 1s infinite;"></div>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="z-index: 2; filter: drop-shadow(0 0 8px rgba(255,255,255,0.8));">
        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
        <path d="M2 17l10 5 10-5"></path>
        <path d="M2 12l10 5 10-5"></path>
      </svg>
    </div>

    <!-- Brand Typography -->
    <div style="font-family: 'Bebas Neue', sans-serif; font-size: 50px; color: white; letter-spacing: 10px; text-shadow: 0 0 20px rgba(255,255,255,0.2); margin-left: 10px;">AUTOTRIAGE</div>
    
    <!-- Live Percentage Counter -->
    <div style="display: flex; align-items: baseline; margin-top: 10px;">
      <span id="splashPercent" style="font-family: 'Space Mono', monospace; font-size: 32px; font-weight: bold; color: #E63946; text-shadow: 0 0 15px rgba(230,57,70,0.6);">0</span>
      <span style="font-family: 'Space Mono', monospace; font-size: 16px; color: #E63946; margin-left: 4px;">%</span>
    </div>

    <!-- Segmented Loading Bar -->
    <div style="width: 240px; height: 6px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; margin-top: 20px; overflow: hidden; position: relative;">
      <div id="splashProgressBar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #E63946, #ff6b6b); box-shadow: 0 0 15px #E63946; border-radius: 8px; transition: width 0.05s linear;"></div>
    </div>

    <!-- Hacker Terminal Text -->
    <div id="splashTerminalText" style="font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 24px; letter-spacing: 2px; text-transform: uppercase; height: 16px;">ESTABLISHING SECURE UPLINK...</div>
  </div>

  <style>
    @keyframes radarSweep { 100% { transform: scale(2) rotate(360deg); } }
    @keyframes spinReverse { 100% { transform: rotate(-360deg); } }
  </style>
</div>

<script>
  window.addEventListener('load', () => {
    const splash = document.getElementById('premiumSplashScreen');
    const bar = document.getElementById('splashProgressBar');
    const term = document.getElementById('splashTerminalText');
    const percentCounter = document.getElementById('splashPercent');
    
    if(!splash || !bar || !term || !percentCounter) return;

    const bootSequence = [
      "ESTABLISHING SECURE UPLINK...",
      "CALIBRATING NEURAL ENGINE...",
      "BYPASSING ENCRYPTION...",
      "LOADING OBD2 DIAGNOSTICS...",
      "CONNECTING TO MECHANIC GRID...",
      "SYSTEM OVERRIDE COMPLETE."
    ];

    let progress = 0;
    let sequenceIndex = 0;
    
    // 3 Seconds duration = 3000ms. 
    // Interval of 30ms means 100 steps. Progress goes up by 1 each step.
    const intervalMs = 30;
    const increment = 100 / (3000 / intervalMs); 
    
    const bootInterval = setInterval(() => {
      progress += increment;
      if (progress > 100) progress = 100;
      
      const roundedProgress = Math.floor(progress);
      bar.style.width = roundedProgress + '%';
      percentCounter.innerText = roundedProgress;
      
      // Update text 6 times across the 100%
      const threshold = (sequenceIndex + 1) * (100 / bootSequence.length);
      if (progress >= threshold && sequenceIndex < bootSequence.length) {
        term.innerText = bootSequence[sequenceIndex];
        
        // Final text turns green
        if (sequenceIndex === bootSequence.length - 1) {
          term.style.color = "#2DBE60";
          term.style.textShadow = "0 0 10px rgba(45,190,96,0.5)";
          percentCounter.style.color = "#2DBE60";
          percentCounter.style.textShadow = "0 0 15px rgba(45,190,96,0.6)";
          bar.style.background = "linear-gradient(90deg, #2DBE60, #4dff8a)";
          bar.style.boxShadow = "0 0 15px #2DBE60";
        }
        sequenceIndex++;
      }

      // Finish at 3 seconds
      if (progress >= 100) {
        clearInterval(bootInterval);
        setTimeout(() => {
          splash.style.opacity = '0';
          splash.style.transform = 'scale(1.15)'; // Massive cinematic zoom out
          splash.style.pointerEvents = 'none';
          setTimeout(() => splash.remove(), 800);
        }, 150);
      }
    }, intervalMs);
  });
</script>
`;

// Remove the old V2 Splash Screen
html = html.replace(/<!-- ULTIMATE SPLASH SCREEN V2 -->[\s\S]*?<\/script>/, '');

// Inject the V3 Cybernetic Splash Screen
html = html.replace(/(<body[^>]*>)/i, `$1\n${newSplashHTML}`);

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Cybernetic Splash Screen V3 injected successfully!');
