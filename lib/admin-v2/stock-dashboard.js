const { pool } = require('../db');
const { listAdminModuleSettings, buildAdminModuleEnabledMap } = require('../admin-modules');

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
    normalizedName.includes('avena') ||
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
  const columns = await listTableColumns(client, 'feed_items');
  const optionalColumns = {
    category: pickExistingColumn(columns, ['category', 'item_category']),
    supplier: pickExistingColumn(columns, ['supplier_name', 'supplier', 'provider_name', 'provider']),
    unit_cost: pickExistingColumn(columns, ['unit_cost', 'cost_per_unit', 'unit_price', 'purchase_price']),
    minimum_stock: pickExistingColumn(columns, ['minimum_stock', 'min_stock', 'stock_minimum']),
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

  const latestMovementMap = new Map(
    latestMovementByItemResult.rows.map((row) => [Number(row.feed_item_id), toIsoDateString(row.latest_event_date)])
  );

  const items = inventoryResult.rows.map((row) => {
    const minimumStock = normalizeNumber(row.minimum_stock_value, LOW_STOCK_THRESHOLD) || LOW_STOCK_THRESHOLD;
    const currentStock = normalizeNumber(row.current_stock, 0) || 0;
    const category = classifyCategory(row.name, row.category_value);
    const health = buildStockHealth(currentStock, minimumStock);

    return {
      id: Number(row.id),
      name: String(row.name || '').trim(),
      unit: String(row.unit || '').trim(),
      current_stock: currentStock,
      minimum_stock: minimumStock,
      category,
      supplier: normalizeText(row.supplier_value),
      unit_cost: normalizeNumber(row.unit_cost_value),
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
          stock_events_available: false,
          recent_movement_count: 0,
          latest_movement_date: null,
          optional_columns: {},
        };

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
            status: 'planned',
            description: 'Placeholder listo para cuando exista modelo financiero.',
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
        },
        accounting_panel: {
          title: 'Contabilidad operativa',
          status: 'planned',
          message:
            'El layout ya esta preparado para ingresos, egresos y balance. Falta definir el modelo y la fuente de datos.',
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
