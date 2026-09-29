const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

const anchor = html.indexOf('<!-- =====================\n     SCREEN: DIAGNOSE');
if (anchor > -1 && html.indexOf('id="drive-mode"') === -1) {
  const newDriveModeHTML = `
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
\n`;
  html = html.substring(0, anchor) + newDriveModeHTML + html.substring(anchor);
  fs.writeFileSync('simple.html', html, 'utf8');
  console.log('Successfully re-injected Drive Mode HTML!');
} else {
  console.log('Could not re-inject. Either anchor not found or drive mode already exists.');
}
