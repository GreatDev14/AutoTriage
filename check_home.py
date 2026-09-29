#!/usr/bin/env python3
with open('simple.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('<div id="home"')
end_idx = content.find('<div id="diagnose"', start_idx)
if start_idx != -1 and end_idx != -1:
    print(content[start_idx:start_idx+3500])
else:
    print("Could not find bounds")
