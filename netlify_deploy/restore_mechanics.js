const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// 1. Revert the bad module replacement
const badPatchStr = "MechanicsModule && MechanicsModule.render ? MechanicsModule.render(typeof MECHS !== 'undefined' ? MECHS : (typeof ALL_MECHANICS !== 'undefined' ? ALL_MECHANICS : [])) : console.log('Mechanics module not ready')";
html = html.split(badPatchStr).join('renderMechs(getMechs())');

// 2. Add premium SVGs to the empty states in renderMechs()
// Offline icon
html = html.replace(/<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 32px;">.*?<\/div>/,
  `<div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E63946" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg></div>`
);

// Searching icon
html = html.replace(/<div style="font-size:32px;margin-bottom:12px;animation: pulse 1\.5s infinite;">.*?<\/div>/,
  `<div style="font-size:32px;margin-bottom:12px;animation: pulse 1.5s infinite;display:flex;justify-content:center;"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>`
);

// No mechanics found icon
html = html.replace(/<div style="font-size:32px;margin-bottom:12px;">.*?<\/div>\s*No real auto repair shops registered on the map/,
  `<div style="font-size:32px;margin-bottom:12px;display:flex;justify-content:center;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E63946" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></div>\n          No real auto repair shops registered on the map`
);

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Mechanic rendering logic reverted to global renderMechs(), and premium SVGs injected!');
