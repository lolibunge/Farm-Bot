// Consolidated endpoint for everything Propietarios-related, plus Gastos
// Generales (Stock). This used to be 7 separate files under api/admin-v2/
// (owners, owner-ledger, owner-statement, owner-feed-purchases,
// owner-expense-split, owner-expense-split-drafts, general-expenses), but
// Vercel's Hobby plan caps a deployment at 12 Serverless Functions total,
// and the repo had grown past that. Consolidating these into one file (with
// vercel.json rewrites keeping the old URLs working from the frontend's
// point of view) buys back headroom without touching admin-v2/app.js.
//
// Routing is via ?resource=<name> on the query string - see vercel.json for
// the rewrites that map each old path to this file with the right resource.

const { requireAdminApiAuth } = require('../../lib/admin-auth');
const { getJsonBody } = require('../../lib/request-helpers');
const {
  getOwnersDashboard,
  createOwner,
  updateOwner,
  deleteOwner,
  createLedgerEntry,
  deleteLedgerEntry,
  generateMonthlyCharge,
  listLedgerEntries,
  getOwnerStatement,
  createFeedPurchase,
  deleteFeedPurchase,
  listFeedPurchases,
  splitExpenseAmongOwners,
} = require('../../lib/owners');
const {
  listExpenseSplitDrafts,
  saveExpenseSplitDraft,
  deleteExpenseSplitDraft,
} = require('../../lib/expense-split-drafts');
const {
  getGeneralExpensesSummary,
  createGeneralExpense,
  updateGeneralExpense,
  deleteGeneralExpense,
} = require('../../lib/general-expenses');

async function handleOwners(req, res) {
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method || '')) {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

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
}

async function handleLedger(req, res) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method || '')) {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

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
}

async function handleStatement(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  const statement = await getOwnerStatement({
    ownerId: req.query?.ownerId,
    startDate: req.query?.startDate,
    endDate: req.query?.endDate,
  });
  res.status(200).json({ ok: true, statement });
}

async function handleFeedPurchases(req, res) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method || '')) {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

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
}

async function handleExpenseSplit(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

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
}

async function handleExpenseSplitDrafts(req, res) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method || '')) {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

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
}

async function handleGeneralExpenses(req, res) {
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method || '')) {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

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
}

const HANDLERS_BY_RESOURCE = {
  owners: handleOwners,
  ledger: handleLedger,
  statement: handleStatement,
  'feed-purchases': handleFeedPurchases,
  'expense-split': handleExpenseSplit,
  'expense-split-drafts': handleExpenseSplitDrafts,
  'general-expenses': handleGeneralExpenses,
};

module.exports = async (req, res) => {
  if (!requireAdminApiAuth(req, res)) {
    return;
  }

  const resource = String(req.query?.resource || 'owners');
  const handler = HANDLERS_BY_RESOURCE[resource];

  if (!handler) {
    res.status(404).json({ ok: false, error: `Recurso desconocido: ${resource}` });
    return;
  }

  try {
    await handler(req, res);
  } catch (error) {
    const status = error.status || 400;
    res.status(status).json({ ok: false, error: error.message || 'Error interno.' });
  }
};
