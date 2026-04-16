const { pool } = require('../../lib/db');
const { requireAdminApiAuth } = require('../../lib/admin-auth');

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

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!requireAdminApiAuth(req, res)) {
    return;
  }

  try {
    const body = await getJsonBody(req);

    const action = String(body.action || '').trim().toLowerCase();
    const itemName = String(body.itemName || '').trim().toLowerCase();
    const unit = String(body.unit || '').trim().toLowerCase();
    const quantity = Number(body.quantity);
    const notes = body.notes ? String(body.notes).trim() : '';
    let eventDate = body.eventDate ? String(body.eventDate).trim() : todayDateString();

    if (!['set', 'add', 'use'].includes(action)) {
      res.status(400).json({ ok: false, error: 'action must be set, add, or use' });
      return;
    }

    if (!itemName) {
      res.status(400).json({ ok: false, error: 'itemName is required' });
      return;
    }

    if (!unit) {
      res.status(400).json({ ok: false, error: 'unit is required' });
      return;
    }

    if (!Number.isFinite(quantity) || (action === 'set' ? quantity < 0 : quantity <= 0)) {
      res.status(400).json({ ok: false, error: 'quantity is invalid' });
      return;
    }

    if (looksLikeDateString(eventDate) && !isValidDateString(eventDate)) {
      res.status(400).json({ ok: false, error: 'eventDate is not a valid calendar date' });
      return;
    }

    if (!isValidDateString(eventDate)) {
      res.status(400).json({ ok: false, error: 'eventDate must be YYYY-MM-DD' });
      return;
    }

    const feedItemResult = await pool.query(
      `
      SELECT id, name, unit, current_stock
      FROM feed_items
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1
      `,
      [itemName]
    );

    if (feedItemResult.rows.length === 0) {
      res.status(404).json({ ok: false, error: `Feed item not found: ${itemName}` });
      return;
    }

    const feedItem = feedItemResult.rows[0];
    let updated;

    if (action === 'set') {
      const updateResult = await pool.query(
        `
        UPDATE feed_items
        SET current_stock = $1,
            unit = $2
        WHERE id = $3
        RETURNING id, name, unit, current_stock
        `,
        [quantity, unit, feedItem.id]
      );

      updated = updateResult.rows[0];
    } else if (action === 'add') {
      if (String(feedItem.unit || '').toLowerCase() !== unit) {
        res.status(400).json({
          ok: false,
          error: `Unit mismatch. Expected ${feedItem.unit}`,
        });
        return;
      }

      const updateResult = await pool.query(
        `
        UPDATE feed_items
        SET current_stock = current_stock + $1
        WHERE id = $2
        RETURNING id, name, unit, current_stock
        `,
        [quantity, feedItem.id]
      );

      updated = updateResult.rows[0];

      await pool.query(
        `
        INSERT INTO stock_events (
          feed_item_id,
          event_type,
          quantity,
          unit,
          event_date,
          notes,
          telegram_user_id
        )
        VALUES ($1, 'add', $2, $3, $4, $5, $6)
        `,
        [feedItem.id, quantity, unit, eventDate, notes || null, 'admin_panel']
      );
    } else {
      if (String(feedItem.unit || '').toLowerCase() !== unit) {
        res.status(400).json({
          ok: false,
          error: `Unit mismatch. Expected ${feedItem.unit}`,
        });
        return;
      }

      if (Number(feedItem.current_stock) < quantity) {
        res.status(400).json({
          ok: false,
          error: `Not enough stock. ${feedItem.name} has ${feedItem.current_stock} ${feedItem.unit}`,
        });
        return;
      }

      const updateResult = await pool.query(
        `
        UPDATE feed_items
        SET current_stock = current_stock - $1
        WHERE id = $2
        RETURNING id, name, unit, current_stock
        `,
        [quantity, feedItem.id]
      );

      updated = updateResult.rows[0];

      await pool.query(
        `
        INSERT INTO stock_events (
          feed_item_id,
          event_type,
          quantity,
          unit,
          event_date,
          notes,
          telegram_user_id
        )
        VALUES ($1, 'use', $2, $3, $4, $5, $6)
        `,
        [feedItem.id, quantity, unit, eventDate, notes || null, 'admin_panel']
      );
    }

    res.status(200).json({
      ok: true,
      action,
      item: {
        id: updated.id,
        name: updated.name,
        unit: updated.unit,
        current_stock: Number(updated.current_stock),
      },
    });
  } catch (error) {
    console.error('ADMIN STOCK MUTATE ERROR:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
