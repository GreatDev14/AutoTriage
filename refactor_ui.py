import re

with open('simple.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Colors Replacement
# Replace dark backgrounds with var(--bg) or var(--mid)
html = re.sub(r'background:\s*#(?:000000|000|020202|0a0a0a);', 'background: var(--bg);', html)
html = re.sub(r'background-color:\s*#(?:000000|000|020202|0a0a0a);', 'background-color: var(--bg);', html)
html = re.sub(r'background:\s*#(?:111111|111|1a1a1a);', 'background: var(--bg-raised);', html)

# Replace whites with var(--fg)
html = re.sub(r'color:\s*#(?:ffffff|fff|FFF|FFFFFF);', 'color: var(--fg);', html)
html = re.sub(r'color:\s*white;', 'color: var(--fg);', html)

# Replace hardcoded reds
html = re.sub(r'#(?:e63946|E63946|ff3333|FF3333)', 'var(--accent)', html)

# 2. Glassmorphism and UI Overrides
# Header and nav glass
html = html.replace('background: rgba(10,10,12,0.85)', 'background: var(--glass)')
html = html.replace('background: rgba(2,2,2,0.8)', 'background: var(--glass)')

# 3. Spacing and Border Radius (Breathing Room)
# For the main input area card and telemetry cards
html = html.replace('border-radius: 16px', 'border-radius: 20px')
html = html.replace('border-radius: 8px', 'border-radius: 12px')
html = html.replace('padding: 16px', 'padding: 24px')

# Specifically fix buttons that might have gotten too much padding due to the 16px -> 24px replace
# Our INITIATE AI ENGINE button had padding: 14px, wait, I changed 16px to 24px, it shouldn't affect 14px.
# But the FIND SPECIALIST button had padding: 16px. It will become 24px. Let's keep it that way, it's luxurious.
# The bottom navigation buttons use padding: 10px or 12px, so they are safe.

# 4. Deep shadows
html = html.replace('box-shadow: 0 4px 10px var(--shadow)', 'box-shadow: var(--shadow-sm)')
html = html.replace('box-shadow: 0 4px 15px rgba(0,0,0,0.3)', 'box-shadow: var(--shadow-lg)')

with open('simple.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Applied Obsidian & Crimson design tokens and generous spacing to simple.html")
