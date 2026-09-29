const key = process.env.VITE_GEMINI_API_KEY;
const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const body = {
  contents: [{ parts: [{ text: 'Respond with JSON: { "summary": "test", "estimated_cost_usd_low": 100 }' }] }],
  generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
};
fetch(url + '?key=' + key, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
})
.then(res => res.json().then(data => ({status: res.status, ok: res.ok, data: JSON.stringify(data)})))
.then(console.log)
.catch(console.error);
