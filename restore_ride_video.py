#!/usr/bin/env python3
import os

VIDEO_HTML = """
  <!-- LOOPING HERO VIDEO -->
  <div style="width:100%; position:relative; flex-shrink:0; margin-bottom:-16px; -webkit-mask-image:radial-gradient(ellipse at 50% 65%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%); mask-image:radial-gradient(ellipse at 50% 65%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%);">
    <video src="bros_amke_the_video_a_loop.mp4" autoplay loop muted playsinline style="width:100%; display:block; filter:contrast(1.2) brightness(1.2); mix-blend-mode:screen;"></video>
    <div style="position:absolute; bottom:0; left:0; right:0; height:40%; background:linear-gradient(to bottom, transparent, rgba(5,5,5,1)); z-index:2; pointer-events:none;"></div>
  </div>
"""

def restore_video(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find where the #rides screen starts
    # <!-- CLEAN ULTRA-MODERN RIDES SCREEN -->
    # <div id="rides" class="screen" ... >
    #   
    #   <!-- SCREEN HEADER -->
    
    # We want to insert the video right after the <div id="rides" ... > opening tag
    target_str = '<!-- SCREEN HEADER -->'
    if target_str in content:
        # Check if video is already there to avoid duplicates
        if 'bros_amke_the_video_a_loop.mp4' not in content[content.find('<div id="rides"'):content.find(target_str)]:
            content = content.replace(target_str, VIDEO_HTML + '\n  ' + target_str)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Restored video to {filepath}")
        else:
            print(f"Video already in {filepath}")
    else:
        print(f"Could not find anchor in {filepath}")

restore_video(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html")
restore_video(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html")
restore_video(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html")
restore_video(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html")
