const fs = require('fs');
const html = fs.readFileSync('simple.html', 'utf8');
const idx = html.indexOf('undefined');
let log = "Index of undefined: " + idx + "\n";
if (idx > -1) {
  log += "Context of undefined:\n" + html.substring(idx - 50, idx + 50) + "\n\n";
}

const emergencyMatch = html.match(/<button[^>]*goTo\('emergency'\)[^>]*>[\s\S]*?<\/button>/);
if (emergencyMatch) {
  log += "Emergency Button HTML:\n" + emergencyMatch[0] + "\n";
}

fs.writeFileSync('diag.txt', log, 'utf8');
