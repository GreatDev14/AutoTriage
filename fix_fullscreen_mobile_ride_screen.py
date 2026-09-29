#!/usr/bin/env python3
"""
Fix fullNativeRideModal to be a crisp, 100% full-screen mobile view:
- Fixed inset:0 z-index:99999999 background:#08090d
- Sticky Top Header with ✕ button always visible
- Middle scrollable container for Pickup/Drop, UberX, Comfort, XL cards
- Sticky Bottom Action Bar with 54px green Request button
"""

import os, re

CRISP_FULLSCREEN_MOBILE_RIDE_HTML = """
<!-- CRISP FULL-SCREEN MOBILE NATIVE RIDE HAILING ENGINE (UBER, BOLT, LYFT, DIDI, GRAB, INDRIVE) -->
<div id="fullNativeRideModal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100vw; height:100vh; z-index:99999999; background:#08090d; color:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif; flex-direction:column; overflow:hidden;">

  <!-- STICKY MOBILE TOP BAR -->
  <div style="padding:14px 18px; background:rgba(18,20,28,0.96); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-shrink:0; position:relative; z-index:100;">
    <div style="display:flex; align-items:center; gap:12px;">
      <button onclick="closeFullNativeRideModal()" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); color:#ffffff; width:36px; height:36px; border-radius:50%; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;">✕</button>
      <div>
        <div id="nrBrandTitle" style="font-family:'Bebas Neue', sans-serif; font-size:24px; letter-spacing:1px; line-height:1; color:#ffffff;">UBER EXPRESS</div>
        <div style="font-size:9px; color:#00d084; font-family:'Space Mono', monospace; font-weight:bold; letter-spacing:1px; text-transform:uppercase; margin-top:2px;">DIRECT IN-APP DISPATCH</div>
      </div>
    </div>
    <div style="background:rgba(0,208,132,0.12); border:1px solid rgba(0,208,132,0.3); padding:4px 10px; border-radius:20px; font-size:9px; color:#00d084; font-weight:700; font-family:'Space Mono', monospace; display:flex; align-items:center; gap:6px; flex-shrink:0;">
      <span style="width:6px; height:6px; border-radius:50%; background:#00d084; box-shadow:0 0 8px #00d084;"></span> LIVE DISPATCH
    </div>
  </div>

  <!-- STEP 1: ROUTE & VEHICLE SELECTION -->
  <div id="nrStepSelection" style="flex:1; display:flex; flex-direction:column; overflow-y:auto; padding:16px; -webkit-overflow-scrolling:touch;">
    
    <!-- SLEEK ROUTE MAP CARD -->
    <div style="background:linear-gradient(145deg, rgba(22,25,36,0.9), rgba(12,14,22,0.95)); border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:14px 16px; margin-bottom:14px; box-shadow:0 10px 25px rgba(0,0,0,0.5); position:relative; overflow:hidden;">
      
      <!-- PICKUP -->
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
        <div style="width:10px; height:10px; border-radius:50%; background:#00d084; box-shadow:0 0 10px #00d084; flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:8px; color:#a1a1aa; font-family:'Space Mono', monospace; text-transform:uppercase;">PICKUP LOCATION</div>
          <input type="text" id="nrPickupInput" value="Current GPS (Broad St, Victoria Island)" style="width:100%; background:transparent; border:none; color:#ffffff; font-size:12px; font-weight:600; outline:none; border-bottom:1px solid rgba(255,255,255,0.1); padding:2px 0 3px 0;">
        </div>
      </div>

      <!-- CONNECTOR LINE -->
      <div style="width:2px; height:14px; background:linear-gradient(180deg, #00d084, #ff3333); margin-left:4px; margin-top:-6px; margin-bottom:-2px;"></div>

      <!-- DESTINATION -->
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:10px; height:10px; border-radius:50%; background:#ff3333; box-shadow:0 0 10px #ff3333; flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:8px; color:#a1a1aa; font-family:'Space Mono', monospace; text-transform:uppercase;">DESTINATION</div>
          <input type="text" id="nrDropInput" value="AutoTriage Hub (Ikeja Expressway)" style="width:100%; background:transparent; border:none; color:#ffffff; font-size:12px; font-weight:600; outline:none; border-bottom:1px solid rgba(255,255,255,0.1); padding:2px 0 3px 0;">
        </div>
      </div>
    </div>

    <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono', monospace; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; font-weight:bold;">CHOOSE RIDE CATEGORY</div>

    <!-- VEHICLE CATEGORY LIST -->
    <div id="nrVehicleList" style="display:flex; flex-direction:column; gap:10px; margin-bottom:14px;">
      
      <!-- UBERX -->
      <div class="nr-v-card active" onclick="selectNrVehicle(this, 'UberX', '$12.50', '3 MINS', 'Toyota Camry')" style="background:linear-gradient(135deg, rgba(0,208,132,0.15) 0%, rgba(0,208,132,0.03) 100%); border:1.5px solid #00d084; border-radius:18px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all 0.2s;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-size:22px;">🚗</div>
          <div>
            <div style="font-weight:700; font-size:14px; color:#ffffff; line-height:1.2;">UberX</div>
            <div style="font-size:10px; color:#a1a1aa; margin-top:2px;">Fast & affordable • ⚡ 3 MINS</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'Bebas Neue', sans-serif; font-size:22px; color:#00d084; line-height:1;">$12.50</div>
          <div style="font-size:8px; color:#a1a1aa; font-family:'Space Mono', monospace; margin-top:2px;">4 SEATS</div>
        </div>
      </div>

      <!-- COMFORT -->
      <div class="nr-v-card" onclick="selectNrVehicle(this, 'Uber Comfort', '$16.80', '2 MINS', 'Honda Accord')" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:18px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all 0.2s;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; font-size:22px;">🚘</div>
          <div>
            <div style="font-weight:700; font-size:14px; color:#ffffff; line-height:1.2;">Uber Comfort</div>
            <div style="font-size:10px; color:#a1a1aa; margin-top:2px;">Premium legroom • ⚡ 2 MINS</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'Bebas Neue', sans-serif; font-size:22px; color:#ffffff; line-height:1;">$16.80</div>
          <div style="font-size:8px; color:#a1a1aa; font-family:'Space Mono', monospace; margin-top:2px;">4 SEATS</div>
        </div>
      </div>

      <!-- UBER XL -->
      <div class="nr-v-card" onclick="selectNrVehicle(this, 'Uber XL', '$24.00', '5 MINS', 'Highlander SUV')" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:18px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all 0.2s;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; font-size:22px;">🚙</div>
          <div>
            <div style="font-weight:700; font-size:14px; color:#ffffff; line-height:1.2;">Uber XL</div>
            <div style="font-size:10px; color:#a1a1aa; margin-top:2px;">Spacious SUV • ⚡ 5 MINS</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'Bebas Neue', sans-serif; font-size:22px; color:#ffffff; line-height:1;">$24.00</div>
          <div style="font-size:8px; color:#a1a1aa; font-family:'Space Mono', monospace; margin-top:2px;">6 SEATS</div>
        </div>
      </div>

    </div>

    <!-- PAYMENT CARD -->
    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:18px;">💳</span>
        <div>
          <div style="font-size:11px; font-weight:700; color:#ffffff;">Visa •••• 4921</div>
          <div style="font-size:9px; color:#00d084;">AutoTriage Pay</div>
        </div>
      </div>
      <button style="background:rgba(255,255,255,0.08); border:none; color:#ffffff; padding:5px 10px; border-radius:8px; font-size:10px; font-weight:600; cursor:pointer;">Change</button>
    </div>

    <!-- MOBILE TACTILE BOTTOM BUTTON -->
    <button id="nrRequestBtn" onclick="startNativeRideDispatch()" style="width:100%; height:52px; min-height:52px; background:linear-gradient(135deg, #00d084 0%, #059669 100%); color:#ffffff; border:none; border-radius:16px; font-family:'Space Mono', monospace; font-size:13px; font-weight:700; letter-spacing:1px; cursor:pointer; box-shadow:0 8px 24px rgba(0,208,132,0.35); text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:auto; flex-shrink:0;">
      ⚡ CONFIRM & REQUEST UBERX
    </button>

  </div>

  <!-- STEP 2: SEARCHING RADAR -->
  <div id="nrStepSearching" style="display:none; flex:1; flex-direction:column; align-items:center; justify-content:center; padding:30px; text-align:center;">
    <div style="position:relative; width:150px; height:150px; margin-bottom:24px;">
      <div style="position:absolute; inset:0; border-radius:50%; border:2px solid rgba(0,208,132,0.3); animation:pingRadar 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position:absolute; inset:22px; border-radius:50%; border:2px solid rgba(0,208,132,0.5); animation:pingRadar 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.6s;"></div>
      <div style="position:absolute; inset:40px; border-radius:50%; background:radial-gradient(circle, rgba(0,208,132,0.25) 0%, rgba(0,208,132,0.05) 100%); border:1.5px solid #00d084; display:flex; align-items:center; justify-content:center; font-size:38px; box-shadow:0 0 30px rgba(0,208,132,0.5);">
        🚖
      </div>
    </div>
    <div style="font-family:'Bebas Neue', sans-serif; font-size:30px; letter-spacing:2px; color:#ffffff; margin-bottom:4px;">CONNECTING TO DRIVERS...</div>
    <div style="font-size:11px; color:#a1a1aa; font-family:'Space Mono', monospace; max-width:260px; line-height:1.5;">Locating nearest verified driver on the Uber Live Network</div>
  </div>

  <!-- STEP 3: DRIVER ASSIGNED & TRACKING HUD -->
  <div id="nrStepAssigned" style="display:none; flex:1; flex-direction:column; overflow-y:auto; padding:16px; -webkit-overflow-scrolling:touch;">
    
    <!-- DRIVER CARD -->
    <div style="background:linear-gradient(145deg, rgba(22,25,36,0.9), rgba(12,14,22,0.95)); border:1.5px solid rgba(0,208,132,0.4); border-radius:20px; padding:16px; margin-bottom:16px; box-shadow:0 12px 30px rgba(0,208,132,0.18);">
      
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg, #00d084, #059669); display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:bold; color:#fff; box-shadow:0 4px 14px rgba(0,208,132,0.35);">
            MV
          </div>
          <div>
            <div style="font-size:16px; font-weight:700; color:#ffffff; line-height:1.2;" id="nrDriverName">Marcus Vance</div>
            <div style="font-size:11px; color:#00d084; font-weight:600; margin-top:2px;" id="nrDriverRating">⭐ 4.92 (1,420 trips)</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:8px; color:#a1a1aa; font-family:'Space Mono', monospace; text-transform:uppercase;">ETA</div>
          <div style="font-family:'Bebas Neue', sans-serif; font-size:26px; color:#00d084; line-height:1;" id="nrDriverEta">3 MINS</div>
        </div>
      </div>

      <!-- CAR DETAILS -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px; display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
        <div>
          <div style="font-size:13px; font-weight:700; color:#ffffff;" id="nrCarModel">Black Toyota Camry 2023</div>
          <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono', monospace; margin-top:2px;">UberX • Climate Control Active</div>
        </div>
        <div style="background:#ff3333; color:#ffffff; font-family:'Space Mono', monospace; font-weight:bold; font-size:12px; padding:5px 10px; border-radius:8px; letter-spacing:1px;" id="nrPlate">
          KJW-4921
        </div>
      </div>

      <!-- CALL & MESSAGE BUTTONS -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <button onclick="alert('📞 Calling driver Marcus Vance (+1 555-328-9102)...')" style="height:44px; background:rgba(0,208,132,0.18); border:1.5px solid rgba(0,208,132,0.4); color:#00d084; border-radius:12px; font-weight:700; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
          📞 Call Driver
        </button>
        <button onclick="alert('💬 Message sent to driver: Pickup point is ready!')" style="height:44px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#ffffff; border-radius:12px; font-weight:700; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
          💬 Message
        </button>
      </div>

    </div>

    <!-- LIVE DISPATCH STATUS -->
    <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:14px; text-align:center; margin-bottom:16px;">
      <div style="font-size:10px; color:#00d084; font-family:'Space Mono', monospace; text-transform:uppercase; margin-bottom:2px; font-weight:bold;">STATUS: DRIVER EN ROUTE</div>
      <div style="font-size:11px; color:#a1a1aa;" id="nrRouteText">Pickup point confirmed at Broad St, Victoria Island</div>
    </div>

    <button onclick="closeFullNativeRideModal()" style="width:100%; height:44px; min-height:44px; background:rgba(255,51,51,0.12); border:1px solid rgba(255,51,51,0.3); color:#ff3333; border-radius:12px; font-weight:600; font-size:12px; cursor:pointer; margin-top:auto; flex-shrink:0;">
      Cancel Trip
    </button>

  </div>

</div>
"""

def update_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace old fullNativeRideModal HTML with CRISP_FULLSCREEN_MOBILE_RIDE_HTML
    if 'id="fullNativeRideModal"' in content:
        content = re.sub(r'<!-- ULTRA-PREMIUM MOBILE NATIVE RIDE HAILING ENGINE.*?</div>\s*</div>\s*<style>.*?</style>', CRISP_FULLSCREEN_MOBILE_RIDE_HTML, content, flags=re.DOTALL)
        content = re.sub(r'<!-- MOBILE CONTAINER CARD -->.*?</div>\s*</div>\s*</div>', CRISP_FULLSCREEN_MOBILE_RIDE_HTML, content, flags=re.DOTALL)
        content = re.sub(r'<div id="fullNativeRideModal".*?</div>\s*</div>\s*</div>', CRISP_FULLSCREEN_MOBILE_RIDE_HTML, content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Updated crisp full-screen mobile ride view in {filepath}")

update_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
update_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
update_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
update_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")

print("Crisp full-screen mobile ride update complete!")
