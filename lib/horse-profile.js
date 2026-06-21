const { pool } = require('./db');
const { ensureTableColumns } = require('./schema');

let ensurePromise = null;

const HORSE_PROFILE_COLUMNS = [
  { name: 'date_of_birth', definition: 'DATE' },
  { name: 'color', definition: 'TEXT' },
  { name: 'activity', definition: 'TEXT' },
  { name: 'sex', definition: 'TEXT' },
  { name: 'training_status', definition: 'TEXT' },
];

async function ensureHorseProfileColumns() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    await ensureTableColumns(pool, 'horses', HORSE_PROFILE_COLUMNS);
  })();

  try {
    await ensurePromise;
  } catch (error) {
    ensurePromise = null;
    throw error;
  }
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

module.exports = {
  ensureHorseProfileColumns,
  normalizeTrainingStatus,
};
