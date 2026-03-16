require('dotenv').config();

const { Telegraf } = require('telegraf');
const { Pool } = require('pg');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function parsePositiveInt(value, fallbackValue) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
}

const DEWORM_ALERT_DAYS_AHEAD = parsePositiveInt(process.env.DEWORM_ALERT_DAYS_AHEAD, 3);
const LOW_STOCK_THRESHOLD = parsePositiveInt(process.env.LOW_STOCK_THRESHOLD, 20);
const ALERT_CHECK_INTERVAL_MINUTES = parsePositiveInt(
  process.env.ALERT_CHECK_INTERVAL_MINUTES,
  60
);
const ALERT_CHECK_INTERVAL_MS = ALERT_CHECK_INTERVAL_MINUTES * 60 * 1000;
let alertChatId = process.env.TELEGRAM_ALERT_CHAT_ID || null;

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function looksLikeDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseCompactQuantityUnit(value) {
  const match = String(value).match(/^([+-]?\d+(?:\.\d+)?)([a-zA-Z]+)$/);
  if (!match) {
    return null;
  }

  return {
    quantity: Number(match[1]),
    unit: match[2].toLowerCase(),
  };
}

function formatDateForReply(dateValue) {
  if (!dateValue) return 'N/A';
  if (dateValue instanceof Date) {
    return dateValue.toISOString().slice(0, 10);
  }
  return String(dateValue).slice(0, 10);
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToDateString(dateString, daysToAdd) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}

function getFarrierDaysUntilNext(serviceType) {
  const normalized = serviceType.toLowerCase();

  if (
    normalized.includes('shoe') ||
    normalized.includes('shoes') ||
    normalized.includes('shoeing')
  ) {
    return 45;
  }

  return 60;
}

function buildDewormReminderGroups(rows, daysAhead) {
  const today = todayDateString();
  const soonLimit = addDaysToDateString(today, daysAhead);
  const overdue = [];
  const dueSoon = [];

  for (const row of rows) {
    const nextDue = formatDateForReply(row.next_due_date);
    const line = `- ${row.horse_name} | due: ${nextDue} | product: ${row.product_name}`;

    if (nextDue < today) {
      overdue.push({
        key: `deworm:${row.horse_id}:${nextDue}`,
        line,
      });
      continue;
    }

    if (nextDue >= today && nextDue <= soonLimit) {
      dueSoon.push({
        key: `deworm:${row.horse_id}:${nextDue}`,
        line,
      });
    }
  }

  return { overdue, dueSoon };
}

async function getLatestDewormRows() {
  const result = await pool.query(
    `
    WITH latest AS (
      SELECT DISTINCT ON (d.horse_id)
        d.horse_id,
        h.name AS horse_name,
        d.product_name,
        d.next_due_date
      FROM deworming_events d
      JOIN horses h ON h.id = d.horse_id
      WHERE d.next_due_date IS NOT NULL
      ORDER BY
        d.horse_id,
        COALESCE(d.event_date, d.created_at::date) DESC,
        d.id DESC
    )
    SELECT
      horse_id,
      horse_name,
      product_name,
      next_due_date
    FROM latest
    ORDER BY next_due_date ASC, horse_name ASC
    `
  );

  return result.rows;
}

async function getLowStockRows(threshold) {
  const result = await pool.query(
    `
    SELECT id, name, unit, current_stock
    FROM feed_items
    WHERE current_stock <= $1
    ORDER BY current_stock ASC, name ASC
    `,
    [threshold]
  );

  return result.rows;
}

