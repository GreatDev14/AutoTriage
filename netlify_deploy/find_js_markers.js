const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

const s1 = html.indexOf('async function runDiagnosis() {');
const s2 = html.indexOf('// ---- LOCATION ----');
const s3 = html.indexOf('// ---- DRIVE MODE ----');
const s4 = html.indexOf('function toggleVoiceSOS');

console.log('runDiagnosis:', s1);
console.log('LOCATION:', s2);
console.log('DRIVE MODE:', s3);
console.log('toggleVoiceSOS:', s4);
