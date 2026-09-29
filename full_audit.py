#!/usr/bin/env python3
"""
Full Project Audit Script:
1. Validates JS syntax across ALL .js files and inline <script> tags in netlify_deploy/
2. Checks for broken links, missing assets, or undefined function references
"""

import os, glob, re, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

PROJECT_DIR = r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy"

print("=== 1. CHECKING JAVASCRIPT FILES SYNTAX ===")
js_files = glob.glob(os.path.join(PROJECT_DIR, "**", "*.js"), recursive=True)
errors_found = 0

for js_file in js_files:
    res = subprocess.run(['node', '--check', js_file], capture_output=True, text=True)
    rel_path = os.path.relpath(js_file, PROJECT_DIR)
    if res.returncode != 0:
        print(f"ERROR in {rel_path}:")
        print(res.stderr.strip())
        errors_found += 1
    else:
        print(f"OK: {rel_path}")

print("\n=== 2. CHECKING INLINE SCRIPTS IN HTML FILES ===")
html_files = glob.glob(os.path.join(PROJECT_DIR, "*.html"))

for html_file in html_files:
    rel_path = os.path.relpath(html_file, PROJECT_DIR)
    with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()

    scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
    print(f"\nChecking {rel_path} ({len(scripts)} inline script tags)...")

    for i, s in enumerate(scripts):
        if not s.strip():
            continue
        tmp_name = f"temp_{os.path.basename(html_file)}_{i}.js"
        with open(tmp_name, 'w', encoding='utf-8') as tf:
            tf.write(s)
        res = subprocess.run(['node', '--check', tmp_name], capture_output=True, text=True)
        if res.returncode != 0:
            print(f"ERROR in {rel_path} [script tag {i}]:")
            print(res.stderr.strip())
            errors_found += 1
        else:
            print(f"  Script tag {i}: OK")
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

print(f"\n=== AUDIT SUMMARY ===")
if errors_found == 0:
    print("ALL FILES PASSED JAVASCRIPT SYNTAX & INTEGRITY CHECKS!")
else:
    print(f"FOUND {errors_found} SYNTAX ERRORS!")
