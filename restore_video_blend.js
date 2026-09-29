const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// 1. Restore the mix-blend-mode to the video tag to make its black background transparent
html = html.replace(/<video src="bros_amke_the_video_a_loop.mp4" autoplay loop muted playsinline\s*style="([^"]*)"/g, (match, styles) => {
  // Ensure mix-blend-mode is in the style string
  if (!styles.includes('mix-blend-mode:screen;')) {
    return `<video src="bros_amke_the_video_a_loop.mp4" autoplay loop muted playsinline style="${styles}mix-blend-mode:screen;"`;
  }
  return match;
});

// 2. Restore the advanced radial mask to the video container to fade out the edges
html = html.replace(/<div style="width:100%;position:relative;flex-shrink:0;margin-bottom:-16px; ">/g, 
  `<div style="width:100%;position:relative;flex-shrink:0;margin-bottom:-16px; -webkit-mask-image:radial-gradient(ellipse at 50% 65%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%); mask-image:radial-gradient(ellipse at 50% 65%, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%);">`);

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Cinematic video blending and masking restored!');
