
    // Cursor
    const cur = document.getElementById('cursor'), ring = document.getElementById('cursor-ring');
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cur.style.transform = `translate(${mx - 6}px,${my - 6}px)`;
    });
    (function anim() { rx += (mx - rx) * 0.15; ry += (my - ry) * 0.15; ring.style.transform = `translate(${rx - 18}px,${ry - 18}px)`; requestAnimationFrame(anim); })();

    // Scroll reveal (REMOVED — Handled by GSAP)

    // Scroll Progress
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      document.getElementById("scrollProgress").style.width = scrolled + "%";
    });

    // Video play
    function playVideo() {
      const overlay = document.getElementById('videoOverlay');
      const video = document.getElementById('videoPlayer');
      if (overlay) {
        overlay.classList.add('hidden');
        if (typeof gsap !== 'undefined') {
          gsap.to(overlay, {
            opacity: 0,
            duration: 0.6,
            pointerEvents: 'none',
            onComplete: () => {
              overlay.style.display = 'none';
              if (video) video.play();
            }
          });
        } else {
          overlay.style.display = 'none';
          if (video) video.play();
        }
      }
    }

    // Mechanic form
    // MECHANIC REGISTRY SYSTEM
    function saveApplicant(data) {
      const registry = JSON.parse(localStorage.getItem('at_mechanic_registry') || '[]');
      data.id = Date.now();
      data.timestamp = new Date().toLocaleString();
      registry.push(data);
      localStorage.setItem('at_mechanic_registry', JSON.stringify(registry));
      updateAdminStats();
    }

    function updateAdminStats() {
      const registry = JSON.parse(localStorage.getItem('at_mechanic_registry') || '[]');
      const count = registry.length;
      if (document.getElementById('adminCount')) document.getElementById('adminCount').innerText = count;

      const list = document.getElementById('adminList');
      if (list) {
        list.innerHTML = registry.reverse().map(m => `
          <div style="padding:15px; border-bottom:1px solid rgba(255,255,255,0.05); display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; font-size:11px; align-items:center;">
            <div style="color:white;"><b>${m.name}</b><br><span style="color:var(--gray)">${m.spec}</span></div>
            <div style="color:var(--gray)">
              ${m.phone}<br>
              ${m.certificateData ? `<a href="${m.certificateData}" target="_blank" style="color:var(--accent); text-decoration:none;">📄 View Cert</a>` : `<span style="color:#ff6666">No Cert</span>`}
            </div>
            <div style="text-align:right;">
              ${m.verified ?
            `<span style="color:#25D366; font-weight:700; margin-right:10px;">LIVE ON SITE</span>` :
            `<button onclick="approveMechanic(${m.id})" style="background:var(--accent); color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:10px; font-weight:700;">APPROVE</button>`
          }
            </div>
          </div>
        `).join('');
      }
    }

    function approveMechanic(id) {
      const registry = JSON.parse(localStorage.getItem('at_mechanic_registry') || '[]');
      const index = registry.findIndex(m => m.id === id);
      if (index !== -1) {
        registry[index].verified = true;
        localStorage.setItem('at_mechanic_registry', JSON.stringify(registry));
        updateAdminStats();

        // Push directly to the public app database in localStorage
        const m = registry[index];
        const newMech = {
          name: m.name,
          spec: m.spec,
          city: m.city,
          area: m.city + ', Global',
          phone: m.phone,
          wa: m.phone,
          rating: 5.0,
          rev: 0,
          isVerified: true, // This triggers the ✅ AutoTriage Pro badge
          isPlatformUser: true,
          avail: 'open',
          emoji: '👨🏾‍🔧'
        };

        let publicMechs = [];
        try {
          publicMechs = JSON.parse(localStorage.getItem('autoTriage_mechanics') || '[]');
        } catch (e) { }

        // Prevent duplicate approvals
        if (!publicMechs.some(p => p.phone === newMech.phone)) {
          publicMechs.unshift(newMech);
          localStorage.setItem('autoTriage_mechanics', JSON.stringify(publicMechs));
        }

        alert(`🚀 ${registry[index].name} is now LIVE and Verified on the app!`);
      }
    }

    function exportRegistry() {
      const registry = JSON.parse(localStorage.getItem('at_mechanic_registry') || '[]');
      if (registry.length === 0) return alert("Registry is empty!");

      let csv = "ID,Name,Phone,Specialization,City,Timestamp\n";
      registry.forEach(m => {
        csv += `${m.id},"${m.name}","${m.phone}","${m.spec}","${m.city}","${m.timestamp}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', 'autotriage_mechanics.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    function toggleAdmin() {
      // Check device recognition
      const isAuth = localStorage.getItem('at_admin_auth') === 'true';

      if (!isAuth) {
        const pin = prompt("🔐 AUTO TRIAGE ADMIN ACCESS\nEnter Master Security PIN:");
        if (pin === '5522') {
          localStorage.setItem('at_admin_auth', 'true');
          alert("✅ Device Recognized. Admin Access Granted.");
        } else {
          return alert("❌ Access Denied: Unauthorized Device.");
        }
      }

      const modal = document.getElementById('adminDashboard');
      const isVisible = modal.style.display === 'flex';
      modal.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        updateAdminStats();
        gsap.from(".admin-content", { y: 100, opacity: 0, duration: 0.5, ease: "power4.out" });
      }
    }

    function triggerSuccessBurst() {
      const container = document.getElementById('mechSuccessModal');
      for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'success-particle';
        container.appendChild(p);
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 200;
        gsap.set(p, { x: window.innerWidth / 2, y: window.innerHeight / 2, scale: Math.random() * 2 });
        gsap.to(p, {
          x: window.innerWidth / 2 + Math.cos(angle) * dist,
          y: window.innerHeight / 2 + Math.sin(angle) * dist,
          opacity: 0, scale: 0, duration: 1 + Math.random(), ease: "power2.out",
          onComplete: () => p.remove()
        });
      }
    }

    function submitMechForm() {
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
        html += 'color:#ff3333;font-size:9px;font-family:\'Space Mono\',monospace;';
        html += 'font-weight:bold;letter-spacing:2px;text-transform:uppercase;';
        html += 'padding:5px 16px;border-radius:20px;margin-bottom:16px;display:inline-block;">';
        html += '&#128293; WELCOME TO AUTOTRIAGE NETWORK</div>';
        html += '<h2 style="font-family:\'Bebas Neue\',Impact,sans-serif;font-size:34px;color:#fff;';
        html += 'letter-spacing:2px;margin:0 0 10px;line-height:1.1;">';
        html += 'GREETINGS, <span style="color:#ff3333;">' + name.toUpperCase() + '</span>!</h2>';
        html += '<p style="font-size:12px;color:rgba(255,255,255,0.65);font-family:\'Space Mono\',monospace;';
        html += 'line-height:1.7;margin:0 0 22px;max-width:300px;">';
        html += 'Your <strong style="color:#fff;">' + spec + '</strong> workshop in ';
        html += '<strong style="color:#fff;">' + city + '</strong> has been added to the AutoTriage queue!</p>';
        html += '<div style="width:100%;background:rgba(0,208,132,0.06);border:1px solid rgba(0,208,132,0.25);';
        html += 'border-radius:12px;padding:14px 16px;text-align:left;margin-bottom:22px;">';
        html += '<div style="color:#00d084;font-size:9px;font-family:\'Space Mono\',monospace;';
        html += 'font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">';
        html += '&#128231; EMAIL CONFIRMATION</div>';
        html += '<div style="color:#fff;font-size:12px;font-family:\'Space Mono\',monospace;">';
        html += 'Sending to: <span style="color:#00d084;">' + email + '</span></div></div>';
        html += '<button id="mechDoneBtn" style="width:100%;background:linear-gradient(135deg,#ff3333,#cc0000);';
        html += 'color:#fff;border:none;padding:16px;border-radius:14px;';
        html += 'font-family:\'Space Mono\',monospace;font-size:12px;font-weight:bold;';
        html += 'letter-spacing:1.5px;cursor:pointer;text-transform:uppercase;';
        html += 'box-shadow:0 8px 24px rgba(255,51,51,0.4);margin-top:4px;">DONE &#8594;</button>';
        html += '</div>';

        formBox.innerHTML = html;
        formBox.style.opacity = '1';

        var restoreForm = function() {
          formBox.style.opacity = '0';
          setTimeout(function() {
            formBox.innerHTML = originalHTML;
            formBox.style.opacity = '1';
          }, 250);
        };

        // Auto-remove after 6 seconds (as requested by user)
        var autoTimer = setTimeout(function() {
          restoreForm();
        }, 6000);

        var db = document.getElementById('mechDoneBtn');
        if (db) {
          db.onmouseover = function(){this.style.transform='translateY(-2px)';};
          db.onmouseout  = function(){this.style.transform='translateY(0)';};
          db.onclick = function(){
            clearTimeout(autoTimer);
            restoreForm();
          };
        }
      }, 250);

      // Scroll to show the greeting (in case mechanics section is below viewport)
      if (formBox) {
        setTimeout(function() {
          formBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
      }

      // 1. Save to localStorage (fast, synchronous-ish)
      try {
        var s = JSON.parse(localStorage.getItem('at_applicants') || '[]');
        s.push({ name: name, phone: phone, email: email, spec: spec, city: city, t: new Date().toISOString() });
        localStorage.setItem('at_applicants', JSON.stringify(s));
      } catch(ex) {}

      // 2. Send email INDEPENDENTLY — not blocked by Firebase at all
      setTimeout(async function() {
        console.log('[AutoTriage] Sending email to:', email);
        try {
          var r = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: email, name: name, phone: phone, spec: spec, city: city })
          });
          var d = await r.json();
          console.log('[AutoTriage] Email sent:', d);
        } catch(ex) {
          console.warn('[AutoTriage] Function failed, trying Brevo direct:', ex.message);
          try {
            await fetch('https://api.brevo.com/v3/smtp/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'api-key': 'YOUR_BREVO_API_KEY' },
              body: JSON.stringify({
                sender: { name: 'AutoTriage', email: 'support@autotriage.app' },
                to: [{ email: email, name: name }],
                subject: 'Welcome to AutoTriage, ' + name + '!',
                htmlContent: '<p>Welcome <b>' + name + '</b>! Your ' + spec + ' workshop in ' + city + ' is in the AutoTriage queue.</p>',
                textContent: 'Welcome ' + name + '! Your workshop in ' + city + ' is in the AutoTriage queue.'
              })
            });
            console.log('[AutoTriage] Brevo direct sent');
          } catch(ex2) { console.error('[AutoTriage] All email failed:', ex2.message); }
        }
      }, 100);

      // 3. Save to Firebase in background (separate, cannot block email)
      setTimeout(async function() {
        if (window.FirebaseDB) {
          try {
            await window.FirebaseDB.collection('mechanics').add({ name: name, phone: phone, email: email, spec: spec, city: city, submittedAt: new Date().toISOString() });
            console.log('[AutoTriage] Saved to Firebase');
          } catch(ex) { console.warn('[AutoTriage] Firebase save failed:', ex.message); }
        }
      }, 200);
    }

    function closeSuccessModal() {
      var m = document.getElementById('mechSuccessModal');
      if (m) m.remove();
    }

    function chatWithAdmin() {
      const name = document.getElementById('dName').innerText;
      const text = encodeURIComponent(`Hi, I just applied as a mechanic on Auto Triage! My name is ${name}. I'm ready for the verification process.`);
      const whatsappUrl = `https://wa.me/1234567890?text=${text}`;
      window.open(whatsappUrl, '_blank');
      let explainerPlaying = false;
      let explainerDotTimer = null;
      let explainerDotStep = 0;

      function toggleExplainerPlay() {
        explainerPlaying = !explainerPlaying;
        const cards = document.querySelectorAll('.feat-card');
        const fill = document.getElementById('explainerProgressFill');
        const icon = document.getElementById('explainerPlayIcon');
        const label = document.getElementById('explainerPlayLabel');

        if (explainerPlaying) {
          cards.forEach(c => c.classList.add('playing'));
          if (fill) fill.classList.add('playing');
          if (icon) icon.innerText = '⏸';
          if (label) label.innerText = 'Pause';
          // Track which dot is active via a timer
          explainerDotStep = 0;
          clearInterval(explainerDotTimer);
          updateExplainerDot(0);
          explainerDotTimer = setInterval(() => {
            explainerDotStep = (explainerDotStep + 1) % 8;
            updateExplainerDot(explainerDotStep);
          }, 5000);
        } else {
          cards.forEach(c => c.classList.remove('playing'));
          if (fill) fill.classList.remove('playing');
          if (icon) icon.innerText = '▶';
          if (label) label.innerText = 'Play Explainer';
          clearInterval(explainerDotTimer);
        }
      }

      function updateExplainerDot(idx) {
        const dots = document.querySelectorAll('.edot');
        dots.forEach((d, i) => {
          d.classList.toggle('active', i === idx);
        });
      }

      function jumpExplainer(idx) {
        // Show the clicked card immediately by restarting that card's animation
        const cards = document.querySelectorAll('.feat-card');
        updateExplainerDot(idx);
      }

      function openVideoExplainerModal() {
        const modal = document.getElementById('videoExplainerModal');
        if (modal) {
          modal.style.display = 'flex';
          try {
            if (window.gsap) {
              gsap.from("#videoExplainerModal .success-content", { scale: 0.9, opacity: 0, duration: 0.4, ease: "power2.out" });
            }
          } catch (e) { }
          startExplainerSlideshow();
        }
      }

      function closeVideoExplainerModal() {
        const modal = document.getElementById('videoExplainerModal');
        if (modal) {
          modal.style.display = 'none';
        }
        stopExplainerSlideshow();
      }

      function startExplainerSlideshow() {
        stopExplainerSlideshow();
        selectExplainerChapter(currentExplainerSlide);
        explainerTimer = setInterval(() => {
          currentExplainerSlide = (currentExplainerSlide % 8) + 1;
          selectExplainerChapter(currentExplainerSlide);
        }, 4200);
      }

      function stopExplainerSlideshow() {
        if (explainerTimer) {
          clearInterval(explainerTimer);
          explainerTimer = null;
        }
      }

      function selectExplainerChapter(ch, isManual = false) {
        if (isManual) {
          currentExplainerSlide = ch;
          stopExplainerSlideshow();
          startExplainerSlideshow();
        }

        const title = document.getElementById('explainerPlayerTitle');
        const sub = document.getElementById('explainerPlayerSub');
        const badge = document.getElementById('explainerPlayerBadge');
        const progress = document.getElementById('explainerProgressBar');

        const chapters = {
          1: { badge: "▶ AUTO-PLAYING • SCENE 1/8 (AI DIAGNOSTICS)", title: "🤖 1. AI DIAGNOSTICS & SYMPTOM ENGINE", sub: "Input symptoms or DTC codes. AutoTriage AI analyzes root causes, calculates fault severity scores (1-100%), and provides instant USD repair cost estimates." },
          2: { badge: "▶ AUTO-PLAYING • SCENE 2/8 (GPS MECHANICS)", title: "🌐 2. GEOLOCATION MECHANICS & GOOGLE MAPS", sub: "Locate verified repair shops near your GPS coordinates. Registered users can view workshop profiles, call directly, send WhatsApp messages, and inspect Google Maps ratings." },
          3: { badge: "▶ AUTO-PLAYING • SCENE 3/8 (RIDE DISPATCH)", title: "🚕 3. EMERGENCY RIDES & DISPATCH ENGINE", sub: "Book emergency rides & tow trucks directly from high-profile responder platforms when stranded on the road." },
          4: { badge: "▶ AUTO-PLAYING • SCENE 4/8 (MY GARAGE)", title: "🚘 4. MY GARAGE & VEHICLE HEALTH WARNINGS", sub: "Monitor real-time engine/battery health status, track diagnostic history, and receive early maintenance warning alerts before breakdowns occur." },
          5: { badge: "▶ AUTO-PLAYING • SCENE 5/8 (DISTRESS SOS)", title: "🆘 5. EMERGENCY 1-TAP DISTRESS ASSISTANT", sub: "Instant 1-tap SOS distress beacon broadcasts your exact GPS coordinates and vehicle diagnostic brief to nearest emergency responders." },
          6: { badge: "▶ AUTO-PLAYING • SCENE 6/8 (VOICE DRIVE MODE)", title: "🎙️ 6. HANDS-FREE VOICE DRIVE MODE", sub: "Say 'HELP HELP' while driving for hands-free voice diagnostic assistance, emergency dispatch, and live voice navigation guidance." },
          7: { badge: "▶ AUTO-PLAYING • SCENE 7/8 (OEM PARTS)", title: "🔩 7. OEM & AFTERMARKET PARTS PRICING", sub: "Fetch exact vehicle replacement parts, OEM numbers, and real-time pricing sourced directly from verified automotive part suppliers." },
          8: { badge: "▶ AUTO-PLAYING • SCENE 8/8 (PRE-LAUNCH ROADMAP)", title: "🚀 8. PRE-LAUNCH BETA ROADMAP", sub: "Multi-device web app live in browser. Native mobile (iOS & Android) and desktop app store releases rolling out soon!" }
        };

        if (chapters[ch]) {
          if (badge) badge.innerText = chapters[ch].badge;
          if (title) title.innerText = chapters[ch].title;
          if (sub) sub.innerText = chapters[ch].sub;

          if (progress) {
            progress.style.transition = 'none';
            progress.style.width = '0%';
            setTimeout(() => {
              progress.style.transition = 'width 4.1s linear';
              progress.style.width = '100%';
            }, 50);
          }

          for (let i = 1; i <= 8; i++) {
            const tab = document.getElementById(`explainerTab${i}`);
            if (tab) {
              if (i === ch) {
                tab.style.background = 'rgba(255, 51, 51, 0.15)';
                tab.style.borderColor = '#ff3333';
                tab.style.boxShadow = '0 0 15px rgba(255, 51, 51, 0.3)';
              } else {
                tab.style.background = 'rgba(255, 255, 255, 0.03)';
                tab.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                tab.style.boxShadow = 'none';
              }
            }
          }
        }
      }

      function startInteractiveSystemTour() {
        closeVideoExplainerModal();
        window.location.href = "simple.html";
      }
  