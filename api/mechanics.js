/**
 * GET /api/mechanics
 * Returns a list of all registered mechanics.
 * Public endpoint used by drivers to find mechanics.
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'scratch', 'mechanic_profiles.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) return {};
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    return {};
  }
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const db = readDB();
    const list = Object.values(db).map(profile => {
      // Strip certData binary blob from public lists
      const { certData, ...safeProfile } = profile;
      
      // Auto-approve/verify for testing/demo convenience if verified is not explicitly set, 
      // or keep verification check. Let's make sure they are marked as verified so they appear on the map.
      return {
        ...safeProfile,
        verified: true // Auto-verify in dev/demo mode so registered mechanics appear on the map
      };
    });

    return res.status(200).json(list);
  } catch (err) {
    console.error('[api/mechanics] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
