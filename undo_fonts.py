#!/usr/bin/env python3
import os
import re

def undo_changes(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix AUTO TRIAGE Header color
    # Currently: <span style="color:#ffffff; font-weight:bold;">AUTO </span><span style="color:#ffffff; font-weight:bold;">TRIAGE</span>
    old_logo = '<span style="color:#ffffff; font-weight:bold;">AUTO </span><span style="color:#ffffff; font-weight:bold;">TRIAGE</span>'
    new_logo = '<span style="color:#ffffff; font-weight:bold;">AUTO </span><span style="color:var(--subtext, #666); font-weight:bold;">TRIAGE</span>'
    content = content.replace(old_logo, new_logo)

    # 2. Revert home-greeting
    # Currently: <div class="home-greeting" style="font-family:'Space Mono', monospace; letter-spacing:4px;">GOOD DAY WHAT DO YOU NEED?</div>
    old_greeting = '<div class="home-greeting" style="font-family:\'Space Mono\', monospace; letter-spacing:4px;">GOOD DAY WHAT DO YOU NEED?</div>'
    new_greeting = '<div class="home-greeting" style="font-size:12px; letter-spacing:1px; color:var(--gray); text-transform:none;" style="letter-spacing:4px;">GOOD DAY WHAT DO YOU NEED?</div>'
    content = content.replace(old_greeting, new_greeting)

    # 3. Revert home-title
    old_title = '<div class="home-title" style="margin-top:4px;">HOW CAN<br>WE HELP?</div>'
    new_title = '<div class="home-title" style="margin-top:2px; font-size:32px;" style="margin-top:2px; text-transform:uppercase;">HOW CAN<br>WE HELP?</div>'
    content = content.replace(old_title, new_title)

    # 4. Revert home-sub
    old_sub = '<div class="home-sub" style="font-family:\'Space Mono\', monospace;">Tap a button below to get started.</div>'
    new_sub = '<div class="home-sub">Tap a button below to get started.</div>'
    content = content.replace(old_sub, new_sub)

    # 5. Revert mb-desc
    content = content.replace('<div class="mb-desc" style="color:#888; font-family:\'Space Mono\', monospace;">', '<div class="mb-desc" style="color:#aaa;">')

    # 6. Revert homeDashWidgets to an empty div so JS can render the horizontal scrolling grid properly
    # The block we injected starts with <div id="homeDashWidgets" style="padding:0 24px; margin-bottom: 24px;">
    # and ends 34 lines later. Let's use regex to wipe it and replace it with the empty div.
    pattern = r'<div id="homeDashWidgets"[^>]*>.*?<!-- PARTS PRICING -->.*?</div>\s*</div>\s*</div>'
    empty_div = '<div id="homeDashWidgets" style="padding:0 24px;"></div>'
    content = re.sub(pattern, empty_div, content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Reverted {filepath}")

undo_changes(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
undo_changes(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
undo_changes(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
undo_changes(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")
