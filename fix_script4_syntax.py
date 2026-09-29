#!/usr/bin/env python3
"""
Fix unclosed function chatWithAdmin() in netlify_deploy/index.html and index.html
Line 337 opens function chatWithAdmin(), line 341 opens WhatsApp URL, but missing closing brace '}' before line 342!
"""

import os

def fix_html(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    bad_pattern = """    function chatWithAdmin() {
      const name = document.getElementById('dName').innerText;
      const text = encodeURIComponent(`Hi, I just applied as a mechanic on Auto Triage! My name is ${name}. I'm ready for the verification process.`);
      const whatsappUrl = `https://wa.me/1234567890?text=${text}`;
      window.open(whatsappUrl, '_blank');
      let explainerPlaying = false;"""

    good_pattern = """    function chatWithAdmin() {
      const name = document.getElementById('dName') ? document.getElementById('dName').innerText : 'Workshop';
      const text = encodeURIComponent(`Hi, I just applied as a mechanic on Auto Triage! My name is ${name}. I'm ready for the verification process.`);
      const whatsappUrl = `https://wa.me/1234567890?text=${text}`;
      window.open(whatsappUrl, '_blank');
    }

    let explainerPlaying = false;"""

    if bad_pattern in content:
        content = content.replace(bad_pattern, good_pattern, 1)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"SUCCESS: Fixed chatWithAdmin syntax error in {filepath}")
    else:
        print(f"WARNING: Bad pattern not matched in {filepath}. Searching alternative...")
        # Check if chatWithAdmin is present
        if 'function chatWithAdmin()' in content:
            idx = content.find('function chatWithAdmin()')
            print("Found chatWithAdmin around char", idx)
            print(content[idx:idx+350])

fix_html(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html")
fix_html(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\index.html")
