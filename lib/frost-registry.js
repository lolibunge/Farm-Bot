const { pool } = require('./db');
const { ensureTableColumns } = require('./schema');

let ensurePromise = null;

const FROST_REGISTRY_COLUMNS = [
  { name: 'source', definition: "TEXT DEFAULT 'manual'" },
  { name: 'notes', definition: 'TEXT' },
  { name: 'telegram_user_id', definition: 'TEXT' },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
  { name: 'updated_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

async function ensureFrostRegistryTable() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS frost_registry (
        id BIGSERIAL PRIMARY KEY,
        event_date DATE NOT NULL UNIQUE,
        intensity TEXT NOT NULL CHECK (intensity IN ('light', 'moderate', 'heavy')),
        source TEXT DEFAULT 'manual',
        notes TEXT,
        telegram_user_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ensureTableColumns(pool, 'frost_registry', FROST_REGISTRY_COLUMNS);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS frost_registry_event_date_unique_idx
      ON frost_registry (event_date)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS frost_registry_event_date_idx
      ON frost_registry (event_date DESC)
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
  ensureFrostRegistryTable,
};
