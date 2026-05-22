const { requireAdminApiAuth } = require('../../lib/admin-auth');
const { getAdminV2StockDashboard } = require('../../lib/admin-v2/stock-dashboard');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!requireAdminApiAuth(req, res)) {
    return;
  }

  try {
    const payload = await getAdminV2StockDashboard();
    res.status(200).json(payload);
  } catch (error) {
    console.error('ADMIN V2 STOCK DASHBOARD ERROR:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
