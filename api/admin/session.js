const {
  createSessionToken,
  buildSessionCookie,
  buildClearSessionCookie,
  getSessionFromRequest,
  validateLoginCredentials,
  getAuthSetup,
  isRequestAuthorized,
} = require('../../lib/admin-auth');
const { getJsonBody } = require('../../lib/request-helpers');

function formatDisplayName(username) {
  const preferred = String(process.env.ADMIN_DISPLAY_NAME || '').trim();
  if (preferred) {
    return preferred;
  }

  const rawValue = String(username || process.env.ADMIN_USERNAME || '').trim();
  if (!rawValue) {
    return 'Administrador';
  }

  const safeValue = rawValue.includes('@') ? rawValue.split('@')[0] : rawValue;
  const tokens = safeValue.split(/[._-]+/).filter(Boolean);
  if (!tokens.length) {
    return rawValue;
  }

  return tokens
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function buildAccountProfile(username) {
  const normalizedUsername = String(username || '').trim();

  return {
    display_name: formatDisplayName(normalizedUsername),
    username: normalizedUsername || null,
    email:
      String(process.env.ADMIN_EMAIL || '').trim() ||
      (normalizedUsername.includes('@') ? normalizedUsername : null),
    role: String(process.env.ADMIN_ROLE || '').trim() || 'Administrador',
    farm_name: String(process.env.FARM_NAME || '').trim() || 'Campo',
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    if (req.method === 'POST') {
      const body = await getJsonBody(req);
      const action = String(body.action || '').trim().toLowerCase();

      if (action === 'logout') {
        res.setHeader('Set-Cookie', buildClearSessionCookie(req));
        res.status(200).json({ ok: true });
        return;
      }

      const setup = getAuthSetup();
      if (!setup.login_enabled) {
        res.status(400).json({
          ok: false,
          error: 'Login is not enabled. Set ADMIN_USERNAME and ADMIN_PASSWORD.',
        });
        return;
      }

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
      return;
    }

    const setup = getAuthSetup();
    const session = getSessionFromRequest(req);
    const authenticated = Boolean(session) || (!setup.auth_required && isRequestAuthorized(req));
    const username = session?.username || null;

    res.status(200).json({
      ok: true,
      authenticated,
      username,
      account: authenticated ? buildAccountProfile(username) : null,
      setup,
    });
  } catch (error) {
    console.error('ADMIN SESSION ERROR:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
