#!/usr/bin/env python3
import os

def fix_home_styles(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix inline styles overriding the beautiful CSS!
    
    # 1. home-greeting
    old_greeting = '<div class="home-greeting" style="font-size:12px; letter-spacing:1px; color:var(--gray); text-transform:none;" style="letter-spacing:4px;">GOOD DAY WHAT DO YOU NEED?</div>'
    new_greeting = '<div class="home-greeting" style="font-family:\'Space Mono\', monospace; letter-spacing:4px;">GOOD DAY WHAT DO YOU NEED?</div>'
    content = content.replace(old_greeting, new_greeting)

    # 2. home-title
    old_title = '<div class="home-title" style="margin-top:2px; font-size:32px;" style="margin-top:2px; text-transform:uppercase;">HOW CAN<br>WE HELP?</div>'
    new_title = '<div class="home-title" style="margin-top:4px;">HOW CAN<br>WE HELP?</div>'
    content = content.replace(old_title, new_title)

    # 3. home-sub
    old_sub = '<div class="home-sub">Tap a button below to get started.</div>'
    new_sub = '<div class="home-sub" style="font-family:\'Space Mono\', monospace;">Tap a button below to get started.</div>'
    content = content.replace(old_sub, new_sub)

    # 4. mb-desc
    # We will replace all `<div class="mb-desc"` to have Space Mono
    content = content.replace('<div class="mb-desc" style="color:#aaa;">', '<div class="mb-desc" style="color:#888; font-family:\'Space Mono\', monospace;">')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Fixed home styles in {filepath}")

fix_home_styles(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
fix_home_styles(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
fix_home_styles(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
fix_home_styles(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")
