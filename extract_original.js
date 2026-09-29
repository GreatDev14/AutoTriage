const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const start = html.indexOf('<div id="rides"');
if (start > -1) {
  const end = html.indexOf('<div id="emergency"', start);
  if (end > -1) {
    fs.writeFileSync('original_rides.txt', html.substring(start, end).substring(0, 2500));
    console.log('Original Rides HTML extracted.');
  }
}
