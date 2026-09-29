#!/usr/bin/env python3
"""
Fix Auth Lag, Black Reload & Signup Email:
 1. Remove location.reload() from handleAction() in auth.js so page doesn't lag/reload/flash black.
 2. await the welcome email fetch call during signup so the email completes before closing modal.
"""

import os

def fix_auth_js(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update signup email block to be awaited
    old_email_block = """                // Send Welcome Email via Netlify function / Brevo
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

    new_email_block = """                // Send Welcome Email via Netlify function / Brevo
                try {
                    console.log('[AutoTriage Auth] Sending welcome email to:', email);
                    await fetch('/.netlify/functions/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: email,
                            name: email.split('@')[0],
                            spec: 'Registered Driver',
                            city: 'AutoTriage Network'
                        })
                    });
                    console.log('[AutoTriage Auth] Welcome email sent successfully');
                } catch (emailErr) {
                    console.warn('[AutoTriage Auth] Welcome email failed:', emailErr.message);
                }"""

    if old_email_block in content:
        content = content.replace(old_email_block, new_email_block, 1)

    # 2. Remove location.reload()
    old_success_block = """            setTimeout(() => {
                btn.style.background = 'linear-gradient(135deg, #ff3333, #aa0000)';
                const overlay = document.getElementById('authOverlay');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = 'auto';

                if (typeof updateUIAfterLogin === 'function') updateUIAfterLogin();
                if (typeof renderUserProfile === 'function') renderUserProfile();
                location.reload();
            }, 600);"""

    new_success_block = """            setTimeout(() => {
                btn.style.background = 'linear-gradient(135deg, #ff3333, #aa0000)';
                const overlay = document.getElementById('authOverlay');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = 'auto';

                if (typeof updateUIAfterLogin === 'function') updateUIAfterLogin();
                if (typeof renderUserProfile === 'function') renderUserProfile();
                // Removed location.reload() to prevent screen flash & page lag
            }, 400);"""

    if old_success_block in content:
        content = content.replace(old_success_block, new_success_block, 1)
        print(f"Removed location.reload() and updated email await in {filepath}")
    else:
        print(f"Warning: Success block not matched in {filepath}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_auth_js(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\js\auth.js")
fix_auth_js(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\js\auth.js")

print("Auth JS updates completed!")
