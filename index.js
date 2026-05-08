require('dotenv').config();

const { bot, startReminderScheduler, syncTelegramMenuCommands } = require('./bot');

bot
  .launch()
  .then(async () => {
    await syncTelegramMenuCommands();
    await startReminderScheduler();
    console.log(
      'BOT RUNNING WITH FEED + STOCK + HORSE + DEWORM + FARRIER + DATES + REMINDERS + MULTILINE + ALERTS'
    );
  })
  .catch((error) => {
    console.error('BOT FAILED TO START:', error);
    process.exit(1);
  });
