// api/uber-api.js
// Communicates with Uber API endpoints (sandbox/production)
const fs = require('fs');
const path = require('path');
const https = require('https');
const config = require('./config');

const STATE_FILE = path.join(__dirname, '..', 'scratch', 'backend_state.json');
const USE_SANDBOX = config.uber.useSandbox !== false; // Default to true for safety
const BASE_URL = USE_SANDBOX ? 'https://sandbox-api.uber.com/v1.2' : 'https://api.uber.com/v1.2';

function getAccessToken() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      return state.uber ? state.uber.token : null;
    }
  } catch (err) {
    console.error('[UBER API Helper] Error reading access token:', err);
  }
  return null;
}

// Perform HTTPS requests
function request(method, endpoint, bodyData = null) {
  return new Promise((resolve, reject) => {
    const token = getAccessToken();
    if (!token) {
      return reject(new Error('No Uber access token found. Please link your Uber account first.'));
    }

    const url = new URL(BASE_URL + endpoint);
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AutoTriage-App/1.0'
    };

    let postData = '';
    if (bodyData) {
      postData = JSON.stringify(bodyData);
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject({
            statusCode: res.statusCode,
            message: `Uber API Error (${res.statusCode}): ${body}`,
            raw: body
          });
        } else {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        }
      });
    });

    req.on('error', reject);

    if (bodyData) {
      req.write(postData);
    }
    req.end();
  });
}

module.exports = {
  getAccessToken,
  // Get available products (UberX, Comfort, etc)
  getProducts: (lat, lng) => {
    return request('GET', `/products?latitude=${lat}&longitude=${lng}`);
  },
  // Get request estimate (fare, ETA)
  getEstimate: (productId, startLat, startLng, endLat, endLng) => {
    return request('POST', '/requests/estimate', {
      product_id: productId,
      start_latitude: startLat,
      start_longitude: startLng,
      end_latitude: endLat,
      end_longitude: endLng
    });
  },
  // Book the ride request
  createRequest: (productId, startLat, startLng, endLat, endLng, fareId) => {
    const body = {
      product_id: productId,
      start_latitude: startLat,
      start_longitude: startLng,
      end_latitude: endLat,
      end_longitude: endLng
    };
    if (fareId) {
      body.fare_id = fareId;
    }
    return request('POST', '/requests', body);
  }
};
