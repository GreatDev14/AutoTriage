const fs = require('fs');
const html = fs.readFileSync('simple.html', 'utf8');
const idx = html.indexOf('drive-btn');
if (idx > -1) {
  console.log('Button found at', idx);
  console.log(html.substring(idx - 100, idx + 200));
} else {
  console.log('Button NOT found');
}
