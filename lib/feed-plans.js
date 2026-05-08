const { pool } = require('./db');
const { toIsoDateString } = require('./date-helpers');
const { ensureTableColumns } = require('./schema');

const FEED_SLOTS = ['morning', 'afternoon', 'night'];

let ensurePromise = null;

const HORSE_FEED_PLAN_ITEM_COLUMNS = [
  { name: 'feed_slot', definition: 'TEXT' },
  {
    name: 'feed_item_id',
    definition: 'BIGINT REFERENCES feed_items(id) ON DELETE CASCADE',
  },
  { name: 'quantity', definition: 'NUMERIC(10,2)' },
  { name: 'unit', definition: 'TEXT' },
  { name: 'auto_deduct_stock', definition: 'BOOLEAN NOT NULL DEFAULT TRUE' },
  { name: 'sort_order', definition: 'INT NOT NULL DEFAULT 0' },
  { name: 'notes', definition: 'TEXT' },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
  { name: 'updated_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

const HORSE_FEED_SLOT_ENTRY_COLUMNS = [
  { name: 'feed_slot', definition: 'TEXT' },
  { name: 'event_date', definition: 'DATE' },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
  { name: 'updated_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

const FEED_EVENT_COLUMNS = [
  {
    name: 'calendar_slot_entry_id',
    definition: 'BIGINT REFERENCES horse_feed_slot_entries(id) ON DELETE SET NULL',
  },
  { name: 'feed_slot', definition: 'TEXT' },
  { name: 'stock_deducted', definition: 'BOOLEAN NOT NULL DEFAULT TRUE' },
  { name: 'source', definition: 'TEXT' },
  { name: 'updated_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

function buildServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeIsoTimestamp(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function normalizeFeedSlot(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return FEED_SLOTS.includes(normalized) ? normalized : null;
}

function isBaleUnit(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'bale' || normalized === 'bales';
}

function normalizeYearMonth(value) {
  const normalized = String(value || '').trim();
  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    return null;
  }

  const [year, month] = normalized.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

function todayYearMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getMonthDateRange(yearMonth) {
  const normalizedYearMonth = normalizeYearMonth(yearMonth) || todayYearMonth();
  const [year, month] = normalizedYearMonth.split('-').map(Number);
  const startDate = `${normalizedYearMonth}-01`;
  const endDate = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

  return {
    month: normalizedYearMonth,
    start_date: startDate,
    end_date: endDate,
  };
}

function normalizeHorseFeedPlanItemRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    horse_id: Number(row.horse_id),
    feed_slot: normalizeFeedSlot(row.feed_slot),
    feed_item_id: Number(row.feed_item_id),
    feed_item_name: row.feed_item_name || null,
    quantity: Number(row.quantity),
    unit: row.unit || null,
    auto_deduct_stock: Boolean(row.auto_deduct_stock),
    sort_order: Number(row.sort_order || 0),
    notes: row.notes || null,
    created_at: normalizeIsoTimestamp(row.created_at),
    updated_at: normalizeIsoTimestamp(row.updated_at),
  };
}

function normalizeHorseFeedCalendarEntryRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    horse_id: Number(row.horse_id),
    feed_slot: normalizeFeedSlot(row.feed_slot),
    event_date: toIsoDateString(row.event_date),
    created_at: normalizeIsoTimestamp(row.created_at),
    updated_at: normalizeIsoTimestamp(row.updated_at),
  };
}

function normalizeHorseFeedCalendarEventRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    horse_id: Number(row.horse_id),
    feed_item_id: Number(row.feed_item_id),
    feed_item_name: row.feed_item_name || null,
    quantity: Number(row.quantity),
    unit: row.unit || null,
    event_date: toIsoDateString(row.event_date),
    feed_slot: normalizeFeedSlot(row.feed_slot),
    stock_deducted: Boolean(row.stock_deducted),
    calendar_slot_entry_id:
      row.calendar_slot_entry_id == null ? null : Number(row.calendar_slot_entry_id),
    created_at: normalizeIsoTimestamp(row.created_at),
    updated_at: normalizeIsoTimestamp(row.updated_at),
  };
}

async function ensureFeedPlanningTables() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS horse_feed_plan_items (
        id BIGSERIAL PRIMARY KEY,
        horse_id BIGINT NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
        feed_slot TEXT NOT NULL,
        feed_item_id BIGINT NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
        quantity NUMERIC(10,2) NOT NULL,
        unit TEXT NOT NULL,
        auto_deduct_stock BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INT NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (feed_slot IN ('morning', 'afternoon', 'night')),
        CHECK (quantity > 0)
      )
    `);

    await ensureTableColumns(pool, 'horse_feed_plan_items', HORSE_FEED_PLAN_ITEM_COLUMNS);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS horse_feed_plan_items_horse_slot_idx
      ON horse_feed_plan_items (horse_id, feed_slot, sort_order, id)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS horse_feed_slot_entries (
        id BIGSERIAL PRIMARY KEY,
        horse_id BIGINT NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
        feed_slot TEXT NOT NULL,
        event_date DATE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (feed_slot IN ('morning', 'afternoon', 'night')),
        UNIQUE (horse_id, feed_slot, event_date)
      )
    `);

    await ensureTableColumns(pool, 'horse_feed_slot_entries', HORSE_FEED_SLOT_ENTRY_COLUMNS);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS horse_feed_slot_entries_horse_date_idx
      ON horse_feed_slot_entries (horse_id, event_date, feed_slot, id)
    `);

    await ensureTableColumns(pool, 'feed_events', FEED_EVENT_COLUMNS);

    await pool.query(`
      UPDATE feed_events
      SET source = 'manual'
      WHERE source IS NULL
    `);

    await pool.query(`
      ALTER TABLE feed_events
      ALTER COLUMN source SET DEFAULT 'manual'
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS feed_events_calendar_slot_entry_idx
      ON feed_events (calendar_slot_entry_id, id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS feed_events_horse_date_slot_idx
      ON feed_events (horse_id, event_date DESC, feed_slot, id DESC)
    `);
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

async function listHorseFeedPlanItems(horseId) {
  await ensureFeedPlanningTables();

  const normalizedHorseId = Number.parseInt(horseId, 10);
  if (!Number.isFinite(normalizedHorseId) || normalizedHorseId <= 0) {
    return [];
  }

  const result = await pool.query(
    `
    SELECT
      hfpi.id,
      hfpi.horse_id,
      hfpi.feed_slot,
      hfpi.feed_item_id,
      fi.name AS feed_item_name,
      hfpi.quantity,
      hfpi.unit,
      hfpi.auto_deduct_stock,
      hfpi.sort_order,
      hfpi.notes,
      hfpi.created_at,
      hfpi.updated_at
    FROM horse_feed_plan_items hfpi
    JOIN feed_items fi ON fi.id = hfpi.feed_item_id
    WHERE hfpi.horse_id = $1
    ORDER BY hfpi.feed_slot ASC, hfpi.sort_order ASC, hfpi.id ASC
    `,
    [normalizedHorseId]
  );

  return result.rows.map(normalizeHorseFeedPlanItemRow);
}

async function saveHorseFeedPlanItems({ horseId, items }) {
  await ensureFeedPlanningTables();

  const normalizedHorseId = Number.parseInt(horseId, 10);
  if (!Number.isFinite(normalizedHorseId) || normalizedHorseId <= 0) {
    throw buildServiceError('horseId is required.', 400);
  }

  const normalizedItems = (Array.isArray(items) ? items : [])
    .map((item, index) => ({
      feed_slot: normalizeFeedSlot(item?.feed_slot),
      feed_item_name: String(item?.feed_item_name || '').trim().toLowerCase(),
      quantity: Number(item?.quantity),
      unit: String(item?.unit || '').trim().toLowerCase(),
      auto_deduct_stock: Boolean(item?.auto_deduct_stock),
      notes: String(item?.notes || '').trim() || null,
      sort_order: index,
    }))
    .filter((item) => item.feed_item_name || item.quantity || item.unit || item.feed_slot);

  for (const item of normalizedItems) {
    if (!item.feed_slot) {
      throw buildServiceError('Each plan row needs a valid slot.', 400);
    }

    if (!item.feed_item_name) {
      throw buildServiceError('Each plan row needs a feed item.', 400);
    }

    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw buildServiceError('Each plan row needs a quantity greater than 0.', 400);
    }

    if (!item.unit) {
      throw buildServiceError('Each plan row needs a unit.', 400);
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const horseResult = await client.query(
      `
      SELECT id, name
      FROM horses
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
      `,
      [normalizedHorseId]
    );

    if (horseResult.rows.length === 0) {
      throw buildServiceError('Horse not found.', 404);
    }

    const feedItemNames = [...new Set(normalizedItems.map((item) => item.feed_item_name))];
    const feedItemsByName = new Map();

    if (feedItemNames.length > 0) {
      const feedItemResult = await client.query(
        `
        SELECT id, name, unit
        FROM feed_items
        WHERE LOWER(name) = ANY($1::text[])
        `,
        [feedItemNames]
      );

      for (const row of feedItemResult.rows) {
        feedItemsByName.set(String(row.name || '').trim().toLowerCase(), row);
      }
    }

    for (const item of normalizedItems) {
      const feedItem = feedItemsByName.get(item.feed_item_name);
      if (!feedItem) {
        throw buildServiceError(`Feed item not found: ${item.feed_item_name}`, 404);
      }

      if (isBaleUnit(item.unit) || isBaleUnit(feedItem.unit)) {
        throw buildServiceError(
          `Daily feed plans should not use bale units for ${feedItem.name}. Remove it from the plan and record bale use from Stock Action when a bale is finished.`,
          400
        );
      }

      if (
        item.auto_deduct_stock &&
        String(feedItem.unit || '').trim().toLowerCase() !== item.unit
      ) {
        throw buildServiceError(
          `Unit mismatch for ${feedItem.name}. Auto-deduct items must use ${feedItem.unit}.`,
          400
        );
      }
    }

    await client.query('DELETE FROM horse_feed_plan_items WHERE horse_id = $1', [normalizedHorseId]);

    if (normalizedItems.length > 0) {
      for (const item of normalizedItems) {
        const feedItem = feedItemsByName.get(item.feed_item_name);

        await client.query(
          `
          INSERT INTO horse_feed_plan_items (
            horse_id,
            feed_slot,
            feed_item_id,
            quantity,
            unit,
            auto_deduct_stock,
            sort_order,
            notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
          [
            normalizedHorseId,
            item.feed_slot,
            feedItem.id,
            item.quantity,
            item.unit,
            item.auto_deduct_stock,
            item.sort_order,
            item.notes,
          ]
        );
      }
    }

    await client.query('COMMIT');

    return {
      horse: {
        id: Number(horseResult.rows[0].id),
        name: horseResult.rows[0].name,
      },
      plan_items: await listHorseFeedPlanItems(normalizedHorseId),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getHorseFeedCalendarMonth({ horseId, month = null }) {
  await ensureFeedPlanningTables();

  const normalizedHorseId = Number.parseInt(horseId, 10);
  if (!Number.isFinite(normalizedHorseId) || normalizedHorseId <= 0) {
    return {
      month: normalizeYearMonth(month) || todayYearMonth(),
      start_date: null,
      end_date: null,
      entries: [],
    };
  }

  const monthRange = getMonthDateRange(month);
  const result = await pool.query(
    `
    SELECT
      id,
      horse_id,
      feed_slot,
      event_date,
      created_at,
      updated_at
    FROM horse_feed_slot_entries
    WHERE horse_id = $1
      AND event_date BETWEEN $2 AND $3
    ORDER BY event_date ASC, feed_slot ASC, id ASC
    `,
    [normalizedHorseId, monthRange.start_date, monthRange.end_date]
  );

  return {
    ...monthRange,
    entries: result.rows.map(normalizeHorseFeedCalendarEntryRow),
  };
}

async function setHorseFeedSlotChecked({
  horseId,
  eventDate,
  feedSlot,
  checked,
  telegramUserId = 'admin_panel',
}) {
  await ensureFeedPlanningTables();

  const normalizedHorseId = Number.parseInt(horseId, 10);
  if (!Number.isFinite(normalizedHorseId) || normalizedHorseId <= 0) {
    throw buildServiceError('horseId is required.', 400);
  }

  const normalizedFeedSlot = normalizeFeedSlot(feedSlot);
  if (!normalizedFeedSlot) {
    throw buildServiceError('feedSlot must be morning, afternoon, or night.', 400);
  }

  const normalizedEventDate = toIsoDateString(eventDate);
  if (!normalizedEventDate) {
    throw buildServiceError('eventDate must be YYYY-MM-DD.', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const horseResult = await client.query(
      `
      SELECT id, name
      FROM horses
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
      `,
      [normalizedHorseId]
    );

    if (horseResult.rows.length === 0) {
      throw buildServiceError('Horse not found.', 404);
    }

    const existingEntryResult = await client.query(
      `
      SELECT id, horse_id, feed_slot, event_date, created_at, updated_at
      FROM horse_feed_slot_entries
      WHERE horse_id = $1
        AND feed_slot = $2
        AND event_date = $3
      LIMIT 1
      FOR UPDATE
      `,
      [normalizedHorseId, normalizedFeedSlot, normalizedEventDate]
    );

    const existingEntry = existingEntryResult.rows[0] || null;
    const targetChecked = Boolean(checked);

    if (targetChecked && existingEntry) {
      await client.query('COMMIT');
      return {
        horse: {
          id: Number(horseResult.rows[0].id),
          name: horseResult.rows[0].name,
        },
        checked: true,
        entry: normalizeHorseFeedCalendarEntryRow(existingEntry),
        feed_events: [],
        stock_changes: [],
      };
    }

    if (!targetChecked && !existingEntry) {
      await client.query('COMMIT');
      return {
        horse: {
          id: Number(horseResult.rows[0].id),
          name: horseResult.rows[0].name,
        },
        checked: false,
        entry: null,
        feed_events: [],
        stock_changes: [],
      };
    }

    if (targetChecked) {
      const planResult = await client.query(
        `
        SELECT
          hfpi.id,
          hfpi.horse_id,
          hfpi.feed_slot,
          hfpi.feed_item_id,
          fi.name AS feed_item_name,
          hfpi.quantity,
          hfpi.unit,
          hfpi.auto_deduct_stock,
          hfpi.sort_order,
          hfpi.notes,
          hfpi.created_at,
          hfpi.updated_at,
          fi.unit AS stock_unit,
          fi.current_stock
        FROM horse_feed_plan_items hfpi
        JOIN feed_items fi ON fi.id = hfpi.feed_item_id
        WHERE hfpi.horse_id = $1
          AND hfpi.feed_slot = $2
        ORDER BY hfpi.sort_order ASC, hfpi.id ASC
        FOR UPDATE OF fi
        `,
        [normalizedHorseId, normalizedFeedSlot]
      );

      if (planResult.rows.length === 0) {
        throw buildServiceError(
          `No ${normalizedFeedSlot} feed plan is saved for ${horseResult.rows[0].name}.`,
          409
        );
      }

      for (const row of planResult.rows) {
        if (isBaleUnit(row.unit) || isBaleUnit(row.stock_unit)) {
          throw buildServiceError(
            `Daily feed plans should not use bale units for ${row.feed_item_name}. Remove it from the plan and record bale use from Stock Action when a bale is finished.`,
            409
          );
        }
      }

      const requiredStockByFeedItemId = new Map();
      for (const row of planResult.rows) {
        if (!row.auto_deduct_stock) {
          continue;
        }

        const stockUnit = String(row.stock_unit || '').trim().toLowerCase();
        const planUnit = String(row.unit || '').trim().toLowerCase();
        if (stockUnit !== planUnit) {
          throw buildServiceError(
            `Feed plan unit mismatch for ${row.feed_item_name}. Expected ${row.stock_unit}.`,
            409
          );
        }

        const feedItemId = Number(row.feed_item_id);
        requiredStockByFeedItemId.set(
          feedItemId,
          Number(requiredStockByFeedItemId.get(feedItemId) || 0) + Number(row.quantity)
        );
      }

      for (const row of planResult.rows) {
        const feedItemId = Number(row.feed_item_id);
        const requiredQuantity = Number(requiredStockByFeedItemId.get(feedItemId) || 0);
        if (!requiredQuantity) {
          continue;
        }

        if (Number(row.current_stock) < requiredQuantity) {
          throw buildServiceError(
            `Not enough stock for ${row.feed_item_name}. ${row.current_stock} ${row.stock_unit} available.`,
            409
          );
        }

        requiredStockByFeedItemId.delete(feedItemId);
      }

      const entryResult = await client.query(
        `
        INSERT INTO horse_feed_slot_entries (
          horse_id,
          feed_slot,
          event_date
        )
        VALUES ($1, $2, $3)
        RETURNING id, horse_id, feed_slot, event_date, created_at, updated_at
        `,
        [normalizedHorseId, normalizedFeedSlot, normalizedEventDate]
      );

      const entry = entryResult.rows[0];
      const createdEvents = [];

      for (const row of planResult.rows) {
        const eventResult = await client.query(
          `
          INSERT INTO feed_events (
            horse_id,
            feed_item_id,
            quantity,
            unit,
            telegram_user_id,
            event_date,
            calendar_slot_entry_id,
            feed_slot,
            stock_deducted,
            source
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING
            id,
            horse_id,
            feed_item_id,
            quantity,
            unit,
            event_date,
            calendar_slot_entry_id,
            feed_slot,
            stock_deducted,
            created_at,
            updated_at
          `,
          [
            normalizedHorseId,
            row.feed_item_id,
            row.quantity,
            row.unit,
            telegramUserId,
            normalizedEventDate,
            entry.id,
            normalizedFeedSlot,
            row.auto_deduct_stock,
            'calendar_plan',
          ]
        );

        createdEvents.push(
          normalizeHorseFeedCalendarEventRow({
            ...eventResult.rows[0],
            feed_item_name: row.feed_item_name,
          })
        );
      }

      const stockChanges = [];
      const deductionsByFeedItemId = new Map();
      for (const row of planResult.rows) {
        if (!row.auto_deduct_stock) {
          continue;
        }

        const feedItemId = Number(row.feed_item_id);
        deductionsByFeedItemId.set(
          feedItemId,
          Number(deductionsByFeedItemId.get(feedItemId) || 0) + Number(row.quantity)
        );
      }

      for (const row of planResult.rows) {
        const feedItemId = Number(row.feed_item_id);
        const deduction = Number(deductionsByFeedItemId.get(feedItemId) || 0);
        if (!deduction) {
          continue;
        }

        const stockResult = await client.query(
          `
          UPDATE feed_items
          SET current_stock = current_stock - $1
          WHERE id = $2
          RETURNING id, name, unit, current_stock
          `,
          [deduction, feedItemId]
        );

        stockChanges.push({
          feed_item_id: Number(stockResult.rows[0].id),
          feed_item_name: stockResult.rows[0].name,
          quantity_delta: -deduction,
          unit: stockResult.rows[0].unit,
          current_stock: Number(stockResult.rows[0].current_stock),
        });

        deductionsByFeedItemId.delete(feedItemId);
      }

      await client.query('COMMIT');

      return {
        horse: {
          id: Number(horseResult.rows[0].id),
          name: horseResult.rows[0].name,
        },
        checked: true,
        entry: normalizeHorseFeedCalendarEntryRow(entry),
        feed_events: createdEvents,
        stock_changes: stockChanges,
      };
    }

    const existingFeedEventsResult = await client.query(
      `
      SELECT
        f.id,
        f.horse_id,
        f.feed_item_id,
        fi.name AS feed_item_name,
        f.quantity,
        f.unit,
        f.event_date,
        f.feed_slot,
        f.stock_deducted,
        f.calendar_slot_entry_id,
        f.created_at,
        f.updated_at
      FROM feed_events f
      JOIN feed_items fi ON fi.id = f.feed_item_id
      WHERE f.calendar_slot_entry_id = $1
      ORDER BY f.id ASC
      FOR UPDATE OF f, fi
      `,
      [existingEntry.id]
    );

    const restoreByFeedItemId = new Map();
    for (const row of existingFeedEventsResult.rows) {
      if (!row.stock_deducted) {
        continue;
      }

      const feedItemId = Number(row.feed_item_id);
      restoreByFeedItemId.set(
        feedItemId,
        Number(restoreByFeedItemId.get(feedItemId) || 0) + Number(row.quantity)
      );
    }

    const stockChanges = [];
    for (const row of existingFeedEventsResult.rows) {
      const feedItemId = Number(row.feed_item_id);
      const restoreQuantity = Number(restoreByFeedItemId.get(feedItemId) || 0);
      if (!restoreQuantity) {
        continue;
      }

      const stockResult = await client.query(
        `
        UPDATE feed_items
        SET current_stock = current_stock + $1
        WHERE id = $2
        RETURNING id, name, unit, current_stock
        `,
        [restoreQuantity, feedItemId]
      );

      stockChanges.push({
        feed_item_id: Number(stockResult.rows[0].id),
        feed_item_name: stockResult.rows[0].name,
        quantity_delta: restoreQuantity,
        unit: stockResult.rows[0].unit,
        current_stock: Number(stockResult.rows[0].current_stock),
      });

      restoreByFeedItemId.delete(feedItemId);
    }

    await client.query('DELETE FROM feed_events WHERE calendar_slot_entry_id = $1', [existingEntry.id]);
    await client.query('DELETE FROM horse_feed_slot_entries WHERE id = $1', [existingEntry.id]);
    await client.query('COMMIT');

    return {
      horse: {
        id: Number(horseResult.rows[0].id),
        name: horseResult.rows[0].name,
      },
      checked: false,
      entry: null,
      feed_events: existingFeedEventsResult.rows.map(normalizeHorseFeedCalendarEventRow),
      stock_changes: stockChanges,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  FEED_SLOTS,
  buildServiceError,
  ensureFeedPlanningTables,
  isBaleUnit,
  normalizeFeedSlot,
  normalizeYearMonth,
  todayYearMonth,
  getMonthDateRange,
  listHorseFeedPlanItems,
  saveHorseFeedPlanItems,
  getHorseFeedCalendarMonth,
  setHorseFeedSlotChecked,
};
