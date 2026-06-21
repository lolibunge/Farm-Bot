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

module.exports = {
  getJsonBody,
  parsePositiveInt,
  parseNonNegativeNumber,
  parseNonNegativeInteger,
  parseBooleanValue,
  parsePositiveIntArray,
};
