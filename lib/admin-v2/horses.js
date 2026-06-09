const { pool } = require('../db');
const { ensureHorseProfileColumns } = require('../horse-profile');
const {
  ensurePaddockTables,
  listPaddockStatus,
  listHorseGroups,
} = require('../paddocks');
const {
  listAdminModuleSettings,
  buildAdminModuleEnabledMap,
  isAdminModuleEnabled,
} = require('../admin-modules');
const { toIsoDateString } = require('../date-helpers');

const CARE_ALERT_DAYS_AHEAD = parsePositiveInt(process.env.ADMIN_V2_HORSE_ALERT_DAYS_AHEAD, 5);

const ALLOWED_COLORS = new Set([
  '',
  'bay',
  'gray',
  'black',
  'chestnut',
  'dune',
  'dark bay',
  'blue roan',
]);

const ALLOWED_ACTIVITIES = new Set([
  '',
  'foal',
  'colt',
  'broke horse',
  'new horse',
  'polo pony',
  'ranch horse',
  'brood stallion',
  'brood mare',
]);

const ALLOWED_SEX_VALUES = new Set(['', 'mare', 'stallion', 'gelding', 'filly', 'unknown']);
const ALLOWED_TRAINING_STATUSES = new Set(['in training', 'breaking in']);

function parsePositiveInt(value, fallbackValue = null) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function looksLikeDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value));
}

function isValidDateString(value) {
  const stringValue = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return false;
  }

  const [year, month, day] = stringValue.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
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

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToDateString(dateString, daysToAdd) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}

function normalizeCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function hasTable(client, tableName, schemaName = 'public') {
  const result = await client.query('SELECT to_regclass($1) AS relation_name', [
    `${schemaName}.${tableName}`,
  ]);

  return Boolean(result.rows[0]?.relation_name);
}

function normalizeHorseProfileRow(row, { trainingModuleEnabled }) {
  if (!row) {
    return null;
  }

  const dewormNextDueDate = toIsoDateString(row.deworm_next_due_date);
  const farrierNextDueDate = toIsoDateString(row.farrier_next_due_date);
  const today = todayDateString();
  const alertLimit = addDaysToDateString(today, CARE_ALERT_DAYS_AHEAD);
  const hasOverdueCare =
    Boolean(dewormNextDueDate && dewormNextDueDate < today) ||
    Boolean(farrierNextDueDate && farrierNextDueDate < today);
  const hasUpcomingCare =
    Boolean(dewormNextDueDate && dewormNextDueDate >= today && dewormNextDueDate <= alertLimit) ||
    Boolean(farrierNextDueDate && farrierNextDueDate >= today && farrierNextDueDate <= alertLimit);

  let status = {
    key: 'neutral',
    label: 'Perfil base',
    tone: 'gray',
  };

  if (hasOverdueCare) {
    status = {
      key: 'attention',
      label: 'Atencion',
      tone: 'critical',
    };
  } else if (hasUpcomingCare) {
    status = {
      key: 'upcoming',
      label: 'Proximo control',
      tone: 'warning',
    };
  } else if (row.paddock_name || row.group_name) {
    status = {
      key: 'active',
      label: 'Activo',
      tone: 'green',
    };
  }

  return {
    id: Number(row.id),
    name: row.name,
    date_of_birth: toIsoDateString(row.date_of_birth),
    age_years: row.age_years == null ? null : Number(row.age_years),
    color: row.color || null,
    activity: row.activity || null,
    sex: row.sex || null,
    training_status:
      trainingModuleEnabled && normalizeTrainingStatus(row.training_status)
        ? normalizeTrainingStatus(row.training_status)
        : null,
    current_group:
      row.group_id == null && !row.group_name
        ? null
        : {
            id: row.group_id == null ? null : Number(row.group_id),
            name: row.group_name || null,
            days: row.group_days == null ? null : Number(row.group_days),
          },
    current_location:
      row.paddock_id == null && !row.paddock_name
        ? null
        : {
            paddock_id: row.paddock_id == null ? null : Number(row.paddock_id),
            paddock_name: row.paddock_name || null,
            days: row.grazing_days == null ? null : Number(row.grazing_days),
          },
    care: {
      deworming: {
        product_name: row.deworm_product_name || null,
        next_due_date: dewormNextDueDate,
      },
      farrier: {
        service_type: row.farrier_service_type || null,
        next_due_date: farrierNextDueDate,
      },
    },
    status,
  };
}

