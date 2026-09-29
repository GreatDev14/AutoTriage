#!/usr/bin/env python3
"""
1. Remove PWA auto-redirect to app.html in head script
2. Replace all links to app.html with simple.html across index.html
"""

import os, re

def remove_app_links(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove checkAndRedirect body so standalone PWA doesn't force redirect to app.html
    old_redirect = """        if (isStandalone) {
          console.log('[PWA] Standalone execution verified. Force redirecting to app viewport.');
          window.location.replace('app.html?standalone=true');
        }"""
    
    new_redirect = """        // Standalone redirect disabled
        if (isStandalone) {
          console.log('[PWA] Standalone execution verified.');
        }"""

    content = content.replace(old_redirect, new_redirect)

    # 2. Replace href="app.html..." with href="simple.html"
    content = re.sub(r'href="app\.html[^"]*"', 'href="simple.html"', content)

    # 3. Update Hero CTA text if needed
    content = content.replace("GET AUTO TRIAGE APP →", "LAUNCH AUTO TRIAGE →")
    content = content.replace("Install Full App", "Launch Web Platform")
    content = content.replace("Full App", "Web Platform")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"SUCCESS: Removed app.html links & PWA redirects from {filepath}")

remove_app_links(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html")
remove_app_links(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\index.html")

print("All app.html references removed from landing page!")
