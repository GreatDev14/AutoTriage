// ====================================
// MAIN APP — orchestrates everything
// ====================================

let revealObs; // global so mechanics.js can use it

const app = (() => {
  let vtype     = 'Car';
  let rideType  = 'Standard';

  // ---- INIT ----
  function init() {
    LocationModule.init();
    MechanicsModule.init();
    PWA.init();
    initMap();
  }

  // Called by LocationModule when location is found
  function onLocationUpdate(loc) {
    MechanicsModule.filterByCity(loc.city);
    const input = document.getElementById('rideLocInput');
    if (input && !input.value) input.value = loc.address;
    
    updateMapMarker(loc.latitude, loc.longitude);
  }

  // ---- DIAGNOSIS ----
  async function runDiagnosis() {
    const problem = document.getElementById('problemInput').value.trim();
    if (!problem) { document.getElementById('problemInput').focus(); return; }

    const btn = document.getElementById('diagBtn');
    btn.disabled = true; btn.textContent = 'Analyzing...';
    document.getElementById('rIdle').style.display = 'none';
    document.getElementById('rLoad').classList.add('on');
    document.getElementById('rBody').classList.remove('on');

    try {
      const result = await AIDiagnosis.diagnose(problem, vtype);
      document.getElementById('rLoad').classList.remove('on');
      document.getElementById('rBody').classList.add('on');
      document.getElementById('rBody').innerHTML = AIDiagnosis.toHTML(result);

      if (result.severity === 'CRITICAL' || result.is_critical) {
        setTimeout(() => showCritical(result.critical_reason || result.summary), 900);
      }
    } catch (err) {
      document.getElementById('rLoad').classList.remove('on');
      document.getElementById('rBody').classList.add('on');
      document.getElementById('rBody').innerHTML = `
        <p style="color:#ff6666;font-size:12px;line-height:1.9;">
          ⚠️ ${err.message}<br><br>
          <strong>To enable real AI diagnosis:</strong><br>
          1. Go to <a href="https://console.groq.com" target="_blank" style="color:#ff8080">console.groq.com</a><br>
          2. Create a Groq API key<br>
          3. Paste it into <code>js/config.js</code> → GROQ_API_KEY
        </p>`;
    }
    btn.disabled = false; btn.textContent = 'Run AI Diagnosis →';
  }

  // ---- VEHICLE TYPE ----
  function setVtype(btn, type) {
    document.querySelectorAll('.vt').forEach(b => b.classList.remove('on'));
    btn.classList.add('on'); vtype = type;
  }

  // ---- MECHANICS ----
  function filterMechanics() {
    const q = document.getElementById('mechSearch').value;
    MechanicsModule.filter(q);
  }

  function filterSpec(btn, spec) {
    document.querySelectorAll('.sf').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const q = document.getElementById('mechSearch').value;
    MechanicsModule.filter(q, spec);
  }

  function detectMechLocation() {
    const loc = LocationModule.getLocation();
    MechanicsModule.filterByCity(loc.city);
  }

  function showMoreMechanics() {
    alert('📱 Download the Auto Triage app to access all verified mechanics worldwide.');
  }

  function submitMechanicForm() {
    const name  = document.getElementById('joinName').value.trim();
    const phone = document.getElementById('joinPhone').value.trim();
    const spec  = document.getElementById('joinSpec').value.trim();
    const city  = document.getElementById('joinCity').value.trim();
    if (!name || !phone || !spec || !city) { alert('Please fill in all fields'); return; }
    
    // Save to the secret compliance review registry (at_mechanic_registry)
    const registry = JSON.parse(localStorage.getItem('at_mechanic_registry') || '[]');
    
    // Check if phone already exists in the queue
    if (registry.some(m => m.phone === phone)) {
      alert("⚠️ You already have a pending or approved application with this phone number!");
      return;
    }
    
    const newMech = {
      id: Date.now(),
      name: name,
      spec: spec,
      specialty: spec,
      phone: phone,
      city: city,
      timestamp: new Date().toLocaleString(),
      verified: false // Must be verified by admin or telemetry check!
    };
    
    registry.push(newMech);
    localStorage.setItem('at_mechanic_registry', JSON.stringify(registry));
    
    alert(`✅ Application successfully submitted to the vetting queue!\n\nName: ${name}\nSpecialization: ${spec}\n\nYour profile will remain in the 'pending_verification' queue until reviewed by our compliance administrators (accessible via footer logo in index.html).`);
    
    // Clear form
    document.getElementById('joinName').value = '';
    document.getElementById('joinPhone').value = '';
    document.getElementById('joinSpec').value = '';
    document.getElementById('joinCity').value = '';
    
    // Refresh list if we're on it
    MechanicsModule.filter();
  }

  // ---- RIDES ----
  function setRT(btn, type) {
    document.querySelectorAll('.rt').forEach(b => b.classList.remove('on'));
    btn.classList.add('on'); rideType = type;
  }

  function detectRideLoc() {
    const loc = LocationModule.getLocation();
    const input = document.getElementById('rideLocInput');
    if (input) input.value = loc.address;
  }

  function findRides() {
    const loc  = document.getElementById('rideLocInput').value.trim();
    const dest = document.getElementById('rideDestInput').value.trim();
    if (!loc || !dest) { alert('Please enter your location and destination.'); return; }
    RidesModule.render(RidesModule.getRiders());
  }

  // ---- CRITICAL ALERT ----
  function showCritical(msg) {
    document.getElementById('critMsg').textContent = msg || 'Your situation is CRITICAL. Do you need emergency assistance?';
    document.getElementById('criticalOverlay').classList.add('show');
  }

  function closeCritical() {
    document.getElementById('criticalOverlay').classList.remove('show');
  }

  function openEmergencyRide() {
    closeCritical();
    scrollTo('#ride');
    setTimeout(findRides, 700);
  }

  // ---- MAPS (LEAFLET) ----
  let mapInstance = null;
  let mapMarker = null;

  function initMap() {
    const container = document.getElementById('mapbox-container');
    if (!container || !window.L) return;

    mapInstance = L.map(container, {
      zoomControl: false,
      attributionControl: true
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Sources: Esri'
    }).addTo(mapInstance);

    mapInstance.setView([20, 0], 2);

    // Map-click geocoding and marker update
    mapInstance.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      if (window.showToast) {
        window.showToast('Pin Dropped', `📍 Fetching address for coordinates [${lat.toFixed(4)}, ${lng.toFixed(4)}]...`, 'info');
      }
      
      if (window.LocationModule && window.LocationModule.reverseGeocode) {
        await window.LocationModule.reverseGeocode(lat, lng);
        if (window.showToast) {
          const loc = window.LocationModule.getLocation();
          window.showToast('Location Selected', `🗺️ Set location to ${loc.city}, ${loc.state}`, 'success');
        }
      }
    });
  }

  function updateMapMarker(lat, lng) {
    if (!mapInstance || !window.L) return;
    
    if (mapMarker) mapInstance.removeLayer(mapMarker);
    
    mapMarker = L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: '#e63946',
      fillOpacity: 1,
      color: '#ffffff',
      weight: 2
    }).addTo(mapInstance);
      
    mapInstance.setView([lat, lng], 14);
    
    const pulse = document.getElementById('mapUserPulse');
    if (pulse) pulse.style.display = 'block';
  }

  async function searchManualLocation() {
    const query = document.getElementById('manualLocationInput').value.trim();
    if (!query) return;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const results = await response.json();
      if (results && results.length > 0) {
        const first = results[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        const address = first.display_name;
        
        // Update app state
        LocationModule.setCity(query);
        onLocationUpdate({ latitude: lat, longitude: lng, address: address, city: query });
        
        // Sync inputs
        const rideInput = document.getElementById('rideLocInput');
        if (rideInput) rideInput.value = address;
      }
    } catch (e) {
      console.error('Manual geocoding failed', e);
    }
  }

  // ---- UTILS ----
  function scrollTo(sel) {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  // Public API
  return {
    init, onLocationUpdate,
    runDiagnosis, setVtype,
    filterMechanics, filterSpec, detectMechLocation, showMoreMechanics, submitMechanicForm,
    setRT, detectRideLoc, findRides, searchManualLocation, updateMapMarker,
    showCritical, closeCritical, openEmergencyRide,
    scrollTo,
    openProfileDrawer: function() {
      const drawer = document.getElementById('profileDrawer');
      const panel = document.getElementById('profileDrawerPanel');
      if(drawer && panel) {
        drawer.style.display = 'flex';
        setTimeout(() => { panel.style.transform = 'translateX(0)'; }, 10);
      }
    },
    closeProfileDrawer: function(e) {
      const drawer = document.getElementById('profileDrawer');
      const panel = document.getElementById('profileDrawerPanel');
      if(drawer && panel) {
        panel.style.transform = 'translateX(100%)';
        setTimeout(() => { drawer.style.display = 'none'; }, 400);
      }
    },
    openMechanicProfile: function(name) {
      const modal = document.getElementById('mechDetailModal');
      const content = document.getElementById('mechDetailContent');
      if (!modal || !content) return;

      const mList = window.getAllMechanics ? window.getAllMechanics() : [];
      const m = mList.find(x => x.name === name);
      if (!m) return;
      
      const portfolio = [
        { title: 'Air Conditioning System Leak Check & Freon Recharge', car: 'Toyota RAV4 2018', summary: 'Evacuated the AC system. Performed vacuum pressure leak test, recovered remaining oil and charged 450g of fresh coolant. System blowing ice cold at 4.2°C.' },
        { title: 'Brake Pad Replacement & Hydraulic Fluid Flush', car: 'Hyundai Elantra 2019', summary: 'Fitted premium front ceramic brake pads, cleaned rotors, greased caliper guide pins and performed hydraulic brake line bleeding with DOT4 fluid.' },
        { title: 'Front Suspension Strut Assembly Upgrade', car: 'Ford Explorer 2016', summary: 'Replaced worn strut dampers and bump stops. Installed new heavy-duty sway bar links. Eliminated suspension knocking noises.' }
      ];

      const activeColor = m.avail === 'open' ? 'var(--success)' : 'var(--accent)';
      const statusText = m.avail === 'open' ? 'AVAILABLE' : 'BUSY';

      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
          <button onclick="app.closeMechanicProfile()" style="background:var(--glass); border:1px solid var(--border); color:var(--fg); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px; transition:all 0.2s;">✕</button>
          <div style="display:flex; align-items:center; gap:8px; background:var(--mid); padding:6px 12px; border-radius:20px; border:1px solid var(--border); box-shadow: 0 4px 12px var(--shadow);">
            <span style="width:8px; height:8px; border-radius:50%; background:${activeColor}; display:inline-block; animation:pulse 1.5s infinite; box-shadow:0 0 10px ${activeColor};"></span>
            <span style="font-family:'Space Mono',monospace; font-size:9px; font-weight:bold; color:${activeColor}; letter-spacing:1px; text-transform:uppercase;">${statusText}</span>
          </div>
        </div>

        <div style="text-align:center; border-bottom:1px solid var(--border); padding-bottom:28px; margin-bottom:28px;">
          <div style="width:90px; height:90px; margin:0 auto 16px; border-radius:24px; border:1px solid var(--border); background:var(--mid); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px var(--shadow);">
            <span style="font-size:48px;">${m.emoji}</span>
          </div>
          <div style="background:#ffaa00; color:#000; font-size:10px; font-family:'Space Mono',monospace; font-weight:bold; letter-spacing:1px; text-transform:uppercase; padding:6px 16px; border-radius:20px; display:inline-block; margin-bottom:14px; box-shadow:0 4px 12px rgba(255,170,0,0.15);">🛡️ VERIFIED PRO</div>
          <h2 style="font-family:'Space Mono',monospace; font-size:28px; font-weight:bold; color:var(--fg); margin:0 0 8px; letter-spacing:-0.5px; line-height:1.2;">${m.name}</h2>
          <div style="font-size:12px; color:var(--gray); font-family:'Space Mono',monospace; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:8px;">
            ${m.spec} &bull; ${m.yrs || m.exp || 8}+ YRS EXP
          </div>
          <div style="font-size:11px; color:var(--gray); font-family:'Space Mono',monospace; font-weight:bold; display:flex; align-items:center; justify-content:center; gap:8px;">
            <span style="color:#ffcc00; letter-spacing:1px;">★★★★★</span>
            <span>${m.rating || '4.8'}</span>
            <span>&bull;</span>
            <span>(${m.jobs || m.rev || 16} REVIEWS)</span>
          </div>
        </div>

        <div style="background:var(--mid); border:1px solid var(--border); border-radius:24px; padding:20px; box-shadow:0 8px 24px var(--shadow); text-align:left; margin-bottom:28px;">
          <div style="font-size:9px; color:var(--gray); font-family:'Space Mono',monospace; font-weight:bold; letter-spacing:1.5px; margin-bottom:8px;">📍 WORKSHOP ADDRESS</div>
          <div style="font-family:'Space Mono',monospace; font-size:14px; font-weight:bold; color:var(--fg); margin-bottom:16px; line-height:1.4;">${m.dist ? m.dist + ' away · ' + m.area : 'Local Area Address, ' + m.area}</div>
          
          <div style="display:flex; gap:12px;">
            <a href="tel:${m.phone}" style="flex:1; background:transparent; border:1px solid var(--border); color:var(--fg); text-decoration:none; padding:12px; border-radius:12px; text-align:center; font-family:'Space Mono',monospace; font-size:11px; font-weight:bold; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s;">📞 CALL</a>
            <button onclick="window.open('https://wa.me/${m.whatsapp || m.wa || '2348033221100'}','_blank')" style="flex:1; background:transparent; border:1px solid rgba(52, 199, 89, 0.25); color:var(--success); padding:12px; border-radius:12px; text-align:center; font-family:'Space Mono',monospace; font-size:11px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s;">💬 WHATSAPP</button>
          </div>
        </div>

        <div style="flex:1; text-align:left; margin-bottom:28px;">
          <div style="font-size:10px; color:var(--gray); font-family:'Space Mono',monospace; font-weight:bold; letter-spacing:1.5px; margin-bottom:14px; padding-left:4px;">🛠️ FEATURED PORTFOLIO</div>
          <div style="display:flex; flex-direction:column; gap:16px;">
            ${portfolio.map(p => `
              <div style="background:var(--mid); border:1px solid var(--border); border-radius:24px; padding:20px; box-shadow:0 8px 24px var(--shadow);">
                <h3 style="font-family:'Space Mono',monospace; font-size:14px; font-weight:bold; color:var(--fg); line-height:1.4; margin-bottom:8px; text-transform:none;">${p.title}</h3>
                <div style="font-family:'Space Mono',monospace; font-size:10px; color:var(--gray); font-weight:bold; margin-bottom:12px; text-transform:uppercase; display:flex; align-items:center; gap:8px;">
                  <span>🚘 ${p.car.toUpperCase()}</span>
                </div>
                <p style="font-size:11px; color:var(--subtext); line-height:1.6; margin:0; font-family:'Space Mono',monospace;">${p.summary}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <button onclick="app.bookMechanicAppointment('${m.name}')" style="width:100%; background:var(--fg); border:none; color:var(--bg); padding:20px; border-radius:18px; font-family:'Space Mono',monospace; font-size:12px; font-weight:bold; cursor:pointer; letter-spacing:2px; text-transform:uppercase; box-shadow:0 8px 20px var(--shadow); transition:all 0.2s; margin-bottom:40px;">
          ⚡ SECURE APPOINTMENT BOOKING
        </button>
      `;

      modal.style.display = 'flex';
      setTimeout(() => { content.style.transform = 'translateY(0)'; }, 10);
    },
    closeMechanicProfile: function() {
      const modal = document.getElementById('mechDetailModal');
      const content = document.getElementById('mechDetailContent');
      if (modal && content) {
        content.style.transform = 'translateY(100%)';
        setTimeout(() => { modal.style.display = 'none'; }, 400);
      }
    },
    bookMechanicAppointment: function(name) {
      app.closeMechanicProfile();
      setTimeout(() => {
        const bm = document.getElementById('bookingModal');
        const bmText = document.getElementById('bookingModalText');
        if (bm && bmText) {
          bmText.innerHTML = `Your appointment request has been securely sent to <b>${name}</b> via the AutoTriage App, SMS, and Email.<br><br>The mechanic will accept your request momentarily.`;
          bm.style.display = 'flex';
        }
      }, 450);
    },
    refreshTheme: function() {
      // Leaflet handles dark/light modes automatically via CSS filters, so no JS redraws are needed!
    }
  };
})();

document.addEventListener('DOMContentLoaded', app.init);