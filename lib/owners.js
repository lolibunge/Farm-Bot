const { pool } = require('./db');
const { ensureTableColumns } = require('./schema');

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
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
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
    GROUP BY o.id, o.name, o.phone, o.email, o.notes
    ORDER BY o.name ASC
  `);

  const [ratesResult, feedCostResult, serviceResult] = await Promise.all([
    pool.query(`
      SELECT owner_id, horse_id, rate_per_month::float AS rate_per_month, valid_from
      FROM owner_billing_rates
      WHERE valid_to IS NULL
      ORDER BY owner_id, horse_id
    `),
    pool.query(`
      SELECT
        h.owner_id,
        COALESCE(SUM(fe.quantity * fi.unit_cost), 0)::numeric(12,2) AS feed_cost,
        COUNT(fe.id)::int AS feed_events
      FROM horses h
      JOIN feed_events fe ON fe.horse_id = h.id
        AND fe.event_date BETWEEN $1 AND $2
      JOIN feed_items fi ON fi.id = fe.feed_item_id
      WHERE h.owner_id IS NOT NULL
      GROUP BY h.owner_id
    `, [start, end]),
    pool.query(`
      SELECT
        h.owner_id,
        COUNT(fa.id) FILTER (WHERE fa.event_date BETWEEN $1 AND $2)::int AS farrier_count,
        COUNT(de.id) FILTER (WHERE de.event_date BETWEEN $1 AND $2)::int AS deworm_count
      FROM horses h
      LEFT JOIN farrier_events fa ON fa.horse_id = h.id
      LEFT JOIN deworming_events de ON de.horse_id = h.id
      WHERE h.owner_id IS NOT NULL
      GROUP BY h.owner_id
    `, [start, end]),
  ]);

  const ratesByOwner = {};
  for (const rate of ratesResult.rows) {
    if (!ratesByOwner[rate.owner_id]) ratesByOwner[rate.owner_id] = [];
    ratesByOwner[rate.owner_id].push(rate);
  }

  const feedByOwner = {};
  for (const row of feedCostResult.rows) {
    feedByOwner[row.owner_id] = { feed_cost: parseFloat(row.feed_cost), feed_events: row.feed_events };
  }

  const serviceByOwner = {};
  for (const row of serviceResult.rows) {
    serviceByOwner[row.owner_id] = { farrier_count: row.farrier_count, deworm_count: row.deworm_count };
  }

  const owners = ownersResult.rows.map((o) => {
    const rates = ratesByOwner[o.id] || [];
    const monthlyTotal = rates.reduce((sum, r) => sum + (r.rate_per_month || 0), 0);
    const ratePerHorse = o.horse_count > 0 && rates.length > 0 ? rates[0].rate_per_month : 0;
    const { feed_cost = 0, feed_events = 0 } = feedByOwner[o.id] || {};
    const { farrier_count = 0, deworm_count = 0 } = serviceByOwner[o.id] || {};

    return {
      id: o.id,
      name: o.name,
      phone: o.phone || '',
      email: o.email || '',
      notes: o.notes || '',
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
        deworm_count,
        total_cost: feed_cost,
      },
    };
  });

  return {
    owners,
    meta: { refreshed_at: new Date().toISOString(), month: label },
  };
}

async function createOwner({ name, phone, email, notes, horseIds, ratePerHorse }) {
  await ensureOwnersSchema();

  const ownerName = String(name || '').trim();
  if (!ownerName) throw new Error('El nombre del propietario es requerido.');

  const normalizedHorseIds = Array.isArray(horseIds) ? horseIds.map(Number).filter(Boolean) : [];
  const rate = Math.max(0, parseFloat(ratePerHorse) || 0);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ownerResult = await client.query(
      `INSERT INTO owners (name, phone, email, notes) VALUES ($1, $2, $3, $4) RETURNING id`,
      [ownerName, phone || null, email || null, notes || null]
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

async function updateOwner({ ownerId, name, phone, email, notes, horseIds, ratePerHorse }) {
  await ensureOwnersSchema();

  const id = parseInt(ownerId, 10);
  if (!id) throw new Error('Se requiere ID del propietario.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ownerName = name ? String(name).trim() : null;
    await client.query(
      `UPDATE owners SET
        name = COALESCE($1, name),
        phone = $2,
        email = $3,
        notes = $4
      WHERE id = $5`,
      [ownerName, phone || null, email || null, notes || null, id]
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

module.exports = {
  ensureOwnersSchema,
  getOwnersDashboard,
  createOwner,
  updateOwner,
  deleteOwner,
};
