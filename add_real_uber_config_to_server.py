#!/usr/bin/env python3
"""
Plug real Uber API Credentials into server.js:
Client ID: iHqG2cOcGcQOBrLm2HjPZxGdB2WCqjVh
Client Secret: aJ_gcYkdz-9FBDd-pbEqGpruferQ68GbfqrSZzca
"""

import os

UBER_REAL_API_CODE = """
  // =========================================================================
  // REAL UBER API CONFIGURATION & GUEST TRIPS DISPATCH ENGINE
  // =========================================================================
  const UBER_CONFIG = {
    clientId: process.env.UBER_CLIENT_ID || 'iHqG2cOcGcQOBrLm2HjPZxGdB2WCqjVh',
    clientSecret: process.env.UBER_CLIENT_SECRET || 'aJ_gcYkdz-9FBDd-pbEqGpruferQ68GbfqrSZzca',
    sandboxUrl: 'https://sandbox-api.uber.com/v1/guests',
    prodUrl: 'https://api.uber.com/v1/guests'
  };

  // Helper to fetch Uber OAuth Token
  async function getUberAccessToken() {
    try {
      const postData = new URLSearchParams({
        client_id: UBER_CONFIG.clientId,
        client_secret: UBER_CONFIG.clientSecret,
        grant_type: 'client_credentials',
        scope: 'guests.trips'
      }).toString();

      const resp = await axios.post('https://login.uber.com/oauth/v2/token', postData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 6000
      });
      return resp.data.access_token;
    } catch(err) {
      console.warn('[Uber API Engine] OAuth note:', err.response ? err.response.data : err.message);
      return null;
    }
  }
"""

def update_server():
    filepath = r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\server.js"
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace dummy ride handlers with real Uber API integrated handlers
    if 'UBER_CONFIG' not in content:
        content = content.replace("  // =========================================================================", UBER_REAL_API_CODE + "\n  // =========================================================================", 1)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successfully integrated Real Uber API credentials into server.js!")
    else:
        print("Uber API credentials already present in server.js!")

update_server()
