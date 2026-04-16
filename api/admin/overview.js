const { pool } = require('../../lib/db');
const { ensureHorseProfileColumns } = require('../../lib/horse-profile');
const { ensureRainRegistryTable } = require('../../lib/rain-registry');
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
    await ensureRainRegistryTable();

    const [
      horseCountResult,
      horsesResult,
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
          COUNT(*) FILTER (WHERE event_date >= CURRENT_DATE - 6)::int AS rain_days_7
        FROM rain_registry
        `
      ),
      pool.query(
        `
        SELECT
          id,
          event_date,
          rain_mm,
          source,
          notes
        FROM rain_registry
        ORDER BY event_date DESC, id DESC
        LIMIT 60
        `
      ),
      pool.query(
        `
        SELECT
          series_day::date AS event_date,
          COALESCE(r.rain_mm, 0)::numeric AS rain_mm
        FROM generate_series(
          CURRENT_DATE - INTERVAL '364 days',
          CURRENT_DATE,
          INTERVAL '1 day'
        ) AS series_day
        LEFT JOIN rain_registry r
          ON r.event_date = series_day::date
        ORDER BY series_day ASC
        `
      ),
      pool.query(
        `
        SELECT
          EXTRACT(YEAR FROM event_date)::int AS year,
          COALESCE(SUM(rain_mm), 0)::numeric AS total_mm,
          COUNT(*)::int AS rainy_days,
          COALESCE(AVG(rain_mm), 0)::numeric AS avg_mm_per_event,
          COALESCE(MAX(rain_mm), 0)::numeric AS peak_mm
        FROM rain_registry
        GROUP BY EXTRACT(YEAR FROM event_date)
        ORDER BY year DESC
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

    const horses = horsesResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      date_of_birth: toIsoDateString(row.date_of_birth),
      age_years: row.age_years == null ? null : Number(row.age_years),
      color: row.color || null,
      activity: row.activity || null,
      sex: row.sex || null,
      training_status: normalizeTrainingStatus(row.training_status),
    }));

    const horsesInTraining = horses.filter((horse) => horse.training_status === 'in training');
    const horsesBreakingIn = horses.filter((horse) => horse.training_status === 'breaking in');
    const rainSummary = rainSummaryResult.rows[0] || {};

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
      summary: {
        horses_count: normalizePgCount(horseCountResult.rows[0]?.count),
        feed_items_count: normalizePgCount(feedItemCountResult.rows[0]?.count),
        low_stock_count: normalizePgCount(lowStockCountResult.rows[0]?.count),
        deworm_overdue_count: dewormingDue.overdue.length,
        deworm_due_soon_count: dewormingDue.dueSoon.length,
        farrier_overdue_count: farrierDue.overdue.length,
        farrier_due_soon_count: farrierDue.dueSoon.length,
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
      reminders: {
        deworming: dewormingDue,
        farrier: farrierDue,
      },
      deworming_history: dewormingHistoryResult.rows.map((row) => ({
        id: row.id,
        horse_id: row.horse_id,
        horse_name: row.horse_name,
        product_name: row.product_name,
        event_date: toIsoDateString(row.event_date),
        second_dose_date: toIsoDateString(row.second_dose_date),
        next_due_date: toIsoDateString(row.next_due_date),
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      })),
      farrier_history_registry: farrierHistoryResult.rows.map((row) => ({
        id: row.id,
        horse_id: row.horse_id,
        horse_name: row.horse_name,
        service_type: row.service_type,
        event_date: toIsoDateString(row.event_date),
        next_due_date: toIsoDateString(row.next_due_date),
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      })),
      stock: {
        low: lowStockResult.rows.map((row) => ({
          id: row.id,
          name: row.name,
          unit: row.unit,
          current_stock: Number(row.current_stock),
        })),
        all: stockResult.rows.map((row) => ({
          id: row.id,
          name: row.name,
          unit: row.unit,
          current_stock: Number(row.current_stock),
        })),
      },
      recent_activity: recentActivityResult.rows.map((row) => ({
        at: row.sort_at instanceof Date ? row.sort_at.toISOString() : String(row.sort_at),
        category: row.category,
        horse_name: row.horse_name,
        detail: row.detail,
      })),
      rain: {
        recent: rainRecentResult.rows.map((row) => ({
          id: row.id,
          event_date: toIsoDateString(row.event_date),
          rain_mm: Number(row.rain_mm),
          source: row.source || null,
          notes: row.notes || null,
        })),
        daily: rainDailyResult.rows.map((row) => ({
          event_date: toIsoDateString(row.event_date),
          rain_mm: Number(row.rain_mm || 0),
        })),
        yearly: rainYearlyResult.rows.map((row) => ({
          year: Number(row.year || 0),
          total_mm: Number(row.total_mm || 0),
          rainy_days: Number(row.rainy_days || 0),
          avg_mm_per_event: Number(row.avg_mm_per_event || 0),
          peak_mm: Number(row.peak_mm || 0),
        })),
      },
    });
  } catch (error) {
    console.error('ADMIN OVERVIEW ERROR:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
