#!/usr/bin/env python3
import os

def fix_everything(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Restore the Moon Icon
    moon_svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
    empty_btn = '></button>\n        <button onclick="openProfileDrawer()"'
    if empty_btn in content:
        content = content.replace(empty_btn, f'>{moon_svg}</button>\n        <button onclick="openProfileDrawer()"')

    # 2. Fix the Fonts for Greeting
    old_greeting = '<div class="home-greeting" style="font-size:12px; letter-spacing:1px; color:var(--gray); text-transform:none;" style="letter-spacing:4px;">GOOD DAY WHAT DO YOU NEED?</div>'
    new_greeting = '<div class="home-greeting" style="font-family:\'Space Mono\', monospace; font-size:10px; letter-spacing:4px; text-transform:uppercase; color:var(--subtext);">GOOD DAY WHAT DO YOU NEED?</div>'
    if old_greeting in content:
        content = content.replace(old_greeting, new_greeting)

    # 3. Fix the Fonts for Title
    old_title = '<div class="home-title" style="margin-top:2px; font-size:32px;" style="margin-top:2px; text-transform:uppercase;">HOW CAN<br>WE HELP?</div>'
    new_title = '<div class="home-title" style="font-family:\'Bebas Neue\', sans-serif; font-size:clamp(48px,12vw,64px); line-height:0.9; letter-spacing:1px; margin-top:8px;">HOW CAN<br>WE HELP?</div>'
    if old_title in content:
        content = content.replace(old_title, new_title)

    # 4. Fix the Fonts for Sub
    old_sub = '<div class="home-sub">Tap a button below to get started.</div>'
    new_sub = '<div class="home-sub" style="font-family:\'Space Mono\', monospace; font-size:12px; margin-top:16px;">Tap a button below to get started.</div>'
    if old_sub in content:
        content = content.replace(old_sub, new_sub)

    # 5. Fix mb-desc
    old_desc = '<div class="mb-desc" style="color:#aaa;">'
    new_desc = '<div class="mb-desc" style="font-family:\'Space Mono\', monospace; font-size:10px; color:#888;">'
    content = content.replace(old_desc, new_desc)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed", filepath)

fix_everything(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
fix_everything(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
fix_everything(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
fix_everything(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")
