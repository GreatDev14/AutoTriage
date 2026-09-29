const PartsDB = {
  "Brake Pads": {
    desc: "Premium ceramic brake pads for high stopping power, low dust, and quiet performance.",
    category: "brakes",
    pricing: { "Car": { price: 35, oem: 75 }, "SUV": { price: 45, oem: 95 }, "Truck": { price: 55, oem: 120 }, "Motorcycle": { price: 20, oem: 45 } }
  },
  "Brake Rotors": {
    desc: "Double-disc vented brake rotors with anti-rust coating and cross-drilled thermal dissipation.",
    category: "brakes",
    pricing: { "Car": { price: 65, oem: 135 }, "SUV": { price: 85, oem: 175 }, "Truck": { price: 115, oem: 240 }, "Motorcycle": { price: 40, oem: 85 } }
  },
  "Brake Fluid (1L DOT4)": {
    desc: "Premium high boiling point DOT4 brake fluid for consistent hydraulic braking responsiveness.",
    category: "brakes",
    pricing: { "Car": { price: 10, oem: 18 }, "SUV": { price: 12, oem: 22 }, "Truck": { price: 15, oem: 28 }, "Motorcycle": { price: 8, oem: 15 } }
  },
  "Spark Plugs (Set)": {
    desc: "Laser iridium spark plugs set for stable combustion and long-term firing reliability.",
    category: "electrical",
    pricing: { "Car": { price: 25, oem: 50 }, "SUV": { price: 35, oem: 70 }, "Truck": { price: 50, oem: 95 }, "Motorcycle": { price: 15, oem: 32 } }
  },
  "Battery": {
    desc: "Heavy-duty 12V AGM battery with high cold cranking amps (CCA) and leak-proof seal.",
    category: "electrical",
    pricing: { "Car": { price: 85, oem: 145 }, "SUV": { price: 110, oem: 175 }, "Truck": { price: 140, oem: 220 }, "Motorcycle": { price: 45, oem: 85 } }
  },
  "Alternator": {
    desc: "Flow-optimized high-efficiency charging alternator for stable on-board system voltage.",
    category: "electrical",
    pricing: { "Car": { price: 135, oem: 260 }, "SUV": { price: 165, oem: 310 }, "Truck": { price: 210, oem: 390 }, "Motorcycle": { price: 85, oem: 160 } }
  },
  "Starter Motor": {
    desc: "Engine starter motor with optimized gear reduction ratio and high torque output.",
    category: "electrical",
    pricing: { "Car": { price: 95, oem: 190 }, "SUV": { price: 125, oem: 240 }, "Truck": { price: 160, oem: 295 }, "Motorcycle": { price: 65, oem: 130 } }
  },
  "Water Pump": {
    desc: "Precision engine coolant water pump for high flow rates and reliable temperature regulation.",
    category: "cooling",
    pricing: { "Car": { price: 45, oem: 115 }, "SUV": { price: 65, oem: 145 }, "Truck": { price: 85, oem: 185 }, "Motorcycle": { price: 35, oem: 75 } }
  },
  "Fuel Pump": {
    desc: "In-tank electric fuel pump assembly with integrated fuel sender and high-pressure flow.",
    category: "engine",
    pricing: { "Car": { price: 110, oem: 230 }, "SUV": { price: 145, oem: 290 }, "Truck": { price: 185, oem: 360 }, "Motorcycle": { price: 55, oem: 120 } }
  },
  "Timing Belt Kit": {
    desc: "Timing belt replacement kit including heavy-duty belt, pulley, and hydraulic tensioner.",
    category: "engine",
    pricing: { "Car": { price: 85, oem: 185 }, "SUV": { price: 115, oem: 230 }, "Truck": { price: 145, oem: 290 }, "Motorcycle": { price: 45, oem: 95 } }
  },
  "Radiator": {
    desc: "Double-row aluminum core radiator with premium polymer tanks for rapid heat exchange.",
    category: "cooling",
    pricing: { "Car": { price: 75, oem: 175 }, "SUV": { price: 105, oem: 225 }, "Truck": { price: 145, oem: 310 }, "Motorcycle": { price: 55, oem: 120 } }
  },
  "Wheel Bearing": {
    desc: "Double-row wheel bearing assembly pre-packed with waterproof grease.",
    category: "suspension",
    pricing: { "Car": { price: 45, oem: 110 }, "SUV": { price: 65, oem: 145 }, "Truck": { price: 95, oem: 195 }, "Motorcycle": { price: 25, oem: 55 } }
  },
  "Headlight Bulb (LED)": {
    desc: "High-power 6000K daylight white LED headlight replacement bulbs.",
    category: "electrical",
    pricing: { "Car": { price: 24, oem: 55 }, "SUV": { price: 28, oem: 65 }, "Truck": { price: 35, oem: 80 }, "Motorcycle": { price: 15, oem: 35 } }
  },
  "Windshield Wipers": {
    desc: "Double-life flex silicone wiper blades for streak-free all-weather performance.",
    category: "electrical",
    pricing: { "Car": { price: 16, oem: 38 }, "SUV": { price: 22, oem: 45 }, "Truck": { price: 26, oem: 52 }, "Motorcycle": { price: 10, oem: 20 } }
  },
  "Air Filter": {
    desc: "Optimized pleated cotton engine air intake filter for high flow and filtration.",
    category: "engine",
    pricing: { "Car": { price: 12, oem: 28 }, "SUV": { price: 16, oem: 35 }, "Truck": { price: 22, oem: 45 }, "Motorcycle": { price: 10, oem: 22 } }
  },
  "Cabin Filter": {
    desc: "Multilayer active carbon cabin filter for chemical and particulate filtration.",
    category: "cooling",
    pricing: { "Car": { price: 12, oem: 26 }, "SUV": { price: 15, oem: 32 }, "Truck": { price: 18, oem: 38 }, "Motorcycle": { price: 8, oem: 18 } }
  },
  "Tyres (Set of 4 All-Season)": {
    desc: "Set of 4 high-traction, low rolling resistance all-season tyres for superior driving stability.",
    category: "tyres",
    pricing: { "Car": { price: 220, oem: 420 }, "SUV": { price: 320, oem: 580 }, "Truck": { price: 420, oem: 760 }, "Motorcycle": { price: 110, oem: 210 } }
  },
  "Tyre (Single All-Season)": {
    desc: "Single replacement all-season tyre with deep tread pattern for wet and dry conditions.",
    category: "tyres",
    pricing: { "Car": { price: 55, oem: 110 }, "SUV": { price: 80, oem: 150 }, "Truck": { price: 110, oem: 195 }, "Motorcycle": { price: 30, oem: 60 } }
  },
  "Engine Oil (5L Synthetic 5W-30)": {
    desc: "Premium grade full synthetic motor oil. Prevents engine sludge and wear.",
    category: "engine",
    pricing: { "Car": { price: 26, oem: 45 }, "SUV": { price: 32, oem: 55 }, "Truck": { price: 38, oem: 65 }, "Motorcycle": { price: 18, oem: 30 } }
  },
  "Oil Filter": {
    desc: "Spin-on engine oil filter with high filtration capabilities to keep engine oil clean.",
    category: "engine",
    pricing: { "Car": { price: 7, oem: 15 }, "SUV": { price: 9, oem: 18 }, "Truck": { price: 12, oem: 24 }, "Motorcycle": { price: 6, oem: 12 } }
  },
  "Shock Absorbers (Front Pair)": {
    desc: "Pair of front nitrogen gas-charged shock absorber struts for smooth vehicle handling.",
    category: "suspension",
    pricing: { "Car": { price: 90, oem: 180 }, "SUV": { price: 120, oem: 230 }, "Truck": { price: 160, oem: 290 }, "Motorcycle": { price: 60, oem: 110 } }
  },
  "Drive Belt (Serpentine)": {
    desc: "Heavy duty accessory serpentine drive belt for alternator, AC, and water pump pulley.",
    category: "engine",
    pricing: { "Car": { price: 18, oem: 38 }, "SUV": { price: 24, oem: 48 }, "Truck": { price: 32, oem: 60 }, "Motorcycle": { price: 12, oem: 25 } }
  }
};