function buildHorseSummaryCards(horses, { activeGroupCount = null } = {}) {
  const today = todayDateString();
  const alertLimit = addDaysToDateString(today, CARE_ALERT_DAYS_AHEAD);
  const groupedCount = horses.filter((horse) => horse.current_group?.name).length;
  const individualCount = Math.max(0, horses.length - groupedCount);
  const resolvedActiveGroupCount =
    activeGroupCount == null
      ? Math.max(
          0,
          new Set(horses.map((horse) => horse.current_group?.name || '').filter(Boolean)).size
        )
      : Number(activeGroupCount) || 0;
  const attentionCount = horses.filter((horse) => {
    const dewormDue = horse.care?.deworming?.next_due_date;
    const farrierDue = horse.care?.farrier?.next_due_date;

    return (
      Boolean(dewormDue && dewormDue <= alertLimit) || Boolean(farrierDue && farrierDue <= alertLimit)
    );
  }).length;
  const trainingCount = horses.filter((horse) => horse.training_status).length;

  return [
    {
      label: 'Total Caballos',
      value: String(horses.length),
      detail: 'Conectado al padrón actual de Neon.',
      tone: 'blue',
      icon: 'horses',
    },
    {
      label: 'En Grupos',
      value: String(groupedCount),
      detail: `${Math.max(0, resolvedActiveGroupCount)} grupos activos.`,
      tone: groupedCount > 0 ? 'green' : 'gray',
      icon: 'owners',
    },
    {
      label: 'Individuales',
      value: String(individualCount),
      detail: `${Math.max(0, horses.length - individualCount)} dentro de grupos.`,
      tone: individualCount > 0 ? 'orange' : 'gray',
      icon: 'singleHorse',
    },
    {
      label: 'Alertas Salud',
      value: String(attentionCount),
      detail:
        attentionCount > 0
          ? `${attentionCount} próxima(s) o vencida(s).`
          : `${trainingCount} con estado de entrenamiento cargado.`,
      tone: attentionCount > 0 ? 'orange' : 'green',
      icon: 'circleAlert',
    },
  ];
}

function normalizeHorseDashboardPaddockRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    name: row.name,
    active: Boolean(row.active),
    zone: row.zone || null,
    size_ha: row.size_ha == null ? null : Number(row.size_ha),
    notes: row.notes || null,
    horse_count: row.horse_count == null ? 0 : Number(row.horse_count),
    occupancy_state: row.occupancy_state || null,
    ready_to_graze_on: toIsoDateString(row.ready_to_graze_on),
    rest_days: row.rest_days == null ? null : Number(row.rest_days),
  };
}

function normalizeHorseDashboardGroupRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    name: row.name,
    notes: row.notes || null,
    active: Boolean(row.active),
    member_count: row.member_count == null ? 0 : Number(row.member_count),
    members: Array.isArray(row.members)
      ? row.members.map((member) => ({
          id: Number(member.id),
          name: member.name,
        }))
      : [],
    member_names: Array.isArray(row.member_names) ? row.member_names : [],
    current_started_at: toIsoDateString(row.current_started_at),
    current_paddock_names: row.current_paddock_names || null,
    current_paddock_ids: Array.isArray(row.current_paddock_ids)
      ? row.current_paddock_ids
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0)
      : [],
    current_locations: Array.isArray(row.current_locations)
      ? row.current_locations.map((location) => ({
          location_id:
            location.location_id == null ? null : Number(location.location_id),
          location_name: location.location_name || null,
          location_type: location.location_type || null,
          horse_count: location.horse_count == null ? 0 : Number(location.horse_count),
          horse_ids: Array.isArray(location.horse_ids)
            ? location.horse_ids
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value) && value > 0)
            : [],
          horse_names: Array.isArray(location.horse_names) ? location.horse_names : [],
          entered_at: toIsoDateString(location.entered_at),
        }))
      : [],
    current_location_count:
      row.current_location_count == null ? 0 : Number(row.current_location_count),
    current_grazing_entered_at: toIsoDateString(row.current_grazing_entered_at),
    grazing_member_count:
      row.grazing_member_count == null ? 0 : Number(row.grazing_member_count),
    located_member_count:
      row.located_member_count == null ? 0 : Number(row.located_member_count),
    unassigned_member_count:
      row.unassigned_member_count == null ? 0 : Number(row.unassigned_member_count),
    unassigned_members: Array.isArray(row.unassigned_members)
      ? row.unassigned_members.map((member) => ({
          id: Number(member.id),
          name: member.name,
        }))
      : [],
    location_state: row.location_state || null,
  };
}

function buildHorseNotice(horses) {
  if (!horses.length) {
    return {
      tone: 'warning',
      title: 'La vista ya está conectada, pero todavía no hay caballos.',
      description:
        'Podés empezar a usar el módulo nuevo creando el primer caballo directamente desde esta vista.',
      rows: [
        'La creación ya escribe en Neon.',
        'La edición y eliminación también quedan disponibles desde el rediseño.',
      ],
      focus: 'Siguiente paso',
      focusDetail: 'Crear el primer caballo desde el botón superior.',
      tag: 'Neon',
    };
  }

  const attentionHorse = horses.find((horse) => horse.status?.key === 'attention');
  if (attentionHorse) {
    const attentionCount = horses.filter((horse) => horse.status?.key === 'attention').length;
    return {
      tone: 'critical',
      title: `Atención veterinaria atrasada - ${attentionCount} caballo(s)`,
      description:
        'La vista nueva ya refleja vencimientos de desparasitación y herraje usando los datos reales.',
      rows: [
        'Podés abrir la ficha, editar el perfil y seguir limpiando el flujo desde acá.',
        'La timeline completa seguirá en la siguiente iteración del módulo.',
      ],
      focus: attentionHorse.name,
      focusDetail: 'Revisá sus próximos cuidados desde las tarjetas o la ficha rápida.',
      tag: 'CRUD listo',
    };
  }

  return {
    tone: 'warning',
    title: 'Módulo de caballos conectado al diseño nuevo.',
    description:
      'Esta primera pasada ya usa los datos reales de Neon para listar, crear, editar y borrar caballos.',
    rows: [
      'La ficha actual se concentra en identidad y estado operativo básico.',
      'Grupos y movimientos quedan como próximo tramo del rediseño.',
    ],
    focus: `${horses.length} caballo(s) sincronizado(s)`,
    focusDetail: 'La lista se refresca desde la API nueva de admin-v2.',
    tag: 'Fase 1',
  };
}

