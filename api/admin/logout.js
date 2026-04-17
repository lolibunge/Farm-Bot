const { buildClearSessionCookie } = require('../../lib/admin-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    res.setHeader('Set-Cookie', buildClearSessionCookie(req));
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('ADMIN LOGOUT ERROR:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
