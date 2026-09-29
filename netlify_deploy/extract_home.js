const fs = require('fs');
const html = fs.readFileSync('simple.html', 'utf8');

const homeStart = html.indexOf('<div id="home" class="screen active">');
if (homeStart === -1) {
    const backupStart = html.indexOf('<div id="home"');
    if (backupStart > -1) {
        const nextScreen = html.indexOf('<div id="', backupStart + 10);
        fs.writeFileSync('scratch/home_html.txt', html.substring(backupStart, nextScreen > -1 ? nextScreen : backupStart + 2000));
        console.log('Saved to scratch/home_html.txt');
    }
} else {
    const nextScreen = html.indexOf('<div id="', homeStart + 10);
    fs.writeFileSync('scratch/home_html.txt', html.substring(homeStart, nextScreen > -1 ? nextScreen : homeStart + 2000));
    console.log('Saved to scratch/home_html.txt');
}
