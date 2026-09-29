import re
import os

files_to_update = ['app.html', 'js/desktop.js', 'css/desktop-port.css']

for filepath in files_to_update:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Background colors
    content = re.sub(r'#(?:000000|000|020202|0a0a0a)(?![0-9a-fA-F])', 'var(--bg)', content)
    content = re.sub(r'#(?:111111|111|1a1a1a)(?![0-9a-fA-F])', 'var(--bg-raised)', content)

    # 2. Text colors
    content = re.sub(r'#(?:ffffff|fff|FFF|FFFFFF)(?![0-9a-fA-F])', 'var(--fg)', content)
    
    # 3. Accent colors
    content = re.sub(r'#(?:e63946|E63946|ff3333|FF3333)(?![0-9a-fA-F])', 'var(--accent)', content)

    # 4. Spacing updates for HTML and CSS (Optional but let's do a few safe ones)
    content = content.replace('border-radius: 16px', 'border-radius: 20px')
    content = content.replace('border-radius: 8px', 'border-radius: 12px')
    # careful with padding, let's only do it if it's app.html
    if 'html' in filepath:
        content = content.replace('padding: 16px', 'padding: 24px')
        content = content.replace('padding: 1rem', 'padding: 1.5rem')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Swept app.html, desktop.js, and desktop-port.css")
