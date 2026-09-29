const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// Strip out the aggressive mask-image rules from the video container that might be causing mobile safari to hide it
html = html.replace(/-webkit-mask-image:radial-gradient[^;]+;\s*mask-image:radial-gradient[^;]+;/g, '');

// Also, let's remove the mix-blend-mode just to be absolutely sure the video is completely visible
html = html.replace(/mix-blend-mode:screen;/g, '');

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Video container masking removed to fix iOS visibility issues.');
