
const GROQ_KEY = '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

const PROMPT = `You are an expert automotive diagnostic AI. Respond ONLY with a valid JSON object, no markdown, no extra text.
Format: {"summary":"one sentence","likely_causes":["c1","c2","c3"],"severity":"LOW|MEDIUM|HIGH|CRITICAL","severity_score":70,"immediate_actions":["a1","a2"],"solutions":["s1","s2","s3"],"estimated_cost":"$X,000  $Y,000","specialist_needed":"General Mechanic or Engine Specialist or Auto Electrician or Brake Specialist or AC Specialist or Transmission Specialist","is_critical":false}`;

// ---- NAVIGATION ----
let curScreen = 'home';
let curSpec2 = 'All';
let curVt = 'Car';
let mobileVehicle = JSON.parse(localStorage.getItem('mobileVehicle') || '{}');

// saveVehicleProfile is intentionally handled by features-simple.js

function updateMileageCheckin() {
  const input = document.getElementById('mileageUpdateInput');
  if(!input || !input.value) return;
  const newM = parseInt(input.value);
  
  let targetVeh = null;
  if (typeof myVehicle !== 'undefined' && myVehicle && myVehicle.make) targetVeh = myVehicle;
  else if (typeof mobileVehicle !== 'undefined' && mobileVehicle && mobileVehicle.make) targetVeh = mobileVehicle;
  
  if(!targetVeh) return alert("No vehicle profile found to update.");
  if(newM < targetVeh.mileage) return alert("New mileage cannot be lower than current!");
  
  targetVeh.mileage = newM;
  if(typeof myVehicle !== 'undefined' && myVehicle && myVehicle.make) {
    myVehicle.mileage = newM;
    localStorage.setItem('myVehicle', JSON.stringify(myVehicle));
    localStorage.setItem('desktopVehicle', JSON.stringify(myVehicle));
  }
  
  if (typeof mobileVehicle !== 'undefined' && mobileVehicle && mobileVehicle.make) {
    mobileVehicle.mileage = newM;
    localStorage.setItem('mobileVehicle', JSON.stringify(mobileVehicle));
  }
  
  input.value = '';
  document.getElementById('mileageLastUpdate').textContent = "Just now";
  
  if (typeof renderVehicleDashboard === 'function') {
    renderVehicleDashboard();
  } else {
    renderGarageDashboard();
  }
}

function renderGarageDashboard() {
  const setup = document.getElementById('vehicleSetup');
  const dash = document.getElementById('vehicleDashboard');
  const card = document.getElementById('vehicleCard');
  
  if(!setup || !dash || !card) return;

  let v = null;
  if (typeof myVehicle !== 'undefined' && myVehicle && myVehicle.make) v = myVehicle;
  else if (typeof mobileVehicle !== 'undefined' && mobileVehicle && mobileVehicle.make) v = mobileVehicle;
  
  if(!v || !v.make) {
    setup.style.display = 'block';
    dash.style.display = 'none';
    return;
  }
  
  setup.style.display = 'none';
  dash.style.display = 'block';
  
  if (typeof renderVehicleCard === 'function') {
    renderVehicleCard();
  }
  
  renderGarageRides();

  // Populate affiliate fields
  setTimeout(() => {
    const ebayVal = localStorage.getItem('at_ebay_campid') || '';
    const amazonVal = localStorage.getItem('at_amazon_tag') || '';
    const jumiaVal = localStorage.getItem('at_jumia_kol') || '';
    
    const ebayInput = document.getElementById('mobileAffEbay');
    const amazonInput = document.getElementById('mobileAffAmazon');
    const jumiaInput = document.getElementById('mobileAffJumia');
    
    if (ebayInput) ebayInput.value = ebayVal;
    if (amazonInput) amazonInput.value = amazonVal;
    if (jumiaInput) jumiaInput.value = jumiaVal;
  }, 50);
}

function renderGarageRides() {
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
    const brandIcons = {
      uber: '',
      lyft: '',
      bolt: '',
      didi: '',
      grab: '',
      indrive: ''
    };
    const brandColors = { 
      uber: 'color:white; border-color:rgba(255,255,255,0.2); background:rgba(255,255,255,0.05);', 
      lyft: 'color:#FF00BF; border-color:rgba(255,0,191,0.2); background:rgba(255,0,191,0.05);',
      bolt: 'color:#34D186; border-color:rgba(52,209,134,0.2); background:rgba(52,209,134,0.05);',
      didi: 'color:#FF7A00; border-color:rgba(255,122,0,0.2); background:rgba(255,122,0,0.05);',
      grab: 'color:#00B14F; border-color:rgba(0,177,79,0.2); background:rgba(0,177,79,0.05);',
      indrive: 'color:#00A9E0; border-color:rgba(0,169,224,0.2); background:rgba(0,169,224,0.05);'
    };
    
    const icon = brandIcons[ride.provider] || '';
    const providerLabel = ride.provider.toUpperCase();
    const styleString = brandColors[ride.provider] || 'color:white; border-color:rgba(255,255,255,0.1);';
    const sideColors = { uber: '#fff', lyft: '#FF00BF', bolt: '#34D186', didi: '#FF7A00', grab: '#00B14F', indrive: '#00A9E0' };

    return `
      <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:12px; display:flex; justify-content:space-between; align-items:center; position:relative; overflow:hidden;">
        <div style="position:absolute; left:0; top:0; height:100%; width:3px; background:${sideColors[ride.provider] || '#00d084'};"></div>
        <div style="padding-left:8px;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span style="font-size:8px; font-weight:bold; text-transform:uppercase; border:1px solid; padding:2px 6px; border-radius:4px; font-family:'Space Mono',monospace; ${styleString}">${icon} ${providerLabel}</span>
            <span style="font-size:8px; color:rgba(255,255,255,0.3); font-family:'Space Mono',monospace;">ID: ${ride.bookingId}</span>
          </div>
          <div style="font-size:11px; font-weight:bold; color:white; margin-top:6px;">${ride.pickupLocation.split(',')[0]}  ${ride.destination.split(',')[0]}</div>
          <div style="font-size:9px; color:rgba(255,255,255,0.5); margin-top:2px;">
            Driver: <strong style="color:white;">${ride.driver.name}</strong>  ${ride.driver.vehicle} (${ride.driver.plate})
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:8px; color:rgba(255,255,255,0.4); text-transform:uppercase; font-family:'Space Mono',monospace;">Status</div>
          <div style="font-size:10px; font-weight:bold; color:#00d084; margin-top:2px;">Arriving in ${ride.eta} min</div>
        </div>
      </div>
    `;
  }).join('');
}

function saveAffiliateCredentials() {
  const ebay = document.getElementById('mobileAffEbay').value.trim();
  const amazon = document.getElementById('mobileAffAmazon').value.trim();
  const jumia = document.getElementById('mobileAffJumia').value.trim();
  
  if (ebay) localStorage.setItem('at_ebay_campid', ebay);
  else localStorage.removeItem('at_ebay_campid');
  
  if (amazon) localStorage.setItem('at_amazon_tag', amazon);
  else localStorage.removeItem('at_amazon_tag');
  
  if (jumia) localStorage.setItem('at_jumia_kol', jumia);
  else localStorage.removeItem('at_jumia_kol');
  
  alert("Partner monetization tags updated successfully!");
  if (typeof searchPart === 'function') {
    searchPart(true);
  }
}

function switchUserRole(role) {
  const isMech = role === 'mechanic';
  document.getElementById('roleBtnUser').style.background = isMech ? 'transparent' : 'var(--accent)';
  document.getElementById('roleBtnUser').style.color = isMech ? 'var(--gray)' : 'white';
  document.getElementById('roleBtnMech').style.background = isMech ? 'var(--accent)' : 'transparent';
  document.getElementById('roleBtnMech').style.color = isMech ? 'white' : 'var(--gray)';
  
  document.getElementById('userProfileCard').style.display = isMech ? 'none' : 'block';
  document.getElementById('vehicleSetup').style.display = isMech ? 'none' : (!mobileVehicle.make ? 'block' : 'none');
  document.getElementById('vehicleDashboard').style.display = isMech ? 'none' : (mobileVehicle.make ? 'block' : 'none');
  
  const mDash = document.getElementById('mechanicCenterDashboard');
  if(mDash) {
    mDash.style.display = isMech ? 'block' : 'none';
    if(isMech) {
      mDash.innerHTML = `<div style="text-align:center; padding:40px 20px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:24px;">
        <div style="font-size:48px; margin-bottom:16px;"></div>
        <div style="font-family:'Bebas Neue',sans-serif; font-size:28px; letter-spacing:1px; margin-bottom:8px;">MECHANIC DASHBOARD</div>
        <div style="font-size:12px; font-family:'Space Mono',monospace; color:var(--gray);">You must be verified to accept jobs.</div>
        <button onclick="location.href='verify.html'" style="margin-top:24px; background:var(--fg); color:var(--bg); border:none; padding:12px 24px; border-radius:12px; font-family:'Space Mono',monospace; font-weight:bold; font-size:12px; letter-spacing:1px;">GET VERIFIED </button>
      </div>`;
    }
  }
}

// Call on boot
setTimeout(renderGarageDashboard, 100);

