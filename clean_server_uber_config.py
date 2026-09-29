#!/usr/bin/env python3
"""
Clean up duplicate UBER_CONFIG in server.js
"""

import os, re

def clean_server():
    filepath = r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\server.js"
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all occurrences of UBER_CONFIG and replace with single Production config
    prod_config = """// PRODUCTION UBER GUEST TRIPS API CONFIGURATION
const UBER_CONFIG = {
  clientId: process.env.UBER_CLIENT_ID || 'iHqG2cOcGcQOBrLm2HjPZxGdB2WCqjVh',
  clientSecret: process.env.UBER_CLIENT_SECRET || 'aJ_gcYkdz-9FBDd-pbEqGpruferQ68GbfqrSZzca',
  mode: 'production',
  apiUrl: 'https://api.uber.com/v1/guests/trips',
  estimatesUrl: 'https://api.uber.com/v1/guests/trips/estimates',
  oauthUrl: 'https://login.uber.com/oauth/v2/token'
};"""

    # Remove all declarations of UBER_CONFIG
    content = re.sub(r'const UBER_CONFIG = \{.*?\};', '', content, flags=re.DOTALL)
    content = re.sub(r'// =+ \*/\s*const UBER_CONFIG = \{.*?\};', '', content, flags=re.DOTALL)
    content = re.sub(r'// REAL UBER API CONFIGURATION.*?\};', '', content, flags=re.DOTALL)

    # Insert single prod_config near top
    content = prod_config + "\n\n" + content

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Cleaned up server.js UBER_CONFIG duplicate!")

clean_server()
