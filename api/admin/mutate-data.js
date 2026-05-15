const { pool } = require('../../lib/db');
const { ensureHorseProfileColumns } = require('../../lib/horse-profile');
const {
  ensurePaddockTables,
  savePaddock,
  savePaddockWorkEvent,
  updatePaddockWorkEvent,
  saveHorseGroup,
  setHorseGroupMembers,
  moveHorseIntoPaddock,
  moveHorseOutOfPaddock,
  moveHorseGroupIntoPaddock,
  correctHorseGroupCurrentPaddock,
  moveHorseGroupOutOfPaddock,
} = require('../../lib/paddocks');
const {
  ensureFeedPlanningTables,
  saveHorseFeedPlanItems,
  setHorseFeedSlotChecked,
} = require('../../lib/feed-plans');
const {
  listAdminModuleSettings,
  buildAdminModuleEnabledMap,
  assertAdminModuleEnabled,
  isAdminModuleEnabled,
  saveAdminModuleSettings,
} = require('../../lib/admin-modules');
const { ensureFarmSettingsTable, saveFarmSettings } = require('../../lib/farm-settings');
const { ensureRainRegistryTable } = require('../../lib/rain-registry');
const { ensureFrostRegistryTable } = require('../../lib/frost-registry');
const { syncWeatherIntoRainRegistry } = require('../../lib/weather-sync');
const { toIsoDateString } = require('../../lib/date-helpers');
const { requireAdminApiAuth } = require('../../lib/admin-auth');

