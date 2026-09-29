const fs = require('fs');
const html = fs.readFileSync('simple.html', 'utf8');
const idx = html.indexOf("goTo('emergency')");
console.log(html.substring(idx, idx + 1500));
