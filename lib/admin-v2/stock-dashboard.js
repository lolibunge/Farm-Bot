const { pool } = require('../db');
const { listAdminModuleSettings, buildAdminModuleEnabledMap } = require('../admin-modules');
const { getMonthDateRange, todayYearMonth } = require('../feed-plans');
const { getGeneralExpensesSummary } = require('../general-expenses');

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

async function buildFeedInventoryModel(client) {
  if (!(await hasTable(client, 'feed_items'))) {
    return {
      items: [],
      low_stock_items: [],
      categories: [],
      recent_movements: [],
      stock_events_available: false,
      recent_movement_count: 0,
      latest_movement_date: null,
      optional_columns: {},
    };
  }

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

function computeInventoryValueTotal(feedInventoryModel) {
  return (feedInventoryModel.items || []).reduce((total, item) => {
    const baseUnitCost = normalizeNumber(item.base_unit_cost);
    const currentStock = normalizeNumber(item.current_stock, 0) || 0;
    if (baseUnitCost == null) {
      return total;
    }
    return total + toCurrencyNumber(baseUnitCost * currentStock);
  }, 0);
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
    const inventoryValueTotal = computeInventoryValueTotal(feedInventoryModel);
    const generalExpenses = await getGeneralExpensesSummary();

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
            label: 'Gastos generales',
            status: 'ready',
            description: 'Gastos del campo no atribuibles a un caballo o propietario puntual.',
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
          title: 'Gastos generales del campo',
          status: 'ready',
          message:
            'La contabilidad por caballo y por propietario ahora vive en el modulo Propietarios. Ac\u00e1 quedan solo los gastos generales del campo (no atribuibles a un caballo puntual) y el valor del inventario.',
          summary_cards: [
            {
              key: 'general_expenses_month',
              label: `Gastos generales ${generalExpenses.period.label}`,
              value: generalExpenses.total_month,
              value_format: 'currency',
              detail: generalExpenses.month_entries.length
                ? `${generalExpenses.month_entries.length} gasto(s) cargado(s) este mes.${generalExpenses.total_month_usd > 0 ? ` + US\$${generalExpenses.total_month_usd.toLocaleString('es-UY')} en dolares.` : ''}`
                : 'Todavia no hay gastos generales cargados este mes.',
              tone: generalExpenses.total_month > 0 ? 'orange' : 'blue',
              icon: 'cart',
            },
            {
              key: 'inventory_value_snapshot',
              label: 'Valor actual del inventario',
              value: inventoryValueTotal,
              value_format: 'currency',
              detail: 'Stock valorizado al ultimo costo de compra cargado.',
              tone: inventoryValueTotal > 0 ? 'blue' : 'orange',
              icon: 'stock',
            },
          ],
          general_expenses: generalExpenses,
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
