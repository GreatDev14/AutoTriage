window.CONFIG = {
  MAPBOX_KEY: 'YOUR_MAPBOX_KEY',

  // Pointing to the new secure Firebase Cloud Function proxy
  // Local Emulator: http://127.0.0.1:5001/your-project-id/us-central1/geminiProxy
  GEMINI_URL: 'https://us-central1-autotriage-production.cloudfunctions.net/geminiProxy',
  MODEL: 'gemini-1.5-flash',

  DIAGNOSIS_PROMPT: `You are an expert automotive diagnostic AI. 
A user will describe their vehicle problem. You MUST respond with ONLY a valid JSON object — no markdown, no explanation, no extra text whatsoever.
Use this exact format:
{
  "summary": "one clear sentence describing the main issue",
  "likely_causes": ["cause 1", "cause 2", "cause 3"],
  "severity": "LOW or MEDIUM or HIGH or CRITICAL",
  "severity_score": 70,
  "immediate_actions": ["action 1", "action 2"],
  "solutions": ["solution 1", "solution 2", "solution 3"],
  "estimated_cost_usd_low": 500,
  "estimated_cost_usd_high": 1500,
  "specialist_needed": "General Mechanic or Engine Specialist or Auto Electrician or Brake Specialist or AC Specialist or Transmission Specialist",
  "is_critical": false,
  "critical_reason": ""
}
All cost estimates MUST be strictly numerical values representing USD. Do not include currency symbols.`
};