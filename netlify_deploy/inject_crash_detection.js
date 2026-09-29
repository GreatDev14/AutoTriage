const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

const dmStart = html.indexOf('<div id="drive-mode" class="screen"');
const nextScreen = html.indexOf('<!-- =====================', dmStart + 100);

if (dmStart > -1 && nextScreen > -1) {
  // We found the Drive Mode HTML to replace.
  const oldDriveModeHTML = html.substring(dmStart, nextScreen);
  
  const newDriveModeHTML = `
<div id="drive-mode" class="screen" style="background: #020202;">
  <div style="display: flex; flex-direction: column; height: 100vh; position: relative; overflow: hidden; padding: 24px;">
    
    <!-- Background Radar -->
    <div style="position: absolute; inset: 0; opacity: 0.1; background: conic-gradient(from 0deg at 50% 50%, transparent 270deg, #2DBE60 360deg); border-radius: 50%; animation: radarSweep 4s linear infinite; transform: scale(1.5);"></div>
    <div style="position: absolute; inset: 0; background: radial-gradient(circle, transparent 30%, #020202 70%); z-index: 1;"></div>
    
    <div style="position: relative; z-index: 5; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div style="font-family: 'Space Mono', monospace; font-size: 14px; color: #2DBE60; letter-spacing: 4px; margin-bottom: 20px; text-shadow: 0 0 10px rgba(45,190,96,0.5);">DRIVE MODE ACTIVE</div>
      
      <!-- Speedometer -->
      <div style="width: 240px; height: 240px; border-radius: 50%; border: 2px dashed rgba(45,190,96,0.3); display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; box-shadow: inset 0 0 40px rgba(45,190,96,0.05);">
        <div style="position: absolute; inset: 10px; border: 4px solid rgba(45,190,96,0.1); border-top-color: #2DBE60; border-radius: 50%; animation: spinSlow 3s linear infinite;"></div>
        <div id="driveSpeed" style="font-family: 'Bebas Neue', sans-serif; font-size: 80px; color: white; line-height: 1; text-shadow: 0 0 20px rgba(255,255,255,0.5);">0</div>
        <div style="font-family: 'Space Mono', monospace; font-size: 14px; color: rgba(255,255,255,0.5);">KM/H</div>
      </div>

      <!-- Trip Metrics -->
      <div style="display: flex; gap: 24px; margin-top: 30px; width: 100%; max-width: 280px;">
        <div style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; text-align: center;">
          <div style="font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase;">Duration</div>
          <div id="driveTimer" style="font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: white; margin-top: 4px; letter-spacing: 2px;">00:00:00</div>
        </div>
        <div style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; text-align: center;">
          <div style="font-family: 'Space Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase;">Distance</div>
          <div style="font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: white; margin-top: 4px; letter-spacing: 2px;"><span id="driveDist">0.0</span> <span style="font-size:14px; color:rgba(255,255,255,0.5)">KM</span></div>
        </div>
      </div>

      <!-- Safety Systems Armed Indicator -->
      <div style="margin-top: 30px; background: rgba(45,190,96,0.1); border: 1px solid rgba(45,190,96,0.3); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 280px;">
        <div style="display: flex; gap: 20px; align-items: center;">
          <!-- Mic Status -->
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2DBE60" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
             <div style="font-family: 'Space Mono', monospace; font-size: 9px; color: #2DBE60;">VOICE SOS</div>
          </div>
          <div style="width: 1px; height: 24px; background: rgba(255,255,255,0.1);"></div>
          <!-- G-Force Crash Status -->
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;" id="gForceStatusWrap">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2DBE60" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
             <div style="font-family: 'Space Mono', monospace; font-size: 9px; color: #2DBE60;">AUTO-CRASH</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Exit Button -->
    <button onclick="endDriveMode()" style="position: relative; z-index: 5; background: #E63946; color: white; border: none; padding: 20px; border-radius: 16px; font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 2px; width: 100%; box-shadow: 0 10px 30px rgba(230,57,70,0.3);">END DRIVE</button>

  </div>
</div>

<!-- AUTO-CRASH OVERLAY -->
<div id="crashSosOverlay" style="position: fixed; inset: 0; z-index: 9999999; background: rgba(230,57,70,0.95); backdrop-filter: blur(20px); display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px;">
  <div style="width: 80px; height: 80px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; animation: pulse 0.5s infinite alternate;">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E63946" stroke-width="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
  </div>
  <div style="font-family: 'Bebas Neue', sans-serif; font-size: 70px; color: white; letter-spacing: 2px; line-height: 1; margin-bottom: 10px;">IMPACT DETECTED!</div>
  <div style="font-family: 'Space Mono', monospace; font-size: 14px; color: white; line-height: 1.6; max-width: 280px; margin-bottom: 30px;">A massive G-Force spike was detected. If you are safe, press Cancel.</div>
  
  <div style="font-family: 'Bebas Neue', sans-serif; font-size: 100px; color: white; line-height: 1; margin-bottom: 40px; text-shadow: 0 0 30px rgba(255,255,255,0.8);" id="crashCountdown">10</div>

  <button onclick="cancelCrashSOS()" style="background: white; color: #E63946; border: none; padding: 20px 40px; border-radius: 16px; font-family: 'Bebas Neue', sans-serif; font-size: 32px; letter-spacing: 2px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">CANCEL SOS</button>
</div>
`;
  
  html = html.replace(oldDriveModeHTML, newDriveModeHTML);
}

