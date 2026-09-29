const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

const s1 = html.indexOf('async function runDiagnosis() {');
const e1 = html.indexOf('// ---- MECHANIC MATCHING ----', s1);

if (s1 > -1 && e1 > -1) {
  const newJs = `async function runDiagnosis() {
  const problem = document.getElementById('problemText').value.trim();
  if (!problem) { alert('Please describe your vehicle problem.'); return; }

  const btn = document.getElementById('diagnoseBtn');
  btn.disabled = true; btn.textContent = 'ANALYZING...';

  const area = document.getElementById('resultArea');
  const loading = document.getElementById('resultLoading');
  const body = document.getElementById('resultBody');
  area.classList.add('show');
  loading.style.display = 'block';
  body.innerHTML = '';
  document.getElementById('diagnose').classList.remove('active');
  document.getElementById('diag-result').classList.add('active');

  try {
    const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; // <-- USER MUST PASTE KEY HERE

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
       throw new Error("GEMINI API KEY MISSING! Please paste your key into the code.");
    }

    const savedVeh = JSON.parse(localStorage.getItem('myVehicle') || '{}');
    const vehContext = savedVeh.make ? \`\${savedVeh.year} \${savedVeh.make} \${savedVeh.model}\` : (window.curVt || 'Car');
    const lang = document.getElementById('langSelect') ? document.getElementById('langSelect').value : 'en';

    let userContent = \`Vehicle Context: \${vehContext}\\nLanguage: \${lang}\\nProblem: \${problem}\`;
    
    // Construct the payload for Gemini 1.5 Flash
    let payload = {
      contents: [{
        role: "user",
        parts: [{ text: "You are an elite AI mechanic. Analyze the vehicle symptoms and provide a highly structured diagnostic report. You must return your response as a pure JSON object matching this exact schema: { \\"summary\\": \\"brief diagnosis\\", \\"likely_causes\\": [\\"cause 1\\", \\"cause 2\\"], \\"severity\\": \\"HIGH/MEDIUM/LOW\\", \\"immediate_actions\\": [\\"action 1\\"], \\"solutions\\": [\\"solution 1\\"], \\"estimated_cost\\": \\"$100 - $300\\", \\"specialist_needed\\": \\"Brake Specialist\\" }. Do not include markdown formatting or backticks around the JSON.\\n\\n" + userContent }]
      }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    };

    if (currentDiagnosisImage) {
      // If there's an image, we append it as inlineData
      const base64Data = currentDiagnosisImage.split(',')[1];
      const mimeType = currentDiagnosisImage.split(';')[0].split(':')[1];
      payload.contents[0].parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

    const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${GEMINI_API_KEY}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'API connection failed');
    }

    const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!txt) throw new Error('No valid response from Gemini Engine');
    
    let result;
    try {
      result = JSON.parse(txt.trim());
    } catch(e) {
      throw new Error("Failed to parse AI response. " + e.message);
    }

    // Render beautiful UI
    body.innerHTML = \`
      <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">SUMMARY</div>
      <div style="font-family: 'Space Mono', monospace; font-size: 14px; color: white; line-height: 1.6; margin-bottom: 12px;">\${result.summary}</div>
      <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: \${result.severity==='HIGH'?'#E63946':(result.severity==='MEDIUM'?'#F4A261':'#2DBE60')}; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 30px;">SEVERITY \${result.severity}</div>

      <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">LIKELY CAUSES</div>
      <ul style="font-family: 'Space Mono', monospace; font-size: 13px; color: white; line-height: 1.6; padding-left: 20px; margin-bottom: 30px;">
        \${(result.likely_causes || []).map(c => \`<li style="margin-bottom:8px;">\${c}</li>\`).join('')}
      </ul>

      <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">SOLUTIONS</div>
      <ul style="font-family: 'Space Mono', monospace; font-size: 13px; color: white; line-height: 1.6; padding-left: 20px; margin-bottom: 30px;">
        \${(result.solutions || []).map(s => \`<li style="margin-bottom:8px;">\${s}</li>\`).join('')}
      </ul>

      <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">IMMEDIATE ACTIONS</div>
      <ul style="font-family: 'Space Mono', monospace; font-size: 13px; color: white; line-height: 1.6; padding-left: 20px; margin-bottom: 30px;">
        \${(result.immediate_actions || []).map(a => \`<li style="margin-bottom:8px;">\${a}</li>\`).join('')}
      </ul>

      <div style="display: flex; gap: 20px;">
        <div style="flex:1;">
          <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">EST. COST</div>
          <div style="font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: white; letter-spacing: 1px;">\${result.estimated_cost}</div>
        </div>
        <div style="flex:1;">
          <div style="font-family: 'Space Mono', monospace; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">SPECIALIST</div>
          <div style="font-family: 'Space Mono', monospace; font-size: 13px; color: white;">\${result.specialist_needed}</div>
        </div>
      </div>
    \`;

    const specLabel = document.getElementById('targetSpecLabel');
    if (specLabel) specLabel.innerText = (result.specialist_needed || 'SPECIALIST').toUpperCase();

    // Cache the diagnosis result for WhatsApp sharing
    window._lastDiagnosisText = \`*AUTOTRIAGE DIAGNOSIS*\\n\\n*Summary:* \${result.summary}\\n*Causes:* \${(result.likely_causes||[]).join(', ')}\\n*Solutions:* \${(result.solutions||[]).join(', ')}\\n*Immediate Actions:* \${(result.immediate_actions||[]).join(', ')}\\n*Est. Cost:* \${result.estimated_cost}\\n*Specialist Needed:* \${result.specialist_needed}\`;

  } catch(e) {
    body.innerHTML = \`<div style="color:#E63946; font-family:'Space Mono', monospace; font-size:14px; text-align:center; padding:20px; border: 1px dashed rgba(230,57,70,0.5); border-radius: 12px;">\${e.message}</div>\`;
  }

  loading.style.display = 'none';
  btn.disabled = false; btn.textContent = 'INITIATE AI ENGINE';
}

`;

  html = html.substring(0, s1) + newJs + html.substring(e1);
  fs.writeFileSync('simple.html', html, 'utf8');
  console.log('Successfully injected Javascript logic!');
} else {
  console.log('Failed to find boundary tags for JS injection.');
}
