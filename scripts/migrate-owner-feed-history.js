// One-off migration: copy the purchase AND consumption history sitting in
// the shared Stock module (feed_items + stock_events) into a specific
// owner's personal feed log (owner_feed_purchases), so you don't lose the
// old dates when you later remove those products from Stock. Consumption
// ('use' events, e.g. bales already used) is migrated too, so the current
// stock balance for things like fardos comes out accurate, not just the
// cumulative amount ever purchased.
//
// This script is READ-ONLY on feed_items / stock_events. It only INSERTS
// rows into owner_feed_purchases. It skips anything that looks like a
// duplicate of what you already entered by hand (same product + date +
// amount, or same product + date + quantity for consumption), so it's safe
// to run more than once.
//
// It does NOT delete anything from Stock. Once you've checked the results
// in Propietarios, delete the products from Stock yourself with the "x"
// button on each product card, whenever you're ready.
//
// Usage:
//   node --env-file=.env.ercilia scripts/migrate-owner-feed-history.js "Loli"
//   node --env-file=.env.benteveo scripts/migrate-owner-feed-history.js "Loli" --dry-run
//
// If you omit the name, it defaults to "Loli".
// Add --dry-run to only print what WOULD be migrated, without writing anything.

const { pool } = require('../lib/db');
const { ensureOwnersSchema, createFeedPurchase } = require('../lib/owners');

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const dryRun = process.argv.includes('--dry-run');
  const ownerName = args[0] || 'Loli';

  console.log(`\nMigrando historial de Stock -> compras de alimento de "${ownerName}"${dryRun ? ' (DRY RUN, no se escribe nada)' : ''}\n`);

  await ensureOwnersSchema();

  const ownerResult = await pool.query(
    `SELECT id, name FROM owners WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [ownerName]
  );

  if (ownerResult.rows.length === 0) {
    console.error(`No encontre un propietario llamado "${ownerName}". Revisa el nombre exacto en Propietarios.`);
    process.exit(1);
  }

  const owner = ownerResult.rows[0];
  console.log(`Propietario encontrado: ${owner.name} (id ${owner.id})`);

  const hasFeedItems = await pool.query(`SELECT to_regclass('public.feed_items') AS rel`);
  const hasStockEvents = await pool.query(`SELECT to_regclass('public.stock_events') AS rel`);

  if (!hasFeedItems.rows[0].rel || !hasStockEvents.rows[0].rel) {
    console.log('No encontre las tablas feed_items / stock_events. No hay nada para migrar.');
    await pool.end();
    return;
  }

  const itemsResult = await pool.query(`SELECT id, name, unit FROM feed_items ORDER BY name ASC`);
  console.log(`Productos encontrados en Stock: ${itemsResult.rows.length}`);

  const existingResult = await pool.query(
    `SELECT product_name, purchase_date, amount::float AS amount, quantity::float AS quantity, movement_type
     FROM owner_feed_purchases WHERE owner_id = $1`,
    [owner.id]
  );
  const existingKeys = new Set(
    existingResult.rows.map((r) => {
      const dateStr = r.purchase_date instanceof Date ? r.purchase_date.toISOString().slice(0, 10) : r.purchase_date;
      if (r.movement_type === 'consumption') {
        return `${String(r.product_name).trim().toLowerCase()}|consumo|${dateStr}|${r.quantity}`;
      }
      return `${String(r.product_name).trim().toLowerCase()}|${dateStr}|${Number(r.amount).toFixed(2)}`;
    })
  );

  let migrated = 0;
  let skippedDuplicate = 0;
  let skippedNoCost = 0;

  for (const item of itemsResult.rows) {
    const eventsResult = await pool.query(
      `SELECT event_type, quantity, unit, event_date, supplier_name, unit_cost, total_cost,
              purchase_unit_count, purchase_unit_label
       FROM stock_events
       WHERE feed_item_id = $1 AND event_type IN ('add', 'use')
       ORDER BY event_date ASC, id ASC`,
      [item.id]
    );

    if (eventsResult.rows.length === 0) {
      continue;
    }

    console.log(`\n${item.name}: ${eventsResult.rows.length} movimiento(s) registrado(s) en Stock`);

    for (const ev of eventsResult.rows) {
      const dateStr = ev.event_date instanceof Date ? ev.event_date.toISOString().slice(0, 10) : ev.event_date;
      const isConsumption = ev.event_type === 'use';

      if (isConsumption) {
        // Consumption events don't carry a cost in this model - they just
        // reduce the running stock, same as "Registrar consumo" in the app.
        const quantity = Number(ev.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) {
          console.log(`  - ${dateStr}: consumo sin cantidad valida, salteado.`);
          skippedNoCost += 1;
          continue;
        }

        const key = `${item.name.trim().toLowerCase()}|consumo|${dateStr}|${quantity}`;
        if (existingKeys.has(key)) {
          console.log(`  - ${dateStr}: consumo ya existe en Propietarios, salteado.`);
          skippedDuplicate += 1;
          continue;
        }

        const quantityLabel = `${quantity} ${ev.unit || item.unit || ''}`.trim();

        if (dryRun) {
          console.log(`  - ${dateStr}: MIGRARIA consumo de ${quantityLabel}`);
        } else {
          await createFeedPurchase({
            ownerId: owner.id,
            purchaseDate: dateStr,
            productName: item.name,
            quantityLabel,
            quantity,
            unit: ev.unit || item.unit || undefined,
            movementType: 'consumption',
            amount: undefined,
            notes: 'Migrado desde Stock (consumo)',
          });
          console.log(`  - ${dateStr}: migrado consumo de ${quantityLabel}`);
        }

        migrated += 1;
        continue;
      }

      let amount = Number(ev.total_cost);
      if (!Number.isFinite(amount) || amount <= 0) {
        const unitCost = Number(ev.unit_cost);
        const unitCount = Number(ev.purchase_unit_count);
        amount = Number.isFinite(unitCost) && Number.isFinite(unitCount) ? unitCost * unitCount : NaN;
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        console.log(`  - ${dateStr}: sin costo cargado, salteado (cargalo a mano si te importa la fecha).`);
        skippedNoCost += 1;
        continue;
      }

      const roundedAmount = Number(amount.toFixed(2));
      const key = `${item.name.trim().toLowerCase()}|${dateStr}|${roundedAmount.toFixed(2)}`;

      if (existingKeys.has(key)) {
        console.log(`  - ${dateStr}: ya existe en Propietarios (parece que lo cargaste a mano), salteado.`);
        skippedDuplicate += 1;
        continue;
      }

      const quantityLabel = ev.purchase_unit_count && ev.purchase_unit_label
        ? `${ev.purchase_unit_count} ${ev.purchase_unit_label}`
        : (ev.quantity ? `${ev.quantity} ${ev.unit || item.unit || ''}`.trim() : '');

      const notes = ev.supplier_name
        ? `Proveedor: ${ev.supplier_name} (migrado desde Stock)`
        : 'Migrado desde Stock';

      if (dryRun) {
        console.log(`  - ${dateStr}: MIGRARIA compra $${roundedAmount} (${quantityLabel || 'sin cantidad'})`);
      } else {
        await createFeedPurchase({
          ownerId: owner.id,
          purchaseDate: dateStr,
          productName: item.name,
          quantityLabel,
          quantity: ev.purchase_unit_count || ev.quantity || undefined,
          unit: ev.purchase_unit_label || ev.unit || item.unit || undefined,
          movementType: 'purchase',
          amount: roundedAmount,
          notes,
        });
        console.log(`  - ${dateStr}: migrado compra $${roundedAmount} (${quantityLabel || 'sin cantidad'})`);
      }

      migrated += 1;
    }
  }

  console.log(`\nResumen:`);
  console.log(`  Migrados: ${migrated}${dryRun ? ' (simulado, no se escribio nada)' : ''}`);
  console.log(`  Salteados por duplicado: ${skippedDuplicate}`);
  console.log(`  Salteados por falta de costo: ${skippedNoCost}`);
  console.log(`\nRevisa "${owner.name}" en Propietarios -> Ver detalle -> Compras de alimento propias.`);
  console.log(`Cuando estes conforme, borra los productos de Stock con el boton "x" en cada producto (Stock -> Inventario).\n`);

  await pool.end();
}

main().catch((err) => {
  console.error('Error en la migracion:', err);
  process.exit(1);
});
