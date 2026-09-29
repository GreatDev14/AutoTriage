const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// The magical iOS video bypass script
const videoBypassScript = `
<script>
// iOS Safari Byte-Range Bypass for local dev servers
document.addEventListener("DOMContentLoaded", () => {
  const vids = document.querySelectorAll('video');
  vids.forEach(vid => {
    const originalSrc = vid.getAttribute('src');
    if (originalSrc && originalSrc.endsWith('.mp4')) {
      vid.removeAttribute('src'); // Stop the browser from trying to stream it
      fetch(originalSrc)
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.blob();
        })
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          vid.src = blobUrl;
          vid.play().catch(e => console.log('Autoplay blocked by iOS low power mode:', e));
        })
        .catch(err => {
          console.log('Failed to blob fetch video:', err);
          vid.src = originalSrc; // Fallback
        });
    }
  });
});
</script>
`;

// Inject the script right before the closing </body> tag
html = html.replace(/<\/body>/, videoBypassScript + '\n</body>');

fs.writeFileSync('simple.html', html, 'utf8');
console.log('iOS Safari Video Bypass script injected!');
