const PartsCatalog = {
  "brake pads": { baseName: "Ceramic Brake Pads (Front & Rear Set)", basePrice: 45, oemPrice: 85, category: "brakes", desc: "Premium ceramic brake pads for high stopping power, low dust, and quiet performance." },
  "brake rotors": { baseName: "Vented Brake Rotors (Pair)", basePrice: 90, oemPrice: 160, category: "brakes", desc: "Double-disc vented brake rotors with anti-rust coating and cross-drilled thermal dissipation." },
  "brake fluid (1l dot4)": { baseName: "Brake Fluid (1L DOT4)", basePrice: 5, oemPrice: 10, category: "brakes", desc: "Premium high boiling point DOT4 brake fluid for consistent hydraulic braking responsiveness." },
  "spark plugs": { baseName: "Laser Iridium Spark Plugs (Set)", basePrice: 35, oemPrice: 70, category: "electrical", desc: "Laser iridium spark plugs set for stable combustion and long-term firing reliability." },
  "battery": { baseName: "AGM Sealed Lead-Acid 12V Battery", basePrice: 110, oemPrice: 190, category: "electrical", desc: "Heavy-duty 12V AGM battery with high cold cranking amps (CCA) and leak-proof seal." },
  "alternator": { baseName: "120A Heavy-Duty Alternator Assembly", basePrice: 180, oemPrice: 290, category: "electrical", desc: "Flow-optimized high-efficiency charging alternator for stable on-board system voltage." },
  "starter motor": { baseName: "High-Torque Engine Starter Motor", basePrice: 110, oemPrice: 180, category: "electrical", desc: "Engine starter motor with optimized gear reduction ratio and high torque output." },
  "water pump": { baseName: "Coolant Water Pump Assembly", basePrice: 65, oemPrice: 120, category: "cooling", desc: "Precision engine coolant water pump for high flow rates and reliable temperature regulation." },
  "fuel pump": { baseName: "Electric Fuel Pump Module Assembly", basePrice: 130, oemPrice: 220, category: "engine", desc: "In-tank electric fuel pump assembly with integrated fuel sender and high-pressure flow." },
  "timing belt kit": { baseName: "Timing Belt & Tensioner Complete Kit", basePrice: 240, oemPrice: 390, category: "engine", desc: "Timing belt replacement kit including heavy-duty belt, pulley, and hydraulic tensioner." },
  "radiator": { baseName: "Aluminum Core Engine Cooling Radiator", basePrice: 120, oemPrice: 210, category: "cooling", desc: "Double-row aluminum core radiator with premium polymer tanks for rapid heat exchange." },
  "wheel bearing": { baseName: "Double-Row Wheel Bearing & Hub Assembly", basePrice: 70, oemPrice: 130, category: "suspension", desc: "Double-row wheel bearing assembly pre-packed with waterproof grease." },
  "headlight bulb": { baseName: "Ultra LED Headlight Conversion Kit (Pair)", basePrice: 25, oemPrice: 65, category: "electrical", desc: "High-power 6000K daylight white LED headlight replacement bulbs." },
  "windshield wipers": { baseName: "All-Weather Silicone Wiper Blades (Set)", basePrice: 20, oemPrice: 40, category: "electrical", desc: "Double-life flex silicone wiper blades for streak-free performance." },
  "air filter": { baseName: "High-Flow Engine Intake Air Filter", basePrice: 15, oemPrice: 30, category: "engine", desc: "Optimized pleated cotton engine air intake filter for high flow and filtration." },
  "cabin filter": { baseName: "Active Carbon Cabin Air Deodorizer", basePrice: 18, oemPrice: 35, category: "cooling", desc: "Multilayer active carbon cabin filter for chemical and particulate filtration." },
  "tyres (set of 4 all-season)": { baseName: "Set of 4 All-Season Tyres", basePrice: 200, oemPrice: 350, category: "tyres", desc: "Set of 4 high-traction, low rolling resistance all-season tyres for driving stability." },
  "tyre (single all-season)": { baseName: "Single All-Season Tyre", basePrice: 55, oemPrice: 90, category: "tyres", desc: "Single replacement all-season tyre with deep tread pattern for wet and dry conditions." },
  "engine oil (5l synthetic 5w-30)": { baseName: "5L Full Synthetic Engine Oil 5W-30", basePrice: 15, oemPrice: 25, category: "engine", desc: "Premium grade full synthetic motor oil. Prevents engine sludge and wear." },
  "oil filter": { baseName: "Engine Oil Filter Assembly", basePrice: 5, oemPrice: 10, category: "engine", desc: "Spin-on engine oil filter with high filtration capabilities to keep engine oil clean." },
  "shock absorbers (front pair)": { baseName: "Front Shock Absorbers (Pair)", basePrice: 85, oemPrice: 150, category: "suspension", desc: "Pair of front nitrogen gas-charged shock absorber struts for smooth vehicle handling." },
  "drive belt (serpentine)": { baseName: "Accessory Serpentine Drive Belt", basePrice: 12, oemPrice: 22, category: "engine", desc: "Heavy duty accessory serpentine drive belt for alternator, AC, and water pump pulley." }
};

