const { requireAdminApiAuth } = require('../../lib/admin-auth');
const { getJsonBody } = require('../../lib/request-helpers');
const {
  getGeneralExpensesSummary,
  createGeneralExpense,
  updateGeneralExpense,
  deleteGeneralExpense,
} = require('../../lib/general-expenses');

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
      const summary = await getGeneralExpensesSummary();
      res.status(200).json({ ok: true, ...summary });
      return;
    }

    const body = await getJsonBody(req);

    if (req.method === 'POST') {
      const expense = await createGeneralExpense({
        expenseDate: body.expenseDate,
        category: body.category,
        description: body.description,
        amount: body.amount,
        currency: body.currency,
        quantityLabel: body.quantityLabel,
        groupName: body.groupName,
        buyerOwnerId: body.buyerOwnerId,
        notes: body.notes,
      });
      res.status(200).json({ ok: true, expense });
      return;
    }

    if (req.method === 'PATCH') {
      const expense = await updateGeneralExpense({
        expenseId: body.expenseId,
        expenseDate: body.expenseDate,
        category: body.category,
        description: body.description,
        amount: body.amount,
        currency: body.currency,
        quantityLabel: body.quantityLabel,
        groupName: body.groupName,
        buyerOwnerId: body.buyerOwnerId,
        notes: body.notes,
      });
      res.status(200).json({ ok: true, expense });
      return;
    }

    if (req.method === 'DELETE') {
      const result = await deleteGeneralExpense({ expenseId: body.expenseId });
      res.status(200).json(result);
      return;
    }
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({ ok: false, error: error.message || 'Error interno.' });
  }
};
