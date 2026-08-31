require('dotenv').config();

const { Telegraf } = require('telegraf');
const { pool } = require('./lib/db');
const { ensureHorseProfileColumns } = require('./lib/horse-profile');
const { getFarmSettings, saveFarmAlertChatId } = require('./lib/farm-settings');
const { ensureFarmVisitsTable, updateFarmVisitStatus } = require('./lib/farm-visits');
const {
  ensurePaddockTables,
  findPaddockByName,
  listPaddockNames,
  savePaddock,
  savePaddockWorkEvent,
  updatePaddockWorkEvent,
  extendPaddockReadyDate,
  findHorseGroupByName,
  listHorseGroups,
  saveHorseGroup,
  setHorseGroupMembers,
  moveHorseIntoPaddock,
  moveHorseOutOfPaddock,
  moveHorseGroupIntoPaddock,
  correctHorseGroupCurrentPaddock,
  moveHorseGroupOutOfPaddock,
  setGroupSharedPaddocks,
  listPaddockStatus,
  listPaddockWorkHistory,
  listGrazingHistory,
  getHorseCurrentGrazing,
} = require('./lib/paddocks');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

function parsePositiveInt(value, fallbackValue) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
}

const DEWORM_ALERT_DAYS_AHEAD = parsePositiveInt(process.env.DEWORM_ALERT_DAYS_AHEAD, 3);
const SCHEDULE_ALERT_DAYS_AHEAD = parsePositiveInt(process.env.SCHEDULE_ALERT_DAYS_AHEAD, 3);
const LOW_STOCK_THRESHOLD = parsePositiveInt(process.env.LOW_STOCK_THRESHOLD, 5);
const ALERT_CHECK_INTERVAL_MINUTES = parsePositiveInt(
  process.env.ALERT_CHECK_INTERVAL_MINUTES,
  60
);
const ALERT_CHECK_INTERVAL_MS = ALERT_CHECK_INTERVAL_MINUTES * 60 * 1000;
let alertChatId = process.env.TELEGRAM_ALERT_CHAT_ID || null;

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function looksLikeDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseCompactQuantityUnit(value) {
  const match = String(value).match(/^([+-]?\d+(?:\.\d+)?)([a-zA-Z]+)$/);
  if (!match) {
    return null;
  }

  return {
    quantity: Number(match[1]),
    unit: match[2].toLowerCase(),
  };
}

function formatDateForReply(dateValue) {
  if (!dateValue) return 'N/A';
  if (dateValue instanceof Date) {
    return dateValue.toISOString().slice(0, 10);
  }
  return String(dateValue).slice(0, 10);
}

function formatDateTimeForReply(dateValue) {
  if (!dateValue) return 'N/A';

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toISOString().slice(0, 16).replace('T', ' ');
}

function formatDateWithWeekdayForReply(dateValue) {
  if (!dateValue) return 'N/A';

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  const weekday = date.toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
  const isoDate = date.toISOString().slice(0, 10);

  return `${weekday} ${isoDate}`;
}

function formatDateTimeWithWeekdayForReply(dateValue) {
  if (!dateValue) return 'N/A';

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  const weekday = date.toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
  const isoDateTime = date.toISOString().slice(0, 16).replace('T', ' ');

  return `${weekday} ${isoDateTime}`;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeTrainingStatusForReply(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');

  if (!normalized) {
    return 'N/A';
  }

  if (normalized === 'in training' || normalized === 'training' || normalized === 'intraining') {
    return 'In Training';
  }

  if (
    normalized === 'breaking in' ||
    normalized === 'breaking' ||
    normalized === 'break in' ||
    normalized === 'breakingin' ||
    normalized === 'for breaking in' ||
    normalized === 'horse for breaking in'
  ) {
    return 'Breaking In';
  }

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildHorseProfileBlockForReply(horseProfile) {
  if (!horseProfile) {
    return '';
  }

  return `Profile
- date of birth: ${formatDateForReply(horseProfile.date_of_birth)}
- age: ${horseProfile.age_years == null ? 'N/A' : horseProfile.age_years}
- color: ${horseProfile.color || 'N/A'}
- activity: ${horseProfile.activity || 'N/A'}
- sex: ${horseProfile.sex || 'N/A'}
- training status: ${normalizeTrainingStatusForReply(horseProfile.training_status)}`;
}

function addDaysToDateString(dateString, daysToAdd) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}

function addMonthsToDateString(dateString, monthsToAdd) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCMonth(date.getUTCMonth() + monthsToAdd);
  return date.toISOString().slice(0, 10);
}

function getFarrierDaysUntilNext(serviceType) {
  const normalized = serviceType.toLowerCase();

  if (
    normalized.includes('shoe') ||
    normalized.includes('shoes') ||
    normalized.includes('shoeing')
  ) {
    return 45;
  }

  return 60;
}

function buildDewormReminderGroups(rows, daysAhead) {
  const today = todayDateString();
  const soonLimit = addDaysToDateString(today, daysAhead);
  const overdue = [];
  const dueSoon = [];

  for (const row of rows) {
    const nextDue = formatDateForReply(row.next_due_date);
    const line = `- ${row.horse_name} | due: ${nextDue} | product: ${row.product_name}`;

    if (nextDue < today) {
      overdue.push({
        key: `deworm:${row.horse_id}:${nextDue}`,
        line,
      });
      continue;
    }

    if (nextDue >= today && nextDue <= soonLimit) {
      dueSoon.push({
        key: `deworm:${row.horse_id}:${nextDue}`,
        line,
      });
    }
  }

  return { overdue, dueSoon };
}

async function getLatestDewormRows() {
  const result = await pool.query(
    `
    WITH latest AS (
      SELECT DISTINCT ON (d.horse_id)
        d.horse_id,
        h.name AS horse_name,
        d.product_name,
        d.next_due_date
      FROM deworming_events d
      JOIN horses h ON h.id = d.horse_id
      WHERE d.next_due_date IS NOT NULL
      ORDER BY
        d.horse_id,
        COALESCE(d.event_date, d.created_at::date) DESC,
        d.id DESC
    )
    SELECT
      horse_id,
      horse_name,
      product_name,
      next_due_date
    FROM latest
    ORDER BY next_due_date ASC, horse_name ASC
    `
  );

  return result.rows;
}

function buildScheduledReminderGroups(rows, daysAhead) {
  const today = todayDateString();
  const soonLimit = addDaysToDateString(today, daysAhead);
  const overdue = [];
  const dueSoon = [];

  for (const row of rows) {
    const eventDate = formatDateForReply(row.event_date);
    const who = row.horse_name || 'Campo';
    const line = `- #${row.id} | ${who} | due: ${eventDate} | ${row.title}`;

    if (eventDate < today) {
      overdue.push({
        key: `schedule:${row.id}:${eventDate}`,
        line,
      });
      continue;
    }

    if (eventDate >= today && eventDate <= soonLimit) {
      dueSoon.push({
        key: `schedule:${row.id}:${eventDate}`,
        line,
      });
    }
  }

  return { overdue, dueSoon };
}

async function getPendingScheduledRows() {
  await ensureFarmVisitsTable();

  const result = await pool.query(
    `
    SELECT
      fv.id,
      fv.horse_id,
      h.name AS horse_name,
      fv.category,
      fv.title,
      fv.event_date,
      fv.notes
    FROM farm_visits fv
    LEFT JOIN horses h ON h.id = fv.horse_id
    WHERE fv.status = 'pending'
    ORDER BY fv.event_date ASC, fv.id ASC
    `
  );

  return result.rows;
}

async function getLowStockRows(threshold) {
  const result = await pool.query(
    `
    SELECT id, name, unit, current_stock
    FROM feed_items
    WHERE current_stock <= $1
    ORDER BY current_stock ASC, name ASC
    `,
    [threshold]
  );

  return result.rows;
}