async function getJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return req.body ? JSON.parse(req.body) : {};
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body.length > 0 ? JSON.parse(req.body.toString('utf8')) : {};
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function parsePositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parseNonNegativeNumber(value) {
  if (value == null || String(value).trim() === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseNonNegativeInteger(value) {
  if (value == null || String(value).trim() === '') {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseBooleanValue(value, fallbackValue = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (!normalized) {
    return fallbackValue;
  }

  if (['true', '1', 'yes', 'active', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'inactive', 'off'].includes(normalized)) {
    return false;
  }

  return fallbackValue;
}

function parsePositiveIntArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((entry) => parsePositiveInt(entry)).filter(Boolean))];
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

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToDateString(dateString, daysToAdd) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}

function addMonthsToDateString(dateString, monthsToAdd) {
  const [year, month, day] = String(dateString)
    .split('-')
    .map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setUTCMonth(date.getUTCMonth() + monthsToAdd);
  return date.toISOString().slice(0, 10);
}

function getModuleKeyForAdminAction(action) {
  if (
    [
      'paddock_save',
      'paddock_work_save',
      'grazing_move_in',
      'grazing_move_out',
      'grazing_group_move_in',
      'grazing_group_correct_current',
      'grazing_group_move_out',
    ].includes(action)
  ) {
    return 'paddocks';
  }

  if (['horse_group_save', 'horse_group_memberships_set'].includes(action)) {
    return 'groups';
  }

  if (
    [
      'feed_item_save',
      'feed_event_add',
      'horse_feed_plan_save',
      'horse_feed_slot_toggle',
      'feed_event_update',
      'feed_event_delete',
    ].includes(action)
  ) {
    return 'feed';
  }

  if (['deworm_event_add', 'deworm_second_dose_set'].includes(action)) {
    return 'deworm';
  }

  if (action === 'farrier_event_add') {
    return 'farrier';
  }

  if (action === 'health_event_add') {
    return 'health';
  }

  if (action === 'horse_training_set') {
    return 'training';
  }

  if (action === 'rain_save' || action === 'rain_weather_sync' || action === 'frost_save') {
    return 'rain';
  }

  return null;
}

function getFarrierDaysUntilNext(serviceType) {
  const normalized = String(serviceType || '').toLowerCase();
  if (
    normalized.includes('shoe') ||
    normalized.includes('shoes') ||
    normalized.includes('shoeing')
  ) {
    return 45;
  }
  return 60;
}

function normalizeTrainingStatus(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');

  if (!normalized) {
    return '';
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

  return '';
}

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

const ALLOWED_SEX_VALUES = new Set([
  '',
  'mare',
  'stallion',
  'gelding',
  'filly',
  'unknown',
]);

const ALLOWED_TRAINING_STATUSES = new Set(['in training', 'breaking in']);
const ALLOWED_FROST_INTENSITIES = new Set(['light', 'moderate', 'heavy']);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!requireAdminApiAuth(req, res)) {
    return;
  }

  try {
    await ensureHorseProfileColumns();
    await ensurePaddockTables();
    await ensureFarmSettingsTable();
    await ensureFeedPlanningTables();
    await ensureRainRegistryTable();
    await ensureFrostRegistryTable();

    const body = await getJsonBody(req);
    const action = String(body.action || '').trim().toLowerCase();

    if (action === 'admin_modules_save') {
      const modules = Array.isArray(body.modules) ? body.modules : [];
      const moduleSettings = await saveAdminModuleSettings(modules);

      res.status(200).json({
        ok: true,
        action,
        module_settings: moduleSettings,
      });
      return;
    }

    if (action === 'farm_settings_save') {
      const farmName = body.farmName == null ? '' : String(body.farmName).trim();
      const weatherLatitudeRaw =
        body.weatherLatitude == null ? '' : String(body.weatherLatitude).trim();
      const weatherLongitudeRaw =
        body.weatherLongitude == null ? '' : String(body.weatherLongitude).trim();
      const weatherTimezone =
        body.weatherTimezone == null ? '' : String(body.weatherTimezone).trim();
      const weatherSyncDaysRaw =
        body.weatherSyncDays == null ? '' : String(body.weatherSyncDays).trim();
      const telegramAlertChatId =
        body.telegramAlertChatId == null ? '' : String(body.telegramAlertChatId).trim();

      const weatherLatitude =
        weatherLatitudeRaw === '' ? null : Number(weatherLatitudeRaw.replace(',', '.'));
      const weatherLongitude =
        weatherLongitudeRaw === '' ? null : Number(weatherLongitudeRaw.replace(',', '.'));
      const weatherSyncDays =
        weatherSyncDaysRaw === '' ? null : Number.parseInt(weatherSyncDaysRaw, 10);

      if (weatherLatitudeRaw !== '' && (!Number.isFinite(weatherLatitude) || weatherLatitude < -90 || weatherLatitude > 90)) {
        res.status(400).json({ ok: false, error: 'weatherLatitude must be between -90 and 90' });
        return;
      }

      if (weatherLongitudeRaw !== '' && (!Number.isFinite(weatherLongitude) || weatherLongitude < -180 || weatherLongitude > 180)) {
        res.status(400).json({ ok: false, error: 'weatherLongitude must be between -180 and 180' });
        return;
      }

      if (weatherSyncDaysRaw !== '' && (!Number.isFinite(weatherSyncDays) || weatherSyncDays <= 0 || weatherSyncDays > 365)) {
        res.status(400).json({ ok: false, error: 'weatherSyncDays must be a whole number between 1 and 365' });
        return;
      }

      const data = await saveFarmSettings({
        farmName,
        weatherLatitude,
        weatherLongitude,
        weatherTimezone,
        weatherSyncDays,
        telegramAlertChatId,
      });

      res.status(200).json({
        ok: true,
        action,
        farm_settings: data,
      });
      return;
    }

    const moduleSettings = await listAdminModuleSettings();
    const enabledModules = buildAdminModuleEnabledMap(moduleSettings);
    assertAdminModuleEnabled(getModuleKeyForAdminAction(action), enabledModules);

    if (action === 'horse_add') {
      const horseName = String(body.horseName || '').trim();

      if (!horseName) {
        res.status(400).json({ ok: false, error: 'horseName is required' });
        return;
      }

      const existingHorse = await pool.query(
        `
        SELECT id, name
        FROM horses
        WHERE LOWER(name) = LOWER($1)
        LIMIT 1
        `,
        [horseName]
      );

      if (existingHorse.rows.length > 0) {
        res.status(409).json({
          ok: false,
          error: `Horse already exists: ${existingHorse.rows[0].name}`,
        });
        return;
      }

      const insertResult = await pool.query(
        `
        INSERT INTO horses (name)
        VALUES ($1)
        RETURNING
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
        `,
        [horseName]
      );

      res.status(200).json({
        ok: true,
        action,
        horse: {
          id: insertResult.rows[0].id,
          name: insertResult.rows[0].name,
          date_of_birth: toIsoDateString(insertResult.rows[0].date_of_birth),
          age_years:
            insertResult.rows[0].age_years == null
              ? null
              : Number(insertResult.rows[0].age_years),
          color: insertResult.rows[0].color || null,
          activity: insertResult.rows[0].activity || null,
          sex: insertResult.rows[0].sex || null,
          training_status: normalizeTrainingStatus(insertResult.rows[0].training_status) || null,
        },
      });
      return;
    }

    if (action === 'horse_rename') {
      const horseId = parsePositiveInt(body.horseId);
      const newName = String(body.newName || '').trim();

      if (!horseId) {
        res.status(400).json({ ok: false, error: 'horseId is required' });
        return;
      }

      if (!newName) {
        res.status(400).json({ ok: false, error: 'newName is required' });
        return;
      }

      const duplicateCheck = await pool.query(
        `
        SELECT id, name
        FROM horses
        WHERE LOWER(name) = LOWER($1)
          AND id <> $2
        LIMIT 1
        `,
        [newName, horseId]
      );

      if (duplicateCheck.rows.length > 0) {
        res.status(409).json({
          ok: false,
          error: `Another horse already uses that name: ${duplicateCheck.rows[0].name}`,
        });
        return;
      }

      const updateResult = await pool.query(
        `
        UPDATE horses
        SET name = $1
        WHERE id = $2
        RETURNING
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
        `,
        [newName, horseId]
      );

      if (updateResult.rows.length === 0) {
        res.status(404).json({ ok: false, error: 'Horse not found' });
        return;
      }

      res.status(200).json({
        ok: true,
        action,
        horse: {
          id: updateResult.rows[0].id,
          name: updateResult.rows[0].name,
          date_of_birth: toIsoDateString(updateResult.rows[0].date_of_birth),
          age_years:
            updateResult.rows[0].age_years == null
              ? null
              : Number(updateResult.rows[0].age_years),
          color: updateResult.rows[0].color || null,
          activity: updateResult.rows[0].activity || null,
          sex: updateResult.rows[0].sex || null,
          training_status: normalizeTrainingStatus(updateResult.rows[0].training_status) || null,
        },
      });
      return;
    }

    if (action === 'paddock_save') {
      const paddockName = String(body.paddockName || '').trim();
      const zone = String(body.zone || '').trim();
      const sizeHaValue = body.sizeHa == null ? '' : String(body.sizeHa).trim();
      const notes = String(body.notes || '').trim();
      const active = parseBooleanValue(body.active, true);
      const sizeHa = parseNonNegativeNumber(sizeHaValue);
      const restDaysEstimateValue =
        body.restDaysEstimate == null ? '' : String(body.restDaysEstimate).trim();
      const restDaysEstimate = parseNonNegativeInteger(restDaysEstimateValue);
      const restApplyScope =
        String(body.restApplyScope || '')
          .trim()
          .toLowerCase() || 'single';
      const rawParentPaddockId = body.parentPaddockId == null ? '' : String(body.parentPaddockId).trim();
      const parentPaddockId = rawParentPaddockId ? parsePositiveInt(rawParentPaddockId) : null;

      if (!paddockName) {
        res.status(400).json({ ok: false, error: 'paddockName is required' });
        return;
      }

      if (sizeHaValue && sizeHa == null) {
        res.status(400).json({ ok: false, error: 'sizeHa must be a number >= 0' });
        return;
      }

      if (restDaysEstimateValue && restDaysEstimate == null) {
        res.status(400).json({ ok: false, error: 'restDaysEstimate must be a whole number >= 0' });
        return;
      }

      if (!['single', 'whole_block'].includes(restApplyScope)) {
        res.status(400).json({ ok: false, error: 'restApplyScope is invalid' });
        return;
      }

      if (rawParentPaddockId && !parentPaddockId) {
        res.status(400).json({ ok: false, error: 'parentPaddockId is invalid' });
        return;
      }

      const data = await savePaddock({
        name: paddockName,
        zone: zone || null,
        sizeHa,
        notes: notes || null,
        active,
        parentPaddockId,
        manualRestDays: restDaysEstimate,
        manualRestAppliesToDescendants: restApplyScope === 'whole_block',
      });

      res.status(200).json({
        ok: true,
        action,
        mode: data.mode,
        paddock: data.paddock,
      });
      return;
    }

    if (action === 'paddock_work_save') {
      const paddockId = parsePositiveInt(body.paddockId);
      const eventType = String(body.eventType || '').trim();
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : todayDateString();
      const readyAfterDaysRaw = body.readyAfterDays == null ? '' : String(body.readyAfterDays).trim();
      const readyAfterDays = parseNonNegativeInteger(readyAfterDaysRaw);
      const notes = String(body.notes || '').trim();
      const applyScope = String(body.applyScope || '').trim().toLowerCase();
      const applyToDescendants = ['whole_block', 'children', 'descendants', 'true', '1', 'yes'].includes(
        applyScope
      );

      if (!paddockId) {
        res.status(400).json({ ok: false, error: 'paddockId is required' });
        return;
      }

      if (!eventType) {
        res.status(400).json({ ok: false, error: 'eventType is required' });
        return;
      }

      if (!isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate is invalid' });
        return;
      }

      if (readyAfterDaysRaw && readyAfterDays == null) {
        res.status(400).json({ ok: false, error: 'readyAfterDays must be a whole number >= 0' });
        return;
      }

      const data = await savePaddockWorkEvent({
        paddockId,
        eventType,
        eventDate: eventDateRaw,
        readyAfterDays,
        applyToDescendants,
        notes: notes || null,
      });

      res.status(200).json({
        ok: true,
        action,
        paddock: data.paddock,
        paddock_work_event: data.paddock_work_event,
        active_wait_event: data.active_wait_event,
      });
      return;
    }

    if (action === 'paddock_work_update') {
      const eventId = parsePositiveInt(body.eventId);
      const paddockId = parsePositiveInt(body.paddockId);
      const eventType = String(body.eventType || '').trim();
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : todayDateString();
      const readyAfterDaysRaw = body.readyAfterDays == null ? '' : String(body.readyAfterDays).trim();
      const readyAfterDays = parseNonNegativeInteger(readyAfterDaysRaw);
      const notes = String(body.notes || '').trim();
      const applyScope = String(body.applyScope || '').trim().toLowerCase();
      const applyToDescendants = ['whole_block', 'children', 'descendants', 'true', '1', 'yes'].includes(
        applyScope
      );

      if (!eventId) {
        res.status(400).json({ ok: false, error: 'eventId is required' });
        return;
      }

      if (!paddockId) {
        res.status(400).json({ ok: false, error: 'paddockId is required' });
        return;
      }

      if (!eventType) {
        res.status(400).json({ ok: false, error: 'eventType is required' });
        return;
      }

      if (!isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate is invalid' });
        return;
      }

      if (readyAfterDaysRaw && readyAfterDays == null) {
        res.status(400).json({ ok: false, error: 'readyAfterDays must be a whole number >= 0' });
        return;
      }

      const data = await updatePaddockWorkEvent({
        eventId,
        paddockId,
        eventType,
        eventDate: eventDateRaw,
        readyAfterDays,
        applyToDescendants,
        notes: notes || null,
      });

      res.status(200).json({
        ok: true,
        action,
        paddock: data.paddock,
        paddock_work_event: data.paddock_work_event,
        active_wait_event: data.active_wait_event,
      });
      return;
    }

    if (action === 'horse_group_save') {
      const groupId = parsePositiveInt(body.groupId);
      const groupName = String(body.groupName || '').trim();
      const notes = String(body.notes || '').trim();
      const active = parseBooleanValue(body.active, true);
      const rawGroupId = body.groupId == null ? '' : String(body.groupId).trim();

      if (rawGroupId && !groupId) {
        res.status(400).json({ ok: false, error: 'groupId must be a positive integer' });
        return;
      }

      if (!groupName) {
        res.status(400).json({ ok: false, error: 'groupName is required' });
        return;
      }

      const data = await saveHorseGroup({
        groupId,
        name: groupName,
        notes: notes || null,
        active,
      });

      res.status(200).json({
        ok: true,
        action,
        mode: data.mode,
        group: data.group,
      });
      return;
    }

    if (action === 'horse_group_memberships_set') {
      const groupId = parsePositiveInt(body.groupId);
      const horseIds = parsePositiveIntArray(body.horseIds);

      if (!groupId) {
        res.status(400).json({ ok: false, error: 'groupId is required' });
        return;
      }

      const data = await setHorseGroupMembers({
        groupId,
        horseIds,
      });

      res.status(200).json({
        ok: true,
        action,
        group: data.group,
        members: data.members,
        reassigned_members: data.reassigned_members,
        removed_members: data.removed_members,
      });
      return;
    }

    if (action === 'grazing_move_in') {
      const horseId = parsePositiveInt(body.horseId);
      const paddockId = parsePositiveInt(body.paddockId);
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : todayDateString();
      const notes = String(body.notes || '').trim();

      if (!horseId) {
        res.status(400).json({ ok: false, error: 'horseId is required' });
        return;
      }

      if (!paddockId) {
        res.status(400).json({ ok: false, error: 'paddockId is required' });
        return;
      }

      if (!isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate is invalid' });
        return;
      }

      const data = await moveHorseIntoPaddock({
        horseId,
        paddockId,
        enteredAt: eventDateRaw,
        entryNotes: notes || null,
        source: 'admin_panel',
      });

      res.status(200).json({
        ok: true,
        action,
        horse: data.horse,
        paddock: data.paddock,
        grazing_event: data.grazing_event,
        paddock_occupancy_count: data.paddock_occupancy_count,
      });
      return;
    }

    if (action === 'grazing_move_out') {
      const horseId = parsePositiveInt(body.horseId);
      const paddockId = body.paddockId == null ? null : parsePositiveInt(body.paddockId);
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : todayDateString();
      const notes = String(body.notes || '').trim();

      if (!horseId) {
        res.status(400).json({ ok: false, error: 'horseId is required' });
        return;
      }

      if (body.paddockId != null && !paddockId) {
        res.status(400).json({ ok: false, error: 'paddockId is invalid' });
        return;
      }

      if (!isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate is invalid' });
        return;
      }

      const data = await moveHorseOutOfPaddock({
        horseId,
        paddockId,
        exitedAt: eventDateRaw,
        exitNotes: notes || null,
      });

      res.status(200).json({
        ok: true,
        action,
        horse: data.horse,
        paddock: data.paddock,
        grazing_event: data.grazing_event,
      });
      return;
    }

    if (action === 'grazing_group_move_in') {
      const groupId = parsePositiveInt(body.groupId);
      const paddockId = parsePositiveInt(body.paddockId);
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : todayDateString();
      const notes = String(body.notes || '').trim();

      if (!groupId) {
        res.status(400).json({ ok: false, error: 'groupId is required' });
        return;
      }

      if (!paddockId) {
        res.status(400).json({ ok: false, error: 'paddockId is required' });
        return;
      }

      if (!isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate is invalid' });
        return;
      }

      const data = await moveHorseGroupIntoPaddock({
        groupId,
        paddockId,
        enteredAt: eventDateRaw,
        entryNotes: notes || null,
        source: 'admin_group',
      });

      res.status(200).json({
        ok: true,
        action,
        group: data.group,
        paddock: data.paddock,
        horses: data.horses,
        grazing_events: data.grazing_events,
        moved_count: data.moved_count,
        group_member_count: data.group_member_count,
        already_in_paddock_count: data.already_in_paddock_count,
        transferred_count: data.transferred_count,
        entered_at: data.entered_at,
        paddock_occupancy_count: data.paddock_occupancy_count,
      });
      return;
    }

    if (action === 'grazing_group_correct_current') {
      const groupId = parsePositiveInt(body.groupId);
      const paddockId = parsePositiveInt(body.paddockId);
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : todayDateString();
      const notes = String(body.notes || '').trim();

      if (!groupId) {
        res.status(400).json({ ok: false, error: 'groupId is required' });
        return;
      }

      if (!paddockId) {
        res.status(400).json({ ok: false, error: 'paddockId is required' });
        return;
      }

      if (!isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate is invalid' });
        return;
      }

      const data = await correctHorseGroupCurrentPaddock({
        groupId,
        paddockId,
        enteredAt: eventDateRaw,
        entryNotes: notes || null,
        source: 'admin_group_correction',
      });

      res.status(200).json({
        ok: true,
        action,
        group: data.group,
        paddock: data.paddock,
        horses: data.horses,
        grazing_events: data.grazing_events,
        corrected_count: data.corrected_count,
        updated_count: data.updated_count,
        inserted_count: data.inserted_count,
        unchanged_count: data.unchanged_count,
        group_member_count: data.group_member_count,
        entered_at: data.entered_at,
        paddock_occupancy_count: data.paddock_occupancy_count,
      });
      return;
    }

    if (action === 'grazing_group_move_out') {
      const groupId = parsePositiveInt(body.groupId);
      const paddockId = parsePositiveInt(body.paddockId);
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : todayDateString();
      const notes = String(body.notes || '').trim();

      if (!groupId) {
        res.status(400).json({ ok: false, error: 'groupId is required' });
        return;
      }

      if (!paddockId) {
        res.status(400).json({ ok: false, error: 'paddockId is required' });
        return;
      }

      if (!isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate is invalid' });
        return;
      }

      const data = await moveHorseGroupOutOfPaddock({
        groupId,
        paddockId,
        exitedAt: eventDateRaw,
        exitNotes: notes || null,
      });

      res.status(200).json({
        ok: true,
        action,
        group: data.group,
        paddock: data.paddock,
        horses: data.horses,
        grazing_events: data.grazing_events,
        moved_count: data.moved_count,
      });
      return;
    }

    if (action === 'feed_item_save') {
      const itemName = String(body.itemName || '').trim().toLowerCase();
      const unit = String(body.unit || '').trim().toLowerCase();
      const currentStock = Number(body.currentStock);

      if (!itemName) {
        res.status(400).json({ ok: false, error: 'itemName is required' });
        return;
      }

      if (!unit) {
        res.status(400).json({ ok: false, error: 'unit is required' });
        return;
      }

      if (!Number.isFinite(currentStock) || currentStock < 0) {
        res.status(400).json({ ok: false, error: 'currentStock is invalid' });
        return;
      }

      const existingItem = await pool.query(
        `
        SELECT id, name
        FROM feed_items
        WHERE LOWER(name) = LOWER($1)
        LIMIT 1
        `,
        [itemName]
      );

      if (existingItem.rows.length > 0) {
        const updateResult = await pool.query(
          `
          UPDATE feed_items
          SET current_stock = $1,
              unit = $2
          WHERE id = $3
          RETURNING id, name, unit, current_stock
          `,
          [currentStock, unit, existingItem.rows[0].id]
        );

        res.status(200).json({
          ok: true,
          action,
          mode: 'updated',
          feed_item: {
            ...updateResult.rows[0],
            current_stock: Number(updateResult.rows[0].current_stock),
          },
        });
        return;
      }

      const insertResult = await pool.query(
        `
        INSERT INTO feed_items (name, unit, current_stock)
        VALUES ($1, $2, $3)
        RETURNING id, name, unit, current_stock
        `,
        [itemName, unit, currentStock]
      );

      res.status(200).json({
        ok: true,
        action,
        mode: 'created',
        feed_item: {
          ...insertResult.rows[0],
          current_stock: Number(insertResult.rows[0].current_stock),
        },
      });
      return;
    }

    if (action === 'feed_event_add') {
      const horseId = parsePositiveInt(body.horseId);
      const itemName = String(body.itemName || '').trim().toLowerCase();
      const quantity = Number(body.quantity);
      const unit = String(body.unit || '').trim().toLowerCase();
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : todayDateString();

      if (!horseId) {
        res.status(400).json({ ok: false, error: 'horseId is required' });
        return;
      }

      if (!itemName) {
        res.status(400).json({ ok: false, error: 'itemName is required' });
        return;
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        res.status(400).json({ ok: false, error: 'quantity must be greater than 0' });
        return;
      }

      if (!unit) {
        res.status(400).json({ ok: false, error: 'unit is required' });
        return;
      }

      if (!isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate must be YYYY-MM-DD' });
        return;
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
          `,
          [horseId]
        );

        if (horseResult.rows.length === 0) {
          await client.query('ROLLBACK');
          res.status(404).json({ ok: false, error: 'Horse not found' });
          return;
        }

        const feedItemResult = await client.query(
          `
          SELECT id, name, unit, current_stock
          FROM feed_items
          WHERE LOWER(name) = LOWER($1)
          LIMIT 1
          FOR UPDATE
          `,
          [itemName]
        );

        if (feedItemResult.rows.length === 0) {
          await client.query('ROLLBACK');
          res.status(404).json({ ok: false, error: `Feed item not found: ${itemName}` });
          return;
        }

        const feedItem = feedItemResult.rows[0];

        if (String(feedItem.unit || '').toLowerCase() !== unit) {
          await client.query('ROLLBACK');
          res.status(400).json({ ok: false, error: `Unit mismatch. Expected ${feedItem.unit}` });
          return;
        }

        if (Number(feedItem.current_stock) < quantity) {
          await client.query('ROLLBACK');
          res.status(400).json({
            ok: false,
            error: `Not enough stock. ${feedItem.name} has ${feedItem.current_stock} ${feedItem.unit}`,
          });
          return;
        }

        const feedEventResult = await client.query(
          `
          INSERT INTO feed_events (
            horse_id,
            feed_item_id,
            quantity,
            unit,
            telegram_user_id,
            event_date
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, event_date
          `,
          [horseId, feedItem.id, quantity, unit, 'admin_panel', eventDateRaw]
        );

        const stockResult = await client.query(
          `
          UPDATE feed_items
          SET current_stock = current_stock - $1
          WHERE id = $2
          RETURNING current_stock
          `,
          [quantity, feedItem.id]
        );

        await client.query('COMMIT');

        res.status(200).json({
          ok: true,
          action,
          horse: {
            id: horseResult.rows[0].id,
            name: horseResult.rows[0].name,
          },
          feed_item: {
            id: feedItem.id,
            name: feedItem.name,
            unit: feedItem.unit,
          },
          feed_event: {
            id: feedEventResult.rows[0].id,
            event_date: toIsoDateString(feedEventResult.rows[0].event_date),
            quantity,
            unit,
          },
          stock: {
            current_stock: Number(stockResult.rows[0].current_stock),
            unit: feedItem.unit,
          },
        });
        return;
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (_rollbackError) {
          // no-op
        }
        throw error;
      } finally {
        client.release();
      }
    }

    if (action === 'horse_feed_plan_save') {
      const horseId = parsePositiveInt(body.horseId);
      const items = Array.isArray(body.items) ? body.items : [];

      if (!horseId) {
        res.status(400).json({ ok: false, error: 'horseId is required' });
        return;
      }

      const data = await saveHorseFeedPlanItems({
        horseId,
        items,
      });

      res.status(200).json({
        ok: true,
        action,
        horse: data.horse,
        feed_plan: {
          items: data.plan_items,
        },
      });
      return;
    }

    if (action === 'horse_feed_slot_toggle') {
      const horseId = parsePositiveInt(body.horseId);
      const feedSlot = String(body.feedSlot || '').trim().toLowerCase();
      const eventDate = body.eventDate ? String(body.eventDate).trim() : '';
      const checked = parseBooleanValue(body.checked, false);

      if (!horseId) {
        res.status(400).json({ ok: false, error: 'horseId is required' });
        return;
      }

      if (!eventDate) {
        res.status(400).json({ ok: false, error: 'eventDate is required' });
        return;
      }

      if (!isValidDateString(eventDate)) {
        res.status(400).json({ ok: false, error: 'eventDate must be YYYY-MM-DD' });
        return;
      }

      const data = await setHorseFeedSlotChecked({
        horseId,
        eventDate,
        feedSlot,
        checked,
        telegramUserId: 'admin_panel',
      });

      res.status(200).json({
        ok: true,
        action,
        horse: data.horse,
        checked: data.checked,
        entry: data.entry,
        feed_events: data.feed_events,
        stock_changes: data.stock_changes,
      });
      return;
    }

    if (action === 'deworm_event_add') {
      const horseId = parsePositiveInt(body.horseId);
      const productName = String(body.productName || '').trim();
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : todayDateString();
      const secondDoseDateRaw = body.secondDoseDate
        ? String(body.secondDoseDate).trim()
        : '';
      const nextDueDateRaw = body.nextDueDate ? String(body.nextDueDate).trim() : '';

      if (!horseId) {
        res.status(400).json({ ok: false, error: 'horseId is required' });
        return;
      }

      if (!productName) {
        res.status(400).json({ ok: false, error: 'productName is required' });
        return;
      }

      if (!isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate must be YYYY-MM-DD' });
        return;
      }

      if (secondDoseDateRaw && !isValidDateString(secondDoseDateRaw)) {
        res.status(400).json({ ok: false, error: 'secondDoseDate must be YYYY-MM-DD' });
        return;
      }

      if (nextDueDateRaw && !isValidDateString(nextDueDateRaw)) {
        res.status(400).json({ ok: false, error: 'nextDueDate must be YYYY-MM-DD' });
        return;
      }

      let nextDueDate = nextDueDateRaw;
      if (!nextDueDate) {
        if (secondDoseDateRaw) {
          nextDueDate = addMonthsToDateString(secondDoseDateRaw, 3);
        } else {
          nextDueDate = addDaysToDateString(eventDateRaw, 20);
        }
      }

      if (!nextDueDate || !isValidDateString(nextDueDate)) {
        res.status(400).json({ ok: false, error: 'Could not calculate next due date' });
        return;
      }

      const horseResult = await pool.query(
        `
        SELECT id, name
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

      const existingCycleResult = await pool.query(
        `
        SELECT
          id,
          event_date,
          second_dose_date,
          next_due_date
        FROM deworming_events
        WHERE horse_id = $1
          AND LOWER(product_name) = LOWER($2)
          AND event_date = $3
        ORDER BY
          CASE WHEN second_dose_date IS NULL THEN 1 ELSE 0 END ASC,
          id DESC
        `,
        [horseId, productName, eventDateRaw]
      );

      let saveResult = null;

      if (existingCycleResult.rows.length > 0) {
        const primary = existingCycleResult.rows[0];
        const existingSecondDose = toIsoDateString(primary.second_dose_date);
        const mergedSecondDose = secondDoseDateRaw || existingSecondDose || null;
        const mergedNextDue =
          nextDueDateRaw ||
          (mergedSecondDose
            ? addMonthsToDateString(mergedSecondDose, 3)
            : addDaysToDateString(eventDateRaw, 20));

        saveResult = await pool.query(
          `
          UPDATE deworming_events
          SET
            product_name = $1,
            second_dose_date = $2,
            next_due_date = $3
          WHERE id = $4
          RETURNING id, event_date, second_dose_date, next_due_date
          `,
          [productName, mergedSecondDose, mergedNextDue, primary.id]
        );

        const duplicateIds = existingCycleResult.rows
          .slice(1)
          .map((row) => Number(row.id))
          .filter((id) => Number.isFinite(id));

        if (duplicateIds.length > 0) {
          await pool.query(
            `
            DELETE FROM deworming_events
            WHERE id = ANY($1::int[])
            `,
            [duplicateIds]
          );
        }
      } else {
        saveResult = await pool.query(
          `
          INSERT INTO deworming_events (
            horse_id,
            product_name,
            telegram_user_id,
            event_date,
            second_dose_date,
            next_due_date
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, event_date, second_dose_date, next_due_date
          `,
          [
            horseId,
            productName,
            'admin_panel',
            eventDateRaw,
            secondDoseDateRaw || null,
            nextDueDate,
          ]
        );
      }

      res.status(200).json({
        ok: true,
        action,
        horse: {
          id: horseResult.rows[0].id,
          name: horseResult.rows[0].name,
        },
        deworming_event: {
          id: saveResult.rows[0].id,
          product_name: productName,
          event_date: toIsoDateString(saveResult.rows[0].event_date),
          second_dose_date: toIsoDateString(saveResult.rows[0].second_dose_date),
          next_due_date: toIsoDateString(saveResult.rows[0].next_due_date),
        },
      });
      return;
    }

    if (action === 'deworm_second_dose_set') {
      const horseId = parsePositiveInt(body.horseId);
      const productName = String(body.productName || '').trim();
      const secondDoseDateRaw = body.secondDoseDate
        ? String(body.secondDoseDate).trim()
        : todayDateString();

      if (!horseId) {
        res.status(400).json({ ok: false, error: 'horseId is required' });
        return;
      }

      if (!productName) {
        res.status(400).json({ ok: false, error: 'productName is required' });
        return;
      }

      if (!isValidDateString(secondDoseDateRaw)) {
        res.status(400).json({ ok: false, error: 'secondDoseDate must be YYYY-MM-DD' });
        return;
      }

      const nextDueDate = addMonthsToDateString(secondDoseDateRaw, 3);
      if (!nextDueDate || !isValidDateString(nextDueDate)) {
        res.status(400).json({ ok: false, error: 'Could not calculate next due date' });
        return;
      }

      const horseResult = await pool.query(
        `
        SELECT id, name
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

      const latestDewormResult = await pool.query(
        `
        SELECT
          id,
          product_name,
          event_date,
          second_dose_date
        FROM deworming_events
        WHERE horse_id = $1
          AND LOWER(product_name) = LOWER($2)
        ORDER BY
          CASE WHEN second_dose_date IS NULL THEN 0 ELSE 1 END ASC,
          COALESCE(event_date, created_at::date) DESC,
          id DESC
        LIMIT 1
        `,
        [horseId, productName]
      );

      if (latestDewormResult.rows.length === 0) {
        res.status(404).json({
          ok: false,
          error: `No deworming event found for ${horseResult.rows[0].name} with product ${productName}`,
        });
        return;
      }

      const targetEvent = latestDewormResult.rows[0];
      const updateResult = await pool.query(
        `
        UPDATE deworming_events
        SET
          second_dose_date = $1,
          next_due_date = $2
        WHERE id = $3
        RETURNING id, product_name, event_date, second_dose_date, next_due_date
        `,
        [secondDoseDateRaw, nextDueDate, targetEvent.id]
      );

      res.status(200).json({
        ok: true,
        action,
        horse: {
          id: horseResult.rows[0].id,
          name: horseResult.rows[0].name,
        },
        deworming_event: {
          id: updateResult.rows[0].id,
          product_name: updateResult.rows[0].product_name,
          event_date: toIsoDateString(updateResult.rows[0].event_date),
          second_dose_date: toIsoDateString(updateResult.rows[0].second_dose_date),
          next_due_date: toIsoDateString(updateResult.rows[0].next_due_date),
        },
      });
      return;
    }

    if (action === 'farrier_event_add') {
      const horseId = parsePositiveInt(body.horseId);
      const serviceType = String(body.serviceType || '').trim();
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : todayDateString();
      const nextDueDateRaw = body.nextDueDate ? String(body.nextDueDate).trim() : '';

      if (!horseId) {
        res.status(400).json({ ok: false, error: 'horseId is required' });
        return;
      }

      if (!serviceType) {
        res.status(400).json({ ok: false, error: 'serviceType is required' });
        return;
      }

      if (!isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate must be YYYY-MM-DD' });
        return;
      }

      if (nextDueDateRaw && !isValidDateString(nextDueDateRaw)) {
        res.status(400).json({ ok: false, error: 'nextDueDate must be YYYY-MM-DD' });
        return;
      }

      let nextDueDate = nextDueDateRaw;
      if (!nextDueDate) {
        nextDueDate = addDaysToDateString(eventDateRaw, getFarrierDaysUntilNext(serviceType));
      }

      if (!nextDueDate || !isValidDateString(nextDueDate)) {
        res.status(400).json({ ok: false, error: 'Could not calculate next due date' });
        return;
      }

      const horseResult = await pool.query(
        `
        SELECT id, name
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

      const insertResult = await pool.query(
        `
        INSERT INTO farrier_events (
          horse_id,
          service_type,
          telegram_user_id,
          event_date,
          next_due_date
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, event_date, next_due_date
        `,
        [horseId, serviceType, 'admin_panel', eventDateRaw, nextDueDate]
      );

      res.status(200).json({
        ok: true,
        action,
        horse: {
          id: horseResult.rows[0].id,
          name: horseResult.rows[0].name,
        },
        farrier_event: {
          id: insertResult.rows[0].id,
          service_type: serviceType,
          event_date: toIsoDateString(insertResult.rows[0].event_date),
          next_due_date: toIsoDateString(insertResult.rows[0].next_due_date),
        },
      });
      return;
    }

    if (action === 'health_event_add') {
      const horseId = parsePositiveInt(body.horseId);
      const eventType = String(body.eventType || '').trim().toLowerCase();
      const description = String(body.description || '').trim();
      const notes = body.notes ? String(body.notes).trim() : '';
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : todayDateString();

      if (!horseId) {
        res.status(400).json({ ok: false, error: 'horseId is required' });
        return;
      }

      if (!eventType) {
        res.status(400).json({ ok: false, error: 'eventType is required' });
        return;
      }

      if (!description) {
        res.status(400).json({ ok: false, error: 'description is required' });
        return;
      }

      if (!isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate must be YYYY-MM-DD' });
        return;
      }

      const horseResult = await pool.query(
        `
        SELECT id, name
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

      const insertResult = await pool.query(
        `
        INSERT INTO horse_health_events (
          horse_id,
          event_type,
          description,
          event_date,
          notes,
          telegram_user_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, event_date
        `,
        [horseId, eventType, description, eventDateRaw, notes || null, 'admin_panel']
      );

      res.status(200).json({
        ok: true,
        action,
        horse: {
          id: horseResult.rows[0].id,
          name: horseResult.rows[0].name,
        },
        health_event: {
          id: insertResult.rows[0].id,
          event_type: eventType,
          description,
          notes: notes || null,
          event_date: toIsoDateString(insertResult.rows[0].event_date),
        },
      });
      return;
    }

    if (action === 'rain_save') {
      const rainMm = Number(body.rainMm);
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : todayDateString();
      const notes = body.notes ? String(body.notes).trim() : '';

      if (!Number.isFinite(rainMm) || rainMm < 0) {
        res.status(400).json({ ok: false, error: 'rainMm must be a number >= 0' });
        return;
      }

      if (!isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate must be YYYY-MM-DD' });
        return;
      }

      const saveResult = await pool.query(
        `
        INSERT INTO rain_registry (
          event_date,
          rain_mm,
          source,
          notes,
          telegram_user_id
        )
        VALUES ($1, $2, 'admin_panel', $3, $4)
        ON CONFLICT (event_date) DO UPDATE
        SET rain_mm = EXCLUDED.rain_mm,
            source = EXCLUDED.source,
            notes = EXCLUDED.notes,
            telegram_user_id = EXCLUDED.telegram_user_id,
            updated_at = NOW()
        RETURNING
          id,
          event_date,
          rain_mm,
          source,
          notes
        `,
        [eventDateRaw, rainMm, notes || null, 'admin_panel']
      );

      const row = saveResult.rows[0];
      res.status(200).json({
        ok: true,
        action,
        rain: {
          id: row.id,
          event_date: toIsoDateString(row.event_date),
          rain_mm: Number(row.rain_mm),
          source: row.source || null,
          notes: row.notes || null,
        },
      });
      return;
    }

    if (action === 'frost_save') {
      const intensity = String(body.intensity || '')
        .trim()
        .toLowerCase();
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : todayDateString();
      const notes = body.notes ? String(body.notes).trim() : '';

      if (!ALLOWED_FROST_INTENSITIES.has(intensity)) {
        res.status(400).json({ ok: false, error: 'intensity must be light, moderate, or heavy' });
        return;
      }

      if (!isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate must be YYYY-MM-DD' });
        return;
      }

      const saveResult = await pool.query(
        `
        INSERT INTO frost_registry (
          event_date,
          intensity,
          source,
          notes,
          telegram_user_id
        )
        VALUES ($1, $2, 'admin_panel', $3, $4)
        ON CONFLICT (event_date) DO UPDATE
        SET intensity = EXCLUDED.intensity,
            source = EXCLUDED.source,
            notes = EXCLUDED.notes,
            telegram_user_id = EXCLUDED.telegram_user_id,
            updated_at = NOW()
        RETURNING
          id,
          event_date,
          intensity,
          source,
          notes
        `,
        [eventDateRaw, intensity, notes || null, 'admin_panel']
      );

      const row = saveResult.rows[0];
      res.status(200).json({
        ok: true,
        action,
        frost: {
          id: row.id,
          event_date: toIsoDateString(row.event_date),
          intensity: row.intensity,
          source: row.source || null,
          notes: row.notes || null,
        },
      });
      return;
    }

    if (action === 'rain_weather_sync') {
      const data = await syncWeatherIntoRainRegistry();

      res.status(200).json({
        ok: true,
        action,
        weather_sync: {
          inserted_count: data.insertedCount,
          updated_count: data.updatedCount,
          row_count: data.rowCount,
          start_date: data.startDate,
          end_date: data.endDate,
          latitude: data.config.latitude,
          longitude: data.config.longitude,
          timezone: data.config.timezone,
          lookback_days: data.config.lookbackDays,
        },
      });
      return;
    }

    if (action === 'feed_event_update') {
      const feedEventId = parsePositiveInt(body.feedEventId);
      const horseId = body.horseId == null ? null : parsePositiveInt(body.horseId);
      const quantity = Number(body.quantity);
      const eventDateRaw = body.eventDate ? String(body.eventDate).trim() : '';

      if (!feedEventId) {
        res.status(400).json({ ok: false, error: 'feedEventId is required' });
        return;
      }

      if (body.horseId != null && !horseId) {
        res.status(400).json({ ok: false, error: 'horseId is invalid' });
        return;
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        res.status(400).json({ ok: false, error: 'quantity must be greater than 0' });
        return;
      }

      if (eventDateRaw && !isValidDateString(eventDateRaw)) {
        res.status(400).json({ ok: false, error: 'eventDate must be YYYY-MM-DD' });
        return;
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const feedEventResult = await client.query(
          `
          SELECT
            f.id,
            f.horse_id,
            f.feed_item_id,
            f.quantity,
            f.unit,
            f.event_date,
            f.calendar_slot_entry_id,
            f.stock_deducted,
            i.name AS feed_item_name,
            i.current_stock
          FROM feed_events f
          JOIN feed_items i ON i.id = f.feed_item_id
          WHERE f.id = $1
          FOR UPDATE OF f, i
          `,
          [feedEventId]
        );

        if (feedEventResult.rows.length === 0) {
          await client.query('ROLLBACK');
          res.status(404).json({ ok: false, error: 'Feed event not found' });
          return;
        }

        const eventRow = feedEventResult.rows[0];
        if (horseId && Number(eventRow.horse_id) !== horseId) {
          await client.query('ROLLBACK');
          res.status(400).json({ ok: false, error: 'feedEventId does not belong to selected horse' });
          return;
        }

        if (eventRow.calendar_slot_entry_id != null) {
          await client.query('ROLLBACK');
          res.status(409).json({
            ok: false,
            error: 'This feed entry is managed by the feed calendar. Change it from the calendar instead.',
          });
          return;
        }

        const previousQuantity = Number(eventRow.quantity);
        const currentStock = Number(eventRow.current_stock);
        const adjustedStock = eventRow.stock_deducted
          ? currentStock + previousQuantity - quantity
          : currentStock;

        if (eventRow.stock_deducted && (!Number.isFinite(adjustedStock) || adjustedStock < 0)) {
          await client.query('ROLLBACK');
          res.status(400).json({
            ok: false,
            error: `Not enough stock for this correction. ${eventRow.feed_item_name} has ${currentStock} ${eventRow.unit}`,
          });
          return;
        }

        const nextEventDate =
          eventDateRaw || toIsoDateString(eventRow.event_date);

        if (eventRow.stock_deducted) {
          await client.query(
            `
            UPDATE feed_items
            SET current_stock = $1
            WHERE id = $2
            `,
            [adjustedStock, eventRow.feed_item_id]
          );
        }

        const updatedFeedEventResult = await client.query(
          `
          UPDATE feed_events
          SET quantity = $1,
              event_date = $2
          WHERE id = $3
          RETURNING id, horse_id, feed_item_id, quantity, unit, event_date
          `,
          [quantity, nextEventDate, feedEventId]
        );

        await client.query('COMMIT');

        const updatedRow = updatedFeedEventResult.rows[0];
        res.status(200).json({
          ok: true,
          action,
          feed_event: {
            id: updatedRow.id,
            horse_id: updatedRow.horse_id,
            feed_item_id: updatedRow.feed_item_id,
            quantity: Number(updatedRow.quantity),
            unit: updatedRow.unit,
            event_date: toIsoDateString(updatedRow.event_date),
          },
          stock: {
            feed_item_name: eventRow.feed_item_name,
            current_stock: adjustedStock,
            unit: eventRow.unit,
          },
        });
        return;
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (_rollbackError) {
          // no-op
        }
        throw error;
      } finally {
        client.release();
      }
    }

    if (action === 'feed_event_delete') {
      const feedEventId = parsePositiveInt(body.feedEventId);
      const horseId = body.horseId == null ? null : parsePositiveInt(body.horseId);

      if (!feedEventId) {
        res.status(400).json({ ok: false, error: 'feedEventId is required' });
        return;
      }

      if (body.horseId != null && !horseId) {
        res.status(400).json({ ok: false, error: 'horseId is invalid' });
        return;
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const feedEventResult = await client.query(
          `
          SELECT
            f.id,
            f.horse_id,
            f.feed_item_id,
            f.quantity,
            f.unit,
            f.calendar_slot_entry_id,
            f.stock_deducted,
            i.name AS feed_item_name,
            i.current_stock
          FROM feed_events f
          JOIN feed_items i ON i.id = f.feed_item_id
          WHERE f.id = $1
          FOR UPDATE OF f, i
          `,
          [feedEventId]
        );

        if (feedEventResult.rows.length === 0) {
          await client.query('ROLLBACK');
          res.status(404).json({ ok: false, error: 'Feed event not found' });
          return;
        }

        const eventRow = feedEventResult.rows[0];
        if (horseId && Number(eventRow.horse_id) !== horseId) {
          await client.query('ROLLBACK');
          res.status(400).json({ ok: false, error: 'feedEventId does not belong to selected horse' });
          return;
        }

        if (eventRow.calendar_slot_entry_id != null) {
          await client.query('ROLLBACK');
          res.status(409).json({
            ok: false,
            error: 'This feed entry is managed by the feed calendar. Change it from the calendar instead.',
          });
          return;
        }

        const restoredStock = eventRow.stock_deducted
          ? Number(eventRow.current_stock) + Number(eventRow.quantity)
          : Number(eventRow.current_stock);

        if (eventRow.stock_deducted) {
          await client.query(
            `
            UPDATE feed_items
            SET current_stock = $1
            WHERE id = $2
            `,
            [restoredStock, eventRow.feed_item_id]
          );
        }

        await client.query('DELETE FROM feed_events WHERE id = $1', [feedEventId]);
        await client.query('COMMIT');

        res.status(200).json({
          ok: true,
          action,
          deleted_feed_event_id: feedEventId,
          stock: {
            feed_item_name: eventRow.feed_item_name,
            current_stock: restoredStock,
            unit: eventRow.unit,
          },
        });
        return;
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (_rollbackError) {
          // no-op
        }
        throw error;
      } finally {
        client.release();
      }
    }

    if (action === 'horse_training_set') {
      const horseId = parsePositiveInt(body.horseId);
      const trainingStatusRaw = body.trainingStatus == null ? '' : String(body.trainingStatus);
      const trainingStatus = normalizeTrainingStatus(trainingStatusRaw);

      if (!horseId) {
        res.status(400).json({ ok: false, error: 'horseId is required' });
        return;
      }

      if (trainingStatusRaw.trim() && !ALLOWED_TRAINING_STATUSES.has(trainingStatus)) {
        res.status(400).json({
          ok: false,
          error:
            'trainingStatus must be one of: in training, breaking in (accepted aliases: training, breaking)',
        });
        return;
      }

      const updateResult = await pool.query(
        `
        UPDATE horses
        SET training_status = $1
        WHERE id = $2
        RETURNING
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
        `,
        [trainingStatus || null, horseId]
      );

      if (updateResult.rows.length === 0) {
        res.status(404).json({ ok: false, error: 'Horse not found' });
        return;
      }

      const horse = updateResult.rows[0];

      res.status(200).json({
        ok: true,
        action,
        horse: {
          id: horse.id,
          name: horse.name,
          date_of_birth: toIsoDateString(horse.date_of_birth),
          age_years: horse.age_years == null ? null : Number(horse.age_years),
          color: horse.color || null,
          activity: horse.activity || null,
          sex: horse.sex || null,
          training_status: normalizeTrainingStatus(horse.training_status) || null,
        },
      });
      return;
    }

    if (action === 'horse_profile_save') {
      const horseId = parsePositiveInt(body.horseId);
      const horseName = String(body.horseName || '').trim();
      const dateOfBirthRaw = body.dateOfBirth ? String(body.dateOfBirth).trim() : '';
      const color = body.color ? String(body.color).trim() : '';
      const activity = body.activity ? String(body.activity).trim().toLowerCase() : '';
      const sex = body.sex ? String(body.sex).trim().toLowerCase() : '';
      const trainingModuleEnabled = isAdminModuleEnabled('training', enabledModules);
      const trainingStatusRaw = body.trainingStatus == null ? '' : String(body.trainingStatus);
      const trainingStatus = normalizeTrainingStatus(trainingStatusRaw);

      if (!horseId) {
        res.status(400).json({ ok: false, error: 'horseId is required' });
        return;
      }

      if (!horseName) {
        res.status(400).json({ ok: false, error: 'horseName is required' });
        return;
      }

      if (looksLikeDateString(dateOfBirthRaw) && !isValidDateString(dateOfBirthRaw)) {
        res.status(400).json({ ok: false, error: 'dateOfBirth is not a valid calendar date' });
        return;
      }

      if (dateOfBirthRaw && !isValidDateString(dateOfBirthRaw)) {
        res.status(400).json({ ok: false, error: 'dateOfBirth must be YYYY-MM-DD' });
        return;
      }

      if (!ALLOWED_COLORS.has(color)) {
        res.status(400).json({
          ok: false,
          error:
            'color must be one of: bay, gray, black, chestnut, dune, dark bay, blue roan',
        });
        return;
      }

      if (!ALLOWED_ACTIVITIES.has(activity)) {
        res.status(400).json({
          ok: false,
          error:
            'activity must be one of: foal, colt, broke horse, new horse, polo pony, ranch horse, brood stallion, brood mare',
        });
        return;
      }

      if (!ALLOWED_SEX_VALUES.has(sex)) {
        res.status(400).json({
          ok: false,
          error: 'sex must be one of: mare, stallion, gelding, filly, unknown',
        });
        return;
      }

      if (
        trainingModuleEnabled &&
        trainingStatusRaw.trim() &&
        !ALLOWED_TRAINING_STATUSES.has(trainingStatus)
      ) {
        res.status(400).json({
          ok: false,
          error:
            'trainingStatus must be one of: in training, breaking in (accepted aliases: training, breaking)',
        });
        return;
      }

      const duplicateCheck = await pool.query(
        `
        SELECT id, name
        FROM horses
        WHERE LOWER(name) = LOWER($1)
          AND id <> $2
        LIMIT 1
        `,
        [horseName, horseId]
      );

      if (duplicateCheck.rows.length > 0) {
        res.status(409).json({
          ok: false,
          error: `Another horse already uses that name: ${duplicateCheck.rows[0].name}`,
        });
        return;
      }

      const updateResult = await pool.query(
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
        RETURNING
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
        `,
        [
          horseName,
          dateOfBirthRaw || null,
          color || null,
          activity || null,
          sex || null,
          trainingModuleEnabled,
          trainingModuleEnabled ? trainingStatus || null : null,
          horseId,
        ]
      );

      if (updateResult.rows.length === 0) {
        res.status(404).json({ ok: false, error: 'Horse not found' });
        return;
      }

      const horse = updateResult.rows[0];

      res.status(200).json({
        ok: true,
        action,
        horse: {
          id: horse.id,
          name: horse.name,
          date_of_birth: toIsoDateString(horse.date_of_birth),
          age_years: horse.age_years == null ? null : Number(horse.age_years),
          color: horse.color || null,
          activity: horse.activity || null,
          sex: horse.sex || null,
          training_status:
            trainingModuleEnabled && normalizeTrainingStatus(horse.training_status)
              ? normalizeTrainingStatus(horse.training_status)
              : null,
        },
      });
      return;
    }

      res.status(400).json({
        ok: false,
        error:
        'Unsupported action. Use horse_add, horse_rename, paddock_save, paddock_work_save, paddock_work_update, horse_group_save, horse_group_memberships_set, grazing_move_in, grazing_move_out, grazing_group_move_in, grazing_group_correct_current, grazing_group_move_out, feed_item_save, feed_event_add, horse_feed_plan_save, horse_feed_slot_toggle, deworm_event_add, deworm_second_dose_set, farrier_event_add, health_event_add, horse_training_set, rain_save, frost_save, rain_weather_sync, farm_settings_save, feed_event_update, feed_event_delete, horse_profile_save, or admin_modules_save.',
      });
  } catch (error) {
    console.error('ADMIN DATA MUTATE ERROR:', error);
    if (error?.statusCode) {
      res.status(error.statusCode).json({ ok: false, error: error.message });
      return;
    }
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
