const fs = require('fs');
const html = fs.readFileSync('simple.html', 'utf8');

const rideStart = html.indexOf('<div id="rides" class="screen">');
const emergencyStart = html.indexOf('<div id="emergency" class="screen">');

if (rideStart > -1 && emergencyStart > -1) {
  const rideHtml = html.substring(rideStart, emergencyStart);
  fs.writeFileSync('ride_diag.txt', rideHtml, 'utf8');
  console.log('Ride section extracted.');
} else {
  console.log('Could not find ride section markers.');
}
