#!/usr/bin/env python3
"""
Redesign Full Native In-App Ride Hailing Interface for simple.html (Mobile App) with ultra-sleek iOS/Android aesthetics:
- Glassmorphism bottom sheet feel with drag handle
- Dynamic mini route map header
- Glowing vehicle category cards with high-contrast typography
- Tactile 56px touch targets optimized for mobile screens
- Sonar radar animations and driver tracking HUD
"""

import os, re

MOBILE_REDESIGN_RIDE_HTML = """
<!-- ULTRA-PREMIUM MOBILE NATIVE RIDE HAILING ENGINE (UBER, BOLT, LYFT, DIDI, GRAB, INDRIVE) -->
<div id="fullNativeRideModal" style="display:none; position:fixed; inset:0; z-index:999999; background:rgba(6,7,10,0.96); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); color:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif; flex-direction:column; overflow:hidden; animation:slideUpRide 0.3s cubic-bezier(0.16, 1, 0.3, 1);">

  <!-- MOBILE TOP BAR WITH DRAG HANDLE -->
  <div style="padding:12px 20px 8px; background:linear-gradient(180deg, rgba(18,20,28,0.9) 0%, rgba(10,11,16,0.6) 100%); border-bottom:1px solid rgba(255,255,255,0.06); position:relative; z-index:10; flex-shrink:0;">
    <div style="width:38px; height:5px; background:rgba(255,255,255,0.22); border-radius:10px; margin:0 auto 12px;"></div>
    
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; align-items:center; gap:12px;">
        <button onclick="closeFullNativeRideModal()" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); color:#ffffff; width:38px; height:38px; border-radius:50%; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; active:scale(0.95); transition:transform 0.1s;">✕</button>
        <div>
          <div id="nrBrandTitle" style="font-family:'Bebas Neue', sans-serif; font-size:26px; letter-spacing:1px; line-height:1; color:#ffffff;">UBER EXPRESS</div>
          <div style="font-size:9px; color:#00d084; font-family:'Space Mono', monospace; font-weight:bold; letter-spacing:1px; text-transform:uppercase; margin-top:2px;">DIRECT IN-APP DISPATCH</div>
        </div>
      </div>
      <div style="background:rgba(0,208,132,0.12); border:1px solid rgba(0,208,132,0.3); padding:5px 12px; border-radius:20px; font-size:10px; color:#00d084; font-weight:700; font-family:'Space Mono', monospace; display:flex; align-items:center; gap:6px;">
        <span style="width:7px; height:7px; border-radius:50%; background:#00d084; box-shadow:0 0 8px #00d084; animation:pulseDot 1.5s infinite;"></span> DISPATCH ACTIVE
      </div>
    </div>
  </div>

  <!-- STEP 1: ROUTE & VEHICLE SELECTION -->
  <div id="nrStepSelection" style="flex:1; display:flex; flex-direction:column; overflow-y:auto; padding:16px 20px 24px; -webkit-overflow-scrolling:touch;">
    
    <!-- SLEEK MINI ROUTE MAP CARD -->
    <div style="background:linear-gradient(145deg, rgba(22,25,36,0.8), rgba(12,14,22,0.9)); border:1px solid rgba(255,255,255,0.1); border-radius:22px; padding:16px; margin-bottom:18px; box-shadow:0 12px 35px rgba(0,0,0,0.6); position:relative; overflow:hidden;">
      <div style="position:absolute; right:-20px; top:-20px; width:120px; height:120px; background:radial-gradient(circle, rgba(0,208,132,0.12) 0%, transparent 70%); pointer-events:none;"></div>
      
      <!-- PICKUP -->
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
        <div style="width:12px; height:12px; border-radius:50%; background:#00d084; box-shadow:0 0 12px #00d084; flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono', monospace; text-transform:uppercase; letter-spacing:0.5px;">PICKUP LOCATION</div>
          <input type="text" id="nrPickupInput" value="Current GPS (Broad St, Victoria Island)" style="width:100%; background:transparent; border:none; color:#ffffff; font-size:13px; font-weight:600; outline:none; border-bottom:1px solid rgba(255,255,255,0.12); padding:3px 0 4px 0;">
        </div>
      </div>

      <!-- CONNECTOR LINE -->
      <div style="width:2px; height:18px; background:linear-gradient(180deg, #00d084, #ff3333); margin-left:5px; margin-top:-6px; margin-bottom:-2px;"></div>

      <!-- DESTINATION -->
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:12px; height:12px; border-radius:50%; background:#ff3333; box-shadow:0 0 12px #ff3333; flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono', monospace; text-transform:uppercase; letter-spacing:0.5px;">DESTINATION</div>
          <input type="text" id="nrDropInput" value="AutoTriage Hub (Ikeja Expressway)" style="width:100%; background:transparent; border:none; color:#ffffff; font-size:13px; font-weight:600; outline:none; border-bottom:1px solid rgba(255,255,255,0.12); padding:3px 0 4px 0;">
        </div>
      </div>
    </div>

    <div style="font-size:10px; color:#a1a1aa; font-family:'Space Mono', monospace; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; font-weight:bold;">CHOOSE RIDE CATEGORY</div>

    <!-- VEHICLE CATEGORY LIST -->
    <div id="nrVehicleList" style="display:flex; flex-direction:column; gap:10px; margin-bottom:18px;">
      
      <!-- UBERX -->
      <div class="nr-v-card active" onclick="selectNrVehicle(this, 'UberX', '$12.50', '3 MINS', 'Toyota Camry')" style="background:linear-gradient(135deg, rgba(0,208,132,0.15) 0%, rgba(0,208,132,0.03) 100%); border:1.5px solid #00d084; border-radius:20px; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all 0.2s; box-shadow:0 6px 20px rgba(0,208,132,0.12);">
        <div style="display:flex; align-items:center; gap:14px;">
          <div style="width:46px; height:46px; border-radius:14px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:center; font-size:26px;">🚗</div>
          <div>
            <div style="font-weight:700; font-size:15px; color:#ffffff; line-height:1.2;">UberX</div>
            <div style="font-size:11px; color:#a1a1aa; margin-top:2px;">Fast & affordable • ⚡ 3 MINS</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'Bebas Neue', sans-serif; font-size:24px; color:#00d084; line-height:1;">$12.50</div>
          <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono', monospace; margin-top:2px;">4 SEATS</div>
        </div>
      </div>

      <!-- COMFORT -->
      <div class="nr-v-card" onclick="selectNrVehicle(this, 'Uber Comfort', '$16.80', '2 MINS', 'Honda Accord')" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all 0.2s;">
        <div style="display:flex; align-items:center; gap:14px;">
          <div style="width:46px; height:46px; border-radius:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; font-size:26px;">🚘</div>
          <div>
            <div style="font-weight:700; font-size:15px; color:#ffffff; line-height:1.2;">Uber Comfort</div>
            <div style="font-size:11px; color:#a1a1aa; margin-top:2px;">Premium legroom • ⚡ 2 MINS</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'Bebas Neue', sans-serif; font-size:24px; color:#ffffff; line-height:1;">$16.80</div>
          <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono', monospace; margin-top:2px;">4 SEATS</div>
        </div>
      </div>

      <!-- UBER XL -->
      <div class="nr-v-card" onclick="selectNrVehicle(this, 'Uber XL', '$24.00', '5 MINS', 'Highlander SUV')" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all 0.2s;">
        <div style="display:flex; align-items:center; gap:14px;">
          <div style="width:46px; height:46px; border-radius:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; font-size:26px;">🚙</div>
          <div>
            <div style="font-weight:700; font-size:15px; color:#ffffff; line-height:1.2;">Uber XL</div>
            <div style="font-size:11px; color:#a1a1aa; margin-top:2px;">Spacious SUV • ⚡ 5 MINS</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:'Bebas Neue', sans-serif; font-size:24px; color:#ffffff; line-height:1;">$24.00</div>
          <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono', monospace; margin-top:2px;">6 SEATS</div>
        </div>
      </div>

    </div>

    <!-- PAYMENT CARD -->
    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:20px;">💳</span>
        <div>
          <div style="font-size:12px; font-weight:700; color:#ffffff;">Visa •••• 4921</div>
          <div style="font-size:10px; color:#00d084;">AutoTriage Pay</div>
        </div>
      </div>
      <button style="background:rgba(255,255,255,0.08); border:none; color:#ffffff; padding:6px 12px; border-radius:10px; font-size:11px; font-weight:600; cursor:pointer;">Change</button>
    </div>

    <!-- MOBILE TACTILE BOTTOM BUTTON -->
    <button id="nrRequestBtn" onclick="startNativeRideDispatch()" style="width:100%; height:56px; background:linear-gradient(135deg, #00d084 0%, #059669 100%); color:#ffffff; border:none; border-radius:18px; font-family:'Space Mono', monospace; font-size:14px; font-weight:700; letter-spacing:1px; cursor:pointer; box-shadow:0 10px 28px rgba(0,208,132,0.35); text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:10px; margin-top:auto;">
      ⚡ CONFIRM & REQUEST UBERX
    </button>

  </div>

  <!-- STEP 2: SEARCHING RADAR -->
  <div id="nrStepSearching" style="display:none; flex:1; flex-direction:column; align-items:center; justify-content:center; padding:30px; text-align:center;">
    <div style="position:relative; width:170px; height:170px; margin-bottom:28px;">
      <div style="position:absolute; inset:0; border-radius:50%; border:2px solid rgba(0,208,132,0.3); animation:pingRadar 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position:absolute; inset:25px; border-radius:50%; border:2px solid rgba(0,208,132,0.5); animation:pingRadar 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.6s;"></div>
      <div style="position:absolute; inset:45px; border-radius:50%; background:radial-gradient(circle, rgba(0,208,132,0.25) 0%, rgba(0,208,132,0.05) 100%); border:1.5px solid #00d084; display:flex; align-items:center; justify-content:center; font-size:44px; box-shadow:0 0 35px rgba(0,208,132,0.5);">
        🚖
      </div>
    </div>
    <div style="font-family:'Bebas Neue', sans-serif; font-size:34px; letter-spacing:2px; color:#ffffff; margin-bottom:6px;">CONNECTING TO DRIVERS...</div>
    <div style="font-size:12px; color:#a1a1aa; font-family:'Space Mono', monospace; max-width:280px; line-height:1.5;">Locating nearest verified driver on the Uber Live Network</div>
  </div>

  <!-- STEP 3: DRIVER ASSIGNED & TRACKING HUD -->
  <div id="nrStepAssigned" style="display:none; flex:1; flex-direction:column; overflow-y:auto; padding:20px; -webkit-overflow-scrolling:touch;">
    
    <!-- DRIVER CARD -->
    <div style="background:linear-gradient(145deg, rgba(22,25,36,0.9), rgba(12,14,22,0.95)); border:1.5px solid rgba(0,208,132,0.4); border-radius:24px; padding:20px; margin-bottom:18px; box-shadow:0 15px 40px rgba(0,208,132,0.18);">
      
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="display:flex; align-items:center; gap:14px;">
          <div style="width:56px; height:56px; border-radius:50%; background:linear-gradient(135deg, #00d084, #059669); display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:bold; color:#fff; box-shadow:0 6px 18px rgba(0,208,132,0.35);">
            MV
          </div>
          <div>
            <div style="font-size:18px; font-weight:700; color:#ffffff; line-height:1.2;" id="nrDriverName">Marcus Vance</div>
            <div style="font-size:12px; color:#00d084; font-weight:600; margin-top:2px;" id="nrDriverRating">⭐ 4.92 (1,420 trips)</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono', monospace; text-transform:uppercase;">ETA</div>
          <div style="font-family:'Bebas Neue', sans-serif; font-size:30px; color:#00d084; line-height:1;" id="nrDriverEta">3 MINS</div>
        </div>
      </div>

      <!-- CAR DETAILS -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:14px; display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
        <div>
          <div style="font-size:14px; font-weight:700; color:#ffffff;" id="nrCarModel">Black Toyota Camry 2023</div>
          <div style="font-size:10px; color:#a1a1aa; font-family:'Space Mono', monospace; margin-top:2px;">UberX • Climate Control Active</div>
        </div>
        <div style="background:#ff3333; color:#ffffff; font-family:'Space Mono', monospace; font-weight:bold; font-size:13px; padding:6px 12px; border-radius:10px; letter-spacing:1px; box-shadow:0 4px 12px rgba(255,51,51,0.3);" id="nrPlate">
          KJW-4921
        </div>
      </div>

      <!-- CALL & MESSAGE BUTTONS -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <button onclick="alert('📞 Calling driver Marcus Vance (+1 555-328-9102)...')" style="height:48px; background:rgba(0,208,132,0.18); border:1.5px solid rgba(0,208,132,0.4); color:#00d084; border-radius:14px; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
          📞 Call Driver
        </button>
        <button onclick="alert('💬 Message sent to driver: Pickup point is ready!')" style="height:48px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#ffffff; border-radius:14px; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
          💬 Message
        </button>
      </div>

    </div>

    <!-- LIVE DISPATCH STATUS -->
    <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:18px; padding:16px; text-align:center; margin-bottom:18px;">
      <div style="font-size:11px; color:#00d084; font-family:'Space Mono', monospace; text-transform:uppercase; margin-bottom:4px; font-weight:bold;">STATUS: DRIVER EN ROUTE</div>
      <div style="font-size:12px; color:#a1a1aa;" id="nrRouteText">Pickup point confirmed at Broad St, Victoria Island</div>
    </div>

    <button onclick="closeFullNativeRideModal()" style="width:100%; height:48px; background:rgba(255,51,51,0.12); border:1px solid rgba(255,51,51,0.3); color:#ff3333; border-radius:14px; font-weight:600; font-size:13px; cursor:pointer; margin-top:auto;">
      Cancel Trip
    </button>

  </div>

</div>

<style>
@keyframes slideUpRide {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes pulseDot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@keyframes pingRadar {
  0% { transform: scale(0.7); opacity: 0.8; }
  100% { transform: scale(1.6); opacity: 0; }
}
.nr-v-card.active {
  background: linear-gradient(135deg, rgba(0,208,132,0.15) 0%, rgba(0,208,132,0.03) 100%) !important;
  border-color: #00d084 !important;
}
</style>
"""

def update_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace old fullNativeRideModal HTML with redesigned MOBILE_REDESIGN_RIDE_HTML
    if 'id="fullNativeRideModal"' in content:
        content = re.sub(r'<!-- FULL NATIVE IN-APP RIDE HAILING ENGINE.*?</div>\s*</div>\s*<style>.*?</style>', MOBILE_REDESIGN_RIDE_HTML, content, flags=re.DOTALL)

    if 'fullNativeRideModal' not in content:
        if '</body>' in content:
            content = content.replace('</body>', MOBILE_REDESIGN_RIDE_HTML + '\n</body>')
        else:
            content += '\n' + MOBILE_REDESIGN_RIDE_HTML

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Redesigned mobile ride hailing interface in {filepath}")

update_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
update_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
update_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
update_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")

print("Mobile ride UI redesign complete!")
