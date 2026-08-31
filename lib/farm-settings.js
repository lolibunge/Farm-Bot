const { pool } = require('./db');
const { ensureTableColumns } = require('./schema');

let ensurePromise = null;

const FARM_SETTINGS_COLUMNS = [
  { name: 'farm_name', definition: 'TEXT' },
  { name: 'location_text', definition: 'TEXT' },
  { name: 'total_hectares', definition: 'NUMERIC(10,2)' },
  { name: 'weather_latitude', definition: 'NUMERIC(9,5)' },
  { name: 'weather_longitude', definition: 'NUMERIC(9,5)' },
  { name: 'weather_timezone', definition: 'TEXT' },
  { name: 'weather_sync_days', definition: 'INTEGER' },
  { name: 'telegram_alert_chat_id', definition: 'TEXT' },
  { name: 'paddock_map_config', definition: 'JSONB' },
  { name: 'created_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
  { name: 'updated_at', definition: 'TIMESTAMPTZ NOT NULL DEFAULT NOW()' },
];

function normalizeNullableString(value) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

function normalizeCoordinate(value) {
  if (value == null || String(value).trim() === '') {
    return null;
  }

  const parsed = Number(String(value).trim());
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function normalizePositiveInteger(value, fallbackValue = null) {
  if (value == null || String(value).trim() === '') {
    return fallbackValue;
  }

  const parsed = Number.parseInt(String(value).trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return parsed;
}

function getEnvFarmSettings() {
  return {
    farm_name: normalizeNullableString(process.env.FARM_NAME),
    weather_latitude: normalizeCoordinate(process.env.WEATHER_LATITUDE),
    weather_longitude: normalizeCoordinate(process.env.WEATHER_LONGITUDE),
    weather_timezone:
      normalizeNullableString(process.env.WEATHER_TIMEZONE) || 'America/Montevideo',
    weather_sync_days: Math.min(normalizePositiveInteger(process.env.WEATHER_SYNC_DAYS, 90), 365),
    telegram_alert_chat_id: normalizeNullableString(process.env.TELEGRAM_ALERT_CHAT_ID),
  };
}

function normalizePaddockMapConfig(value) {
  if (!value) {
    return null;
  }

  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const viewBox = typeof parsed.view_box === 'string' ? parsed.view_box : '';
  const boundaryD = typeof parsed.boundary_d === 'string' ? parsed.boundary_d : '';
  const shapes = Array.isArray(parsed.shapes)
    ? parsed.shapes
        .map((shape) => ({
          name: String(shape?.name || '').trim(),
          d: String(shape?.d || '').trim(),
        }))
        .filter((shape) => shape.name && shape.d)
    : [];

  if (!viewBox || !shapes.length) {
    return null;
  }

  return {
    view_box: viewBox,
    boundary_d: boundaryD,
    shapes,
    updated_at:
      parsed.updated_at instanceof Date
        ? parsed.updated_at.toISOString()
        : parsed.updated_at
          ? String(parsed.updated_at)
          : null,
    source_file_name: typeof parsed.source_file_name === 'string' ? parsed.source_file_name : null,
  };
}

function toFarmSettingsPayload(row) {
  const envDefaults = getEnvFarmSettings();
  const record = row && typeof row === 'object' ? row : {};

  return {
    farm_name: normalizeNullableString(record.farm_name) || envDefaults.farm_name,
    weather_latitude:
      record.weather_latitude == null
        ? envDefaults.weather_latitude
        : Number(record.weather_latitude),
    weather_longitude:
      record.weather_longitude == null
        ? envDefaults.weather_longitude
        : Number(record.weather_longitude),
    weather_timezone:
      normalizeNullableString(record.weather_timezone) || envDefaults.weather_timezone,
    weather_sync_days:
      record.weather_sync_days == null
        ? envDefaults.weather_sync_days
        : Math.min(Number(record.weather_sync_days), 365),
    telegram_alert_chat_id:
      normalizeNullableString(record.telegram_alert_chat_id) || envDefaults.telegram_alert_chat_id,
    paddock_map: normalizePaddockMapConfig(record.paddock_map_config),
    updated_at:
      record.updated_at instanceof Date
        ? record.updated_at.toISOString()
        : record.updated_at
          ? String(record.updated_at)
          : null,
  };
}

async function ensureFarmSettingsTable() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS farm_settings (
        id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        farm_name TEXT,
        weather_latitude NUMERIC(9,5),
        weather_longitude NUMERIC(9,5),
        weather_timezone TEXT,
        weather_sync_days INTEGER,
        telegram_alert_chat_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await ensureTableColumns(pool, 'farm_settings', FARM_SETTINGS_COLUMNS);

    await pool.query(`
      INSERT INTO farm_settings (id)
      VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `);
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
}

async function getStoredFarmSettingsRow(client = pool) {
  await ensureFarmSettingsTable();

  const result = await client.query(
    `
    SELECT *
    FROM farm_settings
    WHERE id = 1
    `
  );

  return result.rows[0] || null;
}

async function getFarmSettings() {
  const row = await getStoredFarmSettingsRow();
  return toFarmSettingsPayload(row);
}

async function saveFarmSettings(input) {
  await ensureFarmSettingsTable();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const current = (await getStoredFarmSettingsRow(client)) || {};

    const next = {
      farm_name:
        Object.prototype.hasOwnProperty.call(input, 'farmName')
          ? normalizeNullableString(input.farmName)
          : current.farm_name ?? null,
      weather_latitude:
        Object.prototype.hasOwnProperty.call(input, 'weatherLatitude')
          ? normalizeCoordinate(input.weatherLatitude)
          : current.weather_latitude ?? null,
      weather_longitude:
        Object.prototype.hasOwnProperty.call(input, 'weatherLongitude')
          ? normalizeCoordinate(input.weatherLongitude)
          : current.weather_longitude ?? null,
      weather_timezone:
        Object.prototype.hasOwnProperty.call(input, 'weatherTimezone')
          ? normalizeNullableString(input.weatherTimezone)
          : current.weather_timezone ?? null,
      weather_sync_days:
        Object.prototype.hasOwnProperty.call(input, 'weatherSyncDays')
          ? normalizePositiveInteger(input.weatherSyncDays, null)
          : current.weather_sync_days ?? null,
      telegram_alert_chat_id:
        Object.prototype.hasOwnProperty.call(input, 'telegramAlertChatId')
          ? normalizeNullableString(input.telegramAlertChatId)
          : current.telegram_alert_chat_id ?? null,
    };

    const result = await client.query(
      `
      INSERT INTO farm_settings (
        id,
        farm_name,
        weather_latitude,
        weather_longitude,
        weather_timezone,
        weather_sync_days,
        telegram_alert_chat_id
      )
      VALUES (1, $1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE
      SET
        farm_name = EXCLUDED.farm_name,
        weather_latitude = EXCLUDED.weather_latitude,
        weather_longitude = EXCLUDED.weather_longitude,
        weather_timezone = EXCLUDED.weather_timezone,
        weather_sync_days = EXCLUDED.weather_sync_days,
        telegram_alert_chat_id = EXCLUDED.telegram_alert_chat_id,
        updated_at = NOW()
      RETURNING *
      `,
      [
        next.farm_name,
        next.weather_latitude,
        next.weather_longitude,
        next.weather_timezone,
        next.weather_sync_days,
        next.telegram_alert_chat_id,
      ]
    );

    await client.query('COMMIT');
    return toFarmSettingsPayload(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function saveFarmAlertChatId(chatId) {
  return saveFarmSettings({
    telegramAlertChatId: chatId,
  });
}

async function savePaddockMapConfig({ viewBox, boundaryD, shapes, sourceFileName }) {
  await ensureFarmSettingsTable();

  const config = {
    view_box: String(viewBox || '').trim(),
    boundary_d: String(boundaryD || '').trim(),
    shapes: Array.isArray(shapes)
      ? shapes
          .map((shape) => ({
            name: String(shape?.name || '').trim(),
            d: String(shape?.d || '').trim(),
          }))
          .filter((shape) => shape.name && shape.d)
      : [],
    updated_at: new Date().toISOString(),
    source_file_name: sourceFileName ? String(sourceFileName).trim().slice(0, 200) : null,
  };

  if (!config.view_box || config.view_box.length > 200) {
    throw new Error('viewBox is required and must be a short string');
  }

  if (!config.shapes.length) {
    throw new Error('At least one named shape is required');
  }

  if (config.shapes.length > 500) {
    throw new Error('Too many shapes (max 500)');
  }

  if (config.shapes.some((shape) => shape.d.length > 20000 || shape.name.length > 200)) {
    throw new Error('One or more shapes are too large');
  }

  if (config.boundary_d.length > 20000) {
    throw new Error('boundaryD is too large');
  }

  await pool.query(
    `
    INSERT INTO farm_settings (id, paddock_map_config)
    VALUES (1, $1::jsonb)
    ON CONFLICT (id) DO UPDATE
    SET paddock_map_config = EXCLUDED.paddock_map_config, updated_at = NOW()
    `,
    [JSON.stringify(config)]
  );

  return config;
}

module.exports = {
  ensureFarmSettingsTable,
  getFarmSettings,
  saveFarmSettings,
  saveFarmAlertChatId,
  savePaddockMapConfig,
};