async function getHorseDashboardRows(client, { trainingModuleEnabled }) {
  const dewormingTableExists = await hasTable(client, 'deworming_events');
  const farrierTableExists = await hasTable(client, 'farrier_events');

  const result = await client.query(
    `
    SELECT
      h.id,
      h.name,
      h.date_of_birth,
      h.color,
      h.activity,
      h.sex,
      h.training_status,
      CASE
        WHEN h.date_of_birth IS NULL THEN NULL
        ELSE DATE_PART('year', AGE(CURRENT_DATE, h.date_of_birth))::int
      END AS age_years,
      current_group.group_id,
      current_group.group_name,
      current_group.group_days,
      current_location.paddock_id,
      current_location.paddock_name,
      current_location.grazing_days,
      ${
        dewormingTableExists
          ? 'latest_deworm.product_name AS deworm_product_name, latest_deworm.next_due_date AS deworm_next_due_date,'
          : 'NULL::text AS deworm_product_name, NULL::date AS deworm_next_due_date,'
      }
      ${
        farrierTableExists
          ? 'latest_farrier.service_type AS farrier_service_type, latest_farrier.next_due_date AS farrier_next_due_date'
          : 'NULL::text AS farrier_service_type, NULL::date AS farrier_next_due_date'
      }
    FROM horses h
    LEFT JOIN LATERAL (
      SELECT
        hgh.group_id,
        COALESCE(hgh.group_name, hg.name) AS group_name,
        GREATEST(1, ((CURRENT_DATE - hgh.started_at) + 1))::int AS group_days
      FROM horse_group_membership_history hgh
      LEFT JOIN horse_groups hg ON hg.id = hgh.group_id
      WHERE hgh.horse_id = h.id
        AND hgh.ended_at IS NULL
      ORDER BY hgh.started_at DESC, hgh.id DESC
      LIMIT 1
    ) current_group ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        ge.paddock_id,
        p.name AS paddock_name,
        GREATEST(1, CURRENT_DATE - ge.entered_at)::int AS grazing_days
      FROM grazing_events ge
      JOIN paddocks p ON p.id = ge.paddock_id
      WHERE ge.horse_id = h.id
        AND ge.exited_at IS NULL
      ORDER BY ge.entered_at DESC, ge.id DESC
      LIMIT 1
    ) current_location ON TRUE
    ${
      dewormingTableExists
        ? `
    LEFT JOIN LATERAL (
      SELECT
        d.product_name,
        d.next_due_date
      FROM deworming_events d
      WHERE d.horse_id = h.id
      ORDER BY
        COALESCE(d.second_dose_date, d.event_date, d.created_at::date) DESC,
        d.id DESC
      LIMIT 1
    ) latest_deworm ON TRUE
    `
        : ''
    }
    ${
      farrierTableExists
        ? `
    LEFT JOIN LATERAL (
      SELECT
        f.service_type,
        f.next_due_date
      FROM farrier_events f
      WHERE f.horse_id = h.id
      ORDER BY
        COALESCE(f.event_date, f.created_at::date) DESC,
        f.id DESC
      LIMIT 1
    ) latest_farrier ON TRUE
    `
        : ''
    }
    ORDER BY h.name ASC
    `
  );

  return result.rows.map((row) => normalizeHorseProfileRow(row, { trainingModuleEnabled }));
}

async function getHorseById(client, horseId, { trainingModuleEnabled }) {
  const horseRows = await getHorseDashboardRows(client, { trainingModuleEnabled });
  return horseRows.find((horse) => horse.id === horseId) || null;
}

function validateHorseInput(input, { trainingModuleEnabled, requireHorseName = true } = {}) {
  const horseName = String(input.horseName || '').trim();
  const dateOfBirthRaw = input.dateOfBirth ? String(input.dateOfBirth).trim() : '';
  const color = input.color ? String(input.color).trim().toLowerCase() : '';
  const activity = input.activity ? String(input.activity).trim().toLowerCase() : '';
  const sex = input.sex ? String(input.sex).trim().toLowerCase() : '';
  const trainingStatusRaw = input.trainingStatus == null ? '' : String(input.trainingStatus);
  const trainingStatus = normalizeTrainingStatus(trainingStatusRaw);

  if (requireHorseName && !horseName) {
    throw buildServiceError('horseName is required', 400);
  }

  if (looksLikeDateString(dateOfBirthRaw) && !isValidDateString(dateOfBirthRaw)) {
    throw buildServiceError('dateOfBirth is not a valid calendar date', 400);
  }

  if (dateOfBirthRaw && !isValidDateString(dateOfBirthRaw)) {
    throw buildServiceError('dateOfBirth must be YYYY-MM-DD', 400);
  }

  if (!ALLOWED_COLORS.has(color)) {
    throw buildServiceError(
      'color must be one of: bay, gray, black, chestnut, dune, dark bay, blue roan',
      400
    );
  }

  if (!ALLOWED_ACTIVITIES.has(activity)) {
    throw buildServiceError(
      'activity must be one of: foal, colt, broke horse, new horse, polo pony, ranch horse, brood stallion, brood mare',
      400
    );
  }

  if (!ALLOWED_SEX_VALUES.has(sex)) {
    throw buildServiceError(
      'sex must be one of: mare, stallion, gelding, filly, unknown',
      400
    );
  }

  if (
    trainingModuleEnabled &&
    trainingStatusRaw.trim() &&
    !ALLOWED_TRAINING_STATUSES.has(trainingStatus)
  ) {
    throw buildServiceError(
      'trainingStatus must be one of: in training, breaking in (accepted aliases: training, breaking)',
      400
    );
  }

  return {
    horseName,
    dateOfBirth: dateOfBirthRaw || null,
    color: color || null,
    activity: activity || null,
    sex: sex || null,
    trainingStatus: trainingModuleEnabled ? trainingStatus || null : null,
  };
}

