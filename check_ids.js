const fs = require('fs');
const html = fs.readFileSync('simple.html', 'utf8');
console.log('toggleVoiceBtn:', html.includes('id="toggleVoiceBtn"'));
console.log('voiceSosIconWrap:', html.includes('id="voiceSosIconWrap"'));
console.log('voiceSosBox:', html.includes('id="voiceSosBox"'));
