#!/usr/bin/env python3
"""
Fix TRIAGE red color in navbar logo:
Remove overriding color: #ffffff !important on .nav-logo span,
and set .brand-triage / .nav-logo .brand-triage to #ff3333 !important (bright electric red).
"""

import os, re

def fix_css():
    css_files = [
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\css\base.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\css\base.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\css\responsive.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\css\responsive.css"
    ]

    for fpath in css_files:
        if os.path.exists(fpath):
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Remove overriding .nav-logo span white rule
            content = content.replace('.nav-logo span, .ft-logo span, .preloader-name span {', '.ft-logo span, .preloader-name span {')
            content = content.replace('.nav-logo span {', '/* nav-logo span color handled by brand-triage */ .disabled-rule {')

            # Ensure .brand-triage is bright red #ff3333 !important
            red_logo_css = """
/* ELECTRIC RED TRIAGE LOGO STYLING */
.brand-triage, .nav-logo .brand-triage, .ft-logo .brand-triage {
  color: #ff3333 !important;
  font-weight: 700 !important;
  opacity: 1 !important;
  display: inline-block !important;
  white-space: nowrap !important;
}

.brand-auto, .nav-logo .brand-auto, .ft-logo .brand-auto {
  color: #ffffff !important;
  font-weight: 700 !important;
  opacity: 1 !important;
  white-space: nowrap !important;
}
"""
            if 'ELECTRIC RED TRIAGE LOGO STYLING' not in content:
                content += "\n" + red_logo_css

            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated CSS: {fpath}")

def fix_html():
    html_files = [
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\index.html"
    ]

    for fpath in html_files:
        if os.path.exists(fpath):
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Ensure HTML uses <span class="brand-auto">AUTO</span> <span class="brand-triage">TRIAGE</span>
            content = re.sub(
                r'<span style="color:#ffffff; font-weight:bold;">TRIAGE</span>',
                '<span class="brand-triage" style="color:#ff3333 !important; font-weight:bold;">TRIAGE</span>',
                content
            )

            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated HTML: {fpath}")

fix_css()
fix_html()
print("TRIAGE red color fix complete!")
