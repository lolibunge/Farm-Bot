const { requireAdminApiAuth } = require('../../lib/admin-auth');
const { getJsonBody } = require('../../lib/request-helpers');
const { splitExpenseAmongOwners } = require('../../lib/owners');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!requireAdminApiAuth(req, res)) {
    return;
  }

  try {
    const body = await getJsonBody(req);
    const result = await splitExpenseAmongOwners({
      description: body.description,
      amount: body.amount,
      expenseDate: body.expenseDate,
      currency: body.currency,
      excludeOwnerId: body.excludeOwnerId,
      excludeOwnerIds: body.excludeOwnerIds,
      includeOwnerIds: body.includeOwnerIds,
      includeHorseIds: body.includeHorseIds,
      insumoIds: body.insumoIds,
      logGeneralExpense: Boolean(body.logGeneralExpense),
      category: body.category,
    });
    res.status(200).json({ ok: true, result });
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({ ok: false, error: error.message || 'Error interno.' });
  }
};
