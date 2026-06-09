const { pool } = require('./db');
const { toIsoDateString } = require('./date-helpers');
const { ensureTableColumns } = require('./schema');

let ensurePromise = null;
// Historical baseline for paddocks that existed before the app started tracking grazing/rest.
const DEFAULT_PADDOCK_REST_BASELINE_DATE = '2026-01-01';
const DEFAULT_LOCATION_TYPE = 'paddock';
const LOCATION_TYPES = new Set(['paddock', 'corral', 'manga', 'house', 'other']);

const PADDOCK_COLUMNS = [
  { name: 'location_type', definition: "TEXT DEFAULT 'paddock'" },
  { name: 'zone', definition: 'TEXT' },
  { name: 'size_ha', definition: 'NUMERIC(10,2)' },
  { name: 'notes', definition: 'TEXT' },
  { name: 'active', definition: 'BOOLEAN NOT NULL DEFAULT TRUE' },
  {
    name: 'parent_paddock_id',
    definition: 'BIGINT REFERENCES paddocks(id) ON DELETE SET NULL',
  },
  { name: 'manual_rest_started_on', definition: 'DATE' },
  { name: 'manual_rest_is_estimated', definition: 'BOOLEAN NOT NULL DEFAULT FALSE' },
  {
    name: 'manual_rest_applies_to_descendants',
    definition: 'BOOLEAN NOT NULL DEFAULT FALSE',
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
  {
    name: 'movement_batch_id',
    definition: 'BIGINT REFERENCES movement_batches(id) ON DELETE SET NULL',
  },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
  { name: 'updated_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

const MOVEMENT_BATCH_COLUMNS = [
  { name: 'movement_type', definition: 'TEXT' },
  { name: 'effective_date', definition: 'DATE' },
  {
    name: 'source_group_id',
    definition: 'BIGINT REFERENCES horse_groups(id) ON DELETE SET NULL',
  },
  {
    name: 'target_group_id',
    definition: 'BIGINT REFERENCES horse_groups(id) ON DELETE SET NULL',
  },
  {
    name: 'source_location_id',
    definition: 'BIGINT REFERENCES paddocks(id) ON DELETE SET NULL',
  },
  {
    name: 'target_location_id',
    definition: 'BIGINT REFERENCES paddocks(id) ON DELETE SET NULL',
  },
  { name: 'reason', definition: 'TEXT' },
  { name: 'notes', definition: 'TEXT' },
  { name: 'performed_by', definition: 'TEXT' },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

const HORSE_GROUP_MEMBERSHIP_PERIOD_COLUMNS = [
  {
    name: 'group_id',
    definition: 'BIGINT REFERENCES horse_groups(id) ON DELETE SET NULL',
  },
  { name: 'started_at', definition: 'DATE' },
  { name: 'ended_at', definition: 'DATE' },
  {
    name: 'movement_batch_id',
    definition: 'BIGINT REFERENCES movement_batches(id) ON DELETE SET NULL',
  },
  { name: 'source', definition: "TEXT DEFAULT 'manual'" },
  { name: 'notes', definition: 'TEXT' },
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
  {
    name: 'movement_batch_id',
    definition: 'BIGINT REFERENCES movement_batches(id) ON DELETE SET NULL',
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
  { name: 'performed_by', definition: 'TEXT' },
  { name: 'performed_by_kind', definition: 'TEXT' },
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

function calculateElapsedDaysFromTimestamp(value) {
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
  return Math.max(0, Math.floor((todayUtc - startUtc) / 86400000));
}

function currentDateString() {
  return new Date().toISOString().slice(0, 10);
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

function normalizeLocationType(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  return LOCATION_TYPES.has(normalized) ? normalized : DEFAULT_LOCATION_TYPE;
}

async function createMovementBatch(
  client,
  {
    movementType,
    effectiveDate = currentDateString(),
    sourceGroupId = null,
    targetGroupId = null,
    sourceLocationId = null,
    targetLocationId = null,
    reason = null,
    notes = null,
    performedBy = null,
  } = {}
) {
  const normalizedMovementType = String(movementType || '').trim();
  if (!normalizedMovementType) {
    throw buildServiceError('movementType is required to create a movement batch.', 400);
  }

  const batchResult = await client.query(
    `
    INSERT INTO movement_batches (
      movement_type,
      effective_date,
      source_group_id,
      target_group_id,
      source_location_id,
      target_location_id,
      reason,
      notes,
      performed_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
    `,
    [
      normalizedMovementType,
      toIsoDateString(effectiveDate) || currentDateString(),
      sourceGroupId == null ? null : Number(sourceGroupId),
      targetGroupId == null ? null : Number(targetGroupId),
      sourceLocationId == null ? null : Number(sourceLocationId),
      targetLocationId == null ? null : Number(targetLocationId),
      reason || null,
      notes || null,
      performedBy || null,
    ]
  );

  return batchResult.rows[0] || null;
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

function normalizePerformedByKind(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized === 'field_staff' || normalized === 'staff' || normalized === 'campo') {
    return 'field_staff';
  }

  if (normalized === 'external' || normalized === 'contractor' || normalized === 'externo') {
    return 'external';
  }

  if (normalized === 'unspecified' || normalized === 'sin especificar') {
    return 'unspecified';
  }

  return null;
}

function normalizePaddockRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    name: row.name,
    location_type: normalizeLocationType(row.location_type),
    zone: row.zone || null,
    size_ha: row.size_ha == null ? null : Number(row.size_ha),
    notes: row.notes || null,
    active: Boolean(row.active),
    parent_paddock_id: row.parent_paddock_id == null ? null : Number(row.parent_paddock_id),
    parent_paddock_name: row.parent_paddock_name || null,
    manual_rest_started_on: toIsoDateString(row.manual_rest_started_on),
    manual_rest_days:
      row.manual_rest_days == null
        ? calculateElapsedDaysFromTimestamp(row.manual_rest_started_on)
        : Number(row.manual_rest_days),
    manual_rest_is_estimated: Boolean(row.manual_rest_is_estimated),
    manual_rest_applies_to_descendants: Boolean(row.manual_rest_applies_to_descendants),
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

function normalizeHorseGroupCurrentLocation(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const locationId =
    value.location_id == null || value.location_id === ''
      ? null
      : Number.parseInt(value.location_id, 10);
  const horseIds = Array.isArray(value.horse_ids)
    ? value.horse_ids
        .map((horseId) => Number(horseId))
        .filter((horseId) => Number.isFinite(horseId) && horseId > 0)
    : [];
  const horseNames = Array.isArray(value.horse_names)
    ? value.horse_names.map((horseName) => String(horseName || '').trim()).filter(Boolean)
    : [];
  const horseCount = Math.max(
    0,
    Number(value.horse_count || 0),
    horseIds.length,
    horseNames.length
  );

  return {
    location_id: Number.isFinite(locationId) && locationId > 0 ? locationId : null,
    location_name: value.location_name ? String(value.location_name) : null,
    location_type: normalizeLocationType(value.location_type),
    horse_count: horseCount,
    horse_ids: horseIds,
    horse_names: horseNames,
    entered_at: toIsoDateString(value.entered_at),
  };
}

function normalizeHorseGroupCurrentLocations(row, currentPaddockIds, members) {
  const normalizedLocations = Array.isArray(row?.current_locations)
    ? row.current_locations.map(normalizeHorseGroupCurrentLocation).filter(Boolean)
    : [];

  if (normalizedLocations.length > 0) {
    return normalizedLocations;
  }

  const fallbackLocationName = String(row?.current_paddock_names || '').trim();
  const fallbackLocatedCount = Math.max(0, Number(row?.grazing_member_count || 0));

  if (!fallbackLocationName || fallbackLocatedCount <= 0) {
    return [];
  }

  const includesAllMembers = members.length > 0 && fallbackLocatedCount === members.length;

  return [
    {
      location_id: currentPaddockIds.length === 1 ? currentPaddockIds[0] : null,
      location_name: fallbackLocationName,
      location_type: DEFAULT_LOCATION_TYPE,
      horse_count: fallbackLocatedCount,
      horse_ids: includesAllMembers
        ? members
            .map((member) => Number(member.id))
            .filter((memberId) => Number.isFinite(memberId) && memberId > 0)
        : [],
      horse_names: includesAllMembers
        ? members.map((member) => member.name).filter(Boolean)
        : [],
      entered_at: toIsoDateString(row?.current_grazing_entered_at),
    },
  ];
}

function normalizeHorseGroupRow(row) {
  if (!row) {
    return null;
  }

  const members = normalizeHorseGroupMembers(row);
  const currentPaddockIds = Array.isArray(row.current_paddock_ids)
    ? row.current_paddock_ids
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)
    : [];
  const currentLocations = normalizeHorseGroupCurrentLocations(row, currentPaddockIds, members);
  const locatedMemberCount = Math.max(
    Number(row.grazing_member_count || 0),
    currentLocations.reduce((sum, location) => sum + Number(location.horse_count || 0), 0)
  );
  const locatedHorseIds = new Set(
    currentLocations.flatMap((location) =>
      Array.isArray(location.horse_ids)
        ? location.horse_ids.filter((horseId) => Number.isFinite(horseId) && horseId > 0)
        : []
    )
  );
  const memberCount = Number(row.member_count || 0);
  const unassignedMemberCount = Math.max(0, memberCount - locatedMemberCount);
  const unassignedMembers =
    locatedHorseIds.size > 0
      ? members.filter((member) => !locatedHorseIds.has(Number(member.id)))
      : locatedMemberCount <= 0
        ? members
        : [];
  let locationState = 'cohesive';

  if (memberCount <= 0) {
    locationState = 'empty';
  } else if (locatedMemberCount <= 0) {
    locationState = 'unassigned';
  } else if (unassignedMemberCount > 0) {
    locationState = 'partial';
  } else if (currentLocations.length > 1) {
    locationState = 'split';
  }

  return {
    id: Number(row.id),
    name: row.name,
    notes: row.notes || null,
    active: Boolean(row.active),
    member_count: memberCount,
    members,
    member_names: members.map((member) => member.name),
    current_started_at: toIsoDateString(row.current_started_at),
    current_paddock_names: row.current_paddock_names || null,
    current_paddock_ids: currentPaddockIds,
    current_locations: currentLocations,
    current_location_count: currentLocations.length,
    current_grazing_entered_at: toIsoDateString(row.current_grazing_entered_at),
    grazing_member_count: locatedMemberCount,
    located_member_count: locatedMemberCount,
    unassigned_member_count: unassignedMemberCount,
    unassigned_members: unassignedMembers,
    location_state: locationState,
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
    movement_batch_id: row.movement_batch_id == null ? null : Number(row.movement_batch_id),
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
    movement_batch_id: row.movement_batch_id == null ? null : Number(row.movement_batch_id),
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
    active_group_names: row.active_group_names || null,
    active_group_count: Number(row.active_group_count || 0),
    ungrouped_horse_count: Number(row.ungrouped_horse_count || 0),
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
  const effectiveRestStartedOn = toIsoDateString(row.effective_rest_started_on);
  const restSource = row.rest_source || null;
  let occupiedBy = occupiedHorseNames;

  if (occupiedGroupNames) {
    occupiedBy =
      ungroupedHorseCount > 0
        ? `${occupiedGroupNames}${occupiedGroupNames ? ` + ${ungroupedHorseCount} ungrouped` : ''}`
        : occupiedGroupNames;
  }

  let occupancyState = 'ready';

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
    manual_rest_started_on: toIsoDateString(row.manual_rest_started_on),
    manual_rest_days: row.manual_rest_days == null ? null : Number(row.manual_rest_days),
    manual_rest_is_estimated: Boolean(row.manual_rest_is_estimated),
    manual_rest_applies_to_descendants: Boolean(row.manual_rest_applies_to_descendants),
    horse_count: horseCount,
    occupied_by: occupiedBy,
    occupied_horses: occupiedHorseNames,
    occupied_groups: occupiedGroupNames,
    ungrouped_horse_count: ungroupedHorseCount,
    occupied_since: toIsoDateString(row.occupied_since),
    grazing_days: row.grazing_days == null ? null : Number(row.grazing_days),
    last_exited_at: toIsoDateString(row.last_exited_at),
    rest_days: row.rest_days == null ? null : Number(row.rest_days),
    rest_source: restSource,
    effective_rest_started_on: effectiveRestStartedOn,
    effective_rest_is_estimated: Boolean(row.effective_rest_is_estimated),
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
    performed_by: row.performed_by || null,
    performed_by_kind: normalizePerformedByKind(row.performed_by_kind),
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
        manual_rest_started_on DATE,
        manual_rest_is_estimated BOOLEAN NOT NULL DEFAULT FALSE,
        manual_rest_applies_to_descendants BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ensureTableColumns(pool, 'paddocks', PADDOCK_COLUMNS);

    await pool.query(`
      UPDATE paddocks
      SET location_type = '${DEFAULT_LOCATION_TYPE}'
      WHERE location_type IS NULL
         OR TRIM(location_type) = ''
    `);

    await pool.query(`
      ALTER TABLE paddocks
      ALTER COLUMN location_type SET DEFAULT '${DEFAULT_LOCATION_TYPE}'
    `);

    await pool.query(`
      ALTER TABLE paddocks
      ALTER COLUMN location_type SET NOT NULL
    `);

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
      CREATE TABLE IF NOT EXISTS movement_batches (
        id BIGSERIAL PRIMARY KEY,
        movement_type TEXT NOT NULL,
        effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
        source_group_id BIGINT REFERENCES horse_groups(id) ON DELETE SET NULL,
        target_group_id BIGINT REFERENCES horse_groups(id) ON DELETE SET NULL,
        source_location_id BIGINT REFERENCES paddocks(id) ON DELETE SET NULL,
        target_location_id BIGINT REFERENCES paddocks(id) ON DELETE SET NULL,
        reason TEXT,
        notes TEXT,
        performed_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ensureTableColumns(pool, 'movement_batches', MOVEMENT_BATCH_COLUMNS);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS movement_batches_effective_date_idx
      ON movement_batches (effective_date DESC, id DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS movement_batches_type_idx
      ON movement_batches (movement_type, effective_date DESC, id DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS movement_batches_group_idx
      ON movement_batches (source_group_id, target_group_id, effective_date DESC, id DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS movement_batches_location_idx
      ON movement_batches (source_location_id, target_location_id, effective_date DESC, id DESC)
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
      CREATE TABLE IF NOT EXISTS horse_group_membership_periods (
        id BIGSERIAL PRIMARY KEY,
        horse_id BIGINT NOT NULL REFERENCES horses(id) ON DELETE CASCADE,
        group_id BIGINT REFERENCES horse_groups(id) ON DELETE SET NULL,
        started_at DATE NOT NULL,
        ended_at DATE,
        movement_batch_id BIGINT REFERENCES movement_batches(id) ON DELETE SET NULL,
        source TEXT NOT NULL DEFAULT 'manual',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CHECK (ended_at IS NULL OR ended_at >= started_at)
      )
    `);

    await ensureTableColumns(
      pool,
      'horse_group_membership_periods',
      HORSE_GROUP_MEMBERSHIP_PERIOD_COLUMNS
    );

    await pool.query(`
      UPDATE horse_group_membership_periods
      SET source = 'manual'
      WHERE source IS NULL
         OR TRIM(source) = ''
    `);

    await pool.query(`
      ALTER TABLE horse_group_membership_periods
      ALTER COLUMN source SET DEFAULT 'manual'
    `);

    await pool.query(`
      ALTER TABLE horse_group_membership_periods
      ALTER COLUMN source SET NOT NULL
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS horse_group_membership_periods_horse_idx
      ON horse_group_membership_periods (horse_id, started_at DESC, id DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS horse_group_membership_periods_group_idx
      ON horse_group_membership_periods (group_id, started_at DESC, id DESC)
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS horse_group_membership_periods_open_horse_idx
      ON horse_group_membership_periods (horse_id)
      WHERE ended_at IS NULL
    `);

    await pool.query(`
      INSERT INTO horse_group_membership_periods (
        horse_id,
        group_id,
        started_at,
        ended_at,
        movement_batch_id,
        source,
        created_at,
        updated_at
      )
      SELECT
        hgh.horse_id,
        hgh.group_id,
        hgh.started_at,
        hgh.ended_at,
        hgh.movement_batch_id,
        'history_backfill',
        hgh.created_at,
        hgh.updated_at
      FROM horse_group_membership_history hgh
      WHERE NOT EXISTS (
        SELECT 1
        FROM horse_group_membership_periods hgmp
        WHERE hgmp.horse_id = hgh.horse_id
          AND hgmp.group_id IS NOT DISTINCT FROM hgh.group_id
          AND hgmp.started_at = hgh.started_at
          AND hgmp.ended_at IS NOT DISTINCT FROM hgh.ended_at
      )
    `);

    await pool.query(`
      INSERT INTO horse_group_membership_periods (
        horse_id,
        group_id,
        started_at,
        ended_at,
        source,
        created_at,
        updated_at
      )
      SELECT
        hgm.horse_id,
        hgm.group_id,
        COALESCE(hgh.started_at, hgm.created_at::date, CURRENT_DATE),
        NULL,
        'membership_backfill',
        hgm.created_at,
        hgm.updated_at
      FROM horse_group_memberships hgm
      LEFT JOIN horse_group_membership_history hgh
        ON hgh.horse_id = hgm.horse_id
       AND hgh.ended_at IS NULL
      LEFT JOIN horse_group_membership_periods hgmp
        ON hgmp.horse_id = hgm.horse_id
       AND hgmp.ended_at IS NULL
      WHERE hgmp.id IS NULL
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
        performed_by TEXT,
        performed_by_kind TEXT,
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

async function savePaddock({
  paddockId = null,
  name,
  zone,
  sizeHa,
  notes,
  active = true,
  parentPaddockId = null,
  manualRestDays = null,
  manualRestAppliesToDescendants = false,
}) {
  await ensurePaddockTables();

  const paddockName = String(name || '').trim();
  if (!paddockName) {
    throw buildServiceError('Paddock name is required.', 400);
  }

  const normalizedPaddockId =
    paddockId == null || paddockId === ''
      ? null
      : Number.parseInt(paddockId, 10);
  if (paddockId != null && paddockId !== '' && (!Number.isFinite(normalizedPaddockId) || normalizedPaddockId <= 0)) {
    throw buildServiceError('Paddock id is invalid.', 400);
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

  const normalizedManualRestDays =
    manualRestDays == null || manualRestDays === ''
      ? null
      : Number.parseInt(manualRestDays, 10);
  if (
    manualRestDays != null &&
    manualRestDays !== '' &&
    (!Number.isFinite(normalizedManualRestDays) || normalizedManualRestDays < 0)
  ) {
    throw buildServiceError('Manual rest days must be a whole number >= 0.', 400);
  }

  const manualRestStartedOn =
    normalizedManualRestDays == null
      ? null
      : addDaysToDateString(currentDateString(), -normalizedManualRestDays);
  const manualRestIsEstimated = normalizedManualRestDays != null;
  const manualRestScopeAppliesToDescendants =
    manualRestIsEstimated && Boolean(manualRestAppliesToDescendants);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

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
    let mode = normalizedPaddockId ? 'updated' : 'created';

    if (normalizedPaddockId != null) {
      const targetPaddockResult = await client.query(
        `
        SELECT id, name
        FROM paddocks
        WHERE id = $1
        LIMIT 1
        FOR UPDATE
        `,
        [normalizedPaddockId]
      );

      if (targetPaddockResult.rows.length === 0) {
        throw buildServiceError('Paddock not found.', 404);
      }

      const nameConflictResult = await client.query(
        `
        SELECT id, name
        FROM paddocks
        WHERE LOWER(name) = LOWER($1)
          AND id <> $2
        LIMIT 1
        `,
        [paddockName, normalizedPaddockId]
      );

      if (nameConflictResult.rows.length > 0) {
        throw buildServiceError(
          `Another paddock already uses that name: ${nameConflictResult.rows[0].name}`,
          409
        );
      }

      await assertNoPaddockParentCycle(
        client,
        normalizedPaddockId,
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
            manual_rest_started_on = $7,
            manual_rest_is_estimated = $8,
            manual_rest_applies_to_descendants = $9,
            updated_at = NOW()
        WHERE id = $10
        RETURNING
          id,
          name,
          zone,
          size_ha,
          notes,
          active,
          parent_paddock_id,
          manual_rest_started_on,
          manual_rest_is_estimated,
          manual_rest_applies_to_descendants,
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
          manualRestStartedOn,
          manualRestIsEstimated,
          manualRestScopeAppliesToDescendants,
          normalizedPaddockId,
        ]
      );
    } else {
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
              manual_rest_started_on = $7,
              manual_rest_is_estimated = $8,
              manual_rest_applies_to_descendants = $9,
              updated_at = NOW()
          WHERE id = $10
          RETURNING
            id,
            name,
            zone,
            size_ha,
            notes,
            active,
            parent_paddock_id,
            manual_rest_started_on,
            manual_rest_is_estimated,
            manual_rest_applies_to_descendants,
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
            manualRestStartedOn,
            manualRestIsEstimated,
            manualRestScopeAppliesToDescendants,
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
            parent_paddock_id,
            manual_rest_started_on,
            manual_rest_is_estimated,
            manual_rest_applies_to_descendants
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING
            id,
            name,
            zone,
            size_ha,
            notes,
            active,
            parent_paddock_id,
            manual_rest_started_on,
            manual_rest_is_estimated,
            manual_rest_applies_to_descendants,
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
            manualRestStartedOn,
            manualRestIsEstimated,
            manualRestScopeAppliesToDescendants,
          ]
        );
      }
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
  performedBy = null,
  performedByKind = null,
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

  const normalizedPerformedBy = String(performedBy || '').trim() || null;
  const normalizedPerformedByKind = normalizePerformedByKind(performedByKind);

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
        performed_by,
        performed_by_kind,
        notes,
        telegram_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING
        id,
        paddock_id,
        event_type,
        event_date,
        ready_after_days,
        ready_to_graze_on,
        applies_to_descendants,
        performed_by,
        performed_by_kind,
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
        normalizedPerformedBy,
        normalizedPerformedByKind,
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
  performedBy = null,
  performedByKind = null,
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

  const normalizedPerformedBy = String(performedBy || '').trim() || null;
  const normalizedPerformedByKind = normalizePerformedByKind(performedByKind);

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
          performed_by = $7,
          performed_by_kind = $8,
          notes = $9,
          telegram_user_id = COALESCE($10, telegram_user_id),
          updated_at = NOW()
      WHERE id = $11
      RETURNING
        id,
        paddock_id,
        event_type,
        event_date,
        ready_after_days,
        ready_to_graze_on,
        applies_to_descendants,
        performed_by,
        performed_by_kind,
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
        normalizedPerformedBy,
        normalizedPerformedByKind,
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
      pwe.performed_by,
      pwe.performed_by_kind,
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
      current_membership.current_started_at,
      current_grazing.current_paddock_names,
      COALESCE(current_grazing.current_paddock_ids, ARRAY[]::bigint[]) AS current_paddock_ids,
      COALESCE(current_grazing.current_location_count, 0) AS current_location_count,
      COALESCE(current_grazing.current_locations, '[]'::jsonb) AS current_locations,
      current_grazing.current_grazing_entered_at,
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
        MIN(hgmp.started_at) AS current_started_at
      FROM horse_group_membership_periods hgmp
      WHERE hgmp.group_id = g.id
        AND hgmp.ended_at IS NULL
    ) current_membership ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        STRING_AGG(location_rows.paddock_name, ', ' ORDER BY location_rows.paddock_name) AS current_paddock_names,
        ARRAY_AGG(location_rows.paddock_id ORDER BY location_rows.paddock_id) AS current_paddock_ids,
        CASE
          WHEN COUNT(DISTINCT location_rows.entered_at) = 1 THEN MIN(location_rows.entered_at)
          ELSE NULL
        END AS current_grazing_entered_at,
        COALESCE(SUM(location_rows.horse_count), 0)::int AS grazing_member_count,
        COUNT(*)::int AS current_location_count,
        COALESCE(
          JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'location_id',
              location_rows.paddock_id,
              'location_name',
              location_rows.paddock_name,
              'location_type',
              location_rows.location_type,
              'horse_count',
              location_rows.horse_count,
              'horse_ids',
              location_rows.horse_ids,
              'horse_names',
              location_rows.horse_names,
              'entered_at',
              location_rows.entered_at
            )
            ORDER BY location_rows.paddock_name ASC, location_rows.paddock_id ASC
          ),
          '[]'::jsonb
        ) AS current_locations
      FROM (
        SELECT
          p.id AS paddock_id,
          p.name AS paddock_name,
          p.location_type,
          MIN(ge.entered_at) AS entered_at,
          COUNT(DISTINCT ge.horse_id)::int AS horse_count,
          ARRAY_AGG(DISTINCT h.id ORDER BY h.id) AS horse_ids,
          ARRAY_AGG(DISTINCT h.name ORDER BY h.name) AS horse_names
        FROM horse_group_memberships hgm
        JOIN grazing_events ge
          ON ge.horse_id = hgm.horse_id
         AND ge.exited_at IS NULL
        JOIN paddocks p ON p.id = ge.paddock_id
        JOIN horses h ON h.id = ge.horse_id
        WHERE hgm.group_id = g.id
        GROUP BY p.id, p.name, p.location_type
      ) location_rows
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
      current_membership.current_started_at,
      current_grazing.current_paddock_names,
      COALESCE(current_grazing.current_paddock_ids, ARRAY[]::bigint[]) AS current_paddock_ids,
      COALESCE(current_grazing.current_location_count, 0) AS current_location_count,
      COALESCE(current_grazing.current_locations, '[]'::jsonb) AS current_locations,
      current_grazing.current_grazing_entered_at,
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
        MIN(hgmp.started_at) AS current_started_at
      FROM horse_group_membership_periods hgmp
      WHERE hgmp.group_id = g.id
        AND hgmp.ended_at IS NULL
    ) current_membership ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        STRING_AGG(location_rows.paddock_name, ', ' ORDER BY location_rows.paddock_name) AS current_paddock_names,
        ARRAY_AGG(location_rows.paddock_id ORDER BY location_rows.paddock_id) AS current_paddock_ids,
        CASE
          WHEN COUNT(DISTINCT location_rows.entered_at) = 1 THEN MIN(location_rows.entered_at)
          ELSE NULL
        END AS current_grazing_entered_at,
        COALESCE(SUM(location_rows.horse_count), 0)::int AS grazing_member_count,
        COUNT(*)::int AS current_location_count,
        COALESCE(
          JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'location_id',
              location_rows.paddock_id,
              'location_name',
              location_rows.paddock_name,
              'location_type',
              location_rows.location_type,
              'horse_count',
              location_rows.horse_count,
              'horse_ids',
              location_rows.horse_ids,
              'horse_names',
              location_rows.horse_names,
              'entered_at',
              location_rows.entered_at
            )
            ORDER BY location_rows.paddock_name ASC, location_rows.paddock_id ASC
          ),
          '[]'::jsonb
        ) AS current_locations
      FROM (
        SELECT
          p.id AS paddock_id,
          p.name AS paddock_name,
          p.location_type,
          MIN(ge.entered_at) AS entered_at,
          COUNT(DISTINCT ge.horse_id)::int AS horse_count,
          ARRAY_AGG(DISTINCT h.id ORDER BY h.id) AS horse_ids,
          ARRAY_AGG(DISTINCT h.name ORDER BY h.name) AS horse_names
        FROM horse_group_memberships hgm
        JOIN grazing_events ge
          ON ge.horse_id = hgm.horse_id
         AND ge.exited_at IS NULL
        JOIN paddocks p ON p.id = ge.paddock_id
        JOIN horses h ON h.id = ge.horse_id
        WHERE hgm.group_id = g.id
        GROUP BY p.id, p.name, p.location_type
      ) location_rows
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
      current_membership.current_started_at,
      current_grazing.current_paddock_names,
      COALESCE(current_grazing.current_paddock_ids, ARRAY[]::bigint[]) AS current_paddock_ids,
      COALESCE(current_grazing.current_location_count, 0) AS current_location_count,
      COALESCE(current_grazing.current_locations, '[]'::jsonb) AS current_locations,
      current_grazing.current_grazing_entered_at,
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
        MIN(hgmp.started_at) AS current_started_at
      FROM horse_group_membership_periods hgmp
      WHERE hgmp.group_id = g.id
        AND hgmp.ended_at IS NULL
    ) current_membership ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        STRING_AGG(location_rows.paddock_name, ', ' ORDER BY location_rows.paddock_name) AS current_paddock_names,
        ARRAY_AGG(location_rows.paddock_id ORDER BY location_rows.paddock_id) AS current_paddock_ids,
        CASE
          WHEN COUNT(DISTINCT location_rows.entered_at) = 1 THEN MIN(location_rows.entered_at)
          ELSE NULL
        END AS current_grazing_entered_at,
        COALESCE(SUM(location_rows.horse_count), 0)::int AS grazing_member_count,
        COUNT(*)::int AS current_location_count,
        COALESCE(
          JSONB_AGG(
            JSONB_BUILD_OBJECT(
              'location_id',
              location_rows.paddock_id,
              'location_name',
              location_rows.paddock_name,
              'location_type',
              location_rows.location_type,
              'horse_count',
              location_rows.horse_count,
              'horse_ids',
              location_rows.horse_ids,
              'horse_names',
              location_rows.horse_names,
              'entered_at',
              location_rows.entered_at
            )
            ORDER BY location_rows.paddock_name ASC, location_rows.paddock_id ASC
          ),
          '[]'::jsonb
        ) AS current_locations
      FROM (
        SELECT
          p.id AS paddock_id,
          p.name AS paddock_name,
          p.location_type,
          MIN(ge.entered_at) AS entered_at,
          COUNT(DISTINCT ge.horse_id)::int AS horse_count,
          ARRAY_AGG(DISTINCT h.id ORDER BY h.id) AS horse_ids,
          ARRAY_AGG(DISTINCT h.name ORDER BY h.name) AS horse_names
        FROM horse_group_memberships hgm
        JOIN grazing_events ge
          ON ge.horse_id = hgm.horse_id
         AND ge.exited_at IS NULL
        JOIN paddocks p ON p.id = ge.paddock_id
        JOIN horses h ON h.id = ge.horse_id
        WHERE hgm.group_id = g.id
        GROUP BY p.id, p.name, p.location_type
      ) location_rows
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
    const hasMembershipChanges =
      horseIdsEndingCurrentGroup.length > 0 || horseIdsJoiningTargetGroup.length > 0;
    let movementBatchId = null;

    if (hasMembershipChanges) {
      const movementBatch = await createMovementBatch(client, {
        movementType: 'group_membership_update',
        effectiveDate: currentDateString(),
        targetGroupId: groupId,
        reason: 'Admin group membership update',
        notes: `Updated members for ${groupResult.rows[0].name}.`,
      });
      movementBatchId = Number(movementBatch?.id || 0) || null;
    }

    let closedHistoryRows = [];
    if (horseIdsEndingCurrentGroup.length > 0) {
      const closedHistoryResult = await client.query(
        `
        UPDATE horse_group_membership_history
        SET ended_at = CURRENT_DATE,
            movement_batch_id = $2,
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
          movement_batch_id,
          GREATEST(1, ((CURRENT_DATE - started_at) + 1))::int AS group_days,
          created_at,
          updated_at
        `,
        [horseIdsEndingCurrentGroup, movementBatchId]
      );

      closedHistoryRows = closedHistoryResult.rows;

      await client.query(
        `
        UPDATE horse_group_membership_periods
        SET ended_at = CURRENT_DATE,
            movement_batch_id = $2,
            updated_at = NOW()
        WHERE horse_id = ANY($1::bigint[])
          AND ended_at IS NULL
        `,
        [horseIdsEndingCurrentGroup, movementBatchId]
      );
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
          started_at,
          movement_batch_id
        )
        SELECT
          horse_id,
          $1,
          $2,
          CURRENT_DATE,
          $3
        FROM UNNEST($4::bigint[]) AS horse_id
        `,
        [groupId, groupResult.rows[0].name, movementBatchId, horseIdsJoiningTargetGroup]
      );

      await client.query(
        `
        INSERT INTO horse_group_membership_periods (
          horse_id,
          group_id,
          started_at,
          movement_batch_id,
          source,
          notes
        )
        SELECT
          horse_id,
          $1,
          CURRENT_DATE,
          $2,
          'admin_group_membership',
          $3
        FROM UNNEST($4::bigint[]) AS horse_id
        `,
        [
          groupId,
          movementBatchId,
          `Updated members for ${groupResult.rows[0].name}.`,
          horseIdsJoiningTargetGroup,
        ]
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

    const movementBatch = await createMovementBatch(client, {
      movementType: 'horse_move_in',
      effectiveDate: enteredAt,
      sourceGroupId: sourceGroupId || null,
      targetGroupId: sourceGroupId || null,
      targetLocationId: paddockId,
      reason: 'Horse moved into location',
      notes: entryNotes || null,
      performedBy: telegramUserId || null,
    });
    const movementBatchId = Number(movementBatch?.id || 0) || null;

    const insertResult = await client.query(
      `
      INSERT INTO grazing_events (
        paddock_id,
        horse_id,
        entered_at,
        entry_notes,
        source,
        source_group_id,
        movement_batch_id,
        telegram_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
        movement_batch_id,
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
        movementBatchId,
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

    const movementBatch = await createMovementBatch(client, {
      movementType: 'horse_move_out',
      effectiveDate: exitedAt,
      sourceGroupId: openEvent.source_group_id == null ? null : Number(openEvent.source_group_id),
      targetGroupId: openEvent.source_group_id == null ? null : Number(openEvent.source_group_id),
      sourceLocationId: Number(openEvent.paddock_id),
      reason: 'Horse moved out of location',
      notes: exitNotes || null,
    });
    const movementBatchId = Number(movementBatch?.id || 0) || null;

    const updateResult = await client.query(
      `
      UPDATE grazing_events
      SET exited_at = $1,
          exit_notes = $2,
          movement_batch_id = $4,
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
        movement_batch_id,
        telegram_user_id,
        created_at,
        updated_at
      `,
      [exitedAt, exitNotes || null, openEvent.id, movementBatchId]
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
  let committed = false;

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
    const targetEnteredAt = toIsoDateString(enteredAt);
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
      (row) => targetEnteredAt < toIsoDateString(row.entered_at)
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
    const sourceLocationIds = [...new Set(transferRows.map((row) => Number(row.paddock_id)))].filter(
      (value) => Number.isFinite(value) && value > 0
    );
    const movementBatch = await createMovementBatch(client, {
      movementType: 'group_move_in',
      effectiveDate: enteredAt,
      sourceGroupId: groupId,
      targetGroupId: groupId,
      sourceLocationId: sourceLocationIds.length === 1 ? sourceLocationIds[0] : null,
      targetLocationId: paddockId,
      reason: 'Group moved into location',
      notes: entryNotes || null,
      performedBy: telegramUserId || null,
    });
    const movementBatchId = Number(movementBatch?.id || 0) || null;

    if (transferHorseIds.length > 0) {
      const transferEventIds = transferRows.map((row) => Number(row.id));
      await client.query(
        `
        UPDATE grazing_events
        SET exited_at = $1,
            exit_notes = $2,
            movement_batch_id = $4,
            updated_at = NOW()
        WHERE id = ANY($3::bigint[])
        `,
        [enteredAt, transferExitNote, transferEventIds, movementBatchId]
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
          movement_batch_id,
          telegram_user_id
        )
        SELECT
          $1,
          horse_id,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        FROM UNNEST($8::bigint[]) AS horse_id
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
          movement_batch_id,
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
          movementBatchId,
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

    const responsePayload = {
      group: normalizeHorseGroupRow({
        ...groupRow,
        member_count: memberResult.rows.length,
        member_ids: memberResult.rows.map((row) => row.id),
        member_names: memberResult.rows.map((row) => row.name),
        current_paddock_names: paddockResult.rows[0].name,
        current_paddock_ids: [paddockResult.rows[0].id],
        current_grazing_entered_at: targetEnteredAt,
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
      entered_at: targetEnteredAt,
      paddock_occupancy_count: Number(occupancyResult.rows[0]?.horse_count || 0),
    };

    await client.query('COMMIT');
    committed = true;

    return responsePayload;
  } catch (error) {
    if (!committed) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('PADDOCK GROUP MOVE ROLLBACK ERROR:', rollbackError);
      }
    }
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
  let committed = false;

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
    const latestClosedEventResult = await client.query(
      `
      SELECT
        horse_rows.horse_id,
        h.name AS horse_name,
        ge.id,
        ge.paddock_id,
        ge.entered_at,
        ge.exited_at,
        ge.source,
        ge.source_group_id
      FROM UNNEST($1::bigint[]) AS horse_rows(horse_id)
      JOIN horses h ON h.id = horse_rows.horse_id
      LEFT JOIN LATERAL (
        SELECT
          id,
          paddock_id,
          horse_id,
          entered_at,
          exited_at,
          source,
          source_group_id
        FROM grazing_events
        WHERE horse_id = horse_rows.horse_id
          AND exited_at IS NOT NULL
        ORDER BY exited_at DESC, id DESC
        LIMIT 1
        FOR UPDATE
      ) ge ON TRUE
      `,
      [memberIds]
    );
    const latestClosedEventByHorseId = new Map(
      latestClosedEventResult.rows
        .filter((row) => row.id != null)
        .map((row) => [Number(row.horse_id), row])
    );
    const invalidHistoryRows = latestClosedEventResult.rows.filter((row) => {
      if (!row.exited_at) {
        return false;
      }

      const latestExitedAt = toIsoDateString(row.exited_at);
      if (!latestExitedAt || targetEnteredAt >= latestExitedAt) {
        return false;
      }

      const openEvent = openEventsByHorseId.get(Number(row.horse_id));
      const openEnteredAt = openEvent ? toIsoDateString(openEvent.entered_at) : null;
      const canShiftLatestExit = openEnteredAt && latestExitedAt === openEnteredAt;
      return !canShiftLatestExit;
    });
    if (invalidHistoryRows.length > 0) {
      throw buildServiceError(
        `Correction date would overlap previous grazing history for: ${invalidHistoryRows
          .map((row) => `${row.horse_name} (last exit ${toIsoDateString(row.exited_at)})`)
          .join(', ')}`,
        400
      );
    }
    const sourceLocationIds = [
      ...new Set(openEventResult.rows.map((row) => Number(row.paddock_id)).filter((value) => Number.isFinite(value) && value > 0)),
    ];
    const movementBatch = await createMovementBatch(client, {
      movementType: 'group_correct_current',
      effectiveDate: enteredAt,
      sourceGroupId: groupId,
      targetGroupId: groupId,
      sourceLocationId: sourceLocationIds.length === 1 ? sourceLocationIds[0] : null,
      targetLocationId: paddockId,
      reason: 'Corrected current group location',
      notes: entryNotes || null,
      performedBy: telegramUserId || null,
    });
    const movementBatchId = Number(movementBatch?.id || 0) || null;
    const correctionNotes = entryNotes || null;
    let updatedCount = 0;
    let insertedCount = 0;
    let unchangedCount = 0;

    for (const memberRow of memberResult.rows) {
      const horseId = Number(memberRow.id);
      const openEvent = openEventsByHorseId.get(horseId);
      const latestClosedEvent = latestClosedEventByHorseId.get(horseId);
      const openEnteredAt = openEvent ? toIsoDateString(openEvent.entered_at) : null;
      const latestExitedAt = latestClosedEvent ? toIsoDateString(latestClosedEvent.exited_at) : null;
      const shouldShiftLatestExit =
        latestClosedEvent &&
        openEnteredAt &&
        latestExitedAt &&
        latestExitedAt === openEnteredAt &&
        targetEnteredAt !== openEnteredAt;

      if (shouldShiftLatestExit) {
        const latestEnteredAt = toIsoDateString(latestClosedEvent.entered_at);
        if (latestEnteredAt && targetEnteredAt < latestEnteredAt) {
          throw buildServiceError(
            `Correction date would make the previous paddock exit earlier than its entry for ${memberRow.name}.`,
            400
          );
        }

        await client.query(
          `
          UPDATE grazing_events
          SET exited_at = $1,
              movement_batch_id = $3,
              updated_at = NOW()
          WHERE id = $2
          `,
          [targetEnteredAt, latestClosedEvent.id, movementBatchId]
        );
      }

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
              movement_batch_id = $8,
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
            movementBatchId,
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
          movement_batch_id,
          telegram_user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          paddockId,
          horseId,
          enteredAt,
          correctionNotes,
          source || 'group_correction',
          groupId,
          movementBatchId,
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

    const responsePayload = {
      group: normalizeHorseGroupRow({
        ...groupRow,
        member_count: memberResult.rows.length,
        member_ids: memberResult.rows.map((row) => row.id),
        member_names: memberResult.rows.map((row) => row.name),
        current_paddock_names: paddockResult.rows[0].name,
        current_paddock_ids: [paddockResult.rows[0].id],
        current_grazing_entered_at: targetEnteredAt,
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

    await client.query('COMMIT');
    committed = true;

    return responsePayload;
  } catch (error) {
    if (!committed) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('PADDOCK GROUP CORRECTION ROLLBACK ERROR:', rollbackError);
      }
    }
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

    const sourceLocationId = Number(openEventResult.rows[0]?.paddock_id || paddockId || 0) || null;
    const movementBatch = await createMovementBatch(client, {
      movementType: 'group_move_out',
      effectiveDate: exitedAt,
      sourceGroupId: groupId,
      targetGroupId: groupId,
      sourceLocationId,
      reason: 'Group moved out of location',
      notes: exitNotes || null,
    });
    const movementBatchId = Number(movementBatch?.id || 0) || null;
    const openEventIds = openEventResult.rows.map((row) => Number(row.id));
    const updateResult = await client.query(
      `
      UPDATE grazing_events
      SET exited_at = $1,
          exit_notes = $2,
          movement_batch_id = $4,
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
        movement_batch_id,
        telegram_user_id,
        created_at,
        updated_at
      `,
      [exitedAt, exitNotes || null, openEventIds, movementBatchId]
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
        current_paddock_ids: [],
        current_grazing_entered_at: null,
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
      p.manual_rest_started_on,
      p.manual_rest_is_estimated,
      p.manual_rest_applies_to_descendants,
      CASE
        WHEN p.manual_rest_started_on IS NULL THEN NULL
        ELSE GREATEST(0, CURRENT_DATE - p.manual_rest_started_on)::int
      END AS manual_rest_days,
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
      CASE
        WHEN COALESCE(current_occupancy.horse_count, 0) > 0 THEN NULL
        WHEN manual_rest.manual_rest_started_on IS NOT NULL
          THEN manual_rest.effective_rest_paddock_id
        WHEN latest_exit.last_exited_at IS NOT NULL THEN latest_exit.effective_rest_paddock_id
        WHEN p.active = TRUE THEN p.id
        ELSE NULL
      END AS effective_rest_paddock_id,
      CASE
        WHEN COALESCE(current_occupancy.horse_count, 0) > 0 THEN NULL
        WHEN manual_rest.manual_rest_started_on IS NOT NULL
          THEN manual_rest.effective_rest_paddock_name
        WHEN latest_exit.last_exited_at IS NOT NULL THEN latest_exit.effective_rest_paddock_name
        WHEN p.active = TRUE THEN p.name
        ELSE NULL
      END AS effective_rest_paddock_name,
      CASE
        WHEN COALESCE(current_occupancy.horse_count, 0) > 0 THEN NULL
        WHEN manual_rest.manual_rest_started_on IS NOT NULL THEN manual_rest.manual_rest_started_on
        WHEN latest_exit.last_exited_at IS NOT NULL THEN latest_exit.last_exited_at
        WHEN p.active = TRUE THEN '${DEFAULT_PADDOCK_REST_BASELINE_DATE}'::date
        ELSE NULL
      END AS effective_rest_started_on,
      CASE
        WHEN COALESCE(current_occupancy.horse_count, 0) > 0 THEN FALSE
        WHEN manual_rest.manual_rest_started_on IS NOT NULL THEN manual_rest.manual_rest_is_estimated
        WHEN latest_exit.last_exited_at IS NOT NULL THEN FALSE
        WHEN p.active = TRUE THEN TRUE
        ELSE FALSE
      END AS effective_rest_is_estimated,
      CASE
        WHEN COALESCE(current_occupancy.horse_count, 0) > 0 THEN NULL
        WHEN manual_rest.manual_rest_started_on IS NOT NULL THEN 'manual'
        WHEN latest_exit.last_exited_at IS NOT NULL THEN 'history'
        WHEN p.active = TRUE THEN 'baseline'
        ELSE NULL
      END AS rest_source,
      CASE
        WHEN COALESCE(current_occupancy.horse_count, 0) > 0 THEN NULL
        WHEN manual_rest.manual_rest_started_on IS NOT NULL
          THEN GREATEST(0, CURRENT_DATE - manual_rest.manual_rest_started_on)::int
        WHEN latest_exit.last_exited_at IS NOT NULL
          THEN GREATEST(0, CURRENT_DATE - latest_exit.last_exited_at)::int
        WHEN p.active = TRUE THEN GREATEST(0, CURRENT_DATE - '${DEFAULT_PADDOCK_REST_BASELINE_DATE}'::date)::int
        ELSE NULL
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
        source_paddock.manual_rest_started_on,
        source_paddock.manual_rest_is_estimated,
        source_paddock.manual_rest_applies_to_descendants,
        paddock_chain.id AS effective_rest_paddock_id,
        paddock_chain.name AS effective_rest_paddock_name
      FROM paddock_chain
      JOIN paddocks source_paddock ON source_paddock.id = paddock_chain.id
      WHERE source_paddock.manual_rest_started_on IS NOT NULL
        AND (paddock_chain.depth = 0 OR source_paddock.manual_rest_applies_to_descendants = TRUE)
      ORDER BY source_paddock.manual_rest_started_on DESC, paddock_chain.depth ASC, paddock_chain.id ASC
      LIMIT 1
    ) manual_rest ON TRUE
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
      STRING_AGG(DISTINCT hg.name, ', ' ORDER BY hg.name) AS active_group_names,
      COUNT(DISTINCT hg.id)::int AS active_group_count,
      COUNT(*) FILTER (WHERE hgm.group_id IS NULL)::int AS ungrouped_horse_count,
      MIN(ge.entered_at) AS entered_at,
      NULL::date AS exited_at,
      GREATEST(1, CURRENT_DATE - MIN(ge.entered_at))::int AS days_grazed,
      'Active'::text AS status
    FROM grazing_events ge
    JOIN paddocks p ON p.id = ge.paddock_id
    JOIN horses h ON h.id = ge.horse_id
    LEFT JOIN horse_group_memberships hgm ON hgm.horse_id = ge.horse_id
    LEFT JOIN horse_groups hg ON hg.id = hgm.group_id
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
