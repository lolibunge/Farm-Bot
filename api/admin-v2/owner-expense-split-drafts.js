const { requireAdminApiAuth } = require('../../lib/admin-auth');
const { getJsonBody } = require('../../lib/request-helpers');
const {
  listExpenseSplitDrafts,
  saveExpenseSplitDraft,
  deleteExpenseSplitDraft,
} = require('../../lib/expense-split-drafts');

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
      const drafts = await listExpenseSplitDrafts();
      res.status(200).json({ ok: true, drafts });
      return;
    }

    const body = await getJsonBody(req);

    if (req.method === 'POST') {
      const draft = await saveExpenseSplitDraft({
        draftId: body.draftId,
        groupName: body.groupName,
        description: body.description,
        amount: body.amount,
        currency: body.currency,
        expenseDate: body.expenseDate,
        category: body.category,
        includeHorseIds: body.includeHorseIds,
        insumoIds: body.insumoIds,
      });
      res.status(200).json({ ok: true, draft });
      return;
    }

    if (req.method === 'DELETE') {
      const result = await deleteExpenseSplitDraft({ draftId: body.draftId });
      res.status(200).json(result);
      return;
    }
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({ ok: false, error: error.message || 'Error interno.' });
  }
};
