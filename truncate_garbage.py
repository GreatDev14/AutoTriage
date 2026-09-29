#!/usr/bin/env python3
import os

DEEP_LINK_MODAL_HTML = """
<!-- DEEP LINK RIDE MODAL -->
<div id="deepLinkRideModal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100vw; height:100vh; z-index:99999999; background:rgba(8,9,13,0.95); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); color:#ffffff; font-family:-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif; flex-direction:column; justify-content:flex-end;">

  <!-- MODAL BOTTOM SHEET -->
  <div style="background:#12141c; width:100%; border-radius:24px 24px 0 0; padding:24px; box-shadow:0 -10px 40px rgba(0,0,0,0.5); display:flex; flex-direction:column; position:relative; border-top:1px solid rgba(255,255,255,0.1); animation: slideUp 0.3s ease-out;">
    
    <!-- DRAG HANDLE -->
    <div style="width:40px; height:4px; background:rgba(255,255,255,0.2); border-radius:4px; margin:0 auto 20px auto;"></div>

    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <div>
        <div id="dlProviderTitle" style="font-family:'Bebas Neue', sans-serif; font-size:28px; letter-spacing:1px; line-height:1; color:#ffffff;">UBER</div>
        <div style="font-size:10px; color:#00d084; font-family:'Space Mono', monospace; font-weight:bold; letter-spacing:1px; text-transform:uppercase; margin-top:4px;">EXTERNAL APP REDIRECT</div>
      </div>
      <button onclick="closeDeepLinkModal()" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); color:#ffffff; width:36px; height:36px; border-radius:50%; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;">✕</button>
    </div>

    <!-- ROUTE INPUTS -->
    <div style="background:linear-gradient(145deg, rgba(22,25,36,0.9), rgba(12,14,22,0.95)); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:16px; margin-bottom:20px;">
      
      <!-- PICKUP -->
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
        <div style="width:10px; height:10px; border-radius:50%; background:#00d084; box-shadow:0 0 10px #00d084; flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono', monospace; text-transform:uppercase;">PICKUP (Current Location)</div>
          <input type="text" id="dlPickupInput" value="My Current GPS Location" readonly style="width:100%; background:transparent; border:none; color:#ffffff; font-size:14px; font-weight:600; outline:none; border-bottom:1px solid rgba(255,255,255,0.1); padding:4px 0;">
        </div>
      </div>

      <!-- DESTINATION -->
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:10px; height:10px; border-radius:50%; background:#ff3333; box-shadow:0 0 10px #ff3333; flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:9px; color:#a1a1aa; font-family:'Space Mono', monospace; text-transform:uppercase;">DESTINATION</div>
          <input type="text" id="dlDropInput" placeholder="Where to?" style="width:100%; background:transparent; border:none; color:#ffffff; font-size:14px; font-weight:600; outline:none; border-bottom:1px solid rgba(0,208,132,0.5); padding:4px 0;">
        </div>
      </div>
    </div>

    <div style="font-size:11px; color:#a1a1aa; line-height:1.5; margin-bottom:24px; text-align:center;">
      You will be redirected to the <strong id="dlProviderName" style="color:#fff;">Uber</strong> app to complete your booking and payment. Once your ride is complete, you can return to AutoTriage.
    </div>

    <button id="dlActionBtn" onclick="launchRideApp()" style="width:100%; height:54px; background:linear-gradient(135deg, #00d084 0%, #059669 100%); color:#ffffff; border:none; border-radius:16px; font-family:'Space Mono', monospace; font-size:14px; font-weight:700; letter-spacing:1px; cursor:pointer; box-shadow:0 8px 24px rgba(0,208,132,0.35); text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:10px;">
      OPEN <span id="dlBtnProvider">UBER</span> APP ↗
    </button>

  </div>
</div>

<style>
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>

<script>
let activeProviderId = 'uber';
let activeProviderName = 'Uber';

function openFullNativeRideModal(providerId, providerName) {
    activeProviderId = providerId.toLowerCase();
    activeProviderName = providerName;
    
    document.getElementById('dlProviderTitle').innerText = providerName.toUpperCase();
    document.getElementById('dlProviderName').innerText = providerName;
    document.getElementById('dlBtnProvider').innerText = providerName.toUpperCase();
    
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.getElementById('dlPickupInput').value = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        });
    }

    const modal = document.getElementById('deepLinkRideModal');
    modal.style.display = 'flex';
}

function closeDeepLinkModal() {
    document.getElementById('deepLinkRideModal').style.display = 'none';
}

function launchRideApp() {
    const pickup = encodeURIComponent(document.getElementById('dlPickupInput').value || 'my_location');
    const dropoff = encodeURIComponent(document.getElementById('dlDropInput').value || '');
    
    let deepLink = '';
    
    if(activeProviderId === 'uber') {
        deepLink = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${dropoff}`;
    } else if(activeProviderId === 'bolt') {
        deepLink = `https://bolt.eu/ride?action=setPickup&pickup=my_location&dropoff=${dropoff}`;
    } else if(activeProviderId === 'lyft') {
        deepLink = `https://lyft.com/ride?id=lyft&pickup[latitude]=my_location&destination[formatted_address]=${dropoff}`;
    } else if(activeProviderId === 'didi') {
        deepLink = `https://global.didiglobal.com/ride?pickup=my_location&dropoff=${dropoff}`;
    } else if(activeProviderId === 'grab') {
        deepLink = `grab://open?screenType=BOOKING&pickup=my_location&dropoff=${dropoff}`;
    } else if(activeProviderId === 'indrive') {
        deepLink = `indriver://book?pickup=my_location&dropoff=${dropoff}`;
    } else {
        deepLink = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${dropoff}`;
    }
    
    closeDeepLinkModal();
    window.location.href = deepLink;
}
</script>
</body>
</html>
"""

def force_truncate_and_clean(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The absolute last valid code in the file is the emLiveCoords script
    # Let's find the string: coordsEl.innerText = "GPS DENIED";
    gps_denied_idx = content.find('coordsEl.innerText = "GPS DENIED";')
    
    if gps_denied_idx != -1:
        # Find the </script> tag right after this
        end_script_idx = content.find('</script>', gps_denied_idx)
        if end_script_idx != -1:
            valid_end_idx = end_script_idx + len('</script>')
            
            # TRUNCATE EVERYTHING AFTER THIS!
            clean_content = content[:valid_end_idx]
            
            # Append the deep link modal and the closing body tags
            clean_content += '\n\n' + DEEP_LINK_MODAL_HTML
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(clean_content)
            
            print(f"TRUNCATED {len(content) - valid_end_idx} bytes of garbage from {filepath}")
            return
            
    print(f"Could not find anchor in {filepath}")

force_truncate_and_clean(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
force_truncate_and_clean(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
force_truncate_and_clean(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
force_truncate_and_clean(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")

print("The DOM has been sanitized!")
