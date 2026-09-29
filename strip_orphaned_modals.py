#!/usr/bin/env python3
import os

def strip_orphaned(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The orphaned block starts exactly at:
    # </div>
    #       <button onclick="closeInAppRideModal()"
    
    start_tag = '      <button onclick="closeInAppRideModal()"'
    
    while start_tag in content:
        start_idx = content.find(start_tag)
        # We need to backtrack a little to grab that rogue </div>
        backtrack = content.rfind('</div>', max(0, start_idx-50), start_idx)
        if backtrack != -1:
            start_idx = backtrack
            
        end_idx = content.find('</script>', start_idx)
        if end_idx != -1:
            # wait, this script tag is probably the "let currentSelectedRideProvider = 'uber';" script that also belongs to the old modal!
            end_idx += len('</script>')
            # there's usually a closing div for the modal right before or after.
            # actually, let's just strip up to the </script> plus any trailing newlines
        else:
            end_idx = start_idx + 2000

        print(f"Stripping orphaned block {start_idx} to {end_idx} in {filepath}")
        content = content[:start_idx] + content[end_idx:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
strip_orphaned(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
strip_orphaned(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
strip_orphaned(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
strip_orphaned(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")

print("Orphaned modal blocks cleaned!")
