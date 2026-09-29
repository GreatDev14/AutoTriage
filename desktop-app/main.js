const { app, BrowserWindow, shell, ipcMain, nativeTheme, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');

// Keep a global reference to prevent garbage collection
let mainWindow;
let splashWindow;
let localServer = null;
let serverPort = 0;

// ─── Find a free port ────────────────────────────────────────────────────────
function getFreePort() {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  });
}

// ─── Determine the root folder of the app files ──────────────────────────────
function getAppRoot() {
  // Production: files bundled into resources/app/
  const bundledPath = path.join(process.resourcesPath, 'app');
  if (fs.existsSync(path.join(bundledPath, 'simple.html'))) return bundledPath;

  // Dev: relative to desktop-app/../
  const devPaths = [
    path.resolve(__dirname, '..'),
    'C:\\Users\\HP\\AutoTriage',
    'C:\\Users\\HP\\OneDrive\\Documents\\PROJECTS1\\AutoTriage'
  ];
  for (const p of devPaths) {
    if (fs.existsSync(path.join(p, 'simple.html'))) return p;
  }
  return null;
}

// ─── Simple static HTTP server ───────────────────────────────────────────────
function startLocalServer(rootDir) {
  return new Promise(async (resolve, reject) => {
    const port = await getFreePort();

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

    localServer = http.createServer((req, res) => {
      // Default to simple.html
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/simple.html';

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
                  res.writeHead(this.statusCode || 200, this.headers);
                  res.end(JSON.stringify(data));
                },
                send: function(data) {
                  res.writeHead(this.statusCode || 200, this.headers);
                  res.end(data);
                },
                end: function() {
                  res.writeHead(this.statusCode || 200, this.headers);
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

      // Default static routing
      let filePath = path.join(__dirname, urlPath.replace(/\//g, path.sep));
      if (!fs.existsSync(filePath)) {
        // Then check the app root
        filePath = path.join(rootDir, urlPath.replace(/\//g, path.sep));
      }

      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';

      // Security: only serve within rootDir or __dirname
      if (!filePath.startsWith(rootDir) && !filePath.startsWith(__dirname)) {
        res.writeHead(403); res.end('Forbidden'); return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404); res.end('Not found: ' + urlPath); return;
        }
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      });
    });

    localServer.listen(port, '127.0.0.1', () => {
      serverPort = port;
      console.log(`Local server running at http://127.0.0.1:${port}`);
      resolve(port);
    });

    localServer.on('error', reject);
  });
}

// ─── Splash screen ───────────────────────────────────────────────────────────
function createSplash(port) {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 540,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    skipTaskbar: true,
    icon: path.join(__dirname, 'assets', 'logo.ico'),
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  if (port) {
    splashWindow.loadURL(`http://127.0.0.1:${port}/splash.html`);
  } else {
    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  }
  splashWindow.on('closed', () => { splashWindow = null; });
}

// ─── Main window ─────────────────────────────────────────────────────────────
function createMainWindow(port) {
  mainWindow = new BrowserWindow({
    width: 430,
    height: 870,
    minWidth: 360,
    minHeight: 640,
    resizable: false,
    show: false,
    center: true,
    title: 'AutoTriage',
    icon: path.join(__dirname, 'assets', 'logo.ico'),
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  mainWindow.setMenuBarVisibility(false);

  const appUrl = `http://127.0.0.1:${port}/app.html?standalone=true`;
  console.log('Loading:', appUrl);
  mainWindow.loadURL(appUrl);

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow) splashWindow.close();
      mainWindow.show();
      mainWindow.focus();
    }, 1800);
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith('http://127.0.0.1')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  nativeTheme.themeSource = 'dark';

  const appRoot = getAppRoot();

  if (appRoot) {
    try {
      const port = await startLocalServer(appRoot);
      createSplash(port);
      createMainWindow(port);
    } catch (err) {
      console.error('Server error:', err);
      // Fallback to live URL
      createSplash();
      createMainWindow(null);
    }
  } else {
    // No local files found - use live URL
    console.log('No local files found, using live URL');
    createSplash();
    // Load live site directly
    mainWindow = new BrowserWindow({
      width: 1280, height: 800, show: false,
      icon: path.join(__dirname, 'assets', 'logo.ico'),
      backgroundColor: '#0a0a0a',
      webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
    });
    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadURL('https://autotriage.ng/simple.html?standalone=true');
    mainWindow.once('ready-to-show', () => {
      setTimeout(() => { if (splashWindow) splashWindow.close(); mainWindow.show(); }, 1800);
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow(serverPort);
  });
});

app.on('window-all-closed', () => {
  if (localServer) localServer.close();
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('minimize-window', () => mainWindow?.minimize());
ipcMain.handle('maximize-window', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('close-window', () => mainWindow?.close());
