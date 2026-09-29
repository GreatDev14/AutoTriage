// Global Context & Localization Manager

window.GlobalContext = {
  language: 'en-US',
  timezone: 'UTC',
  country: 'US',
  currency: 'USD',
  latitude: null,
  longitude: null,
  city: null,
  state: null,
  isInitialized: false,

  inferCountryFromTimezone: function() {
    const tz = this.timezone || '';
    if (tz.includes('London') || tz.includes('GMT') || tz.includes('BST')) return 'GB';
    if (tz.includes('Paris') || tz.includes('Berlin') || tz.includes('Rome') || tz.includes('Madrid') || tz.includes('Amsterdam') || tz.includes('Vienna')) return 'DE';
    if (tz.includes('Lagos') || tz.includes('WAT') || tz.includes('West Africa') || tz.includes('Nigeria')) return 'NG';
    if (tz.includes('Johannesburg') || tz.includes('SAST')) return 'ZA';
    if (tz.includes('Sydney') || tz.includes('Melbourne')) return 'AU';
    if (tz.includes('Toronto') || tz.includes('Vancouver')) return 'CA';
    if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('IST')) return 'IN';
    if (tz.includes('Tokyo')) return 'JP';
    if (tz.includes('Shanghai')) return 'CN';
    if (tz.includes('Sao_Paulo')) return 'BR';
    
    // Check by offset (WAT/Lagos WAT is GMT+1, offset is -60)
    const offset = new Date().getTimezoneOffset();
    if (offset === -60) return 'NG'; // WAT / West Africa
    if (offset === 0) return 'GB';   // GMT
    if (offset === -120 || offset === -180) return 'DE'; // Eurozone
    
    return null;
  },

  init: async function() {
    console.log("[Context] Initializing Global Context...");
    
    // Detect Language and Timezone natively
    this.language = navigator.language || 'en-US';
    this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    
    // 1. Prioritize timezone-based country/currency detection (so VPNs don't override WAT/Nigeria local settings!)
    const timezoneCountry = this.inferCountryFromTimezone();
    if (timezoneCountry) {
      this.country = timezoneCountry;
      this.mapCurrencyToCountry();
      console.log("[Context] Local system timezone resolved country to:", this.country, "and currency to:", this.currency);
    }

    // 2. Immediately request precise GPS location synchronously in background to trigger native browser prompt
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          console.log("[Context] GPS Coordinates secured:", pos.coords.latitude, pos.coords.longitude);
          this.latitude = pos.coords.latitude;
          this.longitude = pos.coords.longitude;
          
          // Reverse-geocode to get the actual country & update currency dynamically
          await this.reverseGeocode();
          
          // Dispatch global event for listeners (like simple.html / desktop.js)
          window.dispatchEvent(new CustomEvent('global-location-secured', {
            detail: {
              latitude: this.latitude,
              longitude: this.longitude,
              country: this.country,
              currency: this.currency
            }
          }));
        },
        (err) => {
          console.warn("[Context] GPS access denied or failed:", err);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    }
    
    // 3. Fetch IP-based location concurrently (does not block prompt)
    try {
      const ipRes = await fetch('https://ipapi.co/json/');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        // Only set coordinates if GPS hasn't updated them yet
        if (this.latitude === null) {
          this.latitude = ipData.latitude;
          this.longitude = ipData.longitude;
        }
        
        // If we didn't resolve country from the local system timezone, fall back to IP country
        if (!timezoneCountry) {
          this.country = ipData.country_code || 'US';
          this.currency = ipData.currency || 'USD';
        }
        
        // Load city and state/region
        if (this.city === null) {
          this.city = ipData.city || '';
        }
        if (this.state === null) {
          this.state = ipData.region || '';
        }
      }
    } catch(e) {
      console.warn("[Context] IP Geolocation failed or rate-limited. Relying on timezone/locale.");
      if (!this.country || this.country === 'US') {
        const tzCountry = this.inferCountryFromTimezone();
        if (tzCountry) {
          this.country = tzCountry;
        } else if (this.language.includes('-')) {
          this.country = this.language.split('-')[1].toUpperCase();
        }
        this.mapCurrencyToCountry();
      }
    }

    // Sync simple view global variable if loaded
    if (window.USER_CURRENCY !== undefined) {
      window.USER_CURRENCY = this.currency;
    }

    this.isInitialized = true;
    console.log("[Context] Localization complete:", this.getContextSummary());
    window.dispatchEvent(new CustomEvent('global-context-initialized', {
      detail: this.getContextSummary()
    }));
  },

  reverseGeocode: async function() {
    try {
      // Use Nominatim API for reverse geocoding (rate limited to 1 req/sec)
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${this.latitude}&lon=${this.longitude}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          if (data.address.country_code) {
            this.country = data.address.country_code.toUpperCase();
            this.mapCurrencyToCountry();
          }
          this.city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county || '';
          this.state = data.address.state || '';
          
          // Sync features-simple.js USER_CURRENCY
          if (window.USER_CURRENCY !== undefined) {
            window.USER_CURRENCY = this.currency;
          }
        }
      }
    } catch (e) {
      console.warn("[Context] Reverse geocoding failed.", e);
    }
  },

  mapCurrencyToCountry: function() {
    // Rough mapping of Country to Currency
    const map = {
      'US': 'USD', 'GB': 'GBP', 'CA': 'CAD', 'AU': 'AUD', 
      'IN': 'INR', 'NG': 'NGN', 'ZA': 'ZAR', 'JP': 'JPY',
      'CN': 'CNY', 'BR': 'BRL', 'MX': 'MXN', 'CH': 'CHF'
    };
    
    // Eurozone
    const eurozone = ['FR','DE','IT','ES','PT','NL','BE','AT','IE','FI','GR'];
    if (eurozone.includes(this.country)) {
      this.currency = 'EUR';
    } else if (map[this.country]) {
      this.currency = map[this.country];
    } else {
      this.currency = 'USD'; // fallback
    }
  },

  formatCurrency: function(amountInUSD) {
    // Rough static exchange rates relative to USD
    const rates = {
      'USD': 1.0,
      'EUR': 0.9,
      'GBP': 0.78,
      'CAD': 1.35,
      'AUD': 1.5,
      'INR': 83.0,
      'NGN': 1150.0,
      'ZAR': 19.0,
      'JPY': 150.0,
      'CNY': 7.2,
      'BRL': 5.0,
      'MXN': 17.0,
      'CHF': 0.9
    };
    
    const rate = rates[this.currency] || 1.0;
    const localAmount = amountInUSD * rate;
    
    return new Intl.NumberFormat(this.language, {
      style: 'currency',
      currency: this.currency,
      maximumFractionDigits: 0
    }).format(localAmount);
  },
  
  getContextSummary: function() {
    return {
      language: this.language,
      country: this.country,
      currency: this.currency,
      timezone: this.timezone
    };
  },
  
  findNearbyAutoShops: async function(lat, lng) {
    try {
      // Use OpenStreetMap Overpass API for POI (shop=car_parts)
      const radius = 5000; // 5km
      const query = `
        [out:json];
        (
          node["shop"="car_parts"](around:${radius},${lat},${lng});
          way["shop"="car_parts"](around:${radius},${lat},${lng});
          node["shop"="car_repair"](around:${radius},${lat},${lng});
          way["shop"="car_repair"](around:${radius},${lat},${lng});
        );
        out center;
      `;
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      const data = await response.json();
      
      const shops = data.elements.map(el => {
        const elLat = el.lat || el.center.lat;
        const elLon = el.lon || el.center.lon;
        // Simple haversine distance
        const R = 6371; // km
        const dLat = (elLat - lat) * Math.PI / 180;
        const dLon = (elLon - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(elLat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const dist = (R * c).toFixed(1);
        
        return {
          name: el.tags.name || 'Local Auto Services & Parts',
          distance: dist + ' km',
          address: el.tags['addr:street'] ? `${el.tags['addr:street']}, ${el.tags['addr:city'] || ''}`.replace(/,\s*$/, '') : 'Local Store',
          mapLink: `https://www.google.com/maps/search/?api=1&query=${elLat},${elLon}`
        };
      }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

      // Return top 4 unique shops
      const uniqueShops = [];
      const seenNames = new Set();
      for (const s of shops) {
        if (!seenNames.has(s.name)) {
          seenNames.add(s.name);
          uniqueShops.push(s);
        }
        if (uniqueShops.length >= 4) break;
      }
      return uniqueShops;
    } catch (err) {
      console.error('Error fetching shops:', err);
      return [];
    }
  }
};

// Auto-initialize
window.GlobalContext.init();
