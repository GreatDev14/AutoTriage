#!/usr/bin/env python3
"""
Fix submitMechForm in netlify_deploy/index.html
Replace lines 2311-2406 (0-indexed: 2310-2405) with the clean new function.
"""

HTML_FILE = r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html"

NEW_FUNC = r'''    function submitMechForm() {
      var fieldIds = ['jName','jPhone','jEmail','jSpec','jCity'];
      var allValid = true;
      fieldIds.forEach(function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        var val = el.tagName === 'SELECT' ? el.value : el.value.trim();
        if (!val || val === '') {
          el.style.outline = '2px solid #ff3333';
          el.style.background = 'rgba(255,51,51,0.1)';
          allValid = false;
        } else {
          el.style.outline = 'none';
          el.style.background = '';
        }
      });
      if (!allValid) {
        alert('Please fill in all fields (Name, Phone, Email, Specialization, City).');
        return;
      }
      var name  = document.getElementById('jName').value.trim();
      var phone = document.getElementById('jPhone').value.trim();
      var email = document.getElementById('jEmail').value.trim();
      var spec  = document.getElementById('jSpec').value;
      var city  = document.getElementById('jCity').value.trim();

      // Remove any old modal
      var old = document.getElementById('mechSuccessModal');
      if (old) old.remove();

      // Build modal dynamically — no CSS class dependency, max z-index, always works
      var overlay = document.createElement('div');
      overlay.id = 'mechSuccessModal';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;background:rgba(0,0,0,0.93);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';

      var card = document.createElement('div');
      card.style.cssText = 'max-width:440px;width:100%;text-align:center;border-radius:28px;padding:36px 28px;background:linear-gradient(135deg,#0d0f17,#171926);border:1px solid rgba(255,51,51,0.4);box-shadow:0 24px 60px rgba(0,0,0,0.9),0 0 35px rgba(255,51,51,0.2);position:relative;box-sizing:border-box;';

      card.innerHTML =
        '<style>@keyframes mechIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}</style>' +
        '<div onclick="document.getElementById(\'mechSuccessModal\').remove()" style="position:absolute;top:16px;right:20px;color:rgba(255,255,255,0.45);font-size:30px;cursor:pointer;line-height:1;">&times;</div>' +
        '<div style="font-size:56px;margin-bottom:10px;">&#127881;</div>' +
        '<div style="color:#ff3333;font-size:9px;font-family:\'Space Mono\',monospace;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">&#128293; WELCOME TO AUTOTRIAGE NETWORK</div>' +
        '<h2 style="font-family:\'Bebas Neue\',sans-serif;font-size:32px;color:#fff;letter-spacing:1.5px;margin:0 0 8px;line-height:1.1;">GREETINGS, <span style="color:#ff3333;">' + name.toUpperCase() + '</span>!</h2>' +
        '<p style="font-size:12px;color:rgba(255,255,255,0.7);font-family:\'Space Mono\',monospace;line-height:1.6;margin:0 0 20px;"><strong style="color:#fff;">' + spec + '</strong> workshop in <strong style="color:#fff;">' + city + '</strong> submitted to the AutoTriage queue!</p>' +
        '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;text-align:left;margin-bottom:20px;font-family:\'Space Mono\',monospace;">' +
          '<div style="color:#ff3333;font-size:9px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">&#128231; CONFIRMATION</div>' +
          '<div style="color:#fff;font-size:11px;margin-bottom:4px;">Email sending to: <span style="color:#00d084;">' + email + '</span></div>' +
          '<div style="color:rgba(255,255,255,0.55);font-size:10.5px;line-height:1.5;">Our compliance team will verify and contact you before launch.</div>' +
        '</div>' +
        '<button onclick="document.getElementById(\'mechSuccessModal\').remove()" style="width:100%;background:#ff3333;color:#fff;border:none;padding:16px;border-radius:14px;font-family:\'Space Mono\',monospace;font-size:12px;font-weight:bold;letter-spacing:1px;cursor:pointer;">DONE &rarr;</button>';

      card.style.animation = 'mechIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both';
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      // Reset form
      ['jName','jPhone','jEmail','jCity'].forEach(function(id) {
        var el = document.getElementById(id); if (el) el.value = '';
      });
      var se = document.getElementById('jSpec'); if (se) se.selectedIndex = 0;

      // Background: save + email
      setTimeout(async function() {
        // localStorage
        try {
          var s = JSON.parse(localStorage.getItem('at_applicants') || '[]');
          s.push({ name: name, phone: phone, email: email, spec: spec, city: city, t: new Date().toISOString() });
          localStorage.setItem('at_applicants', JSON.stringify(s));
        } catch(ex) {}

        // Firebase
        if (window.FirebaseDB) {
          try {
            await window.FirebaseDB.collection('mechanics').add({ name: name, phone: phone, email: email, spec: spec, city: city, submittedAt: new Date().toISOString() });
            console.log('Mechanic saved to Firebase');
          } catch(ex) { console.warn('Firebase:', ex.message); }
        }

        // Email HTML
        var eHtml = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#0b0d14;color:#fff;margin:0;padding:24px;">' +
          '<div style="max-width:540px;margin:0 auto;background:#131622;border:1px solid rgba(255,51,51,0.3);border-radius:20px;padding:28px;">' +
          '<h2 style="color:#fff;margin:0 0 12px;">Welcome, ' + name + '! &#128296;&#9889;</h2>' +
          '<p style="color:#a1a1aa;font-size:13px;line-height:1.6;">Your application to the AutoTriage Pro Responder Network has been received.</p>' +
          '<div style="background:#1a1e2e;border-radius:12px;padding:16px;margin:16px 0;font-family:monospace;font-size:12px;">' +
            '<div style="color:#ff3333;margin-bottom:8px;font-weight:bold;">APPLICATION DETAILS</div>' +
            '<div style="color:#e4e4e7;margin-bottom:4px;">Name: ' + name + '</div>' +
            '<div style="color:#e4e4e7;margin-bottom:4px;">Specialization: ' + spec + '</div>' +
            '<div style="color:#e4e4e7;margin-bottom:4px;">Phone: ' + phone + '</div>' +
            '<div style="color:#e4e4e7;">City: ' + city + '</div>' +
          '</div>' +
          '<p style="font-size:11px;color:#52525b;text-align:center;">Questions? <a href="mailto:support@autotriage.app" style="color:#ff3333;">support@autotriage.app</a></p>' +
          '</div></body></html>';

        // Send email via Netlify function, fallback to Brevo direct
        var emailSent = false;
        try {
          var r = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: email, subject: 'Welcome to AutoTriage, ' + name + '!', html: eHtml, text: 'Welcome ' + name + '! Application received for ' + spec + ' in ' + city + '.' })
          });
          var d = await r.json();
          console.log('Email sent via Netlify function:', d);
          emailSent = true;
        } catch(ex) {
          console.warn('Netlify function failed, trying Brevo direct:', ex.message);
        }
        if (!emailSent) {
          try {
            await fetch('https://api.brevo.com/v3/smtp/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'api-key': 'YOUR_BREVO_API_KEY' },
              body: JSON.stringify({ sender: { name: 'AutoTriage Team', email: 'support@autotriage.app' }, to: [{ email: email }], subject: 'Welcome to AutoTriage, ' + name + '!', htmlContent: eHtml, textContent: 'Welcome ' + name + '! Application received.' })
            });
            console.log('Brevo direct email sent successfully');
          } catch(ex2) { console.error('All email methods failed:', ex2); }
        }
      }, 100);
    }

    function closeSuccessModal() {
      var m = document.getElementById('mechSuccessModal');
      if (m) m.remove();
    }

'''

with open(HTML_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
print(f"Total lines: {len(lines)}")

# Find start of submitMechForm
start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if 'function submitMechForm()' in line and start_idx is None:
        start_idx = i
    if start_idx is not None and 'function closeSuccessModal()' in line:
        # Find closing brace of closeSuccessModal
        brace_count = 0
        for j in range(i, min(i+30, len(lines))):
            brace_count += lines[j].count('{') - lines[j].count('}')
            if brace_count <= 0 and j > i:
                end_idx = j + 1
                break
        break

print(f"submitMechForm starts at line {start_idx+1} (0-indexed: {start_idx})")
print(f"closeSuccessModal+block ends at line {end_idx+1} (0-indexed: {end_idx})")

# Replace
new_lines = lines[:start_idx] + NEW_FUNC.split('\n') + lines[end_idx:]
new_content = '\n'.join(new_lines)

with open(HTML_FILE, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Done! New total lines: {len(new_lines)}")
