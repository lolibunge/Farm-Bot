const { requireAdminApiAuth } = require('../../lib/admin-auth');
const { getJsonBody } = require('../../lib/request-helpers');
const {
  createFeedPurchase,
  deleteFeedPurchase,
  listFeedPurchases,
} = require('../../lib/owners');

module.exports = async (req, res) => {
  if (!['GET', 'POST', 'DELETE'].includes(req.method || '')) {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!requireAdminApiAuth(req, res)) {
    return;
  }

  try {
    if (req.method === 'GET') {
      const purchases = await listFeedPurchases({ ownerId: req.query?.ownerId });
      res.status(200).json({ ok: true, purchases });
      return;
    }

    const body = await getJsonBody(req);

    if (req.method === 'POST') {
      const purchase = await createFeedPurchase({
        ownerId: body.ownerId,
        purchaseDate: body.purchaseDate,
        productName: body.productName,
        quantityLabel: body.quantityLabel,
        quantity: body.quantity,
        unit: body.unit,
        movementType: body.movementType,
        amount: body.amount,
        notes: body.notes,
      });
      res.status(200).json({ ok: true, purchase });
      return;
    }

    if (req.method === 'DELETE') {
      const result = await deleteFeedPurchase({ purchaseId: body.purchaseId });
      res.status(200).json(result);
      return;
    }
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({ ok: false, error: error.message || 'Error interno.' });
  }
};
