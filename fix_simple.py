import codecs

with open('simple.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Logo replacement
old_logo = '<img src="assets/logo.png" alt="Logo" style="height:32px; width:32px; border-radius:8px; background:var(--mid); padding:4px; border:1px solid var(--border);">'
new_logo = '<img src="assets/logo-transparent.png" alt="Logo" style="height:32px; width:32px; object-fit:contain; filter:drop-shadow(0 0 8px rgba(255,51,51,0.4));">'
text = text.replace(old_logo, new_logo)

# 2. Parts Pricing removal
old_parts = '''    <button class="main-btn" onclick="goTo(\'parts\')">
      <div class="mb-icon-wrap"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg></div>
      <div class="mb-bottom">
        <div class="mb-title">PARTS<br>PRICING</div>
        <div class="mb-desc">Check parts prices &middot; Local stores</div>
      </div>
    </button>
'''
text = text.replace(old_parts, '')

with open('simple.html', 'w', encoding='utf-8') as f:
    f.write(text)
print("Fix completed!")
