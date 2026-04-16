const { getSessionFromRequest, getAuthSetup, isRequestAuthorized } = require('../../lib/admin-auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const setup = getAuthSetup();
    const session = getSessionFromRequest(req);

    res.status(200).json({
      ok: true,
      authenticated: Boolean(session) || (!setup.auth_required && isRequestAuthorized(req)),
      username: session?.username || null,
      setup,
    });
  } catch (error) {
    console.error('ADMIN SESSION ERROR:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
