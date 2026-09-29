# AUTOTRIAGE - PROJECT KNOWLEDGE BASE & AI HANDOVER

**ATTENTION FUTURE AI OR DEVELOPER:**
If you are reading this, the user has likely migrated to a new laptop, started a fresh session, or cleared their memory. **Read this entire document carefully.** It contains the complete architectural context, feature history, and critical quirks of the "AutoTriage" project.

---

## 🚗 What is AutoTriage?
AutoTriage is a web-based, mobile-first automotive diagnostic, tracking, and emergency response application. It is designed to act as a digital co-pilot for drivers, helping them diagnose car issues using AI, track their trips, and get immediate help during emergencies.

## 🛠️ Technology Stack
- **Frontend:** Pure Vanilla HTML, CSS, and JavaScript. No modern frameworks (React/Vue/etc.) are used in the core app.
- **Backend (Local Dev):** A very simple Node.js server (`server.js`) serving static files on port `8080`.
- **AI Integration:** Uses Google's **Gemini API** (specifically `gemini-1.5-pro`) for the core diagnostic engine.
- **Main Files:**
  - `simple.html`: The monolithic main HTML file containing the UI structure and inline styles/scripts.
  - `server.js`: The local development server.

---

## 🌟 Core Features & How They Work

### 1. AI Diagnostic Engine
- **How it works:** Users select the symptoms their car is experiencing. The app sends a prompt to the Gemini API.
- **Implementation:** The response is parsed out of Markdown and displayed in the UI as a structured report (Summary, Likely Causes, Solutions).
- **History Sync:** Results are automatically saved to `localStorage` under `diagnosisHistory` so they persist across sessions and can be viewed in the Garage tab.

### 2. Drive Mode & Crash Detection
- **How it works:** A dashboard that users activate while driving. It tracks Speed, Distance, and Time.
- **Crash Detection:** It uses the browser's `DeviceOrientationEvent` and `DeviceMotionEvent` APIs. It calculates G-force based on sudden acceleration/deceleration spikes. If the G-force exceeds a critical threshold (e.g., simulating an impact), it triggers an automatic SOS dispatch sequence.

### 3. Emergency Section & Hands-Free Voice SOS
- **The Emergency UI:** Redesigned to be highly tactile. Features a massive **"SOUND PANIC ALARM"** (which uses the browser's Web Audio API to play a loud siren and flashes the screen red/black), a **Live GPS Coordinates** readout, and a 2x2 grid for emergency contacts (Police, Medical, Fire, Tow).
- **Hands-Free Voice SOS ("Help Help" feature):** Uses the `window.SpeechRecognition` API. When Drive Mode is active, the microphone quietly listens in the background. If the user shouts "HELP", it automatically triggers a 112 emergency dispatch sequence and SMS location sharing.
- **Important Note on Voice UI:** The actual microphone button was *removed* from the visible Emergency screen UI because it was confusing on unsupported devices, but the *underlying JavaScript logic* remains intact and is triggered automatically by Drive Mode.

### 4. Garage & Maintenance Log
- Users can log fuel fill-ups and maintenance tasks.
- Supports voice-dictated quick logging (using SpeechRecognition).

---

## ⚠️ CRITICAL QUIRKS & KNOWN ISSUES (MUST READ)

1. **Mobile Hardware Permissions (The HTTP vs HTTPS Issue):**
   - **The Problem:** The user frequently tests the app on their physical mobile phone via a local network IP (e.g., `http://192.168.1.220:8080`). Modern mobile browsers (iOS Safari, Android Chrome) **STRICTLY BLOCK** the Microphone (`SpeechRecognition`) and Accelerometer (`DeviceMotionEvent`) over `http://`.
   - **The Symptom:** Permissions will not prompt, the Voice SOS will fail silently, and Crash Detection won't work.
   - **The Fix:** When testing on mobile, the server **MUST** be tunneled through HTTPS. We previously used `npx localtunnel --port 8080` (e.g., `https://xxxx.loca.lt`) to generate a secure URL so the phone would allow the permission prompts.

2. **Localtunnel 503 Errors:**
   - Localtunnel connections often drop or time out if the laptop goes to sleep. When this happens, restart `server.js` and spin up a new `localtunnel` instance. Remind the user to enter the bypass IP on the localtunnel splash screen.

3. **Monolithic HTML:**
   - `simple.html` is very large. When making edits, be extremely careful not to accidentally delete closing `</div>` tags or break the structure. Use precise DOM manipulation or targeted string replacement scripts.

4. **SpeechRecognition Compatibility:**
   - The Voice SOS relies on an experimental web API. It works best on Android Chrome. On iOS Safari, it is highly restrictive and may require user interaction to start, which can interfere with the automated background listener in Drive Mode.

---

## 🤖 Directives for Future AI Agents
- **Do not introduce heavy frameworks** (React, Angular) without explicit permission; the user prefers the current Vanilla JS/HTML setup.
- **Always verify HTTPS tunneling** if the user complains about "permissions not showing" or "microphone not working" on their phone.
- **Respect the UI redesigns:** The user prefers "premium, state-of-the-art" designs (dark modes, glassmorphism). Keep the styling sleek and modern.

## 🔮 FUTURE ROADMAP & UNFINISHED BUSINESS

Based on our past conversations and a scan of the codebase architecture, here are the outstanding tasks and future goals for the AutoTriage project:

1. **Desktop vs. Mobile Parity:** 
   - The project consists of a laptop version (`js/desktop.js`) and a mobile version (`simple.html`). 
   - A continuous future task is ensuring new AI features (like the diagnostic history sync we recently built) are mirrored perfectly across both platforms.

2. **Backend API Security:** 
   - Currently, the Gemini API is being called directly from the client side. 
   - For a production launch, the API calls (and the `GEMINI_API_KEY`) must be moved securely into the Node.js backend (`server.js`) to prevent key leakage.

3. **Affiliate Integration System:** 
   - The app contains settings for eBay, Amazon, and Jumia affiliate IDs. 
   - The future goal is to seamlessly inject these partner tracking parameters when the app recommends auto parts to the user, redirecting commissions directly to their accounts.

4. **Fuel Log Analytics:** 
   - The Garage section contains a `<canvas id="fuelChartCanvas">` that is currently dormant. 
   - A future task is to integrate Chart.js (or a similar lightweight library) to visualize MPG/efficiency over time once the user logs 2+ fuel entries.

5. **Crash Detection Calibration:** 
   - The Drive Mode crash detection algorithm currently uses arbitrary G-force thresholds. 
   - In the future, this algorithm needs refinement to filter out "false positives" (like dropping the phone vs. an actual car crash), possibly adding a user calibration screen.
