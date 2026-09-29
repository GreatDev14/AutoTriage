import re

def clean_fonts(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return
    
    # Remove the bad override
    bad_line = ".mb-desc, .home-sub, #homedashwidgets, .top-greeting { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }"
    content = content.replace(bad_line, "")
    
    # Fix the description dots
    content = content.replace("Describe problem AI analysis Solutions", "Describe problem · AI analysis · Solutions")
    content = content.replace("Mechanics near you Call directly", "Mechanics near you · Call directly")
    content = content.replace("Uber Lyft Bolt DiDi Grab InDrive", "Uber · Lyft · Bolt · DiDi · Grab · InDrive")
    content = content.replace("Police 911  112  Rescue 999", "Police 911 · 112 · Rescue 999")
    content = content.replace("Hands-free background crash & SOS monitor", "Hands-free background crash · SOS monitor")
    
    # Force mb-desc inline to use !important so it's guaranteed
    content = content.replace(
        '''<div class="mb-desc" style="font-family:'Space Mono', monospace; font-size:10px; color:#888;">''',
        '''<div class="mb-desc" style="font-family:'Space Mono', monospace !important; font-size:10px !important; color:#888 !important;">'''
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Cleaned {filepath}")

clean_fonts('simple.html')
clean_fonts('netlify_deploy/simple.html')