async function ensureReminderAlertsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reminder_alerts (
      id BIGSERIAL PRIMARY KEY,
      alert_key TEXT NOT NULL,
      alert_date DATE NOT NULL DEFAULT CURRENT_DATE,
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (alert_key, alert_date)
    )
  `);
}

async function markAlertAsSentForToday(alertKey) {
  const insertResult = await pool.query(
    `
    INSERT INTO reminder_alerts (alert_key, alert_date)
    VALUES ($1, CURRENT_DATE)
    ON CONFLICT (alert_key, alert_date) DO NOTHING
    RETURNING id
    `,
    [alertKey]
  );

  return insertResult.rows.length > 0;
}

async function sendRemindersToAlertChat() {
  if (!alertChatId) {
    return;
  }

  const [dewormRows, lowStockRows] = await Promise.all([
    getLatestDewormRows(),
    getLowStockRows(LOW_STOCK_THRESHOLD),
  ]);

  const { overdue, dueSoon } = buildDewormReminderGroups(
    dewormRows,
    DEWORM_ALERT_DAYS_AHEAD
  );

  const pendingOverdue = [];
  const pendingDueSoon = [];
  const pendingLowStock = [];

  for (const item of overdue) {
    if (await markAlertAsSentForToday(item.key)) {
      pendingOverdue.push(item.line);
    }
  }

  for (const item of dueSoon) {
    if (await markAlertAsSentForToday(item.key)) {
      pendingDueSoon.push(item.line);
    }
  }

  for (const stockRow of lowStockRows) {
    const line = `- ${stockRow.name}: ${stockRow.current_stock} ${stockRow.unit}`;
    const key = `stock:${stockRow.id}`;

    if (await markAlertAsSentForToday(key)) {
      pendingLowStock.push(line);
    }
  }

  if (
    pendingOverdue.length === 0 &&
    pendingDueSoon.length === 0 &&
    pendingLowStock.length === 0
  ) {
    return;
  }

  const sections = [];
  const today = todayDateString();

  sections.push(`Farm reminders (${today})`);

  if (pendingOverdue.length > 0) {
    sections.push(`Deworming overdue:\n${pendingOverdue.join('\n')}`);
  }

  if (pendingDueSoon.length > 0) {
    sections.push(`Deworming due soon:\n${pendingDueSoon.join('\n')}`);
  }

  if (pendingLowStock.length > 0) {
    sections.push(
      `Low stock (<= ${LOW_STOCK_THRESHOLD}):\n${pendingLowStock.join('\n')}`
    );
  }

  await bot.telegram.sendMessage(alertChatId, sections.join('\n\n'));
}

async function startReminderScheduler() {
  await ensureReminderAlertsTable();

  const runReminderCheck = async () => {
    try {
      await sendRemindersToAlertChat();
    } catch (error) {
      console.error('REMINDER ERROR:', error);
    }
  };

  // First check shortly after startup, then on the configured interval.
  setTimeout(runReminderCheck, 15000);
  setInterval(runReminderCheck, ALERT_CHECK_INTERVAL_MS);
}

async function findHorseByName(horseName) {
  const result = await pool.query(
    `
    SELECT id, name
    FROM horses
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
    `,
    [horseName]
  );

  return result.rows[0] || null;
}

async function listHorseNames() {
  const result = await pool.query(`
    SELECT name
    FROM horses
    ORDER BY name ASC
  `);

  return result.rows.map((row) => row.name);
}

async function findFeedItemByName(itemName) {
  const result = await pool.query(
    `
    SELECT id, name, unit, current_stock
    FROM feed_items
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
    `,
    [itemName]
  );

  return result.rows[0] || null;
}

bot.start(async (ctx) => {
  await ctx.reply(`Hello!

Commands:
- horse add perla
- horse list
- history imperial

- feed imperial oats 2 kg
- feed fair halo oats 2 kg
- feed imperial oats 2 kg 2026-03-01

- deworm imperial ivermectin
- deworm imperial ivermectin 2026-03-12
- deworm due

- farrier imperial trim
- farrier imperial trim 2026-03-12
- farrier due

- stock
- stock oats

