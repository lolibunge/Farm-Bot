function toIsoDateString(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const stringValue = String(value).trim();
  if (!stringValue) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const parsed = new Date(stringValue);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return stringValue.slice(0, 10);
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
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

module.exports = {
  toIsoDateString,
  todayDateString,
  looksLikeDateString,
  isValidDateString,
  addDaysToDateString,
  addMonthsToDateString,
};
