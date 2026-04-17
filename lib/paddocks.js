const { pool } = require('./db');
const { toIsoDateString } = require('./date-helpers');

let ensurePromise = null;

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

function normalizePaddockStatusRow(row) {
  const horseCount = Number(row.horse_count || 0);
  const active = Boolean(row.active);
  const occupiedHorseNames = row.horse_names || null;
  const occupiedGroupNames = row.group_names || null;
  const ungroupedHorseCount = Number(row.ungrouped_horse_count || 0);
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
    horse_count: horseCount,
    occupied_by: occupiedBy,
    occupied_horses: occupiedHorseNames,
    occupied_groups: occupiedGroupNames,
    ungrouped_horse_count: ungroupedHorseCount,
    occupied_since: toIsoDateString(row.occupied_since),
    grazing_days: row.grazing_days == null ? null : Number(row.grazing_days),
    last_exited_at: toIsoDateString(row.last_exited_at),
    rest_days: row.rest_days == null ? null : Number(row.rest_days),
    occupancy_state: occupancyState,
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
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      ALTER TABLE paddocks
      ADD COLUMN IF NOT EXISTS zone TEXT
    `);

    await pool.query(`
      ALTER TABLE paddocks
      ADD COLUMN IF NOT EXISTS size_ha NUMERIC(10,2)
    `);

    await pool.query(`
      ALTER TABLE paddocks
      ADD COLUMN IF NOT EXISTS notes TEXT
    `);

    await pool.query(`
      ALTER TABLE paddocks
      ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE
    `);

    await pool.query(`
      ALTER TABLE paddocks
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await pool.query(`
      ALTER TABLE paddocks
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
      CREATE TABLE IF NOT EXISTS horse_groups (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        notes TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      ALTER TABLE horse_groups
      ADD COLUMN IF NOT EXISTS notes TEXT
    `);

    await pool.query(`
      ALTER TABLE horse_groups
      ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE
    `);

    await pool.query(`
      ALTER TABLE horse_groups
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await pool.query(`
      ALTER TABLE horse_groups
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

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

    await pool.query(`
      ALTER TABLE horse_group_memberships
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await pool.query(`
      ALTER TABLE horse_group_memberships
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS horse_group_memberships_horse_unique_idx
      ON horse_group_memberships (horse_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS horse_group_memberships_group_idx
      ON horse_group_memberships (group_id, horse_id)
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

    await pool.query(`
      ALTER TABLE grazing_events
      ADD COLUMN IF NOT EXISTS entered_at DATE
    `);

    await pool.query(`
      ALTER TABLE grazing_events
      ADD COLUMN IF NOT EXISTS exited_at DATE
    `);

    await pool.query(`
      ALTER TABLE grazing_events
      ADD COLUMN IF NOT EXISTS entry_notes TEXT
    `);

    await pool.query(`
      ALTER TABLE grazing_events
      ADD COLUMN IF NOT EXISTS exit_notes TEXT
    `);

    await pool.query(`
      ALTER TABLE grazing_events
      ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
    `);

    await pool.query(`
      ALTER TABLE grazing_events
      ADD COLUMN IF NOT EXISTS source_group_id BIGINT REFERENCES horse_groups(id) ON DELETE SET NULL
    `);

    await pool.query(`
      ALTER TABLE grazing_events
      ADD COLUMN IF NOT EXISTS telegram_user_id TEXT
    `);

    await pool.query(`
      ALTER TABLE grazing_events
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    await pool.query(`
      ALTER TABLE grazing_events
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

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
    SELECT id, name, zone, size_ha, notes, active, created_at, updated_at
    FROM paddocks
    WHERE LOWER(name) = LOWER($1)
  `;

  if (options.activeOnly) {
    sql += '\n  AND active = TRUE';
  }

  sql += '\nORDER BY id ASC\nLIMIT 1';

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

async function savePaddock({ name, zone, sizeHa, notes, active = true }) {
  await ensurePaddockTables();

  const paddockName = String(name || '').trim();
  if (!paddockName) {
    throw buildServiceError('Paddock name is required.', 400);
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

    let result;
    let mode = 'created';

    if (existingResult.rows.length > 0) {
      mode = 'updated';
      result = await client.query(
        `
        UPDATE paddocks
        SET name = $1,
            zone = $2,
            size_ha = $3,
            notes = $4,
            active = $5,
            updated_at = NOW()
        WHERE id = $6
        RETURNING id, name, zone, size_ha, notes, active, created_at, updated_at
        `,
        [paddockName, zone || null, sizeHa, notes || null, active, existingResult.rows[0].id]
      );
    } else {
      result = await client.query(
        `
        INSERT INTO paddocks (
          name,
          zone,
          size_ha,
          notes,
          active
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, zone, size_ha, notes, active, created_at, updated_at
        `,
        [paddockName, zone || null, sizeHa, notes || null, active]
      );
    }

    await client.query('COMMIT');

    return {
      mode,
      paddock: normalizePaddockRow(result.rows[0]),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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

async function saveHorseGroup({ name, notes, active = true }) {
  await ensurePaddockTables();

  const groupName = String(name || '').trim();
  if (!groupName) {
    throw buildServiceError('Group name is required.', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

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

    let result;
    let mode = 'created';

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

    await client.query('COMMIT');

    const group = await findHorseGroupByName(groupName);

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

    let reassignedRows = [];
    if (normalizedHorseIds.length > 0) {
      const reassignedResult = await client.query(
        `
        SELECT
          h.id AS horse_id,
          h.name AS horse_name,
          g.id AS previous_group_id,
          g.name AS previous_group_name
        FROM horse_group_memberships hgm
        JOIN horses h ON h.id = hgm.horse_id
        JOIN horse_groups g ON g.id = hgm.group_id
        WHERE hgm.horse_id = ANY($1::bigint[])
          AND hgm.group_id <> $2
        ORDER BY h.name ASC
        `,
        [normalizedHorseIds, groupId]
      );

      reassignedRows = reassignedResult.rows;
    }

    await client.query(
      `
      DELETE FROM horse_group_memberships
      WHERE group_id = $1
      `,
      [groupId]
    );

    if (normalizedHorseIds.length > 0) {
      await client.query(
        `
        DELETE FROM horse_group_memberships
        WHERE horse_id = ANY($1::bigint[])
          AND group_id <> $2
        `,
        [normalizedHorseIds, groupId]
      );

      await client.query(
        `
        INSERT INTO horse_group_memberships (group_id, horse_id)
        SELECT $1, horse_id
        FROM UNNEST($2::bigint[]) AS horse_id
        `,
        [groupId, normalizedHorseIds]
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

    const openEventResult = await client.query(
      `
      SELECT
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

    if (openEventResult.rows.length > 0) {
      throw buildServiceError(
        `Group move blocked. Some horses are already grazing: ${buildGroupedHorseConflict(
          openEventResult.rows
        )}`,
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
      [paddockId, enteredAt, entryNotes || null, source || 'group_manual', groupId, telegramUserId, memberIds]
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
      grazing_events: insertResult.rows
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
      moved_count: memberResult.rows.length,
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
        WHEN latest_exit.last_exited_at IS NULL THEN NULL
        ELSE GREATEST(0, CURRENT_DATE - latest_exit.last_exited_at)::int
      END AS rest_days
    FROM paddocks p
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
      SELECT MAX(ge.exited_at) AS last_exited_at
      FROM grazing_events ge
      WHERE ge.paddock_id = p.id
        AND ge.exited_at IS NOT NULL
    ) latest_exit ON TRUE
    ${whereClause}
    ORDER BY p.active DESC, p.name ASC
    `,
    params
  );

  return result.rows.map(normalizePaddockStatusRow);
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
          THEN GREATEST(1, (CURRENT_DATE - ge.entered_at) + 1)::int
        ELSE GREATEST(1, (ge.exited_at - ge.entered_at) + 1)::int
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
      GREATEST(1, (CURRENT_DATE - ge.entered_at) + 1)::int AS grazing_days
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
  findHorseGroupByName,
  listHorseGroups,
  listHorseGroupNames,
  saveHorseGroup,
  setHorseGroupMembers,
  moveHorseIntoPaddock,
  moveHorseOutOfPaddock,
  moveHorseGroupIntoPaddock,
  moveHorseGroupOutOfPaddock,
  listPaddockStatus,
  listGrazingHistory,
  getHorseCurrentGrazing,
  buildServiceError,
};
