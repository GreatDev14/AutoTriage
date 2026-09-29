#!/usr/bin/env python3
"""
Enforce Mandatory Auth Gate:
1. Modal shows FIRST on page load when unauthenticated (class='clean-auth-overlay active').
2. Cannot be closed or removed until user logs in or creates an account.
3. Close button hidden and backdrop click disabled when unauthenticated.
4. Smoothly unlocks site once account is created or signed in.
"""

import os

def enforce_gate(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Overlay is active by default on creation
    content = content.replace(
        "overlay.className = 'clean-auth-overlay';",
        "overlay.className = 'clean-auth-overlay active';"
    )

    # 2. Backdrop click only closes if logged in
    content = content.replace(
        "if (e.target === overlay) {",
        "if (e.target === overlay && currentUser) {"
    )

    # 3. toggle() blocks closing if unauthenticated
    old_toggle = """    function toggle() {
        const overlay = document.getElementById('authOverlay');
        if (!overlay) return;

        overlay.classList.toggle('active');"""

    new_toggle = """    function toggle() {
        const overlay = document.getElementById('authOverlay');
        if (!overlay) return;

        // If unauthenticated, DO NOT allow toggling off (mandatory auth gate)
        if (!currentUser) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            return;
        }

        overlay.classList.toggle('active');"""

    content = content.replace(old_toggle, new_toggle)

    # 4. onAuthStateChanged logged out state forces modal active and hides close button
    old_logged_out = """                } else {
                    currentUser = null;
                    localStorage.removeItem('autotriage_user');

                    if (overlay) {
                        overlay.classList.remove('active');
                    }
                    document.body.style.overflow = 'auto';
                }"""

    new_logged_out = """                } else {
                    currentUser = null;
                    localStorage.removeItem('autotriage_user');

                    // MANDATORY AUTH GATE: Show modal and lock scrolling when logged out
                    if (overlay) {
                        overlay.classList.add('active');
                    }
                    if (closeBtn) {
                        closeBtn.style.display = 'none'; // Cannot close when logged out
                    }
                    document.body.style.overflow = 'hidden';
                }"""

    content = content.replace(old_logged_out, new_logged_out)

    # 5. Fallback in init() forces modal active if unauthenticated
    old_fallback = """            if (!currentUser) {
                const overlay = document.getElementById('authOverlay');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = 'auto';
            }"""

    new_fallback = """            if (!currentUser) {
                const overlay = document.getElementById('authOverlay');
                if (overlay) overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }"""

    content = content.replace(old_fallback, new_fallback)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"SUCCESS: Enforced mandatory auth gate in {filepath}")

enforce_gate(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\js\auth.js")
enforce_gate(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\js\auth.js")

print("Mandatory auth gate enforcement complete!")
