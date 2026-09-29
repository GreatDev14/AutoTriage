
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