const { pool } = require('./db');
const { ensureRainRegistryTable } = require('./rain-registry');
const { getFarmSettings } = require('./farm-settings');

const WEATHER_SYNC_SOURCE = 'weather_sync';
const WEATHER_PROVIDER = 'open-meteo';
const MANUAL_RAIN_SOURCES = ['manual', 'admin_panel', 'telegram'];

function parsePositiveInt(value, fallbackValue) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
}

function parseCoordinate(value) {
  const parsed = Number(String(value || '').trim());
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function normalizeDailyNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.round(parsed * 10) / 10;
}

async function getWeatherSyncConfig() {
  const farmSettings = await getFarmSettings();
  const latitude = parseCoordinate(farmSettings.weather_latitude);
  const longitude = parseCoordinate(farmSettings.weather_longitude);
  const timezone =
    String(farmSettings.weather_timezone || 'America/Montevideo').trim() || 'America/Montevideo';
  const lookbackDays = Math.min(parsePositiveInt(farmSettings.weather_sync_days, 90), 365);

  return {
    latitude,
    longitude,
    timezone,
    lookbackDays,
    configured: latitude != null && longitude != null,
  };
}

function buildWeatherForecastUrl(config) {
  const search = new URLSearchParams({
    latitude: String(config.latitude),
    longitude: String(config.longitude),
    timezone: config.timezone,
    daily: 'temperature_2m_max,temperature_2m_min,rain_sum',
    past_days: String(config.lookbackDays),
    forecast_days: '1',
  });

  return `https://api.open-meteo.com/v1/forecast?${search.toString()}`;
}

async function fetchDailyWeatherRows(config) {
  const resolvedConfig = config || (await getWeatherSyncConfig());

  if (!resolvedConfig.configured) {
    throw new Error('Farm weather latitude and longitude must be configured before syncing weather.');
  }

  if (typeof fetch !== 'function') {
    throw new Error('This Node runtime does not support fetch for weather sync.');
  }

  const response = await fetch(buildWeatherForecastUrl(resolvedConfig), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Farm-Bot/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Weather sync request failed (${response.status})`);
  }

  const payload = await response.json();
  const daily = payload?.daily || {};
  const dates = Array.isArray(daily.time) ? daily.time : [];
  const rainValues = Array.isArray(daily.rain_sum) ? daily.rain_sum : [];
  const minTemps = Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min : [];
  const maxTemps = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max : [];

  if (!dates.length) {
    throw new Error('Weather sync returned no daily rows.');
  }

  return dates
    .map((eventDate, index) => ({
      event_date: String(eventDate || '').slice(0, 10),
      rain_mm: normalizeDailyNumber(rainValues[index]) ?? 0,
      min_temp_c: normalizeDailyNumber(minTemps[index]),
      max_temp_c: normalizeDailyNumber(maxTemps[index]),
    }))
    .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.event_date));
}

async function syncWeatherIntoRainRegistry(config) {
  await ensureRainRegistryTable();
  const resolvedConfig = config || (await getWeatherSyncConfig());

  const rows = await fetchDailyWeatherRows(resolvedConfig);
  if (!rows.length) {
    throw new Error('Weather sync returned no usable daily rows.');
  }

  const client = await pool.connect();
  let insertedCount = 0;
  let updatedCount = 0;

  try {
    await client.query('BEGIN');

    for (const row of rows) {
      const result = await client.query(
        `
        INSERT INTO rain_registry (
          event_date,
          rain_mm,
          source,
          min_temp_c,
          max_temp_c,
          weather_source
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (event_date) DO UPDATE
        SET
          rain_mm = CASE
            WHEN rain_registry.source = ANY($7::text[]) THEN rain_registry.rain_mm
            ELSE EXCLUDED.rain_mm
          END,
          source = CASE
            WHEN rain_registry.source = ANY($7::text[]) THEN rain_registry.source
            ELSE EXCLUDED.source
          END,
          min_temp_c = EXCLUDED.min_temp_c,
          max_temp_c = EXCLUDED.max_temp_c,
          weather_source = EXCLUDED.weather_source,
          updated_at = NOW()
        RETURNING (xmax = 0) AS inserted
        `,
        [
          row.event_date,
          row.rain_mm,
          WEATHER_SYNC_SOURCE,
          row.min_temp_c,
          row.max_temp_c,
          WEATHER_PROVIDER,
          MANUAL_RAIN_SOURCES,
        ]
      );

      if (result.rows[0]?.inserted) {
        insertedCount += 1;
      } else {
        updatedCount += 1;
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return {
    insertedCount,
    updatedCount,
    rowCount: rows.length,
    startDate: rows[0].event_date,
    endDate: rows[rows.length - 1].event_date,
    config: {
      latitude: resolvedConfig.latitude,
      longitude: resolvedConfig.longitude,
      timezone: resolvedConfig.timezone,
      lookbackDays: resolvedConfig.lookbackDays,
    },
  };
}

module.exports = {
  WEATHER_PROVIDER,
  WEATHER_SYNC_SOURCE,
  getWeatherSyncConfig,
  syncWeatherIntoRainRegistry,
};
