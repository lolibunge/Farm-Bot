const { pool } = require('./db');
const { ensureTableColumns } = require('./schema');

let ensurePromise = null;

const RAIN_REGISTRY_COLUMNS = [
  { name: 'source', definition: "TEXT DEFAULT 'manual'" },
  { name: 'notes', definition: 'TEXT' },
  { name: 'telegram_user_id', definition: 'TEXT' },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
  { name: 'updated_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
  { name: 'min_temp_c', definition: 'NUMERIC(6,2)' },
  { name: 'max_temp_c', definition: 'NUMERIC(6,2)' },
  { name: 'weather_source', definition: 'TEXT' },
];

async function ensureRainRegistryTable() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rain_registry (
        id BIGSERIAL PRIMARY KEY,
        event_date DATE NOT NULL UNIQUE,
        rain_mm NUMERIC(7,2) NOT NULL CHECK (rain_mm >= 0),
        source TEXT DEFAULT 'manual',
        notes TEXT,
        telegram_user_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ensureTableColumns(pool, 'rain_registry', RAIN_REGISTRY_COLUMNS);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS rain_registry_event_date_unique_idx
      ON rain_registry (event_date)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS rain_registry_event_date_idx
      ON rain_registry (event_date DESC)
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
  ensureRainRegistryTable,
};
