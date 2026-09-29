import re

with open('simple.html', 'r', encoding='utf-8') as f:
    text = f.read()

old_func_start = text.find('async function runDiagnosis() {')
old_func_end = text.find('\n}\n\nasync function fetchGlobalMechanics') + 2

if old_func_start != -1 and old_func_end != -1:
    old_func = text[old_func_start:old_func_end]
    
    new_func = """async function runDiagnosis() {
  const problem = document.getElementById('problemText').value.trim();
  if (!problem) { alert('Please describe your vehicle problem.'); return; }

  const btn = document.getElementById('diagnoseBtn');
  btn.disabled = true; btn.textContent = 'ANALYZING...';

  const area = document.getElementById('resultArea');
  const loading = document.getElementById('resultLoading');
  const body = document.getElementById('resultBody');
  
  // Fix inline display issue
  area.style.display = 'block';
  area.style.opacity = '0';
  loading.style.display = 'block';
  body.innerHTML = '';
  // Removed screen switch
  // Removed screen switch

  try {
    const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // <-- USER MUST PASTE KEY HERE

    const savedVeh = JSON.parse(localStorage.getItem('myVehicle') || '{}');
    const vehContext = savedVeh.make ? `${savedVeh.year} ${savedVeh.make} ${savedVeh.model}` : (window.curVt || 'Car');
    const langSelect = document.getElementById('langSelect');
    const lang = langSelect ? langSelect.value : 'en';

    let result;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
       // MOCK DIAGNOSIS MODE
       await new Promise(r => setTimeout(r, 2500)); // Simulate AI thinking
       result = {
         summary: `Based on the symptoms described for your ${vehContext}, there is a high probability of severe brake pad depletion causing metal-on-metal contact with the rotors.`,
         likely_causes: ["Severely Worn Brake Pads", "Scored or Warped Brake Rotors", "Seized Brake Caliper"],
         severity: "HIGH",
         immediate_actions: ["Cease highway driving immediately", "Perform visual inspection of brake assembly"],
         solutions: ["Replace front brake pads and hardware", "Resurface or replace brake rotors", "Service and lubricate caliper slider pins"],
         estimated_cost: "$180 - $450",
         specialist_needed: "Brake Specialist"
       };
    } else {
        // REAL API MODE
        let userContent = `Vehicle Context: ${vehContext}\\nLanguage: ${lang}\\nProblem: ${problem}`;
        
        let payload = {
          contents: [{
            role: "user",
            parts: [{ text: "You are an elite AI mechanic. Analyze the vehicle symptoms and provide a highly structured diagnostic report. You must return your response as a pure JSON object matching this exact schema: { \\"summary\\": \\"brief diagnosis\\", \\"likely_causes\\": [\\"cause 1\\", \\"cause 2\\"], \\"severity\\": \\"HIGH\\" or \\"MEDIUM\\" or \\"LOW\\", \\"immediate_actions\\": [\\"action 1\\"], \\"solutions\\": [\\"solution 1\\"], \\"estimated_cost\\": \\"$100 - $300\\", \\"specialist_needed\\": \\"Brake Specialist\\" }. Do not include markdown formatting or backticks around the JSON.\\n\\n" + userContent }]
          }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        };

        if (currentDiagnosisImage) {
          const base64Data = currentDiagnosisImage.split(',')[1];
          const mimeType = currentDiagnosisImage.split(';')[0].split(':')[1];
          payload.contents[0].parts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
        
        try {
          result = JSON.parse(txt.trim());
        } catch(e) {
          throw new Error("Failed to parse AI response. " + e.message);
        }
    }

    // Render beautiful UI
    body.innerHTML = `
      <div style="font-family: 'Inter', system-ui; font-weight:700; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">SUMMARY</div>
      <div style="font-size: 14px; color: var(--fg); line-height: 1.6; margin-bottom: 12px;">${result.summary}</div>
      <div style="font-family: 'Inter', system-ui; font-weight:700; font-size: 11px; color: ${result.severity==='HIGH'?'#E63946':(result.severity==='MEDIUM'?'#F4A261':'#2DBE60')}; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 30px;">SEVERITY ${result.severity}</div>

      <div style="font-family: 'Inter', system-ui; font-weight:700; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">LIKELY CAUSES</div>
      <ul style="font-size: 13px; color: var(--fg); line-height: 1.6; padding-left: 20px; margin-bottom: 30px;">
        ${(result.likely_causes || []).map(c => `<li style="margin-bottom:8px;">${c}</li>`).join('')}
      </ul>

      <div style="font-family: 'Inter', system-ui; font-weight:700; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">SOLUTIONS</div>
      <ul style="font-size: 13px; color: var(--fg); line-height: 1.6; padding-left: 20px; margin-bottom: 30px;">
        ${(result.solutions || []).map(s => `<li style="margin-bottom:8px;">${s}</li>`).join('')}
      </ul>

      <div style="font-family: 'Inter', system-ui; font-weight:700; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">IMMEDIATE ACTIONS</div>
      <ul style="font-size: 13px; color: var(--fg); line-height: 1.6; padding-left: 20px; margin-bottom: 30px;">
        ${(result.immediate_actions || []).map(a => `<li style="margin-bottom:8px;">${a}</li>`).join('')}
      </ul>

      <div style="display: flex; gap: 20px;">
        <div style="flex:1;">
          <div style="font-family: 'Inter', system-ui; font-weight:700; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">EST. COST</div>
          <div style="font-family: 'Inter', system-ui; font-weight:800; font-size: 24px; color: var(--fg); letter-spacing: 1px;">${result.estimated_cost}</div>
        </div>
        <div style="flex:1;">
          <div style="font-family: 'Inter', system-ui; font-weight:700; font-size: 11px; color: #E63946; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid rgba(230,57,70,0.3); padding-bottom: 8px;">SPECIALIST</div>
          <div style="font-weight:600; font-size: 13px; color: var(--fg);">${result.specialist_needed}</div>
        </div>
      </div>
    `;

    const specLabel = document.getElementById('targetSpecLabel');
    if (specLabel) specLabel.innerText = (result.specialist_needed || 'SPECIALIST').toUpperCase();

    // Cache the diagnosis result for WhatsApp sharing
    window._lastDiagnosisText = `*AUTOTRIAGE DIAGNOSIS*\\n\\n*Summary:* ${result.summary}\\n*Causes:* ${(result.likely_causes||[]).join(', ')}\\n*Solutions:* ${(result.solutions||[]).join(', ')}\\n*Immediate Actions:* ${(result.immediate_actions||[]).join(', ')}\\n*Est. Cost:* ${result.estimated_cost}\\n*Specialist Needed:* ${result.specialist_needed}`;

    // Sync with laptop version's diagnosis history
    let mobileHist = JSON.parse(localStorage.getItem('diagnosisHistory') || '[]');
    mobileHist.unshift({
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }),
      problem: problem,
      summary: result.summary,
      cost: result.estimated_cost,
      result: result
    });
    if(mobileHist.length > 10) mobileHist.pop();
    localStorage.setItem('diagnosisHistory', JSON.stringify(mobileHist));

    // Smooth fade in
    setTimeout(() => { area.style.opacity = '1'; }, 50);

  } catch(e) {
    area.style.display = 'block';
    area.style.opacity = '1';
    body.innerHTML = `<div style="color:#E63946; font-family:'Inter', system-ui; font-weight:600; font-size:14px; text-align:center; padding:20px; border: 1px dashed rgba(230,57,70,0.5); border-radius: 12px; background:rgba(230,57,70,0.05);">${e.message}</div>`;
  }

  loading.style.display = 'none';
  btn.disabled = false; btn.textContent = 'INITIATE AI ENGINE';
}"""
    
    text = text.replace(old_func, new_func)
    with open('simple.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Success: Updated runDiagnosis with mock mode and fixed display logic.")
else:
    print("Error: Could not find old function to replace.")
