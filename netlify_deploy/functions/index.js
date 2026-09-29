const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const fetch = require('node-fetch');

// This function acts as a secure proxy for the Gemini API.
// It hides the GEMINI_API_KEY from the frontend client.
// In production, set this secret via: firebase functions:secrets:set GEMINI_API_KEY
exports.geminiProxy = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Must be POST.' });
      }

      // Load key from environment or fallback to local test key
      const apiKey = process.env.GEMINI_API_KEY || "YOUR_TEST_API_KEY_HERE";
      const model = req.body.model || "gemini-1.5-flash";
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      // Forward the request body exactly as the frontend sent it
      const geminiRes = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body.payload || req.body) 
      });

      const data = await geminiRes.json();
      
      if (!geminiRes.ok) {
        return res.status(geminiRes.status).json({ error: data.error || 'Gemini API Error' });
      }

      return res.status(200).json(data);
    } catch (err) {
      console.error('Gemini proxy error:', err);
      return res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
  });
});
