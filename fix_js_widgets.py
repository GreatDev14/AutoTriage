import re
import sys

def process_js_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        print(f"Skipped {filepath}")
        return

    # Replace the dash.innerHTML assignment in updateDashboardWidgets
    pattern = r'(dash\.innerHTML = `).*?(`;)'
    
    new_html = r'''
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom: 24px;">
      <!-- GARAGE -->
      <div onclick="goTo('garage')" style="background:rgba(20,22,30,0.5); border:1px solid rgba(255,51,51,0.15); border-radius:16px; padding:12px; cursor:pointer; display:flex; flex-direction:column; gap:12px;">
        <div style="font-size:18px;">🚙</div>
        <div>
          <div style="font-family:'Space Mono', monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">MY GARAGE</div>
          <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-size:11px; font-weight:bold; color:#ffffff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${vehName}</div>
        </div>
      </div>
      <!-- DIAGNOSES -->
      <div onclick="goTo('diagnose')" style="background:rgba(20,22,30,0.5); border:1px solid rgba(45,190,96,0.2); border-radius:16px; padding:12px; cursor:pointer; display:flex; flex-direction:column; gap:12px;">
        <div style="font-size:18px;">📋</div>
        <div>
          <div style="font-family:'Space Mono', monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">DIAGNOSES</div>
          <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-size:13px; font-weight:bold; color:#ffffff;">${histCount}</div>
        </div>
      </div>
      <!-- PARTS PRICING -->
      <div onclick="goTo('parts')" style="background:rgba(20,22,30,0.5); border:1px solid rgba(50,150,255,0.15); border-radius:16px; padding:12px; cursor:pointer; display:flex; flex-direction:column; gap:12px;">
        <div style="font-size:18px;">💰</div>
        <div>
          <div style="font-family:'Space Mono', monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">PARTS PRICING</div>
          <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-size:11px; font-weight:bold; color:#ffffff;">Check Prices &rarr;</div>
        </div>
      </div>
    </div>
  '''
    content = re.sub(pattern, r'\1' + new_html + r'\2', content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated JS in {filepath}")

process_js_file('js/features-simple.js')
process_js_file('netlify_deploy/js/features-simple.js')