function goTo(screen) {
  if (screen === curScreen) return;
  
  const oldScreen = document.getElementById(curScreen);
  const newScreen = document.getElementById(screen);
  
  if (!newScreen) return;

  // Reset scroll position to top BEFORE showing
  newScreen.scrollTop = 0;

  // App-style Transitions
  gsap.to(oldScreen, { 
    xPercent: -20, 
    opacity: 0, 
    duration: 0.4, 
    ease: "power2.inOut",
    onComplete: () => {
      oldScreen.classList.remove('active');
      gsap.set(oldScreen, { clearProps: "all" });
    }
  });
  
  newScreen.classList.add('active');
  // Auto-Start Voice SOS if entering Emergency Screen
  if (screen === 'emergency') {
    setTimeout(() => {
      if (typeof toggleVoiceSOS === 'function') {
        toggleVoiceSOS(true);
      }
    }, 600); // Wait for screen transition to finish
  } else {
    // Optionally turn it off if they leave the screen to save battery
    // if (typeof voiceSosActive !== 'undefined' && voiceSosActive && typeof toggleVoiceSOS === 'function') {
    //   toggleVoiceSOS();
    // }
  }
  
  gsap.fromTo(newScreen, 
    { xPercent: 100, opacity: 0 },
    { xPercent: 0, opacity: 1, duration: 0.5, ease: "expo.out",
      onComplete: () => { gsap.set(newScreen, { clearProps: "transform,opacity" }); }
    }
  );

  // Nav Indicator Logic
  document.querySelectorAll('.nav-tab').forEach((t, i) => {
    t.classList.remove('active');
    if (t.id === 'tab-' + screen) {
      t.classList.add('active');
      gsap.to('#navIndicator', { left: (i * 16.66) + "%", duration: 0.5, ease: "elastic.out(1, 0.8)" });
    }
  });

  if (screen === 'emergency') {
    newScreen.classList.add('emergency-mode');
  } else {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('emergency-mode'));
  }

  curScreen = screen;
  if (screen === 'mechanics') renderMechs(getMechs());
  if (screen === 'emergency') initSOSSlider();
  if (screen === 'rides' && !ridePickupLat) setTimeout(detectRidePickup, 400);
  if (screen === 'garage') { loadVehicleProfile(); newScreen.scrollTop = 0; }
  if (screen === 'history') renderHistory();
  if (screen === 'parts') searchPart(true);
}

// ---- SOS SLIDER LOGIC ----
function initSOSSlider() {
  const handle = document.getElementById('sosHandle');
  const container = document.getElementById('sosSlider');
  const track = document.getElementById('sosTrack');
  if (!handle || !container) return;
  
  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  let maxW = container.offsetWidth - handle.offsetWidth - 12;

  const onStart = (e) => {
    isDragging = true;
    startX = (e.touches ? e.touches[0].clientX : e.clientX) - currentX;
    handle.style.transition = 'none';
    if(track) track.style.transition = 'none';
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const xPos = (e.touches ? e.touches[0].clientX : e.clientX);
    let x = xPos - startX;
    
    if (x < 0) x = 0;
    if (x > maxW) x = maxW;
    
    currentX = x;
    gsap.set(handle, { x: x });
    if(track) gsap.set(track, { width: x + 64 });
    
    if (x >= maxW) {
      isDragging = false;
      currentX = 0;
      // Trigger Call
      window.location.href = "tel:112";
      // Feedback
      gsap.to(handle, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      if(track) gsap.to(track, { width: 0, duration: 0.5 });
    }
  };

  const onEnd = () => {
    if (isDragging) {
      isDragging = false;
      currentX = 0;
      gsap.to(handle, { x: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      if(track) gsap.to(track, { width: 0, duration: 0.5 });
    }
  };

  handle.addEventListener('touchstart', onStart);
  handle.addEventListener('mousedown', onStart);
  window.addEventListener('touchmove', onMove);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchend', onEnd);
  window.addEventListener('mouseup', onEnd);
}

function broadcastLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const msg = `EMERGENCY SOS: I need help. My current location is: https://www.google.com/maps?q=${lat},${lng}`;
      window.location.href = `sms:?body=${encodeURIComponent(msg)}`;
    });
  } else {
    alert("Unable to detect location. Please dial 112 immediately.");
  }
}

// ---- APP INITIALIZATION ----
window.addEventListener('load', () => {
  const splash = document.getElementById("splashScreen");
  
  // Bulletproof splash removal  works even if GSAP fails
  const removeSplash = () => {
    if (!splash || splash._removed) return;
    splash._removed = true;
    splash.style.transition = 'opacity 0.5s, transform 0.5s';
    splash.style.opacity = '0';
    splash.style.transform = 'scale(1.1)';
    setTimeout(() => { if (splash.parentNode) splash.remove(); }, 600);
  };

  setTimeout(() => {
    if (splash && typeof gsap !== 'undefined' && !splash._removed) {
      gsap.to(splash, {
        opacity: 0, scale: 1.1, duration: 0.8, ease: "power3.inOut",
        onComplete: removeSplash
      });
    } else {
      removeSplash();
    }
  }, 1800);

  // Absolute safety net  splash ALWAYS goes away after 3 seconds
  setTimeout(removeSplash, 3000);

  initLocation();
});

// ---- LOCATION ----
let userCity = 'New York';
let userAddr = 'Detecting location...';
let userLat = null;
let userLng = null;
let isOfflineMode = false;

var _distanceCache = {};
function calculateDistance(lat1, lon1, lat2, lon2) {
  const key = `${lat1.toFixed(4)},${lon1.toFixed(4)}_${lat2.toFixed(4)},${lon2.toFixed(4)}`;
  if (_distanceCache[key] !== undefined) return _distanceCache[key];
  const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  _distanceCache[key] = dist;
  return dist;
}

async function fetchRealMechanics(lat, lng, city) {
  if (!navigator.onLine) {
    isOfflineMode = true;
    if (curScreen === 'mechanics') renderMechs(getMechs());
    return;
  }

  let realMechs = [];
  try {
    const TOMTOM_API_KEY = "z2DK7IlIl3LGpl2yewZ6upcpFHF9koqY";
    const url = `https://api.tomtom.com/search/2/categorySearch/car%20repair.json?key=${TOMTOM_API_KEY}&lat=${lat}&lon=${lng}&radius=25000&limit=50`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        realMechs = data.results.map((p, idx) => {
          const distKm = p.dist ? (p.dist / 1000).toFixed(1) : 'Unknown';
          const pName = p.poi ? p.poi.name : 'Unknown Mechanic';
          const isTyre = pName.toLowerCase().includes('tire') || pName.toLowerCase().includes('wheel');
          const isBrake = pName.toLowerCase().includes('brake');
          const isElec = pName.toLowerCase().includes('electric');
          const spec = isTyre ? 'Tire Specialist' : (isBrake ? 'Brake Specialist' : (isElec ? 'Auto Electrician' : 'General Mechanic'));
          const rawPhone = (p.poi && p.poi.phone) ? p.poi.phone : 'Unlisted - Walk-in';
          const cleanWa = rawPhone.includes('Unlisted') ? '' : rawPhone.replace(/\D/g, '');
          return {
            id: 'real_tt_' + p.id,
            name: pName, spec: spec, area: (p.address && p.address.freeformAddress) ? p.address.freeformAddress : city,
            dist: distKm + 'km', distVal: p.dist ? (p.dist / 1000) : 0, phone: rawPhone, wa: cleanWa,
            rating: '4.5', rev: Math.floor(Math.random() * 50) + 10, verified: true, avail: 'open',
            emoji: '🔧', yrs: 8, city: city, lat: p.position ? p.position.lat : lat, lng: p.position ? p.position.lon : lng,
            isScanned: true, isPlatformUser: false
          };
        });
      }
    }
  } catch (e) {
    console.warn("TomTom failed", e);
  }

  if (realMechs.length === 0) {
    realMechs = [
      {
        id: 'mock_1', name: 'Elite Neon Auto', spec: 'Engine Specialist', area: 'Downtown Sector',
        dist: '2.4km', distVal: 2.4, phone: '555-0192', wa: '5550192', rating: '4.9', rev: 128,
        verified: true, avail: 'open', emoji: '👨🏾‍🔧', yrs: 8, city: 'Local', lat: lat || 6.5244, lng: lng || 3.3792,
        isScanned: false, isPlatformUser: true
      },
      {
        id: 'mock_2', name: 'CyberGlass Brakes', spec: 'Brake Specialist', area: 'Uptown District',
        dist: '4.1km', distVal: 4.1, phone: '555-0193', wa: '5550193', rating: '4.7', rev: 56,
        verified: false, avail: 'busy', emoji: '👩🏾‍🔧', yrs: 4, city: 'Local', lat: lat || 6.5244, lng: lng || 3.3792,
        isScanned: false, isPlatformUser: false
      }
    ];
  }

  MECHS = realMechs;
  try { localStorage.setItem('autoTriage_mechanics', JSON.stringify(MECHS)); } catch (e) {}
  if (curScreen === 'mechanics') renderMechs(getMechs());
}

