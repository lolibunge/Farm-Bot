const { pool } = require('./db');
const { ensureTableColumns } = require('./schema');

let ensurePromise = null;

async function ensureGeneralExpensesSchema() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS general_expenses (
        id SERIAL PRIMARY KEY,
        expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
        category TEXT,
        description TEXT NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ensureTableColumns(pool, 'general_expenses', [
      { name: 'currency', definition: "TEXT NOT NULL DEFAULT 'UYU'" },
      { name: 'quantity_label', definition: 'TEXT' },
      { name: 'group_name', definition: 'TEXT' },
      { name: 'buyer_owner_id', definition: 'INTEGER' },
    ]);
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

function normalizeCurrency(value) {
  return String(value || '').trim().toUpperCase() === 'USD' ? 'USD' : 'UYU';
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const label = now.toLocaleDateString('es-UY', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return { start, end, label };
}

function normalizeRow(row) {
  return {
    id: row.id,
    expense_date: row.expense_date instanceof Date ? row.expense_date.toISOString().slice(0, 10) : row.expense_date,
    category: row.category || '',
    description: row.description || '',
    amount: Number(row.amount) || 0,
    currency: normalizeCurrency(row.currency),
    quantity_label: row.quantity_label || '',
    group_name: row.group_name || '',
    buyer_owner_id: row.buyer_owner_id || null,
    buyer_owner_name: row.buyer_owner_name || '',
    notes: row.notes || '',
  };
}

function sumByCurrency(rows) {
  const totals = { UYU: 0, USD: 0 };
  for (const row of rows) {
    totals[row.currency] = (totals[row.currency] || 0) + row.amount;
  }
  return {
    UYU: Number(totals.UYU.toFixed(2)),
    USD: Number(totals.USD.toFixed(2)),
  };
}

// Splits a flat list of expenses into named "project" groups (e.g. all the
// inputs for one planting job entered under the same group_name) plus the
// remaining ungrouped, standalone entries.
function buildGroups(rows) {
  const groupsByName = new Map();
  const ungrouped = [];

  for (const row of rows) {
    if (!row.group_name) {
      ungrouped.push(row);
      continue;
    }

    if (!groupsByName.has(row.group_name)) {
      groupsByName.set(row.group_name, {
        group_name: row.group_name,
        entries: [],
        totals_by_currency: { UYU: 0, USD: 0 },
      });
    }

    const group = groupsByName.get(row.group_name);
    group.entries.push(row);
    group.totals_by_currency[row.currency] = (group.totals_by_currency[row.currency] || 0) + row.amount;
  }

  const groups = Array.from(groupsByName.values())
    .map((group) => ({
      ...group,
      totals_by_currency: {
        UYU: Number(group.totals_by_currency.UYU.toFixed(2)),
        USD: Number(group.totals_by_currency.USD.toFixed(2)),
      },
      entries: group.entries.slice().sort((a, b) => (a.expense_date < b.expense_date ? 1 : -1)),
    }))
    .sort((a, b) => {
      const latestA = a.entries[0]?.expense_date || '';
      const latestB = b.entries[0]?.expense_date || '';
      return latestA < latestB ? 1 : -1;
    });

  return { groups, ungrouped };
}

const SELECT_COLUMNS = `
  ge.id, ge.expense_date, ge.category, ge.description, ge.amount::float AS amount,
  ge.currency, ge.quantity_label, ge.group_name, ge.buyer_owner_id,
  o.name AS buyer_owner_name, ge.notes
`;

async function getGeneralExpensesSummary() {
  await ensureGeneralExpensesSchema();
  const { start, end, label } = currentMonthRange();

  const [monthResult, recentResult] = await Promise.all([
    pool.query(
      `SELECT ${SELECT_COLUMNS}
       FROM general_expenses ge
       LEFT JOIN owners o ON o.id = ge.buyer_owner_id
       WHERE ge.expense_date BETWEEN $1 AND $2
       ORDER BY ge.expense_date DESC, ge.id DESC`,
      [start, end]
    ),
    pool.query(
      `SELECT ${SELECT_COLUMNS}
       FROM general_expenses ge
       LEFT JOIN owners o ON o.id = ge.buyer_owner_id
       ORDER BY ge.expense_date DESC, ge.id DESC
       LIMIT 30`
    ),
  ]);

  const monthRows = monthResult.rows.map(normalizeRow);
  const totalMonthByCurrency = sumByCurrency(monthRows);
  const recentRows = recentResult.rows.map(normalizeRow);
  const { groups, ungrouped } = buildGroups(recentRows);

  return {
    period: { start, end, label },
    total_month: totalMonthByCurrency.UYU,
    total_month_usd: totalMonthByCurrency.USD,
    totals_month_by_currency: totalMonthByCurrency,
    month_entries: monthRows,
    recent_entries: recentRows,
    groups,
    ungrouped_entries: ungrouped,
  };
}

async function createGeneralExpense({ expenseDate, category, description, amount, currency, quantityLabel, groupName, buyerOwnerId, notes }) {
  await ensureGeneralExpensesSchema();

  const desc = String(description || '').trim();
  if (!desc) {
    throw new Error('La descripción del gasto es requerida.');
  }

  const parsedAmount = parseFloat(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error('El monto tiene que ser mayor a cero.');
  }

  const date = expenseDate && /^\d{4}-\d{2}-\d{2}$/.test(expenseDate) ? expenseDate : new Date().toISOString().slice(0, 10);
  const normalizedCurrency = normalizeCurrency(currency);
  const normalizedGroupName = String(groupName || '').trim() || null;
  const parsedBuyerOwnerId = buyerOwnerId ? parseInt(buyerOwnerId, 10) || null : null;

  const result = await pool.query(
    `INSERT INTO general_expenses (expense_date, category, description, amount, currency, quantity_label, group_name, buyer_owner_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [date, category || null, desc, parsedAmount, normalizedCurrency, quantityLabel || null, normalizedGroupName, parsedBuyerOwnerId, notes || null]
  );

  const fullResult = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM general_expenses ge LEFT JOIN owners o ON o.id = ge.buyer_owner_id WHERE ge.id = $1`,
    [result.rows[0].id]
  );

  return normalizeRow(fullResult.rows[0]);
}

async function updateGeneralExpense({ expenseId, expenseDate, category, description, amount, currency, quantityLabel, groupName, buyerOwnerId, notes }) {
  await ensureGeneralExpensesSchema();

  const id = parseInt(expenseId, 10);
  if (!id) throw new Error('Se requiere ID del gasto.');

  const desc = String(description || '').trim();
  if (!desc) {
    throw new Error('La descripción del gasto es requerida.');
  }

  const parsedAmount = parseFloat(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error('El monto tiene que ser mayor a cero.');
  }

  const date = expenseDate && /^\d{4}-\d{2}-\d{2}$/.test(expenseDate) ? expenseDate : new Date().toISOString().slice(0, 10);
  const normalizedCurrency = normalizeCurrency(currency);
  const normalizedGroupName = String(groupName || '').trim() || null;
  const parsedBuyerOwnerId = buyerOwnerId ? parseInt(buyerOwnerId, 10) || null : null;

  const result = await pool.query(
    `UPDATE general_expenses
     SET expense_date = $1, category = $2, description = $3, amount = $4,
         currency = $5, quantity_label = $6, group_name = $7, buyer_owner_id = $8, notes = $9
     WHERE id = $10
     RETURNING id`,
    [date, category || null, desc, parsedAmount, normalizedCurrency, quantityLabel || null, normalizedGroupName, parsedBuyerOwnerId, notes || null, id]
  );

  if (result.rows.length === 0) {
    throw new Error('No encontramos ese gasto.');
  }

  const fullResult = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM general_expenses ge LEFT JOIN owners o ON o.id = ge.buyer_owner_id WHERE ge.id = $1`,
    [id]
  );

  return normalizeRow(fullResult.rows[0]);
}

async function deleteGeneralExpense({ expenseId }) {
  await ensureGeneralExpensesSchema();
  const id = parseInt(expenseId, 10);
  if (!id) throw new Error('Se requiere ID del gasto.');
  await pool.query(`DELETE FROM general_expenses WHERE id = $1`, [id]);
  return { ok: true };
}

module.exports = {
  ensureGeneralExpensesSchema,
  getGeneralExpensesSummary,
  createGeneralExpense,
  updateGeneralExpense,
  deleteGeneralExpense,
};
