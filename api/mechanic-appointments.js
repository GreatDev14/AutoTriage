/**
 * GET  /api/mechanic-appointments  — list all appointments for the logged-in mechanic
 * POST /api/mechanic-appointments  — add a new appointment (e.g. mechanic accepts a lead)
 * PUT  /api/mechanic-appointments  — update appointment status (body: { id, status })
 *
 * All endpoints require authentication via at_mech_token cookie or Authorization header.
 * Data stored in scratch/mechanic_appointments.json, keyed by mechanic phone.
 */
const fs   = require('fs');
const path = require('path');

const DB_PATH    = path.join(__dirname, '..', 'scratch', 'mechanic_appointments.json');
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

function sanitize(val, max = 500) {
  if (typeof val !== 'string') return String(val || '');
  return val.replace(/<[^>]*>/g, '').trim().slice(0, max);
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const phone = resolvePhone(req);
  if (!phone) return res.status(401).json({ error: 'Unauthorized' });

  const db = readJSON(DB_PATH);
  if (!db[phone]) db[phone] = [];

  // --- GET: list appointments ---
  if (req.method === 'GET') {
    // Sort newest first
    const list = [...db[phone]].sort((a, b) => b.createdAt - a.createdAt);
    return res.status(200).json(list);
  }

  // --- POST: create appointment ---
  if (req.method === 'POST') {
    const body = req.body || {};
    const required = ['clientName', 'clientPhone', 'car', 'problem'];
    for (const field of required) {
      if (!body[field]) return res.status(400).json({ error: `Missing field: ${field}` });
    }

    const VALID_URGENCY = ['low', 'medium', 'high', 'critical'];
    const VALID_STATUS  = ['confirmed', 'completed', 'cancelled', 'no_show'];

    const newAppt = {
      id:            'appt_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      mechPhone:     phone,
      clientName:    sanitize(body.clientName),
      clientPhone:   sanitize(body.clientPhone, 25),
      clientEmail:   sanitize(body.clientEmail || ''),
      clientAddress: sanitize(body.clientAddress || ''),
      clientLat:     typeof body.clientLat === 'number' ? body.clientLat : null,
      clientLng:     typeof body.clientLng === 'number' ? body.clientLng : null,
      car:           sanitize(body.car),
      problem:       sanitize(body.problem, 1000),
      urgency:       VALID_URGENCY.includes(body.urgency) ? body.urgency : 'medium',
      status:        VALID_STATUS.includes(body.status)   ? body.status  : 'confirmed',
      time:          sanitize(body.time || new Date().toLocaleString()),
      createdAt:     Date.now()
    };

    db[phone].unshift(newAppt);
    writeJSON(DB_PATH, db);
    return res.status(201).json({ success: true, appointment: newAppt });
  }

  // --- PUT: update appointment status ---
  if (req.method === 'PUT') {
    const { id, status } = req.body || {};
    if (!id || !status) return res.status(400).json({ error: 'Missing id or status' });

    const VALID_STATUS = ['confirmed', 'completed', 'cancelled', 'no_show'];
    if (!VALID_STATUS.includes(status)) return res.status(400).json({ error: 'Invalid status value' });

    const idx = db[phone].findIndex(a => a.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Appointment not found' });

    db[phone][idx].status    = status;
    db[phone][idx].updatedAt = Date.now();
    writeJSON(DB_PATH, db);
    return res.status(200).json({ success: true, appointment: db[phone][idx] });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
