const { requireAdminApiAuth } = require('../../lib/admin-auth');
const {
  getAdminV2PaddocksDashboard,
  getAdminV2PaddockDetail,
  createAdminV2Paddock,
  updateAdminV2Paddock,
} = require('../../lib/admin-v2/paddocks');

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
  if (!['GET', 'POST', 'PATCH'].includes(req.method || '')) {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!requireAdminApiAuth(req, res)) {
    return;
  }

  try {
    if (req.method === 'GET') {
      const paddockIdValue = Array.isArray(req.query?.paddockId)
        ? req.query.paddockId[0]
        : req.query?.paddockId;

      if (paddockIdValue) {
        const payload = await getAdminV2PaddockDetail(paddockIdValue);
        res.status(200).json(payload);
        return;
      }

      const payload = await getAdminV2PaddocksDashboard();
      res.status(200).json(payload);
      return;
    }

    const body = await getJsonBody(req);

    if (req.method === 'POST') {
      const payload = await createAdminV2Paddock(body);
      res.status(200).json(payload);
      return;
    }

    const payload = await updateAdminV2Paddock(body.paddockId, body);
    res.status(200).json(payload);
  } catch (error) {
    console.error('ADMIN V2 PADDOCKS ERROR:', error);
    if (error?.statusCode) {
      res.status(error.statusCode).json({ ok: false, error: error.message });
      return;
    }
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
