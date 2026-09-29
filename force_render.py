#!/usr/bin/env python3
import os

def fix_html_fonts(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace preload with standard stylesheet to ensure it loads immediately
    old_link = '<link rel="preload" as="style" onload="this.onload=null;this.rel=\'stylesheet\'"\n    href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap" />'
    new_link = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap" />'
    
    # Just in case it's on one line
    old_link_2 = '<link rel="preload" as="style" onload="this.onload=null;this.rel=\'stylesheet\'" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap" />'
    
    if old_link in content:
        content = content.replace(old_link, new_link)
    elif old_link_2 in content:
        content = content.replace(old_link_2, new_link)
    elif "onload=null;this.rel='stylesheet'" in content:
        # Fallback replacement
        content = content.replace("rel=\"preload\" as=\"style\" onload=\"this.onload=null;this.rel='stylesheet'\"", 'rel="stylesheet"')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed HTML fonts in", filepath)

def fix_js_widgets(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Call updateDashboardWidgets() immediately at the bottom of the file
    # This ensures it runs even if window.onload already fired (e.g. in hot reload)
    trigger_code = "\n// Ensure widgets render immediately if DOM is ready\ndocument.addEventListener('DOMContentLoaded', () => setTimeout(updateDashboardWidgets, 100));\nif (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(updateDashboardWidgets, 100);\n"
    
    if "// Ensure widgets render immediately" not in content:
        with open(filepath, 'a', encoding='utf-8') as f:
            f.write(trigger_code)
        print("Fixed JS trigger in", filepath)

fix_html_fonts(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
fix_html_fonts(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
fix_js_widgets(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\js\features-simple.js")
fix_js_widgets(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\js\features-simple.js")
