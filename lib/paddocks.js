const { pool } = require('./db');
const { toIsoDateString } = require('./date-helpers');
const { ensureTableColumns } = require('./schema');

let ensurePromise = null;

const PADDOCK_COLUMNS = [
  { name: 'zone', definition: 'TEXT' },
  { name: 'size_ha', definition: 'NUMERIC(10,2)' },
  { name: 'notes', definition: 'TEXT' },
  { name: 'active', definition: 'BOOLEAN NOT NULL DEFAULT TRUE' },
  {
    name: 'parent_paddock_id',
    definition: 'BIGINT REFERENCES paddocks(id) ON DELETE SET NULL',
  },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
  { name: 'updated_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

const HORSE_GROUP_COLUMNS = [
  { name: 'notes', definition: 'TEXT' },
  { name: 'active', definition: 'BOOLEAN NOT NULL DEFAULT TRUE' },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
  { name: 'updated_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

const HORSE_GROUP_MEMBERSHIP_COLUMNS = [
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
  { name: 'updated_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

const HORSE_GROUP_MEMBERSHIP_HISTORY_COLUMNS = [
  {
    name: 'group_id',
    definition: 'BIGINT REFERENCES horse_groups(id) ON DELETE SET NULL',
  },
  { name: 'group_name', definition: 'TEXT' },
  { name: 'started_at', definition: 'DATE' },
  { name: 'ended_at', definition: 'DATE' },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
  { name: 'updated_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

const GRAZING_EVENT_COLUMNS = [
  { name: 'entered_at', definition: 'DATE' },
  { name: 'exited_at', definition: 'DATE' },
  { name: 'entry_notes', definition: 'TEXT' },
  { name: 'exit_notes', definition: 'TEXT' },
  { name: 'source', definition: "TEXT DEFAULT 'manual'" },
  {
    name: 'source_group_id',
    definition: 'BIGINT REFERENCES horse_groups(id) ON DELETE SET NULL',
  },
  { name: 'telegram_user_id', definition: 'TEXT' },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
  { name: 'updated_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

const PADDOCK_WORK_EVENT_COLUMNS = [
  { name: 'event_type', definition: 'TEXT' },
  { name: 'event_date', definition: 'DATE' },
  { name: 'ready_after_days', definition: 'INTEGER' },
  { name: 'ready_to_graze_on', definition: 'DATE' },
  { name: 'applies_to_descendants', definition: 'BOOLEAN NOT NULL DEFAULT FALSE' },
  { name: 'notes', definition: 'TEXT' },
  { name: 'telegram_user_id', definition: 'TEXT' },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
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

function calculateInclusiveDaysFromTimestamp(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const startUtc = Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(1, Math.floor((todayUtc - startUtc) / 86400000) + 1);
}

function addDaysToDateString(dateString, daysToAdd) {
  if (!dateString) {
    return null;
  }

  const date = new Date(`${dateString}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCDate(date.getUTCDate() + Number(daysToAdd || 0));
  return date.toISOString().slice(0, 10);
}

function normalizePaddockWorkEventType(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');

  if (!normalized) {
    return null;
  }

  if (
    normalized === 'soil prep' ||
    normalized === 'soil preparation' ||
    normalized === 'tractor' ||
    normalized === 'tractor work' ||
    normalized === 'tillage'
  ) {
    return 'soil_prep';
  }

  if (normalized === 'seed' || normalized === 'seeding' || normalized === 'sowing') {
    return 'seeding';
  }

  if (normalized === 'fertilizer' || normalized === 'fertilizing' || normalized === 'fertiliser') {
    return 'fertilizer';
  }

  if (normalized === 'spray' || normalized === 'spraying') {
    return 'spraying';
  }

  if (normalized === 'ready' || normalized === 'ready check') {
    return 'ready_check';
  }

  if (normalized === 'other') {
    return 'other';
  }

  return null;
}

function formatPaddockWorkEventType(value) {
  const normalized = normalizePaddockWorkEventType(value);

  if (normalized === 'soil_prep') {
    return 'Soil Prep';
  }

  if (normalized === 'seeding') {
    return 'Seeding';
  }

  if (normalized === 'fertilizer') {
    return 'Fertilizer';
  }

  if (normalized === 'spraying') {
    return 'Spraying';
  }

  if (normalized === 'ready_check') {
    return 'Ready Check';
  }

  return 'Other';
}

function normalizePaddockRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    name: row.name,
    zone: row.zone || null,
    size_ha: row.size_ha == null ? null : Number(row.size_ha),
    notes: row.notes || null,
    active: Boolean(row.active),
    parent_paddock_id: row.parent_paddock_id == null ? null : Number(row.parent_paddock_id),
    parent_paddock_name: row.parent_paddock_name || null,
    created_at: normalizeIsoTimestamp(row.created_at),
    updated_at: normalizeIsoTimestamp(row.updated_at),
  };
}

function normalizeHorseGroupMembers(row) {
  const memberIds = Array.isArray(row?.member_ids) ? row.member_ids : [];
  const memberNames = Array.isArray(row?.member_names) ? row.member_names : [];
  const members = [];

  for (let index = 0; index < memberNames.length; index += 1) {
    const memberName = memberNames[index];
    if (!memberName) {
      continue;
    }

    members.push({
      id: memberIds[index] == null ? null : Number(memberIds[index]),
      name: memberName,
    });
  }

  return members;
}

function normalizeHorseGroupRow(row) {
  if (!row) {
    return null;
  }

  const members = normalizeHorseGroupMembers(row);

  return {
    id: Number(row.id),
    name: row.name,
    notes: row.notes || null,
    active: Boolean(row.active),
    member_count: Number(row.member_count || 0),
    members,
    member_names: members.map((member) => member.name),
    current_paddock_names: row.current_paddock_names || null,
    grazing_member_count: Number(row.grazing_member_count || 0),
    created_at: normalizeIsoTimestamp(row.created_at),
    updated_at: normalizeIsoTimestamp(row.updated_at),
  };
}

function normalizeHorseGroupHistoryRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    horse_id: Number(row.horse_id),
    horse_name: row.horse_name || null,
    group_id: row.group_id == null ? null : Number(row.group_id),
    group_name: row.group_name || null,
    started_at: toIsoDateString(row.started_at),
    ended_at: toIsoDateString(row.ended_at),
    group_days: row.group_days == null ? null : Number(row.group_days),
    previous_group_id: row.previous_group_id == null ? null : Number(row.previous_group_id),
    previous_group_name: row.previous_group_name || null,
    previous_group_days: row.previous_group_days == null ? null : Number(row.previous_group_days),
    active: row.ended_at == null,
    created_at: normalizeIsoTimestamp(row.created_at),
    updated_at: normalizeIsoTimestamp(row.updated_at),
  };
}

function normalizeGrazingRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    paddock_id: Number(row.paddock_id),
    paddock_name: row.paddock_name,
    horse_id: Number(row.horse_id),
    horse_name: row.horse_name,
    entered_at: toIsoDateString(row.entered_at),
    exited_at: toIsoDateString(row.exited_at),
    grazing_days: row.grazing_days == null ? null : Number(row.grazing_days),
    entry_notes: row.entry_notes || null,
    exit_notes: row.exit_notes || null,
    source: row.source || null,
    source_group_id: row.source_group_id == null ? null : Number(row.source_group_id),
    source_group_name: row.source_group_name || null,
    telegram_user_id: row.telegram_user_id || null,
    created_at: normalizeIsoTimestamp(row.created_at),
    updated_at: normalizeIsoTimestamp(row.updated_at),
    active: row.exited_at == null,
  };
}

function normalizePaddockOccupancyRow(row) {
  if (!row) {
    return null;
  }

  const activeHorseRows = Array.isArray(row.active_horses) ? row.active_horses : [];
  const activeHorses = activeHorseRows
    .map((horse) => {
      const horseId = Number(horse?.id);
      if (!Number.isFinite(horseId) || !horse?.name) {
        return null;
      }

      return {
        id: horseId,
        name: String(horse.name),
      };
    })
    .filter(Boolean);

  return {
    paddock_id: Number(row.paddock_id),
    paddock_name: row.paddock_name,
    active_horse_count: Number(row.active_horse_count || activeHorses.length || 0),
    active_horses: activeHorses,
    entered_at: toIsoDateString(row.entered_at),
    exited_at: toIsoDateString(row.exited_at),
    days_grazed: row.days_grazed == null ? null : Number(row.days_grazed),
    status: row.status || 'Active',
  };
}

function normalizePaddockStatusRow(row) {
  const horseCount = Number(row.horse_count || 0);
  const active = Boolean(row.active);
  const occupiedHorseNames = row.horse_names || null;
  const occupiedGroupNames = row.group_names || null;
  const ungroupedHorseCount = Number(row.ungrouped_horse_count || 0);
  const readyToGrazeOn = toIsoDateString(row.ready_to_graze_on);
  const daysUntilReady = row.days_until_ready == null ? null : Number(row.days_until_ready);
  const effectiveWorkPaddockId =
    row.effective_work_paddock_id == null ? null : Number(row.effective_work_paddock_id);
  const effectiveWorkPaddockName = row.effective_work_paddock_name || null;
  const effectiveRestPaddockId =
    row.effective_rest_paddock_id == null ? null : Number(row.effective_rest_paddock_id);
  const effectiveRestPaddockName = row.effective_rest_paddock_name || null;
  let occupiedBy = occupiedHorseNames;

  if (occupiedGroupNames) {
    occupiedBy =
      ungroupedHorseCount > 0
        ? `${occupiedGroupNames}${occupiedGroupNames ? ` + ${ungroupedHorseCount} ungrouped` : ''}`
        : occupiedGroupNames;
  }

  let occupancyState = 'available';

  if (!active) {
    occupancyState = 'inactive';
  } else if (horseCount > 0) {
    occupancyState = 'occupied';
  } else if (readyToGrazeOn && daysUntilReady != null && daysUntilReady > 0) {
    occupancyState = 'growing';
  } else if (row.rest_days != null) {
    occupancyState = 'resting';
  }

  return {
    id: Number(row.id),
    name: row.name,
    zone: row.zone || null,
    size_ha: row.size_ha == null ? null : Number(row.size_ha),
    notes: row.notes || null,
    active,
    parent_paddock_id: row.parent_paddock_id == null ? null : Number(row.parent_paddock_id),
    parent_paddock_name: row.parent_paddock_name || null,
    horse_count: horseCount,
    occupied_by: occupiedBy,
    occupied_horses: occupiedHorseNames,
    occupied_groups: occupiedGroupNames,
    ungrouped_horse_count: ungroupedHorseCount,
    occupied_since: toIsoDateString(row.occupied_since),
    grazing_days: row.grazing_days == null ? null : Number(row.grazing_days),
    last_exited_at: toIsoDateString(row.last_exited_at),
    rest_days: row.rest_days == null ? null : Number(row.rest_days),
    effective_rest_paddock_id: effectiveRestPaddockId,
    effective_rest_paddock_name: effectiveRestPaddockName,
    inherited_rest:
      effectiveRestPaddockId != null &&
      Number(effectiveRestPaddockId) !== Number(row.id) &&
      row.rest_days != null,
    latest_work_type: normalizePaddockWorkEventType(row.latest_work_type),
    latest_work_type_label: row.latest_work_type ? formatPaddockWorkEventType(row.latest_work_type) : null,
    latest_work_date: toIsoDateString(row.latest_work_date),
    latest_work_notes: row.latest_work_notes || null,
    latest_work_applies_to_descendants: Boolean(row.latest_work_applies_to_descendants),
    effective_work_paddock_id: effectiveWorkPaddockId,
    effective_work_paddock_name: effectiveWorkPaddockName,
    inherited_wait:
      effectiveWorkPaddockId != null &&
      Number(effectiveWorkPaddockId) !== Number(row.id) &&
      Boolean(readyToGrazeOn),
    ready_to_graze_on: readyToGrazeOn,
    ready_after_days: row.ready_after_days == null ? null : Number(row.ready_after_days),
    days_until_ready: daysUntilReady,
    occupancy_state: occupancyState,
  };
}

function normalizePaddockWorkRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    paddock_id: Number(row.paddock_id),
    paddock_name: row.paddock_name || null,
    applies_to_descendants: Boolean(row.applies_to_descendants),
    effective_work_paddock_id:
      row.effective_work_paddock_id == null ? null : Number(row.effective_work_paddock_id),
    effective_work_paddock_name: row.effective_work_paddock_name || null,
    event_type: normalizePaddockWorkEventType(row.event_type),
    event_type_label: formatPaddockWorkEventType(row.event_type),
    event_date: toIsoDateString(row.event_date),
    ready_after_days: row.ready_after_days == null ? null : Number(row.ready_after_days),
    ready_to_graze_on: toIsoDateString(row.ready_to_graze_on),
    days_until_ready: row.days_until_ready == null ? null : Number(row.days_until_ready),
    notes: row.notes || null,
    telegram_user_id: row.telegram_user_id || null,
    created_at: normalizeIsoTimestamp(row.created_at),
    updated_at: normalizeIsoTimestamp(row.updated_at),
  };
}

async function ensurePaddockTables() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS paddocks (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        zone TEXT,
        size_ha NUMERIC(10,2),
        notes TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        parent_paddock_id BIGINT REFERENCES paddocks(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ensureTableColumns(pool, 'paddocks', PADDOCK_COLUMNS);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS paddocks_name_lower_idx
      ON paddocks (LOWER(name))
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS paddocks_active_name_idx
      ON paddocks (active, name)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS paddocks_parent_idx
      ON paddocks (parent_paddock_id, name)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS horse_groups (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        notes TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ensureTableColumns(pool, 'horse_groups', HORSE_GROUP_COLUMNS);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS horse_groups_name_lower_idx
      ON horse_groups (LOWER(name))
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS horse_groups_active_name_idx
      ON horse_groups (active, name)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS horse_group_memberships (
        id BIGSERIAL PRIMARY KEY,
        group_id BIGINT NOT NULL REFERENCES horse_groups(id) ON DELETE CASCADE,
        horse_id BIGINT NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (group_id, horse_id)
      )
    `);

    await ensureTableColumns(
      pool,
      'horse_group_memberships',
      HORSE_GROUP_MEMBERSHIP_COLUMNS
    );

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS horse_group_memberships_horse_unique_idx
      ON horse_group_memberships (horse_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS horse_group_memberships_group_idx
      ON horse_group_memberships (group_id, horse_id)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS horse_group_membership_history (
        id BIGSERIAL PRIMARY KEY,
        horse_id BIGINT NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
        group_id BIGINT REFERENCES horse_groups(id) ON DELETE SET NULL,
        group_name TEXT NOT NULL,
        started_at DATE NOT NULL,
        ended_at DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (ended_at IS NULL OR ended_at >= started_at)
      )
    `);

    await ensureTableColumns(
      pool,
      'horse_group_membership_history',
      HORSE_GROUP_MEMBERSHIP_HISTORY_COLUMNS
    );

    await pool.query(`
      ALTER TABLE horse_group_membership_history
      ALTER COLUMN group_name SET DEFAULT ''
    `);

    await pool.query(`
      UPDATE horse_group_membership_history hgh
      SET group_name = COALESCE(NULLIF(hgh.group_name, ''), hg.name)
      FROM horse_groups hg
      WHERE hg.id = hgh.group_id
        AND (hgh.group_name IS NULL OR hgh.group_name = '')
    `);

    await pool.query(`
      UPDATE horse_group_membership_history
      SET group_name = COALESCE(group_name, '')
      WHERE group_name IS NULL
    `);

    await pool.query(`
      ALTER TABLE horse_group_membership_history
      ALTER COLUMN group_name SET NOT NULL
    `);

    await pool.query(`
      UPDATE horse_group_membership_history
      SET started_at = COALESCE(started_at, created_at::date, CURRENT_DATE)
      WHERE started_at IS NULL
    `);

    await pool.query(`
      ALTER TABLE horse_group_membership_history
      ALTER COLUMN started_at SET NOT NULL
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS horse_group_membership_history_horse_idx
      ON horse_group_membership_history (horse_id, started_at DESC, id DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS horse_group_membership_history_group_idx
      ON horse_group_membership_history (group_id, started_at DESC, id DESC)
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS horse_group_membership_history_open_horse_idx
      ON horse_group_membership_history (horse_id)
      WHERE ended_at IS NULL
    `);

    await pool.query(`
      INSERT INTO horse_group_membership_history (
        horse_id,
        group_id,
        group_name,
        started_at
      )
      SELECT
        hgm.horse_id,
        hgm.group_id,
        g.name,
        COALESCE(hgm.created_at::date, CURRENT_DATE)
      FROM horse_group_memberships hgm
      JOIN horse_groups g ON g.id = hgm.group_id
      LEFT JOIN horse_group_membership_history hgh
        ON hgh.horse_id = hgm.horse_id
       AND hgh.ended_at IS NULL
      WHERE hgh.id IS NULL
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS grazing_events (
        id BIGSERIAL PRIMARY KEY,
        paddock_id BIGINT NOT NULL REFERENCES paddocks(id) ON DELETE CASCADE,
        horse_id BIGINT NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
        entered_at DATE NOT NULL,
        exited_at DATE,
        entry_notes TEXT,
        exit_notes TEXT,
        source TEXT DEFAULT 'manual',
        source_group_id BIGINT REFERENCES horse_groups(id) ON DELETE SET NULL,
        telegram_user_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (exited_at IS NULL OR exited_at >= entered_at)
      )
    `);

    await ensureTableColumns(pool, 'grazing_events', GRAZING_EVENT_COLUMNS);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS grazing_events_paddock_entered_idx
      ON grazing_events (paddock_id, entered_at DESC, id DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS grazing_events_horse_entered_idx
      ON grazing_events (horse_id, entered_at DESC, id DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS grazing_events_source_group_idx
      ON grazing_events (source_group_id, entered_at DESC, id DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS grazing_events_open_paddock_idx
      ON grazing_events (paddock_id)
      WHERE exited_at IS NULL
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS grazing_events_open_horse_unique_idx
      ON grazing_events (horse_id)
      WHERE exited_at IS NULL
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS paddock_work_events (
        id BIGSERIAL PRIMARY KEY,
        paddock_id BIGINT NOT NULL REFERENCES paddocks(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        event_date DATE NOT NULL,
        ready_after_days INTEGER,
        ready_to_graze_on DATE,
        applies_to_descendants BOOLEAN NOT NULL DEFAULT FALSE,
        notes TEXT,
        telegram_user_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (ready_after_days IS NULL OR ready_after_days >= 0),
        CHECK (ready_to_graze_on IS NULL OR ready_to_graze_on >= event_date)
      )
    `);

    await ensureTableColumns(pool, 'paddock_work_events', PADDOCK_WORK_EVENT_COLUMNS);

    await pool.query(`
      UPDATE paddock_work_events
      SET ready_to_graze_on = event_date + ready_after_days
      WHERE ready_to_graze_on IS NULL
        AND event_date IS NOT NULL
        AND ready_after_days IS NOT NULL
    `);

    await pool.query(`
      UPDATE paddock_work_events
      SET applies_to_descendants = COALESCE(applies_to_descendants, FALSE)
      WHERE applies_to_descendants IS NULL
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS paddock_work_events_paddock_date_idx
      ON paddock_work_events (paddock_id, event_date DESC, id DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS paddock_work_events_ready_idx
      ON paddock_work_events (ready_to_graze_on DESC, paddock_id)
    `);
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

async function findPaddockByName(name, options = {}) {
  await ensurePaddockTables();

  const paddockName = String(name || '').trim();
  if (!paddockName) {
    return null;
  }

  const params = [paddockName];
  let sql = `
    SELECT
      p.id,
      p.name,
      p.zone,
      p.size_ha,
      p.notes,
      p.active,
      p.parent_paddock_id,
      parent.name AS parent_paddock_name,
      p.created_at,
      p.updated_at
    FROM paddocks
    LEFT JOIN paddocks parent ON parent.id = p.parent_paddock_id
    WHERE LOWER(p.name) = LOWER($1)
  `;

  if (options.activeOnly) {
    sql += '\n  AND p.active = TRUE';
  }

  sql += '\nORDER BY p.id ASC\nLIMIT 1';

  const result = await pool.query(sql, params);
  return normalizePaddockRow(result.rows[0] || null);
}

async function listPaddockNames(options = {}) {
  await ensurePaddockTables();

  const params = [];
  let sql = `
    SELECT name
    FROM paddocks
  `;

  if (options.activeOnly) {
    params.push(true);
    sql += '\nWHERE active = $1';
  }

  sql += '\nORDER BY name ASC';

  const result = await pool.query(sql, params);
  return result.rows.map((row) => row.name);
}

async function assertNoPaddockParentCycle(client, paddockId, parentPaddockId) {
  if (!paddockId || !parentPaddockId) {
    return;
  }

  if (Number(paddockId) === Number(parentPaddockId)) {
    throw buildServiceError('A paddock cannot be its own parent.', 400);
  }

  const cycleResult = await client.query(
    `
    WITH RECURSIVE parent_chain AS (
      SELECT id, parent_paddock_id
      FROM paddocks
      WHERE id = $1
      UNION ALL
      SELECT p.id, p.parent_paddock_id
      FROM paddocks p
      JOIN parent_chain chain ON chain.parent_paddock_id = p.id
    )
    SELECT 1
    FROM parent_chain
    WHERE id = $2
    LIMIT 1
    `,
    [parentPaddockId, paddockId]
  );

  if (cycleResult.rows.length > 0) {
    throw buildServiceError('This parent paddock would create a dependency loop.', 400);
  }
}

async function savePaddock({ name, zone, sizeHa, notes, active = true, parentPaddockId = null }) {
  await ensurePaddockTables();

  const paddockName = String(name || '').trim();
  if (!paddockName) {
    throw buildServiceError('Paddock name is required.', 400);
  }

  const normalizedParentPaddockId =
    parentPaddockId == null || parentPaddockId === ''
      ? null
      : Number.parseInt(parentPaddockId, 10);
  if (
    normalizedParentPaddockId != null &&
    (!Number.isFinite(normalizedParentPaddockId) || normalizedParentPaddockId <= 0)
  ) {
    throw buildServiceError('Parent paddock is invalid.', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingResult = await client.query(
      `
      SELECT id
      FROM paddocks
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1
      FOR UPDATE
      `,
      [paddockName]
    );

    let parentPaddockRow = null;
    if (normalizedParentPaddockId != null) {
      const parentResult = await client.query(
        `
        SELECT id, name
        FROM paddocks
        WHERE id = $1
        LIMIT 1
        FOR UPDATE
        `,
        [normalizedParentPaddockId]
      );

      if (parentResult.rows.length === 0) {
        throw buildServiceError('Parent paddock not found.', 404);
      }

      parentPaddockRow = parentResult.rows[0];
    }

    let result;
    let mode = 'created';

    if (existingResult.rows.length > 0) {
      mode = 'updated';
      await assertNoPaddockParentCycle(
        client,
        existingResult.rows[0].id,
        normalizedParentPaddockId
      );
      result = await client.query(
        `
        UPDATE paddocks
        SET name = $1,
            zone = $2,
            size_ha = $3,
            notes = $4,
            active = $5,
            parent_paddock_id = $6,
            updated_at = NOW()
        WHERE id = $7
        RETURNING
          id,
          name,
          zone,
          size_ha,
          notes,
          active,
          parent_paddock_id,
          created_at,
          updated_at
        `,
        [
          paddockName,
          zone || null,
          sizeHa,
          notes || null,
          active,
          normalizedParentPaddockId,
          existingResult.rows[0].id,
        ]
      );
    } else {
      result = await client.query(
        `
        INSERT INTO paddocks (
          name,
          zone,
          size_ha,
          notes,
          active,
          parent_paddock_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          name,
          zone,
          size_ha,
          notes,
          active,
          parent_paddock_id,
          created_at,
          updated_at
        `,
        [paddockName, zone || null, sizeHa, notes || null, active, normalizedParentPaddockId]
      );
    }

    await client.query('COMMIT');

    return {
      mode,
      paddock: normalizePaddockRow({
        ...result.rows[0],
        parent_paddock_name: parentPaddockRow?.name || null,
      }),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getEffectivePaddockWaitEvent(client, paddockId, referenceDate) {
  const normalizedReferenceDate = toIsoDateString(referenceDate);
  if (!paddockId || !normalizedReferenceDate) {
    return null;
  }

  const result = await client.query(
    `
    WITH RECURSIVE paddock_chain AS (
      SELECT p.id, p.name, p.parent_paddock_id, 0 AS depth
      FROM paddocks p
      WHERE p.id = $1
      UNION ALL
      SELECT parent.id, parent.name, parent.parent_paddock_id, paddock_chain.depth + 1
      FROM paddocks parent
      JOIN paddock_chain ON paddock_chain.parent_paddock_id = parent.id
    )
    SELECT
      pwe.id,
      pwe.paddock_id,
      chain.name AS paddock_name,
      pwe.event_type,
      pwe.event_date,
      pwe.ready_after_days,
      pwe.ready_to_graze_on,
      pwe.applies_to_descendants,
      pwe.notes,
      pwe.telegram_user_id,
      pwe.created_at,
      pwe.updated_at,
      chain.id AS effective_work_paddock_id,
      chain.name AS effective_work_paddock_name,
      CASE
        WHEN pwe.ready_to_graze_on IS NULL THEN NULL
        WHEN pwe.ready_to_graze_on < $2::date THEN 0
        ELSE (pwe.ready_to_graze_on - $2::date)::int
      END AS days_until_ready
    FROM paddock_chain chain
    JOIN paddock_work_events pwe ON pwe.paddock_id = chain.id
    WHERE pwe.event_date <= $2::date
      AND pwe.ready_to_graze_on IS NOT NULL
      AND (chain.depth = 0 OR pwe.applies_to_descendants = TRUE)
    ORDER BY
      pwe.ready_to_graze_on DESC,
      pwe.event_date DESC,
      chain.depth ASC,
      pwe.id DESC
    LIMIT 1
    `,
    [paddockId, normalizedReferenceDate]
  );

  return normalizePaddockWorkRow(result.rows[0] || null);
}

async function savePaddockWorkEvent({
  paddockId,
  eventType,
  eventDate,
  readyAfterDays = null,
  applyToDescendants = false,
  notes = null,
  telegramUserId = null,
}) {
  await ensurePaddockTables();

  const normalizedEventType = normalizePaddockWorkEventType(eventType);
  if (!normalizedEventType) {
    throw buildServiceError('Paddock work type is invalid.', 400);
  }

  const normalizedEventDate = toIsoDateString(eventDate);
  if (!normalizedEventDate) {
    throw buildServiceError('Paddock work date is invalid.', 400);
  }

  if (readyAfterDays != null && (!Number.isInteger(readyAfterDays) || readyAfterDays < 0)) {
    throw buildServiceError('Ready-after days must be a whole number >= 0.', 400);
  }

  const readyToGrazeOn = readyAfterDays == null ? null : addDaysToDateString(normalizedEventDate, readyAfterDays);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const paddockResult = await client.query(
      `
      SELECT id, name, zone, size_ha, notes, active, created_at, updated_at
      FROM paddocks
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
      `,
      [paddockId]
    );

    if (paddockResult.rows.length === 0) {
      throw buildServiceError('Paddock not found.', 404);
    }

    const insertResult = await client.query(
      `
      INSERT INTO paddock_work_events (
        paddock_id,
        event_type,
        event_date,
        ready_after_days,
        ready_to_graze_on,
        applies_to_descendants,
        notes,
        telegram_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        paddock_id,
        event_type,
        event_date,
        ready_after_days,
        ready_to_graze_on,
        applies_to_descendants,
        notes,
        telegram_user_id,
        created_at,
        updated_at
      `,
      [
        paddockId,
        normalizedEventType,
        normalizedEventDate,
        readyAfterDays,
        readyToGrazeOn,
        Boolean(applyToDescendants),
        notes || null,
        telegramUserId,
      ]
    );

    const currentWaitEvent = await getEffectivePaddockWaitEvent(client, paddockId, normalizedEventDate);

    await client.query('COMMIT');

    return {
      paddock: normalizePaddockRow(paddockResult.rows[0]),
      paddock_work_event: normalizePaddockWorkRow({
        ...insertResult.rows[0],
        paddock_name: paddockResult.rows[0].name,
        days_until_ready:
          readyToGrazeOn == null
            ? null
            : Math.max(
                0,
                Math.round(
                  (new Date(`${readyToGrazeOn}T00:00:00Z`) -
                    new Date(`${normalizedEventDate}T00:00:00Z`)) /
                    (24 * 60 * 60 * 1000)
                )
              ),
      }),
      active_wait_event: currentWaitEvent,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updatePaddockWorkEvent({
  eventId,
  paddockId,
  eventType,
  eventDate,
  readyAfterDays = null,
  applyToDescendants = false,
  notes = null,
  telegramUserId = null,
}) {
  await ensurePaddockTables();

  const normalizedEventId = Number.parseInt(eventId, 10);
  if (!Number.isFinite(normalizedEventId) || normalizedEventId <= 0) {
    throw buildServiceError('Paddock work event is invalid.', 400);
  }

  const normalizedEventType = normalizePaddockWorkEventType(eventType);
  if (!normalizedEventType) {
    throw buildServiceError('Paddock work type is invalid.', 400);
  }

  const normalizedEventDate = toIsoDateString(eventDate);
  if (!normalizedEventDate) {
    throw buildServiceError('Paddock work date is invalid.', 400);
  }

  if (readyAfterDays != null && (!Number.isInteger(readyAfterDays) || readyAfterDays < 0)) {
    throw buildServiceError('Ready-after days must be a whole number >= 0.', 400);
  }

  const readyToGrazeOn = readyAfterDays == null ? null : addDaysToDateString(normalizedEventDate, readyAfterDays);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingResult = await client.query(
      `
      SELECT id
      FROM paddock_work_events
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
      `,
      [normalizedEventId]
    );

    if (existingResult.rows.length === 0) {
      throw buildServiceError('Paddock work event not found.', 404);
    }

    const paddockResult = await client.query(
      `
      SELECT id, name, zone, size_ha, notes, active, parent_paddock_id, created_at, updated_at
      FROM paddocks
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
      `,
      [paddockId]
    );

    if (paddockResult.rows.length === 0) {
      throw buildServiceError('Paddock not found.', 404);
    }

    const updateResult = await client.query(
      `
      UPDATE paddock_work_events
      SET paddock_id = $1,
          event_type = $2,
          event_date = $3,
          ready_after_days = $4,
          ready_to_graze_on = $5,
          applies_to_descendants = $6,
          notes = $7,
          telegram_user_id = COALESCE($8, telegram_user_id),
          updated_at = NOW()
      WHERE id = $9
      RETURNING
        id,
        paddock_id,
        event_type,
        event_date,
        ready_after_days,
        ready_to_graze_on,
        applies_to_descendants,
        notes,
        telegram_user_id,
        created_at,
        updated_at
      `,
      [
        paddockId,
        normalizedEventType,
        normalizedEventDate,
        readyAfterDays,
        readyToGrazeOn,
        Boolean(applyToDescendants),
        notes || null,
        telegramUserId,
        normalizedEventId,
      ]
    );

    const currentWaitEvent = await getEffectivePaddockWaitEvent(client, paddockId, normalizedEventDate);

    await client.query('COMMIT');

    return {
      paddock: normalizePaddockRow(paddockResult.rows[0]),
      paddock_work_event: normalizePaddockWorkRow({
        ...updateResult.rows[0],
        paddock_name: paddockResult.rows[0].name,
        days_until_ready:
          readyToGrazeOn == null
            ? null
            : Math.max(
                0,
                Math.round(
                  (new Date(`${readyToGrazeOn}T00:00:00Z`) -
                    new Date(`${normalizedEventDate}T00:00:00Z`)) /
                    (24 * 60 * 60 * 1000)
                )
              ),
      }),
      active_wait_event: currentWaitEvent,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listPaddockWorkHistory({ paddockId = null, limit = 80 } = {}) {
  await ensurePaddockTables();

  const params = [];
  const whereParts = [];

  if (paddockId) {
    params.push(paddockId);
    whereParts.push(`pwe.paddock_id = $${params.length}`);
  }

  params.push(limit);
  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const result = await pool.query(
    `
    SELECT
      pwe.id,
      pwe.paddock_id,
      p.name AS paddock_name,
      pwe.event_type,
      pwe.event_date,
      pwe.ready_after_days,
      pwe.ready_to_graze_on,
      pwe.applies_to_descendants,
      CASE
        WHEN pwe.ready_to_graze_on IS NULL THEN NULL
        WHEN pwe.ready_to_graze_on < CURRENT_DATE THEN 0
        ELSE (pwe.ready_to_graze_on - CURRENT_DATE)::int
      END AS days_until_ready,
      pwe.notes,
      pwe.telegram_user_id,
      pwe.created_at,
      pwe.updated_at
    FROM paddock_work_events pwe
    JOIN paddocks p ON p.id = pwe.paddock_id
    ${whereClause}
    ORDER BY pwe.event_date DESC, pwe.id DESC
    LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map(normalizePaddockWorkRow);
}

async function assertPaddockReadyForEntry(client, paddockId, entryDate) {
  const waitEvent = await getEffectivePaddockWaitEvent(client, paddockId, entryDate);
  if (!waitEvent?.ready_to_graze_on) {
    return null;
  }

  if (toIsoDateString(entryDate) >= waitEvent.ready_to_graze_on) {
    return waitEvent;
  }

  const sourcePart =
    waitEvent.effective_work_paddock_name &&
    Number(waitEvent.effective_work_paddock_id) !== Number(paddockId)
      ? ` on ${waitEvent.effective_work_paddock_name}`
      : '';
  throw buildServiceError(
    `Paddock is not ready for grazing until ${waitEvent.ready_to_graze_on} after ${waitEvent.event_type_label.toLowerCase()}${sourcePart}.`,
    409
  );
}

async function findHorseGroupByName(name, options = {}) {
  await ensurePaddockTables();

  const groupName = String(name || '').trim();
  if (!groupName) {
    return null;
  }

  const params = [groupName];
  let sql = `
    SELECT
      g.id,
      g.name,
      g.notes,
      g.active,
      g.created_at,
      g.updated_at,
      COALESCE(group_members.member_count, 0) AS member_count,
      COALESCE(group_members.member_ids, ARRAY[]::bigint[]) AS member_ids,
      COALESCE(group_members.member_names, ARRAY[]::text[]) AS member_names,
      current_grazing.current_paddock_names,
      COALESCE(current_grazing.grazing_member_count, 0) AS grazing_member_count
    FROM horse_groups g
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS member_count,
        ARRAY_AGG(h.id ORDER BY h.name) AS member_ids,
        ARRAY_AGG(h.name ORDER BY h.name) AS member_names
      FROM horse_group_memberships hgm
      JOIN horses h ON h.id = hgm.horse_id
      WHERE hgm.group_id = g.id
    ) group_members ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) AS current_paddock_names,
        COUNT(DISTINCT ge.horse_id)::int AS grazing_member_count
      FROM horse_group_memberships hgm
      JOIN grazing_events ge
        ON ge.horse_id = hgm.horse_id
       AND ge.exited_at IS NULL
      JOIN paddocks p ON p.id = ge.paddock_id
      WHERE hgm.group_id = g.id
    ) current_grazing ON TRUE
    WHERE LOWER(g.name) = LOWER($1)
  `;

  if (options.activeOnly) {
    sql += '\n  AND g.active = TRUE';
  }

  sql += '\nORDER BY g.id ASC\nLIMIT 1';

  const result = await pool.query(sql, params);
  return normalizeHorseGroupRow(result.rows[0] || null);
}

async function findHorseGroupById(groupId, options = {}) {
  await ensurePaddockTables();

  const normalizedGroupId = Number.parseInt(groupId, 10);
  if (!Number.isFinite(normalizedGroupId) || normalizedGroupId <= 0) {
    return null;
  }

  const params = [normalizedGroupId];
  let sql = `
    SELECT
      g.id,
      g.name,
      g.notes,
      g.active,
      g.created_at,
      g.updated_at,
      COALESCE(group_members.member_count, 0) AS member_count,
      COALESCE(group_members.member_ids, ARRAY[]::bigint[]) AS member_ids,
      COALESCE(group_members.member_names, ARRAY[]::text[]) AS member_names,
      current_grazing.current_paddock_names,
      COALESCE(current_grazing.grazing_member_count, 0) AS grazing_member_count
    FROM horse_groups g
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS member_count,
        ARRAY_AGG(h.id ORDER BY h.name) AS member_ids,
        ARRAY_AGG(h.name ORDER BY h.name) AS member_names
      FROM horse_group_memberships hgm
      JOIN horses h ON h.id = hgm.horse_id
      WHERE hgm.group_id = g.id
    ) group_members ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) AS current_paddock_names,
        COUNT(DISTINCT ge.horse_id)::int AS grazing_member_count
      FROM horse_group_memberships hgm
      JOIN grazing_events ge
        ON ge.horse_id = hgm.horse_id
       AND ge.exited_at IS NULL
      JOIN paddocks p ON p.id = ge.paddock_id
      WHERE hgm.group_id = g.id
    ) current_grazing ON TRUE
    WHERE g.id = $1
  `;

  if (options.activeOnly) {
    params.push(true);
    sql += '\n  AND g.active = $2';
  }

  sql += '\nLIMIT 1';

  const result = await pool.query(sql, params);
  return normalizeHorseGroupRow(result.rows[0] || null);
}

async function listHorseGroups(options = {}) {
  await ensurePaddockTables();

  const params = [];
  let whereClause = '';

  if (options.activeOnly) {
    params.push(true);
    whereClause = '\nWHERE g.active = $1';
  }

  const result = await pool.query(
    `
    SELECT
      g.id,
      g.name,
      g.notes,
      g.active,
      g.created_at,
      g.updated_at,
      COALESCE(group_members.member_count, 0) AS member_count,
      COALESCE(group_members.member_ids, ARRAY[]::bigint[]) AS member_ids,
      COALESCE(group_members.member_names, ARRAY[]::text[]) AS member_names,
      current_grazing.current_paddock_names,
      COALESCE(current_grazing.grazing_member_count, 0) AS grazing_member_count
    FROM horse_groups g
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS member_count,
        ARRAY_AGG(h.id ORDER BY h.name) AS member_ids,
        ARRAY_AGG(h.name ORDER BY h.name) AS member_names
      FROM horse_group_memberships hgm
      JOIN horses h ON h.id = hgm.horse_id
      WHERE hgm.group_id = g.id
    ) group_members ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) AS current_paddock_names,
        COUNT(DISTINCT ge.horse_id)::int AS grazing_member_count
      FROM horse_group_memberships hgm
      JOIN grazing_events ge
        ON ge.horse_id = hgm.horse_id
       AND ge.exited_at IS NULL
      JOIN paddocks p ON p.id = ge.paddock_id
      WHERE hgm.group_id = g.id
    ) current_grazing ON TRUE
    ${whereClause}
    ORDER BY g.active DESC, g.name ASC
    `,
    params
  );

  return result.rows.map(normalizeHorseGroupRow);
}

async function listHorseGroupNames(options = {}) {
  const groups = await listHorseGroups(options);
  return groups.map((group) => group.name);
}

async function listHorseGroupHistory(options = {}) {
  await ensurePaddockTables();

  const normalizedHorseId =
    options.horseId == null || options.horseId === ''
      ? null
      : Number.parseInt(options.horseId, 10);
  const limitValue = Number.parseInt(options.limit, 10);
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? limitValue : 40;
  const params = [];
  const whereParts = [];

  if (normalizedHorseId != null) {
    if (!Number.isFinite(normalizedHorseId) || normalizedHorseId <= 0) {
      return [];
    }

    params.push(normalizedHorseId);
    whereParts.push(`hgh.horse_id = $${params.length}`);
  }

  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
  params.push(limit);

  const groupNameExpr = `
    CASE
      WHEN hgh.ended_at IS NULL THEN COALESCE(hg.name, hgh.group_name)
      ELSE COALESCE(hgh.group_name, hg.name)
    END
  `;
  const groupDaysExpr = `
    GREATEST(1, ((COALESCE(hgh.ended_at, CURRENT_DATE) - hgh.started_at) + 1))::int
  `;

  const result = await pool.query(
    `
    SELECT
      history_rows.id,
      history_rows.horse_id,
      history_rows.horse_name,
      history_rows.group_id,
      history_rows.group_name,
      history_rows.started_at,
      history_rows.ended_at,
      history_rows.group_days,
      history_rows.previous_group_id,
      history_rows.previous_group_name,
      history_rows.previous_group_days,
      history_rows.created_at,
      history_rows.updated_at
    FROM (
      SELECT
        hgh.id,
        hgh.horse_id,
        h.name AS horse_name,
        hgh.group_id,
        ${groupNameExpr} AS group_name,
        hgh.started_at,
        hgh.ended_at,
        ${groupDaysExpr} AS group_days,
        LAG(hgh.group_id) OVER group_history_window AS previous_group_id,
        LAG(${groupNameExpr}) OVER group_history_window AS previous_group_name,
        LAG(${groupDaysExpr}) OVER group_history_window AS previous_group_days,
        hgh.created_at,
        hgh.updated_at
      FROM horse_group_membership_history hgh
      JOIN horses h ON h.id = hgh.horse_id
      LEFT JOIN horse_groups hg ON hg.id = hgh.group_id
      ${whereClause}
      WINDOW group_history_window AS (
        PARTITION BY hgh.horse_id
        ORDER BY hgh.started_at ASC, hgh.id ASC
      )
    ) history_rows
    ORDER BY COALESCE(history_rows.ended_at, history_rows.started_at) DESC, history_rows.id DESC
    LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map(normalizeHorseGroupHistoryRow);
}

async function getHorseCurrentGroupMembership(horseId) {
  await ensurePaddockTables();

  const normalizedHorseId = Number.parseInt(horseId, 10);
  if (!Number.isFinite(normalizedHorseId) || normalizedHorseId <= 0) {
    return null;
  }

  const result = await pool.query(
    `
    SELECT
      history_rows.id,
      history_rows.horse_id,
      history_rows.horse_name,
      history_rows.group_id,
      history_rows.group_name,
      history_rows.started_at,
      history_rows.ended_at,
      history_rows.group_days,
      history_rows.previous_group_id,
      history_rows.previous_group_name,
      history_rows.previous_group_days,
      history_rows.created_at,
      history_rows.updated_at
    FROM (
      SELECT
        hgh.id,
        hgh.horse_id,
        h.name AS horse_name,
        hgh.group_id,
        CASE
          WHEN hgh.ended_at IS NULL THEN COALESCE(hg.name, hgh.group_name)
          ELSE COALESCE(hgh.group_name, hg.name)
        END AS group_name,
        hgh.started_at,
        hgh.ended_at,
        GREATEST(1, ((COALESCE(hgh.ended_at, CURRENT_DATE) - hgh.started_at) + 1))::int AS group_days,
        LAG(hgh.group_id) OVER group_history_window AS previous_group_id,
        LAG(
          CASE
            WHEN hgh.ended_at IS NULL THEN COALESCE(hg.name, hgh.group_name)
            ELSE COALESCE(hgh.group_name, hg.name)
          END
        ) OVER group_history_window AS previous_group_name,
        LAG(
          GREATEST(1, ((COALESCE(hgh.ended_at, CURRENT_DATE) - hgh.started_at) + 1))::int
        ) OVER group_history_window AS previous_group_days,
        hgh.created_at,
        hgh.updated_at
      FROM horse_group_membership_history hgh
      JOIN horses h ON h.id = hgh.horse_id
      LEFT JOIN horse_groups hg ON hg.id = hgh.group_id
      WHERE hgh.horse_id = $1
      WINDOW group_history_window AS (
        PARTITION BY hgh.horse_id
        ORDER BY hgh.started_at ASC, hgh.id ASC
      )
    ) history_rows
    WHERE history_rows.ended_at IS NULL
    ORDER BY history_rows.started_at DESC, history_rows.id DESC
    LIMIT 1
    `,
    [normalizedHorseId]
  );

  return normalizeHorseGroupHistoryRow(result.rows[0] || null);
}

async function saveHorseGroup({ groupId = null, name, notes, active = true }) {
  await ensurePaddockTables();

  const groupName = String(name || '').trim();
  if (!groupName) {
    throw buildServiceError('Group name is required.', 400);
  }

  const normalizedGroupId =
    groupId == null || groupId === ''
      ? null
      : Number.parseInt(groupId, 10);

  if (groupId != null && groupId !== '' && (!Number.isFinite(normalizedGroupId) || normalizedGroupId <= 0)) {
    throw buildServiceError('A valid groupId is required to update a group.', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let result;
    let mode = normalizedGroupId ? 'updated' : 'created';

    if (normalizedGroupId) {
      const targetGroupResult = await client.query(
        `
        SELECT id, name
        FROM horse_groups
        WHERE id = $1
        LIMIT 1
        FOR UPDATE
        `,
        [normalizedGroupId]
      );

      if (targetGroupResult.rows.length === 0) {
        throw buildServiceError('Group not found.', 404);
      }

      const nameConflictResult = await client.query(
        `
        SELECT id, name
        FROM horse_groups
        WHERE LOWER(name) = LOWER($1)
          AND id <> $2
        LIMIT 1
        `,
        [groupName, normalizedGroupId]
      );

      if (nameConflictResult.rows.length > 0) {
        throw buildServiceError(
          `Another group already uses that name: ${nameConflictResult.rows[0].name}`,
          409
        );
      }

      result = await client.query(
        `
        UPDATE horse_groups
        SET name = $1,
            notes = $2,
            active = $3,
            updated_at = NOW()
        WHERE id = $4
        RETURNING id, name, notes, active, created_at, updated_at
        `,
        [groupName, notes || null, active, normalizedGroupId]
      );
    } else {
      const existingResult = await client.query(
        `
        SELECT id
        FROM horse_groups
        WHERE LOWER(name) = LOWER($1)
        LIMIT 1
        FOR UPDATE
        `,
        [groupName]
      );

      if (existingResult.rows.length > 0) {
        mode = 'updated';
        result = await client.query(
          `
          UPDATE horse_groups
          SET name = $1,
              notes = $2,
              active = $3,
              updated_at = NOW()
          WHERE id = $4
          RETURNING id, name, notes, active, created_at, updated_at
          `,
          [groupName, notes || null, active, existingResult.rows[0].id]
        );
      } else {
        result = await client.query(
          `
          INSERT INTO horse_groups (
            name,
            notes,
            active
          )
          VALUES ($1, $2, $3)
          RETURNING id, name, notes, active, created_at, updated_at
          `,
          [groupName, notes || null, active]
        );
      }
    }

    await client.query('COMMIT');

    const savedGroupId = result.rows[0]?.id;
    const group = await findHorseGroupById(savedGroupId);

    return {
      mode,
      group,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function setHorseGroupMembers({ groupId, horseIds }) {
  await ensurePaddockTables();

  const normalizedHorseIds = [...new Set((horseIds || []).map((value) => Number.parseInt(value, 10)))].filter(
    (value) => Number.isFinite(value) && value > 0
  );

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const groupResult = await client.query(
      `
      SELECT id, name, notes, active, created_at, updated_at
      FROM horse_groups
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
      `,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      throw buildServiceError('Group not found.', 404);
    }

    let horseRows = [];
    if (normalizedHorseIds.length > 0) {
      const horseResult = await client.query(
        `
        SELECT id, name
        FROM horses
        WHERE id = ANY($1::bigint[])
        ORDER BY name ASC
        `,
        [normalizedHorseIds]
      );

      horseRows = horseResult.rows;

      if (horseRows.length !== normalizedHorseIds.length) {
        const foundIds = new Set(horseRows.map((row) => Number(row.id)));
        const missingIds = normalizedHorseIds.filter((id) => !foundIds.has(id));
        throw buildServiceError(`Some horses were not found: ${missingIds.join(', ')}`, 404);
      }
    }

    const currentMembershipParams = [groupId];
    let currentMembershipWhere = 'hgm.group_id = $1';
    if (normalizedHorseIds.length > 0) {
      currentMembershipParams.push(normalizedHorseIds);
      currentMembershipWhere += ` OR hgm.horse_id = ANY($${currentMembershipParams.length}::bigint[])`;
    }

    const currentMembershipResult = await client.query(
      `
      SELECT
        hgm.horse_id,
        hgm.group_id,
        hgm.created_at,
        h.name AS horse_name,
        g.name AS group_name
      FROM horse_group_memberships hgm
      JOIN horses h ON h.id = hgm.horse_id
      JOIN horse_groups g ON g.id = hgm.group_id
      WHERE ${currentMembershipWhere}
      FOR UPDATE OF hgm
      `,
      currentMembershipParams
    );

    const currentMembershipByHorseId = new Map();
    const currentTargetMemberIds = new Set();
    for (const row of currentMembershipResult.rows) {
      const horseId = Number(row.horse_id);
      currentMembershipByHorseId.set(horseId, {
        horse_id: horseId,
        group_id: Number(row.group_id),
        horse_name: row.horse_name,
        group_name: row.group_name,
        created_at: row.created_at,
      });

      if (Number(row.group_id) === Number(groupId)) {
        currentTargetMemberIds.add(horseId);
      }
    }

    const selectedHorseIdSet = new Set(normalizedHorseIds);
    const horseIdsLeavingTargetGroup = [...currentTargetMemberIds].filter((horseId) => !selectedHorseIdSet.has(horseId));
    const horseIdsJoiningTargetGroup = normalizedHorseIds.filter(
      (horseId) => currentMembershipByHorseId.get(horseId)?.group_id !== Number(groupId)
    );
    const horseIdsReassignedFromOtherGroup = horseIdsJoiningTargetGroup.filter((horseId) =>
      currentMembershipByHorseId.has(horseId)
    );
    const horseIdsEndingCurrentGroup = [
      ...new Set([...horseIdsLeavingTargetGroup, ...horseIdsReassignedFromOtherGroup]),
    ];

    let closedHistoryRows = [];
    if (horseIdsEndingCurrentGroup.length > 0) {
      const closedHistoryResult = await client.query(
        `
        UPDATE horse_group_membership_history
        SET ended_at = CURRENT_DATE,
            updated_at = NOW()
        WHERE horse_id = ANY($1::bigint[])
          AND ended_at IS NULL
        RETURNING
          id,
          horse_id,
          group_id,
          group_name,
          started_at,
          ended_at,
          GREATEST(1, ((CURRENT_DATE - started_at) + 1))::int AS group_days,
          created_at,
          updated_at
        `,
        [horseIdsEndingCurrentGroup]
      );

      closedHistoryRows = closedHistoryResult.rows;
    }

    const closedHistoryByHorseId = new Map(
      closedHistoryRows.map((row) => [Number(row.horse_id), normalizeHorseGroupHistoryRow(row)])
    );

    const reassignedRows = horseIdsReassignedFromOtherGroup
      .map((horseId) => {
        const currentMembership = currentMembershipByHorseId.get(horseId);
        const closedHistory = closedHistoryByHorseId.get(horseId);
        if (!currentMembership) {
          return null;
        }

        return {
          horse_id: horseId,
          horse_name: currentMembership.horse_name,
          previous_group_id: currentMembership.group_id,
          previous_group_name: currentMembership.group_name,
          previous_group_days:
            closedHistory?.group_days || calculateInclusiveDaysFromTimestamp(currentMembership.created_at),
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.horse_name.localeCompare(right.horse_name));

    const removedRows = horseIdsLeavingTargetGroup
      .map((horseId) => {
        const currentMembership = currentMembershipByHorseId.get(horseId);
        const closedHistory = closedHistoryByHorseId.get(horseId);
        if (!currentMembership) {
          return null;
        }

        return {
          horse_id: horseId,
          horse_name: currentMembership.horse_name,
          previous_group_id: currentMembership.group_id,
          previous_group_name: currentMembership.group_name,
          previous_group_days:
            closedHistory?.group_days || calculateInclusiveDaysFromTimestamp(currentMembership.created_at),
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.horse_name.localeCompare(right.horse_name));

    if (horseIdsLeavingTargetGroup.length > 0) {
      await client.query(
        `
        DELETE FROM horse_group_memberships
        WHERE group_id = $1
          AND horse_id = ANY($2::bigint[])
        `,
        [groupId, horseIdsLeavingTargetGroup]
      );
    }

    if (horseIdsReassignedFromOtherGroup.length > 0) {
      await client.query(
        `
        DELETE FROM horse_group_memberships
        WHERE horse_id = ANY($1::bigint[])
          AND group_id <> $2
        `,
        [horseIdsReassignedFromOtherGroup, groupId]
      );
    }

    if (horseIdsJoiningTargetGroup.length > 0) {
      await client.query(
        `
        INSERT INTO horse_group_memberships (group_id, horse_id)
        SELECT $1, horse_id
        FROM UNNEST($2::bigint[]) AS horse_id
        `,
        [groupId, horseIdsJoiningTargetGroup]
      );

      await client.query(
        `
        INSERT INTO horse_group_membership_history (
          horse_id,
          group_id,
          group_name,
          started_at
        )
        SELECT
          horse_id,
          $1,
          $2,
          CURRENT_DATE
        FROM UNNEST($3::bigint[]) AS horse_id
        `,
        [groupId, groupResult.rows[0].name, horseIdsJoiningTargetGroup]
      );
    }

    await client.query('COMMIT');

    const groups = await listHorseGroups();
    const group = groups.find((row) => row.id === Number(groupId)) || null;

    return {
      group,
      members: group?.members || [],
      reassigned_members: reassignedRows.map((row) => ({
        horse_id: Number(row.horse_id),
        horse_name: row.horse_name,
        previous_group_id: Number(row.previous_group_id),
        previous_group_name: row.previous_group_name,
        previous_group_days: row.previous_group_days == null ? null : Number(row.previous_group_days),
      })),
      removed_members: removedRows.map((row) => ({
        horse_id: Number(row.horse_id),
        horse_name: row.horse_name,
        previous_group_id: Number(row.previous_group_id),
        previous_group_name: row.previous_group_name,
        previous_group_days: row.previous_group_days == null ? null : Number(row.previous_group_days),
      })),
      horses: horseRows.map((row) => ({
        id: Number(row.id),
        name: row.name,
      })),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function buildGroupedHorseConflict(rows, options = {}) {
  const label = options.label || 'horses';
  const formatter =
    options.formatter ||
    ((row) => `${row.horse_name}${row.paddock_name ? ` in ${row.paddock_name}` : ''}`);

  const lines = rows.map((row) => formatter(row));
  return `${label}: ${lines.join('; ')}`;
}

async function moveHorseIntoPaddock({
  horseId,
  paddockId,
  enteredAt,
  entryNotes,
  source = 'manual',
  sourceGroupId = null,
  telegramUserId = null,
}) {
  await ensurePaddockTables();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const horseResult = await client.query(
      `
      SELECT id, name
      FROM horses
      WHERE id = $1
      LIMIT 1
      `,
      [horseId]
    );

    if (horseResult.rows.length === 0) {
      throw buildServiceError('Horse not found.', 404);
    }

    const paddockResult = await client.query(
      `
      SELECT id, name, zone, size_ha, notes, active, created_at, updated_at
      FROM paddocks
      WHERE id = $1
      LIMIT 1
      `,
      [paddockId]
    );

    if (paddockResult.rows.length === 0) {
      throw buildServiceError('Paddock not found.', 404);
    }

    if (!paddockResult.rows[0].active) {
      throw buildServiceError(`Paddock is inactive: ${paddockResult.rows[0].name}`, 409);
    }

    await assertPaddockReadyForEntry(client, paddockId, enteredAt);

    let sourceGroup = null;
    if (sourceGroupId) {
      const sourceGroupResult = await client.query(
        `
        SELECT id, name, active
        FROM horse_groups
        WHERE id = $1
        LIMIT 1
        `,
        [sourceGroupId]
      );

      if (sourceGroupResult.rows.length === 0) {
        throw buildServiceError('Source group not found.', 404);
      }

      sourceGroup = sourceGroupResult.rows[0];
    }

    const openEventResult = await client.query(
      `
      SELECT
        ge.id,
        ge.paddock_id,
        ge.entered_at,
        p.name AS paddock_name
      FROM grazing_events ge
      JOIN paddocks p ON p.id = ge.paddock_id
      WHERE ge.horse_id = $1
        AND ge.exited_at IS NULL
      LIMIT 1
      FOR UPDATE
      `,
      [horseId]
    );

    if (openEventResult.rows.length > 0) {
      const openEvent = openEventResult.rows[0];
      throw buildServiceError(
        `${horseResult.rows[0].name} is already grazing in ${openEvent.paddock_name} since ${toIsoDateString(
          openEvent.entered_at
        )}. Move the horse out first.`,
        409
      );
    }

    const insertResult = await client.query(
      `
      INSERT INTO grazing_events (
        paddock_id,
        horse_id,
        entered_at,
        entry_notes,
        source,
        source_group_id,
        telegram_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        paddock_id,
        horse_id,
        entered_at,
        exited_at,
        entry_notes,
        exit_notes,
        source,
        source_group_id,
        telegram_user_id,
        created_at,
        updated_at
      `,
      [
        paddockId,
        horseId,
        enteredAt,
        entryNotes || null,
        source || 'manual',
        sourceGroupId || null,
        telegramUserId,
      ]
    );

    const occupancyResult = await client.query(
      `
      SELECT COUNT(*)::int AS horse_count
      FROM grazing_events
      WHERE paddock_id = $1
        AND exited_at IS NULL
      `,
      [paddockId]
    );

    await client.query('COMMIT');

    return {
      horse: {
        id: Number(horseResult.rows[0].id),
        name: horseResult.rows[0].name,
      },
      paddock: normalizePaddockRow(paddockResult.rows[0]),
      source_group: sourceGroup
        ? {
            id: Number(sourceGroup.id),
            name: sourceGroup.name,
          }
        : null,
      grazing_event: {
        ...normalizeGrazingRow({
          ...insertResult.rows[0],
          paddock_name: paddockResult.rows[0].name,
          horse_name: horseResult.rows[0].name,
          source_group_name: sourceGroup?.name || null,
          grazing_days: 1,
        }),
        active: true,
      },
      paddock_occupancy_count: Number(occupancyResult.rows[0]?.horse_count || 0),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function moveHorseOutOfPaddock({ horseId, paddockId = null, exitedAt, exitNotes }) {
  await ensurePaddockTables();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const horseResult = await client.query(
      `
      SELECT id, name
      FROM horses
      WHERE id = $1
      LIMIT 1
      `,
      [horseId]
    );

    if (horseResult.rows.length === 0) {
      throw buildServiceError('Horse not found.', 404);
    }

    const openEventResult = await client.query(
      `
      SELECT
        ge.id,
        ge.paddock_id,
        ge.horse_id,
        ge.entered_at,
        ge.entry_notes,
        ge.source,
        ge.source_group_id,
        ge.telegram_user_id,
        ge.created_at,
        ge.updated_at,
        p.name AS paddock_name,
        sg.name AS source_group_name
      FROM grazing_events ge
      JOIN paddocks p ON p.id = ge.paddock_id
      LEFT JOIN horse_groups sg ON sg.id = ge.source_group_id
      WHERE ge.horse_id = $1
        AND ge.exited_at IS NULL
      LIMIT 1
      FOR UPDATE
      `,
      [horseId]
    );

    if (openEventResult.rows.length === 0) {
      throw buildServiceError(`${horseResult.rows[0].name} is not currently grazing in any paddock.`, 409);
    }

    const openEvent = openEventResult.rows[0];

    if (paddockId && Number(openEvent.paddock_id) !== Number(paddockId)) {
      throw buildServiceError(
        `${horseResult.rows[0].name} is currently in ${openEvent.paddock_name}, not the selected paddock.`,
        409
      );
    }

    if (toIsoDateString(exitedAt) < toIsoDateString(openEvent.entered_at)) {
      throw buildServiceError('Exit date cannot be before entry date.', 400);
    }

    const updateResult = await client.query(
      `
      UPDATE grazing_events
      SET exited_at = $1,
          exit_notes = $2,
          updated_at = NOW()
      WHERE id = $3
      RETURNING
        id,
        paddock_id,
        horse_id,
        entered_at,
        exited_at,
        entry_notes,
        exit_notes,
        source,
        source_group_id,
        telegram_user_id,
        created_at,
        updated_at
      `,
      [exitedAt, exitNotes || null, openEvent.id]
    );

    await client.query('COMMIT');

    return {
      horse: {
        id: Number(horseResult.rows[0].id),
        name: horseResult.rows[0].name,
      },
      paddock: {
        id: Number(openEvent.paddock_id),
        name: openEvent.paddock_name,
      },
      source_group: openEvent.source_group_id
        ? {
            id: Number(openEvent.source_group_id),
            name: openEvent.source_group_name,
          }
        : null,
      grazing_event: normalizeGrazingRow({
        ...updateResult.rows[0],
        paddock_name: openEvent.paddock_name,
        horse_name: horseResult.rows[0].name,
        source_group_name: openEvent.source_group_name,
        grazing_days:
          Math.max(
            1,
            Math.round(
              (new Date(`${toIsoDateString(exitedAt)}T00:00:00Z`) -
                new Date(`${toIsoDateString(openEvent.entered_at)}T00:00:00Z`)) /
                (24 * 60 * 60 * 1000)
            ) + 1
          ),
      }),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function moveHorseGroupIntoPaddock({
  groupId,
  paddockId,
  enteredAt,
  entryNotes,
  source = 'group_manual',
  telegramUserId = null,
}) {
  await ensurePaddockTables();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const groupResult = await client.query(
      `
      SELECT id, name, notes, active, created_at, updated_at
      FROM horse_groups
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
      `,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      throw buildServiceError('Group not found.', 404);
    }

    const groupRow = groupResult.rows[0];
    if (!groupRow.active) {
      throw buildServiceError(`Group is inactive: ${groupRow.name}`, 409);
    }

    const memberResult = await client.query(
      `
      SELECT h.id, h.name
      FROM horse_group_memberships hgm
      JOIN horses h ON h.id = hgm.horse_id
      WHERE hgm.group_id = $1
      ORDER BY h.name ASC
      `,
      [groupId]
    );

    if (memberResult.rows.length === 0) {
      throw buildServiceError(`Group has no horses assigned: ${groupRow.name}`, 409);
    }

    const memberIds = memberResult.rows.map((row) => Number(row.id));
    const memberNames = new Map(memberResult.rows.map((row) => [Number(row.id), row.name]));

    const paddockResult = await client.query(
      `
      SELECT id, name, zone, size_ha, notes, active, created_at, updated_at
      FROM paddocks
      WHERE id = $1
      LIMIT 1
      `,
      [paddockId]
    );

    if (paddockResult.rows.length === 0) {
      throw buildServiceError('Paddock not found.', 404);
    }

    if (!paddockResult.rows[0].active) {
      throw buildServiceError(`Paddock is inactive: ${paddockResult.rows[0].name}`, 409);
    }

    await assertPaddockReadyForEntry(client, paddockId, enteredAt);

    const openEventResult = await client.query(
      `
      SELECT
        ge.id,
        ge.horse_id,
        h.name AS horse_name,
        ge.paddock_id,
        p.name AS paddock_name,
        ge.entered_at
      FROM grazing_events ge
      JOIN horses h ON h.id = ge.horse_id
      JOIN paddocks p ON p.id = ge.paddock_id
      WHERE ge.horse_id = ANY($1::bigint[])
        AND ge.exited_at IS NULL
      ORDER BY h.name ASC
      FOR UPDATE OF ge
      `,
      [memberIds]
    );

    const targetPaddockName = paddockResult.rows[0].name;
    const openHorseIds = new Set(openEventResult.rows.map((row) => Number(row.horse_id)));
    const alreadyInTargetRows = openEventResult.rows.filter(
      (row) => Number(row.paddock_id) === Number(paddockId)
    );
    const transferRows = openEventResult.rows.filter(
      (row) => Number(row.paddock_id) !== Number(paddockId)
    );
    const missingHorseIds = memberIds.filter((horseId) => !openHorseIds.has(Number(horseId)));

    if (alreadyInTargetRows.length === memberResult.rows.length) {
      throw buildServiceError(
        `${groupRow.name} is already grazing in ${targetPaddockName}.`,
        409
      );
    }

    const invalidDateRows = transferRows.filter(
      (row) => toIsoDateString(enteredAt) < toIsoDateString(row.entered_at)
    );
    if (invalidDateRows.length > 0) {
      throw buildServiceError(
        `Move date cannot be before current paddock entry for: ${invalidDateRows
          .map((row) => `${row.horse_name} (${toIsoDateString(row.entered_at)})`)
          .join(', ')}`,
        400
      );
    }

    const transferHorseIds = transferRows.map((row) => Number(row.horse_id));
    const horseIdsToInsert = [...transferHorseIds, ...missingHorseIds];
    const transferExitNote = entryNotes || `Group moved to ${targetPaddockName}.`;

    if (transferHorseIds.length > 0) {
      const transferEventIds = transferRows.map((row) => Number(row.id));
      await client.query(
        `
        UPDATE grazing_events
        SET exited_at = $1,
            exit_notes = $2,
            updated_at = NOW()
        WHERE id = ANY($3::bigint[])
        `,
        [enteredAt, transferExitNote, transferEventIds]
      );
    }

    let insertRows = [];
    if (horseIdsToInsert.length > 0) {
      const insertResult = await client.query(
        `
        INSERT INTO grazing_events (
          paddock_id,
          horse_id,
          entered_at,
          entry_notes,
          source,
          source_group_id,
          telegram_user_id
        )
        SELECT
          $1,
          horse_id,
          $2,
          $3,
          $4,
          $5,
          $6
        FROM UNNEST($7::bigint[]) AS horse_id
        RETURNING
          id,
          paddock_id,
          horse_id,
          entered_at,
          exited_at,
          entry_notes,
          exit_notes,
          source,
          source_group_id,
          telegram_user_id,
          created_at,
          updated_at
        `,
        [
          paddockId,
          enteredAt,
          entryNotes || null,
          source || 'group_manual',
          groupId,
          telegramUserId,
          horseIdsToInsert,
        ]
      );
      insertRows = insertResult.rows;
    }

    const occupancyResult = await client.query(
      `
      SELECT COUNT(*)::int AS horse_count
      FROM grazing_events
      WHERE paddock_id = $1
        AND exited_at IS NULL
      `,
      [paddockId]
    );

    await client.query('COMMIT');

    return {
      group: normalizeHorseGroupRow({
        ...groupRow,
        member_count: memberResult.rows.length,
        member_ids: memberResult.rows.map((row) => row.id),
        member_names: memberResult.rows.map((row) => row.name),
        current_paddock_names: paddockResult.rows[0].name,
        grazing_member_count: memberResult.rows.length,
      }),
      paddock: normalizePaddockRow(paddockResult.rows[0]),
      horses: memberResult.rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
      })),
      grazing_events: insertRows
        .map((row) =>
          normalizeGrazingRow({
            ...row,
            paddock_name: paddockResult.rows[0].name,
            horse_name: memberNames.get(Number(row.horse_id)),
            source_group_name: groupRow.name,
            grazing_days: 1,
          })
        )
        .sort((left, right) => left.horse_name.localeCompare(right.horse_name)),
      moved_count: horseIdsToInsert.length,
      group_member_count: memberResult.rows.length,
      already_in_paddock_count: alreadyInTargetRows.length,
      transferred_count: transferHorseIds.length,
      entered_at: toIsoDateString(enteredAt),
      paddock_occupancy_count: Number(occupancyResult.rows[0]?.horse_count || 0),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function correctHorseGroupCurrentPaddock({
  groupId,
  paddockId,
  enteredAt,
  entryNotes,
  source = 'group_correction',
  telegramUserId = null,
}) {
  await ensurePaddockTables();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const groupResult = await client.query(
      `
      SELECT id, name, notes, active, created_at, updated_at
      FROM horse_groups
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
      `,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      throw buildServiceError('Group not found.', 404);
    }

    const groupRow = groupResult.rows[0];
    if (!groupRow.active) {
      throw buildServiceError(`Group is inactive: ${groupRow.name}`, 409);
    }

    const memberResult = await client.query(
      `
      SELECT h.id, h.name
      FROM horse_group_memberships hgm
      JOIN horses h ON h.id = hgm.horse_id
      WHERE hgm.group_id = $1
      ORDER BY h.name ASC
      `,
      [groupId]
    );

    if (memberResult.rows.length === 0) {
      throw buildServiceError(`Group has no horses assigned: ${groupRow.name}`, 409);
    }

    const memberIds = memberResult.rows.map((row) => Number(row.id));
    const targetEnteredAt = toIsoDateString(enteredAt);

    const paddockResult = await client.query(
      `
      SELECT id, name, zone, size_ha, notes, active, created_at, updated_at
      FROM paddocks
      WHERE id = $1
      LIMIT 1
      `,
      [paddockId]
    );

    if (paddockResult.rows.length === 0) {
      throw buildServiceError('Paddock not found.', 404);
    }

    if (!paddockResult.rows[0].active) {
      throw buildServiceError(`Paddock is inactive: ${paddockResult.rows[0].name}`, 409);
    }

    await assertPaddockReadyForEntry(client, paddockId, enteredAt);

    const previousClosedResult = await client.query(
      `
      SELECT
        ge.horse_id,
        h.name AS horse_name,
        MAX(ge.exited_at) AS latest_exited_at
      FROM grazing_events ge
      JOIN horses h ON h.id = ge.horse_id
      WHERE ge.horse_id = ANY($1::bigint[])
        AND ge.exited_at IS NOT NULL
      GROUP BY ge.horse_id, h.name
      `,
      [memberIds]
    );

    const invalidHistoryRows = previousClosedResult.rows.filter(
      (row) =>
        row.latest_exited_at && targetEnteredAt < toIsoDateString(row.latest_exited_at)
    );
    if (invalidHistoryRows.length > 0) {
      throw buildServiceError(
        `Correction date would overlap previous grazing history for: ${invalidHistoryRows
          .map((row) => `${row.horse_name} (last exit ${toIsoDateString(row.latest_exited_at)})`)
          .join(', ')}`,
        400
      );
    }

    const openEventResult = await client.query(
      `
      SELECT
        ge.id,
        ge.paddock_id,
        ge.horse_id,
        ge.entered_at,
        ge.entry_notes,
        ge.exit_notes,
        ge.source,
        ge.source_group_id,
        ge.telegram_user_id,
        ge.created_at,
        ge.updated_at,
        h.name AS horse_name,
        p.name AS paddock_name
      FROM grazing_events ge
      JOIN horses h ON h.id = ge.horse_id
      JOIN paddocks p ON p.id = ge.paddock_id
      WHERE ge.horse_id = ANY($1::bigint[])
        AND ge.exited_at IS NULL
      ORDER BY h.name ASC
      FOR UPDATE OF ge
      `,
      [memberIds]
    );

    const openEventsByHorseId = new Map(
      openEventResult.rows.map((row) => [Number(row.horse_id), row])
    );
    const correctionNotes = entryNotes || null;
    let updatedCount = 0;
    let insertedCount = 0;
    let unchangedCount = 0;

    for (const memberRow of memberResult.rows) {
      const horseId = Number(memberRow.id);
      const openEvent = openEventsByHorseId.get(horseId);

      if (openEvent) {
        const alreadyMatches =
          Number(openEvent.paddock_id) === Number(paddockId) &&
          toIsoDateString(openEvent.entered_at) === targetEnteredAt &&
          String(openEvent.entry_notes || '') === String(correctionNotes || '') &&
          String(openEvent.source || '') === String(source || 'group_correction') &&
          Number(openEvent.source_group_id || 0) === Number(groupId);

        if (alreadyMatches) {
          unchangedCount += 1;
          continue;
        }

        await client.query(
          `
          UPDATE grazing_events
          SET paddock_id = $1,
              entered_at = $2,
              entry_notes = $3,
              source = $4,
              source_group_id = $5,
              telegram_user_id = $6,
              updated_at = NOW()
          WHERE id = $7
          `,
          [
            paddockId,
            enteredAt,
            correctionNotes,
            source || 'group_correction',
            groupId,
            telegramUserId,
            openEvent.id,
          ]
        );
        updatedCount += 1;
        continue;
      }

      await client.query(
        `
        INSERT INTO grazing_events (
          paddock_id,
          horse_id,
          entered_at,
          entry_notes,
          source,
          source_group_id,
          telegram_user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          paddockId,
          horseId,
          enteredAt,
          correctionNotes,
          source || 'group_correction',
          groupId,
          telegramUserId,
        ]
      );
      insertedCount += 1;
    }

    const currentEventResult = await client.query(
      `
      SELECT
        ge.id,
        ge.paddock_id,
        ge.horse_id,
        ge.entered_at,
        ge.exited_at,
        ge.entry_notes,
        ge.exit_notes,
        ge.source,
        ge.source_group_id,
        ge.telegram_user_id,
        ge.created_at,
        ge.updated_at,
        h.name AS horse_name,
        p.name AS paddock_name,
        sg.name AS source_group_name,
        GREATEST(1, (CURRENT_DATE - ge.entered_at) + 1)::int AS grazing_days
      FROM grazing_events ge
      JOIN horses h ON h.id = ge.horse_id
      JOIN paddocks p ON p.id = ge.paddock_id
      LEFT JOIN horse_groups sg ON sg.id = ge.source_group_id
      WHERE ge.horse_id = ANY($1::bigint[])
        AND ge.exited_at IS NULL
      ORDER BY h.name ASC
      `,
      [memberIds]
    );

    const occupancyResult = await client.query(
      `
      SELECT COUNT(*)::int AS horse_count
      FROM grazing_events
      WHERE paddock_id = $1
        AND exited_at IS NULL
      `,
      [paddockId]
    );

    await client.query('COMMIT');

    return {
      group: normalizeHorseGroupRow({
        ...groupRow,
        member_count: memberResult.rows.length,
        member_ids: memberResult.rows.map((row) => row.id),
        member_names: memberResult.rows.map((row) => row.name),
        current_paddock_names: paddockResult.rows[0].name,
        grazing_member_count: memberResult.rows.length,
      }),
      paddock: normalizePaddockRow(paddockResult.rows[0]),
      horses: memberResult.rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
      })),
      grazing_events: currentEventResult.rows
        .map((row) => normalizeGrazingRow(row))
        .sort((left, right) => left.horse_name.localeCompare(right.horse_name)),
      corrected_count: updatedCount + insertedCount,
      updated_count: updatedCount,
      inserted_count: insertedCount,
      unchanged_count: unchangedCount,
      group_member_count: memberResult.rows.length,
      entered_at: targetEnteredAt,
      paddock_occupancy_count: Number(occupancyResult.rows[0]?.horse_count || 0),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function moveHorseGroupOutOfPaddock({
  groupId,
  paddockId = null,
  exitedAt,
  exitNotes,
}) {
  await ensurePaddockTables();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const groupResult = await client.query(
      `
      SELECT id, name, notes, active, created_at, updated_at
      FROM horse_groups
      WHERE id = $1
      LIMIT 1
      FOR UPDATE
      `,
      [groupId]
    );

    if (groupResult.rows.length === 0) {
      throw buildServiceError('Group not found.', 404);
    }

    const groupRow = groupResult.rows[0];

    const memberResult = await client.query(
      `
      SELECT h.id, h.name
      FROM horse_group_memberships hgm
      JOIN horses h ON h.id = hgm.horse_id
      WHERE hgm.group_id = $1
      ORDER BY h.name ASC
      `,
      [groupId]
    );

    if (memberResult.rows.length === 0) {
      throw buildServiceError(`Group has no horses assigned: ${groupRow.name}`, 409);
    }

    const memberIds = memberResult.rows.map((row) => Number(row.id));
    const memberNames = new Map(memberResult.rows.map((row) => [Number(row.id), row.name]));

    const openEventResult = await client.query(
      `
      SELECT
        ge.id,
        ge.paddock_id,
        ge.horse_id,
        ge.entered_at,
        ge.entry_notes,
        ge.source,
        ge.source_group_id,
        ge.telegram_user_id,
        ge.created_at,
        ge.updated_at,
        h.name AS horse_name,
        p.name AS paddock_name,
        sg.name AS source_group_name
      FROM grazing_events ge
      JOIN horses h ON h.id = ge.horse_id
      JOIN paddocks p ON p.id = ge.paddock_id
      LEFT JOIN horse_groups sg ON sg.id = ge.source_group_id
      WHERE ge.horse_id = ANY($1::bigint[])
        AND ge.exited_at IS NULL
      ORDER BY h.name ASC
      FOR UPDATE OF ge
      `,
      [memberIds]
    );

    if (openEventResult.rows.length === 0) {
      throw buildServiceError(`None of the horses in ${groupRow.name} are currently grazing.`, 409);
    }

    if (openEventResult.rows.length !== memberResult.rows.length) {
      const openHorseIds = new Set(openEventResult.rows.map((row) => Number(row.horse_id)));
      const missingNames = memberResult.rows
        .filter((row) => !openHorseIds.has(Number(row.id)))
        .map((row) => row.name);
      throw buildServiceError(
        `Group move blocked. These horses are not currently grazing: ${missingNames.join(', ')}`,
        409
      );
    }

    if (paddockId) {
      const wrongPaddockRows = openEventResult.rows.filter((row) => Number(row.paddock_id) !== Number(paddockId));
      if (wrongPaddockRows.length > 0) {
        throw buildServiceError(
          `Group move blocked. Some horses are in another paddock: ${buildGroupedHorseConflict(
            wrongPaddockRows
          )}`,
          409
        );
      }
    } else {
      const uniquePaddockIds = [...new Set(openEventResult.rows.map((row) => Number(row.paddock_id)))];
      if (uniquePaddockIds.length > 1) {
        throw buildServiceError(
          `Group move blocked. Horses are split across multiple paddocks: ${buildGroupedHorseConflict(
            openEventResult.rows
          )}`,
          409
        );
      }
    }

    const invalidDateRows = openEventResult.rows.filter(
      (row) => toIsoDateString(exitedAt) < toIsoDateString(row.entered_at)
    );
    if (invalidDateRows.length > 0) {
      throw buildServiceError(
        `Exit date cannot be before entry date for: ${invalidDateRows
          .map((row) => `${row.horse_name} (${toIsoDateString(row.entered_at)})`)
          .join(', ')}`,
        400
      );
    }

    const openEventIds = openEventResult.rows.map((row) => Number(row.id));
    const updateResult = await client.query(
      `
      UPDATE grazing_events
      SET exited_at = $1,
          exit_notes = $2,
          updated_at = NOW()
      WHERE id = ANY($3::bigint[])
      RETURNING
        id,
        paddock_id,
        horse_id,
        entered_at,
        exited_at,
        entry_notes,
        exit_notes,
        source,
        source_group_id,
        telegram_user_id,
        created_at,
        updated_at
      `,
      [exitedAt, exitNotes || null, openEventIds]
    );

    await client.query('COMMIT');

    const paddockInfo = openEventResult.rows[0];

    return {
      group: normalizeHorseGroupRow({
        ...groupRow,
        member_count: memberResult.rows.length,
        member_ids: memberResult.rows.map((row) => row.id),
        member_names: memberResult.rows.map((row) => row.name),
        current_paddock_names: null,
        grazing_member_count: 0,
      }),
      paddock: {
        id: Number(paddockInfo.paddock_id),
        name: paddockInfo.paddock_name,
      },
      horses: memberResult.rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
      })),
      grazing_events: updateResult.rows
        .map((row) => {
          const openRow = openEventResult.rows.find((candidate) => Number(candidate.id) === Number(row.id));
          return normalizeGrazingRow({
            ...row,
            paddock_name: paddockInfo.paddock_name,
            horse_name: memberNames.get(Number(row.horse_id)) || openRow?.horse_name,
            source_group_name: openRow?.source_group_name || null,
            grazing_days:
              Math.max(
                1,
                Math.round(
                  (new Date(`${toIsoDateString(exitedAt)}T00:00:00Z`) -
                    new Date(`${toIsoDateString(openRow?.entered_at || row.entered_at)}T00:00:00Z`)) /
                    (24 * 60 * 60 * 1000)
                ) + 1
              ),
          });
        })
        .sort((left, right) => left.horse_name.localeCompare(right.horse_name)),
      moved_count: memberResult.rows.length,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function listPaddockStatus(options = {}) {
  await ensurePaddockTables();

  const params = [];
  let whereClause = '';

  if (options.activeOnly) {
    params.push(true);
    whereClause = '\nWHERE p.active = $1';
  }

  const result = await pool.query(
    `
    SELECT
      p.id,
      p.name,
      p.zone,
      p.size_ha,
      p.notes,
      p.active,
      p.parent_paddock_id,
      parent.name AS parent_paddock_name,
      COALESCE(current_occupancy.horse_names, '') AS horse_names,
      COALESCE(current_occupancy.group_names, '') AS group_names,
      COALESCE(current_occupancy.horse_count, 0) AS horse_count,
      COALESCE(current_occupancy.ungrouped_horse_count, 0) AS ungrouped_horse_count,
      current_occupancy.occupied_since,
      CASE
        WHEN COALESCE(current_occupancy.horse_count, 0) > 0
          THEN GREATEST(1, (CURRENT_DATE - current_occupancy.occupied_since) + 1)::int
        ELSE NULL
      END AS grazing_days,
      latest_exit.last_exited_at,
      latest_exit.effective_rest_paddock_id,
      latest_exit.effective_rest_paddock_name,
      CASE
        WHEN COALESCE(current_occupancy.horse_count, 0) > 0 THEN NULL
        WHEN latest_exit.last_exited_at IS NULL THEN NULL
        ELSE GREATEST(0, CURRENT_DATE - latest_exit.last_exited_at)::int
      END AS rest_days,
      latest_work.event_type AS latest_work_type,
      latest_work.event_date AS latest_work_date,
      latest_work.ready_after_days,
      latest_work.ready_to_graze_on,
      latest_work.applies_to_descendants AS latest_work_applies_to_descendants,
      latest_work.effective_work_paddock_id,
      latest_work.effective_work_paddock_name,
      latest_work.notes AS latest_work_notes,
      CASE
        WHEN latest_work.ready_to_graze_on IS NULL THEN NULL
        WHEN latest_work.ready_to_graze_on < CURRENT_DATE THEN 0
        ELSE (latest_work.ready_to_graze_on - CURRENT_DATE)::int
      END AS days_until_ready
    FROM paddocks p
    LEFT JOIN paddocks parent ON parent.id = p.parent_paddock_id
    LEFT JOIN LATERAL (
      SELECT
        STRING_AGG(h.name, ', ' ORDER BY h.name) AS horse_names,
        STRING_AGG(DISTINCT hg.name, ', ' ORDER BY hg.name) AS group_names,
        COUNT(*)::int AS horse_count,
        COUNT(*) FILTER (WHERE hgm.group_id IS NULL)::int AS ungrouped_horse_count,
        MIN(ge.entered_at) AS occupied_since
      FROM grazing_events ge
      JOIN horses h ON h.id = ge.horse_id
      LEFT JOIN horse_group_memberships hgm ON hgm.horse_id = ge.horse_id
      LEFT JOIN horse_groups hg ON hg.id = hgm.group_id
      WHERE ge.paddock_id = p.id
        AND ge.exited_at IS NULL
    ) current_occupancy ON TRUE
    LEFT JOIN LATERAL (
      WITH RECURSIVE paddock_chain AS (
        SELECT current_paddock.id, current_paddock.name, current_paddock.parent_paddock_id, 0 AS depth
        FROM paddocks current_paddock
        WHERE current_paddock.id = p.id
        UNION ALL
        SELECT ancestor.id, ancestor.name, ancestor.parent_paddock_id, paddock_chain.depth + 1
        FROM paddocks ancestor
        JOIN paddock_chain ON paddock_chain.parent_paddock_id = ancestor.id
      )
      SELECT
        ge.exited_at AS last_exited_at,
        paddock_chain.id AS effective_rest_paddock_id,
        paddock_chain.name AS effective_rest_paddock_name
      FROM paddock_chain
      JOIN grazing_events ge ON ge.paddock_id = paddock_chain.id
      WHERE ge.exited_at IS NOT NULL
      ORDER BY ge.exited_at DESC, paddock_chain.depth ASC, ge.id DESC
      LIMIT 1
    ) latest_exit ON TRUE
    LEFT JOIN LATERAL (
      WITH RECURSIVE paddock_chain AS (
        SELECT current_paddock.id, current_paddock.name, current_paddock.parent_paddock_id, 0 AS depth
        FROM paddocks current_paddock
        WHERE current_paddock.id = p.id
        UNION ALL
        SELECT ancestor.id, ancestor.name, ancestor.parent_paddock_id, paddock_chain.depth + 1
        FROM paddocks ancestor
        JOIN paddock_chain ON paddock_chain.parent_paddock_id = ancestor.id
      )
      SELECT
        pwe.event_type,
        pwe.event_date,
        pwe.ready_after_days,
        pwe.ready_to_graze_on,
        pwe.applies_to_descendants,
        paddock_chain.id AS effective_work_paddock_id,
        paddock_chain.name AS effective_work_paddock_name,
        pwe.notes
      FROM paddock_chain
      JOIN paddock_work_events pwe ON pwe.paddock_id = paddock_chain.id
      WHERE pwe.ready_to_graze_on IS NOT NULL
        AND pwe.event_date <= CURRENT_DATE
        AND (paddock_chain.depth = 0 OR pwe.applies_to_descendants = TRUE)
      ORDER BY
        pwe.ready_to_graze_on DESC,
        pwe.event_date DESC,
        paddock_chain.depth ASC,
        pwe.id DESC
      LIMIT 1
    ) latest_work ON TRUE
    ${whereClause}
    ORDER BY p.active DESC, p.name ASC
    `,
    params
  );

  return result.rows.map(normalizePaddockStatusRow);
}

async function listPaddockOccupancy({ limit = null } = {}) {
  await ensurePaddockTables();

  const params = [];
  let limitClause = '';

  if (Number.isFinite(limit) && limit > 0) {
    params.push(limit);
    limitClause = `LIMIT $${params.length}`;
  }

  const result = await pool.query(
    `
    SELECT
      ge.paddock_id,
      p.name AS paddock_name,
      COUNT(*)::int AS active_horse_count,
      COALESCE(
        JSONB_AGG(
          JSONB_BUILD_OBJECT('id', h.id, 'name', h.name)
          ORDER BY h.name ASC
        ),
        '[]'::jsonb
      ) AS active_horses,
      MIN(ge.entered_at) AS entered_at,
      NULL::date AS exited_at,
      GREATEST(1, CURRENT_DATE - MIN(ge.entered_at))::int AS days_grazed,
      'Active'::text AS status
    FROM grazing_events ge
    JOIN paddocks p ON p.id = ge.paddock_id
    JOIN horses h ON h.id = ge.horse_id
    WHERE ge.exited_at IS NULL
    GROUP BY ge.paddock_id, p.name
    ORDER BY MIN(ge.entered_at) DESC, p.name ASC
    ${limitClause}
    `,
    params
  );

  return result.rows.map(normalizePaddockOccupancyRow);
}

async function listGrazingHistory({ paddockId = null, horseId = null, limit = 50 } = {}) {
  await ensurePaddockTables();

  const params = [];
  const whereParts = [];

  if (paddockId) {
    params.push(paddockId);
    whereParts.push(`ge.paddock_id = $${params.length}`);
  }

  if (horseId) {
    params.push(horseId);
    whereParts.push(`ge.horse_id = $${params.length}`);
  }

  params.push(limit);
  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

  const result = await pool.query(
    `
    SELECT
      ge.id,
      ge.paddock_id,
      p.name AS paddock_name,
      ge.horse_id,
      h.name AS horse_name,
      ge.entered_at,
      ge.exited_at,
      ge.entry_notes,
      ge.exit_notes,
      ge.source,
      ge.source_group_id,
      sg.name AS source_group_name,
      ge.telegram_user_id,
      ge.created_at,
      ge.updated_at,
      CASE
        WHEN ge.exited_at IS NULL
          THEN GREATEST(1, CURRENT_DATE - ge.entered_at)::int
        ELSE GREATEST(1, ge.exited_at - ge.entered_at)::int
      END AS grazing_days
    FROM grazing_events ge
    JOIN paddocks p ON p.id = ge.paddock_id
    JOIN horses h ON h.id = ge.horse_id
    LEFT JOIN horse_groups sg ON sg.id = ge.source_group_id
    ${whereClause}
    ORDER BY COALESCE(ge.exited_at, ge.entered_at) DESC, ge.id DESC
    LIMIT $${params.length}
    `,
    params
  );

  return result.rows.map(normalizeGrazingRow);
}

async function getHorseCurrentGrazing(horseId) {
  await ensurePaddockTables();

  const result = await pool.query(
    `
    SELECT
      ge.id,
      ge.paddock_id,
      p.name AS paddock_name,
      ge.horse_id,
      h.name AS horse_name,
      ge.entered_at,
      ge.exited_at,
      ge.entry_notes,
      ge.exit_notes,
      ge.source,
      ge.source_group_id,
      sg.name AS source_group_name,
      ge.telegram_user_id,
      ge.created_at,
      ge.updated_at,
      GREATEST(1, CURRENT_DATE - ge.entered_at)::int AS grazing_days
    FROM grazing_events ge
    JOIN paddocks p ON p.id = ge.paddock_id
    JOIN horses h ON h.id = ge.horse_id
    LEFT JOIN horse_groups sg ON sg.id = ge.source_group_id
    WHERE ge.horse_id = $1
      AND ge.exited_at IS NULL
    ORDER BY ge.entered_at DESC, ge.id DESC
    LIMIT 1
    `,
    [horseId]
  );

  return normalizeGrazingRow(result.rows[0] || null);
}

module.exports = {
  ensurePaddockTables,
  findPaddockByName,
  listPaddockNames,
  savePaddock,
  savePaddockWorkEvent,
  updatePaddockWorkEvent,
  findHorseGroupByName,
  listHorseGroups,
  listHorseGroupNames,
  listHorseGroupHistory,
  getHorseCurrentGroupMembership,
  saveHorseGroup,
  setHorseGroupMembers,
  moveHorseIntoPaddock,
  moveHorseOutOfPaddock,
  moveHorseGroupIntoPaddock,
  correctHorseGroupCurrentPaddock,
  moveHorseGroupOutOfPaddock,
  listPaddockStatus,
  listPaddockOccupancy,
  listPaddockWorkHistory,
  listGrazingHistory,
  getHorseCurrentGrazing,
  buildServiceError,
};
