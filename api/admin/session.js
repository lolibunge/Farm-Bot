const { getSessionFromRequest, getAuthSetup, isRequestAuthorized } = require('../../lib/admin-auth');

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
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  try {
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