function initLocation() {
  if (!navigator.geolocation) {
    userLat = 6.5244; userLng = 3.3792; userCity = 'Lagos';
    document.getElementById('locBadge').textContent = '📍 ' + userCity;
    fetchRealMechanics(6.5244, 3.3792, 'Lagos');
    return;
  }
  
  let gpsTimeout = setTimeout(() => {
    if (userLat === null) {
      userLat = 6.5244; userLng = 3.3792; userCity = 'Lagos';
      document.getElementById('locBadge').textContent = '📍 ' + userCity;
      fetchRealMechanics(userLat, userLng, userCity);
    }
  }, 3000);

  navigator.geolocation.getCurrentPosition(pos => {
    clearTimeout(gpsTimeout);
    const { latitude: lat, longitude: lng } = pos.coords;
    userLat = lat; userLng = lng;
    fetchRealMechanics(lat, lng, 'Your City');
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(r => r.json()).then(d => {
        userCity = d.address?.city || 'Your City';
        document.getElementById('locBadge').textContent = '📍 ' + userCity;
        fetchRealMechanics(lat, lng, userCity);
      }).catch(() => fetchRealMechanics(lat, lng, 'Your City'));
  }, () => {
    clearTimeout(gpsTimeout);
    userLat = 6.5244; userLng = 3.3792; userCity = 'Lagos';
    document.getElementById('locBadge').textContent = '📍 ' + userCity;
    fetchRealMechanics(6.5244, 3.3792, 'Lagos');
  });
}

function autoDetect() {
  const inp = document.getElementById('rideFrom');
  inp.value = 'Detecting...';
  setTimeout(() => { inp.value = userAddr; }, 800);
}

// ---- VEHICLE TYPE ----
function setVt(btn, type) {
  document.querySelectorAll('.vt').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  curVt = type;
}

// ---- DIAGNOSIS IMAGE UPLOAD ----
let currentDiagnosisImage = null;
function attachDiagnosisImage(input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      currentDiagnosisImage = e.target.result;
      const preview = document.getElementById('diagImgPreview');
      if (preview) {
        preview.src = currentDiagnosisImage;
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
}

// ---- AI DIAGNOSIS ----
async function runDiagnosis() {
  const problem = document.getElementById('problemText').value.trim();
  if (!problem) { alert('Please describe your vehicle problem.'); return; }

  const btn = document.getElementById('diagnoseBtn');
  btn.disabled = true; btn.textContent = 'ANALYZING...';

  const area = document.getElementById('resultArea');
  const loading = document.getElementById('resultLoading');
  const body = document.getElementById('resultBody');
  area.classList.add('show');
  loading.style.display = 'block';
  body.innerHTML = '';
  document.getElementById('diagnose').classList.remove('active');
  document.getElementById('diag-result').classList.add('active');

  try {
    const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // <-- USER MUST PASTE KEY HERE

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
       throw new Error("GEMINI API KEY MISSING! Please paste your key into the code.");
    }

    const savedVeh = JSON.parse(localStorage.getItem('myVehicle') || '{}');
    const vehContext = savedVeh.make ? `${savedVeh.year} ${savedVeh.make} ${savedVeh.model}` : (window.curVt || 'Car');
    const langSelect = document.getElementById('langSelect');
    const lang = langSelect ? langSelect.value : 'en';

    let userContent = `Vehicle Context: ${vehContext}\nLanguage: ${lang}\nProblem: ${problem}`;
    
    // Construct the payload for Gemini 1.5 Flash
    let payload = {
      contents: [{
        role: "user",
        parts: [{ text: "You are an elite AI mechanic. Analyze the vehicle symptoms and provide a highly structured diagnostic report. You must return your response as a pure JSON object matching this exact schema: { \"summary\": \"brief diagnosis\", \"likely_causes\": [\"cause 1\", \"cause 2\"], \"severity\": \"HIGH\" or \"MEDIUM\" or \"LOW\", \"immediate_actions\": [\"action 1\"], \"solutions\": [\"solution 1\"], \"estimated_cost\": \"$100 - $300\", \"specialist_needed\": \"Brake Specialist\" }. Do not include markdown formatting or backticks around the JSON.\n\n" + userContent }]
      }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    };

    if (currentDiagnosisImage) {
      const base64Data = currentDiagnosisImage.split(',')[1];
      const mimeType = currentDiagnosisImage.split(';')[0].split(':')[1];
      payload.contents[0].parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'API connection failed');
    }

    const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!txt) throw new Error('No valid response from Gemini Engine');
    
    let result;
    try {
      result = JSON.parse(txt.trim());
    } catch(e) {
      throw new Error("Failed to parse AI response. " + e.message);
    }

    // Render beautiful UI
    body.innerHTML = `
      <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">SUMMARY</div>
      <div style="font-family: 'Space Mono', monospace; font-size: 14px; color: white; line-height: 1.6; margin-bottom: 12px;">${result.summary}</div>
      <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: ${result.severity==='HIGH'?'#E63946':(result.severity==='MEDIUM'?'#F4A261':'#2DBE60')}; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 30px;">SEVERITY ${result.severity}</div>

      <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">LIKELY CAUSES</div>
      <ul style="font-family: 'Space Mono', monospace; font-size: 13px; color: white; line-height: 1.6; padding-left: 20px; margin-bottom: 30px;">
        ${(result.likely_causes || []).map(c => `<li style="margin-bottom:8px;">${c}</li>`).join('')}
      </ul>

      <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">SOLUTIONS</div>
      <ul style="font-family: 'Space Mono', monospace; font-size: 13px; color: white; line-height: 1.6; padding-left: 20px; margin-bottom: 30px;">
        ${(result.solutions || []).map(s => `<li style="margin-bottom:8px;">${s}</li>`).join('')}
      </ul>

      <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">IMMEDIATE ACTIONS</div>
      <ul style="font-family: 'Space Mono', monospace; font-size: 13px; color: white; line-height: 1.6; padding-left: 20px; margin-bottom: 30px;">
        ${(result.immediate_actions || []).map(a => `<li style="margin-bottom:8px;">${a}</li>`).join('')}
      </ul>

      <div style="display: flex; gap: 20px;">
        <div style="flex:1;">
          <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">EST. COST</div>
          <div style="font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: white; letter-spacing: 1px;">${result.estimated_cost}</div>
        </div>
        <div style="flex:1;">
          <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">SPECIALIST</div>
          <div style="font-family: 'Space Mono', monospace; font-size: 13px; color: white;">${result.specialist_needed}</div>
        </div>
      </div>
    `;

    const specLabel = document.getElementById('targetSpecLabel');
    if (specLabel) specLabel.innerText = (result.specialist_needed || 'SPECIALIST').toUpperCase();

    // Cache the diagnosis result for WhatsApp sharing
    window._lastDiagnosisText = `*AUTOTRIAGE DIAGNOSIS*\n\n*Summary:* ${result.summary}\n*Causes:* ${(result.likely_causes||[]).join(', ')}\n*Solutions:* ${(result.solutions||[]).join(', ')}\n*Immediate Actions:* ${(result.immediate_actions||[]).join(', ')}\n*Est. Cost:* ${result.estimated_cost}\n*Specialist Needed:* ${result.specialist_needed}`;

  } catch(e) {
    body.innerHTML = `<div style="color:#E63946; font-family:'Space Mono', monospace; font-size:14px; text-align:center; padding:20px; border: 1px dashed rgba(230,57,70,0.5); border-radius: 12px;">${e.message}</div>`;
  }

  loading.style.display = 'none';
  btn.disabled = false; btn.textContent = 'INITIATE AI ENGINE';
}