async function assertHorseNameAvailable(client, horseName, horseId = null) {
  const result = await client.query(
    `
    SELECT id, name
    FROM horses
    WHERE LOWER(name) = LOWER($1)
      AND ($2::bigint IS NULL OR id <> $2)
    LIMIT 1
    `,
    [horseName, horseId]
  );

  if (result.rows.length > 0) {
    throw buildServiceError(
      horseId
        ? `Another horse already uses that name: ${result.rows[0].name}`
        : `Horse already exists: ${result.rows[0].name}`,
      409
    );
  }
}

async function getHorseModuleConfig() {
  await ensureHorseProfileColumns();
  await ensurePaddockTables();

  const moduleSettings = await listAdminModuleSettings();
  const enabledModules = buildAdminModuleEnabledMap(moduleSettings);

  return {
    enabledModules,
    trainingModuleEnabled: isAdminModuleEnabled('training', enabledModules),
  };
}

async function getAdminV2HorsesDashboard() {
  const client = await pool.connect();

  try {
    const { enabledModules, trainingModuleEnabled } = await getHorseModuleConfig();
    const [horses, paddocks, groups] = await Promise.all([
      getHorseDashboardRows(client, { trainingModuleEnabled }),
      listPaddockStatus(),
      listHorseGroups(),
    ]);
    const activeGroupCount = groups.filter((group) => group.active).length;

    return {
      ok: true,
      meta: {
        refreshed_at: new Date().toISOString(),
        route_key: 'admin-v2-horses',
        actions_enabled: true,
        training_module_enabled: trainingModuleEnabled,
        groups_module_enabled: isAdminModuleEnabled('groups', enabledModules),
        paddocks_module_enabled: isAdminModuleEnabled('paddocks', enabledModules),
      },
      shell: {
        title: 'Farm Bot Admin Next',
        subtitle: 'Nueva arquitectura aislada del admin legacy.',
      },
      horses_dashboard: {
        title: 'Caballos',
        description:
          'Primera conexión real del rediseño nuevo sobre Neon para crear, editar, borrar y revisar el padrón de caballos.',
        header_subtitle: `${horses.length} caballo(s) · ${activeGroupCount} grupo(s) activo(s)`,
        summary_cards: buildHorseSummaryCards(horses, { activeGroupCount }),
        notice: buildHorseNotice(horses),
        tabs: [
          {
            key: 'individual',
            label: 'Vista Individual',
            status: 'ready',
          },
          {
            key: 'groups',
            label: 'Vista por Grupos',
            status: 'ready',
          },
        ],
        horses,
        catalog: {
          paddocks: paddocks.map((row) => normalizeHorseDashboardPaddockRow(row)).filter(Boolean),
          groups: groups.map((row) => normalizeHorseDashboardGroupRow(row)).filter(Boolean),
        },
      },
    };
  } finally {
    client.release();
  }
}

