const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

const s1 = html.indexOf('<div id="diagnose"');
const e1 = html.indexOf('<!-- =====================\n     SCREEN: MECHANIC', s1);

if (s1 > -1 && e1 > -1) {
  const newScreens = `
<div id="diagnose" class="screen" style="background: #020202; overflow-y: auto;">
  <div class="screen-header" style="background: rgba(2,2,2,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); z-index: 10;">
    <button class="back-btn" onclick="goTo('home')" style="color: #4da6ff;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
    <div class="screen-name" style="font-family: 'Space Mono', monospace; font-size: 14px; letter-spacing: 2px; color: #fff;">AI DIAGNOSTICS</div>
  </div>
  
  <div class="screen-body" style="padding: 24px; padding-bottom: 160px; padding-top: 100px;">
    <!-- Telemetry Status -->
    <div style="background: linear-gradient(145deg, rgba(77,166,255,0.08) 0%, rgba(99,102,241,0.02) 100%); border: 1px solid rgba(77,166,255,0.2); border-radius: 16px; padding: 16px; margin-bottom: 30px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-family: 'Space Mono', monospace; font-size: 10px; color: #4da6ff; letter-spacing: 2px; text-transform: uppercase;">Telemetry Link</div>
        <div style="font-weight: bold; font-size: 14px; color: white; margin-top: 4px;" id="diag-target-badge">Universal Profile</div>
      </div>
      <div style="background: rgba(77,166,255,0.15); border: 1px solid rgba(77,166,255,0.3); padding: 6px 12px; border-radius: 20px; font-family: 'Space Mono', monospace; font-size: 10px; color: #4da6ff; display: flex; align-items: center; gap: 8px;">
        <div style="width: 6px; height: 6px; border-radius: 50%; background: #4da6ff; animation: pulse 2s infinite;"></div> ACTIVE
      </div>
    </div>

    <!-- Vehicle Selectors -->
    <div style="display: flex; gap: 12px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none;">
      <button class="vt on" onclick="setVt(this,'Car')" style="padding: 10px 24px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-family: 'Space Mono', monospace; font-size: 12px; transition: all 0.3s; white-space: nowrap;">CAR</button>
      <button class="vt" onclick="setVt(this,'SUV')" style="padding: 10px 24px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-family: 'Space Mono', monospace; font-size: 12px; transition: all 0.3s; white-space: nowrap;">SUV</button>
      <button class="vt" onclick="setVt(this,'Truck')" style="padding: 10px 24px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-family: 'Space Mono', monospace; font-size: 12px; transition: all 0.3s; white-space: nowrap;">TRUCK</button>
      <button class="vt" onclick="setVt(this,'Moto')" style="padding: 10px 24px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: white; font-family: 'Space Mono', monospace; font-size: 12px; transition: all 0.3s; white-space: nowrap;">MOTO</button>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
      <select id="langSelect" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 10px 20px; border-radius: 20px; font-family: 'Space Mono', monospace; font-size: 12px; appearance: none; outline: none;">
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
      <button style="background: transparent; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); padding: 10px 20px; border-radius: 20px; font-family: 'Space Mono', monospace; font-size: 12px;">History</button>
    </div>

    <!-- Input Area -->
    <div style="position: relative; margin-bottom: 30px;">
      <textarea id="problemText" placeholder="Describe the symptoms in detail... \ne.g. 'Grinding noise from front right wheel when braking at highway speeds'" style="width: 100%; height: 160px; background: rgba(255,255,255,0.03); border: 1px solid rgba(77,166,255,0.3); border-radius: 16px; padding: 20px; color: white; font-size: 14px; resize: none; outline: none; font-family: 'Space Mono', monospace; line-height: 1.6; box-shadow: inset 0 0 20px rgba(77,166,255,0.05);"></textarea>
      
      <div style="position: absolute; bottom: 16px; right: 16px; display: flex; gap: 12px;">
        <label for="diagImgUpload" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); transition: all 0.2s;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="white"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </label>
        <input type="file" id="diagImgUpload" accept="image/*" style="display:none;" onchange="attachDiagnosisImage(this)">
      </div>
      <img id="diagImgPreview" style="display:none; position: absolute; bottom: 16px; left: 16px; width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(77,166,255,0.5);">
    </div>

    <!-- Primary Action -->
    <button id="diagnoseBtn" onclick="runDiagnosis()" style="width: 100%; background: #4da6ff; color: #020202; border: none; padding: 20px; border-radius: 16px; font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 2px; box-shadow: 0 10px 30px rgba(77,166,255,0.3); margin-bottom: 16px; transition: all 0.3s; text-shadow: 0 0 10px rgba(255,255,255,0.5);">INITIATE AI ENGINE</button>
    
    <button onclick="goTo('report-editor')" style="width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); padding: 16px; border-radius: 16px; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">Manual Report Entry</button>

  </div>
</div>

<div id="diag-result" class="screen" style="background: #020202; overflow-y: auto;">
  <div class="screen-header" style="background: rgba(2,2,2,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); z-index: 10;">
    <button class="back-btn" onclick="goTo('diagnose')" style="color: #4da6ff;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
    <div class="screen-name" style="font-family: 'Space Mono', monospace; font-size: 14px; letter-spacing: 2px; color: #fff;">ANALYSIS REPORT</div>
  </div>

  <div class="screen-body" style="padding: 24px; padding-bottom: 160px; padding-top: 100px;">
    
    <!-- Loader -->
    <div id="resultLoading" style="display:none; text-align:center; padding: 60px 0;">
      <div style="width: 60px; height: 60px; border-radius: 50%; border: 3px dashed rgba(77,166,255,0.3); border-top-color: #4da6ff; animation: spinSlow 2s linear infinite; margin: 0 auto 24px;"></div>
      <div style="font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: white; letter-spacing: 4px; margin-bottom: 8px;">ANALYZING</div>
      <div style="font-family: 'Space Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.5); letter-spacing: 2px;">QUERYING NEURAL NET...</div>
    </div>

    <!-- Content Area -->
    <div id="resultArea" style="opacity: 0; transition: opacity 0.5s; display: none;">
      <div id="resultBody"></div>
      
      <!-- Action Buttons -->
      <div style="margin-top: 40px; display: flex; flex-direction: column; gap: 16px;">
        <button onclick="goTo('mechanics')" style="background: white; color: #020202; border: none; padding: 20px; border-radius: 16px; font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 2px; width: 100%;">FIND <span id="targetSpecLabel">SPECIALIST</span></button>
        <button onclick="shareToWhatsApp()" style="background: rgba(45,190,96,0.1); border: 1px solid rgba(45,190,96,0.5); color: #2DBE60; padding: 20px; border-radius: 16px; font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 2px; width: 100%;">SEND TO WHATSAPP</button>
      </div>
    </div>
  </div>
</div>

<!-- =====================
     SCREEN: MECHANIC`;

  html = html.substring(0, s1) + newScreens + html.substring(e1 + 45); // +45 to trim out the exact string we searched for to avoid duplication
  fs.writeFileSync('simple.html', html, 'utf8');
  console.log('Successfully injected premium HTML UI!');
} else {
  console.log('Failed to find boundary tags for HTML injection.');
}
