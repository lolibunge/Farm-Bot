const { pool } = require('./db');
const { ensureTableColumns } = require('./schema');
const { createGeneralExpense } = require('./general-expenses');

async function tablesExist(tableNames) {
  const result = await pool.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1::text[])`,
    [tableNames]
  );
  return new Set(result.rows.map((r) => r.tablename));
}

let ensurePromise = null;

async function ensureOwnersSchema() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS owners (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ensureTableColumns(pool, 'horses', [
      { name: 'owner_id', definition: 'INTEGER REFERENCES owners(id) ON DELETE SET NULL' },
    ]);

    await ensureTableColumns(pool, 'owners', [
      { name: 'owner_type', definition: "TEXT NOT NULL DEFAULT 'pension'" },
    ]);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS owner_billing_rates (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
        horse_id INTEGER NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
        rate_per_month NUMERIC(12,2) NOT NULL DEFAULT 0,
        valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
        valid_to DATE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS owner_ledger_entries (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
        entry_type TEXT NOT NULL CHECK (entry_type IN ('charge', 'payment')),
        amount NUMERIC(12,2) NOT NULL,
        entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
        description TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Most charges/pagos son en pesos, pero un reparto puede quedar
    // denominado en dolares si los insumos que lo originan eran en USD. En
    // vez de forzar una conversion manual, cada movimiento lleva su propia
    // moneda y el saldo se calcula por separado para UYU y USD.
    await ensureTableColumns(pool, 'owner_ledger_entries', [
      { name: 'currency', definition: "TEXT NOT NULL DEFAULT 'UYU'" },
    ]);

    // Personal feed purchases: what an owner buys on their own (oats, corn,
    // etc.) for their own horses. This is purely informational for their
    // "real cost" total — it never touches owner_ledger_entries / the
    // balance owed to the farm, since it's the owner's own money.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS owner_feed_purchases (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
        purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
        product_name TEXT NOT NULL,
        quantity_label TEXT,
        amount NUMERIC(12,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ensureTableColumns(pool, 'owner_feed_purchases', [
      { name: 'quantity', definition: 'NUMERIC(12,3)' },
      { name: 'unit', definition: 'TEXT' },
      { name: 'movement_type', definition: "TEXT NOT NULL DEFAULT 'purchase'" },
    ]);

    // Best-effort: add a cost_amount column to the care event tables so those
    // services can be billed to the horse's owner. These tables are created
    // by the Telegram bot / legacy admin flows, so we only touch them if they
    // already exist.
    const careTables = await tablesExist(['farrier_events', 'deworming_events', 'horse_health_events']);
    for (const tableName of careTables) {
      await ensureTableColumns(pool, tableName, [
        { name: 'cost_amount', definition: 'NUMERIC(12,2)' },
      ]);
    }
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

function normalizeOwnerType(value) {
  return String(value || '').trim().toLowerCase() === 'family' ? 'family' : 'pension';
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const label = now.toLocaleDateString('es-UY', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return { start, end, label };
}

async function getOwnersDashboard() {
  await ensureOwnersSchema();

  const { start, end, label } = currentMonthRange();

  const ownersResult = await pool.query(`
    SELECT
      o.id,
      o.name,
      o.phone,
      o.email,
      o.notes,
      o.owner_type,
      COUNT(DISTINCT h.id)::int AS horse_count,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT('id', h.id, 'name', h.name)
          ORDER BY h.name
        ) FILTER (WHERE h.id IS NOT NULL),
        '[]'::json
      ) AS horses
    FROM owners o
    LEFT JOIN horses h ON h.owner_id = o.id
    GROUP BY o.id, o.name, o.phone, o.email, o.notes, o.owner_type
    ORDER BY o.name ASC
  `);

  const existing = await tablesExist(['feed_events', 'feed_items', 'farrier_events', 'deworming_events', 'horse_health_events']);

  let hasFeedUnitCost = false;
  if (existing.has('feed_items')) {
    const colCheck = await pool.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='feed_items' AND column_name='unit_cost'`
    );
    hasFeedUnitCost = colCheck.rows.length > 0;
  }

  const feedCostQuery = existing.has('feed_events') && existing.has('feed_items') && hasFeedUnitCost
    ? pool.query(`
        SELECT
          h.owner_id,
          h.id AS horse_id,
          h.name AS horse_name,
          COALESCE(SUM(fe.quantity * fi.unit_cost), 0)::numeric(12,2) AS feed_cost,
          COUNT(fe.id)::int AS feed_events
        FROM horses h
        JOIN feed_events fe ON fe.horse_id = h.id
          AND fe.event_date BETWEEN $1 AND $2
        JOIN feed_items fi ON fi.id = fe.feed_item_id
        WHERE h.owner_id IS NOT NULL
        GROUP BY h.owner_id, h.id, h.name
      `, [start, end])
    : Promise.resolve({ rows: [] });

  const farrierQuery = existing.has('farrier_events')
    ? pool.query(`
        SELECT
          h.owner_id,
          h.id AS horse_id,
          h.name AS horse_name,
          COUNT(fa.id) FILTER (WHERE fa.event_date BETWEEN $1 AND $2)::int AS farrier_count,
          COALESCE(SUM(fa.cost_amount) FILTER (WHERE fa.event_date BETWEEN $1 AND $2), 0)::numeric(12,2) AS farrier_cost
        FROM horses h
        JOIN farrier_events fa ON fa.horse_id = h.id
        WHERE h.owner_id IS NOT NULL
        GROUP BY h.owner_id, h.id, h.name
      `, [start, end])
    : Promise.resolve({ rows: [] });

  const dewormQuery = existing.has('deworming_events')
    ? pool.query(`
        SELECT
          h.owner_id,
          h.id AS horse_id,
          h.name AS horse_name,
          COUNT(de.id) FILTER (WHERE de.event_date BETWEEN $1 AND $2)::int AS deworm_count,
          COALESCE(SUM(de.cost_amount) FILTER (WHERE de.event_date BETWEEN $1 AND $2), 0)::numeric(12,2) AS deworm_cost
        FROM horses h
        JOIN deworming_events de ON de.horse_id = h.id
        WHERE h.owner_id IS NOT NULL
        GROUP BY h.owner_id, h.id, h.name
      `, [start, end])
    : Promise.resolve({ rows: [] });

  const healthQuery = existing.has('horse_health_events')
    ? pool.query(`
        SELECT
          h.owner_id,
          h.id AS horse_id,
          h.name AS horse_name,
          COUNT(he.id) FILTER (WHERE he.event_date BETWEEN $1 AND $2)::int AS health_count,
          COALESCE(SUM(he.cost_amount) FILTER (WHERE he.event_date BETWEEN $1 AND $2), 0)::numeric(12,2) AS health_cost
        FROM horses h
        JOIN horse_health_events he ON he.horse_id = h.id
        WHERE h.owner_id IS NOT NULL
        GROUP BY h.owner_id, h.id, h.name
      `, [start, end])
    : Promise.resolve({ rows: [] });

  const ledgerTotalsQuery = pool.query(`
    SELECT
      owner_id,
      currency,
      COALESCE(SUM(amount) FILTER (WHERE entry_type = 'charge'), 0)::numeric(12,2) AS total_charged,
      COALESCE(SUM(amount) FILTER (WHERE entry_type = 'payment'), 0)::numeric(12,2) AS total_paid
    FROM owner_ledger_entries
    GROUP BY owner_id, currency
  `);

  const allLedgerQuery = pool.query(`
    SELECT id, owner_id, entry_type, amount::float AS amount, entry_date, description, notes, currency
    FROM owner_ledger_entries
    ORDER BY entry_date DESC, id DESC
  `);

  const ownFeedMonthTotalsQuery = pool.query(`
    SELECT
      owner_id,
      COALESCE(SUM(amount) FILTER (WHERE movement_type = 'purchase'), 0)::numeric(12,2) AS own_feed_cost,
      COUNT(*) FILTER (WHERE movement_type = 'purchase')::int AS own_feed_purchase_count
    FROM owner_feed_purchases
    WHERE purchase_date BETWEEN $1 AND $2
    GROUP BY owner_id
  `, [start, end]);

  const allOwnFeedPurchasesQuery = pool.query(`
    SELECT id, owner_id, purchase_date, product_name, quantity_label, quantity::float AS quantity, unit, movement_type, amount::float AS amount, notes
    FROM owner_feed_purchases
    ORDER BY purchase_date DESC, id DESC
  `);

  const [
    ratesResult,
    feedCostResult,
    farrierResult,
    dewormResult,
    healthResult,
    ledgerTotalsResult,
    allLedgerResult,
    ownFeedMonthTotalsResult,
    allOwnFeedPurchasesResult,
  ] = await Promise.all([
    pool.query(`
      SELECT owner_id, horse_id, rate_per_month::float AS rate_per_month, valid_from
      FROM owner_billing_rates
      WHERE valid_to IS NULL
      ORDER BY owner_id, horse_id
    `),
    feedCostQuery,
    farrierQuery,
    dewormQuery,
    healthQuery,
    ledgerTotalsQuery,
    allLedgerQuery,
    ownFeedMonthTotalsQuery,
    allOwnFeedPurchasesQuery,
  ]);

  const ratesByOwner = {};
  for (const rate of ratesResult.rows) {
    if (!ratesByOwner[rate.owner_id]) ratesByOwner[rate.owner_id] = [];
    ratesByOwner[rate.owner_id].push(rate);
  }

  // Per-horse cost maps, keyed by horse_id, plus per-owner aggregates.
  const horseCostById = new Map();
  const ensureHorseCostRow = (horseId, horseName, ownerId) => {
    const id = Number(horseId);
    if (!horseCostById.has(id)) {
      horseCostById.set(id, {
        horse_id: id,
        horse_name: horseName || `Caballo ${id}`,
        owner_id: ownerId,
        feed_cost: 0,
        farrier_cost: 0,
        farrier_count: 0,
        deworm_cost: 0,
        deworm_count: 0,
        health_cost: 0,
        health_count: 0,
      });
    }
    return horseCostById.get(id);
  };

  const feedByOwner = {};
  for (const row of feedCostResult.rows) {
    const feedCost = parseFloat(row.feed_cost) || 0;
    const horseRow = ensureHorseCostRow(row.horse_id, row.horse_name, row.owner_id);
    horseRow.feed_cost += feedCost;
    if (!feedByOwner[row.owner_id]) feedByOwner[row.owner_id] = { feed_cost: 0, feed_events: 0 };
    feedByOwner[row.owner_id].feed_cost += feedCost;
    feedByOwner[row.owner_id].feed_events += row.feed_events || 0;
  }

  const farrierByOwner = {};
  for (const row of farrierResult.rows) {
    const farrierCost = parseFloat(row.farrier_cost) || 0;
    const horseRow = ensureHorseCostRow(row.horse_id, row.horse_name, row.owner_id);
    horseRow.farrier_cost += farrierCost;
    horseRow.farrier_count += row.farrier_count || 0;
    if (!farrierByOwner[row.owner_id]) farrierByOwner[row.owner_id] = { farrier_count: 0, farrier_cost: 0 };
    farrierByOwner[row.owner_id].farrier_count += row.farrier_count || 0;
    farrierByOwner[row.owner_id].farrier_cost += farrierCost;
  }

  const dewormByOwner = {};
  for (const row of dewormResult.rows) {
    const dewormCost = parseFloat(row.deworm_cost) || 0;
    const horseRow = ensureHorseCostRow(row.horse_id, row.horse_name, row.owner_id);
    horseRow.deworm_cost += dewormCost;
    horseRow.deworm_count += row.deworm_count || 0;
    if (!dewormByOwner[row.owner_id]) dewormByOwner[row.owner_id] = { deworm_count: 0, deworm_cost: 0 };
    dewormByOwner[row.owner_id].deworm_count += row.deworm_count || 0;
    dewormByOwner[row.owner_id].deworm_cost += dewormCost;
  }

  const healthByOwner = {};
  for (const row of healthResult.rows) {
    const healthCost = parseFloat(row.health_cost) || 0;
    const horseRow = ensureHorseCostRow(row.horse_id, row.horse_name, row.owner_id);
    horseRow.health_cost += healthCost;
    horseRow.health_count += row.health_count || 0;
    if (!healthByOwner[row.owner_id]) healthByOwner[row.owner_id] = { health_count: 0, health_cost: 0 };
    healthByOwner[row.owner_id].health_count += row.health_count || 0;
    healthByOwner[row.owner_id].health_cost += healthCost;
  }

  const horseBreakdownByOwner = {};
  for (const horseRow of horseCostById.values()) {
    const totalCost = horseRow.feed_cost + horseRow.farrier_cost + horseRow.deworm_cost + horseRow.health_cost;
    if (totalCost <= 0) {
      continue;
    }
    if (!horseBreakdownByOwner[horseRow.owner_id]) horseBreakdownByOwner[horseRow.owner_id] = [];
    horseBreakdownByOwner[horseRow.owner_id].push({
      horse_id: horseRow.horse_id,
      horse_name: horseRow.horse_name,
      feed_cost: Number(horseRow.feed_cost.toFixed(2)),
      farrier_cost: Number(horseRow.farrier_cost.toFixed(2)),
      deworm_cost: Number(horseRow.deworm_cost.toFixed(2)),
      health_cost: Number(horseRow.health_cost.toFixed(2)),
      total_cost: Number(totalCost.toFixed(2)),
    });
  }
  for (const ownerId of Object.keys(horseBreakdownByOwner)) {
    horseBreakdownByOwner[ownerId].sort((a, b) => b.total_cost - a.total_cost);
  }

  // Per-owner totals, broken out by currency (UYU/USD), so a dollar
  // reparto doesn't get mixed into the peso balance.
  const ledgerTotalsByOwner = {};
  for (const row of ledgerTotalsResult.rows) {
    if (!ledgerTotalsByOwner[row.owner_id]) ledgerTotalsByOwner[row.owner_id] = {};
    ledgerTotalsByOwner[row.owner_id][row.currency || 'UYU'] = {
      total_charged: parseFloat(row.total_charged),
      total_paid: parseFloat(row.total_paid),
    };
  }

  const allLedgerByOwner = {};
  for (const row of allLedgerResult.rows) {
    if (!allLedgerByOwner[row.owner_id]) allLedgerByOwner[row.owner_id] = [];
    allLedgerByOwner[row.owner_id].push({
      id: row.id,
      entry_type: row.entry_type,
      amount: row.amount,
      currency: row.currency || 'UYU',
      entry_date: row.entry_date instanceof Date ? row.entry_date.toISOString().slice(0, 10) : row.entry_date,
      description: row.description || '',
      notes: row.notes || '',
    });
  }

  const ownFeedMonthTotalsByOwner = {};
  for (const row of ownFeedMonthTotalsResult.rows) {
    ownFeedMonthTotalsByOwner[row.owner_id] = {
      own_feed_cost: parseFloat(row.own_feed_cost) || 0,
      own_feed_purchase_count: row.own_feed_purchase_count || 0,
    };
  }

  const allOwnFeedPurchasesByOwner = {};
  for (const row of allOwnFeedPurchasesResult.rows) {
    if (!allOwnFeedPurchasesByOwner[row.owner_id]) allOwnFeedPurchasesByOwner[row.owner_id] = [];
    allOwnFeedPurchasesByOwner[row.owner_id].push({
      id: row.id,
      purchase_date: row.purchase_date instanceof Date ? row.purchase_date.toISOString().slice(0, 10) : row.purchase_date,
      product_name: row.product_name || '',
      quantity_label: row.quantity_label || '',
      quantity: row.quantity,
      unit: row.unit || '',
      movement_type: normalizeFeedMovementType(row.movement_type),
      amount: row.amount,
      notes: row.notes || '',
    });
  }

  function computeFeedStockByProduct(purchases) {
    const byProduct = new Map();
    for (const p of purchases) {
      // Entries created before the numeric quantity/unit columns existed
      // only have a free-text quantity_label (e.g. "4 25"). Fall back to
      // parsing a leading number out of that so old data still counts
      // instead of silently disappearing from the stock calculation.
      let qty = p.quantity;
      if (qty == null || !Number.isFinite(qty)) {
        const match = String(p.quantity_label || '').trim().match(/^-?\d+(\.\d+)?/);
        qty = match ? parseFloat(match[0]) : null;
      }

      if (qty == null || !Number.isFinite(qty) || qty <= 0) {
        continue;
      }

      const key = String(p.product_name || '').trim().toLowerCase();
      if (!key) {
        continue;
      }
      if (!byProduct.has(key)) {
        byProduct.set(key, { product_name: p.product_name, unit: p.unit || '', current_stock: 0 });
      }
      const row = byProduct.get(key);
      if (!row.unit && p.unit) {
        row.unit = p.unit;
      }
      row.current_stock += p.movement_type === 'consumption' ? -qty : qty;
    }
    return Array.from(byProduct.values())
      .map((row) => ({ ...row, current_stock: Number(row.current_stock.toFixed(2)) }))
      .sort((a, b) => a.product_name.localeCompare(b.product_name, 'es'));
  }

  const owners = ownersResult.rows.map((o) => {
    const rates = ratesByOwner[o.id] || [];
    const monthlyTotal = rates.reduce((sum, r) => sum + (r.rate_per_month || 0), 0);
    const ratePerHorse = o.horse_count > 0 && rates.length > 0 ? rates[0].rate_per_month : 0;
    const { feed_cost = 0, feed_events = 0 } = feedByOwner[o.id] || {};
    const { farrier_count = 0, farrier_cost = 0 } = farrierByOwner[o.id] || {};
    const { deworm_count = 0, deworm_cost = 0 } = dewormByOwner[o.id] || {};
    const { health_count = 0, health_cost = 0 } = healthByOwner[o.id] || {};
    const totalsByCurrency = ledgerTotalsByOwner[o.id] || {};
    const { total_charged = 0, total_paid = 0 } = totalsByCurrency.UYU || {};
    const { own_feed_cost = 0, own_feed_purchase_count = 0 } = ownFeedMonthTotalsByOwner[o.id] || {};
    const totalCost = feed_cost + farrier_cost + deworm_cost + health_cost + own_feed_cost;
    const allEntries = allLedgerByOwner[o.id] || [];
    const allFeedPurchases = allOwnFeedPurchasesByOwner[o.id] || [];

    return {
      id: o.id,
      name: o.name,
      phone: o.phone || '',
      email: o.email || '',
      notes: o.notes || '',
      owner_type: normalizeOwnerType(o.owner_type),
      horse_count: o.horse_count,
      horses: o.horses,
      monthly_total: monthlyTotal,
      rate_per_horse: ratePerHorse,
      rates,
      current_month: {
        label,
        feed_cost,
        feed_events,
        farrier_count,
        farrier_cost,
        deworm_count,
        deworm_cost,
        health_count,
        health_cost,
        own_feed_cost,
        own_feed_purchase_count,
        total_cost: totalCost,
      },
      horse_cost_breakdown: horseBreakdownByOwner[o.id] || [],
      feed_purchases: {
        recent: allFeedPurchases.slice(0, 4),
        all: allFeedPurchases,
        stock: computeFeedStockByProduct(allFeedPurchases),
      },
      ledger: {
        total_charged,
        total_paid,
        balance: parseFloat((total_charged - total_paid).toFixed(2)),
        // Full breakdown per moneda (UYU siempre presente; USD solo si hay
        // movimientos en dolares), para no mezclar los saldos.
        balances_by_currency: ['UYU', 'USD'].reduce((acc, cur) => {
          const t = totalsByCurrency[cur];
          if (!t && cur !== 'UYU') return acc;
          const charged = (t && t.total_charged) || 0;
          const paid = (t && t.total_paid) || 0;
          acc[cur] = {
            total_charged: charged,
            total_paid: paid,
            balance: parseFloat((charged - paid).toFixed(2)),
          };
          return acc;
        }, {}),
        recent_entries: allEntries.slice(0, 4),
        all_entries: allEntries,
      },
    };
  });

  return {
    owners,
    meta: { refreshed_at: new Date().toISOString(), month: label },
  };
}

