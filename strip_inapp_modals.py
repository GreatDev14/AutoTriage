#!/usr/bin/env python3
"""
Strip out all occurrences of inAppRideModal blocks completely from simple.html and app.html.
"""

import os, re

def strip_modal(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the starting tag
    while '<div id="inAppRideModal"' in content:
        start_idx = content.find('<div id="inAppRideModal"')
        # We also want to capture the preceding comment if any, let's just trace back a little bit
        pre_comment = content.rfind('<!-- ULTRA-PREMIUM', max(0, start_idx-200), start_idx)
        if pre_comment != -1:
            start_idx = pre_comment
            
        # Find the closing tag
        # The modal usually ends right before the script tag
        end_idx = content.find('</script>', start_idx)
        if end_idx != -1:
            end_idx += len('</script>')
        else:
            # Fallback, just look for the last closing div near some known text
            end_idx = content.find('CONFIRM & BOOK RIDE IN-APP', start_idx)
            if end_idx != -1:
                end_idx = content.find('</div>', end_idx)
                if end_idx != -1:
                    end_idx = content.find('</div>', end_idx+6)
                    end_idx += 6

        if start_idx != -1 and end_idx != -1:
            print(f"Stripping block from {start_idx} to {end_idx}")
            content = content[:start_idx] + content[end_idx:]
        else:
            break

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Cleaned {filepath}")

strip_modal(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
strip_modal(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
strip_modal(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
strip_modal(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")

print("inAppRideModal cleanup complete!")
