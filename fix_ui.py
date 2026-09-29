import re

with open('simple.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Header Logo Size
old_logo = '<img src="assets/logo-transparent.png" alt="Logo" style="height:32px; width:32px; object-fit:contain; filter:drop-shadow(0 0 8px rgba(255,51,51,0.4));">'
new_logo = '<img src="assets/logo-transparent.png" alt="Logo" style="height:40px; width:40px; object-fit:contain; filter:drop-shadow(0 0 8px rgba(255,51,51,0.4)); margin-top:-2px;">'
text = text.replace(old_logo, new_logo)

# 2. Header Profile Icon SVG
old_profile = '<button onclick="openProfileDrawer()" style="background:var(--glass);border:1px solid var(--border);font-size:14px;cursor:pointer;height:32px;width:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.2s;box-shadow:0 4px 10px var(--shadow);"></button>'
new_profile = '<button onclick="openProfileDrawer()" style="background:var(--glass);border:1px solid var(--border);color:var(--fg);font-size:14px;cursor:pointer;height:32px;width:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all 0.2s;box-shadow:0 4px 10px var(--shadow);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></button>'
text = text.replace(old_profile, new_profile)

# 3. Greeting Typography
old_greet = '<div class="home-greeting">Good day  what do you need?</div>\n    <div class="home-title">HOW CAN<br>WE HELP?</div>'
new_greet = '<div class="home-greeting" style="font-size:12px; letter-spacing:1px; color:var(--gray); text-transform:none;">Good Day, what do you need?</div>\n    <div class="home-title" style="margin-top:2px; font-size:32px;">HOW CAN<br>WE HELP?</div>'
text = text.replace(old_greet, new_greet)

# 4. Main Buttons Contrast and Bullets
text = text.replace('<div class="mb-desc">Describe problem  AI analysis  Solutions</div>', '<div class="mb-desc" style="color:#aaa;">Describe problem &bull; AI analysis &bull; Solutions</div>')
text = text.replace('<div class="mb-desc">Mechanics near you  Call directly</div>', '<div class="mb-desc" style="color:#aaa;">Mechanics near you &bull; Call directly</div>')
text = text.replace('<div class="mb-desc">Uber  Lyft  Bolt  DiDi  Grab  InDrive</div>', '<div class="mb-desc" style="color:#aaa;">Uber &bull; Lyft &bull; Bolt &bull; DiDi &bull; Grab &bull; InDrive</div>')

with open('simple.html', 'w', encoding='utf-8') as f:
    f.write(text)
print("simple.html updated!")
