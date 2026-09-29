#!/usr/bin/env python3
"""
Add Localhost-Only Domain Guard to app.html and simple.html:
If opened on live web (autotriage.app or netlify.app), automatically redirect to main website landing page!
Only allows opening on localhost / 127.0.0.1 / file protocol.
"""

import os

GUARD_SCRIPT = """<script>
  // LOCALHOST ONLY GUARD: Block public web access to standalone app files on live domain
  (function() {
    var h = window.location.hostname;
    if (h && h !== 'localhost' && h !== '127.0.0.1' && window.location.protocol !== 'file:') {
      console.warn('[Security] Accessing app view on production domain is restricted. Redirecting to home.');
      window.location.replace('/');
    }
  })();
</script>
"""

def add_guard(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '[Security] Accessing app view' not in content:
        # Insert immediately after <head>
        content = content.replace('<head>', '<head>\n' + GUARD_SCRIPT, 1)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Added localhost-only guard to {filepath}")
    else:
        print(f"Guard already present in {filepath}")

add_guard(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")
add_guard(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
add_guard(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
add_guard(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")

print("Domain guard deployment ready!")
