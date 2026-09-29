/**
 * AutoTriage Virtual Vehicle Twin Tracker
 * 
 * Uses background GPS and Accelerometer data to track:
 * - Mileage (Virtual Odometer)
 * - Stop-and-Go Traffic vs Highway (Oil Stress Multiplier)
 * - Hard Braking events
 */

const TripTracker = (function() {
  let watchId = null;
  let isTracking = false;
  let lastPosition = null;
  
  let currentTrip = {
    active: false,
    distanceMiles: 0,
    speedSamples: [], // for variance/stop-and-go detection
    hardBrakes: 0,
    startTime: null
  };

  // Convert km to miles
  const kmToMiles = (km) => km * 0.621371;

  // Haversine formula to calculate distance between two coordinates
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  }

  function handlePositionUpdate(position) {
    const { latitude, longitude, speed } = position.coords;
    const speedMph = speed ? speed * 2.23694 : 0; // m/s to mph

    // Trip detection (moving > 10 mph starts a trip)
    if (speedMph > 10 && !currentTrip.active) {
      startTrip();
    } else if (speedMph < 3 && currentTrip.active) {
      // Could be stopped at a light, we wait before ending trip.
      // For demo, we just keep it active until manually stopped or app closes.
    }

    if (currentTrip.active && lastPosition) {
      const distKm = calculateDistance(
        lastPosition.latitude, lastPosition.longitude,
        latitude, longitude
      );
      const distMiles = kmToMiles(distKm);
      
      // Update local storage odometer
      let vehicle = JSON.parse(localStorage.getItem('myVehicle') || '{}');
      if (vehicle.mileage && distMiles > 0.01) { // avoid jitter
        vehicle.mileage = (parseFloat(vehicle.mileage) + distMiles).toFixed(1);
        localStorage.setItem('myVehicle', JSON.stringify(vehicle));
        currentTrip.distanceMiles += distMiles;
        
        // Update UI Odometer if function exists
        if (typeof window.updateOdometerUI === 'function') {
          window.updateOdometerUI(vehicle.mileage);
        }
      }
      
      if (speedMph > 0) {
        currentTrip.speedSamples.push(speedMph);
      }
    }

    lastPosition = { latitude, longitude, timestamp: position.timestamp };
    saveTripState();
  }

  function handleMotion(event) {
    if (!currentTrip.active) return;
    
    // Detect hard braking (sudden negative acceleration in Y or Z depending on phone mount)
    // Simplified: check if acceleration vector drops sharply.
    if (event.acceleration) {
      const a = event.acceleration;
      const mag = Math.sqrt(a.x*a.x + a.y*a.y + a.z*a.z);
      // Rough heuristic for hard brake > ~4.5 m/s^2 deceleration
      if (mag > 4.5 && currentTrip.speedSamples[currentTrip.speedSamples.length-1] > 10) {
        currentTrip.hardBrakes++;
        saveTripState();
      }
    }
  }

  function startTrip() {
    // Passenger Problem Prompt
    if (typeof window.askPassengerPrompt === 'function') {
      window.askPassengerPrompt((isDriver) => {
        if (isDriver) {
          currentTrip = {
            active: true,
            distanceMiles: 0,
            speedSamples: [],
            hardBrakes: 0,
            startTime: Date.now()
          };
          // Vibrate to confirm
          if (navigator.vibrate) navigator.vibrate(200);
          
          if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', handleMotion);
          }
        }
      });
    } else {
      currentTrip.active = true;
    }
  }

  function stopTrip() {
    if (!currentTrip.active) return;
    
    // Calculate stress multipliers based on trip data
    let stressMultiplier = 1.0;
    
    if (currentTrip.speedSamples.length > 10) {
      // Calculate variance (stop and go vs highway)
      const avgSpeed = currentTrip.speedSamples.reduce((a, b) => a + b) / currentTrip.speedSamples.length;
      let variance = 0;
      currentTrip.speedSamples.forEach(s => {
        variance += Math.pow(s - avgSpeed, 2);
      });
      variance /= currentTrip.speedSamples.length;
      
      // High variance = stop and go traffic = higher oil stress
      if (variance > 200) {
        stressMultiplier = 1.5; // 50% more oil wear
      } else if (avgSpeed > 50 && variance < 50) {
        stressMultiplier = 0.8; // 20% less oil wear (highway)
      }
    }
    
    // Save these stats so obd.js can deduct them
    let cumulativeStats = JSON.parse(localStorage.getItem('aiTripStats') || '{"totalHardBrakes":0, "oilStressDistance":0, "totalFuelBurnedGal":0}');
    cumulativeStats.totalHardBrakes += currentTrip.hardBrakes;
    cumulativeStats.oilStressDistance += (currentTrip.distanceMiles * stressMultiplier);
    
    // Estimate fuel burned (Assume avg 24 mpg for generic calculation, obd.js will refine)
    cumulativeStats.totalFuelBurnedGal += (currentTrip.distanceMiles / 24);
    
    localStorage.setItem('aiTripStats', JSON.stringify(cumulativeStats));

    currentTrip.active = false;
    if (window.DeviceMotionEvent) {
      window.removeEventListener('devicemotion', handleMotion);
    }
  }

  function saveTripState() {
    localStorage.setItem('currentActiveTrip', JSON.stringify(currentTrip));
  }

  function loadTripState() {
    try {
      const saved = localStorage.getItem('currentActiveTrip');
      if (saved) {
        currentTrip = JSON.parse(saved);
      }
    } catch(e){}
  }

  return {
    init: function() {
      loadTripState();
      
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          handlePositionUpdate,
          (err) => console.warn('GPS Error', err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
        isTracking = true;
      }
    },
    stop: function() {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      isTracking = false;
      stopTrip();
    },
    isActive: function() {
      return currentTrip.active;
    },
    getTrip: function() {
      return currentTrip;
    },
    simulateTripStart: function() {
      startTrip();
    }
  };
})();

window.TripTracker = TripTracker;
