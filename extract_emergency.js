const fs = require('fs');
const html = fs.readFileSync('simple.html', 'utf8');
const lines = html.split('\n');
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('id="emergency"')) {
    startIdx = i;
  }
  if (startIdx !== -1 && i > startIdx && lines[i].includes('id="settings"')) {
    endIdx = i;
    break;
  }
}

console.log(lines.slice(startIdx - 5, endIdx).join('\n'));
