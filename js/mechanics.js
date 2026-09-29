const MechanicsModule = (() => {
  let activeSpec = 'All';

  function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  function render(list) {
    const grid = document.getElementById('mechGrid');
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; padding:60px 20px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:20px;">
          <div style="color:#8e93a0; font-size:12px; letter-spacing:2px; font-family:'Space Mono',monospace; text-transform:uppercase;">No mechanics found locally</div>
          <button onclick="
            const btn = this;
            btn.innerHTML = 'SCANNING TOMTOM...';
            btn.style.opacity = '0.5';
            if(window.fetchRealMechanics) {
              fetchRealMechanics(window.userLat || 5.556, window.userLng || 5.787, window.userCity || 'Warri').then(() => {
                if(window.MechanicsModule) MechanicsModule.init();
              });
            } else if(window.app && app.fetchRealMechanics) {
              app.fetchRealMechanics(app.userLat || 5.556, app.userLng || 5.787, app.activeCity || 'Warri').then(() => {
                if(window.MechanicsModule) MechanicsModule.init();
                else if(window.app && app.renderMechs) app.renderMechs(window.getAllMechanics ? window.getAllMechanics() : []);
              });
            } else {
              alert('TomTom Scan Engine not connected to this view!');
              btn.innerHTML = '📡 RUN GPS SCAN';
              btn.style.opacity = '1';
            }
          " style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 14px 28px; border-radius: 14px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: bold; letter-spacing: 2px; cursor: pointer; box-shadow: 0 10px 25px rgba(59,130,246,0.4); transition: all 0.3s;">
            📡 RUN GPS SCAN
          </button>
        </div>
      `;
      return;
    }
    grid.innerHTML = list.map((m, i) => {
      const hasPhone = (m.phone && m.phone !== 'Unlisted - Walk-in' && m.phone.length > 5) || (m.wa && m.wa !== 'None' && m.wa.length > 5);
      const noPhoneWarning = !hasPhone ? `
        <div class="mt-2 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md shadow-[0_0_10px_rgba(239,68,68,0.15)]">
          <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
          <span class="text-red-400 font-mono text-[9px] uppercase tracking-[0.2em] font-bold">Drive-In Only</span>
        </div>
      ` : '';

      const chatBtnHtml = hasPhone ? `
        <button class="flex-1 h-10 bg-emerald-500/10 active:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-mono text-[10px] font-bold tracking-[0.2em] flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_4px_10px_rgba(16,185,129,0.1)]" onclick="event.stopPropagation(); window.app && app.openChatWithMechanic && app.openChatWithMechanic('${escapeHTML(m.name)}')">
          💬 CHAT
        </button>
      ` : `
        <button class="flex-1 h-10 bg-white/5 text-white/20 border border-white/5 rounded-xl font-mono text-[10px] font-bold tracking-[0.2em] flex items-center justify-center gap-1.5 cursor-not-allowed" onclick="event.stopPropagation(); alert('This shop has no public phone number. Click TRACK to drive to their physical location.');">
          🚫 NO NUMBER
        </button>
      `;

      const distanceStr = m.distance || m.dist || 'Unknown';
      const statusColor = m.avail === 'open' ? '#10b981' : (m.avail === 'busy' ? '#f59e0b' : '#ef4444');

      return `
        <div class="mech-card reveal group relative rounded-[2rem] p-[1.5px] cursor-pointer overflow-hidden transition-all duration-500 active:scale-[0.98] mb-6" style="transition-delay:${i * 0.05}s;" onclick="if(window.app && app.openMechanicProfileDetail) app.openMechanicProfileDetail('${escapeHTML(m.name)}'); else if(window.app && app.openMechanicProfile) app.openMechanicProfile('${escapeHTML(m.name)}');">
          <!-- Animated Cyan/Blue Gradient Border -->
          <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-indigo-500/30 opacity-80 blur-[2px]"></div>
          
          <!-- Card Glass Background -->
          <div class="relative h-full bg-[#0d0e12]/90 backdrop-blur-3xl rounded-[2rem] p-5 flex flex-col gap-4 shadow-2xl">
            
            <!-- Header Section -->
            <div class="flex justify-between items-start">
              <div class="relative">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-xl backdrop-blur-2xl">
                  ${escapeHTML(m.emoji)}
                </div>
                <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-[3px] border-[#0d0e12] shadow-lg" style="background: ${statusColor}; box-shadow: 0 0 10px ${statusColor};"></div>
              </div>
              
              <!-- Distance Badge -->
              <div class="flex flex-col items-end gap-1.5">
                <div class="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  ${escapeHTML(distanceStr)}
                </div>
                <div class="text-[8px] font-bold tracking-[0.2em] text-white/30 uppercase">
                  ${m.isScanned ? 'GPS SCANNED' : 'NEARBY'}
                </div>
              </div>
            </div>

            <!-- Body Section -->
            <div class="flex-1 mt-1">
              <h3 class="text-[22px] font-extrabold text-white tracking-tight mb-1 truncate drop-shadow-sm" style="font-family:'Bebas Neue',sans-serif; letter-spacing:1px; line-height:1.1;">
                ${escapeHTML(m.name)}
              </h3>
              <div class="text-[11px] text-[#8e93a0] font-mono tracking-widest uppercase">${escapeHTML(m.spec)}</div>
              ${noPhoneWarning}
            </div>

            <!-- Bottom Section -->
            <div class="mt-3 flex flex-col gap-3">
              <!-- Stats Pill -->
              <div class="flex items-center justify-between text-[10px] font-mono text-white/50 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                ${(m.rating && m.rating !== '0.0') ? `
                <div class="flex items-center gap-2">
                  <span class="text-yellow-400 font-bold flex items-center gap-1 text-[11px] drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">★ ${m.rating}</span>
                  <span class="text-white/20">|</span>
                  <span class="text-white/80 tracking-widest">${m.jobs || m.reviews || 0} REV</span>
                </div>
                ` : `
                <span class="tracking-[0.2em] flex items-center gap-1.5 opacity-60">NO REVIEWS YET</span>
                `}
              </div>
              
              <!-- Action Buttons -->
              <div class="flex gap-2">
                <button class="flex-1 h-10 bg-blue-500/10 active:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-mono text-[10px] font-bold tracking-[0.2em] flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_4px_10px_rgba(59,130,246,0.1)]" onclick="event.stopPropagation(); window.app && app.openMapTracker && app.openMapTracker('${escapeHTML(m.name)}', ${m.lat || 0}, ${m.lng || 0})">
                  📍 TRACK
                </button>
                ${chatBtnHtml}
                <button class="flex-[0.8] h-10 bg-white/10 active:bg-white/20 text-white border border-white/20 rounded-xl font-mono text-[10px] font-bold tracking-[0.2em] flex items-center justify-center gap-1.5 transition-all duration-300" onclick="event.stopPropagation(); if(window.app && app.openMechanicProfileDetail) app.openMechanicProfileDetail('${escapeHTML(m.name)}'); else if(window.app && app.openMechanicProfile) app.openMechanicProfile('${escapeHTML(m.name)}');">
                  VIEW →
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    // Trigger scroll reveal using GSAP if available
    if (typeof gsap !== 'undefined' && gsap.utils) {
      gsap.utils.toArray('.mech-card.reveal').forEach(el => {
        gsap.to(el, {
          scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' },
          opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out', overwrite: 'auto'
        });
      });
    } else {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    }
  }

  function filter(query = '', spec = activeSpec) {
    activeSpec = spec;
    let list = getAllMechanics();
    if (spec !== 'All') list = list.filter(m => m.spec === spec);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.spec.toLowerCase().includes(q) || m.area.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (a.avail === 'open' && b.avail !== 'open') return -1;
      if (a.avail !== 'open' && b.avail === 'open') return  1;
      return b.rating - a.rating;
    });
    render(list);
  }

  function filterByCity(city) {
    const list = getMechanicsByCity(city);
    render(list.length ? list : getAllMechanics());
  }

  function init() { render(getAllMechanics()); }

  return { init, render, filter, filterByCity };
})();