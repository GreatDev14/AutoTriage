const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createAppIcon(w, h) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const id = Buffer.alloc(13);
  id.writeUInt32BE(w, 0);
  id.writeUInt32BE(h, 4);
  id[8] = 8; id[9] = 2;
  const ihdr = mc('IHDR', id);
  
  const raw = Buffer.alloc(h * (1 + w * 3));
  const cx = w / 2, cy = h / 2;
  
  for (let y = 0; y < h; y++) {
    const ro = y * (1 + w * 3);
    for (let x = 0; x < w; x++) {
      const po = ro + 1 + x * 3;
      const dx = x - cx, dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      let r = 10, g = 10, b = 10;
      
      if (d < w * 0.42) {
        r = 18; g = 18; b = 18;
        
        // Car body
        const carTop = cy - h * 0.12;
        const carBot = cy + h * 0.04;
        const carL = cx - w * 0.28;
        const carR = cx + w * 0.28;
        
        // Roof
        const roofTop = cy - h * 0.22;
        const roofBot = carTop;
        const roofL = cx - w * 0.15;
        const roofR = cx + w * 0.15;
        
        if (y >= roofTop && y <= roofBot && x >= roofL && x <= roofR) {
          r = 240; g = 240; b = 235;
        }
        if (y >= carTop && y <= carBot && x >= carL && x <= carR) {
          r = 240; g = 240; b = 235;
        }
        
        // EKG line
        const lineY = cy + h * 0.12;
        const lineH = Math.max(2, Math.floor(h * 0.012));
        if (x >= carL - w * 0.05 && x <= carR + w * 0.05) {
          const nx = (x - (carL - w * 0.05)) / ((carR + w * 0.05) - (carL - w * 0.05));
          let wave = 0;
          if (nx < 0.2) wave = 0;
          else if (nx < 0.35) wave = Math.sin((nx - 0.2) / 0.15 * Math.PI) * h * 0.08;
          else if (nx < 0.5) wave = -Math.sin((nx - 0.35) / 0.15 * Math.PI) * h * 0.12;
          else if (nx < 0.65) wave = Math.sin((nx - 0.5) / 0.15 * Math.PI) * h * 0.06;
          else wave = 0;
          
          if (Math.abs(y - lineY + wave) <= lineH) {
            r = 230; g = 57; b = 70;
          }
        }
        
        // Circle border
        if (d > w * 0.39) {
          r = 50; g = 50; b = 50;
        }
      }
      
      raw[po] = r;
      raw[po + 1] = g;
      raw[po + 2] = b;
    }
  }
  
  const idat = mc('IDAT', zlib.deflateSync(raw));
  const iend = mc('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

function mc(type, data) {
  const l = Buffer.alloc(4);
  l.writeUInt32BE(data.length);
  const tb = Buffer.from(type, 'ascii');
  const ci = Buffer.concat([tb, data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(c32(ci));
  return Buffer.concat([l, tb, data, c]);
}

function c32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
    }
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// Generate and write
const dir = path.join(__dirname, 'assets');
const f192 = path.join(dir, 'pwa-192.png');
const f512 = path.join(dir, 'pwa-512.png');

console.log('Generating 192x192...');
fs.writeFileSync(f192, createAppIcon(192, 192));
console.log('Generating 512x512...');
fs.writeFileSync(f512, createAppIcon(512, 512));

// Verify
console.log('192 header:', fs.readFileSync(f192).slice(0, 4).toString('hex'), '(' + fs.statSync(f192).size + ' bytes)');
console.log('512 header:', fs.readFileSync(f512).slice(0, 4).toString('hex'), '(' + fs.statSync(f512).size + ' bytes)');
console.log('SUCCESS! Real PNG icons created.');
