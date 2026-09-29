#!/usr/bin/env python3
"""
Clean up the Rides screen in simple.html & app.html:
- Removes legacy messy mobDispatchEnginePane.
- Presents a 100% clean, ultra-modern Mobile Rides Provider grid for Uber, Bolt, Lyft, DiDi, Grab, InDrive.
- Clicking any provider launches fullNativeRideModal smoothly!
"""

import os, re

CLEAN_RIDES_SCREEN_HTML = """
<!-- CLEAN ULTRA-MODERN RIDES SCREEN -->
<div id="rides" class="screen" style="background:var(--bg); padding:16px 20px 100px 20px; overflow-y:auto; -webkit-overflow-scrolling:touch;">
  
  <!-- SCREEN HEADER -->
  <div style="text-align:center; margin-top:12px; margin-bottom:24px;">
    <div style="font-family:'Bebas Neue',sans-serif; font-size:34px; letter-spacing:3px; color:var(--fg); line-height:1; text-shadow:0 0 30px rgba(255,255,255,0.15);">SELECT RIDE PROVIDER</div>
    <div style="font-size:10px; color:#00d084; font-family:'Space Mono',monospace; letter-spacing:2px; text-transform:uppercase; margin-top:6px; font-weight:bold;">DIRECT IN-APP DISPATCH ENGINE</div>
    <div style="width:60px; height:2px; background:linear-gradient(90deg, transparent, #00d084, transparent); margin:10px auto 0;"></div>
  </div>

  <!-- PROVIDER GRID (2-COLUMN MOBILE) -->
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; width:100%;">

    <!-- UBER -->
    <div onclick="openFullNativeRideModal('uber', 'Uber')" style="background:linear-gradient(145deg, rgba(24,24,27,0.9), rgba(12,14,22,0.95)); border:1px solid rgba(255,255,255,0.12); border-radius:20px; padding:18px; display:flex; flex-direction:column; justify-content:space-between; height:130px; cursor:pointer; box-shadow:0 10px 25px rgba(0,0,0,0.5); transition:transform 0.15s;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="font-family:'Space Mono',monospace; font-size:10px; color:#00d084; font-weight:bold;">01</div>
        <div style="width:36px; height:36px; border-radius:12px; background:#000000; border:1px solid rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:20px;">⬛</div>
      </div>
      <div>
        <div style="font-family:'Bebas Neue',sans-serif; font-size:24px; color:#ffffff; letter-spacing:1px; line-height:1;">UBER</div>
        <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono',monospace; margin-top:2px;">UberX • Comfort • XL</div>
      </div>
    </div>

    <!-- LYFT -->
    <div onclick="openFullNativeRideModal('lyft', 'Lyft')" style="background:linear-gradient(145deg, rgba(24,24,27,0.9), rgba(12,14,22,0.95)); border:1px solid rgba(255,0,191,0.25); border-radius:20px; padding:18px; display:flex; flex-direction:column; justify-content:space-between; height:130px; cursor:pointer; box-shadow:0 10px 25px rgba(0,0,0,0.5); transition:transform 0.15s;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="font-family:'Space Mono',monospace; font-size:10px; color:#FF00BF; font-weight:bold;">02</div>
        <div style="width:36px; height:36px; border-radius:12px; background:#FF00BF; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 4px 14px rgba(255,0,191,0.4);">🟣</div>
      </div>
      <div>
        <div style="font-family:'Bebas Neue',sans-serif; font-size:24px; color:#ffffff; letter-spacing:1px; line-height:1;">LYFT</div>
        <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono',monospace; margin-top:2px;">Standard • Extra</div>
      </div>
    </div>

    <!-- BOLT -->
    <div onclick="openFullNativeRideModal('bolt', 'Bolt')" style="background:linear-gradient(145deg, rgba(24,24,27,0.9), rgba(12,14,22,0.95)); border:1px solid rgba(52,209,134,0.25); border-radius:20px; padding:18px; display:flex; flex-direction:column; justify-content:space-between; height:130px; cursor:pointer; box-shadow:0 10px 25px rgba(0,0,0,0.5); transition:transform 0.15s;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="font-family:'Space Mono',monospace; font-size:10px; color:#34D186; font-weight:bold;">03</div>
        <div style="width:36px; height:36px; border-radius:12px; background:#34D186; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 4px 14px rgba(52,209,134,0.4);">⚡</div>
      </div>
      <div>
        <div style="font-family:'Bebas Neue',sans-serif; font-size:24px; color:#ffffff; letter-spacing:1px; line-height:1;">BOLT</div>
        <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono',monospace; margin-top:2px;">Standard • Green</div>
      </div>
    </div>

    <!-- DIDI -->
    <div onclick="openFullNativeRideModal('didi', 'DiDi')" style="background:linear-gradient(145deg, rgba(24,24,27,0.9), rgba(12,14,22,0.95)); border:1px solid rgba(255,105,0,0.25); border-radius:20px; padding:18px; display:flex; flex-direction:column; justify-content:space-between; height:130px; cursor:pointer; box-shadow:0 10px 25px rgba(0,0,0,0.5); transition:transform 0.15s;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="font-family:'Space Mono',monospace; font-size:10px; color:#FF6900; font-weight:bold;">04</div>
        <div style="width:36px; height:36px; border-radius:12px; background:#FF6900; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 4px 14px rgba(255,105,0,0.4);">🟠</div>
      </div>
      <div>
        <div style="font-family:'Bebas Neue',sans-serif; font-size:24px; color:#ffffff; letter-spacing:1px; line-height:1;">DIDI</div>
        <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono',monospace; margin-top:2px;">Express • Economy</div>
      </div>
    </div>

    <!-- GRAB -->
    <div onclick="openFullNativeRideModal('grab', 'Grab')" style="background:linear-gradient(145deg, rgba(24,24,27,0.9), rgba(12,14,22,0.95)); border:1px solid rgba(0,177,79,0.25); border-radius:20px; padding:18px; display:flex; flex-direction:column; justify-content:space-between; height:130px; cursor:pointer; box-shadow:0 10px 25px rgba(0,0,0,0.5); transition:transform 0.15s;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="font-family:'Space Mono',monospace; font-size:10px; color:#00B14F; font-weight:bold;">05</div>
        <div style="width:36px; height:36px; border-radius:12px; background:#00B14F; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 4px 14px rgba(0,177,79,0.4);">🟢</div>
      </div>
      <div>
        <div style="font-family:'Bebas Neue',sans-serif; font-size:24px; color:#ffffff; letter-spacing:1px; line-height:1;">GRAB</div>
        <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono',monospace; margin-top:2px;">City Rides • Express</div>
      </div>
    </div>

    <!-- INDRIVE -->
    <div onclick="openFullNativeRideModal('indrive', 'InDrive')" style="background:linear-gradient(145deg, rgba(24,24,27,0.9), rgba(12,14,22,0.95)); border:1px solid rgba(0,169,224,0.25); border-radius:20px; padding:18px; display:flex; flex-direction:column; justify-content:space-between; height:130px; cursor:pointer; box-shadow:0 10px 25px rgba(0,0,0,0.5); transition:transform 0.15s;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="font-family:'Space Mono',monospace; font-size:10px; color:#00A9E0; font-weight:bold;">06</div>
        <div style="width:36px; height:36px; border-radius:12px; background:#00A9E0; display:flex; align-items:center; justify-content:center; font-size:20px; box-shadow:0 4px 14px rgba(0,169,224,0.4);">🔵</div>
      </div>
      <div>
        <div style="font-family:'Bebas Neue',sans-serif; font-size:24px; color:#ffffff; letter-spacing:1px; line-height:1;">INDRIVE</div>
        <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono',monospace; margin-top:2px;">Bidding • Offer Price</div>
      </div>
    </div>

  </div>

</div>
"""

def update_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace <div id="rides" ... </div> with CLEAN_RIDES_SCREEN_HTML
    if '<div id="rides"' in content:
        content = re.sub(r'<div id="rides".*?<!-- DUAL-PANE DISPATCH ENGINE.*?</div>\s*</div>\s*</div>', CLEAN_RIDES_SCREEN_HTML, content, flags=re.DOTALL)
        content = re.sub(r'<div id="rides".*?<!-- =====================\s*SCREEN:', CLEAN_RIDES_SCREEN_HTML + '\n\n<!-- =====================\n     SCREEN:', content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Replaced clean Rides screen in {filepath}")

update_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
update_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
update_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
update_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")

print("Clean Rides page update complete!")
