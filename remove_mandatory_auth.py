#!/usr/bin/env python3
"""
Remove Mandatory Authentication Gate:
1. Modal is hidden by default (no initial .active class)
2. Unauthenticated users are allowed full site access without modal popup or scroll locking
3. Backdrop click always closes modal
"""

import os, re

def remove_auth_gate(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Change overlay creation to not have 'active' class by default
    content = content.replace(
        "overlay.className = 'clean-auth-overlay active';",
        "overlay.className = 'clean-auth-overlay';"
    )

    # 2. Allow backdrop click to close anytime
    content = content.replace(
        "if (e.target === overlay && currentUser) {",
        "if (e.target === overlay) {"
    )

    # 3. Update toggle() to allow toggling regardless of currentUser
    old_toggle = """    function toggle() {
        const overlay = document.getElementById('authOverlay');
        if (!overlay) return;

        // If unauthenticated, DO NOT allow toggling off (mandatory gate)
        if (!currentUser) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            return;
        }

        overlay.classList.toggle('active');"""

    new_toggle = """    function toggle() {
        const overlay = document.getElementById('authOverlay');
        if (!overlay) return;

        overlay.classList.toggle('active');"""

    content = content.replace(old_toggle, new_toggle)

    # 4. Remove mandatory gate in onAuthStateChanged
    old_logged_out = """                } else {
                    currentUser = null;
                    localStorage.removeItem('autotriage_user');

                    // If logged out, MANDATORY AUTH GATE: Show modal and lock scrolling
                    if (overlay) {
                        overlay.classList.add('active');
                    }
                    if (closeBtn) {
                        closeBtn.style.display = 'flex';
                    }
                    document.body.style.overflow = 'hidden';
                }"""

    new_logged_out = """                } else {
                    currentUser = null;
                    localStorage.removeItem('autotriage_user');

                    if (overlay) {
                        overlay.classList.remove('active');
                    }
                    document.body.style.overflow = 'auto';
                }"""

    content = content.replace(old_logged_out, new_logged_out)

    # 5. Remove fallback gate in init()
    old_fallback_gate = """            if (!currentUser) {
                const overlay = document.getElementById('authOverlay');
                if (overlay) overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }"""

    new_fallback_gate = """            if (!currentUser) {
                const overlay = document.getElementById('authOverlay');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = 'auto';
            }"""

    content = content.replace(old_fallback_gate, new_fallback_gate)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"SUCCESS: Removed mandatory auth gate from {filepath}")

remove_auth_gate(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\js\auth.js")
remove_auth_gate(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\js\auth.js")

print("Mandatory authentication removal complete!")
