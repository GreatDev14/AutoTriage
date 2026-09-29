/**
 * GET  /api/mechanic-leads  — list inbound leads for this mechanic
 * POST /api/mechanic-leads  — create a new lead (called when a driver requests a mechanic)
 * PUT  /api/mechanic-leads  — accept or decline a lead (body: { id, action: 'accept'|'decline' })
 *
 * Leads are stored in scratch/mechanic_leads.json keyed by mechanic phone.
 * When a lead is ACCEPTED, it is automatically moved to appointments via the appointments DB.
 */
const fs   = require('fs');
const path = require('path');

const LEADS_PATH   = path.join(__dirname, '..', 'scratch', 'mechanic_leads.json');
const APPTS_PATH   = path.join(__dirname, '..', 'scratch', 'mechanic_appointments.json');
const TOKEN_PATH   = path.join(__dirname, '..', 'scratch', 'mechanic_tokens.json');
const PROFILE_PATH = path.join(__dirname, '..', 'scratch', 'mechanic_profiles.json');

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

  const leadsDB = readJSON(LEADS_PATH);
  if (!leadsDB[phone]) leadsDB[phone] = [];

  // --- GET: list pending leads ---
  if (req.method === 'GET') {
    const pending = leadsDB[phone].filter(l => l.status === 'pending');
    return res.status(200).json(pending);
  }

  // --- POST: a driver submits a new lead to this mechanic ---
  if (req.method === 'POST') {
    const body = req.body || {};
    if (!body.car || !body.issue) {
      return res.status(400).json({ error: 'Missing required fields: car, issue' });
    }

    const VALID_URGENCY = ['low', 'medium', 'high', 'critical'];
    const lead = {
      id:              'lead_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      mechPhone:       phone,
      car:             sanitize(body.car),
      issue:           sanitize(body.issue, 1000),
      diagnosis:       sanitize(body.diagnosis || ''),
      distance:        sanitize(body.distance || ''),
      time:            sanitize(body.time || 'Just now'),
      cost:            sanitize(body.cost || ''),
      clientName:      sanitize(body.clientName || ''),
      clientPhone:     sanitize(body.clientPhone || '', 25),
      clientEmail:     sanitize(body.clientEmail || ''),
      clientAddress:   sanitize(body.clientAddress || ''),
      clientLat:       typeof body.clientLat === 'number' ? body.clientLat : null,
      clientLng:       typeof body.clientLng === 'number' ? body.clientLng : null,
      urgency:         VALID_URGENCY.includes(body.urgency) ? body.urgency : 'high',
      date:            sanitize(body.date || new Date().toLocaleDateString()),
      timeSlot:        sanitize(body.timeSlot || 'ASAP'),
      status:          'pending',
      createdAt:       Date.now()
    };

    leadsDB[phone].unshift(lead);
    writeJSON(LEADS_PATH, leadsDB);
    return res.status(201).json({ success: true, lead });
  }

  // --- PUT: accept or decline a lead ---
  if (req.method === 'PUT') {
    const { id, action } = req.body || {};
    if (!id || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Missing id or invalid action. Use accept|decline' });
    }

    const idx = leadsDB[phone].findIndex(l => l.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Lead not found' });

    const lead = leadsDB[phone][idx];
    if (lead.status !== 'pending') {
      return res.status(409).json({ error: 'Lead is no longer pending' });
    }

    if (action === 'accept') {
      // Move lead to appointments
      const apptDB = readJSON(APPTS_PATH);
      if (!apptDB[phone]) apptDB[phone] = [];

      const profiles = readJSON(PROFILE_PATH);
      const mechName = profiles[phone]?.name || 'Mechanic';

      const newAppt = {
        id:            'appt_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
        mechPhone:     phone,
        mechName,
        clientName:    lead.clientName,
        clientPhone:   lead.clientPhone,
        clientEmail:   lead.clientEmail,
        clientAddress: lead.clientAddress,
        clientLat:     lead.clientLat,
        clientLng:     lead.clientLng,
        car:           lead.car,
        problem:       lead.issue,
        urgency:       lead.urgency,
        status:        'confirmed',
        time:          `${lead.date} at ${lead.timeSlot}`,
        fromLeadId:    lead.id,
        createdAt:     Date.now()
      };

      apptDB[phone].unshift(newAppt);
      writeJSON(APPTS_PATH, apptDB);

      lead.status = 'accepted';
    } else {
      lead.status = 'declined';
    }

    lead.updatedAt = Date.now();
    leadsDB[phone][idx] = lead;
    writeJSON(LEADS_PATH, leadsDB);

    return res.status(200).json({ success: true, lead });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
