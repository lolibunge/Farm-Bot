require('dotenv').config();

const { bot, startReminderScheduler } = require('./bot');

const TELEGRAM_RUN_MODE = String(process.env.TELEGRAM_RUN_MODE || '')
  .trim()
  .toLowerCase();

if (TELEGRAM_RUN_MODE !== 'polling') {
  console.log('Polling bot not started.');
  console.log('This project uses Telegram webhooks on Vercel by default.');
  console.log('Set TELEGRAM_RUN_MODE=polling if you intentionally want local long polling.');
  console.log(
    'If Telegram stopped sending updates to Vercel, rerun /api/telegram/setup?secret=<TELEGRAM_SETUP_SECRET> on the deployed app.'
  );
  process.exit(0);
}

bot
  .launch()
  .then(async () => {
    await startReminderScheduler();
    console.log(
      'BOT RUNNING WITH FEED + STOCK + HORSE + DEWORM + FARRIER + DATES + REMINDERS + MULTILINE + ALERTS'
    );
  })
  .catch((error) => {
    console.error('BOT FAILED TO START:', error);
    process.exit(1);
  });
