const LocationModule = (() => {
  let loc = { latitude:0, longitude:0, city:'Detecting...', state:'Location', address:'' };
  const badge = document.getElementById('location-indicator');

  function updateBadge() {
    if (badge) {
      badge.textContent = `📍 ${loc.city}, ${loc.state}`;
      badge.classList.add('detected');
    }
    const desktopBadge = document.getElementById('desktop-location-badge');
    if (desktopBadge) {
      const textSpan = desktopBadge.querySelector('span:last-child');
      if (textSpan) {
        textSpan.textContent = `📍 ${loc.city}, ${loc.state}`;
      }
    }
  }

  async function reverseGeocode(lat, lng) {
    loc.latitude = lat;
    loc.longitude = lng;
    if (window.fetchRealMechanics) {
      await fetchRealMechanics(lat, lng, loc.city === 'Detecting...' ? 'Your City' : loc.city);
      if (window.MechanicsModule) {
        MechanicsModule.filterByCity(loc.city === 'Detecting...' ? 'Your City' : loc.city);
      }
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data.address) {
        loc.address = data.display_name || loc.address;
        loc.city    = data.address.city || data.address.town || data.address.village || 'Your City';
        loc.state   = data.address.state || loc.state;
      } else {
        if (loc.city === 'Detecting...') loc.city = 'Your City';
      }
    } catch(e) {
      if (loc.city === 'Detecting...') loc.city = 'Your City';
    }
    
    updateBadge();
    if (window.app) app.onLocationUpdate(loc);

    if (window.fetchRealMechanics) {
      const added = await fetchRealMechanics(lat, lng, loc.city);
      if (added && window.MechanicsModule) {
        MechanicsModule.filterByCity(loc.city);
      }
    }
  }

  function init() {
    if (!navigator.geolocation) {
      loc.latitude = 6.5244; loc.longitude = 3.3792; loc.city = 'Lagos'; loc.state = 'Nigeria';
      reverseGeocode(6.5244, 3.3792);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        loc.latitude  = pos.coords.latitude;
        loc.longitude = pos.coords.longitude;
        reverseGeocode(loc.latitude, loc.longitude);
      },
      () => {
        loc.latitude = 6.5244; loc.longitude = 3.3792; loc.city = 'Lagos'; loc.state = 'Nigeria';
        reverseGeocode(6.5244, 3.3792);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
    navigator.geolocation.watchPosition(
      pos => { loc.latitude = pos.coords.latitude; loc.longitude = pos.coords.longitude; reverseGeocode(loc.latitude, loc.longitude); },
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  return {
    init,
    getLocation: () => ({ ...loc }),
    setCity: city => { loc.city = city; updateBadge(); },
    reverseGeocode
  };
})();