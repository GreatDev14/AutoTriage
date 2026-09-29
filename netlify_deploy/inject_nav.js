const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

const navHtml = `
<nav class="bottom-nav">
  <button class="nav-tab active" onclick="goTo('home')" id="tab-home">
    <div class="nav-tab-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></div>
    <div>Home</div>
  </button>
  <button class="nav-tab" onclick="goTo('diagnose')" id="tab-diagnose">
    <div class="nav-tab-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg></div>
    <div>Diagnose</div>
  </button>
  <button class="nav-tab" onclick="goTo('mechanics')" id="tab-mechanics">
    <div class="nav-tab-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg></div>
    <div>Mechanic</div>
  </button>
  <button class="nav-tab" onclick="goTo('rides')" id="tab-rides">
    <div class="nav-tab-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg></div>
    <div>Ride</div>
  </button>
  <button class="nav-tab" onclick="goTo('garage')" id="tab-garage">
    <div class="nav-tab-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12h3v8h14v-8h3L12 2zm3 10v6h-6v-6h6z"/></svg></div>
    <div>Garage</div>
  </button>
  <button class="nav-tab emergency-tab" onclick="goTo('emergency')" id="tab-emergency">
    <div class="nav-tab-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
    <div>SOS</div>
  </button>
</nav>`;

const targetHtml = '</div><!-- /#app-content -->';
const appContentIdx = html.indexOf(targetHtml);

if (appContentIdx !== -1) {
  // Find the 'undefined' string that appears shortly after app-content
  const undefinedIdx = html.indexOf('undefined', appContentIdx);
  if (undefinedIdx !== -1 && undefinedIdx < appContentIdx + 200) {
    // Replace 'undefined' with the navigation bar HTML
    html = html.substring(0, undefinedIdx) + navHtml + html.substring(undefinedIdx + 9);
    fs.writeFileSync('simple.html', html, 'utf8');
    console.log('Successfully replaced undefined with the navigation bar!');
  } else {
    console.log('Error: Could not find undefined string near app-content.');
  }
} else {
  console.log('Error: Could not find app-content marker.');
}
