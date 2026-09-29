#!/usr/bin/env python3
"""
Add iPad & Tablet Responsive Styles + Fix Input Auto-Zoom on iPad/iOS Safari
"""

import os, re

IPAD_CSS = """
/* iPad & Tablet Responsiveness (768px - 1024px) */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  #navbar { padding: 18px 32px; }
  section { padding: 75px 32px; }
  .hero-title { font-size: clamp(64px, 11vw, 120px); }
  .diag-layout, .ride-layout { grid-template-columns: 1fr 1fr; gap: 32px; }
  .mech-join-section { grid-template-columns: 1fr 1fr; gap: 32px; }
  .feat-row { grid-template-columns: repeat(2, 1fr); }
  .mech-grid, .spec-grid { grid-template-columns: 1fr 1fr; }
  .clean-auth-card { width: 85%; max-width: 450px; padding: 32px 28px; }
  .modal-content, .success-content { max-width: 90%; }
}

/* Prevent iPad / iPhone Safari auto-zoom on input tap */
@media screen and (max-width: 1024px) {
  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="number"],
  input[type="tel"],
  select,
  textarea,
  .fi,
  .clean-input {
    font-size: 16px !important;
  }
}
"""

def update_responsive_css(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'iPad & Tablet Responsiveness' not in content:
        content += "\n" + IPAD_CSS
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath} with iPad responsiveness CSS")

update_responsive_css(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\css\responsive.css")
update_responsive_css(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\css\responsive.css")

def fix_viewport_meta(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove duplicate viewport tags and consolidate
    content = re.sub(
        r'<meta name="viewport" content="width=device-width, initial-scale=1\.0, maximum-scale=1\.0, user-scalable=no">',
        '',
        content
    )
    content = re.sub(
        r'<meta name="viewport" content="width=device-width, initial-scale=1\.0, viewport-fit=cover" />',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />',
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed viewport meta tags in {filepath}")

fix_viewport_meta(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html")
fix_viewport_meta(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\index.html")

print("iPad responsiveness fixes complete!")
