#!/usr/bin/env python3
"""
Fix submitMechForm:
 1. Send name/phone/spec/city fields to the Netlify function (not just HTML)
 2. Auto-scroll to the greeting after submission
"""

HTML_FILE = r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html"

with open(HTML_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace ONLY the email sending block inside submitMechForm
# The block we're targeting: the setTimeout(async function() ... email sending part
OLD_EMAIL_BLOCK = """      // Background: save + email (100ms delay so greeting shows instantly)
      setTimeout(async function() {
        try {
          var s=JSON.parse(localStorage.getItem('at_applicants')||'[]');
          s.push({name:name,phone:phone,email:email,spec:spec,city:city,t:new Date().toISOString()});
          localStorage.setItem('at_applicants',JSON.stringify(s));
        } catch(ex){}

        if(window.FirebaseDB){
          try{
            await window.FirebaseDB.collection('mechanics').add({name:name,phone:phone,email:email,spec:spec,city:city,submittedAt:new Date().toISOString()});
            console.log('Saved to Firebase');
          }catch(ex){console.warn('Firebase:',ex.message);}
        }

        var eHtml = '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#0b0d14;color:#fff;margin:0;padding:24px;">'
          + '<div style="max-width:540px;margin:0 auto;background:#131622;border:1px solid rgba(255,51,51,0.3);border-radius:20px;padding:28px;">'
          + '<h2 style="color:#fff;margin:0 0 12px;">Welcome, ' + name + '! &#128296;&#9889;</h2>'
          + '<p style="color:#a1a1aa;font-size:13px;line-height:1.6;">Application received for <strong>' + spec + '</strong> in <strong>' + city + '</strong>.</p>'
          + '<div style="background:#1a1e2e;border-radius:12px;padding:16px;margin:16px 0;font-family:monospace;font-size:12px;">'
          + '<div style="color:#ff3333;margin-bottom:8px;font-weight:bold;">APPLICATION DETAILS</div>'
          + '<div style="color:#e4e4e7;margin-bottom:4px;">Name: ' + name + '</div>'
          + '<div style="color:#e4e4e7;margin-bottom:4px;">Specialization: ' + spec + '</div>'
          + '<div style="color:#e4e4e7;margin-bottom:4px;">Phone: ' + phone + '</div>'
          + '<div style="color:#e4e4e7;">City: ' + city + '</div>'
          + '</div>'
          + '<p style="font-size:11px;color:#52525b;text-align:center;">Questions? <a href="mailto:support@autotriage.app" style="color:#ff3333;">support@autotriage.app</a></p>'
          + '</div></body></html>';

        var emailSent = false;
        try{
          var r=await fetch('/api/send-email',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({to:email,subject:'Welcome to AutoTriage, '+name+'!',html:eHtml,text:'Welcome '+name+'!'})});
          var d=await r.json();
          console.log('Email sent via function:', d);
          emailSent=true;
        }catch(ex){console.warn('Function failed:',ex.message);}

        if(!emailSent){
          try{
            await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',
              headers:{'Content-Type':'application/json','Accept':'application/json','api-key':'YOUR_BREVO_API_KEY'},
              body:JSON.stringify({sender:{name:'AutoTriage Team',email:'support@autotriage.app'},
                to:[{email:email}],subject:'Welcome to AutoTriage, '+name+'!',
                htmlContent:eHtml,textContent:'Welcome '+name+'!'})});
            console.log('Brevo direct email sent');
          }catch(ex2){console.error('All email failed:',ex2);}
        }
      }, 300);
    }"""

NEW_EMAIL_BLOCK = """      // Scroll to show the greeting (in case mechanics section is below viewport)
      if (formBox) {
        setTimeout(function() {
          formBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
      }

      // Background: save to localStorage + Firebase + send email via Netlify function
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
            console.log('[AutoTriage] Saved to Firebase');
          } catch(ex) { console.warn('[AutoTriage] Firebase save failed:', ex.message); }
        }

        // Send email via Netlify function (function generates the HTML email server-side)
        try {
          var r = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: email, name: name, phone: phone, spec: spec, city: city })
          });
          var d = await r.json();
          console.log('[AutoTriage] Email result:', d);
        } catch(ex) {
          console.warn('[AutoTriage] Email function failed:', ex.message);
          // Fallback: call Brevo directly from browser
          try {
            await fetch('https://api.brevo.com/v3/smtp/email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'api-key': 'YOUR_BREVO_API_KEY'
              },
              body: JSON.stringify({
                sender: { name: 'AutoTriage', email: 'support@autotriage.app' },
                to: [{ email: email, name: name }],
                subject: 'Welcome to AutoTriage, ' + name + '! 🎉',
                htmlContent: '<p>Welcome <b>' + name + '</b>! Your ' + spec + ' workshop in ' + city + ' has been added to the AutoTriage queue. Our team will contact you before launch.</p>',
                textContent: 'Welcome ' + name + '! Your ' + spec + ' workshop in ' + city + ' has been added to the AutoTriage queue.'
              })
            });
            console.log('[AutoTriage] Brevo fallback sent');
          } catch(ex2) { console.error('[AutoTriage] All email methods failed:', ex2.message); }
        }
      }, 400);
    }"""

if OLD_EMAIL_BLOCK in content:
    content = content.replace(OLD_EMAIL_BLOCK, NEW_EMAIL_BLOCK, 1)
    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: Email block replaced + scrollIntoView added")
else:
    print("ERROR: Old email block not found — searching for partial match...")
    # Try to find what's there
    idx = content.find("setTimeout(async function() {")
    if idx >= 0:
        print(f"Found setTimeout at char {idx}")
        print(content[idx:idx+200])
    else:
        print("No setTimeout found either")
