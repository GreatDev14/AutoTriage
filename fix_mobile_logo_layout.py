#!/usr/bin/env python3
"""
Fix mobile navbar logo layout:
- Stacks TRIAGE in red (#ff3333) directly under AUTO on small phone screens.
- Applies white-space: nowrap so letters never split (e.g. AUT O TRIA GE).
"""

import os

LOGO_CSS = """
/* STACKED MOBILE LOGO WITH RED TRIAGE */
.nav-logo, .ft-logo {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  text-decoration: none !important;
  white-space: nowrap !important;
}

.nav-brand-box, .ft-brand-box {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 26px;
  letter-spacing: 3px;
  line-height: 1;
  white-space: nowrap;
}

.brand-auto {
  color: #ffffff !important;
  font-weight: 700 !important;
  white-space: nowrap !important;
}

.brand-triage {
  color: #ff3333 !important; /* RED */
  font-weight: 700 !important;
  white-space: nowrap !important;
}

@media screen and (max-width: 600px) {
  .nav-logo {
    gap: 8px !important;
  }
  .nav-brand-box {
    flex-direction: column !important;
    align-items: flex-start !important;
    justify-content: center !important;
    line-height: 0.9 !important;
    gap: 0px !important;
  }
  .brand-auto {
    font-size: 16px !important;
    letter-spacing: 2px !important;
  }
  .brand-triage {
    font-size: 14px !important;
    letter-spacing: 2px !important;
  }
}
"""

def update_css_files():
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
            if 'STACKED MOBILE LOGO WITH RED TRIAGE' not in content:
                content += "\n" + LOGO_CSS
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated CSS: {path}")

def update_html_files():
    html_paths = [
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html",
        r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\index.html"
    ]
    
    old_nav_logo = """    <a href="#" class="nav-logo">
      <img src="assets/logo-transparent.png" alt="AutoTriage">
      <span style="color:#ffffff; font-weight:bold;">AUTO </span><span style="color:#ffffff; font-weight:bold;">TRIAGE</span>
    </a>"""

    new_nav_logo = """    <a href="#" class="nav-logo">
      <img src="assets/logo-transparent.png" alt="AutoTriage">
      <div class="nav-brand-box">
        <span class="brand-auto">AUTO</span>
        <span class="brand-triage">TRIAGE</span>
      </div>
    </a>"""

    old_ft_logo = """        <div class="ft-logo" style="display:flex; align-items:center; gap:10px; cursor:pointer;"
          onclick="toggleAdmin()">
          <img src="assets/logo-transparent.png" alt="Logo" style="height:24px;">
          AUTO<span style="color:#ffffff; font-weight:bold;">TRIAGE</span>
        </div>"""

    new_ft_logo = """        <div class="ft-logo" style="display:flex; align-items:center; gap:10px; cursor:pointer;"
          onclick="toggleAdmin()">
          <img src="assets/logo-transparent.png" alt="Logo" style="height:24px;">
          <div class="ft-brand-box">
            <span class="brand-auto">AUTO</span>
            <span class="brand-triage">TRIAGE</span>
          </div>
        </div>"""

    for path in html_paths:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            if old_nav_logo in content:
                content = content.replace(old_nav_logo, new_nav_logo)
            else:
                # regex replacement
                content = re.sub(
                    r'<a href="#" class="nav-logo">.*?AUTO.*?TRIAGE.*?</a>',
                    new_nav_logo,
                    content,
                    flags=re.DOTALL
                )

            if old_ft_logo in content:
                content = content.replace(old_ft_logo, new_ft_logo)

            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated HTML: {path}")

update_css_files()
update_html_files()
print("Mobile logo layout fix complete!")