async function ensureReminderAlertsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reminder_alerts (
      id BIGSERIAL PRIMARY KEY,
      alert_key TEXT NOT NULL,
      alert_date DATE NOT NULL DEFAULT CURRENT_DATE,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (alert_key, alert_date)
    )
  `);
}

async function markAlertAsSentForToday(alertKey) {
  const insertResult = await pool.query(
    `
    INSERT INTO reminder_alerts (alert_key, alert_date)
    VALUES ($1, CURRENT_DATE)
    ON CONFLICT (alert_key, alert_date) DO NOTHING
    RETURNING id
    `,
    [alertKey]
  );

  return insertResult.rows.length > 0;
}

async function sendRemindersToAlertChat() {
  await ensureReminderAlertsTable();

  const farmSettings = await getFarmSettings();
  alertChatId =
    farmSettings.telegram_alert_chat_id ||
    alertChatId ||
    process.env.TELEGRAM_ALERT_CHAT_ID ||
    null;

  if (!alertChatId) {
    return;
  }

  const [dewormRows, lowStockRows, scheduledRows] = await Promise.all([
    getLatestDewormRows(),
    getLowStockRows(LOW_STOCK_THRESHOLD),
    getPendingScheduledRows(),
  ]);

  const { overdue, dueSoon } = buildDewormReminderGroups(
    dewormRows,
    DEWORM_ALERT_DAYS_AHEAD
  );

  const scheduledGroups = buildScheduledReminderGroups(
    scheduledRows,
    SCHEDULE_ALERT_DAYS_AHEAD
  );

  const pendingOverdue = [];
  const pendingDueSoon = [];
  const pendingLowStock = [];
  const pendingScheduledOverdue = [];
  const pendingScheduledDueSoon = [];

  for (const item of overdue) {
    if (await markAlertAsSentForToday(item.key)) {
      pendingOverdue.push(item.line);
    }
  }

  for (const item of dueSoon) {
    if (await markAlertAsSentForToday(item.key)) {
      pendingDueSoon.push(item.line);
    }
  }

  for (const stockRow of lowStockRows) {
    const line = `- ${stockRow.name}: ${stockRow.current_stock} ${stockRow.unit}`;
    const key = `stock:${stockRow.id}`;

    if (await markAlertAsSentForToday(key)) {
      pendingLowStock.push(line);
    }
  }

  for (const item of scheduledGroups.overdue) {
    if (await markAlertAsSentForToday(item.key)) {
      pendingScheduledOverdue.push(item.line);
    }
  }

  for (const item of scheduledGroups.dueSoon) {
    if (await markAlertAsSentForToday(item.key)) {
      pendingScheduledDueSoon.push(item.line);
    }
  }

  if (
    pendingOverdue.length === 0 &&
    pendingDueSoon.length === 0 &&
    pendingLowStock.length === 0 &&
    pendingScheduledOverdue.length === 0 &&
    pendingScheduledDueSoon.length === 0
  ) {
    return;
  }

  const sections = [];
  const today = todayDateString();

  sections.push(`Farm reminders (${today})`);

  if (pendingScheduledOverdue.length > 0) {
    sections.push(`Scheduled tasks overdue:\n${pendingScheduledOverdue.join('\n')}`);
  }

  if (pendingScheduledDueSoon.length > 0) {
    sections.push(`Scheduled tasks coming up:\n${pendingScheduledDueSoon.join('\n')}`);
  }

  if (pendingOverdue.length > 0) {
    sections.push(`Deworming overdue:\n${pendingOverdue.join('\n')}`);
  }

  if (pendingDueSoon.length > 0) {
    sections.push(`Deworming due soon:\n${pendingDueSoon.join('\n')}`);
  }

  if (pendingLowStock.length > 0) {
    sections.push(
      `Low stock (<= ${LOW_STOCK_THRESHOLD}):\n${pendingLowStock.join('\n')}`
    );
  }

  await bot.telegram.sendMessage(alertChatId, sections.join('\n\n'));
}

async function startReminderScheduler() {
  await ensureReminderAlertsTable();

  const runReminderCheck = async () => {
    try {
      await sendRemindersToAlertChat();
    } catch (error) {
      console.error('REMINDER ERROR:', error);
    }
  };

  // First check shortly after startup, then on the configured interval.
  setTimeout(runReminderCheck, 15000);
  setInterval(runReminderCheck, ALERT_CHECK_INTERVAL_MS);
}

async function findHorseByName(horseName) {
  const result = await pool.query(
    `
    SELECT id, name
    FROM horses
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
    `,
    [horseName]
  );

  return result.rows[0] || null;
}

async function listHorseNames() {
  const result = await pool.query(`
    SELECT name
    FROM horses
    ORDER BY name ASC
  `);

  return result.rows.map((row) => row.name);
}

function findLongestPrefixMatch(input, names) {
  const normalizedInput = String(input || '').trim().toLowerCase();
  const sortedNames = [...names].sort((left, right) => right.length - left.length);

  for (const name of sortedNames) {
    const normalizedName = String(name || '').trim().toLowerCase();
    if (!normalizedName) {
      continue;
    }

    if (normalizedInput === normalizedName || normalizedInput.startsWith(`${normalizedName} `)) {
      return name;
    }
  }

  return null;
}

function parseNamedSegmentWithOptionalDateAndNotes(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return {
      name: '',
      eventDate: todayDateString(),
      notes: '',
    };
  }

  const parts = rawValue.split(/\s+/).filter(Boolean);
  const dateIndex = parts.findIndex((part) => looksLikeDateString(part));

  if (dateIndex === -1) {
    return {
      name: rawValue,
      eventDate: todayDateString(),
      notes: '',
    };
  }

  const eventDate = parts[dateIndex];
  if (!isValidDateString(eventDate)) {
    throw new Error(`Invalid calendar date: ${eventDate}`);
  }

  return {
    name: parts.slice(0, dateIndex).join(' ').trim(),
    eventDate,
    notes: parts.slice(dateIndex + 1).join(' ').trim(),
  };
}

function parsePipeSegments(value) {
  return String(value || '')
    .split('|')
    .map((segment) => segment.trim());
}

function normalizeTrainingStatusInput(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');

  if (!normalized || ['clear', 'none', 'remove', 'blank', 'no status'].includes(normalized)) {
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

  return null;
}

function shouldApplyPaddockWorkToDescendants(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return ['whole_block', 'children', 'descendants', 'yes', 'true', '1'].includes(normalized);
}

function isRecognizedPaddockWorkScope(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return [
    '',
    'paddock',
    'single',
    'current',
    'no',
    'false',
    '0',
    'whole_block',
    'children',
    'descendants',
    'yes',
    'true',
    '1',
  ].includes(normalized);
}

function parsePaddockWorkCommand(value, { requireEventId = false } = {}) {
  const segments = parsePipeSegments(value);
  const minimumSegments = requireEventId ? 3 : 2;

  if (segments.length < minimumSegments) {
    return null;
  }

  let offset = 0;
  let eventId = null;

  if (requireEventId) {
    eventId = parsePositiveInt(segments[0], null);
    if (!eventId) {
      throw new Error('Paddock work event id must be a positive number.');
    }
    offset = 1;
  }

  const paddockName = String(segments[offset] || '').trim();
  const eventType = String(segments[offset + 1] || '').trim();
  const eventDateRaw = String(segments[offset + 2] || '').trim();
  const eventDate = eventDateRaw || todayDateString();

  if (eventDateRaw && !isValidDateString(eventDateRaw)) {
    throw new Error(`Invalid calendar date: ${eventDateRaw}`);
  }

  const readyToken = String(segments[offset + 3] || '').trim();
  let readyAfterDays = null;

  if (
    readyToken &&
    !['-', 'none', 'null', 'blank', 'na', 'n/a'].includes(readyToken.toLowerCase())
  ) {
    const parsedReadyDays = Number.parseInt(readyToken, 10);
    if (!Number.isFinite(parsedReadyDays) || parsedReadyDays < 0) {
      throw new Error('Ready-after days must be a whole number >= 0, or use - to leave it blank.');
    }
    readyAfterDays = parsedReadyDays;
  }

  const scopeSegment = String(segments[offset + 4] || '').trim();
  const hasExplicitScope = isRecognizedPaddockWorkScope(scopeSegment);
  const noteStartIndex = hasExplicitScope ? offset + 5 : offset + 4;

  return {
    eventId,
    paddockName,
    eventType,
    eventDate,
    readyAfterDays,
    applyToDescendants: hasExplicitScope && shouldApplyPaddockWorkToDescendants(scopeSegment),
    notes: segments.slice(noteStartIndex).join(' | ').trim(),
  };
}

function formatPaddockStatusLine(row) {
  const prefix = row.zone ? `${row.name} (${row.zone})` : row.name;

  if (row.occupancy_state === 'inactive') {
    return `- ${prefix} | inactive`;
  }

  if (row.occupancy_state === 'occupied') {
    return `- ${prefix} | occupied by ${row.occupied_by} | since ${formatDateForReply(
      row.occupied_since
    )} | ${row.grazing_days} day(s)`;
  }

  if (row.occupancy_state === 'growing') {
    return `- ${prefix} | waiting ${row.days_until_ready} day(s) | ready: ${formatDateForReply(
      row.ready_to_graze_on
    )}${row.latest_work_type_label ? ` | ${row.latest_work_type_label}` : ''}`;
  }

  if (row.occupancy_state === 'resting') {
    return `- ${prefix} | resting ${row.rest_days} day(s) | last exit: ${formatDateForReply(
      row.last_exited_at
    )}`;
  }

  return `- ${prefix} | available${row.notes ? ` | ${row.notes}` : ''}`;
}

function formatPaddockWorkHistoryLine(row) {
  const readyPart = row.ready_to_graze_on
    ? ` | ready: ${formatDateForReply(row.ready_to_graze_on)}`
    : '';
  const waitPart =
    row.ready_after_days == null ? '' : ` | wait: ${row.ready_after_days} day(s)`;
  const scopePart = row.applies_to_descendants ? ' | scope: descendants' : '';
  const notesPart = row.notes ? ` | ${row.notes}` : '';
  return `- #${row.id} | ${row.paddock_name} | ${row.event_type_label} | ${formatDateForReply(
    row.event_date
  )}${waitPart}${readyPart}${scopePart}${notesPart}`;
}

function formatHorseGroupLine(row) {
  const status = row.active ? 'active' : 'inactive';
  const memberPart =
    row.member_count > 0 ? `${row.member_count} horse(s): ${row.member_names.join(', ')}` : 'no horses assigned';
  const paddockPart = row.current_paddock_names ? ` | paddocks: ${row.current_paddock_names}` : '';
  return `- ${row.name} | ${status} | ${memberPart}${paddockPart}`;
}

function formatGrazingHistoryLine(row) {
  const exitPart = row.exited_at ? formatDateForReply(row.exited_at) : 'Current';
  const notes = [row.source_group_name ? `group: ${row.source_group_name}` : '', row.entry_notes, row.exit_notes]
    .filter(Boolean)
    .join(' | ');
  return `- ${row.horse_name} | ${row.paddock_name} | in: ${formatDateForReply(
    row.entered_at
  )} | out: ${exitPart} | ${row.grazing_days} day(s)${notes ? ` | ${notes}` : ''}`;
}

async function findFeedItemByName(itemName) {
  const result = await pool.query(
    `
    SELECT id, name, unit, current_stock
    FROM feed_items
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
    `,
    [itemName]
  );

  return result.rows[0] || null;
}

const TELEGRAM_MENU_COMMANDS = [
  { command: 'start', description: 'Open the Farm Bot command guide' },
  { command: 'help', description: 'Show command formats and examples' },
];

const TELEGRAM_LOOKUP_COMMANDS = [
  'horse list',
  'history <horse name>',
  'history full <horse name>',
  'horse grazing <horse name>',
  'group list',
  'group members <group name>',
  'paddock list',
  'paddock status',
  'paddock history <paddock name>',
  'paddock work history',
  'paddock work history <paddock name>',
  'stock',
  'stock <feed item>',
  'stock history <feed item>',
  'rain today',
  'rain history',
  'rain history 30',
  'rain year',
  'rain seasonal',
  'deworm due',
  'deworm history',
  'deworm history <horse name>',
  'farrier due',
  'schedule list',
];

const TELEGRAM_ENTRY_COMMANDS = [
  'horse add <horse name>',
  'horse rename <current name> | <new name>',
  'group add <group name>',
  'group set members <group name> | <horse 1>, <horse 2>',
  'paddock add <paddock name>',
  'paddock work <paddock name> | <work type> | [YYYY-MM-DD] | [ready days|-] | [scope] | [notes]',
  'paddock work update <event id> | <paddock name> | <work type> | [YYYY-MM-DD] | [ready days|-] | [scope] | [notes]',
  'move in <horse name> <paddock name> [YYYY-MM-DD] [notes]',
  'move out <horse name> <paddock name> [YYYY-MM-DD] [notes]',
  'move group in <group name> <paddock name> [YYYY-MM-DD] [notes]',
  'move group correct <group name> <paddock name> [YYYY-MM-DD] [notes]',
  'move group out <group name> <paddock name> [YYYY-MM-DD] [notes]',
  'share paddocks <group name> | <paddock 1>, <paddock 2>, ... [YYYY-MM-DD] [notes]',
  'horse training <horse name> <in training|breaking in|clear>',
  'stock add <feed item> <quantity> <unit> [YYYY-MM-DD] [notes]',
  'stock set <feed item> <quantity> <unit>',
  'stock use <feed item> <quantity> <unit> [YYYY-MM-DD] [notes]',
  'feed <horse name> <feed item> <quantity> <unit> [YYYY-MM-DD]',
  'rain <mm> [YYYY-MM-DD] [notes]',
  'schedule <horse name or -> | <category> | <title> | <YYYY-MM-DD> | [notes]',
  'schedule done <id>',
  'schedule missed <id>',
  'deworm <horse name> <product> [YYYY-MM-DD]',
  'deworm done <horse name> <product> <YYYY-MM-DD>',
  'farrier <horse name> <service> [YYYY-MM-DD]',
  'health add <horse name> <type> <description> [YYYY-MM-DD]',
  'treatment add <horse name> <medication> <dosage> <frequency> <duration>d <YYYY-MM-DD>',
  'dose add <horse name> <medication> <YYYY-MM-DD> <HH:MM>',
];

const TELEGRAM_EXAMPLE_COMMANDS = [
  'horse rename Caballo Uru 4 | Caballo Uru IV',
  'group set members Manada | Bengala, Black Jack, Tekua',
  'paddock work Potrero 2.1 | seeding | 2026-05-08 | 45 | descendants | ryegrass reseeded',
  'paddock work update 12 | Potrero 2.1 | fertilizer | 2026-05-09 | - | paddock | post rain pass',
  'move in Imperial Potrero 2.1 2026-05-08 calm entry',
  'move group correct Manada Potrero 2.1 2026-05-08 imported history fix',
  'move group in Manada Potrero 2.1 2026-05-08 morning rotation',
  'share paddocks Manada | Potrero 4.1, Potrero 4.2, Potrero 4.3, Potrero 3 2026-08-07 comen tambien en el 3',
  'horse training Imperial breaking in',
  'stock add oats 50 kg 2026-05-08 bought from Juan',
  'stock use alfalfa 1 bale 2026-05-08 opened new bale',
  'feed Fair Halo oats 2 kg',
  'rain 12.5 2026-05-08 heavy shower',
  'schedule Imperial | vet | Cirugia rodilla | 2026-08-26 | Dr. Suarez, en ayunas desde la noche anterior',
  'schedule done 14',
  'deworm Imperial ivermectin 2026-05-08',
  'health add Imperial injury left hind leg cut 2026-05-08',
  'dose add Imperial repen 2026-05-08 18:00',
];

const TELEGRAM_ADMIN_ONLY_ACTIONS = [
  'Horse profile details: date of birth, color, activity, and sex',
  'Feed plan and feed calendar management',
  'Editing or deleting feed history entries',
  'Farm settings and admin module toggles',
  'Weather sync from the rain panel',
  'Detailed paddock metadata edits like zone, size, parent, and notes',
];

function buildTelegramCommandGuide() {
  return [
    'Farm Bot command guide',
    '',
    'Use /help anytime to open this again.',
    '',
    'How to send data',
    '- Most actions are plain text commands, not slash commands.',
    '- Send one command per line. You can send multiple lines in one message.',
    '- Use YYYY-MM-DD for dates and HH:MM for dose time.',
    '- If an optional date is omitted, today is used.',
    '- Commands with [notes] save everything after the date as notes.',
    '- Commands with | use pipe-separated fields so names can keep spaces.',
    '- Horse, group, paddock, and feed names can include spaces.',
    '- Group members can be assigned with group set members or from the admin panel.',
    '- Paddock work types: soil prep, seeding, fertilizer, spraying, ready check, other.',
    '',
    'Check data',
    ...TELEGRAM_LOOKUP_COMMANDS.map((commandText) => `- ${commandText}`),
    '',
    'Register or update data',
    ...TELEGRAM_ENTRY_COMMANDS.map((commandText) => `- ${commandText}`),
    '',
    'Examples',
    ...TELEGRAM_EXAMPLE_COMMANDS.map((commandText) => `- ${commandText}`),
    '',
    'Still admin-only',
    ...TELEGRAM_ADMIN_ONLY_ACTIONS.map((commandText) => `- ${commandText}`),
  ].join('\n');
}

const START_MESSAGE = buildTelegramCommandGuide();

async function syncTelegramMenuCommands() {
  try {
    await bot.telegram.setMyCommands(TELEGRAM_MENU_COMMANDS);
  } catch (error) {
    console.error('TELEGRAM COMMAND MENU ERROR:', error);
  }
}

async function ensureAlertChatRegistration(incomingChatId) {
  if (!alertChatId) {
    const farmSettings = await getFarmSettings();
    alertChatId = farmSettings.telegram_alert_chat_id || null;
  }

  if (!alertChatId) {
    alertChatId = incomingChatId;
    await saveFarmAlertChatId(incomingChatId);
    console.log(`Alert chat auto-set from incoming message: ${alertChatId}`);
    sendRemindersToAlertChat().catch((error) => {
      console.error('REMINDER ERROR:', error);
    });
  }
}

bot.start(async (ctx) => {
  await ensureAlertChatRegistration(String(ctx.chat.id));
  await ctx.reply(START_MESSAGE);
});

bot.help(async (ctx) => {
  await ensureAlertChatRegistration(String(ctx.chat.id));
  await ctx.reply(START_MESSAGE);
});

bot.on('text', async (ctx) => {
  const telegramUserId = String(ctx.from.id);
  const username = ctx.from.username || null;
  const firstName = ctx.from.first_name || null;
  const incomingChatId = String(ctx.chat.id);

  await ensureAlertChatRegistration(incomingChatId);

  const messages = ctx.message.text
    .split('\n')
    .map((m) => m.trim())
    .filter(Boolean);

  try {
    for (const messageText of messages) {
      const lowerMessage = messageText.toLowerCase();
      const parts = messageText.split(/\s+/);
      const command = parts[0]?.toLowerCase();

      console.log('Incoming message:', messageText);

      if (
        lowerMessage === 'help' ||
        lowerMessage === '/help' ||
        lowerMessage === 'commands' ||
        lowerMessage === '/commands'
      ) {
        await ctx.reply(START_MESSAGE);
        continue;
      }

      const rawResult = await pool.query(
        `
        INSERT INTO telegram_messages (
          telegram_user_id,
          username,
          first_name,
          message_text
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [telegramUserId, username, firstName, messageText]
      );

      const rawMessageId = rawResult.rows[0].id;
      await ensurePaddockTables();

      // -----------------------------
      // HORSE LIST
      // -----------------------------
      if (lowerMessage === 'horse list') {
        const horses = await listHorseNames();

        if (horses.length === 0) {
          await ctx.reply('No horses found.');
          continue;
        }

        await ctx.reply(`Registered horses\n\n${horses.map((h) => `- ${h}`).join('\n')}`);
        continue;
      }

      // -----------------------------
      // HORSE ADD
      // -----------------------------
      if (lowerMessage.startsWith('horse add ')) {
        const horseName = messageText.slice('horse add '.length).trim();

        if (!horseName) {
          await ctx.reply('Use: horse add <horse name>');
          continue;
        }

        const existingHorse = await findHorseByName(horseName);

        if (existingHorse) {
          await ctx.reply(`Horse already exists: ${existingHorse.name}`);
          continue;
        }

        const insertHorseResult = await pool.query(
          `
          INSERT INTO horses (name)
          VALUES ($1)
          RETURNING id, name
          `,
          [horseName]
        );

        const horse = insertHorseResult.rows[0];

        await ctx.reply(
          `Horse added ✅

Name: ${horse.name}
Horse ID: ${horse.id}
Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // HORSE RENAME
      // horse rename <current name> | <new name>
      // -----------------------------
      if (lowerMessage.startsWith('horse rename ')) {
        const remainder = messageText.slice('horse rename '.length).trim();
        const segments = parsePipeSegments(remainder);
        const currentName = String(segments[0] || '').trim();
        const newName = segments.slice(1).join(' | ').trim();

        if (!currentName || !newName) {
          await ctx.reply('Use: horse rename <current name> | <new name>');
          continue;
        }

        const horse = await findHorseByName(currentName);

        if (!horse) {
          const horses = await listHorseNames();
          await ctx.reply(
            `Horse not found: ${currentName}

Available horses:
${horses.map((h) => `- ${h}`).join('\n')}`
          );
          continue;
        }

        const duplicateCheck = await pool.query(
          `
          SELECT id, name
          FROM horses
          WHERE LOWER(name) = LOWER($1)
            AND id <> $2
          LIMIT 1
          `,
          [newName, horse.id]
        );

        if (duplicateCheck.rows.length > 0) {
          await ctx.reply(`Another horse already uses that name: ${duplicateCheck.rows[0].name}`);
          continue;
        }

        const updateResult = await pool.query(
          `
          UPDATE horses
          SET name = $1
          WHERE id = $2
          RETURNING id, name
          `,
          [newName, horse.id]
        );

        await ctx.reply(
          `Horse renamed ✅

Previous name: ${horse.name}
New name: ${updateResult.rows[0].name}
Horse ID: ${updateResult.rows[0].id}
Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // HORSE TRAINING
      // horse training <horse name> <in training|breaking in|clear>
      // -----------------------------
      if (lowerMessage.startsWith('horse training ')) {
        const remainder = messageText.slice('horse training '.length).trim();
        const allHorses = await listHorseNames();
        const matchedHorseName = findLongestPrefixMatch(remainder, allHorses);

        if (!matchedHorseName) {
          await ctx.reply(
            `Horse not found.

Available horses:
${allHorses.map((name) => `- ${name}`).join('\n')}`
          );
          continue;
        }

        const horse = await findHorseByName(matchedHorseName);
        const statusRaw = remainder.slice(matchedHorseName.length).trim();

        if (!statusRaw) {
          await ctx.reply('Use: horse training <horse name> <in training|breaking in|clear>');
          continue;
        }

        const trainingStatus = normalizeTrainingStatusInput(statusRaw);

        if (trainingStatus == null) {
          await ctx.reply(
            'Training status must be: in training, breaking in, or clear'
          );
          continue;
        }

        const updateResult = await pool.query(
          `
          UPDATE horses
          SET training_status = $1
          WHERE id = $2
          RETURNING id, name, training_status
          `,
          [trainingStatus || null, horse.id]
        );

        await ctx.reply(
          `Training status saved ✅

Horse: ${updateResult.rows[0].name}
Status: ${normalizeTrainingStatusForReply(updateResult.rows[0].training_status) || 'No status'}
Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // GROUP LIST
      // -----------------------------
      if (lowerMessage === 'group list') {
        const groups = await listHorseGroups();

        if (groups.length === 0) {
          await ctx.reply('No groups found. Add one with: group add <group name>');
          continue;
        }

        await ctx.reply(`Registered groups\n\n${groups.map(formatHorseGroupLine).join('\n')}`);
        continue;
      }

      // -----------------------------
      // GROUP ADD
      // -----------------------------
      if (lowerMessage.startsWith('group add ')) {
        const groupName = messageText.slice('group add '.length).trim();

        if (!groupName) {
          await ctx.reply('Use: group add <group name>');
          continue;
        }

        const data = await saveHorseGroup({
          name: groupName,
          active: true,
        });

        await ctx.reply(
          `Group ${data.mode === 'created' ? 'added' : 'updated'} ✅

Name: ${data.group.name}
Status: ${data.group.active ? 'Active' : 'Inactive'}
Group ID: ${data.group.id}
Members: ${data.group.member_count}
Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // GROUP MEMBERS
      // -----------------------------
      if (lowerMessage.startsWith('group members ')) {
        const groupName = messageText.slice('group members '.length).trim();

        if (!groupName) {
          await ctx.reply('Use: group members <group name>');
          continue;
        }

        const group = await findHorseGroupByName(groupName);

        if (!group) {
          const groups = await listHorseGroups();
          await ctx.reply(
            `Group not found: ${groupName}

Available groups:
${groups.map((row) => `- ${row.name}`).join('\n')}`
          );
          continue;
        }

        let reply = `Group: ${group.name}
- status: ${group.active ? 'Active' : 'Inactive'}
- members: ${group.member_count}`;

        if (group.current_paddock_names) {
          reply += `\n- current paddocks: ${group.current_paddock_names}`;
        }

        if (group.notes) {
          reply += `\n- notes: ${group.notes}`;
        }

        if (group.members.length > 0) {
          reply += `\n\nMembers
${group.members.map((member) => `- ${member.name}`).join('\n')}`;
        } else {
          reply += `\n\nMembers
- No horses assigned`;
        }

        await ctx.reply(reply);
        continue;
      }

      // -----------------------------
      // GROUP SET MEMBERS
      // group set members <group name> | <horse 1>, <horse 2>
      // Use blank / none after the pipe to clear the group.
      // -----------------------------
      if (lowerMessage.startsWith('group set members ')) {
        const remainder = messageText.slice('group set members '.length).trim();
        const segments = parsePipeSegments(remainder);
        const groupName = String(segments[0] || '').trim();
        const memberListRaw = segments.slice(1).join(' | ').trim();

        if (!groupName) {
          await ctx.reply('Use: group set members <group name> | <horse 1>, <horse 2>');
          continue;
        }

        const group = await findHorseGroupByName(groupName);

        if (!group) {
          const groups = await listHorseGroups();
          await ctx.reply(
            `Group not found: ${groupName}

Available groups:
${groups.map((row) => `- ${row.name}`).join('\n')}`
          );
          continue;
        }

        let horseIds = [];
        let requestedHorseNames = [];

        if (
          memberListRaw &&
          !['none', 'clear', 'empty', '-'].includes(memberListRaw.toLowerCase())
        ) {
          requestedHorseNames = [...new Set(
            memberListRaw
              .split(',')
              .map((name) => name.trim())
              .filter(Boolean)
          )];

          if (!requestedHorseNames.length) {
            await ctx.reply('Use: group set members <group name> | <horse 1>, <horse 2>');
            continue;
          }

          const missingHorseNames = [];

          for (const horseName of requestedHorseNames) {
            const horse = await findHorseByName(horseName);
            if (!horse) {
              missingHorseNames.push(horseName);
              continue;
            }
            horseIds.push(horse.id);
          }

          if (missingHorseNames.length > 0) {
            const horses = await listHorseNames();
            await ctx.reply(
              `Horse not found: ${missingHorseNames.join(', ')}

Available horses:
${horses.map((name) => `- ${name}`).join('\n')}`
            );
            continue;
          }
        }

        const data = await setHorseGroupMembers({
          groupId: group.id,
          horseIds,
        });

        const currentMembers = Array.isArray(data.members) ? data.members : [];
        const reassignedMembers = Array.isArray(data.reassigned_members) ? data.reassigned_members : [];
        const removedMembers = Array.isArray(data.removed_members) ? data.removed_members : [];

        let reply = `Group members saved ✅

Group: ${data.group.name}
Current members: ${currentMembers.length}
Reassigned: ${reassignedMembers.length}
Removed: ${removedMembers.length}`;

        if (currentMembers.length > 0) {
          reply += `\n\nMembers
${currentMembers.map((member) => `- ${member.name}`).join('\n')}`;
        } else {
          reply += '\n\nMembers\n- No horses assigned';
        }

        reply += `\n\nRaw message ID: ${rawMessageId}`;
        await ctx.reply(reply);
        continue;
      }

      // -----------------------------
      // PADDOCK LIST
      // -----------------------------
      if (lowerMessage === 'paddock list') {
        const paddocks = await listPaddockStatus();

        if (paddocks.length === 0) {
          await ctx.reply('No paddocks found. Add one with: paddock add <paddock name>');
          continue;
        }

        await ctx.reply(`Registered paddocks\n\n${paddocks.map(formatPaddockStatusLine).join('\n')}`);
        continue;
      }

      // -----------------------------
      // PADDOCK WORK HISTORY
      // paddock work history
      // paddock work history <paddock name>
      // -----------------------------
      if (
        lowerMessage === 'paddock work history' ||
        lowerMessage.startsWith('paddock work history ')
      ) {
        const paddockName = messageText.slice('paddock work history'.length).trim();
        let paddockId = null;
        let replyLabel = 'latest 20';

        if (paddockName) {
          const paddock = await findPaddockByName(paddockName);

          if (!paddock) {
            const paddocks = await listPaddockNames();
            await ctx.reply(
              `Paddock not found: ${paddockName}

Available paddocks:
${paddocks.map((name) => `- ${name}`).join('\n')}`
            );
            continue;
          }

          paddockId = paddock.id;
          replyLabel = paddock.name;
        }

        const workRows = await listPaddockWorkHistory({
          paddockId,
          limit: paddockId ? 30 : 20,
        });

        if (workRows.length === 0) {
          await ctx.reply(
            paddockId
              ? `No paddock work history found for ${replyLabel}.`
              : 'No paddock work history records found.'
          );
          continue;
        }

        await ctx.reply(
          `Paddock work history: ${replyLabel}\n\n${workRows
            .map(formatPaddockWorkHistoryLine)
            .join('\n')}`
        );
        continue;
      }

      // -----------------------------
      // PADDOCK ADD
      // -----------------------------
      if (lowerMessage.startsWith('paddock add ')) {
        const paddockName = messageText.slice('paddock add '.length).trim();

        if (!paddockName) {
          await ctx.reply('Use: paddock add <paddock name>');
          continue;
        }

        const data = await savePaddock({
          name: paddockName,
          active: true,
        });

        await ctx.reply(
          `Paddock ${data.mode === 'created' ? 'added' : 'updated'} ✅

Name: ${data.paddock.name}
Status: ${data.paddock.active ? 'Active' : 'Inactive'}
Paddock ID: ${data.paddock.id}
Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // PADDOCK READY DATE (extend/override the rest period)
      // paddock ready <paddock name> | <YYYY-MM-DD> | [notes]
      // -----------------------------
      if (lowerMessage.startsWith('paddock ready ')) {
        const parts = messageText
          .slice('paddock ready '.length)
          .split('|')
          .map((part) => part.trim());
        const [paddockNameRaw, readyDateRaw, notesRaw] = parts;

        if (!paddockNameRaw || !readyDateRaw) {
          await ctx.reply('Use: paddock ready <paddock name> | <YYYY-MM-DD> | [notes]');
          continue;
        }

        if (!isValidDateString(readyDateRaw)) {
          await ctx.reply(`Invalid calendar date: ${readyDateRaw}`);
          continue;
        }

        const paddock = await findPaddockByName(paddockNameRaw);

        if (!paddock) {
          const paddocks = await listPaddockNames();
          await ctx.reply(
            `Paddock not found: ${paddockNameRaw}

Available paddocks:
${paddocks.map((name) => `- ${name}`).join('\n')}`
          );
          continue;
        }

        try {
          const data = await extendPaddockReadyDate({
            paddockId: paddock.id,
            readyToGrazeOn: readyDateRaw,
            notes: notesRaw || null,
            telegramUserId,
          });

          await ctx.reply(
            `Paddock ready date updated ✅

Paddock: ${data.paddock.name}
Ready to graze: ${formatDateForReply(data.paddock_work_event.ready_to_graze_on)}
${notesRaw ? `Notes: ${notesRaw}\n` : ''}Raw message ID: ${rawMessageId}`
          );
        } catch (error) {
          await ctx.reply(error.message || 'Could not update the ready date for that paddock.');
        }
        continue;
      }

      // -----------------------------
      // PADDOCK WORK UPDATE
      // paddock work update <event id> | <paddock name> | <work type> | [YYYY-MM-DD] | [ready days|-] | [scope] | [notes]
      // -----------------------------
      if (lowerMessage.startsWith('paddock work update ')) {
        let workData;

        try {
          workData = parsePaddockWorkCommand(
            messageText.slice('paddock work update '.length).trim(),
            { requireEventId: true }
          );
        } catch (error) {
          await ctx.reply(error.message);
          continue;
        }

        if (!workData || !workData.paddockName || !workData.eventType) {
          await ctx.reply(
            'Use: paddock work update <event id> | <paddock name> | <work type> | [YYYY-MM-DD] | [ready days|-] | [scope] | [notes]'
          );
          continue;
        }

        const paddock = await findPaddockByName(workData.paddockName);

        if (!paddock) {
          const paddocks = await listPaddockNames();
          await ctx.reply(
            `Paddock not found: ${workData.paddockName}

Available paddocks:
${paddocks.map((name) => `- ${name}`).join('\n')}`
          );
          continue;
        }

        const data = await updatePaddockWorkEvent({
          eventId: workData.eventId,
          paddockId: paddock.id,
          eventType: workData.eventType,
          eventDate: workData.eventDate,
          readyAfterDays: workData.readyAfterDays,
          applyToDescendants: workData.applyToDescendants,
          notes: workData.notes || null,
          telegramUserId,
        });

        const activeWaitEvent = data.active_wait_event;
        await ctx.reply(
          `Paddock work updated ✅

Event ID: ${data.paddock_work_event.id}
Paddock: ${data.paddock.name}
Work: ${data.paddock_work_event.event_type_label}
Date: ${formatDateForReply(data.paddock_work_event.event_date)}
Ready after: ${
            data.paddock_work_event.ready_after_days == null
              ? 'Not set'
              : `${data.paddock_work_event.ready_after_days} day(s)`
          }
Ready to graze: ${formatDateForReply(data.paddock_work_event.ready_to_graze_on)}
Scope: ${data.paddock_work_event.applies_to_descendants ? 'Descendants' : 'Paddock only'}
${workData.notes ? `Notes: ${workData.notes}\n` : ''}${
            activeWaitEvent?.ready_to_graze_on
              ? `Active ready date: ${formatDateForReply(activeWaitEvent.ready_to_graze_on)}`
              : 'Active ready date: not set'
          }
Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // PADDOCK WORK SAVE
      // paddock work <paddock name> | <work type> | [YYYY-MM-DD] | [ready days|-] | [scope] | [notes]
      // -----------------------------
      if (lowerMessage.startsWith('paddock work ')) {
        let workData;

        try {
          workData = parsePaddockWorkCommand(messageText.slice('paddock work '.length).trim());
        } catch (error) {
          await ctx.reply(error.message);
          continue;
        }

        if (!workData || !workData.paddockName || !workData.eventType) {
          await ctx.reply(
            'Use: paddock work <paddock name> | <work type> | [YYYY-MM-DD] | [ready days|-] | [scope] | [notes]'
          );
          continue;
        }

        const paddock = await findPaddockByName(workData.paddockName);

        if (!paddock) {
          const paddocks = await listPaddockNames();
          await ctx.reply(
            `Paddock not found: ${workData.paddockName}

Available paddocks:
${paddocks.map((name) => `- ${name}`).join('\n')}`
          );
          continue;
        }

        const data = await savePaddockWorkEvent({
          paddockId: paddock.id,
          eventType: workData.eventType,
          eventDate: workData.eventDate,
          readyAfterDays: workData.readyAfterDays,
          applyToDescendants: workData.applyToDescendants,
          notes: workData.notes || null,
          telegramUserId,
        });

        const activeWaitEvent = data.active_wait_event;
        await ctx.reply(
          `Paddock work recorded ✅

Event ID: ${data.paddock_work_event.id}
Paddock: ${data.paddock.name}
Work: ${data.paddock_work_event.event_type_label}
Date: ${formatDateForReply(data.paddock_work_event.event_date)}
Ready after: ${
            data.paddock_work_event.ready_after_days == null
              ? 'Not set'
              : `${data.paddock_work_event.ready_after_days} day(s)`
          }
Ready to graze: ${formatDateForReply(data.paddock_work_event.ready_to_graze_on)}
Scope: ${data.paddock_work_event.applies_to_descendants ? 'Descendants' : 'Paddock only'}
${workData.notes ? `Notes: ${workData.notes}\n` : ''}${
            activeWaitEvent?.ready_to_graze_on
              ? `Active ready date: ${formatDateForReply(activeWaitEvent.ready_to_graze_on)}`
              : 'Active ready date: not set'
          }
Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // PADDOCK STATUS
      // -----------------------------
      if (lowerMessage === 'paddock status') {
        const paddocks = await listPaddockStatus();

        if (paddocks.length === 0) {
          await ctx.reply('No paddock status records found.');
          continue;
        }

        await ctx.reply(`Paddock status\n\n${paddocks.map(formatPaddockStatusLine).join('\n')}`);
        continue;
      }

      // -----------------------------
      // PADDOCK HISTORY
      // -----------------------------
      if (lowerMessage.startsWith('paddock history ')) {
        const paddockName = messageText.slice('paddock history '.length).trim();

        if (!paddockName) {
          await ctx.reply('Use: paddock history <paddock name>');
          continue;
        }

        const paddock = await findPaddockByName(paddockName);

        if (!paddock) {
          const paddocks = await listPaddockNames();
          await ctx.reply(
            `Paddock not found: ${paddockName}

Available paddocks:
${paddocks.map((name) => `- ${name}`).join('\n')}`
          );
          continue;
        }

        const historyRows = await listGrazingHistory({ paddockId: paddock.id, limit: 20 });

        if (historyRows.length === 0) {
          await ctx.reply(`No grazing history found for ${paddock.name}.`);
          continue;
        }

        const lines = historyRows.map(formatGrazingHistoryLine);
        await ctx.reply(`Paddock history: ${paddock.name}\n\n${lines.join('\n')}`);
        continue;
      }

      // -----------------------------
      // HORSE GRAZING
      // -----------------------------
      if (lowerMessage.startsWith('horse grazing ')) {
        const horseName = messageText.slice('horse grazing '.length).trim();

        if (!horseName) {
          await ctx.reply('Use: horse grazing <horse name>');
          continue;
        }

        const horse = await findHorseByName(horseName);

        if (!horse) {
          const horses = await listHorseNames();
          await ctx.reply(
            `Horse not found: ${horseName}

Available horses:
${horses.map((h) => `- ${h}`).join('\n')}`
          );
          continue;
        }

        const [currentGrazing, grazingRows] = await Promise.all([
          getHorseCurrentGrazing(horse.id),
          listGrazingHistory({ horseId: horse.id, limit: 10 }),
        ]);

        let reply = `Horse grazing: ${horse.name}\n`;

        if (currentGrazing) {
          reply += `\nCurrent paddock
- ${currentGrazing.paddock_name}
- entered: ${formatDateForReply(currentGrazing.entered_at)}
- days on paddock: ${currentGrazing.grazing_days}`;
          if (currentGrazing.source_group_name) {
            reply += `\n- group move: ${currentGrazing.source_group_name}`;
          }
          if (currentGrazing.entry_notes) {
            reply += `\n- notes: ${currentGrazing.entry_notes}`;
          }
        } else {
          reply += `\nCurrent paddock
- Not currently assigned`;
        }

        if (grazingRows.length > 0) {
          reply += `\n\nRecent grazing history
${grazingRows.map(formatGrazingHistoryLine).join('\n')}`;
        } else {
          reply += `\n\nRecent grazing history
- No grazing records`;
        }

        await ctx.reply(reply);
        continue;
      }

      // -----------------------------
      // GROUP CORRECT CURRENT PADDOCK
      // move group correct <group name> <paddock name> [YYYY-MM-DD] [notes...]
      // -----------------------------
      if (lowerMessage.startsWith('move group correct ')) {
        const remainder = messageText.slice('move group correct '.length).trim();
        const allGroups = await listHorseGroups();
        const matchedGroupName = findLongestPrefixMatch(
          remainder,
          allGroups.map((group) => group.name)
        );

        if (!matchedGroupName) {
          await ctx.reply(
            `Group not found.

Available groups:
${allGroups.map((group) => `- ${group.name}`).join('\n')}`
          );
          continue;
        }

        const group =
          allGroups.find((row) => row.name === matchedGroupName) ||
          (await findHorseGroupByName(matchedGroupName));
        const afterGroup = remainder.slice(matchedGroupName.length).trim();
        let moveData;

        try {
          moveData = parseNamedSegmentWithOptionalDateAndNotes(afterGroup);
        } catch (error) {
          await ctx.reply(error.message);
          continue;
        }

        if (!moveData.name) {
          await ctx.reply(
            'Use: move group correct <group name> <paddock name> [YYYY-MM-DD] [notes]'
          );
          continue;
        }

        const paddock = await findPaddockByName(moveData.name);

        if (!paddock) {
          const paddocks = await listPaddockNames();
          await ctx.reply(
            `Paddock not found: ${moveData.name}

Available paddocks:
${paddocks.map((name) => `- ${name}`).join('\n')}`
          );
          continue;
        }

        const data = await correctHorseGroupCurrentPaddock({
          groupId: group.id,
          paddockId: paddock.id,
          enteredAt: moveData.eventDate,
          entryNotes: moveData.notes || null,
          source: 'telegram_group_correction',
        });

        await ctx.reply(
          `Group current paddock corrected ✅

Group: ${data.group.name}
Paddock: ${data.paddock.name}
Entered: ${formatDateForReply(moveData.eventDate)}
Corrected: ${data.corrected_count}
Updated existing: ${data.updated_count}
Inserted missing: ${data.inserted_count}
Already matched: ${data.unchanged_count}
${moveData.notes ? `Notes: ${moveData.notes}\n` : ''}Horses:
${data.horses.map((horse) => `- ${horse.name}`).join('\n')}
Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // GROUP MOVE IN
      // move group in <group name> <paddock name> [YYYY-MM-DD] [notes...]
      // -----------------------------
      if (lowerMessage.startsWith('move group in ')) {
        const remainder = messageText.slice('move group in '.length).trim();
        const allGroups = await listHorseGroups();
        const matchedGroupName = findLongestPrefixMatch(
          remainder,
          allGroups.map((group) => group.name)
        );

        if (!matchedGroupName) {
          await ctx.reply(
            `Group not found.

Available groups:
${allGroups.map((group) => `- ${group.name}`).join('\n')}`
          );
          continue;
        }

        const group = allGroups.find((row) => row.name === matchedGroupName) || (await findHorseGroupByName(matchedGroupName));
        const afterGroup = remainder.slice(matchedGroupName.length).trim();
        let moveData;

        try {
          moveData = parseNamedSegmentWithOptionalDateAndNotes(afterGroup);
        } catch (error) {
          await ctx.reply(error.message);
          continue;
        }

        if (!moveData.name) {
          await ctx.reply('Use: move group in <group name> <paddock name> [YYYY-MM-DD] [notes]');
          continue;
        }

        const paddock = await findPaddockByName(moveData.name);

        if (!paddock) {
          const paddocks = await listPaddockNames();
          await ctx.reply(
            `Paddock not found: ${moveData.name}

Available paddocks:
${paddocks.map((name) => `- ${name}`).join('\n')}`
          );
          continue;
        }

        const data = await moveHorseGroupIntoPaddock({
          groupId: group.id,
          paddockId: paddock.id,
          enteredAt: moveData.eventDate,
          entryNotes: moveData.notes || null,
          source: 'telegram_group',
          telegramUserId,
        });

        await ctx.reply(
          `Group move in recorded ✅

Group: ${data.group.name}
Paddock: ${data.paddock.name}
Entered: ${formatDateForReply(moveData.eventDate)}
Moved horses: ${data.moved_count}
Current occupancy: ${data.paddock_occupancy_count}
${moveData.notes ? `Notes: ${moveData.notes}\n` : ''}Horses:
${data.horses.map((horse) => `- ${horse.name}`).join('\n')}
Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // GROUP MOVE OUT
      // move group out <group name> <paddock name> [YYYY-MM-DD] [notes...]
      // -----------------------------
      if (lowerMessage.startsWith('move group out ')) {
        const remainder = messageText.slice('move group out '.length).trim();
        const allGroups = await listHorseGroups();
        const matchedGroupName = findLongestPrefixMatch(
          remainder,
          allGroups.map((group) => group.name)
        );

        if (!matchedGroupName) {
          await ctx.reply(
            `Group not found.

Available groups:
${allGroups.map((group) => `- ${group.name}`).join('\n')}`
          );
          continue;
        }

        const group = allGroups.find((row) => row.name === matchedGroupName) || (await findHorseGroupByName(matchedGroupName));
        const afterGroup = remainder.slice(matchedGroupName.length).trim();
        let moveData;

        try {
          moveData = parseNamedSegmentWithOptionalDateAndNotes(afterGroup);
        } catch (error) {
          await ctx.reply(error.message);
          continue;
        }

        if (!moveData.name) {
          await ctx.reply('Use: move group out <group name> <paddock name> [YYYY-MM-DD] [notes]');
          continue;
        }

        const paddock = await findPaddockByName(moveData.name);

        if (!paddock) {
          const paddocks = await listPaddockNames();
          await ctx.reply(
            `Paddock not found: ${moveData.name}

Available paddocks:
${paddocks.map((name) => `- ${name}`).join('\n')}`
          );
          continue;
        }

        const data = await moveHorseGroupOutOfPaddock({
          groupId: group.id,
          paddockId: paddock.id,
          exitedAt: moveData.eventDate,
          exitNotes: moveData.notes || null,
        });

        await ctx.reply(
          `Group move out recorded ✅

Group: ${data.group.name}
Paddock: ${data.paddock.name}
Exited: ${formatDateForReply(moveData.eventDate)}
Moved horses: ${data.moved_count}
${moveData.notes ? `Notes: ${moveData.notes}\n` : ''}Horses:
${data.horses.map((horse) => `- ${horse.name}`).join('\n')}
Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // SHARE PADDOCKS
      // A group already grazing somewhere can also have access to other paddocks at the
      // same time (e.g. a herd split across Potrero 4.1/4.2/4.3 that also eats in Potrero 3).
      // Unlike "move group in", this does not change the group's primary paddock/rest clock
      // of the source paddock - it only opens/closes extra paddocks alongside it.
      // share paddocks <group name> | <paddock 1>, <paddock 2>, ... [YYYY-MM-DD] [notes...]
      // share paddocks <group name> | none [YYYY-MM-DD] [notes...]   (releases all extras)
      // -----------------------------
      if (lowerMessage.startsWith('share paddocks ')) {
        const remainder = messageText.slice('share paddocks '.length).trim();
        const segments = parsePipeSegments(remainder);
        const groupNamePart = String(segments[0] || '').trim();
        const paddocksPart = segments.slice(1).join(' | ').trim();

        if (!groupNamePart || !paddocksPart) {
          await ctx.reply(
            'Use: share paddocks <group name> | <paddock 1>, <paddock 2>, ... [YYYY-MM-DD] [notes]\nUse: share paddocks <group name> | none [YYYY-MM-DD] [notes]'
          );
          continue;
        }

        const group = await findHorseGroupByName(groupNamePart);

        if (!group) {
          const allGroups = await listHorseGroups();
          await ctx.reply(
            `Group not found: ${groupNamePart}

Available groups:
${allGroups.map((row) => `- ${row.name}`).join('\n')}`
          );
          continue;
        }

        const chunks = paddocksPart
          .split(',')
          .map((chunk) => chunk.trim())
          .filter(Boolean);

        if (chunks.length === 0) {
          await ctx.reply('Use: share paddocks <group name> | <paddock 1>, <paddock 2>, ... [YYYY-MM-DD] [notes]');
          continue;
        }

        let lastSegmentData;
        try {
          lastSegmentData = parseNamedSegmentWithOptionalDateAndNotes(chunks[chunks.length - 1]);
        } catch (error) {
          await ctx.reply(error.message);
          continue;
        }

        const paddockNameCandidates = [...chunks.slice(0, -1), lastSegmentData.name].map((value) =>
          value.trim()
        );

        const releaseKeywords = new Set(['none', 'ninguno', 'ninguna', '-']);
        const resolvedPaddockIds = [];
        const notFoundNames = [];

        for (const candidateName of paddockNameCandidates) {
          if (!candidateName || releaseKeywords.has(candidateName.toLowerCase())) {
            continue;
          }

          const candidatePaddock = await findPaddockByName(candidateName);
          if (!candidatePaddock) {
            notFoundNames.push(candidateName);
            continue;
          }

          resolvedPaddockIds.push(candidatePaddock.id);
        }

        if (notFoundNames.length > 0) {
          const paddocks = await listPaddockNames();
          await ctx.reply(
            `Paddock(s) not found: ${notFoundNames.join(', ')}

Available paddocks:
${paddocks.map((name) => `- ${name}`).join('\n')}`
          );
          continue;
        }

        let data;
        try {
          data = await setGroupSharedPaddocks({
            groupId: group.id,
            paddockIds: resolvedPaddockIds,
            effectiveDate: lastSegmentData.eventDate,
            notes: lastSegmentData.notes || null,
            source: 'telegram_shared',
            telegramUserId,
          });
        } catch (error) {
          await ctx.reply(error.message);
          continue;
        }

        await ctx.reply(
          `Shared paddocks updated ✅

Group: ${data.group.name}
Primary paddock: ${data.primary_paddock.name}
Effective date: ${formatDateForReply(data.effective_date)}
Now shared with: ${data.current_shared_paddocks.length ? data.current_shared_paddocks.map((row) => row.name).join(', ') : 'none'}
${data.added_paddock_ids.length ? `Opened: ${data.added_paddock_ids.length}\n` : ''}${data.removed_paddock_ids.length ? `Released: ${data.removed_paddock_ids.length}\n` : ''}${lastSegmentData.notes ? `Notes: ${lastSegmentData.notes}\n` : ''}Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // MOVE IN
      // move in <horse name> <paddock name> [YYYY-MM-DD] [notes...]
      // -----------------------------
      if (lowerMessage.startsWith('move in ')) {
        const remainder = messageText.slice('move in '.length).trim();
        const allHorses = await listHorseNames();
        const matchedHorseName = findLongestPrefixMatch(remainder, allHorses);

        if (!matchedHorseName) {
          await ctx.reply(
            `Horse not found.

Available horses:
${allHorses.map((name) => `- ${name}`).join('\n')}`
          );
          continue;
        }

        const horse = await findHorseByName(matchedHorseName);
        const afterHorse = remainder.slice(matchedHorseName.length).trim();
        let moveData;

        try {
          moveData = parseNamedSegmentWithOptionalDateAndNotes(afterHorse);
        } catch (error) {
          await ctx.reply(error.message);
          continue;
        }

        if (!moveData.name) {
          await ctx.reply('Use: move in <horse name> <paddock name> [YYYY-MM-DD] [notes]');
          continue;
        }

        const paddock = await findPaddockByName(moveData.name);

        if (!paddock) {
          const paddocks = await listPaddockNames();
          await ctx.reply(
            `Paddock not found: ${moveData.name}

Available paddocks:
${paddocks.map((name) => `- ${name}`).join('\n')}`
          );
          continue;
        }

        const data = await moveHorseIntoPaddock({
          horseId: horse.id,
          paddockId: paddock.id,
          enteredAt: moveData.eventDate,
          entryNotes: moveData.notes || null,
          source: 'telegram',
          telegramUserId,
        });

        await ctx.reply(
          `Grazing move in recorded ✅

Horse: ${data.horse.name}
Paddock: ${data.paddock.name}
Entered: ${formatDateForReply(data.grazing_event.entered_at)}
Current occupancy: ${data.paddock_occupancy_count}
${moveData.notes ? `Notes: ${moveData.notes}\n` : ''}Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // MOVE OUT
      // move out <horse name> <paddock name> [YYYY-MM-DD] [notes...]
      // -----------------------------
      if (lowerMessage.startsWith('move out ')) {
        const remainder = messageText.slice('move out '.length).trim();
        const allHorses = await listHorseNames();
        const matchedHorseName = findLongestPrefixMatch(remainder, allHorses);

        if (!matchedHorseName) {
          await ctx.reply(
            `Horse not found.

Available horses:
${allHorses.map((name) => `- ${name}`).join('\n')}`
          );
          continue;
        }

        const horse = await findHorseByName(matchedHorseName);
        const afterHorse = remainder.slice(matchedHorseName.length).trim();
        let moveData;

        try {
          moveData = parseNamedSegmentWithOptionalDateAndNotes(afterHorse);
        } catch (error) {
          await ctx.reply(error.message);
          continue;
        }

        if (!moveData.name) {
          await ctx.reply('Use: move out <horse name> <paddock name> [YYYY-MM-DD] [notes]');
          continue;
        }

        const paddock = await findPaddockByName(moveData.name);

        if (!paddock) {
          const paddocks = await listPaddockNames();
          await ctx.reply(
            `Paddock not found: ${moveData.name}

Available paddocks:
${paddocks.map((name) => `- ${name}`).join('\n')}`
          );
          continue;
        }

        const data = await moveHorseOutOfPaddock({
          horseId: horse.id,
          paddockId: paddock.id,
          exitedAt: moveData.eventDate,
          exitNotes: moveData.notes || null,
        });

        await ctx.reply(
          `Grazing move out recorded ✅

Horse: ${data.horse.name}
Paddock: ${data.paddock.name}
Entered: ${formatDateForReply(data.grazing_event.entered_at)}
Exited: ${formatDateForReply(data.grazing_event.exited_at)}
Days on paddock: ${data.grazing_event.grazing_days}
${moveData.notes ? `Notes: ${moveData.notes}\n` : ''}Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // HISTORY SUMMARY / FULL
      // history <horse name>
      // history full <horse name>
      // -----------------------------
      if (
        lowerMessage.startsWith('history ') ||
        lowerMessage.startsWith('history full ')
      ) {
        const isFullHistory = lowerMessage.startsWith('history full ');
        const prefix = isFullHistory ? 'history full ' : 'history ';
        const horseName = messageText.slice(prefix.length).trim();

        if (!horseName) {
          await ctx.reply(
            isFullHistory
              ? 'Use: history full <horse name>'
              : 'Use: history <horse name>'
          );
          continue;
        }

        const horse = await findHorseByName(horseName);

        if (!horse) {
          const horses = await listHorseNames();
          await ctx.reply(
            `Horse not found: ${horseName}

Available horses:
${horses.map((h) => `- ${h}`).join('\n')}`
          );
          continue;
        }

        await ensureHorseProfileColumns();
        const horseProfileResult = await pool.query(
          `
          SELECT
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
          FROM horses
          WHERE id = $1
          LIMIT 1
          `,
          [horse.id]
        );
        const horseProfile = horseProfileResult.rows[0] || null;
        const horseDisplayName = horseProfile?.name || horse.name;
        const horseProfileBlock = buildHorseProfileBlockForReply(horseProfile);

        // -----------------------------
        // QUICK SUMMARY
        // -----------------------------
        if (!isFullHistory) {
          const lastFeedResult = await pool.query(
            `
            SELECT
              f.quantity,
              f.unit,
              COALESCE(f.event_date, f.created_at::date) AS feed_date,
              i.name AS feed_name
            FROM feed_events f
            JOIN feed_items i ON i.id = f.feed_item_id
            WHERE f.horse_id = $1
            ORDER BY COALESCE(f.event_date, f.created_at::date) DESC, f.id DESC
            LIMIT 1
            `,
            [horse.id]
          );

          const lastDewormResult = await pool.query(
            `
            SELECT
              product_name,
              event_date,
              next_due_date,
              created_at
            FROM deworming_events
            WHERE horse_id = $1
            ORDER BY COALESCE(event_date, created_at::date) DESC, id DESC
            LIMIT 1
            `,
            [horse.id]
          );

          const lastFarrierResult = await pool.query(
            `
            SELECT
              service_type,
              event_date,
              next_due_date,
              created_at
            FROM farrier_events
            WHERE horse_id = $1
            ORDER BY COALESCE(event_date, created_at::date) DESC, id DESC
            LIMIT 1
            `,
            [horse.id]
          );

          const lastHealthResult = await pool.query(
            `
            SELECT
              event_type,
              description,
              event_date,
              notes,
              created_at
            FROM horse_health_events
            WHERE horse_id = $1
            ORDER BY COALESCE(event_date, created_at::date) DESC, id DESC
            LIMIT 1
            `,
            [horse.id]
          );

          const lastTreatmentPlanResult = await pool.query(
            `
            SELECT
              medication,
              dosage,
              frequency,
              start_date,
              duration_days,
              notes,
              created_at
            FROM treatment_plans
            WHERE horse_id = $1
            ORDER BY COALESCE(start_date, created_at::date) DESC, id DESC
            LIMIT 1
            `,
            [horse.id]
          );

          const lastTreatmentLogResult = await pool.query(
            `
            SELECT
              tl.administered_at,
              tl.notes,
              tp.medication,
              tp.dosage
            FROM treatment_logs tl
            JOIN treatment_plans tp ON tp.id = tl.treatment_plan_id
            WHERE tp.horse_id = $1
            ORDER BY tl.administered_at DESC, tl.id DESC
            LIMIT 1
            `,
            [horse.id]
          );
          const [currentGrazing, grazingHistoryRows] = await Promise.all([
            getHorseCurrentGrazing(horse.id),
            listGrazingHistory({ horseId: horse.id, limit: 1 }),
          ]);

          let reply = `Horse history: ${horseDisplayName}\n`;
          if (horseProfileBlock) {
            reply += `\n\n${horseProfileBlock}`;
          }

          if (lastFeedResult.rows.length > 0) {
            const feed = lastFeedResult.rows[0];
            reply += `\nLast feed
- ${feed.feed_name} ${feed.quantity} ${feed.unit} on ${formatDateForReply(feed.feed_date)}`;
          } else {
            reply += `\nLast feed
- No feed records`;
          }

          if (lastDewormResult.rows.length > 0) {
            const deworm = lastDewormResult.rows[0];
            reply += `\n\nLast deworming
- ${deworm.product_name} on ${formatDateForReply(deworm.event_date || deworm.created_at)}
- next due: ${formatDateForReply(deworm.next_due_date)}`;
          } else {
            reply += `\n\nLast deworming
- No deworming records`;
          }

          if (lastFarrierResult.rows.length > 0) {
            const farrier = lastFarrierResult.rows[0];
            reply += `\n\nLast farrier
- ${farrier.service_type} on ${formatDateForReply(farrier.event_date || farrier.created_at)}
- next due: ${formatDateForReply(farrier.next_due_date)}`;
          } else {
            reply += `\n\nLast farrier
- No farrier records`;
          }

          if (lastHealthResult.rows.length > 0) {
            const health = lastHealthResult.rows[0];
            reply += `\n\nLast health event
- ${health.event_type} on ${formatDateForReply(health.event_date || health.created_at)}
- ${health.description}`;
          } else {
            reply += `\n\nLast health event
- No health records`;
          }

          if (currentGrazing) {
            reply += `\n\nCurrent paddock
- ${currentGrazing.paddock_name}
- entered: ${formatDateForReply(currentGrazing.entered_at)}
- days on paddock: ${currentGrazing.grazing_days}`;
            if (currentGrazing.source_group_name) {
              reply += `\n- group move: ${currentGrazing.source_group_name}`;
            }
          } else if (grazingHistoryRows.length > 0) {
            const grazingRow = grazingHistoryRows[0];
            reply += `\n\nLast grazing
- ${grazingRow.paddock_name}
- in: ${formatDateForReply(grazingRow.entered_at)}
- out: ${formatDateForReply(grazingRow.exited_at)}
- days on paddock: ${grazingRow.grazing_days}`;
            if (grazingRow.source_group_name) {
              reply += `\n- group move: ${grazingRow.source_group_name}`;
            }
          } else {
            reply += `\n\nLast grazing
- No grazing records`;
          }

          if (lastTreatmentPlanResult.rows.length > 0) {
            const plan = lastTreatmentPlanResult.rows[0];
            reply += `\n\nLast treatment plan
- ${plan.medication} ${plan.dosage}
- frequency: ${plan.frequency}
- start: ${formatDateForReply(plan.start_date || plan.created_at)}
- duration: ${plan.duration_days} days`;
          } else {
            reply += `\n\nLast treatment plan
- No treatment plans`;
          }

          if (lastTreatmentLogResult.rows.length > 0) {
            const dose = lastTreatmentLogResult.rows[0];
            reply += `\n\nLast dose
- ${dose.medication} ${dose.dosage}
- given at: ${formatDateTimeForReply(dose.administered_at)}`;
          } else {
            reply += `\n\nLast dose
- No dose logs`;
          }

          reply += `\n\nFor full timeline use:
- history full ${horseDisplayName}`;

          await ctx.reply(reply);
          continue;
        }

        // -----------------------------
        // FULL TIMELINE
        // -----------------------------
        const fullHistoryResult = await pool.query(
          `
          SELECT *
          FROM (
            SELECT
              COALESCE(f.event_date::timestamp, f.created_at) AS sort_at,
              'feed' AS category,
              CONCAT(i.name, ' ', f.quantity, ' ', f.unit) AS detail
            FROM feed_events f
            JOIN feed_items i ON i.id = f.feed_item_id
            WHERE f.horse_id = $1

            UNION ALL

            SELECT
              COALESCE(d.event_date::timestamp, d.created_at) AS sort_at,
              'deworming' AS category,
              CONCAT(d.product_name, ' | next due: ', COALESCE(d.next_due_date::text, 'N/A')) AS detail
            FROM deworming_events d
            WHERE d.horse_id = $1

            UNION ALL

            SELECT
              COALESCE(fr.event_date::timestamp, fr.created_at) AS sort_at,
              'farrier' AS category,
              CONCAT(fr.service_type, ' | next due: ', COALESCE(fr.next_due_date::text, 'N/A')) AS detail
            FROM farrier_events fr
            WHERE fr.horse_id = $1

            UNION ALL

            SELECT
              COALESCE(hh.event_date::timestamp, hh.created_at) AS sort_at,
              'health' AS category,
              CONCAT(hh.event_type, ' | ', hh.description) AS detail
            FROM horse_health_events hh
            WHERE hh.horse_id = $1

            UNION ALL

            SELECT
              COALESCE(ge.exited_at::timestamp, ge.entered_at::timestamp) AS sort_at,
              'grazing' AS category,
              CONCAT(
                p.name,
                ' | in: ',
                ge.entered_at::text,
                ' | out: ',
                COALESCE(ge.exited_at::text, 'Current'),
                ' | days: ',
                CASE
                  WHEN ge.exited_at IS NULL
                    THEN GREATEST(1, (CURRENT_DATE - ge.entered_at) + 1)
                  ELSE GREATEST(1, (ge.exited_at - ge.entered_at) + 1)
                END,
                COALESCE(CONCAT(' | group: ', sg.name), ''),
                COALESCE(CONCAT(' | note: ', ge.entry_notes), ''),
                COALESCE(CONCAT(' | exit note: ', ge.exit_notes), '')
              ) AS detail
            FROM grazing_events ge
            JOIN paddocks p ON p.id = ge.paddock_id
            LEFT JOIN horse_groups sg ON sg.id = ge.source_group_id
            WHERE ge.horse_id = $1

            UNION ALL

            SELECT
              COALESCE(tp.start_date::timestamp, tp.created_at) AS sort_at,
              'treatment_plan' AS category,
              CONCAT(
                tp.medication,
                ' ',
                tp.dosage,
                ' | frequency: ',
                tp.frequency,
                ' | duration: ',
                tp.duration_days,
                ' days'
              ) AS detail
            FROM treatment_plans tp
            WHERE tp.horse_id = $1

            UNION ALL

            SELECT
              tl.administered_at AS sort_at,
              'dose' AS category,
              CONCAT(tp.medication, ' ', tp.dosage) AS detail
            FROM treatment_logs tl
            JOIN treatment_plans tp ON tp.id = tl.treatment_plan_id
            WHERE tp.horse_id = $1

          ) history_rows
          ORDER BY sort_at DESC
          LIMIT 120
          `,
          [horse.id]
        );

        if (fullHistoryResult.rows.length === 0) {
          await ctx.reply(`No history records found for ${horseDisplayName}.`);
          continue;
        }

        const lines = fullHistoryResult.rows.map((row) => {
          const when =
            row.category === 'dose'
              ? formatDateTimeWithWeekdayForReply(row.sort_at)
              : formatDateWithWeekdayForReply(row.sort_at);
          return `- [${row.category}] ${when} | ${row.detail}`;
        });

        // Telegram messages can get too long, so split if needed
        const chunks = [];
        let currentChunk = `Full history: ${horseDisplayName}\n\n`;
        if (horseProfileBlock) {
          currentChunk += `${horseProfileBlock}\n\n`;
        }

        for (const line of lines) {
          if ((currentChunk + line + '\n').length > 3500) {
            chunks.push(currentChunk);
            currentChunk = `Full history: ${horseDisplayName} (continued)\n\n`;
          }
          currentChunk += `${line}\n`;
        }

        if (currentChunk.trim()) {
          chunks.push(currentChunk);
        }

        for (const chunk of chunks) {
          await ctx.reply(chunk.trim());
        }

        continue;
      }

      // -----------------------------
      // STOCK SET (absolute + unit)
      // -----------------------------
      if (lowerMessage.startsWith('stock set ')) {
        const remainder = messageText.slice('stock set '.length).trim();
        const remainderParts = remainder.split(/\s+/).filter(Boolean);

        if (remainderParts.length < 2) {
          await ctx.reply('Use: stock set <feed item> <quantity> [unit]');
          continue;
        }

        let quantity;
        let unit;
        let itemName;

        const compactQuantityUnit = parseCompactQuantityUnit(
          remainderParts[remainderParts.length - 1]
        );

        if (compactQuantityUnit) {
          quantity = compactQuantityUnit.quantity;
          unit = compactQuantityUnit.unit;
          itemName = remainderParts.slice(0, -1).join(' ').toLowerCase();
        } else {
          quantity = Number(remainderParts[remainderParts.length - 2]);
          unit = remainderParts[remainderParts.length - 1].toLowerCase();
          itemName = remainderParts.slice(0, -2).join(' ').toLowerCase();
        }

        if (!itemName || Number.isNaN(quantity) || quantity < 0) {
          await ctx.reply('Invalid stock command. Example: stock set alfalfa 11 bale');
          continue;
        }

        const feedItem = await findFeedItemByName(itemName);
        let feedNameForReply = itemName;
        let updatedStockResult;
        let stockSetMode = 'updated';

        if (!feedItem) {
          updatedStockResult = await pool.query(
            `
            INSERT INTO feed_items (name, unit, current_stock)
            VALUES ($1, $2, $3)
            RETURNING name, current_stock, unit
            `,
            [itemName, unit, quantity]
          );
          feedNameForReply = updatedStockResult.rows[0].name;
          stockSetMode = 'created';
        } else {
          feedNameForReply = feedItem.name;
          updatedStockResult = await pool.query(
            `
            UPDATE feed_items
            SET current_stock = $1,
                unit = $2
            WHERE id = $3
            RETURNING name, current_stock, unit
            `,
            [quantity, unit, feedItem.id]
          );
        }

        await ctx.reply(
          `Stock ${stockSetMode === 'created' ? 'created' : 'updated'} ✅

Feed: ${feedNameForReply}
Current stock: ${updatedStockResult.rows[0].current_stock} ${updatedStockResult.rows[0].unit}
Raw message ID: ${rawMessageId}`
        );

        sendRemindersToAlertChat().catch((error) => {
          console.error('REMINDER ERROR:', error);
        });
        continue;
      }

      // -----------------------------
      // STOCK USE (consume without horse) + history log
      // stock use <feed item> <quantity> <unit> [YYYY-MM-DD] [notes...]
      // Example:
      // stock use alfalfa 1 bale
      // stock use alfalfa 1 bale 2026-03-30
      // stock use alfalfa 1 bale 2026-03-30 opened new bale
      // -----------------------------
      if (lowerMessage.startsWith('stock use ')) {
        const remainder = messageText.slice('stock use '.length).trim();
        const remainderParts = remainder.split(/\s+/).filter(Boolean);

        if (remainderParts.length < 3) {
          await ctx.reply(
            'Use: stock use <feed item> <quantity> <unit> [YYYY-MM-DD] [notes]'
          );
          continue;
        }

        let eventDate = todayDateString();
        let notes = '';
        let workingParts = [...remainderParts];

        const maybeDateIndex = workingParts.findIndex((part) => looksLikeDateString(part));

        if (maybeDateIndex !== -1) {
          const maybeDate = workingParts[maybeDateIndex];

          if (!isValidDateString(maybeDate)) {
            await ctx.reply(`Invalid calendar date: ${maybeDate}`);
            continue;
          }

          eventDate = maybeDate;
          notes = workingParts.slice(maybeDateIndex + 1).join(' ').trim();
          workingParts = workingParts.slice(0, maybeDateIndex);
        }

        if (workingParts.length < 3) {
          await ctx.reply(
            'Use: stock use <feed item> <quantity> <unit> [YYYY-MM-DD] [notes]'
          );
          continue;
        }

        const unit = workingParts[workingParts.length - 1].toLowerCase();
        const quantity = Number(workingParts[workingParts.length - 2]);
        const itemName = workingParts.slice(0, -2).join(' ').toLowerCase();

        if (!itemName || Number.isNaN(quantity) || quantity <= 0) {
          await ctx.reply(
            'Invalid stock command. Example: stock use alfalfa 1 bale 2026-03-30 opened new bale'
          );
          continue;
        }

        const feedItem = await findFeedItemByName(itemName);

        if (!feedItem) {
          await ctx.reply(`Feed item not found: ${itemName}`);
          continue;
        }

        if (feedItem.unit.toLowerCase() !== unit) {
          await ctx.reply(`Unit mismatch. Expected ${feedItem.unit}`);
          continue;
        }

        if (Number(feedItem.current_stock) < quantity) {
          await ctx.reply(
            `Not enough stock. ${feedItem.name} has ${feedItem.current_stock} ${feedItem.unit}`
          );
          continue;
        }

        const updatedStockResult = await pool.query(
          `
          UPDATE feed_items
          SET current_stock = current_stock - $1
          WHERE id = $2
          RETURNING current_stock
          `,
          [quantity, feedItem.id]
        );

        await pool.query(
          `
          INSERT INTO stock_events (
            feed_item_id,
            event_type,
            quantity,
            unit,
            event_date,
            notes,
            telegram_user_id
          )
          VALUES ($1, 'use', $2, $3, $4, $5, $6)
          `,
          [feedItem.id, quantity, unit, eventDate, notes || null, telegramUserId]
        );

        await ctx.reply(
          `Stock used ✅

Feed: ${feedItem.name}
Used: ${quantity} ${unit}
Date: ${eventDate}
${notes ? `Notes: ${notes}\n` : ''}Remaining stock: ${updatedStockResult.rows[0].current_stock} ${unit}
Raw message ID: ${rawMessageId}`
        );

        sendRemindersToAlertChat().catch((error) => {
          console.error('REMINDER ERROR:', error);
        });
        continue;
      }

      // -----------------------------
      // STOCK ADD + history log
      // stock add <feed item> <quantity> <unit> [YYYY-MM-DD] [notes...]
      // Example:
      // stock add alfalfa 10 bale
      // stock add alfalfa 10 bale 2026-03-30
      // stock add alfalfa 10 bale 2026-03-30 bought from Juan
      // -----------------------------
      if (lowerMessage.startsWith('stock add ')) {
        const remainder = messageText.slice('stock add '.length).trim();
        const remainderParts = remainder.split(/\s+/).filter(Boolean);

        if (remainderParts.length < 3) {
          await ctx.reply(
            'Use: stock add <feed item> <quantity> <unit> [YYYY-MM-DD] [notes]'
          );
          continue;
        }

        let eventDate = todayDateString();
        let notes = '';
        let workingParts = [...remainderParts];

        const maybeDateIndex = workingParts.findIndex((part) => looksLikeDateString(part));

        if (maybeDateIndex !== -1) {
          const maybeDate = workingParts[maybeDateIndex];

          if (!isValidDateString(maybeDate)) {
            await ctx.reply(`Invalid calendar date: ${maybeDate}`);
            continue;
          }

          eventDate = maybeDate;
          notes = workingParts.slice(maybeDateIndex + 1).join(' ').trim();
          workingParts = workingParts.slice(0, maybeDateIndex);
        }

        if (workingParts.length < 3) {
          await ctx.reply(
            'Use: stock add <feed item> <quantity> <unit> [YYYY-MM-DD] [notes]'
          );
          continue;
        }

        const unit = workingParts[workingParts.length - 1].toLowerCase();
        const quantity = Number(workingParts[workingParts.length - 2]);
        const itemName = workingParts.slice(0, -2).join(' ').toLowerCase();

        if (!itemName || Number.isNaN(quantity) || quantity <= 0) {
          await ctx.reply(
            'Invalid stock command. Example: stock add alfalfa 10 bale 2026-03-30 bought from Juan'
          );
          continue;
        }

        const feedItem = await findFeedItemByName(itemName);

        if (!feedItem) {
          await ctx.reply(`Feed item not found: ${itemName}`);
          continue;
        }

        if (feedItem.unit.toLowerCase() !== unit) {
          await ctx.reply(`Unit mismatch. Expected ${feedItem.unit}`);
          continue;
        }

        const updatedStockResult = await pool.query(
          `
          UPDATE feed_items
          SET current_stock = current_stock + $1
          WHERE id = $2
          RETURNING current_stock
          `,
          [quantity, feedItem.id]
        );

        await pool.query(
          `
          INSERT INTO stock_events (
            feed_item_id,
            event_type,
            quantity,
            unit,
            event_date,
            notes,
            telegram_user_id
          )
          VALUES ($1, 'add', $2, $3, $4, $5, $6)
          `,
          [feedItem.id, quantity, unit, eventDate, notes || null, telegramUserId]
        );

        await ctx.reply(
          `Stock added ✅

Feed: ${feedItem.name}
Added: ${quantity} ${unit}
Date: ${eventDate}
${notes ? `Notes: ${notes}\n` : ''}Current stock: ${updatedStockResult.rows[0].current_stock} ${unit}
Raw message ID: ${rawMessageId}`
        );

        sendRemindersToAlertChat().catch((error) => {
          console.error('REMINDER ERROR:', error);
        });
        continue;
      }

      // -----------------------------
      // STOCK ALL
      // -----------------------------
      if (lowerMessage === 'stock') {
        const stockResult = await pool.query(`
          SELECT name, unit, current_stock
          FROM feed_items
          ORDER BY name ASC
        `);

        if (stockResult.rows.length === 0) {
          await ctx.reply('No feed items found.');
          continue;
        }

        const lines = stockResult.rows.map(
          (row) => `${row.name}: ${row.current_stock} ${row.unit}`
        );

        await ctx.reply(`Current stock\n\n${lines.join('\n')}`);
        continue;
      }

      // -----------------------------
      // STOCK HISTORY
      // stock history <feed item>
      // -----------------------------
      if (lowerMessage.startsWith('stock history ')) {
        const itemName = messageText.slice('stock history '.length).trim().toLowerCase();

        if (!itemName) {
          await ctx.reply('Use: stock history <feed item>');
          continue;
        }

        const feedItem = await findFeedItemByName(itemName);

        if (!feedItem) {
          await ctx.reply(`Feed item not found: ${itemName}`);
          continue;
        }

        const result = await pool.query(
          `
          SELECT
            event_type,
            quantity,
            unit,
            event_date,
            notes
          FROM stock_events
          WHERE feed_item_id = $1
          ORDER BY event_date DESC, id DESC
          LIMIT 20
          `,
          [feedItem.id]
        );

        if (result.rows.length === 0) {
          await ctx.reply(`No stock history found for ${feedItem.name}.`);
          continue;
        }

        const lines = result.rows.map((row) => {
          return `- ${row.event_type} ${row.quantity} ${row.unit} on ${formatDateForReply(row.event_date)}${row.notes ? ` | ${row.notes}` : ''}`;
        });

        await ctx.reply(`Stock history: ${feedItem.name}\n\n${lines.join('\n')}`);
        continue;
      }

      // -----------------------------
      // STOCK ONE ITEM
      // -----------------------------
      if (command === 'stock' && parts.length >= 2) {
        const itemName = parts.slice(1).join(' ').toLowerCase();

        const item = await findFeedItemByName(itemName);

        if (!item) {
          await ctx.reply(`Feed item not found: ${itemName}`);
          continue;
        }

        await ctx.reply(`${item.name}: ${item.current_stock} ${item.unit}`);
        continue;
      }

      // -----------------------------
      // FEED COMMAND
      // -----------------------------
      if (command === 'feed' && parts.length >= 4) {
        const lastPart = parts[parts.length - 1];

        let eventDate = todayDateString();
        let unit;
        let quantity;
        let itemName;
        let horseName;
        let feedPartsEnd = parts.length;

        if (looksLikeDateString(lastPart) && !isValidDateString(lastPart)) {
          await ctx.reply(`Invalid calendar date: ${lastPart}`);
          continue;
        }

        if (isValidDateString(lastPart)) {
          eventDate = lastPart;
          feedPartsEnd -= 1;
        }

        const compactQuantityUnit = parseCompactQuantityUnit(parts[feedPartsEnd - 1]);

        if (compactQuantityUnit) {
          quantity = compactQuantityUnit.quantity;
          unit = compactQuantityUnit.unit;
          itemName = parts[feedPartsEnd - 2]?.toLowerCase();
          horseName = parts.slice(1, feedPartsEnd - 2).join(' ').toLowerCase();
        } else {
          unit = parts[feedPartsEnd - 1]?.toLowerCase();
          quantity = Number(parts[feedPartsEnd - 2]);
          itemName = parts[feedPartsEnd - 3]?.toLowerCase();
          horseName = parts.slice(1, feedPartsEnd - 3).join(' ').toLowerCase();
        }

        if (!horseName || !itemName || Number.isNaN(quantity) || quantity <= 0) {
          await ctx.reply('Invalid quantity. Example: feed imperial oats 2 kg');
          continue;
        }

        const horse = await findHorseByName(horseName);

        if (!horse) {
          const horses = await listHorseNames();
          await ctx.reply(
            `Horse not found: ${horseName}

Available horses:
${horses.map((h) => `- ${h}`).join('\n')}`
          );
          continue;
        }

        const feedItem = await findFeedItemByName(itemName);

        if (!feedItem) {
          await ctx.reply(`Feed item not found: ${itemName}`);
          continue;
        }

        if (feedItem.unit.toLowerCase() !== unit) {
          await ctx.reply(`Unit mismatch. Expected ${feedItem.unit}`);
          continue;
        }

        if (Number(feedItem.current_stock) < quantity) {
          await ctx.reply(
            `Not enough stock. ${feedItem.name} has ${feedItem.current_stock} ${feedItem.unit}`
          );
          continue;
        }

        const feedEventResult = await pool.query(
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
          RETURNING id
          `,
          [horse.id, feedItem.id, quantity, unit, telegramUserId, eventDate]
        );

        const updatedStockResult = await pool.query(
          `
          UPDATE feed_items
          SET current_stock = current_stock - $1
          WHERE id = $2
          RETURNING current_stock
          `,
          [quantity, feedItem.id]
        );

        await ctx.reply(
          `Feed recorded ✅

Horse: ${horse.name}
Feed: ${feedItem.name}
Amount: ${quantity} ${unit}
Date: ${eventDate}
Remaining stock: ${updatedStockResult.rows[0].current_stock} ${unit}
Raw message ID: ${rawMessageId}
Feed event ID: ${feedEventResult.rows[0].id}`
        );

        sendRemindersToAlertChat().catch((error) => {
          console.error('REMINDER ERROR:', error);
        });
        continue;
      }

            // -----------------------------
            // RAIN TODAY
            // -----------------------------
            if (lowerMessage === 'rain today') {
              const result = await pool.query(
                `
                SELECT event_date, rain_mm, notes
                FROM rain_registry
                WHERE event_date = CURRENT_DATE
                LIMIT 1
                `
              );

              if (result.rows.length === 0) {
                await ctx.reply(`No rain saved for today (${todayDateString()}).`);
                continue;
              }

              const row = result.rows[0];
              await ctx.reply(
                `Rain today\n\nDate: ${formatDateForReply(row.event_date)}\nRain: ${Number(row.rain_mm)} mm${row.notes ? `\nNotes: ${row.notes}` : ''}`
              );
              continue;
            }

            // -----------------------------
            // RAIN HISTORY
            // rain history
            // rain history 30
            // -----------------------------
            if (lowerMessage === 'rain history' || lowerMessage.startsWith('rain history ')) {
              const rawLimit = messageText.slice('rain history'.length).trim();
              const limit = Math.min(parsePositiveInt(rawLimit, 20), 100);

              const result = await pool.query(
                `
                SELECT event_date, rain_mm, notes
                FROM rain_registry
                ORDER BY event_date DESC, id DESC
                LIMIT $1
                `,
                [limit]
              );

              if (result.rows.length === 0) {
                await ctx.reply('No rain records found.');
                continue;
              }

              const lines = result.rows.map((row) => {
                return `- ${formatDateForReply(row.event_date)}: ${Number(row.rain_mm)} mm${row.notes ? ` | ${row.notes}` : ''}`;
              });

              await ctx.reply(`Rain history (latest ${limit})\n\n${lines.join('\n')}`);
              continue;
            }

            // -----------------------------
            // RAIN YEAR (year-over-year comparison)
            // rain year
            // -----------------------------
            if (lowerMessage === 'rain year') {
              const currentYear = new Date().getFullYear();
              const previousYear = currentYear - 1;

              const ytdResult = await pool.query(
                `
                SELECT
                  EXTRACT(YEAR FROM event_date)::int AS year,
                  COALESCE(SUM(rain_mm), 0)::numeric AS total_mm,
                  COUNT(*) FILTER (WHERE rain_mm > 0)::int AS rainy_days
                FROM rain_registry
                WHERE COALESCE(source, 'manual') <> 'weather_sync'
                  AND EXTRACT(DOY FROM event_date) <= EXTRACT(DOY FROM CURRENT_DATE)
                  AND EXTRACT(YEAR FROM event_date) IN ($1, $2)
                GROUP BY EXTRACT(YEAR FROM event_date)
                `,
                [currentYear, previousYear]
              );

              const yearlyResult = await pool.query(
                `
                SELECT
                  EXTRACT(YEAR FROM event_date)::int AS year,
                  COALESCE(SUM(rain_mm), 0)::numeric AS total_mm
                FROM rain_registry
                WHERE COALESCE(source, 'manual') <> 'weather_sync'
                GROUP BY EXTRACT(YEAR FROM event_date)
                ORDER BY year DESC
                LIMIT 5
                `
              );

              const ytdByYear = new Map(ytdResult.rows.map((row) => [row.year, row]));
              const currentYtd = ytdByYear.get(currentYear);
              const previousYtd = ytdByYear.get(previousYear);

              if (!currentYtd && !previousYtd) {
                await ctx.reply('No rain records found yet to compare years.');
                continue;
              }

              const currentTotal = Number(currentYtd?.total_mm || 0);
              const previousTotal = Number(previousYtd?.total_mm || 0);
              const deltaMm = currentTotal - previousTotal;
              const deltaPercent = previousTotal > 0 ? Math.round((deltaMm / previousTotal) * 1000) / 10 : null;

              const lines = [
                'Rain year comparison',
                '',
                `${currentYear} so far: ${currentTotal.toFixed(1)} mm${currentYtd ? ` (${currentYtd.rainy_days} rainy days)` : ''}`,
                previousYtd
                  ? `${previousYear} same period: ${previousTotal.toFixed(1)} mm (${previousYtd.rainy_days} rainy days)`
                  : `${previousYear} same period: no data`,
                previousYtd
                  ? `Difference: ${deltaMm >= 0 ? '+' : ''}${deltaMm.toFixed(1)} mm${deltaPercent != null ? ` (${deltaPercent >= 0 ? '+' : ''}${deltaPercent}%)` : ''}`
                  : null,
              ].filter(Boolean);

              if (yearlyResult.rows.length) {
                lines.push('', 'Recent full years:');
                yearlyResult.rows.forEach((row) => {
                  lines.push(`- ${row.year}: ${Number(row.total_mm).toFixed(1)} mm`);
                });
              }

              await ctx.reply(lines.join('\n'));
              continue;
            }

            // -----------------------------
            // RAIN SEASONAL (historical monthly averages)
            // rain seasonal
            // -----------------------------
            if (lowerMessage === 'rain seasonal' || lowerMessage === 'rain months') {
              const result = await pool.query(
                `
                SELECT
                  EXTRACT(MONTH FROM event_date)::int AS month,
                  COALESCE(SUM(rain_mm), 0)::numeric AS total_mm,
                  COUNT(DISTINCT EXTRACT(YEAR FROM event_date))::int AS years_count
                FROM rain_registry
                WHERE COALESCE(source, 'manual') <> 'weather_sync'
                  AND event_date < DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY EXTRACT(MONTH FROM event_date)
                ORDER BY month ASC
                `
              );

              if (result.rows.length === 0) {
                await ctx.reply('Not enough rain history yet to show seasonal averages.');
                continue;
              }

              const monthNames = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
              ];

              const months = result.rows.map((row) => ({
                month: row.month,
                avgMm: row.years_count > 0 ? Number(row.total_mm) / row.years_count : 0,
                yearsCount: row.years_count,
              }));

              const wettest = months.reduce((best, m) => (m.avgMm > (best?.avgMm ?? -1) ? m : best), null);
              const driest = months.reduce((worst, m) => (worst == null || m.avgMm < worst.avgMm ? m : worst), null);

              const lines = ['Rain by month (historical average)', ''];
              months.forEach((m) => {
                lines.push(`${monthNames[m.month - 1]}: ${m.avgMm.toFixed(1)} mm avg (${m.yearsCount} yr)`);
              });
              lines.push('');
              lines.push(`Wettest: ${monthNames[wettest.month - 1]} (${wettest.avgMm.toFixed(1)} mm avg)`);
              lines.push(`Driest: ${monthNames[driest.month - 1]} (${driest.avgMm.toFixed(1)} mm avg)`);

              await ctx.reply(lines.join('\n'));
              continue;
            }

            // -----------------------------
            // RAIN SAVE / UPDATE
            // rain <mm> [YYYY-MM-DD] [notes...]
            // -----------------------------
            if (lowerMessage.startsWith('rain ')) {
              const remainder = messageText.slice('rain '.length).trim();

              if (!remainder) {
                await ctx.reply('Use: rain <mm> [YYYY-MM-DD] [notes]');
                continue;
              }

              const rainParts = remainder.split(/\s+/).filter(Boolean);
              const rainMm = Number(rainParts[0]);

              if (!Number.isFinite(rainMm) || rainMm < 0) {
                await ctx.reply('Rain must be a number >= 0. Example: rain 12.5 2026-04-12 heavy');
                continue;
              }

              let eventDate = todayDateString();
              let notesStartIndex = 1;

              if (rainParts.length > 1 && looksLikeDateString(rainParts[1])) {
                if (!isValidDateString(rainParts[1])) {
                  await ctx.reply(`Invalid calendar date: ${rainParts[1]}`);
                  continue;
                }

                eventDate = rainParts[1];
                notesStartIndex = 2;
              }

              const notes = rainParts.slice(notesStartIndex).join(' ').trim();

              const upsertResult = await pool.query(
                `
                INSERT INTO rain_registry (
                  event_date,
                  rain_mm,
                  source,
                  notes,
                  telegram_user_id
                )
                VALUES ($1, $2, 'telegram', $3, $4)
                ON CONFLICT (event_date) DO UPDATE
                SET rain_mm = EXCLUDED.rain_mm,
                    source = EXCLUDED.source,
                    notes = EXCLUDED.notes,
                    telegram_user_id = EXCLUDED.telegram_user_id,
                    updated_at = NOW()
                RETURNING event_date, rain_mm, notes
                `,
                [eventDate, rainMm, notes || null, telegramUserId]
              );

              const saved = upsertResult.rows[0];

              await ctx.reply(
                `Rain saved ✅\n\nDate: ${formatDateForReply(saved.event_date)}\nRain: ${Number(saved.rain_mm)} mm${saved.notes ? `\nNotes: ${saved.notes}` : ''}\nRaw message ID: ${rawMessageId}`
              );
              continue;
            }

            // -----------------------------
            // SCHEDULE LIST
            // schedule list
            // -----------------------------
            if (lowerMessage === 'schedule list') {
              const rows = await getPendingScheduledRows();

              if (rows.length === 0) {
                await ctx.reply('No pending scheduled tasks.');
                continue;
              }

              const lines = rows.slice(0, 30).map((row) => {
                const who = row.horse_name || 'Campo';
                return `- #${row.id} | ${formatDateForReply(row.event_date)} | ${who} | ${row.category} | ${row.title}`;
              });

              await ctx.reply(`Scheduled tasks (pending)\n\n${lines.join('\n')}`);
              continue;
            }

            // -----------------------------
            // SCHEDULE DONE
            // schedule done <id>
            // -----------------------------
            if (lowerMessage.startsWith('schedule done ')) {
              const idRaw = messageText.slice('schedule done '.length).trim();
              const id = parsePositiveInt(idRaw, null);

              if (!id) {
                await ctx.reply('Use: schedule done <id>. Find the id with "schedule list".');
                continue;
              }

              let updated;
              try {
                updated = await updateFarmVisitStatus(id, 'done');
              } catch (error) {
                await ctx.reply(error.message || 'Could not update that scheduled task.');
                continue;
              }

              if (!updated) {
                await ctx.reply(`No scheduled task found with id ${id}.`);
                continue;
              }

              await ctx.reply(
                `Scheduled task #${id} marked as done ✅${updated.health_event_id ? '\nAlso logged to the horse health history.' : ''}`
              );
              continue;
            }

            // -----------------------------
            // SCHEDULE MISSED
            // schedule missed <id>
            // -----------------------------
            if (lowerMessage.startsWith('schedule missed ')) {
              const idRaw = messageText.slice('schedule missed '.length).trim();
              const id = parsePositiveInt(idRaw, null);

              if (!id) {
                await ctx.reply('Use: schedule missed <id>. Find the id with "schedule list".');
                continue;
              }

              let updated;
              try {
                updated = await updateFarmVisitStatus(id, 'missed');
              } catch (error) {
                await ctx.reply(error.message || 'Could not update that scheduled task.');
                continue;
              }

              if (!updated) {
                await ctx.reply(`No scheduled task found with id ${id}.`);
                continue;
              }

              await ctx.reply(`Scheduled task #${id} marked as missed.`);
              continue;
            }

            // -----------------------------
            // SCHEDULE ADD
            // schedule <horse name or -> | <category> | <title> | <YYYY-MM-DD> | [notes]
            // -----------------------------
            if (lowerMessage.startsWith('schedule ')) {
              const remainder = messageText.slice('schedule '.length).trim();
              const usage =
                'Use: schedule <horse name or -> | <category> | <title> | <YYYY-MM-DD> | [notes]\nCategories: vet, deworming, farrier, visit, note';

              if (!remainder) {
                await ctx.reply(usage);
                continue;
              }

              const segments = parsePipeSegments(remainder);
              if (segments.length < 4) {
                await ctx.reply(usage);
                continue;
              }

              const horseNameRaw = segments[0].trim();
              const categoryRaw = segments[1].trim().toLowerCase();
              const title = segments[2].trim();
              const eventDateRaw = segments[3].trim();
              const notes = segments.slice(4).join(' | ').trim();

              const ALLOWED_SCHEDULE_CATEGORIES = new Set(['visit', 'deworming', 'farrier', 'vet', 'note']);

              if (!title) {
                await ctx.reply('The title cannot be empty.');
                continue;
              }

              if (!ALLOWED_SCHEDULE_CATEGORIES.has(categoryRaw)) {
                await ctx.reply('Category must be one of: vet, deworming, farrier, visit, note');
                continue;
              }

              if (!isValidDateString(eventDateRaw)) {
                await ctx.reply(`Invalid calendar date: ${eventDateRaw}`);
                continue;
              }

              let horseId = null;
              if (horseNameRaw && !['-', 'campo', 'field', 'none'].includes(horseNameRaw.toLowerCase())) {
                const horse = await findHorseByName(horseNameRaw);
                if (!horse) {
                  await ctx.reply(`No horse found named "${horseNameRaw}". Use - for a general farm task.`);
                  continue;
                }
                horseId = horse.id;
              }

              await ensureFarmVisitsTable();

              const insertResult = await pool.query(
                `
                INSERT INTO farm_visits (event_date, category, title, notes, horse_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, event_date
                `,
                [eventDateRaw, categoryRaw, title, notes || null, horseId]
              );

              const saved = insertResult.rows[0];

              await ctx.reply(
                `Scheduled ✅\n\n#${saved.id} | ${horseId ? horseNameRaw : 'Campo'} | ${categoryRaw} | ${title}\nDate: ${formatDateForReply(saved.event_date)}`
              );
              continue;
            }


      // -----------------------------
      // DEWORM DUE
      // -----------------------------
      if (lowerMessage === 'deworm due') {
        const dewormRows = await getLatestDewormRows();

        if (dewormRows.length === 0) {
          await ctx.reply('No deworming reminder records found.');
          continue;
        }

        const { overdue, dueSoon } = buildDewormReminderGroups(
          dewormRows,
          DEWORM_ALERT_DAYS_AHEAD
        );

        if (overdue.length === 0 && dueSoon.length === 0) {
          await ctx.reply('No horses are due soon or overdue for deworming.');
          continue;
        }

        let reply = 'Deworming reminders\n\n';

        if (overdue.length > 0) {
          reply += `Overdue:\n${overdue.map((item) => item.line).join('\n')}\n\n`;
        }

        if (dueSoon.length > 0) {
          reply += `Due soon:\n${dueSoon.map((item) => item.line).join('\n')}`;
        }

        await ctx.reply(reply.trim());
        continue;
      }

      // -----------------------------
      // DEWORM HISTORY
      // deworm history
      // deworm history <horse name>
      // -----------------------------
      if (
        lowerMessage === 'deworm history' ||
        lowerMessage.startsWith('deworm history ')
      ) {
        const horseName = messageText.slice('deworm history'.length).trim();

        // ALL HORSES
        if (!horseName) {
          const result = await pool.query(
            `
            SELECT
              h.name AS horse_name,
              d.product_name,
              d.event_date,
              d.second_dose_date,
              d.next_due_date,
              d.created_at
            FROM deworming_events d
            JOIN horses h ON h.id = d.horse_id
            ORDER BY COALESCE(d.event_date, d.created_at::date) DESC, d.id DESC
            LIMIT 50
            `
          );

          if (result.rows.length === 0) {
            await ctx.reply('No deworming history records found.');
            continue;
          }

          const lines = result.rows.map((row) => {
            const eventDate = formatDateForReply(row.event_date || row.created_at);
            const secondDose = formatDateForReply(row.second_dose_date);
            const nextDue = formatDateForReply(row.next_due_date);
            return `- ${row.horse_name} | ${row.product_name} | first dose: ${eventDate} | second dose: ${secondDose} | next deworming: ${nextDue}`;
          });

          const reply = `Deworming history (latest 50)\n\n${lines.join('\n')}`;

          if (reply.length > 3500) {
            const chunks = [];
            let currentChunk = 'Deworming history (latest 50)\n\n';

            for (const line of lines) {
              if ((currentChunk + line + '\n').length > 3500) {
                chunks.push(currentChunk);
                currentChunk = 'Deworming history (continued)\n\n';
              }
              currentChunk += `${line}\n`;
            }

            if (currentChunk.trim()) {
              chunks.push(currentChunk);
            }

            for (const chunk of chunks) {
              await ctx.reply(chunk.trim());
            }
          } else {
            await ctx.reply(reply);
          }

          continue;
        }

        // ONE HORSE
        const horse = await findHorseByName(horseName);

        if (!horse) {
          const horses = await listHorseNames();
          await ctx.reply(
            `Horse not found: ${horseName}

Available horses:
${horses.map((h) => `- ${h}`).join('\n')}`
          );
          continue;
        }

        const result = await pool.query(
          `
          SELECT
            product_name,
            event_date,
            second_dose_date,
            next_due_date,
            created_at
          FROM deworming_events
          WHERE horse_id = $1
          ORDER BY COALESCE(event_date, created_at::date) DESC, id DESC
          `,
          [horse.id]
        );

        if (result.rows.length === 0) {
          await ctx.reply(`No deworming history found for ${horse.name}.`);
          continue;
        }

        const lines = result.rows.map((row) => {
          const eventDate = formatDateForReply(row.event_date || row.created_at);
          const secondDose = formatDateForReply(row.second_dose_date);
          const nextDue = formatDateForReply(row.next_due_date);
          return `- ${row.product_name} | first dose: ${eventDate} | second dose: ${secondDose} | next deworming: ${nextDue}`;
        });

        const reply = `Deworming history: ${horse.name}\n\n${lines.join('\n')}`;

        if (reply.length > 3500) {
          const chunks = [];
          let currentChunk = `Deworming history: ${horse.name}\n\n`;

          for (const line of lines) {
            if ((currentChunk + line + '\n').length > 3500) {
              chunks.push(currentChunk);
              currentChunk = `Deworming history: ${horse.name} (continued)\n\n`;
            }
            currentChunk += `${line}\n`;
          }

          if (currentChunk.trim()) {
            chunks.push(currentChunk);
          }

          for (const chunk of chunks) {
            await ctx.reply(chunk.trim());
          }
        } else {
          await ctx.reply(reply);
        }

        continue;
      }

      // -----------------------------
      // DEWORM DONE (second dose updates next due date)
      // deworm done <horse name> <product> <YYYY-MM-DD>
      // Example:
      // deworm done Francisco ivermectin 2026-03-16
      // -----------------------------
      if (lowerMessage.startsWith('deworm done ')) {
        const allHorses = await listHorseNames();

        let matchedHorse = null;
        let matchedHorseName = '';

        for (const horseName of allHorses) {
          const prefix = `deworm done ${horseName.toLowerCase()} `;
          if (lowerMessage.startsWith(prefix)) {
            matchedHorseName = horseName;
            matchedHorse = await findHorseByName(horseName);
            break;
          }
        }

        if (!matchedHorse) {
          await ctx.reply(
            `Horse not found.

Available horses:
${allHorses.map((h) => `- ${h}`).join('\n')}`
          );
          continue;
        }

        const remainder = messageText
          .slice(`deworm done ${matchedHorseName}`.length)
          .trim();

        const remainderParts = remainder.split(/\s+/).filter(Boolean);

        if (remainderParts.length < 2) {
          await ctx.reply(
            'Use: deworm done <horse name> <product> <YYYY-MM-DD>'
          );
          continue;
        }

        const datePart = remainderParts[remainderParts.length - 1];
        const productName = remainderParts.slice(0, -1).join(' ').trim();

        if (looksLikeDateString(datePart) && !isValidDateString(datePart)) {
          await ctx.reply(`Invalid calendar date: ${datePart}`);
          continue;
        }

        if (!isValidDateString(datePart)) {
          await ctx.reply('Date must be YYYY-MM-DD');
          continue;
        }

        // Find the latest deworm event for this horse + product
        const latestDewormResult = await pool.query(
          `
          SELECT
            id,
            product_name,
            event_date,
            next_due_date,
            second_dose_date
          FROM deworming_events
          WHERE horse_id = $1
            AND LOWER(product_name) = LOWER($2)
          ORDER BY COALESCE(event_date, created_at::date) DESC, id DESC
          LIMIT 1
          `,
          [matchedHorse.id, productName]
        );

        if (latestDewormResult.rows.length === 0) {
          await ctx.reply(
            `No deworming event found for ${matchedHorse.name} with product ${productName}`
          );
          continue;
        }

        const latest = latestDewormResult.rows[0];

        if (latest.second_dose_date) {
          // Allow recalculation of next deworming date if second dose is already set.
          const secondDoseDate = formatDateForReply(latest.second_dose_date);
          const nextDewormingDate = addMonthsToDateString(secondDoseDate, 3);

          await pool.query(
            `
            UPDATE deworming_events
            SET next_due_date = $1
            WHERE id = $2
            `,
            [nextDewormingDate, latest.id]
          );

          await ctx.reply(
            `Second dose already recorded. Fixed next deworming date ✅

Horse: ${matchedHorse.name}
Second dose: ${secondDoseDate}
Next deworming: ${nextDewormingDate}`
          );
          continue;
        }

        const nextDewormingDate = addMonthsToDateString(datePart, 3);

        await pool.query(
          `
          UPDATE deworming_events
          SET second_dose_date = $1,
              next_due_date = $2
          WHERE id = $3
          `,
          [datePart, nextDewormingDate, latest.id]
        );

        await ctx.reply(
          `Second dose recorded ✅

Horse: ${matchedHorse.name}
Product: ${latest.product_name}
First dose: ${formatDateForReply(latest.event_date)}
Second dose: ${datePart}
Next deworming date: ${nextDewormingDate}
Event ID: ${latest.id}
Raw message ID: ${rawMessageId}`
        );

        continue;
      }

      // -----------------------------
      // DEWORM COMMAND
      // -----------------------------
      if (command === 'deworm' && parts.length >= 3) {
        const allHorses = await listHorseNames();

        let matchedHorse = null;
        let matchedHorseName = '';

        for (const horseName of allHorses) {
          const prefix = `deworm ${horseName.toLowerCase()} `;
          if (lowerMessage.startsWith(prefix)) {
            matchedHorseName = horseName;
            matchedHorse = await findHorseByName(horseName);
            break;
          }
        }

        if (!matchedHorse) {
          await ctx.reply(
            `Horse not found.

Available horses:
${allHorses.map((h) => `- ${h}`).join('\n')}`
          );
          continue;
        }

        let remainder = messageText
          .slice(`deworm ${matchedHorseName}`.length)
          .trim();

        if (!remainder) {
          await ctx.reply('Use: deworm <horse name> <product> [YYYY-MM-DD]');
          continue;
        }

        const remainderParts = remainder.split(/\s+/);
        const lastPart = remainderParts[remainderParts.length - 1];

        let eventDate = todayDateString();
        let productName = remainder;

        if (looksLikeDateString(lastPart) && !isValidDateString(lastPart)) {
          await ctx.reply(`Invalid calendar date: ${lastPart}`);
          continue;
        }

        if (isValidDateString(lastPart)) {
          eventDate = lastPart;
          productName = remainderParts.slice(0, -1).join(' ').trim();
        }

        if (!productName) {
          await ctx.reply('Use: deworm <horse name> <product> [YYYY-MM-DD]');
          continue;
        }

        const nextDueDate = addDaysToDateString(eventDate, 20);

        const dewormResult = await pool.query(
          `
          INSERT INTO deworming_events (
            horse_id,
            product_name,
            telegram_user_id,
            event_date,
            next_due_date
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, created_at, event_date, next_due_date
          `,
          [matchedHorse.id, productName, telegramUserId, eventDate, nextDueDate]
        );

        await ctx.reply(
          `Deworming recorded ✅

Horse: ${matchedHorse.name}
Product: ${productName}
Event date: ${formatDateForReply(dewormResult.rows[0].event_date)}
Next due date: ${formatDateForReply(dewormResult.rows[0].next_due_date)}
Event ID: ${dewormResult.rows[0].id}
Raw message ID: ${rawMessageId}`
        );

        sendRemindersToAlertChat().catch((error) => {
          console.error('REMINDER ERROR:', error);
        });
        continue;
      }

      // -----------------------------
      // FARRIER DUE
      // -----------------------------
      if (lowerMessage === 'farrier due') {
        const dueResult = await pool.query(`
          SELECT
            f.id,
            h.name AS horse_name,
            f.service_type,
            f.event_date,
            f.next_due_date
          FROM farrier_events f
          JOIN horses h ON h.id = f.horse_id
          WHERE f.next_due_date IS NOT NULL
          ORDER BY f.next_due_date ASC
        `);

        if (dueResult.rows.length === 0) {
          await ctx.reply('No farrier reminder records found.');
          continue;
        }

        const today = todayDateString();
        const soonLimit = addDaysToDateString(today, 3);

        const overdue = [];
        const dueSoon = [];

        for (const row of dueResult.rows) {
          const nextDue = formatDateForReply(row.next_due_date);
          const line = `- ${row.horse_name} | due: ${nextDue} | service: ${row.service_type}`;

          if (nextDue < today) {
            overdue.push(line);
          } else if (nextDue >= today && nextDue <= soonLimit) {
            dueSoon.push(line);
          }
        }

        if (overdue.length === 0 && dueSoon.length === 0) {
          await ctx.reply('No horses are due soon or overdue for farrier.');
          continue;
        }

        let reply = 'Farrier reminders\n\n';

        if (overdue.length > 0) {
          reply += `Overdue:\n${overdue.join('\n')}\n\n`;
        }

        if (dueSoon.length > 0) {
          reply += `Due soon:\n${dueSoon.join('\n')}`;
        }

        await ctx.reply(reply.trim());
        continue;
      }

      // -----------------------------
      // FARRIER COMMAND
      // -----------------------------
      if (command === 'farrier' && parts.length >= 3) {
        const allHorses = await listHorseNames();

        let matchedHorse = null;
        let matchedHorseName = '';

        for (const horseName of allHorses) {
          const prefix = `farrier ${horseName.toLowerCase()} `;
          if (lowerMessage.startsWith(prefix)) {
            matchedHorseName = horseName;
            matchedHorse = await findHorseByName(horseName);
            break;
          }
        }

        if (!matchedHorse) {
          await ctx.reply(
            `Horse not found.

            Available horses:
            ${allHorses.map((h) => `- ${h}`).join('\n')}`
          );
          continue;
        }

        let remainder = messageText
          .slice(`farrier ${matchedHorseName}`.length)
          .trim();

        if (!remainder) {
          await ctx.reply('Use: farrier <horse name> <service> [YYYY-MM-DD]');
          continue;
        }

        const remainderParts = remainder.split(/\s+/);
        const lastPart = remainderParts[remainderParts.length - 1];

        let eventDate = todayDateString();
        let serviceType = remainder;

        if (looksLikeDateString(lastPart) && !isValidDateString(lastPart)) {
          await ctx.reply(`Invalid calendar date: ${lastPart}`);
          continue;
        }

        if (isValidDateString(lastPart)) {
          eventDate = lastPart;
          serviceType = remainderParts.slice(0, -1).join(' ').trim();
        }

        if (!serviceType) {
          await ctx.reply('Use: farrier <horse name> <service> [YYYY-MM-DD]');
          continue;
        }

        const daysUntilNext = getFarrierDaysUntilNext(serviceType);
        const nextDueDate = addDaysToDateString(eventDate, daysUntilNext);

        const farrierResult = await pool.query(
          `
          INSERT INTO farrier_events (
            horse_id,
            service_type,
            telegram_user_id,
            event_date,
            next_due_date
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, created_at, event_date, next_due_date
          `,
          [matchedHorse.id, serviceType, telegramUserId, eventDate, nextDueDate]
        );

        await ctx.reply(
          `Farrier recorded ✅

            Horse: ${matchedHorse.name}
            Service: ${serviceType}
            Event date: ${formatDateForReply(farrierResult.rows[0].event_date)}
            Next due date: ${formatDateForReply(farrierResult.rows[0].next_due_date)}
            Event ID: ${farrierResult.rows[0].id}
            Raw message ID: ${rawMessageId}`
        );
        continue;
      }

        // -----------------------------
        // HEALTH ADD
        // health add <horse name> <event_type> <description> [YYYY-MM-DD]
        // Example:
        // health add always set injury mordida de perro en ambas patas 2026-03-28
        // -----------------------------
        if (lowerMessage.startsWith('health add ')) {
            const allHorses = await listHorseNames();

            let matchedHorse = null;
            let matchedHorseName = '';

            for (const horseName of allHorses) {
            const prefix = `health add ${horseName.toLowerCase()} `;
            if (lowerMessage.startsWith(prefix)) {
                matchedHorseName = horseName;
                matchedHorse = await findHorseByName(horseName);
                break;
            }
            }

            if (!matchedHorse) {
            await ctx.reply(
                `Horse not found.

    Available horses:
    ${allHorses.map((h) => `- ${h}`).join('\n')}`
            );
            continue;
            }

            let remainder = messageText
            .slice(`health add ${matchedHorseName}`.length)
            .trim();

            if (!remainder) {
            await ctx.reply('Use: health add <horse name> <event_type> <description> [YYYY-MM-DD]');
            continue;
            }

            const remainderParts = remainder.split(/\s+/);
            const lastPart = remainderParts[remainderParts.length - 1];

            let eventDate = todayDateString();

            if (looksLikeDateString(lastPart) && !isValidDateString(lastPart)) {
            await ctx.reply(`Invalid calendar date: ${lastPart}`);
            continue;
            }

            if (isValidDateString(lastPart)) {
            eventDate = lastPart;
            remainder = remainderParts.slice(0, -1).join(' ');
            }

            const trimmedParts = remainder.split(/\s+/);
            const eventType = trimmedParts[0]?.toLowerCase();
            const description = trimmedParts.slice(1).join(' ').trim();

            if (!eventType || !description) {
            await ctx.reply('Use: health add <horse name> <event_type> <description> [YYYY-MM-DD]');
            continue;
            }

            const insertResult = await pool.query(
            `
            INSERT INTO horse_health_events (
                horse_id,
                event_type,
                description,
                event_date,
                telegram_user_id
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            `,
            [matchedHorse.id, eventType, description, eventDate, telegramUserId]
            );

            await ctx.reply(
            `Health event recorded ✅

                Horse: ${matchedHorse.name}
                Type: ${eventType}
                Description: ${description}
                Date: ${eventDate}
                Health event ID: ${insertResult.rows[0].id}
                Raw message ID: ${rawMessageId}`
                );
                continue;
            }

                  // -----------------------------
                // TREATMENT ADD
                // treatment add <horse name> <medication> <dosage> <frequency> <duration_days>d <start_date>
                // Example:
                // treatment add always set repen 20cc 2x 5d 2026-03-28
                // -----------------------------
                if (lowerMessage.startsWith('treatment add ')) {
                    const allHorses = await listHorseNames();

                    let matchedHorse = null;
                    let matchedHorseName = '';

                    for (const horseName of allHorses) {
                    const prefix = `treatment add ${horseName.toLowerCase()} `;
                    if (lowerMessage.startsWith(prefix)) {
                        matchedHorseName = horseName;
                        matchedHorse = await findHorseByName(horseName);
                        break;
                    }
                    }

                    if (!matchedHorse) {
                    await ctx.reply(
                        `Horse not found.

            Available horses:
            ${allHorses.map((h) => `- ${h}`).join('\n')}`
                    );
                    continue;
                    }

                    const remainder = messageText
                    .slice(`treatment add ${matchedHorseName}`.length)
                    .trim();

                    const remainderParts = remainder.split(/\s+/).filter(Boolean);

                    if (remainderParts.length < 5) {
                    await ctx.reply(
                        'Use: treatment add <horse name> <medication> <dosage> <frequency> <duration_days>d <start_date>'
                    );
                    continue;
                    }

                    const startDate = remainderParts[remainderParts.length - 1];
                    const durationToken = remainderParts[remainderParts.length - 2];
                    const frequency = remainderParts[remainderParts.length - 3];
                    const dosage = remainderParts[remainderParts.length - 4];
                    const medication = remainderParts.slice(0, remainderParts.length - 4).join(' ');

                    if (looksLikeDateString(startDate) && !isValidDateString(startDate)) {
                    await ctx.reply(`Invalid calendar date: ${startDate}`);
                    continue;
                    }

                    if (!isValidDateString(startDate)) {
                    await ctx.reply('Start date must be YYYY-MM-DD');
                    continue;
                    }

                    const durationMatch = durationToken.match(/^(\d+)d$/i);
                    if (!durationMatch) {
                    await ctx.reply('Duration must look like 5d');
                    continue;
                    }

                    const durationDays = Number(durationMatch[1]);

                    const insertResult = await pool.query(
                    `
                    INSERT INTO treatment_plans (
                        horse_id,
                        medication,
                        dosage,
                        frequency,
                        start_date,
                        duration_days,
                        telegram_user_id
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                    `,
                    [matchedHorse.id, medication, dosage, frequency, startDate, durationDays, telegramUserId]
                    );

                    await ctx.reply(
                    `Treatment plan recorded ✅

            Horse: ${matchedHorse.name}
            Medication: ${medication}
            Dosage: ${dosage}
            Frequency: ${frequency}
            Start date: ${startDate}
            Duration: ${durationDays} days
            Treatment plan ID: ${insertResult.rows[0].id}
            Raw message ID: ${rawMessageId}`
                    );
                    continue;
                }

                      // -----------------------------
                    // DOSE ADD
                    // dose add <horse name> <medication> <YYYY-MM-DD> <HH:MM>
                    // Example:
                    // dose add always set repen 2026-03-29 18:00
                    // -----------------------------
                    if (lowerMessage.startsWith('dose add ')) {
                        const allHorses = await listHorseNames();

                        let matchedHorse = null;
                        let matchedHorseName = '';

                        for (const horseName of allHorses) {
                        const prefix = `dose add ${horseName.toLowerCase()} `;
                        if (lowerMessage.startsWith(prefix)) {
                            matchedHorseName = horseName;
                            matchedHorse = await findHorseByName(horseName);
                            break;
                        }
                        }

                        if (!matchedHorse) {
                        await ctx.reply(
                            `Horse not found.

                Available horses:
                ${allHorses.map((h) => `- ${h}`).join('\n')}`
                        );
                        continue;
                        }

                        const remainder = messageText
                        .slice(`dose add ${matchedHorseName}`.length)
                        .trim();

                        const remainderParts = remainder.split(/\s+/).filter(Boolean);

                        if (remainderParts.length < 3) {
                        await ctx.reply(
                            'Use: dose add <horse name> <medication> <YYYY-MM-DD> <HH:MM>'
                        );
                        continue;
                        }

                        const timePart = remainderParts[remainderParts.length - 1];
                        const datePart = remainderParts[remainderParts.length - 2];
                        const medication = remainderParts.slice(0, -2).join(' ');

                        if (looksLikeDateString(datePart) && !isValidDateString(datePart)) {
                        await ctx.reply(`Invalid calendar date: ${datePart}`);
                        continue;
                        }

                        if (!isValidDateString(datePart)) {
                        await ctx.reply('Date must be YYYY-MM-DD');
                        continue;
                        }

                        if (!/^\d{2}:\d{2}$/.test(timePart)) {
                        await ctx.reply('Time must be HH:MM');
                        continue;
                        }

                        const administeredAt = `${datePart} ${timePart}:00`;

                        const planResult = await pool.query(
                        `
                        SELECT id, medication, dosage
                        FROM treatment_plans
                        WHERE horse_id = $1
                            AND LOWER(medication) = LOWER($2)
                        ORDER BY COALESCE(start_date, created_at::date) DESC, id DESC
                        LIMIT 1
                        `,
                        [matchedHorse.id, medication]
                        );

                        if (planResult.rows.length === 0) {
                        await ctx.reply(`No treatment plan found for ${matchedHorse.name} with medication ${medication}`);
                        continue;
                        }

                        const plan = planResult.rows[0];

                        const insertResult = await pool.query(
                        `
                        INSERT INTO treatment_logs (
                            treatment_plan_id,
                            administered_at,
                            telegram_user_id
                        )
                        VALUES ($1, $2, $3)
                        RETURNING id
                        `,
                        [plan.id, administeredAt, telegramUserId]
                        );

                        await ctx.reply(
                        `Dose recorded ✅

                Horse: ${matchedHorse.name}
                Medication: ${plan.medication}
                Dosage: ${plan.dosage}
                Given at: ${datePart} ${timePart}
                Dose log ID: ${insertResult.rows[0].id}
                Raw message ID: ${rawMessageId}`
                        );
                        continue;
                    }

      await ctx.reply(`Saved in database ✅ Record ID: ${rawMessageId}`);
    }
  } catch (error) {
    console.error('ERROR:', error);
    if (error?.statusCode && error.message) {
      await ctx.reply(error.message);
      return;
    }
    await ctx.reply('Error processing message.');
  }
});

module.exports = {
  bot,
  pool,
  sendRemindersToAlertChat,
  startReminderScheduler,
  ensureReminderAlertsTable,
  syncTelegramMenuCommands,
};