const LocalShopsRegistry = {
  "NG": {
    "warri": [
      { name: 'Mechanic Village', dist: 'Warri - Sapele Rd', url: 'https://maps.google.com/?q=Mechanic+Village+Effurun+Delta' },
      { name: 'Toyota & Honda Mechanic', dist: 'Bendel Estate', url: 'https://maps.google.com/?q=Bendel+Estate+Ibori+road+Delta' },
      { name: 'Forte Oil Auto Repair', dist: 'Refinery Road', url: 'https://maps.google.com/?q=Forte+Oil+Refinery+Road+Warri' },
      { name: 'Omatseprice Auto Clinic', dist: '82 Hospital Rd', url: 'https://maps.google.com/?q=Omatseprice+Auto+Clinic+Ekpan+Warri' }
    ],
    "lagos": [
      { name: "Ladipo Spare Parts Market", dist: "Mushin, Lagos", url: "https://maps.google.com/?q=Ladipo+Market+Mushin+Lagos" },
      { name: "Gbagada Auto Clinic", dist: "Gbagada Phase 2, Lagos", url: "https://maps.google.com/?q=Gbagada+Auto+Clinic+Lagos" },
      { name: "Ikeja Auto Hub", dist: "Allen Avenue, Ikeja", url: "https://maps.google.com/?q=Allen+Avenue+Ikeja+Lagos" },
      { name: "Lekki Auto Service", dist: "Admiralty Way, Lekki", url: "https://maps.google.com/?q=Lekki+Auto+Service+Center+Lagos" }
    ],
    "port harcourt": [
      { name: "Ikoku Spare Parts Market", dist: "Ikoku, Port Harcourt", url: "https://maps.google.com/?q=Ikoku+Market+Port+Harcourt" },
      { name: "Garrison Auto Repairs", dist: "Aba Road, PH", url: "https://maps.google.com/?q=Garrison+Aba+Road+Port+Harcourt" },
      { name: "Trans-Amadi Mechanic Hub", dist: "Trans-Amadi, PH", url: "https://maps.google.com/?q=Trans-Amadi+Port+Harcourt" }
    ],
    "default": [
      { name: "Jumia Delivery Hub", dist: "Local Shipping Available", url: "https://www.jumia.com.ng" },
      { name: "Jiji Verified Local Seller", dist: "In-City Pickup", url: "https://jiji.ng" }
    ]
  },
  "US": {
    "new york": [
      { name: "AutoZone Auto Parts", dist: "Queens Blvd, Queens, NY", url: "https://maps.google.com/?q=AutoZone+Queens+Blvd+NY" },
      { name: "NAPA Auto Parts", dist: "11th Ave, Manhattan, NY", url: "https://maps.google.com/?q=NAPA+Auto+Parts+Manhattan+NY" },
      { name: "Pep Boys parts", dist: "Fourth Ave, Brooklyn, NY", url: "https://maps.google.com/?q=Pep+Boys+Brooklyn+NY" }
    ],
    "california": [
      { name: "O'Reilly Auto Parts", dist: "Sunset Blvd, Los Angeles", url: "https://maps.google.com/?q=O'Reilly+Sunset+Blvd+LA" },
      { name: "AutoZone Auto Parts", dist: "Van Ness Ave, San Francisco", url: "https://maps.google.com/?q=AutoZone+Van+Ness+San+Francisco" }
    ],
    "default": [
      { name: "AutoZone Auto Parts", dist: "Find Nearest Store", url: "https://www.autozone.com" },
      { name: "NAPA Auto Parts", dist: "Find Nearest Store", url: "https://www.napaonline.com" },
      { name: "Advance Auto Parts", dist: "Find Nearest Store", url: "https://www.advanceautoparts.com" }
    ]
  },
  "GB": {
    "default": [
      { name: "Euro Car Parts", dist: "Nearest UK Branch", url: "https://www.eurocarparts.com" },
      { name: "Halfords Auto Center", dist: "Nearest UK Center", url: "https://www.halfords.com" },
      { name: "GSF Car Parts", dist: "Nearest UK Store", url: "https://www.gsfcarparts.com" }
    ]
  },
  "CA": {
    "default": [
      { name: "Canadian Tire", dist: "Nearest CA Retailer", url: "https://www.canadiantire.ca" },
      { name: "PartSource Auto Parts", dist: "Nearest CA Center", url: "https://www.partsource.ca" },
      { name: "NAPA Auto Parts CA", dist: "Nearest CA Store", url: "https://www.napacanada.com" }
    ]
  },
  "DE": {
    "default": [
      { name: "A.T.U Auto Teile Unger", dist: "Filiale in der Nähe", url: "https://www.atu.de" },
      { name: "Autodoc DE Center", dist: "Online-Bestellung", url: "https://www.autodoc.de" }
    ]
  },
  "default": {
    "default": [
      { name: "RockAuto Parts", dist: "International Shipping", url: "https://www.rockauto.com" },
      { name: "eBay Motors", dist: "Worldwide Delivery", url: "https://www.ebay.com/motors" },
      { name: "Amazon Automotive", dist: "Prime Global Shipping", url: "https://www.amazon.com" }
    ]
  }
};

