const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

// 1. Strip garbage characters (preserving the ones we intentionally injected)
html = html.replace(/[^\x00-\x7F]+/g, (match) => {
  if (match.includes('🔧') || match.includes('👨') || match.includes('👩') || match.includes('📍')) return match;
  return '';
});

// 2. Put emojis back in the main buttons
html = html.replace(/<button class="main-btn" onclick="goTo\('diagnose'\)">\s*<div class="mb-icon-wrap"><\/div>/g, '<button class="main-btn" onclick="goTo(\'diagnose\')">\n      <div class="mb-icon-wrap">🩺</div>');
html = html.replace(/<button class="main-btn" onclick="goTo\('mechanics'\)">\s*<div class="mb-icon-wrap"><\/div>/g, '<button class="main-btn" onclick="goTo(\'mechanics\')">\n      <div class="mb-icon-wrap">👨🏾‍🔧</div>');

// Put emojis back in the top widgets
html = html.replace(/<div class="gw-icon"><\/div>/g, '<div class="gw-icon">🚘</div>');
html = html.replace(/<div class="pp-icon"><\/div>/g, '<div class="pp-icon">💰</div>');
html = html.replace(/<div class="mr-icon"><\/div>/g, '<div class="mr-icon">🚕</div>');

// 3. Remove nav indicator DOM element
html = html.replace(/<div class="nav-indicator" id="navIndicator"><\/div>/g, '');

// 4. Update CSS for nav-tab to match SeenU style
const cssSearch = /\.bottom-nav \{\s*position:fixed; bottom:16px;[\s\S]*?\.nav-tab\.emergency-tab\.active \.nav-tab-icon \{ color: var\(--accent\); \}/;

const newCss = `.bottom-nav {
      position:fixed; bottom:0px; left:0px; right:0px; z-index:100;
      background: var(--bg); /* Keep background to prevent content scrolling behind it */
      border-top: 1px solid rgba(255,255,255,0.05);
      display:grid; grid-template-columns:repeat(6,1fr); padding: 12px 6px 24px;
      top: auto; height: auto;
    }
    .nav-tab { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:4px 2px; border:none; background:transparent; color:#8e93a0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:10px; font-weight: 500; transition:all 0.3s; cursor:pointer; }
    .nav-tab.active { color:#ff5b77; } /* SeenU Pink */
    .nav-tab-icon { display:flex; align-items:center; justify-content:center; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .nav-tab.active .nav-tab-icon { transform: translateY(-2px) scale(1.1); color: #ff5b77; }
    .nav-tab svg { width:24px; height:24px; fill:currentColor; }`;

html = html.replace(cssSearch, newCss);

// 5. Fix up the "Back" buttons which got their emojis stripped
// The original was `<button class="back-btn" onclick="goTo('home')">??</button>` (or empty)
html = html.replace(/<button class="back-btn" onclick="goTo\('home'\)">(.*?)<\/button>/g, `<button class="back-btn" onclick="goTo('home')"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg></button>`);

// Write it out
fs.writeFileSync('simple.html', html, 'utf8');
console.log('Sanitization and redesign complete.');
