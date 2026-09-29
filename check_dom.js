const fs = require('fs');
const html = fs.readFileSync('simple.html', 'utf8');
const idStr = 'id="drive-mode"';
console.log('Index of id="drive-mode":', html.indexOf(idStr));
console.log('Index of Drive Mode button:', html.indexOf('drive-btn'));
