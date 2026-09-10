const { getFarmSettings } = require('./farm-settings');

const WEATHER_FORECAST_PROVIDER = 'open-meteo';
const FORECAST_DAYS = 5;
const FORECAST_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes - Open-Meteo forecasts don't change more often than this.

let cachedForecast = null;
let cachedAt = 0;
let cachedCoordKey = null;

function parseCoordinate(value) {
  const parsed = Number(String(value ?? '').trim());
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

function normalizeDailyInt(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.round(parsed);
}

async function getWeatherForecastConfig() {
  const farmSettings = await getFarmSettings();
  const latitude = parseCoordinate(farmSettings.weather_latitude);
  const longitude = parseCoordinate(farmSettings.weather_longitude);
  const timezone =
    String(farmSettings.weather_timezone || 'America/Montevideo').trim() || 'America/Montevideo';

  return {
    latitude,
    longitude,
    timezone,
    configured: latitude != null && longitude != null,
  };
}

function buildWeatherForecastUrl(config) {
  const search = new URLSearchParams({
    latitude: String(config.latitude),
    longitude: String(config.longitude),
    timezone: config.timezone,
    daily: [
      'weathercode',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
    ].join(','),
    forecast_days: String(FORECAST_DAYS),
  });

  return `https://api.open-meteo.com/v1/forecast?${search.toString()}`;
}

async function fetchWeatherForecastRows(config) {
  if (typeof fetch !== 'function') {
    throw new Error('This Node runtime does not support fetch for weather forecast.');
  }

  const response = await fetch(buildWeatherForecastUrl(config), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Farm-Bot/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Weather forecast request failed (${response.status})`);
  }

  const payload = await response.json();
  const daily = payload?.daily || {};
  const dates = Array.isArray(daily.time) ? daily.time : [];
  const codes = Array.isArray(daily.weathercode) ? daily.weathercode : [];
  const minTemps = Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min : [];
  const maxTemps = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max : [];
  const precipSums = Array.isArray(daily.precipitation_sum) ? daily.precipitation_sum : [];
  const precipProbabilities = Array.isArray(daily.precipitation_probability_max)
    ? daily.precipitation_probability_max
    : [];

  return dates
    .map((eventDate, index) => ({
      event_date: String(eventDate || '').slice(0, 10),
      weathercode: normalizeDailyInt(codes[index]),
      min_temp_c: normalizeDailyNumber(minTemps[index]),
      max_temp_c: normalizeDailyNumber(maxTemps[index]),
      precipitation_mm: normalizeDailyNumber(precipSums[index]) ?? 0,
      precipitation_probability: normalizeDailyInt(precipProbabilities[index]),
    }))
    .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.event_date));
}

function buildCoordKey(config) {
  return `${config.latitude},${config.longitude},${config.timezone}`;
}

async function getWeatherForecast({ forceRefresh = false } = {}) {
  const config = await getWeatherForecastConfig();

  if (!config.configured) {
    return {
      configured: false,
      provider: WEATHER_FORECAST_PROVIDER,
      days: [],
      refreshed_at: null,
    };
  }

  const coordKey = buildCoordKey(config);
  const isCacheFresh =
    cachedForecast &&
    cachedCoordKey === coordKey &&
    Date.now() - cachedAt < FORECAST_CACHE_TTL_MS;

  if (!forceRefresh && isCacheFresh) {
    return cachedForecast;
  }

  const rows = await fetchWeatherForecastRows(config);

  const result = {
    configured: true,
    provider: WEATHER_FORECAST_PROVIDER,
    days: rows,
    refreshed_at: new Date().toISOString(),
  };

  cachedForecast = result;
  cachedAt = Date.now();
  cachedCoordKey = coordKey;

  return result;
}

module.exports = {
  WEATHER_FORECAST_PROVIDER,
  FORECAST_DAYS,
  getWeatherForecastConfig,
  getWeatherForecast,
};