function fetchGlobalMechanics(lat, lng) {
  try {
    const query = `[out:json];node["amenity"="car_repair"](around:15000, ${lat}, ${lng});out;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.elements && data.elements.length > 0) {
      const realMechs = data.elements.map(el => ({
        name: el.tags.name || "Auto Repair Shop",
        spec: "Local Service",
        area: "Near You",
        phone: el.tags.phone || "No phone listed",
        wa: el.tags.phone ? el.tags.phone.replace(/\D/g, '') : "1234567890",
        rating: (4.0 + Math.random() * 1.0).toFixed(1),
        rev: Math.floor(Math.random() * 200),
        avail: 'open',
        emoji: '',
        city: el.tags['addr:city'] || "Your City",
        lat: el.lat,
        lng: el.lon,
        isVerified: false,
        isRealOverpass: true
      }));
      
      // Combine with featured mechanics
      MECHS = [...MECHS.filter(m => m.isVerified), ...realMechs];
      renderMechs(getMechs());
    }
  } catch (err) {
    console.error("Global search failed:", err);
  }
}

try {
  const stored = localStorage.getItem('autoTriage_mechanics');
  if (stored) {
    const parsed = JSON.parse(stored);
    const mockNames = [
      'Alex Miller', 'Marco Rossi', 'Chen Wei', 'Sarah Jenkins', 'Yuki Tanaka',
      'Lucas Silva', 'Hans Schmidt', 'Elena Petrova', 'Chloe Dubois', "Liam O'Connor",
      'Sanjay Gupta', 'Isabella Rossi',
      // Old generated fake workshop names  purge from cache
      'Effurun Rapid Auto Care', 'Elite Car Electronics', 'Downtown Garage Services',
      'Apex Engine Diagnostics', 'Delta Auto Clinic', 'Warri Fast Repairs',
      'Lagos Auto Workshop 1', 'Lagos Auto Workshop 2', 'Lagos Auto Workshop 3',
    ];
    MECHS = parsed
      .filter(m => m && m.name && !mockNames.includes(m.name))
      .map(m => ({
        ...m,
        rev: m.jobs || m.reviews || m.rev || 0,
        wa: m.whatsapp || m.wa || m.phone,
        isPlatformUser: m.isScanned ? false : true
      }));
    localStorage.setItem('autoTriage_mechanics', JSON.stringify(MECHS));
  }
} catch (e) {}

function getMechs() {
  const q = (document.getElementById('mechQ')?.value || '').toLowerCase();
  let list = [...MECHS];
  
  // Filter based on active locator mode
  if (activeLocatorMode === 'scanner') {
    // Show everything in scanner mode to ensure grid is populated!
    // list = list; 
  } else {
    list = list.filter(m => !m.isScanned);
  }
  
  // Inject current user's active mechanic profile at the top if verified!
  const myProfile = JSON.parse(localStorage.getItem('myMechanicProfile'));
  if (myProfile && myProfile.isVerified) {
    const myMechItem = {
      id: 'my_profile_mech',
      name: myProfile.name,
      spec: myProfile.spec,
      area: 'My Workshop',
      phone: myProfile.phone,
      wa: myProfile.wa,
      rating: '5.0',
      rev: myProfile.rev || 0,
      avail: myProfile.avail || 'open',
      emoji: myProfile.emoji || '',
      isVerified: true,
      isPlatformUser: true,
      city: myProfile.city,
      lat: userLat || 6.5244,
      lng: userLng || 3.3792
    };
    const idx = list.findIndex(m => m.id === 'my_profile_mech');
    if (idx !== -1) {
      list[idx] = myMechItem;
    } else {
      list.unshift(myMechItem);
    }
  }
  
  // Calculate exact distances if GPS is active
  if (userLat !== null && userLng !== null) {
    list.forEach(m => {
      m.distVal = calculateDistance(userLat, userLng, m.lat, m.lng);
      m.area = m.distVal.toFixed(1) + ' km away';
    });
  } else {
    list.forEach(m => {
      m.distVal = 9999;
    });
  }

  if (curSpec2 !== 'All') list = list.filter(m => m.spec === curSpec2);
  if (q) list = list.filter(m => m.name.toLowerCase().includes(q) || m.spec.toLowerCase().includes(q) || m.area.toLowerCase().includes(q));
  
  return list.sort((a, b) => {
    // 1. Prioritize mechanics matching the AI Diagnosed Specialty at the very top!
    if (aiDiagnosedSpecialty) {
      const aMatch = a.spec.toLowerCase().includes(aiDiagnosedSpecialty.toLowerCase());
      const bMatch = b.spec.toLowerCase().includes(aiDiagnosedSpecialty.toLowerCase());
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
    }
    
    // 2. Sort by proximity (closest first)
    if (a.distVal !== b.distVal) return a.distVal - b.distVal;
    
    // 3. Fallback to availability & rating
    if (a.avail === 'open' && b.avail !== 'open') return -1;
    if (a.avail !== 'open' && b.avail === 'open') return 1;
    return b.rating - a.rating;
  });
}

function renderMechs(list) {
  const el = document.getElementById('mechList');
  if (!el) return;
  if (!list.length) {
    if (isOfflineMode) {
      el.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center;padding:60px 20px;color:var(--gray);font-size:13px;line-height:1.8; animation: fadeInUp 0.4s ease;">
          <div style="position: relative; width: 72px; height: 72px; margin: 0 auto 20px;">
            <div style="position: absolute; inset: 0; border-radius: 50%; border: 4px solid rgba(230, 57, 70, 0.15); animation: pulse 1.5s infinite;"></div>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg></div>
          </div>
          <h3 style="font-family:'Bebas Neue', sans-serif; font-size:24px; color:white; letter-spacing:1px; margin-bottom:8px;">YOU ARE OFFLINE</h3>
          No cached mechanics found on this device.<br>
          <span style="font-size:11px;color:rgba(255,255,255,0.3)">Connect to the internet to scan for nearby mechanics.</span>
          <br>
          <button onclick="fetchRealMechanics(userLat || 6.5244, userLng || 3.3792, userCity || 'Lagos')" style="margin-top: 20px; background: var(--accent); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: bold; cursor: pointer; transition: all 0.2s;">
            RETRY CONNECTION
          </button>
        </div>
      `;
    } else if (userLat === null) {
      el.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--gray);font-size:13px;line-height:1.8;">
          <div style="font-size:32px;margin-bottom:12px;animation: pulse 1.5s infinite;display:flex;justify-content:center;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>
          Searching for physical auto shops around your current coordinates...<br>
          <span style="font-size:11px;color:rgba(255,255,255,0.3)">Please ensure your browser's GPS/location access is allowed.</span>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--gray);font-size:13px;line-height:1.8;">
          <div style="font-size:32px;margin-bottom:12px;display:flex;justify-content:center;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E63946" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>
          No real auto repair shops registered on the map within 8km of your coordinates.<br>
          <span style="font-size:11px;color:rgba(255,255,255,0.3)">Try moving to a different location or check your internet connection.</span>
        </div>
      `;
    }
    return;
  }
  
  const cardsHtml = list.map((m, i) => {
    const safeSpec = m.spec || 'General Mechanic';
    const safeName = m.name || 'Unknown Mechanic';
    const isDiagnosedMatch = aiDiagnosedSpecialty && safeSpec.toLowerCase().includes(aiDiagnosedSpecialty.toLowerCase());
    
    const hasPhone = (m.phone && m.phone !== 'Unlisted - Walk-in' && m.phone.length > 5) || (m.wa && m.wa !== 'None' && m.wa.length > 5);
    const noPhoneWarning = !hasPhone ? `
      <div class="mt-2 inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md shadow-[0_0_10px_rgba(239,68,68,0.15)]">
        <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
        <span class="text-red-400 font-mono text-[9px] uppercase tracking-wider font-bold">Drive-In Only</span>
      </div>
    ` : '';

    const cleanPhone = m.phone ? m.phone.replace(/[^0-9+]/g, '') : '';
    const cleanWa = m.wa && m.wa !== 'None' ? m.wa.replace(/[^0-9+]/g, '') : cleanPhone;
    const chatLink = (m.wa && m.wa !== 'None') ? `https://wa.me/${cleanWa}` : `tel:${cleanPhone}`;

    const chatBtnHtml = hasPhone ? `
      <button class="flex-[1.2] h-10 bg-emerald-500/10 active:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-mono text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_4px_10px_rgba(16,185,129,0.1)]" onclick="event.stopPropagation(); window.open('${chatLink}', '_blank')">
         CHAT
      </button>
    ` : `
      <button class="flex-[1.2] h-10 bg-white/5 text-white/30 border border-white/5 rounded-xl font-mono text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 cursor-not-allowed" onclick="event.stopPropagation();">
        NO PHONE
      </button>
    `;

    const statusColor = m.avail === 'open' ? '#10b981' : (m.avail === 'busy' ? '#f59e0b' : '#ef4444');

    return `
      <div class="mech-card-s group relative rounded-[1.5rem] p-[1.5px] cursor-pointer overflow-hidden transition-all duration-500 active:scale-[0.98] mb-4" style="animation: fadeInUp 0.4s ease ${i * 0.1}s both;" onclick="openMechanicProfileDetail('${safeName.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')">
        <!-- Animated Cyan/Blue Gradient Border -->
        <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/50 via-blue-500/40 to-indigo-500/50 opacity-100 blur-[3px] shadow-[0_0_20px_rgba(6,182,212,0.3)] ${isDiagnosedMatch ? 'from-orange-500/50 to-red-500/40' : ''}"></div>
        
        <!-- Card Glass Background -->
        <div class="relative h-full bg-[#0d0e12]/60 backdrop-blur-3xl rounded-[1.5rem] p-4 flex flex-col gap-3 shadow-2xl">
          
          <!-- Header Section -->
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-3">
              <!-- Mechanic Avatar & Status -->
              <div class="relative z-10 shrink-0">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-2xl shadow-inner relative overflow-hidden transition-transform duration-500">
                  <div class="absolute inset-0 bg-blue-400/20 opacity-0 transition-opacity duration-500"></div>
                  ${m.emoji || ''}
                </div>
                <!-- Status Dot -->
                <div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-[2px] border-[#0d0e12] shadow-[0_0_10px_${statusColor}] z-20" style="background-color: ${statusColor};"></div>
              </div>
            </div>
            
            <!-- Location Badge -->
            <div class="relative z-20 flex flex-col items-end gap-1">
              <div class="bg-blue-500/10 border border-blue-500/30 px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-md shadow-lg shadow-blue-500/10">
                <span class="text-[9px] text-blue-400 font-mono font-bold tracking-wider">${distanceStr}</span>
              </div>
              ${isDiagnosedMatch ? '<div class="text-[8px] text-orange-400 font-mono tracking-widest font-bold uppercase drop-shadow-md">AI MATCH</div>' : `<div class="text-[7px] text-white/30 font-mono tracking-widest font-bold uppercase">${m.isScanned ? 'GPS SCANNED' : 'NEARBY'}</div>`}
            </div>
          </div>

          <!-- Body Section -->
          <div class="flex-1 mt-1">
            <h3 class="text-[18px] font-extrabold text-white tracking-tight mb-0.5 leading-tight drop-shadow-sm" style="font-family:'Bebas Neue',sans-serif; letter-spacing:1px;">
              ${safeName}
            </h3>
            <p class="text-[10px] text-gray-400 font-mono tracking-wider uppercase mb-2 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-red-500/80 shrink-0"></span>
              <span class="leading-tight">${safeSpec}</span>
            </p>
            
            <!-- Rating & Verification Strip -->
            <div class="bg-[#1a1b23]/50 rounded-lg p-2.5 border border-white/5 flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="text-yellow-400 text-[12px] drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"></span>
                <span class="text-white font-bold text-[11px]">${m.rating}</span>
                <span class="text-white/20 mx-0.5">|</span>
                <span class="text-gray-400 font-mono text-[8px] tracking-wider uppercase font-bold">${m.rev} REV</span>
              </div>
              <div class="flex items-center gap-1 text-[8px] font-mono tracking-wider text-white/50 uppercase">
                <span class="w-1 h-1 rounded-full bg-white/30"></span> ${m.yrs || 0} YRS
              </div>
            </div>
            
            ${noPhoneWarning}
          </div>

          <!-- Bottom Section -->
          <div class="mt-2 flex flex-col gap-2">
            <!-- Action Buttons -->
            <div class="flex gap-2">
              <button class="flex-1 h-10 bg-blue-500/10 active:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-mono text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_4px_10px_rgba(59,130,246,0.1)]" onclick="event.stopPropagation(); window.openMapTracker && openMapTracker('${safeName.replace(/'/g, "\\'").replace(/"/g, '&quot;')}', ${m.lat || 0}, ${m.lng || 0})">
                 TRACK
              </button>
              ${chatBtnHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (isOfflineMode) {
    el.innerHTML = `
      <div style="grid-column: 1 / -1; margin-bottom: 16px; padding: 14px 16px; background: linear-gradient(135deg, rgba(255,136,0,0.12), rgba(255,136,0,0.06)); border: 1px solid rgba(255,136,0,0.25); border-radius: 16px; display: flex; align-items: center; gap: 12px; animation: fadeInUp 0.4s ease;">
        <div style="font-size: 20px;"></div>
        <div style="flex: 1;">
          <div style="font-size: 9px; color: var(--warn); font-family: 'Space Mono', monospace; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Working Offline</div>
          <div style="font-size: 11px; font-weight: bold; margin-top: 2px; color: var(--light-text);">Showing cached mechanics from your last active session.</div>
        </div>
      </div>
      ${cardsHtml}
    `;
  } else {
    el.innerHTML = cardsHtml;
  }
}

function filterMechs() { renderMechs(getMechs()); }

function triggerAIRecommendation(specialist) {
  aiDiagnosedSpecialty = specialist;
  
  // Show the AI Recommendation Banner
  const banner = document.getElementById('aiRecommendationBanner');
  const bannerText = document.getElementById('aiRecommendationText');
  if (banner && bannerText) {
    banner.style.display = 'flex';
    bannerText.textContent = `${specialist} (Priority Sorted to Top)`;
  }
  
  // Clear any strict search text filter so they still see all other mechanics below!
  const mechQ = document.getElementById('mechQ');
  if (mechQ) mechQ.value = '';
  
  // Switch to the mechanics screen
  goTo('mechanics');
  
  // Re-sort and render
  filterMechs();
}

function clearAIDiagnosedSpecialty() {
  aiDiagnosedSpecialty = null;
  const banner = document.getElementById('aiRecommendationBanner');
  if (banner) banner.style.display = 'none';
  filterMechs();
}

function bookRideToMech(name, city) {
  const destInput = document.getElementById('rideTo');
  if (destInput) {
    destInput.value = `${name} (${city})`;
    // Trigger the ride search logic to show providers immediately
    goTo('rides');
    setTimeout(() => {
        if(typeof searchRides === 'function') searchRides();
    }, 500);
  }
}

// ---- RATING SYSTEM ----
let selectedRating = 5;
let ratingTargetMech = '';

function openRatingModal(mechName) {
  ratingTargetMech = mechName;
  document.getElementById('ratingMechName').textContent = mechName;
  document.getElementById('ratingModal').style.display = 'flex';
  setRatingStars(5);
}

function setRatingStars(n) {
  selectedRating = n;
  const stars = document.querySelectorAll('.star-opt');
  stars.forEach((s, i) => {
    s.style.color = i < n ? '#ffcc00' : 'rgba(255,255,255,0.1)';
  });
}

function submitRating() {
  const comment = document.getElementById('ratingComment').value;
  const review = {
    mech: ratingTargetMech,
    rating: selectedRating,
    comment: comment,
    date: new Date().toLocaleDateString()
  };
  
  // Save to local storage
  let reviews = JSON.parse(localStorage.getItem('autotriage_reviews') || '[]');
  reviews.push(review);
  localStorage.setItem('autotriage_reviews', JSON.stringify(reviews));
  
  alert(`Thank you! Your ${selectedRating}-star review for ${ratingTargetMech} has been submitted.`);
  closeRatingModal();
}

function closeRatingModal() {
  document.getElementById('ratingModal').style.display = 'none';
  document.getElementById('ratingComment').value = '';
}

function filterSpec2(btn, spec) {
  document.querySelectorAll('.sf').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  curSpec2 = spec;
  renderMechs(getMechs());
  if (activeLocatorMode === 'gmaps') {
    updateGoogleMapsRadar();
  }
}

// DUAL-MODE LOCATOR INTEGRATION
let activeLocatorMode = 'scanner';

function switchLocatorMode(mode) {
  activeLocatorMode = mode;
  const scannerBtn = document.getElementById('toggleScannerBtn');
  const gmapsBtn = document.getElementById('toggleGmapsBtn');
  const scannerList = document.getElementById('mechList');
  const gmapsWrapper = document.getElementById('gmapsRadarWrapper');
  const searchInput = document.getElementById('mechQ');
  const aiBanner = document.getElementById('aiRecommendationBanner');

  if (gmapsWrapper) gmapsWrapper.style.display = 'none';

  if (mode === 'scanner') {
    if (scannerBtn) { scannerBtn.style.background = 'var(--accent)'; scannerBtn.style.color = 'white'; }
    if (gmapsBtn) { gmapsBtn.style.background = 'transparent'; gmapsBtn.style.color = 'var(--gray)'; }
    if (scannerList) scannerList.style.display = 'grid';
    if (searchInput) searchInput.style.display = 'block';
    if (aiDiagnosedSpecialty && aiBanner) aiBanner.style.display = 'flex';
    renderMechs(getMechs());
  } else {
    if (gmapsBtn) { gmapsBtn.style.background = 'var(--accent)'; gmapsBtn.style.color = 'white'; }
    if (scannerBtn) { scannerBtn.style.background = 'transparent'; scannerBtn.style.color = 'var(--gray)'; }
    if (scannerList) scannerList.style.display = 'grid';
    if (searchInput) searchInput.style.display = 'none';
    if (aiBanner) aiBanner.style.display = 'none';
    
    // Draw spectacular pulsing radar coordinate sweep overlay card
    if (scannerList) {
      const locText = userCity ? `${userCity}` : 'Your Location';
      const latText = userLat ? `${userLat.toFixed(4)}, ${userLng.toFixed(4)}` : 'Acquiring GPS...';
      
      scannerList.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; backdrop-filter: blur(20px); min-height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <style>
            @keyframes deskRadarSweep { from { width: 0%; } to { width: 100%; } }
          </style>
          <div style="position: relative; width: 72px; height: 72px; margin-bottom: 24px;">
            <div style="position: absolute; inset: 0; border-radius: 50%; border: 4px solid rgba(77, 166, 255, 0.15); animation: ping 1.5s infinite;"></div>
            <div style="position: absolute; inset: 8px; border-radius: 50%; border: 2px solid rgba(77, 166, 255, 0.3); animation: pulse 1.5s infinite;"></div>
            <div style="position: absolute; inset: 0; border-radius: 50%; border: 2px solid transparent; border-top-color: #4da6ff; animation: spin 1s linear infinite;"></div>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 24px;"></div>
          </div>
          <div style="font-family: 'Space Mono', monospace; font-size: 14px; font-weight: bold; color: white; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; animation: pulse 1s infinite;">Scanning Google Maps...</div>
          <div style="font-family: 'Space Mono', monospace; font-size: 9px; color: #4da6ff; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px;">
            COORD LOCK: ${locText} (${latText})
          </div>
          <div style="width: 160px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; position: relative;">
            <div style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: linear-gradient(to right, #4da6ff, #00d084); animation: deskRadarSweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;"></div>
          </div>
        </div>
      `;
    }

    setTimeout(() => {
      renderMechs(getMechs());
    }, 1200);
  }
}

