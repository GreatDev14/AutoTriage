// api/geocode.js
// Resolves string addresses to lat/lng coordinates using Nominatim OpenStreetMap API
const https = require('https');

module.exports = function geocode(address) {
  return new Promise((resolve) => {
    if (!address || address === 'Current Location' || address === 'Detected Location') {
      // Default to Lagos coordinates (fallback)
      return resolve({ latitude: 6.5244, longitude: 3.3792 });
    }

    // If it's already coordinate-like (e.g. "6.5244, 3.3792")
    const match = address.match(/^([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)$/);
    if (match) {
      return resolve({
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2])
      });
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    
    const options = {
      headers: {
        'User-Agent': 'AutoTriage-App-API/1.0' // OSM requires User-Agent header
      }
    };

    https.get(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(body);
          if (results && results.length > 0) {
            resolve({
              latitude: parseFloat(results[0].lat),
              longitude: parseFloat(results[0].lon)
            });
          } else {
            // Fallback to Lagos
            resolve({ latitude: 6.5244, longitude: 3.3792 });
          }
        } catch (e) {
          resolve({ latitude: 6.5244, longitude: 3.3792 });
        }
      });
    }).on('error', (err) => {
      console.error('[GEOCODE] Address resolution error:', err.message);
      resolve({ latitude: 6.5244, longitude: 3.3792 });
    });
  });
};
