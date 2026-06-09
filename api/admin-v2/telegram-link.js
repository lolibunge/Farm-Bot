const { Telegraf } = require('telegraf');

const TELEGRAM_WEB_FALLBACK_URL = 'https://web.telegram.org/';
const CACHE_TTL_MS = 5 * 60 * 1000;

let cachedPayload = null;
let cachedAt = 0;
let inflightPromise = null;

function buildTelegramPayload(username) {
  const cleanUsername = String(username || '')
    .trim()
    .replace(/^@+/, '');

  if (!cleanUsername) {
    return {
      botUsername: null,
      botUrl: TELEGRAM_WEB_FALLBACK_URL,
      fallback: true,
    };
  }

  return {
    botUsername: cleanUsername,
    botUrl: `https://t.me/${cleanUsername}`,
    fallback: false,
  };
}

async function resolveTelegramLink() {
  const envUsername = process.env.TELEGRAM_BOT_USERNAME;
  if (envUsername) {
    return buildTelegramPayload(envUsername);
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return buildTelegramPayload(null);
  }

  const now = Date.now();
  if (cachedPayload && now - cachedAt < CACHE_TTL_MS) {
    return cachedPayload;
  }

  if (!inflightPromise) {
    inflightPromise = (async () => {
      const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
      const me = await bot.telegram.getMe();
      const payload = buildTelegramPayload(me && me.username);
      cachedPayload = payload;
      cachedAt = Date.now();
      return payload;
    })()
      .catch((error) => {
        console.error('ADMIN V2 TELEGRAM LINK ERROR:', error);
        return buildTelegramPayload(null);
      })
      .finally(() => {
        inflightPromise = null;
      });
  }

  return inflightPromise;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  const payload = await resolveTelegramLink();
  res.status(200).json({
    ok: true,
    ...payload,
  });
};