function updateGoogleMapsRadar() {
  const frame = document.getElementById('gmapsRadarFrame');
  if (!frame) return;

  // Detect active specialty pill
  let specialty = 'car repair';
  const activePill = document.querySelector('.spec-row .sf.on');
  if (activePill && activePill.textContent !== 'All') {
    const specName = activePill.textContent;
    if (specName.includes('AC')) specialty = 'car AC repair';
    else if (specName.includes('Brakes')) specialty = 'brake repair';
    else if (specName.includes('Electric')) specialty = 'auto electrician';
    else if (specName.includes('Engine')) specialty = 'engine repair';
    else if (specName.includes('General')) specialty = 'car repair';
  }

  // Detect location
  let locationQuery = 'Lagos';
  if (userLat !== null && userLng !== null) {
    locationQuery = `${userLat},${userLng}`;
  } else if (window.userCity && window.userCity !== 'Detecting...') {
    locationQuery = window.userCity;
  }

  const finalQuery = `${specialty} near ${locationQuery}`;
  frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(finalQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
}

// ======================================
// RIDES ENGINE  DEEP-LINK BOOKING SYSTEM
// ======================================

let ridePickupLat = null, ridePickupLng = null;
let rideDropLat = null, rideDropLng = null;
let currentRideType = 'standard';
let selectedProvider = null;

// Ride type selector
function setRideType(btn, type) {
  document.querySelectorAll('.rtype-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  currentRideType = type;
}

// Auto-detect pickup location
function detectRidePickup() {
  const btn = document.getElementById('detectPickupBtn');
  const inp = document.getElementById('rideFrom');
  btn.textContent = '';
  inp.placeholder = 'Detecting your location...';

  if (!navigator.geolocation) { inp.placeholder = 'GPS not supported'; btn.textContent = ''; return; }

  navigator.geolocation.getCurrentPosition(pos => {
    ridePickupLat = pos.coords.latitude;
    ridePickupLng = pos.coords.longitude;
    document.getElementById('ride-live-badge').style.display = 'block';

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${ridePickupLat}&lon=${ridePickupLng}`)
      .then(r => r.json())
      .then(d => {
        const addr = d.display_name || `${ridePickupLat.toFixed(4)}, ${ridePickupLng.toFixed(4)}`;
        inp.value = addr.split(',').slice(0,3).join(',');
        btn.textContent = '';
        // Pre-fill ride destination if coming from AI diagnosis
        const dest = document.getElementById('rideTo');
        if (!dest.value) dest.focus();
      }).catch(() => {
        inp.value = `${ridePickupLat.toFixed(4)}, ${ridePickupLng.toFixed(4)}`;
        btn.textContent = '';
      });
  }, () => {
    inp.placeholder = 'Could not detect  type manually';
    btn.textContent = '';
  }, { enableHighAccuracy: true });
}

// Geocode destination text to lat/lng (best-effort)
async function geocodeDest(text) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=1`);
    const d = await r.json();
    if (d && d[0]) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
  } catch {}
  return null;
}

// Estimate fare (Global pricing model)
function estimateFare(distKm, type, provider) {
  const bases = { bolt: 400, uber: 450, indrive: 350, rida: 380 };
  const perKm = { standard: 80, xl: 130, moto: 50, mechanic: 200 };
  const base = bases[provider] || 400;
  const rate = perKm[type] || 80;
  const surge = Math.random() > 0.7 ? 1.2 : 1.0;
  const fare = Math.round((base + distKm * rate) * surge / 50) * 50;
  const high = fare + 200;
  return `$${fare.toLocaleString()}  $${high.toLocaleString()}`;
}

// Provider deep-link builder
function buildDeepLink(provider, pLat, pLng, dLat, dLng, fromText, toText) {
  const enc = encodeURIComponent;
  switch(provider) {
    case 'lyft':
      // Lyft web deep link
      return `https://lyft.com/?pickup_lat=${pLat}&pickup_lng=${pLng}&destination_lat=${dLat || ''}&destination_lng=${dLng || ''}&destination_name=${enc(toText)}`;
    case 'uber':
      // Uber mobile web deep link
      return `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${pLat}&pickup[longitude]=${pLng}&pickup[nickname]=${enc(fromText)}&dropoff[latitude]=${dLat || ''}&dropoff[longitude]=${dLng || ''}&dropoff[nickname]=${enc(toText)}`;
    case 'bolt':
      return `https://bolt.eu/`;
    case 'didi':
      return `https://didi-global.com/`;
    case 'grab':
      return `https://grab.com/book?from=${enc(fromText)}&to=${enc(toText)}`;
    case 'indrive':
      return `https://indrive.com/`;
    default:
      return '#';
  }
}

// Provider config
const PROVIDERS_CONFIG = [
  {
    id: 'uber', name: 'Uber', emoji: '', class: 'prc-uber',
    sub: 'Premium service  Verified drivers',
    drivers: ['John D.','Maria G.','David K.','Sarah W.','Robert L.'],
    cars: ['Toyota Camry','Honda Fit','Toyota Sienna','Ford Edge'],
    colors: ['Black','White','Silver','Blue'],
    plates: ['NY','CA','TX','FL'],
  },
  {
    id: 'lyft', name: 'Lyft', emoji: '', class: 'prc-bolt',
    sub: 'Fast & affordable  3.2K drivers',
    drivers: ['Michael T.','Sarah L.','David W.','Emma R.','James C.'],
    cars: ['Toyota Camry','Honda Accord','Toyota Corolla','Hyundai Elantra'],
    colors: ['Black','White','Silver','Gray'],
    plates: ['NY','CA','TX','FL'],
  },
  {
    id: 'bolt', name: 'Bolt', emoji: '', class: 'prc-bolt',
    sub: 'Quick pickups  Low commission',
    drivers: ['Tomas Z.','Lars P.','Jan E.'],
    cars: ['Skoda Octavia','Volkswagen Golf','Opel Astra'],
    colors: ['Green','Black','White'],
    plates: ['TX','NY','CA'],
  },
  {
    id: 'didi', name: 'DiDi', emoji: '', class: 'prc-didi',
    sub: 'Global ride-hailing leader',
    drivers: ['Li W.','Chen H.','Zhang M.'],
    cars: ['BYD Qin','GAC Aion S','Geely Emgrand'],
    colors: ['White','Silver','Blue'],
    plates: ['CA','TX','NY'],
  },
  {
    id: 'grab', name: 'Grab', emoji: '', class: 'prc-rida',
    sub: 'Southeast Asia favourite',
    drivers: ['Alex M.','Jessica B.','Thomas S.','Elena R.','Kevin H.'],
    cars: ['Toyota Corolla','Kia Rio','Hyundai i10','Honda Fit'],
    colors: ['Red','White','Black','Silver'],
    plates: ['NY','CA','TX','FL'],
  },
  {
    id: 'indrive', name: 'InDrive', emoji: '', class: 'prc-indrive',
    sub: 'Fair pricing  Peer-to-peer',
    drivers: ['Vadim K.','Sergey N.','Iryna S.'],
    cars: ['Hyundai Sonata','Kia Optima','Renault Logan'],
    colors: ['Silver','White','Blue'],
    plates: ['AZ','CA','TX'],
  }
];

let rideSearchResults = [];

async function searchRides() {
  const from = document.getElementById('rideFrom').value.trim();
  const to   = document.getElementById('rideTo').value.trim();
  if (!from) { detectRidePickup(); return; }
  if (!to)   { alert('Please enter your destination.'); return; }

  // Geocode destination
  const destGeo = ridePickupLat ? await geocodeDest(to) : null;
  if (destGeo) { rideDropLat = destGeo.lat; rideDropLng = destGeo.lng; }

  const distKm = (ridePickupLat && rideDropLat)
    ? calculateDistance(ridePickupLat, ridePickupLng, rideDropLat, rideDropLng)
    : (3 + Math.random() * 12); // fallback distance estimate

  // Show radar animation
  document.getElementById('rideSearching').style.display = 'block';
  document.getElementById('rideProviderResults').style.display = 'none';
  const statuses = ['Scanning nearby providers...','Checking Lyft drivers...','Checking Uber...','Checking Bolt...','Checking DiDi...','Checking Grab...','Checking InDrive...','Calculating fares...'];
  let si = 0;
  const statusEl = document.getElementById('searchStatus');
  const statusInt = setInterval(() => { if (si < statuses.length) statusEl.textContent = statuses[si++]; }, 500);

  setTimeout(() => {
    clearInterval(statusInt);
    document.getElementById('rideSearching').style.display = 'none';

    // Build results for each provider
    rideSearchResults = PROVIDERS_CONFIG.map(p => {
      const etaBase = Math.floor(3 + Math.random() * 12);
      const driver = p.drivers[Math.floor(Math.random() * p.drivers.length)];
      const car   = p.cars[Math.floor(Math.random() * p.cars.length)];
      const color = p.colors[Math.floor(Math.random() * p.colors.length)];
      const plate = p.plates[Math.floor(Math.random() * p.plates.length)] + ' ' + Math.floor(100 + Math.random()*900) + ' ' + String.fromCharCode(65 + Math.floor(Math.random()*26)) + String.fromCharCode(65 + Math.floor(Math.random()*26)) + String.fromCharCode(65 + Math.floor(Math.random()*26));
      const fare  = estimateFare(distKm, currentRideType, p.id);
      const link  = buildDeepLink(p.id, ridePickupLat || 0, ridePickupLng || 20, rideDropLat, rideDropLng, from, to);
      return { ...p, eta: etaBase, driver, car, color, plate, fare, link, distKm: distKm.toFixed(1) };
    }).sort((a, b) => a.eta - b.eta);

    renderProviderResults(rideSearchResults, from, to);
    document.getElementById('rideProviderResults').style.display = 'block';
  }, 3000);
}

function renderProviderResults(providers, from, to) {
  document.getElementById('providerCards').innerHTML = providers.map((p, i) => `
    <div class="provider-result-card ${p.class}" onclick="openBookingModal(${i})" style="animation:fadeInUp 0.4s ease ${i * 0.1}s both;">
      <div class="prc-avail"></div>
      <div class="prc-logo">${p.emoji}</div>
      <div class="prc-info">
        <div class="prc-name">${p.name}</div>
        <div class="prc-sub">${p.sub}</div>
        <div style="margin-top:8px;font-size:9px;color:rgba(255,255,255,0.3);"> ${p.car}  ${p.color}  ${p.plate}</div>
      </div>
      <div class="prc-right">
        <div class="prc-price">${p.fare}</div>
        <div class="prc-eta"> ${p.eta} min</div>
        <div style="margin-top:6px;font-size:9px;background:rgba(255,255,255,0.08);border-radius:8px;padding:3px 8px;color:rgba(255,255,255,0.5);">${p.distKm} km</div>
      </div>
    </div>
  `).join('');
}

function openBookingModal(idx) {
  selectedProvider = rideSearchResults[idx];
  const p = selectedProvider;

  document.getElementById('bookingProviderLogo').textContent = p.emoji;
  document.getElementById('bookingProviderName').textContent = p.name;
  document.getElementById('bookingDetails').innerHTML = `
    <div class="booking-row"><span class="booking-row-label">Fare estimate</span><span class="booking-row-val">${p.fare}</span></div>
    <div class="booking-row"><span class="booking-row-label">Distance</span><span class="booking-row-val">${p.distKm} km</span></div>
    <div class="booking-row"><span class="booking-row-label">Ride type</span><span class="booking-row-val">${currentRideType.toUpperCase()}</span></div>
  `;

  // Show matched driver
  document.getElementById('bookingDriverCard').style.display = 'flex';
  document.getElementById('bookingDriverAv').textContent = ['','','','','','','','','',''][Math.floor(Math.random()*10)];
  document.getElementById('bookingDriverName').textContent = p.driver;
  document.getElementById('bookingDriverInfo').textContent = `${p.car}  ${p.color}   ${(4.7 + Math.random()*0.29).toFixed(2)}`;
  document.getElementById('bookingDriverETA').textContent = p.eta;

  // Progress bar  simulate matching
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
    if (pct >= 100) { clearInterval(pi); status.textContent = 'DRIVER FOUND  TAP BELOW TO CONFIRM'; }
  }, 200);

  // Style open button with brand color
  const colorMap = { bolt:'#7fea00', uber:'#ffffff', indrive:'#4da6ff', rida:'#ff5050' };
  const btn = document.getElementById('openAppBtn');
  btn.style.color = colorMap[p.id] || '#fff';
  btn.textContent = ` Book with ${p.name} `;

  const modal = document.getElementById('rideBookingModal');
  modal.style.display = 'flex';
}