You can also send multiple commands in one message using one line per command.`);
});

bot.on('text', async (ctx) => {
  const telegramUserId = String(ctx.from.id);
  const username = ctx.from.username || null;
  const firstName = ctx.from.first_name || null;
  const incomingChatId = String(ctx.chat.id);

  if (!alertChatId) {
    alertChatId = incomingChatId;
    console.log(`Alert chat auto-set from incoming message: ${alertChatId}`);
    sendRemindersToAlertChat().catch((error) => {
      console.error('REMINDER ERROR:', error);
    });
  }

  const messages = ctx.message.text
    .split('\n')
    .map((m) => m.trim())
    .filter(Boolean);

  try {
    for (const messageText of messages) {
      const lowerMessage = messageText.toLowerCase();
      const parts = messageText.split(/\s+/);
      const command = parts[0]?.toLowerCase();

      console.log('Incoming message:', messageText);

      const rawResult = await pool.query(
        `
        INSERT INTO telegram_messages (
          telegram_user_id,
          username,
          first_name,
          message_text
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [telegramUserId, username, firstName, messageText]
      );

      const rawMessageId = rawResult.rows[0].id;

      // -----------------------------
      // HORSE LIST
      // -----------------------------
      if (lowerMessage === 'horse list') {
        const horses = await listHorseNames();

        if (horses.length === 0) {
          await ctx.reply('No horses found.');
          continue;
        }

        await ctx.reply(`Registered horses\n\n${horses.map((h) => `- ${h}`).join('\n')}`);
        continue;
      }

      // -----------------------------
      // HORSE ADD
      // -----------------------------
      if (lowerMessage.startsWith('horse add ')) {
        const horseName = messageText.slice('horse add '.length).trim();

        if (!horseName) {
          await ctx.reply('Use: horse add <horse name>');
          continue;
        }

        const existingHorse = await findHorseByName(horseName);

        if (existingHorse) {
          await ctx.reply(`Horse already exists: ${existingHorse.name}`);
          continue;
        }

        const insertHorseResult = await pool.query(
          `
          INSERT INTO horses (name)
          VALUES ($1)
          RETURNING id, name
          `,
          [horseName]
        );

        const horse = insertHorseResult.rows[0];

        await ctx.reply(
          `Horse added ✅

Name: ${horse.name}
Horse ID: ${horse.id}
Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      // -----------------------------
      // HISTORY
      // -----------------------------
      if (lowerMessage.startsWith('history ')) {
        const horseName = messageText.slice('history '.length).trim();

        if (!horseName) {
          await ctx.reply('Use: history <horse name>');
          continue;
        }

        const horse = await findHorseByName(horseName);

        if (!horse) {
          const horses = await listHorseNames();
          await ctx.reply(
            `Horse not found: ${horseName}

Available horses:
${horses.map((h) => `- ${h}`).join('\n')}`
          );
          continue;
        }

        const lastFeedResult = await pool.query(
          `
          SELECT
            f.quantity,
            f.unit,
            COALESCE(f.event_date, f.created_at::date) AS feed_date,
            i.name AS feed_name
          FROM feed_events f
          JOIN feed_items i ON i.id = f.feed_item_id
          WHERE f.horse_id = $1
          ORDER BY COALESCE(f.event_date, f.created_at::date) DESC, f.id DESC
          LIMIT 1
          `,
          [horse.id]
        );

        const lastDewormResult = await pool.query(
          `
          SELECT
            product_name,
            event_date,
            next_due_date,
            created_at
          FROM deworming_events
          WHERE horse_id = $1
          ORDER BY COALESCE(event_date, created_at::date) DESC, id DESC
          LIMIT 1
          `,
          [horse.id]
        );

        const lastFarrierResult = await pool.query(
          `
          SELECT
            service_type,
            event_date,
            next_due_date,
            created_at
          FROM farrier_events
          WHERE horse_id = $1
          ORDER BY COALESCE(event_date, created_at::date) DESC, id DESC
          LIMIT 1
          `,
          [horse.id]
        );

        let reply = `Horse history: ${horse.name}\n`;

        if (lastFeedResult.rows.length > 0) {
          const feed = lastFeedResult.rows[0];
          reply += `\nLast feed
- ${feed.feed_name} ${feed.quantity} ${feed.unit} on ${formatDateForReply(feed.feed_date)}`;
        } else {
          reply += `\nLast feed
- No feed records`;
        }

        if (lastDewormResult.rows.length > 0) {
          const deworm = lastDewormResult.rows[0];
          reply += `\n\nLast deworming
- ${deworm.product_name} on ${formatDateForReply(deworm.event_date || deworm.created_at)}
- next due: ${formatDateForReply(deworm.next_due_date)}`;
        } else {
          reply += `\n\nLast deworming
- No deworming records`;
        }

        if (lastFarrierResult.rows.length > 0) {
          const farrier = lastFarrierResult.rows[0];
          reply += `\n\nLast farrier
- ${farrier.service_type} on ${formatDateForReply(farrier.event_date || farrier.created_at)}
- next due: ${formatDateForReply(farrier.next_due_date)}`;
        } else {
          reply += `\n\nLast farrier
- No farrier records`;
        }

        await ctx.reply(reply);
        continue;
      }

      // -----------------------------
      // STOCK ALL
      // -----------------------------
      if (lowerMessage === 'stock') {
        const stockResult = await pool.query(`
          SELECT name, unit, current_stock
          FROM feed_items
          ORDER BY name ASC
        `);

        if (stockResult.rows.length === 0) {
          await ctx.reply('No feed items found.');
          continue;
        }

        const lines = stockResult.rows.map(
          (row) => `${row.name}: ${row.current_stock} ${row.unit}`
        );

        await ctx.reply(`Current stock\n\n${lines.join('\n')}`);
        continue;
      }

      // -----------------------------
      // STOCK ONE ITEM
      // -----------------------------
      if (command === 'stock' && parts.length >= 2) {
        const itemName = parts.slice(1).join(' ').toLowerCase();

        const item = await findFeedItemByName(itemName);

        if (!item) {
          await ctx.reply(`Feed item not found: ${itemName}`);
          continue;
        }

        await ctx.reply(`${item.name}: ${item.current_stock} ${item.unit}`);
        continue;
      }

      // -----------------------------
      // FEED COMMAND
      // -----------------------------
      if (command === 'feed' && parts.length >= 4) {
        const lastPart = parts[parts.length - 1];

        let eventDate = todayDateString();
        let unit;
        let quantity;
        let itemName;
        let horseName;
        let feedPartsEnd = parts.length;

        if (looksLikeDateString(lastPart) && !isValidDateString(lastPart)) {
          await ctx.reply(`Invalid calendar date: ${lastPart}`);
          continue;
        }

        if (isValidDateString(lastPart)) {
          eventDate = lastPart;
          feedPartsEnd -= 1;
        }

        const compactQuantityUnit = parseCompactQuantityUnit(parts[feedPartsEnd - 1]);

        if (compactQuantityUnit) {
          quantity = compactQuantityUnit.quantity;
          unit = compactQuantityUnit.unit;
          itemName = parts[feedPartsEnd - 2]?.toLowerCase();
          horseName = parts.slice(1, feedPartsEnd - 2).join(' ').toLowerCase();
        } else {
          unit = parts[feedPartsEnd - 1]?.toLowerCase();
          quantity = Number(parts[feedPartsEnd - 2]);
          itemName = parts[feedPartsEnd - 3]?.toLowerCase();
          horseName = parts.slice(1, feedPartsEnd - 3).join(' ').toLowerCase();
        }

        if (!horseName || !itemName || Number.isNaN(quantity) || quantity <= 0) {
          await ctx.reply('Invalid quantity. Example: feed imperial oats 2 kg');
          continue;
        }

        const horse = await findHorseByName(horseName);

        if (!horse) {
          const horses = await listHorseNames();
          await ctx.reply(
            `Horse not found: ${horseName}

Available horses:
${horses.map((h) => `- ${h}`).join('\n')}`
          );
          continue;
        }

        const feedItem = await findFeedItemByName(itemName);

        if (!feedItem) {
          await ctx.reply(`Feed item not found: ${itemName}`);
          continue;
        }

        if (feedItem.unit.toLowerCase() !== unit) {
          await ctx.reply(`Unit mismatch. Expected ${feedItem.unit}`);
          continue;
        }

        if (Number(feedItem.current_stock) < quantity) {
          await ctx.reply(
            `Not enough stock. ${feedItem.name} has ${feedItem.current_stock} ${feedItem.unit}`
          );
          continue;
        }

        const feedEventResult = await pool.query(
          `
          INSERT INTO feed_events (
            horse_id,
            feed_item_id,
            quantity,
            unit,
            telegram_user_id,
            event_date
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
          `,
          [horse.id, feedItem.id, quantity, unit, telegramUserId, eventDate]
        );

        const updatedStockResult = await pool.query(
          `
          UPDATE feed_items
          SET current_stock = current_stock - $1
          WHERE id = $2
          RETURNING current_stock
          `,
          [quantity, feedItem.id]
        );

        await ctx.reply(
          `Feed recorded ✅

Horse: ${horse.name}
Feed: ${feedItem.name}
Amount: ${quantity} ${unit}
Date: ${eventDate}
Remaining stock: ${updatedStockResult.rows[0].current_stock} ${unit}
Raw message ID: ${rawMessageId}
Feed event ID: ${feedEventResult.rows[0].id}`
        );

        sendRemindersToAlertChat().catch((error) => {
          console.error('REMINDER ERROR:', error);
        });
        continue;
      }

      // -----------------------------
      // DEWORM DUE
      // -----------------------------
      if (lowerMessage === 'deworm due') {
        const dewormRows = await getLatestDewormRows();

        if (dewormRows.length === 0) {
          await ctx.reply('No deworming reminder records found.');
          continue;
        }

        const { overdue, dueSoon } = buildDewormReminderGroups(
          dewormRows,
          DEWORM_ALERT_DAYS_AHEAD
        );

        if (overdue.length === 0 && dueSoon.length === 0) {
          await ctx.reply('No horses are due soon or overdue for deworming.');
          continue;
        }

        let reply = 'Deworming reminders\n\n';

        if (overdue.length > 0) {
          reply += `Overdue:\n${overdue.map((item) => item.line).join('\n')}\n\n`;
        }

        if (dueSoon.length > 0) {
          reply += `Due soon:\n${dueSoon.map((item) => item.line).join('\n')}`;
        }

        await ctx.reply(reply.trim());
        continue;
      }

      // -----------------------------
      // DEWORM COMMAND
      // -----------------------------
      if (command === 'deworm' && parts.length >= 3) {
        const allHorses = await listHorseNames();

        let matchedHorse = null;
        let matchedHorseName = '';

        for (const horseName of allHorses) {
          const prefix = `deworm ${horseName.toLowerCase()} `;
          if (lowerMessage.startsWith(prefix)) {
            matchedHorseName = horseName;
            matchedHorse = await findHorseByName(horseName);
            break;
          }
        }

        if (!matchedHorse) {
          await ctx.reply(
            `Horse not found.

Available horses:
${allHorses.map((h) => `- ${h}`).join('\n')}`
          );
          continue;
        }

        let remainder = messageText
          .slice(`deworm ${matchedHorseName}`.length)
          .trim();

        if (!remainder) {
          await ctx.reply('Use: deworm <horse name> <product> [YYYY-MM-DD]');
          continue;
        }

        const remainderParts = remainder.split(/\s+/);
        const lastPart = remainderParts[remainderParts.length - 1];

        let eventDate = todayDateString();
        let productName = remainder;

        if (looksLikeDateString(lastPart) && !isValidDateString(lastPart)) {
          await ctx.reply(`Invalid calendar date: ${lastPart}`);
          continue;
        }

        if (isValidDateString(lastPart)) {
          eventDate = lastPart;
          productName = remainderParts.slice(0, -1).join(' ').trim();
        }

        if (!productName) {
          await ctx.reply('Use: deworm <horse name> <product> [YYYY-MM-DD]');
          continue;
        }

        const nextDueDate = addDaysToDateString(eventDate, 20);

        const dewormResult = await pool.query(
          `
          INSERT INTO deworming_events (
            horse_id,
            product_name,
            telegram_user_id,
            event_date,
            next_due_date
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, created_at, event_date, next_due_date
          `,
          [matchedHorse.id, productName, telegramUserId, eventDate, nextDueDate]
        );

        await ctx.reply(
          `Deworming recorded ✅

Horse: ${matchedHorse.name}
Product: ${productName}
Event date: ${formatDateForReply(dewormResult.rows[0].event_date)}
Next due date: ${formatDateForReply(dewormResult.rows[0].next_due_date)}
Event ID: ${dewormResult.rows[0].id}
Raw message ID: ${rawMessageId}`
        );

        sendRemindersToAlertChat().catch((error) => {
          console.error('REMINDER ERROR:', error);
        });
        continue;
      }

      // -----------------------------
      // FARRIER DUE
      // -----------------------------
      if (lowerMessage === 'farrier due') {
        const dueResult = await pool.query(`
          SELECT
            f.id,
            h.name AS horse_name,
            f.service_type,
            f.event_date,
            f.next_due_date
          FROM farrier_events f
          JOIN horses h ON h.id = f.horse_id
          WHERE f.next_due_date IS NOT NULL
          ORDER BY f.next_due_date ASC
        `);

        if (dueResult.rows.length === 0) {
          await ctx.reply('No farrier reminder records found.');
          continue;
        }

        const today = todayDateString();
        const soonLimit = addDaysToDateString(today, 3);

        const overdue = [];
        const dueSoon = [];

        for (const row of dueResult.rows) {
          const nextDue = formatDateForReply(row.next_due_date);
          const line = `- ${row.horse_name} | due: ${nextDue} | service: ${row.service_type}`;

          if (nextDue < today) {
            overdue.push(line);
          } else if (nextDue >= today && nextDue <= soonLimit) {
            dueSoon.push(line);
          }
        }

        if (overdue.length === 0 && dueSoon.length === 0) {
          await ctx.reply('No horses are due soon or overdue for farrier.');
          continue;
        }

        let reply = 'Farrier reminders\n\n';

        if (overdue.length > 0) {
          reply += `Overdue:\n${overdue.join('\n')}\n\n`;
        }

        if (dueSoon.length > 0) {
          reply += `Due soon:\n${dueSoon.join('\n')}`;
        }

        await ctx.reply(reply.trim());
        continue;
      }

      // -----------------------------
      // FARRIER COMMAND
      // -----------------------------
      if (command === 'farrier' && parts.length >= 3) {
        const allHorses = await listHorseNames();

        let matchedHorse = null;
        let matchedHorseName = '';

        for (const horseName of allHorses) {
          const prefix = `farrier ${horseName.toLowerCase()} `;
          if (lowerMessage.startsWith(prefix)) {
            matchedHorseName = horseName;
            matchedHorse = await findHorseByName(horseName);
            break;
          }
        }

        if (!matchedHorse) {
          await ctx.reply(
            `Horse not found.

Available horses:
${allHorses.map((h) => `- ${h}`).join('\n')}`
          );
          continue;
        }

        let remainder = messageText
          .slice(`farrier ${matchedHorseName}`.length)
          .trim();

        if (!remainder) {
          await ctx.reply('Use: farrier <horse name> <service> [YYYY-MM-DD]');
          continue;
        }

        const remainderParts = remainder.split(/\s+/);
        const lastPart = remainderParts[remainderParts.length - 1];

        let eventDate = todayDateString();
        let serviceType = remainder;

        if (looksLikeDateString(lastPart) && !isValidDateString(lastPart)) {
          await ctx.reply(`Invalid calendar date: ${lastPart}`);
          continue;
        }

        if (isValidDateString(lastPart)) {
          eventDate = lastPart;
          serviceType = remainderParts.slice(0, -1).join(' ').trim();
        }

        if (!serviceType) {
          await ctx.reply('Use: farrier <horse name> <service> [YYYY-MM-DD]');
          continue;
        }

        const daysUntilNext = getFarrierDaysUntilNext(serviceType);
        const nextDueDate = addDaysToDateString(eventDate, daysUntilNext);

        const farrierResult = await pool.query(
          `
          INSERT INTO farrier_events (
            horse_id,
            service_type,
            telegram_user_id,
            event_date,
            next_due_date
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, created_at, event_date, next_due_date
          `,
          [matchedHorse.id, serviceType, telegramUserId, eventDate, nextDueDate]
        );

        await ctx.reply(
          `Farrier recorded ✅

Horse: ${matchedHorse.name}
Service: ${serviceType}
Event date: ${formatDateForReply(farrierResult.rows[0].event_date)}
Next due date: ${formatDateForReply(farrierResult.rows[0].next_due_date)}
Event ID: ${farrierResult.rows[0].id}
Raw message ID: ${rawMessageId}`
        );
        continue;
      }

      await ctx.reply(`Saved in database ✅ Record ID: ${rawMessageId}`);
    }
  } catch (error) {
    console.error('ERROR:', error);
    await ctx.reply('Error processing message.');
  }
});

bot
  .launch()
  .then(async () => {
    await startReminderScheduler();
    console.log(
      'BOT RUNNING WITH FEED + STOCK + HORSE + DEWORM + FARRIER + DATES + REMINDERS + MULTILINE + ALERTS'
    );
    console.log(
      `REMINDER CONFIG: daysAhead=${DEWORM_ALERT_DAYS_AHEAD}, lowStockThreshold=${LOW_STOCK_THRESHOLD}, intervalMinutes=${ALERT_CHECK_INTERVAL_MINUTES}, alertChat=${alertChatId || 'auto'}`
    );
  })
  .catch((error) => {
    console.error('BOT FAILED TO START:', error);
    process.exit(1);
  });
