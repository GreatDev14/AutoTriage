const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// 1. Modify toggleVoiceSOS to accept forceOn
html = html.replace(/function toggleVoiceSOS\(\) \{/, 'function toggleVoiceSOS(forceOn = false) {\n    if (forceOn && voiceSosActive) return;');

// Also handle the case where they are turning it off, but forceOn is true
html = html.replace(/if \(!voiceSosActive\) \{/, 'if (!voiceSosActive || forceOn) {');

// 2. Modify goTo to auto-trigger the voice SOS
const goToStart = html.indexOf("function goTo(screen) {");
const activeLine = html.indexOf("newScreen.classList.add('active');", goToStart);

if (goToStart > -1 && activeLine > -1) {
  const injection = `
  // Auto-Start Voice SOS if entering Emergency Screen
  if (screen === 'emergency') {
    setTimeout(() => {
      if (typeof toggleVoiceSOS === 'function') {
        toggleVoiceSOS(true);
      }
    }, 600); // Wait for screen transition to finish
  } else {
    // Optionally turn it off if they leave the screen to save battery
    // if (typeof voiceSosActive !== 'undefined' && voiceSosActive && typeof toggleVoiceSOS === 'function') {
    //   toggleVoiceSOS();
    // }
  }
  `;
  
  html = html.substring(0, activeLine + 34) + injection + html.substring(activeLine + 34);
}

fs.writeFileSync('simple.html', html, 'utf8');
console.log("Auto-start Voice SOS injected successfully into navigation core!");