async function openProviderApp() {
  if (!selectedProvider) return;
  const p = selectedProvider;

  // Open the provider's app via deep link / mobile web  location data pre-filled
  window.open(p.link, '_blank');

  // Sync booking data with backend so SMS/Email dispatches are fired
  try {
    const savedUserStr = localStorage.getItem('autotriage_user');
    const savedUserObj = savedUserStr ? JSON.parse(savedUserStr) : null;
    const passengerEmail = savedUserObj ? savedUserObj.email : 'local_device_session@autotriage.io';
    const passengerName = savedUserObj ? savedUserObj.name : 'Guest Mobile Driver';
    const passengerPhone = localStorage.getItem('autotriage_phone_' + p.id) || '+1 (555) 0199';

    const res = await fetch('/api/book-ride', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: p.id,
        pickupLocation: document.getElementById('rideFrom').value || 'Current Location',
        destination: document.getElementById('rideTo').value || 'Unknown Destination',
        rideType: currentRideType || 'standard',
        passengerName: passengerName,
        passengerPhone: passengerPhone,
        passengerEmail: passengerEmail
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
      
      // Update mobile UI
      renderGarageRides();
    }
  } catch (err) {
    console.error('[MOBILE RIDE] Failed to dispatch backend booking state:', err);
  }

  closeBookingModal();
}

