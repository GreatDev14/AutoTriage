const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

const phosphorIcons = {
  home: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z"></path></svg>`,
  diagnose: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M216,40H176V32a24,24,0,0,0-48-24H128a24,24,0,0,0-48,24v8H40A16,16,0,0,0,24,56V224a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM96,32a8,8,0,0,1,16-8h32a8,8,0,0,1,16,8v8H96ZM176.49,116.49l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L115,155.85l50.18-50.17a8,8,0,0,1,11.32,11.31Z"></path></svg>`,
  mechanic: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,196.69l-62-62A64.12,64.12,0,0,0,176,96a63.79,63.79,0,0,0-17.75-44.15A23.59,23.59,0,0,0,155,17.91a8,8,0,1,0-9.17,13.22A40,40,0,1,1,133,141.66,8,8,0,0,0,121.66,133,40,40,0,1,1,64,96a39.79,39.79,0,0,1,31.13-39A8,8,0,1,0,91.86,41.25a64,64,0,1,0,29.43,124.06l62,62a21.66,21.66,0,0,0,30.63,0l13.37-13.37A21.66,21.66,0,0,0,227.31,196.69ZM216,227.31a5.66,5.66,0,0,1-8,0l-62-62,21.31-21.31,62,62a5.66,5.66,0,0,1,0,8Z"></path></svg>`,
  ride: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M240,112H227.2l-14.4-43.2A24.08,24.08,0,0,0,190.05,52.48l-123.6-14A24.08,24.08,0,0,0,40.71,58L26.33,112H16a8,8,0,0,0-8,8v64a8,8,0,0,0,8,8H32v16a16,16,0,0,0,16,16H64a16,16,0,0,0,16-16V192H176v16a16,16,0,0,0,16,16h16a16,16,0,0,0,16-16V192h16a8,8,0,0,0,8-8V120A8,8,0,0,0,240,112ZM60,77.29a8,8,0,0,1,8.59-6.83l123.6,14A8,8,0,0,1,199.37,92l6.65,20H51.46ZM64,168a16,16,0,1,1,16-16A16,16,0,0,1,64,168Zm128,0a16,16,0,1,1,16-16A16,16,0,0,1,192,168Z"></path></svg>`,
  garage: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M240,192h-8V98.67a16,16,0,0,0-7.12-13.31l-88-58.67a16,16,0,0,0-17.76,0l-88,58.67A16,16,0,0,0,24,98.67V192H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM40,98.67l88-58.67,88,58.67V192H160V144a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H40ZM144,192H112V144h32Z"></path></svg>`,
  sos: `<svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"></path></svg>`
};

function replaceNavIcon(id, newSvg) {
  const regex = new RegExp(`(<button class="nav-tab[^>]*?id="tab-${id}">[\\s\\S]*?<div class="nav-tab-icon">)[\\s\\S]*?(<\\/div>[\\s\\S]*?<\\/button>)`, 'g');
  html = html.replace(regex, `$1${newSvg}$2`);
}

replaceNavIcon('home', phosphorIcons.home);
replaceNavIcon('diagnose', phosphorIcons.diagnose);
replaceNavIcon('mechanics', phosphorIcons.mechanic);
replaceNavIcon('rides', phosphorIcons.ride);
replaceNavIcon('garage', phosphorIcons.garage);
replaceNavIcon('emergency', phosphorIcons.sos);

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Navigation bar upgraded to premium solid Phosphor icons!');
