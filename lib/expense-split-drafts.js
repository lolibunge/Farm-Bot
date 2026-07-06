const { pool } = require('./db');

// Lets you set up a "Repartir gasto entre propietarios" split (which
// insumos, which horses, amount, moneda) and save it without generating the
// cargos/creditos yet - e.g. while the horse count for a project is still
// changing (more arrive, some leave) and you're not ready to bill anyone.
// It's just a saved snapshot of the form; nothing here touches
// owner_ledger_entries or general_expenses.

let ensurePromise = null;

async function ensureExpenseSplitDraftsSchema() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_split_drafts (
        id SERIAL PRIMARY KEY,
        group_name TEXT,
        description TEXT NOT NULL,
        amount NUMERIC(12,2),
        currency TEXT NOT NULL DEFAULT 'UYU',
        expense_date DATE,
        category TEXT,
        include_horse_ids INTEGER[] NOT NULL DEFAULT '{}',
        insumo_ids INTEGER[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

function normalizeIntArray(value) {
  return Array.isArray(value) ? value.map((v) => parseInt(v, 10)).filter(Boolean) : [];
}

function normalizeCurrency(value) {
  return String(value || '').trim().toUpperCase() === 'USD' ? 'USD' : 'UYU';
}

function mapRow(row) {
  return {
    id: row.id,
    group_name: row.group_name || '',
    description: row.description || '',
    amount: row.amount == null ? null : Number(row.amount),
    currency: row.currency || 'UYU',
    expense_date: row.expense_date instanceof Date ? row.expense_date.toISOString().slice(0, 10) : row.expense_date,
    category: row.category || '',
    include_horse_ids: row.include_horse_ids || [],
    insumo_ids: row.insumo_ids || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function listExpenseSplitDrafts() {
  await ensureExpenseSplitDraftsSchema();
  const result = await pool.query(
    `SELECT * FROM expense_split_drafts ORDER BY updated_at DESC, id DESC`
  );
  return result.rows.map(mapRow);
}

async function saveExpenseSplitDraft({
  draftId,
  groupName,
  description,
  amount,
  currency,
  expenseDate,
  category,
  includeHorseIds,
  insumoIds,
}) {
  await ensureExpenseSplitDraftsSchema();

  const desc = String(description || '').trim();
  if (!desc) {
    throw new Error('La descripción del gasto es requerida para guardar el borrador.');
  }

  const parsedAmount = amount === undefined || amount === null || amount === '' ? null : parseFloat(amount);
  const finalAmount = Number.isFinite(parsedAmount) ? parsedAmount : null;
  const finalCurrency = normalizeCurrency(currency);
  const finalDate = expenseDate && /^\d{4}-\d{2}-\d{2}$/.test(expenseDate) ? expenseDate : null;
  const finalHorseIds = normalizeIntArray(includeHorseIds);
  const finalInsumoIds = normalizeIntArray(insumoIds);
  const finalGroupName = String(groupName || description || '').trim() || null;

  const id = parseInt(draftId, 10);
  if (id) {
    const result = await pool.query(
      `UPDATE expense_split_drafts
       SET group_name = $1, description = $2, amount = $3, currency = $4, expense_date = $5,
           category = $6, include_horse_ids = $7, insumo_ids = $8, updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [finalGroupName, desc, finalAmount, finalCurrency, finalDate, category || null, finalHorseIds, finalInsumoIds, id]
    );
    if (result.rows.length > 0) {
      return mapRow(result.rows[0]);
    }
    // Fall through to insert if the draft id no longer exists (e.g. deleted elsewhere).
  }

  const result = await pool.query(
    `INSERT INTO expense_split_drafts
       (group_name, description, amount, currency, expense_date, category, include_horse_ids, insumo_ids)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [finalGroupName, desc, finalAmount, finalCurrency, finalDate, category || null, finalHorseIds, finalInsumoIds]
  );
  return mapRow(result.rows[0]);
}

async function deleteExpenseSplitDraft({ draftId }) {
  await ensureExpenseSplitDraftsSchema();
  const id = parseInt(draftId, 10);
  if (!id) throw new Error('Se requiere ID del borrador.');
  await pool.query(`DELETE FROM expense_split_drafts WHERE id = $1`, [id]);
  return { ok: true };
}

module.exports = {
  ensureExpenseSplitDraftsSchema,
  listExpenseSplitDrafts,
  saveExpenseSplitDraft,
  deleteExpenseSplitDraft,
};
