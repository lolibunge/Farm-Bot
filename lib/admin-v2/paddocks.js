const {
  ensurePaddockTables,
  listPaddockStatus,
  listPaddockWorkHistory,
  listGrazingHistory,
  savePaddock,
} = require('../paddocks');
const {
  listAdminModuleSettings,
  buildAdminModuleEnabledMap,
  isAdminModuleEnabled,
} = require('../admin-modules');

function parsePositiveInt(value, fallbackValue = null) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }
  return parsed;
}

function parseNullableNumber(value) {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseNullableInteger(value) {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function parseBooleanValue(value, fallbackValue = true) {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value == null ? '' : value)
    .trim()
    .toLowerCase();

  if (!normalized) {
    return fallbackValue;
  }

  if (['1', 'true', 'yes', 'si', 'sí', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallbackValue;
}

function buildServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function buildPaddockSummaryCards(paddocks) {
  const totalCount = paddocks.length;
  const occupiedCount = paddocks.filter((paddock) => paddock.occupancy_state === 'occupied').length;
  const restingCount = paddocks.filter((paddock) => paddock.occupancy_state === 'resting').length;
  const waitingCount = paddocks.filter((paddock) => paddock.occupancy_state === 'growing').length;

  return [
    {
      label: 'Total Potreros',
      value: String(totalCount),
      detail: 'Conectados al padrón real.',
      tone: 'blue',
      icon: 'paddocks',
    },
    {
      label: 'Ocupados',
      value: String(occupiedCount),
      detail: `${Math.max(0, totalCount - occupiedCount)} sin ocupación activa.`,
      tone: occupiedCount > 0 ? 'green' : 'gray',
      icon: 'horses',
    },
    {
      label: 'En Descanso',
      value: String(restingCount),
      detail: `${waitingCount} con espera de trabajo/pastoreo.`,
      tone: restingCount > 0 ? 'teal' : 'gray',
      icon: 'clock',
    },
    {
      label: 'No Listos',
      value: String(waitingCount),
      detail:
        waitingCount > 0
          ? 'Todavía con espera activa antes de pastorear.'
          : 'Sin bloqueos activos de trabajo.',
      tone: waitingCount > 0 ? 'orange' : 'green',
      icon: 'circleAlert',
    },
  ];
}

function buildPaddockNotice(paddocks) {
  if (!paddocks.length) {
    return {
      tone: 'warning',
      title: 'Todavía no hay potreros cargados.',
      description: 'Podés empezar a usar esta vista creando el primer potrero desde el rediseño nuevo.',
      rows: [
        'La creación y edición ya quedan conectadas al backend real.',
        'Después seguimos con trabajos de campo y movimientos más finos.',
      ],
      focus: 'Siguiente paso',
      focusDetail: 'Crear el primer potrero desde el botón superior.',
      tag: 'Neon',
    };
  }

  const waitingRows = paddocks.filter((paddock) => paddock.occupancy_state === 'growing');
  if (waitingRows.length > 0) {
    const referencePaddock = waitingRows[0];
    return {
      tone: 'warning',
      title: `Potreros con espera activa - ${waitingRows.length}`,
      description:
        'La vista nueva ya refleja descansos y bloqueos por trabajos usando el historial real.',
      rows: [
        'Los potreros con fecha futura de ingreso aparecen marcados desde esta pantalla.',
        'La edición del potrero ya queda operativa desde el rediseño nuevo.',
      ],
      focus: referencePaddock.name,
      focusDetail: referencePaddock.ready_to_graze_on
        ? `Listo para pastoreo desde ${referencePaddock.ready_to_graze_on}.`
        : 'Revisá el último trabajo registrado en este bloque.',
      tag: 'Pastoreo',
    };
  }

  return {
    tone: 'green',
    title: 'Módulo de potreros conectado al diseño nuevo.',
    description:
      'La vista nueva ya lee el estado real de ocupación, descanso y espera de cada potrero.',
    rows: [
      'El alta y la edición del potrero se guardan sobre el backend existente.',
      'Seguimos dejando trabajos de campo y correcciones históricas para el siguiente tramo.',
    ],
    focus: `${paddocks.length} potrero(s) sincronizado(s)`,
    focusDetail: 'La vista se refresca desde la API nueva de admin-v2.',
    tag: 'Fase 1',
  };
}

async function getPaddockModuleConfig() {
  await ensurePaddockTables();

  const moduleSettings = await listAdminModuleSettings();
  const enabledModules = buildAdminModuleEnabledMap(moduleSettings);

  return {
    enabledModules,
    paddocksModuleEnabled: isAdminModuleEnabled('paddocks', enabledModules),
  };
}

async function getAdminV2PaddocksDashboard() {
  const { enabledModules, paddocksModuleEnabled } = await getPaddockModuleConfig();
  const paddocks = await listPaddockStatus();
  const occupiedCount = paddocks.filter((paddock) => paddock.occupancy_state === 'occupied').length;

  return {
    ok: true,
    meta: {
      refreshed_at: new Date().toISOString(),
      route_key: 'admin-v2-paddocks',
      actions_enabled: true,
      paddocks_module_enabled: paddocksModuleEnabled,
      groups_module_enabled: isAdminModuleEnabled('groups', enabledModules),
    },
    paddocks_dashboard: {
      title: 'Potreros',
      description:
        'Conexión real del rediseño nuevo para revisar ocupación, descanso y configuración de potreros.',
      header_subtitle: `${paddocks.length} potrero(s) · ${occupiedCount} ocupado(s)`,
      summary_cards: buildPaddockSummaryCards(paddocks),
      notice: buildPaddockNotice(paddocks),
      tabs: [
        {
          key: 'cards',
          label: 'Vista Tarjetas',
          status: 'ready',
        },
        {
          key: 'list',
          label: 'Vista Lista',
          status: 'ready',
        },
      ],
      paddocks,
    },
  };
}

async function getAdminV2PaddockDetail(paddockId) {
  const normalizedPaddockId = parsePositiveInt(paddockId);
  if (!normalizedPaddockId) {
    throw buildServiceError('paddockId is required', 400);
  }

  await getPaddockModuleConfig();

  const paddocks = await listPaddockStatus();
  const paddock = paddocks.find((candidate) => Number(candidate.id) === normalizedPaddockId) || null;

  if (!paddock) {
    throw buildServiceError('Paddock not found', 404);
  }

  const [workHistory, grazingHistory] = await Promise.all([
    listPaddockWorkHistory({ paddockId: normalizedPaddockId, limit: 16 }),
    listGrazingHistory({ paddockId: normalizedPaddockId, limit: 120 }),
  ]);

  return {
    ok: true,
    paddock_detail: {
      paddock,
      work_history: workHistory,
      grazing_history: grazingHistory,
    },
  };
}

function validatePaddockInput(input, { requirePaddockName = true } = {}) {
  const paddockName = String(input.paddockName || '').trim();
  const zone = String(input.zone || '').trim();
  const notes = String(input.notes || '').trim();
  const sizeHaValue = input.sizeHa == null ? '' : String(input.sizeHa).trim();
  const restDaysEstimateValue =
    input.restDaysEstimate == null ? '' : String(input.restDaysEstimate).trim();
  const sizeHa = parseNullableNumber(sizeHaValue);
  const restDaysEstimate = parseNullableInteger(restDaysEstimateValue);
  const rawParentPaddockId =
    input.parentPaddockId == null ? '' : String(input.parentPaddockId).trim();
  const parentPaddockId = rawParentPaddockId ? parsePositiveInt(rawParentPaddockId) : null;
  const active = parseBooleanValue(input.active, true);
  const restApplyScope =
    String(input.restApplyScope || '')
      .trim()
      .toLowerCase() || 'single';

  if (requirePaddockName && !paddockName) {
    throw buildServiceError('paddockName is required', 400);
  }

  if (sizeHaValue && sizeHa == null) {
    throw buildServiceError('sizeHa must be a number >= 0', 400);
  }

  if (restDaysEstimateValue && restDaysEstimate == null) {
    throw buildServiceError('restDaysEstimate must be a whole number >= 0', 400);
  }

  if (rawParentPaddockId && !parentPaddockId) {
    throw buildServiceError('parentPaddockId is invalid', 400);
  }

  if (!['single', 'whole_block'].includes(restApplyScope)) {
    throw buildServiceError('restApplyScope is invalid', 400);
  }

  return {
    paddockName,
    zone: zone || null,
    notes: notes || null,
    sizeHa,
    restDaysEstimate,
    parentPaddockId,
    active,
    restApplyScope,
  };
}

async function createAdminV2Paddock(input) {
  const payload = validatePaddockInput(input, { requirePaddockName: true });

  const data = await savePaddock({
    name: payload.paddockName,
    zone: payload.zone,
    sizeHa: payload.sizeHa,
    notes: payload.notes,
    active: payload.active,
    parentPaddockId: payload.parentPaddockId,
    manualRestDays: payload.restDaysEstimate,
    manualRestAppliesToDescendants: payload.restApplyScope === 'whole_block',
  });

  return {
    ok: true,
    mode: data.mode,
    paddock: data.paddock,
  };
}

async function updateAdminV2Paddock(paddockId, input) {
  const normalizedPaddockId = parsePositiveInt(paddockId);
  if (!normalizedPaddockId) {
    throw buildServiceError('paddockId is required', 400);
  }

  const payload = validatePaddockInput(input, { requirePaddockName: true });

  const data = await savePaddock({
    paddockId: normalizedPaddockId,
    name: payload.paddockName,
    zone: payload.zone,
    sizeHa: payload.sizeHa,
    notes: payload.notes,
    active: payload.active,
    parentPaddockId: payload.parentPaddockId,
    manualRestDays: payload.restDaysEstimate,
    manualRestAppliesToDescendants: payload.restApplyScope === 'whole_block',
  });

  return {
    ok: true,
    mode: data.mode,
    paddock: data.paddock,
  };
}

module.exports = {
  getAdminV2PaddocksDashboard,
  getAdminV2PaddockDetail,
  createAdminV2Paddock,
  updateAdminV2Paddock,
};
