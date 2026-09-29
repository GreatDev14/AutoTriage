const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// Replace the phantom function call with the correct module rendering logic
const badCall = /renderMechs\(getMechs\(\)\)/g;
const correctCall = "MechanicsModule && MechanicsModule.render ? MechanicsModule.render(typeof MECHS !== 'undefined' ? MECHS : (typeof ALL_MECHANICS !== 'undefined' ? ALL_MECHANICS : [])) : console.log('Mechanics module not ready')";

html = html.replace(badCall, correctCall);

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Mechanics rendering logic successfully patched!');
