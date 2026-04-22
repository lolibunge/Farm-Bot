const { bot } = require('../../bot');

function getSingleQueryValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getBaseUrl(req) {
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
  const hostHeader = req.headers['x-forwarded-host'] || req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;

  if (!host) return null;
  return `${proto || 'https'}://${host}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  if (!process.env.TELEGRAM_SETUP_SECRET) {
    res.status(500).send('Missing TELEGRAM_SETUP_SECRET');
    return;
  }

  if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
    res.status(500).send('Missing TELEGRAM_WEBHOOK_SECRET');
    return;
  }

  const provided = getSingleQueryValue(req.query?.secret);
  if (provided !== process.env.TELEGRAM_SETUP_SECRET) {
    res.status(403).send('Forbidden');
    return;
  }

  const baseUrl = getBaseUrl(req);
  if (!baseUrl) {
    res.status(500).send('Missing host header');
    return;
  }

  const webhookUrl = `${baseUrl}/api/telegram/${process.env.TELEGRAM_WEBHOOK_SECRET}`;

  try {
    const result = await bot.telegram.setWebhook(webhookUrl, {
      drop_pending_updates: true,
    });

    const webhookInfo = await bot.telegram.getWebhookInfo();
    res.status(200).json({ ok: true, webhookUrl, telegramResult: result, webhookInfo });
  } catch (error) {
    console.error('TELEGRAM SETUP WEBHOOK ERROR:', error);
    res.status(500).json({ ok: false, error: 'Failed to set webhook' });
  }
};
