const RidesModule = (() => {
  const SAMPLE_RIDERS = [
    { id:1, name:'John D.',         vehicle:'Toyota Corolla 2022 · Silver',plate:'XYZ 123',      rating:4.92, trips:1240,baseEta:5,  price:'$10',    via:'Uber',        emoji:'👨🏻', phone:'+1234567890' },
    { id:2, name:'Maria G.',        vehicle:'Honda Accord 2019 · White', plate:'ABC 789',      rating:4.87, trips:521, baseEta:7,  price:'$12',    via:'Lyft',        emoji:'👩🏼', phone:'+1234567891' },
    { id:3, name:'David K.',        vehicle:'Tesla Model 3 2023 · Blue',  plate:'EV 555',      rating:4.98, trips:89,  baseEta:3,  price:'$15',    via:'Uber',        emoji:'👨🏽', phone:'+1234567892' },
    { id:4, name:'Sarah W.',        vehicle:'Hyundai Elantra 2022 · Gray',plate:'WXY 456',      rating:4.91, trips:632, baseEta:12, price:'$11',    via:'Lyft',        emoji:'👩🏿', phone:'+1234567893' },
  ];

  function getRiders() {
    return SAMPLE_RIDERS.map(r => ({ ...r, eta: r.baseEta + Math.floor(Math.random() * 3) })).sort((a,b) => a.eta - b.eta);
  }

  window.bookRide = function(btn, via) {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = 'Redirecting...';
    btn.style.background = '#e0e0d8';
    
    // Get actual location
    const coords = window.LocationModule ? window.LocationModule.getLocation() : { latitude: 0, longitude: 0 };
    const dest = document.getElementById('rideDestInput') ? document.getElementById('rideDestInput').value : '';
    
    setTimeout(() => {
      btn.textContent = 'Opening App...';
      btn.style.background = 'var(--green)';
      btn.style.color = '#000';
      
      let link = '';
      if (via.toLowerCase() === 'uber') {
        link = `https://m.uber.com/ul/?client_id=&action=setPickup&pickup[latitude]=${coords.latitude}&pickup[longitude]=${coords.longitude}&dropoff[formatted_address]=${encodeURIComponent(dest)}`;
      } else if (via.toLowerCase() === 'lyft') {
        link = `https://lyft.com/ride?id=lyft&pickup[latitude]=${coords.latitude}&pickup[longitude]=${coords.longitude}&destination[address]=${encodeURIComponent(dest)}`;
      } else {
        link = 'https://m.uber.com/ul/';
      }
      
      window.open(link, '_blank');
      
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '<span>Book Ride</span>';
        btn.style.background = '';
        btn.style.color = '';
      }, 3000);
    }, 800);
  };

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

  function render(riders) {
    const el = document.getElementById('rideResults');
    if (!el) return;
    el.innerHTML = `<p style="font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--gray);margin-bottom:14px;">Real-Time GPS Connected Services</p>` +
      riders.map((r, i) => `
        <div class="ride-card" style="animation-delay:${i * 0.12}s">
          <div class="r-avatar">${escapeHTML(r.emoji)}</div>
          <div class="r-info">
            <div class="r-name">${escapeHTML(r.name)}</div>
            <div class="r-det">${escapeHTML(r.vehicle)}</div>
            <div class="r-det">⭐ ${escapeHTML(r.rating.toString())} (${escapeHTML(r.trips.toString())} trips)</div>
            <div class="r-plate">${escapeHTML(r.plate)}</div>
          </div>
          <div class="r-right" style="display:flex; flex-direction:column; align-items:flex-end;">
            <div class="r-eta-n">${escapeHTML(r.eta.toString())}</div>
            <div class="r-eta-l">min away</div>
            <div class="r-price">${escapeHTML(r.price)}</div>
            <div class="r-via">${escapeHTML(r.via)}</div>
            <button class="btn-p" style="margin-top:8px; padding:6px 12px; font-size:9px;" onclick="bookRide(this, '${escapeHTML(r.via)}')"><span>Dispatch ${escapeHTML(r.via)}</span></button>
          </div>
        </div>
      `).join('');
    el.classList.add('on');
  }

  return { getRiders, render };
})();