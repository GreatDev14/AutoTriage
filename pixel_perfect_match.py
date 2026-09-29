import re
import sys

def patch_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Skipped {filepath}: {e}")
        return

    # Bump cache
    content = re.sub(r'v=\d+\.\d+', 'v=15.0', content)

    # 1. Background color
    if ':root {' in content:
        content = re.sub(r'--bg:\s*#[0-9a-fA-F]+;', '--bg: #0d0e12;', content)
    else:
        # inject if possible
        content = content.replace('body { background:var(--bg);', 'body { background:#0d0e12;')

    # 2. Main buttons padding lock (remove media query overrides)
    # The media query @media (min-width: 480px) has `.main-btn { padding: 18px 16px; border-radius: 20px; gap: 16px; }`
    content = re.sub(r'\.main-btn\s*\{\s*padding:\s*18px\s*16px;\s*border-radius:\s*20px;\s*gap:\s*16px;\s*\}', '', content)
    # The media query @media (min-width: 768px) has `.main-btn { min-height: 140px; ... }`
    content = re.sub(r'\.main-btn\s*\{\s*min-height:\s*140px;[^\}]+\}', '', content)
    
    # Force base .main-btn padding
    content = re.sub(
        r'\.main-btn\s*\{[^}]*\}',
        r'.main-btn { display:flex; flex-direction:row; align-items:center; gap:16px; padding:12px 20px; border:1px solid rgba(255,255,255,0.05); border-radius:24px; background:#16181d; color:#ffffff; transition:all 0.3s; }',
        content,
        count=1
    )

    # 3. Logo and Header
    old_logo = r'<div class="h-logo" style="display:flex; align-items:center; gap:10px;">.*?</div>'
    new_logo = r'''<div class="h-logo" style="display:flex; align-items:center; gap:8px;">
      <img src="assets/logo-transparent.png" alt="Logo" style="height:28px; width:28px; object-fit:contain; filter:drop-shadow(0 0 8px rgba(255,51,51,0.6));">
      <span style="color:#ffffff; font-weight:bold; letter-spacing:1px;">AUTO</span><span style="color:#666666; font-weight:bold; letter-spacing:1px; margin-left:4px;">TRIAGE</span>
    </div>'''
    content = re.sub(old_logo, new_logo, content, flags=re.DOTALL)

    # Header right buttons: Image 1 has NO profile icon, just a moon and empty circle
    old_header_right = r'<div style="display:flex; align-items:center; gap:8px;">\s*<button id="headerThemeToggle".*?</button>\s*<button onclick="openProfileDrawer\(\)".*?</button>\s*</div>'
    new_header_right = r'''<div style="display:flex; align-items:center; gap:12px;">
        <button id="headerThemeToggle" onclick="themeModule.toggle()" style="background:transparent; border:none; color:#ffb03a; font-size:16px; cursor:pointer;"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg></button>
        <div style="width:36px; height:36px; border-radius:50%; border:1px solid rgba(255,255,255,0.1); background:transparent;"></div>
    </div>'''
    content = re.sub(old_header_right, new_header_right, content, flags=re.DOTALL)

    # 4. HOW CAN WE HELP text size (Make it huge like Image 1)
    content = re.sub(
        r'<div class="home-title"[^>]*>HOW CAN<br>WE HELP\?</div>',
        r'<div class="home-title" style="font-family:\'Bebas Neue\', sans-serif !important; font-size:72px !important; line-height:0.85 !important; letter-spacing:1px !important; margin-top:12px !important; color:#ffffff !important; text-shadow: 0 4px 15px rgba(0,0,0,0.5);">HOW CAN<br>WE HELP?</div>',
        content
    )
    
    # 5. GOOD DAY text spacing
    content = re.sub(
        r'<div class="home-greeting"[^>]*>.*?</div>',
        r'<div class="home-greeting" style="font-family:\'Space Mono\', monospace !important; font-size:10px !important; letter-spacing:4px !important; text-transform:uppercase !important; color:#5c6b82 !important;">GOOD DAY WHAT DO YOU NEED?</div>',
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {filepath}")

patch_file('simple.html')
patch_file('netlify_deploy/simple.html')
patch_file('css/base.css')

# Now fix JS file explicitly
def patch_js(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return
    
    # Ensure borders are exact and fonts are correct in the widgets
    pattern = r'(dash\.innerHTML = `).*?(`;)'
    new_html = r'''
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom: 24px;">
      <!-- GARAGE -->
      <div onclick="goTo('garage')" style="background:#15171c; border:1px solid rgba(255,51,51,0.25); border-radius:16px; padding:16px 12px; cursor:pointer; display:flex; flex-direction:column; gap:12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
        <div style="font-size:20px;">🚙</div>
        <div>
          <div style="font-family:'Space Mono', monospace; font-size:9px; color:#8e93a0; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">MY GARAGE</div>
          <div style="font-family:'Space Mono', monospace !important; font-size:12px; font-weight:bold; color:#ffffff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${vehName}</div>
        </div>
      </div>
      <!-- DIAGNOSES -->
      <div onclick="goTo('diagnose')" style="background:#15171c; border:1px solid rgba(45,190,96,0.25); border-radius:16px; padding:16px 12px; cursor:pointer; display:flex; flex-direction:column; gap:12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
        <div style="font-size:20px;">📋</div>
        <div>
          <div style="font-family:'Space Mono', monospace; font-size:9px; color:#8e93a0; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">DIAGNOSES</div>
          <div style="font-family:'Space Mono', monospace !important; font-size:12px; font-weight:bold; color:#ffffff;">${histCount}</div>
        </div>
      </div>
      <!-- PARTS PRICING -->
      <div onclick="goTo('parts')" style="background:#15171c; border:1px solid rgba(50,150,255,0.25); border-radius:16px; padding:16px 12px; cursor:pointer; display:flex; flex-direction:column; gap:12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
        <div style="font-size:20px;">💰</div>
        <div>
          <div style="font-family:'Space Mono', monospace; font-size:9px; color:#8e93a0; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">PARTS PRICING</div>
          <div style="font-family:'Space Mono', monospace !important; font-size:12px; font-weight:bold; color:#ffffff;">Check Prices &rarr;</div>
        </div>
      </div>
    </div>
  '''
    content = re.sub(pattern, r'\1' + new_html + r'\2', content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched JS {filepath}")

patch_js('js/features-simple.js')
patch_js('netlify_deploy/js/features-simple.js')
