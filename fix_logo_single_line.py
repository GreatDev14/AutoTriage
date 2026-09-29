#!/usr/bin/env python3
"""
Keep AUTO (White) and TRIAGE (Red) on the SAME LINE whenever there is space,
scaling font size gracefully on small screens without breaking letters or stacking unless necessary.
"""

import os, re

SINGLE_LINE_LOGO_CSS = """
/* BRAND LOGO: SINGLE LINE WITH RED TRIAGE */
.nav-logo, .ft-logo {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  text-decoration: none !important;
  white-space: nowrap !important;
}

.nav-brand-box, .ft-brand-box {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 5px !important;
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(18px, 4.5vw, 26px) !important;
  letter-spacing: 2px !important;
  line-height: 1 !important;
  white-space: nowrap !important;
}

.brand-auto {
  color: #ffffff !important;
  font-weight: 700 !important;
  white-space: nowrap !important;
}

.brand-triage {
  color: #ff3333 !important; /* ELECTRIC RED */
  font-weight: 700 !important;
  white-space: nowrap !important;
}

@media screen and (max-width: 480px) {
  .nav-brand-box {
    font-size: clamp(15px, 4vw, 19px) !important;
    gap: 3px !important;
  }
}
"""

def update_css():
    css_paths = [
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\css\base.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\css\base.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\css\responsive.css",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\css\responsive.css"
    ]
    for path in css_paths:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Remove previous stacked logo CSS if present
            content = re.sub(r'/\* STACKED MOBILE LOGO WITH RED TRIAGE \*/.*', '', content, flags=re.DOTALL)
            content = re.sub(r'/\* BRAND LOGO: SINGLE LINE WITH RED TRIAGE \*/.*', '', content, flags=re.DOTALL)

            content += "\n" + SINGLE_LINE_LOGO_CSS

            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated CSS for single-line red TRIAGE logo: {path}")

update_css()
print("Single line logo update complete!")
