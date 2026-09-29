const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

html = html.replace('function fetchGlobalMechanics(lat, lng) {', 'async function fetchGlobalMechanics(lat, lng) {');

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Fixed async fetchGlobalMechanics syntax error.');
