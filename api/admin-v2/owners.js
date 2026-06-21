const { requireAdminApiAuth } = require('../../lib/admin-auth');
const { getJsonBody } = require('../../lib/request-helpers');
const { getOwnersDashboard, createOwner, updateOwner, deleteOwner } = require('../../lib/owners');

module.exports = async (req, res) => {
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method || '')) {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!requireAdminApiAuth(req, res)) {
    return;
  }

  try {
    if (req.method === 'GET') {
      const payload = await getOwnersDashboard();
      res.status(200).json(payload);
      return;
    }

    const body = await getJsonBody(req);

    if (req.method === 'POST') {
      const result = await createOwner(body);
      res.status(200).json({ ok: true, owner: result });
      return;
    }

    if (req.method === 'PATCH') {
      const result = await updateOwner(body);
      res.status(200).json({ ok: true, owner: result });
      return;
    }

    if (req.method === 'DELETE') {
      const result = await deleteOwner(body);
      res.status(200).json(result);
      return;
    }
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({ ok: false, error: error.message || 'Error interno.' });
  }
};
