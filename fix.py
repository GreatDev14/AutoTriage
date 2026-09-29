import re

with open('simple.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix adjacent duplicate mb-icon-wrap blocks
text = re.sub(r'(<div class=" mb-icon-wrap\>.*?</div>\s*)<div class=\mb-icon-wrap\>.*?</div>', r'\1', text, flags=re.DOTALL)

# Fix duplicate mb-icon-wrap + mb-bottom blocks
text = re.sub(r'(<div class=\mb-icon-wrap\>.*?</div>\s*<div class=\mb-bottom\>\s*)<div class=\mb-icon-wrap\>.*?</div>\s*<div class=\mb-bottom\>', r'\1', text, flags=re.DOTALL)

with open('simple.html', 'w', encoding='utf-8') as f:
 f.write(text)

print('Done')
