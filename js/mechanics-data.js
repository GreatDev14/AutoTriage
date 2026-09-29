let ALL_MECHANICS = [];

try {
  const stored = localStorage.getItem('autoTriage_mechanics');
  if (stored) {
    const parsed = JSON.parse(stored);
    // Purge all previously stored fake/mock/seed names
    const mockNames = [
      'Alex Miller', 'Marco Rossi', 'Chen Wei', 'Sarah Jenkins', 'Yuki Tanaka',
      'Lucas Silva', 'Hans Schmidt', 'Elena Petrova', 'Chloe Dubois', 'Liam O\'Connor',
      'Sanjay Gupta', 'Isabella Rossi', 'Effurun Rapid Auto Care', 'Elite Car Electronics',
      'Downtown Garage Services', 'Apex Engine Diagnostics', 'Delta Auto Clinic', 'Warri Fast Repairs',
      'Mandilas Motors', 'Fixit45 Autocenter', 'AutoFast Service Center', 'Metropolitan Motors',
      'Carparts Nigeria Service Hub', 'Kwikfix Modern Mechanics', 'Auto Perfection', 'Emmy Auto Engineering Services',
      'Emmy Auto Engineering', 'FSO Nigeria Ltd', 'Onground Autocare Center', 'AutoFix Apo', 'Smart Dadiel Auto Home'
    ];
    ALL_MECHANICS = parsed.filter(m => m && m.name && m.phone && !mockNames.includes(m.name));
    localStorage.setItem('autoTriage_mechanics', JSON.stringify(ALL_MECHANICS));
  } else {
    localStorage.setItem('autoTriage_mechanics', JSON.stringify(ALL_MECHANICS));
  }
} catch (e) {}

function getMechanicsByCity(city) {
  return ALL_MECHANICS.filter(m => m.city && m.city.toLowerCase() === city.toLowerCase());
}

function getAllMechanics() { return ALL_MECHANICS; }

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

const TOMTOM_API_KEY = "z2DK7IlIl3LGpl2yewZ6upcpFHF9koqY";

async function fetchRealMechanics(lat, lng, city) {
  let realMechs = [];

  // ENGINE 1: TOMTOM SEARCH API (No CORS proxy required)
  try {
    if (TOMTOM_API_KEY && TOMTOM_API_KEY !== "YOUR_TOMTOM_API_KEY_HERE") {
      const url = `https://api.tomtom.com/search/2/categorySearch/car%20repair.json?key=${TOMTOM_API_KEY}&lat=${lat}&lon=${lng}&radius=25000&limit=50`;
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          realMechs = data.results.map((p, idx) => {
            const distKm = p.dist ? (p.dist / 1000).toFixed(1) : 'Unknown ';
            const pName = p.poi ? p.poi.name : 'Unknown Mechanic';
            const isTyre = pName.toLowerCase().includes('tire') || pName.toLowerCase().includes('wheel');
            const isBrake = pName.toLowerCase().includes('brake');
            const isElec = pName.toLowerCase().includes('electric');
            const spec = isTyre ? 'Tire Specialist' : (isBrake ? 'Brake Specialist' : (isElec ? 'Auto Electrician' : 'General Mechanic'));
            
            const rawPhone = (p.poi && p.poi.phone) ? p.poi.phone : 'Unlisted - Walk-in';
            const cleanWa = rawPhone.includes('Unlisted') ? '' : rawPhone.replace(/\D/g, '');
            
            return {
              id: 'real_tt_' + p.id,
              name: pName,
              spec: spec,
              area: (p.address && p.address.freeformAddress) ? p.address.freeformAddress : city,
              distance: distKm + ' km',
              phone: rawPhone,
              wa: cleanWa,
              rating: '0.0',
              jobs: 0,
              verified: !!(p.poi && p.poi.phone),
              avail: (idx % 4 === 0) ? 'busy' : 'open',
              emoji: ['👨🏾‍🔧','👩🏾‍🔧','👨🏽‍🔧','👩🏽‍🔧'][idx % 4],
              yrs: Math.floor(Math.random() * 15) + 3,
              city: city,
              lat: p.position ? p.position.lat : lat,
              lng: p.position ? p.position.lon : lng,
              isScanned: true,
              isPlatformUser: false
            };
          });
          
          console.log("TomTom Engine Success!");
          ALL_MECHANICS = realMechs;
          try { localStorage.setItem('autoTriage_mechanics', JSON.stringify(ALL_MECHANICS)); } catch (e) {}
          return realMechs;
        }
      } else {
        console.warn(`TomTom rejected key (Status ${res.status}). Falling back to OpenStreetMap.`);
      }
    }
  } catch (e) {
    console.warn("TomTom Engine Failed:", e);
  }

  // OpenStreetMap Fallback has been removed per user request.

  // Final save of whatever we found
  ALL_MECHANICS = realMechs;
  try { localStorage.setItem('autoTriage_mechanics', JSON.stringify(ALL_MECHANICS)); } catch (e) {}
  
  return realMechs.length > 0;
}

function addMechanic(mech) {
  mech.id = ALL_MECHANICS.length ? Math.max(...ALL_MECHANICS.map(m => m.id || 0)) + 1 : 1;
  ALL_MECHANICS.unshift(mech);
  try {
    localStorage.setItem('autoTriage_mechanics', JSON.stringify(ALL_MECHANICS));
  } catch (e) {}
  return mech;
}