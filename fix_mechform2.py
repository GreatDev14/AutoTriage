#!/usr/bin/env python3
"""Clean replacement of submitMechForm and closeSuccessModal in netlify_deploy/index.html"""

HTML_FILE = r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html"

with open(HTML_FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find boundaries
start_idx = None
close_idx = None
chat_idx = None

for i, line in enumerate(lines):
    if 'function submitMechForm()' in line and start_idx is None:
        start_idx = i
    if 'function closeSuccessModal()' in line and start_idx is not None:
        close_idx = i
    if 'function chatWithAdmin()' in line and close_idx is not None:
        chat_idx = i
        break

print(f"submitMechForm: line {start_idx+1}")
print(f"closeSuccessModal: line {close_idx+1}")
print(f"chatWithAdmin: line {chat_idx+1}")

# We replace from submitMechForm to end of closeSuccessModal (right before chatWithAdmin)
end_idx = chat_idx  # exclusive

NEW_CODE = """    function submitMechForm() {
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

      // Replace form card content with greeting — appears right where the form is
      var formBox = document.getElementById('mechFormBox');
      if (!formBox) { alert('Thank you ' + name + '! Application submitted.'); return; }

      var originalHTML = formBox.innerHTML;
      formBox.style.transition = 'opacity 0.25s ease';
      formBox.style.opacity = '0';

      setTimeout(function() {
        var card = document.createElement('div');
        card.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 24px;min-height:360px;';
        card.style.animation = 'none';

        var html = '';
        html += '<style>@keyframes mIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}</style>';
        html += '<div style="animation:mIn 0.45s cubic-bezier(0.22,1,0.36,1) both;display:flex;flex-direction:column;align-items:center;width:100%;">';
        html += '<div style="font-size:60px;margin-bottom:14px;line-height:1;">&#127881;</div>';
        html += '<div style="background:rgba(255,51,51,0.15);border:1px solid rgba(255,51,51,0.4);';
        html += 'color:#ff3333;font-size:9px;font-family:\\'Space Mono\\',monospace;';
        html += 'font-weight:bold;letter-spacing:2px;text-transform:uppercase;';
        html += 'padding:5px 16px;border-radius:20px;margin-bottom:16px;display:inline-block;">';
        html += '&#128293; WELCOME TO AUTOTRIAGE NETWORK</div>';
        html += '<h2 style="font-family:\\'Bebas Neue\\',Impact,sans-serif;font-size:34px;color:#fff;';
        html += 'letter-spacing:2px;margin:0 0 10px;line-height:1.1;">';
        html += 'GREETINGS, <span style="color:#ff3333;">' + name.toUpperCase() + '</span>!</h2>';
        html += '<p style="font-size:12px;color:rgba(255,255,255,0.65);font-family:\\'Space Mono\\',monospace;';
        html += 'line-height:1.7;margin:0 0 22px;max-width:300px;">';
        html += 'Your <strong style="color:#fff;">' + spec + '</strong> workshop in ';
        html += '<strong style="color:#fff;">' + city + '</strong> has been added to the AutoTriage queue!</p>';
        html += '<div style="width:100%;background:rgba(0,208,132,0.06);border:1px solid rgba(0,208,132,0.25);';
        html += 'border-radius:12px;padding:14px 16px;text-align:left;margin-bottom:22px;">';
        html += '<div style="color:#00d084;font-size:9px;font-family:\\'Space Mono\\',monospace;';
        html += 'font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">';
        html += '&#128231; EMAIL CONFIRMATION</div>';
        html += '<div style="color:#fff;font-size:12px;font-family:\\'Space Mono\\',monospace;">';
        html += 'Sending to: <span style="color:#00d084;">' + email + '</span></div></div>';
        html += '<button id="mechDoneBtn" style="width:100%;background:linear-gradient(135deg,#ff3333,#cc0000);';
        html += 'color:#fff;border:none;padding:16px;border-radius:14px;';
        html += 'font-family:\\'Space Mono\\',monospace;font-size:12px;font-weight:bold;';
        html += 'letter-spacing:1.5px;cursor:pointer;text-transform:uppercase;';
        html += 'box-shadow:0 8px 24px rgba(255,51,51,0.4);margin-top:4px;">DONE &#8594;</button>';
        html += '</div>';

        formBox.innerHTML = html;
        formBox.style.opacity = '1';

        var db = document.getElementById('mechDoneBtn');
        if (db) {
          db.onmouseover = function(){this.style.transform='translateY(-2px)';};
          db.onmouseout  = function(){this.style.transform='translateY(0)';};
          db.onclick = function(){
            formBox.style.opacity='0';
            setTimeout(function(){formBox.innerHTML=originalHTML;formBox.style.opacity='1';},250);
          };
        }
      }, 250);

      // Background: save + email (100ms delay so greeting shows instantly)
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
    }

    function closeSuccessModal() {
      var m = document.getElementById('mechSuccessModal');
      if (m) m.remove();
    }

"""

new_lines = lines[:start_idx] + [NEW_CODE] + lines[end_idx:]
with open(HTML_FILE, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Done! Replaced lines {start_idx+1} to {end_idx}. New total: {len(new_lines)}")
