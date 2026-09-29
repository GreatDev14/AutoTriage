/**
 * AutoTriage — Vehicle Lifecycle Vitals Engine
 *
 * Each component uses the most PRACTICAL real-world measurement
 * that a regular driver would understand and be able to track:
 *
 *  Oil        → miles remaining until next change
 *  Battery    → age in years (warn when old)
 *  Tires      → estimated miles of tread life remaining
 *  Brakes     → estimated miles of pad life remaining
 *  Air Filter → months since last replacement
 *  Coolant    → months since last flush
 *  Trans.     → miles remaining until next fluid change
 */

const OBDModule = (() => {
  let isConnected = false;
  let connectionState = 'DISCONNECTED';
  let telemetryInterval = null;
  let activeVehicle = null;
  let calculatedVitals = {};
  let liveSensors = { batteryVolts: 14.1, coolantTemp: 90, oilPressure: 42, rpm: 0, speed: 0 };

  // --- Brand-specific oil change intervals ---
  function getOilInterval(make) {
    const m = (make || '').toLowerCase();
    if (m.includes('bmw') || m.includes('mercedes') || m.includes('audi') ||
        m.includes('vw') || m.includes('porsche')) return 10000;
    if (m.includes('toyota') || m.includes('honda') || m.includes('hyundai') ||
        m.includes('kia') || m.includes('lexus')) return 7500;
    return 5000;
  }

  /**
   * Get last service data from overrides or serviceLog for a key.
   * Returns { lastMileage, lastDate } or null if not recorded.
   */
  function getLastService(key, currentMileage) {
    let overrides = {};
    try { overrides = JSON.parse(localStorage.getItem('vitalOverrides') || '{}') || {}; } catch(e) {}
    const o = overrides[key];
    if (o !== undefined && o !== null) {
      const lastMileage = typeof o === 'object' ? (o.mileage || currentMileage) : currentMileage;
      const lastDate    = typeof o === 'object' ? (o.date    || new Date().toISOString()) : new Date().toISOString();
      return { lastMileage, lastDate };
    }

    let serviceLog = {};
    try { serviceLog = JSON.parse(localStorage.getItem('serviceLog') || '{}') || {}; } catch(e) {}
    const serviceKey = key === 'tires' ? 'tireRotation' : key;
    const log = serviceLog[serviceKey];
    if (log) {
      return {
        lastMileage: parseInt(log.mileage) || 0,
        lastDate:    log.date || new Date().toISOString()
      };
    }

    return null; // no record — will estimate from car age/mileage
  }

  /**
   * MILEAGE-TRACKED COMPONENTS (Oil, Tires, Brakes, Transmission)
   * Primary value: miles remaining until service
   */
  function mileageComponent(key, fullIntervalMi, mileage, age, aiTripStats) {
    const svc = getLastService(key, mileage);

    let milesSinceService;
    if (svc) {
      milesSinceService = Math.max(0, mileage - svc.lastMileage);
    } else {
      // Fallback: assume serviced on repeat cycles since new
      milesSinceService = mileage % fullIntervalMi;
    }

    // Apply Virtual Twin AI Predictive Modifiers
    if (aiTripStats) {
      if (key === 'oil' && aiTripStats.oilStressDistance) {
        milesSinceService += aiTripStats.oilStressDistance;
      }
      if (key === 'brakes' && aiTripStats.totalHardBrakes) {
        milesSinceService += (aiTripStats.totalHardBrakes * 10); // 10 miles wear per hard brake
      }
    }

    const miLeft = Math.max(0, Math.round(fullIntervalMi - milesSinceService));
    const pct    = Math.round(Math.min(100, (miLeft / fullIntervalMi) * 100));

    function fmtMi(mi) {
      if (mi === 0)        return 'Service now';
      if (mi >= 10000)     return (mi / 1000).toFixed(0) + 'k mi left';
      if (mi >= 1000)      return (mi / 1000).toFixed(1) + 'k mi left';
      return mi + ' mi left';
    }

    const status = pct > 60 ? 'GOOD' : pct > 25 ? 'WATCH' : 'SERVICE';
    return {
      pct,
      primary:   fmtMi(miLeft),
      secondary: `Every ${(fullIntervalMi/1000).toFixed(0)}k mi`,
      status,
      miLeft
    };
  }

  /**
   * TIME-TRACKED COMPONENTS (Battery, Air Filter, Coolant)
   * Primary value: age in years or months — what users intuitively know
   */
  function timeComponent(key, goodForMonths, mileage, age) {
    const svc = getLastService(key, mileage);

    let monthsOld;
    if (svc) {
      monthsOld = Math.max(0, (Date.now() - new Date(svc.lastDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    } else {
      // Fallback: assume replaced on last cycle relative to car age
      monthsOld = (age * 12) % goodForMonths;
    }

    monthsOld = Math.round(monthsOld);
    const monthsLeft = Math.max(0, goodForMonths - monthsOld);
    const pct = Math.round(Math.min(100, (monthsLeft / goodForMonths) * 100));

    function fmtAge(mo) {
      if (mo < 1)  return 'Just replaced';
      if (mo < 12) return mo + (mo === 1 ? ' month old' : ' months old');
      const yrs = mo / 12;
      return yrs.toFixed(1) + ' yrs old';
    }
    function fmtLeft(mo) {
      if (mo <= 0) return 'Replace now';
      if (mo < 12) return mo + ' mo left';
      return (mo / 12).toFixed(1) + ' yrs left';
    }

    const status = pct > 60 ? 'GOOD' : pct > 25 ? 'WATCH' : 'REPLACE';
    return {
      pct,
      primary:   fmtAge(monthsOld),
      secondary: fmtLeft(monthsLeft) + ` · change every ${goodForMonths < 12 ? goodForMonths + ' mo' : (goodForMonths/12) + ' yrs'}`,
      status,
      monthsOld,
      monthsLeft
    };
  }

  /**
   * FUEL PREDICTOR — now reads real MPG from fill-up logs
   */
  function fuelComponent(mileage, aiTripStats) {
    // ── Read real MPG from fill-up logs (desktop or mobile key) ───────────
    let realMpg = 0;
    let mpgHistory = [];
    let lastLogMiles = 0;
    try {
      // Try desktop logs first, fall back to mobile
      const rawLogs = JSON.parse(localStorage.getItem('desktopFuelLogs') || 'null')
                   || JSON.parse(localStorage.getItem('fuelLog')          || '[]');
      if (rawLogs && rawLogs.length > 0) {
        // Sort a copy of the logs ascending by mileage so they are in chronological order
        const logs = [...rawLogs].map(l => ({
          miles: parseFloat(l.miles || l.mileage || 0),
          gallons_norm: parseFloat(l.gallons_norm || l.gallons || 0)
        })).sort((a, b) => a.miles - b.miles);

        lastLogMiles = logs[logs.length - 1].miles;

        if (logs.length >= 2) {
          // Calculate per-segment MPG using the CORRECT denominator (previous fill-up gallons)
          for (let i = 1; i < logs.length; i++) {
            const newer = logs[i];
            const older = logs[i - 1];
            const distMi = newer.miles - older.miles;
            const gals   = older.gallons_norm;
            if (distMi > 0 && gals > 0) mpgHistory.push(distMi / gals);
          }
          if (mpgHistory.length > 0) {
            realMpg = mpgHistory.reduce((s, v) => s + v, 0) / mpgHistory.length;
          }
        }
      }
    } catch(e) {}

    // ── Derive range from real MPG if available, else fall back to 24 MPG default ────
    const effectiveMpg = realMpg > 0 ? realMpg : 24;
    const tankGal      = 14; // generic 14-gal tank
    const rangeMiles   = Math.round(effectiveMpg * tankGal);

    const svc = getLastService('fuel', mileage);
    let lastFillMileage = svc ? svc.lastMileage : 0;
    if (lastLogMiles > lastFillMileage) {
      lastFillMileage = lastLogMiles;
    }

    let milesSinceFill = lastFillMileage > 0 ? Math.max(0, mileage - lastFillMileage) : (mileage % rangeMiles);
    if (aiTripStats && aiTripStats.totalFuelBurnedGal) {
      milesSinceFill += (aiTripStats.totalFuelBurnedGal * effectiveMpg);
    }

    const miLeft = Math.max(0, Math.round(rangeMiles - milesSinceFill));
    const pct    = Math.round(Math.min(100, (miLeft / rangeMiles) * 100));

    const mpgLabel = realMpg > 0 ? `${realMpg.toFixed(1)} MPG actual` : `${effectiveMpg} MPG est.`;
    return {
      pct,
      primary:   pct + '% Tank',
      secondary: miLeft + ' mi range · ' + mpgLabel,
      status:    pct > 40 ? 'GOOD' : pct > 15 ? 'WATCH' : 'REFUEL',
      miLeft,
      realMpg
    };
  }

  /**
   * FUEL EFFICIENCY HEALTH VITAL — separate card showing MPG trend health
   * Score: 100 = at/above expected MPG, drops proportionally with efficiency loss
   */
  function fuelEfficiencyComponent(vehicle) {
    const make  = (vehicle.make  || '').toLowerCase();
    const vtype = (vehicle.vtype || '').toLowerCase();
    // Expected MPG by vehicle type
    let expectedMpg = 28;
    if (vtype.includes('truck'))       expectedMpg = 20;
    else if (vtype.includes('suv'))    expectedMpg = 24;
    else if (make.includes('bmw')  || make.includes('mercedes') || make.includes('audi')) expectedMpg = 26;
    else if (make.includes('toyota')|| make.includes('honda'))  expectedMpg = 30;

    let mpgHistory = [];
    let logsCount  = 0;
    try {
      const rawLogs = JSON.parse(localStorage.getItem('desktopFuelLogs') || 'null')
                   || JSON.parse(localStorage.getItem('fuelLog')          || '[]');
      logsCount = (rawLogs || []).length;
      if (rawLogs && rawLogs.length >= 2) {
        // Sort a copy of the logs ascending by mileage so they are in chronological order
        const logs = [...rawLogs].map(l => ({
          miles: parseFloat(l.miles || l.mileage || 0),
          gallons_norm: parseFloat(l.gallons_norm || l.gallons || 0)
        })).sort((a, b) => a.miles - b.miles);

        for (let i = 1; i < logs.length; i++) {
          const newer = logs[i];
          const older = logs[i - 1];
          const distMi = newer.miles - older.miles;
          const gals   = older.gallons_norm;
          if (distMi > 0 && gals > 0) mpgHistory.push(distMi / gals);
        }
      }
    } catch(e) {}

    if (mpgHistory.length === 0) {
      return {
        pct: 80, // Assume decent until data exists
        primary: 'No data yet',
        secondary: `Log ${Math.max(0, 2 - logsCount)} more fill-up${logsCount === 1 ? '' : 's'} to calculate`,
        status: 'WATCH'
      };
    }

    const avgMpg   = mpgHistory.reduce((s, v) => s + v, 0) / mpgHistory.length;
    const latestMpg = mpgHistory[mpgHistory.length - 1];
    // Score: ratio of actual vs expected, capped at 100
    const pct     = Math.round(Math.min(100, (avgMpg / expectedMpg) * 100));
    const dropPct = ((avgMpg - latestMpg) / avgMpg) * 100;
    const trend   = dropPct > 10 ? '↓ Dropping' : latestMpg > avgMpg ? '↑ Improving' : '— Stable';
    return {
      pct,
      primary: avgMpg.toFixed(1) + ' MPG avg',
      secondary: `${trend} · target ${expectedMpg} MPG`,
      status: pct > 75 ? 'GOOD' : pct > 50 ? 'WATCH' : 'SERVICE',
      avgMpg,
      latestMpg,
      expectedMpg
    };
  }

  /**
   * Main entry: compute all components.
   */
  function computeLifecycleVitals(vehicle) {
    if (!vehicle || !vehicle.make) {
      const empty = { pct: 0, primary: 'No data', secondary: 'Register vehicle', status: 'UNKNOWN' };
      return { oil: {...empty}, battery: {...empty}, tires: {...empty},
               brakes: {...empty}, airFilter: {...empty}, coolant: {...empty}, transmission: {...empty} };
    }

    const year    = parseInt(vehicle.year)    || new Date().getFullYear();
    const mileage = parseInt(vehicle.mileage) || 0;
    const age     = Math.max(0, new Date().getFullYear() - year);

    const oilInterval  = getOilInterval(vehicle.make);
    let aiTripStats = null;
    try { aiTripStats = JSON.parse(localStorage.getItem('aiTripStats') || '{"totalHardBrakes":0, "oilStressDistance":0, "totalFuelBurnedGal":0}'); } catch(e){}

    calculatedVitals = {
      oil:            mileageComponent('oil',          oilInterval, mileage, age, aiTripStats),
      battery:        timeComponent   ('battery',      48,          mileage, age),
      tires:          mileageComponent('tires',        55000,       mileage, age, aiTripStats),
      brakes:         mileageComponent('brakes',       40000,       mileage, age, aiTripStats),
      airFilter:      timeComponent   ('airFilter',    12,          mileage, age),
      coolant:        timeComponent   ('coolant',      24,          mileage, age),
      transmission:   mileageComponent('transmission', 45000,       mileage, age, aiTripStats),
      fuel:           fuelComponent   (mileage, aiTripStats),
      fuelEfficiency: fuelEfficiencyComponent(vehicle)
    };

    return calculatedVitals;
  }

  // --- Connection stubs (API-compatible) ---
  function startLiveTelemetry(vehicle, onUpdate) {
    activeVehicle = vehicle;
    if (telemetryInterval) clearInterval(telemetryInterval);
    computeLifecycleVitals(vehicle);
    liveSensors.rpm = 0; liveSensors.speed = 0;
    telemetryInterval = setInterval(() => {
      if (connectionState !== 'CONNECTED') return;
      let b = 14.0 + (Math.random() * 0.2 - 0.1);
      if (b > 14.4) b = 14.4; if (b < 13.8) b = 13.8;
      liveSensors.batteryVolts = b;
      let c = 89 + (Math.random() * 1.0 - 0.5);
      if (c > 94) c = 94; if (c < 87) c = 87;
      liveSensors.coolantTemp = c;
      let o = 42 + (Math.random() * 2.0 - 1.0);
      if (o > 46) o = 46; if (o < 38) o = 38;
      liveSensors.oilPressure = o;
      liveSensors.rpm   = 780 + Math.floor(Math.random() * 40 - 20);
      liveSensors.speed = 0;
      if (typeof onUpdate === 'function') onUpdate({ vitals: calculatedVitals, sensors: liveSensors });
    }, 2000);
  }

  function stopLiveTelemetry() {
    if (telemetryInterval) { clearInterval(telemetryInterval); telemetryInterval = null; }
  }
  function connect(vehicle, onUpdate, onStateChange) {
    connectionState = 'CONNECTING';
    if (typeof onStateChange === 'function') onStateChange(connectionState);
    setTimeout(() => {
      isConnected = true; connectionState = 'CONNECTED';
      startLiveTelemetry(vehicle, onUpdate);
      if (typeof onStateChange === 'function') onStateChange(connectionState);
    }, 1500);
  }
  function disconnect(onStateChange) {
    stopLiveTelemetry(); isConnected = false; connectionState = 'DISCONNECTED';
    if (typeof onStateChange === 'function') onStateChange(connectionState);
  }
  function toggleConnection(vehicle, onUpdate, onStateChange) {
    if (isConnected) disconnect(onStateChange); else connect(vehicle, onUpdate, onStateChange);
  }
  function runActiveSensorTest(onUpdate, onComplete) {
    if (connectionState !== 'CONNECTED') return;
    let startTime = Date.now(); const duration = 5000;
    const t = setInterval(() => {
      const pct = (Date.now() - startTime) / duration;
      if (pct >= 1.0) { clearInterval(t); liveSensors.rpm = 800; liveSensors.speed = 0; if (typeof onComplete === 'function') onComplete(); return; }
      liveSensors.rpm   = pct < 0.5 ? Math.round(800 + pct*2*2200) : Math.round(3000-(pct-0.5)*2*2200);
      liveSensors.speed = pct < 0.5 ? Math.round(pct*2*45) : Math.round(45-(pct-0.5)*2*45);
      liveSensors.batteryVolts = parseFloat((14.3 + Math.random()*0.1).toFixed(1));
      liveSensors.coolantTemp  = Math.round(91 + Math.random()*2);
      liveSensors.oilPressure  = Math.round(48 + Math.random()*6);
      if (typeof onUpdate === 'function') onUpdate({ vitals: calculatedVitals, sensors: liveSensors });
    }, 200);
  }

  return {
    connect, disconnect, toggleConnection,
    isConnected:         () => isConnected,
    getConnectionState:  () => connectionState,
    getCalculatedVitals: () => calculatedVitals,
    getLiveSensors:      () => liveSensors,
    computeLifecycleVitals,
    runActiveSensorTest
  };
})();
