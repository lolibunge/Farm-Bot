const { bot } = require('../../bot');

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

module.exports = async (req, res) => {
  const routeSecret = Array.isArray(req.query.secret)
    ? req.query.secret[0]
    : req.query.secret;

  if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
    res.status(500).send('Missing TELEGRAM_WEBHOOK_SECRET');
    return;
  }

  if (routeSecret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    res.status(403).send('Forbidden');
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({ ok: true, status: 'alive' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const update = await getJsonBody(req);
    await bot.handleUpdate(update);
    res.status(200).send('ok');
  } catch (error) {
    console.error('TELEGRAM WEBHOOK ERROR:', error);
    res.status(500).send('error');
  }
};
