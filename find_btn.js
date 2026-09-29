const fs = require('fs');
const html = fs.readFileSync('simple.html', 'utf8');

const start = html.indexOf("goTo('emergency')");
if (start > -1) {
    console.log(html.substring(start - 200, start + 400));
} else {
    console.log('Emergency button not found.');
}
