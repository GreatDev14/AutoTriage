const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const envFile = path.join(rootDir, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  });
}

const PORT = process.env.PORT || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mp3':  'audio/mpeg',
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());
  let urlPath = parsedUrl.pathname;
  if (urlPath === '/') urlPath = '/index.html';

  // --- NETLIFY FUNCTIONS HANDLER ---
  if (urlPath.startsWith('/.netlify/functions/')) {
    const fnName = urlPath.replace('/.netlify/functions/', '').split('?')[0];
    const fnFile = path.join(rootDir, 'netlify', 'functions', fnName + '.js');
    if (fs.existsSync(fnFile)) {
      try {
        delete require.cache[require.resolve(fnFile)];
        const { handler } = require(fnFile);
        let bodyData = '';
        req.on('data', chunk => bodyData += chunk.toString());
        req.on('end', async () => {
          const event = {
            httpMethod: req.method,
            path: urlPath,
            queryStringParameters: req.query,
            headers: req.headers,
            body: bodyData
          };
          try {
            console.log(`[Local Server] Invoking Netlify function: ${fnName}`);
            const result = await handler(event, {});
            res.writeHead(result.statusCode || 200, result.headers || { 'Content-Type': 'application/json' });
            res.end(result.body || '');
          } catch (err) {
            console.error('[Local Server] Netlify function error:', err);
            // Fallback for local development
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Local fallback dispatch' }));
          }
        });
        return;
      } catch (err) {
        console.error('[Local Server] Failed to load function:', err);
      }
    }
  }

  // --- API ROUTE HANDLER (Vercel Simulation) ---
  if (urlPath.startsWith('/api/')) {
    const apiFile = path.join(rootDir, urlPath.replace(/\//g, path.sep) + '.js');
    if (fs.existsSync(apiFile)) {
      try {
        // Clear require cache for dev reloading
        delete require.cache[require.resolve(apiFile)];
        const handler = require(apiFile);
        
        // Collect body data
        let bodyData = '';
        req.on('data', chunk => bodyData += chunk.toString());
        req.on('end', async () => {
          if (bodyData) {
            try { req.body = JSON.parse(bodyData); } catch (e) { req.body = bodyData; }
          }
          
          // Mock Vercel Response object
          const mockRes = {
            statusCode: 200,
            headers: {},
            setHeader: function(name, value) {
              this.headers[name] = value;
              return this;
            },
            status: function(code) {
              this.statusCode = code;
              return this;
            },
            json: function(data) {
              this.setHeader('Content-Type', 'application/json');
              res.writeHead(this.statusCode, this.headers);
              res.end(JSON.stringify(data));
            },
            send: function(data) {
              res.writeHead(this.statusCode, this.headers);
              res.end(data);
            },
            end: function() {
              res.writeHead(this.statusCode, this.headers);
              res.end();
            }
          };
          
          try {
            await handler(req, mockRes);
          } catch (err) {
            console.error('API Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
          }
        });
      } catch (err) {
        console.error('Failed to load API route:', err);
        res.writeHead(500); res.end('API Load Error');
      }
      return;
    }
  }

  // Rewrite logic matching vercel.json
  let filePath = path.join(rootDir, urlPath.replace(/\//g, path.sep));
  if (!fs.existsSync(filePath)) {
    // Check if appending .html works
    const htmlPath = filePath + '.html';
    if (fs.existsSync(htmlPath)) {
      filePath = htmlPath;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + urlPath);
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  if (process.env.IS_CLUSTER_WORKER !== 'true') {
    console.log(`\n====================================================`);
    console.log(`🚀 AUTOTRIAGE SERVER ACTIVE`);
    console.log(`🌐 Running locally at http://localhost:${PORT}`);
    console.log(`📂 Document root: ${rootDir}`);
    console.log(`====================================================\n`);
  }
});
