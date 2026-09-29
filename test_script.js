const fs = require('fs');
const html = fs.readFileSync('simple.html', 'utf8');

const sOpen = html.lastIndexOf('<script>');
const sClose = html.indexOf('</script>', sOpen) + 9;
const scriptText = html.substring(sOpen + 8, sClose - 9);

try {
  const vm = require('vm');
  vm.runInNewContext(scriptText, { 
    window: { goTo: function(){} }, 
    document: { getElementById: function(){ return { classList: { contains: function(){} }}; } }, 
    navigator: {}, 
    console: console, 
    DeviceMotionEvent: {}, 
    setTimeout: setTimeout, 
    setInterval: setInterval, 
    clearInterval: clearInterval, 
    Math: Math, 
    userAddr: '', 
    userCity: '',
    toggleVoiceSOS: function(){}
  });
  console.log('Script parsed and ran without syntax errors.');
} catch (e) {
  console.error('Script error:', e);
}
