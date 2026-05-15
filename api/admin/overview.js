const { pool } = require('../../lib/db');
const { ensureHorseProfileColumns } = require('../../lib/horse-profile');
const {
  ensurePaddockTables,
  listPaddockStatus,
  listPaddockOccupancy,
  listPaddockWorkHistory,
  listHorseGroups,
  listHorseGroupHistory,
} = require('../../lib/paddocks');
const {
  listAdminModuleSettings,
  buildAdminModuleEnabledMap,
  isAdminModuleEnabled,
} = require('../../lib/admin-modules');
const { ensureFarmSettingsTable, getFarmSettings } = require('../../lib/farm-settings');
const { ensureRainRegistryTable } = require('../../lib/rain-registry');
const { ensureFrostRegistryTable } = require('../../lib/frost-registry');
const { toIsoDateString } = require('../../lib/date-helpers');
const { requireAdminApiAuth } = require('../../lib/admin-auth');

function parsePositiveInt(value, fallbackValue) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
}

const DEWORM_ALERT_DAYS_AHEAD = parsePositiveInt(process.env.DEWORM_ALERT_DAYS_AHEAD, 3);
const FARRIER_ALERT_DAYS_AHEAD = parsePositiveInt(process.env.FARRIER_ALERT_DAYS_AHEAD, 3);
const LOW_STOCK_THRESHOLD = parsePositiveInt(process.env.LOW_STOCK_THRESHOLD, 5);

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToDateString(dateString, daysToAdd) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}

function normalizePgCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? count : 0;
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

function classifyDueRows(rows, daysAhead) {
  const today = todayDateString();
  const soonLimit = addDaysToDateString(today, daysAhead);
  const overdue = [];
  const dueSoon = [];

  for (const row of rows) {
    const nextDue = toIsoDateString(row.next_due_date) || '';
    if (!nextDue) {
      continue;
    }

    if (nextDue < today) {
      overdue.push(row);
      continue;
    }

    if (nextDue >= today && nextDue <= soonLimit) {
      dueSoon.push(row);
    }
  }

  return { overdue, dueSoon };
}

