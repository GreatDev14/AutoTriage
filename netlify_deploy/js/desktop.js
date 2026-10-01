const app = {
  currentTab: 'dashboard',
  isOfflineMode: false,
  vehicle: { make: '', model: '', year: '', mileage: '' },
  diagnosisHistory: (() => {
    let desktopHist = JSON.parse(localStorage.getItem('desktopDiagHistory'));
    let mobileHist = JSON.parse(localStorage.getItem('diagnosisHistory'));
    if (!desktopHist && mobileHist) {
      desktopHist = mobileHist.map(h => ({
        problem: h.problem,
        title: h.summary ? h.summary.substring(0, 40) : 'AI Scan',
        time: h.date || 'Just now',
        status: (h.result?.severity || 'LOW').toUpperCase(),
        result: h.result
      }));
      localStorage.setItem('desktopDiagHistory', JSON.stringify(desktopHist));
    } else if (desktopHist && !mobileHist) {
      mobileHist = desktopHist.map(h => ({
        date: h.time,
        problem: h.problem,
        summary: h.result?.summary || h.title,
        cost: h.result?.estimated_cost || 'N/A',
        result: h.result
      }));
      localStorage.setItem('diagnosisHistory', JSON.stringify(mobileHist));
    }
    return desktopHist || [];
  })(),
  fuelLogs: JSON.parse(localStorage.getItem('desktopFuelLogs')) || [],
  maintLogs: JSON.parse(localStorage.getItem('desktopMaintLogs')) || [],
  serviceLog: JSON.parse(localStorage.getItem('serviceLog')) || {},
  voiceRecording: false,
  serviceRecog: null,
  vitalsInterval: null,
  curVt: 'Car',
  curSpec: 'All',
  currentRideType: 'standard',
  ridePickupLat: null,
  ridePickupLng: null,
  rideDropLat: null,
  rideDropLng: null,
  selectedProvider: null,
  rideSearchResults: [],
  ratingMechName: '',
  ratingVal: 0,
  isVoiceEnabled: true,
  userLat: null,
  userLng: null,
  trackerMap: null,
  trackerMode: 'to_mechanic',
  userMarker: null,
  mechMarker: null,
  watchId: null,
  simulationInterval: null,
  primaryPillMarker: null,
  altPillMarker: null,
  primaryPolyline: null,
  altPolyline: null,
  startMarker: null,
  routeDots: [],
  
  // VITALS BASELINES
  vitals: {
    battery: 14.0,
    coolant: 89,
    oil: 42
  },

  // DATA
  MECHS: [],

  PROVIDERS_CONFIG: [
    { id: 'uber', name: 'Uber', emoji: '⬛', class: 'prc-uber', sub: 'Premium service · Verified drivers', drivers: ['John D.','Maria G.','David K.','Sarah W.'], cars: ['Toyota Camry','Honda Fit','Ford Edge'], colors: ['Black','White','Silver'], plates: ['NY','CA'] },
    { id: 'lyft', name: 'Lyft', emoji: '🟣', class: 'prc-lyft', sub: 'Fast & friendly · 2.8K drivers', drivers: ['Sarah K.','Michael T.','James C.'], cars: ['Kia Optima','Hyundai Sonata','Toyota Prius'], colors: ['Silver','Blue','Black'], plates: ['NY','CA'] },
    { id: 'bolt', name: 'Bolt', emoji: '⚡', class: 'prc-bolt', sub: 'Fast & affordable · 3.2K drivers', drivers: ['Alex M.','Jessica B.','Thomas S.'], cars: ['Toyota Corolla','Skoda Octavia','Volkswagen Golf'], colors: ['Green','White','Black'], plates: ['NY','CA'] },
    { id: 'didi', name: 'DiDi', emoji: '🟠', class: 'prc-didi', sub: 'Global rides · 4.1K drivers', drivers: ['Carlos R.','Ana M.','Luis G.'], cars: ['Chevrolet Onix','Nissan Versa','BYD Han'], colors: ['Orange','Grey','White'], plates: ['MX','BR'] },
    { id: 'grab', name: 'Grab', emoji: '🟢', class: 'prc-grab', sub: 'Southeast Asia leader · 5.5K drivers', drivers: ['Nguyen H.','Somchai P.','Siti A.'], cars: ['Honda City','Toyota Vios','Perodua Myvi'], colors: ['Green','Silver','Black'], plates: ['SG','MY'] },
    { id: 'indrive', name: 'InDrive', emoji: '🔵', class: 'prc-indrive', sub: 'Negotiated fares · Fair pricing', drivers: ['Dmitry S.','Elena K.','Ivan P.'], cars: ['Hyundai Accent','Renault Logan','Toyota Rav4'], colors: ['Blue','White','Grey'], plates: ['KZ','UZ'] }
  ],

  PARTS_DB: [
    { name: 'Ceramic Brake Pads (Front)', price: '$45 - $65', oem: '$80 - $110' },
    { name: 'Alternator (120 Amp)', price: '$120 - $180', oem: '$250 - $320' },
    { name: 'Starter Motor', price: '$90 - $140', oem: '$180 - $220' },
    { name: 'Radiator', price: '$110 - $160', oem: '$200 - $280' },
    { name: 'Ignition Coil Pack', price: '$40 - $70', oem: '$90 - $130' },
    { name: 'Mass Air Flow Sensor', price: '$60 - $100', oem: '$120 - $180' },
    { name: 'Oxygen Sensor (O2)', price: '$35 - $60', oem: '$80 - $120' },
    { name: 'Fuel Pump', price: '$80 - $130', oem: '$150 - $250' }
  ],
  
  init: function() {
    try {
      const stored = localStorage.getItem('autoTriage_desktop_mechanics');
      if (stored) {
        this.MECHS = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load cached mechanics", e);
    }
    this.loadVehicleProfile();
    this.startLocationTracking();
    this.switchTab('dashboard');
    this.renderRecentScans();
    this.renderMechs(this.MECHS);
    this.initSOSSlider();
    this.switchUserRole(localStorage.getItem('at_current_role') || 'driver');
    
    // Sync all providers on startup to avoid stale client states
    this.syncAllProvidersStateOnStartup();
  },

  syncAllProvidersStateOnStartup: async function() {
    try {
      const res = await fetch('/api/backend-state');
      const data = await res.json();
      ['uber', 'lyft', 'bolt', 'didi', 'grab', 'indrive'].forEach(providerId => {
        const pState = data[providerId];
        if (pState) {
          if (pState.loggedIn) {
            localStorage.setItem('autotriage_logged_in_' + providerId, 'true');
            localStorage.setItem('autotriage_phone_' + providerId, pState.phone || '+1 (555) 0199');
          } else {
            localStorage.removeItem('autotriage_logged_in_' + providerId);
            localStorage.removeItem('autotriage_phone_' + providerId);
          }
        }
      });
    } catch (err) {
      console.warn('[DESKTOP] Startup backend state sync failed:', err);
    }
  },

  switchTab: function(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar-icon').forEach(el => el.classList.remove('active'));
    
    const tabEl = document.getElementById('tab-' + tabId);
    if (tabEl) tabEl.classList.add('active');
    
    const btn = document.getElementById('nav-' + tabId);
    if(btn) btn.classList.add('active');
    
    this.currentTab = tabId;

    // Refresh content on tab activation
    if (tabId === 'history') {
      this.renderRecentScans();
    } else if (tabId === 'garage') {
      // Always refresh garage — renderGarageDashboard controls setup vs dashboard visibility
      this.renderGarageDashboard();
      this.switchUserRole(localStorage.getItem('at_current_role') || 'driver');
      if (this.vehicle && this.vehicle.make) {
        this.renderMaintenancePlanner();
        this.renderMaintenanceLogs();
        this.renderDashboardTelemetry();
      } else {
        this.renderDashboardTelemetry();
      }
    } else if (tabId === 'parts') {
      this.searchPart(true);
    }
  },

  // -----------------------------------------
  // VEHICLE PROFILE LOGIC
  // -----------------------------------------
  loadVehicleProfile: function() {
    try {
      let stored = localStorage.getItem('desktopVehicle');
      let mobileStored = localStorage.getItem('myVehicle');
      if (!stored && mobileStored) {
        stored = mobileStored;
        localStorage.setItem('desktopVehicle', stored);
      } else if (stored && !mobileStored) {
        localStorage.setItem('myVehicle', stored);
      }
      if (stored) {
        this.vehicle = JSON.parse(stored);
        if (this.vehicle.make) {
          const badge = document.getElementById('diag-target-badge');
          if (badge) badge.textContent = 'TARGET: ' + this.vehicle.year + ' ' + this.vehicle.make + ' ' + this.vehicle.model;

          this.renderGarageDashboard();
          this.fetchCarImage(this.vehicle.make, this.vehicle.model, this.vehicle.year);
        }
      }
      this.renderDashboardTelemetry();
    } catch(e) {
      console.error("Error loading vehicle profile:", e);
    }
  },

  renderGarageDashboard: function() {
    // Replaced by renderDashboardTelemetry
  },

  clearVehicle: function() {
    this.vehicle = { make: '', model: '', year: '', mileage: '', vtype: 'Car' };
    localStorage.removeItem('desktopVehicle');
    localStorage.removeItem('myVehicle');
    localStorage.removeItem('vitalOverrides');
    localStorage.removeItem('serviceLog');
    this.vehicleImageUrl = null;
    const badge = document.getElementById('diag-target-badge');
    if (badge) badge.textContent = 'TARGET: Unknown Vehicle';
    
    this.renderGarageDashboard();
    this.renderDashboardTelemetry();
  },

  fetchCarImage: async function(make, model, year) {
    // 1. Try to get the REAL photo from Wikipedia
    const queries = [ year + ' ' + make + ' ' + model, make + ' ' + model ];
    for (const q of queries) {
      try {
        const url = 'https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
          encodeURIComponent(q) + '&gsrlimit=1&prop=pageimages&format=json&pithumbsize=800&origin=*';
        const res  = await fetch(url);
        const data = await res.json();
        if (data.query && data.query.pages) {
          const page = Object.values(data.query.pages)[0];
          if (page && page.thumbnail && page.thumbnail.source) {
            this.vehicleImageUrl = page.thumbnail.source;
            this.renderGarageDashboard();
            this.renderDashboardTelemetry();
            return;
          }
        }
      } catch(e) {
        console.warn("Wikipedia image fetch skipped:", e);
      }
    }
    
    // 2. FALLBACK: If Wikipedia fails, generate an AI image so the screen doesn't break
    const prompt = `Photorealistic professional studio shot of a ${year} ${make} ${model} car, automotive photography, 8k resolution`;
    this.vehicleImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=600&nologo=true`;
    
    this.renderGarageDashboard();
    this.renderDashboardTelemetry();
  },

  switchUserRole: function(role) {
    localStorage.setItem('at_current_role', role);
    const u = document.getElementById('roleBtnUser');
    const m = document.getElementById('roleBtnMech');
    const userCard = document.getElementById('userProfileCard');
    const setup = document.getElementById('vehicleSetup');
    const dash = document.getElementById('vehicleDashboard');
    const mechDash = document.getElementById('mechanicCenterDashboard');

    if (role === 'driver') {
      if (u) { u.style.background = 'var(--accent)'; u.style.color = 'white'; }
      if (m) { m.style.background = 'transparent'; m.style.color = 'var(--gray)'; }
      if (userCard) userCard.style.display = 'block';
      if (mechDash) mechDash.style.display = 'none';
      
      this.renderDriverProfile();
      if (this.vehicle.make) {
        if (setup) setup.style.display = 'none';
        if (dash) dash.style.display = 'flex';
      } else {
        if (setup) setup.style.display = 'block';
        if (dash) dash.style.display = 'none';
      }
    } else {
      if (m) { m.style.background = 'var(--accent)'; m.style.color = 'white'; }
      if (u) { u.style.background = 'transparent'; u.style.color = 'var(--gray)'; }
      if (userCard) userCard.style.display = 'none';
      if (setup) setup.style.display = 'none';
      if (dash) dash.style.display = 'none';
      if (mechDash) mechDash.style.display = 'block';
      
      this.renderMechanicDashboard();
    }
  },

  renderDriverProfile: function() {
    const container = document.getElementById('userProfileCard');
    if (!container) return;
    
    const savedUser = localStorage.getItem('autotriage_user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    const name = user ? user.name.toUpperCase() : 'GUEST DRIVER';
    const email = user ? user.email : 'local_device_session@autotriage.io';
    const initials = user ? user.name.slice(0, 2).toUpperCase() : 'GD';
    
    const scans = this.diagnosisHistory ? this.diagnosisHistory.length : 0;
    const vehiclesCount = this.vehicle && this.vehicle.make ? 1 : 0;
    const appointments = JSON.parse(localStorage.getItem('at_appointments') || '[]').length;
    
    container.innerHTML = `
      <div class="bg-gradient-to-r from-[#1c1c1e] to-[#121213] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-300">
        <div class="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-red-500/15 transition-all duration-500"></div>
        <div class="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"></div>
        
        <div class="flex flex-col lg:flex-row justify-between items-center gap-4 relative z-10">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg font-mono shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-300">
              ${initials}
            </div>
            <div>
              <div class="bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[8px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase mb-1 w-fit">
                🛡️ Verified Driver Account
              </div>
              <h2 class="text-xl font-black text-white font-bebas tracking-wide leading-none">${name}</h2>
              <p class="text-[10px] text-[#8e93a0] font-mono mt-0.5">${email}</p>
            </div>
          </div>
          
          <div class="grid grid-cols-3 gap-2 w-full lg:w-auto">
            <div class="bg-black/40 border border-white/5 p-2.5 rounded-xl min-w-[90px] text-center">
              <div class="text-xl font-bold text-red-500 font-mono">${vehiclesCount}</div>
              <div class="text-[8px] text-[#8e93a0] font-mono uppercase tracking-wider mt-0.5">Vehicles</div>
            </div>
            <div class="bg-black/40 border border-white/5 p-2.5 rounded-xl min-w-[90px] text-center">
              <div class="text-xl font-bold text-emerald-400 font-mono">${scans}</div>
              <div class="text-[8px] text-[#8e93a0] font-mono uppercase tracking-wider mt-0.5">AI Scans</div>
            </div>
            <div class="bg-black/40 border border-white/5 p-2.5 rounded-xl min-w-[90px] text-center">
              <div class="text-xl font-bold text-[#4da6ff] font-mono">${appointments}</div>
              <div class="text-[8px] text-[#8e93a0] font-mono uppercase tracking-wider mt-0.5">Bookings</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  mechCertData: null,
  mechCertName: '',

  handleCertUpload: function(input) {
    const file = input.files[0];
    if (file) {
      this.mechCertName = file.name;
      const reader = new FileReader();
      reader.onload = (event) => {
        this.mechCertData = event.target.result;
        const status = document.getElementById('mechCertStatus');
        if (status) {
          status.innerHTML = `
            <div class="flex flex-col items-center gap-3">
              <span class="text-emerald-400 font-bold text-sm">✓ Selected: ${file.name}</span>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 max-w-md w-full bg-black/40 p-4 rounded-xl border border-emerald-500/20 text-left font-mono text-[9px] text-zinc-400 leading-normal animate-fadeIn">
                <div class="flex items-center gap-1.5"><span class="text-[#00d084] font-bold">✓</span> FILE ENVELOPE VALID</div>
                <div class="flex items-center gap-1.5"><span class="text-[#00d084] font-bold">✓</span> METADATA COMPILED</div>
                <div class="flex items-center gap-1.5"><span class="text-[#00d084] font-bold">✓</span> READY TO TRANSMIT</div>
              </div>
            </div>
          `;
        }
      };
      reader.readAsDataURL(file);
    }
  },

  saveMechanicProfile: async function() {
    const name    = document.getElementById('mechNameInput').value.trim();
    const spec    = document.getElementById('mechSpecInput').value;
    const exp     = document.getElementById('mechExpInput').value.trim();
    const emoji   = document.getElementById('mechEmojiInput').value;
    const phone   = document.getElementById('mechPhoneInput').value.trim();
    const wa      = document.getElementById('mechWaInput').value.trim();
    const address = document.getElementById('mechAddrInput').value.trim();
    const email   = document.getElementById('mechEmailInput').value.trim();

    if (!name || !exp || !phone || !wa || !email || !address) {
      return alert('Please fill in all the required workshop credentials.');
    }

    if (!this.mechCertData) {
      return alert('Please upload your trade certification or mechanical license.');
    }

    if (!window.FirebaseAuth || !window.FirebaseAuth.currentUser) {
      alert('⚠️ Account Required: Please log in or register your workshop on the mechanic registration page (/mechanics) first so your profile can be securely linked.');
      if (window.Auth && typeof window.Auth.openMechanicSignup === 'function') {
        window.Auth.openMechanicSignup();
      } else {
        window.location.href = '/mechanics';
      }
      return;
    }

    const btn = document.querySelector('[onclick="app.saveMechanicProfile()"]');
    if (btn) { btn.disabled = true; btn.textContent = 'SUBMITTING…'; }

    try {
      const result = await MechAPI.register({
        name, spec, exp, emoji, phone, wa, address, email,
        isVerified: false,
        status: 'pending_verification',
        certName: this.mechCertName,
        certData: this.mechCertData
      });
      // Mirror to localStorage so existing rendering still works
      localStorage.setItem('myMechanicProfile', JSON.stringify(result.profile));
      this.renderMechanicDashboard();
      alert('✅ Registration submitted! Your profile is pending verification.');
    } catch(err) {
      alert('❌ Registration failed: ' + err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'SUBMIT PLATFORM APPLICATION →'; }
    }
  },

  simulateVerificationApproval: function() {
    let profile = JSON.parse(localStorage.getItem('myMechanicProfile'));
    if (!profile) return;

    profile.status = 'verified';
    profile.isVerified = true;
    localStorage.setItem('myMechanicProfile', JSON.stringify(profile));
    
    const defaultLogs = [];
    if (!localStorage.getItem('myPortfolioLogs')) {
      localStorage.setItem('myPortfolioLogs', JSON.stringify(defaultLogs));
    }
    
    this.syncProfileToRegistry();
    this.renderMechanicDashboard();
    
    if (this.userLat && this.userLng) {
      this.fetchRealMechanics(this.userLat, this.userLng, this.activeCity || 'Your City');
    }
  },

  toggleMechanicStatus: async function() {
    let profile = JSON.parse(localStorage.getItem('myMechanicProfile'));
    if (!profile) return;

    const newAvail = profile.avail === 'open' ? 'busy' : 'open';
    try {
      await MechAPI.updateStatus(newAvail);
    } catch(e) { /* fallback: still update locally */ }

    profile.avail = newAvail;
    localStorage.setItem('myMechanicProfile', JSON.stringify(profile));
    this.syncProfileToRegistry();
    this.renderMechanicDashboard();

    if (this.userLat && this.userLng) {
      this.fetchRealMechanics(this.userLat, this.userLng, this.activeCity || 'Your City');
    }
  },

  toggleEditProfilePanel: function() {
    const el = document.getElementById('editProfileWorkspace');
    if (el) {
      el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
  },

  updateBookingStatus: async function(id, newStatus) {
    // Update on server
    try {
      if (newStatus === 'completed') await MechAPI.markApptDone(id);
      else if (newStatus === 'cancelled') await MechAPI.cancelAppt(id);
      else await fetch('/api/mechanic-appointments', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
    } catch(e) { console.warn('updateBookingStatus server error:', e.message); }

    // Also mirror locally so the UI re-renders immediately
    let appointments = JSON.parse(localStorage.getItem('at_appointments') || '[]');
    appointments = appointments.map(b => {
      if (String(b.id) === String(id)) b.status = newStatus;
      return b;
    });
    localStorage.setItem('at_appointments', JSON.stringify(appointments));
    this.renderMechanicDashboard();
  },

  saveEditMechanicProfile: function() {
    let profile = JSON.parse(localStorage.getItem('myMechanicProfile'));
    if (!profile) return;

    const name = document.getElementById('editMechNameInput').value.trim();
    const spec = document.getElementById('editMechSpecInput').value;
    const exp = document.getElementById('editMechExpInput').value.trim();
    const emoji = document.getElementById('editMechEmojiInput').value;
    const phone = document.getElementById('editMechPhoneInput').value.trim();
    const wa = document.getElementById('editMechWaInput').value.trim();
    const address = document.getElementById('editMechAddrInput').value.trim();

    if (!name || !exp || !phone || !wa || !address) {
      return alert('Please fill in all the required workshop credentials.');
    }

    profile.name = name;
    profile.spec = spec;
    profile.exp = exp;
    profile.emoji = emoji;
    profile.phone = phone;
    profile.wa = wa;
    profile.address = address;

    localStorage.setItem('myMechanicProfile', JSON.stringify(profile));
    
    this.syncProfileToRegistry();
    this.renderMechanicDashboard();
    
    if (this.userLat && this.userLng) {
      this.fetchRealMechanics(this.userLat, this.userLng, this.activeCity || 'Your City');
    }
    alert('✅ Mechanic profile updated successfully and published live!');
  },

  syncProfileToRegistry: function() {
    let profile = JSON.parse(localStorage.getItem('myMechanicProfile'));
    if (!profile) return;

    const isVerified = (profile.status === 'verified' || profile.status === 'approved' || profile.isVerified);
    if (!isVerified) return;

    const customMech = {
      id: 'my_profile_mech',
      name: profile.name,
      spec: profile.spec,
      area: profile.address || 'Local Workshop',
      distance: '0.1 km',
      distVal: 0.1,
      phone: profile.phone,
      wa: profile.wa,
      email: profile.email || 'mech@autotriage.pro',
      rating: '5.0',
      reviews: 0,
      verified: true,
      avail: profile.avail || 'open',
      emoji: profile.emoji,
      yrs: profile.exp || 5,
      city: profile.city || this.activeCity || 'Your City',
      lat: this.userLat || 51.5074,
      lng: this.userLng || -0.1278
    };

    let registry = JSON.parse(localStorage.getItem('at_mechanic_registry') || '[]');
    // Clean up old timestamped duplicate registration IDs from this profile
    registry = registry.filter(m => m && m.id && !m.id.toString().startsWith('my_profile_mech_'));

    const idx = registry.findIndex(m => m.id === 'my_profile_mech');
    if (idx !== -1) {
      registry[idx] = customMech;
    } else {
      registry.push(customMech);
    }
    localStorage.setItem('at_mechanic_registry', JSON.stringify(registry));
  },

  addPortfolioLog: async function() {
    const title   = document.getElementById('portTitleInput')?.value.trim();
    const car     = document.getElementById('portCarInput')?.value.trim();
    const cost    = document.getElementById('portCostInput')?.value.trim();
    const summary = document.getElementById('portSummaryInput')?.value.trim();

    if (!title || !car || !cost || !summary) {
      alert('Please write out all job details first!');
      return;
    }

    try {
      const result = await MechAPI.addPortfolio({ title, car, cost, summary });
      // Also mirror to localStorage so renderMechanicDashboard works offline
      const logs = JSON.parse(localStorage.getItem('myPortfolioLogs')) || [];
      logs.unshift({ id: result.entry.id, title, car, cost, summary });
      localStorage.setItem('myPortfolioLogs', JSON.stringify(logs));
    } catch(err) {
      // Offline fallback — still save locally
      const logs = JSON.parse(localStorage.getItem('myPortfolioLogs')) || [];
      logs.unshift({ title, car, cost, summary });
      localStorage.setItem('myPortfolioLogs', JSON.stringify(logs));
    }

    this.renderMechanicDashboard();
    document.getElementById('portTitleInput').value = '';
    document.getElementById('portCarInput').value   = '';
    document.getElementById('portCostInput').value  = '';
    document.getElementById('portSummaryInput').value = '';
    alert('🎨 Log successfully posted to your active portfolio!');
  },

  deletePortfolioItem: async function(idx) {
    let logs = JSON.parse(localStorage.getItem('myPortfolioLogs')) || [];
    const entry = logs[idx];
    // Delete from server if we have a server-side id
    if (entry && entry.id) {
      try { await MechAPI.deletePortfolio(entry.id); } catch(e) { console.warn(e.message); }
    }
    logs.splice(idx, 1);
    localStorage.setItem('myPortfolioLogs', JSON.stringify(logs));
    this.renderMechanicDashboard();
  },

  resetMechanicData: function() {
    if (confirm("Are you sure you want to reset all cached mechanic and workshop data? This will clear your profile and map markers.")) {
      localStorage.removeItem('myMechanicProfile');
      localStorage.removeItem('myPortfolioLogs');
      
      let registry = [];
      try {
        registry = JSON.parse(localStorage.getItem('at_mechanic_registry') || '[]');
        registry = registry.filter(m => m && m.id !== 'my_profile_mech' && !m.id.toString().startsWith('my_profile_mech_'));
        localStorage.setItem('at_mechanic_registry', JSON.stringify(registry));
      } catch(e) {}

      localStorage.removeItem('myInboundLeads');
      localStorage.removeItem('autoTriage_desktop_mechanics');
      
      this.MECHS = [];
      alert('🧹 Mechanic & workshop profile data has been fully reset!');
      this.renderMechanicDashboard();
      
      if (this.userLat && this.userLng) {
        this.fetchRealMechanics(this.userLat, this.userLng, this.activeCity || 'Your City');
      }
    }
  },

  // ── REAL DATA LOADER ──────────────────────────────────────────────────────
  // Replaces seedMockTestData. Pulls live data from the server and re-renders.
  loadRealMechanicData: async function() {
    const btn = document.getElementById('refreshMechanicBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Loading…'; }
    try {
      const { profile, appointments, leads, portfolio } = await MechAPI.loadAll();
      // Mirror to localStorage so existing render functions keep working unchanged
      localStorage.setItem('myMechanicProfile',  JSON.stringify(profile));
      localStorage.setItem('at_appointments',    JSON.stringify(appointments));
      localStorage.setItem('myInboundLeads',     JSON.stringify(leads));
      localStorage.setItem('myPortfolioLogs',    JSON.stringify(portfolio));
      this.syncProfileToRegistry();
      this.renderMechanicDashboard();
    } catch(err) {
      alert('❗ Unable to load mechanic data: ' + err.message + '\n\nMake sure you are registered and the server is running.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '🔄 Refresh Data'; }
    }
  },

  // KEPT FOR LEGACY reference only — no longer called from UI
  _seedMockTestData_DEPRECATED: function() {
    let profile = null;
    try {
      profile = JSON.parse(localStorage.getItem('myMechanicProfile'));
    } catch(e) {}

    if (!profile) {
      profile = {
        name: 'apex repair',
        spec: 'General Mechanic',
        exp: '8',
        emoji: '👨🏾‍🔧',
        phone: '+2348033221100',
        wa: '2348033221100',
        address: '15 Herbert Macaulay Way, Yaba, Lagos',
        email: 'apex@autotriage.pro',
        certName: 'mock_certification_license.pdf',
        certData: 'data:application/pdf;base64,JVBERi0xLjQK...',
        status: 'verified',
        isVerified: true,
        avail: 'open'
      };
      localStorage.setItem('myMechanicProfile', JSON.stringify(profile));
      this.syncProfileToRegistry();
    }

    const profileName = profile.name;

    const mockAppointments = [
      {
        id: 'mock_booking_1',
        mechName: profileName,
        clientName: 'David Alao',
        clientPhone: '+2348099887766',
        clientEmail: 'david.alao@gmail.com',
        clientAddress: 'Block 4, Flat 2, LSDPC Estate, Surulere, Lagos',
        clientLat: 6.4952,
        clientLng: 3.3642,
        car: 'Toyota Corolla 2018',
        problem: 'Engine overheating after driving for 15 minutes. Coolant level seems fine but radiator fan is not spinning.',
        urgency: 'high',
        status: 'confirmed',
        time: 'Tomorrow at 10:00 AM'
      },
      {
        id: 'mock_booking_2',
        mechName: profileName,
        clientName: 'Chioma Nwachukwu',
        clientPhone: '+2348122334455',
        clientEmail: 'chioma.n@yahoo.com',
        clientAddress: '12 Joel Ogunnaike Street, GRA GRA Ikeja, Lagos',
        clientLat: 6.5958,
        clientLng: 3.3601,
        car: 'Lexus RX350 2015',
        problem: 'Squeaking noise from front wheels when braking. Brake wear warning light just came on.',
        urgency: 'medium',
        status: 'confirmed',
        time: 'Friday at 2:30 PM'
      },
      {
        id: 'mock_booking_3',
        mechName: profileName,
        clientName: 'Babajide Cole',
        clientPhone: '+2347055667788',
        clientEmail: 'jidecole@autotriage.io',
        clientAddress: '15 Herbert Macaulay Way, Yaba, Lagos',
        clientLat: 6.5182,
        clientLng: 3.3768,
        car: 'Honda Accord 2012',
        problem: 'AC not cooling at all. Blows warm air. Checked refrigerant and it was low.',
        urgency: 'low',
        status: 'completed',
        time: 'Yesterday at 4:00 PM'
      }
    ];

    const mockLeads = [
      {
        id: 10001,
        car: 'Ford Explorer 2016',
        issue: 'Transmission slipping when shifting from 2nd to 3rd gear',
        diagnosis: 'P0733 Gear 3 Incorrect Ratio (AI Diagnosis: Transmission Fluid Pressure Low / Solenoid Valve A Failure)',
        distance: '1.2 km',
        time: '3 mins ago',
        cost: '$180 - $260',
        clientName: 'Emeka Okafor',
        clientPhone: '+2348033221100',
        clientEmail: 'emeka@gmail.com',
        clientAddress: '32 Montgomery Road, Yaba, Lagos',
        clientLat: 6.5135,
        clientLng: 3.3742,
        urgency: 'critical',
        date: 'Today',
        timeSlot: 'ASAP',
        targetMechName: profileName,
        status: 'pending'
      },
      {
        id: 10002,
        car: 'Mercedes-Benz C300 2017',
        issue: 'Rough idling and Check Engine Light flashing',
        diagnosis: 'P0300 Random/Multiple Cylinder Misfire Detected (AI Diagnosis: Faulty Ignition Coils or Spark Plugs)',
        distance: '3.4 km',
        time: '12 mins ago',
        cost: '$120 - $185',
        clientName: 'Tunde Bakare',
        clientPhone: '+2348022113344',
        clientEmail: 'tunde.bakare@outlook.com',
        clientAddress: '65 Adeniran Ogunsanya St, Surulere, Lagos',
        clientLat: 6.4975,
        clientLng: 3.3512,
        urgency: 'high',
        date: 'Today',
        timeSlot: 'ASAP',
        targetMechName: profileName,
        status: 'pending'
      }
    ];

    const mockPortfolio = [
      {
        title: 'Alternator Replacement & Battery Recalibration',
        car: 'Toyota Camry 2015',
        cost: '220',
        summary: 'Diagnosed charging system failure. Measured battery voltage at 11.6V while idling. Removed failed OEM alternator and installed new 130A replacement unit. Re-tested system showing steady 14.2V output under electrical load.'
      },
      {
        title: 'Front Brake Rotor Resurfacing & Pad Swap',
        car: 'Hyundai Elantra 2017',
        cost: '140',
        summary: 'Resolved grinding brake noise. Replaced worn front brake pads with ceramic compound and resurfaced rotor discs. Caliper sliding pins cleaned and lubricated. Road test confirmed silent, vibration-free braking performance.'
      }
    ];

    localStorage.setItem('at_appointments', JSON.stringify(mockAppointments));
    localStorage.setItem('myInboundLeads', JSON.stringify(mockLeads));
    localStorage.setItem('myPortfolioLogs', JSON.stringify(mockPortfolio));

    this.renderMechanicDashboard();
    
    if (this.userLat && this.userLng) {
      this.fetchRealMechanics(this.userLat, this.userLng, this.activeCity || 'Your City');
    }
    alert(`⚡ Mock test data successfully seeded for "${profileName}"!`);
  },

  acceptJobLead: async function(id) {
    try {
      await MechAPI.acceptLead(id);
      // Reload all data from server so UI is accurate
      await this.loadRealMechanicData();
      return;
    } catch(err) { console.warn('acceptJobLead server error:', err.message); }
    // Offline fallback (original logic)
    let leads = JSON.parse(localStorage.getItem('myInboundLeads')) || [];
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    // Save as confirmed appointment disclosing confidential info
    const appointments = JSON.parse(localStorage.getItem('at_appointments') || '[]');
    appointments.unshift({
      id: Date.now(),
      mechName: JSON.parse(localStorage.getItem('myMechanicProfile')).name,
      clientName: lead.clientName || 'John Smith',
      clientPhone: lead.clientPhone || '+2348033221100',
      clientEmail: lead.clientEmail || 'driver@autotriage.io',
      clientAddress: lead.clientAddress || 'Yaba, Lagos',
      clientLat: lead.clientLat || 51.5074,
      clientLng: lead.clientLng || -0.1278,
      car: lead.car,
      problem: lead.issue,
      urgency: lead.urgency || 'critical',
      status: 'confirmed',
      time: lead.date && lead.timeSlot ? `${lead.date} at ${lead.timeSlot}` : 'Today, 2:00 PM'
    });
    localStorage.setItem('at_appointments', JSON.stringify(appointments));

    // Remove from leads
    leads = leads.filter(l => l.id !== id);
    localStorage.setItem('myInboundLeads', JSON.stringify(leads));

    this.renderMechanicDashboard();
    
    // Call serverless Twilio SMS dispatcher in the background!
    const smsMessage = `Hi ${lead.clientName || 'Driver'}, your AutoTriage appointment has been CONFIRMED by ${JSON.parse(localStorage.getItem('myMechanicProfile')).name}. Track responder route on your dashboard!`;
    
    fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: lead.clientPhone || '+2348033221100',
        message: smsMessage
      })
    })
    .then(r => r.json())
    .then(data => {
      console.log('[AutoTriage SMS Carrier Response]:', data);
    })
    .catch(e => console.error('Twilio SMS API error:', e));

    alert(`🎉 EMERGENCY LEAD SECURED!\n\nDriver contact information has been fully disclosed on your dashboard.\n\nSimulating SMTP/Cellular Carrier Dispatch Routing:\n[SMS ROUTING] -> Dynamic text sent to driver at ${lead.clientPhone || '+2348033221100'}: "Hi ${lead.clientName || 'John'}, your appointment request is CONFIRMED by ${JSON.parse(localStorage.getItem('myMechanicProfile')).name}. See details on your dashboard!"`);
  },

  rejectJobLead: function(id) {
    let leads = JSON.parse(localStorage.getItem('myInboundLeads')) || [];
    leads = leads.filter(l => l.id !== id);
    localStorage.setItem('myInboundLeads', JSON.stringify(leads));
    this.renderMechanicDashboard();
  },

  renderMechanicDashboard: function() {
    const container = document.getElementById('mechanicCenterDashboard');
    if (!container) return;

    let profile = null;
    try {
      const stored = localStorage.getItem('myMechanicProfile');
      if (stored) profile = JSON.parse(stored);
    } catch(e) {}
    
    let leads = [];
    try {
      const storedLeads = localStorage.getItem('myInboundLeads');
      if (storedLeads) leads = JSON.parse(storedLeads);
    } catch(e) {}
    
    // Filter leads to show only those matching the current logged-in mechanic's name
    if (profile) {
      leads = leads.filter(l => !l.targetMechName || l.targetMechName === profile.name);
    }

    let portfolio = [];
    try {
      portfolio = JSON.parse(localStorage.getItem('myPortfolioLogs')) || [];
    } catch(e) {}

    let portfolioHTML = portfolio.map((p, idx) => `
      <div class="bg-[#0e0e11]/50 border border-zinc-800/80 rounded-2xl p-6 relative hover:border-zinc-700/60 transition-colors duration-300">
        <button onclick="app.deletePortfolioItem(${idx})" class="absolute top-4 right-4 text-zinc-500 hover:text-red-500 font-bold transition-colors bg-transparent border-none cursor-pointer">✕</button>
        <div class="text-sm font-bold text-white font-mono mb-2">${p.title.toUpperCase()}</div>
        <div class="text-[9px] text-zinc-500 font-mono uppercase tracking-wider mb-3">🚘 VEHICLE: ${p.car.toUpperCase()} &bull; <span class="text-emerald-400 font-bold">$${p.cost} CHARGED</span></div>
        <p class="text-xs text-zinc-400 leading-relaxed font-mono">${p.summary}</p>
      </div>
    `).join('');

    if (portfolio.length === 0) {
      portfolioHTML = `
        <div class="bg-black/20 border border-dashed border-zinc-800/80 rounded-2xl p-8 text-center">
          <div class="text-3xl mb-2">🎨</div>
          <div class="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">You haven't logged any repairs yet.</div>
        </div>
      `;
    }

    if (!profile) {
      container.innerHTML = `
        <div class="bg-gradient-to-r from-emerald-950/40 via-black to-zinc-950 border border-emerald-500/20 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden text-center">
          <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="text-6xl mb-4 animate-[bounce_4s_infinite] drop-shadow-[0_10px_20px_rgba(16,185,129,0.3)]">👨🏾‍🔧</div>
          <div class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase mb-4 inline-block">
            🛡️ SECURE NETWORK RECRUITMENT
          </div>
          <h2 class="font-bebas text-4xl text-white tracking-wider mb-2">JOIN THE PRO NETWORK</h2>
          <p class="text-xs text-zinc-400 font-mono max-w-lg mx-auto leading-relaxed mt-2">
            Apply to our verified high-fidelity diagnostic network. Receive nearby emergency leads and active booking payouts instantly.
          </p>
        </div>

        <div class="bg-[#0a0a0c] border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative">
          <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-30"></div>
          <h3 class="font-bebas text-3xl tracking-wider text-white mb-6">APPLICANT REGISTRATION</h3>
          
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 relative z-10">
            <!-- COLUMN 1: WORKSHOP DETAILS -->
            <div class="flex flex-col gap-4 bg-zinc-900/20 border border-zinc-800/40 p-5 rounded-2xl">
              <h4 class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono mb-2 border-b border-zinc-800/40 pb-2">🏢 Workshop Credentials</h4>
              <div>
                <label class="block text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 font-mono">Business Name</label>
                <input class="w-full bg-zinc-900/40 border border-zinc-800 text-white placeholder-zinc-500 pl-4 pr-4 py-3 rounded-xl font-mono text-[12px] outline-none focus:border-emerald-500/50 transition-all duration-300" type="text" id="mechNameInput" placeholder="e.g. Apex Auto Repairs"/>
              </div>
              <div>
                <label class="block text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 font-mono">Specialization</label>
                <div class="relative">
                  <select id="mechSpecInput" class="w-full bg-zinc-900/40 border border-zinc-800 text-white pl-4 pr-10 py-3 rounded-xl font-mono text-[12px] outline-none focus:border-emerald-500/50 transition-all duration-300 appearance-none cursor-pointer" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath fill=\'%23888\' d=\'M1 1l5 5 5-5\'/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 16px center;">
                    <option value="General Mechanic" class="bg-[#121214] text-white">General Mechanic</option>
                    <option value="Engine Specialist" class="bg-[#121214] text-white">Engine Specialist</option>
                    <option value="Brake Specialist" class="bg-[#121214] text-white">Brake Specialist</option>
                    <option value="Auto Electrician" class="bg-[#121214] text-white">Auto Electrician</option>
                    <option value="AC Specialist" class="bg-[#121214] text-white">AC Specialist</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 font-mono">Geolocation Address</label>
                <input class="w-full bg-zinc-900/40 border border-zinc-800 text-white placeholder-zinc-500 pl-4 pr-4 py-3 rounded-xl font-mono text-[12px] outline-none focus:border-emerald-500/50 transition-all duration-300" type="text" id="mechAddrInput" placeholder="e.g. 15 Herbert Macaulay, Yaba"/>
              </div>
            </div>

            <!-- COLUMN 2: PROFILE DETAILS -->
            <div class="flex flex-col gap-4 bg-zinc-900/20 border border-zinc-800/40 p-5 rounded-2xl">
              <h4 class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono mb-2 border-b border-zinc-800/40 pb-2">🛠️ Platform Profile</h4>
              <div>
                <label class="block text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 font-mono">Experience (Years)</label>
                <input class="w-full bg-zinc-900/40 border border-zinc-800 text-white placeholder-zinc-500 pl-4 pr-4 py-3 rounded-xl font-mono text-[12px] outline-none focus:border-emerald-500/50 transition-all duration-300" type="number" id="mechExpInput" placeholder="e.g. 8" min="1"/>
              </div>
              <div>
                <label class="block text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 font-mono">Profile Avatar</label>
                <div class="relative">
                  <select id="mechEmojiInput" class="w-full bg-zinc-900/40 border border-zinc-800 text-white pl-4 pr-10 py-3 rounded-xl font-mono text-[12px] outline-none focus:border-emerald-500/50 transition-all duration-300 appearance-none cursor-pointer" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath fill=\'%23888\' d=\'M1 1l5 5 5-5\'/%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 16px center;">
                    <option value="👨🏾‍🔧" class="bg-[#121214] text-white">👨🏾‍🔧 Mechanic Avatar 1</option>
                    <option value="👨🏻‍🔧" class="bg-[#121214] text-white">👨🏻‍🔧 Mechanic Avatar 2</option>
                    <option value="👩🏼‍🔧" class="bg-[#121214] text-white">👩🏼‍🔧 Mechanic Avatar 3</option>
                    <option value="👩🏾‍🔧" class="bg-[#121214] text-white">👩🏾‍🔧 Mechanic Avatar 4</option>
                    <option value="👨🏿‍🔧" class="bg-[#121214] text-white">👨🏿‍🔧 Mechanic Avatar 5</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- COLUMN 3: CONTACT INFORMATION -->
            <div class="flex flex-col gap-4 bg-zinc-900/20 border border-zinc-800/40 p-5 rounded-2xl">
              <h4 class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono mb-2 border-b border-zinc-800/40 pb-2">📞 Direct Contact</h4>
              <div>
                <label class="block text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 font-mono">Phone Number</label>
                <input class="w-full bg-zinc-900/40 border border-zinc-800 text-white placeholder-zinc-500 pl-4 pr-4 py-3 rounded-xl font-mono text-[12px] outline-none focus:border-emerald-500/50 transition-all duration-300" type="tel" id="mechPhoneInput" placeholder="e.g. +2348033221100"/>
              </div>
              <div>
                <label class="block text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 font-mono">WhatsApp Number</label>
                <input class="w-full bg-zinc-900/40 border border-zinc-800 text-white placeholder-zinc-500 pl-4 pr-4 py-3 rounded-xl font-mono text-[12px] outline-none focus:border-emerald-500/50 transition-all duration-300" type="text" id="mechWaInput" placeholder="e.g. 2348033221100"/>
              </div>
              <div>
                <label class="block text-[9px] text-zinc-500 uppercase tracking-wider font-semibold mb-1.5 font-mono">Platform Login Email</label>
                <input class="w-full bg-zinc-900/40 border border-zinc-800 text-white placeholder-zinc-500 pl-4 pr-4 py-3 rounded-xl font-mono text-[12px] outline-none focus:border-emerald-500/50 transition-all duration-300" type="email" id="mechEmailInput" placeholder="e.g. mech@autotriage.pro"/>
              </div>
            </div>
          </div>

          <!-- Certificate Dropzone -->
          <div class="mb-8 relative z-10">
            <label class="block text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2.5 font-mono">🛡️ Upload Professional Certification</label>
            <div id="certFileContainer" onclick="document.getElementById('mechCertInput').click()" class="border border-dashed border-zinc-800 hover:border-emerald-500/40 bg-[#060608] rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.05)]">
              <div class="text-4xl mb-3">📜</div>
              <div id="mechCertStatus" class="text-[11px] text-zinc-500 font-mono">Click to upload license/state certification (PDF/Image)</div>
              <input type="file" id="mechCertInput" accept="image/*,application/pdf" style="display:none;" onchange="app.handleCertUpload(this)"/>
            </div>
          </div>

          <button onclick="app.saveMechanicProfile()" class="w-full relative z-10 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-mono font-bold tracking-widest text-[11px] uppercase transition-all duration-300 shadow-[0_4px_25px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 outline-none">
            SUBMIT PLATFORM APPLICATION →
          </button>
          <button onclick="app.seedMockTestData()" class="w-full mt-3 relative z-10 py-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/30 font-mono font-bold tracking-widest text-[10px] uppercase transition-all duration-300 outline-none hover:shadow-[0_4px_15px_rgba(245,158,11,0.15)]">
            ⚡ SEED MOCK TEST DATA
          </button>
          <button onclick="app.resetMechanicData()" class="w-full mt-3 relative z-10 py-3 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-950/10 text-red-400 hover:bg-red-950/20 font-mono font-bold tracking-widest text-[10px] uppercase transition-all duration-300 outline-none">
            ⚠️ RESET CACHED DEVELOPER DATA
          </button>
        </div>
      `;
    } else if (profile.status === 'pending_verification') {
      container.innerHTML = `
        <div class="bg-[#0a0a0c] border border-zinc-800/80 rounded-3xl p-10 text-center relative overflow-hidden shadow-2xl">
          <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-30"></div>
          <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="text-6xl mb-6 animate-pulse filter drop-shadow-[0_0_25px_rgba(245,158,11,0.3)]">🛡️</div>
          <div class="bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[9px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase mb-4 inline-block">
            VETTING IN PROGRESS
          </div>
          <h2 class="font-bebas text-4xl text-white tracking-wider mb-2">APPLICATION UNDER REVIEW</h2>
          <p class="text-xs text-zinc-400 font-mono max-w-sm mx-auto leading-relaxed mb-8">
            Our verification nodes are auditing your uploaded mechanic credentials: <strong class="text-amber-500 block mt-2 font-bold">${profile.certName}</strong>
          </p>

          <div class="w-full text-left bg-black/40 border border-zinc-800 p-6 rounded-2xl font-mono text-xs leading-loose mb-8 max-w-lg mx-auto">
            <div class="flex justify-between items-center mb-3 pb-3 border-b border-zinc-800/60">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping inline-block mr-1"></span>
                <span class="text-white font-semibold">📁 Trade Certificate check</span>
              </div>
              <span class="text-amber-500 font-bold tracking-widest animate-pulse">[AUDITING]</span>
            </div>
            <div class="flex justify-between items-center mb-3 pb-3 border-b border-zinc-800/60 text-white/30">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-zinc-700 animate-pulse inline-block mr-1"></span>
                <span>📍 Coordinates & geo alignment</span>
              </div>
              <span class="text-zinc-600 font-bold">[PENDING]</span>
            </div>
            <div class="flex justify-between items-center text-white/30">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-zinc-700 animate-pulse inline-block mr-1"></span>
                <span>🚨 Safety background checks</span>
              </div>
              <span class="text-zinc-600 font-bold">[PENDING]</span>
            </div>
          </div>

          <button onclick="app.simulateVerificationApproval()" class="w-full max-w-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold font-mono py-4 rounded-xl tracking-widest transition-all duration-300 shadow-[0_10px_28px_rgba(245,158,11,0.25)] text-[11px] uppercase">
            ⚡ SIMULATE SYSTEM APPROVAL
          </button>
          <button onclick="app.resetMechanicData()" class="w-full max-w-lg mt-3 py-3 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-950/10 text-red-400 hover:bg-red-950/20 font-mono font-bold tracking-widest text-[10px] uppercase transition-all duration-300 outline-none">
            ⚠️ RESET CACHED DEVELOPER DATA
          </button>
        </div>
      `;
    } else {
      const statusText = profile.avail === 'open' ? 'AVAILABLE' : 'BUSY';
      const statusColor = profile.avail === 'open' ? '#00d084' : 'var(--accent)';
      
      // Load and filter appointments for Scheduled Bookings
      const appointments = JSON.parse(localStorage.getItem('at_appointments') || '[]');
      const myBookings = appointments.filter(b => b.mechName === profile.name);

      let bookingsHTML = myBookings.map(b => {
        const urgencyColor = b.urgency === 'critical' ? '#ef4444' : b.urgency === 'high' ? '#f59e0b' : '#3b82f6';
        const statusColor = b.status === 'confirmed' ? '#10b981' : b.status === 'completed' ? 'rgba(255,255,255,0.3)' : '#f59e0b';
        
        return `
          <div class="bg-black/30 border border-zinc-800/80 rounded-2xl p-6 flex flex-col gap-4 hover:border-zinc-700/60 transition-colors duration-300">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded" style="color: ${statusColor}; border: 1px solid ${statusColor}40; background: ${statusColor}10;">${b.status.toUpperCase()}</span>
                <span class="text-[9px] font-mono font-bold tracking-wider uppercase bg-white/5 text-white/50 px-2 py-0.5 rounded border border-white/10 ml-1.5">${b.urgency.toUpperCase()} URGENCY</span>
                <div class="text-sm font-bold text-white font-mono mt-2">👨🏻‍✈️ CLIENT: ${b.clientName.toUpperCase()}</div>
              </div>
              <span class="text-xs font-bold text-zinc-500 font-mono">${b.time}</span>
            </div>
            
            <div class="text-xs text-zinc-400 leading-relaxed font-mono border-t border-zinc-800/60 pt-3 flex flex-col gap-1.5">
              <div>🚗 <strong>Vehicle Profile:</strong> <span class="text-white">${b.car}</span></div>
              <div>📍 <strong>Address:</strong> <span class="text-[#4da6ff] font-bold">${b.clientAddress}</span></div>
              <div>✉️ <strong>Direct Email:</strong> <a href="mailto:${b.clientEmail}" class="text-blue-400 hover:underline">${b.clientEmail}</a></div>
              <div>📞 <strong>Direct Phone:</strong> <a href="tel:${b.clientPhone}" class="text-emerald-400 font-bold hover:underline">${b.clientPhone}</a></div>
              <div class="mt-2 text-amber-500/90 italic bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">"${b.problem}"</div>
            </div>
            
            ${b.status === 'confirmed' ? `
              <div class="grid grid-cols-2 gap-3 mt-1">
                <button onclick="app.updateBookingStatus('${b.id}', 'completed')" class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 py-3 rounded-xl font-mono text-[10px] font-bold tracking-wider uppercase transition-all">
                  🏁 Complete Repair
                </button>
                <button onclick="app.openMapTracker('${b.clientName.replace(/'/g,"'")}', ${b.clientLat || 51.5074}, ${b.clientLng || -0.1278}, 'to_user')" class="bg-blue-500/10 border border-blue-500/30 text-[#4da6ff] hover:bg-blue-500/20 py-3 rounded-xl font-mono text-[10px] font-bold tracking-wider uppercase transition-all">
                  📍 Dispatch & Track
                </button>
              </div>
            ` : `
              <div class="text-[10px] text-emerald-400/70 text-center font-mono font-bold tracking-widest uppercase py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">✨ Service Completed Successfully</div>
            `}
          </div>
        `;
      }).join('');

      if (myBookings.length === 0) {
        bookingsHTML = `
          <div class="bg-gradient-to-b from-zinc-900/10 to-black/40 border border-dashed border-zinc-800/60 rounded-2xl py-12 px-6 text-center flex flex-col items-center justify-center group hover:border-zinc-700/40 transition-all duration-300">
            <div class="w-14 h-14 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 relative">
              <span class="text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">📅</span>
            </div>
            <div class="text-[10px] text-zinc-400 font-mono uppercase tracking-widest font-semibold mb-1">No Active Scheduled Bookings</div>
            <div class="text-[9px] text-zinc-600 font-mono max-w-[240px] leading-relaxed">Appointments booked by drivers will materialize here. Keep availability toggled.</div>
          </div>
        `;
      }

      let leadsHTML = leads.map(l => {
        const urgencyBorder = l.urgency === 'critical' ? 'border-red-500/30' : l.urgency === 'high' ? 'border-amber-500/30' : 'border-blue-500/30';
        const urgencyBg = l.urgency === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : l.urgency === 'high' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20';

        return `
          <div class="bg-black/30 border ${urgencyBorder} rounded-2xl p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 hover:border-zinc-700/60 transition-colors duration-300">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-[10px] text-[#4da6ff] font-mono font-bold tracking-wider uppercase bg-[#4da6ff]/10 px-2 py-0.5 rounded border border-[#4da6ff]/15">${l.car}</span>
                <span class="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded ${urgencyBg}">${l.urgency ? l.urgency.toUpperCase() : 'URGENT'}</span>
                <span class="text-[10px] text-zinc-500 font-mono ml-1.5">${l.time}</span>
              </div>
              <h4 class="text-[15px] font-bold text-white font-mono mb-1 truncate">${l.issue}</h4>
              <p class="text-[11px] text-zinc-400 font-mono"><strong class="text-red-400">Diagnosis:</strong> ${l.diagnosis}</p>
              <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-zinc-500 font-mono border-t border-zinc-800/40 pt-2.5">
                <span>👤 CLIENT: <strong class="text-white">${l.clientName}</strong></span>
                <span>📞 PHONE: <strong class="text-amber-500">🔒 LOCKED UNTIL ACCEPTED</strong></span>
                <span>✉️ EMAIL: <strong class="text-amber-500">🔒 LOCKED UNTIL ACCEPTED</strong></span>
              </div>
            </div>
            <div class="flex xl:flex-col items-end gap-3 w-full xl:w-auto">
              <div class="text-right">
                <div class="text-[18px] font-bold text-emerald-400 font-mono leading-none">${l.cost}</div>
                <div class="text-[10px] text-zinc-500 font-mono mt-1">${l.distance} away</div>
              </div>
              <div class="flex gap-2 w-full xl:w-auto mt-1">
                <button onclick="app.acceptJobLead(${l.id})" class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black px-4 py-2 rounded-xl text-[10px] font-bold font-mono tracking-wider transition-all uppercase">Accept</button>
                <button onclick="app.rejectJobLead(${l.id})" class="bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white px-3 py-2 rounded-xl text-[10px] font-bold font-mono transition-all">Decline</button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      if (leads.length === 0) {
        leadsHTML = `
          <div class="bg-gradient-to-b from-zinc-900/10 to-black/40 border border-dashed border-zinc-800/60 rounded-2xl py-12 px-6 text-center flex flex-col items-center justify-center group hover:border-zinc-700/40 transition-all duration-300 relative overflow-hidden">
            <div class="absolute inset-0 bg-radial-gradient from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div class="w-14 h-14 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-4 relative transition-all duration-500">
              <span class="text-2xl filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-[pulse_3s_infinite]">📡</span>
              <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            </div>
            <div class="text-[10px] text-zinc-400 font-mono uppercase tracking-widest font-semibold mb-1">Emergency Dispatch Pipeline Active</div>
            <div class="text-[9px] text-zinc-600 font-mono max-w-[280px] leading-relaxed">No active emergency requests in your area. Radar scanner is listening for live telematics faults...</div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- SIDEBAR: PROFILE STATS -->
          <div class="col-span-1 bg-gradient-to-b from-[#111115] to-[#0a0a0c] border border-white/[0.05] rounded-3xl p-6 shadow-2xl relative overflow-hidden h-fit">
            <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-30"></div>
            <div class="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div class="flex gap-4 items-center mb-6 relative z-10">
              <div class="text-4xl w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center shadow-lg border relative transition-all duration-300"
                   style="border-color: ${profile.avail === 'open' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'};
                          box-shadow: 0 0 15px ${profile.avail === 'open' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'};">
                ${profile.emoji}
                <span class="absolute -bottom-1.5 -right-1.5 flex h-4 w-4">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style="background-color: ${statusColor};"></span>
                  <span class="relative inline-flex rounded-full h-4 w-4 border-2 border-[#0a0a0c]" style="background-color: ${statusColor};"></span>
                </span>
              </div>
              <div class="min-w-0">
                <div class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[8px] font-bold px-2 py-0.5 rounded-full tracking-widest uppercase mb-1 w-fit">
                  🛡️ Verified Pro
                </div>
                <h3 class="text-lg font-bold text-white font-mono truncate" title="${profile.name}">${profile.name}</h3>
                <div class="flex flex-col gap-0.5 mt-0.5">
                  <span class="text-[10px] text-zinc-300 font-mono font-medium">${profile.spec}</span>
                  <span class="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">${profile.exp || 5} Yrs Experience</span>
                </div>
              </div>
            </div>

            <!-- EXECUTIVE METRICS PANEL -->
            <div class="grid grid-cols-3 gap-3 mb-6 relative z-10 font-mono">
              <div class="bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-amber-500/20 rounded-2xl p-3 text-center transition-all duration-300">
                <div class="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">★ 5.0</div>
                <div class="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">Rating</div>
              </div>
              <div class="bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-emerald-500/20 rounded-2xl p-3 text-center transition-all duration-300">
                <div class="text-xs font-bold text-white">$1.4k</div>
                <div class="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">Revenue</div>
              </div>
              <div class="bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-blue-500/20 rounded-2xl p-3 text-center transition-all duration-300">
                <div class="text-xs font-bold text-[#4da6ff]">96%</div>
                <div class="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">Lead Bid</div>
              </div>
            </div>

            <!-- EXPANDED DETAILED WORKSHOP INFO -->
            <div class="bg-black/30 border border-zinc-800/40 rounded-2xl p-4.5 mb-6 font-mono text-[10px] text-zinc-400 relative z-10 flex flex-col gap-3">
              <div class="text-[8px] text-zinc-500 uppercase tracking-widest font-bold border-b border-zinc-800/40 pb-2 mb-0.5">Workshop Contacts & Hub</div>
              
              <div class="flex items-center justify-between gap-4">
                <span class="text-zinc-500 flex items-center gap-1.5">📞 PHONE</span>
                <span class="text-white font-bold truncate select-all" title="${profile.phone || 'N/A'}">${profile.phone || 'N/A'}</span>
              </div>
              
              <div class="flex items-center justify-between gap-4">
                <span class="text-zinc-500 flex items-center gap-1.5">💬 WHATSAPP</span>
                <span class="text-white font-bold truncate select-all" title="${profile.wa || 'N/A'}">${profile.wa || 'N/A'}</span>
              </div>
              
              <div class="flex items-center justify-between gap-4">
                <span class="text-zinc-500 flex items-center gap-1.5">✉️ EMAIL</span>
                <span class="text-white font-bold truncate select-all" title="${profile.email || 'N/A'}">${profile.email || 'N/A'}</span>
              </div>
              
              <div class="flex flex-col gap-1 border-t border-zinc-800/40 pt-2.5">
                <span class="text-zinc-500">📍 SERVICE HUB ADDRESS</span>
                <span class="text-white font-bold leading-normal mt-0.5" title="${profile.address || 'N/A'}">${profile.address || 'N/A'}</span>
              </div>
            </div>

            <div class="border-t border-zinc-800/60 pt-5 flex flex-col gap-4 relative z-10">
              <div class="flex justify-between items-center bg-black/25 p-3.5 rounded-xl border border-white/[0.03] hover:border-white/[0.07] transition-all duration-300">
                <div>
                  <div class="text-[8px] text-zinc-500 uppercase tracking-wider font-bold font-mono">Workspace Status</div>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: ${statusColor}; box-shadow: 0 0 6px ${statusColor};"></span>
                    <span class="font-mono text-[10px] font-bold tracking-wider" style="color: ${statusColor};">${statusText}</span>
                  </div>
                </div>
                <button onclick="app.toggleMechanicStatus()" class="bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-[9px] font-bold px-3 py-1.5 rounded-lg transition-all duration-300 hover:shadow-[0_2px_10px_rgba(255,255,255,0.05)] cursor-pointer border-none uppercase tracking-wider">TOGGLE</button>
              </div>

              <button onclick="app.toggleEditProfilePanel()" class="w-full bg-[#4da6ff]/10 border border-[#4da6ff]/20 text-[#4da6ff] hover:bg-[#4da6ff]/20 py-3.5 rounded-xl font-mono text-[10px] font-bold tracking-wider transition-all uppercase hover:shadow-[0_4px_15px_rgba(77,166,255,0.15)]">
                EDIT PLATFORM PROFILE
              </button>
              
              <button onclick="app.seedMockTestData()" class="w-full bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/30 py-3.5 rounded-xl font-mono text-[10px] font-bold tracking-wider transition-all uppercase hover:shadow-[0_4px_15px_rgba(245,158,11,0.15)]">
                ⚡ SEED MOCK TEST DATA
              </button>
              
              <button onclick="app.resetMechanicData()" class="w-full bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-950/30 hover:border-red-500/30 py-3.5 rounded-xl font-mono text-[10px] font-bold tracking-wider transition-all uppercase hover:shadow-[0_4px_15px_rgba(239,68,68,0.15)]">
                ⚠️ RESET WORKSPACE DATA
              </button>
            </div>
            
            <div id="editProfileWorkspace" style="display:none;" class="mt-6 border-t border-dashed border-zinc-800/60 pt-4 animation: fadeIn 0.3s ease relative z-10">
              <h4 class="font-mono text-[9px] text-[#4da6ff] font-bold tracking-widest uppercase mb-4">⚙️ Edit Workshop Details</h4>
              <div class="flex flex-col gap-3.5 font-mono">
                <div>
                  <label class="text-[8px] text-zinc-500 uppercase tracking-wider mb-1 block font-bold">Workshop Name</label>
                  <input class="w-full bg-black/40 border border-zinc-800/80 hover:border-zinc-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#4da6ff]/50 focus:ring-1 focus:ring-[#4da6ff]/20 transition-all duration-300" type="text" id="editMechNameInput" value="${profile.name}"/>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-[8px] text-zinc-500 uppercase tracking-wider mb-1 block font-bold">Specialty</label>
                    <select id="editMechSpecInput" class="w-full bg-black/40 border border-zinc-800/80 hover:border-zinc-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white cursor-pointer select-element outline-none focus:border-[#4da6ff]/50 transition-all duration-300">
                      <option value="General Mechanic" ${profile.spec === 'General Mechanic' ? 'selected' : ''}>General Mechanic</option>
                      <option value="Engine Specialist" ${profile.spec === 'Engine Specialist' ? 'selected' : ''}>Engine Specialist</option>
                      <option value="Brake Specialist" ${profile.spec === 'Brake Specialist' ? 'selected' : ''}>Brake Specialist</option>
                      <option value="Auto Electrician" ${profile.spec === 'Auto Electrician' ? 'selected' : ''}>Auto Electrician</option>
                      <option value="AC Specialist" ${profile.spec === 'AC Specialist' ? 'selected' : ''}>AC Specialist</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-[8px] text-zinc-500 uppercase tracking-wider mb-1 block font-bold">Exp (Years)</label>
                    <input class="w-full bg-black/40 border border-zinc-800/80 hover:border-zinc-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#4da6ff]/50 focus:ring-1 focus:ring-[#4da6ff]/20 transition-all duration-300" type="number" id="editMechExpInput" value="${profile.exp || 5}"/>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-[8px] text-zinc-500 uppercase tracking-wider mb-1 block font-bold">Avatar Emoji</label>
                    <select id="editMechEmojiInput" class="w-full bg-black/40 border border-zinc-800/80 hover:border-zinc-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white cursor-pointer select-element outline-none focus:border-[#4da6ff]/50 transition-all duration-300">
                      <option value="👨🏾‍🔧" ${profile.emoji === '👨🏾‍🔧' ? 'selected' : ''}>👨🏾‍🔧 avatar 1</option>
                      <option value="👨🏻‍🔧" ${profile.emoji === '👨🏻‍🔧' ? 'selected' : ''}>👨🏻‍🔧 avatar 2</option>
                      <option value="👩🏼‍🔧" ${profile.emoji === '👩🏼‍🔧' ? 'selected' : ''}>👩🏼‍🔧 avatar 3</option>
                      <option value="👩🏾‍🔧" ${profile.emoji === '👩🏾‍🔧' ? 'selected' : ''}>👩🏾‍🔧 avatar 4</option>
                      <option value="👨🏿‍🔧" ${profile.emoji === '👨🏿‍🔧' ? 'selected' : ''}>👨🏿‍🔧 avatar 5</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-[8px] text-zinc-500 uppercase tracking-wider mb-1 block font-bold">Phone Direct</label>
                    <input class="w-full bg-black/40 border border-zinc-800/80 hover:border-zinc-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#4da6ff]/50 focus:ring-1 focus:ring-[#4da6ff]/20 transition-all duration-300" type="tel" id="editMechPhoneInput" value="${profile.phone || ''}"/>
                  </div>
                </div>

                <div>
                  <label class="text-[8px] text-zinc-500 uppercase tracking-wider mb-1 block font-bold">WhatsApp API</label>
                  <input class="w-full bg-black/40 border border-zinc-800/80 hover:border-zinc-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#4da6ff]/50 focus:ring-1 focus:ring-[#4da6ff]/20 transition-all duration-300" type="text" id="editMechWaInput" value="${profile.wa || ''}"/>
                </div>

                <div>
                  <label class="text-[8px] text-zinc-500 uppercase tracking-wider mb-1 block font-bold">Street Address</label>
                  <input class="w-full bg-black/40 border border-zinc-800/80 hover:border-zinc-700/60 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#4da6ff]/50 focus:ring-1 focus:ring-[#4da6ff]/20 transition-all duration-300" type="text" id="editMechAddrInput" value="${profile.address || ''}"/>
                </div>

                <button onclick="app.saveEditMechanicProfile()" class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold py-3 rounded-xl text-[9px] tracking-widest uppercase transition-all duration-300 shadow-[0_4px_15px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.3)]">SAVE CHANGES</button>
              </div>
            </div>
          </div>

          <!-- SCHEDULED APPOINTMENTS, EMERGENCY LEADS & PORTFOLIO -->
          <div class="col-span-2 flex flex-col gap-6">
            <!-- SCHEDULED BOOKINGS -->
            <div class="bg-gradient-to-b from-[#111115] to-[#0a0a0c] border border-white/[0.05] p-6 rounded-3xl shadow-xl h-fit">
              <h3 class="font-bebas text-2xl tracking-wider text-white mb-6">📅 SCHEDULED APPOINTMENTS</h3>
              <div class="flex flex-col gap-4">
                ${bookingsHTML}
              </div>
            </div>

            <!-- EMERGENCY REPAIR LEADS -->
            <div class="bg-gradient-to-b from-[#111115] to-[#0a0a0c] border border-white/[0.05] p-6 rounded-3xl shadow-xl h-fit">
              <h3 class="font-bebas text-2xl tracking-wider text-white mb-6">📡 REAL-TIME EMERGENCY REPAIR LEADS</h3>
              <div class="flex flex-col gap-4">
                ${leadsHTML}
              </div>
            </div>

            <!-- PORTFOLIO CREATOR (PREMIUM GLASS CARD OVERHAUL) -->
            <div class="bg-gradient-to-b from-[#111115] to-[#0a0a0c] border border-white/[0.05] p-6 rounded-3xl shadow-xl h-fit">
              <h3 class="font-bebas text-2xl tracking-wider text-white mb-6">📸 LOG COMPLETED REPAIR</h3>
              <div class="flex flex-col gap-4 font-mono">
                <div>
                  <label class="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5 block">💼 Repair Job Title</label>
                  <input class="w-full bg-black/40 border border-zinc-800/80 hover:border-zinc-700/60 text-white placeholder-zinc-600 px-4 py-3.5 rounded-xl text-[12px] outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300" type="text" id="portTitleInput" placeholder="e.g. Oxygen Sensor Swap & ECU Reset"/>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5 block">🚘 Vehicle Model</label>
                    <input class="w-full bg-black/40 border border-zinc-800/80 hover:border-zinc-700/60 text-white placeholder-zinc-600 px-4 py-3.5 rounded-xl text-[12px] outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300" type="text" id="portCarInput" placeholder="e.g. Ford Explorer 2017"/>
                  </div>
                  <div>
                    <label class="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5 block">💸 Cost Charged ($)</label>
                    <input class="w-full bg-black/40 border border-zinc-800/80 hover:border-zinc-700/60 text-white placeholder-zinc-600 px-4 py-3.5 rounded-xl text-[12px] outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300" type="number" id="portCostInput" placeholder="e.g. 140"/>
                  </div>
                </div>

                <div>
                  <label class="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5 block">📝 Repair Summary & Details</label>
                  <textarea id="portSummaryInput" class="w-full bg-black/40 border border-zinc-800/80 hover:border-zinc-700/60 text-white placeholder-zinc-600 px-4 py-3.5 rounded-xl text-[12px] outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300 h-24 resize-none" placeholder="Describe the diagnostic process, parts replaced, and customer results."></textarea>
                </div>

                <button onclick="app.addPortfolioLog()" class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold py-4 rounded-xl text-[10px] tracking-widest uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(16,185,129,0.15)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 active:translate-y-0">POST REPAIR LOG TO PORTFOLIO →</button>
              </div>
            </div>

            <!-- PORTFOLIO SHOWCASE TIMELINE -->
            <div class="bg-gradient-to-b from-[#111115] to-[#0a0a0c] border border-white/[0.05] p-6 rounded-3xl shadow-xl h-fit">
              <h3 class="font-bebas text-2xl tracking-wider text-white mb-6">🛠️ PORTFOLIO WORK HISTORY (${portfolio.length})</h3>
              <div class="flex flex-col gap-4">
                ${portfolioHTML}
              </div>
            </div>
          </div>
        </div>
      `;
    }
  },




  startLocationTracking: function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.userLat = lat;
          this.userLng = lng;
          
          let cityName = 'Your City';
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
            if (!res.ok) throw new Error(`HTTP status ${res.status}`);
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              throw new TypeError("Response is not JSON");
            }
            const data = await res.json();
            if (data && data.address) {
              cityName = data.address.city || data.address.town || data.address.suburb || data.address.state || 'Your City';
            }
          } catch (e) {
            console.warn("City reverse geocoding failed", e);
          }
          
          const txt = document.getElementById('gps-text');
          const ind = document.getElementById('gps-indicator');
          if(txt) txt.textContent = `SYS_GPS: SIGNAL SECURED (${cityName.toUpperCase()})`;
          if(ind) { ind.classList.remove('bg-emerald-500', 'bg-red-500'); ind.classList.add('bg-blue-500'); }
          
          this.activeCity = cityName;
          this.fetchRealMechanics(lat, lng, cityName);
        },
        (error) => {
          this.userLat = null;
          this.userLng = null;
          const txt = document.getElementById('gps-text');
          const ind = document.getElementById('gps-indicator');
          if(txt) { 
            txt.textContent = 'SYS_GPS: ACCESS DENIED'; 
            txt.classList.add('text-red-500');
          }
          if(ind) { 
            ind.classList.remove('bg-emerald-500', 'bg-blue-500'); 
            ind.classList.add('bg-red-500'); 
          }
        }
      );
    } else {
      const txt = document.getElementById('gps-text');
      const ind = document.getElementById('gps-indicator');
      if(txt) { 
        txt.textContent = 'SYS_GPS: UNAVAILABLE'; 
        txt.classList.add('text-red-500');
      }
      if(ind) { 
        ind.classList.remove('bg-emerald-500', 'bg-blue-500'); 
        ind.classList.add('bg-red-500'); 
      }
    }
  },

  // -----------------------------------------
  // AI DIAGNOSTICS LOGIC
  // -----------------------------------------
  setVt: function(btn, type) {
    document.querySelectorAll('.vtype-row .vt').forEach(b => {
      b.classList.remove('on');
      b.className = 'vt px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[#8e93a0] font-mono font-bold tracking-wider hover:bg-white/10';
    });
    btn.classList.add('on');
    btn.className = 'vt on px-6 py-3 bg-blue-600 border-none rounded-xl text-white font-mono font-bold tracking-wider';
    this.curVt = type;
  },

  runDiagnosis: async function() {
    const input = document.getElementById('diag-input');
    const results = document.getElementById('diag-results');
    if(!input || !input.value.trim()) return;
    
    const problemText = input.value.trim();
    
    await this.executeDiagnosisApiCall(problemText, results, input);
  },

  executeDiagnosisApiCall: async function(problemText, results, input) {
    results.innerHTML = '<div class="h-full flex flex-col items-center justify-center text-blue-500"><svg class="animate-spin h-10 w-10 mb-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span class="animate-pulse font-bold tracking-widest text-[12px] uppercase font-mono">Executing Neural Scan...</span></div>';
    try {
      // Auto-fetch vehicle data from Garage if available
      const savedVeh = this.vehicle || {};
      const overrides = JSON.parse(localStorage.getItem('vitalOverrides') || '{}') || {};
      let vitalsString = '';
      if (overrides && Object.keys(overrides).length > 0) {
        const formattedOverrides = Object.entries(overrides).map(([k, v]) => {
          const val = typeof v === 'object' ? v.val : v;
          return `${k}=${val}%`;
        });
        vitalsString = ' (Manual Vitals Override: ' + formattedOverrides.join(', ') + ')';
      }
      const vehContext = savedVeh.make ? `${savedVeh.year} ${savedVeh.make} ${savedVeh.model} (Mileage: ${savedVeh.mileage})${vitalsString}` : (this.curVt || 'Car');

      const scanData = await AIDiagnosis.diagnose(problemText, vehContext);
      
      this.diagnosisHistory.unshift({
        problem: problemText,
        title: scanData.summary.substring(0, 40),
        time: 'Just now',
        status: scanData.severity.toUpperCase(),
        result: scanData
      });
      if(this.diagnosisHistory.length > 10) this.diagnosisHistory.pop();
      localStorage.setItem('desktopDiagHistory', JSON.stringify(this.diagnosisHistory));

      // Synchronize with mobile key diagnosisHistory
      try {
        let mobileHist = JSON.parse(localStorage.getItem('diagnosisHistory')) || [];
        mobileHist.unshift({
          date: new Date().toLocaleDateString(),
          problem: problemText,
          summary: scanData.summary,
          cost: scanData.estimated_cost || 'N/A',
          result: scanData
        });
        if (mobileHist.length > 10) mobileHist.pop();
        localStorage.setItem('diagnosisHistory', JSON.stringify(mobileHist));
      } catch (e) {}
      
      this.renderReportCard(results, scanData);
      this.renderRecentScans();
      if(input) input.value = '';
    } catch (error) {
      results.innerHTML = `<div class="p-6 text-red-500 font-mono text-[12px] uppercase tracking-widest text-center border border-red-500/20 bg-red-500/5 rounded-xl">⚠️ SYSTEM ERROR:<br><br>${error.message}</div>`;
    }
  },

  renderReportCard: function(container, data) {
    let severityColor = 'text-emerald-500';
    let ringColor = 'stroke-emerald-500';
    let bgPulse = 'bg-emerald-500/20';
    let sevIcon = '✅';
    
    const sev = (data.severity || '').toUpperCase();
    if (sev.includes('MEDIUM') || sev.includes('WARN')) {
      severityColor = 'text-orange-500'; ringColor = 'stroke-orange-500'; bgPulse = 'bg-orange-500/20'; sevIcon = '⚠️';
    } else if (sev.includes('HIGH') || sev.includes('CRITICAL')) {
      severityColor = 'text-red-500'; ringColor = 'stroke-red-500'; bgPulse = 'bg-red-500/20'; sevIcon = '🚨';
    }

    const score = data.severity_score || 50;
    const ringDash = 251.2;
    const offset = ringDash - ((score / 100) * ringDash);

    const causesHtml = (data.likely_causes || []).map(c => `<li class="text-[13px] text-white/90 flex gap-2 leading-tight font-mono"><span class="text-white/20 mt-1 shrink-0">•</span> <span>${c}</span></li>`).join('');
    const actionsHtml = (data.immediate_actions || []).map(a => `<li class="text-[13px] text-white/90 flex gap-2 leading-tight font-mono"><span class="text-white/20 mt-1 shrink-0">•</span> <span>${a}</span></li>`).join('');

    let html = `
      <div class="flex flex-col gap-6 animate-fade-in pb-4">
        <!-- Header & Score -->
        <div class="flex gap-6 items-center">
          <div class="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full ${bgPulse} animate-pulse blur-xl opacity-50"></div>
            <svg class="w-24 h-24 transform -rotate-90 relative z-10" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" fill="none" class="text-white/10" />
              <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="8" fill="none" stroke-dasharray="251.2" stroke-dashoffset="${offset}" class="${ringColor} transition-all duration-1000 ease-out" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center z-20">
              <span class="text-2xl font-black ${severityColor}">${score}</span>
              <span class="text-[9px] text-[#8e93a0] tracking-widest uppercase font-mono">Score</span>
            </div>
          </div>
          <div class="flex-1">
            <h2 class="text-[16px] font-bold leading-snug mb-2 font-mono">${data.summary}</h2>
            <div class="inline-block px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider font-bold ${severityColor} font-mono">${sevIcon} ${sev} SEVERITY</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white/[0.02] border border-white/5 p-4 rounded-xl shadow-inner">
            <h3 class="text-[10px] text-[#8e93a0] uppercase tracking-wider font-bold mb-3 flex items-center gap-2 font-mono"><span class="text-orange-500">🔍</span> Likely Causes</h3>
            <ul class="flex flex-col gap-2.5">
              ${causesHtml}
            </ul>
          </div>
          <div class="bg-white/[0.02] border border-white/5 p-4 rounded-xl shadow-inner">
            <h3 class="text-[10px] text-[#8e93a0] uppercase tracking-wider font-bold mb-3 flex items-center gap-2 font-mono"><span class="text-blue-500">🛠️</span> Immediate Actions</h3>
            <ul class="flex flex-col gap-2.5">
              ${actionsHtml}
            </ul>
          </div>
        </div>

        <div class="bg-gradient-to-r from-[#141517] to-[#1c1c1e] border border-white/10 p-5 rounded-xl flex items-center justify-between shadow-xl mt-2">
            <div class="flex flex-col">
              <span class="text-[10px] text-[#8e93a0] uppercase tracking-wider font-bold mb-1 font-mono">Estimated Cost</span>
              <span class="text-[18px] font-bold text-white font-mono">${data.estimated_cost}</span>
            </div>
            <div class="w-px h-10 bg-white/10 mx-4"></div>
            <div class="flex flex-col text-right">
              <span class="text-[10px] text-[#8e93a0] uppercase tracking-wider font-bold mb-1 font-mono">Recommended Specialist</span>
              <span class="text-[15px] font-bold text-[#4da6ff] font-mono">${data.specialist_needed}</span>
            </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
    
    // Check if we need to show AI recommendation in Mechanics tab
    if (data.specialist_needed) {
      document.getElementById('aiRecommendationBanner').style.display = 'flex';
      document.getElementById('aiRecommendationText').textContent = data.specialist_needed + ' (Priority Sorted)';
      this.curSpec = data.specialist_needed;
      this.renderMechs(this.MECHS);
    }
  },

  renderRecentScans: function() {
    const histList = document.getElementById('historyList');

    // Merge desktop and mobile diagnosisHistory (mobile uses different schema)
    let allScans = [...this.diagnosisHistory];
    try {
      const mobileRaw = JSON.parse(localStorage.getItem('diagnosisHistory') || '[]');
      mobileRaw.forEach(entry => {
        // Mobile entries have: date, problem, summary, cost, result
        // Desktop entries have: problem, title, time, status, result
        if (entry && entry.problem && !allScans.find(s => s.problem === entry.problem && (s.time === entry.date || s.date === entry.date))) {
          allScans.push({
            problem: entry.problem,
            title: (entry.summary || entry.problem || '').substring(0, 40),
            time: entry.date || 'Synced',
            status: (entry.result && entry.result.severity ? entry.result.severity : 'MEDIUM').toUpperCase(),
            result: entry.result || {}
          });
        }
      });
    } catch(e) {}

    // Update in-memory history with merged result
    if (allScans.length > this.diagnosisHistory.length) {
      this.diagnosisHistory = allScans.slice(0, 10);
    }

    if (allScans.length === 0) {
      const emptyHtml = `
        <div class="flex flex-col items-center justify-center text-center p-10 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
          <div class="text-4xl mb-3 opacity-50">🩺</div>
          <div class="text-[13px] font-bold text-white font-mono uppercase tracking-wider mb-1">No Diagnostic Reports Yet</div>
          <div class="text-[11px] text-zinc-500 font-mono">Run an AI scan or manually write a report to build your vehicle history.</div>
        </div>
      `;
      if (histList) histList.innerHTML = emptyHtml;
      return;
    }

    let html = '';
    allScans.forEach(scan => {
      const status = (scan.status || 'MEDIUM').toUpperCase();
      let colorClass = 'text-orange-500 border-orange-500/20 bg-orange-500/10';
      if (status.includes('CRITICAL') || status.includes('HIGH')) colorClass = 'text-red-500 border-red-500/20 bg-red-500/10';
      if (status.includes('LOW') || status.includes('STABLE')) colorClass = 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
      
      const title = scan.title || scan.summary || scan.problem || 'Unknown Issue';
      const time = scan.time || scan.date || 'Recent';
      const vehicleLabel = this.vehicle && this.vehicle.make ? this.vehicle.make : 'Vehicle';
      
      const item = `
        <div class="flex justify-between items-center p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer shadow-lg mb-2">
          <div class="overflow-hidden pr-2">
            <div class="text-[13px] text-white font-semibold truncate font-mono">${title}</div>
            <div class="text-[10px] text-[#8e93a0] mt-1 truncate font-mono">${vehicleLabel} · ${time}</div>
          </div>
          <span class="px-3 py-1.5 ${colorClass} text-[10px] rounded uppercase font-bold tracking-wider shrink-0 font-mono">${status}</span>
        </div>
      `;
      html += item;
    });
    
    if (histList) histList.innerHTML = html;
},

  // -----------------------------------------
  // MECHANICS LOGIC
  // -----------------------------------------
  calculateDistance: function(lat1, lon1, lat2, lon2) {
    if (!this._distanceCache) this._distanceCache = {};
    const key = `${lat1.toFixed(4)},${lon1.toFixed(4)}_${lat2.toFixed(4)},${lon2.toFixed(4)}`;
    if (this._distanceCache[key] !== undefined) {
      return this._distanceCache[key];
    }
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    this._distanceCache[key] = dist;
    return dist;
  },

  fetchRealMechanics: async function(lat, lng, city) {
    if (!navigator.onLine) {
      console.warn("fetchRealMechanics: Device is offline.");
      this.isOfflineMode = true;
      this.filterMechs();
      return;
    }
    
    let realMechs = [];
    try {
      console.log("DESKTOP.JS: Calling fetchRealMechanics engine...");
      if (typeof window.fetchRealMechanics === 'function') {
        const result = await window.fetchRealMechanics(lat, lng, city);
        console.log("DESKTOP.JS: fetchRealMechanics returned:", result);
        
        // Robust array extraction
        if (Array.isArray(result) && result.length > 0) {
          realMechs = result;
        } else {
          realMechs = typeof window.getAllMechanics === 'function' ? window.getAllMechanics() : (typeof getAllMechanics === 'function' ? getAllMechanics() : []);
        }
        
        console.log("DESKTOP.JS: Data retrieved from engine:", realMechs);
        if (realMechs.length === 0) {
          alert("TomTom engine connected, but 0 mechanics were handed back to the UI! Check console.");
        }
      } else {
        alert("CRITICAL ERROR: The global engine (mechanics-data.js) is completely disconnected or missing!");
      }
      this.isOfflineMode = false;
    } catch (err) {
      console.error("Global search failed:", err);
      this.isOfflineMode = true;
    }

    let registeredMechs = [];
    try {
      const registry = JSON.parse(localStorage.getItem('at_mechanic_registry') || '[]');
      registeredMechs = registry.filter(m => m.city && m.city.toLowerCase() === city.toLowerCase() && m.verified && m.phone);
      registeredMechs.forEach(m => {
        m.isPlatformUser = true;
        m.isScanned = false;
        if (this.userLat && this.userLng && m.lat && m.lng) {
          const d = this.calculateDistance(this.userLat, this.userLng, m.lat, m.lng);
          m.distVal = d;
          m.distance = d.toFixed(1) + ' km';
        } else {
          m.distVal = 9999;
          m.distance = 'Unknown';
        }
      });
    } catch (e) {
      console.error("Registry load failed", e);
    }

    this.allMechanics = realMechs;
    this.MECHS = [...registeredMechs, ...realMechs];
    try {
      localStorage.setItem('autoTriage_desktop_mechanics', JSON.stringify(this.MECHS));
    } catch (e) {}
    this.filterMechs();
  },

  filterMechs: function() {
    console.log("DESKTOP.JS: Entering filterMechs. Total MECHS:", this.MECHS ? this.MECHS.length : 0);
    const q = document.getElementById('mechQ') ? document.getElementById('mechQ').value.toLowerCase() : '';
    
    // Calculate distances first
    if (this.userLat && this.userLng) {
      this.MECHS.forEach(m => {
        if(!m.distVal) {
          const d = this.calculateDistance(this.userLat, this.userLng, m.lat, m.lng);
          m.distVal = d;
          m.distance = d.toFixed(1) + ' km';
        }
      });
    }

    let filtered = this.MECHS.filter(m => {
      const safeName = m.name || '';
      const safeSpec = m.spec || '';
      const safeArea = m.area || '';
      
      const matchQ = safeName.toLowerCase().includes(q) || safeSpec.toLowerCase().includes(q) || safeArea.toLowerCase().includes(q);
      const matchS = (this.curSpec === 'All') || (safeSpec === this.curSpec);
      return matchQ && matchS;
    });
    console.log("DESKTOP.JS: After filtering:", filtered.length, "mechanics remaining.");

    // Sort by distVal
    filtered = filtered.sort((a,b) => {
      // Prioritize AI Match
      if(a.spec === this.curSpec && this.curSpec !== 'All' && b.spec !== this.curSpec) return -1;
      if(b.spec === this.curSpec && this.curSpec !== 'All' && a.spec !== this.curSpec) return 1;
      
      const dA = a.distVal || 999;
      const dB = b.distVal || 999;
      return dA - dB;
    });

    this.renderMechs(filtered);
  },

  filterSpec2: function(btn, spec) {
    document.querySelectorAll('.spec-row .sf').forEach(b => {
      b.classList.remove('on');
      b.className = 'sf px-5 py-2.5 bg-white/5 border border-white/10 text-white/60 font-mono text-[12px] font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) cursor-pointer whitespace-nowrap';
    });
    btn.classList.add('on');
    btn.className = 'sf on px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 border border-transparent text-white font-mono text-[12px] font-bold rounded-xl shadow-[0_0_20px_rgba(255,51,51,0.4)] transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) cursor-pointer whitespace-nowrap';
    this.curSpec = spec;
    this.filterMechs();
  },

  activeLocatorMode: 'scanner',

  switchLocatorMode: function(mode) {
    this.activeLocatorMode = mode;
    const scannerBtn = document.getElementById('toggleScannerBtn');
    const gmapsBtn = document.getElementById('toggleGmapsBtn');
    const scannerList = document.getElementById('mechList');
    const gmapsWrapper = document.getElementById('gmapsRadarWrapper');
    const searchInput = document.getElementById('mechQ');
    const aiBanner = document.getElementById('aiRecommendationBanner');

    if (mode === 'scanner') {
      if (scannerBtn) {
        scannerBtn.className = 'flex-1 bg-red-500 text-white border-none rounded-xl py-3 font-mono text-[11px] font-bold cursor-pointer transition-all duration-200 outline-none';
      }
      if (gmapsBtn) {
        gmapsBtn.className = 'flex-1 bg-transparent text-[#8e93a0] border-none rounded-xl py-3 font-mono text-[11px] font-bold cursor-pointer transition-all duration-200 outline-none';
      }
      if (gmapsWrapper) gmapsWrapper.classList.add('hidden');
      if (scannerList) scannerList.classList.remove('hidden');
      if (searchInput) searchInput.classList.remove('hidden');
      if (this.curSpec && this.curSpec !== 'All' && aiBanner) aiBanner.style.display = 'flex';
      this.filterMechs();
    } else {
      if (gmapsBtn) {
        gmapsBtn.className = 'flex-1 bg-red-500 text-white border-none rounded-xl py-3 font-mono text-[11px] font-bold cursor-pointer transition-all duration-200 outline-none';
      }
      if (scannerBtn) {
        scannerBtn.className = 'flex-1 bg-transparent text-[#8e93a0] border-none rounded-xl py-3 font-mono text-[11px] font-bold cursor-pointer transition-all duration-200 outline-none';
      }
      if (scannerList) scannerList.classList.add('hidden');
      if (gmapsWrapper) gmapsWrapper.classList.remove('hidden');
      if (searchInput) searchInput.classList.add('hidden');
      if (aiBanner) aiBanner.style.display = 'none';
      
      this.updateGoogleMapsRadar();
    }
  },

  updateGoogleMapsRadar: function() {
    const frame = document.getElementById('gmapsRadarFrame');
    if (!frame) return;

    // Detect active specialty pill
    let specialty = 'car repair';
    if (this.curSpec && this.curSpec !== 'All') {
      const specName = this.curSpec;
      if (specName.includes('AC')) specialty = 'car AC repair';
      else if (specName.includes('Brake')) specialty = 'brake repair';
      else if (specName.includes('Electric')) specialty = 'auto electrician';
      else if (specName.includes('Engine')) specialty = 'engine repair';
      else if (specName.includes('General')) specialty = 'car repair';
    }

    // Detect location
    let locationQuery = 'Lagos';
    if (this.userLat !== null && this.userLng !== null) {
      locationQuery = `${this.userLat},${this.userLng}`;
    } else if (this.activeCity && this.activeCity !== 'Detecting...') {
      locationQuery = this.activeCity;
    }

    const finalQuery = `${specialty} near ${locationQuery}`;
    frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(finalQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  },

  openMapTracker: function(name, lat, lng) {
    if (!lat || !lng) {
      alert("GPS tracking coordinates are missing for " + name);
      return;
    }
    // Launch Google Maps directly to their exact GPS coordinates
    window.open(`https://maps.google.com/maps?q=${lat},${lng}(${encodeURIComponent(name)})&z=16`, '_blank');
  },

  openChatWithMechanic: function(name) {
    const mech = this.MECHS.find(m => m.name === name);
    if (!mech) return;
    
    // First try WhatsApp
    if (mech.wa && mech.wa !== 'None' && mech.wa.length > 5) {
      window.open(`https://wa.me/${mech.wa.replace(/[^0-9]/g, '')}`, '_blank');
    } 
    // Fallback to standard phone call
    else if (mech.phone && mech.phone !== 'Unlisted - Walk-in' && mech.phone.length > 5) {
      window.location.href = `tel:${mech.phone.replace(/[^0-9+]/g, '')}`;
    } 
    // No contact info exists on the map
    else {
      alert("⚠️ " + name + " has not listed a public phone number on the map. Click 'TRACK' to drive to their physical location.");
    }
  },

  renderMechs: function(list) {
    const container = document.getElementById('mechList');
    if(!container) return;
    
    if (this.isOfflineMode && list.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-16 px-6 text-white/50 text-[13px] leading-relaxed flex flex-col items-center justify-center bg-white/2 border border-white/10 rounded-3xl backdrop-blur-xl">
          <div class="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div class="absolute inset-0 rounded-full border-4 border-red-500/15 animate-pulse"></div>
            <div class="text-4xl">📡</div>
          </div>
          <h3 class="font-mono text-xl font-bold text-white tracking-wide mb-2 uppercase">YOU ARE OFFLINE</h3>
          No cached mechanics found on this device.<br>
          <span class="text-[11px] text-white/30">Connect to the internet to scan for nearby mechanics.</span>
          <button onclick="app.fetchRealMechanics(app.userLat || 6.5244, app.userLng || 3.3792, app.activeCity || 'Lagos')" class="mt-6 bg-gradient-to-r from-red-500 to-red-600 text-white font-mono text-[11px] font-bold px-6 py-3 rounded-xl hover:from-red-400 hover:to-red-500 transition-all cursor-pointer">
            RETRY CONNECTION
          </button>
        </div>
      `;
      return;
    }
    
    if (list.length === 0) {
      console.log('No mechanics found near your location. Injecting Fallback UI Demo Data.');
      list = [
        {
          id: 'mock_1', name: 'Elite Neon Auto', spec: 'Engine Specialist', area: 'Downtown Sector',
          distance: '2.4 km', distVal: 2.4, phone: '555-0192', wa: '5550192', rating: '4.9', reviews: 128,
          verified: true, avail: 'open', emoji: '👨🏾‍🔧', yrs: 8, city: 'Local', lat: this.userLat || 0, lng: this.userLng || 0,
          isScanned: false, isPlatformUser: true
        },
        {
          id: 'mock_2', name: 'CyberGlass Brakes', spec: 'Brake Specialist', area: 'Uptown District',
          distance: '4.1 km', distVal: 4.1, phone: '555-0193', wa: '5550193', rating: '4.7', reviews: 56,
          verified: false, avail: 'busy', emoji: '👩🏾‍🔧', yrs: 4, city: 'Local', lat: this.userLat || 0, lng: this.userLng || 0,
          isScanned: true, isPlatformUser: false
        }
      ];
    }

    const cardsHtml = list.map(m => {
      const isSpecMatch = m.spec === this.curSpec && this.curSpec !== 'All';
      const specMatchBadge = isSpecMatch ? `
        <div class="absolute top-0 right-0 bg-gradient-to-l from-red-500/30 to-red-600/10 text-red-400 font-mono text-[9px] font-bold px-3 py-1.5 rounded-bl-xl tracking-widest border-b border-l border-red-500/20 shadow-[0_0_15px_rgba(255,51,51,0.1)] flex items-center gap-1 z-10">
          <span>⚡</span> AI MATCH
        </div>
      ` : '';
      
      let badgeText = '📍 NEARBY';
      let badgeStyle = 'background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6);';

      if (m.isPlatformUser) {
        badgeText = '🛡️ USER FROM MY APP';
        badgeStyle = 'background: rgba(0, 208, 132, 0.1); border-color: rgba(0, 208, 132, 0.2); color: #00d084; box-shadow: 0 0 10px rgba(0, 208, 132, 0.05);';
      } else if (m.isScanned) {
        badgeText = '📡 GPS SCANNED';
        badgeStyle = 'background: rgba(77, 166, 255, 0.1); border-color: rgba(77, 166, 255, 0.2); color: #4da6ff;';
      } else if (m.verified) {
        badgeText = '🛡️ VERIFIED PRO';
        badgeStyle = 'background: rgba(0, 208, 132, 0.1); border-color: rgba(0, 208, 132, 0.2); color: #00d084;';
      }

      const statusDotColor = m.avail === 'open' ? '#00d084' : '#ff8800';
      const statusTitle = m.avail === 'open' ? 'AVAILABLE' : 'BUSY';

      const hasPhone = (m.phone && m.phone !== 'Unlisted - Walk-in' && m.phone.length > 5) || (m.wa && m.wa !== 'None' && m.wa.length > 5);
      
      const noPhoneWarning = !hasPhone ? `
        <div class="mt-1.5 inline-flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.15)]">
          <div class="w-1 h-1 rounded-full bg-red-500 animate-pulse"></div>
          <span class="text-red-400 font-mono text-[8px] uppercase tracking-[0.2em] font-bold">Drive-In Only</span>
        </div>
      ` : '';

      const chatBtnHtml = hasPhone ? `
        <button class="flex-[1.2] h-8 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-mono text-[9px] font-bold tracking-[0.2em] flex items-center justify-center gap-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(16,185,129,0.2)]" onclick="event.stopPropagation(); app.openChatWithMechanic('${m.name.replace(/'/g,"\\'").replace(/"/g, '&quot;')}')">
          💬 CHAT
        </button>
      ` : `
        <button class="flex-[1.2] h-8 bg-white/5 text-white/20 border border-white/5 rounded-lg font-mono text-[9px] font-bold tracking-[0.2em] flex items-center justify-center gap-1.5 cursor-not-allowed" onclick="event.stopPropagation(); alert('This shop has no public phone number. Click TRACK to drive to their physical location.');">
          🚫 NO NUMBER
        </button>
      `;

      return `
        <div class="group relative rounded-3xl p-[1.5px] cursor-pointer overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:scale-[1.01]" onclick="app.openMechanicProfileDetail('${m.name.replace(/'/g,"\\'").replace(/"/g, '&quot;')}')">
          <!-- Animated Cyan/Blue Gradient Border -->
          <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/50 via-blue-500/40 to-indigo-500/50 group-hover:from-cyan-400 group-hover:via-blue-500 group-hover:to-indigo-500 transition-colors duration-700 opacity-100 blur-[3px] group-hover:blur-md shadow-[0_0_20px_rgba(6,182,212,0.3)]"></div>
          
          <!-- Card Glass Background -->
          <div class="relative h-full bg-[#0d0e12]/60 backdrop-blur-3xl rounded-3xl p-4 flex flex-col gap-3 shadow-2xl">
            
            ${specMatchBadge}

            <!-- Header Section -->
            <div class="flex justify-between items-start">
              <!-- Avatar -->
              <div class="relative">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-xl backdrop-blur-2xl group-hover:rotate-6 transition-transform duration-500">
                  ${m.emoji}
                </div>
                <div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0d0e12] shadow-lg" style="background: ${statusDotColor}; box-shadow: 0 0 10px ${statusDotColor};" title="${statusTitle}"></div>
              </div>
              
              <!-- Distance Badge -->
              <div class="flex flex-col items-end gap-1">
                <div class="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-full text-[9px] font-bold tracking-[0.2em] flex items-center gap-1 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  ${m.distance}
                </div>
                <div class="text-[7px] font-bold tracking-[0.2em] text-white/30 uppercase mt-0.5">
                  ${badgeText.replace('📍 ', '').replace('📡 ', '')}
                </div>
              </div>
            </div>

            <!-- Body Section -->
            <div class="flex-1 mt-1">
              <h3 class="text-[17px] font-extrabold text-white group-hover:text-cyan-400 transition-colors tracking-tight mb-0.5 truncate drop-shadow-sm">
                ${m.name}
              </h3>
              <div class="text-[10px] text-[#8e93a0] font-mono tracking-widest uppercase">${m.spec}</div>
              ${noPhoneWarning}
            </div>

            <!-- Bottom Section -->
            <div class="mt-2 flex flex-col gap-2">
              <!-- Stats Pill -->
              <div class="flex items-center justify-between text-[9px] font-mono text-white/50 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                ${m.isPlatformUser ? `
                <div class="flex items-center gap-2">
                  <span class="text-yellow-400 font-bold flex items-center gap-1 text-[10px] drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">★ ${m.rating}</span>
                  <span class="text-white/20">|</span>
                  <span class="text-white/80 tracking-widest">${m.reviews} REV</span>
                </div>
                ` : `
                <span class="tracking-[0.2em] flex items-center gap-1.5 opacity-60">NO REVIEWS YET</span>
                `}
              </div>
              
              <!-- Action Buttons -->
              <div class="flex gap-1.5">
                <button class="flex-1 h-8 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg font-mono text-[9px] font-bold tracking-[0.2em] flex items-center justify-center gap-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(59,130,246,0.2)]" onclick="event.stopPropagation(); app.openMapTracker('${m.name.replace(/'/g,"\\'")}', ${m.lat}, ${m.lng})">
                  📍 TRACK
                </button>
                ${chatBtnHtml}
                <button class="flex-1 h-8 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg font-mono text-[9px] font-bold tracking-[0.2em] flex items-center justify-center gap-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(255,255,255,0.1)]" onclick="event.stopPropagation(); app.openMechanicProfileDetail('${m.name.replace(/'/g,"\\'")}')">
                  PROFILE →
                </button>
              </div>
            </div>
            
          </div>
        </div>
      `;
    }).join('');

    if (this.isOfflineMode) {
      container.innerHTML = `
        <div class="col-span-full mb-4 p-4 bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/25 rounded-2xl flex items-center gap-3 animate-fadeInUp">
          <div class="text-xl">⚠️</div>
          <div class="flex-1 text-[11px]">
            <div class="font-mono font-bold text-yellow-500 uppercase tracking-wide">Working Offline</div>
            <div class="text-white/70 mt-0.5">Showing cached mechanics from your last active session.</div>
          </div>
        </div>
        ${cardsHtml}
      `;
    } else {
      container.innerHTML = cardsHtml;
    }
  },

  generateDynamicPortfolio: function(name, spec) {
    const nameLower = (name || '').toLowerCase();
    
    // AUTHENTIC REAL-WORLD PORTFOLIOS FOR HIGH-PROFILE SEED PARTNERS
    if (nameLower.includes('mandilas')) {
      return [
        { 
          title: 'Dual-VVT-i Camshaft Sprocket & Timing Chain Replacement', 
          car: 'Toyota Camry 2018 (2AR-FE)', 
          summary: `Diagnosed engine rattle on cold start. Replaced defective dual intelligent variable valve timing sprockets, installed new timing chain, guides, hydraulic tensioner, and front crankshaft oil seal. Verified oil pressure at 45 PSI at warm idle.` 
        },
        { 
          title: 'Complete Cylinder Head Gasket & Block Decarbonization', 
          car: 'Toyota Prado 2016 (2TR-FE)', 
          summary: `Traced compression leakage into the water jacket. Surface-milled cylinder head, installed OEM multi-layer steel head gasket, swapped valve stem seals, adjusted shim-less valve lifters, and performed pressure tests up to 20 Bar.` 
        },
        { 
          title: 'Automatic U760E Transmission Fluid Flush & Strainer Upgrade', 
          car: 'Toyota RAV4 2017', 
          summary: `Driver reported slight shift shudder between 2nd and 3rd gears. Flushed old fluid, dropped the transmission oil pan, cleaned dual magnets, fitted a new high-flow filter strainer, and filled with Toyota ATF WS fluid.` 
        }
      ];
    }
    
    if (nameLower.includes('fixit45')) {
      return [
        { 
          title: 'Computerized Engine Diagnostics & Evaporative Emissions (EVAP) Leak Isolation', 
          car: 'Honda Accord 2015', 
          summary: `Traced check engine light code P0456 (Evaporative Emission System very small leak). Performed nitrogen smoke test on the fuel vapor lines, isolated a hairline fracture in the canister purge valve hose, replaced assembly, and reset the ECU.` 
        },
        { 
          title: 'Four-Wheel Disc Rotor Resurfacing & Ceramic Pad Fitting', 
          car: 'Hyundai Elantra 2018', 
          summary: `Resolved severe brake pedal pulsation during high-speed deceleration. Mounted front and rear brake rotors on an on-car lathe, machined off 0.15mm thickness to eliminate runout, greased slides, and fitted low-dust ceramic pads.` 
        },
        { 
          title: 'Multi-Point Inspection, Synthetic Oil Flush & Engine Air Filters Service', 
          car: 'Ford Focus 2017', 
          summary: `Scheduled 90k-mile service. Drained motor oil, refilled with Mobil 1 5W-20 fully synthetic oil, replaced cabin micron filters, swapped engine induction filter, and checked steering linkage torque specs.` 
        }
      ];
    }
    
    if (nameLower.includes('autofast')) {
      return [
        { 
          title: 'Front Brake Caliper Slide Pins & Hydraulic DOT4 Line Bleeding', 
          car: 'Honda Civic 2016', 
          summary: `Resolved uneven brake pad wear and sticking front-left caliper. Rebuilt caliper guide pin brackets, greased pins with silicone lubricant, fitted new rubber boots, and pressure-bled system with fresh Bosch DOT4 fluid.` 
        },
        { 
          title: 'Premium Synthetic Oil Service, Cabin Filter Swap & Spark Plug Tune-up', 
          car: 'Toyota Corolla 2018', 
          summary: `Drained motor oil, installed OEM spin-on oil filter, refilled with synthetic 0W-20 oil, swapped cabin air filter, and fitted a new set of Denso iridium spark plugs.` 
        },
        { 
          title: 'Differential Fluid Service & Transfer Case Fluid Renewal', 
          car: 'Kia Sportage 2017 (AWD)', 
          summary: `Serviced AWD driveline. Drained rear differential and front transfer case gear oils, then refilled both with premium synthetic SAE 75W-90 gear lubricant to absolute factory fill levels.` 
        }
      ];
    }
    
    if (nameLower.includes('metropolitan')) {
      return [
        { 
          title: 'Complete Front Suspension Overhaul & Strut Damper Replacement', 
          car: 'Ford Explorer 2016', 
          summary: `Corrected front-end sag and heavy body roll over bumps. Installed new gas-charged twin-tube strut dampers, heavy-duty coil springs, sway bar link kits, and replaced lower control arms to restore original ride height.` 
        },
        { 
          title: 'Electronic Power Assisted Steering (EPAS) Gear Rack Calibration', 
          car: 'Ford Escape 2015', 
          summary: `Traced intermittent steering assist failures and torque sensor alignment codes. Installed a remanufactured EPAS rack assembly, routed fresh electrical power lines, and executed steering angle sensor zero-point calibration.` 
        },
        { 
          title: 'CV Axle Shaft Replacement & Polyurethane Bushing Press', 
          car: 'Ford Edge 2017', 
          summary: `Replaced clicking outer CV joint showing a completely torn rubber boot. Pressed out worn rubber control arm bushings, installed heavy-duty polyurethane bushings, and aligned toe to absolute zero.` 
        }
      ];
    }
    
    if (nameLower.includes('carparts')) {
      return [
        { 
          title: 'AC Compressor Replacement, System Evacuation & R134a Recharging', 
          car: 'Lexus RX350 2015', 
          summary: `Rebuilt system after total AC compressor internal shear lock. Flushed the evaporator core and condenser pipelines to clear micro-metallic debris, installed new compressor and drier bottle, and recharged 550g R134a.` 
        },
        { 
          title: 'Main Engine Wiring Harness Splice & Diode Bridge Re-wiring', 
          car: 'Nissan Altima 2014', 
          summary: `Resolved battery drain and instrument cluster flickering. Isolated a short circuit in the alternator battery line, rebuilt the main loom junction box, installed heat-shrink sleeves, and cleaned all ground connectors.` 
        },
        { 
          title: 'Electric Cooling Fan Relay & Dual Fan Shroud Overhaul', 
          car: 'Mercedes-Benz C250 2015', 
          summary: `Engine overheating in traffic. Diagnosed failed variable speed brushless cooling fan control module, swapped entire dual fan shroud assembly, installed new primary power fuse, and tested fan activation sequence.` 
        }
      ];
    }

    // DYNAMIC MATCHING FOR SCANNING / GEOLOCATED WORKSHOPS
    const specLower = (spec || '').toLowerCase();
    
    if (specLower.includes('engine') || specLower.includes('toyota') || specLower.includes('ford') || specLower.includes('diagnos')) {
      return [
        { 
          title: 'Complete Engine Cylinder Head Gasket Replacement', 
          car: 'Honda Accord 2016', 
          summary: `Diagnosed white exhaust smoke and coolant loss. Machined the warped cylinder head face, installed multi-layer steel head gasket, fitted new stretch bolts, and flushed the entire cooling system.` 
        },
        { 
          title: 'Timing Belt & Water Pump Preventive Maintenance Kit', 
          car: 'Lexus RX350 2014', 
          summary: `Replaced the cracked main engine timing belt, tensioner pulley, idler wheels, and the engine water pump. Re-timed dual camshafts to absolute factory specifications.` 
        },
        { 
          title: 'Computerized Engine Tune-up & Valve Cover Gaskets', 
          car: 'Toyota Corolla 2017', 
          summary: `Resolved cylinder 3 engine misfire. Fitted brand new Denso iridium spark plugs, replaced oil-soaked valve cover gasket, and cleaned the carbonized throttle body assembly.` 
        }
      ];
    } else if (specLower.includes('ac') || specLower.includes('electric') || specLower.includes('wire') || specLower.includes('electronics')) {
      return [
        { 
          title: 'Full AC Compressor Clutch Assembly Replacement', 
          car: 'Toyota RAV4 2015', 
          summary: `AC stopped blowing cold. Swapped failed electromagnetic compressor clutch and control valve, flushed the lines, performed vacuum test, and charged 450g R134a refrigerant.` 
        },
        { 
          title: 'Engine Wiring Harness Short Circuit Diagnosis', 
          car: 'Hyundai Tucson 2018', 
          summary: `Traced instrument cluster failure and dead ECU comms. Unwrapped the main bay wiring loom, isolated chafed copper lines near transmission housing, soldered, heat-shrunk, and re-secured.` 
        },
        { 
          title: 'Alternator Diode Bridge & Regulator Refurbishing', 
          car: 'Kia Cerato 2016', 
          summary: `Driver reported red battery warning lamp on dashboard. Installed high-output 120A internal diode plate, fitted new brush contacts and voltage regulator, restoring charge to 14.2V.` 
        }
      ];
    } else if (specLower.includes('brake') || specLower.includes('pad') || specLower.includes('disc') || specLower.includes('caliper')) {
      return [
        { 
          title: 'Front & Rear Ceramic Brake Pads Fitting', 
          car: 'Mercedes-Benz C300 2017', 
          summary: `Fitted premium ultra-low dust ceramic pads on front and rear axles. Grinded rotor lips, greased all caliper guide sliders with silicone grease, and reset electronic parking brake.` 
        },
        { 
          title: 'Hydraulic Brake Line Bleeding & DOT4 Fluid Flush', 
          car: 'Honda Civic 2018', 
          summary: `Driver reported spongy brake pedal feel. Flushed contaminated dark hydraulic fluid from master cylinder and bled all four caliper lines until pure golden DOT4 fluid resolved.` 
        },
        { 
          title: 'Rear Brake Caliper Piston & Seals Overhaul', 
          car: 'Toyota Camry 2015', 
          summary: `Diagnosed seized rear-left caliper locking the wheel. Disassembled caliper assembly, cleaned cylinder walls, installed new hydraulic inner piston and dust boot seals.` 
        }
      ];
    } else if (specLower.includes('suspension') || specLower.includes('strut') || specLower.includes('tyre') || specLower.includes('tire') || specLower.includes('wheel') || specLower.includes('wheels')) {
      return [
        { 
          title: 'Front Suspension Strut Assembly Upgrade', 
          car: 'Ford Explorer 2016', 
          summary: `Swapped failed oil-leaking strut dampers and bump stops. Installed brand-new heavy-duty sway bar links and control arms, eliminating clunking sounds over bumps.` 
        },
        { 
          title: 'Wheel Alignment, Tie Rods & Ball Joints Alignment', 
          car: 'Toyota Highlander 2014', 
          summary: `Corrected heavy steering pull to the left. Replaced loose outer tie rod ends and lower ball joints, then calibrated toe and camber alignment angles to 0.02 degrees.` 
        },
        { 
          title: 'Control Arm Bushings & CV Axle Boots Overhaul', 
          car: 'Lexus ES350 2015', 
          summary: `Swapped torn front-right drive axle CV boot showing grease splatters. Cleaned joint bearings, packed with molybdenum grease, fitted new boot clamps, and pressed new polyurethane bushings.` 
        }
      ];
    } else {
      // General Mechanic / Default
      return [
        { 
          title: 'Scheduled 100k-Mile Major Service & Diagnostics', 
          car: 'Toyota RAV4 2018', 
          summary: `Flushed automatic transmission fluid, replaced cabin and air filters, changed oil to 5W-30 synthetic, ran full computerized OBD diagnostics scanner with clear diagnostic logs.` 
        },
        { 
          title: 'Radiator Replacement & Coolant Loop Bleeding', 
          car: 'Hyundai Elantra 2019', 
          summary: `Replaced leaking aluminum radiator core showing structural cracks. Fitted new pressure cap, top/bottom radiator hoses, filled with premium ethylene-glycol, and bled air pockets.` 
        },
        { 
          title: 'Fuel Filter, Injectors Clean & Spark Plugs Swap', 
          car: 'Honda CR-V 2015', 
          summary: `Driver reported sluggish throttle acceleration. Installed fresh high-pressure inline fuel filter, ultrasonic-cleaned all four fuel injector nozzles, and fitted new spark plugs.` 
        }
      ];
    }
  },

  openMechanicProfileDetail: function(name) {
    const myProfile = JSON.parse(localStorage.getItem('myMechanicProfile'));
    let m = null;
    let portfolio = [];

    if (myProfile && myProfile.name === name) {
      m = {
        name: myProfile.name,
        spec: myProfile.spec,
        avail: myProfile.avail || 'open',
        emoji: myProfile.emoji || '👨🏾‍🔧',
        rating: '5.0',
        reviews: 0,
        phone: myProfile.phone,
        wa: myProfile.wa,
        verified: true,
        yrs: myProfile.exp || 5,
        area: myProfile.address || 'Local Workshop',
        city: myProfile.city,
        isPlatformUser: true,
        distance: '0.1 km',
        distVal: 0.1,
        lat: this.userLat || 51.5074,
        lng: this.userLng || -0.1278
      };
      portfolio = JSON.parse(localStorage.getItem('myPortfolioLogs')) || [];
    } else {
      m = this.MECHS.find(x => x.name === name);
      if (!m) return;
      portfolio = this.generateDynamicPortfolio(name, m.spec);
    }
    
    const modal = document.getElementById('mechDetailModal');
    const content = document.getElementById('mechDetailContent');
    if (!modal || !content) return;

    const activeColor = m.avail === 'open' ? '#00d084' : '#ff8800';
    const statusText = m.avail === 'open' ? 'AVAILABLE' : 'BUSY';

    content.innerHTML = `
      <!-- Top Cover Image -->
      <div style="position: relative; height: 160px; background: linear-gradient(135deg, #1e3a8a 0%, #111827 100%); border-bottom: 1px solid rgba(255,255,255,0.06);">
        <!-- Close button on top of cover -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px; position: absolute; top: 0; left: 0; right: 0; z-index: 10;">
          <button onclick="app.closeMechanicProfileDetail()" class="hover:bg-white/10 transition-colors" style="background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.15); color: var(--fg); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px;">✕</button>
          <div style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.15);">
            <span style="width:8px; height:8px; border-radius:50%; background:${activeColor}; display:inline-block; animation:pulse 1.5s infinite; box-shadow:0 0 10px ${activeColor};"></span>
            <span style="font-family:'Space Mono',monospace; font-size:10px; font-weight:bold; color:${activeColor}; letter-spacing:1px; text-transform:uppercase;">${statusText}</span>
          </div>
        </div>
        <!-- Suspended Avatar -->
        <div style="position: absolute; bottom: -40px; left: 50%; transform: translateX(-50%); width: 90px; height: 90px; border-radius: 24px; border: 4px solid #0f0f11; background: #1f2937; display:flex; align-items:center; justify-content:center; box-shadow: 0 12px 32px rgba(0,0,0,0.4); z-index: 5;">
          <span style="font-size:48px;">${m.emoji}</span>
        </div>
      </div>

      <!-- Scrollable Profile Body -->
      <div style="flex:1; overflow-y:auto; padding: 60px 24px 120px 24px; display:flex; flex-direction:column; gap:24px;">
        <!-- Header Specs -->
        <div style="text-align: center; margin-bottom: 8px;">
          ${(() => {
            let detailBadgeText = '🛡️ VERIFIED';
            let detailBadgeStyle = 'background: rgba(0, 208, 132, 0.1); border-color: rgba(0, 208, 132, 0.2); color: #00d084;';
            if (m.isPlatformUser) {
              detailBadgeText = '🛡️ USER FROM MY APP';
              detailBadgeStyle = 'background: rgba(0, 208, 132, 0.1); border-color: rgba(0, 208, 132, 0.2); color: #00d084; box-shadow: 0 0 10px rgba(0, 208, 132, 0.05);';
            } else if (m.isScanned) {
              detailBadgeText = '📡 GPS SCANNED';
              detailBadgeStyle = 'background: rgba(77, 166, 255, 0.1); border-color: rgba(77, 166, 255, 0.2); color: #4da6ff;';
            } else if (m.verified) {
              detailBadgeText = '🛡️ VERIFIED PRO';
              detailBadgeStyle = 'background: rgba(0, 208, 132, 0.1); border-color: rgba(0, 208, 132, 0.15); color: #00d084;';
            } else {
              detailBadgeText = '📍 NEARBY';
              detailBadgeStyle = 'background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6);';
            }
            return `<div style="${detailBadgeStyle} font-size: 10px; font-family: 'Space Mono', monospace; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; padding: 4px 14px; border-radius: 20px; display: inline-block; margin-bottom: 12px; border: 1px solid currentColor;">
              ${detailBadgeText}
            </div>`;
          })()}
          <h2 style="font-family: 'Space Mono', monospace; font-size: 24px; font-weight: bold; color: var(--fg); margin: 0 0 6px;">${m.name}</h2>
          <div style="font-size: 12px; color: #8e93a0; font-family: 'Space Mono', monospace; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
            ${m.spec}
          </div>
        </div>

        <!-- Stats Grid (Platform users only) -->
        ${m.isPlatformUser ? `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 16px;">
          <div style="text-align: center; border-right: 1px solid rgba(255,255,255,0.05);">
            <div style="font-size: 18px; font-weight: bold; color: #facc15; font-family: 'Space Mono', monospace;">★ ${m.rating}</div>
            <div style="font-size: 9px; color: #8e93a0; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">RATING</div>
          </div>
          <div style="text-align: center; border-right: 1px solid rgba(255,255,255,0.05);">
            <div style="font-size: 18px; font-weight: bold; color: white; font-family: 'Space Mono', monospace;">${m.reviews}</div>
            <div style="font-size: 9px; color: #8e93a0; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">REVIEWS</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; font-weight: bold; color: #60a5fa; font-family: 'Space Mono', monospace;">${m.yrs || 8} Yrs</div>
            <div style="font-size: 9px; color: #8e93a0; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">EXPERIENCE</div>
          </div>
        </div>` : `
        <div style="background: rgba(77,166,255,0.04); border: 1px solid rgba(77,166,255,0.1); border-radius: 20px; padding: 16px; text-align: center;">
          <div style="font-size: 10px; color: rgba(255,255,255,0.4); font-family: 'Space Mono', monospace; letter-spacing: 1.5px;">📡 GPS SCANNED MECHANIC</div>
          <div style="font-size: 9px; color: rgba(255,255,255,0.25); margin-top: 6px;">This profile was built from tracked location data. No ratings or reviews available yet.</div>
        </div>`}

        <!-- Address Card -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 20px;">
          <div style="font-size:10px; color:#60a5fa; font-family:'Space Mono',monospace; font-weight:bold; letter-spacing:1px; margin-bottom:8px; text-transform:uppercase;">📍 Workshop Location</div>
          <div style="font-family:'Space Mono',monospace; font-size:14px; font-weight:bold; color:var(--fg); margin-bottom:16px; line-height:1.4; display:flex; flex-direction:column; gap:8px;">
            <span>${m.area || (m.address ? m.address : 'Nearby Service Area')}</span>
            <span style="width:fit-content; background:rgba(77,166,255,0.1); color:#60a5fa; font-family:'Space Mono',monospace; font-weight:bold; font-size:10px; padding:4px 10px; border-radius:8px; border:1px solid rgba(77,166,255,0.15);">📍 ${m.distance || (m.distVal ? m.distVal.toFixed(1) + ' km' : '1.2 km')} AWAY</span>
          </div>
          
          <div style="display:flex; flex-direction: column; gap:10px;">
            <div style="display:flex; gap:10px;">
              <a href="tel:${m.phone}" class="hover:bg-white/10 transition-colors" style="flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; text-decoration:none; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-family:'Space Mono',monospace; font-size:11px; font-weight:bold;">📞 CALL</a>
              <button onclick="window.open('https://wa.me/${m.wa}','_blank')" class="hover:bg-emerald-500/20 transition-colors" style="flex:1; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#10b981; height:44px; border-radius:12px; font-family:'Space Mono',monospace; font-size:11px; font-weight:bold;">💬 WHATSAPP</button>
            </div>
            <button onclick="app.openChatWithMechanic('${m.name.replace(/'/g,"'")}')" class="hover:bg-blue-500/20 transition-colors" style="width:100%; background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; height:44px; border-radius:12px; font-family:'Space Mono',monospace; font-size:11px; font-weight:bold;">💬 LIVE IN-APP CHAT</button>
          </div>
        </div>

        <!-- Featured Portfolio (Platform users only) -->
        ${m.isPlatformUser ? `
        <div>
          <div style="font-size:10px; color:#8e93a0; font-family:'Space Mono',monospace; font-weight:bold; letter-spacing:1px; margin-bottom:16px;">🛠️ PRO WORKPORTFOLIO</div>
          <div style="display:flex; flex-direction:column; gap:16px; border-left: 2px dashed rgba(255,255,255,0.1); padding-left: 16px; margin-left: 8px;">
            ${portfolio.map((p, pIdx) => `
              <div style="position: relative; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 16px; animation: fadeInUp 0.4s ease ${pIdx * 0.1}s both;">
                <span style="position: absolute; left: -24px; top: 20px; width: 12px; height: 12px; border-radius: 50%; background: #00d084; border: 3px solid #0f0f11;"></span>
                <h3 style="font-family:'Space Mono',monospace; font-size:14px; font-weight:bold; color:white; margin:0 0 6px;">${p.title}</h3>
                <div style="font-family:'Space Mono',monospace; font-size:10px; color:#60a5fa; font-weight:bold; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
                  <span>🚘 ${p.car.toUpperCase()}</span>
                </div>
                <p style="font-size:12px; color:#8e93a0; line-height:1.6; margin:0; font-family:'Space Mono',monospace;">${p.summary}</p>
              </div>
            `).join('')}
          </div>
        </div>` : `
        <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.04); border-radius: 20px;">
          <div style="font-size: 24px; margin-bottom: 10px;">📡</div>
          <div style="font-size: 10px; color: rgba(255,255,255,0.3); font-family: 'Space Mono', monospace; letter-spacing: 1px;">TRACKED DATA ONLY</div>
          <div style="font-size: 9px; color: rgba(255,255,255,0.2); margin-top: 6px; line-height: 1.6;">This mechanic was found via GPS scan. Only their name, location, and phone number are available.</div>
        </div>`}
      </div>

      <!-- Sticky Bottom Action (Platform users get booking, scanned get call) -->
      ${m.isPlatformUser ? `
      <div style="position:absolute; bottom:0; left:0; right:0; padding:24px; background:linear-gradient(0deg, #0f0f11 80%, transparent 100%); border-top: 1px solid rgba(255,255,255,0.05);">
        <button onclick="app.openBookingFormModal('${m.name.replace(/'/g,"'")}', '${m.phone}', '${m.wa}')" class="hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]" style="width:100%; background:var(--fg); border:none; color:var(--bg); padding:16px; border-radius:14px; font-family:'Space Mono',monospace; font-size:12px; font-weight:bold; letter-spacing:1px;">
          ⚡ SECURE APPOINTMENT BOOKING
        </button>
      </div>` : `
      <div style="position:absolute; bottom:0; left:0; right:0; padding:24px; background:linear-gradient(0deg, #0f0f11 80%, transparent 100%); border-top: 1px solid rgba(255,255,255,0.05);">
        <a href="tel:${m.phone}" class="hover:bg-gray-200 transition-colors" style="display:block; width:100%; background:var(--fg); border:none; color:var(--bg); padding:16px; border-radius:14px; font-family:'Space Mono',monospace; font-size:12px; font-weight:bold; letter-spacing:1px; text-align:center; text-decoration:none;">
          📞 CALL THIS MECHANIC
        </a>
      </div>`}
    `;

    modal.style.display = 'flex';
    setTimeout(() => { content.style.transform = 'translateX(0)'; }, 10);
  },

  closeMechanicProfileDetail: function() {
    const modal = document.getElementById('mechDetailModal');
    const content = document.getElementById('mechDetailContent');
    if (!modal || !content) return;
    content.style.transform = 'translateX(100%)';
    setTimeout(() => { modal.style.display = 'none'; }, 400);
  },

  // -----------------------------------------
  // APPOINTMENT BOOKING LOGIC
  // -----------------------------------------
  openBookingFormModal: function(name, phone, wa) {
    const modal = document.getElementById('bookingFormModal');
    const content = document.getElementById('bookingFormContent');
    if (!modal || !content) return;

    const vehicleName = this.vehicle.make ? `${this.vehicle.year} ${this.vehicle.make} ${this.vehicle.model}`.trim() : '';
    let latestDiag = '';
    if (this.diagnosisHistory && this.diagnosisHistory.length > 0) {
      const latest = this.diagnosisHistory[0];
      latestDiag = `${latest.problem || ''} (AI Diagnosis: ${latest.result?.summary || ''})`;
    }

    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split('T')[0];

    const savedUser = localStorage.getItem('autotriage_user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    const clientNameVal = user ? user.name : 'Driver Account';
    const clientEmailVal = user ? user.email : 'driver@autotriage.io';

    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
        <button onclick="app.closeBookingFormModal()" class="hover:bg-white/10 transition-colors" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; width:36px; height:36px; border-radius:50%; font-size:14px; display:flex; justify-content:center; align-items:center;">✕</button>
        <div style="font-family:'Space Mono',monospace; font-size:11px; font-weight:bold; color:#60a5fa; letter-spacing:1px;">SECURE BOOKING</div>
      </div>
      <div style="margin-bottom:24px;">
        <div style="font-size:11px; color:#facc15; letter-spacing:2px; font-weight:bold; margin-bottom:6px; font-family:'Space Mono',monospace;">🛠️ SCHEDULE REPAIR</div>
        <h2 style="font-size:22px; font-weight:bold; color:white; margin:0; font-family:'Space Mono',monospace;">Book with ${name}</h2>
      </div>

      <div style="display:flex; flex-direction:column; gap:16px; flex:1; font-family:'Space Mono',monospace;">
        <div>
          <label style="font-size:10px; color:#8e93a0; font-weight:bold; letter-spacing:1px; margin-bottom:6px; display:block;">Your Full Name</label>
          <input type="text" id="bkClientName" placeholder="e.g. John Doe" value="${clientNameVal}" class="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-blue-500/50"/>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div>
            <label style="font-size:10px; color:#8e93a0; font-weight:bold; letter-spacing:1px; margin-bottom:6px; display:block;">Your Email Address</label>
            <input type="email" id="bkClientEmail" placeholder="name@email.com" value="${clientEmailVal}" class="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-blue-500/50"/>
          </div>
          <div>
            <label style="font-size:10px; color:#8e93a0; font-weight:bold; letter-spacing:1px; margin-bottom:6px; display:block;">Your Phone Number</label>
            <input type="tel" id="bkClientPhone" placeholder="e.g. +1234567890" value="+2348033221100" class="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-blue-500/50"/>
          </div>
        </div>
        <div>
          <label style="font-size:10px; color:#8e93a0; font-weight:bold; letter-spacing:1px; margin-bottom:6px; display:block;">Your Geolocation Address</label>
          <input type="text" id="bkClientAddress" placeholder="e.g. Yaba, Lagos" value="${this.activeCity || 'Yaba, Lagos'}" class="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-blue-500/50"/>
        </div>
        <div>
          <label style="font-size:10px; color:#8e93a0; font-weight:bold; letter-spacing:1px; margin-bottom:6px; display:block;">Vehicle Specifications</label>
          <input type="text" id="bkVehicle" placeholder="e.g. 2018 Lexus RX350" value="${vehicleName}" class="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-blue-500/50"/>
        </div>
        <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:12px;">
          <div>
            <label style="font-size:10px; color:#8e93a0; font-weight:bold; letter-spacing:1px; margin-bottom:6px; display:block;">Appointment Date</label>
            <input type="date" id="bkDate" value="${formattedDate}" class="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-blue-500/50"/>
          </div>
          <div>
            <label style="font-size:10px; color:#8e93a0; font-weight:bold; letter-spacing:1px; margin-bottom:6px; display:block;">Time Slot</label>
            <input type="time" id="bkTime" value="10:00" class="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-blue-500/50"/>
          </div>
        </div>
        <div>
          <label style="font-size:10px; color:#8e93a0; font-weight:bold; letter-spacing:1px; margin-bottom:6px; display:block;">Urgency Level</label>
          <select id="bkUrgency" class="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-blue-500/50">
            <option value="standard">Standard Maintenance</option>
            <option value="high">High priority (Failing part)</option>
            <option value="critical">Critical / Emergency (Breakdown)</option>
          </select>
        </div>
        <div>
          <label style="font-size:10px; color:#8e93a0; font-weight:bold; letter-spacing:1px; margin-bottom:6px; display:block;">Diagnostic / Issue Details</label>
          <textarea id="bkIssue" placeholder="Describe symptoms or copy-paste AI diagnosis report here..." class="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-blue-500/50 h-24 resize-none">${latestDiag}</textarea>
        </div>
        <button onclick="app.submitAppointmentBooking('${name.replace(/'/g,"'")}', '${phone}', '${wa}')" class="hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(59,130,246,0.3)] mt-2" style="width:100%; background:linear-gradient(90deg, #2563eb, #3b82f6); border:none; color:white; padding:16px; border-radius:14px; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">
          CONFIRM & TRANSMIT APPOINTMENT →
        </button>
      </div>
    `;

    modal.style.display = 'flex';
    setTimeout(() => { content.style.transform = 'translateX(0)'; }, 10);
  },

  closeBookingFormModal: function() {
    const modal = document.getElementById('bookingFormModal');
    const content = document.getElementById('bookingFormContent');
    if (!modal || !content) return;
    content.style.transform = 'translateX(100%)';
    setTimeout(() => { modal.style.display = 'none'; }, 400);
  },

  submitAppointmentBooking: function(mechName, mechPhone, mechWa) {
    const clientName = document.getElementById('bkClientName')?.value.trim();
    const clientPhone = document.getElementById('bkClientPhone')?.value.trim();
    const clientEmail = document.getElementById('bkClientEmail')?.value.trim();
    const clientAddress = document.getElementById('bkClientAddress')?.value.trim();
    const vehicle = document.getElementById('bkVehicle')?.value.trim();
    const date = document.getElementById('bkDate')?.value;
    const time = document.getElementById('bkTime')?.value;
    const urgency = document.getElementById('bkUrgency')?.value;
    const issue = document.getElementById('bkIssue')?.value.trim();

    if (!clientName || !clientPhone || !clientEmail || !clientAddress || !vehicle || !date || !time || !issue) {
      alert('Please complete all fields before confirming booking request!');
      return;
    }

    const overlay = document.getElementById('bookingTransmittingOverlay');
    const log1 = document.getElementById('txLog1');
    const log2 = document.getElementById('txLog2');
    const log3 = document.getElementById('txLog3');
    const log4 = document.getElementById('txLog4');
    const success = document.getElementById('txSuccessMessage');

    if (overlay) {
      overlay.style.display = 'flex';
      
      setTimeout(() => { if (log1) { log1.innerHTML = '🟢 [OK] Vehicle diagnostic profile packaged!'; log1.style.color = '#00d084'; } }, 600);
      setTimeout(() => { if (log2) { log2.innerHTML = '🟢 [OK] In-App Mechanic Center notice broadcasted!'; log2.style.color = '#00d084'; } }, 1200);
      setTimeout(() => { if (log3) { log3.innerHTML = '🟢 [OK] SMTP secure email payload prepared!'; log3.style.color = '#00d084'; } }, 1800);
      setTimeout(() => { 
        if (log4) { log4.innerHTML = '🟢 [OK] Cellular SMS routing tunnel established!'; log4.style.color = '#00d084'; }
        if (success) success.style.display = 'block';
      }, 2400);

      setTimeout(() => {
        overlay.style.display = 'none';
        this.closeBookingFormModal();
        this.closeMechanicProfileDetail();
        
        if (log1) { log1.innerHTML = '&bull; Packaging vehicle profile...'; log1.style.color = '#666'; }
        if (log2) { log2.innerHTML = '&bull; Deploying active in-app notice...'; log2.style.color = '#666'; }
        if (log3) { log3.innerHTML = '&bull; Routing secure email dispatch...'; log3.style.color = '#666'; }
        if (log4) { log4.innerHTML = '&bull; Handshaking carrier network for SMS...'; log4.style.color = '#666'; }
        if (success) success.style.display = 'none';

        // Prepare the lead payload to push to myInboundLeads
        const latestDiag = (this.diagnosisHistory && this.diagnosisHistory.length > 0)
          ? `${this.diagnosisHistory[0].problem || ''} (AI Diagnosis: ${this.diagnosisHistory[0].result?.summary || ''})`
          : 'General vehicle system diagnostic request';

        const cost = urgency === 'critical' ? '$180 - $260' : '$90 - $130';
        
        // Find mechanic coordinates to calculate distance
        const mech = this.MECHS.find(m => m.name === mechName) || { lat: 51.51, lng: -0.11 };
        let distanceStr = '0.8 km';
        if (this.userLat && this.userLng && mech.lat && mech.lng) {
          const distVal = this.calculateDistance(this.userLat, this.userLng, mech.lat, mech.lng);
          distanceStr = distVal.toFixed(1) + ' km';
        }

        const newLead = {
          id: Date.now(),
          car: vehicle,
          issue: issue,
          diagnosis: latestDiag,
          distance: distanceStr,
          time: 'Just now',
          cost: cost,
          clientName: clientName,
          clientPhone: clientPhone,
          clientEmail: clientEmail,
          clientAddress: clientAddress,
          clientLat: this.userLat || 51.5074,
          clientLng: this.userLng || -0.1278,
          urgency: urgency,
          date: date,
          timeSlot: time,
          targetMechName: mechName,
          status: 'pending'
        };

        // Append to myInboundLeads in localStorage
        let currentLeads = [];
        try {
          currentLeads = JSON.parse(localStorage.getItem('myInboundLeads') || '[]');
        } catch(e) {}
        currentLeads.unshift(newLead);
        localStorage.setItem('myInboundLeads', JSON.stringify(currentLeads));

        const emailSubject = `AutoTriage: NEW Repair Appointment Booking Request from ${clientName}`;
        const emailBody = `AUTOTRIAGE VERIFIED CAR MARKETPLACE\n` +
                          `-----------------------------------------\n` +
                          `Hello ${mechName},\n\n` +
                          `You have received a new premium vehicle booking request through AutoTriage.\n\n` +
                          `APPOINTMENT DETAILS:\n` +
                          `- Client Name: ${clientName}\n` +
                          `- Client Phone: ${clientPhone}\n` +
                          `- Client Email: ${clientEmail}\n` +
                          `- Client Address: ${clientAddress}\n` +
                          `- Vehicle: ${vehicle}\n` +
                          `- Proposed Date: ${date}\n` +
                          `- Proposed Time Slot: ${time}\n` +
                          `- Urgency Level: ${urgency.toUpperCase()}\n` +
                          `- Diagnosis / Issue Details:\n  "${issue}"\n\n` +
                          `ACTION REQUIRED:\n` +
                          `Please log in to your AutoTriage Mechanic Workspace to ACCEPT or DECLINE this appointment request.\n\n` +
                          `Kind regards,\n` +
                          `AutoTriage Dispatch Bot`;

        const mechObj = this.MECHS.find(m => m.name === mechName) || {};
        const targetEmail = mechObj.email || 'bookings@autotriage.pro';

        // Asynchronously call SendGrid SMTP endpoint!
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetEmail,
            subject: emailSubject,
            textContent: emailBody
          })
        })
        .then(r => r.json())
        .then(data => {
          console.log('[AutoTriage SMTP Dispatcher Response]:', data);
        })
        .catch(e => console.error('SMTP Dispatch API error:', e));

        // Asynchronously call Twilio SMS endpoint!
        const smsText = `AutoTriage Breakdown Alert! Emergency lead from ${clientName} (${vehicle}) at ${clientAddress}. View dashboard: https://autotriage.pro/app`;
        fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: mechPhone || '+2348002886874',
            message: smsText
          })
        })
        .then(r => r.json())
        .then(data => {
          console.log('[AutoTriage SMS Carrier Response]:', data);
        })
        .catch(e => console.error('Twilio SMS API error:', e));

        // Keep local fallback mailto trigger active as fallback
        const mailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.open(mailtoUrl, '_blank');
        alert('🎉 Appointment Transmitted!\n\nAutoTriage has launched cellular SMS and secure SMTP email routing packages directly to the mechanic!');

        // Dynamic coordinate resolution and auto-launch tracking
        const trackingMode = (urgency === 'critical') ? 'to_user' : 'to_mechanic';
        
        setTimeout(() => {
          this.openMapTracker(mechName, mech.lat, mech.lng, trackingMode);
        }, 800);
      }, 3800);
    }
  },

  // -----------------------------------------
  // LIVE CHAT LOGIC
  // -----------------------------------------
  currentChatMechName: '',
  
  openChatWithMechanic: function(name) {
    this.currentChatMechName = name;
    document.getElementById('chatTargetName').innerText = name;
    
    const shareBanner = document.getElementById('chatAiShareBanner');
    if (shareBanner) {
      if (this.diagnosisHistory && this.diagnosisHistory.length > 0) {
        shareBanner.style.display = 'flex';
      } else {
        shareBanner.style.display = 'none';
      }
    }

    this.renderChatMessages();

    const modal = document.getElementById('chatDrawerModal');
    const content = document.getElementById('chatDrawerContent');
    if (!modal || !content) return;
    
    modal.style.display = 'flex';
    setTimeout(() => { content.style.transform = 'translateX(0)'; }, 10);
    setTimeout(() => { document.getElementById('chatMessageInput')?.focus(); }, 300);
  },

  closeChatDrawer: function() {
    const modal = document.getElementById('chatDrawerModal');
    const content = document.getElementById('chatDrawerContent');
    if (!modal || !content) return;
    content.style.transform = 'translateX(100%)';
    setTimeout(() => { modal.style.display = 'none'; }, 400);
  },

  _getChatIndexMap: function() {
    if (this._chatIndexMap) return this._chatIndexMap;
    const messages = JSON.parse(localStorage.getItem('desktopChatMessages') || '[]');
    this._chatIndexMap = {};
    messages.forEach(msg => {
      if (!this._chatIndexMap[msg.mechName]) {
        this._chatIndexMap[msg.mechName] = [];
      }
      this._chatIndexMap[msg.mechName].push(msg);
    });
    return this._chatIndexMap;
  },

  sendChatMessage: function() {
    const input = document.getElementById('chatMessageInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const messages = JSON.parse(localStorage.getItem('desktopChatMessages') || '[]');
    const newMsg = {
      id: Date.now(),
      from: 'driver',
      mechName: this.currentChatMechName,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    messages.push(newMsg);
    localStorage.setItem('desktopChatMessages', JSON.stringify(messages));
    
    // Update in-memory identity index cache
    if (!this._chatIndexMap) this._getChatIndexMap();
    if (!this._chatIndexMap[this.currentChatMechName]) this._chatIndexMap[this.currentChatMechName] = [];
    this._chatIndexMap[this.currentChatMechName].push(newMsg);
    
    input.value = '';
    this.renderChatMessages();

    // Simulate reply
    setTimeout(() => { this.simulateMechanicReply(this.currentChatMechName); }, 2000);
  },

  simulateMechanicReply: function(mechName) {
    const messages = JSON.parse(localStorage.getItem('desktopChatMessages') || '[]');
    const replies = [
      "Thank you for the details! Yes, I am absolutely free to check this for you. Please confirm a slot in the booking drawer!",
      "Ah, I see the diagnostics details. That indicates a cylinder issue. I can fit you in this afternoon if you want to bring the vehicle down.",
      "Hello! That is definitely something we can look at immediately. We have the scanning equipment ready.",
      "Sure thing! Drop by our workshop anytime within the next hour or confirm your booking to reserve the bay."
    ];
    const newReply = {
      id: Date.now(),
      from: 'mechanic',
      mechName: mechName,
      text: replies[Math.floor(Math.random() * replies.length)],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    messages.push(newReply);
    localStorage.setItem('desktopChatMessages', JSON.stringify(messages));

    // Update in-memory identity index cache
    if (!this._chatIndexMap) this._getChatIndexMap();
    if (!this._chatIndexMap[mechName]) this._chatIndexMap[mechName] = [];
    this._chatIndexMap[mechName].push(newReply);

    const modal = document.getElementById('chatDrawerModal');
    if (modal && modal.style.display === 'flex' && this.currentChatMechName === mechName) {
      this.renderChatMessages();
    }
  },

  shareAiDiagnosisToChat: function() {
    if (!this.diagnosisHistory || this.diagnosisHistory.length === 0) return;
    const latest = this.diagnosisHistory[0];
    const reportText = `🚨 *SHARED AI DIAGNOSIS REPORT* \n🚘 Vehicle: ${this.vehicle.make || 'Standard'}\n🛠️ Symptoms: ${latest.problem}\n🧠 AI Analysis: ${latest.result?.summary || 'Requires physical scan'}\n💰 Repair Range: ${latest.result?.estimated_cost || 'N/A'}`;
    
    const messages = JSON.parse(localStorage.getItem('desktopChatMessages') || '[]');
    const newMsg = {
      id: Date.now(),
      from: 'driver',
      mechName: this.currentChatMechName,
      text: reportText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    messages.push(newMsg);
    localStorage.setItem('desktopChatMessages', JSON.stringify(messages));

    // Update in-memory identity index cache
    if (!this._chatIndexMap) this._getChatIndexMap();
    if (!this._chatIndexMap[this.currentChatMechName]) this._chatIndexMap[this.currentChatMechName] = [];
    this._chatIndexMap[this.currentChatMechName].push(newMsg);

    const shareBanner = document.getElementById('chatAiShareBanner');
    if (shareBanner) shareBanner.style.display = 'none';

    this.renderChatMessages();
    setTimeout(() => { this.simulateMechanicReply(this.currentChatMechName); }, 2000);
  },

  renderChatMessages: function() {
    const stream = document.getElementById('chatMessageStream');
    if (!stream) return;

    const indexMap = this._getChatIndexMap();
    const myMessages = indexMap[this.currentChatMechName] || [];

    if (myMessages.length === 0) {
      stream.innerHTML = `
        <div style="text-align:center; padding:48px 24px; color:#8e93a0;">
          <div style="font-size:32px; margin-bottom:12px;">💬</div>
          <div style="font-size:12px; line-height:1.5; font-family:'Space Mono',monospace;">No messages yet. Send a message to start live chat!</div>
        </div>
      `;
      return;
    }

    stream.innerHTML = myMessages.map(msg => {
      const isSentByMe = msg.from === 'driver';
      const align = isSentByMe ? 'self-end' : 'self-start';
      const isReport = msg.text.includes('SHARED AI DIAGNOSIS REPORT');
      
      let bubbleHtml = '';
      if (isReport) {
        // Parse fields
        const vehicleMatch = msg.text.match(/🚘 Vehicle:\s*(.*)/i);
        const symptomsMatch = msg.text.match(/🛠️ Symptoms:\s*(.*)/i);
        const analysisMatch = msg.text.match(/🧠 AI Analysis:\s*(.*)/i);
        const costMatch = msg.text.match(/💰 Repair Range:\s*(.*)/i);

        const vehicle = vehicleMatch ? vehicleMatch[1].trim() : 'Unknown';
        const symptoms = symptomsMatch ? symptomsMatch[1].trim() : 'Not Specified';
        const analysis = analysisMatch ? analysisMatch[1].trim() : 'Incomplete';
        const cost = costMatch ? costMatch[1].trim() : 'N/A';

        bubbleHtml = `
          <div class="px-4 py-3 rounded-2xl rounded-tr-sm shadow-xl border border-amber-500/30 flex flex-col gap-3 max-w-full" style="background: rgba(20, 20, 25, 0.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: 0 8px 32px 0 rgba(245, 158, 11, 0.15); text-align: left;">
            <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(245, 158, 11, 0.2); padding-bottom:6px; margin-bottom:2px; gap:8px;">
              <span style="font-size: 10px; font-weight: bold; color: #ff8800; tracking-wider: 1px; font-family: 'Space Mono', monospace;">🧠 TELEMETRY REPORT</span>
              <span style="font-size: 8px; font-weight: bold; background: rgba(245, 158, 11, 0.2); color: #ff9f0a; padding: 2px 6px; border-radius: 20px; font-family: 'Space Mono', monospace; text-transform: uppercase;">AI VERIFIED</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px; font-family: 'Space Mono', monospace; font-size:11px;">
              <div style="display:flex; flex-direction:column;">
                <span style="font-size: 8px; color: #8e93a0;">🚘 VEHICLE:</span>
                <span style="font-size: 11px; font-weight: bold; color: var(--fg);">${vehicle}</span>
              </div>
              <div style="display:flex; flex-direction:column;">
                <span style="font-size: 8px; color: #8e93a0;">🛠️ SYMPTOMS:</span>
                <span style="font-size: 11px; color: #e5e7eb;">${symptoms}</span>
              </div>
              <div style="display:flex; flex-direction:column;">
                <span style="font-size: 8px; color: #8e93a0;">🧠 AI ANALYSIS:</span>
                <span style="font-size: 11px; color: #ff9f0a; line-height: 1.4;">${analysis}</span>
              </div>
              <div style="display:flex; flex-direction:column; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; margin-top: 2px;">
                <span style="font-size: 8px; color: #8e93a0;">💰 REPAIR ESTIMATE:</span>
                <span style="font-size: 13px; font-weight: bold; color: #00d084;">${cost}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        const bg = isSentByMe ? 'bg-blue-600' : 'bg-white/10';
        const color = isSentByMe ? 'text-white' : 'text-gray-200';
        const radius = isSentByMe ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm';
        bubbleHtml = `
          <div class="px-4 py-3 ${bg} ${color} ${radius} shadow-md whitespace-pre-wrap leading-relaxed border border-white/5">
            ${msg.text}
          </div>
        `;
      }
      
      return `
        <div class="${align} max-w-[85%] flex flex-col mb-1 font-mono text-[12px]">
          ${bubbleHtml}
          <div class="text-[9px] text-[#8e93a0] mt-1 px-1 ${isSentByMe ? 'text-right' : 'text-left'}">${msg.timestamp}</div>
        </div>
      `;
    }).join('');
    
    stream.scrollTop = stream.scrollHeight;
  },


  // -----------------------------------------
  // RIDES LOGIC
  // -----------------------------------------
  detectRidePickup: function() {
    if (this.userLat && this.userLng) {
      this.ridePickupLat = this.userLat;
      this.ridePickupLng = this.userLng;
      document.getElementById('rideFrom').value = "Current Location";
    } else {
      alert("Location access is denied. Please enter your pickup address manually.");
      document.getElementById('rideFrom').value = "";
    }
  },

  searchManualLocation: function() {
    const val = document.getElementById('rideFrom').value;
    if(val) {
      // In a real app, this would use a geocoding API to get lat/lng from the address.
      // Since we can't use dummy locations, we will just use the string address.
      this.ridePickupLat = "manual";
      this.ridePickupLng = "manual";
    }
  },

  setRideType: function(btn, type) {
    document.querySelectorAll('.ride-type-row .rtype-btn').forEach(b => {
      b.classList.remove('on');
      b.className = 'rtype-btn flex-1 bg-white/5 text-white font-mono font-bold py-3 rounded-xl border border-white/10 hover:bg-white/10';
    });
    btn.classList.add('on');
    btn.className = 'rtype-btn on flex-1 bg-white text-black font-mono font-bold py-3 rounded-xl border border-transparent shadow-[0_4px_15px_rgba(255,255,255,0.2)]';
    this.currentRideType = type;
  },

  searchRides: function() {
    const from = document.getElementById('rideFrom').value;
    const to = document.getElementById('rideTo').value;
    if(!from) { this.detectRidePickup(); return; }
    if(!to) { alert("Please enter destination"); return; }
    
    document.getElementById('searchRidesBtn').style.display = 'none';
    document.getElementById('rideSearching').style.display = 'block';
    document.getElementById('rideProviderResults').style.display = 'none';
    
    const statuses = ['Scanning nearby providers...','Checking Lyft drivers...','Checking Uber...','Checking Bolt...','Checking DiDi...','Checking Grab...','Checking InDrive...','Calculating fares...'];
    let si = 0;
    const statusEl = document.getElementById('searchStatus');
    const statusInt = setInterval(() => { if (si < statuses.length) statusEl.textContent = statuses[si++]; }, 500);

    setTimeout(() => {
      clearInterval(statusInt);
      document.getElementById('rideSearching').style.display = 'none';
      document.getElementById('searchRidesBtn').style.display = 'block';
      
      this.rideSearchResults = this.PROVIDERS_CONFIG.map(p => {
        const eta = Math.floor(3 + Math.random() * 12);
        const fare = '$' + (12 + Math.random() * 30).toFixed(2);
        const distKm = (3 + Math.random() * 12).toFixed(1);
        return { ...p, eta, fare, distKm, driver: p.drivers[0], car: p.cars[0], color: p.colors[0], plate: p.plates[0] };
      }).sort((a,b) => a.eta - b.eta);
      
      this.renderProviderResults();
      document.getElementById('rideProviderResults').style.display = 'block';
    }, 3000);
  },

  renderProviderResults: function() {
    document.getElementById('providerCards').innerHTML = this.rideSearchResults.map((p, i) => `
      <div class="provider-result-card ${p.class} bg-[#141517] border border-white/10 rounded-2xl p-5 flex gap-4 cursor-pointer hover:bg-white/5 transition-all shadow-lg items-center relative overflow-hidden" onclick="app.openBookingModal(${i})">
        <div class="absolute left-0 top-0 bottom-0 w-1 ${p.id==='bolt'?'bg-[#7fea00]':p.id==='uber'?'bg-white':p.id==='indrive'?'bg-[#4da6ff]':'bg-[#ff5050]'}"></div>
        <div class="prc-logo text-4xl bg-black/30 w-16 h-16 rounded-xl flex items-center justify-center">${p.emoji}</div>
        <div class="prc-info flex-1">
          <div class="prc-name text-[18px] font-bold text-white font-mono leading-none mb-1">${p.name}</div>
          <div class="prc-sub text-[10px] text-[#8e93a0] font-mono">${p.sub}</div>
          <div class="mt-2 text-[9px] text-white/40 font-mono tracking-wider">🚗 ${p.car} · ${p.color} · ${p.plate}</div>
        </div>
        <div class="prc-right text-right">
          <div class="prc-price text-[18px] font-bold text-white font-mono">${p.fare}</div>
          <div class="prc-eta text-[12px] text-emerald-400 font-bold font-mono mt-1">⏱ ${p.eta} min</div>
          <div class="mt-1 text-[9px] bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/50 font-mono inline-block">${p.distKm} km</div>
        </div>
      </div>
    `).join('');
  },

  openBookingModal: function(idx) {
    this.selectedProvider = this.rideSearchResults[idx];
    const p = this.selectedProvider;
    
    document.getElementById('bookingProviderLogo').textContent = p.emoji;
    document.getElementById('bookingProviderName').textContent = p.name;
    document.getElementById('bookingDetails').innerHTML = `
      <div class="flex justify-between border-b border-white/10 pb-2"><span class="text-[#8e93a0]">Fare estimate</span><span class="text-white font-bold">${p.fare}</span></div>
      <div class="flex justify-between border-b border-white/10 pb-2"><span class="text-[#8e93a0]">Distance</span><span class="text-white font-bold">${p.distKm} km</span></div>
      <div class="flex justify-between pb-2"><span class="text-[#8e93a0]">Ride type</span><span class="text-white font-bold uppercase">${this.currentRideType}</span></div>
    `;
    
    document.getElementById('bookingDriverCard').style.display = 'flex';
    document.getElementById('bookingDriverAv').textContent = '👨🏻';
    document.getElementById('bookingDriverName').textContent = p.driver;
    document.getElementById('bookingDriverInfo').textContent = `${p.car} · ${p.color}`;
    document.getElementById('bookingDriverETA').textContent = p.eta;
    
    const prog = document.getElementById('bookingProgress');
    const fill = document.getElementById('bookingProgressFill');
    const status = document.getElementById('bookingStatus');
    prog.style.display = 'block';
    fill.style.width = '0%';
    status.textContent = 'MATCHING WITH DRIVER...';
    
    let pct = 0;
    const pi = setInterval(() => {
      pct = Math.min(pct + 12, 100);
      fill.style.width = pct + '%';
      if (pct >= 100) { clearInterval(pi); status.textContent = 'DRIVER FOUND — CONFIRM BELOW'; }
    }, 200);
    
    const colorMap = { bolt:'#7fea00', uber:'var(--fg)', indrive:'#4da6ff', rida:'#ff5050' };
    const btn = document.getElementById('openAppBtn');
    btn.style.backgroundColor = colorMap[p.id] || 'var(--fg)';
    btn.style.color = 'var(--bg)';
    btn.textContent = `📱 Book with ${p.name} →`;
    
    document.getElementById('rideBookingModal').style.display = 'flex';
  },

  closeBookingModal: function() {
    document.getElementById('rideBookingModal').style.display = 'none';
  },

  openProviderApp: async function() {
    const btn = document.getElementById('openAppBtn');
    const originalText = btn.textContent;
    btn.textContent = '🔒 Authenticating...';
    btn.style.opacity = '0.7';
    btn.style.pointerEvents = 'none';

    try {
      const p = this.selectedProvider;
      const res = await fetch('/api/book-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: p.id,
          pickupLocation: document.getElementById('rideFrom').value || 'Current Location',
          destination: document.getElementById('rideTo').value || 'Unknown Destination',
          rideType: this.currentRideType
        })
      });

      const data = await res.json();
      
      if (data.success) {
        document.getElementById('bookingDetails').innerHTML = `
          <div class="text-center py-4">
            <div class="text-3xl mb-2">✅</div>
            <div class="text-emerald-400 font-bold text-lg font-mono tracking-wider">RIDE CONFIRMED</div>
            <div class="text-[#8e93a0] text-xs font-mono mt-1">${data.message}</div>
          </div>
        `;
        document.getElementById('bookingDriverName').textContent = data.driver.name;
        document.getElementById('bookingDriverInfo').textContent = `${data.driver.vehicle} · ${data.driver.plate}`;
        document.getElementById('bookingDriverETA').textContent = data.eta;
        
        btn.textContent = 'RIDE DISPATCHED';
        btn.style.backgroundColor = '#10b981';
        btn.style.color = 'var(--bg)';
        
        setTimeout(() => {
          this.closeBookingModal();
          alert('Driver ' + data.driver.name + ' is arriving in ' + data.eta + ' minutes. Watch for the ' + data.driver.vehicle + '.');
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to book ride');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to ride provider API.');
      btn.textContent = originalText;
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    }
  },

  // -----------------------------------------
  // TRACKER MAP LOGIC
  // -----------------------------------------
  speakDirection: function(text) {
    if (!this.isVoiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending spoken instructions
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Clear natural rate
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Text-to-speech error:", err);
    }
  },

  generateSimulatedRoute: function(uLng, uLat, mechLng, mechLat) {
    const points = [];
    const segments = 50;
    // Cubic Bezier to curve beautifully around Okoloba St, Jakpa Rd and Nnewi St
    const midLat1 = uLat + (mechLat - uLat) * 0.35 + 0.002;
    const midLng1 = uLng + (mechLng - uLng) * 0.35 - 0.003;
    const midLat2 = uLat + (mechLat - uLat) * 0.70 - 0.003;
    const midLng2 = uLng + (mechLng - uLng) * 0.70 + 0.002;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const lat = Math.pow(1 - t, 3) * uLat + 
                  3 * Math.pow(1 - t, 2) * t * midLat1 + 
                  3 * (1 - t) * Math.pow(t, 2) * midLat2 + 
                  Math.pow(t, 3) * mechLat;
      const lng = Math.pow(1 - t, 3) * uLng + 
                  3 * Math.pow(1 - t, 2) * t * midLng1 + 
                  3 * (1 - t) * Math.pow(t, 2) * midLng2 + 
                  Math.pow(t, 3) * mechLng;
      points.push([lng, lat]);
    }
    return points;
  },

  generateAlternativeRoute: function(uLng, uLat, mechLng, mechLat) {
    const points = [];
    const segments = 50;
    // Alternative Bezier route curving slightly wider representing secondary path
    const midLat1 = uLat + (mechLat - uLat) * 0.45 - 0.003;
    const midLng1 = uLng + (mechLng - uLng) * 0.25 + 0.004;
    const midLat2 = uLat + (mechLat - uLat) * 0.80 + 0.002;
    const midLng2 = uLng + (mechLng - uLng) * 0.60 - 0.005;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const lat = Math.pow(1 - t, 3) * uLat + 
                  3 * Math.pow(1 - t, 2) * t * midLat1 + 
                  3 * (1 - t) * Math.pow(t, 2) * midLat2 + 
                  Math.pow(t, 3) * mechLat;
      const lng = Math.pow(1 - t, 3) * uLng + 
                  3 * Math.pow(1 - t, 2) * t * midLng1 + 
                  3 * (1 - t) * Math.pow(t, 2) * midLng2 + 
                  Math.pow(t, 3) * mechLng;
      points.push([lng, lat]);
    }
    return points;
  },

  calculateDistance: function(lat1, lon1, lat2, lon2) {
    // Precise Haversine Formula for distance on spherical earth
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },

  getPlaceName: async function(lat, lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data) {
        const addr = data.address;
        // Prefer building names, amenities, shops, or road names
        const mainName = data.name || addr.amenity || addr.shop || addr.building || addr.road || addr.suburb || addr.city;
        const roadName = addr.road || addr.suburb || addr.city;
        if (mainName && roadName && mainName !== roadName) {
          return `${mainName}, ${roadName}`;
        }
        return mainName || `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }
    } catch (err) {
      console.warn("Reverse geocode failed", err);
    }
    return `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  },

  fetchRealRouteNames: async function(primaryLatLngs, mechName) {
    const startPt = primaryLatLngs[0];
    const turn1Pt = primaryLatLngs[Math.floor(primaryLatLngs.length * 0.3)];
    const turn2Pt = primaryLatLngs[Math.floor(primaryLatLngs.length * 0.7)];
    const endPt = primaryLatLngs[primaryLatLngs.length - 1];

    try {
      const [startName, turn1Name, turn2Name, endName] = await Promise.all([
        this.getPlaceName(startPt[0], startPt[1]),
        this.getPlaceName(turn1Pt[0], turn1Pt[1]),
        this.getPlaceName(turn2Pt[0], turn2Pt[1]),
        this.getPlaceName(endPt[0], endPt[1])
      ]);

      return {
        start: startName || "Your Location",
        turn1: turn1Name || "Local Road",
        turn2: turn2Name || "Main Street",
        end: endName || `${mechName}'s Garage`
      };
    } catch (e) {
      console.warn("Fetch real names failed", e);
    }
    return {
      start: "Your Location",
      turn1: "Jakpa Road",
      turn2: "Okoloba Street",
      end: `${mechName}'s Workshop`
    };
  },

  activeTrackerParams: null,
  trackerLiveMode: null,

  openMapTracker: function(name, mechLat, mechLng, mode = 'to_mechanic') {
    const modal = document.getElementById('mapModal');
    if(modal) modal.style.display = 'flex';
    document.getElementById('mapMechName').textContent = name;
    
    // Save active tracking variables
    this.activeTrackerParams = { name, mechLat, mechLng, mode };

    // Clear previous simulation or watch positions if active
    if (this.simulationInterval !== null) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // Hide HUD initially until a mode is selected
    const navHud = document.getElementById('navHud');
    if (navHud) navHud.style.display = 'none';

    // Show the Mode Selector Overlay
    const overlay = document.getElementById('trackerModeOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
    } else {
      // Fallback if overlay element is missing
      this.startLiveTracker('sim');
    }
  },

  startLiveTracker: function(modeSelection) {
    // Hide overlay
    const overlay = document.getElementById('trackerModeOverlay');
    if (overlay) overlay.style.display = 'none';

    if (!this.activeTrackerParams) return;
    const { name, mechLat, mechLng, mode } = this.activeTrackerParams;

    this.trackerMode = mode;
    this.trackerLiveMode = modeSelection; // 'real' or 'sim'

    // Show HUD
    const navHud = document.getElementById('navHud');
    if (navHud) navHud.style.display = 'flex';

    // Find mechanic details from the global MECHS list
    const mech = this.MECHS.find(m => m.name === name) || { emoji: '🔧', phone: '1234567890', wa: '1234567890', spec: 'Mobile Response Unit' };
    
    // Update UI components dynamically
    const avatarEl = document.getElementById('trackerMechAvatar');
    const specEl = document.getElementById('trackerMechSpec');
    const phoneEl = document.getElementById('trackerPhoneLink');
    const waEl = document.getElementById('trackerWaLink');
    const distValEl = document.getElementById('trackerDistVal');
    const etaValEl = document.getElementById('trackerEtaVal');
    
    if (avatarEl) avatarEl.textContent = mech.emoji || '🔧';
    if (specEl) specEl.textContent = mech.spec || 'Mobile Response Unit';
    if (phoneEl) phoneEl.href = `tel:${mech.phone || ''}`;
    if (waEl) waEl.href = `https://wa.me/${mech.wa || ''}`;
    if (distValEl) distValEl.textContent = `Calculating...`;
    if (etaValEl) etaValEl.textContent = `Calculating...`;

    // Safe numeric coordinate parsing
    let finalLat = parseFloat(mechLat || mech.lat);
    let finalLng = parseFloat(mechLng || mech.lng);
    
    if (isNaN(finalLat) || isNaN(finalLng) || !finalLat || !finalLng) {
      finalLat = this.userLat || 51.5074;
      finalLng = this.userLng || -0.1278;
    }

    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          const dist = this.calculateDistance(finalLat, finalLng, lat, lng);
          
          if (this.trackerLiveMode === 'real') {
            this.userLat = lat;
            this.userLng = lng;
            if (this.trackerMap) {
              if (this.userMarker) this.userMarker.setLatLng([lat, lng]);
              this.trackerMap.panTo([lat, lng]);
              
              // Dynamically recalculate stats in real mode
              const remainingDist = dist;
              const remainingEta = Math.max(1, Math.ceil(remainingDist * 5)); // assume avg 5 min/km
              
              if (distValEl) distValEl.textContent = `${remainingDist.toFixed(2)} km`;
              if (etaValEl) etaValEl.textContent = `~${remainingEta} min`;

              // Update stepper dynamically based on distance in real mode
              const stepperProgress = document.querySelector('.stepper-progress-fill');
              const stepperSteps = document.querySelectorAll('.stepper-step');
              
              if (remainingDist < 0.1) {
                // Arrived
                if (stepperProgress) stepperProgress.style.width = '100%';
                if (stepperSteps[1]) {
                  stepperSteps[1].classList.remove('pulsing');
                  stepperSteps[1].innerHTML = `<div class="step-dot">✓</div><span class="step-label text-[11px]">${this.trackerMode === 'to_user' ? 'En Route' : 'En Route'}</span>`;
                }
                if (stepperSteps[2]) {
                  stepperSteps[2].classList.add('active');
                  stepperSteps[2].innerHTML = `<div class="step-dot">✓</div><span class="step-label text-[11px]">${this.trackerMode === 'to_user' ? 'Arrival' : 'Arrived'}</span>`;
                }
                this.speakDirection(this.trackerMode === 'to_user' ? "Your mechanic has arrived!" : "You have arrived!");
              } else if (remainingDist < 1.0) {
                // En route near
                if (stepperProgress) stepperProgress.style.width = '75%';
                if (stepperSteps[1]) stepperSteps[1].classList.add('active', 'pulsing');
              } else {
                // Departed / Dispatched
                if (stepperProgress) stepperProgress.style.width = '30%';
              }
            }
          } else {
            // Keep simulator active and just secure coordinates
            if (dist <= 100) {
              this.userLat = lat;
              this.userLng = lng;
            }
          }
        },
        (err) => {
          console.warn("Real-time GPS tracking warning:", err);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }

    setTimeout(async () => {
      let startLat = this.userLat || (finalLat - 0.015);
      let startLng = this.userLng || (finalLng + 0.015);
      const destLat = finalLat;
      const destLng = finalLng;

      // Localize mock coordinates if too far away
      if (this.userLat && this.userLng) {
        const dist = this.calculateDistance(finalLat, finalLng, this.userLat, this.userLng);
        if (dist > 100) {
          startLat = finalLat - 0.015;
          startLng = finalLng + 0.015;
        }
      }

      let routeCoordinates = [];
      let alternativeCoordinates = [];
      let totalDistance = 0;

      if (this.trackerLiveMode === 'real' && navigator.onLine) {
        // Try online routing from real public OSRM API!
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;
          const response = await fetch(url);
          const data = await response.json();
          if (data && data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates;
            // OSRM returns coordinates as [[lng, lat]]
            routeCoordinates = coords;
            alternativeCoordinates = coords.map(c => [c[0] + 0.002, c[1] - 0.002]); // mock alt offset
            totalDistance = data.routes[0].distance / 1000; // in km
          }
        } catch (e) {
          console.warn("OSRM routing API failed, falling back to mock routing curves:", e);
        }
      }

      // Fallback to beautiful Bezier curves if route coordinates not fetched yet
      if (!routeCoordinates || routeCoordinates.length === 0) {
        routeCoordinates = this.generateSimulatedRoute(startLng, startLat, destLng, destLat);
        alternativeCoordinates = this.generateAlternativeRoute(startLng, startLat, destLng, destLat);
        totalDistance = this.calculateDistance(destLat, destLng, startLat, startLng);
      }

      if (!this.trackerMap) {
        if (window.L) {
          this.trackerMap = L.map('mapContainer', { zoomControl: false, attributionControl: true });
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; Sources: Esri'
          }).addTo(this.trackerMap);
          this.trackerMap.setView([startLat, startLng], 14);
          this.drawRouteLineAndSimulate(routeCoordinates, alternativeCoordinates, totalDistance, mech);
        }
      } else {
        if (window.L) {
          this.trackerMap.setView([startLat, startLng], 14);
          this.drawRouteLineAndSimulate(routeCoordinates, alternativeCoordinates, totalDistance, mech);
        }
      }
    }, 100);
  },

  drawRouteLineAndSimulate: async function(routeCoords, altCoords, totalDistance, mech) {
    if (!this.trackerMap || !window.L) return;

    // Clear previous Leaflet layers
    if (this.primaryPolyline) { this.trackerMap.removeLayer(this.primaryPolyline); this.primaryPolyline = null; }
    if (this.altPolyline) { this.trackerMap.removeLayer(this.altPolyline); this.altPolyline = null; }
    if (this.startMarker) { this.trackerMap.removeLayer(this.startMarker); this.startMarker = null; }
    if (this.userMarker) { this.trackerMap.removeLayer(this.userMarker); this.userMarker = null; }
    if (this.mechMarker) { this.trackerMap.removeLayer(this.mechMarker); this.mechMarker = null; }
    if (this.primaryPillMarker) { this.trackerMap.removeLayer(this.primaryPillMarker); this.primaryPillMarker = null; }
    if (this.altPillMarker) { this.trackerMap.removeLayer(this.altPillMarker); this.altPillMarker = null; }
    if (this.routeDots && this.routeDots.length > 0) {
      this.routeDots.forEach(d => this.trackerMap.removeLayer(d));
      this.routeDots = [];
    }

    // Map coordinate pairs [lng, lat] to Leaflet latlng arrays [lat, lng]
    const primaryLatLngs = routeCoords.map(c => [c[1], c[0]]);
    const altLatLngs = altCoords.map(c => [c[1], c[0]]);
    const totalSteps = primaryLatLngs.length - 1;

    // Fetch 100% real building/road names in real-time from satellite geocoding database!
    const names = await this.fetchRealRouteNames(primaryLatLngs, mech.name);

    // 1. Draw Alternative Route
    this.altPolyline = L.polyline(altLatLngs, {
      color: '#4da6ff',
      weight: 5,
      opacity: 0.65
    }).addTo(this.trackerMap);

    // 2. Draw Primary Route
    this.primaryPolyline = L.polyline(primaryLatLngs, {
      color: '#2a6cf5',
      weight: 5,
      opacity: 0.95
    }).addTo(this.trackerMap);

    // 3. Draw Closely Spaced Circles Along the Active Route
    for (let i = 0; i < primaryLatLngs.length; i += 3) {
      const dot = L.circleMarker(primaryLatLngs[i], {
        radius: 4.5,
        fillColor: '#4a0082',
        fillOpacity: 1,
        color: 'var(--fg)',
        weight: 1.5
      }).addTo(this.trackerMap);
      this.routeDots.push(dot);
    }

    // 4. Create Floating Route Info Boxes
    const primaryMid = primaryLatLngs[Math.floor(primaryLatLngs.length / 2)];
    const altMid = altLatLngs[Math.floor(altLatLngs.length / 2)];

    this.primaryPillMarker = L.popup({
      closeButton: false,
      autoPan: false,
      offset: [0, -10]
    })
    .setLatLng(primaryMid)
    .setContent(`<div class="map-route-pill">🚶 35 min<span style="font-size:9px;color:#888;display:block;margin-top:2px;">2.5 km</span></div>`)
    .addTo(this.trackerMap);

    this.altPillMarker = L.popup({
      closeButton: false,
      autoPan: false,
      offset: [0, -10]
    })
    .setLatLng(altMid)
    .setContent(`<div class="map-route-pill alt">🚶 37 min<span style="font-size:9px;color:#888;display:block;margin-top:2px;">2.7 km</span></div>`)
    .addTo(this.trackerMap);

    // 5. White Circle Starting Point (User's Breakdown Location)
    this.startMarker = L.circleMarker(primaryLatLngs[0], {
      radius: 7,
      fillColor: 'var(--fg)',
      fillOpacity: 1,
      color: '#8e8e93',
      weight: 3
    }).addTo(this.trackerMap);

    // 6. Draw Fixed/Moving markers based on the mode
    if (this.trackerMode === 'to_user') {
      // Emergency Mobile Dispatch Mode
      const userPulseIcon = L.divIcon({
        className: 'user-pulse-marker',
        html: '<div class="pulse-ring" style="border-color: #2a6cf5;"></div><div class="pulse-dot" style="background: #2a6cf5; box-shadow: 0 0 10px #2a6cf5;"></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.userMarker = L.marker(primaryLatLngs[0], { icon: userPulseIcon }).addTo(this.trackerMap);

      const mechIcon = L.divIcon({
        className: 'mech-pulse-marker',
        html: `<div class="mech-dot" style="font-size:32px; filter:drop-shadow(0 2px 10px rgba(255,159,10,0.6)); animation: floatPin 2s ease-in-out infinite;">🚒</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      this.mechMarker = L.marker(primaryLatLngs[totalSteps], { icon: mechIcon }).addTo(this.trackerMap);
    } else {
      // Standard User Navigation Mode
      const mechIcon = L.divIcon({
        className: 'mech-pulse-marker',
        html: `<div class="mech-dot" style="font-size:32px; filter:drop-shadow(0 2px 10px rgba(255,159,10,0.6)); animation: floatPin 2s ease-in-out infinite;">🏪</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      this.mechMarker = L.marker(primaryLatLngs[totalSteps], { icon: mechIcon }).addTo(this.trackerMap);

      const userPulseIcon = L.divIcon({
        className: 'user-pulse-marker',
        html: '<div class="pulse-ring" style="border-color: #2a6cf5;"></div><div class="pulse-dot" style="background: #2a6cf5; box-shadow: 0 0 10px #2a6cf5;"></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      this.userMarker = L.marker(primaryLatLngs[0], { icon: userPulseIcon }).addTo(this.trackerMap);
    }

    // Fit boundaries initially
    const bounds = L.latLngBounds([...primaryLatLngs, ...altLatLngs]);
    this.trackerMap.fitBounds(bounds, { padding: [40, 40] });

    // Voice Directions array based on mode
    let voiceDirections = [];
    if (this.trackerMode === 'to_user') {
      voiceDirections = [
        { step: 0, icon: '⚡', instruction: `Dispatcher dispatched from ${names.end}`, voice: `Mobile emergency dispatcher is on the way. Dispatcher departed from ${mech.name}.` },
        { step: 10, icon: '↑', instruction: `Dispatcher driving onto ${names.turn2}`, voice: `Mechanic is turning onto ${names.turn2}.` },
        { step: 18, icon: '🚗', instruction: `En route via ${names.turn1}`, voice: `Mechanic is making steady progress. Arriving in approximately 8 minutes.` },
        { step: 28, icon: '↑', instruction: `Passing ${names.turn1}`, voice: `Mechanic is passing ${names.turn1}, driving straight towards you.` },
        { step: 38, icon: '⚠️', instruction: `Approaching your coordinates`, voice: `Mechanic is approaching your breakdown coordinates. Please turn on hazard lights.` },
        { step: 44, icon: '📍', instruction: `Dispatcher entering your street`, voice: `Mechanic is entering your street.` },
        { step: 48, icon: '🏁', instruction: `Dispatcher has visual contact`, voice: `Mechanic has visual contact. Arrived at your location.` },
        { step: 50, icon: '🏁', instruction: 'Mechanic has arrived!', voice: `Your mobile response mechanic has arrived! They are ready to assist you.` }
      ];
    } else {
      voiceDirections = [
        { step: 0, icon: '↑', instruction: `Starting near ${names.start}`, voice: `GPS navigation started. Head towards ${mech.name}'s workshop.` },
        { step: 10, icon: '↰', instruction: `In 300m, turn left towards ${names.turn1}`, voice: `In 300 meters, turn left towards ${names.turn1}.` },
        { step: 18, icon: '↰', instruction: `Turn left onto ${names.turn1}`, voice: `Turn left onto ${names.turn1}.` },
        { step: 28, icon: '↑', instruction: `Continue straight towards ${names.turn2}`, voice: `Continue straight towards ${names.turn2}.` },
        { step: 38, icon: '↱', instruction: `In 200m, turn right towards ${names.end}`, voice: `In 200 meters, turn right towards ${names.end}.` },
        { step: 44, icon: '↱', instruction: 'Turn right to stay on route', voice: 'Turn right to stay on route.' },
        { step: 48, icon: '🏁', instruction: `Approaching ${names.end}`, voice: `Approaching your destination on the right.` },
        { step: 50, icon: '🏁', instruction: 'You have arrived!', voice: `Arrived! You have reached ${mech.name}'s workshop. You can now meet your mechanic.` }
      ];
    }

    // Set stepper fill initially
    const stepperProgress = document.querySelector('.stepper-progress-fill');
    const stepperSteps = document.querySelectorAll('.stepper-step');
    const startProgressPercent = (this.trackerMode === 'to_user') ? 50 : 0;
    
    if (stepperProgress) stepperProgress.style.width = startProgressPercent + '%';
    
    if (this.trackerMode === 'to_user') {
      if (stepperSteps[0]) {
        stepperSteps[0].classList.add('active');
        stepperSteps[0].innerHTML = '<div class="step-dot">✓</div><span class="step-label text-[11px]">Dispatched</span>';
      }
      if (stepperSteps[1]) {
        stepperSteps[1].classList.add('active', 'pulsing');
        stepperSteps[1].innerHTML = '<div class="step-dot">●</div><span class="step-label text-[11px]">En Route</span>';
      }
      if (stepperSteps[2]) {
        stepperSteps[2].classList.remove('active');
        stepperSteps[2].innerHTML = '<div class="step-dot"></div><span class="step-label text-[11px]">Arrival</span>';
      }
    } else {
      if (stepperSteps[0]) {
        stepperSteps[0].classList.add('active');
        stepperSteps[0].innerHTML = '<div class="step-dot">✓</div><span class="step-label text-[11px]">Departed</span>';
      }
      if (stepperSteps[1]) {
        stepperSteps[1].classList.add('active', 'pulsing');
        stepperSteps[1].innerHTML = '<div class="step-dot">●</div><span class="step-label text-[11px]">En Route</span>';
      }
      if (stepperSteps[2]) {
        stepperSteps[2].classList.remove('active');
        stepperSteps[2].innerHTML = '<div class="step-dot"></div><span class="step-label text-[11px]">Arrived</span>';
      }
    }

    if (this.trackerLiveMode === 'real') {
      // Just initialize stats once, watchPosition will update them in real-time as they drive!
      const distValEl = document.getElementById('trackerDistVal');
      const etaValEl = document.getElementById('trackerEtaVal');
      if (distValEl) distValEl.textContent = `${totalDistance.toFixed(2)} km`;
      if (etaValEl) etaValEl.textContent = `~${Math.max(1, Math.ceil(totalDistance * 5))} min`;
      this.speakDirection(this.trackerMode === 'to_user' ? "Emergency dispatcher is on the way. Tracking live position." : "Live tracking activated. Head towards your destination.");
      return; // Skip automated simulation loop!
    }

    let currentStep = 0;
    this.speakDirection(voiceDirections[0].voice);
    
    // Animation driving loop
    this.simulationInterval = setInterval(() => {
      currentStep++;
      if (currentStep > totalSteps) {
        clearInterval(this.simulationInterval);
        this.simulationInterval = null;
        
        // Update Stepper to completed arrival state
        if (stepperProgress) stepperProgress.style.width = '100%';
        if (this.trackerMode === 'to_user') {
          if (stepperSteps[1]) {
            stepperSteps[1].classList.remove('pulsing');
            stepperSteps[1].innerHTML = '<div class="step-dot">✓</div><span class="step-label text-[11px]">En Route</span>';
          }
          if (stepperSteps[2]) {
            stepperSteps[2].classList.add('active');
            stepperSteps[2].innerHTML = '<div class="step-dot">✓</div><span class="step-label text-[11px]">Arrival</span>';
          }
        } else {
          if (stepperSteps[1]) {
            stepperSteps[1].classList.remove('pulsing');
            stepperSteps[1].innerHTML = '<div class="step-dot">✓</div><span class="step-label text-[11px]">En Route</span>';
          }
          if (stepperSteps[2]) {
            stepperSteps[2].classList.add('active');
            stepperSteps[2].innerHTML = '<div class="step-dot">✓</div><span class="step-label text-[11px]">Arrived</span>';
          }
        }
        return;
      }

      // Update positions based on mode
      if (this.trackerMode === 'to_user') {
        const currentCoords = primaryLatLngs[totalSteps - currentStep];
        this.mechMarker.setLatLng(currentCoords);
        this.trackerMap.panTo(currentCoords);
      } else {
        const currentCoords = primaryLatLngs[currentStep];
        this.userMarker.setLatLng(currentCoords);
        this.trackerMap.panTo(currentCoords);
      }

      // Interpolate ETA and distance values smoothly
      const percentDone = currentStep / totalSteps;
      const remainingDist = Math.max(0, totalDistance * (1 - percentDone));
      const remainingEta = Math.max(0, Math.ceil(12 * (1 - percentDone)));

      const distValEl = document.getElementById('trackerDistVal');
      const etaValEl = document.getElementById('trackerEtaVal');
      
      if (distValEl) distValEl.textContent = `${remainingDist.toFixed(2)} km`;
      if (etaValEl) etaValEl.textContent = remainingEta > 0 ? `~${remainingEta} min` : 'Arrived';
      
      // Stepper filling progress
      if (stepperProgress) {
        const currentFill = startProgressPercent + (percentDone * (100 - startProgressPercent));
        stepperProgress.style.width = currentFill + '%';
      }

      // Voice and HUD instructions checker
      const dirInfo = voiceDirections.find(d => d.step === currentStep);
      if (dirInfo) {
        const hudIcon = document.getElementById('hudTurnIcon');
        const hudText = document.getElementById('hudInstruction');
        const hudSubText = document.getElementById('hudSubInstruction');
        
        if (hudIcon) hudIcon.textContent = dirInfo.icon;
        if (hudText) hudText.textContent = dirInfo.instruction;
        
        // Predict next instruction
        const nextDir = voiceDirections.find(d => d.step > currentStep);
        if (hudSubText) {
          hudSubText.textContent = nextDir ? `Next: ${nextDir.instruction}` : 'Destination Ahead';
        }

        this.speakDirection(dirInfo.voice);
      }
    }, 600); // 600ms updates
  },

  closeMap: function() {
    const modal = document.getElementById('mapModal');
    if(modal) modal.style.display = 'none';
    if (this.simulationInterval !== null) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
  },

  toggleVoice: function() {
    this.isVoiceEnabled = !this.isVoiceEnabled;
    const btn = document.getElementById('voiceBtn');
    if (btn) {
      if (this.isVoiceEnabled) {
        btn.textContent = '🔊';
        btn.style.opacity = '1';
        this.speakDirection("Voice guidance enabled");
      } else {
        btn.textContent = '🔇';
        btn.style.opacity = '0.5';
      }
    }
  },

  // -----------------------------------------
  // GARAGE ACTIONS
  // -----------------------------------------
  updateMileageCheckin: function() {
    const input = document.getElementById('mileageUpdateInput').value;
    if(!input) return;
    this.vehicle.mileage = input;
    localStorage.setItem('desktopVehicle', JSON.stringify(this.vehicle));
    document.getElementById('mileageLastUpdate').textContent = new Date().toLocaleDateString();
    document.getElementById('drivingRateInfo').textContent = 'Mileage updated. AI predicting next service in ~3,000 miles.';
    document.getElementById('mileageUpdateInput').value = '';
  },

  // ─── FUEL UNIT CONVERSION TABLE (all → US gallons) ──────────────────
  FUEL_TO_GAL: {
    gal:       1.0,          // US gallons (base)
    imp:       1.20095,      // Imperial (UK) gallons
    L:         0.264172,     // Liters
    kg_petrol: 0.352392,     // kg of petrol/gasoline (density ≈ 0.745 kg/L)
    kg_diesel: 0.297492,     // kg of diesel         (density ≈ 0.850 kg/L)
    kg_cng:    0.448929,     // kg of CNG             (energy equiv to US gal)
    lbs:       0.119826      // lbs of gasoline       (≈ 6 lbs per US gal)
  },

  // ─── UNIT LABELS FOR DISPLAY ──────────────────────────────────────────
  FUEL_UNIT_LABELS: {
    gal: 'US gal', imp: 'imp gal', L: 'L', kg_petrol: 'kg', kg_diesel: 'kg', kg_cng: 'kg', lbs: 'lbs'
  },

  updateFuelLabels: function() {
    const distUnit = (document.getElementById('fuelDistUnit') || {}).value || 'mi';
    const fuelUnit = (document.getElementById('fuelUnit') || {}).value || 'gal';
    const preview  = document.getElementById('fuelUnitPreview');
    if (!preview) return;

    let effLabel = '';
    if (distUnit === 'mi') {
      effLabel = fuelUnit === 'L' ? 'MPG (US) + L/100km' : 'MPG (US)';
    } else {
      effLabel = 'L/100km';
    }
    const fuelLabel = this.FUEL_UNIT_LABELS[fuelUnit] || fuelUnit;
    preview.textContent = `Will log: ${distUnit === 'mi' ? 'miles' : 'km'} ÷ ${fuelLabel} → ${effLabel}`;
  },

  logFuelEntry: function() {
    this.logFuel();
  },

  logFuel: function() {
    const odoInp  = document.getElementById('fuelMileage');
    const amtInp  = document.getElementById('fuelGallons');
    const distSel = document.getElementById('fuelDistUnit');
    const fuelSel = document.getElementById('fuelUnit');
    if (!odoInp || !amtInp || !odoInp.value || !amtInp.value) return;

    const distUnit  = distSel ? distSel.value : 'mi';
    const fuelUnit  = fuelSel ? fuelSel.value : 'gal';
    const rawOdo    = parseFloat(odoInp.value);
    const rawFuel   = parseFloat(amtInp.value);

    // Normalize: everything stored internally as (miles, US gallons)
    const miles_norm   = distUnit === 'km' ? rawOdo * 0.621371 : rawOdo;
    const gallons_norm = rawFuel * (this.FUEL_TO_GAL[fuelUnit] || 1.0);

    this.fuelLogs.push({
      miles:         miles_norm,          // normalized to miles
      gallons_norm:  gallons_norm,        // normalized to US gallons
      raw_odo:       rawOdo,
      raw_fuel:      rawFuel,
      dist_unit:     distUnit,
      fuel_unit:     fuelUnit,
      date: new Date().toLocaleDateString()
    });

    // Sort descending by odometer so logs[0] = most recent
    this.fuelLogs.sort((a, b) => b.miles - a.miles);
    localStorage.setItem('desktopFuelLogs', JSON.stringify(this.fuelLogs));

    // Update vehicle mileage if this log is newer
    const currentVehMi = parseFloat(this.vehicle.mileage) || 0;
    if (miles_norm > currentVehMi) {
      this.vehicle.mileage = Math.round(miles_norm).toString();
      localStorage.setItem('desktopVehicle', JSON.stringify(this.vehicle));
      localStorage.setItem('myVehicle', JSON.stringify(this.vehicle));
    }

    // Set serviceLog.fuel to reset the tank vital baseline
    this.serviceLog['fuel'] = {
      date: new Date().toISOString(),
      mileage: miles_norm
    };
    localStorage.setItem('serviceLog', JSON.stringify(this.serviceLog));

    // Reset AI fuel burned
    try {
      let aiTripStats = JSON.parse(localStorage.getItem('aiTripStats') || '{"totalHardBrakes":0, "oilStressDistance":0, "totalFuelBurnedGal":0}');
      aiTripStats.totalFuelBurnedGal = 0;
      localStorage.setItem('aiTripStats', JSON.stringify(aiTripStats));
    } catch(e) {}

    odoInp.value = '';
    amtInp.value = '';
    this.renderFuelStats2();
    // ⛽ Fuel log data feeds directly into health score — refresh telemetry panel
    try { this.renderDashboardTelemetry(); } catch(e) {}
  },

  renderFuelStats2: function() {
    const empty = document.getElementById('fuelEmpty');
    const chart = document.getElementById('fuelChartCanvas');
    const alert = document.getElementById('fuelAiAlert');
    if (!empty || !chart || !alert) return;

    if (this.fuelLogs.length < 2) {
      empty.style.display = 'block';
      chart.style.display = 'none';
      alert.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    chart.style.display = 'block';
    alert.style.display = 'block';

    // ── Calculate per-segment MPG for each fill-up pair ─────────────────
    // FIX: Use l2.gallons_norm (the fuel that drove the distance between l2→l1)
    //      NOT l1.gallons_norm (which is the current fill-up amount)
    //
    // Formula: MPG = (odo_now - odo_prev) / gallons_prev_fill
    //   Because: you filled X gallons at fill-up N-1, then drove Y miles,
    //   then came back to fill again at fill-up N.
    //   The efficiency of fill-up N-1 = Y miles ÷ X gallons.
    const mpgHistory = [];
    for (let i = 0; i < this.fuelLogs.length - 1; i++) {
      const newer = this.fuelLogs[i];      // higher odometer
      const older = this.fuelLogs[i + 1];  // lower odometer
      const distMi = newer.miles - older.miles;
      const gals   = older.gallons_norm || older.gallons; // backward-compat
      if (distMi > 0 && gals > 0) {
        const mpg = distMi / gals;
        const distKm = distMi * 1.60934;
        const L_per_100km = gals > 0 ? (3.785411784 * gals / distKm * 100) : 0;
        mpgHistory.push({ mpg, distMi, gals, L_per_100km, date: newer.date });
      }
    }

    if (mpgHistory.length === 0) {
      alert.style.display = 'none';
      return;
    }

    // ── Running average MPG ─────────────────────────────────────────────
    const avgMpg = mpgHistory.reduce((s, e) => s + e.mpg, 0) / mpgHistory.length;
    const latest = mpgHistory[0];
    const dropPct = ((avgMpg - latest.mpg) / avgMpg) * 100;

    // ── Draw sparkline chart ────────────────────────────────────────────
    const ctx = chart.getContext('2d');
    chart.width  = chart.parentElement.offsetWidth || 300;
    chart.height = 80;
    ctx.clearRect(0, 0, chart.width, chart.height);
    const pts = mpgHistory.slice().reverse(); // chronological order
    if (pts.length > 1) {
      const minV = Math.min(...pts.map(p => p.mpg)) * 0.9;
      const maxV = Math.max(...pts.map(p => p.mpg)) * 1.1;
      const scaleX = chart.width / (pts.length - 1);
      const scaleY = (chart.height - 16) / (maxV - minV || 1);
      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = i * scaleX;
        const y = chart.height - 8 - (p.mpg - minV) * scaleY;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = dropPct > 15 ? 'var(--accent)' : dropPct > 5 ? '#ff8800' : '#00d084';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();
      // Dot on latest
      const lx = (pts.length - 1) * scaleX;
      const ly = chart.height - 8 - (pts[pts.length - 1].mpg - minV) * scaleY;
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.fillStyle = dropPct > 15 ? 'var(--accent)' : '#00d084';
      ctx.fill();
    }

    // ── Anomaly alert ───────────────────────────────────────────────────
    const L100 = latest.L_per_100km.toFixed(1);
    if (dropPct > 15) {
      // CRITICAL: efficiency dropped significantly
      alert.style.cssText = 'display:block; margin-top:16px; padding:14px; background:rgba(230,57,70,0.1); border:1px solid rgba(230,57,70,0.3); border-radius:14px; box-shadow:0 0 15px rgba(230,57,70,0.15);';
      alert.innerHTML = `
        <div style="font-size:10px; font-family:'Space Mono',monospace; color:var(--accent); font-weight:bold; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px;">⚠️ EFFICIENCY ANOMALY DETECTED</div>
        <div style="font-size:11px; font-family:'Space Mono',monospace; color:rgba(255,255,255,0.7); line-height:1.6;">
          Latest: <strong style="color:var(--accent);">${latest.mpg.toFixed(1)} MPG</strong> · ${L100} L/100km<br>
          Average: <strong>${avgMpg.toFixed(1)} MPG</strong> · Drop: <strong style="color:var(--accent);">${dropPct.toFixed(0)}%</strong><br>
          <span style="color:rgba(255,255,255,0.4); font-size:10px;">Possible causes: dirty air filter, low tyre pressure, O2 sensor fault.</span>
        </div>`;
    } else if (dropPct > 5) {
      // WARNING: slight dip
      alert.style.cssText = 'display:block; margin-top:16px; padding:14px; background:rgba(255,136,0,0.08); border:1px solid rgba(255,136,0,0.25); border-radius:14px;';
      alert.innerHTML = `
        <div style="font-size:10px; font-family:'Space Mono',monospace; color:#ff8800; font-weight:bold; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px;">📉 SLIGHT EFFICIENCY DIP</div>
        <div style="font-size:11px; font-family:'Space Mono',monospace; color:rgba(255,255,255,0.7); line-height:1.6;">
          Latest: <strong style="color:#ff8800;">${latest.mpg.toFixed(1)} MPG</strong> · ${L100} L/100km<br>
          Average: ${avgMpg.toFixed(1)} MPG · Minor drop of ${dropPct.toFixed(0)}%
        </div>`;
    } else {
      // GOOD: on track or improving
      const improving = latest.mpg > avgMpg;
      alert.style.cssText = 'display:block; margin-top:16px; padding:14px; background:rgba(0,208,132,0.06); border:1px solid rgba(0,208,132,0.2); border-radius:14px;';
      alert.innerHTML = `
        <div style="font-size:10px; font-family:'Space Mono',monospace; color:#00d084; font-weight:bold; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px;">${improving ? '🚀 EFFICIENCY IMPROVING' : '✅ EFFICIENCY STABLE'}</div>
        <div style="font-size:11px; font-family:'Space Mono',monospace; color:rgba(255,255,255,0.7); line-height:1.6;">
          Latest: <strong style="color:#00d084;">${latest.mpg.toFixed(1)} MPG</strong> · ${L100} L/100km<br>
          Running average: ${avgMpg.toFixed(1)} MPG over ${mpgHistory.length} fill-up${mpgHistory.length > 1 ? 's' : ''}
        </div>`;
    }
  },

  renderMaintenanceLogs: function() {
    // Primary: historyTimelineFeed (in app.html mobile/PWA view)
    // Fallback: maint-timeline (in legacy/desktop layout)
    const historyFeed = document.getElementById('historyTimelineFeed');
    const list = document.getElementById('maint-timeline');
    const target = historyFeed || list;
    if (!target) return;

    if (this.maintLogs.length === 0) {
      target.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center py-8">
          <div class="text-3xl mb-2 opacity-40">🔧</div>
          <div class="text-[11px] text-zinc-500 font-mono">No maintenance logs yet. Log a service to get started.</div>
        </div>
      `;
      const empty = document.getElementById('maint-empty');
      if (empty) empty.style.display = 'block';
      return;
    }
    const empty = document.getElementById('maint-empty');
    if (empty) empty.style.display = 'none';

    const html = this.maintLogs.map(log => `
      <div class="bg-white/[0.03] border border-white/5 p-4 rounded-xl flex justify-between items-center relative hover:bg-white/[0.06] transition-colors shadow-sm">
        <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r"></div>
        <div class="pl-4 overflow-hidden">
          <span class="text-[13px] text-white font-bold block truncate font-mono">${log.desc}</span>
          <span class="text-[10px] text-[#8e93a0] font-mono mt-1">${log.date}</span>
        </div>
      </div>
    `).join('');

    target.innerHTML = html;
    // Also sync to the other target if both exist
    if (historyFeed && list) list.innerHTML = html;
  },

  toggleVoiceLog: function() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      this.showToast('Voice Error', 'Speech recognition is not supported in this browser.', 'error');
      return;
    }
    
    const inputEl = document.getElementById('aiLogInput');
    
    if (this.voiceRecording) {
      if (this.serviceRecog) this.serviceRecog.stop();
      this.setVoiceState(false);
      return;
    }
    
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.serviceRecog = new SR();
    this.serviceRecog.lang = 'en-US';
    this.serviceRecog.interimResults = false;
    
    this.serviceRecog.onresult = (e) => {
      const text = e.results[0][0].transcript;
      if (inputEl) {
        inputEl.value = text;
        this.showToast('Speech Recognized', `Recognized: "${text}"`, 'success');
        this.quickLogService();
      }
    };
    
    this.serviceRecog.onend = () => this.setVoiceState(false);
    this.serviceRecog.onerror = () => this.setVoiceState(false);
    
    this.serviceRecog.start();
    this.setVoiceState(true);
  },

  setVoiceState: function(active) {
    this.voiceRecording = active;
    const btn = document.getElementById('voiceMicBtn');
    if (btn) {
      btn.innerHTML = active ? '<span class="animate-pulse">🛑</span>' : '<span class="drop-shadow-lg">🎙️</span>';
      btn.style.background = active ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : '';
    }
  },

  quickLogService: function() {
    const inputEl = document.getElementById('aiLogInput');
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;

    // ── Keyword-based NLP Parser ──────────────────────────────────────────
    const lowerText = text.toLowerCase();
    
    // 1. Identify Component Type
    let type = null;
    let typeText = 'Maintenance';
    let icon = '🔧';
    
    if (lowerText.includes('oil')) {
      type = 'oil';
      typeText = '🛢️ Oil Change';
      icon = '🛢️';
    } else if (lowerText.includes('battery')) {
      type = 'battery';
      typeText = '🔋 Battery Replacement';
      icon = '🔋';
    } else if (lowerText.includes('tire') || lowerText.includes('wheel') || lowerText.includes('rotate')) {
      type = 'tireRotation';
      typeText = '🛞 Tire Rotation';
      icon = '🛞';
    } else if (lowerText.includes('brake') || lowerText.includes('pad')) {
      type = 'brakes';
      typeText = '🛑 Brake Pads Replacement';
      icon = '🛑';
    } else if (lowerText.includes('filter') || lowerText.includes('cabin') || lowerText.includes('air')) {
      type = 'airFilter';
      typeText = '💨 Air Filter Replacement';
      icon = '💨';
    } else if (lowerText.includes('coolant') || lowerText.includes('flush') || lowerText.includes('radiator')) {
      type = 'coolant';
      typeText = '🌡️ Coolant Flush';
      icon = '🌡️';
    } else if (lowerText.includes('trans') || lowerText.includes('gear')) {
      type = 'transmission';
      typeText = '⚙️ Transmission Fluid Service';
      icon = '⚙️';
    } else if (lowerText.includes('spark') || lowerText.includes('plug')) {
      type = 'sparkPlugs';
      typeText = '⚡ Spark Plugs';
      icon = '⚡';
    } else if (lowerText.includes('fuel') || lowerText.includes('gas') || lowerText.includes('petrol') || lowerText.includes('tank')) {
      type = 'fuel';
      typeText = '⛽ Fuel Fill-Up';
      icon = '⛽';
    }

    if (!type) {
      this.showToast('Unrecognized Service', "I couldn't identify the service type. Try saying 'changed oil', 'replaced brakes', or 'rotated tires'.", 'warning');
      return;
    }

    // 2. Extract Mileage
    let mileage = parseInt(this.vehicle.mileage) || 0;
    
    // Check for "k" shorthand (e.g. "at 45k", "40k miles")
    const kMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*k/);
    if (kMatch) {
      mileage = Math.round(parseFloat(kMatch[1]) * 1000);
    } else {
      // Check for raw number patterns (e.g., "at 45000", "at 45,000", "at 45.000")
      const numMatch = lowerText.replace(/[,.]/g, '').match(/(?:at|@|mileage|miles)?\s*(\d{4,6})/);
      if (numMatch) {
        mileage = parseInt(numMatch[1]);
      }
    }

    // 3. Extract Price/Cost if mentioned
    let cost = '--';
    const costMatch = lowerText.match(/(?:\$|£|€|n|₦)\s*(\d+(?:\.\d+)?)/) || lowerText.match(/(\d+(?:\.\d+)?)\s*(?:dollars|euros|pounds|naira)/);
    if (costMatch) {
      cost = this.formatPrice(parseFloat(costMatch[1]));
    } else {
      // Look up estimated cost in database as smart fallback
      const MAINT_SERVICES = [
        { key:'oil', parts:55, labor:40 },
        { key:'battery', parts:150, labor:30 },
        { key:'tireRotation', parts:0, labor:25 },
        { key:'airFilter', parts:22, labor:15 },
        { key:'brakes', parts:120, labor:100 },
        { key:'coolant', parts:28, labor:60 },
        { key:'transmission', parts:45, labor:80 },
        { key:'sparkPlugs', parts:60, labor:50 },
      ];
      const match = MAINT_SERVICES.find(s => s.key === type);
      if (match) {
        cost = this.formatPrice(match.parts + match.labor);
      }
    }

    // 3.5. Extract Action Context (Replaced vs Inspected)
    let actionContext = 'logged';
    if (lowerText.includes('replace') || lowerText.includes('change') || lowerText.includes('new') || lowerText.includes('swap')) {
      actionContext = 'replaced';
    } else if (lowerText.includes('check') || lowerText.includes('inspect') || lowerText.includes('test')) {
      actionContext = 'inspected';
    }

    // 3.8. NLP Date Extraction Engine
    let logDate = new Date();
    if (lowerText.includes('yesterday')) {
      logDate.setDate(logDate.getDate() - 1);
    } else {
      const daysMatch = lowerText.match(/(\d+)\s*days?\s*ago/);
      const weeksMatch = lowerText.match(/(\d+)\s*weeks?\s*ago/);
      const monthsMatch = lowerText.match(/(\d+)\s*months?\s*ago/);
      
      if (daysMatch) {
        logDate.setDate(logDate.getDate() - parseInt(daysMatch[1]));
      } else if (weeksMatch) {
        logDate.setDate(logDate.getDate() - (parseInt(weeksMatch[1]) * 7));
      } else if (monthsMatch) {
        logDate.setMonth(logDate.getMonth() - parseInt(monthsMatch[1]));
      } else if (lowerText.includes('last week')) {
        logDate.setDate(logDate.getDate() - 7);
      } else if (lowerText.includes('last month')) {
        logDate.setMonth(logDate.getMonth() - 1);
      }
    }

    // 4. Save to Service Log
    this.serviceLog[type] = {
      mileage: mileage,
      date: logDate.toISOString()
    };
    localStorage.setItem('serviceLog', JSON.stringify(this.serviceLog));

    // 5. Save to Maintenance Logs
    const actionLabel = actionContext === 'inspected' ? 'Inspected' : 'Replaced';
    const logDesc = `${icon} parsed AI: ${actionLabel} ${typeText.substring(2)} (at ${mileage.toLocaleString()} mi)`;
    this.maintLogs.unshift({
      desc: logDesc,
      cost: cost,
      date: logDate.toLocaleDateString()
    });
    localStorage.setItem('desktopMaintLogs', JSON.stringify(this.maintLogs));

    // 6. Sync with Mobile History
    try {
      let mobileHist = JSON.parse(localStorage.getItem('maintenanceHistory')) || [];
      mobileHist.unshift({
        id: Date.now(),
        type: 'auto',
        name: typeText.substring(2),
        icon: icon,
        date: logDate.toISOString(),
        mileage: mileage,
        cost: cost
      });
      if (mobileHist.length > 50) mobileHist.pop();
      localStorage.setItem('maintenanceHistory', JSON.stringify(mobileHist));
    } catch(e) {}

    // Deep Telemetry Resets
    if (actionContext !== 'inspected') {
      try {
        let aiTripStats = JSON.parse(localStorage.getItem('aiTripStats') || '{"totalHardBrakes":0, "oilStressDistance":0, "totalFuelBurnedGal":0}');
        if (type === 'fuel') {
          aiTripStats.totalFuelBurnedGal = 0;
        } else if (type === 'oil') {
          aiTripStats.oilStressDistance = 0;
        }
        localStorage.setItem('aiTripStats', JSON.stringify(aiTripStats));
      } catch(e) {}
    }

    // 7. Refresh Telemetry / UI
    inputEl.value = '';
    this.renderMaintenancePlanner();
    this.renderMaintenanceLogs();
    this.renderDashboardTelemetry();

    // 8. Show confirmation Toast
    this.showToast('AI Parse Success', `Added ${typeText.substring(2)} at ${mileage.toLocaleString()} miles (Cost: ${cost}).`, 'success');
  },

  // -----------------------------------------
  // EMERGENCY LOGIC
  // -----------------------------------------
  initSOSSlider: function(e) {
    if(e) {
      this.startSOSDrag(e);
    }
  },

  startSOSDrag: function(e) {
    const handle = document.getElementById('sosHandle');
    const track = document.getElementById('sosTrack');
    const container = document.getElementById('sosSlider');
    if(!handle || !container) return;

    let isDragging = true;
    let startX = e.clientX || (e.touches && e.touches[0].clientX);
    let maxW = container.offsetWidth - handle.offsetWidth - 10;
    
    handle.style.transition = 'none';
    if(track) track.style.transition = 'none';

    const onMove = (ev) => {
      if(!isDragging) return;
      let curX = ev.clientX || (ev.touches && ev.touches[0].clientX);
      let diff = curX - startX;
      if(diff < 0) diff = 0;
      if(diff > maxW) diff = maxW;
      
      handle.style.transform = `translateX(${diff}px)`;
      if(track) track.style.width = `${diff + (handle.offsetWidth / 2)}px`;
      
      if(diff >= maxW) {
        isDragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        
        handle.innerHTML = '🚨';
        setTimeout(() => { window.location.href = 'tel:112'; }, 800);
      }
    };

    const onEnd = () => {
      if(!isDragging) return;
      isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      
      handle.style.transition = 'transform 0.3s ease';
      handle.style.transform = 'translateX(0)';
      if(track) {
        track.style.transition = 'width 0.3s ease';
        track.style.width = '0px';
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
  },

  showToast: function(title, msg, type) {
    if (typeof showToast === 'function') {
      showToast(title, msg, type);
    } else {
      alert(`${title}: ${msg}`);
    }
  },

  // =====================================================
  // FEATURE: TRIAGE HELP (AI CHAT)
  // =====================================================
  openTriageHelpModal: function() {
    const modal = document.getElementById('triageHelpModal');
    const content = document.getElementById('triageHelpContent');
    if(modal && content) {
      modal.style.display = 'flex';
      setTimeout(() => {
        content.style.transform = 'translateX(0)';
      }, 10);
    }
  },

  closeTriageHelpModal: function() {
    const modal = document.getElementById('triageHelpModal');
    const content = document.getElementById('triageHelpContent');
    if(modal && content) {
      content.style.transform = 'translateX(100%)';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 400);
    }
  },

  sendTriageHelpMessage: function() {
    const input = document.getElementById('triageHelpInput');
    const stream = document.getElementById('triageHelpMessageStream');
    if (!input || !stream) return;

    const msgText = input.value.trim();
    if (!msgText) return;

    // Add user message
    const userMsg = document.createElement('div');
    userMsg.style.cssText = "display:flex; flex-direction:column; align-items:flex-end; margin-top:8px;";
    userMsg.innerHTML = `
      <div style="font-size:10px; color:rgba(255,255,255,0.4); margin-bottom:6px; font-family:'Space Mono',monospace;">You • Just now</div>
      <div style="background:#00d084; color:black; padding:16px 20px; border-radius:20px 20px 6px 20px; font-size:14px; font-weight:bold; max-width:85%; box-shadow:0 4px 15px rgba(0,208,132,0.2);">
        ${msgText}
      </div>
    `;
    stream.appendChild(userMsg);
    input.value = '';
    stream.scrollTop = stream.scrollHeight;

    // Simulate AI response
    setTimeout(() => {
      const aiMsg = document.createElement('div');
      aiMsg.style.cssText = "display:flex; flex-direction:column; align-items:flex-start; margin-top:8px; animation:fadeInUp 0.4s ease;";
      
      let responseText = "I'm a simulated AI helper. To truly assist you with complex app questions, we would route this through the real backend AI engine. But rest assured, I'm here to help!";
      if (msgText.toLowerCase().includes('percentage') || msgText.toLowerCase().includes('health')) {
        responseText = "The percentage on your car's picture is your Overall Vehicle Health Score! It uses AI and your logged maintenance history to predict wear and tear across your car's components.";
      } else if (msgText.toLowerCase().includes('log') || msgText.toLowerCase().includes('service')) {
        responseText = "To log a service, simply tap on the 'Component Vitals' section or any specific component card. You can override the AI estimate with your real-world maintenance data!";
      } else if (msgText.toLowerCase().includes('obd')) {
        responseText = "AutoTriage is designed to sync with hardware OBD-II scanners to fetch real-time data, but since this is a demo, we simulate that telemetry using smart defaults and AI estimation.";
      }

      aiMsg.innerHTML = `
        <div style="font-size:10px; color:rgba(255,255,255,0.4); margin-bottom:6px; font-family:'Space Mono',monospace;">Triage AI • Just now</div>
        <div style="background:#1c1c1e; border:1px solid rgba(255,255,255,0.1); padding:16px 20px; border-radius:20px 20px 20px 6px; font-size:14px; color:white; line-height:1.6; max-width:85%;">
          ${responseText}
        </div>
      `;
      stream.appendChild(aiMsg);
      stream.scrollTop = stream.scrollHeight;
    }, 1500);
  },

  // =====================================================
  // FEATURE: VIRTUAL VEHICLE TWIN (TRIP TRACKER LOGIC)
  // =====================================================

  passengerPromptCallback: null,

  askPassengerPrompt: function(callback) {
    const modal = document.getElementById('passengerPromptModal');
    const makeSpan = document.getElementById('promptVehicleName');
    if (myVehicle && myVehicle.make && makeSpan) {
      makeSpan.innerText = myVehicle.make;
    }
    if (modal) modal.style.display = 'flex';
    this.passengerPromptCallback = callback;
  },

  closePassengerPrompt: function(isDriver) {
    const modal = document.getElementById('passengerPromptModal');
    if (modal) modal.style.display = 'none';
    if (typeof this.passengerPromptCallback === 'function') {
      this.passengerPromptCallback(isDriver);
      this.passengerPromptCallback = null;
    }
  },

  quickLog: function(type) {
    if (!myVehicle || !myVehicle.make) {
      this.showToast('Error', 'Register a vehicle first!', 'error');
      return;
    }
    const currentMileage = parseInt(myVehicle.mileage) || 0;
    serviceLog[type] = {
      date: new Date().toISOString(),
      mileage: currentMileage
    };
    localStorage.setItem('serviceLog', JSON.stringify(serviceLog));
    
    if (type === 'fuel') {
      let aiTripStats = JSON.parse(localStorage.getItem('aiTripStats') || '{"totalHardBrakes":0, "oilStressDistance":0, "totalFuelBurnedGal":0}');
      aiTripStats.totalFuelBurnedGal = 0;
      localStorage.setItem('aiTripStats', JSON.stringify(aiTripStats));
      this.showToast('Tank Filled', 'Virtual fuel gauge reset to 100%.', 'success');
    } else if (type === 'oil') {
      let aiTripStats = JSON.parse(localStorage.getItem('aiTripStats') || '{"totalHardBrakes":0, "oilStressDistance":0, "totalFuelBurnedGal":0}');
      aiTripStats.oilStressDistance = 0;
      localStorage.setItem('aiTripStats', JSON.stringify(aiTripStats));
      this.showToast('Oil Changed', 'Oil life reset to 100%.', 'success');
    }
    
    this.renderGarageDashboard();
    this.renderDashboardTelemetry();
  },

  updateOdometerUI: function(newMileage) {
    const input = document.getElementById('mileageUpdateInput');
    if (input) input.value = newMileage;
    
    // Show active tracking indicators
    const ind1 = document.getElementById('activeTrackingIndicator');
    const ind2 = document.getElementById('trackingDot');
    if (ind1) ind1.style.display = 'block';
    if (ind2) ind2.style.display = 'inline-block';
    
    this.renderGarageDashboard();
    this.renderDashboardTelemetry();
  },

  broadcastLocation: function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const msg = `EMERGENCY SOS: I need help. My current location is: https://www.google.com/maps?q=${lat},${lng}`;
          window.location.href = `sms:?body=${encodeURIComponent(msg)}`;
        },
        (error) => {
          const msg = `EMERGENCY SOS: I need help. My phone's location access is disabled. Please call me immediately.`;
          window.location.href = `sms:?body=${encodeURIComponent(msg)}`;
        }
      );
    } else {
      alert("Unable to detect location. Please dial 112 immediately.");
    }
  },

  // -----------------------------------------
  // MISC MODALS & TOOLS
  // -----------------------------------------
  searchPart: async function(force = false) {
    const input = document.getElementById('partSearch');
    const resultsDiv = document.getElementById('partsResults');
    if(!input || !resultsDiv) return;
    
    const query = input.value.trim();
    
    const hasVehicle = this.vehicle && this.vehicle.make;
    
    // If not forced, we have no query, and no active vehicle profile exists, show the explore placeholder
    if (!force && !query && !hasVehicle) {
      resultsDiv.innerHTML = `
        <div class="col-span-2 text-center py-16 px-8 rounded-[24px] bg-[#141517]/40 border border-white/5 border-dashed relative overflow-hidden">
          <div class="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>
          <div class="text-[44px] mb-4 filter drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] animate-bounce" style="animation-duration: 3s;">🔍</div>
          <div class="text-[15px] font-mono text-white font-bold mb-2 uppercase tracking-wider">Explore Parts Catalog</div>
          <div class="text-[12px] font-mono text-gray-400 max-w-lg mx-auto leading-relaxed">
            Enter a part name (e.g. <strong class="text-blue-400">Brake Pads</strong>, <strong class="text-blue-400">Battery</strong>, or <strong class="text-blue-400">Spark Plugs</strong>) above and click <strong class="text-white">Search</strong> to search real-time prices, availability and local shop matching.
          </div>
        </div>
      `;
      return;
    }
    
    // Update currency tip dynamically based on current GlobalContext
    const currencyTip = document.getElementById('partsCurrencyTip');
    if (currencyTip && window.GlobalContext && window.GlobalContext.isInitialized) {
      const cur = window.GlobalContext.currency;
      const rates = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': 'CA$', 'AUD': 'A$', 'INR': '₹', 'NGN': '₦', 'ZAR': 'R', 'JPY': '¥', 'CNY': '¥'
      };
      const curSymbol = rates[cur] || '$';
      currencyTip.innerHTML = `Prices shown are <strong class="text-[#4da6ff]">${cur} (${curSymbol})</strong> estimates. Actual prices vary by location, brand, and vehicle model.`;
    }

    const queryLower = query.toLowerCase();
    
    if (typeof searchParts === 'function') {
      const make = this.vehicle && this.vehicle.make ? this.vehicle.make : '';
      const model = this.vehicle && this.vehicle.model ? this.vehicle.model : '';
      const year = this.vehicle && this.vehicle.year ? this.vehicle.year : '';
      const vtype = this.vehicle && this.vehicle.vtype ? this.vehicle.vtype : 'Car';
      
      const result = await searchParts(queryLower, make, model, year, vtype);
      const parts = result.parts;
      let shops = result.shops || [];
      
      // --- REAL GPS LOCATION TRACKING ---
      // DISABLED to guarantee instant 0ms load times for auto parts
      /*
      if (navigator.geolocation && window.GlobalContext && window.GlobalContext.findNearbyAutoShops) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { maximumAge: 60000, timeout: 300 });
          });
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const realShops = await window.GlobalContext.findNearbyAutoShops(lat, lng);
          if (realShops && realShops.length > 0) {
            shops = realShops.map(s => ({
              name: s.name,
              address: s.address,
              distance: s.distance,
              url: s.mapLink
            }));
          }
        } catch (err) {
          console.warn('Geolocation failed/denied. Falling back to regional proxy shops.', err);
        }
      }
      */
      
      // Determine local text dynamically
      let locText = 'Local Match';
      if (window.GlobalContext && window.GlobalContext.isInitialized) {
        const city = window.GlobalContext.city;
        const state = window.GlobalContext.state;
        const country = window.GlobalContext.country;
        if (city) {
          locText = `${city}, ${country}`;
        } else if (state) {
          locText = `${state}, ${country}`;
        } else {
          locText = `${country}`;
        }
      }

      const buildShopsHtml = (shopsList) => {
        if (!shopsList || shopsList.length === 0) {
          return `<div class="text-[10px] text-gray-500 font-mono italic">No physical store matched. Order online via checkout links.</div>`;
        }
        return shopsList.map(s => {
          return `<a href="${s.url}" target="_blank" class="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] transition-all border border-white/5 group">
            <div class="flex items-center gap-2">
              <span class="text-[12px] opacity-70 group-hover:opacity-100 transition-opacity">🏪</span>
              <span class="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors font-mono">${s.name}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[9px] text-[#00d084] font-mono bg-[#00d084]/10 px-1.5 py-0.5 rounded">${s.dist}</span>
              <span class="text-[10px] opacity-50 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5">→</span>
            </div>
          </a>`;
        }).join('');
      };
      
      let carHeaderHtml = '';
      if (result.carThumbnail) {
        carHeaderHtml = `
          <div class="col-span-2 panel p-6 border-white/10 bg-gradient-to-r from-blue-950/40 via-blue-900/10 to-black/80 flex flex-col md:flex-row gap-6 items-center rounded-2xl mb-4 relative overflow-hidden">
            <div class="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            <img src="${result.carThumbnail}" class="w-32 h-24 object-cover rounded-xl border border-white/10 shadow-lg relative z-10" alt="${year} ${make} ${model}" onerror="this.style.display='none'"/>
            <div class="flex-1 text-center md:text-left relative z-10">
              <div class="text-[12px] text-blue-400 font-mono tracking-widest uppercase font-bold mb-1">Live Parts Matching</div>
              <div class="text-[28px] font-bebas text-white tracking-wider leading-none">${year} ${make.toUpperCase()} ${model.toUpperCase()}</div>
              <div class="text-[11px] text-gray-400 font-mono mt-2">Scalable active inventory indexed from global databases. Prices auto-calibrated for ${vtype} specification.</div>
            </div>
          </div>
        `;
      }
      
      if (!parts || parts.length === 0) {
        resultsDiv.innerHTML = (carHeaderHtml ? carHeaderHtml : '') + `<div class="col-span-2 text-center text-gray-500 font-mono mt-12 py-8 bg-[#141517]/20 rounded-2xl border border-white/5">No parts found matching "${query}"</div>`;
        return;
      }
      
      let html = carHeaderHtml;
      parts.forEach(p => {
        html += `
          <div class="panel p-6 border-white/10 hover:border-white/20 transition-all duration-300 flex flex-col gap-5 justify-between bg-gradient-to-b from-[#1c1c1e] to-[#141517] shadow-xl hover:shadow-2xl">
            <div>
              <div class="flex justify-between items-start gap-4">
                <div class="font-bold text-white font-mono text-[14px] leading-tight tracking-wide">${p.name}</div>
                <span class="bg-emerald-500/10 text-[#00d084] border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">In Stock</span>
              </div>
              <p class="text-[11px] text-gray-400 font-mono leading-relaxed mt-3">${p.desc}</p>
            </div>
            
            <div class="mt-2">
              <div class="flex justify-between items-center py-2.5">
                <div class="text-[10px] text-white/40 font-mono uppercase tracking-wider">Aftermarket</div>
                <div class="text-[18px] font-bold text-[#00d084] font-mono">${p.price}</div>
              </div>
              <div class="flex justify-between items-center border-t border-white/5 pt-2.5 mt-1">
                <div class="text-[10px] text-white/40 font-mono uppercase tracking-wider">OEM (Genuine)</div>
                <div class="text-[16px] font-bold text-white font-mono">${p.oem}</div>
              </div>
              
              <!-- Commission referral link disclaimer badge -->
              <div class="mt-3 flex items-center justify-between text-[9px] font-mono text-blue-400 bg-blue-500/5 border border-blue-500/10 px-3 py-1.5 rounded-xl">
                <span>💸 Partner Store (Commission Link)</span>
                <span class="opacity-60">Verified Deal</span>
              </div>
              
              <div class="mt-5">
                <button onclick="app.openCheckoutFlow('${p.name.replace(/'/g, "\\'")}', '${p.price}', '${p.oem}', '${p.checkoutUrl}', '${p.alternativeUrl}')" class="w-full text-center bg-blue-600 hover:bg-blue-500 border border-transparent text-white font-mono text-[11px] font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1 uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.3)]">Buy Now 🛒</button>
              </div>
            </div>
            
            <!-- WHERE TO BUY -->
            <div class="mt-4 pt-4 border-t border-white/5">
              <div class="flex justify-between items-center mb-3">
                <div class="text-[9px] text-white/30 font-mono uppercase tracking-widest">📍 Where to Buy (${locText})</div>
              </div>
              <div class="flex flex-col gap-2">
                ${buildShopsHtml(shops)}
              </div>
            </div>
          </div>
        `;
      });
      resultsDiv.innerHTML = html;
    } else {
      resultsDiv.innerHTML = `<div class="col-span-2 text-center text-gray-500 font-mono mt-8">Parts Database Loading...</div>`;
    }
  },

  filterPartCategory: function(cat) {
    const buttons = document.querySelectorAll('.app-part-chip');
    buttons.forEach(b => {
      b.style.background = 'rgba(255,255,255,0.03)';
      b.style.color = '#888';
      b.style.borderColor = 'rgba(255,255,255,0.1)';
      b.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.app-part-chip[data-cat="${cat}"]`);
    if(activeBtn) {
      activeBtn.style.background = 'rgba(77,166,255,0.1)';
      activeBtn.style.color = '#4da6ff';
      activeBtn.style.borderColor = 'rgba(77,166,255,0.3)';
      activeBtn.classList.add('active');
    }

    const input = document.getElementById('partSearch');
    if (input) {
      if(cat === 'all') {
        input.value = '';
      } else {
        input.value = cat;
      }
    }
    this.searchPart(true);
  },

  openProfileDrawer: function() {
    // Sync with auth.js
    const savedUser = localStorage.getItem('autotriage_user');
    const avatarEl = document.getElementById('profileDrawerAvatar');
    const nameEl = document.getElementById('profileDrawerName');
    const statusEl = document.getElementById('profileDrawerStatus');
    const roleSwitcher = document.getElementById('roleSwitcherContainer');

    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (nameEl) nameEl.textContent = user.name.toUpperCase();
      if (avatarEl) avatarEl.innerHTML = `<div style="width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#00d084,#4da6ff);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;color:var(--bg);">${user.name.slice(0,2).toUpperCase()}</div>`;
      if (statusEl) statusEl.textContent = user.isPro ? 'Verified Pro Mechanic' : 'Verified Driver Account';
      if (roleSwitcher) roleSwitcher.style.display = user.isPro ? 'block' : 'none';
      
      const hudBtn = document.getElementById('telemetryHUDButton');
      if (hudBtn) hudBtn.style.display = user.isPro ? 'flex' : 'none';
      
      const applyBtn = document.getElementById('applyProBtn');
      if (applyBtn && user.isPro) {
        applyBtn.innerHTML = `
          <div style="font-size:20px;">✅</div>
          <div>
            <div style="font-weight:bold;font-size:13px;color:#00d084;">Pro Account Active</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px;">You are verified on AutoTriage</div>
          </div>
        `;
        applyBtn.onclick = null;
      }
    } else {
      if (nameEl) nameEl.textContent = 'Guest User';
      if (avatarEl) avatarEl.textContent = '👤';
      if (statusEl) statusEl.textContent = 'Local Device Profile';
      if (roleSwitcher) roleSwitcher.style.display = 'none';
      const hudBtn = document.getElementById('telemetryHUDButton');
      if (hudBtn) hudBtn.style.display = 'none';
    }

    document.getElementById('profileDrawer').style.display = 'flex';
    setTimeout(() => {
      document.getElementById('profileDrawerPanel').style.transform = 'translateX(0)';
    }, 10);
  },

  closeProfileDrawer: function() {
    document.getElementById('profileDrawerPanel').style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.getElementById('profileDrawer').style.display = 'none';
    }, 400);
  },

  exportVehicleData: function() {
    const data = {
      vehicle: this.vehicle,
      diagnostics: this.diagnosisHistory,
      maintenance: this.maintLogs,
      fuel: this.fuelLogs,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AutoTriage_Export_${this.vehicle.make || 'Data'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  factoryResetApp: function() {
    if (confirm("⚠️ WARNING: This will permanently delete all vehicle data, diagnostic history, and settings from this device. Proceed?")) {
      localStorage.clear();
      location.reload();
    }
  },

  openRatingModal: function(name) {
    this.ratingMechName = name;
    document.getElementById('ratingMechName').textContent = name;
    document.getElementById('ratingModal').style.display = 'flex';
    this.setRatingStars(0);
  },

  closeRatingModal: function() {
    document.getElementById('ratingModal').style.display = 'none';
  },

  setRatingStars: function(num) {
    this.ratingVal = num;
    const stars = document.querySelectorAll('.star-opt');
    stars.forEach((s, i) => {
      if(i < num) { s.style.color = '#facc15'; s.classList.remove('text-white/20'); }
      else { s.style.color = ''; s.classList.add('text-white/20'); }
    });
  },

  submitRating: function() {
    if(this.ratingVal === 0) return alert("Please select a star rating.");
    alert(`Thank you for rating ${this.ratingMechName} ${this.ratingVal} stars!`);
    this.closeRatingModal();
  },

  closeRepairModal: function() {
    document.getElementById('repairModal').style.display = 'none';
  },

  // -----------------------------------------
  // PARTS LOGIC
  // -----------------------------------------


  findLocalShopFor: function(partName) {
    this.switchTab('mechanics');
    const input = document.getElementById('mechQ');
    if (input) {
      input.value = partName;
      this.filterMechs();
    }
  },

  // -----------------------------------------
  // HISTORY & GARAGE LOGIC
  // -----------------------------------------
  renderRecentScans: function() {
    const list = document.getElementById('historyList');
    if(!list) return;
    
    if(this.diagnosisHistory.length === 0) {
      list.innerHTML = `<div class="text-center text-[#8e93a0] font-mono text-[14px] mt-8">No AI Diagnoses run yet.</div>`;
      return;
    }

    let html = '';
    this.diagnosisHistory.forEach(scan => {
      let color = scan.status.includes('CRITICAL') ? 'text-red-500 bg-red-500/10 border-red-500/20' : 
                 scan.status.includes('HIGH') ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' : 
                 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                 
      html += `
        <div class="panel p-6 border-white/10 flex flex-col gap-3">
          <div class="flex justify-between items-start">
            <div class="text-[14px] text-white font-bold font-mono w-2/3">${scan.title}</div>
            <div class="px-3 py-1 rounded border font-bold text-[10px] tracking-wider uppercase font-mono ${color}">${scan.status}</div>
          </div>
          <div class="text-[12px] text-[#8e93a0] font-mono mt-2 flex justify-between">
            <span>Query: "${scan.problem}"</span>
            <span class="text-white/40">${scan.time}</span>
          </div>
        </div>
      `;
    });
    list.innerHTML = html;
  },

  saveVehicleProfile: function() {
    const make = document.getElementById('vehMake').value.trim();
    const model = document.getElementById('vehModel').value.trim();
    const year = document.getElementById('vehYear').value.trim();
    const mileage = document.getElementById('vehMileage').value.trim();
    const vtypeSelect = document.getElementById('vehVType');
    const vtype = vtypeSelect ? vtypeSelect.value : 'Car';
    
    if(!make || !model || !year) return alert("Please fill in Make, Model, and Year.");
    
    this.vehicle = { make, model, year, mileage: parseInt(mileage) || 0, vtype };
    localStorage.setItem('desktopVehicle', JSON.stringify(this.vehicle));
    localStorage.setItem('myVehicle', JSON.stringify(this.vehicle));
    
    this.renderGarageDashboard();
    this.renderDashboardTelemetry();
    this.fetchCarImage(make, model, year);
  },

  saveAffiliateCredentials: function() {
    const ebay = document.getElementById('affEbay').value.trim();
    const amazon = document.getElementById('affAmazon').value.trim();
    const jumia = document.getElementById('affJumia').value.trim();
    
    if (ebay) localStorage.setItem('at_ebay_campid', ebay);
    else localStorage.removeItem('at_ebay_campid');
    
    if (amazon) localStorage.setItem('at_amazon_tag', amazon);
    else localStorage.removeItem('at_amazon_tag');
    
    if (jumia) localStorage.setItem('at_jumia_kol', jumia);
    else localStorage.removeItem('at_jumia_kol');
    
    alert("Partner monetization tags updated successfully!");
    this.searchPart(true);
  },

  updateMileageCheckin: function() {
    const input = document.getElementById('mileageUpdateInput');
    if(!input || !input.value) return;
    const newM = parseInt(input.value);
    if(newM < this.vehicle.mileage) return alert("New mileage cannot be lower than current!");
    
    this.vehicle.mileage = newM;
    localStorage.setItem('desktopVehicle', JSON.stringify(this.vehicle));
    localStorage.setItem('myVehicle', JSON.stringify(this.vehicle));
    
    document.getElementById('mileageUpdateInput').value = '';
    document.getElementById('mileageLastUpdate').textContent = "Just now";
    this.renderGarageDashboard();
    this.renderDashboardTelemetry();
  },

  renderGarageDashboard: function() {
    const setup = document.getElementById('vehicleSetup');
    const dash = document.getElementById('vehicleDashboard');
    const card = document.getElementById('vehicleCard');
    
    if(!setup || !dash || !card) return;

    if(!this.vehicle || !this.vehicle.make) {
      setup.style.display = 'block';
      dash.style.display = 'none';
      return;
    }
    
    setup.style.display = 'none';
    dash.style.display = 'flex';
    
    const v = this.vehicle;
    const vitalsQuick = OBDModule ? OBDModule.computeLifecycleVitals(v) : {};
    const vitalsKeys = Object.keys(vitalsQuick);
    let vitalsSum = 0;
    vitalsKeys.forEach(k => { vitalsSum += (vitalsQuick[k].pct !== undefined ? vitalsQuick[k].pct : vitalsQuick[k]); });
    const heroHealth = vitalsKeys.length ? Math.round(vitalsSum / vitalsKeys.length) : 100;
    const heroColor = heroHealth > 80 ? '#00d084' : heroHealth > 50 ? '#ff8800' : 'var(--accent)';
    
    const imgHtml = this.vehicleImageUrl 
      ? `<img src="${this.vehicleImageUrl}" class="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl transform scale-110 pointer-events-none"/>
         <img src="${this.vehicleImageUrl}" class="absolute inset-0 w-full h-full object-contain object-center opacity-80 drop-shadow-2xl transition-transform duration-[20s] ease-out group-hover:scale-[1.05]" alt="${v.make} ${v.model}"/>`
      : `<div class="absolute inset-0 flex items-center justify-center"><span style="font-size:200px; opacity:0.04; filter:blur(2px);">🚗</span></div>`;

    card.innerHTML = `
      ${imgHtml}
      <!-- Cinematic layered overlays -->
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/10 pointer-events-none"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent pointer-events-none"></div>
      <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(ellipse at 70% 50%, ${heroColor}18 0%, transparent 60%);"></div>
      
      <!-- Top HUD Bar -->
      <div class="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 pointer-events-none">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full animate-ping" style="background:${heroColor};"></div>
          <span class="text-[10px] font-mono tracking-[0.4em] uppercase font-bold" style="color:${heroColor};">LIVE TELEMETRY</span>
        </div>
        <div class="flex items-center gap-6">
          <div class="text-center">
            <div class="text-[10px] text-white/30 font-mono uppercase tracking-wider">HEALTH</div>
            <div class="text-[18px] font-bebas font-bold" style="color:${heroColor}; text-shadow:0 0 20px ${heroColor}80;">${heroHealth}%</div>
          </div>
          <div class="w-px h-8 bg-white/10"></div>
          <div class="text-center">
            <div class="text-[10px] text-white/30 font-mono uppercase tracking-wider">ODOMETER</div>
            <div class="text-[18px] font-bebas text-white">${(parseInt(v.mileage) || 0).toLocaleString()} <span class="text-[11px] text-white/40">MI</span></div>
          </div>
          <div class="w-px h-8 bg-white/10"></div>
          <div class="text-center">
            <div class="text-[10px] text-white/30 font-mono uppercase tracking-wider">STATUS</div>
            <div class="text-[11px] font-mono font-bold tracking-widest" style="color:${heroColor};">${heroHealth > 80 ? 'OPTIMAL' : heroHealth > 50 ? 'MONITOR' : 'SERVICE'}</div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="relative z-10 p-8 md:p-10 w-full flex flex-col md:flex-row justify-between items-end gap-6">
        <div class="flex-1 min-w-0">
          <div class="text-[10px] font-mono tracking-[0.5em] uppercase font-bold mb-3 flex items-center gap-2" style="color:${heroColor}; text-shadow:0 0 15px ${heroColor}80;">
            <span>⬡</span> PRIMARY GARAGE VEHICLE
          </div>
          <div class="font-bebas leading-[0.82] text-white drop-shadow-[0_10px_40px_rgba(0,0,0,0.9)]" style="font-size:clamp(60px,9vw,120px); text-shadow:0 0 60px rgba(255,255,255,0.08), 0 4px 30px rgba(0,0,0,0.9);">
            ${v.year || ''}&nbsp;${(v.make || '').toUpperCase()}
          </div>
          <div class="flex items-center gap-4 mt-3 flex-wrap">
            <span class="text-[22px] md:text-[28px] font-mono text-white/60 tracking-widest drop-shadow-lg">${(v.model || '').toUpperCase()}</span>
            ${v.vtype ? `<span class="px-3 py-1 rounded-full text-[9px] uppercase font-bold font-mono tracking-[0.2em] border" style="background:${heroColor}15; border-color:${heroColor}40; color:${heroColor};">${v.vtype.toUpperCase()}</span>` : ''}
            <span class="px-3 py-1 bg-white/5 rounded-full text-[9px] uppercase text-white/50 border border-white/10 font-mono tracking-widest">Active Profile</span>
          </div>
        </div>
        
        <!-- Compact Actions Card -->
        <div class="shrink-0 flex flex-col items-end gap-3 backdrop-blur-2xl bg-black/60 border border-white/10 p-5 rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.7)] hover:border-white/20 transition-all duration-500">
          <div class="text-[9px] text-white/40 font-mono tracking-widest uppercase text-right">Vehicle Controls</div>
          <button onclick="app.openLogService()" class="text-[10px] font-mono font-bold tracking-widest uppercase px-5 py-2.5 rounded-xl transition-all" style="background:${heroColor}15; border:1px solid ${heroColor}40; color:${heroColor};">+ LOG SERVICE</button>
          <button onclick="app.clearVehicle()" class="text-[9px] text-red-500/60 hover:text-red-400 font-mono border border-red-500/10 hover:border-red-500/30 bg-transparent hover:bg-red-500/5 px-4 py-2 rounded-xl transition-all uppercase tracking-[0.15em] cursor-pointer">Remove ✕</button>
        </div>
      </div>
      
      <!-- Bottom data strip -->
      <div class="absolute bottom-0 left-0 right-0 h-px pointer-events-none" style="background: linear-gradient(to right, transparent, ${heroColor}60, transparent);"></div>
    `;
    
    const maintList = document.getElementById('upcomingMaintList');
    if(maintList) {
      let m = parseInt(v.mileage);
      let nextOil = Math.ceil(m / 5000) * 5000;
      let nextBrakes = Math.ceil(m / 30000) * 30000;
      let nextTires = Math.ceil(m / 40000) * 40000;
      
      maintList.innerHTML = `
        <div class="flex justify-between items-center py-3 border-b border-white/5">
          <div class="text-[13px] font-mono text-white">Oil Change (Synthetic)</div>
          <div class="text-[12px] font-mono text-orange-400 font-bold">${(nextOil - m).toLocaleString()} mi</div>
        </div>
        <div class="flex justify-between items-center py-3 border-b border-white/5">
          <div class="text-[13px] font-mono text-white">Brake Pad Inspection</div>
          <div class="text-[12px] font-mono ${nextBrakes - m < 5000 ? 'text-red-400' : 'text-[#00d084]'} font-bold">${(nextBrakes - m).toLocaleString()} mi</div>
        </div>
        <div class="flex justify-between items-center py-3">
          <div class="text-[13px] font-mono text-white">Tire Rotation</div>
          <div class="text-[12px] font-mono text-[#00d084] font-bold">${(nextTires - m).toLocaleString()} mi</div>
        </div>
      `;
    }

    this.renderMaintenancePlanner();
    this.renderDailyVitals();
    this.renderGarageRides();
    this.renderDashboardTelemetry();
    this.renderSeasonalAlerts();
    this.checkRecalls();

    // Populate affiliate credentials input fields
    setTimeout(() => {
      const ebayVal = localStorage.getItem('at_ebay_campid') || '';
      const amazonVal = localStorage.getItem('at_amazon_tag') || '';
      const jumiaVal = localStorage.getItem('at_jumia_kol') || '';
      
      const ebayInput = document.getElementById('affEbay');
      const amazonInput = document.getElementById('affAmazon');
      const jumiaInput = document.getElementById('affJumia');
      
      if (ebayInput) ebayInput.value = ebayVal;
      if (amazonInput) amazonInput.value = amazonVal;
      if (jumiaInput) jumiaInput.value = jumiaVal;
    }, 50);
  },

  getVehicleMaxCapacities: function(make) {
    const m = (make || '').toLowerCase();
    let type = 'car';
    if (m.includes('ford') || m.includes('ram') || m.includes('chevrolet') || m.includes('truck') || m.includes('f-150')) type = 'truck';
    else if (m.includes('jeep') || m.includes('explorer') || m.includes('bmw') || m.includes('mercedes') || m.includes('suv') || m.includes('lexus')) type = 'suv';
    
    if (type === 'truck') return { oil: 7.5, coolant: 15.0, transmission: 12.0 };
    if (type === 'suv') return { oil: 6.0, coolant: 10.0, transmission: 10.0 };
    return { oil: 4.5, coolant: 6.0, transmission: 8.0 }; // standard car
  },

  // -----------------------------------------
  // AI SEASONAL ALERTS (vehicle-specific)
  // -----------------------------------------
  renderSeasonalAlerts: function() {
    const el = document.getElementById('seasonalAlerts');
    if (!el) return;
    const v = this.vehicle;
    if (!v || !v.make) { el.innerHTML = ''; return; }

    const month = new Date().getMonth(); // 0=Jan
    const age = new Date().getFullYear() - (parseInt(v.year) || 2020);
    const make = (v.make || '').toLowerCase();
    const vtype = (v.vtype || 'Car').toLowerCase();
    const isTruck = vtype.includes('truck');
    const isSUV = vtype.includes('suv');

    const alerts = [];

    // ── WINTER (Dec, Jan, Feb) ──────────────────────────
    if (month >= 11 || month <= 1) {
      if (age >= 3) alerts.push({
        icon: '❄️', color: '#4da6ff', shadow: '77,166,255',
        title: 'Battery Watch',
        text: `Cold weather drains batteries fast. Your ${v.year} ${v.make} is ${age} yrs old — battery capacity may be reduced. Consider a voltage test.`
      });
      alerts.push({
        icon: '🌨️', color: '#4da6ff', shadow: '77,166,255',
        title: 'Tire Pressure Drop',
        text: 'Tire pressure drops ~1 PSI per 10°F. Check and inflate your tires to the manufacturer spec this week.'
      });
      if (make.includes('ford') || make.includes('chevrolet') || make.includes('ram') || isTruck) alerts.push({
        icon: '🛻', color: '#ff8800', shadow: '255,136,0',
        title: 'Diesel Gel Risk',
        text: `Diesel engines in trucks can gel below 15°F. Use winter-blend diesel or a fuel additive for your ${v.make}.`
      });
    }

    // ── SUMMER (Jun, Jul, Aug) ──────────────────────────
    if (month >= 5 && month <= 7) {
      alerts.push({
        icon: '☀️', color: '#ff8800', shadow: '255,136,0',
        title: 'Coolant & Oil Check',
        text: `Summer heat accelerates coolant and oil degradation in your ${v.year} ${v.make}. Verify fluid levels and condition before long trips.`
      });
      alerts.push({
        icon: '❄️', color: '#4da6ff', shadow: '77,166,255',
        title: 'AC System Strain',
        text: 'Sustained AC use strains compressors. Listen for unusual noises when the AC kicks on — especially on older vehicles.'
      });
      if (isSUV || make.includes('jeep') || make.includes('explorer')) alerts.push({
        icon: '🌡️', color: 'var(--accent)', shadow: '230,57,70',
        title: 'Cabin Heat Risk',
        text: `SUV interiors heat up faster than sedans. Never leave valuables or pets inside your ${v.make} in summer heat.`
      });
    }

    // ── FALL (Sep, Oct, Nov) ────────────────────────────
    if (month >= 8 && month <= 10) {
      alerts.push({
        icon: '🍂', color: '#ff8800', shadow: '255,136,0',
        title: 'Air Filter Check',
        text: `Falling leaves and debris can clog air intakes and cabin filters. Check both filters on your ${v.year} ${v.make} this season.`
      });
      if (age >= 2) alerts.push({
        icon: '🔋', color: '#4da6ff', shadow: '77,166,255',
        title: 'Pre-Winter Battery Test',
        text: 'Get your battery tested before winter. Batteries weaker than 12.4V at rest often fail in the first cold snap.'
      });
    }

    // ── SPRING (Mar, Apr, May) ──────────────────────────
    if (month >= 2 && month <= 4) {
      alerts.push({
        icon: '🌧️', color: '#4da6ff', shadow: '77,166,255',
        title: 'Visibility & Wipers',
        text: `Spring rains affect visibility fast. Check wiper blade condition and washer fluid level on your ${v.make} before the wet season peaks.`
      });
      alerts.push({
        icon: '🛣️', color: '#00d084', shadow: '0,208,132',
        title: 'Road Salt Damage',
        text: 'Winter road salt accelerates rust on undercarriages. Consider a wash and underbody inspection to protect your chassis.'
      });
    }

    if (alerts.length === 0) { el.innerHTML = ''; return; }

    let html = `
      <div class="h-full flex flex-col p-6 border border-[#4da6ff]/20 bg-black/60 backdrop-blur-[40px] rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.4)] relative overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(77,166,255,0.06)_0%,transparent_70%)] pointer-events-none"></div>
        <div class="relative z-10">
          <div class="flex items-center gap-2 mb-5">
            <span class="animate-pulse text-base">🧠</span>
            <div class="text-[11px] text-[#4da6ff] tracking-[0.25em] uppercase font-bold font-mono drop-shadow-[0_0_10px_rgba(77,166,255,0.5)]">AI Seasonal Alerts</div>
          </div>
          <div class="text-[10px] text-white/30 font-mono mb-4 -mt-3">${v.year} ${v.make} ${v.model} • ${new Date().toLocaleString('default',{month:'long'})}</div>
          <div class="flex flex-col gap-3">`;

    alerts.forEach(a => {
      html += `
            <div class="flex items-start gap-3 p-4 rounded-2xl bg-[rgba(${a.shadow},0.06)] border border-[rgba(${a.shadow},0.15)] hover:bg-[rgba(${a.shadow},0.10)] transition-all duration-300">
              <div class="text-xl shrink-0 mt-0.5">${a.icon}</div>
              <div>
                <div class="text-[11px] font-bold font-mono mb-1" style="color:${a.color}">${a.title}</div>
                <div class="text-[11px] text-white/65 leading-relaxed font-mono">${a.text}</div>
              </div>
            </div>`;
    });

    html += `
          </div>
        </div>
      </div>`;

    el.innerHTML = html;
  },

  // -----------------------------------------
  // NHTSA RECALL / MANUFACTURER NOTICES (live)
  // -----------------------------------------
  checkRecalls: function() {
    const el = document.getElementById('recallSection');
    if (!el) return;
    const v = this.vehicle;
    if (!v || !v.make) { el.innerHTML = ''; return; }

    // Show loading state
    el.innerHTML = `
      <div class="h-full flex flex-col p-6 border border-[#ffb400]/20 bg-black/60 backdrop-blur-[40px] rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.4)] relative overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,180,0,0.05)_0%,transparent_70%)] pointer-events-none"></div>
        <div class="relative z-10">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-base">📋</span>
            <div class="text-[11px] text-[#ffb400] tracking-[0.25em] uppercase font-bold font-mono">Manufacturer Notices</div>
          </div>
          <div class="flex items-center gap-3 text-white/40 font-mono text-[11px]">
            <div class="w-4 h-4 border-2 border-white/10 border-t-[#ffb400] rounded-full animate-spin"></div>
            Checking NHTSA database for ${v.year} ${v.make} ${v.model}...
          </div>
        </div>
      </div>`;

    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(v.make)}&model=${encodeURIComponent(v.model)}&modelYear=${encodeURIComponent(v.year)}`;
    const cacheKey = `nhtsa_cache_${v.year}_${v.make}_${v.model}`.toLowerCase();
    
    // Check cache to prevent slow data (24h expiry)
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && (Date.now() - cached.timestamp < 86400000)) {
      this.renderRecallCards(el, v, cached.data);
      return;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data.results || [] }));
        this.renderRecallCards(el, v, data.results || []);
      })
      .catch(() => {
        el.innerHTML = `
          <div class="p-6 border border-white/5 bg-black/60 backdrop-blur-[40px] rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
            <div class="flex items-center gap-2 mb-3">
              <span>📋</span>
              <div class="text-[11px] text-white/40 tracking-widest uppercase font-mono">Manufacturer Notices</div>
            </div>
            <div class="text-[11px] text-white/30 font-mono">Recall check unavailable — check your connection and try again.</div>
          </div>`;
      });
  },

  renderRecallCards: function(el, v, recalls) {
        if (recalls.length === 0) {
          el.innerHTML = `
            <div class="h-full flex flex-col justify-center p-6 border border-[#00d084]/20 bg-black/60 backdrop-blur-[40px] rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.4)] relative overflow-hidden">
              <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,208,132,0.06)_0%,transparent_70%)] pointer-events-none"></div>
              <div class="relative z-10">
                <div class="flex items-center gap-2 mb-4">
                  <span class="text-base">📋</span>
                  <div class="text-[11px] text-[#00d084] tracking-[0.25em] uppercase font-bold font-mono drop-shadow-[0_0_10px_rgba(0,208,132,0.4)]">Manufacturer Notices</div>
                </div>
                <div class="flex items-start gap-4 p-4 rounded-2xl bg-[#00d084]/5 border border-[#00d084]/15">
                  <div class="w-10 h-10 rounded-full bg-[#00d084]/10 flex items-center justify-center text-xl shrink-0">✅</div>
                  <div>
                    <div class="text-[13px] font-bold text-[#00d084] font-mono mb-1">All Clear — No Open Recalls</div>
                    <div class="text-[10px] text-white/40 font-mono leading-relaxed">Your ${v.year} ${v.make} ${v.model} has no active NHTSA safety recall campaigns on record.</div>
                    <div class="text-[9px] text-white/20 font-mono mt-1">Source: NHTSA.gov • Updated live</div>
                  </div>
                </div>
              </div>
            </div>`;
          return;
        }

        const max = Math.min(recalls.length, 3);
        let recallCards = '';
        for (let i = 0; i < max; i++) {
          const r = recalls[i];
          const comp = (r.Component || 'Unknown').replace(/(^|\s)\S/g, t => t.toUpperCase());
          const summary = (r.Summary || r.Consequence || '').substring(0, 180);
          recallCards += `
            <div class="flex items-start gap-3 p-4 rounded-2xl bg-[#ffb400]/[0.04] border border-[#ffb400]/15 hover:bg-[#ffb400]/[0.08] transition-all duration-300">
              <div class="w-2 h-2 rounded-full bg-[#ffb400] shrink-0 mt-2 shadow-[0_0_6px_#ffb400aa]"></div>
              <div class="flex-1">
                <div class="text-[12px] font-bold text-white/90 font-mono mb-1">${comp}</div>
                <div class="text-[10px] text-white/50 leading-relaxed font-mono">${summary}${summary.length >= 180 ? '…' : ''}</div>
                <div class="text-[8px] text-white/20 font-mono mt-2">Campaign #${r.NHTSACampaignNumber || 'N/A'}</div>
              </div>
            </div>`;
        }

        const moreText = recalls.length > 3
          ? `<div class="text-center text-[9px] text-white/30 font-mono pt-2">+ ${recalls.length - 3} more recall${recalls.length - 3 > 1 ? 's' : ''} — contact your dealer for details</div>`
          : '';

        el.innerHTML = `
          <div class="h-full flex flex-col p-6 border border-[#ffb400]/20 bg-black/60 backdrop-blur-[40px] rounded-[32px] shadow-[0_15px_40px_rgba(0,0,0,0.4)] relative overflow-hidden">
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,180,0,0.06)_0%,transparent_70%)] pointer-events-none"></div>
            <div class="relative z-10">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-2">
                  <span class="text-base">📋</span>
                  <div class="text-[11px] text-[#ffb400] tracking-[0.25em] uppercase font-bold font-mono drop-shadow-[0_0_10px_rgba(255,180,0,0.5)]">Manufacturer Notices</div>
                </div>
                <div class="text-[9px] text-[#ffb400] bg-[#ffb400]/10 border border-[#ffb400]/20 px-3 py-1 rounded-full font-mono font-bold">${recalls.length} RECALL${recalls.length > 1 ? 'S' : ''}</div>
              </div>
              <div class="text-[10px] text-white/30 font-mono mb-4 -mt-2">${v.year} ${v.make} ${v.model} • NHTSA.gov</div>
              <div class="flex flex-col gap-3">
                ${recallCards}
              </div>
              ${moreText}
            </div>
          </div>`;
  },

  getExactVitalDisplay: function(key, pct, make) {
    const caps = this.getVehicleMaxCapacities(make);
    switch(key) {
      case 'oil': return { val: (pct/100 * caps.oil).toFixed(1), max: caps.oil.toFixed(1), unit: 'L' };
      case 'battery': return { val: (11.9 + (pct/100 * 0.7)).toFixed(1), max: '12.6', unit: 'V' };
      case 'tires': return { val: (2 + (pct/100 * 6)).toFixed(1), max: '8.0', unit: 'mm' };
      case 'brakes': return { val: (3 + (pct/100 * 9)).toFixed(1), max: '12.0', unit: 'mm' };
      case 'airFilter': return { val: Math.round(pct), max: '100', unit: '% Life' };
      case 'coolant': return { val: (pct/100 * caps.coolant).toFixed(1), max: caps.coolant.toFixed(1), unit: 'L' };
      case 'transmission': return { val: (pct/100 * caps.transmission).toFixed(1), max: caps.transmission.toFixed(1), unit: 'L' };
      default: return { val: pct, max: 100, unit: '%' };
    }
  },

  getPctFromExact: function(key, exactVal, make) {
    const caps = this.getVehicleMaxCapacities(make);
    let pct = 0;
    switch(key) {
      case 'oil': pct = (exactVal / caps.oil) * 100; break;
      case 'battery': pct = ((exactVal - 11.9) / 0.7) * 100; break;
      case 'tires': pct = ((exactVal - 2) / 6) * 100; break;
      case 'brakes': pct = ((exactVal - 3) / 9) * 100; break;
      case 'airFilter': pct = exactVal; break;
      case 'coolant': pct = (exactVal / caps.coolant) * 100; break;
      case 'transmission': pct = (exactVal / caps.transmission) * 100; break;
      default: pct = exactVal; break;
    }
    return Math.max(0, Math.min(100, pct));
  },

  makeVitalCard: function(key, icon, label, valDisplay, pct, sub, exactValInfo, aiData) {
    let cls = pct >= 65 ? 'vital-good' : pct >= 30 ? 'vital-warn' : 'vital-crit';
    let status = pct >= 65 ? 'Good' : pct >= 30 ? 'Fair' : 'Critical';
    let color = pct >= 65 ? '#00d084' : pct >= 30 ? '#ff8800' : 'var(--accent)';

    if (aiData && aiData.ai_override) {
      if (aiData.ai_status === 'GOOD') {
        cls = 'vital-good';
        status = 'Good';
        color = '#00FF88';
      } else if (aiData.ai_status === 'SERVICE_NOW') {
        cls = 'vital-crit';
        status = 'Service Now';
        color = 'var(--accent)';
      }
    }
    
    const overrides = JSON.parse(localStorage.getItem('vitalOverrides') || '{}') || {};
    const isOverride = overrides[key] !== undefined || (key === 'tireRotation' && overrides['tires'] !== undefined);
    const sourceLabel = isOverride ? '🤖 AI Parsed' : '🧠 Estimated';

    let displayString = exactValInfo ? (exactValInfo.val + ' <span style="opacity:0.5;font-size:0.6em;">/ ' + exactValInfo.max + '</span> ' + exactValInfo.unit) : valDisplay;
    if (aiData && aiData.ai_override && aiData.ai_display) {
      displayString = `<span style="font-size:20px;letter-spacing:0">${aiData.ai_display}</span>`;
    }
    const finalKey = key === 'tireRotation' ? 'tires' : key;

    return `<div class="bg-black/40 border border-white/5 rounded-2xl p-4 hover:bg-white/5 transition-colors cursor-pointer group" onclick="app.openVitalOverrideModal('${finalKey}', '${label}', '${icon}', ${pct})">
      <div class="flex justify-between items-center mb-3">
        <span class="text-[13px] font-bold text-white flex items-center gap-2">${icon} ${label}</span>
        <span class="text-[8px] opacity-50 font-mono tracking-widest uppercase">${sourceLabel}</span>
      </div>
      <div class="text-[28px] font-bebas text-white mb-1 group-hover:scale-105 origin-left transition-transform">${displayString}</div>
      <div class="flex items-center gap-2">
        <span class="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded" style="color:${color}; background:${color}22; border:1px solid ${color}44;">${status}</span>
      </div>
      ${pct !== null ? `<div class="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden"><div class="h-full rounded-full" style="width:${pct}%;background:${color};"></div></div>` : ''}
      ${sub ? `<div class="text-[9.5px] text-zinc-500 mt-2 font-mono">${sub}</div>` : ''}
    </div>`;
  },

  renderDailyVitals: function() {
    const container = document.getElementById('vitalsGrid');
    if (!container || !this.vehicle || !this.vehicle.make) return;

    const mileage = parseInt(this.vehicle.mileage) || 0;
    const overrides = JSON.parse(localStorage.getItem('vitalOverrides') || '{}') || {};

    const getVitalValueMobile = (key, interval, timeMonths) => {
      const overrideKey = key === 'tireRotation' ? 'tires' : key;
      if (overrides[overrideKey] !== undefined) {
        let ov = overrides[overrideKey];
        if (typeof ov === 'object' && ov.ai_override) {
          return { pct: ov.pct, label: 'AI Diagnostic', exactValInfo: null, aiData: ov };
        } else {
          const exactVal = parseFloat(ov);
          const pct = this.getPctFromExact(overrideKey, exactVal, this.vehicle.make);
          return { pct, label: 'Manual Override', exactValInfo: { val: exactVal.toFixed(1), max: this.getExactVitalDisplay(overrideKey, 0, this.vehicle.make).max, unit: this.getExactVitalDisplay(overrideKey, 0, this.vehicle.make).unit }, aiData: null };
        }
      }
      if (!this.serviceLog[key]) {
        // REAL WORLD ALGORITHM: Modulo math to estimate wear if no log exists!
        const used = mileage % interval;
        const milePct = Math.round(Math.max(0, 100 - (used / interval * 100)));
        
        const year = parseInt(this.vehicle.year) || new Date().getFullYear();
        const age = Math.max(0, new Date().getFullYear() - year);
        const totalMonths = age * 12;
        const monthsUsed = totalMonths % timeMonths;
        const timePct = Math.round(Math.max(0, 100 - (monthsUsed / timeMonths * 100)));
        
        const pct = Math.min(milePct, timePct);
        const exactValInfo = this.getExactVitalDisplay(overrideKey, pct, this.vehicle.make);
        
        let label = (interval - used).toLocaleString() + ' mi remaining (Est)';
        if (pct === timePct && (key === 'battery' || key === 'airFilter' || key === 'coolant')) {
          const monthsOld = Math.round(monthsUsed);
          if (monthsOld < 1) label = 'Just replaced';
          else if (monthsOld < 12) label = monthsOld + ' mo old';
          else label = (monthsOld / 12).toFixed(1) + ' yrs old';
        }
        
        return { pct, label, exactValInfo, aiData: null };
      }
      const log = this.serviceLog[key];
      const lastMi = parseInt(log.mileage) || 0;
      const lastDate = log.date ? new Date(log.date) : new Date();
      
      const used = mileage - lastMi;
      const milePct = Math.round(Math.max(0, 100 - (used / interval * 100)));
      
      const monthsElapsed = Math.max(0, (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      const timePct = Math.round(Math.max(0, 100 - (monthsElapsed / timeMonths * 100)));
      
      const pct = Math.min(milePct, timePct);
      const label = key === 'battery' 
        ? (monthsElapsed < 36 ? 'Healthy' : monthsElapsed < 48 ? 'Ageing' : 'Replace Soon')
        : (interval - used).toLocaleString() + ' mi remaining';
        
      const exactValInfo = this.getExactVitalDisplay(overrideKey, pct, this.vehicle.make);
      return { pct, label, exactValInfo, aiData: null };
    };

    const getOilInterval = (make) => {
      const m = (make || '').toLowerCase();
      if (m.includes('bmw') || m.includes('mercedes') || m.includes('audi') || m.includes('vw')) return 10000;
      if (m.includes('toyota') || m.includes('honda') || m.includes('hyundai')) return 7500;
      return 5000;
    };

    const oilInterval = getOilInterval(this.vehicle.make);
    const oil = getVitalValueMobile('oil', oilInterval, 6);
    const battery = getVitalValueMobile('battery', 60000, 48);
    const tireInterval = this.vehicle.make.toLowerCase().includes('suv') ? 50000 : 55000;
    const tires = getVitalValueMobile('tireRotation', tireInterval, 6);
    const brakes = getVitalValueMobile('brakes', 40000, 24);
    const airFilter = getVitalValueMobile('airFilter', 20000, 12);
    const coolant = getVitalValueMobile('coolant', 30000, 24);
    const transmission = getVitalValueMobile('transmission', 45000, 36);

    const dateEl = document.getElementById('vitalsDate');
    if (dateEl) dateEl.textContent = 'Updated ' + new Date().toLocaleDateString('en-US', {month:'short', day:'numeric'});

    container.innerHTML =
      this.makeVitalCard('oil', '🛢️', 'Engine Oil', oil.pct + '%', oil.pct, oil.label, oil.exactValInfo, oil.aiData) +
      this.makeVitalCard('battery', '🔋', 'Battery', battery.pct + '%', battery.pct, battery.label, battery.exactValInfo, battery.aiData) +
      this.makeVitalCard('tireRotation', '🛞', 'Tires', tires.pct + '%', tires.pct, tires.label, tires.exactValInfo, tires.aiData) +
      this.makeVitalCard('brakes', '🛑', 'Brake Pads', brakes.pct + '%', brakes.pct, brakes.label, brakes.exactValInfo, brakes.aiData) +
      this.makeVitalCard('airFilter', '💨', 'Air Filter', airFilter.pct + '%', airFilter.pct, airFilter.label, airFilter.exactValInfo, airFilter.aiData) +
      this.makeVitalCard('coolant', '🌡️', 'Coolant', coolant.pct + '%', coolant.pct, coolant.label, coolant.exactValInfo, coolant.aiData) +
      this.makeVitalCard('transmission', '⚙️', 'Trans. Fluid', transmission.pct + '%', transmission.pct, transmission.label, transmission.exactValInfo, transmission.aiData);
  },

  openVitalOverrideModal: function(key, label, icon, currentPct) {
    const keyInput = document.getElementById('overrideVitalKey');
    const title = document.getElementById('overrideVitalTitle');
    const iconEl = document.getElementById('overrideVitalIcon');
    const textbox = document.getElementById('cyberOverrideTextbox');
    
    if (keyInput) keyInput.value = key;
    if (title) title.textContent = label.toUpperCase();
    if (iconEl) iconEl.textContent = icon;
    
    if (textbox) {
      textbox.value = '';
      const l = label.toUpperCase();
      if (l.includes('BATTERY')) textbox.placeholder = "e.g., 'Just replaced it', '4 years old', or 'Car takes long to crank'";
      else if (l.includes('TIRES') || l.includes('BRAKES') || l.includes('PADS')) textbox.placeholder = "e.g., '10k miles left', 'Brand new', or 'They are squeaking'";
      else if (l.includes('OIL') || l.includes('COOLANT')) textbox.placeholder = "e.g., 'Changed it last week' or 'Fluid looks low'";
      else textbox.placeholder = "Describe the component status...";
    }
    
    const modal = document.getElementById('vitalOverrideModal');
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => modal.firstElementChild.style.transform = 'translateY(0)', 10);
    }
  },

  closeVitalOverrideModal: function(e) {
    if (e && e.target !== document.getElementById('vitalOverrideModal')) return;
    const modal = document.getElementById('vitalOverrideModal');
    if (modal) {
      modal.firstElementChild.style.transform = 'translateY(20px)';
      setTimeout(() => modal.style.display = 'none', 300);
    }
  },

  saveVitalOverride: async function() {
    const key = document.getElementById('overrideVitalKey').value;
    const text = document.getElementById('cyberOverrideTextbox').value;
    if (!text.trim()) {
      alert('Please describe the component status.');
      return;
    }
    
    const btn = event ? event.target : null;
    let oldText = '';
    if (btn && btn.tagName === 'BUTTON') {
      oldText = btn.innerHTML;
      btn.innerHTML = 'ANALYZING...';
      btn.disabled = true;
    }

    try {
      const prompt = `You are the backend AI for a real-world vehicle tracking dashboard. The user is manually writing a natural language update about their vehicle component ('${key}').
The vehicle's CURRENT odometer is ${this.vehicle.mileage} miles.
Based on the user's text, deduce the exact vehicle mileage when this component was last replaced or serviced.
- If they say "just replaced" or "brand new", the mileage is exactly ${this.vehicle.mileage}.
- If they say "changed 5k miles ago", the mileage is ${Math.max(0, this.vehicle.mileage - 5000)}.
- If they say "has 10k miles left", deduce the service mileage by subtracting from the current lifespan interval. Ensure it is not negative.
Output ONLY a strict JSON array of objects: [{ "component_id": "ID", "calculated_service_mileage": Number, "status": "GOOD", "display_value": "String" }]

USER INPUT FOR COMPONENT '${key}': ${text}`;

      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
      };

      const res = await fetch(`${CONFIG.GEMINI_URL}?key=${CONFIG.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Gemini API Error');
      
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanJson = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      
      if (Array.isArray(cleanJson) && cleanJson.length > 0) {
        const update = cleanJson[0];
        
        if (update.calculated_service_mileage !== undefined) {
          // REAL WORLD LOGIC: AI updates the core backend service tracking table natively!
          this.serviceLog[key] = {
            mileage: update.calculated_service_mileage,
            date: new Date().toISOString()
          };
          localStorage.setItem('serviceLog', JSON.stringify(this.serviceLog));
          
          // Wipe any mock overrides so the real algorithm renders the UI
          let overrides = JSON.parse(localStorage.getItem('vitalOverrides') || '{}') || {};
          if (overrides[key] !== undefined) {
            delete overrides[key];
            if (key === 'tireRotation') delete overrides['tires'];
          }
          localStorage.setItem('vitalOverrides', JSON.stringify(overrides));
          
          this.closeVitalOverrideModal();
          this.renderDailyVitals();
          
          if (this.renderMaintenancePlanner) this.renderMaintenancePlanner();
          
          if (window.showToast) {
            window.showToast('Service Logged via AI', `Calculated service at ${update.calculated_service_mileage.toLocaleString()} mi`, 'success');
          }
        } else {
          throw new Error('AI failed to output calculated_service_mileage.');
        }
      } else {
        throw new Error('No valid array returned from AI.');
      }
    } catch(err) {
      console.error('AI Vitals Error:', err);
      alert('Failed to process AI diagnosis. Please check console.');
    } finally {
      if (btn && btn.tagName === 'BUTTON') {
        btn.innerHTML = oldText;
        btn.disabled = false;
      }
    }
  },

  clearVitalOverride: function() {
    const key = document.getElementById('overrideVitalKey').value;
    let overrides = JSON.parse(localStorage.getItem('vitalOverrides') || '{}') || {};
    delete overrides[key];
    localStorage.setItem('vitalOverrides', JSON.stringify(overrides));
    
    this.closeVitalOverrideModal();
    this.renderDailyVitals();
    
    if (window.showToast) {
      window.showToast('Vitals Reset', 'Restored to calculated lifecycle baseline.', 'info');
    }
  },

  renderGarageRides: function() {
    const card = document.getElementById('garageRidesCard');
    const list = document.getElementById('garageRidesList');
    if (!card || !list) return;

    const storedRides = JSON.parse(localStorage.getItem('autotriage_rides') || '[]');
    if (storedRides.length === 0) {
      card.style.display = 'none';
      return;
    }

    card.style.display = 'block';
    list.innerHTML = storedRides.map(ride => {
      const brandIcons = { uber: '⬛', lyft: '🟣', bolt: '⚡', didi: '🟠', grab: '🟢', indrive: '🔵' };
      const brandColors = { 
        uber: 'text-white border-white/20 bg-white/5', 
        lyft: 'text-[#FF00BF] border-[#FF00BF]/20 bg-[#FF00BF]/5', 
        bolt: 'text-[#34D186] border-[#34D186]/20 bg-[#34D186]/5', 
        didi: 'text-[#FF7A00] border-[#FF7A00]/20 bg-[#FF7A00]/5', 
        grab: 'text-[#00B14F] border-[#00B14F]/20 bg-[#00B14F]/5', 
        indrive: 'text-[#00A9E0] border-[#00A9E0]/20 bg-[#00A9E0]/5' 
      };
      
      const icon = brandIcons[ride.provider] || '🚗';
      const themeClass = brandColors[ride.provider] || 'text-white border-white/10';

      return `
        <div class="bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group">
          <div class="absolute left-0 top-0 h-full w-1 bg-current ${ride.provider === 'uber' ? 'text-white' : ride.provider === 'lyft' ? 'text-[#FF00BF]' : ride.provider === 'bolt' ? 'text-[#34D186]' : ride.provider === 'didi' ? 'text-[#FF7A00]' : ride.provider === 'grab' ? 'text-[#00B14F]' : 'text-[#00A9E0]'} rounded-r"></div>
          <div class="pl-4">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[9px] font-bold tracking-widest uppercase border px-2 py-0.5 rounded font-mono ${themeClass}">${icon} ${ride.provider.toUpperCase()}</span>
              <span class="text-[9px] text-zinc-500 font-mono">ID: ${ride.bookingId}</span>
            </div>
            <div class="text-sm font-bold text-white font-sans mt-1.5">${ride.pickupLocation} <span class="text-zinc-500">➔</span> ${ride.destination}</div>
            <div class="text-xs text-zinc-400 mt-1 font-sans">
              Driver: <strong class="text-zinc-300">${ride.driver.name}</strong> · ${ride.driver.vehicle} (<span class="font-mono text-[10px] bg-white/5 border border-white/20 px-1.5 py-0.5 rounded text-white">${ride.driver.plate}</span>)
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderDashboardTelemetry: function() {
    const panel = document.getElementById('garageTelemetryPanel');
    if (!panel) return;

    if (!this.vehicle || !this.vehicle.make) {
      panel.innerHTML = `
        <div class="flex-1 flex flex-col justify-between py-2">
          <div class="text-center mb-4">
            <div class="text-3xl mb-2 animate-pulse">📡</div>
            <div class="font-bebas text-2xl tracking-wider text-white">TELEMETRY LINK REQUIRED</div>
            <p class="text-[10px] text-zinc-500 font-mono max-w-xs mx-auto mt-1 leading-relaxed">
              Input your vehicle specs to initialize active component monitoring, odometer tracking, and diagnostic overrides.
            </p>
          </div>
          
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-[9px] text-zinc-500 uppercase font-mono tracking-wider mb-1 block">Year</label>
              <input type="number" id="dashVehYear" class="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-2.5 text-white font-mono text-xs outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/10 transition-all duration-300" placeholder="e.g. 2019" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[9px] text-zinc-500 uppercase font-mono tracking-wider mb-1 block">Make</label>
                <input type="text" id="dashVehMake" class="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-2.5 text-white font-mono text-xs outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/10 transition-all duration-300" placeholder="e.g. Toyota" />
              </div>
              <div>
                <label class="text-[9px] text-zinc-500 uppercase font-mono tracking-wider mb-1 block">Model</label>
                <input type="text" id="dashVehModel" class="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-2.5 text-white font-mono text-xs outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/10 transition-all duration-300" placeholder="e.g. Camry" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[9px] text-zinc-500 uppercase font-mono tracking-wider mb-1 block">Odometer (mi)</label>
                <input type="number" id="dashVehMileage" class="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-2.5 text-white font-mono text-xs outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/10 transition-all duration-300" placeholder="e.g. 45000" />
              </div>
              <div>
                <label class="text-[9px] text-zinc-500 uppercase font-mono tracking-wider mb-1 block">Body Type</label>
                <select id="dashVehVType" class="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-2.5 text-white font-mono text-xs outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/10 transition-all duration-300 cursor-pointer">
                  <option value="Car">🚗 Sedan/Coupe</option>
                  <option value="SUV">🚙 SUV</option>
                  <option value="Truck">🛻 Truck</option>
                  <option value="Motorcycle">🏍 Motorcycle</option>
                </select>
              </div>
            </div>
            
            <button onclick="app.saveVehicleProfileFromDashboard()" class="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-mono font-bold tracking-widest text-[11px] uppercase transition-all duration-300 shadow-lg active:scale-[0.98]">
              INITIALIZE LINK →
            </button>
          </div>
        </div>
      `;
      return;
    }

    const v = this.vehicle;
    const vitals = OBDModule.computeLifecycleVitals(v);
    const keys = Object.keys(vitals);
    let sum = 0;
    keys.forEach(k => { sum += (vitals[k].pct !== undefined ? vitals[k].pct : vitals[k]); });
    const healthScore = keys.length ? Math.round(sum / keys.length) : 100;

    let overridesText = '';
    const overrides = JSON.parse(localStorage.getItem('vitalOverrides') || '{}') || {};
    const overrideCount = Object.keys(overrides).length;
    if (overrideCount > 0) {
      overridesText = `<span class="text-[9px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full font-mono tracking-widest uppercase shadow-[0_0_10px_rgba(234,179,8,0.2)]">${overrideCount} OVERRIDES</span>`;
    }

    const hColor = healthScore > 80 ? '#00d084' : healthScore > 50 ? '#ff8800' : 'var(--accent)';
    const hShadow = healthScore > 80 ? 'rgba(0,208,132,0.3)' : healthScore > 50 ? 'rgba(255,136,0,0.3)' : 'rgba(230,57,70,0.3)';

    panel.innerHTML = `
      <div class="flex flex-col h-full justify-between relative z-10">
        <div>
          <!-- Header Row -->
          <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full animate-ping" style="background:${hColor}"></div>
              <div class="text-[11px] text-zinc-400 tracking-[0.3em] font-mono font-bold uppercase">Cockpit Telemetry</div>
            </div>
            <div class="flex gap-2 items-center">
              ${overridesText}
              <button onclick="app.openLogService()" class="bg-white/5 border border-white/10 text-white/70 hover:text-white px-4 py-2 rounded-xl text-[9px] font-mono font-bold tracking-wider cursor-pointer transition-all hover:bg-white/10">+ LOG SERVICE</button>
            </div>
          </div>
          
          <!-- Health Overview Row -->
          <div class="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 rounded-2xl relative overflow-hidden" style="background: radial-gradient(ellipse at left, ${hColor}12 0%, transparent 70%); border: 1px solid ${hColor}20;">
            <!-- Large Health Ring -->
            <div class="relative shrink-0" style="width:120px; height:120px;">
              <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="8"></circle>
                <circle cx="60" cy="60" r="52" fill="none" stroke="${hColor}" stroke-width="8" stroke-linecap="round"
                  stroke-dasharray="327" stroke-dashoffset="${Math.round(327 - (327 * healthScore / 100))}" 
                  style="filter: drop-shadow(0 0 6px ${hColor}); transition: stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1);"></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <div class="font-bebas text-[42px] text-white leading-none" style="text-shadow: 0 0 20px ${hColor}80;">${healthScore}</div>
                <div class="text-[8px] font-mono tracking-[0.3em] uppercase text-white/40">HEALTH</div>
              </div>
            </div>
            <!-- Status Text -->
            <div class="flex-1 min-w-0">
              <div class="font-bebas text-[32px] sm:text-[38px] text-white tracking-wide leading-tight mb-1" style="text-shadow: 0 0 30px ${hColor}40;">${healthScore > 80 ? 'OPTIMAL PERFORMANCE' : healthScore > 50 ? 'MAINTENANCE REQUIRED' : 'CRITICAL SERVICE NEEDED'}</div>
              <p class="text-[11px] text-white/35 font-mono leading-relaxed">Predictive analytics from OBD-II logs &amp; AI cross-referencing. Click any component to override.</p>
              <div class="flex items-center gap-4 mt-4 flex-wrap">
                <div class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full" style="background:${hColor};"></div>
                  <span class="text-[10px] font-mono tracking-widest uppercase" style="color:${hColor};">${healthScore > 80 ? 'ALL SYSTEMS NOMINAL' : healthScore > 50 ? 'SOME MONITORING ADVISED' : 'IMMEDIATE SERVICE REQUIRED'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Component Vitals Grid -->
          <div class="text-[9px] text-zinc-600 font-mono font-bold tracking-[0.3em] uppercase mb-4">🛠️ Component Status — Click to Override</div>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            ${Object.entries(vitals).slice(0, 8).map(([k, data]) => {
              const pct = typeof data === 'object' ? (data.pct || 0) : data;
              const primary   = typeof data === 'object' ? data.primary   : pct + '%';
              const secondary = typeof data === 'object' ? data.secondary : '';
              const labels = {
                oil: 'Engine Oil', battery: 'Battery', tires: 'Tires', brakes: 'Brakes',
                airFilter: 'Air Filter', coolant: 'Coolant', transmission: 'Transmission', sparkPlugs: 'Spark Plugs',
                fuel: 'Fuel Tank', fuelEfficiency: 'Fuel Economy'
              };
              const icons = {
                oil: '🛢️', battery: '🔋', tires: '🛞', brakes: '🛑',
                airFilter: '💨', coolant: '🌡️', transmission: '⚙️', sparkPlugs: '⚡',
                fuel: '⛽', fuelEfficiency: '📊'
              };
              const hexC    = pct > 60 ? '#00d084' : pct > 25 ? '#ff8800' : 'var(--accent)';
              // Use OBD module's own status label, with smart fallbacks per component
              const rawStatus = typeof data === 'object' && data.status ? data.status : null;
              const statusLabel = rawStatus
                ? rawStatus
                : (pct > 60 ? 'GOOD' : pct > 25 ? 'MONITOR' : (
                    k === 'fuel'           ? 'REFUEL' :
                    k === 'fuelEfficiency' ? 'CHECK SYSTEM' :
                    k === 'battery'        ? 'REPLACE' :
                    k === 'airFilter'      ? 'REPLACE' :
                    k === 'coolant'        ? 'FLUSH NOW' :
                    'SERVICE NOW'
                  ));
              const label = labels[k] || k;
              const icon  = icons[k]  || '🔧';
              const circumf = 2 * Math.PI * 18; // r=18
              const dashOffset = Math.round(circumf - (circumf * pct / 100));
              return `
                <div onclick="app.openVitalOverrideModal('${k}', '${label}', '${icon}', ${pct})" 
                     class="cursor-pointer rounded-[20px] p-4 flex flex-col gap-3 group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                     style="background: ${hexC}08; border: 1px solid ${hexC}25; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                  <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(circle at top right, ${hexC}15 0%, transparent 60%);"></div>
                  
                  <!-- Compact ring + icon row -->
                  <div class="flex items-center justify-between relative z-10">
                    <span class="text-[22px] drop-shadow-lg group-hover:scale-110 transition-transform duration-200">${icon}</span>
                    <!-- Mini SVG ring -->
                    <div class="relative" style="width:40px; height:40px;">
                      <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3.5"></circle>
                        <circle cx="20" cy="20" r="16" fill="none" stroke="${hexC}" stroke-width="3.5" stroke-linecap="round"
                          stroke-dasharray="100.5" stroke-dashoffset="${Math.round(100.5 - (100.5 * pct / 100))}"
                          style="filter:drop-shadow(0 0 3px ${hexC}80);"></circle>
                      </svg>
                      <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-[9px] font-mono font-bold" style="color:${hexC};">${pct}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Data -->
                  <div class="relative z-10">
                    <div class="text-[13px] font-bold font-mono leading-tight" style="color:${hexC};">${primary}</div>
                    <div class="text-[9px] text-zinc-500 font-mono mt-0.5 leading-tight">${secondary || label}</div>
                  </div>
                  
                  <!-- Status badge -->
                  <div class="relative z-10 text-[8px] font-mono font-bold tracking-widest uppercase px-2 py-1 rounded-md w-fit" style="background:${hexC}18; color:${hexC};">${statusLabel}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  saveVehicleProfileFromDashboard: function() {
    const year = document.getElementById('dashVehYear').value.trim();
    const make = document.getElementById('dashVehMake').value.trim();
    const model = document.getElementById('dashVehModel').value.trim();
    const mileage = document.getElementById('dashVehMileage').value.trim();
    const vtypeSelect = document.getElementById('dashVehVType');
    const vtype = vtypeSelect ? vtypeSelect.value : 'Car';

    if(!make || !model || !year) return alert("Please fill in Make, Model, and Year.");

    this.vehicle = { make, model, year, mileage: parseInt(mileage) || 0, vtype };
    localStorage.setItem('desktopVehicle', JSON.stringify(this.vehicle));
    localStorage.setItem('myVehicle', JSON.stringify(this.vehicle));

    this.fetchCarImage(this.vehicle.make, this.vehicle.model, this.vehicle.year);
    this.renderGarageDashboard();
    this.renderDashboardTelemetry();
  },

  // -----------------------------------------
  // RIDES LOGIC
  // -----------------------------------------
  detectRidePickup: function() {
    const fromInput = document.getElementById('rideFrom');
    if(fromInput) fromInput.value = "Current Location (Detected)";
  },

  setRideType: function(btn, type) {
    document.querySelectorAll('.rtype-btn').forEach(b => {
      b.classList.remove('on');
      b.className = 'rtype-btn flex-1 bg-white/5 text-white font-mono font-bold py-3 rounded-xl border border-white/10 hover:bg-white/10';
    });
    btn.classList.add('on');
    btn.className = 'rtype-btn on flex-1 bg-white text-black font-mono font-bold py-3 rounded-xl border border-transparent shadow-[0_4px_15px_rgba(255,255,255,0.2)]';
    this.curRideType = type;
  },

  searchRides: function() {
    const from = document.getElementById('rideFrom').value.trim();
    const to = document.getElementById('rideTo').value.trim();
    
    if(!from) return alert("Please detect or enter pickup location.");
    if(!to) return alert("Please enter destination.");
    
    document.getElementById('rideSearching').style.display = 'block';
    document.getElementById('rideProviderResults').style.display = 'none';
    
    const statuses = ['Scanning nearby providers...','Checking Lyft drivers...','Checking Uber...','Checking Bolt...','Checking DiDi...','Checking Grab...','Checking InDrive...','Calculating fares...'];
    let si = 0;
    const statusEl = document.getElementById('searchStatus');
    const statusInt = setInterval(() => { if (si < statuses.length) statusEl.textContent = statuses[si++]; }, 500);
    
    setTimeout(() => {
      clearInterval(statusInt);
      document.getElementById('rideSearching').style.display = 'none';
      
      const distKm = (Math.random() * 15 + 2).toFixed(1);
      this.rideSearchResults = [
        { id: 'uber', name: 'Uber', emoji: '⬛', fare: `$${(distKm * 2.1).toFixed(2)}`, eta: 4, class: 'uber-card', driver: 'Alex M.', car: 'Toyota Camry', color: 'Black', plate: '7B8-99L' },
        { id: 'lyft', name: 'Lyft', emoji: '🟣', fare: `$${(distKm * 1.9).toFixed(2)}`, eta: 6, class: 'lyft-card', driver: 'Sarah K.', car: 'Kia Optima', color: 'Silver', plate: 'XYZ-123' },
        { id: 'bolt', name: 'Bolt', emoji: '⚡', fare: `$${(distKm * 1.7).toFixed(2)}`, eta: 8, class: 'bolt-card', driver: 'David O.', car: 'Honda Civic', color: 'White', plate: 'A1B-2C3' }
      ];
      
      const cardsHtml = this.rideSearchResults.map((p, i) => `
        <div class="panel p-4 border-white/10 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors" onclick="app.bookRideInline(${i})">
          <div class="flex items-center gap-4">
            <div class="text-3xl">${p.emoji}</div>
            <div>
              <div class="text-[16px] font-bold font-mono text-white">${p.name}</div>
              <div class="text-[10px] text-gray-400 font-mono tracking-widest uppercase">${p.car} · ${p.color}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-[18px] font-bold text-[#00d084] font-mono">${p.fare}</div>
            <div class="text-[12px] text-white/50 font-mono tracking-widest">ETA ${p.eta} MIN</div>
          </div>
        </div>
      `).join('');
      
      document.getElementById('providerCards').innerHTML = cardsHtml;
      document.getElementById('rideProviderResults').style.display = 'block';
    }, 3000);
  },

  bookRideInline: async function(idx) {
    const p = this.rideSearchResults[idx];
    document.getElementById('rideProviderResults').style.display = 'none';
    
    const inlineState = document.getElementById('rideInlineBookingState');
    inlineState.style.display = 'block';
    inlineState.innerHTML = `
      <div class="panel p-8 text-center border border-[#00d084]/20 bg-[#00d084]/5">
        <div class="text-4xl mb-4 animate-pulse">🔒</div>
        <div class="text-[18px] font-bold text-white font-mono tracking-widest uppercase">Authenticating & Booking...</div>
        <div class="text-[12px] text-[#8e93a0] font-mono mt-2">Connecting to ${p.name} dispatch...</div>
      </div>
    `;

    try {
      const passengerName = document.getElementById('passengerName') ? document.getElementById('passengerName').value : '';
      const passengerPhone = document.getElementById('passengerPhone') ? document.getElementById('passengerPhone').value : '';
      const stop1 = document.getElementById('rideStop1') ? document.getElementById('rideStop1').value : '';
      
      const options = {
        splitFare: document.getElementById('optSplitFare') ? document.getElementById('optSplitFare').checked : false,
        schedule: document.getElementById('optSchedule') ? document.getElementById('optSchedule').checked : false,
        quiet: document.getElementById('optQuiet') ? document.getElementById('optQuiet').checked : false,
        coldAC: document.getElementById('optColdAC') ? document.getElementById('optColdAC').checked : false,
        music: document.getElementById('optMusic') ? document.getElementById('optMusic').checked : false,
        safetyPIN: document.getElementById('optSafetyPIN') ? document.getElementById('optSafetyPIN').checked : false,
        insurance: document.getElementById('optInsurance') ? document.getElementById('optInsurance').checked : false,
        wheelchair: document.getElementById('optWheelchair') ? document.getElementById('optWheelchair').checked : false,
        language: document.getElementById('driverLanguage') ? document.getElementById('driverLanguage').value : 'en'
      };
      
      const savedUserStr = localStorage.getItem('autotriage_user');
      const savedUserObj = savedUserStr ? JSON.parse(savedUserStr) : null;
      const passengerEmail = savedUserObj ? savedUserObj.email : 'local_device_session@autotriage.io';

      const res = await fetch('/api/book-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: p.id,
          pickupLocation: document.getElementById('rideFrom').value || 'Current Location',
          destination: document.getElementById('rideTo').value || 'Unknown Destination',
          stop1: stop1,
          rideType: this.curRideType || 'standard',
          passengerName: passengerName,
          passengerPhone: passengerPhone,
          passengerEmail: passengerEmail,
          advancedOptions: options
        })
      });

      const data = await res.json();
      
      if (data.success) {
        // Save the booking log to localStorage
        const storedRides = JSON.parse(localStorage.getItem('autotriage_rides') || '[]');
        storedRides.unshift({
          bookingId: data.bookingId,
          provider: p.id,
          driver: data.driver,
          eta: data.eta,
          pickupLocation: document.getElementById('rideFrom').value || 'Current Location',
          destination: document.getElementById('rideTo').value || 'Unknown Destination',
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('autotriage_rides', JSON.stringify(storedRides));
        if (typeof this.renderGarageRides === 'function') {
          this.renderGarageRides();
        }

        inlineState.innerHTML = `
          <div class="panel p-8 text-center border border-[#00d084]/50 bg-[#00d084]/10 shadow-[0_0_30px_rgba(0,208,132,0.15)] relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-[#00d084]"></div>
            <div class="text-5xl mb-4">✅</div>
            <div class="text-[22px] font-bold text-[#00d084] font-mono tracking-widest uppercase mb-1">RIDE CONFIRMED</div>
            <div class="text-[12px] text-[#8e93a0] font-mono tracking-widest mb-6">${data.message}</div>
            
            <div class="flex justify-between items-center text-left bg-black/40 p-4 rounded-xl border border-white/5 mb-4">
              <div class="flex items-center gap-4">
                <div class="text-4xl">👨🏻</div>
                <div>
                  <div class="text-[14px] text-white/50 font-mono tracking-widest uppercase mb-1">Driver</div>
                  <div class="text-[18px] font-bold text-white font-mono">${data.driver.name} <span class="text-[12px] text-yellow-400">★ ${data.driver.rating}</span></div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-[14px] text-white/50 font-mono tracking-widest uppercase mb-1">ETA</div>
                <div class="text-[24px] font-bold text-[#00d084] font-mono leading-none">${data.eta} MIN</div>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white/5 border border-white/10 p-4 rounded-xl text-left">
                <div class="text-[10px] text-white/50 font-mono tracking-widest uppercase mb-1">Vehicle</div>
                <div class="text-[14px] font-bold text-white font-mono">${data.driver.vehicle}</div>
                <div class="text-[11px] text-[#8e93a0] font-mono mt-1">${data.driver.color}</div>
              </div>
              <div class="bg-white/5 border border-white/10 p-4 rounded-xl text-left">
                <div class="text-[10px] text-white/50 font-mono tracking-widest uppercase mb-1">License Plate</div>
                <div class="text-[18px] font-bold text-white font-mono bg-black/50 py-1 px-3 rounded inline-block border border-white/20 mt-1">${data.driver.plate}</div>
              </div>
            </div>
          </div>
        `;
      } else {
        throw new Error(data.error || 'Failed to book ride');
      }
    } catch (err) {
      console.error(err);
      inlineState.innerHTML = `
        <div class="panel p-8 text-center border border-red-500/50 bg-red-500/10">
          <div class="text-4xl mb-4">❌</div>
          <div class="text-[18px] font-bold text-red-400 font-mono tracking-widest uppercase">Booking Failed</div>
          <div class="text-[12px] text-[#8e93a0] font-mono mt-2">Could not connect to ${p.name} API. Please try again.</div>
          <button class="mt-6 action-btn bg-white/10 text-white border-white/20 hover:bg-white/20 px-6 py-2 rounded-xl font-mono text-[12px] uppercase tracking-widest" onclick="document.getElementById('rideInlineBookingState').style.display='none'; document.getElementById('rideProviderResults').style.display='block';">← Back</button>
        </div>
      `;
    }
  },

  injectProviderTheme: function(providerId) {
    let styleEl = document.getElementById('provider-theme-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'provider-theme-styles';
      document.head.appendChild(styleEl);
    }

    let commonCss = `
      #dispatchEnginePane select option {
        background-color: #141414 !important;
        color: var(--fg) !important;
      }
    `;

    let css = '';
    const fonts = `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`;

    if (providerId === 'uber') {
      css = `
        #dispatchEnginePane {
          font-family: ${fonts} !important;
        }
        #dispatchEnginePane input, #dispatchEnginePane select, #dispatchEnginePane button {
          font-family: ${fonts} !important;
        }
        .provider-bg-color {
          background-color: var(--bg) !important;
        }
        .provider-accent-text {
          color: var(--fg) !important;
        }
        .provider-accent-bg {
          background-color: var(--fg) !important;
        }
        .provider-border-color {
          border-color: #1f1f1f !important;
        }
        .provider-btn-main {
          background-color: var(--fg) !important;
          color: var(--bg) !important;
          font-weight: 700 !important;
          border-radius: 12px !important;
          text-transform: none !important;
          border: none !important;
        }
        .provider-btn-main:hover {
          background-color: #e5e5e5 !important;
        }
        .provider-card-selected {
          border: 2px solid var(--fg) !important;
          background-color: #141414 !important;
        }
        .provider-input-focus:focus {
          border-color: var(--fg) !important;
        }
      `;
    } else if (providerId === 'lyft') {
      css = `
        #dispatchEnginePane {
          font-family: ${fonts} !important;
        }
        #dispatchEnginePane input, #dispatchEnginePane select, #dispatchEnginePane button {
          font-family: ${fonts} !important;
        }
        .provider-bg-color {
          background-color: #0c0b0e !important;
        }
        .provider-accent-text {
          color: #FF00BF !important;
        }
        .provider-accent-bg {
          background-color: #FF00BF !important;
        }
        .provider-border-color {
          border-color: #261f2e !important;
        }
        .provider-btn-main {
          background-color: #FF00BF !important;
          color: var(--fg) !important;
          font-weight: 700 !important;
          border-radius: 9999px !important;
          text-transform: none !important;
          border: none !important;
        }
        .provider-btn-main:hover {
          background-color: #e300a8 !important;
        }
        .provider-card-selected {
          border: 2px solid #FF00BF !important;
          background-color: rgba(255, 0, 191, 0.08) !important;
        }
        .provider-input-focus:focus {
          border-color: #FF00BF !important;
        }
      `;
    } else if (providerId === 'bolt') {
      css = `
        #dispatchEnginePane {
          font-family: ${fonts} !important;
        }
        #dispatchEnginePane input, #dispatchEnginePane select, #dispatchEnginePane button {
          font-family: ${fonts} !important;
        }
        .provider-bg-color {
          background-color: #0a0f0c !important;
        }
        .provider-accent-text {
          color: #34D186 !important;
        }
        .provider-accent-bg {
          background-color: #34D186 !important;
        }
        .provider-border-color {
          border-color: #122118 !important;
        }
        .provider-btn-main {
          background-color: #34D186 !important;
          color: var(--bg) !important;
          font-weight: 700 !important;
          border-radius: 12px !important;
          text-transform: none !important;
          border: none !important;
        }
        .provider-btn-main:hover {
          background-color: #2cb272 !important;
        }
        .provider-card-selected {
          border: 2px solid #34D186 !important;
          background-color: rgba(52, 209, 134, 0.08) !important;
        }
        .provider-input-focus:focus {
          border-color: #34D186 !important;
        }
      `;
    } else if (providerId === 'didi') {
      css = `
        #dispatchEnginePane {
          font-family: ${fonts} !important;
        }
        #dispatchEnginePane input, #dispatchEnginePane select, #dispatchEnginePane button {
          font-family: ${fonts} !important;
        }
        .provider-bg-color {
          background-color: #0f0d0a !important;
        }
        .provider-accent-text {
          color: #FF7A00 !important;
        }
        .provider-accent-bg {
          background-color: #FF7A00 !important;
        }
        .provider-border-color {
          border-color: #24160c !important;
        }
        .provider-btn-main {
          background-color: #FF7A00 !important;
          color: var(--fg) !important;
          font-weight: 700 !important;
          border-radius: 12px !important;
          text-transform: none !important;
          border: none !important;
        }
        .provider-btn-main:hover {
          background-color: #e06c00 !important;
        }
        .provider-card-selected {
          border: 2px solid #FF7A00 !important;
          background-color: rgba(255, 122, 0, 0.08) !important;
        }
        .provider-input-focus:focus {
          border-color: #FF7A00 !important;
        }
      `;
    } else if (providerId === 'grab') {
      css = `
        #dispatchEnginePane {
          font-family: ${fonts} !important;
        }
        #dispatchEnginePane input, #dispatchEnginePane select, #dispatchEnginePane button {
          font-family: ${fonts} !important;
        }
        .provider-bg-color {
          background-color: #0a100d !important;
        }
        .provider-accent-text {
          color: #00B14F !important;
        }
        .provider-accent-bg {
          background-color: #00B14F !important;
        }
        .provider-border-color {
          border-color: #0c2115 !important;
        }
        .provider-btn-main {
          background-color: #00B14F !important;
          color: var(--fg) !important;
          font-weight: 700 !important;
          border-radius: 12px !important;
          text-transform: none !important;
          border: none !important;
        }
        .provider-btn-main:hover {
          background-color: #009944 !important;
        }
        .provider-card-selected {
          border: 2px solid #00B14F !important;
          background-color: rgba(0, 177, 79, 0.08) !important;
        }
        .provider-input-focus:focus {
          border-color: #00B14F !important;
        }
      `;
    } else if (providerId === 'indrive') {
      css = `
        #dispatchEnginePane {
          font-family: ${fonts} !important;
        }
        #dispatchEnginePane input, #dispatchEnginePane select, #dispatchEnginePane button {
          font-family: ${fonts} !important;
        }
        .provider-bg-color {
          background-color: #08111a !important;
        }
        .provider-accent-text {
          color: #00A9E0 !important;
        }
        .provider-accent-bg {
          background-color: #00A9E0 !important;
        }
        .provider-border-color {
          border-color: #102233 !important;
        }
        .provider-btn-main {
          background-color: #00A9E0 !important;
          color: var(--fg) !important;
          font-weight: 700 !important;
          border-radius: 12px !important;
          text-transform: none !important;
          border: none !important;
        }
        .provider-btn-main:hover {
          background-color: #008ebc !important;
        }
        .provider-card-selected {
          border: 2px solid #00A9E0 !important;
          background-color: rgba(0, 169, 224, 0.08) !important;
        }
        .provider-input-focus:focus {
          border-color: #00A9E0 !important;
        }
      `;
    }

    styleEl.innerHTML = commonCss + css;
  },

  updateMapHUD: function(providerId, state, driverData) {
    const mapContainer = document.getElementById('rideMapHudContainer');
    if (!mapContainer) return;

    let routeColor = '#00d084';
    let pickupColor = '#00d084';
    let destColor = '#ef4444';
    let carColor = 'var(--fg)';
    let brandName = 'AutoTriage';

    if (providerId === 'uber') {
      routeColor = 'var(--fg)';
      pickupColor = 'var(--fg)';
      destColor = 'var(--fg)';
      carColor = 'var(--fg)';
      brandName = 'Uber';
    } else if (providerId === 'lyft') {
      routeColor = '#FF00BF';
      pickupColor = '#FF00BF';
      destColor = '#FF00BF';
      carColor = '#FF00BF';
      brandName = 'Lyft';
    } else if (providerId === 'bolt') {
      routeColor = '#34D186';
      pickupColor = '#34D186';
      destColor = '#34D186';
      carColor = '#34D186';
      brandName = 'Bolt';
    } else if (providerId === 'didi') {
      routeColor = '#FF7A00';
      pickupColor = '#FF7A00';
      destColor = '#FF7A00';
      carColor = '#FF7A00';
      brandName = 'DiDi';
    } else if (providerId === 'grab') {
      routeColor = '#00B14F';
      pickupColor = '#00B14F';
      destColor = '#00B14F';
      carColor = '#00B14F';
      brandName = 'Grab';
    } else if (providerId === 'indrive') {
      routeColor = '#00A9E0';
      pickupColor = '#00A9E0';
      destColor = '#00A9E0';
      carColor = '#00A9E0';
      brandName = 'InDrive';
    }

    const pickupText = (document.getElementById('rideFrom') && document.getElementById('rideFrom').value) || 'Current Location';
    const destText = (document.getElementById('rideTo') && document.getElementById('rideTo').value) || 'Destination';

    let mapContent = '';

    // Draw background city grid
    let gridSVG = `
      <!-- Streets -->
      <line x1="10" y1="300" x2="390" y2="300" stroke="rgba(255,255,255,0.04)" stroke-width="12" />
      <line x1="10" y1="160" x2="390" y2="160" stroke="rgba(255,255,255,0.04)" stroke-width="12" />
      <line x1="60" y1="10" x2="60" y2="390" stroke="rgba(255,255,255,0.04)" stroke-width="12" />
      <line x1="180" y1="10" x2="180" y2="390" stroke="rgba(255,255,255,0.04)" stroke-width="12" />
      <line x1="340" y1="10" x2="340" y2="390" stroke="rgba(255,255,255,0.04)" stroke-width="12" />

      <!-- Lane dividers -->
      <line x1="10" y1="300" x2="390" y2="300" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="4 4" />
      <line x1="10" y1="160" x2="390" y2="160" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="4 4" />
      <line x1="60" y1="10" x2="60" y2="390" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="4 4" />
      <line x1="180" y1="10" x2="180" y2="390" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="4 4" />
      <line x1="340" y1="10" x2="340" y2="390" stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="4 4" />
    `;

    if (state === 'idle') {
      mapContent = `
        <div class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all duration-500">
          <svg class="w-full h-full p-8" viewBox="0 0 400 400" fill="none">
            ${gridSVG}
            <!-- Empty state reticle -->
            <circle cx="200" cy="200" r="100" stroke="${routeColor}" stroke-width="1" stroke-dasharray="6 6" opacity="0.3" class="animate-pulse" />
            <text x="200" y="205" fill="rgba(255,255,255,0.4)" font-family="system-ui" font-size="12" text-anchor="middle" letter-spacing="1">AWAITING ROUTE</text>
          </svg>
        </div>
      `;
    } else if (state === 'loading') {
      mapContent = `
        <div class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <svg class="w-full h-full p-8" viewBox="0 0 400 400" fill="none">
            ${gridSVG}
            <!-- Pulsing load ring -->
            <circle cx="180" cy="200" r="60" stroke="${routeColor}" stroke-width="2" class="animate-ping" style="transform-origin: 180px 200px;" />
            <circle cx="180" cy="200" r="12" fill="${routeColor}" />
            <text x="180" y="290" fill="${routeColor}" font-family="system-ui" font-size="12" font-weight="bold" text-anchor="middle" class="animate-pulse">GEOLOCATING VEHICLES...</text>
          </svg>
        </div>
      `;
    } else if (state === 'vehicles') {
      mapContent = `
        <div class="absolute inset-0 transition-all duration-500">
          <svg class="w-full h-full p-8" viewBox="0 0 400 400" fill="none">
            ${gridSVG}
            
            <!-- Highlighted route path -->
            <path id="route-path-main" d="M 60 300 H 180 V 160 H 340" stroke="${routeColor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />
            
            <!-- Pickup point -->
            <circle cx="60" cy="300" r="8" fill="${pickupColor}" stroke="var(--bg)" stroke-width="2" />
            <text x="60" y="325" fill="var(--fg)" font-family="system-ui" font-size="10" font-weight="bold" text-anchor="middle">${pickupText.slice(0, 20)}</text>
            
            <!-- Destination point -->
            ${providerId === 'uber' ? 
              `<rect x="334" y="154" width="12" height="12" fill="${destColor}" stroke="var(--bg)" stroke-width="2" />` : 
              `<circle cx="340" cy="160" r="8" fill="${destColor}" stroke="var(--bg)" stroke-width="2" />`
            }
            <text x="340" y="145" fill="var(--fg)" font-family="system-ui" font-size="10" font-weight="bold" text-anchor="middle">${destText.slice(0, 20)}</text>

            <!-- Nearby ghost cars -->
            <g transform="translate(180, 240) rotate(180)">
              <path d="M-4 -8 C-4 -10 -2 -11 0 -11 C2 -11 4 -10 4 -8 L4 6 C4 8 2 9 0 9 C-2 9 -4 8 -4 6 Z" fill="rgba(255,255,255,0.3)" />
            </g>
            <g transform="translate(100, 300) rotate(90)">
              <path d="M-4 -8 C-4 -10 -2 -11 0 -11 C2 -11 4 -10 4 -8 L4 6 C4 8 2 9 0 9 C-2 9 -4 8 -4 6 Z" fill="rgba(255,255,255,0.3)" />
            </g>
            <g transform="translate(340, 100) rotate(0)">
              <path d="M-4 -8 C-4 -10 -2 -11 0 -11 C2 -11 4 -10 4 -8 L4 6 C4 8 2 9 0 9 C-2 9 -4 8 -4 6 Z" fill="rgba(255,255,255,0.3)" />
            </g>
          </svg>
        </div>
      `;
    } else if (state === 'booking') {
      const plateNo = (driverData && driverData.plate) || '7B8-99L';
      const driverName = (driverData && driverData.name) || 'Driver';
      
      const brandRadar = (providerId === 'indrive' || providerId === 'didi' || providerId === 'grab') ? `
        <circle cx="0" cy="0" r="32" fill="rgba(0,169,224,0.15)" stroke="rgba(0,169,224,0.4)" stroke-width="1" opacity="0.8">
          <animate attributeName="r" values="12;40;12" dur="3s" repeatCount="indefinite" />
        </circle>
        <line x1="0" y1="0" x2="28" y2="28" stroke="#00A9E0" stroke-width="1.5" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite" />
        </line>
      ` : '';

      mapContent = `
        <div class="absolute inset-0 transition-all duration-500">
          <svg class="w-full h-full p-8" viewBox="0 0 400 400" fill="none">
            ${gridSVG}
            
            <!-- Route path -->
            <path id="route-path-animated" d="M 60 300 H 180 V 160 H 340" stroke="${routeColor}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />
            
            <!-- Pickup point -->
            <circle cx="60" cy="300" r="8" fill="${pickupColor}" stroke="var(--bg)" stroke-width="2" />
            <text x="60" y="325" fill="var(--fg)" font-family="system-ui" font-size="10" font-weight="bold" text-anchor="middle">${pickupText.slice(0, 20)}</text>
            
            <!-- Destination point -->
            ${providerId === 'uber' ? 
              `<rect x="334" y="154" width="12" height="12" fill="${destColor}" stroke="var(--bg)" stroke-width="2" />` : 
              `<circle cx="340" cy="160" r="8" fill="${destColor}" stroke="var(--bg)" stroke-width="2" />`
            }
            <text x="340" y="145" fill="var(--fg)" font-family="system-ui" font-size="10" font-weight="bold" text-anchor="middle">${destText.slice(0, 20)}</text>

            <!-- Animated Car -->
            <g>
              ${brandRadar}
              <path d="M-5 -11 C-5 -13 -3 -14 0 -14 C3 -14 5 -13 5 -11 L5 8 C5 10 3 11 0 11 C-3 11 -5 10 -5 8 Z" fill="${carColor}" stroke="var(--bg)" stroke-width="1" />
              <path d="M-3.5 -5 C-3.5 -6.5 -1.5 -8 0 -8 C1.5 -8 3.5 -6.5 3.5 -5 Z" fill="var(--bg)" />
              <path d="M-3.5 5 C-3.5 4 -1.5 3.5 0 3.5 C1.5 3.5 3.5 4 3.5 5 Z" fill="var(--bg)" />
              
              <animateMotion dur="10s" repeatCount="indefinite" rotate="auto">
                <mpath href="#route-path-animated"/>
              </animateMotion>
            </g>
          </svg>

          <div class="absolute bottom-6 left-6 right-6 bg-[#121214]/95 border border-white/10 p-4 rounded-2xl flex justify-between items-center shadow-2xl backdrop-blur-md">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-sans font-bold border border-white/10">
                ${driverName.slice(0, 2).toUpperCase()}
              </div>
              <div class="text-left font-sans">
                <div class="text-xs font-bold text-white">${driverName} is en route</div>
                <div class="text-[9px] text-zinc-400 mt-0.5">Assigned driver for ${brandName}</div>
              </div>
            </div>
            <div class="bg-white/5 border border-white/10 text-white font-mono px-3 py-1.5 rounded-lg text-xs font-bold shadow-inner">
              ${plateNo}
            </div>
          </div>
        </div>
      `;
    }

    mapContainer.innerHTML = mapContent;
  },

  activateDispatchEngine: async function(providerName) {
    // 1. Hide the VIP Showcase
    const showcase = document.getElementById('vipShowcase');
    if (showcase) {
      showcase.style.opacity = '0';
      showcase.style.transform = 'translateY(-20px)';
      setTimeout(() => showcase.style.display = 'none', 700);
    }
    
    // 2. Show the Dispatch Engine Pane
    const engine = document.getElementById('dispatchEnginePane');
    if (engine) {
      setTimeout(() => {
        engine.classList.remove('opacity-0', 'translate-y-full', 'pointer-events-none');
        
        // Ensure "Current Location" is set
        const pickup = document.getElementById('rideFrom');
        if (pickup && !pickup.value) {
          pickup.value = 'Current Location';
        }
      }, 300);
    }

    const providerId = providerName.toLowerCase();
    this.selectedVipProvider = { id: providerId, name: providerName };

    // 3. Inject CSS branding overrides
    this.injectProviderTheme(providerId);

    // 4. Dynamically restyle structural DOM hooks
    const leftPane = document.getElementById('rideLeftPane');
    const title = document.getElementById('dispatchTitle');
    const subtitle = document.getElementById('dispatchSubtitle');
    const routeInputCard = document.getElementById('routeInputCard');
    const routeBar = document.getElementById('routeBar');
    const pickupIndicator = document.getElementById('pickupIndicator');
    const gpsBtn = document.getElementById('gpsBtn');
    const handshakeDot = document.getElementById('handshakeDot');
    const handshakeText = document.getElementById('handshakeText');
    const searchRidesBtn = document.getElementById('searchRidesBtn');

    if (leftPane) {
      leftPane.className = "w-full md:w-1/2 h-full overflow-y-auto custom-scroll p-8 relative z-10 flex flex-col transition-all duration-300 provider-bg-color";
    }

    if (title) {
      title.textContent = providerName;
      title.style.fontFamily = "'Inter', sans-serif";
      title.style.fontWeight = '900';
      title.style.textTransform = 'none';
      title.style.letterSpacing = '-0.5px';
      title.style.fontSize = '28px';
    }

    // Inject provider icon badge
    const iconEl = document.getElementById('dispatchProviderIcon');
    if (iconEl) {
      const providerIcons = {
        uber:    { bg: 'var(--bg)', border: 'rgba(255,255,255,0.2)', html: '<img src="https://cdn.simpleicons.org/uber/white" style="width:22px;height:22px;">' },
        lyft:    { bg: '#FF00BF', border: 'rgba(255,0,191,0.5)', html: '<img src="https://cdn.simpleicons.org/lyft/white" style="width:22px;height:22px;">' },
        bolt:    { bg: '#34D186', border: 'rgba(52,209,134,0.5)', html: '<svg viewBox="0 0 24 24" style="width:22px;height:22px;" fill="var(--fg)"><path d="M13.2 0L3.6 14.4h6l-2.4 9.6L16.8 9.6h-6z"/></svg>' },
        didi:    { bg: '#FF6900', border: 'rgba(255,105,0,0.5)', html: '<svg viewBox="0 0 32 32" style="width:22px;height:22px;" fill="none"><path d="M6 8h8c5.523 0 10 4.477 10 10S19.523 28 14 28H6V8z" stroke="white" stroke-width="3" fill="none"/><path d="M23 8h3v20h-3z" fill="white"/></svg>' },
        grab:    { bg: '#00B14F', border: 'rgba(0,177,79,0.5)', html: '<img src="https://cdn.simpleicons.org/grab/white" style="width:22px;height:22px;">' },
        indrive: { bg: 'var(--bg-raised)', border: '#2DBE60', html: '<svg viewBox="0 0 40 28" style="width:28px;height:20px;" fill="none"><text x="2" y="20" font-family="Arial Black,Arial,sans-serif" font-size="16" font-weight="900" fill="#2DBE60">iD</text></svg>' }
      };
      const pi = providerIcons[providerId] || { bg: '#222', border: '#444', html: '' };
      iconEl.style.display = 'flex';
      iconEl.style.background = pi.bg;
      iconEl.style.boxShadow = `0 4px 16px ${pi.border}, 0 0 0 1px ${pi.border}`;
      iconEl.innerHTML = pi.html;
    }

    if (subtitle) {
      if (providerId === 'uber') {
        subtitle.textContent = "Request a ride";
      } else if (providerId === 'lyft') {
        subtitle.textContent = "Where are you going?";
      } else if (providerId === 'bolt') {
        subtitle.textContent = "Fast and affordable rides";
      } else if (providerId === 'didi') {
        subtitle.textContent = "Global ride hailing service";
      } else if (providerId === 'grab') {
        subtitle.textContent = "Southeast Asia's leading ride app";
      } else if (providerId === 'indrive') {
        subtitle.textContent = "Fair prices by negotiation";
      } else {
        subtitle.textContent = "Aggregated dispatch service";
      }
      subtitle.className = "text-[12px] font-sans font-medium text-zinc-400 mb-6 transition-all duration-300";
    }

    if (routeInputCard) {
      routeInputCard.className = "bg-zinc-900/40 border rounded-2xl p-4 mb-6 relative overflow-hidden shadow-xl transition-all duration-300 provider-border-color";
    }

    if (routeBar) {
      routeBar.className = "absolute right-0 top-0 bottom-0 w-1 transition-all duration-300 provider-accent-bg";
    }

    if (pickupIndicator) {
      pickupIndicator.className = "w-3 h-3 rounded-full transition-all duration-300 provider-accent-bg";
      pickupIndicator.style.boxShadow = 'none';
    }

    if (gpsBtn) {
      gpsBtn.className = "bg-white/5 hover:bg-white/10 text-white px-3 py-1 rounded text-[10px] font-bold font-sans tracking-wide uppercase transition-all duration-300";
    }

    if (handshakeDot) {
      handshakeDot.className = "w-3 h-3 rounded-full animate-pulse transition-all duration-300 provider-accent-bg";
      handshakeDot.style.boxShadow = 'none';
    }

    if (handshakeText) {
      handshakeText.className = "text-[12px] text-zinc-300 font-sans tracking-normal transition-all duration-300";
      handshakeText.textContent = "Awaiting destination to fetch live vehicles...";
    }

    if (searchRidesBtn) {
      searchRidesBtn.className = "w-full font-sans font-bold text-[16px] py-4 rounded-xl transition-all duration-300 mt-auto provider-btn-main";
      searchRidesBtn.textContent = `Search ${providerName}`;
    }

    // 5. Initialize dynamic map
    this.updateMapHUD(providerId, 'idle');

    // 5.5 Sync with backend state first to avoid stale localStorage issues
    try {
      const res = await fetch('/api/backend-state');
      const data = await res.json();
      const pState = data[providerId];
      if (pState) {
        if (pState.loggedIn) {
          localStorage.setItem('autotriage_logged_in_' + providerId, 'true');
          localStorage.setItem('autotriage_phone_' + providerId, pState.phone || '+1 (555) 0199');
        } else {
          localStorage.removeItem('autotriage_logged_in_' + providerId);
          localStorage.removeItem('autotriage_phone_' + providerId);
        }
      }
    } catch (err) {
      console.warn('[DESKTOP RIDE] Failed to sync backend state during activation:', err);
    }

    // 6. Check login state
    const isLoggedIn = localStorage.getItem('autotriage_logged_in_' + providerId) === 'true';
    const authBadge = document.getElementById('providerAuthBadge');
    const badgeText = document.getElementById('authBadgeText');
    const loginContainer = document.getElementById('rideLoginContainer');
    const bookingForm = document.getElementById('rideBookingFormContainer');
    const passengerPhone = document.getElementById('passengerPhone');

    if (isLoggedIn) {
      const userPhone = localStorage.getItem('autotriage_phone_' + providerId) || '+1 (555) 0199';
      if (authBadge) authBadge.style.display = 'flex';
      if (badgeText) badgeText.textContent = userPhone;
      if (loginContainer) loginContainer.style.display = 'none';
      if (bookingForm) bookingForm.style.display = 'flex';
      if (passengerPhone) passengerPhone.value = userPhone;
    } else {
      if (authBadge) authBadge.style.display = 'none';
      if (loginContainer) loginContainer.style.display = 'flex';
      if (bookingForm) bookingForm.style.display = 'none';
      this.renderProviderLogin(providerId);
    }

    // 7. Start real-time sync status monitor
    this.syncBackendConsole();
    if (!window.syncMonitorInterval) {
      window.syncMonitorInterval = setInterval(() => this.syncBackendConsole(), 2500);
    }
  },

  returnToProviderSelect: function() {
    // Hide dispatch engine pane
    const engine = document.getElementById('dispatchEnginePane');
    if (engine) {
      engine.classList.add('opacity-0', 'translate-y-full', 'pointer-events-none');
    }
    // Stop sync monitor
    if (window.syncMonitorInterval) {
      clearInterval(window.syncMonitorInterval);
      window.syncMonitorInterval = null;
    }
    // Reset provider icon
    const iconEl = document.getElementById('dispatchProviderIcon');
    if (iconEl) { iconEl.style.display = 'none'; iconEl.innerHTML = ''; }
    // Show the VIP showcase
    const showcase = document.getElementById('vipShowcase');
    if (showcase) {
      showcase.style.display = 'flex';
      requestAnimationFrame(() => {
        showcase.style.opacity = '1';
        showcase.style.transform = 'translateY(0)';
      });
    }
  },

  renderProviderLogin: function(providerId) {
    const container = document.getElementById('rideLoginContainer');
    if (!container) return;

    let brandText = 'Uber';
    let btnClass = 'provider-btn-main';
    let promptText = 'Enter your phone number to sign in';
    let oauthUrl = '';

    if (providerId === 'uber') {
      brandText = 'Uber';
      const clientId = 'cBSZU3HuKr7cPaL-zLyUrYid0f5UiH5e';
      const redirectUri = 'http://localhost:8080/api/auth-callback';
      oauthUrl = `https://login.uber.com/oauth/v2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=profile`;
    } else if (providerId === 'lyft') {
      brandText = 'Lyft';
      promptText = 'What is your mobile number?';
    } else if (providerId === 'bolt') {
      brandText = 'Bolt';
      promptText = 'Enter your phone number';
    } else if (providerId === 'didi') {
      brandText = 'DiDi';
      promptText = 'Enter your mobile number';
    } else if (providerId === 'grab') {
      brandText = 'Grab';
      promptText = 'Sign in with your phone number';
    } else if (providerId === 'indrive') {
      brandText = 'InDrive';
      promptText = 'Enter your phone number';
    } else {
      brandText = providerId.toUpperCase();
      promptText = 'Sign in with your phone number';
    }

    let oauthButtonHtml = '';
    if (oauthUrl) {
      oauthButtonHtml = `
        <div class="mb-6">
          <button onclick="window.location.href='${oauthUrl}'" class="w-full bg-white text-black font-sans font-bold text-sm py-4 rounded-lg hover:bg-zinc-200 transition-all uppercase tracking-wide flex items-center justify-center gap-2">
            <span>🔑</span> Connect Real ${brandText} Account
          </button>
        </div>
        <div class="flex items-center gap-2 mb-6">
          <div class="h-px bg-white/10 flex-1"></div>
          <span class="text-[10px] text-zinc-500 uppercase tracking-widest">or</span>
          <div class="h-px bg-white/10 flex-1"></div>
        </div>
      `;
    }

    const countries = window.ALL_COUNTRIES || [
      { name: "Nigeria", dial: "+234", code: "NG", flag: "🇳🇬" },
      { name: "United Kingdom", dial: "+44", code: "GB", flag: "🇬🇧" },
      { name: "United States", dial: "+1", code: "US", flag: "🇺🇸" }
    ];

    const countryOptions = countries.map(c => {
      const selected = (c.code === 'US') ? 'selected' : '';
      return `<option value="${c.dial}" ${selected}>${c.code} (${c.dial}) — ${c.name}</option>`;
    }).join('');

    container.innerHTML = `
      <div class="flex flex-col flex-1 py-8 font-sans text-white text-left">
        ${oauthButtonHtml}
        
        <h2 class="text-base font-bold tracking-tight mb-2">${promptText}</h2>
        <p class="text-[11px] text-zinc-400 mb-6">Enter your phone number to sign in securely.</p>
        
        <div class="mb-6 flex gap-2">
          <!-- Country code select -->
          <select id="loginCountryCode" class="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-sm font-sans text-white outline-none focus:border-zinc-500 transition-all provider-input-focus" style="max-width: 155px; cursor: pointer; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
            ${countryOptions}
          </select>
          <input type="tel" id="loginPhoneInput" placeholder="(555) 000-0000" class="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-sm font-sans tracking-wide text-white outline-none focus:border-zinc-500 transition-all provider-input-focus" />
        </div>

        <button onclick="app.sendProviderSMSOTP()" class="${btnClass} w-full py-4 text-sm font-bold rounded-xl transition-all mt-6">
          Continue
        </button>
        <!-- Spacer to ensure dropdown opens downwards -->
        <div class="h-32"></div>
      </div>
    `;

    // Attach listener to update placeholder dynamically based on chosen country
    const countrySelect = document.getElementById('loginCountryCode');
    const phoneInput = document.getElementById('loginPhoneInput');
    if (countrySelect && phoneInput) {
      // Set initial placeholder based on default selection (US)
      phoneInput.placeholder = '(555) 000-0000';
      
      countrySelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === '+234') {
          phoneInput.placeholder = '803 123 4567';
        } else if (val === '+44') {
          phoneInput.placeholder = '7123 456789';
        } else if (val === '+1') {
          phoneInput.placeholder = '(555) 000-0000';
        } else if (val === '+49') {
          phoneInput.placeholder = '170 1234567';
        } else if (val === '+91') {
          phoneInput.placeholder = '98765 43210';
        } else {
          phoneInput.placeholder = '123 456 7890';
        }
      });
    }
  },

  sendProviderSMSOTP: function() {
    const phoneInput = document.getElementById('loginPhoneInput');
    const countrySelect = document.getElementById('loginCountryCode');
    if (!phoneInput || !phoneInput.value.trim()) {
      alert('Please enter a valid phone number');
      return;
    }
    const countryCode = countrySelect ? countrySelect.value : '+1';
    const rawPhone = phoneInput.value.trim();
    const phone = `${countryCode} ${rawPhone}`;
    this.tempLoginPhone = phone;

    const container = document.getElementById('rideLoginContainer');
    if (!container) return;

    let btnClass = 'provider-btn-main';

    // Show loading spinner briefly
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center flex-1 py-12 text-zinc-400 font-sans">
        <div class="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4 provider-accent-bg"></div>
        <span class="text-xs">Sending secure verification code to ${phone}...</span>
      </div>
    `;

    setTimeout(() => {
      container.innerHTML = `
        <div class="flex flex-col flex-1 py-8 font-sans text-white text-left">
          <h2 class="text-xl font-bold tracking-tight mb-2">Verify your number</h2>
          <p class="text-xs text-zinc-400 mb-6">Enter the 4-digit code sent to <span class="text-white font-semibold">${phone}</span></p>
          
          <div class="flex gap-3 justify-start mb-6">
            <input type="text" maxlength="1" class="otp-box w-12 h-14 bg-zinc-900/40 border border-zinc-800 rounded-xl text-center text-xl font-bold outline-none focus:border-zinc-500 transition-all text-white provider-input-focus" />
            <input type="text" maxlength="1" class="otp-box w-12 h-14 bg-zinc-900/40 border border-zinc-800 rounded-xl text-center text-xl font-bold outline-none focus:border-zinc-500 transition-all text-white provider-input-focus" />
            <input type="text" maxlength="1" class="otp-box w-12 h-14 bg-zinc-900/40 border border-zinc-800 rounded-xl text-center text-xl font-bold outline-none focus:border-zinc-500 transition-all text-white provider-input-focus" />
            <input type="text" maxlength="1" class="otp-box w-12 h-14 bg-zinc-900/40 border border-zinc-800 rounded-xl text-center text-xl font-bold outline-none focus:border-zinc-500 transition-all text-white provider-input-focus" />
          </div>

          <div class="text-xs text-zinc-500 mb-8">
            Didn't receive code? <button onclick="app.sendProviderSMSOTP()" class="text-white underline hover:text-zinc-300 border-none bg-transparent cursor-pointer">Resend</button>
          </div>

          <button onclick="app.verifyProviderSMSOTP()" class="${btnClass} w-full py-4 text-sm font-bold rounded-xl transition-all mt-auto">
            Verify & Continue
          </button>
        </div>
      `;

      // Automatically focus next input box
      const otpBoxes = document.querySelectorAll('.otp-box');
      otpBoxes.forEach((box, idx) => {
        box.addEventListener('input', (e) => {
          if (e.target.value.length === 1 && idx < otpBoxes.length - 1) {
            otpBoxes[idx + 1].focus();
          }
        });
        box.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !e.target.value && idx > 0) {
            otpBoxes[idx - 1].focus();
          }
        });
      });
      otpBoxes[0].focus();
    }, 1000);
  },

  verifyProviderSMSOTP: async function() {
    const otpBoxes = document.querySelectorAll('.otp-box');
    let code = '';
    otpBoxes.forEach(box => code += box.value);
    
    if (code.length < 4) {
      alert('Please enter the complete 4-digit code');
      return;
    }

    const providerId = this.selectedVipProvider.id;
    const phone = this.tempLoginPhone || '+1 (555) 0199';

    // Show loading spinner
    const container = document.getElementById('rideLoginContainer');
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center flex-1 py-12 text-zinc-400 font-sans">
        <div class="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4 provider-accent-bg"></div>
        <span class="text-xs">Verifying code and establishing secure token...</span>
      </div>
    `;

    try {
      // Sync login status with the backend database
      const res = await fetch('/api/backend-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          providerId: providerId,
          phone: phone
        })
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem('autotriage_logged_in_' + providerId, 'true');
        localStorage.setItem('autotriage_phone_' + providerId, phone);

        // Transition layout
        this.activateDispatchEngine(this.selectedVipProvider.name);
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (err) {
      console.error('Login sync failed:', err);
      alert('Verification failed. Please try again.');
      this.sendProviderSMSOTP();
    }
  },

  signOutProvider: async function() {
    const p = this.selectedVipProvider;
    if (!p) return;
    localStorage.removeItem('autotriage_logged_in_' + p.id);
    localStorage.removeItem('autotriage_phone_' + p.id);
    
    // Clear on the backend too!
    try {
      await fetch('/api/backend-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', providerId: p.id })
      });
    } catch (err) {
      console.error('Logout sync error:', err);
    }

    // Refresh layout
    this.activateDispatchEngine(p.name);
    this.syncBackendConsole();
  },

  syncBackendConsole: async function() {
    const grid = document.getElementById('syncMonitorGrid');
    if (!grid) return;

    try {
      const res = await fetch('/api/backend-state');
      const data = await res.json();

      let html = '';
      const providers = [
        { id: 'uber', name: 'Uber API Node', accentText: 'provider-accent-text', accentBorder: 'border-zinc-800' },
        { id: 'lyft', name: 'Lyft API Node', accentText: 'text-[#FF00BF]', accentBorder: 'border-[#FF00BF]/10' },
        { id: 'bolt', name: 'Bolt API Node', accentText: 'text-[#34D186]', accentBorder: 'border-[#34D186]/10' },
        { id: 'didi', name: 'DiDi API Node', accentText: 'text-[#FF7A00]', accentBorder: 'border-[#FF7A00]/10' },
        { id: 'grab', name: 'Grab API Node', accentText: 'text-[#00B14F]', accentBorder: 'border-[#00B14F]/10' },
        { id: 'indrive', name: 'InDrive API Node', accentText: 'text-[#00A9E0]', accentBorder: 'border-[#00A9E0]/10' }
      ];

      providers.forEach(p => {
        const pState = data[p.id] || { loggedIn: false, phone: null, booking: null };
        
        let statusHtml = '';
        if (pState.loggedIn) {
          statusHtml = `<span class="text-[9px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Connected (${pState.phone})</span>`;
        } else {
          statusHtml = `<span class="text-[9px] font-bold text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/20">Disconnected</span>`;
        }

        let bookingHtml = '';
        if (pState.booking) {
          bookingHtml = `
            <div class="mt-2 pt-2 border-t border-white/5 text-left text-[11px] font-sans text-zinc-300">
              <div class="flex justify-between items-center">
                <span class="font-bold text-white uppercase text-[9px]">${pState.booking.rideType}</span>
                <span class="text-[9px] text-zinc-500">${pState.booking.bookingId}</span>
              </div>
              <div class="text-[10px] text-zinc-400 mt-1">
                Driver: <span class="text-white font-semibold">${pState.booking.driver.name}</span> | Plate: <span class="font-mono text-white">${pState.booking.driver.plate}</span>
              </div>
              <div class="text-[10px] text-zinc-400 mt-0.5 flex justify-between">
                <span>To: ${pState.booking.destination.slice(0, 22)}${pState.booking.destination.length > 22 ? '...' : ''}</span>
                <span class="text-green-400 font-bold">${pState.booking.eta}m ETA</span>
              </div>
            </div>
          `;
        } else {
          bookingHtml = `
            <div class="text-[10px] text-zinc-600 italic mt-2 text-left">No active booking session</div>
          `;
        }

        let linkIndicatorClass = pState.loggedIn ? 'bg-green-400 animate-pulse' : 'bg-zinc-600';

        html += `
          <div class="bg-zinc-950/80 border ${p.accentBorder} p-3 rounded-xl flex flex-col justify-between transition-all duration-300">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full ${linkIndicatorClass}"></span>
                <span class="text-[11px] font-bold text-white">${p.name}</span>
              </div>
              ${statusHtml}
            </div>
            ${bookingHtml}
          </div>
        `;
      });

      grid.innerHTML = html;
    } catch (err) {
      console.error('Error syncing backend monitor console:', err);
    }
  },

  dispatchVIPRide: async function() {
    const p = this.selectedVipProvider || { id: 'uber', name: 'Uber' };
    document.getElementById('searchRidesBtn').style.display = 'none';
    
    // Show Loading Fares State
    const fareState = document.getElementById('rideFareEstimates');
    const fareCards = document.getElementById('fareEstimateCards');
    fareState.style.display = 'block';
    
    // Update live Map HUD to loading
    this.updateMapHUD(p.id, 'loading');

    let loaderHtml = '';
    if (p.id === 'uber') {
      loaderHtml = `
        <div class="p-6 border border-zinc-900 bg-[#0c0c0c] rounded-xl flex flex-col gap-4 text-white font-sans mt-4">
          <div class="flex justify-between items-center">
            <span class="text-sm font-bold tracking-tight text-zinc-200">Finding your ride options...</span>
            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div class="w-full bg-zinc-900 h-1 rounded overflow-hidden">
            <div class="bg-white h-full animate-[shimmer_1.5s_infinite] w-1/3"></div>
          </div>
        </div>
      `;
    } else if (p.id === 'lyft') {
      loaderHtml = `
        <div class="p-6 border border-[#FF00BF]/20 bg-[#120f16] rounded-2xl flex flex-col gap-4 text-white font-sans mt-4">
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-zinc-300">Searching for Lyft drivers...</span>
            <div class="w-5 h-5 border-2 border-[#FF00BF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      `;
    } else if (p.id === 'bolt') {
      loaderHtml = `
        <div class="p-6 border border-[#34D186]/20 bg-[#0a0f0c] rounded-xl flex flex-col gap-4 text-white font-sans mt-4">
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-zinc-300">Checking Bolt pricing...</span>
            <div class="w-5 h-5 border-2 border-[#34D186] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      `;
    } else {
      loaderHtml = `
        <div class="p-6 border border-[#00A9E0]/20 bg-[#09121a] rounded-xl flex flex-col gap-4 text-white font-sans mt-4">
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold text-zinc-300">Connecting to autonomous network...</span>
            <div class="w-5 h-5 border-2 border-[#00A9E0] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      `;
    }
    fareCards.innerHTML = loaderHtml;

    try {
      const passengerName = document.getElementById('passengerName') ? document.getElementById('passengerName').value : '';
      const stop1 = document.getElementById('rideStop1') ? document.getElementById('rideStop1').value : '';
      const options = {
        schedule: document.getElementById('optSchedule') ? document.getElementById('optSchedule').checked : false,
      };
      
      const res = await fetch('/api/estimate-fare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: p.id,
          pickupLocation: document.getElementById('rideFrom').value || 'Current Location',
          destination: document.getElementById('rideTo').value || 'Unknown Destination',
          advancedOptions: options
        })
      });

      const data = await res.json();
      
      if (data.success && data.vehicles) {
        let html = '';
        data.vehicles.forEach(v => {
          let svgIcon = '';
          if (v.name.toLowerCase().includes('comfort') || v.name.toLowerCase().includes('black') || v.name.toLowerCase().includes('premium') || v.name.toLowerCase().includes('preferred') || v.name.toLowerCase().includes('lux')) {
            // Luxury Sedan SVG
            svgIcon = `<svg width="40" height="24" viewBox="0 0 40 24" fill="currentColor" class="text-white group-hover:text-zinc-200"><path d="M38.5 13.5c-.3-1.8-1.5-3.2-3.2-3.6V8.5c0-1.1-.9-2-2-2h-18c-1.1 0-2 .9-2 2v1.4c-1.7.4-2.9 1.8-3.2 3.6-.3 1.8.4 3.6 1.8 4.6l.1.8c0 .8.7 1.5 1.5 1.5h2.5c.3-1.7 1.8-3 3.5-3s3.2 1.3 3.5 3h14c.3-1.7 1.8-3 3.5-3s3.2 1.3 3.5 3h2.5c.8 0 1.5-.7 1.5-1.5v-.8c1.4-1 2.1-2.8 1.8-4.6zm-24.5-5.5h16v2H14V8z"/></svg>`;
          } else if (v.name.toLowerCase().includes('xl') || v.name.toLowerCase().includes('max')) {
            // SUV SVG
            svgIcon = `<svg width="40" height="24" viewBox="0 0 40 24" fill="currentColor" class="text-white group-hover:text-zinc-200"><path d="M37.5 10.5h-4.3V7.2c0-.9-.7-1.7-1.7-1.7H13.5c-.9 0-1.7.8-1.7 1.7v1.1c-1.5.3-2.6 1.4-2.8 2.9l-.5 2.5c-.2.8.1 1.6.7 2.2l.1.5c0 .8.7 1.5 1.5 1.5h2.8c.4-1.8 2-3.2 4-3.2s3.6 1.4 4 3.2h10.4c.4-1.8 2-3.2 4-3.2s3.6 1.4 4 3.2h2.8c.8 0 1.5-.7 1.5-1.5v-2.5c0-1.6-1.1-2.9-2.7-3.3zM13.5 7.2h18v3.3h-18V7.2z"/></svg>`;
          } else if (v.name.toLowerCase().includes('waymo') || v.name.toLowerCase().includes('didi') || v.name.toLowerCase().includes('grab') || v.name.toLowerCase().includes('indrive')) {
            svgIcon = `<svg width="40" height="24" viewBox="0 0 40 24" fill="currentColor" class="text-white group-hover:text-zinc-200"><path d="M37.5 11.5h-4.3V8.2c0-.9-.7-1.7-1.7-1.7H13.5c-.9 0-1.7.8-1.7 1.7v1.1c-1.5.3-2.6 1.4-2.8 2.9l-.5 2.5c-.2.8.1 1.6.7 2.2l.1.5c0 .8.7 1.5 1.5 1.5h2.8c.4-1.8 2-3.2 4-3.2s3.6 1.4 4 3.2h10.4c.4-1.8 2-3.2 4-3.2s3.6 1.4 4 3.2h2.8c.8 0 1.5-.7 1.5-1.5v-2.5c0-1.6-1.1-2.9-2.7-3.3zm-16-7.5c-1.4 0-2.5 1.1-2.5 2.5h5c0-1.4-1.1-2.5-2.5-2.5zM13.5 8.2h18v3.3h-18V8.2z"/></svg>`;
          } else {
            svgIcon = `<svg width="40" height="24" viewBox="0 0 40 24" fill="currentColor" class="text-white group-hover:text-zinc-200"><path d="M36 12.2V9.8c0-.7-.4-1.3-1-1.6L29.5 5.5c-.7-.4-1.5-.6-2.3-.6H12.8c-.8 0-1.6.2-2.3.6L5 8.2c-.6.3-1 .9-1 1.6v2.4c-1.2.4-2 1.5-2 2.8v2.5c0 .8.7 1.5 1.5 1.5h2.8c.4-1.8 2-3.2 4-3.2s3.6 1.4 4 3.2h10.4c.4-1.8 2-3.2 4-3.2s3.6 1.4 4 3.2h2.8c.8 0 1.5-.7 1.5-1.5v-2.5c0-1.3-.8-2.4-2-2.8zM12.8 6.5h14.4l4.2 2.5H8.6l4.2-2.5z"/></svg>`;
          }

          let cardClasses = '';
          if (p.id === 'uber') {
            cardClasses = `bg-black border-b border-zinc-900 p-4 hover:bg-zinc-900/60 flex justify-between items-center group cursor-pointer transition-all duration-200`;
          } else if (p.id === 'lyft') {
            cardClasses = `bg-[#131118]/60 border border-zinc-800 hover:border-[#FF00BF]/50 p-4 rounded-2xl flex justify-between items-center group cursor-pointer transition-all duration-200 hover:bg-[#FF00BF]/5`;
          } else if (p.id === 'bolt') {
            cardClasses = `bg-[#0e120f]/60 border border-zinc-800 hover:border-[#34D186]/50 p-4 rounded-xl flex justify-between items-center group cursor-pointer transition-all duration-200 hover:bg-[#34D186]/5`;
          } else if (p.id === 'didi') {
            cardClasses = `bg-[#150f0c]/60 border border-zinc-800 hover:border-[#FF7A00]/50 p-4 rounded-xl flex justify-between items-center group cursor-pointer transition-all duration-200 hover:bg-[#FF7A00]/5`;
          } else if (p.id === 'grab') {
            cardClasses = `bg-[#0c150f]/60 border border-zinc-800 hover:border-[#00B14F]/50 p-4 rounded-xl flex justify-between items-center group cursor-pointer transition-all duration-200 hover:bg-[#00B14F]/5`;
          } else {
            cardClasses = `bg-[#091118]/60 border border-zinc-800 hover:border-[#00A9E0]/50 p-4 rounded-xl flex justify-between items-center group cursor-pointer transition-all duration-200 hover:bg-[#00A9E0]/5`;
          }

          html += `
            <div class="${cardClasses}" onclick="app.showPayment('${v.id}', '${v.name}', '${v.price}', '${v.eta}')">
              <div class="flex items-center gap-4 relative z-10">
                <div class="w-14 h-10 flex items-center justify-center rounded-lg transition-all">
                  ${svgIcon}
                </div>
                <div class="text-left font-sans">
                  <div class="text-[15px] font-bold text-white group-hover:text-white transition-colors">
                    ${v.name} 
                    <span class="text-[10px] opacity-75 font-normal ml-2">
                      • 👤 ${v.capacity}
                    </span>
                  </div>
                  <div class="text-[11px] text-zinc-400 font-sans mt-0.5">${v.desc}</div>
                </div>
              </div>
              <div class="text-right font-sans relative z-10">
                <div class="text-[18px] font-bold text-white group-hover:text-white transition-colors">${v.price}</div>
                <div class="text-[11px] text-zinc-400 font-sans mt-0.5">${v.eta} MIN ETA</div>
              </div>
            </div>
          `;
        });
        fareCards.innerHTML = html;
        this.currentLiveVehicles = data.vehicles;
        
        this.updateMapHUD(p.id, 'vehicles');
      } else {
        throw new Error(data.error || 'Failed to estimate fares');
      }
    } catch (err) {
      console.error(err);
      fareCards.innerHTML = `
        <div class="p-8 text-center border border-red-500/30 bg-red-500/5 rounded-2xl mt-4 font-sans text-white">
          <div class="text-3xl mb-3">⚠️</div>
          <div class="text-base font-bold text-red-400 tracking-tight">Could Not Fetch Rides</div>
          <div class="text-xs text-zinc-400 mt-1">Unable to establish connection to the ${p.name} network.</div>
          <button class="mt-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-sans text-xs font-semibold" onclick="document.getElementById('rideFareEstimates').style.display='none'; document.getElementById('searchRidesBtn').style.display='block';">← Try Again</button>
        </div>
      `;
    }
  },

  showPayment: function(vehicleId, vehicleName, price, eta) {
    document.getElementById('rideFareEstimates').style.display = 'none';
    const paymentForm = document.getElementById('ridePaymentForm');
    paymentForm.style.display = 'block';
    
    this.selectedVehicleForBooking = { id: vehicleId, name: vehicleName, price: price, eta: eta };
    const p = this.selectedVipProvider || { id: 'uber', name: 'Uber' };

    let checkoutTitle = 'Confirm Payment';
    let buttonClass = 'provider-btn-main';
    let buttonText = `Confirm Booking`;
    let wrapperClass = 'p-6 border border-zinc-800 rounded-xl bg-black';
    let radioAccent = 'accent-white';

    if (p.id === 'uber') {
      checkoutTitle = 'Uber Checkout';
      buttonText = `Confirm ${vehicleName}`;
      buttonClass = `w-full bg-white text-black font-sans font-bold text-base py-4 rounded-lg hover:bg-zinc-200 transition-all uppercase tracking-wide`;
      wrapperClass = `p-6 border border-zinc-900 bg-[#0c0c0c] rounded-xl text-white font-sans mt-4`;
      radioAccent = 'accent-white';
    } else if (p.id === 'lyft') {
      checkoutTitle = 'Lyft Checkout';
      buttonText = `Confirm Lyft`;
      buttonClass = `w-full bg-[#FF00BF] text-white font-sans font-bold text-base py-4 rounded-full hover:bg-[#d4009e] transition-all uppercase tracking-wide`;
      wrapperClass = `p-6 border border-[#FF00BF]/10 bg-[#0c0b0e] rounded-2xl text-white font-sans mt-4`;
      radioAccent = 'accent-[#FF00BF]';
    } else if (p.id === 'bolt') {
      checkoutTitle = 'Bolt Checkout';
      buttonText = `Confirm Bolt`;
      buttonClass = `w-full bg-[#34D186] text-black font-sans font-bold text-base py-4 rounded-xl hover:bg-[#2cb272] transition-all uppercase tracking-wide`;
      wrapperClass = `p-6 border border-[#34D186]/10 bg-[#0a0f0c] rounded-xl text-white font-sans mt-4`;
      radioAccent = 'accent-[#34D186]';
    } else if (p.id === 'didi') {
      checkoutTitle = 'DiDi Checkout';
      buttonText = `Confirm DiDi`;
      buttonClass = `w-full bg-[#FF7A00] text-white font-sans font-bold text-base py-4 rounded-xl hover:bg-[#e06b00] transition-all uppercase tracking-wide`;
      wrapperClass = `p-6 border border-[#FF7A00]/10 bg-[#0f0c0a] rounded-xl text-white font-sans mt-4`;
      radioAccent = 'accent-[#FF7A00]';
    } else if (p.id === 'grab') {
      checkoutTitle = 'Grab Checkout';
      buttonText = `Confirm Grab`;
      buttonClass = `w-full bg-[#00B14F] text-white font-sans font-bold text-base py-4 rounded-xl hover:bg-[#009440] transition-all uppercase tracking-wide`;
      wrapperClass = `p-6 border border-[#00B14F]/10 bg-[#0a0f0b] rounded-xl text-white font-sans mt-4`;
      radioAccent = 'accent-[#00B14F]';
    } else {
      checkoutTitle = 'InDrive Checkout';
      buttonText = `Confirm InDrive`;
      buttonClass = `w-full bg-[#00A9E0] text-white font-sans font-bold text-base py-4 rounded-xl hover:bg-[#008cb8] transition-all uppercase tracking-wide`;
      wrapperClass = `p-6 border border-[#00A9E0]/10 bg-[#08111a] rounded-xl text-white font-sans mt-4`;
      radioAccent = 'accent-[#00A9E0]';
    }

    paymentForm.innerHTML = `
      <div class="${wrapperClass} shadow-xl relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800">
            <div class="text-left font-sans">
              <div class="text-lg font-bold text-white tracking-tight">${checkoutTitle}</div>
              <div class="text-[10px] text-zinc-400 tracking-wider uppercase mt-0.5">Headless API Dispatch Tunnel</div>
            </div>
          </div>
          
          <div class="flex justify-between items-center mb-6 font-sans">
            <div>
              <div class="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">Selected Vehicle</div>
              <div class="text-lg font-bold text-white">${vehicleName}</div>
              <div class="text-[11px] text-zinc-400">ETA: ${eta} MIN</div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">Fare Amount</div>
              <div class="text-2xl font-bold text-white">${price}</div>
            </div>
          </div>
          
          <div class="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 mb-6 font-sans">
            <div class="text-[10px] text-zinc-400 uppercase tracking-wider mb-3">Select Payment Method</div>
            
            <label class="flex items-center gap-3 mb-3 cursor-pointer group">
              <input type="radio" name="payMethod" id="payApple" checked class="${radioAccent} w-4 h-4">
              <span class="text-zinc-200 text-[12px] group-hover:text-white transition-colors">🍏 Apple Pay (Biometric Auth)</span>
            </label>
            
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="radio" name="payMethod" id="payCard" class="${radioAccent} w-4 h-4">
              <span class="text-zinc-200 text-[12px] group-hover:text-white transition-colors">💳 Personal Card (•••• 4099)</span>
            </label>
          </div>
          
          <button class="${buttonClass}" onclick="app.bookVIPRide()">
            ${buttonText}
          </button>
          <button class="w-full mt-4 text-zinc-500 font-sans text-xs uppercase tracking-wider hover:text-white transition-all border-none bg-transparent cursor-pointer" onclick="document.getElementById('ridePaymentForm').style.display='none'; document.getElementById('rideFareEstimates').style.display='block';">← Go Back</button>
        </div>
      </div>
    `;
  },

  bookVIPRide: async function() {
    const p = this.selectedVipProvider || { id: 'uber', name: 'Uber' };
    const v = this.selectedVehicleForBooking;
    
    document.getElementById('ridePaymentForm').style.display = 'none';
    const inlineState = document.getElementById('rideInlineBookingState');
    inlineState.style.display = 'block';

    let loaderHtml = '';
    if (p.id === 'uber') {
      loaderHtml = `
        <div class="p-8 text-center border border-zinc-900 bg-[#0c0c0c] rounded-2xl mt-4 font-sans text-white">
          <div class="w-10 h-10 mx-auto mb-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <div class="text-lg font-bold tracking-tight">Requesting your ride...</div>
          <div class="text-xs text-zinc-400 mt-2">Connecting you with nearby drivers</div>
        </div>
      `;
    } else if (p.id === 'lyft') {
      loaderHtml = `
        <div class="p-8 text-center border border-[#FF00BF]/20 bg-[#0c0b0e] rounded-2xl mt-4 font-sans text-white">
          <div class="w-10 h-10 mx-auto mb-4 border-2 border-[#FF00BF] border-t-transparent rounded-full animate-spin"></div>
          <div class="text-lg font-bold tracking-tight">Booking Lyft...</div>
          <div class="text-xs text-zinc-400 mt-2">Connecting with driver partners</div>
        </div>
      `;
    } else if (p.id === 'bolt') {
      loaderHtml = `
        <div class="p-8 text-center border border-[#34D186]/20 bg-[#0a0f0c] rounded-2xl mt-4 font-sans text-white">
          <div class="w-10 h-10 mx-auto mb-4 border-2 border-[#34D186] border-t-transparent rounded-full animate-spin"></div>
          <div class="text-lg font-bold tracking-tight">Requesting Bolt...</div>
          <div class="text-xs text-zinc-400 mt-2">Dispatching closest vehicle</div>
        </div>
      `;
    } else if (p.id === 'didi') {
      loaderHtml = `
        <div class="p-8 text-center border border-[#FF7A00]/20 bg-[#0f0c0a] rounded-2xl mt-4 font-sans text-white">
          <div class="w-10 h-10 mx-auto mb-4 border-2 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
          <div class="text-lg font-bold tracking-tight">Booking DiDi...</div>
          <div class="text-xs text-zinc-400 mt-2">Connecting with nearby drivers</div>
        </div>
      `;
    } else if (p.id === 'grab') {
      loaderHtml = `
        <div class="p-8 text-center border border-[#00B14F]/20 bg-[#0a0f0b] rounded-2xl mt-4 font-sans text-white">
          <div class="w-10 h-10 mx-auto mb-4 border-2 border-[#00B14F] border-t-transparent rounded-full animate-spin"></div>
          <div class="text-lg font-bold tracking-tight">Requesting Grab...</div>
          <div class="text-xs text-zinc-400 mt-2">Finding available drivers</div>
        </div>
      `;
    } else {
      loaderHtml = `
        <div class="p-8 text-center border border-[#00A9E0]/20 bg-[#08111a] rounded-2xl mt-4 font-sans text-white">
          <div class="w-10 h-10 mx-auto mb-4 border-2 border-[#00A9E0] border-t-transparent rounded-full animate-spin"></div>
          <div class="text-lg font-bold tracking-tight">Requesting InDrive...</div>
          <div class="text-xs text-zinc-400 mt-2">Connecting with driver partners</div>
        </div>
      `;
    }
    inlineState.innerHTML = loaderHtml;

    try {
      const passengerName = document.getElementById('passengerName') ? document.getElementById('passengerName').value : '';
      const passengerPhone = document.getElementById('passengerPhone') ? document.getElementById('passengerPhone').value : '';
      const stop1 = document.getElementById('rideStop1') ? document.getElementById('rideStop1').value : '';
      
      const options = {
        splitFare: document.getElementById('optSplitFare') ? document.getElementById('optSplitFare').checked : false,
        schedule: document.getElementById('optSchedule') ? document.getElementById('optSchedule').checked : false,
        quiet: document.getElementById('optQuiet') ? document.getElementById('optQuiet').checked : false,
        coldAC: document.getElementById('optColdAC') ? document.getElementById('optColdAC').checked : false,
        music: document.getElementById('optMusic') ? document.getElementById('optMusic').checked : false,
        safetyPIN: document.getElementById('optSafetyPIN') ? document.getElementById('optSafetyPIN').checked : false,
        insurance: document.getElementById('optInsurance') ? document.getElementById('optInsurance').checked : false,
        wheelchair: document.getElementById('optWheelchair') ? document.getElementById('optWheelchair').checked : false,
        language: document.getElementById('driverLanguage') ? document.getElementById('driverLanguage').value : 'en'
      };
      
      const savedUserStr = localStorage.getItem('autotriage_user');
      const savedUserObj = savedUserStr ? JSON.parse(savedUserStr) : null;
      const passengerEmail = savedUserObj ? savedUserObj.email : 'local_device_session@autotriage.io';

      const res = await fetch('/api/book-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: p.id,
          pickupLocation: document.getElementById('rideFrom').value || 'Current Location',
          destination: document.getElementById('rideTo').value || 'Unknown Destination',
          stop1: stop1,
          rideType: v.id,
          passengerName: passengerName,
          passengerPhone: passengerPhone,
          passengerEmail: passengerEmail,
          advancedOptions: options
        })
      });

      const data = await res.json();
      
      if (data.success) {
        // Save the booking log to localStorage
        const storedRides = JSON.parse(localStorage.getItem('autotriage_rides') || '[]');
        storedRides.unshift({
          bookingId: data.bookingId,
          provider: p.id,
          driver: data.driver,
          eta: data.eta,
          pickupLocation: document.getElementById('rideFrom').value || 'Current Location',
          destination: document.getElementById('rideTo').value || 'Unknown Destination',
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('autotriage_rides', JSON.stringify(storedRides));
        if (typeof this.renderGarageRides === 'function') {
          this.renderGarageRides();
        }
        let confirmHeader = 'Booking Confirmed';
        let confirmBg = 'bg-zinc-950 border-zinc-800';
        let accentTextClass = 'text-white';
        let plateBox = `<div class="bg-zinc-800 text-white font-mono px-3 py-1.5 rounded-lg text-xs font-bold">${data.driver.plate}</div>`;
        let doneBtnClass = 'provider-btn-main w-full py-4 mt-6 text-sm';
        let iconHtml = '🚗';

        if (p.id === 'uber') {
          confirmHeader = 'Uber Confirmed';
          confirmBg = 'bg-[#0c0c0c] border-zinc-900';
          accentTextClass = 'text-white';
          plateBox = `<div class="bg-white border border-gray-300 text-black font-sans px-3 py-1 rounded font-bold text-xs tracking-wider shadow-sm">${data.driver.plate}</div>`;
          doneBtnClass = 'w-full bg-white text-black font-sans font-bold text-sm py-4 rounded-lg hover:bg-zinc-200 transition-all uppercase tracking-wide mt-6';
          iconHtml = '⬛';
        } else if (p.id === 'lyft') {
          confirmHeader = 'Lyft Confirmed';
          confirmBg = 'bg-[#0c0b0e] border-[#FF00BF]/10';
          accentTextClass = 'text-[#FF00BF]';
          plateBox = `<div class="bg-[#FF00BF]/10 border border-[#FF00BF]/20 text-[#FF00BF] font-sans px-3 py-1 rounded-full font-bold text-xs tracking-wider">${data.driver.plate}</div>`;
          doneBtnClass = 'w-full bg-[#FF00BF] text-white font-sans font-bold text-sm py-4 rounded-full hover:bg-[#d4009e] transition-all uppercase tracking-wide mt-6';
          iconHtml = '🟣';
        } else if (p.id === 'bolt') {
          confirmHeader = 'Bolt Confirmed';
          confirmBg = 'bg-[#0a0f0c] border-[#34D186]/10';
          accentTextClass = 'text-[#34D186]';
          plateBox = `<div class="bg-[#34D186]/10 border border-[#34D186]/20 text-[#34D186] font-sans px-3 py-1 rounded-xl font-bold text-xs tracking-wider">${data.driver.plate}</div>`;
          doneBtnClass = 'w-full bg-[#34D186] text-black font-sans font-bold text-sm py-4 rounded-xl hover:bg-[#2cb272] transition-all uppercase tracking-wide mt-6';
          iconHtml = '⚡';
        } else if (p.id === 'didi') {
          confirmHeader = 'DiDi Confirmed';
          confirmBg = 'bg-[#0f0c0a] border-[#FF7A00]/10';
          accentTextClass = 'text-[#FF7A00]';
          plateBox = `<div class="bg-[#FF7A00]/10 border border-[#FF7A00]/20 text-[#FF7A00] font-sans px-3 py-1 rounded-xl font-bold text-xs tracking-wider">${data.driver.plate}</div>`;
          doneBtnClass = 'w-full bg-[#FF7A00] text-white font-sans font-bold text-sm py-4 rounded-xl hover:bg-[#e06b00] transition-all uppercase tracking-wide mt-6';
          iconHtml = '🔸';
        } else if (p.id === 'grab') {
          confirmHeader = 'Grab Confirmed';
          confirmBg = 'bg-[#0a0f0b] border-[#00B14F]/10';
          accentTextClass = 'text-[#00B14F]';
          plateBox = `<div class="bg-[#00B14F]/10 border border-[#00B14F]/20 text-[#00B14F] font-sans px-3 py-1 rounded-xl font-bold text-xs tracking-wider">${data.driver.plate}</div>`;
          doneBtnClass = 'w-full bg-[#00B14F] text-white font-sans font-bold text-sm py-4 rounded-xl hover:bg-[#009440] transition-all uppercase tracking-wide mt-6';
          iconHtml = '🟢';
        } else {
          confirmHeader = 'InDrive Confirmed';
          confirmBg = 'bg-[#08111a] border-[#00A9E0]/10';
          accentTextClass = 'text-[#00A9E0]';
          plateBox = `<div class="bg-[#00A9E0]/10 border border-[#00A9E0]/20 text-[#00A9E0] font-sans px-3 py-1 rounded-xl font-bold text-xs tracking-wider">${data.driver.plate}</div>`;
          doneBtnClass = 'w-full bg-[#00A9E0] text-white font-sans font-bold text-sm py-4 rounded-xl hover:bg-[#008ebc] transition-all uppercase tracking-wide mt-6';
          iconHtml = '🔵';
        }

        inlineState.innerHTML = `
          <div class="panel p-6 border rounded-2xl ${confirmBg} shadow-2xl relative overflow-hidden mt-4 text-white">
            <div class="relative z-10 font-sans">
              <div class="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800">
                <div class="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xl">
                  ${iconHtml}
                </div>
                <div class="text-left">
                  <div class="text-[16px] font-bold ${accentTextClass} tracking-tight">${confirmHeader}</div>
                  <div class="text-[10px] text-zinc-400 tracking-wider uppercase mt-0.5">Booking ID: ${data.bookingId}</div>
                </div>
              </div>
              
              <div class="flex justify-between items-center text-left bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 mb-4">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
                    ${data.driver.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div class="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">Your Driver</div>
                    <div class="text-[16px] font-bold text-white">${data.driver.name} <span class="text-[12px] text-yellow-400">★ ${data.driver.rating}</span></div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">ETA</div>
                  <div class="text-[20px] font-bold ${accentTextClass} leading-none">${data.eta} MIN</div>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-left">
                  <div class="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Vehicle Info</div>
                  <div class="text-[13px] font-bold text-white">${data.driver.vehicle}</div>
                  <div class="text-[10px] text-zinc-400 mt-0.5">${data.driver.color}</div>
                </div>
                <div class="bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex items-center justify-center">
                  ${plateBox}
                </div>
              </div>
              
              <button class="${doneBtnClass}" onclick="window.location.reload()">
                Done
              </button>
            </div>
          </div>
        `;

        this.updateMapHUD(p.id, 'booking', data.driver);
      } else {
        throw new Error(data.error || 'Failed to book ride');
      }
    } catch (err) {
      console.error(err);
      inlineState.innerHTML = `
        <div class="p-8 text-center border border-red-500/30 bg-red-500/5 rounded-2xl mt-4 font-sans text-white">
          <div class="text-3xl mb-3">❌</div>
          <div class="text-base font-bold text-red-400 tracking-tight">Booking Failed</div>
          <div class="text-xs text-zinc-400 mt-1">Payment authorization or network dispatch failed.</div>
          <button class="mt-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-sans text-xs font-semibold" onclick="document.getElementById('rideInlineBookingState').style.display='none'; document.getElementById('ridePaymentForm').style.display='block';">← Back to Payment</button>
        </div>
      `;
    }
  },

  speakDirection: function(text) {
    if (!this.isVoiceEnabled) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {}
  },

  // -----------------------------------------
  // STETHOSCOPE SOUND-BASED ENGINE DIAGNOSIS
  // -----------------------------------------
  stethSimMode: 'healthy',
  stethStream: null,
  stethAudioCtx: null,
  stethAnalyser: null,
  stethDataArray: null,
  stethAnimId: null,
  stethScanning: false,
  stethScanDuration: 6000,

  openStethoscope: function() {
    const overlay = document.getElementById('desktopStethoscopeOverlay');
    if (overlay) {
      overlay.style.display = 'block';
      this.selectStethSim('healthy');
      this.initStethCanvas();
    }
  },

  closeStethoscope: function() {
    this.stopStethScan();
    const overlay = document.getElementById('desktopStethoscopeOverlay');
    if (overlay) overlay.style.display = 'none';
  },

  selectStethSim: function(mode) {
    this.stethSimMode = mode;
    document.querySelectorAll('[id^="deskSimBtn-"]').forEach(btn => {
      btn.className = 'text-[9px] py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/50 font-mono font-bold cursor-pointer transition-all duration-200';
    });
    
    const activeBtn = document.getElementById(`deskSimBtn-${mode}`);
    if (activeBtn) {
      if (mode === 'healthy') {
        activeBtn.className = 'text-[9px] py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold cursor-pointer transition-all duration-200';
      } else if (mode === 'belt') {
        activeBtn.className = 'text-[9px] py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-mono font-bold cursor-pointer transition-all duration-200';
      } else if (mode === 'valve') {
        activeBtn.className = 'text-[9px] py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono font-bold cursor-pointer transition-all duration-200';
      } else if (mode === 'exhaust') {
        activeBtn.className = 'text-[9px] py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold cursor-pointer transition-all duration-200';
      }
    }
  },

  initStethCanvas: function() {
    const canvas = document.getElementById('deskStethCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw flat line
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  },

  toggleStethScan: function() {
    if (this.stethScanning) {
      this.stopStethScan();
    } else {
      this.startStethScan();
    }
  },

  startStethScan: async function() {
    const btn = document.getElementById('deskStethActionBtn');
    const dot = document.getElementById('deskStethStatusDot');
    const txt = document.getElementById('deskStethStatusText');
    const progressWrap = document.getElementById('deskStethProgressWrap');
    const progressBar = document.getElementById('deskStethProgressBar');
    
    if (btn) {
      btn.textContent = '🛑 STOP SCAN';
      btn.className = 'flex-2 bg-red-600 hover:bg-red-500 text-white font-mono font-bold py-3 rounded-xl border-none cursor-pointer transition shadow-[0_4px_12px_rgba(239,68,68,0.3)] text-[11px] tracking-wider text-center flex items-center justify-center gap-2';
    }
    if (dot) dot.style.background = '#ff8800';
    if (txt) txt.textContent = 'RECORDING MOTOR SOUND...';
    if (progressWrap) progressWrap.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '0%';
    
    this.stethScanning = true;
    
    // Attempt actual mic access
    try {
      this.stethStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stethAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.stethAnalyser = this.stethAudioCtx.createAnalyser();
      this.stethAnalyser.fftSize = 256;
      const source = this.stethAudioCtx.createMediaStreamSource(this.stethStream);
      source.connect(this.stethAnalyser);
      this.stethDataArray = new Uint8Array(this.stethAnalyser.frequencyBinCount);
    } catch (e) {
      console.warn("Stethoscope microphone permission denied. Using simulated engine waves instead.");
      this.stethStream = null;
      this.stethAudioCtx = null;
      this.stethAnalyser = null;
    }
    
    const startTime = Date.now();
    const self = this;
    
    function updateProgress() {
      if (!self.stethScanning) return;
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / self.stethScanDuration) * 100);
      if (progressBar) progressBar.style.width = `${pct}%`;
      
      if (elapsed >= self.stethScanDuration) {
        progressBar.style.width = '100%';
        self.finishStethScan();
      } else {
        requestAnimationFrame(updateProgress);
      }
    }
    
    requestAnimationFrame(updateProgress);
    this.renderStethWaves();
  },

  stopStethScan: function() {
    this.stethScanning = false;
    if (this.stethAnimId) cancelAnimationFrame(this.stethAnimId);
    
    if (this.stethStream) {
      this.stethStream.getTracks().forEach(t => t.stop());
      this.stethStream = null;
    }
    if (this.stethAudioCtx) {
      this.stethAudioCtx.close();
      this.stethAudioCtx = null;
    }
    
    const btn = document.getElementById('deskStethActionBtn');
    const dot = document.getElementById('deskStethStatusDot');
    const txt = document.getElementById('deskStethStatusText');
    const progressWrap = document.getElementById('deskStethProgressWrap');
    
    if (btn) {
      btn.textContent = '🎙️ START ENGINE SCAN';
      btn.className = 'flex-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold py-3 rounded-xl border-none cursor-pointer transition shadow-[0_4px_12px_rgba(37,99,235,0.3)] text-[11px] tracking-wider text-center flex items-center justify-center gap-2';
    }
    if (dot) dot.style.background = '#ef4444';
    if (txt) txt.textContent = 'STETHOSCOPE DIAGNOSTIC SCANNER';
    if (progressWrap) progressWrap.classList.add('hidden');
    
    this.initStethCanvas();
  },

  renderStethWaves: function() {
    if (!this.stethScanning) return;
    
    const canvas = document.getElementById('deskStethCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    
    ctx.clearRect(0, 0, W, H);
    
    let peakFreq = 0;
    let engineVibe = 0;
    
    if (this.stethAnalyser) {
      // REAL AUDIO PROCESSING
      this.stethAnalyser.getByteFrequencyData(this.stethDataArray);
      const len = this.stethDataArray.length;
      
      const barWidth = (W / len) * 1.5;
      let x = 0;
      
      let maxVal = 0;
      let maxIdx = 0;
      let sum = 0;
      
      let grad = ctx.createLinearGradient(0, H, 0, 0);
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(0.5, '#f59e0b');
      grad.addColorStop(1, '#ef4444');
      
      ctx.beginPath();
      for (let i = 0; i < len; i++) {
        const val = this.stethDataArray[i];
        sum += val;
        if (val > maxVal) {
          maxVal = val;
          maxIdx = i;
        }
        
        const barHeight = (val / 255) * H * 0.8;
        ctx.fillStyle = grad;
        ctx.fillRect(x, H - barHeight, barWidth - 1, barHeight);
        
        x += barWidth;
      }
      
      const sampleRate = this.stethAudioCtx.sampleRate || 44100;
      peakFreq = Math.round(maxIdx * (sampleRate / this.stethAnalyser.fftSize));
      const avgAmp = sum / len;
      engineVibe = Math.round(avgAmp * 5.8 + 600);
      
      if (peakFreq === 0 && avgAmp > 0) peakFreq = 120;
      
    } else {
      // SYNTHESIZED RESPONSIVE WAVEFORMS
      const time = Date.now() * 0.005;
      ctx.lineWidth = 3;
      
      let color = '#10b981';
      if (this.stethSimMode === 'healthy') {
        color = '#10b981'; peakFreq = 120; engineVibe = 780;
      } else if (this.stethSimMode === 'belt') {
        color = '#ef4444'; peakFreq = 4250; engineVibe = 2200;
      } else if (this.stethSimMode === 'valve') {
        color = '#f59e0b'; peakFreq = 850; engineVibe = 1450;
      } else if (this.stethSimMode === 'exhaust') {
        color = '#3b82f6'; peakFreq = 85; engineVibe = 950;
      }
      
      ctx.strokeStyle = color;
      ctx.beginPath();
      
      for (let i = 0; i < W; i++) {
        let y = H / 2;
        
        if (this.stethSimMode === 'healthy') {
          y += Math.sin(i * 0.05 + time) * 8 + Math.cos(i * 0.1 - time * 0.5) * 4;
        } else if (this.stethSimMode === 'belt') {
          y += Math.sin(i * 0.6 + time * 1.5) * 20 * Math.sin(time) + (Math.random() - 0.5) * 8;
        } else if (this.stethSimMode === 'valve') {
          const tick = Math.floor(i + time * 20) % 50 === 0 ? (Math.random() * 35 + 15) : 0;
          y += tick * (Math.random() > 0.5 ? 1 : -1) + Math.sin(i * 0.08 + time) * 3;
        } else if (this.stethSimMode === 'exhaust') {
          y += Math.sin(i * 0.02 + time * 0.8) * 25 + Math.sin(i * 0.06 - time * 0.4) * 8;
        }
        
        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          ctx.lineTo(i, y);
        }
      }
      ctx.stroke();
    }
    
    document.getElementById('deskStethPeakVal').textContent = `${peakFreq.toLocaleString()} Hz`;
    document.getElementById('deskStethVibeVal').textContent = `${engineVibe.toLocaleString()} CPM`;
    
    const self = this;
    this.stethAnimId = requestAnimationFrame(() => self.renderStethWaves());
  },

  finishStethScan: function() {
    this.stethScanning = false;
    if (this.stethAnimId) cancelAnimationFrame(this.stethAnimId);
    
    if (this.stethStream) {
      this.stethStream.getTracks().forEach(t => t.stop());
      this.stethStream = null;
    }
    if (this.stethAudioCtx) {
      this.stethAudioCtx.close();
      this.stethAudioCtx = null;
    }
    
    const peakText = document.getElementById('deskStethPeakVal').textContent;
    const peakVal = parseInt(peakText.replace(/[^0-9]/g, '')) || 0;
    
    let classification = '';
    
    if (this.stethAnalyser) {
      if (peakVal >= 3000) {
        classification = `High-pitched engine belt squealing detected at ${peakText}. Diagnostic parameters indicate high probability of Serpentine Belt slippage or damaged Pulley bearing.`;
      } else if (peakVal >= 500 && peakVal < 3000) {
        classification = `Rhythmic metallic engine ticking detected at ${peakText}. Diagnostic parameters suggest loose Valve lifters or low hydraulic valve tension.`;
      } else if (peakVal > 0 && peakVal < 250) {
        classification = `Low-frequency engine manifold rumbling/hissing detected at ${peakText}. Diagnostic parameters indicate a possible Exhaust manifold vacuum leak.`;
      } else {
        classification = `Harmonic stable engine hum detected at ${peakText} (Normal range). Engine rhythm is healthy.`;
      }
    } else {
      if (this.stethSimMode === 'healthy') {
        classification = `Stable engine combustion frequency. Normal harmonic hum detected. Engine runs healthy!`;
      } else if (this.stethSimMode === 'belt') {
        classification = `High-pitched engine belt squealing detected at 4.2 kHz. Diagnostic parameters indicate high probability of Serpentine Belt slippage or worn Pulley bearings.`;
      } else if (this.stethSimMode === 'valve') {
        classification = `Rhythmic metallic engine ticking/clicking detected in cylinder head at 850 CPM. Diagnostic parameters suggest loose Valve lifters or low hydraulic lifter pressure.`;
      } else if (this.stethSimMode === 'exhaust') {
        classification = `Low-frequency engine manifold guttural rumbling detected at 85 Hz. Diagnostic parameters indicate a potential Exhaust manifold gasket leak.`;
      }
    }
    
    const textInp = document.getElementById('diag-input');
    if (textInp) {
      const existing = textInp.value.trim();
      const prefix = `[Stethoscope Audio Profile: ${classification}]`;
      textInp.value = existing ? `${prefix}\n\n${existing}` : prefix;
    }
    
    this.closeStethoscope();
    
    // Auto-trigger the AI Diagnosis execution!
    this.runDiagnosis();
  },

  toggleTelemetryHUD: function() {
    const hud = document.getElementById('telemetryHUD');
    if (!hud) return;
    if (hud.style.display === 'none') {
      hud.style.display = 'block';
      if (typeof ATTelemetry !== 'undefined') {
        ATTelemetry.renderConsole('telemetryHUD');
        ATTelemetry.log('Telemetry HUD Viewport Opened', 'SUCCESS');
      }
    } else {
      hud.style.display = 'none';
    }
  },

  // -----------------------------------------
  // MANUAL VITALS OVERRIDES
  // -----------------------------------------
  openVitalOverrideModal: function(key, label, icon, currentPct) {
    const overrides = JSON.parse(localStorage.getItem('vitalOverrides') || '{}') || {};
    let activeVal = currentPct;
    const o = overrides[key];
    if (o !== undefined) {
      activeVal = typeof o === 'object' ? o.val : o;
    }
    
    const keyInput = document.getElementById('overrideVitalKey');
    const numInput = document.getElementById('overrideVitalNumInput');
    const slider = document.getElementById('overrideVitalSlider');
    const title = document.getElementById('overrideVitalTitle');
    const iconEl = document.getElementById('overrideVitalIcon');
    
    if (keyInput) keyInput.value = key;
    if (title) title.textContent = label.toUpperCase();
    if (iconEl) iconEl.textContent = icon;
    if (numInput) numInput.value = activeVal;
    if (slider) slider.value = activeVal;
    
    const modal = document.getElementById('vitalOverrideModal');
    if (modal) modal.style.display = 'flex';
  },

  closeVitalOverrideModal: function(e) {
    if (e && e.target !== document.getElementById('vitalOverrideModal')) return;
    const modal = document.getElementById('vitalOverrideModal');
    if (modal) modal.style.display = 'none';
  },

  syncOverrideSliderFromNum: function() {
    const numVal = parseInt(document.getElementById('overrideVitalNumInput').value);
    if (!isNaN(numVal) && numVal >= 0 && numVal <= 100) {
      document.getElementById('overrideVitalSlider').value = numVal;
    }
  },

  syncOverrideNumFromSlider: function() {
    const sliderVal = document.getElementById('overrideVitalSlider').value;
    document.getElementById('overrideVitalNumInput').value = sliderVal;
  },

  saveVitalOverride: function() {
    const key = document.getElementById('overrideVitalKey').value;
    const numVal = parseInt(document.getElementById('overrideVitalNumInput').value);
    if (isNaN(numVal) || numVal < 0 || numVal > 100) {
      alert('Please enter a valid percentage between 0 and 100.');
      return;
    }
    
    let overrides = JSON.parse(localStorage.getItem('vitalOverrides') || '{}') || {};
    overrides[key] = {
      val: numVal,
      mileage: this.vehicle.mileage || 0,
      date: new Date().toISOString()
    };
    localStorage.setItem('vitalOverrides', JSON.stringify(overrides));
    
    this.closeVitalOverrideModal();
    this.renderDashboardTelemetry();
    
    if (window.showToast) {
      window.showToast('Vitals Updated', 'Manual diagnostic override saved successfully.', 'success');
    }
  },

  clearVitalOverride: function() {
    const key = document.getElementById('overrideVitalKey').value;
    let overrides = JSON.parse(localStorage.getItem('vitalOverrides') || '{}') || {};
    delete overrides[key];
    localStorage.setItem('vitalOverrides', JSON.stringify(overrides));
    
    this.closeVitalOverrideModal();
    this.renderDashboardTelemetry();
    
    if (window.showToast) {
      window.showToast('Vitals Reset', 'Restored to calculated lifecycle baseline.', 'info');
    }
  },

  // -----------------------------------------
  // MANUAL DIAGNOSIS ENTRY
  // -----------------------------------------
  openManualDiagnosisModal: function() {
    const modal = document.getElementById('manualDiagnosisModal');
    if (modal) modal.style.display = 'flex';
  },

  closeManualDiagnosisModal: function(e) {
    if (e && e.target !== document.getElementById('manualDiagnosisModal')) return;
    const modal = document.getElementById('manualDiagnosisModal');
    if (modal) modal.style.display = 'none';
  },

  saveManualDiagnosisReport: function() {
    const problem = document.getElementById('manDiagProblem').value.trim();
    const summary = document.getElementById('manDiagSummary').value.trim();
    const solution = document.getElementById('manDiagSolution').value.trim();
    const cost = document.getElementById('manDiagCost').value.trim();
    const severity = document.getElementById('manDiagSeverity').value;
    
    if (!problem || !summary) {
      alert('Please provide symptoms and diagnostic root cause.');
      return;
    }
    
    const newDiag = {
      date: new Date().toLocaleDateString(),
      problem: problem,
      summary: summary,
      cost: cost || 'N/A',
      result: {
        summary: summary,
        estimated_cost: cost || 'N/A',
        solutions: solution ? [solution] : [],
        severity: severity,
        immediate_actions: solution ? [solution] : [],
        likely_causes: [summary]
      }
    };
    
    this.diagnosisHistory.unshift({
      problem: problem,
      title: summary.substring(0, 40),
      time: 'Just now',
      status: severity.toUpperCase(),
      result: newDiag.result
    });
    if (this.diagnosisHistory.length > 10) this.diagnosisHistory.pop();
    
    localStorage.setItem('desktopDiagHistory', JSON.stringify(this.diagnosisHistory));

    try {
      let mobileHist = JSON.parse(localStorage.getItem('diagnosisHistory')) || [];
      mobileHist.unshift(newDiag);
      if (mobileHist.length > 10) mobileHist.pop();
      localStorage.setItem('diagnosisHistory', JSON.stringify(mobileHist));
    } catch(e) {}
    
    document.getElementById('manDiagProblem').value = '';
    document.getElementById('manDiagSummary').value = '';
    document.getElementById('manDiagSolution').value = '';
    document.getElementById('manDiagCost').value = '';
    document.getElementById('manDiagSeverity').value = 'LOW';
    
    this.closeManualDiagnosisModal();
    this.renderRecentScans();
    
    if (window.showToast) {
      window.showToast('Report Saved', 'Manual diagnostic report successfully stored.', 'success');
    }
  },
  getActiveCurrency: function() {
    if (window.GlobalContext && window.GlobalContext.currency) {
      return window.GlobalContext.currency;
    }
    return 'USD';
  },

  formatPrice: function(amount) {
    try {
      const activeCurrency = this.getActiveCurrency();
      const activeLocale = (window.GlobalContext && window.GlobalContext.language) ? window.GlobalContext.language : 'en-US';
      const rates = {
        'USD': 1.0, 'EUR': 0.9, 'GBP': 0.78, 'CAD': 1.35, 'AUD': 1.5, 'INR': 83.0,
        'NGN': 1150.0, 'ZAR': 19.0, 'JPY': 150.0, 'CNY': 7.2, 'BRL': 5.0, 'MXN': 17.0, 'CHF': 0.9
      };
      const rate = rates[activeCurrency] || 1.0;
      const localAmount = amount * rate;
      return new Intl.NumberFormat(activeLocale, {
        style:'currency', currency: activeCurrency, maximumFractionDigits:0
      }).format(localAmount);
    } catch(e) { return '$' + amount; }
  },

  renderMaintenancePlanner: function() {
    const el = document.getElementById('maintenanceRings');
    if (!el || !this.vehicle || !this.vehicle.make) return;
    
    const curMileage = parseInt(this.vehicle.mileage) || 0;
    const sLog = JSON.parse(localStorage.getItem('serviceLog')) || {};
    
    const MAINT_SERVICES = [
      { key:'oil',          name:'Oil Change',        getInt: (m) => window.getOilInterval ? window.getOilInterval(m) : 7500 },
      { key:'battery',      name:'Battery Replacement', getInt: () => 60000 },
      { key:'tireRotation', name:'Tire Rotation',     getInt: () => 7500 },
      { key:'airFilter',    name:'Air Filter',        getInt: () => 20000 },
      { key:'brakes',       name:'Brake Pads',        getInt: () => 40000 },
      { key:'coolant',      name:'Coolant Flush',     getInt: () => 30000 },
      { key:'transmission', name:'Trans. Fluid',      getInt: () => 45000 },
      { key:'sparkPlugs',   name:'Spark Plugs',       getInt: () => 30000 },
    ];

    let services = MAINT_SERVICES.map(svc => {
      const interval = svc.getInt(this.vehicle.make);
      let lastMi = 0;
      if (sLog[svc.key]) {
        lastMi = parseInt(sLog[svc.key].mileage) || 0;
      } else {
        // REAL WORLD ALGORITHM: Modulo math to estimate wear if no log exists
        const used = curMileage % interval;
        lastMi = Math.max(0, curMileage - used);
      }
      const used = curMileage - lastMi;
      const mileLeft = interval - used;
      return { ...svc, mileLeft, interval, used };
    });

    services.sort((a, b) => a.mileLeft - b.mileLeft);
    const topServices = services.slice(0, 3);

    let html = '';
    
    const timelines = [
      { title: 'TODAY', label: 'Immediate Action', tag: 'URGENT', tagColor: 'var(--accent)', descFn: (s) => `Your ${s.name.toLowerCase()} is overdue by ${Math.abs(s.mileLeft).toLocaleString()} miles. High risk of component failure. Book service immediately.` },
      { title: 'THIS WEEK', label: 'Schedule Service', tag: 'PLANNING', tagColor: '#ff8800', descFn: (s) => `Only ${s.mileLeft.toLocaleString()} miles left until ${s.name.toLowerCase()} is due. Local shops are booking out early.` },
      { title: 'UPCOMING', label: 'Monitor Closely', tag: 'ON TRACK', tagColor: '#4da6ff', descFn: (s) => `Your ${s.name.toLowerCase()} is healthy with ${s.mileLeft.toLocaleString()} miles remaining. No immediate action required.` }
    ];

    topServices.forEach((svc, index) => {
      let tier = 2; // Upcoming
      if (svc.mileLeft <= 0) tier = 0; // Today
      else if (svc.mileLeft <= 3000) tier = 1; // This Week
      else if (index === 0) tier = 1; // Force at least one planning if not overdue

      const t = timelines[tier];
      const color = t.tagColor;
      
      html += `
        <div class="backdrop-blur-2xl border snap-start flex flex-col hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
             style="border-color:${color}50; background: linear-gradient(135deg, ${color}0d 0%, rgba(0,0,0,0.7) 100%); border-radius:28px; padding:28px; min-width:320px; max-width:360px; box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px ${color}20 inset;">
          <!-- Ambient glow -->
          <div class="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none" style="background: radial-gradient(circle, ${color}20 0%, transparent 70%); transform: translate(30%, -30%);"></div>
          <!-- Left accent bar -->
          <div class="absolute top-0 left-0 w-1 h-full rounded-full" style="background: linear-gradient(to bottom, ${color}, ${color}40); box-shadow: 0 0 15px ${color};"></div>
          
          <!-- Card Header -->
          <div class="flex justify-between items-start mb-5 relative z-10">
            <div class="flex-1 min-w-0">
              <div class="text-[9px] text-zinc-500 font-mono tracking-[0.35em] uppercase mb-1.5">🤖 AI DIRECTIVE • ${t.title}</div>
              <div class="font-bebas text-[28px] leading-tight tracking-wider" style="color:${color}; text-shadow: 0 0 20px ${color}60;">${svc.name}</div>
            </div>
            <div class="shrink-0 ml-3 px-3 py-1.5 text-[9px] rounded-xl font-mono uppercase tracking-widest font-bold ${tier===0 ? 'animate-pulse' : ''}" 
                 style="background:${color}25; border:1px solid ${color}50; color:${color}; box-shadow: 0 0 10px ${color}30;">${t.tag}</div>
          </div>
          
          <!-- Miles Remaining Meter -->
          <div class="relative z-10 mb-5">
            <div class="flex justify-between items-baseline mb-1.5">
              <span class="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Miles Until Service</span>
              <span class="text-[11px] font-mono font-bold" style="color:${color};">${svc.mileLeft < 0 ? 'OVERDUE' : svc.mileLeft.toLocaleString() + ' mi'}</span>
            </div>
            <div class="w-full rounded-full overflow-hidden" style="height:4px; background:rgba(255,255,255,0.06);">
              <div class="h-full rounded-full transition-all duration-700" style="width:${Math.min(100, Math.max(2, Math.round((svc.mileLeft / svc.interval) * 100)))}%; background:${color}; box-shadow: 0 0 8px ${color};"></div>
            </div>
          </div>

          <!-- AI Diagnostic Text -->
          <div class="relative z-10 flex-1">
            <div class="text-[12px] text-zinc-400 font-mono leading-relaxed mb-5">${t.descFn(svc)}</div>
            <button onclick="app.showRepairModal('${svc.key}')" 
                    class="w-full py-3 rounded-2xl text-[10px] font-mono tracking-widest uppercase font-bold transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
                    style="background:${color}20; border:1px solid ${color}50; color:${color}; box-shadow: 0 4px 20px ${color}25;">
              ${tier===0 ? '⚠️ SERVICE NOW →' : 'VIEW OPTIONS →'}
            </button>
          </div>
        </div>
      `;
    });

    el.innerHTML = html;
  },

  openLogServiceFor: function(key) {
    this.openLogService();
    const select = document.getElementById('logServiceType');
    if (select) select.value = key;
  },

  openLogService: function() {
    const modal = document.getElementById('logServiceModal');
    if (modal) modal.style.display = 'flex';
    const mil = document.getElementById('logServiceMileage');
    if (mil) mil.value = this.vehicle.mileage || '';
  },

  closeLogServiceModal: function(e) {
    if (e && e.target !== document.getElementById('logServiceModal')) return;
    const modal = document.getElementById('logServiceModal');
    if (modal) modal.style.display = 'none';
  },

  saveServiceLog: function() {
    const type = document.getElementById('logServiceType').value;
    const selectEl = document.getElementById('logServiceType');
    if (!selectEl) return;
    const typeText = selectEl.options[selectEl.selectedIndex].text;
    const mileage = document.getElementById('logServiceMileage').value;
    if(!type || !mileage) return;
    
    this.serviceLog[type] = {
      mileage: parseInt(mileage),
      date: new Date().toISOString()
    };
    localStorage.setItem('serviceLog', JSON.stringify(this.serviceLog));

    this.maintLogs.unshift({
      desc: typeText,
      cost: '--',
      date: new Date().toLocaleDateString()
    });
    localStorage.setItem('desktopMaintLogs', JSON.stringify(this.maintLogs));

    try {
      let mobileHist = JSON.parse(localStorage.getItem('maintenanceHistory')) || [];
      mobileHist.unshift({
        id: Date.now(),
        type: 'auto',
        name: typeText.substring(2),
        icon: typeText.substring(0, 2).trim(),
        date: new Date().toISOString(),
        mileage: parseInt(mileage),
        cost: '--'
      });
      if (mobileHist.length > 50) mobileHist.pop();
      localStorage.setItem('maintenanceHistory', JSON.stringify(mobileHist));
    } catch(e) {}

    this.renderDailyVitals();
    this.renderMaintenancePlanner();
    this.renderMaintenanceLogs();
    this.closeLogServiceModal();
  },

  showRepairModal: function(key) {
    const MAINT_SERVICES = [
      { key:'oil',          icon:'🛢️', name:'Oil Change',        getInt: (make) => {
        const m = (make || '').toLowerCase();
        if (m.includes('bmw') || m.includes('mercedes') || m.includes('audi') || m.includes('vw') || m.includes('porsche')) return 10000;
        if (m.includes('toyota') || m.includes('honda') || m.includes('hyundai') || m.includes('kia') || m.includes('lexus')) return 7500;
        return 5000;
      }, timeMonths:6,  parts:55,  labor:40  },
      { key:'battery',      icon:'🔋', name:'Battery replacement', getInt: () => 60000, timeMonths:48, parts:150, labor:30  },
      { key:'tireRotation', icon:'🛞', name:'Tire Rotation',     getInt: () => 7500,  timeMonths:6,  parts:0,   labor:25  },
      { key:'airFilter',    icon:'💨', name:'Air Filter',        getInt: () => 20000, timeMonths:12, parts:22,  labor:15  },
      { key:'brakes',       icon:'🛑', name:'Brake Pads',        getInt: () => 40000, timeMonths:24, parts:120, labor:100 },
      { key:'coolant',      icon:'🌡️', name:'Coolant Flush',     getInt: () => 30000, timeMonths:24, parts:28,  labor:60  },
      { key:'transmission', icon:'⚙️', name:'Trans. Fluid',      getInt: () => 45000, timeMonths:36, parts:45,  labor:80  },
      { key:'sparkPlugs',   icon:'⚡', name:'Spark Plugs',       getInt: () => 30000, timeMonths:36, parts:60,  labor:50  },
    ];

    const svc = MAINT_SERVICES.find(s => s.key === key);
    if (!svc) return;
    const curMileage = parseInt(this.vehicle.mileage) || 0;
    const lastMi     = this.serviceLog[key] ? parseInt(this.serviceLog[key].mileage) : Math.max(0, curMileage - Math.round(svc.getInt(this.vehicle.make) * 0.5));
    const used       = curMileage - lastMi;
    const mileLeft   = svc.getInt(this.vehicle.make) - used;
    const total      = svc.parts + svc.labor;
    const urgColor   = mileLeft < 0 ? 'var(--accent)' : mileLeft < 3000 ? '#ff8800' : '#00d084';
    const urgLabel   = mileLeft < 0 ? 'OVERDUE — Service Now' : mileLeft < 3000 ? 'Due Soon' : 'On Track';

    const content = `
      <div class="flex items-center gap-4 mb-6">
        <span class="text-4xl">${svc.icon}</span>
        <div>
          <div class="font-bebas text-3xl text-white tracking-wider">${svc.name}</div>
          <div class="text-[10px] font-mono tracking-widest uppercase mt-0.5" style="color: ${urgColor};">${urgLabel}</div>
        </div>
      </div>
      <div class="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6">
        <div class="flex justify-between mb-4">
          <div>
            <div class="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">🔩 Est. Parts</div>
            <div class="font-bebas text-3xl text-white mt-1">${this.formatPrice(svc.parts)}</div>
          </div>
          <div>
            <div class="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">🔧 Est. Labor</div>
            <div class="font-bebas text-3xl text-white mt-1">${this.formatPrice(svc.labor)}</div>
          </div>
        </div>
        <div class="border-t border-white/5 pt-4">
          <div class="text-[9px] text-zinc-500 uppercase font-mono tracking-wider mb-1">Total Estimated Cost</div>
          <div class="font-bebas text-5xl leading-none" style="color: ${urgColor}; text-shadow: 0 0 20px ${urgColor}33;">${this.formatPrice(total)}</div>
          <div class="text-[9.5px] text-zinc-600 font-mono mt-2 leading-relaxed">Prices vary by location & vehicle condition.</div>
        </div>
      </div>
      <button onclick="app.markServiceDone('${key}')" class="w-full bg-[#00d084] hover:bg-emerald-400 text-black font-mono text-[11px] font-bold py-4 rounded-xl transition-all shadow-lg uppercase tracking-wider">✓ MARK AS DONE</button>
      <button onclick="app.closeRepairModal()" class="w-full text-zinc-500 hover:text-white font-mono text-[10px] py-2 transition-all uppercase tracking-wider mt-2 bg-transparent border-none cursor-pointer">Close</button>
    `;

    document.getElementById('repairModalContent').innerHTML = content;
    const modal = document.getElementById('repairModal');
    if (modal) modal.style.display = 'flex';
  },

  closeRepairModal: function(e) {
    if (e && e.target !== document.getElementById('repairModal')) return;
    const modal = document.getElementById('repairModal');
    if (modal) modal.style.display = 'none';
  },

  markServiceDone: function(key) {
    const curMileage = parseInt(this.vehicle.mileage) || 0;
    this.serviceLog[key] = { mileage: curMileage, date: new Date().toISOString() };
    localStorage.setItem('serviceLog', JSON.stringify(this.serviceLog));

    const MAINT_SERVICES = [
      { key:'oil',          icon:'🛢️', name:'Oil Change',        getInt: (make) => 5000, timeMonths:6,  parts:55,  labor:40  },
      { key:'battery',      icon:'🔋', name:'Battery replacement', getInt: () => 60000, timeMonths:48, parts:150, labor:30  },
      { key:'tireRotation', icon:'🛞', name:'Tire Rotation',     getInt: () => 7500,  timeMonths:6,  parts:0,   labor:25  },
      { key:'airFilter',    icon:'💨', name:'Air Filter',        getInt: () => 20000, timeMonths:12, parts:22,  labor:15  },
      { key:'brakes',       icon:'🛑', name:'Brake Pads',        getInt: () => 40000, timeMonths:24, parts:120, labor:100 },
      { key:'coolant',      icon:'🌡️', name:'Coolant Flush',     getInt: () => 30000, timeMonths:24, parts:28,  labor:60  },
      { key:'transmission', icon:'⚙️', name:'Trans. Fluid',      getInt: () => 45000, timeMonths:36, parts:45,  labor:80  },
      { key:'sparkPlugs',   icon:'⚡', name:'Spark Plugs',       getInt: () => 30000, timeMonths:36, parts:60,  labor:50  },
    ];

    const svc = MAINT_SERVICES.find(s => s.key === key);
    const totalCost = svc ? this.formatPrice(svc.parts + svc.labor) : '??';
    const icon = svc ? svc.icon : '🔧';
    const name = svc ? svc.name : 'Maintenance';
    
    this.maintLogs.unshift({
      desc: `${icon} ${name}`,
      cost: totalCost,
      date: new Date().toLocaleDateString()
    });
    localStorage.setItem('desktopMaintLogs', JSON.stringify(this.maintLogs));

    try {
      let mobileHist = JSON.parse(localStorage.getItem('maintenanceHistory')) || [];
      mobileHist.unshift({
        id: Date.now(),
        type: 'auto',
        name: name,
        icon: icon,
        date: new Date().toISOString(),
        mileage: curMileage,
        cost: totalCost
      });
      if (mobileHist.length > 50) mobileHist.pop();
      localStorage.setItem('maintenanceHistory', JSON.stringify(mobileHist));
    } catch(e) {}

    this.closeRepairModal();
    this.renderMaintenancePlanner();
    this.renderMaintenanceLogs();
  }
};

// Toast Notification System
window.showToast = function(title, message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      display: flex; flex-direction: column; gap: 10px; pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const colors = {
    success: { bg: 'rgba(0,208,132,0.15)', border: 'rgba(0,208,132,0.3)', icon: '✅', text: '#00d084' },
    error: { bg: 'rgba(230,57,70,0.15)', border: 'rgba(230,57,70,0.3)', icon: '❌', text: 'var(--accent)' },
    info: { bg: 'rgba(77,166,255,0.15)', border: 'rgba(77,166,255,0.3)', icon: 'ℹ️', text: '#4da6ff' },
    warning: { bg: 'rgba(255,136,0,0.15)', border: 'rgba(255,136,0,0.3)', icon: '⚠️', text: '#ff8800' }
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${c.bg}; border: 1px solid ${c.border}; border-radius: 14px;
    padding: 12px 16px; display: flex; align-items: center; gap: 12px;
    font-family: 'Space Mono', monospace; pointer-events: auto; min-width: 260px; max-width: 340px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4); backdrop-filter: blur(12px);
    animation: slideInRight 0.3s ease; opacity: 1; transition: opacity 0.3s ease;
  `;
  toast.innerHTML = `
    <span style="font-size:18px; flex-shrink:0;">${c.icon}</span>
    <div style="flex:1;">
      <div style="font-size:11px; font-weight:bold; color:${c.text}; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">${title}</div>
      <div style="font-size:10px; color:rgba(255,255,255,0.6); line-height:1.4;">${message}</div>
    </div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;font-size:14px;padding:0;margin-left:4px;flex-shrink:0;" >✕</button>
  `;

  container.appendChild(toast);

  // Add CSS animation if not already present
  if (!document.getElementById('toast-keyframes')) {
    const style = document.createElement('style');
    style.id = 'toast-keyframes';
    style.textContent = `@keyframes slideInRight { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }`;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Global hooks for TripTracker
window.askPassengerPrompt = function(cb) { app.askPassengerPrompt(cb); };
window.updateOdometerUI = function(m) { app.updateOdometerUI(m); };

// Setup tracker
setTimeout(() => {
  if (typeof TripTracker !== 'undefined' && app.vehicle && app.vehicle.make) {
    TripTracker.init();
    
    const odoCard = document.getElementById('mileageCheckinCard');
    if (odoCard) {
      odoCard.style.cursor = 'pointer';
      odoCard.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
          if (!TripTracker.isActive()) TripTracker.simulateTripStart();
        }
      });
    }
  }
}, 1500);

window.showLocationModalDesktop = function() {
  const locations = [
    { key: 'NG_lagos', label: 'Lagos, Nigeria' },
    { key: 'NG_abuja', label: 'Abuja, Nigeria' },
    { key: 'NG_ph', label: 'Port Harcourt, Nigeria' },
    { key: 'NG_kano', label: 'Kano, Nigeria' },
    { key: 'NG_ibadan', label: 'Ibadan, Nigeria' },
    { key: 'NG_enugu', label: 'Enugu, Nigeria' },
    { key: 'NG_benin', label: 'Benin City, Nigeria' },
    { key: 'NG_warri', label: 'Warri, Nigeria' },
    { key: 'NG_kaduna', label: 'Kaduna, Nigeria' },
    { key: 'US', label: 'United States' },
    { key: 'GB', label: 'United Kingdom' },
    { key: 'CA', label: 'Canada' },
    { key: 'AU', label: 'Australia' },
    { key: 'ZA', label: 'South Africa' },
    { key: 'GH', label: 'Ghana' },
    { key: 'KE', label: 'Kenya' },
    { key: 'IN', label: 'India' },
    { key: 'AE', label: 'UAE / Dubai' },
    { key: 'DE', label: 'Germany' },
    { key: 'FR', label: 'France' },
    { key: 'SA', label: 'Saudi Arabia' },
    { key: 'PK', label: 'Pakistan' },
    { key: 'TZ', label: 'Tanzania' },
    { key: 'ET', label: 'Ethiopia' },
    { key: 'default', label: 'Global / Other' }
  ];

  let buttonsHtml = '';
  locations.forEach(loc => {
    const isSel = app._userShopKey === loc.key;
    const bg = isSel ? 'rgba(77,166,255,0.1)' : 'transparent';
    const color = isSel ? '#4da6ff' : '#ccc';
    const check = isSel ? '✓ ' : '';
    buttonsHtml += `<button onclick="window.setLocationAndSearchDesktop('${loc.key}', '${loc.label}')" style="width:100%;text-align:left;background:${bg};border:none;padding:12px 16px;color:${color};font-family:'Space Mono',monospace;font-size:12px;border-radius:8px;margin-bottom:4px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='${bg}'">${check}${loc.label}</button>`;
  });

  const overlayHtml = `
    <div id="locationModalOverlayDesktop" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);backdrop-filter:blur(5px);z-index:99999;display:flex;align-items:center;justify-content:center;">
      <div style="background:var(--bg-raised);border:1px solid rgba(255,255,255,0.1);border-radius:16px;width:90%;max-width:320px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.5);">
        <div style="padding:16px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between;align-items:center;">
          <div style="font-family:'Space Mono',monospace;font-weight:bold;color:white;font-size:14px;">Select Region</div>
          <button onclick="document.getElementById('locationModalOverlayDesktop').remove()" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;padding:0;outline:none;">&times;</button>
        </div>
        <div style="overflow-y:auto;padding:8px;">
          ${buttonsHtml}
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', overlayHtml);
};

window.setLocationAndSearchDesktop = function(key, label) {
  app._userShopKey = key;
  app._regionLabel = label;
  const overlay = document.getElementById('locationModalOverlayDesktop');
  if (overlay) overlay.remove();
  app.searchPart();
};

window.onload = () => app.init();

// --- PARTS CHECKOUT FLOW SYSTEM ---
app.openCheckoutFlow = function(partName, price, oem, checkoutUrl, alternativeUrl) {
  let country = 'US';
  if (window.GlobalContext && window.GlobalContext.country) {
    country = window.GlobalContext.country.toUpperCase();
  }

  let vehiclePrefix = '';
  if (window.app && window.app.vehicle && window.app.vehicle.make) {
    vehiclePrefix = `${window.app.vehicle.year || ''} ${window.app.vehicle.make} ${window.app.vehicle.model || ''}`.trim() + ' ';
  }
  const fullPartName = vehiclePrefix + partName;

  // UNIVERSAL: Open dynamic Affiliate Modal for everyone
  if (typeof window.openAffiliateModal === 'function') {
    const priceNum = parseInt(String(price).replace(/[^0-9]/g, ''), 10) || 0;
    const oemNum = parseInt(String(oem).replace(/[^0-9]/g, ''), 10) || (priceNum * 1.5);
    
    let storeType = 'GLOBAL';
    if (['NG', 'ZA', 'KE', 'EG'].includes(country)) storeType = 'NG_MULTI';
    else if (['US', 'CA'].includes(country)) storeType = 'AMAZON';
    else if (['UK', 'GB', 'IE', 'DE', 'FR', 'IT', 'ES'].includes(country)) storeType = 'EBAY';
    else if (['CN', 'JP', 'KR', 'IN', 'SG'].includes(country)) storeType = 'ALIEXPRESS';

    window.openAffiliateModal(
       fullPartName, 
       priceNum, 
       oemNum, 
       'FETCH_REAL_IMAGE',
       checkoutUrl,
       storeType
    );
    return;
  }

  const modal = document.getElementById('partsCheckoutModal');
  const content = document.getElementById('partsCheckoutModalContent');
  if (!modal || !content) return;
  
  content.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="font-bebas text-2xl tracking-wider text-white">CHOOSE CHECKOUT ROUTE</h2>
      <button onclick="app.closeCheckoutModal()" class="text-gray-500 hover:text-white text-lg">✕</button>
    </div>
    
    <div class="flex flex-col gap-4 font-mono text-xs">
      <div class="p-4 rounded-xl bg-white/5 border border-white/10 mb-2">
        <div class="text-[10px] text-blue-400 uppercase font-bold mb-1">Selected Item</div>
        <div class="text-white font-bold text-sm">${partName}</div>
        <div class="flex gap-4 mt-2 text-white/60">
          <div>Aftermarket: <strong class="text-[#00d084]">${price}</strong></div>
          <div>OEM: <strong class="text-white">${oem}</strong></div>
        </div>
      </div>
      
      <!-- Option 1: Buy Direct (Marketplace model) -->
      <button onclick="app.showDirectCheckoutForm('${partName.replace(/'/g, "\\'")}', '${price}')" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-xl transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-600/30">
        <span class="uppercase tracking-wider text-[12px] font-bold">🛒 Order Direct via AutoTriage</span>
        <span class="text-[9px] opacity-75">Secure checkout, low shipping & direct dealer dispatch</span>
      </button>
      
      <div class="text-center text-white/30 text-[10px] my-1 uppercase">— OR BUY FROM THIRD PARTY —</div>
      
      <!-- Option 2: Affiliate Route -->
      <button onclick="app.openPartnerBrowser('${checkoutUrl}', '${country === 'NG' ? 'Jumia Nigeria' : 'eBay Store'}')" class="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 px-4 rounded-xl transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer">
        <span class="font-bold text-[11px] uppercase tracking-wider">${country === 'NG' ? 'Jumia Store 🛍️' : 'eBay Partner Store 🛍️'}</span>
        <span class="text-[9px] text-white/40">Affiliate reference checkout</span>
      </button>
      
      <!-- Option 3: Alternative Affiliate Route -->
      ${alternativeUrl ? `
      <button onclick="app.openPartnerBrowser('${alternativeUrl}', '${country === 'NG' ? 'Jiji Classifieds' : 'Amazon Store'}')" class="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 px-4 rounded-xl transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer">
        <span class="font-bold text-[11px] uppercase tracking-wider">${country === 'NG' ? 'Jiji Local Classifieds 🏷️' : 'Amazon Store 📦'}</span>
        <span class="text-[9px] text-white/40">Alternative checkout link</span>
      </button>` : ''}
    </div>
  `;
  
  modal.style.display = 'flex';
};

app.closeCheckoutModal = function(e) {
  const modal = document.getElementById('partsCheckoutModal');
  if (modal) modal.style.display = 'none';
};

app.openPartnerBrowser = function(url, title) {
  const modal = document.getElementById('partnerBrowserModal');
  const iframe = document.getElementById('partnerBrowserIframe');
  const titleEl = document.getElementById('partnerBrowserTitle');
  if (!modal || !iframe) return;
  
  titleEl.textContent = title || 'Partner Checkout';
  iframe.src = url;
  modal.style.display = 'flex';
  
  // Close the checkout options modal
  app.closeCheckoutModal();
};

app.closePartnerBrowser = function() {
  const modal = document.getElementById('partnerBrowserModal');
  const iframe = document.getElementById('partnerBrowserIframe');
  if (!modal || !iframe) return;
  
  iframe.src = '';
  modal.style.display = 'none';
};

app.refreshPartnerBrowser = function() {
  const iframe = document.getElementById('partnerBrowserIframe');
  if (iframe && iframe.src) {
    const currentSrc = iframe.src;
    iframe.src = '';
    setTimeout(() => { iframe.src = currentSrc; }, 50);
  }
};

app.showDirectCheckoutForm = function(partName, price) {
  const content = document.getElementById('partsCheckoutModalContent');
  if (!content) return;
  
  content.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="font-bebas text-2xl tracking-wider text-white">DIRECT SECURE ORDER</h2>
      <button onclick="app.closeCheckoutModal()" class="text-gray-500 hover:text-white text-lg">✕</button>
    </div>
    
    <div class="flex flex-col gap-4 font-mono text-xs text-left">
      <div class="p-3.5 rounded-xl bg-white/5 border border-white/10">
        <div class="text-[9px] text-white/40 uppercase">Item</div>
        <div class="text-white font-bold text-xs truncate">${partName}</div>
        <div class="text-[9px] text-white/40 uppercase mt-2">Amount Due</div>
        <div class="text-[#00d084] font-bold text-sm">${price}</div>
      </div>
      
      <div class="flex flex-col gap-3 mt-1">
        <div>
          <label class="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Full Name</label>
          <input type="text" id="chkName" placeholder="John Doe" class="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-all"/>
        </div>
        <div>
          <label class="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Phone Number</label>
          <input type="tel" id="chkPhone" placeholder="+234 80 1234 5678" class="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-all"/>
        </div>
        <div>
          <label class="text-[9px] text-white/40 uppercase font-bold tracking-wider mb-1 block">Delivery Address</label>
          <input type="text" id="chkAddress" placeholder="12 Refinery Road, Effurun" class="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-all"/>
        </div>
      </div>
      
      <button onclick="app.submitCheckoutOrder('${partName.replace(/'/g, "\\'")}', '${price}')" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all uppercase tracking-wider text-[12px] shadow-lg shadow-emerald-600/20 mt-3">
        Place Secure Order →
      </button>
      <button onclick="app.closeCheckoutModal()" class="w-full text-white/40 hover:text-white py-1 uppercase text-[10px]">Cancel</button>
    </div>
  `;
};

app.submitCheckoutOrder = async function(partName, price) {
  const name = document.getElementById('chkName')?.value.trim();
  const phone = document.getElementById('chkPhone')?.value.trim();
  const address = document.getElementById('chkAddress')?.value.trim();
  
  if (!name || !phone || !address) {
    alert("Please fill in all checkout delivery fields!");
    return;
  }
  
  const content = document.getElementById('partsCheckoutModalContent');
  if (!content) return;
  
  content.innerHTML = `
    <div class="text-center py-12">
      <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
      <div class="text-sm font-mono text-white/60">Processing your secure order...</div>
    </div>
  `;
  
  try {
    const orderData = {
      customerName: name,
      customerPhone: phone,
      deliveryAddress: address,
      partName: partName,
      price: price,
      vehicle: app.vehicle || {},
      status: "Pending Fulfill",
      createdAt: new Date().toISOString(),
      orderId: 'AT-' + Math.floor(100000 + Math.random() * 900000)
    };
    
    if (window.FirebaseDB) {
      await window.FirebaseDB.collection('orders').add(orderData);
    }
    
    let country = 'US';
    if (window.GlobalContext && window.GlobalContext.country) {
      country = window.GlobalContext.country.toUpperCase();
    }
    
    let paymentDetailsHtml = '';
    if (country === 'NG') {
      paymentDetailsHtml = `
        <div class="p-4 rounded-xl bg-white/5 border border-white/10 text-left mb-6 font-mono text-[11px] leading-relaxed">
          <div class="text-emerald-400 font-bold uppercase tracking-wider mb-2 text-xs">🏦 PAY OUTRIGHT (BANK TRANSFER)</div>
          <div>Bank: <strong class="text-white">Access Bank</strong></div>
          <div>Account Number: <strong class="text-white">0701234567</strong></div>
          <div>Account Name: <strong class="text-white">AutoTriage Digital Ltd</strong></div>
          <div class="text-white/40 mt-2">Please transfer the amount shown above to finalize shipment. Send payment proof via WhatsApp or phone.</div>
        </div>
      `;
    } else {
      paymentDetailsHtml = `
        <div class="p-4 rounded-xl bg-white/5 border border-white/10 text-left mb-6 font-mono text-[11px] leading-relaxed">
          <div class="text-emerald-400 font-bold uppercase tracking-wider mb-2 text-xs">💳 PAY SECURELY VIA INVOICE</div>
          <div class="text-white/80">A secure Stripe checkout invoice has been sent to your registered phone number / email. Please click the payment link to authorize card payment.</div>
        </div>
      `;
    }
    
    content.innerHTML = `
      <div class="text-center py-6 font-mono">
        <div class="text-[52px] mb-4">🎉</div>
        <h2 class="font-bebas text-3xl text-emerald-400 tracking-wider mb-1">ORDER CONFIRMED!</h2>
        <div class="text-white/60 text-xs mb-6">Order ID: <strong class="text-white">${orderData.orderId}</strong></div>
        
        ${paymentDetailsHtml}
        
        <div class="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left mb-6 font-mono text-[11px]">
          ℹ️ Your order will be drop-shipped directly to <strong class="text-white">${address}</strong>. Direct support line: <strong class="text-white">+234 81 2345 6789</strong>.
        </div>
        
        <button onclick="app.closeCheckoutModal()" class="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3.5 rounded-xl transition-all uppercase tracking-wider text-[11px]">Done</button>
      </div>
    `;
  } catch (err) {
    console.error("Checkout failed:", err);
    alert("Checkout order submission failed. Please try again.");
    app.showDirectCheckoutForm(partName, price);
  }
};