// 2. Remove old drive mode script and inject the new one
const scriptStart = html.indexOf('let wakeLock = null;');
const scriptEnd = html.indexOf('// Hook into navigation to start Drive Mode automatically', scriptStart);

if (scriptStart > -1) {
  // Find the exact <script> tags to safely replace
  const sOpen = html.lastIndexOf('<script>', scriptStart);
  const sClose = html.indexOf('</script>', scriptEnd) + 9;
  
  const oldScriptBlock = html.substring(sOpen, sClose);
  
  const newScriptBlock = `
<script>
  let wakeLock = null;
  let driveGeoWatch = null;
  let driveInterval = null;
  let driveSeconds = 0;
  let totalDistanceKm = 0;
  let lastLat = null;
  let lastLng = null;
  
  let motionListener = null;
  let crashCountdownInterval = null;
  let crashActive = false;
  let crashTimeLeft = 10;

  // Haversine formula for distance
  function calcDist(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function formatTime(s) {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return \`\${hrs.toString().padStart(2,'0')}:\${mins.toString().padStart(2,'0')}:\${secs.toString().padStart(2,'0')}\`;
  }

  function handleMotion(event) {
    if (crashActive) return; // already counting down

    // Accelerometer gives m/s^2. 
    // We check absolute acceleration. 
    // Typical crash is > 30 m/s^2. We set threshold at 25 for testing/sensitivity.
    const acc = event.acceleration || event.accelerationIncludingGravity;
    if (!acc) return; // unsupported device

    const ax = acc.x || 0;
    const ay = acc.y || 0;
    const az = acc.z || 0;
    
    // If using IncludingGravity, subtract 9.8 roughly, but calculating total vector magnitude is better
    const mag = Math.sqrt(ax*ax + ay*ay + az*az);
    
    // If using acceleration (excluding gravity), mag > 25 is a massive hit.
    // If using accelerationIncludingGravity, resting is ~9.8. A spike to 35+ is a massive hit.
    // Let's use 25 as a baseline spike threshold for the vector magnitude.
    if (mag > 30) {
      console.error("G-FORCE SPIKE DETECTED! Mag:", mag);
      triggerCrashSequence();
    }
  }

  function triggerCrashSequence() {
    crashActive = true;
    crashTimeLeft = 10;
    document.getElementById('crashCountdown').innerText = crashTimeLeft;
    document.getElementById('crashSosOverlay').style.display = 'flex';
    
    // Attempt to vibrate if supported
    if(navigator.vibrate) navigator.vibrate([500, 500, 500, 500]);

    crashCountdownInterval = setInterval(() => {
      crashTimeLeft--;
      document.getElementById('crashCountdown').innerText = crashTimeLeft;
      
      if (crashTimeLeft <= 0) {
        clearInterval(crashCountdownInterval);
        // Execute SOS!
        window.location.href = 'tel:112';
        setTimeout(() => {
          const body = encodeURIComponent("EMERGENCY! I have been in a vehicle crash at: " + (userAddr || userCity || "Unknown Location"));
          window.location.href = 'sms:112?body=' + body;
        }, 1500);
      }
    }, 1000);
  }

  function cancelCrashSOS() {
    crashActive = false;
    clearInterval(crashCountdownInterval);
    document.getElementById('crashSosOverlay').style.display = 'none';
  }

  async function requestMotionPermission() {
    // iOS 13+ requires explicit permission
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const p = await DeviceMotionEvent.requestPermission();
        if (p === 'granted') {
          window.addEventListener('devicemotion', handleMotion, true);
        } else {
          document.getElementById('gForceStatusWrap').style.opacity = '0.3';
        }
      } catch (e) {
        console.warn(e);
      }
    } else {
      // Non-iOS or older iOS
      window.addEventListener('devicemotion', handleMotion, true);
    }
  }

  async function startDriveMode() {
    // 1. WakeLock
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch (err) {}

    // 2. Setup Motion Sensors (Auto-Crash)
    requestMotionPermission();

    // 3. Reset Metrics & Start Timer
    driveSeconds = 0;
    totalDistanceKm = 0;
    lastLat = null;
    lastLng = null;
    document.getElementById('driveTimer').innerText = '00:00:00';
    document.getElementById('driveDist').innerText = '0.0';
    document.getElementById('driveSpeed').innerText = '0';
    
    driveInterval = setInterval(() => {
      driveSeconds++;
      document.getElementById('driveTimer').innerText = formatTime(driveSeconds);
    }, 1000);

    // 4. Start tracking GPS Speed & Distance
    if (navigator.geolocation) {
      driveGeoWatch = navigator.geolocation.watchPosition((pos) => {
        const speedMps = pos.coords.speed;
        if (speedMps !== null && speedMps >= 0) {
          const speedKph = Math.round(speedMps * 3.6);
          document.getElementById('driveSpeed').innerText = speedKph;
        }

        // Distance Calculation
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (lastLat !== null && lastLng !== null) {
          const d = calcDist(lastLat, lastLng, lat, lng);
          if (d > 0.005) { // filter micro-jitter
            totalDistanceKm += d;
            document.getElementById('driveDist').innerText = totalDistanceKm.toFixed(1);
          }
        }
        lastLat = lat;
        lastLng = lng;
      }, (err) => {}, { enableHighAccuracy: true });
    }

    // 5. Force start the microphone Voice SOS
    if (typeof toggleVoiceSOS === 'function') {
      toggleVoiceSOS(true);
    }
  }

  function endDriveMode() {
    // Clean everything up
    if (wakeLock !== null) wakeLock.release().then(() => { wakeLock = null; });
    if (driveGeoWatch !== null) navigator.geolocation.clearWatch(driveGeoWatch);
    if (driveInterval !== null) clearInterval(driveInterval);
    if (typeof toggleVoiceSOS === 'function' && typeof voiceSosActive !== 'undefined' && voiceSosActive) {
      toggleVoiceSOS(); // toggles it off
    }
    
    window.removeEventListener('devicemotion', handleMotion, true);
    cancelCrashSOS(); // Just in case

    goTo('home');
  }

  // Hook into navigation
  const originalGoToDrive = window.goTo;
  if(originalGoToDrive) {
    window.goTo = function(screen) {
      originalGoToDrive(screen);
      if (screen === 'drive-mode') {
        // We delay to let the screen transition, then optionally ask permission if needed by clicking a hidden button, 
        // but iOS needs a direct click. Since they clicked "Drive Mode" button, that counts!
        setTimeout(() => startDriveMode(), 500);
      } else if (document.getElementById('drive-mode').classList.contains('active')) {
        endDriveMode();
      }
    };
  }
</script>
`;
  html = html.replace(oldScriptBlock, newScriptBlock);
  fs.writeFileSync('simple.html', html, 'utf8');
  console.log('Crash Detection & Metrics injected successfully!');
} else {
  console.log('Script block not found!');
}
