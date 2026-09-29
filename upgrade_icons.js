const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// The new sleek outline SVG templates
const svgWrapper = (path) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

const icons = {
  home: svgWrapper(`<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`),
  diagnose: svgWrapper(`<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/><path d="M12 11v6"/><path d="M9 14h6"/>`),
  mechanic: svgWrapper(`<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`),
  ride: svgWrapper(`<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>`),
  garage: svgWrapper(`<path d="M3 21V8l9-4 9 4v13"/><path d="M21 21H3"/><path d="M12 21v-7"/><path d="M12 14h4v7"/>`),
  parts: svgWrapper(`<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>`),
  sos: svgWrapper(`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`)
};

const newNav = `
<nav class="bottom-nav">
  <button class="nav-tab active" onclick="goTo('home')" id="tab-home">
    <div class="nav-tab-icon">${icons.home}</div>
    <div>Home</div>
  </button>
  <button class="nav-tab" onclick="goTo('diagnose')" id="tab-diagnose">
    <div class="nav-tab-icon">${icons.diagnose}</div>
    <div>Diagnose</div>
  </button>
  <button class="nav-tab" onclick="goTo('mechanics')" id="tab-mechanics">
    <div class="nav-tab-icon">${icons.mechanic}</div>
    <div>Mechanic</div>
  </button>
  <button class="nav-tab" onclick="goTo('rides')" id="tab-rides">
    <div class="nav-tab-icon">${icons.ride}</div>
    <div>Ride</div>
  </button>
  <button class="nav-tab" onclick="goTo('garage')" id="tab-garage">
    <div class="nav-tab-icon">${icons.garage}</div>
    <div>Garage</div>
  </button>
  <button class="nav-tab emergency-tab" onclick="goTo('emergency')" id="tab-emergency">
    <div class="nav-tab-icon">${icons.sos}</div>
    <div>SOS</div>
  </button>
</nav>`;

// 1. Replace the entire bottom-nav structure
html = html.replace(/<nav class="bottom-nav">[\s\S]*?<\/nav>/, newNav);

// 2. Fix the CSS for the bottom nav so it's absolutely flush to the bottom and respects iOS safe areas
html = html.replace(/padding: 12px 6px 24px;/, 'padding: 12px 6px calc(env(safe-area-inset-bottom) + 8px);');
html = html.replace(/border-top: 1px solid rgba\(255,255,255,0.05\);/, 'border-top: 1px solid rgba(255,255,255,0.03);\n      backdrop-filter: blur(20px);\n      background: rgba(10, 10, 12, 0.85);');

// 3. Inject these same exact SVGs into the main buttons!
// For robust matching, we find the onclick and replace the icon wrap inside it.
function replaceMainBtnIcon(action, svg) {
  const regex = new RegExp(`(<button[^>]*onclick="goTo\\('${action}'\\)"[^>]*>[\\s\\S]*?<div class="mb-icon-wrap">)[\\s\\S]*?(<\\/div>)`, 'g');
  html = html.replace(regex, `$1${svg}$2`);
}

replaceMainBtnIcon('diagnose', icons.diagnose);
replaceMainBtnIcon('mechanics', icons.mechanic);
replaceMainBtnIcon('rides', icons.ride);
replaceMainBtnIcon('parts', icons.parts);
replaceMainBtnIcon('emergency', icons.sos);

// 4. Update the 3 small widgets at the top too (My Garage, Diagnoses, Parts Pricing)
html = html.replace(/<div class="gw-icon">[\s\S]*?<\/div>/g, `<div class="gw-icon">${icons.garage}</div>`);
html = html.replace(/<div class="pp-icon">[\s\S]*?<\/div>/g, `<div class="pp-icon">${icons.parts}</div>`);
// There's a 'Diagnoses' widget which might be a different class, let's just make sure all widgets look uniform.
// If it's a standard text emoji in the HTML, we'll swap it to SVG.
// Actually, earlier the user showed "MY GARAGE", "DIAGNOSES", "PARTS PRICING".
html = html.replace(/<div class="mr-icon">[\s\S]*?<\/div>/g, `<div class="mr-icon">${icons.ride}</div>`);

// Give mb-icon-wrap a slightly softer background since we are using outline SVGs
html = html.replace(/\.mb-icon-wrap \{([\s\S]*?)\}/, (match, inner) => {
  return `.mb-icon-wrap {` + inner + ` color: var(--fg); }`;
});

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Premium SVG icons and iOS safe-area layout injected!');
