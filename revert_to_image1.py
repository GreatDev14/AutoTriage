import re
import sys

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return

    # 1. Top Padding Revert
    content = re.sub(
        r'\.home-top \{ padding:24px 24px 12px; text-align:left; \}',
        r'.home-top { padding:40px 24px 24px; text-align:left; }',
        content
    )

    # 2. Main buttons Premium Tiles revert
    content = re.sub(
        r'\.main-buttons \{ display:flex; flex-direction:column; gap:10px; padding:8px 24px 90px; \}',
        r'.main-buttons { display:flex; flex-direction:column; gap:12px; padding:12px 24px 120px; }',
        content
    )
    content = re.sub(
        r'\.main-btn \{\s*display:flex; flex-direction:row; align-items:center; gap:14px;\s*padding:14px 16px; border:1px solid var\(--border\); border-radius: 20px;',
        r'.main-btn {\n      display:flex; flex-direction:row; align-items:center; gap:16px;\n      padding:16px 20px; border:1px solid var(--border); border-radius: 20px;',
        content
    )

    # 3. Bottom Nav Revert
    old_nav_css = r'''    /\* FLOATING BOTTOM NAV - PREMIUM \*/
    \.bottom-nav \{
      position:fixed; bottom:20px; left:20px; right:20px; z-index:100;
      background: rgba\(15,16,20,0\.85\); backdrop-filter: blur\(20px\);
      border: 1px solid rgba\(255,255,255,0\.08\); border-radius: 30px;
      display:grid; grid-template-columns:repeat\(6,1fr\); padding: 8px 6px;
      box-shadow: 0 20px 40px rgba\(0,0,0,0\.8\);
      top: auto; height: auto;
    \}
    \.nav-tab \{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; padding:6px 2px; border:none; background:transparent; color:#8e93a0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:10px; font-weight: 600; transition:all 0\.3s cubic-bezier\(0\.4, 0, 0\.2, 1\); cursor:pointer; border-radius:18px; \}
    \.nav-tab\.active \{ color:#ffffff; background:rgba\(255,255,255,0\.05\); \}
    \.nav-tab-icon \{ display:flex; align-items:center; justify-content:center; transition: transform 0\.3s cubic-bezier\(0\.34, 1\.56, 0\.64, 1\); color:#8e93a0; \}
    \.nav-tab\.active \.nav-tab-icon \{ transform: translateY\(-2px\) scale\(1\.1\); color: var\(--accent\); filter: drop-shadow\(0 4px 8px rgba\(255,51,51,0\.5\)\); \}
    \.nav-tab svg \{ width:24px; height:24px; fill:currentColor; \}
    
    \.nav-indicator \{ position: absolute; bottom: -2px; left: 50%; transform: translateX\(-50%\) scale\(0\); width: 16px; height: 3px; border-radius: 2px; background: var\(--accent\); transition: all 0\.3s; opacity: 0; \}
    \.nav-tab\.active \.nav-indicator \{ transform: translateX\(-50%\) scale\(1\); opacity: 1; \}'''

    new_nav_css = '''    /* BOTTOM NAV */
    .bottom-nav {
      position:fixed; bottom:0px; left:0px; right:0px; z-index:100;
      background: var(--bg); /* Keep background to prevent content scrolling behind it */
      border-top: 1px solid rgba(255,255,255,0.03);
      backdrop-filter: blur(20px);
      background: rgba(10, 10, 12, 0.85);
      display:grid; grid-template-columns:repeat(6,1fr); padding: 12px 6px calc(env(safe-area-inset-bottom) + 8px);
      top: auto; height: auto;
    }
    .nav-tab { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:4px 2px; border:none; background:transparent; color:#8e93a0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:10px; font-weight: 500; transition:all 0.3s; cursor:pointer; }
    .nav-tab.active { color:var(--accent); } /* AutoTriage Red */
    .nav-tab-icon { display:flex; align-items:center; justify-content:center; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .nav-tab.active .nav-tab-icon { transform: translateY(-2px) scale(1.1); color: var(--accent); }
    .nav-tab svg { width:24px; height:24px; fill:currentColor; }
    
    .nav-indicator { position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%) scale(0); width: 4px; height: 4px; border-radius: 50%; background: var(--fg); transition: all 0.3s; opacity: 0; }
    .nav-tab.active .nav-indicator { transform: translateX(-50%) scale(1); opacity: 1; }'''

    content = re.sub(old_nav_css, new_nav_css, content)

    # 4. Header Logo Revert
    old_logo_html = r'''<div style="display:flex; align-items:center; gap:12px;">
    <div class="h-logo" style="display:flex; align-items:center; gap:8px;">
      <img src="assets/logo-transparent.png" alt="Logo" style="height:36px; width:36px; object-fit:contain; filter:drop-shadow\(0 0 8px rgba\(255,51,51,0\.4\)\); margin-top:-2px;">
      <span style="color:#ffffff; font-weight:bold; letter-spacing:1px;">AUTO</span><span style="color:var\(--accent, #ff3b3b\); font-weight:bold; letter-spacing:1px; margin-left:4px;">TRIAGE</span>
    </div>
  </div>'''

    new_logo_html = '''<div style="display:flex; align-items:center; gap:10px;">
    <div class="h-logo" style="display:flex; align-items:center; gap:10px;">
      <img src="assets/logo-transparent.png" alt="Logo" style="height:40px; width:40px; object-fit:contain; filter:drop-shadow(0 0 8px rgba(255,51,51,0.4)); margin-top:-2px;">
      <span style="color:#ffffff; font-weight:bold;">AUTO </span><span style="color:var(--subtext, #666); font-weight:bold;">TRIAGE</span>
    </div>
  </div>'''

    content = re.sub(old_logo_html, new_logo_html, content)

    # 5. Dashboard Widgets Grid Revert
    content = re.sub(
        r'<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom: 12px;">',
        r'<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom: 24px;">',
        content
    )

    # Garage Font Revert
    content = re.sub(
        r'<div style="font-family:\'Bebas Neue\', sans-serif !important; font-size:18px; letter-spacing:1px; color:#ffffff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">No Vehicle Set</div>',
        r'<div style="font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif !important; font-size:11px; font-weight:bold; color:#ffffff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">No Vehicle Set</div>',
        content
    )

    # Diagnoses Font Revert
    content = re.sub(
        r'<div style="font-family:\'Bebas Neue\', sans-serif !important; font-size:20px; letter-spacing:1px; color:#ffffff;">0</div>',
        r'<div style="font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif !important; font-size:13px; font-weight:bold; color:#ffffff;">0</div>',
        content
    )

    # Parts Pricing Widget Font Revert
    content = re.sub(
        r'<div style="font-family:\'Bebas Neue\', sans-serif !important; font-size:16px; letter-spacing:1px; color:#ffffff;">Check Prices &rarr;</div>',
        r'<div style="font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif !important; font-size:11px; font-weight:bold; color:#ffffff;">Check Prices &rarr;</div>',
        content
    )

    content = re.sub(
        r'<div style="font-family:\'Space Mono\', monospace; font-size:9px; color:rgba\(255,255,255,0\.8\); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">PARTS PRICING</div>',
        r'<div style="font-family:\'Space Mono\', monospace; font-size:9px; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">PARTS PRICING</div>',
        content
    )

    content = re.sub(
        r'box-shadow: 0 4px 15px rgba\(50,150,255,0\.05\);',
        r'',
        content
    )
    content = re.sub(
        r'border:1px solid rgba\(50,150,255,0\.3\)',
        r'border:1px solid rgba(50,150,255,0.15)',
        content
    )

    # 6. Remove Parts Pricing Main Button entirely
    parts_btn_regex = r'\s*<button class="main-btn" onclick="goTo\(\'parts\'\)">\s*<div class="mb-icon-wrap"><svg[^>]+><path[^>]+/><path[^>]+/></svg></div>\s*<div class="mb-bottom">\s*<div class="mb-title"[^>]+>PARTS<br>PRICING</div>\s*<div class="mb-desc"[^>]+>Check parts prices &middot; Local stores</div>\s*</div>\s*</button>'
    content = re.sub(parts_btn_regex, '', content)

    # 7. Preloader Revert
    content = re.sub(
        r'<div class="preloader-name"><span style="color:#ffffff; font-weight:bold; letter-spacing:1px;">AUTO</span><span style="color:var\(--accent, #ff3b3b\); font-weight:bold; letter-spacing:1px; margin-left:4px;">TRIAGE</span></div>',
        r'<div class="preloader-name"><span style="color:#ffffff; font-weight:bold;">AUTO </span><span style="color:var(--subtext, #666); font-weight:bold;">TRIAGE</span></div>',
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed {filepath}")

process_file('simple.html')
process_file('netlify_deploy/simple.html')
