const { sendRemindersToAlertChat } = require('../bot');

module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization || '';
    if (authHeader !== `Bearer ${cronSecret}`) {
      res.status(401).json({ ok: false, error: 'Unauthorized' });
      return;
    }
  }

  try {
    await sendRemindersToAlertChat();
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('REMINDERS CRON ERROR:', error);
    res.status(500).json({ ok: false });
  }
};
