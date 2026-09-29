#!/usr/bin/env python3
import os
import re

GRID_JS = """function updateDashboardWidgets() {
  const dash = document.getElementById('homeDashWidgets');
  if(!dash) return;
  
  const vehName = myVehicle.make ? (myVehicle.make + ' ' + myVehicle.model) : 'No Vehicle Set';
  const histCount = diagnosisHistory.length;
  
  dash.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom: 24px;">
      <!-- GARAGE -->
      <div onclick="goTo('garage')" style="background:rgba(20,22,30,0.5); border:1px solid rgba(255,51,51,0.15); border-radius:16px; padding:12px; cursor:pointer; display:flex; flex-direction:column; gap:12px;">
        <div style="font-size:18px;">🚙</div>
        <div>
          <div style="font-family:'Space Mono', monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">MY GARAGE</div>
          <div style="font-family:'Space Mono', monospace; font-size:11px; font-weight:bold; color:#ffffff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${vehName}</div>
        </div>
      </div>
      <!-- DIAGNOSES -->
      <div onclick="goTo('diagnose')" style="background:rgba(20,22,30,0.5); border:1px solid rgba(45,190,96,0.2); border-radius:16px; padding:12px; cursor:pointer; display:flex; flex-direction:column; gap:12px;">
        <div style="font-size:18px;">📋</div>
        <div>
          <div style="font-family:'Space Mono', monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">DIAGNOSES</div>
          <div style="font-family:'Space Mono', monospace; font-size:11px; font-weight:bold; color:#ffffff;">${histCount}</div>
        </div>
      </div>
      <!-- PARTS PRICING -->
      <div onclick="goTo('mechanics')" style="background:rgba(20,22,30,0.5); border:1px solid rgba(50,150,255,0.15); border-radius:16px; padding:12px; cursor:pointer; display:flex; flex-direction:column; gap:12px;">
        <div style="font-size:18px;">💰</div>
        <div>
          <div style="font-family:'Space Mono', monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">PARTS PRICING</div>
          <div style="font-family:'Space Mono', monospace; font-size:11px; font-weight:bold; color:#ffffff;">Check Prices &rarr;</div>
        </div>
      </div>
    </div>
  `;
}"""

def replace_dash_widgets(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the function and replace it using regex
    pattern = r'function updateDashboardWidgets\(\) \{.*?\}\s*(?=\n// --- 6\. PARTS PRICE ESTIMATOR ---)'
    new_content = re.sub(pattern, GRID_JS + '\n\n', content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated JS widgets in", filepath)

replace_dash_widgets(r'c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\js\features-simple.js')
replace_dash_widgets(r'c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\js\features-simple.js')
