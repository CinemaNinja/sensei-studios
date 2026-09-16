const http = require('http');
const fs = require('fs');
const path = require('path');

const PREFERRED_PORT = parseInt(process.env.PORT || '8080', 10);
const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);
  const apiPath = pathname.replace(/\/+$/, '') || '/';

  const SPA_PATHS = new Set([
    '/film',
    '/film/product-animation',
    '/film/real-estate',
    '/film/shows-events',
    '/film/arsenal',
    '/wood',
    '/handpan',
    '/web',
    '/story',
    '/peace-protocol',
    '/peace-protocol/entropy',
    '/peace-protocol/temples',
    '/peace-protocol/initiatives',
    '/protocol',
    '/vision',
    '/estimator',
    '/scope',
    '/contact',
    '/work',
    '/woodwork',
    '/sculptures',
    '/bio'
  ]);
  if (apiPath === '/api/protocol-presence' && (req.method === 'GET' || !req.method)) {
    const payload = {
      ok: true,
      total: 86,
      countryCount: 18,
      daysLive: (() => {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Denver',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).formatToParts(new Date());
        const year = Number(parts.find((part) => part.type === 'year').value);
        const month = Number(parts.find((part) => part.type === 'month').value);
        const day = Number(parts.find((part) => part.type === 'day').value);
        return Math.max(1, Math.round((Date.UTC(year, month - 1, day) - Date.UTC(2026, 8, 1)) / 86400000) + 1);
      })(),
      liveSince: '2026-09-01',
      countries: [
        { code: 'US', n: 31 },
        { code: 'CA', n: 8 },
        { code: 'GB', n: 7 },
        { code: 'DE', n: 6 },
        { code: 'JP', n: 5 },
        { code: 'AU', n: 4 },
        { code: 'BR', n: 4 },
        { code: 'IN', n: 3 },
        { code: 'FR', n: 3 },
        { code: 'MX', n: 3 },
        { code: 'KR', n: 2 },
        { code: 'IT', n: 2 },
        { code: 'NL', n: 2 },
        { code: 'SE', n: 2 },
        { code: 'NZ', n: 1 },
        { code: 'ZA', n: 1 },
        { code: 'KE', n: 1 },
        { code: 'IS', n: 1 }
      ]
    };
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify(payload));
    return;
  }

  if (apiPath === '/api/instagram' && (req.method === 'GET' || !req.method)) {
    const igPath = path.join(ROOT, 'data', 'instagram.json');
    try {
      const data = JSON.parse(fs.readFileSync(igPath, 'utf8'));
      const payload = {
        ok: true,
        username: data.username,
        full_name: data.full_name,
        biography: data.biography,
        followers: data.followers,
        following: data.following,
        posts_count: data.posts_count,
        profile_pic: data.profile_pic,
        url: data.url,
        posts: Array.isArray(data.posts) ? data.posts.slice(0, 6) : []
      };
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      res.end(JSON.stringify(payload));
    } catch {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: 'instagram_unavailable' }));
    }
    return;
  }

  let filePath = path.join(ROOT, pathname);

  if (SPA_PATHS.has(apiPath)) {
    filePath = path.join(ROOT, 'index.html');
  }

  // Security check: ensure path stays within ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Handle directories
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexFile = path.join(filePath, 'index.html');
    if (fs.existsSync(indexFile)) {
      filePath = indexFile;
    }
  }

  // File existence check
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (pathname.startsWith('/api/')) {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true, status: 'mocked' }));
      return;
    }
    const lost = path.join(ROOT, '404.html');
    if (fs.existsSync(lost)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(lost).pipe(res);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

function startServer(port) {
  server.listen(port, '127.0.0.1', () => {
    console.log(`[Sensei Dev Server] Ready at http://127.0.0.1:${port}/ (Directory: ${ROOT})`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PREFERRED_PORT);
