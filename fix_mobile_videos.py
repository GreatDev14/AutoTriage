#!/usr/bin/env python3
import os

def fix_mobile_videos(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix the Rides Screen Hero Video
    # Old: style="width:100%; display:block; filter:contrast(1.2) brightness(1.2); mix-blend-mode:screen;"
    # New: style="width:100%; height:250px; object-fit:cover; object-position:center; display:block; filter:contrast(1.2) brightness(1.2); mix-blend-mode:screen;"
    old_rides_video_style = 'style="width:100%; display:block; filter:contrast(1.2) brightness(1.2); mix-blend-mode:screen;"'
    new_rides_video_style = 'style="width:100%; height:260px; object-fit:cover; object-position:center; display:block; filter:contrast(1.2) brightness(1.2); mix-blend-mode:screen; border-radius: 0 0 24px 24px;"'
    
    # Let's adjust the wrapper too if needed, but the wrapper is just 100% width.
    # The mask-image makes it fade out.
    old_mask = '-webkit-mask-image:radial-gradient(ellipse at 50% 65%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%); mask-image:radial-gradient(ellipse at 50% 65%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%);'
    # Change mask to be a bit more mobile friendly (linear gradient fade at bottom instead of a harsh circle)
    new_mask = '-webkit-mask-image:linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%); mask-image:linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);'

    content = content.replace(old_rides_video_style, new_rides_video_style)
    content = content.replace(old_mask, new_mask)

    # 2. Fix the Deep Link Modal Background Video
    # Ensure it's centered and scaled perfectly for tall mobile screens
    old_modal_video_style = 'style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:1; filter:contrast(1.2) brightness(0.5);"'
    new_modal_video_style = 'style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; z-index:1; filter:contrast(1.2) brightness(0.4);"'
    
    content = content.replace(old_modal_video_style, new_modal_video_style)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed mobile videos in {filepath}")

fix_mobile_videos(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
fix_mobile_videos(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
fix_mobile_videos(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
fix_mobile_videos(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")

print("Mobile video sizing complete!")
