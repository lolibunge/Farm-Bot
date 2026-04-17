const { pool } = require('./db');

let ensurePromise = null;

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

    await pool.query(`
      ALTER TABLE rain_registry
      ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
    `);

    await pool.query(`
      ALTER TABLE rain_registry
      ADD COLUMN IF NOT EXISTS notes TEXT
    `);

    await pool.query(`
      ALTER TABLE rain_registry
      ADD COLUMN IF NOT EXISTS telegram_user_id TEXT
    `);

    await pool.query(`
      ALTER TABLE rain_registry
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await pool.query(`
      ALTER TABLE rain_registry
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

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
