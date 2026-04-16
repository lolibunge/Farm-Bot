const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'farm_bot_admin_session';

function parsePositiveInt(value, fallbackValue) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
}

const SESSION_TTL_SECONDS = parsePositiveInt(process.env.ADMIN_SESSION_TTL_SECONDS, 12 * 60 * 60);

function toBase64Url(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(input) {
  const normalized = String(input).replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64');
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a), 'utf8');
  const right = Buffer.from(String(b), 'utf8');
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_DASHBOARD_TOKEN ||
    process.env.ADMIN_PASSWORD ||
    ''
  );
}

function isLoginConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
}

function isTokenConfigured() {
  return Boolean(process.env.ADMIN_DASHBOARD_TOKEN);
}

function isAuthRequired() {
  return isLoginConfigured() || isTokenConfigured();
}

function parseCookies(req) {
  const rawCookie = String(req.headers.cookie || '');
  if (!rawCookie) {
    return {};
  }

  const pairs = rawCookie.split(';');
  const result = {};

  for (const pair of pairs) {
    const [namePart, ...valueParts] = pair.trim().split('=');
    if (!namePart) {
      continue;
    }
    result[namePart] = decodeURIComponent(valueParts.join('=') || '');
  }

  return result;
}

function getBearerToken(req) {
  const header = String(req.headers.authorization || '');
  if (!header.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  return header.slice(7).trim();
}

function getQueryToken(req) {
  if (!req.query || typeof req.query !== 'object') {
    return null;
  }
  if (Array.isArray(req.query.token)) {
    return req.query.token[0] || null;
  }
  if (typeof req.query.token === 'string') {
    return req.query.token;
  }
  return null;
}

function readTokenFromRequest(req) {
  return getBearerToken(req) || getQueryToken(req);
}

function signSessionPayload(payloadEncoded) {
  const secret = getSessionSecret();
  if (!secret) {
    return '';
  }

  const signature = crypto.createHmac('sha256', secret).update(payloadEncoded).digest();
  return toBase64Url(signature);
}

function createSessionToken(username) {
  const payload = {
    u: username,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signSessionPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, suppliedSignature] = token.split('.');
  if (!encodedPayload || !suppliedSignature) {
    return null;
  }

  const expectedSignature = signSessionPayload(encodedPayload);
  if (!expectedSignature || !timingSafeEqualString(suppliedSignature, expectedSignature)) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(fromBase64Url(encodedPayload).toString('utf8'));
  } catch (_error) {
    return null;
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (typeof payload.exp !== 'number' || payload.exp < Date.now()) {
    return null;
  }

  if (!payload.u || typeof payload.u !== 'string') {
    return null;
  }

  return {
    username: payload.u,
    expiresAt: payload.exp,
  };
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME] || '';
  return verifySessionToken(token);
}

function isSessionAuthenticated(req) {
  return Boolean(getSessionFromRequest(req));
}

function isTokenAuthorized(req) {
  if (!isTokenConfigured()) {
    return false;
  }

  const supplied = readTokenFromRequest(req);
  if (!supplied) {
    return false;
  }

  return timingSafeEqualString(supplied, process.env.ADMIN_DASHBOARD_TOKEN);
}

function isRequestAuthorized(req) {
  if (!isAuthRequired()) {
    return true;
  }

  if (isSessionAuthenticated(req)) {
    return true;
  }

  if (isTokenAuthorized(req)) {
    return true;
  }

  return false;
}

function requireAdminApiAuth(req, res) {
  if (isRequestAuthorized(req)) {
    return true;
  }

  res.status(401).json({ ok: false, error: 'Unauthorized' });
  return false;
}

function isSecureRequest(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '');
  return process.env.NODE_ENV === 'production' || forwardedProto.includes('https');
}

function buildSessionCookie(token, req) {
  const securePart = isSecureRequest(req) ? 'Secure; ' : '';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}; ${securePart}`;
}

function buildClearSessionCookie(req) {
  const securePart = isSecureRequest(req) ? 'Secure; ' : '';
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${securePart}`;
}

function validateLoginCredentials(username, password) {
  if (!isLoginConfigured()) {
    return false;
  }

  return (
    timingSafeEqualString(username, process.env.ADMIN_USERNAME) &&
    timingSafeEqualString(password, process.env.ADMIN_PASSWORD)
  );
}

function getAuthSetup() {
  return {
    auth_required: isAuthRequired(),
    login_enabled: isLoginConfigured(),
    token_enabled: isTokenConfigured(),
  };
}

module.exports = {
  createSessionToken,
  buildSessionCookie,
  buildClearSessionCookie,
  getSessionFromRequest,
  validateLoginCredentials,
  requireAdminApiAuth,
  isRequestAuthorized,
  getAuthSetup,
  SESSION_COOKIE_NAME,
};