async function createAdminV2Horse(input) {
  const client = await pool.connect();

  try {
    const { trainingModuleEnabled } = await getHorseModuleConfig();
    const payload = validateHorseInput(input, { trainingModuleEnabled, requireHorseName: true });

    await assertHorseNameAvailable(client, payload.horseName);

    const result = await client.query(
      `
      INSERT INTO horses (
        name,
        date_of_birth,
        color,
        activity,
        sex,
        training_status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        payload.horseName,
        payload.dateOfBirth,
        payload.color,
        payload.activity,
        payload.sex,
        payload.trainingStatus,
      ]
    );

    const horse = await getHorseById(client, Number(result.rows[0].id), { trainingModuleEnabled });

    return {
      ok: true,
      horse,
    };
  } finally {
    client.release();
  }
}

async function updateAdminV2Horse(horseId, input) {
  const normalizedHorseId = parsePositiveInt(horseId);
  if (!normalizedHorseId) {
    throw buildServiceError('horseId is required', 400);
  }

  const client = await pool.connect();

  try {
    const { trainingModuleEnabled } = await getHorseModuleConfig();
    const payload = validateHorseInput(input, { trainingModuleEnabled, requireHorseName: true });

    await assertHorseNameAvailable(client, payload.horseName, normalizedHorseId);

    const result = await client.query(
      `
      UPDATE horses
      SET name = $1,
          date_of_birth = $2,
          color = $3,
          activity = $4,
          sex = $5,
          training_status = CASE
            WHEN $6 THEN $7
            ELSE training_status
          END
      WHERE id = $8
      RETURNING id
      `,
      [
        payload.horseName,
        payload.dateOfBirth,
        payload.color,
        payload.activity,
        payload.sex,
        trainingModuleEnabled,
        payload.trainingStatus,
        normalizedHorseId,
      ]
    );

    if (result.rows.length === 0) {
      throw buildServiceError('Horse not found', 404);
    }

    const horse = await getHorseById(client, normalizedHorseId, { trainingModuleEnabled });

    return {
      ok: true,
      horse,
    };
  } finally {
    client.release();
  }
}

async function listHorseDependentTables(client) {
  const result = await client.query(
    `
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'horse_id'
      AND c.table_name <> 'horses'
      AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name ASC
    `
  );

  return result.rows.map((row) => row.table_name);
}

async function deleteAdminV2Horse(horseId) {
  const normalizedHorseId = parsePositiveInt(horseId);
  if (!normalizedHorseId) {
    throw buildServiceError('horseId is required', 400);
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
      throw buildServiceError('Horse not found', 404);
    }

    const deletedRelations = {};

    if ((await hasTable(client, 'treatment_plans')) && (await hasTable(client, 'treatment_logs'))) {
      const deleteTreatmentLogsResult = await client.query(
        `
        DELETE FROM treatment_logs
        WHERE treatment_plan_id IN (
          SELECT id
          FROM treatment_plans
          WHERE horse_id = $1
        )
        `,
        [normalizedHorseId]
      );

      if (deleteTreatmentLogsResult.rowCount > 0) {
        deletedRelations.treatment_logs = normalizeCount(deleteTreatmentLogsResult.rowCount);
      }
    }

    const dependentTables = await listHorseDependentTables(client);
    for (const tableName of dependentTables) {
      const deleteResult = await client.query(
        `DELETE FROM ${quoteIdentifier(tableName)} WHERE horse_id = $1`,
        [normalizedHorseId]
      );

      if (deleteResult.rowCount > 0) {
        deletedRelations[tableName] = normalizeCount(deleteResult.rowCount);
      }
    }

    await client.query('DELETE FROM horses WHERE id = $1', [normalizedHorseId]);
    await client.query('COMMIT');

    const deletedRelatedRowCount = Object.values(deletedRelations).reduce(
      (sum, count) => sum + normalizeCount(count),
      0
    );

    return {
      ok: true,
      horse: {
        id: Number(horseResult.rows[0].id),
        name: horseResult.rows[0].name,
      },
      deleted_relations: deletedRelations,
      deleted_related_row_count: deletedRelatedRowCount,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getAdminV2HorsesDashboard,
  createAdminV2Horse,
  updateAdminV2Horse,
  deleteAdminV2Horse,
};
