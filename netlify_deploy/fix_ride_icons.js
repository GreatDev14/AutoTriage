const fs = require('fs');
let html = fs.readFileSync('simple.html', 'utf8');

const uberSvg = `<svg viewBox="0 0 24 24" fill="white" style="width:30px;height:30px;"><path d="M20.52 14.28V9.72c0-3.32-1.92-5-4.88-5-2.36 0-4 1.12-4.68 2.8V4.84H7.52v11.76h3.44v-5.76c0-1.8.84-2.76 2.36-2.76 1.48 0 2.2.84 2.2 2.48v6h3.44v-2.28zM3.48 6.44h3.44V3H3.48v3.44zM3.48 16.6h3.44V9.6H3.48v7z"/></svg>`;
const lyftSvg = `<svg viewBox="0 0 24 24" fill="white" style="width:30px;height:30px;"><path d="M20.25 10.66v-1.1c0-1.85-1.5-3.35-3.35-3.35H12v6.4l-3.32-3.3c-.65-.65-1.72-.65-2.37 0l-3.66 3.65c-.65.65-.65 1.72 0 2.37.65.65 1.72.65 2.37 0l2.48-2.47v4.44c0 1.85 1.5 3.35 3.35 3.35h8.05c1.85 0 3.35-1.5 3.35-3.35v-6.64h-2zm-3.8 4.45c-.94 0-1.7-.76-1.7-1.7s.76-1.7 1.7-1.7 1.7.76 1.7 1.7-.76 1.7-1.7 1.7z"/></svg>`;
const grabSvg = `<svg viewBox="0 0 24 24" fill="white" style="width:30px;height:30px;"><path d="M16.594 11.233c-.156-.226-.37-.367-.654-.428-.284-.06-.576.014-.803.176L3.922 19.34l3.15-5.918c-.37.042-.743.08-1.12.115-.658.06-1.325.105-2.002.13-1.074.04-1.925.044-2.552.016 1.258-2.616 3.177-5.07 5.753-7.362L.055 3.864c1.602.822 4.1 1.705 7.493 2.65 3.393.946 6.812 1.638 10.255 2.079.232.03.447.13.647.3.2.17.318.396.353.68l.4 3.25a65.34 65.34 0 0 1 4.793-1.637l-7.4-1.028v.575z"/></svg>`;

html = html.replace(/<img src="https:\/\/cdn\.simpleicons\.org\/uber[^>]*\/>/g, uberSvg);
html = html.replace(/<img src="https:\/\/cdn\.simpleicons\.org\/lyft[^>]*\/>/g, lyftSvg);
html = html.replace(/<img src="https:\/\/cdn\.simpleicons\.org\/grab[^>]*\/>/g, grabSvg);

fs.writeFileSync('simple.html', html, 'utf8');
console.log('Provider icons upgraded to inline SVGs!');
