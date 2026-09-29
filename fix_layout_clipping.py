import re

def fix_wrapping_and_sizing(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return
    
    # 1. Bump cache
    content = re.sub(r'v=\d+\.\d+', 'v=16.0', content)

    # 2. Fix the HUGE "HOW CAN WE HELP?" font size causing edge clipping
    content = content.replace(
        "font-size:72px !important;", 
        "font-size:52px !important;"
    )
    content = content.replace(
        "line-height:0.85 !important;",
        "line-height:1 !important;"
    )

    # 3. Fix the wrapping of the description texts
    # Make mb-desc slightly smaller so it fits on one line
    content = content.replace(
        "font-size:10px !important;",
        "font-size:9px !important; letter-spacing: -0.2px !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;"
    )
    
    # Fix the description spaces around dots to be smaller or non-breaking
    content = content.replace("Describe problem · AI analysis · Solutions", "Describe problem &middot; AI analysis &middot; Solutions")
    content = content.replace("Mechanics near you · Call directly", "Mechanics near you &middot; Call directly")
    content = content.replace("Uber · Lyft · Bolt · DiDi · Grab · InDrive", "Uber &middot; Lyft &middot; Bolt &middot; DiDi &middot; Grab")
    content = content.replace("Police 911 · 112 · Rescue 999", "Police 911 &middot; 112 &middot; Rescue 999")
    content = content.replace("Hands-free background crash · SOS monitor", "Hands-free crash &middot; SOS monitor")

    # 4. Shrink main-btn padding further so everything fits vertically
    content = content.replace(
        "padding:12px 20px; border:1px solid rgba(255,255,255,0.05); border-radius:24px;",
        "padding:10px 16px; border:1px solid rgba(255,255,255,0.05); border-radius:18px;"
    )
    
    # Also shrink main-buttons wrapper padding to pull buttons up higher
    content = content.replace(
        "padding:12px 24px 120px;",
        "padding:8px 24px 120px;"
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {filepath}")

fix_wrapping_and_sizing('simple.html')
fix_wrapping_and_sizing('netlify_deploy/simple.html')
