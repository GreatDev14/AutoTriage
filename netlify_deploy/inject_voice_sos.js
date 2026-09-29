const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

const emergencyStart = html.indexOf('<div id="emergency" class="screen">');
const nextScreenStart = html.indexOf('<div id="', emergencyStart + 10);

if (emergencyStart === -1 || nextScreenStart === -1) {
  console.log("Could not locate emergency section.");
  process.exit(1);
}

const newEmergencyHtml = `
<div id="emergency" class="screen">
  <div class="screen-header" style="border-bottom: 1px solid rgba(230,57,70,0.2);">
    <button class="back-btn" onclick="goTo('home')"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg></button>
    <div class="screen-name" style="color: #E63946; text-shadow: 0 0 10px rgba(230,57,70,0.5);">EMERGENCY DISPATCH</div>
  </div>
  
  <div class="screen-body" style="padding:0; padding-bottom:160px; background: radial-gradient(circle at 50% 0%, rgba(230,57,70,0.08) 0%, transparent 70%);">
    <div class="em-top" style="padding: 40px 24px 20px;">
      <!-- Glowing Heartbeat/SOS Icon -->
      <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 24px; position: relative;">
        <div style="position: absolute; width: 80px; height: 80px; border-radius: 50%; background: rgba(230,57,70,0.15); filter: blur(15px); animation: pulse 1s infinite;"></div>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#E63946" stroke-width="1.5" style="z-index: 2; filter: drop-shadow(0 0 8px rgba(230,57,70,0.6));">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
      </div>
      <div style="font-family: 'Bebas Neue', sans-serif; font-size: 36px; color: white; letter-spacing: 2px;">EMERGENCY</div>
      <p style="font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 8px;">24/7 IMMEDIATE ASSISTANCE NETWORK</p>
    </div>

    <!-- VOICE SOS CONTROL PANEL -->
    <div style="padding: 0 24px 30px;">
      <div id="voiceSosBox" style="background: rgba(20,20,22,0.8); backdrop-filter: blur(10px); border: 1px solid rgba(230,57,70,0.3); border-radius: 20px; padding: 24px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <div id="voiceSosIconWrap" style="background: rgba(230,57,70,0.1); border-radius: 50%; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; border: 1px solid rgba(230,57,70,0.3); transition: all 0.3s;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E63946" stroke-width="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
        </div>
        <div style="font-family: 'Bebas Neue', sans-serif; font-size: 24px; color: white; letter-spacing: 1px;">HANDS-FREE VOICE SOS</div>
        <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.5; margin-top: 6px; margin-bottom: 20px;">When enabled, shout "HELP" to automatically trigger a 112 dispatch call and open GPS location share.</div>
        
        <button id="toggleVoiceBtn" onclick="toggleVoiceSOS()" style="background: linear-gradient(90deg, #E63946, #c52935); box-shadow: 0 0 15px rgba(230,57,70,0.4); color: white; border: none; padding: 14px 24px; border-radius: 12px; font-family: 'Space Mono', monospace; font-size: 12px; font-weight: bold; width: 100%; transition: all 0.2s;">ACTIVATE MICROPHONE</button>
      </div>
    </div>

    <!-- MAIN SOS SLIDER -->
    <div class="slide-sos-container" id="sosSlider">
      <div class="slide-track-fill" id="sosTrack"></div>
      <div class="slide-text">Slide to call 112</div>
      <div class="slide-handle" id="sosHandle"></div>
    </div>

    <div style="padding: 0 24px; margin-bottom: 30px; display: flex; flex-direction: column; gap: 12px;">
       <button class="action-btn red-btn" onclick="broadcastLocation()" style="box-shadow: 0 8px 25px rgba(230,57,70,0.3); border-radius: 12px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: bold;"> SHARE LIVE LOCATION VIA SMS</button>
       <button class="action-btn" onclick="goTo('checklist')" style="background:var(--mid); border:1px solid var(--border); color:var(--red); font-size:12px; font-family: 'Space Mono', monospace; box-shadow:none; border-radius: 12px;"> View Breakdown Checklist</button>
    </div>

    <div class="em-numbers">
      <a href="tel:911" class="em-num-btn">
        <div class="em-num-left">
          <div class="em-num-label">General Police</div>
          <div class="em-num-val">911</div>
        </div>
        <div class="em-num-right"></div>
      </a>
      <a href="tel:112" class="em-num-btn">
        <div class="em-num-left">
          <div class="em-num-label">Medical Rescue</div>
          <div class="em-num-val">112</div>
        </div>
        <div class="em-num-right"></div>
      </a>
    </div>
  </div>
</div>
`;

// Replace the HTML
let finalHtml = html.substring(0, emergencyStart) + newEmergencyHtml + html.substring(nextScreenStart);