function filterRecentActivityRows(rows, enabledModules) {
  const categoryToModuleKey = {
    deworming: 'deworm',
    farrier: 'farrier',
    health: 'health',
    treatment_plan: 'health',
    dose: 'health',
    stock: 'feed',
    grazing: 'paddocks',
    paddock: 'paddocks',
    rain: 'rain',
    frost: 'rain',
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
    await ensureHorseProfileColumns();
    await ensurePaddockTables();
    await ensureFarmSettingsTable();
    await ensureRainRegistryTable();
    await ensureFrostRegistryTable();
    const moduleSettings = await listAdminModuleSettings();
    const farmSettings = await getFarmSettings();
    const enabledModules = buildAdminModuleEnabledMap(moduleSettings);

    const [
      horseCountResult,
      horsesResult,
      paddockStatusRows,
      horseGroupRows,
      horseGroupHistoryRows,
      paddockOccupancyRows,
      paddockWorkHistoryRows,
      feedItemCountResult,
      lowStockCountResult,
      lowStockResult,
      stockResult,
      latestDewormResult,
      dewormingHistoryResult,
      latestFarrierResult,
      farrierHistoryResult,
      recentActivityResult,
      rainSummaryResult,
      rainRecentResult,
      rainDailyResult,
      rainYearlyResult,
      frostRecentResult,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM horses'),
      pool.query(
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
        ORDER BY name ASC
        `
      ),
      listPaddockStatus(),
      listHorseGroups(),
      listHorseGroupHistory({ limit: 80 }),
      listPaddockOccupancy({ limit: 120 }),
      listPaddockWorkHistory({ limit: 120 }),
      pool.query('SELECT COUNT(*)::int AS count FROM feed_items'),
      pool.query('SELECT COUNT(*)::int AS count FROM feed_items WHERE current_stock <= $1', [
        LOW_STOCK_THRESHOLD,
      ]),
      pool.query(
        `
        SELECT id, name, unit, current_stock
        FROM feed_items
        WHERE current_stock <= $1
        ORDER BY current_stock ASC, name ASC
        LIMIT 20
        `,
        [LOW_STOCK_THRESHOLD]
      ),
      pool.query(
        `
        SELECT id, name, unit, current_stock
        FROM feed_items
        ORDER BY name ASC
        LIMIT 100
        `
      ),
      pool.query(
        `
        WITH latest AS (
          SELECT DISTINCT ON (d.horse_id)
            d.horse_id,
            h.name AS horse_name,
            d.product_name,
            d.second_dose_date,
            d.next_due_date
          FROM deworming_events d
          JOIN horses h ON h.id = d.horse_id
          WHERE d.next_due_date IS NOT NULL
          ORDER BY
            d.horse_id,
            COALESCE(d.event_date, d.created_at::date) DESC,
            CASE WHEN d.second_dose_date IS NULL THEN 1 ELSE 0 END ASC,
            d.id DESC
        )
        SELECT horse_id, horse_name, product_name, second_dose_date, next_due_date
        FROM latest
        ORDER BY next_due_date ASC, horse_name ASC
        `
      ),
      pool.query(
        `
        WITH ranked AS (
          SELECT
            d.id,
            d.horse_id,
            h.name AS horse_name,
            d.product_name,
            d.event_date,
            d.second_dose_date,
            d.next_due_date,
            d.created_at,
            ROW_NUMBER() OVER (
              PARTITION BY d.horse_id, LOWER(d.product_name), COALESCE(d.event_date, d.created_at::date)
              ORDER BY
                CASE WHEN d.second_dose_date IS NULL THEN 1 ELSE 0 END ASC,
                d.id DESC
            ) AS rn
          FROM deworming_events d
          JOIN horses h ON h.id = d.horse_id
        )
        SELECT
          id,
          horse_id,
          horse_name,
          product_name,
          event_date,
          second_dose_date,
          next_due_date,
          created_at
        FROM ranked
        WHERE rn = 1
        ORDER BY COALESCE(event_date, created_at::date) DESC, horse_name ASC, id DESC
        LIMIT 500
        `
      ),
      pool.query(
        `
        WITH latest AS (
          SELECT DISTINCT ON (f.horse_id)
            f.horse_id,
            h.name AS horse_name,
            f.service_type,
            f.next_due_date
          FROM farrier_events f
          JOIN horses h ON h.id = f.horse_id
          WHERE f.next_due_date IS NOT NULL
          ORDER BY
            f.horse_id,
            COALESCE(f.event_date, f.created_at::date) DESC,
            f.id DESC
        )
        SELECT horse_id, horse_name, service_type, next_due_date
        FROM latest
        ORDER BY next_due_date ASC, horse_name ASC
        `
      ),
      pool.query(
        `
        SELECT
          f.id,
          f.horse_id,
          h.name AS horse_name,
          f.service_type,
          f.event_date,
          f.next_due_date,
          f.created_at
        FROM farrier_events f
        JOIN horses h ON h.id = f.horse_id
        ORDER BY COALESCE(f.event_date, f.created_at::date) DESC, h.name ASC, f.id DESC
        LIMIT 500
        `
      ),
      pool.query(
        `
        SELECT *
        FROM (
          SELECT
            COALESCE(f.event_date::timestamp, f.created_at) AS sort_at,
            'feed' AS category,
            h.name AS horse_name,
            CONCAT(i.name, ' ', f.quantity, ' ', f.unit) AS detail
          FROM feed_events f
          JOIN horses h ON h.id = f.horse_id
          JOIN feed_items i ON i.id = f.feed_item_id

          UNION ALL

          SELECT
            COALESCE(d.event_date::timestamp, d.created_at) AS sort_at,
            'deworming' AS category,
            h.name AS horse_name,
            CONCAT(d.product_name, ' | next due: ', COALESCE(d.next_due_date::text, 'N/A')) AS detail
          FROM (
            SELECT
              de.*,
              ROW_NUMBER() OVER (
                PARTITION BY de.horse_id, LOWER(de.product_name), COALESCE(de.event_date, de.created_at::date)
                ORDER BY
                  CASE WHEN de.second_dose_date IS NULL THEN 1 ELSE 0 END ASC,
                  de.id DESC
              ) AS rn
            FROM deworming_events de
          ) d
          JOIN horses h ON h.id = d.horse_id
          WHERE d.rn = 1

          UNION ALL

          SELECT
            COALESCE(fr.event_date::timestamp, fr.created_at) AS sort_at,
            'farrier' AS category,
            h.name AS horse_name,
            CONCAT(fr.service_type, ' | next due: ', COALESCE(fr.next_due_date::text, 'N/A')) AS detail
          FROM farrier_events fr
          JOIN horses h ON h.id = fr.horse_id

          UNION ALL

          SELECT
            COALESCE(hh.event_date::timestamp, hh.created_at) AS sort_at,
            'health' AS category,
            h.name AS horse_name,
            CONCAT(hh.event_type, ' | ', hh.description) AS detail
          FROM horse_health_events hh
          JOIN horses h ON h.id = hh.horse_id

          UNION ALL

          SELECT
            COALESCE(s.event_date::timestamp, s.created_at) AS sort_at,
            'stock' AS category,
            '-' AS horse_name,
            CONCAT(i.name, ' | ', s.event_type, ' ', s.quantity, ' ', s.unit, COALESCE(CONCAT(' | ', s.notes), '')) AS detail
          FROM stock_events s
          JOIN feed_items i ON i.id = s.feed_item_id

          UNION ALL

          SELECT
            ge.entered_at::timestamp AS sort_at,
            'grazing' AS category,
            h.name AS horse_name,
            CONCAT('entered ', p.name, COALESCE(CONCAT(' | ', ge.entry_notes), '')) AS detail
          FROM grazing_events ge
          JOIN horses h ON h.id = ge.horse_id
          JOIN paddocks p ON p.id = ge.paddock_id

          UNION ALL

          SELECT
            ge.exited_at::timestamp AS sort_at,
            'grazing' AS category,
            h.name AS horse_name,
            CONCAT(
              'left ',
              p.name,
              ' | stayed ',
              GREATEST(1, (ge.exited_at - ge.entered_at) + 1),
              ' days',
              COALESCE(CONCAT(' | ', ge.exit_notes), '')
            ) AS detail
          FROM grazing_events ge
          JOIN horses h ON h.id = ge.horse_id
          JOIN paddocks p ON p.id = ge.paddock_id
          WHERE ge.exited_at IS NOT NULL

          UNION ALL

          SELECT
            pwe.event_date::timestamp AS sort_at,
            'paddock' AS category,
            '-' AS horse_name,
            CONCAT(
              p.name,
              ' | ',
              REPLACE(INITCAP(REPLACE(pwe.event_type, '_', ' ')), 'Prep', 'Prep'),
              COALESCE(CONCAT(' | ready: ', pwe.ready_to_graze_on::text), ''),
              COALESCE(CONCAT(' | ', pwe.notes), '')
            ) AS detail
          FROM paddock_work_events pwe
          JOIN paddocks p ON p.id = pwe.paddock_id

          UNION ALL

          SELECT
            tl.administered_at AS sort_at,
            'dose' AS category,
            h.name AS horse_name,
            CONCAT(tp.medication, ' ', tp.dosage) AS detail
          FROM treatment_logs tl
          JOIN treatment_plans tp ON tp.id = tl.treatment_plan_id
          JOIN horses h ON h.id = tp.horse_id

          UNION ALL

          SELECT
            r.event_date::timestamp AS sort_at,
            'rain' AS category,
            '-' AS horse_name,
            CONCAT(r.rain_mm, ' mm', COALESCE(CONCAT(' | ', r.notes), '')) AS detail
          FROM rain_registry r
          WHERE
            COALESCE(r.source, 'manual') <> 'weather_sync'
            AND (
              r.rain_mm > 0
              OR COALESCE(NULLIF(TRIM(r.notes), ''), '') <> ''
            )

          UNION ALL

          SELECT
            f.event_date::timestamp AS sort_at,
            'frost' AS category,
            '-' AS horse_name,
            CONCAT(INITCAP(f.intensity), ' frost', COALESCE(CONCAT(' | ', f.notes), '')) AS detail
          FROM frost_registry f
        ) activity_rows
        ORDER BY sort_at DESC
        LIMIT 60
        `
      ),
      pool.query(
        `
        SELECT
          COALESCE(SUM(CASE WHEN event_date = CURRENT_DATE THEN rain_mm END), 0) AS rain_today_mm,
          COALESCE(SUM(CASE WHEN event_date >= CURRENT_DATE - 6 THEN rain_mm END), 0) AS rain_7d_mm,
          COUNT(*) FILTER (WHERE event_date >= CURRENT_DATE - 6 AND rain_mm > 0)::int AS rain_days_7
        FROM rain_registry
        WHERE COALESCE(source, 'manual') <> 'weather_sync'
        `
      ),
      pool.query(
        `
        SELECT
          id,
          event_date,
          rain_mm,
          min_temp_c,
          max_temp_c,
          source,
          notes,
          weather_source
        FROM rain_registry
        WHERE COALESCE(source, 'manual') <> 'weather_sync'
        ORDER BY event_date DESC, id DESC
        LIMIT 60
        `
      ),
      pool.query(
        `
        SELECT
          series_day::date AS event_date,
          COALESCE(rain_row.rain_mm, 0)::numeric AS rain_mm,
          weather_row.min_temp_c,
          weather_row.max_temp_c
        FROM generate_series(
          CURRENT_DATE - INTERVAL '364 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        ) AS series_day
        LEFT JOIN rain_registry rain_row
          ON rain_row.event_date = series_day::date
         AND COALESCE(rain_row.source, 'manual') <> 'weather_sync'
        LEFT JOIN rain_registry weather_row
          ON weather_row.event_date = series_day::date
        ORDER BY series_day ASC
        `
      ),
      pool.query(
        `
        SELECT
          EXTRACT(YEAR FROM event_date)::int AS year,
          COALESCE(SUM(rain_mm), 0)::numeric AS total_mm,
          COUNT(*) FILTER (WHERE rain_mm > 0)::int AS rainy_days,
          COALESCE(AVG(NULLIF(rain_mm, 0)), 0)::numeric AS avg_mm_per_event,
          COALESCE(MAX(rain_mm), 0)::numeric AS peak_mm
        FROM rain_registry
        WHERE COALESCE(source, 'manual') <> 'weather_sync'
        GROUP BY EXTRACT(YEAR FROM event_date)
        ORDER BY year DESC
        `
      ),
      pool.query(
        `
        SELECT
          id,
          event_date,
          intensity,
          source,
          notes
        FROM frost_registry
        ORDER BY event_date DESC, id DESC
        LIMIT 60
        `
      ),
    ]);

    const dewormingDue = classifyDueRows(
      latestDewormResult.rows.map((row) => ({
        horse_id: row.horse_id,
        horse_name: row.horse_name,
        product_name: row.product_name,
        second_dose_date: toIsoDateString(row.second_dose_date),
        next_due_date: toIsoDateString(row.next_due_date),
      })),
      DEWORM_ALERT_DAYS_AHEAD
    );

    const farrierDue = classifyDueRows(
      latestFarrierResult.rows.map((row) => ({
        horse_id: row.horse_id,
        horse_name: row.horse_name,
        service_type: row.service_type,
        next_due_date: toIsoDateString(row.next_due_date),
      })),
      FARRIER_ALERT_DAYS_AHEAD
    );

    const trainingModuleEnabled = isAdminModuleEnabled('training', enabledModules);
    const groupsModuleEnabled = isAdminModuleEnabled('groups', enabledModules);
    const paddocksModuleEnabled = isAdminModuleEnabled('paddocks', enabledModules);
    const feedModuleEnabled = isAdminModuleEnabled('feed', enabledModules);
    const dewormModuleEnabled = isAdminModuleEnabled('deworm', enabledModules);
    const farrierModuleEnabled = isAdminModuleEnabled('farrier', enabledModules);
    const rainModuleEnabled = isAdminModuleEnabled('rain', enabledModules);

    const horses = horsesResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      date_of_birth: toIsoDateString(row.date_of_birth),
      age_years: row.age_years == null ? null : Number(row.age_years),
      color: row.color || null,
      activity: row.activity || null,
      sex: row.sex || null,
      training_status: trainingModuleEnabled ? normalizeTrainingStatus(row.training_status) : null,
    }));

    const horsesInTraining = trainingModuleEnabled
      ? horses.filter((horse) => horse.training_status === 'in training')
      : [];
    const horsesBreakingIn = trainingModuleEnabled
      ? horses.filter((horse) => horse.training_status === 'breaking in')
      : [];
    const filteredPaddockRows = paddocksModuleEnabled ? paddockStatusRows : [];
    const filteredHorseGroupRows = groupsModuleEnabled ? horseGroupRows : [];
    const filteredHorseGroupHistoryRows = groupsModuleEnabled ? horseGroupHistoryRows : [];
    const filteredPaddockOccupancyRows = paddocksModuleEnabled ? paddockOccupancyRows : [];
    const filteredPaddockWorkHistoryRows = paddocksModuleEnabled ? paddockWorkHistoryRows : [];
    const filteredLowStockRows = feedModuleEnabled ? lowStockResult.rows : [];
    const filteredStockRows = feedModuleEnabled ? stockResult.rows : [];
    const filteredDewormingHistoryRows = dewormModuleEnabled ? dewormingHistoryResult.rows : [];
    const filteredFarrierHistoryRows = farrierModuleEnabled ? farrierHistoryResult.rows : [];
    const filteredDewormingDue = dewormModuleEnabled ? dewormingDue : { overdue: [], dueSoon: [] };
    const filteredFarrierDue = farrierModuleEnabled ? farrierDue : { overdue: [], dueSoon: [] };
    const filteredRecentActivityRows = filterRecentActivityRows(
      recentActivityResult.rows.map((row) => ({
        at: row.sort_at instanceof Date ? row.sort_at.toISOString() : String(row.sort_at),
        category: row.category,
        horse_name: row.horse_name,
        detail: row.detail,
      })),
      enabledModules
    );
    const occupiedPaddocks = filteredPaddockRows.filter((row) => row.occupancy_state === 'occupied');
    const restingPaddocks = filteredPaddockRows.filter((row) => row.occupancy_state === 'resting');
    const rainSummary = rainModuleEnabled ? rainSummaryResult.rows[0] || {} : {};
    const rainRecentRows = rainModuleEnabled ? rainRecentResult.rows : [];
    const rainDailyRows = rainModuleEnabled ? rainDailyResult.rows : [];
    const rainYearlyRows = rainModuleEnabled ? rainYearlyResult.rows : [];
    const frostRecentRows = rainModuleEnabled ? frostRecentResult.rows : [];

    res.status(200).json({
      ok: true,
      meta: {
        refreshed_at: new Date().toISOString(),
        thresholds: {
          low_stock: LOW_STOCK_THRESHOLD,
          deworm_days_ahead: DEWORM_ALERT_DAYS_AHEAD,
          farrier_days_ahead: FARRIER_ALERT_DAYS_AHEAD,
        },
      },
      farm_settings: farmSettings,
      module_settings: moduleSettings,
      summary: {
        horses_count: normalizePgCount(horseCountResult.rows[0]?.count),
        horse_groups_count: filteredHorseGroupRows.length,
        paddocks_count: filteredPaddockRows.length,
        paddocks_occupied_count: occupiedPaddocks.length,
        paddocks_resting_count: restingPaddocks.length,
        feed_items_count: feedModuleEnabled ? normalizePgCount(feedItemCountResult.rows[0]?.count) : 0,
        low_stock_count: feedModuleEnabled ? normalizePgCount(lowStockCountResult.rows[0]?.count) : 0,
        deworm_overdue_count: filteredDewormingDue.overdue.length,
        deworm_due_soon_count: filteredDewormingDue.dueSoon.length,
        farrier_overdue_count: filteredFarrierDue.overdue.length,
        farrier_due_soon_count: filteredFarrierDue.dueSoon.length,
        in_training_count: horsesInTraining.length,
        breaking_in_count: horsesBreakingIn.length,
        rain_today_mm: Number(rainSummary.rain_today_mm || 0),
        rain_7d_mm: Number(rainSummary.rain_7d_mm || 0),
        rain_days_7: Number(rainSummary.rain_days_7 || 0),
      },
      horses,
      training: {
        in_training: horsesInTraining,
        breaking_in: horsesBreakingIn,
      },
      paddocks: filteredPaddockRows.map((row) => ({
        id: row.id,
        name: row.name,
        parent_paddock_id: row.parent_paddock_id,
        parent_paddock_name: row.parent_paddock_name,
        zone: row.zone,
        size_ha: row.size_ha,
        notes: row.notes,
        active: row.active,
        manual_rest_started_on: row.manual_rest_started_on,
        manual_rest_days: row.manual_rest_days,
        manual_rest_is_estimated: row.manual_rest_is_estimated,
        manual_rest_applies_to_descendants: row.manual_rest_applies_to_descendants,
        horse_count: row.horse_count,
        occupied_by: row.occupied_by,
        occupied_since: row.occupied_since,
        grazing_days: row.grazing_days,
        last_exited_at: row.last_exited_at,
        rest_days: row.rest_days,
        rest_source: row.rest_source,
        effective_rest_started_on: row.effective_rest_started_on,
        effective_rest_is_estimated: row.effective_rest_is_estimated,
        effective_rest_paddock_id: row.effective_rest_paddock_id,
        effective_rest_paddock_name: row.effective_rest_paddock_name,
        inherited_rest: row.inherited_rest,
        latest_work_type: row.latest_work_type,
        latest_work_type_label: row.latest_work_type_label,
        latest_work_date: row.latest_work_date,
        latest_work_notes: row.latest_work_notes,
        latest_work_applies_to_descendants: row.latest_work_applies_to_descendants,
        effective_work_paddock_id: row.effective_work_paddock_id,
        effective_work_paddock_name: row.effective_work_paddock_name,
        inherited_wait: row.inherited_wait,
        ready_to_graze_on: row.ready_to_graze_on,
        ready_after_days: row.ready_after_days,
        days_until_ready: row.days_until_ready,
        occupancy_state: row.occupancy_state,
      })),
      horse_groups: filteredHorseGroupRows.map((row) => ({
        id: row.id,
        name: row.name,
        notes: row.notes,
        active: row.active,
        member_count: row.member_count,
        members: row.members,
        member_names: row.member_names,
        current_started_at: row.current_started_at,
        current_paddock_names: paddocksModuleEnabled ? row.current_paddock_names : null,
        current_paddock_ids: paddocksModuleEnabled ? row.current_paddock_ids : [],
        current_grazing_entered_at: paddocksModuleEnabled ? row.current_grazing_entered_at : null,
        grazing_member_count: row.grazing_member_count,
      })),
      horse_group_history: filteredHorseGroupHistoryRows.map((row) => ({
        id: row.id,
        horse_id: row.horse_id,
        horse_name: row.horse_name,
        group_id: row.group_id,
        group_name: row.group_name,
        started_at: row.started_at,
        ended_at: row.ended_at,
        group_days: row.group_days,
        previous_group_id: row.previous_group_id,
        previous_group_name: row.previous_group_name,
        previous_group_days: row.previous_group_days,
        active: row.active,
      })),
      paddock_occupancy: filteredPaddockOccupancyRows.map((row) => ({
        paddock_id: row.paddock_id,
        paddock_name: row.paddock_name,
        active_horse_count: row.active_horse_count,
        active_horses: row.active_horses,
        entered_at: row.entered_at,
        exited_at: row.exited_at,
        days_grazed: row.days_grazed,
        status: row.status,
      })),
      paddock_work_history: filteredPaddockWorkHistoryRows.map((row) => ({
        id: row.id,
        paddock_id: row.paddock_id,
        paddock_name: row.paddock_name,
        applies_to_descendants: row.applies_to_descendants,
        event_type: row.event_type,
        event_type_label: row.event_type_label,
        event_date: row.event_date,
        ready_after_days: row.ready_after_days,
        ready_to_graze_on: row.ready_to_graze_on,
        days_until_ready: row.days_until_ready,
        notes: row.notes,
      })),
      reminders: {
        deworming: filteredDewormingDue,
        farrier: filteredFarrierDue,
      },
      deworming_history: filteredDewormingHistoryRows.map((row) => ({
        id: row.id,
        horse_id: row.horse_id,
        horse_name: row.horse_name,
        product_name: row.product_name,
        event_date: toIsoDateString(row.event_date),
        second_dose_date: toIsoDateString(row.second_dose_date),
        next_due_date: toIsoDateString(row.next_due_date),
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      })),
      farrier_history_registry: filteredFarrierHistoryRows.map((row) => ({
        id: row.id,
        horse_id: row.horse_id,
        horse_name: row.horse_name,
        service_type: row.service_type,
        event_date: toIsoDateString(row.event_date),
        next_due_date: toIsoDateString(row.next_due_date),
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      })),
      stock: {
        low: filteredLowStockRows.map((row) => ({
          id: row.id,
          name: row.name,
          unit: row.unit,
          current_stock: Number(row.current_stock),
        })),
        all: filteredStockRows.map((row) => ({
          id: row.id,
          name: row.name,
          unit: row.unit,
          current_stock: Number(row.current_stock),
        })),
      },
      recent_activity: filteredRecentActivityRows,
      rain: {
        recent: rainRecentRows.map((row) => ({
          id: row.id,
          event_date: toIsoDateString(row.event_date),
          rain_mm: Number(row.rain_mm),
          min_temp_c: row.min_temp_c == null ? null : Number(row.min_temp_c),
          max_temp_c: row.max_temp_c == null ? null : Number(row.max_temp_c),
          source: row.source || null,
          notes: row.notes || null,
          weather_source: row.weather_source || null,
        })),
        daily: rainDailyRows.map((row) => ({
          event_date: toIsoDateString(row.event_date),
          rain_mm: Number(row.rain_mm || 0),
          min_temp_c: row.min_temp_c == null ? null : Number(row.min_temp_c),
          max_temp_c: row.max_temp_c == null ? null : Number(row.max_temp_c),
        })),
        yearly: rainYearlyRows.map((row) => ({
          year: Number(row.year || 0),
          total_mm: Number(row.total_mm || 0),
          rainy_days: Number(row.rainy_days || 0),
          avg_mm_per_event: Number(row.avg_mm_per_event || 0),
          peak_mm: Number(row.peak_mm || 0),
        })),
      },
      frost: {
        recent: frostRecentRows.map((row) => ({
          id: row.id,
          event_date: toIsoDateString(row.event_date),
          intensity: row.intensity || null,
          source: row.source || null,
          notes: row.notes || null,
        })),
      },
    });
  } catch (error) {
    console.error('ADMIN OVERVIEW ERROR:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
