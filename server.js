/**
 * Local development server for Nuvio BDIX plugins.
 * Allows testing and loading plugins on the Nuvio app via Wi-Fi.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const MIME_TYPES = {
  '.json': 'application/json; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const urlPath = req.url.split('?')[0];

  // Welcome page
  if (urlPath === '/' || urlPath === '') {
    const ip = getLocalIp();
    const manifestUrl = `http://${ip}:${PORT}/manifest.json`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nuvio BDIX Scrapers</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; max-width: 700px; margin: auto; }
          .card { background: #1e293b; padding: 1.5rem; border-radius: 12px; border: 1px solid #334155; margin-bottom: 1.5rem; }
          code { background: #0f172a; padding: 0.2rem 0.5rem; border-radius: 6px; color: #38bdf8; font-size: 1rem; }
          a { color: #38bdf8; text-decoration: none; }
          ul { line-height: 1.8; }
        </style>
      </head>
      <body>
        <h1>🚀 Nuvio BDIX Providers Server</h1>
        <div class="card">
          <h3>Manifest URL for Nuvio App:</h3>
          <p><code>${manifestUrl}</code></p>
          <p>In Nuvio Settings &rarr; <b>Scrapers / Repositories</b> &rarr; Add this URL.</p>
        </div>
        <div class="card">
          <h3>Available Providers:</h3>
          <ul>
            <li><a href="/providers/circleftp.js">CircleFTP Provider (providers/circleftp.js)</a></li>
            <li><a href="/providers/dflixlive.js">DFLIX.live Provider (providers/dflixlive.js)</a></li>
            <li><a href="/providers/bdix.js">BDIX Aggregator (providers/bdix.js)</a></li>
            <li><a href="/manifest.json">Repository Manifest (manifest.json)</a></li>
          </ul>
        </div>
      </body>
      </html>
    `);
    return;
  }

  // Safe file resolution
  const safeRelativePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safeRelativePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + urlPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  const ip = getLocalIp();
  console.log(`\n======================================================`);
  console.log(`🚀 Nuvio BDIX Server is running!`);
  console.log(`------------------------------------------------------`);
  console.log(`📡 Local Network URL: http://${ip}:${PORT}/`);
  console.log(`📋 Nuvio Manifest:    http://${ip}:${PORT}/manifest.json`);
  console.log(`======================================================\n`);
});
