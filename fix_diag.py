import re

with open('simple.html', 'r', encoding='utf-8') as f:
    text = f.read()

old_block = """<div id="diagnose" class="screen" style="background: #020202; overflow-y: auto;">
  <div class="screen-header" style="background: rgba(2,2,2,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); z-index: 10;">
    <button class="back-btn" onclick="goTo('home')" style="color: #4da6ff; background: rgba(77,166,255,0.1); border: 1px solid rgba(77,166,255,0.3); border-radius: 50%; padding: 8px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
    <div class="screen-name" style="font-family: 'Space Mono', monospace; font-size: 14px; letter-spacing: 2px; color: #fff;">AI DIAGNOSTICS</div>
  </div>
  
  <div class="screen-body" style="padding: 24px; padding-bottom: 160px; padding-top: 100px;">
    <!-- Telemetry Status -->
    <div style="background: linear-gradient(145deg, rgba(77,166,255,0.08) 0%, rgba(99,102,241,0.02) 100%); border: 1px solid rgba(77,166,255,0.2); border-radius: 16px; padding: 16px; margin-bottom: 30px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-family: 'Space Mono', monospace; font-size: 10px; color: #4da6ff; letter-spacing: 2px; text-transform: uppercase;">Telemetry Link</div>
        <div style="font-family: 'Space Mono', monospace; font-weight: bold; font-size: 14px; color: white; margin-top: 4px;" id="diag-target-badge">Universal Profile</div>
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
      <textarea id="problemText" placeholder="Describe the symptoms in detail... 
e.g. 'Grinding noise from front right wheel when braking at highway speeds'" style="width: 100%; height: 160px; background: rgba(255,255,255,0.03); border: 1px solid rgba(77,166,255,0.3); border-radius: 16px; padding: 20px; color: white; font-size: 14px; resize: none; outline: none; font-family: 'Space Mono', monospace; line-height: 1.6; box-shadow: inset 0 0 20px rgba(77,166,255,0.05);"></textarea>
      
      <div style="position: absolute; bottom: 16px; right: 16px; display: flex; gap: 12px;">
        <label for="diagImgUpload" style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); transition: all 0.2s;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="white"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </label>
        <input type="file" id="diagImgUpload" accept="image/*" style="display:none;" onchange="attachDiagnosisImage(this)">
      </div>
      <img id="diagImgPreview" style="display:none; position: absolute; bottom: 16px; left: 16px; width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(77,166,255,0.5);">
    </div>

    <!-- Primary Action -->
    <button id="diagnoseBtn" onclick="runDiagnosis()" style="width: 100%; background: linear-gradient(135deg, #4da6ff 0%, #0073e6 100%); color: #fff; border: none; padding: 20px; border-radius: 16px; font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 2px; box-shadow: 0 10px 30px rgba(77,166,255,0.3); margin-bottom: 16px; transition: all 0.3s; text-shadow: 0 0 10px rgba(255,255,255,0.5);">INITIATE AI ENGINE</button>
    
    <button onclick="goTo('report-editor')" style="width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); padding: 16px; border-radius: 16px; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">Manual Report Entry</button>

  </div>
</div>"""

