const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');
const newUI = fs.readFileSync('new_ui.html', 'utf8');

const startMarker = '<div class="em-top" style="padding: 40px 24px 20px;">';
const endMarker = '</div>\n</div>\n<div id="garage" class="screen">';

const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find markers!");
  process.exit(1);
}

html = html.substring(0, startIdx) + newUI + "\n" + html.substring(endIdx);

const panicScript = `
<script>
  let panicAudio = null;
  let panicInterval = null;
  let isPanicActive = false;

  function togglePanicAlarm() {
    const btn = document.getElementById('panicAlarmBtn');
    if (!isPanicActive) {
      isPanicActive = true;
      btn.innerHTML = '<span style="font-family: \\'Bebas Neue\\', sans-serif; font-size: 28px; letter-spacing: 2px;">STOP ALARM</span>';
      btn.style.background = 'white';
      btn.style.color = '#E63946';
      
      // Flash screen
      panicInterval = setInterval(() => {
        document.body.style.background = document.body.style.background === 'red' ? 'black' : 'red';
      }, 200);

      // Play Siren (Using high frequency oscillator as a fallback to avoid needing MP3)
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        panicAudio = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        panicAudio.type = 'square';
        panicAudio.frequency.setValueAtTime(600, audioCtx.currentTime);
        panicAudio.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.5);
        panicAudio.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 1.0);
        setInterval(() => {
           if(!isPanicActive || !panicAudio) return;
           try {
             panicAudio.frequency.setValueAtTime(600, audioCtx.currentTime);
             panicAudio.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.5);
             panicAudio.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 1.0);
           } catch(e){}
        }, 1000);
        
        panicAudio.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        panicAudio.start();
      } catch(e) {}
      
    } else {
      isPanicActive = false;
      btn.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg><span style="font-family: \\'Bebas Neue\\', sans-serif; font-size: 28px; letter-spacing: 2px;">SOUND PANIC ALARM</span>';
      btn.style.background = 'linear-gradient(135deg, #E63946, #800000)';
      btn.style.color = 'white';
      
      clearInterval(panicInterval);
      document.body.style.background = 'var(--bg)';
      
      if (panicAudio) {
        try { panicAudio.stop(); } catch(e){}
        panicAudio = null;
      }
    }
  }

  // Live GPS Coordinates updater
  setInterval(() => {
    const coordsEl = document.getElementById('emLiveCoords');
    if (coordsEl && document.getElementById('emergency').classList.contains('active')) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          coordsEl.innerText = pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4);
        }, () => {
          coordsEl.innerText = "GPS DENIED";
        });
      }
    }
  }, 3000);
</script>
</body>`;

html = html.replace('</body>', panicScript);
fs.writeFileSync('simple.html', html, 'utf8');
console.log('Emergency Screen Updated without escaping errors!');
