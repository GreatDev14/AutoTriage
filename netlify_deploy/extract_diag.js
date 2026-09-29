const fs = require('fs');
const html = fs.readFileSync('simple.html', 'utf8');

const s1 = html.indexOf('<div id="diagnose"');
const e1 = html.indexOf('<!-- =====================', s1 + 10);
console.log('--- DIAGNOSE INPUT ---');
console.log(html.substring(s1, e1));

const s2 = html.indexOf('<div id="diag-result"');
const e2 = html.indexOf('<!-- =====================', s2 + 10);
console.log('--- DIAGNOSE RESULT ---');
console.log(html.substring(s2, e2));
