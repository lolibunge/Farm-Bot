const { requireAdminApiAuth } = require('../../lib/admin-auth');
const { getOwnerStatement } = require('../../lib/owners');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!requireAdminApiAuth(req, res)) {
    return;
  }

  try {
    const statement = await getOwnerStatement({
      ownerId: req.query?.ownerId,
      startDate: req.query?.startDate,
      endDate: req.query?.endDate,
    });
    res.status(200).json({ ok: true, statement });
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({ ok: false, error: error.message || 'Error interno.' });
  }
};
