const fs = require('fs');
const path = require('path');
const config = require('./config');

const STATE_FILE = path.join(__dirname, '..', 'scratch', 'backend_state.json');

module.exports = async function(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { code, error, state: oauthState } = req.query;

  if (error) {
    console.error('[UBER OAUTH] Auth error received:', error);
    const targetUrl = oauthState === 'mobile' ? '/simple.html#rides' : '/app.html';
    return res.status(400).send(`
      <html>
        <body style="background:#0a0a0c; color:#ff5555; font-family:sans-serif; text-align:center; padding:40px;">
          <h2>Authentication Failed</h2>
          <p>${error}</p>
          <a href="${targetUrl}" style="color:white; text-decoration:underline;">Return to AutoTriage</a>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    console.log('[UBER OAUTH] Exchanging auth code for access token...');
    
    // Perform token exchange with Uber
    // Node standard http/https request since we don't have node-fetch
    const tokenResponse = await makePostRequest('https://login.uber.com/oauth/v2/token', {
      client_id: config.uber.clientId,
      client_secret: config.uber.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.uber.redirectUri
    });

    const tokenData = JSON.parse(tokenResponse);
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('No access token returned from Uber');
    }

    console.log('[UBER OAUTH] Access token acquired successfully.');

    // Fetch user profile (Sandbox/Production)
    let userPhone = '+1 (555) 987-6543'; // Default fallback
    try {
      const profileResponse = await makeGetRequest('https://api.uber.com/v1.2/me', accessToken);
      const profileData = JSON.parse(profileResponse);
      if (profileData.mobile_number) {
        userPhone = profileData.mobile_number;
      } else if (profileData.email) {
        userPhone = profileData.email; // Use email if mobile is not available
      }
      console.log(`[UBER OAUTH] Fetched profile user: ${userPhone}`);
    } catch (profileErr) {
      console.warn('[UBER OAUTH] Could not fetch profile (using sandbox fallback):', profileErr.message);
    }

    // Save token and state on backend
    if (fs.existsSync(STATE_FILE)) {
      const fileContent = fs.readFileSync(STATE_FILE, 'utf8');
      const state = JSON.parse(fileContent);
      state.uber.loggedIn = true;
      state.uber.phone = userPhone;
      state.uber.token = accessToken;
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
      console.log('[UBER OAUTH] Backend state successfully updated.');
    }

    // Return HTML script to set local storage and redirect back to app
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authenticating...</title>
          <style>
            body { background: #000000; color: #ffffff; font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .loader { border: 2px solid rgba(255,255,255,0.1); border-top: 2px solid #ffffff; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin-right: 12px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="loader"></div>
          <div>Connecting session to AutoTriage...</div>
          <script>
            localStorage.setItem('autotriage_logged_in_uber', 'true');
            localStorage.setItem('autotriage_phone_uber', '${userPhone}');
            // Redirect back to app depending on oauthState
            const oauthState = '${oauthState || ""}';
            if (oauthState === 'mobile') {
              window.location.href = '/simple.html#rides';
            } else {
              window.location.href = '/app.html';
            }
          </script>
        </body>
      </html>
    `);

  } catch (err) {
    console.error('[UBER OAUTH] Token exchange error:', err);
    const targetUrl = oauthState === 'mobile' ? '/simple.html#rides' : '/app.html';
    return res.status(500).send(`
      <html>
        <body style="background:#0a0a0c; color:#ff5555; font-family:sans-serif; text-align:center; padding:40px;">
          <h2>OAuth Verification Failed</h2>
          <p>${err.message}</p>
          <a href="${targetUrl}" style="color:white; text-decoration:underline;">Return to AutoTriage</a>
        </body>
      </html>
    `);
  }
};

// Helper function to perform POST request with urlencoded body
function makePostRequest(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = new URLSearchParams(data).toString();
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const httpLib = url.protocol === 'https:' ? require('https') : require('http');
    const req = httpLib.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Server returned status ${res.statusCode}: ${body}`));
        } else {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Helper function to perform GET request with Bearer authorization
function makeGetRequest(urlStr, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const httpLib = url.protocol === 'https:' ? require('https') : require('http');
    const req = httpLib.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Server returned status ${res.statusCode}: ${body}`));
        } else {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}
