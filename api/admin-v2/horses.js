const { requireAdminApiAuth } = require('../../lib/admin-auth');
const {
  getAdminV2HorsesDashboard,
  createAdminV2Horse,
  updateAdminV2Horse,
  deleteAdminV2Horse,
} = require('../../lib/admin-v2/horses');

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
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method || '')) {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!requireAdminApiAuth(req, res)) {
    return;
  }

  try {
    if (req.method === 'GET') {
      const payload = await getAdminV2HorsesDashboard();
      res.status(200).json(payload);
      return;
    }

    const body = await getJsonBody(req);

    if (req.method === 'POST') {
      const payload = await createAdminV2Horse(body);
      res.status(200).json(payload);
      return;
    }

    if (req.method === 'PATCH') {
      const payload = await updateAdminV2Horse(body.horseId, body);
      res.status(200).json(payload);
      return;
    }

    const payload = await deleteAdminV2Horse(body.horseId);
    res.status(200).json(payload);
  } catch (error) {
    console.error('ADMIN V2 HORSES ERROR:', error);
    if (error?.statusCode) {
      res.status(error.statusCode).json({ ok: false, error: error.message });
      return;
    }
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
