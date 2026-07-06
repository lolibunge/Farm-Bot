const { pool } = require('./db');
const { ensureTableColumns } = require('./schema');

let ensurePromise = null;

const FARM_VISITS_COLUMNS = [
  { name: 'status', definition: "TEXT NOT NULL DEFAULT 'pending'" },
];

async function ensureFarmVisitsTable() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS farm_visits (
        id BIGSERIAL PRIMARY KEY,
        event_date DATE NOT NULL,
        category TEXT NOT NULL DEFAULT 'visit',
        title TEXT NOT NULL,
        farm_name TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ensureTableColumns(pool, 'farm_visits', FARM_VISITS_COLUMNS);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS farm_visits_event_date_idx
      ON farm_visits (event_date DESC)
    `);
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

module.exports = {
  ensureFarmVisitsTable,
};
