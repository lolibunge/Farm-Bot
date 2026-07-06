// Local dev server — bypasses vercel dev and its cloud env injection.
// Usage: node --env-file=.env.ercilia scripts/dev-local.js [port]
//        node --env-file=.env.benteveo scripts/dev-local.js [port]

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.argv[2]) || 3000;
const ROOT = path.join(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

// Vercel rewrites (from vercel.json)
const REWRITES = [
  {
    source: '/api/admin-v2/stock-dashboard',
    destination: '/api/admin-v2/horses',
    extraQuery: { _view: 'stock' },
  },
  {
    source: '/api/admin-v2/owner-ledger',
    destination: '/api/admin-v2/owners',
    extraQuery: { resource: 'ledger' },
  },
  {
    source: '/api/admin-v2/owner-statement',
    destination: '/api/admin-v2/owners',
    extraQuery: { resource: 'statement' },
  },
  {
    source: '/api/admin-v2/owner-feed-purchases',
    destination: '/api/admin-v2/owners',
    extraQuery: { resource: 'feed-purchases' },
  },
  {
    source: '/api/admin-v2/owner-expense-split',
    destination: '/api/admin-v2/owners',
    extraQuery: { resource: 'expense-split' },
  },
  {
    source: '/api/admin-v2/owner-expense-split-drafts',
    destination: '/api/admin-v2/owners',
    extraQuery: { resource: 'expense-split-drafts' },
  },
  {
    source: '/api/admin-v2/general-expenses',
    destination: '/api/admin-v2/owners',
    extraQuery: { resource: 'general-expenses' },
  },
];

// Static directories served at these URL prefixes
const STATIC_DIRS = [
  { prefix: '/admin-v2', dir: path.join(ROOT, 'admin-v2') },
  { prefix: '/admin', dir: path.join(ROOT, 'admin') },
];

function resolveApiHandler(pathname) {
  for (const rewrite of REWRITES) {
    if (pathname === rewrite.source) {
      return {
        file: path.join(ROOT, rewrite.destination.slice(1) + '.js'),
        extraQuery: rewrite.extraQuery || {},
      };
    }
  }

  // Direct mapping: /api/admin/session -> api/admin/session.js
  const relative = pathname.slice(1); // strip leading /
  const filePath = path.join(ROOT, relative + '.js');
  if (fs.existsSync(filePath)) {
    return { file: filePath, extraQuery: {} };
  }

  return null;
}

function addExpressHelpers(res) {
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (data) {
    if (!this.headersSent) {
      this.setHeader('Content-Type', 'application/json; charset=utf-8');
      this.end(JSON.stringify(data));
    }
  };
  res.send = function (data) {
    if (!this.headersSent) {
      if (typeof data === 'object' && data !== null) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
        this.end(JSON.stringify(data));
      } else {
        this.end(String(data));
      }
    }
  };
  res.redirect = function (urlOrCode, targetUrl) {
    const location = typeof urlOrCode === 'string' ? urlOrCode : targetUrl;
    const code = typeof urlOrCode === 'number' ? urlOrCode : 302;
    this.statusCode = code;
    this.setHeader('Location', location);
    this.end();
  };
  return res;
}

function serveStatic(res, filePath) {
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end('404 Not Found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  addExpressHelpers(res);

  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // API routes
  if (pathname.startsWith('/api/')) {
    const resolved = resolveApiHandler(pathname);
    if (!resolved) {
      res.status(404).json({ ok: false, error: `API handler not found: ${pathname}` });
      return;
    }

    req.query = { ...parsedUrl.query, ...resolved.extraQuery };

    try {
      // Clear the whole project from require cache (not just the API entry
      // file) so edits to lib/*.js take effect immediately without having
      // to restart this dev server. node_modules stays cached for speed.
      for (const cachedPath of Object.keys(require.cache)) {
        if (cachedPath.startsWith(ROOT) && !cachedPath.includes('node_modules')) {
          delete require.cache[cachedPath];
        }
      }
      const handler = require(resolved.file);
      await handler(req, res);
    } catch (err) {
      console.error(`[API ERROR] ${pathname}:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: 'Internal Server Error', detail: err.message });
      }
    }
    return;
  }

  // Redirect root to admin-v2
  if (pathname === '/') {
    res.redirect('/admin-v2/');
    return;
  }

  // Static files
  for (const { prefix, dir } of STATIC_DIRS) {
    if (pathname.startsWith(prefix)) {
      let relative = pathname.slice(prefix.length) || '/index.html';

      // Dev-only: serve the raw, unminified source instead of the built
      // bundle, so local dev never needs `npm run build`. Production
      // (Vercel) still serves the minified files built at deploy time.
      if (relative.endsWith('/app.min.js')) {
        relative = relative.replace(/app\.min\.js$/, 'app.js');
      } else if (relative.endsWith('/styles.min.css')) {
        relative = relative.replace(/styles\.min\.css$/, 'styles.css');
      }

      let filePath = path.join(dir, relative);

      // SPA fallback: serve index.html for unknown paths inside the SPA dir
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(dir, 'index.html');
      }

      serveStatic(res, filePath);
      return;
    }
  }

  res.statusCode = 404;
  res.end('404 Not Found');
});

const farm = process.env.FARM_NAME || '(FARM_NAME not set)';
const dbSet = process.env.DATABASE_URL ? 'OK' : 'NOT SET';
const username = process.env.ADMIN_USERNAME || '(not set)';

server.listen(PORT, () => {
  console.log('');
  console.log(`Farm Bot local dev — ${farm}`);
  console.log(`URL:          http://localhost:${PORT}/admin-v2/`);
  console.log(`ADMIN_USERNAME: ${username}`);
  console.log(`DATABASE_URL:   ${dbSet}`);
  console.log('');
});
