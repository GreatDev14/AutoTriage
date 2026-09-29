#!/usr/bin/env python3
"""
Add back live pulse animation dots to Hero eyebrow, Hero badges, and Navbar
"""

import os

def restore_pulse(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Hero eyebrow pulse dot
    old_eyebrow = '<div class="hero-eyebrow" style="opacity: 0.6; font-size: clamp(10px, 2vw, 12px); display: block !important;">The'
    new_eyebrow = '<div class="hero-eyebrow" style="opacity: 0.9; font-size: clamp(10px, 2vw, 12px); display: flex !important; align-items: center; gap: 8px;"><span class="hero-badge-dot"></span>The'

    content = content.replace(old_eyebrow, new_eyebrow)

    # 2. Add Live Pulse badge to Hero badges row
    old_badges = '<div class="hero-badges">'
    new_badges = """<div class="hero-badges">
      <div class="hero-badge" style="border: 1px solid rgba(230,57,70,0.3); background: rgba(230,57,70,0.05);">
        <div class="badge-num" style="display:flex; align-items:center; gap:6px; color:#ff3333;"><span class="hero-badge-dot"></span>LIVE</div>
        <div class="badge-label">Network AI Pulse</div>
      </div>"""

    if 'Network AI Pulse' not in content:
        content = content.replace(old_badges, new_badges)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"SUCCESS: Restored pulse effects in {filepath}")

restore_pulse(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html")
restore_pulse(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\index.html")

print("Pulse restoration complete!")
