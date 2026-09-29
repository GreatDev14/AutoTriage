#!/usr/bin/env python3
import os

PREMIUM_MODAL = """<!-- PREMIUM DEEP LINK RIDE MODAL -->
<div id="deepLinkRideModal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100vw; height:100vh; z-index:99999999; flex-direction:column; justify-content:flex-end; font-family:-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif;">
  
  <!-- CINEMATIC VIDEO BACKGROUND -->
  <video src="bros_amke_the_video_a_loop.mp4" autoplay loop muted playsinline style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:1; filter:contrast(1.2) brightness(0.5);"></video>
  <div style="position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.95) 85%); z-index:2;"></div>

  <!-- GLASSMORPHIC BOTTOM SHEET -->
  <div style="width:100%; border-radius:32px 32px 0 0; padding:30px 24px; background:rgba(12, 14, 22, 0.65); backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px); border-top:1px solid rgba(255,255,255,0.15); box-shadow:0 -20px 50px rgba(0,0,0,0.8); display:flex; flex-direction:column; position:relative; z-index:10; animation:slideUpSheet 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
    
    <!-- DRAG HANDLE -->
    <div style="width:48px; height:5px; background:rgba(255,255,255,0.3); border-radius:10px; margin:0 auto 24px auto; box-shadow:0 0 10px rgba(255,255,255,0.1);"></div>

    <!-- HEADER -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px;">
      <div style="display:flex; align-items:center; gap:14px;">
        <!-- Provider Icon -->
        <div id="dlProviderIcon" style="width:52px; height:52px; border-radius:16px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:26px; box-shadow:0 8px 20px rgba(0,0,0,0.3);">
          🚘
        </div>
        <div>
          <div id="dlProviderTitle" style="font-family:'Bebas Neue', sans-serif; font-size:34px; letter-spacing:2px; line-height:1; color:#ffffff; text-shadow:0 2px 10px rgba(0,0,0,0.5);">UBER</div>
          <div style="font-size:10px; color:#00d084; font-family:'Space Mono', monospace; font-weight:bold; letter-spacing:2px; text-transform:uppercase; margin-top:4px; text-shadow:0 0 8px rgba(0,208,132,0.4);">NATIVE APP REDIRECT</div>
        </div>
      </div>
      <button onclick="closeDeepLinkModal()" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#ffffff; width:38px; height:38px; border-radius:50%; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background 0.2s;">✕</button>
    </div>

    <!-- ROUTE INPUTS (GLASS STYLE) -->
    <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:18px; margin-bottom:24px; position:relative;">
      
      <!-- PICKUP -->
      <div style="display:flex; align-items:center; gap:14px; margin-bottom:16px;">
        <div style="width:12px; height:12px; border-radius:50%; background:#00d084; box-shadow:0 0 12px #00d084; flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:9px; color:rgba(255,255,255,0.5); font-family:'Space Mono', monospace; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">PICKUP LOCATION</div>
          <input type="text" id="dlPickupInput" value="Fetching GPS..." readonly style="width:100%; background:transparent; border:none; color:#ffffff; font-size:15px; font-weight:600; outline:none;">
        </div>
      </div>

      <!-- CONNECTOR LINE -->
      <div style="position:absolute; left:23px; top:36px; bottom:36px; width:2px; background:linear-gradient(to bottom, rgba(0,208,132,0.5), rgba(255,51,51,0.5));"></div>

      <div style="height:1px; background:rgba(255,255,255,0.05); margin:0 0 16px 26px;"></div>

      <!-- DESTINATION -->
      <div style="display:flex; align-items:center; gap:14px;">
        <div style="width:12px; height:12px; border-radius:50%; background:#ff3333; box-shadow:0 0 12px #ff3333; flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:9px; color:rgba(255,255,255,0.5); font-family:'Space Mono', monospace; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">DESTINATION</div>
          <input type="text" id="dlDropInput" placeholder="Where to?" style="width:100%; background:transparent; border:none; color:#ffffff; font-size:16px; font-weight:700; outline:none; border-bottom:1px solid rgba(0,208,132,0.6); padding-bottom:4px;">
        </div>
      </div>
    </div>

    <div style="font-size:12px; color:rgba(255,255,255,0.7); line-height:1.6; margin-bottom:28px; text-align:center;">
      You will be safely redirected to <strong id="dlProviderName" style="color:#fff;">Uber</strong> to complete your booking.
    </div>

    <button id="dlActionBtn" onclick="launchRideApp()" style="width:100%; height:58px; background:linear-gradient(135deg, #00d084 0%, #059669 100%); color:#ffffff; border:none; border-radius:18px; font-family:'Space Mono', monospace; font-size:15px; font-weight:700; letter-spacing:1px; cursor:pointer; box-shadow:0 10px 30px rgba(0,208,132,0.4); text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:12px; transition:transform 0.1s;" onmousedown="this.style.transform='scale(0.97)'" onmouseup="this.style.transform='scale(1)'">
      OPEN <span id="dlBtnProvider">UBER</span> APP ↗
    </button>

  </div>
</div>

<style>
@keyframes slideUpSheet {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>

<script>
let activeProviderId = 'uber';
let activeProviderName = 'Uber';

const ICONS = {
    'uber': '⬛',
    'lyft': '🟣',
    'bolt': '⚡',
    'didi': '🟠',
    'grab': '🟢',
    'indrive': '🔵'
};

function openFullNativeRideModal(providerId, providerName) {
    activeProviderId = providerId.toLowerCase();
    activeProviderName = providerName;
    
    document.getElementById('dlProviderTitle').innerText = providerName.toUpperCase();
    document.getElementById('dlProviderName').innerText = providerName;
    document.getElementById('dlBtnProvider').innerText = providerName.toUpperCase();
    
    const icon = ICONS[activeProviderId] || '🚘';
    document.getElementById('dlProviderIcon').innerText = icon;

    // Change action button color based on provider
    const btn = document.getElementById('dlActionBtn');
    if(activeProviderId === 'uber') {
        btn.style.background = 'linear-gradient(135deg, #000000, #333333)';
        btn.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    } else if(activeProviderId === 'lyft') {
        btn.style.background = 'linear-gradient(135deg, #FF00BF, #9b0074)';
        btn.style.boxShadow = '0 10px 30px rgba(255,0,191,0.4)';
    } else if(activeProviderId === 'bolt') {
        btn.style.background = 'linear-gradient(135deg, #34D186, #059669)';
        btn.style.boxShadow = '0 10px 30px rgba(52,209,134,0.4)';
    } else if(activeProviderId === 'didi') {
        btn.style.background = 'linear-gradient(135deg, #FF6900, #c45100)';
        btn.style.boxShadow = '0 10px 30px rgba(255,105,0,0.4)';
    } else if(activeProviderId === 'grab') {
        btn.style.background = 'linear-gradient(135deg, #00B14F, #007534)';
        btn.style.boxShadow = '0 10px 30px rgba(0,177,79,0.4)';
    } else if(activeProviderId === 'indrive') {
        btn.style.background = 'linear-gradient(135deg, #00A9E0, #007a9e)';
        btn.style.boxShadow = '0 10px 30px rgba(0,169,224,0.4)';
    }

    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            document.getElementById('dlPickupInput').value = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        });
    } else {
        document.getElementById('dlPickupInput').value = `Current Location`;
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
</script>"""

def replace_deeplink_modal(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The old modal starts at <!-- DEEP LINK RIDE MODAL --> and ends after </script>
    import re
    if '<!-- DEEP LINK RIDE MODAL -->' in content:
        # We can just replace from <!-- DEEP LINK RIDE MODAL --> up to the closing </body> tag
        # since it's the very last thing in the file
        content = re.sub(r'<!-- DEEP LINK RIDE MODAL -->.*?</body>', PREMIUM_MODAL + '\n</body>', content, flags=re.DOTALL)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Redesigned Deep Link Modal in {filepath}")
    else:
        print(f"Old modal not found in {filepath}")

replace_deeplink_modal(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
replace_deeplink_modal(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
replace_deeplink_modal(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
replace_deeplink_modal(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")

print("Premium Redesign complete!")
