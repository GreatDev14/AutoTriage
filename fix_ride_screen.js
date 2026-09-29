const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// 1. Restore the spinning car inside the searching animation
html = html.replace(/<div class="text-3xl mb-3 animate-spin inline-block"><\/div>/g, '<div class="text-3xl mb-3 animate-spin inline-block">🚕</div>');

// 2. Fix the scrolling issue on the Ride screen
// Original: <div class="screen-body relative h-full w-full" style="padding:0; overflow:hidden; background:#000000;">
html = html.replace(/<div class="screen-body relative h-full w-full" style="padding:0; overflow:hidden; background:#000000;">/g, '<div class="screen-body relative h-full w-full" style="padding:0; overflow-y:auto; overflow-x:hidden; padding-bottom:120px; background:#000000;">');

// 3. Make sure the VIP showcase container also allows scrolling if it's an overlay
html = html.replace(/<div id="mobVipShowcase" class="absolute inset-0 z-50 flex flex-col items-center overflow-y-auto transition-all duration-700" style="padding:12px 12px 28px;/g, '<div id="mobVipShowcase" class="absolute inset-0 z-50 flex flex-col items-center overflow-y-auto transition-all duration-700" style="padding:12px 12px 120px;');


fs.writeFileSync('simple.html', html, 'utf8');
console.log('Ride section fixed: Scrolling enabled & rotating car restored!');
