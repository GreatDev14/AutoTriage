#!/usr/bin/env python3
"""
1. Fix hero title: Remove hollow text stroke glitch, restore solid bold white AUTO TRIAGE title.
2. Fix mobile slowness/lag: Disable heavy canvas particle loops & SVG animations on mobile (< 768px).
"""

import os, re

def update_js():
    js_files = [
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\js\effects.js",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\js\effects.js"
    ]
    for fpath in js_files:
        if os.path.exists(fpath):
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Skip heavy canvas & animations on mobile for max speed & zero lag
            content = content.replace(
                "// Allowed on mobile",
                "if (window.innerWidth < 768) return; // Skip heavy animations on mobile for speed"
            )

            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated JS performance: {fpath}")

def update_css():
    css_files = [
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\css\hero.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\css\hero.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\css\effects.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\css\effects.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\css\base.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\css\base.css"
    ]

    for fpath in css_files:
        if os.path.exists(fpath):
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Remove hollow text stroke glitches
            content = re.sub(r'/\* HOLLOW HERO TRIAGE TITLE.*?\*/', '', content, flags=re.DOTALL)
            content = content.replace(".hero-title .outline { -webkit-text-stroke:1px var(--border); color:transparent; }", ".hero-title .outline { color: var(--fg) !important; -webkit-text-stroke: none !important; }")
            content = content.replace(".hero-title .out, .hero-title .outline {", ".hero-title .out, .hero-title .outline { color: var(--fg) !important; -webkit-text-stroke: none !important; text-shadow: none !important; } /*")

            # Solid normal title CSS
            solid_title_css = """
/* NORMAL SOLID HERO TITLE FOR ZERO GLITCH & FAST PERFORMANCE */
.hero-title {
  color: #ffffff !important;
  font-weight: 700 !important;
  text-shadow: none !important;
}
.hero-title .out, .hero-title .outline, .hero-title span {
  color: #ffffff !important;
  -webkit-text-stroke: none !important;
  text-shadow: none !important;
  opacity: 1 !important;
}

/* Hide heavy SVG ECG on mobile to prevent scrolling lag */
@media screen and (max-width: 768px) {
  #ecg-container, .hero-scanline {
    display: none !important;
  }
}
"""
            if 'NORMAL SOLID HERO TITLE FOR ZERO GLITCH' not in content:
                content += "\n" + solid_title_css

            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated CSS performance & title: {fpath}")

def update_html():
    html_files = [
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\index.html"
    ]

    for fpath in html_files:
        if os.path.exists(fpath):
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Ensure clean solid hero title
            content = content.replace('<h1 class="hero-title">AUTO<br><span class="out">TRIAGE</span></h1>', '<h1 class="hero-title">AUTO<br>TRIAGE</h1>')

            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated HTML: {fpath}")

update_js()
update_css()
update_html()
print("Performance optimization and title glitch fix complete!")
