#!/usr/bin/env python3
"""
Restore crisp hollow outlined TRIAGE hero title to match desktop screenshot exactly:
AUTO -> Solid bold white
TRIAGE -> Hollow transparent text with crisp -webkit-text-stroke: 1.5px rgba(255,255,255,0.5)
"""

import os, re

HOLLOW_HERO_CSS = """
/* CRISP HOLLOW HERO TRIAGE TITLE */
.hero-title {
  font-family: 'Bebas Neue', sans-serif !important;
  font-size: clamp(80px, 13vw, 200px) !important;
  line-height: 0.88 !important;
  letter-spacing: -2px !important;
  color: #ffffff !important;
}

.hero-title .out, .hero-title .outline {
  display: block !important;
  font-family: 'Bebas Neue', sans-serif !important;
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.5) !important;
  text-shadow: none !important;
  filter: none !important;
}
"""

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

            # Clean up old overrides
            content = re.sub(r'/\* NORMAL SOLID HERO TITLE.*?\*/', '', content, flags=re.DOTALL)
            content = content.replace('.hero-title .out, .hero-title .outline, .hero-title span { color: #ffffff !important; -webkit-text-stroke: none !important; text-shadow: none !important; opacity: 1 !important; }', '')

            if 'CRISP HOLLOW HERO TRIAGE TITLE' not in content:
                content += "\n" + HOLLOW_HERO_CSS

            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated CSS: {fpath}")

def update_html():
    html_files = [
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\index.html"
    ]

    for fpath in html_files:
        if os.path.exists(fpath):
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()

            content = content.replace('<h1 class="hero-title">AUTO<br>TRIAGE</h1>', '<h1 class="hero-title">AUTO<br><span class="out">TRIAGE</span></h1>')

            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated HTML: {fpath}")

update_css()
update_html()
print("Crisp hollow hero TRIAGE title restoration complete!")