async function createOwner({ name, phone, email, notes, horseIds, ratePerHorse, ownerType }) {
  await ensureOwnersSchema();

  const ownerName = String(name || '').trim();
  if (!ownerName) throw new Error('El nombre del propietario es requerido.');

  const normalizedHorseIds = Array.isArray(horseIds) ? horseIds.map(Number).filter(Boolean) : [];
  const rate = Math.max(0, parseFloat(ratePerHorse) || 0);
  const type = normalizeOwnerType(ownerType);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ownerResult = await client.query(
      `INSERT INTO owners (name, phone, email, notes, owner_type) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [ownerName, phone || null, email || null, notes || null, type]
    );
    const ownerId = ownerResult.rows[0].id;

    for (const horseId of normalizedHorseIds) {
      await client.query(`UPDATE horses SET owner_id = $1 WHERE id = $2`, [ownerId, horseId]);
      if (rate > 0) {
        await client.query(
          `INSERT INTO owner_billing_rates (owner_id, horse_id, rate_per_month, valid_from) VALUES ($1, $2, $3, CURRENT_DATE)`,
          [ownerId, horseId, rate]
        );
      }
    }

    await client.query('COMMIT');
    return { id: ownerId, name: ownerName };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateOwner({ ownerId, name, phone, email, notes, horseIds, ratePerHorse, ownerType }) {
  await ensureOwnersSchema();

  const id = parseInt(ownerId, 10);
  if (!id) throw new Error('Se requiere ID del propietario.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ownerName = name ? String(name).trim() : null;
    const type = ownerType !== undefined && ownerType !== null && ownerType !== ''
      ? normalizeOwnerType(ownerType)
      : null;

    await client.query(
      `UPDATE owners SET
        name = COALESCE($1, name),
        phone = $2,
        email = $3,
        notes = $4,
        owner_type = COALESCE($5, owner_type)
      WHERE id = $6`,
      [ownerName, phone || null, email || null, notes || null, type, id]
    );

    if (Array.isArray(horseIds)) {
      const normalizedHorseIds = horseIds.map(Number).filter(Boolean);
      await client.query(`UPDATE horses SET owner_id = NULL WHERE owner_id = $1`, [id]);
      for (const horseId of normalizedHorseIds) {
        await client.query(`UPDATE horses SET owner_id = $1 WHERE id = $2`, [id, horseId]);
      }

      if (ratePerHorse !== undefined && ratePerHorse !== null) {
        const rate = Math.max(0, parseFloat(ratePerHorse) || 0);
        await client.query(
          `UPDATE owner_billing_rates SET valid_to = CURRENT_DATE WHERE owner_id = $1 AND valid_to IS NULL`,
          [id]
        );
        for (const horseId of normalizedHorseIds) {
          if (rate > 0) {
            await client.query(
              `INSERT INTO owner_billing_rates (owner_id, horse_id, rate_per_month, valid_from) VALUES ($1, $2, $3, CURRENT_DATE)`,
              [id, horseId, rate]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    const updatedName = ownerName || '';
    return { id, name: updatedName };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteOwner({ ownerId }) {
  await ensureOwnersSchema();
  const id = parseInt(ownerId, 10);
  if (!id) throw new Error('Se requiere ID del propietario.');
  await pool.query(`UPDATE horses SET owner_id = NULL WHERE owner_id = $1`, [id]);
  await pool.query(`DELETE FROM owners WHERE id = $1`, [id]);
  return { ok: true };
}

function normalizeLedgerCurrency(value) {
  return String(value || '').trim().toUpperCase() === 'USD' ? 'USD' : 'UYU';
}

async function createLedgerEntry({ ownerId, entryType, amount, entryDate, description, notes, currency }) {
  await ensureOwnersSchema();

  const id = parseInt(ownerId, 10);
  if (!id) throw new Error('Se requiere ID del propietario.');

  const type = String(entryType || '').trim().toLowerCase();
  if (!['charge', 'payment'].includes(type)) {
    throw new Error('El tipo de movimiento debe ser cargo o pago.');
  }

  const parsedAmount = parseFloat(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error('El monto tiene que ser mayor a cero.');
  }

  const entryCurrency = normalizeLedgerCurrency(currency);
  const date = entryDate && /^\d{4}-\d{2}-\d{2}$/.test(entryDate) ? entryDate : new Date().toISOString().slice(0, 10);

  const result = await pool.query(
    `INSERT INTO owner_ledger_entries (owner_id, entry_type, amount, entry_date, description, notes, currency)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, entry_type, amount::float AS amount, entry_date, description, notes, currency`,
    [id, type, parsedAmount, date, description || null, notes || null, entryCurrency]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    entry_type: row.entry_type,
    amount: row.amount,
    currency: row.currency,
    entry_date: row.entry_date instanceof Date ? row.entry_date.toISOString().slice(0, 10) : row.entry_date,
    description: row.description || '',
    notes: row.notes || '',
  };
}

async function deleteLedgerEntry({ entryId }) {
  await ensureOwnersSchema();
  const id = parseInt(entryId, 10);
  if (!id) throw new Error('Se requiere ID del movimiento.');
  await pool.query(`DELETE FROM owner_ledger_entries WHERE id = $1`, [id]);
  return { ok: true };
}

async function generateMonthlyCharge({ ownerId }) {
  await ensureOwnersSchema();

  const id = parseInt(ownerId, 10);
  if (!id) throw new Error('Se requiere ID del propietario.');

  const { start, end, label } = currentMonthRange();

  const ownerResult = await pool.query(`SELECT owner_type FROM owners WHERE id = $1`, [id]);
  if (ownerResult.rows.length === 0) {
    throw new Error('No encontramos ese propietario.');
  }
  const type = normalizeOwnerType(ownerResult.rows[0].owner_type);
  const description = type === 'family' ? `Mantenimiento del campo ${label}` : `Pensión ${label}`;

  const dupCheck = await pool.query(
    `SELECT id FROM owner_ledger_entries
     WHERE owner_id = $1 AND entry_type = 'charge' AND entry_date BETWEEN $2 AND $3
       AND description = $4
     LIMIT 1`,
    [id, start, end, description]
  );

  if (dupCheck.rows.length > 0) {
    throw new Error(`Ya se generó el cargo de ${label} para este propietario.`);
  }

  const rateResult = await pool.query(
    `SELECT COALESCE(SUM(rate_per_month), 0)::float AS total
     FROM owner_billing_rates
     WHERE owner_id = $1 AND valid_to IS NULL`,
    [id]
  );

  const amount = rateResult.rows[0]?.total || 0;
  if (!(amount > 0)) {
    throw new Error(
      type === 'family'
        ? 'Este propietario no tiene un aporte de mantenimiento configurado todavía.'
        : 'Este propietario no tiene una tarifa configurada todavía.'
    );
  }

  return createLedgerEntry({
    ownerId: id,
    entryType: 'charge',
    amount,
    entryDate: new Date().toISOString().slice(0, 10),
    description,
  });
}

async function listLedgerEntries({ ownerId }) {
  await ensureOwnersSchema();
  const id = parseInt(ownerId, 10);
  if (!id) throw new Error('Se requiere ID del propietario.');

  const result = await pool.query(
    `SELECT id, entry_type, amount::float AS amount, entry_date, description, notes, currency
     FROM owner_ledger_entries
     WHERE owner_id = $1
     ORDER BY entry_date DESC, id DESC`,
    [id]
  );

  return result.rows.map((row) => ({
    id: row.id,
    entry_type: row.entry_type,
    amount: row.amount,
    currency: row.currency,
    entry_date: row.entry_date instanceof Date ? row.entry_date.toISOString().slice(0, 10) : row.entry_date,
    description: row.description || '',
    notes: row.notes || '',
  }));
}

function isIsoDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function getOwnerStatement({ ownerId, startDate, endDate }) {
  await ensureOwnersSchema();

  const id = parseInt(ownerId, 10);
  if (!id) throw new Error('Se requiere ID del propietario.');

  const start = isIsoDateString(startDate) ? startDate : '1900-01-01';
  const end = isIsoDateString(endDate) ? endDate : new Date().toISOString().slice(0, 10);

  if (start > end) {
    throw new Error('La fecha "desde" tiene que ser anterior a la fecha "hasta".');
  }

  const ownerResult = await pool.query(
    `SELECT id, name, phone, email, notes, owner_type FROM owners WHERE id = $1`,
    [id]
  );
  if (ownerResult.rows.length === 0) {
    throw new Error('No encontramos ese propietario.');
  }
  const owner = ownerResult.rows[0];

  const priorResult = await pool.query(
    `SELECT
       currency,
       COALESCE(SUM(amount) FILTER (WHERE entry_type = 'charge'), 0)::numeric(12,2) AS charged,
       COALESCE(SUM(amount) FILTER (WHERE entry_type = 'payment'), 0)::numeric(12,2) AS paid
     FROM owner_ledger_entries
     WHERE owner_id = $1 AND entry_date < $2
     GROUP BY currency`,
    [id, start]
  );
  const openingBalanceByCurrency = {};
  for (const row of priorResult.rows) {
    openingBalanceByCurrency[row.currency || 'UYU'] = parseFloat(row.charged) - parseFloat(row.paid);
  }
  // Backwards-compatible single number: pesos only (dashboards/prints that
  // don't know about currencies yet keep working, just ignore USD).
  const openingBalance = openingBalanceByCurrency.UYU || 0;

  const periodResult = await pool.query(
    `SELECT id, entry_type, amount::float AS amount, entry_date, description, notes, currency
     FROM owner_ledger_entries
     WHERE owner_id = $1 AND entry_date BETWEEN $2 AND $3
     ORDER BY entry_date ASC, id ASC`,
    [id, start, end]
  );

  const entries = periodResult.rows.map((row) => ({
    id: row.id,
    entry_type: row.entry_type,
    amount: row.amount,
    currency: row.currency || 'UYU',
    entry_date: row.entry_date instanceof Date ? row.entry_date.toISOString().slice(0, 10) : row.entry_date,
    description: row.description || '',
    notes: row.notes || '',
  }));

  const periodCharged = entries
    .filter((e) => e.entry_type === 'charge' && e.currency === 'UYU')
    .reduce((sum, e) => sum + e.amount, 0);
  const periodPaid = entries
    .filter((e) => e.entry_type === 'payment' && e.currency === 'UYU')
    .reduce((sum, e) => sum + e.amount, 0);
  const closingBalance = openingBalance + periodCharged - periodPaid;

  const currenciesPresent = new Set([
    'UYU',
    ...Object.keys(openingBalanceByCurrency),
    ...entries.map((e) => e.currency),
  ]);
  const balances_by_currency = {};
  for (const currency of currenciesPresent) {
    const opening = openingBalanceByCurrency[currency] || 0;
    const charged = entries
      .filter((e) => e.entry_type === 'charge' && e.currency === currency)
      .reduce((sum, e) => sum + e.amount, 0);
    const paid = entries
      .filter((e) => e.entry_type === 'payment' && e.currency === currency)
      .reduce((sum, e) => sum + e.amount, 0);
    balances_by_currency[currency] = {
      opening_balance: Number(opening.toFixed(2)),
      period_charged: Number(charged.toFixed(2)),
      period_paid: Number(paid.toFixed(2)),
      closing_balance: Number((opening + charged - paid).toFixed(2)),
    };
  }

  return {
    owner: {
      id: owner.id,
      name: owner.name,
      phone: owner.phone || '',
      email: owner.email || '',
      owner_type: normalizeOwnerType(owner.owner_type),
    },
    period: { start, end },
    opening_balance: Number(openingBalance.toFixed(2)),
    entries,
    period_charged: Number(periodCharged.toFixed(2)),
    period_paid: Number(periodPaid.toFixed(2)),
    closing_balance: Number(closingBalance.toFixed(2)),
    balances_by_currency,
  };
}

function normalizeFeedMovementType(value) {
  return String(value || '').trim().toLowerCase() === 'consumption' ? 'consumption' : 'purchase';
}

async function createFeedPurchase({
  ownerId,
  purchaseDate,
  productName,
  quantityLabel,
  quantity,
  unit,
  movementType,
  amount,
  notes,
}) {
  await ensureOwnersSchema();

  const id = parseInt(ownerId, 10);
  if (!id) throw new Error('Se requiere ID del propietario.');

  const product = String(productName || '').trim();
  if (!product) {
    throw new Error('El producto es requerido (ej: avena, maíz, semitín).');
  }

  const type = normalizeFeedMovementType(movementType);
  const parsedAmount = parseFloat(amount);
  const normalizedAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;

  const parsedQuantity = parseFloat(quantity);
  const normalizedQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : null;

  // The monto is optional on both purchases and consumption (e.g. bales
  // bought a long time ago with no remembered price, or reygrass grown on
  // the farm itself and never actually purchased) - but we need at least
  // one of quantity/amount, otherwise there's nothing to log.
  if (normalizedQuantity == null && normalizedAmount <= 0) {
    throw new Error(
      type === 'consumption'
        ? 'Para registrar un consumo necesitás cargar la cantidad.'
        : 'Cargá el monto o al menos la cantidad (si no tenés el precio).'
    );
  }

  const date = isIsoDateString(purchaseDate) ? purchaseDate : new Date().toISOString().slice(0, 10);

  const result = await pool.query(
    `INSERT INTO owner_feed_purchases (owner_id, purchase_date, product_name, quantity_label, quantity, unit, movement_type, amount, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, purchase_date, product_name, quantity_label, quantity::float AS quantity, unit, movement_type, amount::float AS amount, notes`,
    [id, date, product, quantityLabel || null, normalizedQuantity, unit || null, type, normalizedAmount, notes || null]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    purchase_date: row.purchase_date instanceof Date ? row.purchase_date.toISOString().slice(0, 10) : row.purchase_date,
    product_name: row.product_name,
    quantity_label: row.quantity_label || '',
    quantity: row.quantity,
    unit: row.unit || '',
    movement_type: row.movement_type,
    amount: row.amount,
    notes: row.notes || '',
  };
}

async function deleteFeedPurchase({ purchaseId }) {
  await ensureOwnersSchema();
  const id = parseInt(purchaseId, 10);
  if (!id) throw new Error('Se requiere ID de la compra.');
  await pool.query(`DELETE FROM owner_feed_purchases WHERE id = $1`, [id]);
  return { ok: true };
}

async function listFeedPurchases({ ownerId }) {
  await ensureOwnersSchema();
  const id = parseInt(ownerId, 10);
  if (!id) throw new Error('Se requiere ID del propietario.');

  const result = await pool.query(
    `SELECT id, purchase_date, product_name, quantity_label, quantity::float AS quantity, unit, movement_type, amount::float AS amount, notes
     FROM owner_feed_purchases
     WHERE owner_id = $1
     ORDER BY purchase_date DESC, id DESC`,
    [id]
  );

  return result.rows.map((row) => ({
    id: row.id,
    purchase_date: row.purchase_date instanceof Date ? row.purchase_date.toISOString().slice(0, 10) : row.purchase_date,
    product_name: row.product_name,
    quantity_label: row.quantity_label || '',
    quantity: row.quantity,
    unit: row.unit || '',
    movement_type: normalizeFeedMovementType(row.movement_type),
    amount: row.amount,
    notes: row.notes || '',
  }));
}

async function splitExpenseAmongOwners({
  description,
  amount,
  expenseDate,
  currency,
  excludeOwnerId,
  excludeOwnerIds,
  includeOwnerIds,
  includeHorseIds,
  insumoIds,
  logGeneralExpense,
  category,
}) {
  await ensureOwnersSchema();

  const desc = String(description || '').trim();
  if (!desc) {
    throw new Error('La descripción del gasto es requerida.');
  }

  const totalAmount = parseFloat(amount);
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error('El monto total tiene que ser mayor a cero.');
  }

  const expenseCurrency = normalizeLedgerCurrency(currency);
  const date = isIsoDateString(expenseDate) ? expenseDate : new Date().toISOString().slice(0, 10);

  // Accept either the older single excludeOwnerId or the newer multi
  // excludeOwnerIds (e.g. the farm's own horses AND an owner who's covering
  // their share with in-kind labor instead of cash, at the same time).
  const excludeIdsInput = Array.isArray(excludeOwnerIds)
    ? excludeOwnerIds
    : (excludeOwnerId ? [excludeOwnerId] : []);
  const excludeIds = new Set(excludeIdsInput.map((v) => parseInt(v, 10)).filter(Boolean));

  const ownersResult = await pool.query(`
    SELECT o.id, o.name, COUNT(h.id)::int AS horse_count
    FROM owners o
    LEFT JOIN horses h ON h.owner_id = o.id
    GROUP BY o.id, o.name
    ORDER BY o.name ASC
  `);

  const horseIdsInput = Array.isArray(includeHorseIds)
    ? includeHorseIds.map((v) => parseInt(v, 10)).filter(Boolean)
    : [];

  let consumingOwners;
  if (horseIdsInput.length > 0) {
    // Horse-level selection: not every horse of an owner necessarily grazes
    // this particular field, so derive each owner's count from exactly
    // which of their horses were ticked, instead of their full horse_count.
    const horsesResult = await pool.query(
      `SELECT owner_id, COUNT(*)::int AS horse_count
       FROM horses
       WHERE id = ANY($1::int[]) AND owner_id IS NOT NULL
       GROUP BY owner_id`,
      [horseIdsInput]
    );
    const countByOwnerId = new Map(horsesResult.rows.map((r) => [r.owner_id, r.horse_count]));
    consumingOwners = ownersResult.rows
      .filter((o) => countByOwnerId.has(o.id))
      .map((o) => ({ ...o, horse_count: countByOwnerId.get(o.id) }));
  } else {
    const includeIds = Array.isArray(includeOwnerIds)
      ? new Set(includeOwnerIds.map((v) => parseInt(v, 10)).filter(Boolean))
      : null;

    // Consuming owners: everyone by default, or only the ones explicitly
    // selected (owner-level fallback for when horse-level detail isn't
    // passed in, e.g. an older client or a simple whole-farm expense).
    consumingOwners = includeIds && includeIds.size > 0
      ? ownersResult.rows.filter((o) => includeIds.has(o.id))
      : ownersResult.rows;
  }

  const totalHorses = consumingOwners.reduce((sum, o) => sum + o.horse_count, 0);
  if (totalHorses === 0) {
    throw new Error('Los propietarios/caballos elegidos no suman caballos, no se puede prorratear.');
  }

  const costPerHorse = totalAmount / totalHorses;

  // If specific insumo (general_expenses) rows were passed in, look up who
  // fronted each one and how much, so that person's fair share gets offset
  // by what they already paid - instead of a flat "no charge" exclusion.
  // We work in proportions (fronted / total original-currency sum) rather
  // than converting each insumo's currency to pesos individually, since the
  // "Monto total a repartir" the user typed in is already the trusted peso
  // conversion of the whole batch.
  const frontedPesosByOwnerId = new Map();
  const insumoIdsInput = Array.isArray(insumoIds)
    ? insumoIds.map((v) => parseInt(v, 10)).filter(Boolean)
    : [];

  if (insumoIdsInput.length > 0) {
    const insumosResult = await pool.query(
      `SELECT amount::float AS amount, buyer_owner_id, currency
       FROM general_expenses
       WHERE id = ANY($1::int[])`,
      [insumoIdsInput]
    );

    // Only insumos in the same currency as the amount being repartido feed
    // the fronted-ratio: mixing UYU and USD sums in one ratio would be
    // meaningless (a $900 UYU insumo and a US$5 insumo aren't comparable).
    const matchingCurrencyRows = insumosResult.rows.filter(
      (row) => normalizeLedgerCurrency(row.currency) === expenseCurrency
    );

    const totalOriginal = matchingCurrencyRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

    if (totalOriginal > 0) {
      const originalByOwner = new Map();
      for (const row of matchingCurrencyRows) {
        if (!row.buyer_owner_id) continue;
        const prev = originalByOwner.get(row.buyer_owner_id) || 0;
        originalByOwner.set(row.buyer_owner_id, prev + (Number(row.amount) || 0));
      }
      for (const [ownerId, originalSum] of originalByOwner.entries()) {
        const ratio = originalSum / totalOriginal;
        frontedPesosByOwnerId.set(ownerId, ratio * totalAmount);
      }
    }
  }

  const charges = [];
  for (const owner of consumingOwners) {
    if (owner.horse_count <= 0 || excludeIds.has(owner.id)) {
      continue;
    }

    const fairShare = costPerHorse * owner.horse_count;
    const fronted = frontedPesosByOwnerId.get(owner.id) || 0;
    const net = Number((fairShare - fronted).toFixed(2));

    if (net > 0.01) {
      const entry = await createLedgerEntry({
        ownerId: owner.id,
        entryType: 'charge',
        amount: net,
        entryDate: date,
        description: desc,
        currency: expenseCurrency,
      });
      charges.push({
        owner_id: owner.id,
        owner_name: owner.name,
        horse_count: owner.horse_count,
        entry_type: 'charge',
        amount: net,
        currency: expenseCurrency,
        fronted: Number(fronted.toFixed(2)),
        entry_id: entry.id,
      });
    } else if (net < -0.01) {
      // They fronted more than their fair share - credit them the
      // difference (a payment reduces/reverses what they owe, so it can
      // leave them "a favor").
      const creditAmount = Number(Math.abs(net).toFixed(2));
      const entry = await createLedgerEntry({
        ownerId: owner.id,
        entryType: 'payment',
        amount: creditAmount,
        entryDate: date,
        description: `${desc} (adelantó de más, queda a favor)`,
        currency: expenseCurrency,
      });
      charges.push({
        owner_id: owner.id,
        owner_name: owner.name,
        horse_count: owner.horse_count,
        entry_type: 'credit',
        amount: creditAmount,
        currency: expenseCurrency,
        fronted: Number(fronted.toFixed(2)),
        entry_id: entry.id,
      });
    }
  }

  let generalExpense = null;
  if (logGeneralExpense) {
    generalExpense = await createGeneralExpense({
      expenseDate: date,
      category: category || '',
      description: desc,
      amount: totalAmount,
      currency: expenseCurrency,
      notes: 'Prorrateado entre propietarios por cantidad de caballos.',
    });
  }

  const excludedOwners = ownersResult.rows.filter((o) => excludeIds.has(o.id));

  return {
    total_amount: totalAmount,
    currency: expenseCurrency,
    total_horses: totalHorses,
    cost_per_horse: Number(costPerHorse.toFixed(2)),
    excluded_owners: excludedOwners.map((o) => ({ id: o.id, name: o.name, horse_count: o.horse_count })),
    charges,
    total_charged: Number(
      charges.filter((c) => c.entry_type === 'charge').reduce((sum, c) => sum + c.amount, 0).toFixed(2)
    ),
    total_credited: Number(
      charges.filter((c) => c.entry_type === 'credit').reduce((sum, c) => sum + c.amount, 0).toFixed(2)
    ),
    general_expense: generalExpense,
  };
}

module.exports = {
  ensureOwnersSchema,
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
};