// --- 1. SCALING: CACHING LAYER (REDIS MOCK) ---
const MockRedisCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q = "", make = "", model = "", year = "", vtype = "Car" } = req.query;

  const queryClean = q.toLowerCase().trim();
  const makeClean = make.trim();
  const modelClean = model.trim();
  const yearClean = year.trim();

  // Cache Check
  const cacheKey = `parts:${queryClean}:${makeClean}:${modelClean}:${yearClean}:${vtype}`;
  
  if (MockRedisCache.has(cacheKey)) {
    const cachedEntry = MockRedisCache.get(cacheKey);
    if (Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      console.log(`[CACHE HIT] Returning cached data for: ${cacheKey}`);
      return res.status(200).json({ ...cachedEntry.data, cached: true });
    } else {
      MockRedisCache.delete(cacheKey);
    }
  }

  // Price Scaling Factors based on Vehicle Specifications
  let multiplier = 1.0;
  const brand = makeClean.toLowerCase();
  
  if (brand.includes('bmw') || brand.includes('mercedes') || brand.includes('benz') || brand.includes('audi') || brand.includes('porsche') || brand.includes('jaguar') || brand.includes('land rover') || brand.includes('lexus')) {
    multiplier *= 1.65;
  } else if (brand.includes('toyota') || brand.includes('honda') || brand.includes('ford') || brand.includes('nissan') || brand.includes('chevrolet') || brand.includes('gmc') || brand.includes('jeep')) {
    multiplier *= 1.10;
  }

  const type = vtype.toLowerCase();
  if (type.includes('truck') || type.includes('pickup') || type.includes('suv')) {
    multiplier *= 1.35;
  } else if (type.includes('motorcycle') || type.includes('moto')) {
    multiplier *= 0.50;
  }

  const matches = [];

  for (const partKey in PartsCatalog) {
    if (partKey.includes(queryClean) || queryClean === "") {
      const part = PartsCatalog[partKey];

      const calculatedPrice = Math.round(part.basePrice * multiplier);
      const calculatedOemPrice = Math.round(part.oemPrice * multiplier);

      const displayName = makeClean 
        ? `${yearClean} ${makeClean} ${modelClean} ${part.baseName}`
        : `Universal ${part.baseName}`;

      const buyQuery = makeClean 
        ? `${yearClean} ${makeClean} ${modelClean} ${partKey}`
        : `${partKey}`;
      const checkoutLink = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(buyQuery)}&_sacat=6030`;

      matches.push({
        name: displayName,
        key: partKey,
        baseName: part.baseName,
        category: part.category,
        desc: part.desc,
        price: calculatedPrice,
        oem: calculatedOemPrice,
        checkoutUrl: checkoutLink,
        vehicleMapped: !!makeClean
      });
    }
  }

  const limitedMatches = matches.slice(0, 12);

  let carImageUrl = null;
  if (makeClean && modelClean) {
    try {
      const wikiQuery = `${yearClean} ${makeClean} ${modelClean}`;
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(wikiQuery)}&gsrlimit=1&prop=pageimages&format=json&pithumbsize=400&origin=*`;
      
      const wikiRes = await fetch(wikiUrl);
      const wikiData = await wikiRes.json();
      if (wikiData.query && wikiData.query.pages) {
        const page = Object.values(wikiData.query.pages)[0];
        if (page && page.thumbnail && page.thumbnail.source) {
          carImageUrl = page.thumbnail.source;
        }
      }
    } catch (e) {
      console.warn("Wikipedia image fetch skipped:", e);
    }
  }

  const responseData = {
    success: true,
    query: q,
    vehicle: { make: makeClean, model: modelClean, year: yearClean, vtype },
    carThumbnail: carImageUrl,
    parts: limitedMatches
  };

  MockRedisCache.set(cacheKey, {
    timestamp: Date.now(),
    data: responseData
  });

  return res.status(200).json(responseData);
};