// Inject Voice SOS Javascript and Fullscreen Overlay
const voiceSosScript = `
<!-- VOICE SOS FULLSCREEN OVERLAY -->
<div id="voiceSosOverlay" style="position: fixed; inset: 0; z-index: 9999999; background: rgba(230,57,70,0.95); backdrop-filter: blur(20px); display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px;">
  <div style="font-family: 'Bebas Neue', sans-serif; font-size: 80px; color: white; letter-spacing: 4px; line-height: 1; margin-bottom: 20px; animation: pulse 0.5s infinite alternate;">SOS<br>TRIGGERED</div>
  <div style="font-family: 'Space Mono', monospace; font-size: 14px; color: white; line-height: 1.6;">Voice Distress Signal Confirmed.<br>Dispatching Emergency Protocols...</div>
  <div style="margin-top: 40px; width: 60px; height: 60px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spinSlow 1s linear infinite;"></div>
</div>

<script>
  let voiceSosActive = false;
  let recognition = null;
  let restartTimeout = null;

  function initSpeechRecognition() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!window.SpeechRecognition) {
      alert("Your browser does not support Voice-Activated SOS. Please use Chrome or Safari.");
      return false;
    }
    
    recognition = new window.SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim().toLowerCase();
          console.log("Voice SOS heard:", transcript);
          
          if (transcript.includes('help') || transcript.includes('emergency') || transcript.includes('sos')) {
            triggerVoiceEmergency();
          }
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      if(voiceSosActive && event.error !== 'aborted') {
        // Auto-restart if we hit an error but it's supposed to be active
        restartTimeout = setTimeout(() => {
          if(voiceSosActive) {
            try { recognition.start(); } catch(e){}
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      if (voiceSosActive) {
        // Continuous listening hack - restart when it naturally ends
        try { recognition.start(); } catch(e){}
      }
    };
    
    return true;
  }

  function toggleVoiceSOS() {
    const btn = document.getElementById('toggleVoiceBtn');
    const iconWrap = document.getElementById('voiceSosIconWrap');
    const box = document.getElementById('voiceSosBox');

    if (!voiceSosActive) {
      if(!recognition) {
        const supported = initSpeechRecognition();
        if(!supported) return;
      }
      
      try {
        recognition.start();
        voiceSosActive = true;
        
        btn.innerText = "DISABLE MICROPHONE";
        btn.style.background = "rgba(255,255,255,0.1)";
        btn.style.boxShadow = "none";
        
        iconWrap.style.background = "rgba(45,190,96,0.2)";
        iconWrap.style.borderColor = "rgba(45,190,96,0.5)";
        box.style.borderColor = "rgba(45,190,96,0.3)";
        iconWrap.innerHTML = \`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2DBE60" stroke-width="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line><circle cx="12" cy="12" r="10" stroke-dasharray="2 4" stroke="#2DBE60" style="animation: spinReverse 4s linear infinite; transform-origin: center;"></circle></svg>\`;
      } catch(e) {
        alert("Microphone permission denied. Please allow microphone access.");
      }
    } else {
      voiceSosActive = false;
      clearTimeout(restartTimeout);
      try { recognition.stop(); } catch(e){}
      
      btn.innerText = "ACTIVATE MICROPHONE";
      btn.style.background = "linear-gradient(90deg, #E63946, #c52935)";
      btn.style.boxShadow = "0 0 15px rgba(230,57,70,0.4)";
      
      iconWrap.style.background = "rgba(230,57,70,0.1)";
      iconWrap.style.borderColor = "rgba(230,57,70,0.3)";
      box.style.borderColor = "rgba(230,57,70,0.3)";
      iconWrap.innerHTML = \`<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E63946" stroke-width="1.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>\`;
    }
  }

  function triggerVoiceEmergency() {
    voiceSosActive = false;
    try { recognition.stop(); } catch(e){}
    
    // Show Full Screen Alert
    const overlay = document.getElementById('voiceSosOverlay');
    if(overlay) overlay.style.display = 'flex';
    
    // Simulate Dialing & SMS Background trigger
    setTimeout(() => {
      // 1. Dial 112
      window.location.href = 'tel:112';
      
      // 2. Open SMS intent with location
      setTimeout(() => {
        const body = encodeURIComponent("EMERGENCY! I need help at: " + (userAddr || userCity || "Unknown Location"));
        window.location.href = 'sms:112?body=' + body;
        
        // Hide overlay after 5 secs
        setTimeout(() => {
          if(overlay) overlay.style.display = 'none';
        }, 5000);
      }, 1500);
    }, 2000);
  }
</script>
`;

finalHtml = finalHtml.replace(/<\/body>/i, voiceSosScript + '\n</body>');

fs.writeFileSync('simple.html', finalHtml, 'utf8');
console.log('Voice SOS and Emergency Redesign injected successfully!');
