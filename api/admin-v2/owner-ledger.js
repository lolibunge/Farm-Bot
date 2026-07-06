const { requireAdminApiAuth } = require('../../lib/admin-auth');
const { getJsonBody } = require('../../lib/request-helpers');
const {
  createLedgerEntry,
  deleteLedgerEntry,
  generateMonthlyCharge,
  listLedgerEntries,
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
      const ownerId = req.query?.ownerId;
      const entries = await listLedgerEntries({ ownerId });
      res.status(200).json({ ok: true, entries });
      return;
    }

    const body = await getJsonBody(req);

    if (req.method === 'POST') {
      if (body?.action === 'generate_monthly_charge') {
        const entry = await generateMonthlyCharge({ ownerId: body.ownerId });
        res.status(200).json({ ok: true, entry });
        return;
      }

      const entry = await createLedgerEntry({
        ownerId: body.ownerId,
        entryType: body.entryType,
        amount: body.amount,
        entryDate: body.entryDate,
        description: body.description,
        notes: body.notes,
        currency: body.currency,
      });
      res.status(200).json({ ok: true, entry });
      return;
    }

    if (req.method === 'DELETE') {
      const result = await deleteLedgerEntry({ entryId: body.entryId });
      res.status(200).json(result);
      return;
    }
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({ ok: false, error: error.message || 'Error interno.' });
  }
};
