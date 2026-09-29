const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

const targetStr = "'YOUR_GEMINI_API_KEY_HERE'";
const replacementStr = "'YOUR_GEMINI_API_KEY'";

html = html.replaceAll(targetStr, replacementStr);
fs.writeFileSync('simple.html', html, 'utf8');

console.log('API key injected successfully!');
