#!/usr/bin/env python3
"""
Add automatic visitor page views counter to AutoTriage landing page.
Increments on every page visit and displays in the Admin Registry Modal (PIN: 5522).
"""

import os, re

def add_counter(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add visitor tracking script in head / script tag
    tracker_script = """<script>
  // AUTOMATIC PAGE VISITOR COUNTER
  (function() {
    try {
      var views = parseInt(localStorage.getItem('at_site_views') || '0', 10) + 1;
      localStorage.setItem('at_site_views', views.toString());
      fetch('https://api.counterapi.dev/v1/autotriage_app/pageviews/up').then(r => r.json()).then(data => {
        if (data && data.count) localStorage.setItem('at_global_views', data.count);
      }).catch(() => {});
    } catch(e) {}
  })();
</script>
"""

    if 'AUTOMATIC PAGE VISITOR COUNTER' not in content:
        content = content.replace('<head>', '<head>\n' + tracker_script, 1)

    # 2. Update Admin Dashboard Modal HTML to display Total Site Views
    old_pulse_header = '<div style="font-size:12px; color:var(--accent);">NETWORK PULSE: <span id="adminCount">0</span> MECHANICS JOINED</div>'
    new_pulse_header = """<div style="display:flex; gap:16px; margin-top:6px;">
            <div style="font-size:12px; color:#4da6ff; font-weight:bold;">🌐 TOTAL SITE VIEWS: <span id="adminViewsCount">0</span></div>
            <div style="font-size:12px; color:var(--accent); font-weight:bold;">👥 MECHANICS JOINED: <span id="adminCount">0</span></div>
          </div>"""

    if old_pulse_header in content:
        content = content.replace(old_pulse_header, new_pulse_header)

    # 3. Update updateAdminStats() in JS to populate adminViewsCount
    old_update_stats = "function updateAdminStats() {"
    new_update_stats = """function updateAdminStats() {
      try {
        var vElem = document.getElementById('adminViewsCount');
        if (vElem) {
          var gViews = localStorage.getItem('at_global_views') || localStorage.getItem('at_site_views') || '1';
          vElem.innerText = parseInt(gViews, 10).toLocaleString();
        }
      } catch(e) {}"""

    if old_update_stats in content and 'adminViewsCount' not in content:
        content = content.replace(old_update_stats, new_update_stats)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"SUCCESS: Added visitor counter to {filepath}")

add_counter(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html")
add_counter(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\index.html")

print("Visitor counter deployment complete!")
