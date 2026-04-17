const { pool } = require('../../lib/db');
const { ensureHorseProfileColumns } = require('../../lib/horse-profile');
const {
  ensurePaddockTables,
  listGrazingHistory,
  getHorseCurrentGrazing,
} = require('../../lib/paddocks');
const { toIsoDateString } = require('../../lib/date-helpers');
const { requireAdminApiAuth } = require('../../lib/admin-auth');

function parseHorseId(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function normalizeTrainingStatus(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');

  if (!normalized) {
    return null;
  }

  if (normalized === 'in training' || normalized === 'training' || normalized === 'intraining') {
    return 'in training';
  }

  if (
    normalized === 'breaking in' ||
    normalized === 'breaking' ||
    normalized === 'break in' ||
    normalized === 'breakingin' ||
    normalized === 'for breaking in' ||
    normalized === 'horse for breaking in'
  ) {
    return 'breaking in';
  }

  return null;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!requireAdminApiAuth(req, res)) {
    return;
  }

  const horseIdValue = Array.isArray(req.query?.horseId)
    ? req.query.horseId[0]
    : req.query?.horseId;
  const horseId = parseHorseId(horseIdValue);

  if (!horseId) {
    res.status(400).json({ ok: false, error: 'horseId query param is required' });
    return;
  }

  try {
    await ensureHorseProfileColumns();
    await ensurePaddockTables();

    const horseResult = await pool.query(
      `
      SELECT
        id,
        name,
        date_of_birth,
        color,
        activity,
        sex,
        training_status,
        CASE
          WHEN date_of_birth IS NULL THEN NULL
          ELSE DATE_PART('year', AGE(CURRENT_DATE, date_of_birth))::int
        END AS age_years
      FROM horses
      WHERE id = $1
      LIMIT 1
      `,
      [horseId]
    );

    if (horseResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: 'Horse not found' });
      return;
    }

    const [
      historyResult,
      feedHistoryResult,
      dewormHistoryResult,
      farrierHistoryResult,
      healthHistoryResult,
      grazingHistoryRows,
      currentGrazing,
    ] = await Promise.all([
      pool.query(
        `
        SELECT *
        FROM (
          SELECT
            COALESCE(f.event_date::timestamp, f.created_at) AS sort_at,
            'feed' AS category,
            CONCAT(i.name, ' ', f.quantity, ' ', f.unit) AS detail
          FROM feed_events f
          JOIN feed_items i ON i.id = f.feed_item_id
          WHERE f.horse_id = $1

          UNION ALL

          SELECT
            COALESCE(d.event_date::timestamp, d.created_at) AS sort_at,
            'deworming' AS category,
            CONCAT(
              d.product_name,
              ' | second dose: ',
              COALESCE(d.second_dose_date::text, 'N/A'),
              ' | next due: ',
              COALESCE(d.next_due_date::text, 'N/A')
            ) AS detail
          FROM (
            SELECT
              de.*,
              ROW_NUMBER() OVER (
                PARTITION BY LOWER(de.product_name), COALESCE(de.event_date, de.created_at::date)
                ORDER BY
                  CASE WHEN de.second_dose_date IS NULL THEN 1 ELSE 0 END ASC,
                  de.id DESC
              ) AS rn
            FROM deworming_events de
            WHERE de.horse_id = $1
          ) d
          WHERE d.rn = 1

          UNION ALL

          SELECT
            COALESCE(fr.event_date::timestamp, fr.created_at) AS sort_at,
            'farrier' AS category,
            CONCAT(fr.service_type, ' | next due: ', COALESCE(fr.next_due_date::text, 'N/A')) AS detail
          FROM farrier_events fr
          WHERE fr.horse_id = $1

          UNION ALL

          SELECT
            COALESCE(hh.event_date::timestamp, hh.created_at) AS sort_at,
            'health' AS category,
            CONCAT(hh.event_type, ' | ', hh.description) AS detail
          FROM horse_health_events hh
          WHERE hh.horse_id = $1

          UNION ALL

          SELECT
            COALESCE(ge.exited_at::timestamp, ge.entered_at::timestamp) AS sort_at,
            'grazing' AS category,
            CONCAT(
              p.name,
              ' | in: ',
              ge.entered_at::text,
              ' | out: ',
              COALESCE(ge.exited_at::text, 'Current'),
              ' | days: ',
              CASE
                WHEN ge.exited_at IS NULL
                  THEN GREATEST(1, (CURRENT_DATE - ge.entered_at) + 1)
                ELSE GREATEST(1, (ge.exited_at - ge.entered_at) + 1)
              END,
              COALESCE(CONCAT(' | group: ', sg.name), ''),
              COALESCE(CONCAT(' | note: ', ge.entry_notes), ''),
              COALESCE(CONCAT(' | exit note: ', ge.exit_notes), '')
            ) AS detail
          FROM grazing_events ge
          JOIN paddocks p ON p.id = ge.paddock_id
          LEFT JOIN horse_groups sg ON sg.id = ge.source_group_id
          WHERE ge.horse_id = $1

          UNION ALL

          SELECT
            COALESCE(tp.start_date::timestamp, tp.created_at) AS sort_at,
            'treatment_plan' AS category,
            CONCAT(
              tp.medication,
              ' ',
              tp.dosage,
              ' | frequency: ',
              tp.frequency,
              ' | duration: ',
              tp.duration_days,
              ' days'
            ) AS detail
          FROM treatment_plans tp
          WHERE tp.horse_id = $1

          UNION ALL

          SELECT
            tl.administered_at AS sort_at,
            'dose' AS category,
            CONCAT(tp.medication, ' ', tp.dosage) AS detail
          FROM treatment_logs tl
          JOIN treatment_plans tp ON tp.id = tl.treatment_plan_id
          WHERE tp.horse_id = $1
        ) history_rows
        ORDER BY sort_at DESC
        LIMIT 120
        `,
        [horseId]
      ),
      pool.query(
        `
        SELECT
          f.id,
          COALESCE(f.event_date::timestamp, f.created_at) AS at,
          f.event_date,
          i.name AS feed_item,
          f.quantity,
          f.unit
        FROM feed_events f
        JOIN feed_items i ON i.id = f.feed_item_id
        WHERE f.horse_id = $1
        ORDER BY COALESCE(f.event_date, f.created_at::date) DESC, f.id DESC
        LIMIT 40
        `,
        [horseId]
      ),
      pool.query(
        `
        WITH ranked AS (
          SELECT
            d.id,
            COALESCE(d.event_date::timestamp, d.created_at) AS at,
            d.event_date,
            d.product_name,
            d.second_dose_date,
            d.next_due_date,
            d.created_at,
            ROW_NUMBER() OVER (
              PARTITION BY LOWER(d.product_name), COALESCE(d.event_date, d.created_at::date)
              ORDER BY
                CASE WHEN d.second_dose_date IS NULL THEN 1 ELSE 0 END ASC,
                d.id DESC
            ) AS rn
          FROM deworming_events d
          WHERE d.horse_id = $1
        )
        SELECT
          id,
          at,
          event_date,
          product_name,
          second_dose_date,
          next_due_date
        FROM ranked
        WHERE rn = 1
        ORDER BY COALESCE(event_date, created_at::date) DESC, id DESC
        LIMIT 40
        `,
        [horseId]
      ),
      pool.query(
        `
        SELECT
          COALESCE(f.event_date::timestamp, f.created_at) AS at,
          f.service_type,
          f.next_due_date
        FROM farrier_events f
        WHERE f.horse_id = $1
        ORDER BY COALESCE(f.event_date, f.created_at::date) DESC, f.id DESC
        LIMIT 40
        `,
        [horseId]
      ),
      pool.query(
        `
        SELECT
          COALESCE(h.event_date::timestamp, h.created_at) AS at,
          h.event_type,
          h.description
        FROM horse_health_events h
        WHERE h.horse_id = $1
        ORDER BY COALESCE(h.event_date, h.created_at::date) DESC, h.id DESC
        LIMIT 40
        `,
        [horseId]
      ),
      listGrazingHistory({ horseId, limit: 40 }),
      getHorseCurrentGrazing(horseId),
    ]);

    res.status(200).json({
      ok: true,
      horse: {
        id: horseResult.rows[0].id,
        name: horseResult.rows[0].name,
        date_of_birth: toIsoDateString(horseResult.rows[0].date_of_birth),
        age_years:
          horseResult.rows[0].age_years == null ? null : Number(horseResult.rows[0].age_years),
        color: horseResult.rows[0].color || null,
        activity: horseResult.rows[0].activity || null,
        sex: horseResult.rows[0].sex || null,
        training_status: normalizeTrainingStatus(horseResult.rows[0].training_status),
      },
      history: historyResult.rows.map((row) => ({
        at: row.sort_at instanceof Date ? row.sort_at.toISOString() : String(row.sort_at),
        category: row.category,
        detail: row.detail,
      })),
      feed_history: feedHistoryResult.rows.map((row) => ({
        id: row.id,
        at: row.at instanceof Date ? row.at.toISOString() : String(row.at),
        event_date: toIsoDateString(row.event_date),
        feed_item: row.feed_item,
        quantity: Number(row.quantity),
        unit: row.unit,
      })),
      deworming_history: dewormHistoryResult.rows.map((row) => ({
        id: row.id,
        at: row.at instanceof Date ? row.at.toISOString() : String(row.at),
        event_date: toIsoDateString(row.event_date),
        product_name: row.product_name,
        second_dose_date: toIsoDateString(row.second_dose_date),
        next_due_date: toIsoDateString(row.next_due_date),
      })),
      farrier_history: farrierHistoryResult.rows.map((row) => ({
        at: row.at instanceof Date ? row.at.toISOString() : String(row.at),
        service_type: row.service_type,
        next_due_date: toIsoDateString(row.next_due_date),
      })),
      health_history: healthHistoryResult.rows.map((row) => ({
        at: row.at instanceof Date ? row.at.toISOString() : String(row.at),
        event_type: row.event_type,
        description: row.description,
      })),
      grazing_history: grazingHistoryRows.map((row) => ({
        id: row.id,
        paddock_id: row.paddock_id,
        paddock_name: row.paddock_name,
        entered_at: row.entered_at,
        exited_at: row.exited_at,
        grazing_days: row.grazing_days,
        entry_notes: row.entry_notes,
        exit_notes: row.exit_notes,
        source_group_id: row.source_group_id,
        source_group_name: row.source_group_name,
        active: row.active,
      })),
      current_grazing: currentGrazing
        ? {
            id: currentGrazing.id,
            paddock_id: currentGrazing.paddock_id,
            paddock_name: currentGrazing.paddock_name,
            entered_at: currentGrazing.entered_at,
            grazing_days: currentGrazing.grazing_days,
            entry_notes: currentGrazing.entry_notes,
            source_group_id: currentGrazing.source_group_id,
            source_group_name: currentGrazing.source_group_name,
          }
        : null,
    });
  } catch (error) {
    console.error('ADMIN HORSE HISTORY ERROR:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
