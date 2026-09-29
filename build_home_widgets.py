#!/usr/bin/env python3
import os

WIDGETS_HTML = """
  <div id="homeDashWidgets" style="padding:0 24px; margin-bottom: 24px;">
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
      <!-- GARAGE -->
      <div onclick="goTo('garage')" style="background:rgba(20,22,30,0.5); border:1px solid rgba(255,51,51,0.15); border-radius:16px; padding:12px; cursor:pointer; display:flex; flex-direction:column; gap:12px;">
        <div style="font-size:18px;">🚙</div>
        <div>
          <div style="font-family:'Space Mono', monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">MY GARAGE</div>
          <div style="font-family:'Space Mono', monospace; font-size:11px; font-weight:bold; color:#ffffff;">No Vehicle Set</div>
        </div>
      </div>
      <!-- DIAGNOSES -->
      <div onclick="goTo('diagnose')" style="background:rgba(20,22,30,0.5); border:1px solid rgba(45,190,96,0.2); border-radius:16px; padding:12px; cursor:pointer; display:flex; flex-direction:column; gap:12px;">
        <div style="font-size:18px;">📋</div>
        <div>
          <div style="font-family:'Space Mono', monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">DIAGNOSES</div>
          <div style="font-family:'Space Mono', monospace; font-size:11px; font-weight:bold; color:#ffffff;">0</div>
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
  </div>
"""

def inject_widgets(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The old empty div
    old_div = '<div id="homeDashWidgets" style="padding:0 24px;"></div>'
    
    if old_div in content:
        content = content.replace(old_div, WIDGETS_HTML.strip())
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Injected home widgets into {filepath}")
    else:
        print(f"Could not find empty homeDashWidgets div in {filepath}")

inject_widgets(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
inject_widgets(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
inject_widgets(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
inject_widgets(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")
