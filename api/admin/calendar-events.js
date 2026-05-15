const { pool } = require('../../lib/db');
const { ensurePaddockTables } = require('../../lib/paddocks');
const {
  listAdminModuleSettings,
  buildAdminModuleEnabledMap,
  isAdminModuleEnabled,
} = require('../../lib/admin-modules');
const { ensureRainRegistryTable } = require('../../lib/rain-registry');
const { ensureFrostRegistryTable } = require('../../lib/frost-registry');
const { ensureFeedPlanningTables, normalizeYearMonth, todayYearMonth } = require('../../lib/feed-plans');
const { requireAdminApiAuth } = require('../../lib/admin-auth');
const { toIsoDateString } = require('../../lib/date-helpers');

function parseMonth(value) {
  const normalized = normalizeYearMonth(Array.isArray(value) ? value[0] : value);
  return normalized || todayYearMonth();
}

function getMonthRange(yearMonth) {
  const normalized = parseMonth(yearMonth);
  const [year, month] = normalized.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  return {
    month: normalized,
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
  };
}

function formatTimestamp(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value == null ? null : String(value);
}

function filterCalendarEvents(rows, enabledModules) {
  const categoryToModuleKey = {
    rain: 'rain',
    frost: 'rain',
    feed: 'feed',
    stock: 'feed',
    paddock: 'paddocks',
    grazing: 'paddocks',
    group: 'groups',
    deworming: 'deworm',
    farrier: 'farrier',
    health: 'health',
    treatment: 'health',
    dose: 'health',
  };

  return rows.filter((row) => {
    const moduleKey = categoryToModuleKey[String(row.category || '').trim().toLowerCase()];
    return isAdminModuleEnabled(moduleKey, enabledModules);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!requireAdminApiAuth(req, res)) {
    return;
  }

  try {
    await ensurePaddockTables();
    await ensureRainRegistryTable();
    await ensureFrostRegistryTable();
    await ensureFeedPlanningTables();

    const moduleSettings = await listAdminModuleSettings();
    const enabledModules = buildAdminModuleEnabledMap(moduleSettings);
    const monthRange = getMonthRange(req.query?.month);

    const calendarEventsResult = await pool.query(
      `
      SELECT
        event_rows.event_key,
        event_rows.event_at,
        event_rows.event_date,
        event_rows.category,
        event_rows.title,
        event_rows.subtitle,
        event_rows.detail,
        event_rows.meta,
        event_rows.metric_value,
        event_rows.metric_unit,
        event_rows.notes
      FROM (
        SELECT
          CONCAT('rain-', r.id) AS event_key,
          r.event_date::timestamp AS event_at,
          r.event_date AS event_date,
          'rain' AS category,
          CONCAT(TRIM(TO_CHAR(r.rain_mm, 'FM999999990.##')), ' mm') AS title,
          'Rain log' AS subtitle,
          CASE
            WHEN r.min_temp_c IS NOT NULL OR r.max_temp_c IS NOT NULL THEN CONCAT(
              'Temp ',
              COALESCE(CONCAT(TRIM(TO_CHAR(r.min_temp_c, 'FM999999990.##')), 'C'), '-'),
              ' / ',
              COALESCE(CONCAT(TRIM(TO_CHAR(r.max_temp_c, 'FM999999990.##')), 'C'), '-')
            )
            ELSE 'Recorded rainfall'
          END AS detail,
          COALESCE(NULLIF(TRIM(r.source), ''), 'manual') AS meta,
          r.rain_mm::numeric AS metric_value,
          'mm' AS metric_unit,
          NULLIF(TRIM(r.notes), '') AS notes
        FROM rain_registry r
        WHERE
          r.event_date BETWEEN $1::date AND $2::date
          AND COALESCE(r.source, 'manual') <> 'weather_sync'
          AND (
            r.rain_mm > 0
            OR COALESCE(NULLIF(TRIM(r.notes), ''), '') <> ''
          )

        UNION ALL

        SELECT
          CONCAT('frost-', f.id) AS event_key,
          f.event_date::timestamp AS event_at,
          f.event_date AS event_date,
          'frost' AS category,
          CONCAT(INITCAP(f.intensity), ' frost') AS title,
          'Frost log' AS subtitle,
          'Cold morning recorded' AS detail,
          COALESCE(NULLIF(TRIM(f.source), ''), 'manual') AS meta,
          NULL::numeric AS metric_value,
          NULL::text AS metric_unit,
          NULLIF(TRIM(f.notes), '') AS notes
        FROM frost_registry f
        WHERE f.event_date BETWEEN $1::date AND $2::date

        UNION ALL

        SELECT
          CONCAT('feed-', f.id) AS event_key,
          COALESCE(f.event_date::timestamp, f.created_at) AS event_at,
          COALESCE(f.event_date, f.created_at::date) AS event_date,
          'feed' AS category,
          i.name AS title,
          h.name AS subtitle,
          CONCAT(TRIM(TO_CHAR(f.quantity, 'FM999999990.##')), ' ', f.unit) AS detail,
          CASE
            WHEN f.feed_slot IS NULL THEN 'Manual entry'
            ELSE INITCAP(f.feed_slot)
          END AS meta,
          f.quantity::numeric AS metric_value,
          f.unit AS metric_unit,
          NULL::text AS notes
        FROM feed_events f
        JOIN horses h ON h.id = f.horse_id
        JOIN feed_items i ON i.id = f.feed_item_id
        WHERE COALESCE(f.event_date, f.created_at::date) BETWEEN $1::date AND $2::date

        UNION ALL

        SELECT
          CONCAT('deworm-', ranked.id) AS event_key,
          COALESCE(ranked.event_date::timestamp, ranked.created_at) AS event_at,
          COALESCE(ranked.event_date, ranked.created_at::date) AS event_date,
          'deworming' AS category,
          ranked.product_name AS title,
          h.name AS subtitle,
          COALESCE(CONCAT('Next due ', ranked.next_due_date::text), 'Deworm cycle logged') AS detail,
          CASE
            WHEN ranked.second_dose_date IS NULL THEN 'Dose 1'
            ELSE CONCAT('Dose 2 ', ranked.second_dose_date::text)
          END AS meta,
          NULL::numeric AS metric_value,
          NULL::text AS metric_unit,
          NULL::text AS notes
        FROM (
          SELECT
            d.*,
            ROW_NUMBER() OVER (
              PARTITION BY d.horse_id, LOWER(d.product_name), COALESCE(d.event_date, d.created_at::date)
              ORDER BY
                CASE WHEN d.second_dose_date IS NULL THEN 1 ELSE 0 END ASC,
                d.id DESC
            ) AS rn
          FROM deworming_events d
          WHERE COALESCE(d.event_date, d.created_at::date) BETWEEN $1::date AND $2::date
        ) ranked
        JOIN horses h ON h.id = ranked.horse_id
        WHERE ranked.rn = 1

        UNION ALL

        SELECT
          CONCAT('farrier-', f.id) AS event_key,
          COALESCE(f.event_date::timestamp, f.created_at) AS event_at,
          COALESCE(f.event_date, f.created_at::date) AS event_date,
          'farrier' AS category,
          f.service_type AS title,
          h.name AS subtitle,
          COALESCE(CONCAT('Next due ', f.next_due_date::text), 'Farrier visit logged') AS detail,
          'Care' AS meta,
          NULL::numeric AS metric_value,
          NULL::text AS metric_unit,
          NULL::text AS notes
        FROM farrier_events f
        JOIN horses h ON h.id = f.horse_id
        WHERE COALESCE(f.event_date, f.created_at::date) BETWEEN $1::date AND $2::date

        UNION ALL

        SELECT
          CONCAT('health-', hhe.id) AS event_key,
          COALESCE(hhe.event_date::timestamp, hhe.created_at) AS event_at,
          COALESCE(hhe.event_date, hhe.created_at::date) AS event_date,
          'health' AS category,
          hhe.event_type AS title,
          h.name AS subtitle,
          hhe.description AS detail,
          'Health log' AS meta,
          NULL::numeric AS metric_value,
          NULL::text AS metric_unit,
          NULLIF(TRIM(hhe.notes), '') AS notes
        FROM horse_health_events hhe
        JOIN horses h ON h.id = hhe.horse_id
        WHERE COALESCE(hhe.event_date, hhe.created_at::date) BETWEEN $1::date AND $2::date

        UNION ALL

        SELECT
          CONCAT('stock-', s.id) AS event_key,
          COALESCE(s.event_date::timestamp, s.created_at) AS event_at,
          COALESCE(s.event_date, s.created_at::date) AS event_date,
          'stock' AS category,
          i.name AS title,
          INITCAP(REPLACE(s.event_type, '_', ' ')) AS subtitle,
          CONCAT(TRIM(TO_CHAR(s.quantity, 'FM999999990.##')), ' ', s.unit) AS detail,
          'Stock action' AS meta,
          s.quantity::numeric AS metric_value,
          s.unit AS metric_unit,
          NULLIF(TRIM(s.notes), '') AS notes
        FROM stock_events s
        JOIN feed_items i ON i.id = s.feed_item_id
        WHERE COALESCE(s.event_date, s.created_at::date) BETWEEN $1::date AND $2::date

        UNION ALL

        SELECT
          CONCAT('grazing-enter-', ge.id) AS event_key,
          ge.entered_at::timestamp AS event_at,
          ge.entered_at AS event_date,
          'grazing' AS category,
          CONCAT('Enter ', p.name) AS title,
          h.name AS subtitle,
          'Moved into paddock' AS detail,
          'Movement' AS meta,
          NULL::numeric AS metric_value,
          NULL::text AS metric_unit,
          NULLIF(TRIM(ge.entry_notes), '') AS notes
        FROM grazing_events ge
        JOIN horses h ON h.id = ge.horse_id
        JOIN paddocks p ON p.id = ge.paddock_id
        WHERE ge.entered_at BETWEEN $1::date AND $2::date

        UNION ALL

        SELECT
          CONCAT('grazing-exit-', ge.id) AS event_key,
          ge.exited_at::timestamp AS event_at,
          ge.exited_at AS event_date,
          'grazing' AS category,
          CONCAT('Exit ', p.name) AS title,
          h.name AS subtitle,
          CONCAT('Stayed ', GREATEST(1, (ge.exited_at - ge.entered_at) + 1), ' days') AS detail,
          'Movement' AS meta,
          NULL::numeric AS metric_value,
          NULL::text AS metric_unit,
          NULLIF(TRIM(ge.exit_notes), '') AS notes
        FROM grazing_events ge
        JOIN horses h ON h.id = ge.horse_id
        JOIN paddocks p ON p.id = ge.paddock_id
        WHERE ge.exited_at IS NOT NULL
          AND ge.exited_at BETWEEN $1::date AND $2::date

        UNION ALL

        SELECT
          CONCAT('group-start-', hgh.id) AS event_key,
          hgh.started_at::timestamp AS event_at,
          hgh.started_at AS event_date,
          'group' AS category,
          COALESCE(hg.name, hgh.group_name, 'Horse Group') AS title,
          h.name AS subtitle,
          'Joined group' AS detail,
          'Group move' AS meta,
          NULL::numeric AS metric_value,
          NULL::text AS metric_unit,
          NULL::text AS notes
        FROM horse_group_membership_history hgh
        JOIN horses h ON h.id = hgh.horse_id
        LEFT JOIN horse_groups hg ON hg.id = hgh.group_id
        WHERE hgh.started_at BETWEEN $1::date AND $2::date

        UNION ALL

        SELECT
          CONCAT('group-end-', hgh.id) AS event_key,
          hgh.ended_at::timestamp AS event_at,
          hgh.ended_at AS event_date,
          'group' AS category,
          COALESCE(hg.name, hgh.group_name, 'Horse Group') AS title,
          h.name AS subtitle,
          'Left group' AS detail,
          'Group move' AS meta,
          NULL::numeric AS metric_value,
          NULL::text AS metric_unit,
          NULL::text AS notes
        FROM horse_group_membership_history hgh
        JOIN horses h ON h.id = hgh.horse_id
        LEFT JOIN horse_groups hg ON hg.id = hgh.group_id
        WHERE hgh.ended_at IS NOT NULL
          AND hgh.ended_at BETWEEN $1::date AND $2::date

        UNION ALL

        SELECT
          CONCAT('paddock-', pwe.id) AS event_key,
          pwe.event_date::timestamp AS event_at,
          pwe.event_date AS event_date,
          'paddock' AS category,
          REPLACE(INITCAP(REPLACE(pwe.event_type, '_', ' ')), 'Prep', 'Prep') AS title,
          p.name AS subtitle,
          COALESCE(CONCAT('Ready ', pwe.ready_to_graze_on::text), 'Field work logged') AS detail,
          CASE
            WHEN pwe.applies_to_descendants THEN 'Whole block'
            ELSE 'Single paddock'
          END AS meta,
          NULL::numeric AS metric_value,
          NULL::text AS metric_unit,
          NULLIF(TRIM(pwe.notes), '') AS notes
        FROM paddock_work_events pwe
        JOIN paddocks p ON p.id = pwe.paddock_id
        WHERE pwe.event_date BETWEEN $1::date AND $2::date

        UNION ALL

        SELECT
          CONCAT('treatment-', tp.id) AS event_key,
          COALESCE(tp.start_date::timestamp, tp.created_at) AS event_at,
          COALESCE(tp.start_date, tp.created_at::date) AS event_date,
          'treatment' AS category,
          tp.medication AS title,
          h.name AS subtitle,
          CONCAT(tp.dosage, ' • ', tp.frequency, ' • ', tp.duration_days, ' days') AS detail,
          'Treatment plan' AS meta,
          NULL::numeric AS metric_value,
          NULL::text AS metric_unit,
          NULL::text AS notes
        FROM treatment_plans tp
        JOIN horses h ON h.id = tp.horse_id
        WHERE COALESCE(tp.start_date, tp.created_at::date) BETWEEN $1::date AND $2::date

        UNION ALL

        SELECT
          CONCAT('dose-', tl.id) AS event_key,
          tl.administered_at AS event_at,
          tl.administered_at::date AS event_date,
          'dose' AS category,
          tp.medication AS title,
          h.name AS subtitle,
          tp.dosage AS detail,
          'Treatment dose' AS meta,
          NULL::numeric AS metric_value,
          NULL::text AS metric_unit,
          NULL::text AS notes
        FROM treatment_logs tl
        JOIN treatment_plans tp ON tp.id = tl.treatment_plan_id
        JOIN horses h ON h.id = tp.horse_id
        WHERE tl.administered_at::date BETWEEN $1::date AND $2::date
      ) event_rows
      ORDER BY event_rows.event_at ASC, event_rows.event_key ASC
      `,
      [monthRange.start_date, monthRange.end_date]
    );

    const filteredEvents = filterCalendarEvents(
      calendarEventsResult.rows.map((row) => ({
        key: row.event_key,
        event_at: formatTimestamp(row.event_at),
        event_date: toIsoDateString(row.event_date),
        category: row.category,
        title: row.title,
        subtitle: row.subtitle || null,
        detail: row.detail || null,
        meta: row.meta || null,
        metric_value: row.metric_value == null ? null : Number(row.metric_value),
        metric_unit: row.metric_unit || null,
        notes: row.notes || null,
      })),
      enabledModules
    );

    res.status(200).json({
      ok: true,
      month: monthRange.month,
      range_start: monthRange.start_date,
      range_end: monthRange.end_date,
      today: new Date().toISOString().slice(0, 10),
      events: filteredEvents,
    });
  } catch (error) {
    console.error('ADMIN CALENDAR EVENTS ERROR:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
