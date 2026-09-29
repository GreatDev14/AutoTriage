const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

const emBtnIndex = html.indexOf("onclick=\"goTo('emergency')\"");
if (emBtnIndex > -1) {
  // We need to inject the drive mode button right BEFORE the `<button class="main-btn emergency-btn" ...>`
  // Let's find the start of the emergency button
  const btnStart = html.lastIndexOf('<button class="main-btn emergency-btn"', emBtnIndex);
  
  if (btnStart > -1 && html.indexOf('drive-btn') === -1) {
    const driveModeBtn = `
    <button class="main-btn drive-btn" onclick="goTo('drive-mode')" style="background: linear-gradient(145deg, rgba(45,190,96,0.15) 0%, rgba(45,190,96,0.02) 100%); border-color: rgba(45,190,96,0.3);">
      <div class="mb-icon-wrap" style="background: rgba(45,190,96,0.2); border-color: rgba(45,190,96,0.4); box-shadow: 0 0 20px rgba(45,190,96,0.3); color: #2DBE60;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><line x1="21.17" y1="8" x2="12" y2="8"></line><line x1="3.95" y1="6.06" x2="8.54" y2="14"></line><line x1="10.88" y1="21.94" x2="15.46" y2="14"></line></svg>
      </div>
      <div class="mb-bottom">
        <div class="mb-title" style="color: #2DBE60;">DRIVE MODE</div>
        <div class="mb-desc">Hands-free background crash & SOS monitor</div>
      </div>
    </button>
`;
    html = html.substring(0, btnStart) + driveModeBtn + html.substring(btnStart);
    fs.writeFileSync('simple.html', html, 'utf8');
    console.log('Drive Mode button injected correctly!');
  } else {
    console.log('Drive mode button already exists or btnStart not found.');
  }
} else {
  console.log('Emergency button not found.');
}
