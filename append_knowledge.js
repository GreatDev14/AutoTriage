const fs = require('fs');

const additionalInfo = `
## 🔮 FUTURE ROADMAP & UNFINISHED BUSINESS

Based on our past conversations and a scan of the codebase architecture, here are the outstanding tasks and future goals for the AutoTriage project:

1. **Desktop vs. Mobile Parity:** 
   - The project consists of a laptop version (\`js/desktop.js\`) and a mobile version (\`simple.html\`). 
   - A continuous future task is ensuring new AI features (like the diagnostic history sync we recently built) are mirrored perfectly across both platforms.

2. **Backend API Security:** 
   - Currently, the Gemini API is being called directly from the client side. 
   - For a production launch, the API calls (and the \`GEMINI_API_KEY\`) must be moved securely into the Node.js backend (\`server.js\`) to prevent key leakage.

3. **Affiliate Integration System:** 
   - The app contains settings for eBay, Amazon, and Jumia affiliate IDs. 
   - The future goal is to seamlessly inject these partner tracking parameters when the app recommends auto parts to the user, redirecting commissions directly to their accounts.

4. **Fuel Log Analytics:** 
   - The Garage section contains a \`<canvas id="fuelChartCanvas">\` that is currently dormant. 
   - A future task is to integrate Chart.js (or a similar lightweight library) to visualize MPG/efficiency over time once the user logs 2+ fuel entries.

5. **Crash Detection Calibration:** 
   - The Drive Mode crash detection algorithm currently uses arbitrary G-force thresholds. 
   - In the future, this algorithm needs refinement to filter out "false positives" (like dropping the phone vs. an actual car crash), possibly adding a user calibration screen.
`;

let md = fs.readFileSync('AUTOTRIAGE_PROJECT_KNOWLEDGE.md', 'utf8');
md += additionalInfo;
fs.writeFileSync('AUTOTRIAGE_PROJECT_KNOWLEDGE.md', md, 'utf8');
console.log("Appended future roadmap to knowledge base.");
