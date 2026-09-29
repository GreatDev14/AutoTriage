/**
 * GET    /api/mechanic-portfolio  — list portfolio entries
 * POST   /api/mechanic-portfolio  — add a new completed job to portfolio
 * DELETE /api/mechanic-portfolio  — remove a portfolio entry (body: { id })
 *
 * Stored in scratch/mechanic_portfolio.json keyed by mechanic phone.
 */
const fs   = require('fs');
const path = require('path');

const DB_PATH    = path.join(__dirname, '..', 'scratch', 'mechanic_portfolio.json');
const TOKEN_PATH = path.join(__dirname, '..', 'scratch', 'mechanic_tokens.json');

function readJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch(e) { return {}; }
}
function writeJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch(e) { console.error(e); }
}

function resolvePhone(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookieMatch  = cookieHeader.match(/at_mech_token=([a-f0-9]+)/);
  const cookieToken  = cookieMatch ? cookieMatch[1] : null;
  const authHeader   = req.headers.authorization || '';
  const bearerToken  = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const token = cookieToken || bearerToken;
  if (!token) return null;
  const tokens = readJSON(TOKEN_PATH);
  const entry  = tokens[token];
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.phone;
}

function sanitize(val, max = 1000) {
  if (typeof val !== 'string') return String(val || '');
  return val.replace(/<[^>]*>/g, '').trim().slice(0, max);
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const phone = resolvePhone(req);
  if (!phone) return res.status(401).json({ error: 'Unauthorized' });

  const db = readJSON(DB_PATH);
  if (!db[phone]) db[phone] = [];

  // --- GET ---
  if (req.method === 'GET') {
    const sorted = [...db[phone]].sort((a, b) => b.createdAt - a.createdAt);
    return res.status(200).json(sorted);
  }

  // --- POST: add new portfolio entry ---
  if (req.method === 'POST') {
    const { title, car, cost, summary } = req.body || {};
    if (!title || !summary) {
      return res.status(400).json({ error: 'Missing required fields: title, summary' });
    }

    const entry = {
      id:        'port_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      mechPhone: phone,
      title:     sanitize(title),
      car:       sanitize(car || ''),
      cost:      sanitize(String(cost || '0'), 20),
      summary:   sanitize(summary),
      createdAt: Date.now()
    };

    db[phone].unshift(entry);
    writeJSON(DB_PATH, db);
    return res.status(201).json({ success: true, entry });
  }

  // --- DELETE: remove an entry ---
  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const before = db[phone].length;
    db[phone] = db[phone].filter(e => e.id !== id);

    if (db[phone].length === before) {
      return res.status(404).json({ error: 'Portfolio entry not found' });
    }

    writeJSON(DB_PATH, db);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
