/**
 * POST /api/mechanic-register
 * Registers or updates a mechanic profile on the server.
 * Data is stored in scratch/mechanic_profiles.json, keyed by phone number.
 * No third-party packages needed — pure Node.js fs + crypto.
 */
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'scratch', 'mechanic_profiles.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) return {};
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    console.error('[mechanic-register] readDB error:', e.message);
    return {};
  }
}

function writeDB(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[mechanic-register] writeDB error:', e.message);
  }
}

// Sanitize a string — strip HTML, limit length
function sanitize(val, maxLen = 255) {
  if (typeof val !== 'string') return '';
  return val.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

// Generate a secure token for this mechanic session (httpOnly cookie simulation)
function generateToken(phone) {
  return crypto.createHmac('sha256', process.env.SECRET_KEY || 'autotriage-secret-2025')
               .update(phone + Date.now())
               .digest('hex');
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const {
      name, spec, exp, emoji, phone, wa, address, email,
      certName, certData
    } = req.body || {};

    // --- Validation ---
    if (!name || !phone) {
      return res.status(400).json({ error: 'Missing required fields: name, phone' });
    }

    // Validate phone: allow +, digits, spaces, dashes only
    const cleanPhone = (phone || '').replace(/[^\d+\-\s]/g, '').trim();
    if (cleanPhone.length < 6 || cleanPhone.length > 25) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // certData is a base64 string — limit to 2MB
    if (certData && certData.length > 2_800_000) {
      return res.status(413).json({ error: 'Certificate file too large (max 2MB)' });
    }

    const db = readDB();

    // Use phone as the unique key (normalized)
    const key = cleanPhone.replace(/[\s\-]/g, '');

    const existingProfile = db[key];

    const profile = {
      name:       sanitize(name),
      spec:       sanitize(spec || 'General Mechanic'),
      exp:        sanitize(String(exp || '0')),
      emoji:      sanitize(emoji || '👨🏾‍🔧', 10),
      phone:      cleanPhone,
      wa:         sanitize((wa || cleanPhone).replace(/\D/g, ''), 25),
      address:    sanitize(address || ''),
      email:      sanitize(email || ''),
      certName:   certName ? sanitize(certName, 100) : (existingProfile?.certName || ''),
      certData:   certData || existingProfile?.certData || '',
      avail:      existingProfile?.avail || 'open',
      registeredAt: existingProfile?.registeredAt || new Date().toISOString(),
      updatedAt:  new Date().toISOString()
    };

    db[key] = profile;
    writeDB(db);

    // Generate a session token to authenticate subsequent requests
    const token = generateToken(cleanPhone);

    // Store token alongside profile so we can verify it in other endpoints
    const tokenDB_PATH = path.join(__dirname, '..', 'scratch', 'mechanic_tokens.json');
    let tokens = {};
    try { tokens = JSON.parse(fs.readFileSync(tokenDB_PATH, 'utf8')); } catch(e) {}
    tokens[token] = { phone: key, expiresAt: Date.now() + 12 * 60 * 60 * 1000 }; // 12h
    try { fs.writeFileSync(tokenDB_PATH, JSON.stringify(tokens, null, 2), 'utf8'); } catch(e) {}

    // Set session cookie (httpOnly prevents JS access)
    res.setHeader('Set-Cookie',
      `at_mech_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200`
    );

    // Return the profile WITHOUT certData (never send binary blobs back unnecessarily)
    const { certData: _cd, ...safeProfile } = profile;
    return res.status(200).json({ success: true, profile: safeProfile, token });

  } catch (err) {
    console.error('[mechanic-register] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
