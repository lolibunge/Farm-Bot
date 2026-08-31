const { pool } = require('./db');
const { ensureTableColumns } = require('./schema');

let ensurePromise = null;

const FARM_VISITS_COLUMNS = [
  { name: 'status', definition: "TEXT NOT NULL DEFAULT 'pending'" },
  { name: 'horse_id', definition: 'BIGINT REFERENCES horses(id) ON DELETE SET NULL' },
  { name: 'health_event_id', definition: 'BIGINT REFERENCES horse_health_events(id) ON DELETE SET NULL' },
];

// Categories where marking a scheduled, horse-specific task as "done" should
// also drop an entry into the horse's health history, so scheduling a vet
// visit doesn't mean losing the usual log of what was actually done.
const HEALTH_LOGGABLE_CATEGORIES = new Set(['vet', 'deworming', 'farrier']);

const ALLOWED_VISIT_STATUSES = new Set(['pending', 'done', 'missed']);

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

    await pool.query(`
      CREATE INDEX IF NOT EXISTS farm_visits_horse_id_idx
      ON farm_visits (horse_id)
    `);
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

// Updates a scheduled task's status. When it's being marked "done" for the
// first time, the task is horse-specific, and its category is one we treat
// as a real health event (vet/deworming/farrier), this also inserts a row
// into horse_health_events and links it back via health_event_id so the
// horse's history stays complete without a separate manual step.
async function updateFarmVisitStatus(id, status) {
  await ensureFarmVisitsTable();

  if (!ALLOWED_VISIT_STATUSES.has(status)) {
    throw new Error('status must be pending, done, or missed');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentResult = await client.query(
      `
      SELECT id, horse_id, category, title, event_date, notes, status, health_event_id
      FROM farm_visits
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (currentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const visit = currentResult.rows[0];

    await client.query(
      `UPDATE farm_visits SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );

    let healthEventId = visit.health_event_id;

    if (
      status === 'done' &&
      visit.horse_id &&
      !visit.health_event_id &&
      HEALTH_LOGGABLE_CATEGORIES.has(String(visit.category || '').toLowerCase())
    ) {
      const healthResult = await client.query(
        `
        INSERT INTO horse_health_events (
          horse_id,
          event_type,
          description,
          event_date,
          notes,
          telegram_user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        `,
        [
          visit.horse_id,
          visit.category,
          visit.title,
          visit.event_date,
          visit.notes || null,
          'scheduled_task',
        ]
      );

      healthEventId = healthResult.rows[0].id;

      await client.query(
        `UPDATE farm_visits SET health_event_id = $1 WHERE id = $2`,
        [healthEventId, id]
      );
    }

    await client.query('COMMIT');

    return {
      id,
      status,
      horse_id: visit.horse_id,
      health_event_id: healthEventId,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  ensureFarmVisitsTable,
  updateFarmVisitStatus,
  HEALTH_LOGGABLE_CATEGORIES,
};
