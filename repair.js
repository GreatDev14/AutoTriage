const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// The marker where the first corruption started
const startMarker = `  if (amazon) localStorage.setItem('at_amazon_tag', amazon);`;

// Find the valid middle code that got sandwiched between corruptions
const middleCodeMatch = html.match(/function switchUserRole[\s\S]*?window\.addEventListener\('load', \(\) => \{[\s\S]*?initLocation\(\);\s*\}\);/);
if (!middleCodeMatch) {
  console.log('Could not find middle code!');
  process.exit(1);
}
const middleCode = middleCodeMatch[0];

// The marker where the last corruption ended
const endMarker = `function autoDetect() {`;

// Reconstruct the file cleanly
const cleanHtml = html.substring(0, html.indexOf(startMarker) + startMarker.length) + `
  else localStorage.removeItem('at_amazon_tag');
  
  if (jumia) localStorage.setItem('at_jumia_kol', jumia);
  else localStorage.removeItem('at_jumia_kol');
  
  alert("Partner monetization tags updated successfully!");
  if (typeof searchPart === 'function') {
    searchPart(true);
  }
}

` + middleCode + `

// ---- LOCATION ----
let userCity = 'New York';
let userAddr = 'Detecting location...';
let userLat = null;
let userLng = null;
let isOfflineMode = false;

var _distanceCache = {};
function calculateDistance(lat1, lon1, lat2, lon2) {
  const key = \`\${lat1.toFixed(4)},\${lon1.toFixed(4)}_\${lat2.toFixed(4)},\${lon2.toFixed(4)}\`;
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
    const url = \`https://api.tomtom.com/search/2/categorySearch/car%20repair.json?key=\${TOMTOM_API_KEY}&lat=\${lat}&lon=\${lng}&radius=25000&limit=50\`;
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
          const cleanWa = rawPhone.includes('Unlisted') ? '' : rawPhone.replace(/\\D/g, '');
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
    fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${lat}&lon=\${lng}\`)
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

` + html.substring(html.indexOf(endMarker));

fs.writeFileSync('simple.html', cleanHtml, 'utf8');
console.log('File successfully reconstructed.');

// Run syntax check
const newScripts = cleanHtml.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gm);
newScripts.forEach((s, i) => {
  const js = s.replace(/<script\b[^>]*>/, '').replace(/<\/script>/, '');
  try {
    new Function(js);
  } catch(e) {
    console.log('Syntax error in script ' + i + ': ' + e.message);
  }
});
console.log('Syntax check complete.');
