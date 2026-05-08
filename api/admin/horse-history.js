const { pool } = require('../../lib/db');
const { ensureHorseProfileColumns } = require('../../lib/horse-profile');
const {
  ensurePaddockTables,
  listGrazingHistory,
  getHorseCurrentGrazing,
  listHorseGroupHistory,
  getHorseCurrentGroupMembership,
} = require('../../lib/paddocks');
const {
  FEED_SLOTS,
  ensureFeedPlanningTables,
  normalizeYearMonth,
  todayYearMonth,
  listHorseFeedPlanItems,
  getHorseFeedCalendarMonth,
} = require('../../lib/feed-plans');
const {
  listAdminModuleSettings,
  buildAdminModuleEnabledMap,
  isAdminModuleEnabled,
} = require('../../lib/admin-modules');
const { toIsoDateString } = require('../../lib/date-helpers');
const { requireAdminApiAuth } = require('../../lib/admin-auth');

function parseHorseId(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseMonth(value) {
  const normalized = normalizeYearMonth(Array.isArray(value) ? value[0] : value);
  return normalized || todayYearMonth();
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

function filterHorseTimelineRows(rows, enabledModules) {
  const categoryToModuleKey = {
    feed: 'feed',
    deworming: 'deworm',
    farrier: 'farrier',
    health: 'health',
    treatment_plan: 'health',
    dose: 'health',
    grazing: 'paddocks',
    group: 'groups',
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

  const horseIdValue = Array.isArray(req.query?.horseId)
    ? req.query.horseId[0]
    : req.query?.horseId;
  const horseId = parseHorseId(horseIdValue);
  const selectedMonth = parseMonth(req.query?.month);

  if (!horseId) {
    res.status(400).json({ ok: false, error: 'horseId query param is required' });
    return;
  }

  try {
    await ensureHorseProfileColumns();
    await ensurePaddockTables();
    await ensureFeedPlanningTables();
    const moduleSettings = await listAdminModuleSettings();
    const enabledModules = buildAdminModuleEnabledMap(moduleSettings);

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
      groupHistoryRows,
      currentGroupMembership,
      feedPlanItems,
      feedCalendarMonth,
    ] = await Promise.all([
      pool.query(
        `
        SELECT *
        FROM (
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
          f.unit,
          f.feed_slot,
          f.calendar_slot_entry_id,
          f.stock_deducted,
          f.source
        FROM feed_events f
        JOIN feed_items i ON i.id = f.feed_item_id
        WHERE f.horse_id = $1
        ORDER BY COALESCE(f.event_date, f.created_at::date) DESC, f.feed_slot ASC NULLS LAST, f.id DESC
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
      listHorseGroupHistory({ horseId, limit: 40 }),
      getHorseCurrentGroupMembership(horseId),
      listHorseFeedPlanItems(horseId),
      getHorseFeedCalendarMonth({ horseId, month: selectedMonth }),
    ]);

    const trainingModuleEnabled = isAdminModuleEnabled('training', enabledModules);
    const feedModuleEnabled = isAdminModuleEnabled('feed', enabledModules);
    const dewormModuleEnabled = isAdminModuleEnabled('deworm', enabledModules);
    const farrierModuleEnabled = isAdminModuleEnabled('farrier', enabledModules);
    const healthModuleEnabled = isAdminModuleEnabled('health', enabledModules);
    const groupsModuleEnabled = isAdminModuleEnabled('groups', enabledModules);
    const paddocksModuleEnabled = isAdminModuleEnabled('paddocks', enabledModules);
    const timelineRows = filterHorseTimelineRows(
      historyResult.rows.map((row) => ({
        at: row.sort_at instanceof Date ? row.sort_at.toISOString() : String(row.sort_at),
        category: row.category,
        detail: row.detail,
      })),
      enabledModules
    );

    res.status(200).json({
      ok: true,
      module_settings: moduleSettings,
      horse: {
        id: horseResult.rows[0].id,
        name: horseResult.rows[0].name,
        date_of_birth: toIsoDateString(horseResult.rows[0].date_of_birth),
        age_years:
          horseResult.rows[0].age_years == null ? null : Number(horseResult.rows[0].age_years),
        color: horseResult.rows[0].color || null,
        activity: horseResult.rows[0].activity || null,
        sex: horseResult.rows[0].sex || null,
        training_status: trainingModuleEnabled ? normalizeTrainingStatus(horseResult.rows[0].training_status) : null,
      },
      history: timelineRows,
      feed_history: (feedModuleEnabled ? feedHistoryResult.rows : []).map((row) => ({
        id: row.id,
        at: row.at instanceof Date ? row.at.toISOString() : String(row.at),
        event_date: toIsoDateString(row.event_date),
        feed_item: row.feed_item,
        quantity: Number(row.quantity),
        unit: row.unit,
        feed_slot: row.feed_slot || null,
        calendar_slot_entry_id:
          row.calendar_slot_entry_id == null ? null : Number(row.calendar_slot_entry_id),
        stock_deducted: Boolean(row.stock_deducted),
        source: row.source || null,
      })),
      deworming_history: (dewormModuleEnabled ? dewormHistoryResult.rows : []).map((row) => ({
        id: row.id,
        at: row.at instanceof Date ? row.at.toISOString() : String(row.at),
        event_date: toIsoDateString(row.event_date),
        product_name: row.product_name,
        second_dose_date: toIsoDateString(row.second_dose_date),
        next_due_date: toIsoDateString(row.next_due_date),
      })),
      farrier_history: (farrierModuleEnabled ? farrierHistoryResult.rows : []).map((row) => ({
        at: row.at instanceof Date ? row.at.toISOString() : String(row.at),
        service_type: row.service_type,
        next_due_date: toIsoDateString(row.next_due_date),
      })),
      health_history: (healthModuleEnabled ? healthHistoryResult.rows : []).map((row) => ({
        at: row.at instanceof Date ? row.at.toISOString() : String(row.at),
        event_type: row.event_type,
        description: row.description,
      })),
      group_history: (groupsModuleEnabled ? groupHistoryRows : []).map((row) => ({
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
      grazing_history: (paddocksModuleEnabled ? grazingHistoryRows : []).map((row) => ({
        id: row.id,
        horse_id: row.horse_id,
        horse_name: row.horse_name,
        paddock_id: row.paddock_id,
        paddock_name: row.paddock_name,
        entered_at: row.entered_at,
        exited_at: row.exited_at,
        days: row.grazing_days,
        grazing_days: row.grazing_days,
        entry_notes: row.entry_notes,
        exit_notes: row.exit_notes,
        source_group_id: row.source_group_id,
        source_group_name: row.source_group_name,
        active: row.active,
      })),
      current_grazing: paddocksModuleEnabled && currentGrazing
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
      current_group_membership: groupsModuleEnabled && currentGroupMembership
        ? {
            id: currentGroupMembership.id,
            horse_id: currentGroupMembership.horse_id,
            group_id: currentGroupMembership.group_id,
            group_name: currentGroupMembership.group_name,
            started_at: currentGroupMembership.started_at,
            group_days: currentGroupMembership.group_days,
            previous_group_id: currentGroupMembership.previous_group_id,
            previous_group_name: currentGroupMembership.previous_group_name,
            previous_group_days: currentGroupMembership.previous_group_days,
          }
        : null,
      feed_plan: {
        slots: FEED_SLOTS,
        items: (feedModuleEnabled ? feedPlanItems : []).map((row) => ({
          id: row.id,
          horse_id: row.horse_id,
          feed_slot: row.feed_slot,
          feed_item_id: row.feed_item_id,
          feed_item_name: row.feed_item_name,
          quantity: row.quantity,
          unit: row.unit,
          auto_deduct_stock: row.auto_deduct_stock,
          sort_order: row.sort_order,
          notes: row.notes,
        })),
      },
      feed_calendar: {
        month: feedCalendarMonth.month,
        start_date: feedCalendarMonth.start_date,
        end_date: feedCalendarMonth.end_date,
        slots: FEED_SLOTS,
        entries: (feedModuleEnabled ? feedCalendarMonth.entries : []).map((row) => ({
          id: row.id,
          horse_id: row.horse_id,
          feed_slot: row.feed_slot,
          event_date: row.event_date,
        })),
      },
    });
  } catch (error) {
    console.error('ADMIN HORSE HISTORY ERROR:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
