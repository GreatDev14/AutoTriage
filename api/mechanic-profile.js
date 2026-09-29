/**
 * GET /api/mechanic-profile
 * Returns the logged-in mechanic's profile.
 * Authentication: reads 'at_mech_token' cookie or Authorization: Bearer header.
 *
 * PUT /api/mechanic-profile  (body: { avail })
 * Updates availability status ('open' | 'busy' | 'offline').
 */
const fs   = require('fs');
const path = require('path');

const DB_PATH     = path.join(__dirname, '..', 'scratch', 'mechanic_profiles.json');
const TOKEN_PATH  = path.join(__dirname, '..', 'scratch', 'mechanic_tokens.json');

function readJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch(e) { return {}; }
}
function writeJSON(filePath, data) {
  try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); } catch(e) {}
}

// Resolve the mechanic's phone key from the request token
function resolvePhone(req) {
  // 1. From httpOnly cookie
  const cookieHeader = req.headers.cookie || '';
  const cookieMatch  = cookieHeader.match(/at_mech_token=([a-f0-9]+)/);
  const cookieToken  = cookieMatch ? cookieMatch[1] : null;

  // 2. From Authorization: Bearer <token>
  const authHeader   = req.headers.authorization || '';
  const bearerToken  = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const token = cookieToken || bearerToken;
  if (!token) return null;

  const tokens = readJSON(TOKEN_PATH);
  const entry  = tokens[token];
  if (!entry) return null;

  // Check expiry
  if (entry.expiresAt < Date.now()) {
    delete tokens[token];
    writeJSON(TOKEN_PATH, tokens);
    return null;
  }

  return entry.phone; // normalized phone = DB key
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const phone = resolvePhone(req);
  if (!phone) return res.status(401).json({ error: 'Unauthorized — please log in first' });

  const db = readJSON(DB_PATH);
  const profile = db[phone];
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  // --- GET ---
  if (req.method === 'GET') {
    const { certData: _cd, ...safeProfile } = profile; // strip binary blob
    return res.status(200).json(safeProfile);
  }

  // --- PUT (update availability) ---
  if (req.method === 'PUT') {
    const { avail } = req.body || {};
    const validAvail = ['open', 'busy', 'offline'];
    if (avail && validAvail.includes(avail)) {
      db[phone].avail = avail;
      db[phone].updatedAt = new Date().toISOString();
      writeJSON(DB_PATH, db);
    }
    const { certData: _cd, ...safeProfile } = db[phone];
    return res.status(200).json({ success: true, profile: safeProfile });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
