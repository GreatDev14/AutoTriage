#!/usr/bin/env python3
"""
Restore Red ECG Pulse Heartbeat Line & Particle Constellation on ALL devices (Desktop & Mobile) with 60fps hardware accelerated performance.
"""

import os

def restore_js(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Re-enable pulse animations on ALL devices
    content = content.replace("if (window.innerWidth < 768) return; // Skip heavy animations on mobile for speed", "// Active on all devices")
    content = content.replace("if (window.innerWidth < 768) return; // Skip ECG on mobile", "// Active on all devices")
    content = content.replace("if (window.innerWidth < 768) return; // Skip scanline on mobile", "// Active on all devices")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Restored JS pulse: {filepath}")

def restore_css(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Ensure ECG container is visible on all screens
    content = content.replace("/* Hide heavy SVG ECG on mobile to prevent scrolling lag */\n@media screen and (max-width: 768px) {\n  #ecg-container, .hero-scanline {\n    display: none !important;\n  }\n}", "")

    ecg_pulse_css = """
/* ACTIVE RED ECG HEARTBEAT PULSE FOR ALL SCREENS */
#ecg-container {
  display: block !important;
  position: absolute !important;
  bottom: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 120px !important;
  z-index: 5 !important;
  pointer-events: none !important;
  overflow: hidden !important;
}

#ecg-svg {
  width: 200% !important;
  height: 100% !important;
  animation: ecgScroll 4s linear infinite !important;
  will-change: transform;
}

.ecg-path {
  fill: none !important;
  stroke: #ff3333 !important;
  stroke-width: 2.5 !important;
  opacity: 0.9 !important;
  filter: drop-shadow(0 0 10px rgba(255, 51, 51, 0.8)) !important;
}
"""

    if 'ACTIVE RED ECG HEARTBEAT PULSE FOR ALL SCREENS' not in content:
        content += "\n" + ecg_pulse_css

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Restored CSS pulse: {filepath}")

restore_js(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\js\effects.js")
restore_js(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\js\effects.js")

restore_css(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\css\effects.css")
restore_css(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\css\effects.css")

print("Pulse restoration complete on all devices!")
