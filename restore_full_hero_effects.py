#!/usr/bin/env python3
"""
Restore full Hero pulse effects, ECG red heartbeat line, particle constellation, and hollow TRIAGE title on mobile to match user screenshot exactly.
"""

import os, re

def update_effects_js(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Enable canvas & ECG on mobile
    content = content.replace("if (window.innerWidth < 768) return;", "// Allowed on mobile")
    content = content.replace("if (window.innerWidth < 768) return; // Skip ECG on mobile", "// Allowed on mobile")
    content = content.replace("if (window.innerWidth < 768) return; // Skip scanline on mobile", "// Allowed on mobile")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Updated JS: {filepath}")

def update_effects_css(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Make ECG wave line bright glowing red & visible on mobile
    old_ecg_path = """.ecg-path {
  fill: none;
  stroke: #e63946;
  stroke-width: 1.5;
  opacity: 0.4;
}"""

    new_ecg_path = """.ecg-path {
  fill: none;
  stroke: #ff3333 !important;
  stroke-width: 2.5 !important;
  opacity: 0.9 !important;
  filter: drop-shadow(0 0 10px rgba(255,51,51,0.8)) !important;
}"""

    if old_ecg_path in content:
        content = content.replace(old_ecg_path, new_ecg_path)
    else:
        content += "\n" + new_ecg_path

    # Hollow TRIAGE in Hero Title matching screenshot
    hollow_title_css = """
/* HOLLOW HERO TRIAGE TITLE & ECG PULSE LINE */
.hero-title .out, .hero-title .outline {
  color: transparent !important;
  -webkit-text-stroke: 1.5px rgba(255,255,255,0.85) !important;
  text-shadow: 0 0 15px rgba(255,255,255,0.2) !important;
}

#ecg-container {
  display: block !important;
  position: absolute !important;
  bottom: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 120px !important;
  z-index: 5 !important;
  pointer-events: none !important;
  overflow: hidden !important;
}
"""

    if 'HOLLOW HERO TRIAGE TITLE' not in content:
        content += "\n" + hollow_title_css

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Updated CSS: {filepath}")

def update_html(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Ensure hero title uses span class="out" TRIAGE
    content = content.replace('AUTO<br><span class="out">TRIAGE</span>', 'AUTO<br><span class="out">TRIAGE</span>')
    content = content.replace('AUTO<br><span>TRIAGE</span>', 'AUTO<br><span class="out">TRIAGE</span>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Updated HTML: {filepath}")

update_effects_js(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\js\effects.js")
update_effects_js(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\js\effects.js")

update_effects_css(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\css\effects.css")
update_effects_css(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\css\effects.css")

update_html(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html")
update_html(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\index.html")

print("Full hero pulse effects restoration complete!")
