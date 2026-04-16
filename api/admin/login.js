const {
  createSessionToken,
  buildSessionCookie,
  validateLoginCredentials,
  getAuthSetup,
} = require('../../lib/admin-auth');

async function getJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return req.body ? JSON.parse(req.body) : {};
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body.length > 0 ? JSON.parse(req.body.toString('utf8')) : {};
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const setup = getAuthSetup();
    if (!setup.login_enabled) {
      res.status(400).json({
        ok: false,
        error: 'Login is not enabled. Set ADMIN_USERNAME and ADMIN_PASSWORD.',
      });
      return;
    }

    const body = await getJsonBody(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!username || !password) {
      res.status(400).json({ ok: false, error: 'username and password are required' });
      return;
    }

    if (!validateLoginCredentials(username, password)) {
      res.status(401).json({ ok: false, error: 'Invalid credentials' });
      return;
    }

    const sessionToken = createSessionToken(username);
    res.setHeader('Set-Cookie', buildSessionCookie(sessionToken, req));
    res.status(200).json({ ok: true, username });
  } catch (error) {
    console.error('ADMIN LOGIN ERROR:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