function closeBookingModal() {
  document.getElementById('rideBookingModal').style.display = 'none';
  selectedProvider = null;
}

// ---- LIVE MAP TRACKING ----
let trackerMap = null;
let userMarker = null;
let mechMarker = null;
let watchId = null;
let simulationInterval = null;
let isVoiceEnabled = true;
let primaryPillMarker = null;
let altPillMarker = null;
let primaryPolyline = null;
let altPolyline = null;
let startMarker = null;
let routeDots = [];

function speakDirection(text) {
  if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop any pending spoken instructions
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Clear natural rate
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Text-to-speech error:", err);
  }
}

function toggleVoice() {
  isVoiceEnabled = !isVoiceEnabled;
  const btn = document.getElementById('voiceBtn');
  if (btn) {
    if (isVoiceEnabled) {
      btn.textContent = '';
      btn.classList.remove('muted');
      speakDirection("Voice guidance enabled");
    } else {
      btn.textContent = '';
      btn.classList.add('muted');
    }
  }
}

function generateSimulatedRoute(uLng, uLat, mechLng, mechLat) {
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
}

function generateAlternativeRoute(uLng, uLat, mechLng, mechLat) {
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
}

// ---- satellite reverse-geocoding helper using 100% free OSM Nominatim ----
async function getPlaceName(lat, lng) {
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
}

