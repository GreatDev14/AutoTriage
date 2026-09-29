#!/usr/bin/env python3
import os

filepath = r'c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

count = 0
while '<div id="inAppRideModal"' in content:
    start_idx = content.find('<div id="inAppRideModal"')
    end_idx = content.find('</script>', start_idx)
    if end_idx != -1:
        end_idx += len('</script>')
    else:
        # If no script tag, just find the next 5 closing divs
        end_idx = start_idx
        for _ in range(5):
            end_idx = content.find('</div>', end_idx + 1)
        if end_idx != -1:
            end_idx += 6
        else:
            end_idx = start_idx + 2000

    print(f'Stripping {start_idx} to {end_idx}')
    content = content[:start_idx] + content[end_idx:]
    count += 1

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Stripped {count} occurrences in simple.html')
