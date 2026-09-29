const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'scratch', 'backend_state.json');

const INITIAL_STATE = {
  uber: { loggedIn: false, phone: null, booking: null },
  lyft: { loggedIn: false, phone: null, booking: null },
  bolt: { loggedIn: false, phone: null, booking: null },
  didi: { loggedIn: false, phone: null, booking: null },
  grab: { loggedIn: false, phone: null, booking: null },
  indrive: { loggedIn: false, phone: null, booking: null }
};

function readState() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      // Create parent directory if missing
      const dir = path.dirname(STATE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STATE_FILE, JSON.stringify(INITIAL_STATE, null, 2), 'utf8');
      return INITIAL_STATE;
    }
    const data = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[STATE API] Read Error:', err);
    return INITIAL_STATE;
  }
}

function writeState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('[STATE API] Write Error:', err);
  }
}

module.exports = async function(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const validProviders = ['uber', 'lyft', 'bolt', 'didi', 'grab', 'indrive'];

  if (req.method === 'GET') {
    const state = readState();
    return res.status(200).json(state);
  }

  if (req.method === 'POST') {
    try {
      const { action, providerId, phone, booking } = req.body;
      
      if (!action) {
        return res.status(400).json({ error: 'Missing action parameter' });
      }

      if (providerId && !validProviders.includes(providerId.toLowerCase())) {
        return res.status(400).json({ error: 'Invalid providerId' });
      }

      const state = readState();
      const prov = providerId ? providerId.toLowerCase() : null;

      switch (action) {
        case 'login':
          if (!prov || !phone) {
            return res.status(400).json({ error: 'Missing providerId or phone' });
          }
          // Sanitize phone number (digits, plus sign, spaces, hyphens)
          const sanitizedPhone = phone.replace(/[^\d+ -]/g, '').trim();
          if (sanitizedPhone.length < 5) {
            return res.status(400).json({ error: 'Invalid phone number format' });
          }
          state[prov].loggedIn = true;
          state[prov].phone = sanitizedPhone;
          break;

        case 'logout':
          if (!prov) {
            return res.status(400).json({ error: 'Missing providerId' });
          }
          state[prov].loggedIn = false;
          state[prov].phone = null;
          state[prov].booking = null;
          break;

        case 'book':
          if (!prov || !booking) {
            return res.status(400).json({ error: 'Missing providerId or booking details' });
          }
          state[prov].booking = {
            bookingId: booking.bookingId,
            rideType: booking.rideType,
            status: booking.status || 'driver_en_route',
            driver: {
              name: booking.driver.name,
              rating: booking.driver.rating,
              vehicle: booking.driver.vehicle,
              plate: booking.driver.plate,
              color: booking.driver.color
            },
            eta: booking.eta,
            destination: booking.destination,
            timestamp: new Date().toISOString()
          };
          break;

        case 'clear_booking':
          if (!prov) {
            return res.status(400).json({ error: 'Missing providerId' });
          }
          state[prov].booking = null;
          break;

        default:
          return res.status(400).json({ error: 'Unknown action: ' + action });
      }

      writeState(state);
      return res.status(200).json({ success: true, state });
    } catch (err) {
      console.error('[STATE API] POST Error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
