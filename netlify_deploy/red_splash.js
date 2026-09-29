const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// Isolate the splash screen part so we don't accidentally replace colors elsewhere in the app
const splashStart = html.indexOf('<!-- EMERALD PRESTIGE SPLASH SCREEN V5');
const splashEnd = html.indexOf('</script>', splashStart) + 9;

if (splashStart > -1) {
  let splashHTML = html.substring(splashStart, splashEnd);
  
  // Swap all the green back to Crimson Red
  splashHTML = splashHTML.replace(/#2DBE60/g, '#E63946'); // Solid hex
  splashHTML = splashHTML.replace(/rgba\(45,\s*190,\s*96/g, 'rgba(230, 57, 70'); // rgba versions
  
  // Rename the comment just for cleanliness
  splashHTML = splashHTML.replace('EMERALD PRESTIGE', 'CRIMSON PRESTIGE');
  
  html = html.substring(0, splashStart) + splashHTML + html.substring(splashEnd);
  
  fs.writeFileSync('simple.html', html, 'utf8');
  console.log('Splash screen colors successfully reverted to Crimson Red!');
} else {
  console.log('Could not find splash screen block');
}
