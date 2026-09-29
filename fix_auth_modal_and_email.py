#!/usr/bin/env python3
"""
Fix Auth Modal & Signup Email in netlify_deploy/js/auth.js and js/auth.js:
 1. Send welcome email upon user signup via Netlify function / Brevo
 2. Ensure close button is ALWAYS available (display: flex) so user isn't stuck on black screen
 3. Fix overlay CSS so backdrop blur doesn't cause black screen GPU rendering bugs
"""

import os

def fix_auth_js(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update closeBtn display when logged out (lines 53-55)
    content = content.replace("closeBtn.style.display = 'none'; // Cannot close when logged out", "closeBtn.style.display = 'flex';")

    # 2. Update .clean-auth-close CSS (line 115)
    content = content.replace("display: none; align-items: center;", "display: flex; align-items: center;")

    # 3. Update overlay CSS background and blur (lines 81-83)
    old_overlay_css = """                background: rgba(10, 10, 10, 0.85);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);"""
    
    new_overlay_css = """                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);"""

    content = content.replace(old_overlay_css, new_overlay_css)

    # 4. Add welcome email dispatch to signup mode in handleAction
    old_signup_block = """                await FirebaseDB.collection('users').doc(user.uid).set({
                    email: user.email,
                    name: email.split('@')[0],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    role: 'driver',
                    isVerified: true
                });"""

    new_signup_block = """                await FirebaseDB.collection('users').doc(user.uid).set({
                    email: user.email,
                    name: email.split('@')[0],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    role: 'driver',
                    isVerified: true
                });

                // Send Welcome Email via Netlify function / Brevo
                try {
                    fetch('/.netlify/functions/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: email,
                            name: email.split('@')[0],
                            spec: 'Registered Driver',
                            city: 'AutoTriage Network'
                        })
                    }).catch(err => console.warn('Welcome email error:', err));
                } catch (emailErr) {}"""

    if old_signup_block in content:
        content = content.replace(old_signup_block, new_signup_block, 1)
        print(f"Added welcome email to signup in {filepath}")
    else:
        print(f"Warning: Signup block not matched in {filepath}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"SUCCESS: Fixed auth modal & signup email in {filepath}")

fix_auth_js(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\js\auth.js")
fix_auth_js(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\js\auth.js")

print("Auth JS updates complete!")
