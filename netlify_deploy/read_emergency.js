const fs = require('fs');
const html = fs.readFileSync('simple.html', 'utf8');
const lines = html.split('\n');
let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('id="emergency"')) start = i;
  if (start > -1 && i > start && lines[i].includes('<!-- =====================')) {
    end = i;
    break;
  }
}
if (end === -1) end = lines.length;
console.log(lines.slice(start, end).join('\n'));
