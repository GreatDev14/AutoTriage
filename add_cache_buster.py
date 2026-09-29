#!/usr/bin/env python3
"""
Add cache-busting headers/meta tags to simple.html to ensure fresh mobile app loading.
"""

import os, time

def add_cache_buster(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    meta_cache = f"""<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<!-- v={int(time.time())} -->"""

    if 'http-equiv="Cache-Control"' not in content:
        content = content.replace('<head>', '<head>\n' + meta_cache, 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Added cache buster meta tags to {filepath}")

add_cache_buster(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
add_cache_buster(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
add_cache_buster(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
add_cache_buster(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")

print("Cache buster update complete!")
