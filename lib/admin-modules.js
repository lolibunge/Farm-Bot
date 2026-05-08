const { pool } = require('./db');
const { ensureTableColumns } = require('./schema');

const ADMIN_MODULES = [
  {
    key: 'groups',
    label: 'Horse Groups',
    description: 'Group setup, membership assignment, and group history.',
    default_enabled: true,
  },
  {
    key: 'paddocks',
    label: 'Paddocks',
    description: 'Paddock setup, grazing moves, paddock work, and paddock occupancy.',
    default_enabled: true,
  },
  {
    key: 'feed',
    label: 'Feed',
    description: 'Feed inventory, feed history, and feed plans.',
    default_enabled: true,
  },
  {
    key: 'deworm',
    label: 'Deworming',
    description: 'Deworm reminders and deworm history.',
    default_enabled: true,
  },
  {
    key: 'farrier',
    label: 'Farrier',
    description: 'Farrier reminders and farrier history.',
    default_enabled: true,
  },
  {
    key: 'health',
    label: 'Health',
    description: 'Horse health events and health history.',
    default_enabled: true,
  },
  {
    key: 'training',
    label: 'Training',
    description: 'Training status updates and training summary panels.',
    default_enabled: true,
  },
  {
    key: 'rain',
    label: 'Rain',
    description: 'Rain registry, rain charts, and rain quick-view cards.',
    default_enabled: true,
  },
];

let ensurePromise = null;

const ADMIN_MODULE_SETTINGS_COLUMNS = [
  { name: 'enabled', definition: 'BOOLEAN NOT NULL DEFAULT TRUE' },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
  { name: 'updated_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

function buildModuleSettingsError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getAdminModuleDefinition(moduleKey) {
  return ADMIN_MODULES.find((module) => module.key === moduleKey) || null;
}

function normalizeAdminModuleSettings(rawRows) {
  const rowMap = new Map();

  for (const row of Array.isArray(rawRows) ? rawRows : []) {
    const moduleKey = String(row?.module_key || row?.key || '')
      .trim()
      .toLowerCase();
    const definition = getAdminModuleDefinition(moduleKey);
    if (!definition) {
      continue;
    }

    rowMap.set(definition.key, Boolean(row.enabled));
  }

  return ADMIN_MODULES.map((definition) => ({
    key: definition.key,
    label: definition.label,
    description: definition.description,
    editable: definition.editable !== false,
    enabled: rowMap.has(definition.key) ? rowMap.get(definition.key) : definition.default_enabled !== false,
  }));
}

async function ensureAdminModuleSettingsTable() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_module_settings (
        module_key TEXT PRIMARY KEY,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ensureTableColumns(pool, 'admin_module_settings', ADMIN_MODULE_SETTINGS_COLUMNS);

    for (const definition of ADMIN_MODULES) {
      await pool.query(
        `
        INSERT INTO admin_module_settings (module_key, enabled)
        VALUES ($1, $2)
        ON CONFLICT (module_key) DO NOTHING
        `,
        [definition.key, definition.default_enabled !== false]
      );
    }
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

async function listAdminModuleSettings() {
  await ensureAdminModuleSettingsTable();

  const result = await pool.query(
    `
    SELECT module_key, enabled
    FROM admin_module_settings
    ORDER BY module_key ASC
    `
  );

  return normalizeAdminModuleSettings(result.rows);
}

function buildAdminModuleEnabledMap(settings) {
  const enabledMap = {};

  for (const module of normalizeAdminModuleSettings(settings)) {
    enabledMap[module.key] = Boolean(module.enabled);
  }

  return enabledMap;
}

function isAdminModuleEnabled(moduleKey, enabledMap) {
  if (!moduleKey) {
    return true;
  }

  return enabledMap?.[moduleKey] !== false;
}

function assertAdminModuleEnabled(moduleKey, enabledMap) {
  if (isAdminModuleEnabled(moduleKey, enabledMap)) {
    return;
  }

  const definition = getAdminModuleDefinition(moduleKey);
  const moduleLabel = definition?.label || 'This module';
  throw buildModuleSettingsError(`${moduleLabel} is disabled in Admin Modules.`, 409);
}

async function saveAdminModuleSettings(items) {
  await ensureAdminModuleSettingsTable();

  const currentSettings = await listAdminModuleSettings();
  const requestedMap = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const definition = getAdminModuleDefinition(String(item?.key || '').trim().toLowerCase());
    if (!definition || definition.editable === false) {
      continue;
    }

    requestedMap.set(definition.key, Boolean(item.enabled));
  }

  const nextSettings = currentSettings.map((module) => ({
    ...module,
    enabled: requestedMap.has(module.key) ? requestedMap.get(module.key) : module.enabled,
  }));

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const module of nextSettings) {
      if (!module.editable) {
        continue;
      }

      await client.query(
        `
        INSERT INTO admin_module_settings (module_key, enabled)
        VALUES ($1, $2)
        ON CONFLICT (module_key)
        DO UPDATE
        SET enabled = EXCLUDED.enabled,
            updated_at = NOW()
        `,
        [module.key, module.enabled]
      );
    }

    await client.query('COMMIT');
    return nextSettings;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  ADMIN_MODULES,
  ensureAdminModuleSettingsTable,
  listAdminModuleSettings,
  buildAdminModuleEnabledMap,
  isAdminModuleEnabled,
  assertAdminModuleEnabled,
  saveAdminModuleSettings,
  buildModuleSettingsError,
};