new_block = """<div id="diagnose" class="screen" style="background: var(--bg); overflow-y: auto;">
  <div class="screen-header" style="background: rgba(10,10,12,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.03); z-index: 10;">
    <button class="back-btn" onclick="goTo('home')" style="color: var(--fg); background: var(--glass); border: 1px solid var(--border); border-radius: 50%; padding: 8px; box-shadow: 0 4px 10px var(--shadow);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
    <div class="screen-name" style="font-size: 14px; font-weight:600; letter-spacing: 1px; color: var(--fg);">AI DIAGNOSTICS</div>
  </div>
  
  <div class="screen-body" style="padding: 24px; padding-bottom: 160px; padding-top: 100px;">
    <!-- Telemetry Status -->
    <div style="background: linear-gradient(135deg, rgba(255,255,255,0.03), transparent); border: 1px solid var(--border); box-shadow: inset 0 1px 0 rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; margin-bottom: 30px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-size: 10px; color: var(--gray); letter-spacing: 1px; text-transform: uppercase; font-weight:600;">Telemetry Link</div>
        <div style="font-weight: 700; font-size: 15px; color: var(--fg); margin-top: 4px;" id="diag-target-badge">Universal Profile</div>
      </div>
      <div style="background: rgba(45,190,96,0.1); border: 1px solid rgba(45,190,96,0.3); padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 10px; color: #2DBE60; display: flex; align-items: center; gap: 8px;">
        <div style="width: 6px; height: 6px; border-radius: 50%; background: #2DBE60; animation: pulse 2s infinite; box-shadow:0 0 8px #2DBE60;"></div> ACTIVE
      </div>
    </div>

    <!-- Vehicle Selectors -->
    <div style="display: flex; gap: 12px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none;">
      <button class="vt on" onclick="setVt(this,'Car')" style="padding: 10px 24px; border-radius: 30px; border: 1px solid rgba(230,57,70,0.5); background: rgba(230,57,70,0.1); color: var(--fg); font-size: 12px; font-weight:600; transition: all 0.3s; white-space: nowrap;">CAR</button>
      <button class="vt" onclick="setVt(this,'SUV')" style="padding: 10px 24px; border-radius: 30px; border: 1px solid var(--border); background: var(--glass); color: var(--gray); font-size: 12px; font-weight:600; transition: all 0.3s; white-space: nowrap;">SUV</button>
      <button class="vt" onclick="setVt(this,'Truck')" style="padding: 10px 24px; border-radius: 30px; border: 1px solid var(--border); background: var(--glass); color: var(--gray); font-size: 12px; font-weight:600; transition: all 0.3s; white-space: nowrap;">TRUCK</button>
      <button class="vt" onclick="setVt(this,'Moto')" style="padding: 10px 24px; border-radius: 30px; border: 1px solid var(--border); background: var(--glass); color: var(--gray); font-size: 12px; font-weight:600; transition: all 0.3s; white-space: nowrap;">MOTO</button>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
      <select id="langSelect" style="background: var(--glass); border: 1px solid var(--border); color: var(--fg); padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight:500; appearance: none; outline: none; box-shadow: 0 4px 10px var(--shadow);">
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
      <button style="background: var(--glass); border: 1px solid var(--border); color: var(--fg); padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight:500; box-shadow: 0 4px 10px var(--shadow);">History</button>
    </div>

    <!-- Input Area -->
    <div style="position: relative; margin-bottom: 30px;">
      <textarea id="problemText" placeholder="Describe the symptoms in detail... \ne.g. 'Grinding noise from front right wheel when braking at highway speeds'" style="width: 100%; height: 160px; background: rgba(0,0,0,0.4); border: 1px solid var(--border); border-radius: 16px; padding: 20px; color: var(--fg); font-size: 14px; resize: none; outline: none; font-family: 'Space Mono', monospace; line-height: 1.6; box-shadow: inset 0 4px 15px rgba(0,0,0,0.5);"></textarea>
      
      <div style="position: absolute; bottom: 16px; right: 16px; display: flex; gap: 12px;">
        <label for="diagImgUpload" style="width: 40px; height: 40px; border-radius: 50%; background: var(--mid); display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid var(--border); box-shadow: 0 4px 10px var(--shadow); transition: all 0.2s;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="var(--fg)"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </label>
        <input type="file" id="diagImgUpload" accept="image/*" style="display:none;" onchange="attachDiagnosisImage(this)">
      </div>
      <img id="diagImgPreview" style="display:none; position: absolute; bottom: 16px; left: 16px; width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(230,57,70,0.5);">
    </div>

    <!-- Primary Action -->
    <button id="diagnoseBtn" onclick="runDiagnosis()" style="width: 100%; background: linear-gradient(135deg, #e63946 0%, #a8202d 100%); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-bottom: 2px solid #6b141d; padding: 20px; border-radius: 16px; font-size: 22px; font-weight:800; letter-spacing: 1px; box-shadow: 0 8px 25px rgba(230,57,70,0.3), inset 0 1px 0 rgba(255,255,255,0.2); margin-bottom: 16px; transition: all 0.2s; text-transform:uppercase;">INITIATE AI ENGINE</button>
    
    <button onclick="goTo('report-editor')" style="width: 100%; background: transparent; border: 1px solid var(--border); color: var(--gray); padding: 16px; border-radius: 16px; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; transition:all 0.2s;">Manual Report Entry</button>

  </div>
</div>"""

if old_block in text:
    text = text.replace(old_block, new_block)
    with open('simple.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Success: Replaced AI DIAGNOSTICS screen HTML.")
else:
    print("Error: Could not find exact old block to replace. Here's what's actually there around line 1468:")
    print(text[text.find('id="diagnose"'):text.find('id="diagnose"')+200])

