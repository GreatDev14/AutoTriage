const AIDiagnosis = (() => {

  function checkRateLimit() {
    const limit = 5; // max 5 calls per minute
    const now = Date.now();
    const history = JSON.parse(localStorage.getItem('at_ai_query_history') || '[]');
    
    // Filter history to last 60 seconds
    const active = history.filter(time => now - time < 60000);
    
    if (active.length >= limit) {
      return false; // Rate limit exceeded!
    }
    
    // Record this call
    active.push(now);
    localStorage.setItem('at_ai_query_history', JSON.stringify(active));
    return true;
  }

  async function diagnose(problem, vtype) {
    if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return demoResult();
    }

    // 1. Enforce AI Rate Limiting to prevent API key token drain
    if (!checkRateLimit()) {
      const errorMsg = 'Too many requests! Rate limit exceeded. Please wait 60 seconds before making another AI diagnosis.';
      if (typeof ATTelemetry !== 'undefined') {
        ATTelemetry.log('AI Diagnosis Aborted', 'WARNING', 'Rate Limit Exceeded');
      }
      throw new Error(errorMsg);
    }

    if (typeof ATTelemetry !== 'undefined') {
      ATTelemetry.log('AI Diagnosis Requested', 'INFO', `Vehicle: ${vtype}`);
    }

    const startTime = performance.now();

    let promptContext = '';
    if (window.GlobalContext) {
      promptContext = `\n[CRITICAL INSTRUCTIONS]\nUser Location: ${window.GlobalContext.country}\nLanguage: ${window.GlobalContext.language}\nCurrency: ${window.GlobalContext.currency}\nYou MUST provide the "estimated_cost" in the specified Currency and respond to ALL text fields in the specified Language. Make sure all recommendations and terminology are tailored to the specified Country.`;
    }

    // 2. Strict User Input Delimiting to block Prompt Injection
    const delimitedVehicle = `[START_USER_VEHICLE_TYPE]\n${vtype}\n[END_USER_VEHICLE_TYPE]`;
    const delimitedProblem = `[START_USER_PROBLEM_DESCRIPTION]\n${problem}\n[END_USER_PROBLEM_DESCRIPTION]`;

    const body = {
      contents: [{
        parts: [{ text: CONFIG.DIAGNOSIS_PROMPT + promptContext + "\n\n" + delimitedVehicle + "\n" + delimitedProblem }]
      }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    };

    try {
      const res = await fetch(CONFIG.GEMINI_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Gemini API error ' + res.status);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No valid text response from AI');

      // Parse JSON
      let clean = text.replace(/```json|```/g, '').trim();
      let result;
      try {
        result = JSON.parse(clean);
      } catch (parseErr) {
        console.error("Failed to parse JSON. Raw AI Output:", text);
        throw new Error("Invalid JSON from AI. See console for details.");
      }

      // Measure performance duration
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);
      if (typeof ATTelemetry !== 'undefined') {
        ATTelemetry.measurePerformance('diagnose', durationMs);
      }

      // Robust, multi-layered adaptive cost parser with dynamic key matching
      let low = null;
      let high = null;
      let lowIsLocal = false;
      let highIsLocal = false;
      
      const activeCurrency = (window.GlobalContext && window.GlobalContext.currency) ? window.GlobalContext.currency.toLowerCase() : 'usd';
      
      for (const k of Object.keys(result)) {
        const key = k.toLowerCase();
        if (key.includes('low') || key.endsWith('low')) {
          const val = parseFloat(result[k]);
          if (!isNaN(val) && val !== null && val !== '') {
            low = val;
            if (key.includes(activeCurrency)) {
              lowIsLocal = true;
            }
          }
        }
        if (key.includes('high') || key.endsWith('high')) {
          const val = parseFloat(result[k]);
          if (!isNaN(val) && val !== null && val !== '') {
            high = val;
            if (key.includes(activeCurrency)) {
              highIsLocal = true;
            }
          }
        }
      }
      
      if (low !== null && high !== null && !isNaN(low) && !isNaN(high)) {
        const formatFn = (amount, isLocal) => {
          if (window.GlobalContext && typeof window.GlobalContext.formatCurrency === 'function') {
            if (isLocal) {
              return new Intl.NumberFormat(window.GlobalContext.language || 'en-US', {
                style: 'currency',
                currency: window.GlobalContext.currency,
                maximumFractionDigits: 0
              }).format(amount);
            } else {
              return window.GlobalContext.formatCurrency(amount);
            }
          } else if (typeof formatPrice === 'function') {
            if (isLocal) {
              return new Intl.NumberFormat(typeof USER_LOCALE !== 'undefined' ? USER_LOCALE : 'en-US', {
                style: 'currency',
                currency: activeCurrency.toUpperCase(),
                maximumFractionDigits: 0
              }).format(amount);
            } else {
              return formatPrice(amount);
            }
          } else {
            return `$${amount}`;
          }
        };
        
        result.estimated_cost = `${formatFn(low, lowIsLocal)} – ${formatFn(high, highIsLocal)}`;
      } else {
        const costKeys = ['estimated_cost', 'cost', 'repair_cost'];
        let matched = false;
        for (const k of costKeys) {
          const val = result[k];
          if (val !== undefined && val !== null && val !== '') {
            matched = true;
            if (typeof val === 'number') {
              if (window.GlobalContext && typeof window.GlobalContext.formatCurrency === 'function') {
                result.estimated_cost = window.GlobalContext.formatCurrency(val);
              } else if (typeof formatPrice === 'function') {
                result.estimated_cost = formatPrice(val);
              } else {
                result.estimated_cost = `$${val}`;
              }
            } else if (typeof val === 'string') {
              if (val.includes('₦') || val.includes('$') || val.includes('€') || val.includes('£')) {
                result.estimated_cost = val;
              } else {
                const nums = val.match(/\d+/g);
                if (nums && nums.length >= 2) {
                  const l = parseFloat(nums[0]);
                  const h = parseFloat(nums[1]);
                  if (window.GlobalContext && typeof window.GlobalContext.formatCurrency === 'function') {
                    result.estimated_cost = `${window.GlobalContext.formatCurrency(l)} – ${window.GlobalContext.formatCurrency(h)}`;
                  } else if (typeof formatPrice === 'function') {
                    result.estimated_cost = `${formatPrice(l)} – ${formatPrice(h)}`;
                  } else {
                    result.estimated_cost = `$${l} – $${h}`;
                  }
                } else if (nums && nums.length === 1) {
                  const single = parseFloat(nums[0]);
                  if (window.GlobalContext && typeof window.GlobalContext.formatCurrency === 'function') {
                    result.estimated_cost = window.GlobalContext.formatCurrency(single);
                  } else if (typeof formatPrice === 'function') {
                    result.estimated_cost = formatPrice(single);
                  } else {
                    result.estimated_cost = `$${single}`;
                  }
                } else {
                  result.estimated_cost = val;
                }
              }
            }
            break;
          }
        }
        if (!matched) {
          result.estimated_cost = 'N/A';
        }
      }

      return result;
    } catch (e) {
      console.error('AI Diagnosis API Error Details:', e);
      if (typeof ATTelemetry !== 'undefined') {
        ATTelemetry.trackError('diagnose', e, { problem, vtype });
      }
      throw new Error(`AI Request Failed: ${e.message}`);
    }
  }

  function demoResult() {
    return {
      summary: 'Demo Mode — add your free Gemini API key in js/config.js for real AI diagnosis.',
      likely_causes: [
        'Engine knock from low-octane fuel',
        'Worn spark plugs causing misfires',
        'Carbon build-up in combustion chamber'
      ],
      severity: 'MEDIUM',
      severity_score: 60,
      immediate_actions: [
        'Avoid high RPMs until inspected',
        'Switch to High-octane (Premium) fuel'
      ],
      solutions: [
        'Replace spark plugs with NGK or Bosch equivalents',
        'Fuel system cleaning with injector cleaner additive',
        'Full engine compression test at mechanic',
        'Check and clean mass airflow sensor'
      ],
      estimated_cost: '$80 – $350',
      specialist_needed: 'Engine Specialist',
      is_critical: false,
      critical_reason: '',
      demo: true
    };
  }

  function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  function toHTML(d) {
    const sc = d.severity === 'CRITICAL' ? '#ff3333' :
               d.severity === 'HIGH'     ? '#ff8800' :
               d.severity === 'MEDIUM'   ? '#ffcc00' : '#44ff88';

    return `
      <div class="rb">
        <h4>Diagnosis Summary</h4>
        <p>${escapeHTML(d.summary)}</p>
      </div>

      <div class="rb">
        <h4>Severity — <span style="color:${sc}">${escapeHTML(d.severity)}</span></h4>
        <div class="sev-bar">
          <div class="sev-fill" style="width:${d.severity_score}%;background:${sc}"></div>
        </div>
      </div>

      <div class="rb">
        <h4>Likely Causes</h4>
        <ul>${d.likely_causes.map(c => `<li>${escapeHTML(c)}</li>`).join('')}</ul>
      </div>

      <div class="rb">
        <h4>Solutions</h4>
        <ul>${d.solutions.map(s => `<li>${escapeHTML(s)}</li>`).join('')}</ul>
      </div>

      <div class="rb">
        <h4>Immediate Actions</h4>
        <ul>${d.immediate_actions.map(a => `<li>${escapeHTML(a)}</li>`).join('')}</ul>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;">
        <div class="rb" style="margin:0">
          <h4>Est. Repair Cost</h4>
          <p style="font-family:'Bebas Neue',sans-serif;font-size:22px">${escapeHTML(d.estimated_cost)}</p>
        </div>
        <div class="rb" style="margin:0">
          <h4>Specialist Needed</h4>
          <p style="font-size:11px">${escapeHTML(d.specialist_needed)}</p>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:20px">
        <button class="btn-p" style="flex:1;padding:13px" onclick="app.scrollTo('#mechanics')"><span>Find Mechanic →</span></button>
        <button class="btn-s" style="flex:1;padding:13px" onclick="app.scrollTo('#ride')">Get a Ride</button>
      </div>

      ${d.demo ? `<p style="margin-top:16px;font-size:10px;color:var(--gray);border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;">
        ⚠️ <strong>Demo Mode:</strong> Get your free Gemini key at
        <a href="https://aistudio.google.com/" target="_blank" style="color:#4da6ff">aistudio.google.com</a>
        and paste it in <code>js/config.js</code>
      </p>` : ''}
    `;
  }

  return { diagnose, toHTML };
})();