const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// 1. Update the HTML to add a START TRIP button and adjust the UI
const htmlStart = html.indexOf('<div id="driveTimer"');
if (htmlStart > -1) {
  // We need to inject a button below the Trip Metrics
  const metricsEnd = html.indexOf('</div>\n      </div>', htmlStart);
  if (metricsEnd > -1) {
    const insertPoint = metricsEnd + 19;
    const buttonHtml = `
      <!-- Trip Toggle Button -->
      <button id="toggleTripBtn" onclick="toggleTripTracking()" style="margin-top: 20px; background: rgba(45,190,96,0.15); border: 1px solid rgba(45,190,96,0.5); color: #2DBE60; padding: 12px 30px; border-radius: 30px; font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 2px; cursor: pointer; transition: all 0.2s; box-shadow: 0 0 15px rgba(45,190,96,0.2);">
        START TRIP
      </button>
    `;
    if (html.indexOf('id="toggleTripBtn"') === -1) {
      html = html.substring(0, insertPoint) + buttonHtml + html.substring(insertPoint);
    }
  }
}

// 2. Update the Javascript
const jsStart = html.indexOf('let driveInterval = null;');
const jsEnd = html.indexOf('function handleMotion(event) {');
if (jsStart > -1 && jsEnd > -1) {
  const oldJs = html.substring(jsStart, jsEnd);
  const newJs = `let driveInterval = null;
  let driveSeconds = 0;
  let totalDistanceKm = 0;
  let lastLat = null;
  let lastLng = null;
  let isTrackingTrip = false;
  
  let motionListener = null;
  let crashCountdownInterval = null;
  let crashActive = false;
  let crashTimeLeft = 10;

  function toggleTripTracking() {
    isTrackingTrip = !isTrackingTrip;
    const btn = document.getElementById('toggleTripBtn');
    
    if (isTrackingTrip) {
      // Start tracking
      if (btn) {
        btn.innerText = 'PAUSE TRIP';
        btn.style.background = 'rgba(230,57,70,0.15)';
        btn.style.borderColor = 'rgba(230,57,70,0.5)';
        btn.style.color = '#E63946';
        btn.style.boxShadow = '0 0 15px rgba(230,57,70,0.2)';
      }
      
      // Reset coordinates for distance calculation so it doesn't jump
      lastLat = null;
      lastLng = null;
      
      driveInterval = setInterval(() => {
        driveSeconds++;
        document.getElementById('driveTimer').innerText = formatTime(driveSeconds);
      }, 1000);
      
    } else {
      // Pause tracking
      if (btn) {
        btn.innerText = 'RESUME TRIP';
        btn.style.background = 'rgba(45,190,96,0.15)';
        btn.style.borderColor = 'rgba(45,190,96,0.5)';
        btn.style.color = '#2DBE60';
        btn.style.boxShadow = '0 0 15px rgba(45,190,96,0.2)';
      }
      if (driveInterval !== null) {
        clearInterval(driveInterval);
        driveInterval = null;
      }
    }
  }

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

  `;
  html = html.replace(oldJs, newJs);
}

// 3. Prevent auto-start in startDriveMode() and handle GPS tracking conditionally
const startFnIdx = html.indexOf('async function startDriveMode() {');
const endFnIdx = html.indexOf('function endDriveMode() {');
if (startFnIdx > -1 && endFnIdx > -1) {
  const oldStartFn = html.substring(startFnIdx, endFnIdx);
  
  // We need to replace the auto-start logic inside oldStartFn
  // Specifically:
  // driveInterval = setInterval(() => { ... }, 1000); -> remove this
  // And modify the GPS watch to only accumulate distance if isTrackingTrip === true
  
  let newStartFn = oldStartFn.replace(/driveInterval = setInterval\(\(\) => \{[\s\S]*?\}, 1000\);/, '');
  
  // Reset the button state on start
  const resetBtnLogic = `
    isTrackingTrip = false;
    const btn = document.getElementById('toggleTripBtn');
    if (btn) {
      btn.innerText = 'START TRIP';
      btn.style.background = 'rgba(45,190,96,0.15)';
      btn.style.borderColor = 'rgba(45,190,96,0.5)';
      btn.style.color = '#2DBE60';
      btn.style.boxShadow = '0 0 15px rgba(45,190,96,0.2)';
    }
  `;
  newStartFn = newStartFn.replace('document.getElementById(\'driveSpeed\').innerText = \'0\';', "document.getElementById('driveSpeed').innerText = '0';\n    " + resetBtnLogic);
  
  // Conditionally track distance
  const oldDistanceLogic = `if (lastLat !== null && lastLng !== null) {
          const d = calcDist(lastLat, lastLng, lat, lng);
          if (d > 0.005) { // filter micro-jitter
            totalDistanceKm += d;
            document.getElementById('driveDist').innerText = totalDistanceKm.toFixed(1);
          }
        }`;
        
  const newDistanceLogic = `if (isTrackingTrip && lastLat !== null && lastLng !== null) {
          const d = calcDist(lastLat, lastLng, lat, lng);
          if (d > 0.005) { // filter micro-jitter
            totalDistanceKm += d;
            document.getElementById('driveDist').innerText = totalDistanceKm.toFixed(1);
          }
        }`;
        
  newStartFn = newStartFn.replace(oldDistanceLogic, newDistanceLogic);
  
  html = html.replace(oldStartFn, newStartFn);
}

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Toggle logic injected successfully!');