function getLocalShops(country, city, state) {
  const countryKey = (country || 'US').toUpperCase();
  const cClean = (city || '').toLowerCase().trim();
  const sClean = (state || '').toLowerCase().trim();
  
  const countryData = LocalShopsRegistry[countryKey] || LocalShopsRegistry["default"];
  
  // Try city or state match
  for (const regionKey in countryData) {
    if (regionKey !== 'default' && (cClean.includes(regionKey) || regionKey.includes(cClean) || sClean.includes(regionKey) || regionKey.includes(sClean))) {
      return countryData[regionKey];
    }
  }
  
  // Fallback to default of that country
  if (countryData.default) {
    return countryData.default;
  }
  
  // Fallback to global default
  return LocalShopsRegistry["default"]["default"];
}

/**
 * Searches auto parts dynamically via client-side robust fallback.
 */
async function searchParts(query, make, model, year, vtype) {
  const q = (query || '').toLowerCase().trim();
  let vMake = make || '';
  let vModel = model || '';
  let vYear = year || '';
  let vt = vtype || 'Car';

  // If vehicle parameters are empty, resolve from active vehicle profile or localStorage
  if (!vMake) {
    let saved = null;
    if (window._currentVehicle && window._currentVehicle.make) {
      saved = window._currentVehicle;
    } else if (typeof myVehicle !== 'undefined' && myVehicle && myVehicle.make) {
      saved = myVehicle;
    } else if (window.app && window.app.vehicle && window.app.vehicle.make) {
      saved = window.app.vehicle;
    } else {
      try {
        const raw = localStorage.getItem('myVehicle') || localStorage.getItem('desktopVehicle') || localStorage.getItem('mobileVehicle');
        if (raw) saved = JSON.parse(raw);
      } catch(e) {}
    }
    if (saved && saved.make) {
      vMake = saved.make;
      vModel = saved.model || '';
      vYear = saved.year || '';
      vt = saved.vtype || vt || 'Car';
    }
  }

  const fallbackResults = [];
  
  let country = 'US';
  let city = '';
  let state = '';
  
  if (window.GlobalContext && window.GlobalContext.isInitialized) {
    country = (window.GlobalContext.country || 'US').toUpperCase();
    city = window.GlobalContext.city || '';
    state = window.GlobalContext.state || '';
  }

  // =========================================================================
  // 💸 AFFILIATE TRACKING CONFIGURATION
  // =========================================================================
  const customEbayCampid = localStorage.getItem('at_ebay_campid') || '5339045678';
  const customAmazonTag = localStorage.getItem('at_amazon_tag') || (country === 'GB' ? 'autotriage-21' : country === 'CA' ? 'autotriageca-20' : country === 'DE' ? 'autotriagede-21' : 'autotriage-20');
  const customJumiaKol = localStorage.getItem('at_jumia_kol') || 'YOUR_JUMIA_ID_HERE';
  // =========================================================================

  for (const partName in PartsDB) {
    const part = PartsDB[partName];
    let matches = partName.toLowerCase().includes(q) || q === '';
    
    // Check if the query is a category name or matches category
    if (!matches) {
      if (part.category === q) {
        matches = true;
      }
    }

    if (matches) {
      const pricing = (part.pricing && part.pricing[vt]) ? part.pricing[vt] : (part.pricing ? (part.pricing['Car'] || part.pricing[Object.keys(part.pricing)[0]]) : { price: 45, oem: 95 });
      if (pricing && pricing.price > 0) {
        let displayPrice = `$${pricing.price}`;
        let displayOem = `$${pricing.oem}`;
        
        if (window.GlobalContext && window.GlobalContext.isInitialized && typeof window.GlobalContext.formatCurrency === 'function') {
          try {
            displayPrice = window.GlobalContext.formatCurrency(pricing.price);
            displayOem = window.GlobalContext.formatCurrency(pricing.oem);
          } catch (e) {
            displayPrice = '$' + pricing.price;
            displayOem = '$' + pricing.oem;
          }
        }
        
        const vehicleTitle = vMake ? `${vYear} ${vMake} ${vModel}`.trim() : '';
        const searchTerms = (vehicleTitle ? `${vehicleTitle} ` : '') + partName;
        let checkoutUrl = '';
        let alternativeUrl = '';
        
        if (country === 'NG') {
          // Nigeria: Jumia search + Jiji alternative
          checkoutUrl = `https://www.jumia.com.ng/catalog/?q=${encodeURIComponent(searchTerms)}&utm_source=${customJumiaKol}&utm_medium=affiliate&utm_campaign=autotriage&utm_term=partlink`;
          alternativeUrl = `https://jiji.ng/search?query=${encodeURIComponent(searchTerms)}&utm_source=autotriage`;
        } else if (country === 'GB') {
          // UK: eBay UK + Amazon UK
          checkoutUrl = `https://www.ebay.co.uk/sch/i.html?_nkw=${encodeURIComponent(searchTerms)}&mkcid=1&mkrid=710-53481-19255-0&siteid=3&campid=${customEbayCampid}&customid=autotriage`;
          alternativeUrl = `https://www.amazon.co.uk/s?k=${encodeURIComponent(searchTerms)}&tag=${customAmazonTag}`;
        } else if (country === 'CA') {
          // Canada: eBay CA + Amazon CA
          checkoutUrl = `https://www.ebay.ca/sch/i.html?_nkw=${encodeURIComponent(searchTerms)}&mkcid=1&mkrid=706-53473-19255-0&siteid=2&campid=${customEbayCampid}&customid=autotriage`;
          alternativeUrl = `https://www.amazon.ca/s?k=${encodeURIComponent(searchTerms)}&tag=${customAmazonTag}`;
        } else if (country === 'DE') {
          // Germany/EU: eBay DE + Amazon DE
          checkoutUrl = `https://www.ebay.de/sch/i.html?_nkw=${encodeURIComponent(searchTerms)}&mkcid=1&mkrid=707-53477-19255-0&siteid=77&campid=${customEbayCampid}&customid=autotriage`;
          alternativeUrl = `https://www.amazon.de/s?k=${encodeURIComponent(searchTerms)}&tag=${customAmazonTag}`;
        } else {
          // US / Global: eBay US + Amazon US
          checkoutUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchTerms)}&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=${customEbayCampid}&customid=autotriage`;
          alternativeUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchTerms)}&tag=${customAmazonTag}`;
        }

        fallbackResults.push({
          name: vehicleTitle ? `${vehicleTitle} ${partName}` : partName,
          desc: part.desc,
          category: part.category,
          price: displayPrice,
          oem: displayOem,
          checkoutUrl: checkoutUrl,
          alternativeUrl: alternativeUrl
        });
      }
    }
  }
  
  return {
    success: true,
    carThumbnail: null,
    parts: fallbackResults,
    shops: getLocalShops(country, city, state)
  };
}
