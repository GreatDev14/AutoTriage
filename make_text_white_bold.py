#!/usr/bin/env python3
"""
Make brand logos, card titles ("DIAGNOSE MY CAR"), and section headings bright white and bold like Image 3.
"""

import os, re

def update_css():
    css_files = [
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\css\base.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\css\base.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\css\responsive.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\css\responsive.css"
    ]

    extra_css = """
/* BRIGHT WHITE BOLD BRAND LOGOS & CARD TITLES */
.nav-logo, .ft-logo, .preloader-name {
  color: #ffffff !important;
  font-weight: 700 !important;
  opacity: 1 !important;
}

.nav-logo span, .ft-logo span, .preloader-name span {
  color: #ffffff !important;
  font-weight: 700 !important;
  opacity: 0.95 !important;
  display: inline-block !important;
}

.mb-title {
  color: #ffffff !important;
  font-weight: 700 !important;
  text-shadow: 0 2px 8px rgba(0,0,0,0.8) !important;
}

.mb-desc {
  color: #d1d5db !important;
  font-weight: 500 !important;
}
"""

    for fpath in css_files:
        if os.path.exists(fpath):
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
            # Don't hide span on mobile
            content = content.replace('.nav-logo span { display: none; }', '.nav-logo span { display: inline-block !important; }')
            if 'BRIGHT WHITE BOLD BRAND LOGOS' not in content:
                content += "\n" + extra_css
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated CSS: {fpath}")

def update_html():
    html_files = [
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\index.html",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html"
    ]

    for fpath in html_files:
        if os.path.exists(fpath):
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Remove opacity:0.25 on TRIAGE
            content = content.replace('<span style="opacity:0.25">TRIAGE</span>', '<span style="color:#ffffff; font-weight:bold;">TRIAGE</span>')
            content = content.replace('AUTO<span>TRIAGE</span>', '<span style="color:#ffffff; font-weight:bold;">AUTO </span><span style="color:#ffffff; font-weight:bold;">TRIAGE</span>')

            # Ensure mb-title is bright white
            content = content.replace('class="mb-title">', 'class="mb-title" style="color:#ffffff !important; font-weight:bold !important;">')

            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated HTML: {fpath}")

update_css()
update_html()
print("White bold text transformation complete!")
