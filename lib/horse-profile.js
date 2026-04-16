const { pool } = require('./db');

let ensurePromise = null;

async function ensureHorseProfileColumns() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      ALTER TABLE horses
      ADD COLUMN IF NOT EXISTS date_of_birth DATE
    `);

    await pool.query(`
      ALTER TABLE horses
      ADD COLUMN IF NOT EXISTS color TEXT
    `);

    await pool.query(`
      ALTER TABLE horses
      ADD COLUMN IF NOT EXISTS activity TEXT
    `);

    await pool.query(`
      ALTER TABLE horses
      ADD COLUMN IF NOT EXISTS sex TEXT
    `);

    await pool.query(`
      ALTER TABLE horses
      ADD COLUMN IF NOT EXISTS training_status TEXT
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
  ensureHorseProfileColumns,
};
