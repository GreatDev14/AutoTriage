const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// 1. Inject Drive Mode Button
const emBtnMatch = html.match(/<button class="main-btn emergency-btn"[^>]*>[\s\S]*?<\/button>/);
if (emBtnMatch) {
  const driveModeBtn = `
    <button class="main-btn drive-btn" onclick="goTo('drive-mode')" style="background: linear-gradient(145deg, rgba(45,190,96,0.15) 0%, rgba(45,190,96,0.02) 100%); border-color: rgba(45,190,96,0.3);">
      <div class="mb-icon-wrap" style="background: rgba(45,190,96,0.2); border-color: rgba(45,190,96,0.4); box-shadow: 0 0 20px rgba(45,190,96,0.3); color: #2DBE60;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="21.17" y1="8" x2="12" y2="8"></line><line x1="3.95" y1="6.06" x2="8.54" y2="14"></line><line x1="10.88" y1="21.94" x2="15.46" y2="14"></line></svg>
      </div>
      <div class="mb-bottom">
        <div class="mb-title" style="color: #2DBE60;">DRIVE MODE</div>
        <div class="mb-desc">Hands-free background crash & SOS monitor</div>
      </div>
    </button>
  `;
  html = html.replace(emBtnMatch[0], driveModeBtn + '\n' + emBtnMatch[0]);
}

// 2. Inject Drive Mode HTML Screen
const screenAnchor = html.indexOf('<!-- =====================\n     SCREEN: DIAGNOSE');
if (screenAnchor > -1) {
  const driveModeHTML = `
<!-- =====================
     SCREEN: DRIVE MODE
     ==================== -->
<div id="drive-mode" class="screen" style="background: #020202;">
  <div style="display: flex; flex-direction: column; height: 100vh; position: relative; overflow: hidden; padding: 24px;">
    
    <!-- Background Radar -->
    <div style="position: absolute; inset: 0; opacity: 0.1; background: conic-gradient(from 0deg at 50% 50%, transparent 270deg, #2DBE60 360deg); border-radius: 50%; animation: radarSweep 4s linear infinite; transform: scale(1.5);"></div>
    <div style="position: absolute; inset: 0; background: radial-gradient(circle, transparent 30%, #020202 70%); z-index: 1;"></div>
    
    <div style="position: relative; z-index: 5; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div style="font-family: 'Space Mono', monospace; font-size: 14px; color: #2DBE60; letter-spacing: 4px; margin-bottom: 20px; text-shadow: 0 0 10px rgba(45,190,96,0.5);">DRIVE MODE ACTIVE</div>
      
      <!-- Speedometer -->
      <div style="width: 240px; height: 240px; border-radius: 50%; border: 2px dashed rgba(45,190,96,0.3); display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
        <div style="position: absolute; inset: 10px; border: 4px solid rgba(45,190,96,0.1); border-top-color: #2DBE60; border-radius: 50%; animation: spinSlow 3s linear infinite;"></div>
        <div id="driveSpeed" style="font-family: 'Bebas Neue', sans-serif; font-size: 80px; color: white; line-height: 1; text-shadow: 0 0 20px rgba(255,255,255,0.5);">0</div>
        <div style="font-family: 'Space Mono', monospace; font-size: 14px; color: rgba(255,255,255,0.5);">KM/H</div>
      </div>

      <!-- Microphone Status -->
      <div style="margin-top: 40px; display: flex; flex-direction: column; align-items: center; gap: 12px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(230,57,70,0.2); border: 1px solid rgba(230,57,70,0.5); display: flex; align-items: center; justify-content: center; animation: pulse 1s infinite; box-shadow: 0 0 20px rgba(230,57,70,0.4);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
        </div>
        <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #E63946; letter-spacing: 1px; text-transform: uppercase;">Microphone Armed</div>
        <div style="font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.4); text-align: center; max-width: 200px;">Shout "HELP" to trigger SOS. Screen will not sleep.</div>
      </div>
    </div>

    <!-- Exit Button -->
    <button onclick="endDriveMode()" style="position: relative; z-index: 5; background: #E63946; color: white; border: none; padding: 20px; border-radius: 16px; font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 2px; width: 100%; box-shadow: 0 10px 30px rgba(230,57,70,0.3);">END DRIVE</button>

  </div>
</div>
`;
  html = html.substring(0, screenAnchor) + driveModeHTML + '\n' + html.substring(screenAnchor);
}

// 3. Inject Javascript logic
const driveModeScript = `
<script>
  let wakeLock = null;
  let driveGeoWatch = null;

  async function startDriveMode() {
    // 1. Request WakeLock to keep screen on
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock is active!');
      }
    } catch (err) {
      console.warn('Wake Lock error:', err);
    }

    // 2. Start tracking GPS Speed
    if (navigator.geolocation) {
      driveGeoWatch = navigator.geolocation.watchPosition((pos) => {
        const speedMps = pos.coords.speed; // meters per second
        if (speedMps !== null && speedMps >= 0) {
          const speedKph = Math.round(speedMps * 3.6);
          const speedEl = document.getElementById('driveSpeed');
          if (speedEl) speedEl.innerText = speedKph;
        }
      }, (err) => {
        console.warn('GPS Speed error:', err);
      }, { enableHighAccuracy: true });
    }

    // 3. Force start the microphone
    if (typeof toggleVoiceSOS === 'function') {
      toggleVoiceSOS(true);
    }
  }

  function endDriveMode() {
    // Release Wake Lock
    if (wakeLock !== null) {
      wakeLock.release().then(() => { wakeLock = null; });
    }
    // Stop GPS tracking
    if (driveGeoWatch !== null) {
      navigator.geolocation.clearWatch(driveGeoWatch);
      driveGeoWatch = null;
    }
    // Stop microphone
    if (typeof toggleVoiceSOS === 'function' && typeof voiceSosActive !== 'undefined' && voiceSosActive) {
      toggleVoiceSOS(); // toggles it off
    }
    
    // Reset Speed
    const speedEl = document.getElementById('driveSpeed');
    if (speedEl) speedEl.innerText = '0';

    // Go back home
    goTo('home');
  }

  // Hook into navigation to start Drive Mode automatically
  const originalGoToDrive = window.goTo;
  if(originalGoToDrive) {
    window.goTo = function(screen) {
      originalGoToDrive(screen);
      if (screen === 'drive-mode') {
        setTimeout(() => startDriveMode(), 500);
      } else if (document.getElementById('drive-mode').classList.contains('active')) {
        // If navigating away without clicking End Drive, still clean up
        endDriveMode();
      }
    };
  }
</script>
`;

html = html.replace(/<\/body>/i, driveModeScript + '\n</body>');

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Drive Mode injected successfully!');
