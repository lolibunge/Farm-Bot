const { pool } = require('../db');
const { listAdminModuleSettings, buildAdminModuleEnabledMap } = require('../admin-modules');
const { getMonthDateRange, todayYearMonth } = require('../feed-plans');

function parsePositiveInt(value, fallbackValue) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function toIsoDateString(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeNumber(value, fallbackValue = null) {
  if (value == null || value === '') {
    return fallbackValue;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function normalizeText(value) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeCategoryKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function classifyCategory(name, explicitCategory) {
  const provided = normalizeText(explicitCategory);
  if (provided) {
    return {
      key: normalizeCategoryKey(provided) || 'general',
      label: provided,
      derived: false,
    };
  }

  const normalizedName = String(name || '')
    .trim()
    .toLowerCase();

  if (
    normalizedName.includes('oats') ||
    normalizedName.includes('avena') ||
    normalizedName.includes('corn') ||
    normalizedName.includes('maiz') ||
    normalizedName.includes('maíz') ||
    normalizedName.includes('semitin') ||
    normalizedName.includes('cebada') ||
    normalizedName.includes('barley') ||
    normalizedName.includes('sorgo')
  ) {
    return { key: 'grano', label: 'Grano', derived: true };
  }

  if (
    normalizedName.includes('heno') ||
    normalizedName.includes('alfalfa') ||
    normalizedName.includes('balanceado') ||
    normalizedName.includes('alimento')
  ) {
    return { key: 'alimento', label: 'Alimento', derived: true };
  }

  if (
    normalizedName.includes('fertiliz') ||
    normalizedName.includes('urea') ||
    normalizedName.includes('npk')
  ) {
    return { key: 'fertilizante', label: 'Fertilizante', derived: true };
  }

  if (normalizedName.includes('herbic') || normalizedName.includes('glifosato')) {
    return { key: 'herbicida', label: 'Herbicida', derived: true };
  }

  if (normalizedName.includes('medic') || normalizedName.includes('vacuna')) {
    return { key: 'salud', label: 'Salud', derived: true };
  }

  return { key: 'general', label: 'General', derived: true };
}

function resolvePurchaseUnitProfile({ name, unit, category, purchaseUnitLabel, purchaseUnitSize }) {
  const normalizedUnit = String(unit || '')
    .trim()
    .toLowerCase();
  const resolvedCategory =
    category && typeof category === 'object'
      ? category
      : classifyCategory(name, typeof category === 'string' ? category : null);
  const isGrain = resolvedCategory?.key === 'grano' && normalizedUnit === 'kg';
  const explicitLabel = normalizeText(purchaseUnitLabel);
  const explicitSize = normalizeNumber(purchaseUnitSize);

  if (explicitLabel || (Number.isFinite(explicitSize) && explicitSize > 0)) {
    return {
      label: explicitLabel || (isGrain ? 'bolsa' : null),
      size: Number.isFinite(explicitSize) && explicitSize > 0 ? explicitSize : null,
      derived: false,
    };
  }

  if (isGrain) {
    return {
      label: 'bolsa',
      size: 25,
      derived: true,
    };
  }

  return {
    label: null,
    size: null,
    derived: false,
  };
}

function buildStockHealth(currentStock, minimumStock) {
  const safeMinimum = Number.isFinite(minimumStock) && minimumStock > 0 ? minimumStock : 1;
  const safeCurrent = Math.max(0, Number.isFinite(currentStock) ? currentStock : 0);
  const ratio = safeCurrent / safeMinimum;

  if (safeCurrent <= safeMinimum) {
    return {
      key: 'critical',
      label: 'Bajo stock',
      helper: `Necesita reposicion por debajo de ${safeMinimum}.`,
      meter_percent: clamp((safeCurrent / safeMinimum) * 100, 4, 100),
    };
  }

  if (ratio <= 1.8) {
    return {
      key: 'warning',
      label: 'Atencion',
      helper: 'Conviene monitorear este item de cerca.',
      meter_percent: clamp((ratio / 2.4) * 100, 18, 100),
    };
  }

  return {
    key: 'healthy',
    label: 'Estable',
    helper: 'Cobertura saludable para la operacion actual.',
    meter_percent: clamp((ratio / 3.2) * 100, 28, 100),
  };
}

async function listTableColumns(client, tableName, schemaName = 'public') {
  const result = await client.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = $1
      AND table_name = $2
    `,
    [schemaName, tableName]
  );

  return new Set(result.rows.map((row) => row.column_name));
}

async function hasTable(client, tableName, schemaName = 'public') {
  const result = await client.query('SELECT to_regclass($1) AS relation_name', [
    `${schemaName}.${tableName}`,
  ]);

  return Boolean(result.rows[0]?.relation_name);
}

function pickExistingColumn(columnSet, candidates) {
  for (const candidate of candidates) {
    if (columnSet.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

function buildSelectFragment(columnName, aliasName) {
  if (!columnName) {
    return `NULL AS ${quoteIdentifier(aliasName)}`;
  }

  return `${quoteIdentifier(columnName)} AS ${quoteIdentifier(aliasName)}`;
}

const LOW_STOCK_THRESHOLD = parsePositiveInt(process.env.LOW_STOCK_THRESHOLD, 5);
const ACCOUNTING_COLOR_PALETTE = ['#16b448', '#2d7df0', '#ff6b1a', '#ef2b2d', '#7a5af8', '#0f766e'];

async function buildFeedInventoryModel(client) {
  const columns = await listTableColumns(client, 'feed_items');
  const optionalColumns = {
    category: pickExistingColumn(columns, ['category', 'item_category']),
    supplier: pickExistingColumn(columns, ['supplier_name', 'supplier', 'provider_name', 'provider']),
    unit_cost: pickExistingColumn(columns, ['unit_cost', 'cost_per_unit', 'unit_price', 'purchase_price']),
    minimum_stock: pickExistingColumn(columns, ['minimum_stock', 'min_stock', 'stock_minimum']),
    purchase_unit_label: pickExistingColumn(columns, ['purchase_unit_label']),
    purchase_unit_size: pickExistingColumn(columns, ['purchase_unit_size']),
    last_purchase_date: pickExistingColumn(columns, [
      'last_purchase_date',
      'last_stocked_at',
      'last_restocked_at',
    ]),
  };

  const inventoryResult = await client.query(
    `
    SELECT
      id,
      name,
      unit,
      current_stock,
      ${buildSelectFragment(optionalColumns.category, 'category_value')},
      ${buildSelectFragment(optionalColumns.supplier, 'supplier_value')},
      ${buildSelectFragment(optionalColumns.unit_cost, 'unit_cost_value')},
      ${buildSelectFragment(optionalColumns.minimum_stock, 'minimum_stock_value')},
      ${buildSelectFragment(optionalColumns.purchase_unit_label, 'purchase_unit_label_value')},
      ${buildSelectFragment(optionalColumns.purchase_unit_size, 'purchase_unit_size_value')},
      ${buildSelectFragment(optionalColumns.last_purchase_date, 'last_purchase_date_value')}
    FROM feed_items
    ORDER BY name ASC
    `
  );

  const stockEventsTableExists = await hasTable(client, 'stock_events');
  const recentMovementResult = stockEventsTableExists
    ? await client.query(
        `
        SELECT COUNT(*)::int AS count
        FROM stock_events
        WHERE event_date >= CURRENT_DATE - INTERVAL '6 days'
        `
      )
    : { rows: [{ count: 0 }] };

  const latestMovementResult = stockEventsTableExists
    ? await client.query(
        `
        SELECT MAX(event_date) AS latest_event_date
        FROM stock_events
        `
      )
    : { rows: [{ latest_event_date: null }] };

  const latestMovementByItemResult = stockEventsTableExists
    ? await client.query(
        `
        SELECT
          feed_item_id,
          MAX(event_date) AS latest_event_date
        FROM stock_events
        GROUP BY feed_item_id
        `
      )
    : { rows: [] };

  const recentMovementsResult = stockEventsTableExists
    ? await client.query(
        `
        SELECT
          s.id,
          i.name AS item_name,
          s.event_type,
          s.quantity,
          s.unit,
          s.event_date,
          s.notes
        FROM stock_events s
        JOIN feed_items i ON i.id = s.feed_item_id
        ORDER BY s.event_date DESC, s.id DESC
        LIMIT 12
        `
      )
    : { rows: [] };

  const latestMovementMap = new Map(
    latestMovementByItemResult.rows.map((row) => [Number(row.feed_item_id), toIsoDateString(row.latest_event_date)])
  );

  const items = inventoryResult.rows.map((row) => {
    const minimumStock = normalizeNumber(row.minimum_stock_value, LOW_STOCK_THRESHOLD) || LOW_STOCK_THRESHOLD;
    const currentStock = normalizeNumber(row.current_stock, 0) || 0;
    const category = classifyCategory(row.name, row.category_value);
    const health = buildStockHealth(currentStock, minimumStock);
    const purchaseProfile = resolvePurchaseUnitProfile({
      name: row.name,
      unit: row.unit,
      category,
      purchaseUnitLabel: row.purchase_unit_label_value,
      purchaseUnitSize: row.purchase_unit_size_value,
    });
    const effectivePurchaseUnitSize = purchaseProfile.size || 1;
    const purchaseUnitCost = normalizeNumber(row.unit_cost_value);
    const baseUnitCost =
      purchaseUnitCost == null
        ? null
        : Number((purchaseUnitCost / effectivePurchaseUnitSize).toFixed(4));

    return {
      id: Number(row.id),
      name: String(row.name || '').trim(),
      unit: String(row.unit || '').trim(),
      current_stock: currentStock,
      minimum_stock: minimumStock,
      category,
      supplier: normalizeText(row.supplier_value),
      unit_cost: purchaseUnitCost,
      base_unit_cost: baseUnitCost,
      purchase_unit_label: purchaseProfile.label,
      purchase_unit_size: purchaseProfile.size,
      purchase_unit_derived: purchaseProfile.derived,
      last_purchase_date: toIsoDateString(row.last_purchase_date_value),
      last_movement_date: latestMovementMap.get(Number(row.id)) || null,
      health,
      actions_enabled: false,
    };
  });

  const lowStockItems = items.filter((item) => item.current_stock <= item.minimum_stock);
  const categories = Array.from(
    items.reduce((map, item) => {
      if (!map.has(item.category.key)) {
        map.set(item.category.key, {
          key: item.category.key,
          label: item.category.label,
        });
      }
      return map;
    }, new Map())
  ).sort((left, right) => String(left.label).localeCompare(String(right.label), 'es'));

  return {
    items,
    low_stock_items: lowStockItems,
    categories,
    recent_movements: recentMovementsResult.rows.map((row) => ({
      id: Number(row.id),
      item_name: String(row.item_name || '').trim(),
      event_type: normalizeText(row.event_type) || 'movement',
      quantity: normalizeNumber(row.quantity, 0) || 0,
      unit: String(row.unit || '').trim(),
      event_date: toIsoDateString(row.event_date),
      notes: normalizeText(row.notes),
    })),
    stock_events_available: stockEventsTableExists,
    recent_movement_count: normalizeNumber(recentMovementResult.rows[0]?.count, 0) || 0,
    latest_movement_date: toIsoDateString(latestMovementResult.rows[0]?.latest_event_date),
    optional_columns: optionalColumns,
  };
}

function buildLowStockAlert(lowStockItems) {
  if (!Array.isArray(lowStockItems) || lowStockItems.length === 0) {
    return {
      tone: 'healthy',
      title: 'Inventario estable',
      description: 'No hay productos por debajo del minimo configurado en esta lectura.',
      items: [],
    };
  }

  const primaryItem = lowStockItems[0];

  return {
    tone: 'critical',
    title: `Stock bajo detectado - ${lowStockItems.length} producto${lowStockItems.length === 1 ? '' : 's'}`,
    description: `${primaryItem.name} es el item mas comprometido en la nueva vista de inventario.`,
    items: lowStockItems.slice(0, 4).map((item) => ({
      id: item.id,
      name: item.name,
      detail: `Stock actual: ${item.current_stock} ${item.unit} · Minimo: ${item.minimum_stock} ${item.unit}`,
    })),
  };
}

function buildSummaryCards(feedInventoryModel) {
  return [
    {
      key: 'inventory_items',
      label: 'Productos activos',
      value: feedInventoryModel.items.length,
      detail: 'Catalogo disponible en esta nueva ruta.',
      tone: 'neutral',
    },
    {
      key: 'inventory_low_stock',
      label: 'Bajo stock',
      value: feedInventoryModel.low_stock_items.length,
      detail: 'Items por debajo del minimo operativo.',
      tone: feedInventoryModel.low_stock_items.length > 0 ? 'critical' : 'positive',
    },
    {
      key: 'inventory_recent_movements',
      label: 'Movimientos 7 dias',
      value: feedInventoryModel.recent_movement_count,
      detail: feedInventoryModel.stock_events_available
        ? 'Lectura desde stock_events.'
        : 'Sin tabla de movimientos disponible aun.',
      tone: feedInventoryModel.stock_events_available ? 'positive' : 'neutral',
    },
    {
      key: 'inventory_latest_movement',
      label: 'Ultimo movimiento',
      value: feedInventoryModel.latest_movement_date || 'Sin datos',
      detail: feedInventoryModel.latest_movement_date
        ? 'Ultima fecha con movimiento de stock registrado.'
        : 'Pendiente de conectar historial operativo.',
      tone: feedInventoryModel.latest_movement_date ? 'neutral' : 'warning',
    },
  ];
}

function toCurrencyNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function countTruthy(rows, predicate) {
  return (Array.isArray(rows) ? rows : []).filter((row) => Boolean(predicate(row))).length;
}

function buildCostChart(rows, valueKey, options = {}) {
  const filteredRows = (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      ...row,
      chart_value: toCurrencyNumber(row?.[valueKey]),
    }))
    .filter((row) => row.chart_value > 0)
    .sort((left, right) => right.chart_value - left.chart_value);
  const totalValue = filteredRows.reduce((sum, row) => sum + row.chart_value, 0);
  const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : 5;
  const topRows = filteredRows.slice(0, limit);
  const overflowRows = filteredRows.slice(limit);
  const chartRows = topRows.map((row, index) => ({
    key: row.key || row.item_id || `${options.keyPrefix || 'row'}-${index + 1}`,
    label: row.label || row.name || `Fila ${index + 1}`,
    detail: row.detail || '',
    value: row.chart_value,
    share_percent: totalValue > 0 ? Number(((row.chart_value / totalValue) * 100).toFixed(1)) : 0,
    color: ACCOUNTING_COLOR_PALETTE[index % ACCOUNTING_COLOR_PALETTE.length],
  }));

  if (overflowRows.length > 0) {
    const otherValue = overflowRows.reduce((sum, row) => sum + row.chart_value, 0);
    chartRows.push({
      key: `${options.keyPrefix || 'row'}-others`,
      label: options.otherLabel || 'Otros',
      detail: `${overflowRows.length} item(s) agrupados.`,
      value: otherValue,
      share_percent: totalValue > 0 ? Number(((otherValue / totalValue) * 100).toFixed(1)) : 0,
      color: ACCOUNTING_COLOR_PALETTE[chartRows.length % ACCOUNTING_COLOR_PALETTE.length],
    });
  }

  return {
    total_value: totalValue,
    rows: chartRows,
  };
}

async function countEventsInPeriod(client, tableName, period, dateColumn = 'event_date') {
  if (!(await hasTable(client, tableName))) {
    return 0;
  }

  const result = await client.query(
    `
    SELECT COUNT(*)::int AS count
    FROM ${quoteIdentifier(tableName)}
    WHERE ${quoteIdentifier(dateColumn)} BETWEEN $1 AND $2
    `,
    [period.start_date, period.end_date]
  );

  return normalizeNumber(result.rows[0]?.count, 0) || 0;
}

async function buildFeedAccountingModel(client, feedInventoryModel) {
  const period = getMonthDateRange(todayYearMonth());
  const daysElapsed = new Date().getDate();
  const daysInMonth = parseInt(period.end_date.slice(-2), 10);
  const feedPlanTableExists = await hasTable(client, 'horse_feed_plan_items');
  const feedEventsTableExists = await hasTable(client, 'feed_events');
  const productRows = (feedInventoryModel.items || []).map((item) => {
    const purchaseUnitCost = normalizeNumber(item.unit_cost);
    const baseUnitCost = normalizeNumber(item.base_unit_cost);
    const currentStock = normalizeNumber(item.current_stock, 0) || 0;

    return {
      item_id: Number(item.id),
      name: item.name,
      category_label: item.category?.label || 'General',
      category_key: item.category?.key || 'general',
      unit: item.unit,
      unit_cost: purchaseUnitCost,
      base_unit_cost: baseUnitCost,
      purchase_unit_label: item.purchase_unit_label || null,
      purchase_unit_size: normalizeNumber(item.purchase_unit_size, 1) || 1,
      current_stock: currentStock,
      inventory_value: baseUnitCost == null ? null : toCurrencyNumber(baseUnitCost * currentStock),
      estimated_daily_quantity: 0,
      estimated_monthly_quantity: 0,
      estimated_monthly_cost: 0,
      actual_month_quantity: 0,
      actual_month_cost: 0,
      supplier: item.supplier || null,
      last_purchase_date: item.last_purchase_date || null,
    };
  });
  const productRowsById = new Map(productRows.map((row) => [row.item_id, row]));

  const feedPlanRowsResult = feedPlanTableExists
    ? await client.query(
        `
        SELECT
          h.id AS horse_id,
          h.name AS horse_name,
          fi.id AS feed_item_id,
          fi.name AS feed_item_name,
          SUM(hfpi.quantity)::numeric AS quantity,
          MIN(hfpi.unit) AS unit
        FROM horse_feed_plan_items hfpi
        JOIN horses h ON h.id = hfpi.horse_id
        JOIN feed_items fi ON fi.id = hfpi.feed_item_id
        GROUP BY h.id, h.name, fi.id, fi.name
        ORDER BY h.name ASC, fi.name ASC
        `
      )
    : { rows: [] };

  const actualMonthRowsResult = feedEventsTableExists
    ? await client.query(
        `
        SELECT
          h.id AS horse_id,
          h.name AS horse_name,
          fi.id AS feed_item_id,
          fi.name AS feed_item_name,
          SUM(f.quantity)::numeric AS quantity,
          MIN(f.unit) AS unit
        FROM feed_events f
        JOIN horses h ON h.id = f.horse_id
        JOIN feed_items fi ON fi.id = f.feed_item_id
        WHERE f.event_date BETWEEN $1 AND $2
        GROUP BY h.id, h.name, fi.id, fi.name
        ORDER BY h.name ASC, fi.name ASC
        `,
        [period.start_date, period.end_date]
      )
    : { rows: [] };

  const horseCostRowsById = new Map();
  const ensureHorseCostRow = (horseId, horseName) => {
    const normalizedHorseId = Number(horseId);
    if (!horseCostRowsById.has(normalizedHorseId)) {
      horseCostRowsById.set(normalizedHorseId, {
        horse_id: normalizedHorseId,
        horse_name: String(horseName || '').trim() || `Caballo ${horseId}`,
        estimated_daily_cost: 0,
        estimated_monthly_cost: 0,
        estimated_annual_cost: 0,
        actual_month_cost: 0,
        planned_items_count: 0,
        planned_items_with_cost: 0,
        actual_items_count: 0,
        actual_items_with_cost: 0,
        missing_price_items: new Set(),
        plan_breakdown: [],
      });
    }

    return horseCostRowsById.get(normalizedHorseId);
  };

  for (const row of feedPlanRowsResult.rows) {
    const horseRow = ensureHorseCostRow(row.horse_id, row.horse_name);
    const productRow = productRowsById.get(Number(row.feed_item_id));
    const quantity = normalizeNumber(row.quantity, 0) || 0;
    const unitCost = normalizeNumber(productRow?.base_unit_cost);
    const productName = productRow?.name || String(row.feed_item_name || '').trim() || `Item ${row.feed_item_id}`;

    horseRow.planned_items_count += 1;
    const dailyItemCost = unitCost != null ? toCurrencyNumber(quantity * unitCost) : null;

    horseRow.plan_breakdown.push({
      name: productName,
      quantity: Number(quantity.toFixed(3)),
      unit: row.unit || '',
      daily_cost: dailyItemCost,
    });

    if (unitCost != null) {
      horseRow.planned_items_with_cost += 1;
      horseRow.estimated_daily_cost += dailyItemCost;
    } else {
      horseRow.missing_price_items.add(productName);
    }

    if (productRow) {
      productRow.estimated_daily_quantity += quantity;
      productRow.estimated_monthly_quantity += quantity * 30;
      if (unitCost != null) {
        productRow.estimated_monthly_cost += toCurrencyNumber(quantity * unitCost * 30);
      }
    }
  }

  for (const row of actualMonthRowsResult.rows) {
    const horseRow = ensureHorseCostRow(row.horse_id, row.horse_name);
    const productRow = productRowsById.get(Number(row.feed_item_id));
    const quantity = normalizeNumber(row.quantity, 0) || 0;
    const unitCost = normalizeNumber(productRow?.base_unit_cost);
    const productName = productRow?.name || String(row.feed_item_name || '').trim() || `Item ${row.feed_item_id}`;

    horseRow.actual_items_count += 1;

    if (unitCost != null) {
      horseRow.actual_items_with_cost += 1;
      horseRow.actual_month_cost += toCurrencyNumber(quantity * unitCost);
    } else {
      horseRow.missing_price_items.add(productName);
    }

    if (productRow) {
      productRow.actual_month_quantity += quantity;
      if (unitCost != null) {
        productRow.actual_month_cost += toCurrencyNumber(quantity * unitCost);
      }
    }
  }

  const horseCostRows = Array.from(horseCostRowsById.values())
    .map((row) => {
      const estimatedDailyCost = toCurrencyNumber(row.estimated_daily_cost);
      const estimatedMonthlyCost = toCurrencyNumber(estimatedDailyCost * 30);
      const estimatedAnnualCost = toCurrencyNumber(estimatedDailyCost * 365);
      const actualMonthCost = toCurrencyNumber(row.actual_month_cost);
      const realDailyCost = actualMonthCost > 0
        ? toCurrencyNumber(actualMonthCost / daysElapsed)
        : null;
      const realMonthlyProjection = realDailyCost != null
        ? toCurrencyNumber(realDailyCost * daysInMonth)
        : null;

      return {
        horse_id: row.horse_id,
        horse_name: row.horse_name,
        estimated_daily_cost: estimatedDailyCost,
        estimated_monthly_cost: estimatedMonthlyCost,
        estimated_annual_cost: estimatedAnnualCost,
        actual_month_cost: actualMonthCost,
        real_daily_cost: realDailyCost,
        real_monthly_projection: realMonthlyProjection,
        planned_items_count: row.planned_items_count,
        planned_items_with_cost: row.planned_items_with_cost,
        actual_items_count: row.actual_items_count,
        actual_items_with_cost: row.actual_items_with_cost,
        missing_price_items: Array.from(row.missing_price_items).sort((left, right) =>
          left.localeCompare(right, 'es')
        ),
        plan_breakdown: row.plan_breakdown,
      };
    })
    .sort((left, right) => {
      const rightValue = Math.max(
        right.actual_month_cost,
        right.estimated_monthly_cost,
        right.estimated_annual_cost
      );
      const leftValue = Math.max(
        left.actual_month_cost,
        left.estimated_monthly_cost,
        left.estimated_annual_cost
      );
      return rightValue - leftValue || left.horse_name.localeCompare(right.horse_name, 'es');
    });

  const normalizedProductRows = productRows
    .map((row) => ({
      ...row,
      estimated_daily_quantity: Number(row.estimated_daily_quantity.toFixed(2)),
      estimated_monthly_quantity: Number(row.estimated_monthly_quantity.toFixed(2)),
      estimated_monthly_cost: toCurrencyNumber(row.estimated_monthly_cost),
      actual_month_quantity: Number(row.actual_month_quantity.toFixed(2)),
      actual_month_cost: toCurrencyNumber(row.actual_month_cost),
    }))
    .sort((left, right) => {
      const rightValue = Math.max(
        normalizeNumber(right.actual_month_cost, 0) || 0,
        normalizeNumber(right.estimated_monthly_cost, 0) || 0,
        normalizeNumber(right.inventory_value, 0) || 0
      );
      const leftValue = Math.max(
        normalizeNumber(left.actual_month_cost, 0) || 0,
        normalizeNumber(left.estimated_monthly_cost, 0) || 0,
        normalizeNumber(left.inventory_value, 0) || 0
      );
      return rightValue - leftValue || left.name.localeCompare(right.name, 'es');
    });

  const inventoryValueTotal = normalizedProductRows.reduce(
    (sum, row) => sum + (normalizeNumber(row.inventory_value, 0) || 0),
    0
  );
  const estimatedDailyTotal = horseCostRows.reduce((sum, row) => sum + row.estimated_daily_cost, 0);
  const estimatedMonthlyTotal = horseCostRows.reduce((sum, row) => sum + row.estimated_monthly_cost, 0);
  const estimatedAnnualTotal = horseCostRows.reduce((sum, row) => sum + row.estimated_annual_cost, 0);
  const actualMonthTotal = horseCostRows.reduce((sum, row) => sum + row.actual_month_cost, 0);
  const horsesWithRealCost = horseCostRows.filter((row) => row.real_daily_cost != null).length;
  const realDailyTotal = horseCostRows.reduce((sum, row) => sum + (row.real_daily_cost || 0), 0);
  const realMonthlyProjectionTotal = horsesWithRealCost > 0
    ? toCurrencyNumber(realDailyTotal * daysInMonth)
    : null;
  const horsesWithEstimatedCost = countTruthy(horseCostRows, (row) => row.estimated_monthly_cost > 0);
  const averageMonthlyPerHorse = horsesWithRealCost > 0
    ? toCurrencyNumber(realMonthlyProjectionTotal / horsesWithRealCost)
    : horsesWithEstimatedCost > 0
      ? toCurrencyNumber(estimatedMonthlyTotal / horsesWithEstimatedCost)
      : 0;
  const productsWithCost = countTruthy(normalizedProductRows, (row) => row.unit_cost != null);
  const plannedRowsWithCost = countTruthy(horseCostRows, (row) => row.planned_items_with_cost > 0)
    ? feedPlanRowsResult.rows.filter((row) => {
        const productRow = productRowsById.get(Number(row.feed_item_id));
        return normalizeNumber(productRow?.base_unit_cost) != null;
      }).length
    : 0;
  const actualRowsWithCost = countTruthy(horseCostRows, (row) => row.actual_items_with_cost > 0)
    ? actualMonthRowsResult.rows.filter((row) => {
        const productRow = productRowsById.get(Number(row.feed_item_id));
        return normalizeNumber(productRow?.base_unit_cost) != null;
      }).length
    : 0;

  const farrierEvents = await countEventsInPeriod(client, 'farrier_events', period);
  const dewormEvents = await countEventsInPeriod(client, 'deworming_events', period);
  const healthEvents = await countEventsInPeriod(client, 'horse_health_events', period);
  const serviceGapRows = [
    {
      key: 'farrier',
      label: 'Herrero',
      count: farrierEvents,
      detail: `${farrierEvents} servicio(s) de herrero en ${period.month} todavia sin monto.`,
    },
    {
      key: 'deworming',
      label: 'Desparasitacion',
      count: dewormEvents,
      detail: `${dewormEvents} evento(s) de desparasitacion en ${period.month} todavia sin monto.`,
    },
    {
      key: 'health',
      label: 'Salud',
      count: healthEvents,
      detail: `${healthEvents} evento(s) veterinarios en ${period.month} todavia sin monto.`,
    },
  ].filter((row) => row.count > 0);

  let monthlyCostChart = null;
  if (actualMonthTotal > 0) {
    const chart = buildCostChart(
      normalizedProductRows.map((row) => ({
        key: `product-${row.item_id}`,
        label: row.name,
        detail:
          row.actual_month_quantity > 0
            ? `${row.actual_month_quantity} ${row.unit} consumidos este mes.`
            : '',
        actual_month_cost: row.actual_month_cost,
      })),
      'actual_month_cost',
      { keyPrefix: 'actual', otherLabel: 'Otros productos' }
    );

    monthlyCostChart = {
      title: 'Distribucion del gasto real del mes',
      message: 'Tomamos los consumos registrados en feed_events y el costo cargado del producto convertido a su unidad base.',
      source: 'real',
      total_value: chart.total_value,
      rows: chart.rows,
    };
  } else if (estimatedMonthlyTotal > 0) {
    const chart = buildCostChart(
      normalizedProductRows.map((row) => ({
        key: `product-${row.item_id}`,
        label: row.name,
        detail:
          row.estimated_monthly_quantity > 0
            ? `${row.estimated_monthly_quantity} ${row.unit} estimados por mes.`
            : '',
        estimated_monthly_cost: row.estimated_monthly_cost,
      })),
      'estimated_monthly_cost',
      { keyPrefix: 'estimated', otherLabel: 'Otros productos' }
    );

    monthlyCostChart = {
      title: 'Distribucion del gasto mensual estimado',
      message: 'Calculado desde el plan diario de alimentacion guardado por caballo y el costo convertido a la unidad de consumo.',
      source: 'estimated',
      total_value: chart.total_value,
      rows: chart.rows,
    };
  } else {
    const chart = buildCostChart(
      normalizedProductRows.map((row) => ({
        key: `product-${row.item_id}`,
        label: row.name,
        detail:
          row.inventory_value != null
            ? `${row.current_stock} ${row.unit} valorizados al costo actual.`
            : 'Falta cargar costo de compra.',
        inventory_value: normalizeNumber(row.inventory_value, 0) || 0,
      })),
      'inventory_value',
      { keyPrefix: 'inventory', otherLabel: 'Otros productos' }
    );

    monthlyCostChart = {
      title: 'Distribucion del valor actual del inventario',
      message: 'Mientras no haya planes o consumos con costo, mostramos la foto valorizada del stock.',
      source: 'inventory',
      total_value: chart.total_value,
      rows: chart.rows,
    };
  }

  return {
    period: { ...period, days_elapsed: daysElapsed, days_in_month: daysInMonth },
    summary_cards: [
      {
        key: 'actual_month_feed_cost',
        label: 'Alimento mes actual',
        value: actualMonthTotal,
        value_format: 'currency',
        detail:
          actualMonthTotal > 0
            ? `Lectura real de ${period.month} desde feed_events.`
            : 'Todavia no hay consumos costeados en el mes actual.',
        tone: actualMonthTotal > 0 ? 'green' : 'blue',
        icon: 'cart',
      },
      {
        key: 'estimated_month_feed_cost',
        label: realMonthlyProjectionTotal != null ? 'Proyección del mes (real)' : 'Alimento mensual estimado',
        value: realMonthlyProjectionTotal != null ? realMonthlyProjectionTotal : estimatedMonthlyTotal,
        value_format: 'currency',
        detail: realMonthlyProjectionTotal != null
          ? `Promedio real de ${daysElapsed} días extrapolado a ${daysInMonth} días.`
          : feedPlanRowsResult.rows.length > 0
            ? 'Proyeccion desde el plan de alimentacion. Carga consumos para ver datos reales.'
            : 'Carga planes de comida para ver costos mensuales por caballo.',
        tone: realMonthlyProjectionTotal != null ? 'green' : estimatedMonthlyTotal > 0 ? 'blue' : 'orange',
        icon: 'calendar',
      },
      {
        key: 'average_monthly_per_horse',
        label: 'Promedio mensual por caballo',
        value: averageMonthlyPerHorse,
        value_format: 'currency',
        detail: horsesWithRealCost > 0
          ? `${horsesWithRealCost} caballo(s) con consumo real este mes.`
          : horsesWithEstimatedCost > 0
            ? `${horsesWithEstimatedCost} caballo(s) con costo estimado.`
            : 'Todavia no hay caballos con plan costeado.',
        tone: averageMonthlyPerHorse > 0 ? 'orange' : 'blue',
        icon: 'singleHorse',
      },
      {
        key: 'inventory_value_snapshot',
        label: 'Valor actual del inventario',
        value: inventoryValueTotal,
        value_format: 'currency',
        detail: `${productsWithCost} de ${normalizedProductRows.length} producto(s) con costo de compra cargado.`,
        tone: inventoryValueTotal > 0 ? 'blue' : 'orange',
        icon: 'stock',
      },
    ],
    coverage_rows: [
      {
        label: 'Productos con costo cargado',
        value: `${productsWithCost} / ${normalizedProductRows.length}`,
      },
      {
        label: 'Caballos con costo estimado',
        value: `${horsesWithEstimatedCost}`,
      },
      {
        label: 'Renglones del plan con precio',
        value:
          feedPlanRowsResult.rows.length > 0
            ? `${plannedRowsWithCost} / ${feedPlanRowsResult.rows.length}`
            : 'Sin plan cargado',
      },
      {
        label: 'Consumos del mes con precio',
        value:
          actualMonthRowsResult.rows.length > 0
            ? `${actualRowsWithCost} / ${actualMonthRowsResult.rows.length}`
            : 'Sin consumos del mes',
      },
      {
        label: 'Servicios aun sin monto',
        value: `${serviceGapRows.reduce((sum, row) => sum + row.count, 0)}`,
      },
    ],
    monthly_cost_chart: monthlyCostChart,
    horse_costs: {
      title: 'Costo de alimento por caballo',
      message:
        'Mes actual desde consumos reales. Diario, mensual y anual salen del plan de alimentacion cargado.',
      rows: horseCostRows,
      empty_message:
        'Todavia no hay planes de alimentacion ni consumos mensuales para calcular costo por caballo.',
    },
    product_costs: {
      title: 'Costo por producto',
      message:
        'Mostramos costo por compra, equivalente por unidad base, valor en stock, gasto real del mes y proyeccion mensual por alimento.',
      rows: normalizedProductRows,
      empty_message: 'Todavia no hay productos suficientes para construir el detalle de costos.',
    },
    service_gaps: {
      title: 'Servicios fuera del calculo monetario',
      message: serviceGapRows.length
        ? 'Estos eventos ya existen, pero aun no guardan monto. Por eso no entran en el costo final.'
        : 'En el mes actual no hay eventos de herrero, desparasitacion o salud pendientes de costear.',
      rows: serviceGapRows,
      empty_message:
        'Cuando registremos montos para herrero, desparasitacion y salud, esta seccion va a entrar directo al costo por caballo.',
    },
    totals: {
      inventory_value: inventoryValueTotal,
      estimated_daily_feed_cost: estimatedDailyTotal,
      estimated_monthly_feed_cost: estimatedMonthlyTotal,
      estimated_annual_feed_cost: estimatedAnnualTotal,
      actual_month_feed_cost: actualMonthTotal,
    },
  };
}

async function getAdminV2StockDashboard() {
  const client = await pool.connect();

  try {
    const moduleSettings = await listAdminModuleSettings();
    const enabledModules = buildAdminModuleEnabledMap(moduleSettings);
    const feedEnabled = Boolean(enabledModules.feed);

    const feedInventoryModel = feedEnabled
      ? await buildFeedInventoryModel(client)
      : {
          items: [],
          low_stock_items: [],
          categories: [],
          recent_movements: [],
          stock_events_available: false,
          recent_movement_count: 0,
          latest_movement_date: null,
          optional_columns: {},
        };
    const accountingModel = feedEnabled
      ? await buildFeedAccountingModel(client, feedInventoryModel)
      : null;

    return {
      ok: true,
      meta: {
        refreshed_at: new Date().toISOString(),
        route_key: 'admin-v2',
        actions_enabled: false,
        low_stock_threshold_default: LOW_STOCK_THRESHOLD,
        feed_module_enabled: feedEnabled,
        stock_events_available: feedInventoryModel.stock_events_available,
        optional_feed_columns: feedInventoryModel.optional_columns,
      },
      shell: {
        title: 'Farm Bot Admin Next',
        subtitle: 'Nueva arquitectura aislada del admin legacy.',
      },
      stock_dashboard: {
        title: 'Stock y Contabilidad',
        description:
          'Base nueva para inventario, movimientos y lectura financiera. Hoy conecta stock real y deja acciones separadas para la siguiente fase.',
        summary_cards: buildSummaryCards(feedInventoryModel),
        alert_banner: buildLowStockAlert(feedInventoryModel.low_stock_items),
        tabs: [
          {
            key: 'inventory',
            label: 'Inventario',
            status: 'ready',
            description: 'Conectado al inventario actual.',
          },
          {
            key: 'movements',
            label: 'Movimientos',
            status: feedInventoryModel.stock_events_available ? 'partial' : 'planned',
            description: feedInventoryModel.stock_events_available
              ? 'La estructura visual ya esta lista para conectar mas detalle.'
              : 'La estructura ya existe, falta completar historial.',
          },
          {
            key: 'accounting',
            label: 'Contabilidad',
            status: feedEnabled ? 'partial' : 'planned',
            description: feedEnabled
              ? 'Ya podes cargar compras reales; la parte de balance sigue para la siguiente fase.'
              : 'Placeholder listo para cuando exista modelo financiero.',
          },
        ],
        inventory: {
          filters: [
            { key: 'all', label: 'Todas las categorias' },
            ...feedInventoryModel.categories,
          ],
          items: feedInventoryModel.items,
          empty_message: feedEnabled
            ? 'Todavia no hay items cargados en inventario.'
            : 'El modulo de stock esta desactivado para este campo.',
        },
        movement_panel: {
          title: 'Movimientos de stock',
          status: feedInventoryModel.stock_events_available ? 'partial' : 'planned',
          message: feedInventoryModel.stock_events_available
            ? 'La lectura base existe. En la proxima fase conectamos timeline, filtros y acciones.'
            : 'Primero dejamos el contenedor y el contrato. Luego conectamos la tabla de eventos.',
          entries: feedInventoryModel.recent_movements,
          empty_message: feedInventoryModel.stock_events_available
            ? 'Todavia no hay movimientos de stock registrados.'
            : 'La tabla stock_events todavia no esta disponible para este campo.',
        },
        accounting_panel: {
          title: 'Contabilidad operativa',
          status: feedEnabled ? 'partial' : 'planned',
          message: feedEnabled
            ? 'Ya podes leer costos reales y estimados de alimento por producto y por caballo. Herrero, desparasitacion y salud quedan visibles aparte hasta sumarles monto.'
            : 'El layout ya esta preparado para ingresos, egresos y balance. Falta definir el modelo y la fuente de datos.',
          period: accountingModel?.period || null,
          summary_cards: accountingModel?.summary_cards || [],
          coverage_rows: accountingModel?.coverage_rows || [],
          monthly_cost_chart: accountingModel?.monthly_cost_chart || null,
          horse_costs: accountingModel?.horse_costs || {
            title: 'Costo de alimento por caballo',
            message: '',
            rows: [],
            empty_message:
              'Todavia no hay planes de alimentacion ni consumos mensuales para calcular costo por caballo.',
          },
          product_costs: accountingModel?.product_costs || {
            title: 'Costo por producto',
            message: '',
            rows: [],
            empty_message: 'Todavia no hay productos suficientes para construir el detalle de costos.',
          },
          service_gaps: accountingModel?.service_gaps || {
            title: 'Servicios fuera del calculo monetario',
            message: '',
            rows: [],
            empty_message:
              'Cuando registremos montos para herrero, desparasitacion y salud, esta seccion va a entrar directo al costo por caballo.',
          },
        },
      },
    };
  } finally {
    client.release();
  }
}

module.exports = {
  getAdminV2StockDashboard,
};
