const fs = require('fs');
const html = fs.readFileSync('simple.html', 'utf8');

const start = html.indexOf('<div class="mb-grid">');
if (start > -1) {
    console.log(html.substring(start, start + 1500));
} else {
    // try to find where the emergency button is
    const emBtn = html.indexOf('onclick="goTo(\\\'emergency\\\')"');
    if (emBtn === -1) {
      const emBtn2 = html.indexOf("onclick=\"goTo('emergency')\"");
      if (emBtn2 > -1) {
        console.log(html.substring(emBtn2 - 200, emBtn2 + 1000));
      }
    }
}
