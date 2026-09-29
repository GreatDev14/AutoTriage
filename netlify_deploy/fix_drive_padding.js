const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

const oldStr = '<div id="drive-mode" class="screen" style="background: #020202;">\n  <div style="display: flex; flex-direction: column; height: 100vh; position: relative; overflow: hidden; padding: 24px;">';
const newStr = '<div id="drive-mode" class="screen" style="background: #020202;">\n  <div style="display: flex; flex-direction: column; height: 100vh; position: relative; overflow: hidden; padding: 24px 24px 100px 24px;">';

if (html.includes(oldStr)) {
  html = html.replace(oldStr, newStr);
  fs.writeFileSync('simple.html', html, 'utf8');
  console.log('Padding updated successfully!');
} else {
  // Let's try regex if exact string failed
  const replaced = html.replace(/<div id="drive-mode" class="screen" style="background: #020202;">\s*<div style="display: flex; flex-direction: column; height: 100vh; position: relative; overflow: hidden; padding: 24px;">/, 
    '<div id="drive-mode" class="screen" style="background: #020202;">\n  <div style="display: flex; flex-direction: column; height: 100vh; position: relative; overflow: hidden; padding: 24px 24px 100px 24px;">'
  );
  if (replaced !== html) {
    fs.writeFileSync('simple.html', replaced, 'utf8');
    console.log('Padding updated successfully via regex!');
  } else {
    console.log('Failed to find the div to replace.');
  }
}