async function fetchRealRouteNames(primaryLatLngs, mechName) {
  const startPt = primaryLatLngs[0];
  const turn1Pt = primaryLatLngs[Math.floor(primaryLatLngs.length * 0.3)];
  const turn2Pt = primaryLatLngs[Math.floor(primaryLatLngs.length * 0.7)];
  const endPt = primaryLatLngs[primaryLatLngs.length - 1];

  try {
    const [startName, turn1Name, turn2Name, endName] = await Promise.all([
      getPlaceName(startPt[0], startPt[1]),
      getPlaceName(turn1Pt[0], turn1Pt[1]),
      getPlaceName(turn2Pt[0], turn2Pt[1]),
      getPlaceName(endPt[0], endPt[1])
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
}

function openMapTracker(mechName, mechLat, mechLng) {
  document.getElementById('mapModal').style.display = 'flex';
  document.getElementById('mapMechName').textContent = mechName;
  document.getElementById('mapDist').innerHTML = `Calculating...`;
  
  // Find mechanic details from the global MECHS list
  const mech = MECHS.find(m => m.name === mechName) || { emoji: '', phone: '1234567890', wa: '1234567890', spec: 'Mobile Response Unit' };
  
  // Safe numeric coordinate parsing
  let finalLat = parseFloat(mechLat || mech.lat);
  let finalLng = parseFloat(mechLng || mech.lng);
  
  // Absolute fallback to user coordinates or London center if coordinates are invalid
  if (isNaN(finalLat) || isNaN(finalLng) || !finalLat || !finalLng) {
    finalLat = userLat || 51.5074;
    finalLng = userLng || -0.1278;
  }
  
  // Update UI components dynamically
  const avatarEl = document.getElementById('trackerMechAvatar');
  const specEl = document.getElementById('trackerMechSpec');
  const phoneEl = document.getElementById('trackerPhoneLink');
  const waEl = document.getElementById('trackerWaLink');
  const distValEl = document.getElementById('trackerDistVal');
  const etaValEl = document.getElementById('trackerEtaVal');
  
  if (avatarEl) avatarEl.textContent = mech.emoji || '';
  if (specEl) specEl.textContent = mech.spec || 'Mobile Response Unit';
  if (phoneEl) phoneEl.href = `tel:${mech.phone || ''}`;
  if (waEl) waEl.href = `https://wa.me/${mech.wa || ''}`;
  if (distValEl) distValEl.textContent = `Calculating...`;
  if (etaValEl) etaValEl.textContent = `Calculating...`;
  
  // Clear previous simulation if active
  if (simulationInterval !== null) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  
  // Display the Navigation HUD
  const navHud = document.getElementById('navHud');
  if (navHud) navHud.style.display = 'flex';
  
  // Start Geolocation watchPosition tracking to actively update coordinates as user moves
  if (navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        userLat = lat;
        userLng = lng;
        
        console.log("GPS Location updated in real-time:", lat, lng);
        
        // Pan the Leaflet camera dynamically to center on the moving user
        if (trackerMap) {
          trackerMap.panTo([lat, lng]);
        }
      },
      (err) => {
        console.warn("Real-time GPS tracking warning:", err);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  }
  
  setTimeout(() => {
    // Generate simulated driving coordinate route track from User to Mechanic's Workshop
    const startLat = userLat || (finalLat - 0.015);
    const startLng = userLng || (finalLng + 0.015);
    const destLat = finalLat;
    const destLng = finalLng;
    
    const routeCoordinates = generateSimulatedRoute(startLng, startLat, destLng, destLat);
    const alternativeCoordinates = generateAlternativeRoute(startLng, startLat, destLng, destLat);
    const totalDistance = calculateDistance(destLat, destLng, startLat, startLng);

    if (!trackerMap) {
      if (window.L) {
        trackerMap = L.map('mapContainer', {
          zoomControl: false,
          attributionControl: true
        });
        
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri &mdash; Sources: Esri'
        }).addTo(trackerMap);
        
        trackerMap.setView([startLat, startLng], 14);
        drawRouteLineAndSimulate(routeCoordinates, alternativeCoordinates, totalDistance, mech);
      }
    } else {
      if (window.L) {
        trackerMap.setView([startLat, startLng], 14);
        drawRouteLineAndSimulate(routeCoordinates, alternativeCoordinates, totalDistance, mech);
      }
    }
  }, 100);
}

async function drawRouteLineAndSimulate(routeCoords, altCoords, totalDistance, mech) {
  if (!trackerMap || !window.L) return;

  // Clear previous Leaflet layers
  if (primaryPolyline) { trackerMap.removeLayer(primaryPolyline); primaryPolyline = null; }
  if (altPolyline) { trackerMap.removeLayer(altPolyline); altPolyline = null; }
  if (startMarker) { trackerMap.removeLayer(startMarker); startMarker = null; }
  if (userMarker) { trackerMap.removeLayer(userMarker); userMarker = null; }
  if (mechMarker) { trackerMap.removeLayer(mechMarker); mechMarker = null; }
  if (primaryPillMarker) { trackerMap.removeLayer(primaryPillMarker); primaryPillMarker = null; }
  if (altPillMarker) { trackerMap.removeLayer(altPillMarker); altPillMarker = null; }
  if (routeDots && routeDots.length > 0) {
    routeDots.forEach(d => trackerMap.removeLayer(d));
    routeDots = [];
  }

  // Map coordinate pairs [lng, lat] to Leaflet latlng arrays [lat, lng]
  const primaryLatLngs = routeCoords.map(c => [c[1], c[0]]);
  const altLatLngs = altCoords.map(c => [c[1], c[0]]);

  // Fetch 100% real building/road names in real-time from satellite geocoding database!
  const names = await fetchRealRouteNames(primaryLatLngs, mech.name);

  // 1. Draw Alternative Route (Lighter Blue/Grey Route Option)
  altPolyline = L.polyline(altLatLngs, {
    color: '#4da6ff',
    weight: 5,
    opacity: 0.65
  }).addTo(trackerMap);

  // 2. Draw Primary Route (Solid Royal Blue Line)
  primaryPolyline = L.polyline(primaryLatLngs, {
    color: '#2a6cf5',
    weight: 5,
    opacity: 0.95
  }).addTo(trackerMap);

  // 3. Draw Closely Spaced Purple Circles/Dots Along the Active Route
  for (let i = 0; i < primaryLatLngs.length; i += 3) {
    const dot = L.circleMarker(primaryLatLngs[i], {
      radius: 4.5,
      fillColor: '#4a0082',
      fillOpacity: 1,
      color: '#ffffff',
      weight: 1.5
    }).addTo(trackerMap);
    routeDots.push(dot);
  }

  // 4. Create Floating Route Info Boxes Directly On Map Canvas via styled Popup overlays
  const primaryMid = primaryLatLngs[Math.floor(primaryLatLngs.length / 2)];
  const altMid = altLatLngs[Math.floor(altLatLngs.length / 2)];

  // Primary Pill (35 min, 2.5 km)
  primaryPillMarker = L.popup({
    closeButton: false,
    autoPan: false,
    offset: [0, -10]
  })
  .setLatLng(primaryMid)
  .setContent(`<div class="map-route-pill"> 35 min<span style="font-size:9px;color:#888;display:block;margin-top:2px;">2.5 km</span></div>`)
  .addTo(trackerMap);

  // Alternative Pill (37 min, 2.7 km)
  altPillMarker = L.popup({
    closeButton: false,
    autoPan: false,
    offset: [0, -10]
  })
  .setLatLng(altMid)
  .setContent(`<div class="map-route-pill alt"> 37 min<span style="font-size:9px;color:#888;display:block;margin-top:2px;">2.7 km</span></div>`)
  .addTo(trackerMap);

  // 5. White Circle Starting Point (User's Breakdown Location)
  startMarker = L.circleMarker(primaryLatLngs[0], {
    radius: 7,
    fillColor: '#ffffff',
    fillOpacity: 1,
    color: '#8e8e93',
    weight: 3
  }).addTo(trackerMap);

  // 6. Draw Fixed Mechanic Workshop Marker at the destination
  const mechIcon = L.divIcon({
    className: 'mech-pulse-marker',
    html: `<div class="mech-dot" style="font-size:32px; filter:drop-shadow(0 2px 10px rgba(255,159,10,0.6)); animation: floatPin 2s ease-in-out infinite;"></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
  
  mechMarker = L.marker(primaryLatLngs[primaryLatLngs.length - 1], { icon: mechIcon }).addTo(trackerMap);

  // 7. Draw User's glowing navigation pulse marker starting at the pickup point
  const userPulseIcon = L.divIcon({
    className: 'user-pulse-marker',
    html: '<div class="pulse-ring" style="border-color: #2a6cf5;"></div><div class="pulse-dot" style="background: #2a6cf5; box-shadow: 0 0 10px #2a6cf5;"></div>',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
  
  userMarker = L.marker(primaryLatLngs[0], { icon: userPulseIcon }).addTo(trackerMap);

  // Fit boundaries initially to show the whole route
  const bounds = L.latLngBounds([...primaryLatLngs, ...altLatLngs]);
  trackerMap.fitBounds(bounds, { padding: [40, 40] });

  // Navigation voice-over instructions using 100% REAL street and building names fetched from satellite database!
  const voiceDirections = [
    { step: 0, icon: '', instruction: `Starting near ${names.start}`, voice: `GPS navigation started. Your ride is starting near ${names.start} and is en route to ${mech.name}'s workshop.` },
    { step: 10, icon: '', instruction: `In 300m, turn left towards ${names.turn1}`, voice: `In 300 meters, turn left towards ${names.turn1}.` },
    { step: 18, icon: '', instruction: `Turn left onto ${names.turn1}`, voice: `Turn left onto ${names.turn1}.` },
    { step: 28, icon: '', instruction: `Continue straight towards ${names.turn2}`, voice: `Continue straight towards ${names.turn2}.` },
    { step: 38, icon: '', instruction: `In 200m, turn right towards ${names.end}`, voice: `In 200 meters, turn right towards ${names.end}.` },
    { step: 44, icon: '', instruction: 'Turn right to stay on route', voice: 'Turn right to stay on route.' },
    { step: 48, icon: '', instruction: `Approaching ${names.end}`, voice: `Approaching ${names.end} on the right.` },
    { step: 50, icon: '', instruction: 'You have arrived!', voice: `Arrived! You have reached ${mech.name}'s workshop at ${names.end}. You can now meet your mechanic.` }
  ];

  // Set stepper fill initially
  const stepperProgress = document.querySelector('.stepper-progress-fill');
  const stepperSteps = document.querySelectorAll('.stepper-step');
  
  if (stepperProgress) stepperProgress.style.width = '50%';
  if (stepperSteps[2]) {
    stepperSteps[2].classList.remove('active');
    stepperSteps[2].innerHTML = '<div class="step-dot"></div><span class="step-label">Arrival</span>';
  }

  let currentStep = 0;
  const totalSteps = primaryLatLngs.length - 1;

  speakDirection(voiceDirections[0].voice);
  
  // Animation driving loop
  simulationInterval = setInterval(() => {
    currentStep++;
    if (currentStep > totalSteps) {
      clearInterval(simulationInterval);
      simulationInterval = null;
      
      // Update Stepper to completed arrival state
      if (stepperProgress) stepperProgress.style.width = '100%';
      if (stepperSteps[1]) {
        stepperSteps[1].classList.remove('pulsing');
        stepperSteps[1].innerHTML = '<div class="step-dot"></div><span class="step-label">En Route</span>';
      }
      if (stepperSteps[2]) {
        stepperSteps[2].classList.add('active');
        stepperSteps[2].innerHTML = '<div class="step-dot"></div><span class="step-label">Arrival</span>';
      }
      return;
    }

    const currentCoords = primaryLatLngs[currentStep];
    userMarker.setLatLng(currentCoords);
    
    // Smooth camera trailing - keep the user centered
    trackerMap.panTo(currentCoords);

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
      stepperProgress.style.width = (50 + (percentDone * 50)) + '%';
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

      speakDirection(dirInfo.voice);
    }
  }, 600); // 600ms updates for incredibly fluid visual transitions
}

function closeMap() {
  document.getElementById('mapModal').style.display = 'none';
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (simulationInterval !== null) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  // Clear floating markers and shapes from Leaflet
  if (trackerMap) {
    if (primaryPolyline) { trackerMap.removeLayer(primaryPolyline); primaryPolyline = null; }
    if (altPolyline) { trackerMap.removeLayer(altPolyline); altPolyline = null; }
    if (startMarker) { trackerMap.removeLayer(startMarker); startMarker = null; }
    if (userMarker) { trackerMap.removeLayer(userMarker); userMarker = null; }
    if (mechMarker) { trackerMap.removeLayer(mechMarker); mechMarker = null; }
    if (primaryPillMarker) { trackerMap.removeLayer(primaryPillMarker); primaryPillMarker = null; }
    if (altPillMarker) { trackerMap.removeLayer(altPillMarker); altPillMarker = null; }
    if (routeDots && routeDots.length > 0) {
      routeDots.forEach(d => trackerMap.removeLayer(d));
      routeDots = [];
    }
  }
  
  // Immediately silence the speech synthesizer on modal close
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('active');
}

window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  document.getElementById('scrollProgress').style.width = scrolled + '%';
});

// ---- INIT ----
initLocation();
renderMechs(getMechs());
