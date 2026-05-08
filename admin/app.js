const API_URL = '/api/admin/overview';
const HORSE_HISTORY_API_URL = '/api/admin/horse-history';
const STOCK_MUTATE_API_URL = '/api/admin/mutate-stock';
const DATA_MUTATE_API_URL = '/api/admin/mutate-data';
const LOGIN_API_URL = '/api/admin/login';
const LOGOUT_API_URL = '/api/admin/logout';
const SESSION_API_URL = '/api/admin/session';
const PANEL_STATE_STORAGE_KEY = 'farm_bot_admin_panel_state';
const ACTION_CARD_STATE_STORAGE_KEY = 'farm_bot_admin_action_card_state';
const SUMMARY_PREFS_STORAGE_KEY = 'farm_bot_admin_summary_prefs';
const RAIN_REGISTRY_COLLAPSED_STORAGE_KEY = 'farm_bot_admin_rain_registry_collapsed';
const HORSE_FEED_HISTORY_COLLAPSED_STORAGE_KEY = 'farm_bot_horse_feed_history_collapsed';

const SUMMARY_METRICS = [
  { key: 'horses_count', defaultLabel: 'Horses' },
  { key: 'horse_groups_count', defaultLabel: 'Horse Groups' },
  { key: 'paddocks_count', defaultLabel: 'Paddocks' },
  { key: 'paddocks_occupied_count', defaultLabel: 'Paddocks Occupied' },
  { key: 'paddocks_resting_count', defaultLabel: 'Paddocks Resting' },
  { key: 'feed_items_count', defaultLabel: 'Feed Items' },
  { key: 'low_stock_count', defaultLabel: 'Low Stock' },
  { key: 'deworm_overdue_count', defaultLabel: 'Deworm Overdue' },
  { key: 'deworm_due_soon_count', defaultLabel: 'Deworm Soon' },
  { key: 'farrier_overdue_count', defaultLabel: 'Farrier Overdue' },
  { key: 'farrier_due_soon_count', defaultLabel: 'Farrier Soon' },
  { key: 'in_training_count', defaultLabel: 'In Training' },
  { key: 'breaking_in_count', defaultLabel: 'Breaking In' },
  { key: 'rain_today_mm', defaultLabel: 'Rain Today (mm)' },
  { key: 'rain_7d_mm', defaultLabel: 'Rain 7d (mm)' },
  { key: 'rain_days_7', defaultLabel: 'Rainy Days (7d)' },
];

const SUMMARY_CARD_TARGETS = {
  horses_count: 'panel-horse-history',
  horse_groups_count: 'panel-horse-groups-status',
  paddocks_count: 'panel-paddock-status',
  paddocks_occupied_count: 'panel-paddock-status',
  paddocks_resting_count: 'panel-paddock-status',
  feed_items_count: 'panel-current-inventory',
  low_stock_count: 'panel-low-stock',
  deworm_overdue_count: 'panel-deworming-alerts',
  deworm_due_soon_count: 'panel-deworming-alerts',
  farrier_overdue_count: 'panel-farrier-alerts',
  farrier_due_soon_count: 'panel-farrier-alerts',
  in_training_count: 'panel-in-training',
  breaking_in_count: 'panel-breaking-in',
  rain_today_mm: 'panel-rain-registry',
  rain_7d_mm: 'panel-rain-registry',
  rain_days_7: 'panel-rain-registry',
};

const RAIN_WINDOW_CONFIG = {
  '1d': { days: 1, label: 'Today' },
  '7d': { days: 7, label: 'Last 7 days' },
  '4w': { days: 28, label: 'Last 4 weeks' },
  '1y': { days: 365, label: 'Year to date' },
};
const RAIN_TARGET_MET_MM = 20;

const authForm = document.getElementById('auth-form');
const loginUsernameLabel = document.getElementById('login-username-label');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordLabel = document.getElementById('login-password-label');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-btn');
const logoutButton = document.getElementById('logout-btn');
const refreshButton = document.getElementById('refresh-btn');
const statusMessage = document.getElementById('status-message');
const lastUpdated = document.getElementById('last-updated');
const backToTopButton = document.getElementById('back-to-top-btn');
const actionHubPanel = document.querySelector('.action-hub-panel');

const summaryCards = document.getElementById('summary-cards');
const summaryEditToggleButton = document.getElementById('summary-edit-toggle-btn');
const summaryResetButton = document.getElementById('summary-reset-btn');
const summaryEditor = document.getElementById('summary-editor');
const summaryEditorList = document.getElementById('summary-editor-list');
const farmSettingsForm = document.getElementById('farm-settings-form');
const farmNameInput = document.getElementById('farm-name-input');
const farmWeatherLatitudeInput = document.getElementById('farm-weather-latitude-input');
const farmWeatherLongitudeInput = document.getElementById('farm-weather-longitude-input');
const farmWeatherTimezoneInput = document.getElementById('farm-weather-timezone-input');
const farmWeatherSyncDaysInput = document.getElementById('farm-weather-sync-days-input');
const farmTelegramAlertChatIdInput = document.getElementById('farm-telegram-alert-chat-id-input');
const farmSetupChecklist = document.getElementById('farm-setup-checklist');
const farmSettingsMessage = document.getElementById('farm-settings-message');
const adminModulesForm = document.getElementById('admin-modules-form');
const adminModulesList = document.getElementById('admin-modules-list');
const adminModulesMessage = document.getElementById('admin-modules-message');
const dewormingBody = document.getElementById('deworming-body');
const dewormHistoryRegistryBody = document.getElementById('deworm-history-registry-body');
const dewormHistoryHorseFilter = document.getElementById('deworm-history-horse-filter');
const dewormHistoryResetButton = document.getElementById('deworm-history-reset-btn');
const farrierBody = document.getElementById('farrier-body');
const farrierHistoryRegistryBody = document.getElementById('farrier-history-registry-body');
const farrierHistoryHorseFilter = document.getElementById('farrier-history-horse-filter');
const farrierHistoryResetButton = document.getElementById('farrier-history-reset-btn');
const lowStockBody = document.getElementById('low-stock-body');
const allStockBody = document.getElementById('all-stock-body');
const rainBody = document.getElementById('rain-body');
const rainYearlyBody = document.getElementById('rain-yearly-body');
const rainChart = document.getElementById('rain-chart');
const rainChartWrap = document.getElementById('rain-chart-wrap');
const rainWindowControls = document.getElementById('rain-window-controls');
const rainRangeLabel = document.getElementById('rain-range-label');
const rainChartLegend = document.getElementById('rain-chart-legend');
const rainChartLabel = document.getElementById('rain-chart-label');
const rainChartTotal = document.getElementById('rain-chart-total');
const rainRegistryAccordion = document.getElementById('rain-registry-accordion');
const rainRegistryToggle = document.getElementById('rain-registry-toggle');
const activityBody = document.getElementById('activity-body');
const horseSelect = document.getElementById('horse-select');
const horseProfileSelect = document.getElementById('horse-profile-select');
const horseHistorySelectedName = document.getElementById('horse-history-selected-name');
const horseHistoryBody = document.getElementById('horse-history-body');
const horseFeedHistoryBody = document.getElementById('horse-feed-history-body');
const horseFeedHistoryCard = document.getElementById('horse-history-feed-card');
const horseFeedHistoryToggle = document.getElementById('horse-feed-history-toggle');
const horseDewormingHistoryBody = document.getElementById('horse-deworming-history-body');
const horseFarrierHistoryBody = document.getElementById('horse-farrier-history-body');
const horseHealthHistoryBody = document.getElementById('horse-health-history-body');
const horseGrazingHistoryBody = document.getElementById('horse-grazing-history-body');
const horseGroupHistoryBody = document.getElementById('horse-group-history-body');
const horseFeedPlanForm = document.getElementById('horse-feed-plan-form');
const horseFeedPlanBody = document.getElementById('horse-feed-plan-body');
const horseFeedPlanAddRowButton = document.getElementById('horse-feed-plan-add-row-btn');
const horseFeedPlanMessage = document.getElementById('horse-feed-plan-message');
const horseFeedCalendarMonthInput = document.getElementById('horse-feed-calendar-month');
const horseFeedCalendarTodayButton = document.getElementById('horse-feed-calendar-today-btn');
const horseFeedCalendarGrid = document.getElementById('horse-feed-calendar-grid');
const horseHistoryCurrentGrazing = document.getElementById('horse-history-current-grazing');
const horseHistoryCurrentGroup = document.getElementById('horse-history-current-group');
const horseProfileForm = document.getElementById('horse-profile-form');
const horseProfileIdInput = document.getElementById('horse-profile-id');
const horseProfileNameInput = document.getElementById('horse-profile-name');
const horseProfileDobInput = document.getElementById('horse-profile-dob');
const horseProfileAgeInput = document.getElementById('horse-profile-age');
const horseProfileColorInput = document.getElementById('horse-profile-color');
const horseProfileActivityInput = document.getElementById('horse-profile-activity');
const horseProfileSexInput = document.getElementById('horse-profile-sex');
const horseProfileTrainingStatusInput = document.getElementById('horse-profile-training-status');
const horseProfileMessage = document.getElementById('horse-profile-message');
const horseGroupStatusBody = document.getElementById('horse-group-status-body');
const horseGroupHistoryRegistryBody = document.getElementById('horse-group-history-registry-body');
const paddockStatusBody = document.getElementById('paddock-status-body');
const paddockWorkHistoryBody = document.getElementById('paddock-work-history-body');
const grazingHistoryBody = document.getElementById('grazing-history-body');
const paddockSaveForm = document.getElementById('paddock-save-form');
const paddockNameInput = document.getElementById('paddock-name-input');
const paddockZoneInput = document.getElementById('paddock-zone-input');
const paddockSizeInput = document.getElementById('paddock-size-input');
const paddockActiveSelect = document.getElementById('paddock-active-select');
const paddockParentSelect = document.getElementById('paddock-parent-select');
const paddockNotesInput = document.getElementById('paddock-notes-input');
const paddockEditStatus = document.getElementById('paddock-edit-status');
const paddockSaveButton = document.getElementById('paddock-save-btn');
const paddockCancelEditButton = document.getElementById('paddock-cancel-edit-btn');
const paddockWorkForm = document.getElementById('paddock-work-form');
const paddockWorkEventIdInput = document.getElementById('paddock-work-event-id-input');
const paddockWorkEditStatus = document.getElementById('paddock-work-edit-status');
const paddockWorkPaddockSelect = document.getElementById('paddock-work-paddock-select');
const paddockWorkScopeSelect = document.getElementById('paddock-work-scope-select');
const paddockWorkTypeSelect = document.getElementById('paddock-work-type-select');
const paddockWorkDateInput = document.getElementById('paddock-work-date-input');
const paddockWorkReadyDaysInput = document.getElementById('paddock-work-ready-days-input');
const paddockWorkNotesInput = document.getElementById('paddock-work-notes-input');
const paddockWorkSaveButton = document.getElementById('paddock-work-save-btn');
const paddockWorkCancelEditButton = document.getElementById('paddock-work-cancel-edit-btn');
const grazingMoveInForm = document.getElementById('grazing-move-in-form');
const grazingMoveInHorseSelect = document.getElementById('grazing-move-in-horse-select');
const grazingMoveInPaddockSelect = document.getElementById('grazing-move-in-paddock-select');
const grazingMoveInDateInput = document.getElementById('grazing-move-in-date-input');
const grazingMoveInNotesInput = document.getElementById('grazing-move-in-notes-input');
const grazingMoveOutForm = document.getElementById('grazing-move-out-form');
const grazingMoveOutHorseSelect = document.getElementById('grazing-move-out-horse-select');
const grazingMoveOutDateInput = document.getElementById('grazing-move-out-date-input');
const grazingMoveOutNotesInput = document.getElementById('grazing-move-out-notes-input');
const horseGroupSaveForm = document.getElementById('horse-group-save-form');
const horseGroupIdInput = document.getElementById('horse-group-id-input');
const horseGroupNameInput = document.getElementById('horse-group-name-input');
const horseGroupActiveSelect = document.getElementById('horse-group-active-select');
const horseGroupNotesInput = document.getElementById('horse-group-notes-input');
const horseGroupEditStatus = document.getElementById('horse-group-edit-status');
const horseGroupSaveButton = document.getElementById('horse-group-save-btn');
const horseGroupCancelEditButton = document.getElementById('horse-group-cancel-edit-btn');
const horseGroupMembersForm = document.getElementById('horse-group-members-form');
const horseGroupMembersSelect = document.getElementById('horse-group-members-select');
const horseGroupMembersSearchInput = document.getElementById('horse-group-members-search-input');
const horseGroupMembersSummary = document.getElementById('horse-group-members-summary');
const horseGroupMembersHorsesList = document.getElementById('horse-group-members-horses-list');
const horseGroupMoveInSection = document.getElementById('horse-group-move-in-section');
const horseGroupMoveContext = document.getElementById('horse-group-move-context');
const grazingGroupMoveInForm = document.getElementById('grazing-group-move-in-form');
const grazingGroupMoveInGroupSelect = document.getElementById('grazing-group-move-in-group-select');
const grazingGroupMoveInPaddockSelect = document.getElementById('grazing-group-move-in-paddock-select');
const grazingGroupMoveInDateInput = document.getElementById('grazing-group-move-in-date-input');
const grazingGroupMoveInNotesInput = document.getElementById('grazing-group-move-in-notes-input');
const grazingGroupMoveOutForm = document.getElementById('grazing-group-move-out-form');
const grazingGroupMoveOutGroupSelect = document.getElementById('grazing-group-move-out-group-select');
const grazingGroupMoveOutPaddockSelect = document.getElementById('grazing-group-move-out-paddock-select');
const grazingGroupMoveOutDateInput = document.getElementById('grazing-group-move-out-date-input');
const grazingGroupMoveOutNotesInput = document.getElementById('grazing-group-move-out-notes-input');
const horsesInTrainingBody = document.getElementById('horses-in-training-body');
const horsesBreakingInBody = document.getElementById('horses-breaking-in-body');
const stockActionForm = document.getElementById('stock-action-form');
const stockActionType = document.getElementById('stock-action-type');
const stockItemInput = document.getElementById('stock-item-input');
const stockQuantityInput = document.getElementById('stock-quantity-input');
const stockUnitInput = document.getElementById('stock-unit-input');
const stockDateInput = document.getElementById('stock-date-input');
const stockNotesInput = document.getElementById('stock-notes-input');
const horseAddForm = document.getElementById('horse-add-form');
const horseAddInput = document.getElementById('horse-add-input');
const horseRenameForm = document.getElementById('horse-rename-form');
const horseRenameSelect = document.getElementById('horse-rename-select');
const horseRenameInput = document.getElementById('horse-rename-input');
const feedItemSaveForm = document.getElementById('feed-item-save-form');
const feedItemNameInput = document.getElementById('feed-item-name-input');
const feedItemStockInput = document.getElementById('feed-item-stock-input');
const feedItemUnitInput = document.getElementById('feed-item-unit-input');
const feedEntryAddForm = document.getElementById('feed-entry-add-form');
const feedEntryHorseSelect = document.getElementById('feed-entry-horse-select');
const feedEntryItemInput = document.getElementById('feed-entry-item-input');
const feedEntryQuantityInput = document.getElementById('feed-entry-quantity-input');
const feedEntryUnitInput = document.getElementById('feed-entry-unit-input');
const feedEntryDateInput = document.getElementById('feed-entry-date-input');
const dewormEventAddForm = document.getElementById('deworm-event-add-form');
const dewormHorseSelect = document.getElementById('deworm-horse-select');
const dewormProductInput = document.getElementById('deworm-product-input');
const dewormDateInput = document.getElementById('deworm-date-input');
const dewormSecondDoseInput = document.getElementById('deworm-second-dose-input');
const dewormNextDueInput = document.getElementById('deworm-next-due-input');
const farrierEventAddForm = document.getElementById('farrier-event-add-form');
const farrierHorseSelect = document.getElementById('farrier-horse-select');
const farrierServiceInput = document.getElementById('farrier-service-input');
const farrierDateInput = document.getElementById('farrier-date-input');
const farrierNextDueInput = document.getElementById('farrier-next-due-input');
const healthEventAddForm = document.getElementById('health-event-add-form');
const healthHorseSelect = document.getElementById('health-horse-select');
const healthTypeInput = document.getElementById('health-type-input');
const healthDescriptionInput = document.getElementById('health-description-input');
const healthDateInput = document.getElementById('health-date-input');
const healthNotesInput = document.getElementById('health-notes-input');
const trainingStatusForm = document.getElementById('training-status-form');
const trainingHorseSelect = document.getElementById('training-horse-select');
const trainingStatusSelect = document.getElementById('training-status-select');
const rainSaveForm = document.getElementById('rain-save-form');
const rainDateInput = document.getElementById('rain-date-input');
const rainMmInput = document.getElementById('rain-mm-input');
const rainNotesInput = document.getElementById('rain-notes-input');
const rainSyncWeatherButton = document.getElementById('rain-sync-weather-btn');
const actionMessage = document.getElementById('action-message');
const feedItemOptions = document.getElementById('feed-item-options');

let currentHorseRows = [];
let currentHorseGroupRows = [];
let currentPaddockRows = [];
let currentPaddockWorkRows = [];
let currentFeedHistoryRows = [];
let currentHorseFeedPlanRows = [];
let currentHorseFeedPlanDraftRows = [];
let currentHorseFeedCalendar = null;
let currentGrazingHistoryRows = [];
let currentDewormingHistoryRows = [];
let currentFarrierHistoryRows = [];
let currentHorseGroupMemberSelection = new Set();
let summaryCardConfig = [];
let currentFarmSettings = null;
let currentAdminModuleSettings = [];
let latestDashboardPayload = null;
let sessionAuthenticated = false;
let selectedRainWindow = '7d';
let selectedHorseFeedCalendarMonth = new Date().toISOString().slice(0, 7);
let nextHorseFeedPlanDraftRowKey = 1;
let dashboardAutoRefreshPauseUntil = 0;
let lastActionCardId = null;

const RAIN_RING_VIEWBOX_SIZE = 360;
const RAIN_BARS_VIEWBOX_WIDTH = 960;
const RAIN_BARS_VIEWBOX_HEIGHT = 250;
const FEED_SLOT_META = [
  { key: 'morning', label: 'M', title: 'Morning' },
  { key: 'afternoon', label: 'A', title: 'Afternoon' },
  { key: 'night', label: 'N', title: 'Night' },
];
const ADMIN_MODULES = [
  {
    key: 'groups',
    label: 'Horse Groups',
    description: 'Group setup, assignments, and group history.',
  },
  {
    key: 'paddocks',
    label: 'Paddocks',
    description: 'Paddock setup, grazing moves, field work, and grazing history.',
  },
  {
    key: 'feed',
    label: 'Feed',
    description: 'Inventory, feed history, and feed plans.',
  },
  {
    key: 'deworm',
    label: 'Deworming',
    description: 'Deworm reminders and deworm history.',
  },
  {
    key: 'farrier',
    label: 'Farrier',
    description: 'Farrier reminders and farrier history.',
  },
  {
    key: 'health',
    label: 'Health',
    description: 'Horse health events and health history.',
  },
  {
    key: 'training',
    label: 'Training',
    description: 'Training status and training summary panels.',
  },
  {
    key: 'rain',
    label: 'Rain',
    description: 'Rain registry and rain dashboards.',
  },
];

const SUMMARY_METRIC_MODULE_KEYS = {
  horse_groups_count: 'groups',
  paddocks_count: 'paddocks',
  paddocks_occupied_count: 'paddocks',
  paddocks_resting_count: 'paddocks',
  feed_items_count: 'feed',
  low_stock_count: 'feed',
  deworm_overdue_count: 'deworm',
  deworm_due_soon_count: 'deworm',
  farrier_overdue_count: 'farrier',
  farrier_due_soon_count: 'farrier',
  in_training_count: 'training',
  breaking_in_count: 'training',
  rain_today_mm: 'rain',
  rain_7d_mm: 'rain',
  rain_days_7: 'rain',
};

const MODULE_BOUND_SELECTORS = {
  groups: [
    '#action-card-horse-groups',
    '#panel-horse-groups-status',
    '#panel-horse-group-history',
    '#horse-history-current-group',
    '#horse-history-group-card',
  ],
  paddocks: [
    '#action-card-paddocks',
    '#horse-group-move-in-section',
    '#horse-group-move-out-section',
    '#panel-paddock-status',
    '#panel-paddock-work-history',
    '#panel-grazing-history',
    '#horse-history-current-grazing',
    '#horse-history-grazing-card',
  ],
  feed: [
    '#action-card-feed',
    '#panel-low-stock',
    '#panel-current-inventory',
    '#horse-history-feed-plan-card',
    '#horse-history-feed-card',
  ],
  deworm: [
    '#action-section-deworm',
    '#panel-deworming-alerts',
    '#panel-deworm-history-registry',
    '#horse-history-deworm-card',
  ],
  farrier: [
    '#action-section-farrier',
    '#panel-farrier-alerts',
    '#panel-farrier-history-registry',
    '#horse-history-farrier-card',
  ],
  health: ['#action-card-health', '#horse-history-health-card'],
  training: [
    '#training-status-form',
    '#panel-in-training',
    '#panel-breaking-in',
    '#horse-profile-training-label',
    '#horse-profile-training-status',
  ],
  rain: ['#action-card-rain', '#panel-rain-registry'],
};

const PADDOCK_WORK_TYPE_LABELS = {
  soil_prep: 'Soil Prep',
  seeding: 'Seeding',
  fertilizer: 'Fertilizer',
  spraying: 'Spraying',
  ready_check: 'Ready Check',
  other: 'Other',
};

function formatPaddockWorkTypeLabel(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return PADDOCK_WORK_TYPE_LABELS[normalized] || 'Other';
}

function getDefaultAdminModuleSettings() {
  return ADMIN_MODULES.map((module) => ({
    key: module.key,
    label: module.label,
    description: module.description,
    enabled: true,
    editable: true,
  }));
}

function normalizeAdminModuleSettings(rawSettings) {
  const byKey = new Map();

  for (const item of Array.isArray(rawSettings) ? rawSettings : []) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const definition = ADMIN_MODULES.find((module) => module.key === item.key);
    if (!definition) {
      continue;
    }

    byKey.set(definition.key, {
      key: definition.key,
      label: String(item.label || definition.label).trim() || definition.label,
      description: String(item.description || definition.description).trim() || definition.description,
      enabled: Boolean(item.enabled),
      editable: item.editable !== false,
    });
  }

  return ADMIN_MODULES.map((definition) => {
    const existing = byKey.get(definition.key);
    if (!existing) {
      return {
        key: definition.key,
        label: definition.label,
        description: definition.description,
        enabled: true,
        editable: true,
      };
    }

    return existing;
  });
}

function getAdminModuleEnabledMap() {
  const enabledMap = {};

  for (const module of normalizeAdminModuleSettings(currentAdminModuleSettings)) {
    enabledMap[module.key] = Boolean(module.enabled);
  }

  return enabledMap;
}

function isAdminModuleEnabled(moduleKey) {
  if (!moduleKey) {
    return true;
  }

  return getAdminModuleEnabledMap()[moduleKey] !== false;
}

function isSummaryMetricAvailable(metricKey) {
  return isAdminModuleEnabled(SUMMARY_METRIC_MODULE_KEYS[metricKey]);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const stringValue = String(value).trim();
  const isoMatch = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: 'UTC',
    });
  }

  const date = new Date(stringValue);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPaddockReadySummary(row) {
  if (!row?.ready_to_graze_on) {
    return '-';
  }

  const baseWorkLabel = formatPaddockWorkTypeLabel(row.latest_work_type || row.event_type);
  let workLabel = baseWorkLabel;

  if (row.inherited_wait && row.effective_work_paddock_name) {
    workLabel = `${baseWorkLabel} (${row.effective_work_paddock_name} block)`;
  } else if (row.latest_work_applies_to_descendants) {
    workLabel = `${baseWorkLabel} (whole block)`;
  }

  const readyDate = formatDate(row.ready_to_graze_on);

  if (row.days_until_ready == null) {
    return `${workLabel} -> ${readyDate}`;
  }

  if (row.days_until_ready <= 0) {
    return `${workLabel} -> Ready ${readyDate}`;
  }

  return `${workLabel} -> ${row.days_until_ready} day(s) left, ready ${readyDate}`;
}

function formatRainMm(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '0';
  }
  if (Number.isInteger(numericValue)) {
    return String(numericValue);
  }
  return numericValue.toFixed(1);
}

function formatTemperatureValue(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '-';
  }
  if (Number.isInteger(numericValue)) {
    return String(numericValue);
  }
  return numericValue.toFixed(1);
}

function formatTemperatureC(value) {
  const formatted = formatTemperatureValue(value);
  return formatted === '-' ? '-' : `${formatted}C`;
}

function hasTemperatureValue(value) {
  return value != null && Number.isFinite(Number(value));
}

function formatChartAxisDate(value) {
  if (!value) {
    return '';
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });
}

function formatRangeDate(value, includeYear = false) {
  if (!value) {
    return '';
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    ...(includeYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  });
}

function currentYearMonthString() {
  return new Date().toISOString().slice(0, 7);
}

function normalizeYearMonth(value) {
  const normalized = String(value || '').trim();
  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    return '';
  }

  const [year, month] = normalized.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return '';
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

function getFeedSlotMeta(feedSlot) {
  return FEED_SLOT_META.find((row) => row.key === feedSlot) || null;
}

function getFeedSlotLabel(feedSlot) {
  return getFeedSlotMeta(feedSlot)?.title || String(feedSlot || '');
}

function getFeedSlotSortValue(feedSlot) {
  const index = FEED_SLOT_META.findIndex((row) => row.key === feedSlot);
  return index === -1 ? FEED_SLOT_META.length : index;
}

function getMonthDateInfo(yearMonth) {
  const normalizedYearMonth = normalizeYearMonth(yearMonth) || currentYearMonthString();
  const [year, month] = normalizedYearMonth.split('-').map(Number);
  const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDay = new Date(Date.UTC(year, month - 1, 1));

  return {
    month: normalizedYearMonth,
    year,
    month_index: month - 1,
    total_days: totalDays,
    first_weekday: firstDay.getUTCDay(),
  };
}

function buildIsoDateFromParts(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
}

function buildHorseFeedPlanDraftRow(partial = {}) {
  return {
    row_key: partial.row_key || `draft-${nextHorseFeedPlanDraftRowKey++}`,
    id: partial.id == null ? null : Number(partial.id),
    feed_slot: partial.feed_slot || 'morning',
    feed_item_name: partial.feed_item_name || '',
    quantity: partial.quantity == null ? '' : String(partial.quantity),
    unit: partial.unit || '',
    auto_deduct_stock:
      partial.auto_deduct_stock == null ? true : Boolean(partial.auto_deduct_stock),
    notes: partial.notes || '',
  };
}

function buildHorseFeedPlanDraftRowForSlot(feedSlot) {
  return buildHorseFeedPlanDraftRow({
    feed_slot: getFeedSlotMeta(feedSlot)?.key || 'morning',
  });
}

function formatRainRangeLabel(rows, windowKey) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return RAIN_WINDOW_CONFIG[windowKey]?.label || 'Rain';
  }

  const first = rows[0].event_date;
  const last = rows[rows.length - 1].event_date;

  if (windowKey === '1d') {
    const today = new Date().toISOString().slice(0, 10);
    if (last === today) {
      return 'Today';
    }
    return formatRangeDate(last, true);
  }

  if (windowKey === '1y') {
    return `${formatRangeDate(first, true)} - ${formatRangeDate(last, true)}`;
  }

  return `${formatRangeDate(first)} - ${formatRangeDate(last)}`;
}

function setSessionAuthState(authenticated, username = null) {
  sessionAuthenticated = Boolean(authenticated);

  loginUsernameLabel.classList.toggle('hidden', sessionAuthenticated);
  loginPasswordLabel.classList.toggle('hidden', sessionAuthenticated);
  loginUsernameInput.classList.toggle('hidden', sessionAuthenticated);
  loginPasswordInput.classList.toggle('hidden', sessionAuthenticated);
  loginButton.classList.toggle('hidden', sessionAuthenticated);
  logoutButton.classList.toggle('hidden', !sessionAuthenticated);

  if (sessionAuthenticated) {
    const displayName = username || 'admin';
    loginUsernameInput.value = displayName;
    loginPasswordInput.value = '';
    loginUsernameInput.disabled = true;
    loginPasswordInput.disabled = true;
    loginButton.disabled = true;
    logoutButton.disabled = false;
    return;
  }

  loginUsernameInput.disabled = false;
  loginPasswordInput.disabled = false;
  loginButton.disabled = false;
  logoutButton.disabled = true;
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? 'var(--danger)' : 'var(--ink-soft)';
}

function applyMessageState(target, message, isError = false) {
  if (!target) {
    return;
  }

  target.textContent = message;
  target.classList.toggle('is-error', Boolean(isError));
  target.classList.toggle('is-success', !isError && Boolean(String(message || '').trim()));
  target.classList.toggle('is-empty', !String(message || '').trim());
}

function resolveActionCard(targetOrId = null) {
  if (!targetOrId) {
    return null;
  }

  if (typeof targetOrId === 'string') {
    return document.getElementById(targetOrId);
  }

  if (targetOrId instanceof Element) {
    return targetOrId.closest('.action-card');
  }

  return null;
}

function setLastActionCard(targetOrId) {
  const card = resolveActionCard(targetOrId);
  if (card?.id) {
    lastActionCardId = card.id;
  }
}

function placeActionCardMessageElement(card, messageElement) {
  if (!card || !messageElement) {
    return;
  }

  messageElement.classList.add('action-card-message');
  if (!messageElement.hasAttribute('aria-live')) {
    messageElement.setAttribute('aria-live', 'polite');
  }

  const heading = card.querySelector(':scope > h3');
  const note = card.querySelector(':scope > .action-card-note');
  const anchor = note || heading;

  if (!anchor) {
    if (card.firstElementChild !== messageElement) {
      card.prepend(messageElement);
    }
    return;
  }

  if (messageElement.parentElement !== card || messageElement.previousElementSibling !== anchor) {
    card.insertBefore(messageElement, anchor.nextSibling);
  }
}

function getActionCardMessageElement(card) {
  if (!card) {
    return null;
  }

  if (card.id === 'action-card-farm-setup') {
    placeActionCardMessageElement(card, farmSettingsMessage);
    return farmSettingsMessage;
  }

  if (card.id === 'action-card-admin-modules') {
    placeActionCardMessageElement(card, adminModulesMessage);
    return adminModulesMessage;
  }

  if (card.id === 'action-card-horse-profile') {
    placeActionCardMessageElement(card, horseProfileMessage);
    return horseProfileMessage;
  }

  let messageElement = card.querySelector(':scope > .action-card-message');
  if (!messageElement) {
    messageElement = document.createElement('p');
    messageElement.className = 'action-message action-card-message is-empty';
  }

  placeActionCardMessageElement(card, messageElement);

  return messageElement;
}

function setActionCardMessage(targetOrId, message, isError = false) {
  const card = resolveActionCard(targetOrId) || resolveActionCard(lastActionCardId);
  if (!card) {
    return;
  }

  setLastActionCard(card);
  applyMessageState(getActionCardMessageElement(card), message, isError);
}

function setActionMessage(message, isError = false, options = {}) {
  if (options.card !== false) {
    const card = resolveActionCard(options.card) || resolveActionCard(lastActionCardId);
    if (card) {
      setActionCardMessage(card, message, isError);
      applyMessageState(actionMessage, '', false);
      return;
    }
  }

  if (options.global !== false) {
    applyMessageState(actionMessage, message, isError);
  }
}

function setHorseProfileMessage(message, isError = false) {
  applyMessageState(horseProfileMessage, message, isError);
}

function setFarmSettingsMessage(message, isError = false) {
  if (!farmSettingsMessage) {
    return;
  }

  applyMessageState(farmSettingsMessage, message, isError);
}

function isFarmLocationConfigured(settings) {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  const latitude = Number(settings.weather_latitude);
  const longitude = Number(settings.weather_longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude);
}

function isTelegramAlertConfigured(settings) {
  if (!settings || typeof settings !== 'object') {
    return false;
  }

  return Boolean(String(settings.telegram_alert_chat_id || '').trim());
}

function renderFarmSetupChecklist(settings) {
  if (!farmSetupChecklist) {
    return;
  }

  const weatherConfigured = isFarmLocationConfigured(settings);
  const timezoneConfigured = Boolean(String(settings?.weather_timezone || '').trim());
  const telegramConfigured = isTelegramAlertConfigured(settings);
  const syncDays =
    settings?.weather_sync_days == null ? null : Number.parseInt(settings.weather_sync_days, 10);

  const items = [
    {
      key: 'location',
      label: weatherConfigured ? 'Weather location ready' : 'Weather location missing',
      detail: weatherConfigured
        ? `Latitude ${settings.weather_latitude}, longitude ${settings.weather_longitude}.`
        : 'Add your farm latitude and longitude so weather sync can work.',
      ready: weatherConfigured,
    },
    {
      key: 'timezone',
      label: timezoneConfigured ? 'Timezone ready' : 'Timezone missing',
      detail: timezoneConfigured
        ? `${settings.weather_timezone} is set for weather sync.`
        : 'Add the farm timezone used for weather history.',
      ready: timezoneConfigured,
    },
    {
      key: 'sync',
      label: syncDays ? 'Weather sync window ready' : 'Weather sync window missing',
      detail: syncDays
        ? `Weather sync will backfill ${syncDays} day(s).`
        : 'Choose how many days of weather history should be synced.',
      ready: Boolean(syncDays),
    },
    {
      key: 'telegram',
      label: telegramConfigured ? 'Telegram reminders linked' : 'Telegram reminders not linked',
      detail: telegramConfigured
        ? `Alert chat ${settings.telegram_alert_chat_id} is saved.`
        : 'Send any message to the Telegram bot once, or paste a chat ID here manually.',
      ready: telegramConfigured,
    },
  ];

  farmSetupChecklist.innerHTML = items
    .map(
      (item) => `
        <article class="farm-setup-checklist-item ${item.ready ? 'is-ready' : 'is-pending'}" data-key="${escapeHtml(item.key)}">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.detail)}</span>
        </article>
      `
    )
    .join('');
}

function setAdminModulesMessage(message, isError = false) {
  if (!adminModulesMessage) {
    return;
  }

  applyMessageState(adminModulesMessage, message, isError);
}

function renderAdminModuleSettings() {
  if (!adminModulesList) {
    return;
  }

  const modules = normalizeAdminModuleSettings(currentAdminModuleSettings);
  if (!modules.length) {
    adminModulesList.innerHTML = '<p class="checkbox-list-empty">No optional modules found.</p>';
    return;
  }

  adminModulesList.innerHTML = modules
    .map(
      (module) => `
        <label class="checkbox-list-item module-settings-item">
          <input
            type="checkbox"
            name="moduleKey"
            value="${escapeHtml(module.key)}"
            ${module.enabled ? 'checked' : ''}
            ${module.editable ? '' : 'disabled'}
          />
          <span class="module-settings-copy">
            <strong>${escapeHtml(module.label)}</strong>
            <small>${escapeHtml(module.description)}</small>
          </span>
        </label>
      `
    )
    .join('');
}

function populateFarmSettings(settings) {
  currentFarmSettings = settings && typeof settings === 'object' ? settings : null;

  if (!farmNameInput) {
    return;
  }

  farmNameInput.value = currentFarmSettings?.farm_name || '';
  farmWeatherLatitudeInput.value =
    currentFarmSettings?.weather_latitude == null ? '' : String(currentFarmSettings.weather_latitude);
  farmWeatherLongitudeInput.value =
    currentFarmSettings?.weather_longitude == null
      ? ''
      : String(currentFarmSettings.weather_longitude);
  farmWeatherTimezoneInput.value = currentFarmSettings?.weather_timezone || 'America/Montevideo';
  farmWeatherSyncDaysInput.value =
    currentFarmSettings?.weather_sync_days == null ? '' : String(currentFarmSettings.weather_sync_days);
  farmTelegramAlertChatIdInput.value = currentFarmSettings?.telegram_alert_chat_id || '';
  renderFarmSetupChecklist(currentFarmSettings);
}

function applyAdminModuleVisibility() {
  const enabledMap = getAdminModuleEnabledMap();

  for (const [moduleKey, selectors] of Object.entries(MODULE_BOUND_SELECTORS)) {
    const enabled = enabledMap[moduleKey] !== false;

    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((element) => {
        element.classList.toggle('hidden', !enabled);
      });
    }
  }

  const dewormEnabled = enabledMap.deworm !== false;
  const farrierEnabled = enabledMap.farrier !== false;
  const dewormFarrierCard = document.getElementById('action-card-deworm-farrier');
  if (dewormFarrierCard) {
    dewormFarrierCard.classList.toggle('hidden', !dewormEnabled && !farrierEnabled);
  }
}

function syncAdminModuleSettings(rawSettings) {
  currentAdminModuleSettings = normalizeAdminModuleSettings(rawSettings);
  renderAdminModuleSettings();
  renderSummaryEditor();
  applyAdminModuleVisibility();
}

function setHorseFeedPlanMessage(message, isError = false) {
  if (!horseFeedPlanMessage) {
    return;
  }

  applyMessageState(horseFeedPlanMessage, message, isError);
}

function pauseDashboardAutoRefresh(durationMs = 120000) {
  const safeDuration = Number.isFinite(Number(durationMs)) ? Number(durationMs) : 120000;
  dashboardAutoRefreshPauseUntil = Math.max(
    dashboardAutoRefreshPauseUntil,
    Date.now() + Math.max(0, safeDuration)
  );
}

function isFeedPlanningInteractionActive() {
  const activeElement = document.activeElement;
  if (!activeElement) {
    return false;
  }

  return Boolean(
    (horseFeedPlanForm && horseFeedPlanForm.contains(activeElement)) ||
      (horseFeedCalendarGrid && horseFeedCalendarGrid.contains(activeElement))
  );
}

function applyStockChangesToCachedDashboard(stockChanges) {
  if (!latestDashboardPayload?.stock?.all || !Array.isArray(stockChanges) || stockChanges.length === 0) {
    return;
  }

  const allRows = latestDashboardPayload.stock.all
    .map((row) => ({ ...row }))
    .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));
  const rowsById = new Map(
    allRows
      .map((row) => [Number(row.id), row])
      .filter(([rowId]) => Number.isFinite(rowId))
  );
  const rowsByName = new Map(
    allRows.map((row) => [String(row.name || '').trim().toLowerCase(), row])
  );

  for (const change of stockChanges) {
    const targetRow =
      rowsById.get(Number(change.feed_item_id)) ||
      rowsByName.get(String(change.feed_item_name || '').trim().toLowerCase());
    if (!targetRow) {
      continue;
    }

    targetRow.current_stock = Number(change.current_stock);
    if (change.unit) {
      targetRow.unit = change.unit;
    }
  }

  const lowStockThreshold = Number(latestDashboardPayload.meta?.thresholds?.low_stock);
  const threshold = Number.isFinite(lowStockThreshold) ? lowStockThreshold : 5;
  const lowRows = allRows
    .filter((row) => Number(row.current_stock) <= threshold)
    .sort((left, right) => {
      const stockDiff = Number(left.current_stock) - Number(right.current_stock);
      if (stockDiff !== 0) {
        return stockDiff;
      }
      return String(left.name || '').localeCompare(String(right.name || ''));
    });

  latestDashboardPayload.stock.all = allRows;
  latestDashboardPayload.stock.low = lowRows.slice(0, 20);

  if (latestDashboardPayload.summary) {
    latestDashboardPayload.summary.low_stock_count = lowRows.length;
  }

  renderSummary(latestDashboardPayload);
  renderStockRows(lowStockBody, latestDashboardPayload.stock.low, 'No low stock items.');
  renderStockRows(allStockBody, latestDashboardPayload.stock.all, 'No inventory data.');
  populateFeedItemOptions(latestDashboardPayload.stock.all);
}

function panelIdFromTitle(title, index) {
  const normalized = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!normalized) {
    return `panel_${index}`;
  }

  return normalized;
}

function readStateMap(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function saveStateMap(storageKey, stateMap) {
  localStorage.setItem(storageKey, JSON.stringify(stateMap));
}

function readPanelStateMap() {
  return readStateMap(PANEL_STATE_STORAGE_KEY);
}

function savePanelStateMap(stateMap) {
  saveStateMap(PANEL_STATE_STORAGE_KEY, stateMap);
}

function setPanelCollapsed(panel, collapsed) {
  panel.classList.toggle('panel-collapsed', collapsed);
  const header = panel.querySelector(':scope > h2.panel-toggle');
  if (header) {
    header.setAttribute('aria-expanded', String(!collapsed));
  }
}

function initPanelAccordions() {
  const panels = Array.from(document.querySelectorAll('.panel'));
  if (!panels.length) {
    return;
  }

  const stateMap = readPanelStateMap();

  panels.forEach((panel, index) => {
    const header = panel.querySelector(':scope > h2');
    if (!header) {
      return;
    }

    const panelId = panel.dataset.panelId || panelIdFromTitle(header.textContent, index);
    panel.dataset.panelId = panelId;
    header.classList.add('panel-toggle');
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');

    if (typeof stateMap[panelId] === 'boolean') {
      setPanelCollapsed(panel, stateMap[panelId]);
    } else {
      setPanelCollapsed(panel, panel.classList.contains('panel-collapsed'));
    }

    const toggle = () => {
      const nextCollapsed = !panel.classList.contains('panel-collapsed');
      setPanelCollapsed(panel, nextCollapsed);
      stateMap[panelId] = nextCollapsed;
      savePanelStateMap(stateMap);
    };

    header.addEventListener('click', toggle);
    header.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  });
}

function setActionCardCollapsed(card, collapsed) {
  card.classList.toggle('action-card-collapsed', collapsed);
  const header = card.querySelector(':scope > h3.action-card-toggle');
  if (header) {
    header.setAttribute('aria-expanded', String(!collapsed));
  }
}

function initActionCardAccordions() {
  const cards = Array.from(document.querySelectorAll('.action-card'));
  if (!cards.length) {
    return;
  }

  const stateMap = readStateMap(ACTION_CARD_STATE_STORAGE_KEY);

  cards.forEach((card, index) => {
    const header = card.querySelector(':scope > h3');
    if (!header) {
      return;
    }

    const cardId = card.dataset.actionCardId || card.id || `action_card_${panelIdFromTitle(header.textContent, index)}`;
    card.dataset.actionCardId = cardId;
    header.classList.add('action-card-toggle');
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');

    if (typeof stateMap[cardId] === 'boolean') {
      setActionCardCollapsed(card, stateMap[cardId]);
    } else {
      setActionCardCollapsed(card, card.classList.contains('action-card-collapsed'));
    }

    const toggle = () => {
      const nextCollapsed = !card.classList.contains('action-card-collapsed');
      setActionCardCollapsed(card, nextCollapsed);
      stateMap[cardId] = nextCollapsed;
      saveStateMap(ACTION_CARD_STATE_STORAGE_KEY, stateMap);
    };

    header.addEventListener('click', toggle);
    header.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  });
}

function initActionCardMessages() {
  const cards = Array.from(document.querySelectorAll('.action-card'));
  if (cards.length > 0) {
    cards.forEach((card) => {
      getActionCardMessageElement(card);
    });
  }

  if (!actionHubPanel) {
    return;
  }

  actionHubPanel.addEventListener('click', (event) => {
    setLastActionCard(event.target);
  });

  actionHubPanel.addEventListener('focusin', (event) => {
    setLastActionCard(event.target);
  });

  actionHubPanel.addEventListener('submit', (event) => {
    setLastActionCard(event.target);
  });
}

function setSubpanelCollapsed(panel, toggle, collapsed) {
  if (!panel || !toggle) {
    return;
  }

  panel.classList.toggle('subpanel-collapsed', collapsed);
  toggle.setAttribute('aria-expanded', String(!collapsed));
}

function initStoredSubpanelAccordion(panel, toggle, storageKey) {
  if (!panel || !toggle || !storageKey) {
    return;
  }

  let collapsed = false;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw != null) {
      collapsed = raw === '1';
    }
  } catch (_error) {
    collapsed = false;
  }

  setSubpanelCollapsed(panel, toggle, collapsed);

  toggle.addEventListener('click', () => {
    const nextCollapsed = !panel.classList.contains('subpanel-collapsed');
    setSubpanelCollapsed(panel, toggle, nextCollapsed);
    localStorage.setItem(storageKey, nextCollapsed ? '1' : '0');
  });
}

function initRainRegistryAccordion() {
  initStoredSubpanelAccordion(
    rainRegistryAccordion,
    rainRegistryToggle,
    RAIN_REGISTRY_COLLAPSED_STORAGE_KEY
  );
}

function initHorseFeedHistoryAccordion() {
  initStoredSubpanelAccordion(
    horseFeedHistoryCard,
    horseFeedHistoryToggle,
    HORSE_FEED_HISTORY_COLLAPSED_STORAGE_KEY
  );
}

function getDefaultSummaryConfig() {
  return SUMMARY_METRICS.map((item) => ({
    key: item.key,
    label: item.defaultLabel,
    visible: true,
  }));
}

function normalizeSummaryConfig(rawConfig) {
  const byKey = new Map();
  for (const item of Array.isArray(rawConfig) ? rawConfig : []) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    if (!SUMMARY_METRICS.some((metric) => metric.key === item.key)) {
      continue;
    }
    byKey.set(item.key, {
      key: item.key,
      label: String(item.label || '').trim(),
      visible: Boolean(item.visible),
    });
  }

  return SUMMARY_METRICS.map((metric) => {
    const existing = byKey.get(metric.key);
    if (!existing) {
      return {
        key: metric.key,
        label: metric.defaultLabel,
        visible: true,
      };
    }
    return {
      key: metric.key,
      label: existing.label || metric.defaultLabel,
      visible: existing.visible,
    };
  });
}

function loadSummaryConfig() {
  try {
    const raw = localStorage.getItem(SUMMARY_PREFS_STORAGE_KEY);
    if (!raw) {
      return getDefaultSummaryConfig();
    }
    const parsed = JSON.parse(raw);
    return normalizeSummaryConfig(parsed);
  } catch (_error) {
    return getDefaultSummaryConfig();
  }
}

function saveSummaryConfig(config) {
  localStorage.setItem(SUMMARY_PREFS_STORAGE_KEY, JSON.stringify(config));
}

function moveSummaryConfigItem(array, fromIndex, toIndex) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= array.length ||
    toIndex >= array.length ||
    fromIndex === toIndex
  ) {
    return array;
  }

  const clone = [...array];
  const [item] = clone.splice(fromIndex, 1);
  clone.splice(toIndex, 0, item);
  return clone;
}

function emptyStateRow(colspan, text) {
  return `<tr><td class="muted" colspan="${colspan}">${escapeHtml(text)}</td></tr>`;
}

function computeAgeYears(dateOfBirth) {
  if (!dateOfBirth) {
    return '';
  }

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) {
    return '';
  }

  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  const monthDelta = now.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birthDate.getDate())) {
    years -= 1;
  }

  return years >= 0 ? String(years) : '';
}

function normalizeTrainingStatus(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');

  if (!normalized) {
    return '';
  }

  if (normalized === 'in training' || normalized === 'training' || normalized === 'intraining') {
    return 'in training';
  }

  if (
    normalized === 'breaking in' ||
    normalized === 'breaking' ||
    normalized === 'break in' ||
    normalized === 'breakingin' ||
    normalized === 'for breaking in' ||
    normalized === 'horse for breaking in'
  ) {
    return 'breaking in';
  }

  return '';
}

function normalizeDateForDateInput(value) {
  if (!value) {
    return '';
  }

  const stringValue = String(value).trim();
  if (!stringValue) {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const slashMatch = stringValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      return date.toISOString().slice(0, 10);
    }
  }

  const parsed = new Date(stringValue);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
}

function findHorseById(horseId) {
  return currentHorseRows.find((row) => String(row.id) === String(horseId)) || null;
}

function findHorseGroupById(groupId) {
  return currentHorseGroupRows.find((row) => String(row.id) === String(groupId)) || null;
}

function findPaddockById(paddockId) {
  return currentPaddockRows.find((row) => String(row.id) === String(paddockId)) || null;
}

function findPaddockWorkById(eventId) {
  return currentPaddockWorkRows.find((row) => String(row.id) === String(eventId)) || null;
}

function findPaddockByName(paddockName) {
  const normalizedName = String(paddockName || '')
    .trim()
    .toLowerCase();
  if (!normalizedName) {
    return null;
  }

  return (
    currentPaddockRows.find((row) => String(row.name || '').trim().toLowerCase() === normalizedName) || null
  );
}

function syncPaddockParentSelectOptions(rows = currentPaddockRows) {
  if (!paddockParentSelect) {
    return;
  }

  const previous = paddockParentSelect.value;
  const editingPaddock = findPaddockByName(paddockNameInput?.value);
  const options = ['<option value="">No parent / top-level paddock</option>'];

  for (const row of rows) {
    if (editingPaddock && String(row.id) === String(editingPaddock.id)) {
      continue;
    }

    options.push(`<option value="${escapeHtml(row.id)}">${escapeHtml(row.name)}</option>`);
  }

  paddockParentSelect.innerHTML = options.join('');

  const preferredValue = editingPaddock?.parent_paddock_id
    ? String(editingPaddock.parent_paddock_id)
    : previous;
  const hasPreferredValue =
    preferredValue && [...paddockParentSelect.options].some((option) => option.value === preferredValue);

  paddockParentSelect.value = hasPreferredValue ? preferredValue : '';
  paddockParentSelect.disabled = false;
}

function persistPanelCollapsedState(panel, collapsed) {
  if (!panel?.dataset?.panelId) {
    return;
  }

  const stateMap = readPanelStateMap();
  stateMap[panel.dataset.panelId] = collapsed;
  savePanelStateMap(stateMap);
}

function persistActionCardCollapsedState(card, collapsed) {
  if (!card?.dataset?.actionCardId) {
    return;
  }

  const stateMap = readStateMap(ACTION_CARD_STATE_STORAGE_KEY);
  stateMap[card.dataset.actionCardId] = collapsed;
  saveStateMap(ACTION_CARD_STATE_STORAGE_KEY, stateMap);
}

function expandPanelForElement(element) {
  const panel = element?.closest('.panel');
  if (!panel) {
    return;
  }

  setPanelCollapsed(panel, false);
  persistPanelCollapsedState(panel, false);
}

function expandActionCard(card) {
  if (!card) {
    return;
  }

  setActionCardCollapsed(card, false);
  persistActionCardCollapsedState(card, false);
}

function clearHorseGroupEditState(options = {}) {
  const { clearFields = true, focus = false } = options;

  if (horseGroupIdInput) {
    horseGroupIdInput.value = '';
  }

  if (horseGroupEditStatus) {
    horseGroupEditStatus.textContent = '';
    horseGroupEditStatus.classList.add('hidden');
  }

  if (horseGroupSaveButton) {
    horseGroupSaveButton.textContent = 'Save Group';
  }

  if (horseGroupCancelEditButton) {
    horseGroupCancelEditButton.classList.add('hidden');
  }

  if (clearFields) {
    horseGroupNameInput.value = '';
    horseGroupActiveSelect.value = 'true';
    horseGroupNotesInput.value = '';
  }

  if (focus) {
    horseGroupNameInput.focus();
  }
}

function clearPaddockEditState(options = {}) {
  const { clearFields = true, focus = false } = options;

  if (paddockEditStatus) {
    paddockEditStatus.textContent = '';
    paddockEditStatus.classList.add('hidden');
  }

  if (paddockSaveButton) {
    paddockSaveButton.textContent = 'Save Paddock';
  }

  if (paddockCancelEditButton) {
    paddockCancelEditButton.classList.add('hidden');
  }

  if (clearFields) {
    paddockNameInput.value = '';
    paddockZoneInput.value = '';
    paddockSizeInput.value = '';
    paddockActiveSelect.value = 'true';
    paddockNotesInput.value = '';
    if (paddockParentSelect) {
      paddockParentSelect.value = '';
    }
  }

  syncPaddockParentSelectOptions();

  if (focus) {
    paddockNameInput.focus();
  }
}

function setPaddockEditState(paddock, options = {}) {
  if (!paddock) {
    return;
  }

  const { scroll = true, focusName = true } = options;

  paddockNameInput.value = paddock.name || '';
  paddockZoneInput.value = paddock.zone || '';
  paddockSizeInput.value = paddock.size_ha == null ? '' : String(paddock.size_ha);
  paddockActiveSelect.value = paddock.active ? 'true' : 'false';
  paddockNotesInput.value = paddock.notes || '';
  syncPaddockParentSelectOptions();
  if (paddockParentSelect) {
    paddockParentSelect.value = paddock.parent_paddock_id == null ? '' : String(paddock.parent_paddock_id);
  }

  if (paddockEditStatus) {
    paddockEditStatus.textContent = `Editing paddock: ${paddock.name}`;
    paddockEditStatus.classList.remove('hidden');
  }

  if (paddockSaveButton) {
    paddockSaveButton.textContent = 'Update Paddock';
  }

  if (paddockCancelEditButton) {
    paddockCancelEditButton.classList.remove('hidden');
  }

  if (scroll) {
    paddockSaveForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (focusName) {
    paddockNameInput.focus();
    paddockNameInput.select();
  }
}

function clearPaddockWorkEditState(options = {}) {
  const { clearFields = true, focus = false } = options;

  if (paddockWorkEventIdInput) {
    paddockWorkEventIdInput.value = '';
  }

  if (paddockWorkEditStatus) {
    paddockWorkEditStatus.textContent = '';
    paddockWorkEditStatus.classList.add('hidden');
  }

  if (paddockWorkSaveButton) {
    paddockWorkSaveButton.textContent = 'Save Field Work';
  }

  if (paddockWorkCancelEditButton) {
    paddockWorkCancelEditButton.classList.add('hidden');
  }

  if (clearFields) {
    if (paddockWorkScopeSelect) {
      paddockWorkScopeSelect.value = 'single';
    }
    if (paddockWorkDateInput) {
      paddockWorkDateInput.value = new Date().toISOString().slice(0, 10);
    }
    if (paddockWorkReadyDaysInput) {
      paddockWorkReadyDaysInput.value = '';
    }
    if (paddockWorkNotesInput) {
      paddockWorkNotesInput.value = '';
    }
  }

  if (focus) {
    paddockWorkPaddockSelect?.focus();
  }
}

function setPaddockWorkEditState(row, options = {}) {
  if (!row) {
    return;
  }

  const { scroll = true, focus = true } = options;

  if (paddockWorkEventIdInput) {
    paddockWorkEventIdInput.value = String(row.id);
  }
  if (paddockWorkPaddockSelect) {
    paddockWorkPaddockSelect.value = String(row.paddock_id);
  }
  if (paddockWorkScopeSelect) {
    paddockWorkScopeSelect.value = row.applies_to_descendants ? 'whole_block' : 'single';
  }
  if (paddockWorkTypeSelect) {
    paddockWorkTypeSelect.value = row.event_type || 'other';
  }
  if (paddockWorkDateInput) {
    paddockWorkDateInput.value = row.event_date || '';
  }
  if (paddockWorkReadyDaysInput) {
    paddockWorkReadyDaysInput.value = row.ready_after_days == null ? '' : String(row.ready_after_days);
  }
  if (paddockWorkNotesInput) {
    paddockWorkNotesInput.value = row.notes || '';
  }

  if (paddockWorkEditStatus) {
    paddockWorkEditStatus.textContent = `Editing field work: ${row.paddock_name} ${formatPaddockWorkTypeLabel(
      row.event_type
    )}.`;
    paddockWorkEditStatus.classList.remove('hidden');
  }

  if (paddockWorkSaveButton) {
    paddockWorkSaveButton.textContent = 'Update Field Work';
  }

  if (paddockWorkCancelEditButton) {
    paddockWorkCancelEditButton.classList.remove('hidden');
  }

  if (scroll) {
    paddockWorkForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (focus) {
    paddockWorkPaddockSelect?.focus();
  }
}

function setHorseGroupEditState(group, options = {}) {
  if (!group || !horseGroupIdInput) {
    return;
  }

  const { scroll = true, focusName = true } = options;

  horseGroupIdInput.value = String(group.id);
  horseGroupNameInput.value = group.name || '';
  horseGroupActiveSelect.value = group.active ? 'true' : 'false';
  horseGroupNotesInput.value = group.notes || '';

  if (horseGroupEditStatus) {
    horseGroupEditStatus.textContent = `Editing group: ${group.name}`;
    horseGroupEditStatus.classList.remove('hidden');
  }

  if (horseGroupSaveButton) {
    horseGroupSaveButton.textContent = 'Update Group';
  }

  if (horseGroupCancelEditButton) {
    horseGroupCancelEditButton.classList.remove('hidden');
  }

  if (scroll) {
    horseGroupSaveForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (focusName) {
    horseGroupNameInput.focus();
    horseGroupNameInput.select();
  }
}

function syncHorseGroupMoveContext(group) {
  if (!horseGroupMoveContext) {
    return;
  }

  if (!group) {
    horseGroupMoveContext.textContent = '';
    horseGroupMoveContext.classList.add('hidden');
    return;
  }

  const currentPaddocks = formatHorseGroupCurrentPaddockSummary(group);
  const memberCount = Number(group.member_count || 0);
  const horsesLabel = memberCount === 1 ? '1 horse' : `${memberCount} horses`;
  horseGroupMoveContext.textContent = `Selected group: ${group.name}. ${horsesLabel}. Current paddocks: ${currentPaddocks}.`;
  horseGroupMoveContext.classList.remove('hidden');
}

function syncHorseGroupMoveSelectionContext() {
  const selectedGroup = findHorseGroupById(grazingGroupMoveInGroupSelect?.value || '');
  syncHorseGroupMoveContext(selectedGroup);
  return selectedGroup;
}

function focusHorseGroupMoveSection(group) {
  const horseGroupsCard = document.getElementById('action-card-horse-groups');
  expandPanelForElement(horseGroupMoveInSection || horseGroupsCard);
  expandActionCard(horseGroupsCard);

  let hasSelectedGroupOption = false;
  if (group && grazingGroupMoveInGroupSelect) {
    hasSelectedGroupOption = Array.from(grazingGroupMoveInGroupSelect.options).some(
      (option) => String(option.value) === String(group.id)
    );
    if (hasSelectedGroupOption) {
      grazingGroupMoveInGroupSelect.value = String(group.id);
    }
  }

  if (group && !hasSelectedGroupOption) {
    syncHorseGroupMoveContext(group);
  } else {
    syncHorseGroupMoveSelectionContext();
  }

  if (horseGroupMoveInSection) {
    horseGroupMoveInSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (grazingGroupMoveInPaddockSelect && !grazingGroupMoveInPaddockSelect.disabled) {
    grazingGroupMoveInPaddockSelect.focus();
  }

  return hasSelectedGroupOption;
}

function setActiveHorseSelection(horseId) {
  const nextValue = horseId == null ? '' : String(horseId);

  if (horseSelect) {
    horseSelect.value = nextValue;
  }
  if (horseProfileSelect) {
    horseProfileSelect.value = nextValue;
  }

  horseProfileIdInput.value = nextValue;
}

function findFeedHistoryById(feedEventId) {
  return (
    currentFeedHistoryRows.find((row) => String(row.id) === String(feedEventId)) || null
  );
}

function findFeedItemByName(itemName) {
  const name = String(itemName || '').trim().toLowerCase();
  if (!name) {
    return null;
  }
  const stockRows = latestDashboardPayload?.stock?.all || [];
  return stockRows.find((row) => String(row.name || '').trim().toLowerCase() === name) || null;
}

function setHorseHistorySelectedName(horse) {
  if (!horseHistorySelectedName) {
    return;
  }

  horseHistorySelectedName.textContent = horse?.name || '-';
}

function renderSummary(data) {
  const visibleCards = summaryCardConfig.filter((item) => item.visible && isSummaryMetricAvailable(item.key));

  if (!visibleCards.length) {
    summaryCards.innerHTML =
      '<article class="summary-card"><h3>Quick View</h3><p class="muted">No cards selected</p></article>';
    return;
  }

  summaryCards.innerHTML = visibleCards
    .map((item) => {
      const value = data.summary?.[item.key];
      const safeValue = value == null ? 0 : value;
      const targetId = SUMMARY_CARD_TARGETS[item.key];

      if (targetId) {
        return `
          <button
            type="button"
            class="summary-card summary-card-button"
            data-target-id="${escapeHtml(targetId)}"
            aria-label="Jump to ${escapeHtml(item.label)} details"
          >
            <h3>${escapeHtml(item.label)}</h3>
            <p>${escapeHtml(safeValue)}</p>
            <p class="muted">View details</p>
          </button>
        `;
      }

      return `<article class="summary-card"><h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(safeValue)}</p></article>`;
    })
    .join('');
}

function focusSummaryTarget(targetId) {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.classList.remove('panel-flash');
  void target.offsetWidth;
  target.classList.add('panel-flash');

  window.setTimeout(() => {
    target.classList.remove('panel-flash');
  }, 1400);
}

function syncBackToTopVisibility() {
  if (!backToTopButton) {
    return;
  }

  backToTopButton.classList.toggle('is-visible', window.scrollY > 360);
}

function initBackToTopButton() {
  if (!backToTopButton) {
    return;
  }

  backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', syncBackToTopVisibility, { passive: true });
  syncBackToTopVisibility();
}

function renderSummaryEditor() {
  summaryEditorList.innerHTML = summaryCardConfig
    .map((item, index) => {
      const available = isSummaryMetricAvailable(item.key);
      const disabledNote = available
        ? ''
        : `<span class="summary-editor-note">Module Off${
            SUMMARY_METRIC_MODULE_KEYS[item.key]
              ? `: ${escapeHtml(
                  ADMIN_MODULES.find((module) => module.key === SUMMARY_METRIC_MODULE_KEYS[item.key])?.label ||
                    SUMMARY_METRIC_MODULE_KEYS[item.key]
                )}`
              : ''
          }</span>`;
      return `
        <div class="summary-editor-row${available ? '' : ' is-disabled'}" data-key="${escapeHtml(item.key)}">
          <input type="checkbox" ${item.visible ? 'checked' : ''} ${available ? '' : 'disabled'} aria-label="Show ${escapeHtml(
            item.label
          )}" />
          <input type="text" value="${escapeHtml(item.label)}" ${available ? '' : 'disabled'} />
          <button type="button" data-move="up" ${index === 0 || !available ? 'disabled' : ''}>Up</button>
          <button type="button" data-move="down" ${
            index === summaryCardConfig.length - 1 || !available ? 'disabled' : ''
          }>Down</button>
          ${disabledNote}
        </div>
      `;
    })
    .join('');
}

function rerenderSummaryFromLatestPayload() {
  if (!latestDashboardPayload) {
    return;
  }
  renderSummary(latestDashboardPayload);
}

function persistAndRerenderSummary() {
  saveSummaryConfig(summaryCardConfig);
  renderSummaryEditor();
  rerenderSummaryFromLatestPayload();
}

function initSummaryCardCustomization() {
  summaryCardConfig = loadSummaryConfig();
  renderSummaryEditor();

  summaryEditToggleButton.addEventListener('click', () => {
    const isHidden = summaryEditor.classList.contains('hidden');
    summaryEditor.classList.toggle('hidden', !isHidden);
    summaryEditToggleButton.textContent = isHidden ? 'Close Quick View Editor' : 'Edit Quick View';
  });

  summaryResetButton.addEventListener('click', () => {
    summaryCardConfig = getDefaultSummaryConfig();
    persistAndRerenderSummary();
    setStatus('Quick view reset to default.');
  });

  summaryEditorList.addEventListener('change', (event) => {
    const row = event.target.closest('.summary-editor-row');
    if (!row) {
      return;
    }

    const key = row.getAttribute('data-key');
    const item = summaryCardConfig.find((entry) => entry.key === key);
    if (!item) {
      return;
    }

    if (event.target.type === 'checkbox') {
      item.visible = event.target.checked;
      persistAndRerenderSummary();
    }
  });

  summaryEditorList.addEventListener('input', (event) => {
    const row = event.target.closest('.summary-editor-row');
    if (!row || event.target.type !== 'text') {
      return;
    }

    const key = row.getAttribute('data-key');
    const item = summaryCardConfig.find((entry) => entry.key === key);
    if (!item) {
      return;
    }

    const fallbackMetric = SUMMARY_METRICS.find((m) => m.key === key);
    item.label = event.target.value.trim() || fallbackMetric?.defaultLabel || key;
    saveSummaryConfig(summaryCardConfig);
    rerenderSummaryFromLatestPayload();
  });

  summaryEditorList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-move]');
    if (!button) {
      return;
    }

    const row = event.target.closest('.summary-editor-row');
    if (!row) {
      return;
    }

    const key = row.getAttribute('data-key');
    const fromIndex = summaryCardConfig.findIndex((entry) => entry.key === key);
    if (fromIndex === -1) {
      return;
    }

    const direction = button.getAttribute('data-move');
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;

    summaryCardConfig = moveSummaryConfigItem(summaryCardConfig, fromIndex, toIndex);
    persistAndRerenderSummary();
  });

  summaryCards.addEventListener('click', (event) => {
    const button = event.target.closest('.summary-card-button[data-target-id]');
    if (!button) {
      return;
    }

    const targetId = button.getAttribute('data-target-id');
    if (!targetId) {
      return;
    }

    focusSummaryTarget(targetId);
  });
}

function renderReminderRows(target, rows, kind) {
  if (rows.length === 0) {
    target.innerHTML = emptyStateRow(4, 'No reminders in this window.');
    return;
  }

  target.innerHTML = rows
    .map((row) => {
      const dewormSecondDosePending = kind === 'deworming' && !row.second_dose_date;
      let label = row.status === 'overdue' ? 'Overdue' : 'Due Soon';
      if (dewormSecondDosePending) {
        label = row.status === 'overdue' ? '2nd Dose Overdue' : '2nd Dose Soon';
      }
      const badgeClass = row.status === 'overdue' ? 'overdue' : 'soon';
      const secondary = kind === 'deworming' ? row.product_name : row.service_type;
      return `
        <tr>
          <td>${escapeHtml(row.horse_name)}</td>
          <td>${escapeHtml(secondary)}</td>
          <td>${escapeHtml(formatDate(row.next_due_date))}</td>
          <td><span class="badge ${badgeClass}">${escapeHtml(label)}</span></td>
        </tr>
      `;
    })
    .join('');
}

function getDewormRowStatus(row) {
  const dueDate = row?.next_due_date;
  const secondDosePending = !row?.second_dose_date;
  if (!dueDate) {
    return {
      label: secondDosePending ? '2nd Dose Pending' : 'No Due Date',
      badgeClass: 'ok',
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const daysAhead = Number(latestDashboardPayload?.meta?.thresholds?.deworm_days_ahead || 3);
  const soonLimitDate = new Date(`${today}T00:00:00Z`);
  soonLimitDate.setUTCDate(soonLimitDate.getUTCDate() + daysAhead);
  const soonLimit = soonLimitDate.toISOString().slice(0, 10);

  if (dueDate < today) {
    return {
      label: secondDosePending ? '2nd Dose Overdue' : 'Overdue',
      badgeClass: 'overdue',
    };
  }

  if (dueDate <= soonLimit) {
    return {
      label: secondDosePending ? '2nd Dose Soon' : 'Due Soon',
      badgeClass: 'soon',
    };
  }

  return {
    label: secondDosePending ? '2nd Dose Pending' : 'Up to Date',
    badgeClass: 'ok',
  };
}

function getFarrierRowStatus(row) {
  const dueDate = row?.next_due_date;
  if (!dueDate) {
    return {
      label: 'No Due Date',
      badgeClass: 'ok',
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const daysAhead = Number(latestDashboardPayload?.meta?.thresholds?.farrier_days_ahead || 3);
  const soonLimitDate = new Date(`${today}T00:00:00Z`);
  soonLimitDate.setUTCDate(soonLimitDate.getUTCDate() + daysAhead);
  const soonLimit = soonLimitDate.toISOString().slice(0, 10);

  if (dueDate < today) {
    return {
      label: 'Overdue',
      badgeClass: 'overdue',
    };
  }

  if (dueDate <= soonLimit) {
    return {
      label: 'Due Soon',
      badgeClass: 'soon',
    };
  }

  return {
    label: 'Up to Date',
    badgeClass: 'ok',
  };
}

function mergeReminderRows(reminders) {
  return [
    ...reminders.overdue.map((row) => ({ ...row, status: 'overdue' })),
    ...reminders.dueSoon.map((row) => ({ ...row, status: 'soon' })),
  ];
}

function renderStockRows(target, rows, emptyText) {
  if (!rows.length) {
    target.innerHTML = emptyStateRow(2, emptyText);
    return;
  }

  target.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(`${row.current_stock} ${row.unit}`)}</td>
        </tr>
      `
    )
    .join('');
}

function renderRainRows(rows) {
  if (!rows.length) {
    rainBody.innerHTML = emptyStateRow(6, 'No rain records yet.');
    return;
  }

  rainBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(formatDate(row.event_date))}</td>
          <td>${escapeHtml(formatRainMm(row.rain_mm))}</td>
          <td>${escapeHtml(formatTemperatureValue(row.min_temp_c))}</td>
          <td>${escapeHtml(formatTemperatureValue(row.max_temp_c))}</td>
          <td>${escapeHtml(row.source || '-')}</td>
          <td>${escapeHtml(row.notes || '-')}</td>
        </tr>
      `
    )
    .join('');
}

function renderRainYearlyRows(rows) {
  if (!rainYearlyBody) {
    return;
  }

  if (!rows.length) {
    rainYearlyBody.innerHTML = emptyStateRow(6, 'No yearly rain data yet.');
    return;
  }

  rainYearlyBody.innerHTML = rows
    .map((row, index) => {
      const previous = rows[index + 1] || null;
      const delta = previous ? Number(row.total_mm || 0) - Number(previous.total_mm || 0) : null;
      let deltaText = '-';
      if (delta != null) {
        const sign = delta > 0 ? '+' : '';
        deltaText = `${sign}${formatRainMm(delta)} mm`;
      }

      return `
        <tr>
          <td>${escapeHtml(row.year || '-')}</td>
          <td>${escapeHtml(formatRainMm(row.total_mm || 0))}</td>
          <td>${escapeHtml(row.rainy_days || 0)}</td>
          <td>${escapeHtml(formatRainMm(row.avg_mm_per_event || 0))}</td>
          <td>${escapeHtml(formatRainMm(row.peak_mm || 0))}</td>
          <td>${escapeHtml(deltaText)}</td>
        </tr>
      `;
    })
    .join('');
}

function renderDewormingHistoryRegistryRows(rows) {
  if (!dewormHistoryRegistryBody) {
    return;
  }

  if (!rows.length) {
    dewormHistoryRegistryBody.innerHTML = emptyStateRow(6, 'No deworming history records.');
    return;
  }

  dewormHistoryRegistryBody.innerHTML = rows
    .map((row) => {
      const status = getDewormRowStatus(row);
      return `
        <tr>
          <td>${escapeHtml(row.horse_name || '-')}</td>
          <td>${escapeHtml(row.product_name || '-')}</td>
          <td>${escapeHtml(formatDate(row.event_date || row.created_at))}</td>
          <td>${escapeHtml(formatDate(row.second_dose_date) || '-')}</td>
          <td>${escapeHtml(formatDate(row.next_due_date) || '-')}</td>
          <td><span class="badge ${status.badgeClass}">${escapeHtml(status.label)}</span></td>
        </tr>
      `;
    })
    .join('');
}

function renderFarrierHistoryRegistryRows(rows) {
  if (!farrierHistoryRegistryBody) {
    return;
  }

  if (!rows.length) {
    farrierHistoryRegistryBody.innerHTML = emptyStateRow(5, 'No farrier history records.');
    return;
  }

  farrierHistoryRegistryBody.innerHTML = rows
    .map((row) => {
      const status = getFarrierRowStatus(row);
      return `
        <tr>
          <td>${escapeHtml(row.horse_name || '-')}</td>
          <td>${escapeHtml(row.service_type || '-')}</td>
          <td>${escapeHtml(formatDate(row.event_date || row.created_at))}</td>
          <td>${escapeHtml(formatDate(row.next_due_date) || '-')}</td>
          <td><span class="badge ${status.badgeClass}">${escapeHtml(status.label)}</span></td>
        </tr>
      `;
    })
    .join('');
}

function getRainWindowRows(dailyRows, windowKey) {
  const config = RAIN_WINDOW_CONFIG[windowKey] || RAIN_WINDOW_CONFIG['7d'];
  const normalizedRows = Array.isArray(dailyRows)
    ? dailyRows
        .map((row) => ({
          event_date: row.event_date || null,
          rain_mm: Number(row.rain_mm || 0),
          min_temp_c: row.min_temp_c == null ? null : Number(row.min_temp_c),
          max_temp_c: row.max_temp_c == null ? null : Number(row.max_temp_c),
        }))
        .filter((row) => row.event_date)
    : [];

  if (!normalizedRows.length) {
    return [];
  }

  if (windowKey === '1y') {
    const today = new Date().toISOString().slice(0, 10);
    const currentYear = today.slice(0, 4);
    const startOfYear = `${currentYear}-01-01`;

    return normalizedRows.filter(
      (row) => row.event_date >= startOfYear && row.event_date <= today
    );
  }

  return normalizedRows.slice(-config.days);
}

function getCurrentDrySpellInfo(dailyRows) {
  const rows = Array.isArray(dailyRows)
    ? dailyRows
        .map((row) => ({
          event_date: row.event_date || null,
          rain_mm: Number(row.rain_mm || 0),
        }))
        .filter((row) => row.event_date)
    : [];

  if (!rows.length) {
    return {
      dry_days: 0,
      last_rain_date: null,
    };
  }

  let dryDays = 0;
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (rows[index].rain_mm > 0) {
      return {
        dry_days: dryDays,
        last_rain_date: rows[index].event_date,
      };
    }

    dryDays += 1;
  }

  return {
    dry_days: dryDays,
    last_rain_date: null,
  };
}

function formatDrySpellSummary(drySpellInfo) {
  if (!drySpellInfo) {
    return '';
  }

  const dryDays = Number(drySpellInfo.dry_days || 0);
  if (dryDays <= 0) {
    return 'Rain today';
  }

  const dayLabel = dryDays === 1 ? '1 dry day' : `${dryDays} dry days`;
  if (drySpellInfo.last_rain_date) {
    return `${dayLabel} since ${formatRangeDate(drySpellInfo.last_rain_date, true)}`;
  }

  return `${dayLabel} in record`;
}

function getRainTemperatureSummary(rows) {
  const temperatureRows = Array.isArray(rows)
    ? rows.filter((row) => hasTemperatureValue(row.min_temp_c) || hasTemperatureValue(row.max_temp_c))
    : [];

  if (!temperatureRows.length) {
    return '';
  }

  const minValues = temperatureRows
    .map((row) => Number(row.min_temp_c))
    .filter((value) => Number.isFinite(value));
  const maxValues = temperatureRows
    .map((row) => Number(row.max_temp_c))
    .filter((value) => Number.isFinite(value));

  const averageMin = minValues.length
    ? minValues.reduce((sum, value) => sum + value, 0) / minValues.length
    : null;
  const averageMax = maxValues.length
    ? maxValues.reduce((sum, value) => sum + value, 0) / maxValues.length
    : null;

  if (averageMin == null && averageMax == null) {
    return '';
  }

  if (averageMin != null && averageMax != null) {
    return `Avg min/max ${formatTemperatureValue(averageMin)}/${formatTemperatureValue(averageMax)}C`;
  }

  return averageMin != null
    ? `Avg min ${formatTemperatureC(averageMin)}`
    : `Avg max ${formatTemperatureC(averageMax)}`;
}

function renderRainChartEmpty(message) {
  const label = RAIN_WINDOW_CONFIG[selectedRainWindow]?.label || 'Rain';
  const isRingMode = selectedRainWindow === '1d';
  setRainChartViewportMode(isRingMode);

  if (rainRangeLabel) {
    rainRangeLabel.textContent = label;
  }

  if (rainChartTotal) {
    rainChartTotal.textContent = message || 'No data';
  }

  if (rainChartLabel) {
    rainChartLabel.textContent = '';
  }

  if (rainChartLegend) {
    rainChartLegend.classList.add('is-hidden');
  }

  if (rainChart) {
    rainChart.innerHTML = `
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca7bc" font-size="14" font-family="Manrope, sans-serif">
        ${escapeHtml(message || 'No rain data yet')}
      </text>
    `;
  }
}

function setRainChartViewportMode(isRingMode) {
  if (rainChartWrap) {
    rainChartWrap.classList.toggle('is-ring-mode', isRingMode);
  }
  if (!rainChart) {
    return;
  }

  if (isRingMode) {
    rainChart.setAttribute('viewBox', `0 0 ${RAIN_RING_VIEWBOX_SIZE} ${RAIN_RING_VIEWBOX_SIZE}`);
    rainChart.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    return;
  }

  rainChart.setAttribute('viewBox', `0 0 ${RAIN_BARS_VIEWBOX_WIDTH} ${RAIN_BARS_VIEWBOX_HEIGHT}`);
  rainChart.setAttribute('preserveAspectRatio', 'none');
}

function renderRainChart(rainPayload) {
  if (!rainChart || !rainWindowControls || !rainChartLabel || !rainChartTotal || !rainRangeLabel) {
    return;
  }

  const buttons = Array.from(rainWindowControls.querySelectorAll('button[data-rain-window]'));
  buttons.forEach((button) => {
    const buttonWindow = button.getAttribute('data-rain-window');
    button.classList.toggle('is-active', buttonWindow === selectedRainWindow);
  });

  const rows = getRainWindowRows(rainPayload?.daily || [], selectedRainWindow);
  const drySpellSummary = formatDrySpellSummary(getCurrentDrySpellInfo(rainPayload?.daily || []));
  const temperatureSummary = getRainTemperatureSummary(rows);
  const isRingMode = selectedRainWindow === '1d';
  setRainChartViewportMode(isRingMode);
  if (!rows.length) {
    renderRainChartEmpty('No rain data');
    return;
  }

  rainRangeLabel.textContent = formatRainRangeLabel(rows, selectedRainWindow);

  if (selectedRainWindow === '1d') {
    const row = rows[rows.length - 1];
    const rainMm = Number(row.rain_mm || 0);
    const progress = Math.min(rainMm / RAIN_TARGET_MET_MM, 1);
    const remainder = Math.max(0, RAIN_TARGET_MET_MM - rainMm);

    if (rainChartLegend) {
      rainChartLegend.classList.add('is-hidden');
    }

    rainChartTotal.textContent = `${formatRainMm(rainMm)} mm`;
    const temperatureBits = [];
    if (hasTemperatureValue(row.min_temp_c)) {
      temperatureBits.push(`Min ${formatTemperatureC(row.min_temp_c)}`);
    }
    if (hasTemperatureValue(row.max_temp_c)) {
      temperatureBits.push(`Max ${formatTemperatureC(row.max_temp_c)}`);
    }
    rainChartLabel.textContent =
      rainMm >= RAIN_TARGET_MET_MM
        ? `Target met (>= ${RAIN_TARGET_MET_MM} mm)${
            temperatureBits.length ? ` • ${temperatureBits.join(' • ')}` : ''
          }${drySpellSummary ? ` • ${drySpellSummary}` : ''}`
        : `${formatRainMm(remainder)} mm to reach ${RAIN_TARGET_MET_MM} mm target${
            temperatureBits.length ? ` • ${temperatureBits.join(' • ')}` : ''
          }${
            drySpellSummary ? ` • ${drySpellSummary}` : ''
          }`;

    const width = RAIN_RING_VIEWBOX_SIZE;
    const height = RAIN_RING_VIEWBOX_SIZE;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 96;
    const strokeWidth = 20;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);

    rainChart.innerHTML = `
      <defs>
        <linearGradient id="rainRingGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#e23ad7" />
          <stop offset="100%" stop-color="#2d8bff" />
        </linearGradient>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#2d3340" stroke-width="${strokeWidth}" />
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${radius}"
        fill="none"
        stroke="url(#rainRingGradient)"
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${dashOffset}"
        transform="rotate(-90 ${cx} ${cy})"
      />
      <text x="${cx}" y="${cy - 18}" text-anchor="middle" fill="#f5f8ff" font-size="48" font-family="Fraunces, Georgia, serif">${escapeHtml(
        formatRainMm(rainMm)
      )} mm</text>
      <text x="${cx}" y="${cy + 18}" text-anchor="middle" fill="#9aa8be" font-size="15" font-family="Manrope, sans-serif">Rain Today</text>
      <text x="${cx}" y="${cy + 52}" text-anchor="middle" fill="${
        rainMm >= RAIN_TARGET_MET_MM ? '#21c55d' : '#6e7a90'
      }" font-size="36" font-family="Manrope, sans-serif">${rainMm >= RAIN_TARGET_MET_MM ? '✓' : '•'}</text>
    `;
    return;
  }

  if (rainChartLegend) {
    rainChartLegend.classList.remove('is-hidden');
  }

  const totalRain = rows.reduce((sum, row) => sum + row.rain_mm, 0);
  const rainyDays = rows.filter((row) => row.rain_mm > 0).length;
  const metDays = rows.filter((row) => row.rain_mm >= RAIN_TARGET_MET_MM).length;
  const averageRain = rows.length > 0 ? totalRain / rows.length : 0;
  rainChartTotal.textContent = `${formatRainMm(totalRain)} mm total`;
  rainChartLabel.textContent = `Avg ${formatRainMm(averageRain)} mm/day • ${rainyDays}/${rows.length} rainy days • ${metDays} met target${
    temperatureSummary ? ` • ${temperatureSummary}` : ''
  }${
    drySpellSummary ? ` • ${drySpellSummary}` : ''
  }`;

  const width = RAIN_BARS_VIEWBOX_WIDTH;
  const height = RAIN_BARS_VIEWBOX_HEIGHT;
  const padding = {
    top: 16,
    right: 10,
    bottom: 34,
    left: 46,
  };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const baselineY = padding.top + plotHeight;
  const maxRain = Math.max(1, ...rows.map((row) => row.rain_mm));

  const gridLines = 4;
  const gridSvg = [];
  for (let i = 0; i <= gridLines; i += 1) {
    const ratio = i / gridLines;
    const y = padding.top + plotHeight * ratio;
    const labelValue = Math.round((1 - ratio) * maxRain);
    gridSvg.push(
      `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#283242" stroke-width="1" />`
    );
    gridSvg.push(
      `<text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="#8896ad" font-size="11" font-family="Manrope, sans-serif">${labelValue}</text>`
    );
  }

  const slotWidth = plotWidth / rows.length;
  const barWidth = Math.max(2, Math.min(10, slotWidth * 0.68));

  const barsSvg = rows
    .map((row, index) => {
      const x = padding.left + index * slotWidth + (slotWidth - barWidth) / 2;
      const barHeight = (row.rain_mm / maxRain) * plotHeight;
      const y = baselineY - barHeight;
      const fillGradient =
        row.rain_mm >= RAIN_TARGET_MET_MM ? 'url(#rainBarsGreenGradient)' : 'url(#rainBarsBlueGradient)';
      return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="${Math.min(
        3,
        barWidth / 2
      )}" fill="${fillGradient}" />`;
    })
    .join('');

  const labelIndexes = Array.from(
    new Set([
      0,
      Math.floor((rows.length - 1) / 2),
      rows.length - 1,
    ])
  );
  const labelsSvg = labelIndexes
    .map((index) => {
      const row = rows[index];
      const x = padding.left + index * slotWidth + slotWidth / 2;
      const label = formatChartAxisDate(row.event_date);
      return `<text x="${x}" y="${height - 10}" text-anchor="middle" fill="#8896ad" font-size="11" font-family="Manrope, sans-serif">${escapeHtml(
        label
      )}</text>`;
    })
    .join('');

  rainChart.innerHTML = `
    <defs>
      <linearGradient id="rainBarsBlueGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2ea1ff" />
        <stop offset="100%" stop-color="#2463eb" />
      </linearGradient>
      <linearGradient id="rainBarsGreenGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2de26a" />
        <stop offset="100%" stop-color="#17a44a" />
      </linearGradient>
    </defs>
    ${gridSvg.join('')}
    <line x1="${padding.left}" y1="${baselineY}" x2="${width - padding.right}" y2="${baselineY}" stroke="#3b4657" stroke-width="1.2" />
    ${barsSvg}
    ${labelsSvg}
  `;
}

function renderTrainingHorseRows(target, rows, emptyText) {
  if (!rows.length) {
    target.innerHTML = emptyStateRow(3, emptyText);
    return;
  }

  target.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.activity || '-')}</td>
          <td>${escapeHtml(row.age_years == null ? '-' : String(row.age_years))}</td>
        </tr>
      `
    )
    .join('');
}

function renderHorseHistoryRows(rows) {
  if (!rows.length) {
    horseHistoryBody.innerHTML = emptyStateRow(3, 'No history for this horse yet.');
    return;
  }

  horseHistoryBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(formatDateTime(row.at))}</td>
          <td>${escapeHtml(row.category)}</td>
          <td>${escapeHtml(row.detail)}</td>
        </tr>
      `
    )
    .join('');
}

function renderFeedHistoryRows(rows) {
  currentFeedHistoryRows = rows;

  if (!rows.length) {
    horseFeedHistoryBody.innerHTML = emptyStateRow(4, 'No feed history.');
    return;
  }

  horseFeedHistoryBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(formatDateTime(row.at))}</td>
          <td>${escapeHtml(
            `${row.feed_item}${row.feed_slot ? ` (${getFeedSlotLabel(row.feed_slot)})` : ''}`
          )}</td>
          <td>${escapeHtml(`${row.quantity} ${row.unit}`)}</td>
          <td class="row-actions">
            ${
              row.calendar_slot_entry_id != null
                ? '<span class="badge neutral">Plan</span>'
                : `<button type="button" class="inline-action-btn" data-feed-action="edit" data-feed-event-id="${escapeHtml(row.id)}">Edit</button>
            <button type="button" class="inline-action-btn danger" data-feed-action="delete" data-feed-event-id="${escapeHtml(row.id)}">Delete</button>`
            }
          </td>
        </tr>
      `
    )
    .join('');
}

function isBlankHorseFeedPlanDraftRow(row) {
  return !row?.feed_item_name && String(row?.quantity || '').trim() === '' && !row?.unit && !row?.notes;
}

function sortHorseFeedPlanRows(rows) {
  return [...rows].sort((left, right) => {
    const slotDiff = getFeedSlotSortValue(left.feed_slot) - getFeedSlotSortValue(right.feed_slot);
    if (slotDiff !== 0) {
      return slotDiff;
    }

    const orderDiff = Number(left.sort_order || 0) - Number(right.sort_order || 0);
    if (orderDiff !== 0) {
      return orderDiff;
    }

    return Number(left.id || 0) - Number(right.id || 0);
  });
}

function getHorseFeedPlanRowsForCalendar() {
  return currentHorseFeedPlanRows.filter(
    (row) => row.feed_slot && row.feed_item_name && Number.isFinite(Number(row.quantity)) && row.unit
  );
}

function renderHorseFeedPlanRows(rows) {
  if (!horseFeedPlanBody) {
    return;
  }

  const hasHorse = Boolean(horseSelect?.value || horseProfileSelect?.value || '');
  if (horseFeedCalendarMonthInput) {
    horseFeedCalendarMonthInput.disabled = !hasHorse;
  }

  if (horseFeedCalendarTodayButton) {
    horseFeedCalendarTodayButton.disabled = !hasHorse;
  }

  if (!hasHorse) {
    horseFeedPlanBody.innerHTML =
      '<p class="feed-plan-empty">Choose a horse to build its feed mixes.</p>';
    return;
  }

  const sortedRows = sortHorseFeedPlanRows(rows);
  horseFeedPlanBody.innerHTML = FEED_SLOT_META.map((slotRow) => {
    const slotRows = sortedRows.filter((row) => row.feed_slot === slotRow.key);
    const rowsMarkup = slotRows.length
      ? `
          <div class="feed-plan-ingredient-head">
            <span>Feed</span>
            <span>Qty</span>
            <span>Unit</span>
            <span>Auto Stock</span>
            <span>Actions</span>
          </div>
          <div class="feed-plan-ingredient-list">
            ${slotRows
              .map(
                (row) => `
                  <div class="feed-plan-ingredient-row" data-feed-plan-row-key="${escapeHtml(row.row_key)}">
                    <label class="feed-plan-ingredient-field">
                      <span class="feed-plan-mobile-label">Feed</span>
                      <input
                        type="text"
                        list="feed-item-options"
                        placeholder="Feed item"
                        value="${escapeHtml(row.feed_item_name || '')}"
                        data-feed-plan-field="feed_item_name"
                        data-feed-plan-row-key="${escapeHtml(row.row_key)}"
                      />
                    </label>
                    <label class="feed-plan-ingredient-field">
                      <span class="feed-plan-mobile-label">Qty</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Qty"
                        value="${escapeHtml(row.quantity || '')}"
                        data-feed-plan-field="quantity"
                        data-feed-plan-row-key="${escapeHtml(row.row_key)}"
                      />
                    </label>
                    <label class="feed-plan-ingredient-field">
                      <span class="feed-plan-mobile-label">Unit</span>
                      <input
                        type="text"
                        placeholder="Unit"
                        value="${escapeHtml(row.unit || '')}"
                        data-feed-plan-field="unit"
                        data-feed-plan-row-key="${escapeHtml(row.row_key)}"
                      />
                    </label>
                    <label class="feed-plan-ingredient-field feed-plan-stock-field">
                      <span class="feed-plan-mobile-label">Auto Stock</span>
                      <span class="feed-plan-stock-toggle">
                        <input
                          type="checkbox"
                          ${row.auto_deduct_stock ? ' checked' : ''}
                          data-feed-plan-field="auto_deduct_stock"
                          data-feed-plan-row-key="${escapeHtml(row.row_key)}"
                        />
                        <span>${row.auto_deduct_stock ? 'Yes' : 'No'}</span>
                      </span>
                    </label>
                    <div class="feed-plan-ingredient-actions">
                      <span class="feed-plan-mobile-label">Actions</span>
                      <button
                        type="button"
                        class="inline-action-btn danger"
                        data-feed-plan-action="remove"
                        data-feed-plan-row-key="${escapeHtml(row.row_key)}"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                `
              )
              .join('')}
          </div>
        `
      : `<p class="feed-plan-slot-empty">No ${escapeHtml(
          slotRow.title.toLowerCase()
        )} ingredients yet. Add the mix items for this slot.</p>`;

    return `
      <section class="feed-plan-slot-card" data-feed-plan-slot="${escapeHtml(slotRow.key)}">
        <div class="feed-plan-slot-head">
          <div class="feed-plan-slot-copy">
            <h4>${escapeHtml(slotRow.title)} Mix</h4>
            <p>Tick ${escapeHtml(slotRow.title)} in the calendar to log every ingredient below together.</p>
          </div>
          <button
            type="button"
            class="secondary"
            data-feed-plan-action="add-slot-row"
            data-feed-plan-slot="${escapeHtml(slotRow.key)}"
          >
            Add Ingredient
          </button>
        </div>
        ${rowsMarkup}
      </section>
    `;
  }).join('');
}

function renderHorseFeedCalendar(calendarData) {
  if (!horseFeedCalendarGrid) {
    return;
  }

  const hasHorse = Boolean(horseSelect?.value || horseProfileSelect?.value || '');
  if (!hasHorse) {
    horseFeedCalendarGrid.innerHTML = '<p class="feed-calendar-empty">Choose a horse to use the feed calendar.</p>';
    return;
  }

  const monthInfo = getMonthDateInfo(calendarData?.month || selectedHorseFeedCalendarMonth);
  const slotEntries = Array.isArray(calendarData?.entries) ? calendarData.entries : [];
  const entryMap = new Map(
    slotEntries.map((row) => [`${row.event_date}:${row.feed_slot}`, row])
  );
  const planRows = getHorseFeedPlanRowsForCalendar();
  const slotPlanCounts = new Map();
  const slotSummaries = new Map();

  if (!planRows.length) {
    horseFeedCalendarGrid.innerHTML =
      '<p class="feed-calendar-empty">Save at least one feed-plan row above to unlock the calendar.</p>';
    return;
  }

  for (const row of planRows) {
    slotPlanCounts.set(row.feed_slot, Number(slotPlanCounts.get(row.feed_slot) || 0) + 1);
    const summaryLine = `${row.feed_item_name} ${row.quantity} ${row.unit}`;
    slotSummaries.set(
      row.feed_slot,
      [...(slotSummaries.get(row.feed_slot) || []), summaryLine]
    );
  }

  const weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    .map((label) => `<div class="feed-calendar-weekday">${escapeHtml(label)}</div>`)
    .join('');

  const leadingSpacers = Array.from({ length: monthInfo.first_weekday }, () => '<div class="feed-calendar-spacer"></div>')
    .join('');

  const todayIso = new Date().toISOString().slice(0, 10);
  const dayCards = [];
  for (let day = 1; day <= monthInfo.total_days; day += 1) {
    const isoDate = buildIsoDateFromParts(monthInfo.year, monthInfo.month_index, day);
    const weekdayLabel = new Date(`${isoDate}T00:00:00Z`).toLocaleDateString(undefined, {
      weekday: 'short',
      timeZone: 'UTC',
    });

    const slotMarkup = FEED_SLOT_META.map((slotRow) => {
      const key = `${isoDate}:${slotRow.key}`;
      const checked = entryMap.has(key);
      const hasPlan = slotPlanCounts.has(slotRow.key);
      const slotSummary = (slotSummaries.get(slotRow.key) || []).join(' + ');
      const title = hasPlan
        ? `${slotRow.title}: ${slotSummary}`
        : `${slotRow.title}: no saved plan`;

      return `
        <label class="feed-calendar-slot${checked ? ' is-checked' : ''}${hasPlan ? '' : ' is-disabled'}" title="${escapeHtml(
          title
        )}">
          <input
            type="checkbox"
            data-feed-calendar-toggle
            data-feed-calendar-slot="${escapeHtml(slotRow.key)}"
            data-feed-calendar-date="${escapeHtml(isoDate)}"
            ${checked ? ' checked' : ''}
            ${hasPlan ? '' : ' disabled'}
          />
          <span>${escapeHtml(slotRow.label)}</span>
        </label>
      `;
    }).join('');

    dayCards.push(`
      <div class="feed-calendar-day${isoDate === todayIso ? ' is-today' : ''}">
        <div class="feed-calendar-day-head">
          <strong>${escapeHtml(String(day))}</strong>
          <span>${escapeHtml(weekdayLabel)}</span>
        </div>
        <div class="feed-calendar-slots">${slotMarkup}</div>
      </div>
    `);
  }

  const noteMarkup =
    slotPlanCounts.size < FEED_SLOT_META.length
      ? '<p class="feed-calendar-note">Only slots with saved plan rows are clickable.</p>'
      : '';

  horseFeedCalendarGrid.innerHTML = `
    ${noteMarkup}
    <div class="feed-calendar-weekdays">${weekdayHeaders}</div>
    <div class="feed-calendar-days">${leadingSpacers}${dayCards.join('')}</div>
  `;
}

function updateHorseFeedPlanDraftRow(rowKey, field, rawValue) {
  const row = currentHorseFeedPlanDraftRows.find((candidate) => candidate.row_key === rowKey);
  if (!row || !field) {
    return { row: null, didAutoFillUnit: false, didToggleStock: false };
  }

  if (field === 'auto_deduct_stock') {
    row.auto_deduct_stock = Boolean(rawValue);
    const feedItem = findFeedItemByName(row.feed_item_name);
    if (row.auto_deduct_stock && feedItem?.unit) {
      row.unit = feedItem.unit;
      return { row, didAutoFillUnit: true, didToggleStock: true };
    }

    return { row, didAutoFillUnit: false, didToggleStock: true };
  }

  const nextValue = typeof rawValue === 'string' ? rawValue : String(rawValue ?? '');
  row[field] = nextValue;

  if (field === 'feed_item_name') {
    const feedItem = findFeedItemByName(nextValue);
    if (feedItem?.unit && (row.auto_deduct_stock || !String(row.unit || '').trim())) {
      row.unit = feedItem.unit;
      return { row, didAutoFillUnit: true, didToggleStock: false };
    }
  }

  return { row, didAutoFillUnit: false, didToggleStock: false };
}

function buildHorseFeedPlanSaveItems() {
  return sortHorseFeedPlanRows(currentHorseFeedPlanDraftRows)
    .filter((row) => !isBlankHorseFeedPlanDraftRow(row))
    .map((row) => ({
      feed_slot: row.feed_slot,
      feed_item_name: String(row.feed_item_name || '').trim(),
      quantity: Number(row.quantity),
      unit: String(row.unit || '').trim(),
      auto_deduct_stock: Boolean(row.auto_deduct_stock),
    }));
}

function formatHorseFeedCalendarStockSummary(stockChanges) {
  if (!Array.isArray(stockChanges) || stockChanges.length === 0) {
    return ' Logged without changing stock.';
  }

  const summary = stockChanges
    .map((row) => {
      const delta = Number(row.quantity_delta || 0);
      const deltaPrefix = delta > 0 ? '+' : '';
      return `${row.feed_item_name} ${deltaPrefix}${delta} ${row.unit} -> ${row.current_stock} ${row.unit}`;
    })
    .join(', ');

  return ` Stock updated: ${summary}.`;
}

function syncHorseFeedPlanningState(payload) {
  currentHorseFeedPlanRows = sortHorseFeedPlanRows(
    Array.isArray(payload?.feed_plan?.items) ? payload.feed_plan.items : []
  );
  currentHorseFeedPlanDraftRows = currentHorseFeedPlanRows.map((row) =>
    buildHorseFeedPlanDraftRow({
      row_key: `saved-${row.id}`,
      id: row.id,
      feed_slot: row.feed_slot,
      feed_item_name: row.feed_item_name,
      quantity: row.quantity,
      unit: row.unit,
      auto_deduct_stock: row.auto_deduct_stock,
      notes: row.notes,
    })
  );
  currentHorseFeedCalendar = payload?.feed_calendar || {
    month: selectedHorseFeedCalendarMonth,
    entries: [],
  };
  selectedHorseFeedCalendarMonth = normalizeYearMonth(currentHorseFeedCalendar.month) || currentYearMonthString();

  if (horseFeedCalendarMonthInput) {
    horseFeedCalendarMonthInput.value = selectedHorseFeedCalendarMonth;
  }

  renderHorseFeedPlanRows(currentHorseFeedPlanDraftRows);
  renderHorseFeedCalendar(currentHorseFeedCalendar);
}

function clearHorseFeedPlanningState(options = {}) {
  const resetMonth = options.resetMonth !== false;
  currentHorseFeedPlanRows = [];
  currentHorseFeedPlanDraftRows = [];
  currentHorseFeedCalendar = null;
  if (resetMonth) {
    selectedHorseFeedCalendarMonth = currentYearMonthString();
  }

  if (horseFeedCalendarMonthInput) {
    horseFeedCalendarMonthInput.value = selectedHorseFeedCalendarMonth;
  }

  renderHorseFeedPlanRows([]);
  renderHorseFeedCalendar(null);
  setHorseFeedPlanMessage(
    'Build each slot as a mix for the selected horse, then tick the calendar slots as you feed. Record bale finishes from Stock Action.'
  );
}

function renderDewormingHistoryRows(rows) {
  if (!rows.length) {
    horseDewormingHistoryBody.innerHTML = emptyStateRow(5, 'No deworming history.');
    return;
  }

  horseDewormingHistoryBody.innerHTML = rows
    .map((row) => {
      const status = getDewormRowStatus(row);
      return `
        <tr>
          <td>${escapeHtml(formatDate(row.event_date || row.at))}</td>
          <td>${escapeHtml(row.product_name)}</td>
          <td>${escapeHtml(formatDate(row.second_dose_date) || 'Pending')}</td>
          <td>${escapeHtml(formatDate(row.next_due_date) || '-')}</td>
          <td><span class="badge ${status.badgeClass}">${escapeHtml(status.label)}</span></td>
        </tr>
      `;
    })
    .join('');
}

function renderFarrierHistoryRows(rows) {
  if (!rows.length) {
    horseFarrierHistoryBody.innerHTML = emptyStateRow(3, 'No farrier history.');
    return;
  }

  horseFarrierHistoryBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(formatDateTime(row.at))}</td>
          <td>${escapeHtml(row.service_type)}</td>
          <td>${escapeHtml(formatDate(row.next_due_date) || '-')}</td>
        </tr>
      `
    )
    .join('');
}

function renderHealthHistoryRows(rows) {
  if (!rows.length) {
    horseHealthHistoryBody.innerHTML = emptyStateRow(3, 'No health history.');
    return;
  }

  horseHealthHistoryBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(formatDateTime(row.at))}</td>
          <td>${escapeHtml(row.event_type)}</td>
          <td>${escapeHtml(row.description)}</td>
        </tr>
      `
    )
    .join('');
}

function setHorseCurrentGrazing(currentGrazing) {
  if (!horseHistoryCurrentGrazing) {
    return;
  }

  if (!currentGrazing) {
    horseHistoryCurrentGrazing.textContent = 'Not currently assigned to a paddock.';
    return;
  }

  const groupPart = currentGrazing.source_group_name ? ` via ${currentGrazing.source_group_name}` : '';
  horseHistoryCurrentGrazing.textContent = `Current paddock: ${currentGrazing.paddock_name} since ${formatDate(
    currentGrazing.entered_at
  )} (${currentGrazing.grazing_days} day(s)${groupPart}).`;
}

function formatHorseGroupPreviousSummary(row) {
  if (!row?.previous_group_name) {
    return '-';
  }

  const daysPart = row.previous_group_days == null ? '' : ` (${row.previous_group_days} day(s))`;
  return `${row.previous_group_name}${daysPart}`;
}

function setHorseCurrentGroup(currentGroupMembership) {
  if (!horseHistoryCurrentGroup) {
    return;
  }

  if (!currentGroupMembership) {
    horseHistoryCurrentGroup.textContent = 'Not currently assigned to a horse group.';
    return;
  }

  const previousPart = currentGroupMembership.previous_group_name
    ? ` Previous group: ${formatHorseGroupPreviousSummary(currentGroupMembership)}.`
    : '';
  horseHistoryCurrentGroup.textContent = `Current group: ${
    currentGroupMembership.group_name
  } since ${formatDate(currentGroupMembership.started_at)} (${currentGroupMembership.group_days} day(s)).${previousPart}`;
}

function renderHorseGrazingHistoryRows(rows) {
  if (!rows.length) {
    horseGrazingHistoryBody.innerHTML = emptyStateRow(4, 'No grazing history.');
    return;
  }

  horseGrazingHistoryBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.paddock_name)}</td>
          <td>${escapeHtml(formatDate(row.entered_at))}</td>
          <td>${escapeHtml(row.exited_at ? formatDate(row.exited_at) : 'Current')}</td>
          <td>${escapeHtml(
            `${row.grazing_days || '-'}${row.source_group_name ? ` (${row.source_group_name})` : ''}`
          )}</td>
        </tr>
      `
    )
    .join('');
}

function renderHorseGroupHistoryRows(rows) {
  if (!horseGroupHistoryBody) {
    return;
  }

  if (!rows.length) {
    horseGroupHistoryBody.innerHTML = emptyStateRow(5, 'No group history.');
    return;
  }

  horseGroupHistoryBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.group_name || '-')}</td>
          <td>${escapeHtml(formatDate(row.started_at))}</td>
          <td>${escapeHtml(row.ended_at ? formatDate(row.ended_at) : 'Current')}</td>
          <td>${escapeHtml(String(row.group_days || '-'))}</td>
          <td>${escapeHtml(formatHorseGroupPreviousSummary(row))}</td>
        </tr>
      `
    )
    .join('');
}

function clearHorseCategoryHistories(options = {}) {
  renderFeedHistoryRows([]);
  renderDewormingHistoryRows([]);
  renderFarrierHistoryRows([]);
  renderHealthHistoryRows([]);
  renderHorseGrazingHistoryRows([]);
  renderHorseGroupHistoryRows([]);
  clearHorseFeedPlanningState(options);
  setHorseCurrentGrazing(null);
  setHorseCurrentGroup(null);
}

function renderHorseCategoryHistories(payload) {
  renderFeedHistoryRows(payload.feed_history || []);
  renderDewormingHistoryRows(payload.deworming_history || []);
  renderFarrierHistoryRows(payload.farrier_history || []);
  renderHealthHistoryRows(payload.health_history || []);
  renderHorseGrazingHistoryRows(payload.grazing_history || []);
  renderHorseGroupHistoryRows(payload.group_history || []);
  syncHorseFeedPlanningState(payload);
  setHorseCurrentGrazing(payload.current_grazing || null);
  setHorseCurrentGroup(payload.current_group_membership || null);
}

function populatePaddockSelect(selectElement, rows, options = {}) {
  if (!selectElement) {
    return;
  }

  const previous = selectElement.value;
  const filteredRows = options.activeOnly
    ? rows.filter((row) => row.active)
    : rows;

  if (!filteredRows.length) {
    selectElement.innerHTML = '<option value="">No paddocks</option>';
    selectElement.disabled = true;
    return;
  }

  selectElement.innerHTML = filteredRows
    .map((row) => `<option value="${escapeHtml(row.id)}">${escapeHtml(row.name)}</option>`)
    .join('');

  const hasPrevious = filteredRows.some((row) => String(row.id) === String(previous));
  selectElement.value = hasPrevious ? previous : String(filteredRows[0].id);
  selectElement.disabled = false;
}

function renderPaddockStatusRows(rows) {
  if (!rows.length) {
    paddockStatusBody.innerHTML = emptyStateRow(10, 'No paddocks saved yet.');
    return;
  }

  paddockStatusBody.innerHTML = rows
    .map((row) => {
      let badgeClass = 'neutral';
      let statusLabel = 'Available';

      if (row.occupancy_state === 'occupied') {
        badgeClass = 'ok';
        statusLabel = 'Occupied';
      } else if (row.occupancy_state === 'growing') {
        badgeClass = 'soon';
        statusLabel = 'Growing';
      } else if (row.occupancy_state === 'resting') {
        badgeClass = 'soon';
        statusLabel = 'Resting';
      } else if (row.occupancy_state === 'inactive') {
        badgeClass = 'overdue';
        statusLabel = 'Inactive';
      }

      return `
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.parent_paddock_name || '-')}</td>
          <td>${escapeHtml(row.zone || '-')}</td>
          <td><span class="badge ${badgeClass}">${escapeHtml(statusLabel)}</span></td>
          <td>${escapeHtml(row.occupied_by || '-')}</td>
          <td>${escapeHtml(row.occupied_since ? formatDate(row.occupied_since) : '-')}</td>
          <td>${escapeHtml(row.grazing_days == null ? '-' : String(row.grazing_days))}</td>
          <td>${escapeHtml(row.rest_days == null ? '-' : String(row.rest_days))}</td>
          <td>${escapeHtml(formatPaddockReadySummary(row))}</td>
          <td>
            <button type="button" data-paddock-action="edit" class="inline-action-btn" data-paddock-id="${escapeHtml(row.id)}">
              Edit
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderPaddockWorkHistoryRows(rows) {
  if (!paddockWorkHistoryBody) {
    return;
  }

  if (!rows.length) {
    paddockWorkHistoryBody.innerHTML = emptyStateRow(7, 'No paddock work history yet.');
    return;
  }

  paddockWorkHistoryBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.paddock_name)}</td>
          <td>${escapeHtml(
            row.applies_to_descendants
              ? `${formatPaddockWorkTypeLabel(row.event_type)} (whole block)`
              : formatPaddockWorkTypeLabel(row.event_type)
          )}</td>
          <td>${escapeHtml(formatDate(row.event_date))}</td>
          <td>${escapeHtml(row.ready_to_graze_on ? formatDate(row.ready_to_graze_on) : '-')}</td>
          <td>${escapeHtml(row.ready_after_days == null ? '-' : String(row.ready_after_days))}</td>
          <td>${escapeHtml(row.notes || '-')}</td>
          <td>
            <button type="button" data-paddock-work-action="edit" class="inline-action-btn" data-paddock-work-id="${escapeHtml(row.id)}">
              Edit
            </button>
          </td>
        </tr>
      `
    )
    .join('');
}

function renderGrazingHistoryRows(rows) {
  currentGrazingHistoryRows = rows;

  if (!rows.length) {
    grazingHistoryBody.innerHTML = emptyStateRow(6, 'No grazing history yet.');
    return;
  }

  grazingHistoryBody.innerHTML = rows
    .map((row) => {
      const notes = [row.source_group_name ? `Group: ${row.source_group_name}` : '', row.entry_notes, row.exit_notes]
        .filter(Boolean)
        .join(' | ');
      return `
        <tr>
          <td>${escapeHtml(row.paddock_name)}</td>
          <td>${escapeHtml(row.horse_name)}</td>
          <td>${escapeHtml(formatDate(row.entered_at))}</td>
          <td>${escapeHtml(row.exited_at ? formatDate(row.exited_at) : 'Current')}</td>
          <td>${escapeHtml(String(row.grazing_days || '-'))}</td>
          <td>${escapeHtml(notes || '-')}</td>
        </tr>
      `;
    })
    .join('');
}

function formatHorseGroupCurrentPaddockSummary(row) {
  const currentNames = String(row?.current_paddock_names || '').trim();
  const memberCount = Number(row?.member_count || 0);
  const grazingCount = Number(row?.grazing_member_count || 0);
  const safeGrazingCount = Math.max(0, grazingCount);
  const unassignedCount = Math.max(0, memberCount - safeGrazingCount);
  const summaryParts = [];

  if (currentNames) {
    summaryParts.push(currentNames);
  }

  if (unassignedCount > 0) {
    summaryParts.push(`${unassignedCount} unassigned`);
  }

  if (!summaryParts.length) {
    return '-';
  }

  return summaryParts.join(' + ');
}

function renderHorseGroupRows(rows) {
  if (!horseGroupStatusBody) {
    return;
  }

  if (!rows.length) {
    horseGroupStatusBody.innerHTML = emptyStateRow(6, 'No groups saved yet.');
    return;
  }

  horseGroupStatusBody.innerHTML = rows
    .map((row) => {
      const memberCount = Number(row.member_count || 0);
      const members = memberCount === 1 ? '1 horse' : `${memberCount} horses`;
      return `
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td><span class="badge ${row.active ? 'ok' : 'neutral'}">${escapeHtml(
            row.active ? 'Active' : 'Inactive'
          )}</span></td>
          <td>${escapeHtml(members)}</td>
          <td>${escapeHtml(formatHorseGroupCurrentPaddockSummary(row))}</td>
          <td>${escapeHtml(row.notes || '-')}</td>
          <td class="row-actions">
            <button
              type="button"
              class="inline-action-btn"
              data-group-action="edit"
              data-group-id="${escapeHtml(row.id)}"
            >
              Edit
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

function renderHorseGroupHistoryRegistryRows(rows) {
  if (!horseGroupHistoryRegistryBody) {
    return;
  }

  if (!rows.length) {
    horseGroupHistoryRegistryBody.innerHTML = emptyStateRow(6, 'No horse group history yet.');
    return;
  }

  horseGroupHistoryRegistryBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.horse_name || '-')}</td>
          <td>${escapeHtml(row.group_name || '-')}</td>
          <td>${escapeHtml(formatDate(row.started_at))}</td>
          <td>${escapeHtml(row.ended_at ? formatDate(row.ended_at) : 'Current')}</td>
          <td>${escapeHtml(String(row.group_days || '-'))}</td>
          <td>${escapeHtml(formatHorseGroupPreviousSummary(row))}</td>
        </tr>
      `
    )
    .join('');
}

function populateHorseSelect(rows) {
  const previous = horseSelect?.value || horseProfileSelect?.value || '';

  if (!rows.length) {
    [horseSelect, horseProfileSelect].forEach((selectElement) => {
      if (!selectElement) {
        return;
      }
      selectElement.innerHTML = '<option value="">No horses</option>';
      selectElement.disabled = true;
    });
    setActiveHorseSelection('');
    renderHorseHistoryRows([]);
    clearHorseCategoryHistories();
    populateHorseProfile(null);
    setHorseHistorySelectedName(null);
    return;
  }

  const options = rows
    .map((row) => `<option value="${escapeHtml(row.id)}">${escapeHtml(row.name)}</option>`)
    .join('');
  [horseSelect, horseProfileSelect].forEach((selectElement) => {
    if (!selectElement) {
      return;
    }
    selectElement.innerHTML = options;
    selectElement.disabled = false;
  });

  const hasPrevious = rows.some((row) => String(row.id) === String(previous));
  const selectedHorseId = hasPrevious ? previous : String(rows[0].id);
  setActiveHorseSelection(selectedHorseId);
  setHorseHistorySelectedName(findHorseById(selectedHorseId));
}

function populateHorseRenameSelect(rows) {
  const previous = horseRenameSelect.value;

  if (!rows.length) {
    horseRenameSelect.innerHTML = '<option value="">No horses</option>';
    horseRenameSelect.disabled = true;
    return;
  }

  horseRenameSelect.innerHTML = rows
    .map((row) => `<option value="${escapeHtml(row.id)}">${escapeHtml(row.name)}</option>`)
    .join('');

  const hasPrevious = rows.some((row) => String(row.id) === String(previous));
  horseRenameSelect.value = hasPrevious ? previous : String(rows[0].id);
  horseRenameSelect.disabled = false;
}

function populateSimpleHorseSelect(selectElement, rows) {
  if (!selectElement) {
    return;
  }

  const previous = selectElement.value;

  if (!rows.length) {
    selectElement.innerHTML = '<option value="">No horses</option>';
    selectElement.disabled = true;
    return;
  }

  selectElement.innerHTML = rows
    .map((row) => `<option value="${escapeHtml(row.id)}">${escapeHtml(row.name)}</option>`)
    .join('');

  const hasPrevious = rows.some((row) => String(row.id) === String(previous));
  selectElement.value = hasPrevious ? previous : String(rows[0].id);
  selectElement.disabled = false;
}

function populateSimpleGroupSelect(selectElement, rows, options = {}) {
  if (!selectElement) {
    return;
  }

  const previous = selectElement.value;
  const filteredRows = options.activeOnly ? rows.filter((row) => row.active) : rows;

  if (!filteredRows.length) {
    selectElement.innerHTML = '<option value="">No groups</option>';
    selectElement.disabled = true;
    return;
  }

  selectElement.innerHTML = filteredRows
    .map((row) => `<option value="${escapeHtml(row.id)}">${escapeHtml(row.name)}</option>`)
    .join('');

  const hasPrevious = filteredRows.some((row) => String(row.id) === String(previous));
  selectElement.value = hasPrevious ? previous : String(filteredRows[0].id);
  selectElement.disabled = false;
}

function updateHorseGroupMembersSummary() {
  if (!horseGroupMembersSummary) {
    return;
  }

  const selectedNames = currentHorseRows
    .filter((row) => currentHorseGroupMemberSelection.has(String(row.id)))
    .map((row) => row.name);

  if (selectedNames.length === 0) {
    horseGroupMembersSummary.textContent = 'No horses selected.';
    return;
  }

  if (selectedNames.length <= 4) {
    horseGroupMembersSummary.textContent = `${selectedNames.length} selected: ${selectedNames.join(', ')}`;
    return;
  }

  const previewNames = selectedNames.slice(0, 4).join(', ');
  horseGroupMembersSummary.textContent = `${selectedNames.length} selected: ${previewNames}, +${
    selectedNames.length - 4
  } more`;
}

function renderHorseGroupMembersChecklist(rows = currentHorseRows) {
  if (!horseGroupMembersHorsesList) {
    return;
  }

  const filterValue = String(horseGroupMembersSearchInput?.value || '')
    .trim()
    .toLowerCase();
  const filteredRows = rows.filter((row) => row.name.toLowerCase().includes(filterValue));

  if (!rows.length) {
    horseGroupMembersHorsesList.innerHTML = '<p class="checkbox-list-empty">No horses found.</p>';
    updateHorseGroupMembersSummary();
    return;
  }

  if (!filteredRows.length) {
    horseGroupMembersHorsesList.innerHTML =
      '<p class="checkbox-list-empty">No horses match your search.</p>';
    updateHorseGroupMembersSummary();
    return;
  }

  horseGroupMembersHorsesList.innerHTML = filteredRows
    .map((row) => {
      const horseId = String(row.id);
      const checked = currentHorseGroupMemberSelection.has(horseId) ? ' checked' : '';
      return `
        <label class="checkbox-list-item">
          <input type="checkbox" value="${escapeHtml(horseId)}" data-group-member-checkbox${checked} />
          <span>${escapeHtml(row.name)}</span>
        </label>
      `;
    })
    .join('');

  updateHorseGroupMembersSummary();
}

function syncHorseGroupMembersSelection() {
  const selectedGroupId = String(horseGroupMembersSelect?.value || '');
  const group = currentHorseGroupRows.find((row) => String(row.id) === selectedGroupId);
  currentHorseGroupMemberSelection = new Set(
    (group?.members || []).map((member) => String(member.id))
  );

  if (horseGroupMembersSearchInput) {
    horseGroupMembersSearchInput.value = '';
  }

  renderHorseGroupMembersChecklist(currentHorseRows);
}

function populateHorseActionSelects(rows) {
  [
    feedEntryHorseSelect,
    dewormHorseSelect,
    farrierHorseSelect,
    healthHorseSelect,
    trainingHorseSelect,
    grazingMoveInHorseSelect,
    grazingMoveOutHorseSelect,
  ].forEach((selectElement) => populateSimpleHorseSelect(selectElement, rows));

  const selectedTrainingHorse = findHorseById(trainingHorseSelect.value);
  trainingStatusSelect.value = normalizeTrainingStatus(selectedTrainingHorse?.training_status) || '';
}

function populatePaddockActionSelects(rows) {
  populatePaddockSelect(grazingMoveInPaddockSelect, rows, { activeOnly: true });
  populatePaddockSelect(grazingGroupMoveInPaddockSelect, rows, { activeOnly: true });
  populatePaddockSelect(grazingGroupMoveOutPaddockSelect, rows);
  populatePaddockSelect(paddockWorkPaddockSelect, rows, { activeOnly: true });
  syncPaddockParentSelectOptions(rows);
}

function populateHorseGroupActionSelects(rows) {
  populateSimpleGroupSelect(horseGroupMembersSelect, rows);
  populateSimpleGroupSelect(grazingGroupMoveInGroupSelect, rows, { activeOnly: true });
  populateSimpleGroupSelect(grazingGroupMoveOutGroupSelect, rows);
  syncHorseGroupMembersSelection();
  syncHorseGroupMoveSelectionContext();
}

function populateDewormHistoryHorseFilter(rows) {
  if (!dewormHistoryHorseFilter) {
    return;
  }

  const previous = dewormHistoryHorseFilter.value;
  const options = ['<option value="">All horses</option>'];
  for (const row of rows) {
    options.push(`<option value="${escapeHtml(row.id)}">${escapeHtml(row.name)}</option>`);
  }

  dewormHistoryHorseFilter.innerHTML = options.join('');

  if (previous && rows.some((row) => String(row.id) === String(previous))) {
    dewormHistoryHorseFilter.value = previous;
  } else {
    dewormHistoryHorseFilter.value = '';
  }
}

function applyDewormHistoryFilter() {
  const selectedHorseId = dewormHistoryHorseFilter ? dewormHistoryHorseFilter.value : '';
  const filteredRows = selectedHorseId
    ? currentDewormingHistoryRows.filter((row) => String(row.horse_id) === String(selectedHorseId))
    : currentDewormingHistoryRows;
  renderDewormingHistoryRegistryRows(filteredRows);
}

function populateFarrierHistoryHorseFilter(rows) {
  if (!farrierHistoryHorseFilter) {
    return;
  }

  const previous = farrierHistoryHorseFilter.value;
  const options = ['<option value="">All horses</option>'];
  for (const row of rows) {
    options.push(`<option value="${escapeHtml(row.id)}">${escapeHtml(row.name)}</option>`);
  }

  farrierHistoryHorseFilter.innerHTML = options.join('');

  if (previous && rows.some((row) => String(row.id) === String(previous))) {
    farrierHistoryHorseFilter.value = previous;
  } else {
    farrierHistoryHorseFilter.value = '';
  }
}

function applyFarrierHistoryFilter() {
  const selectedHorseId = farrierHistoryHorseFilter ? farrierHistoryHorseFilter.value : '';
  const filteredRows = selectedHorseId
    ? currentFarrierHistoryRows.filter((row) => String(row.horse_id) === String(selectedHorseId))
    : currentFarrierHistoryRows;
  renderFarrierHistoryRegistryRows(filteredRows);
}

function populateFeedItemOptions(rows) {
  if (!rows.length) {
    feedItemOptions.innerHTML = '';
    return;
  }

  feedItemOptions.innerHTML = rows
    .map((row) => `<option value="${escapeHtml(row.name)}"></option>`)
    .join('');
}

function populateHorseProfile(horse) {
  if (!horse) {
    horseProfileIdInput.value = '';
    horseProfileNameInput.value = '';
    horseProfileDobInput.value = '';
    horseProfileAgeInput.value = '';
    horseProfileColorInput.value = '';
    horseProfileActivityInput.value = '';
    horseProfileSexInput.value = '';
    horseProfileTrainingStatusInput.value = '';
    return;
  }

  const normalizedDob = normalizeDateForDateInput(horse.date_of_birth);

  horseProfileIdInput.value = String(horse.id || '');
  horseProfileNameInput.value = horse.name || '';
  horseProfileDobInput.value = normalizedDob;
  horseProfileAgeInput.value =
    horse.age_years == null ? computeAgeYears(normalizedDob) : String(horse.age_years);
  horseProfileColorInput.value = horse.color || '';
  horseProfileActivityInput.value = horse.activity || '';
  horseProfileSexInput.value = horse.sex || '';
  horseProfileTrainingStatusInput.value = normalizeTrainingStatus(horse.training_status);
}

function getAuthHeaders() {
  return {};
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (_error) {
    data = { ok: false, error: `Request failed (${response.status})` };
  }

  if (!response.ok || !data.ok) {
    const errorMessage = data?.error || `Request failed (${response.status})`;
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return data;
}

function handleAuthError(error, fallbackMessage) {
  if (Number(error?.status) !== 401) {
    return false;
  }

  setSessionAuthState(false);
  setStatus(fallbackMessage || 'Session expired. Please log in again.', true);
  return true;
}

async function syncSessionState() {
  try {
    const response = await fetch(SESSION_API_URL, { cache: 'no-store' });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      const error = new Error(payload?.error || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }

    if (payload.authenticated) {
      setSessionAuthState(true, payload.username || null);
    } else {
      setSessionAuthState(false);
    }

    return payload;
  } catch (_error) {
    setSessionAuthState(false);
    return null;
  }
}

function clearDashboardView() {
  latestDashboardPayload = null;
  currentHorseRows = [];
  currentHorseGroupRows = [];
  currentPaddockRows = [];
  currentPaddockWorkRows = [];
  currentFarmSettings = null;
  currentAdminModuleSettings = getDefaultAdminModuleSettings();
  currentFeedHistoryRows = [];
  currentGrazingHistoryRows = [];
  currentDewormingHistoryRows = [];
  currentFarrierHistoryRows = [];
  currentHorseGroupMemberSelection = new Set();
  clearHorseGroupEditState();
  clearPaddockEditState();
  clearPaddockWorkEditState();
  lastUpdated.textContent = '-';
  summaryCards.innerHTML = '';
  dewormingBody.innerHTML = emptyStateRow(4, 'Log in to view data.');
  renderDewormingHistoryRegistryRows([]);
  populateDewormHistoryHorseFilter([]);
  renderFarrierHistoryRegistryRows([]);
  populateFarrierHistoryHorseFilter([]);
  farrierBody.innerHTML = emptyStateRow(4, 'Log in to view data.');
  lowStockBody.innerHTML = emptyStateRow(2, 'Log in to view data.');
  allStockBody.innerHTML = emptyStateRow(2, 'Log in to view data.');
  rainBody.innerHTML = emptyStateRow(6, 'Log in to view data.');
  if (rainYearlyBody) {
    rainYearlyBody.innerHTML = emptyStateRow(6, 'Log in to view data.');
  }
  activityBody.innerHTML = emptyStateRow(4, 'Log in to view data.');
  if (horseGroupStatusBody) {
    horseGroupStatusBody.innerHTML = emptyStateRow(6, 'Log in to view data.');
  }
  if (horseGroupHistoryRegistryBody) {
    horseGroupHistoryRegistryBody.innerHTML = emptyStateRow(6, 'Log in to view data.');
  }
  paddockStatusBody.innerHTML = emptyStateRow(10, 'Log in to view data.');
  if (paddockWorkHistoryBody) {
    paddockWorkHistoryBody.innerHTML = emptyStateRow(7, 'Log in to view data.');
  }
  grazingHistoryBody.innerHTML = emptyStateRow(6, 'Log in to view data.');
  horsesInTrainingBody.innerHTML = emptyStateRow(3, 'Log in to view data.');
  horsesBreakingInBody.innerHTML = emptyStateRow(3, 'Log in to view data.');
  renderHorseHistoryRows([]);
  clearHorseCategoryHistories();
  populateFarmSettings(null);
  populateHorseSelect([]);
  populateHorseRenameSelect([]);
  populateHorseActionSelects([]);
  populateHorseGroupActionSelects([]);
  populatePaddockActionSelects([]);
  renderHorseGroupMembersChecklist([]);
  populateFeedItemOptions([]);
  populateHorseProfile(null);
  renderAdminModuleSettings();
  applyAdminModuleVisibility();
  renderRainChartEmpty('Log in to view rain data.');
}

async function loadSelectedHorseHistory() {
  const horseId = horseSelect?.value || horseProfileSelect?.value || '';
  if (!horseId) {
    setActiveHorseSelection('');
    renderHorseHistoryRows([]);
    clearHorseCategoryHistories();
    populateHorseProfile(null);
    setHorseHistorySelectedName(null);
    return { ok: true };
  }

  setActiveHorseSelection(horseId);
  selectedHorseFeedCalendarMonth =
    normalizeYearMonth(selectedHorseFeedCalendarMonth) || currentYearMonthString();
  const horseFromList = findHorseById(horseId);
  if (horseFromList) {
    populateHorseProfile(horseFromList);
    setHorseHistorySelectedName(horseFromList);
  }

  try {
    const query = new URLSearchParams({
      horseId: String(horseId),
      month: selectedHorseFeedCalendarMonth,
    });
    const response = await fetch(`${HORSE_HISTORY_API_URL}?${query.toString()}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      const errorMessage = payload.error || `Request failed (${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    renderHorseHistoryRows(payload.history || []);
    renderHorseCategoryHistories(payload);
    if (payload.horse) {
      setActiveHorseSelection(payload.horse.id || horseId);
      populateHorseProfile(payload.horse);
      setHorseHistorySelectedName(payload.horse);
    }
    return { ok: true };
  } catch (error) {
    renderHorseHistoryRows([]);
    clearHorseCategoryHistories({ resetMonth: false });
    if (handleAuthError(error, 'Session expired. Please log in to view horse history.')) {
      return { ok: false, error };
    }
    return { ok: false, error };
  }
}

function renderActivityRows(rows) {
  if (!rows.length) {
    activityBody.innerHTML = emptyStateRow(4, 'No recent activity found.');
    return;
  }

  activityBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(formatDateTime(row.at))}</td>
          <td>${escapeHtml(row.category)}</td>
          <td>${escapeHtml(row.horse_name || '-')}</td>
          <td>${escapeHtml(row.detail)}</td>
        </tr>
      `
    )
    .join('');
}

async function loadDashboard(options = {}) {
  const silent = Boolean(options?.silent);

  if (!sessionAuthenticated) {
    setStatus('Please log in to access the admin dashboard.', true);
    clearDashboardView();
    return;
  }

  if (!silent) {
    setStatus('Refreshing dashboard...');
  }

  try {
    const response = await fetch(API_URL, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      const errorMessage = payload.error || `Request failed (${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    latestDashboardPayload = payload;
    populateFarmSettings(payload.farm_settings || null);
    syncAdminModuleSettings(payload.module_settings || getDefaultAdminModuleSettings());
    renderSummary(payload);

    const dewormRows = mergeReminderRows(payload.reminders.deworming);
    const farrierRows = mergeReminderRows(payload.reminders.farrier);

    renderReminderRows(dewormingBody, dewormRows, 'deworming');
    renderReminderRows(farrierBody, farrierRows, 'farrier');
    renderStockRows(lowStockBody, payload.stock.low, 'No low stock items.');
    renderStockRows(allStockBody, payload.stock.all, 'No inventory data.');
    renderRainRows(payload.rain?.recent || []);
    renderRainYearlyRows(payload.rain?.yearly || []);
    renderRainChart(payload.rain || null);
    renderActivityRows(payload.recent_activity);
    currentHorseRows = payload.horses || [];
    currentHorseGroupRows = payload.horse_groups || [];
    currentPaddockRows = payload.paddocks || [];
    currentPaddockWorkRows = payload.paddock_work_history || [];
    currentHorseRows = currentHorseRows.map((horse) => ({
      ...horse,
      training_status: normalizeTrainingStatus(horse.training_status),
    }));
    renderHorseGroupRows(currentHorseGroupRows);
    renderHorseGroupHistoryRegistryRows(payload.horse_group_history || []);
    renderPaddockStatusRows(currentPaddockRows);
    renderPaddockWorkHistoryRows(currentPaddockWorkRows);
    renderGrazingHistoryRows(payload.grazing_history || []);
    currentDewormingHistoryRows = payload.deworming_history || [];
    currentFarrierHistoryRows = payload.farrier_history_registry || [];
    populateDewormHistoryHorseFilter(currentHorseRows);
    populateFarrierHistoryHorseFilter(currentHorseRows);
    applyDewormHistoryFilter();
    applyFarrierHistoryFilter();
    const horsesInTraining =
      payload.training?.in_training ||
      currentHorseRows.filter((horse) => normalizeTrainingStatus(horse.training_status) === 'in training');
    const horsesBreakingIn =
      payload.training?.breaking_in ||
      currentHorseRows.filter((horse) => normalizeTrainingStatus(horse.training_status) === 'breaking in');
    renderTrainingHorseRows(horsesInTrainingBody, horsesInTraining, 'No horses in training.');
    renderTrainingHorseRows(horsesBreakingInBody, horsesBreakingIn, 'No horses breaking in.');
    populateHorseSelect(currentHorseRows);
    populateHorseRenameSelect(currentHorseRows);
    populateHorseActionSelects(currentHorseRows);
    populateHorseGroupActionSelects(currentHorseGroupRows);
    populatePaddockActionSelects(currentPaddockRows);
    populateFeedItemOptions(payload.stock?.all || []);
    const horseHistoryResult = await loadSelectedHorseHistory();

    const updatedAt = payload.meta?.refreshed_at || new Date().toISOString();
    lastUpdated.textContent = `Last updated: ${formatDateTime(updatedAt)}`;
    if (!horseHistoryResult.ok) {
      setStatus(`Dashboard loaded, but history failed: ${horseHistoryResult.error.message}`, true);
      return;
    }

    if (!silent) {
      setStatus('Dashboard is up to date.');
    }
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to continue.')) {
      clearDashboardView();
      return;
    }
    setStatus(`Dashboard error: ${error.message}`, true);
  }
}

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (sessionAuthenticated) {
    await loadDashboard();
    return;
  }

  const username = loginUsernameInput.value.trim();
  const password = loginPasswordInput.value;

  if (!username || !password) {
    setStatus('Enter username and password.', true);
    return;
  }

  try {
    const data = await postJson(LOGIN_API_URL, { username, password });
    setSessionAuthState(true, data.username || username);
    setStatus(`Logged in as ${data.username || username}.`);
    await loadDashboard();
  } catch (error) {
    setSessionAuthState(false);
    setStatus(`Login failed: ${error.message}`, true);
  }
});

logoutButton.addEventListener('click', async () => {
  try {
    await postJson(LOGOUT_API_URL, {});
  } catch (_error) {
    // Clear local UI even if logout API fails.
  }

  setSessionAuthState(false);
  clearDashboardView();
  setStatus('Logged out.');
});

refreshButton.addEventListener('click', () => {
  loadDashboard();
});

if (farmSettingsForm) {
  farmSettingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const data = await postJson(DATA_MUTATE_API_URL, {
        action: 'farm_settings_save',
        farmName: farmNameInput.value.trim() || undefined,
        weatherLatitude: farmWeatherLatitudeInput.value || undefined,
        weatherLongitude: farmWeatherLongitudeInput.value || undefined,
        weatherTimezone: farmWeatherTimezoneInput.value.trim() || undefined,
        weatherSyncDays: farmWeatherSyncDaysInput.value || undefined,
        telegramAlertChatId: farmTelegramAlertChatIdInput.value.trim() || undefined,
      });

      populateFarmSettings(data.farm_settings || null);
      setActionMessage('Farm setup saved.', false, { card: 'action-card-farm-setup' });
      await loadDashboard();
    } catch (error) {
      if (handleAuthError(error, 'Session expired. Please log in to save farm setup.')) {
        clearDashboardView();
        return;
      }
      setActionMessage(`Save farm setup failed: ${error.message}`, true, {
        card: 'action-card-farm-setup',
      });
    }
  });
}

if (adminModulesForm) {
  adminModulesForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const modules = normalizeAdminModuleSettings(currentAdminModuleSettings).map((module) => {
        const checkbox = adminModulesForm.querySelector(`input[name="moduleKey"][value="${module.key}"]`);
        return {
          key: module.key,
          enabled: checkbox ? checkbox.checked : module.enabled,
        };
      });

      const data = await postJson(DATA_MUTATE_API_URL, {
        action: 'admin_modules_save',
        modules,
      });

      syncAdminModuleSettings(data.module_settings || modules);
      setAdminModulesMessage('Admin modules saved.');
      setActionMessage('Admin modules updated.');
      await loadDashboard();
    } catch (error) {
      if (handleAuthError(error, 'Session expired. Please log in to save admin modules.')) {
        clearDashboardView();
        return;
      }
      setAdminModulesMessage(`Save failed: ${error.message}`, true);
      setActionMessage(`Save admin modules failed: ${error.message}`, true);
    }
  });
}

if (dewormHistoryHorseFilter) {
  dewormHistoryHorseFilter.addEventListener('change', () => {
    applyDewormHistoryFilter();
  });
}

if (dewormHistoryResetButton) {
  dewormHistoryResetButton.addEventListener('click', () => {
    if (dewormHistoryHorseFilter) {
      dewormHistoryHorseFilter.value = '';
    }
    applyDewormHistoryFilter();
  });
}

if (farrierHistoryHorseFilter) {
  farrierHistoryHorseFilter.addEventListener('change', () => {
    applyFarrierHistoryFilter();
  });
}

if (farrierHistoryResetButton) {
  farrierHistoryResetButton.addEventListener('click', () => {
    if (farrierHistoryHorseFilter) {
      farrierHistoryHorseFilter.value = '';
    }
    applyFarrierHistoryFilter();
  });
}

if (rainWindowControls) {
  rainWindowControls.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-rain-window]');
    if (!button) {
      return;
    }

    const nextWindow = button.getAttribute('data-rain-window');
    if (!RAIN_WINDOW_CONFIG[nextWindow]) {
      return;
    }

    selectedRainWindow = nextWindow;
    renderRainChart(latestDashboardPayload?.rain || null);
  });
}

if (horseSelect) {
  horseSelect.addEventListener('change', async () => {
    setActiveHorseSelection(horseSelect.value);
    const result = await loadSelectedHorseHistory();
    if (!result.ok) {
      setStatus(`History error: ${result.error.message}`, true);
      return;
    }
    setStatus('Horse selected.');
  });
}

if (horseProfileSelect) {
  horseProfileSelect.addEventListener('change', async () => {
    setActiveHorseSelection(horseProfileSelect.value);
    const result = await loadSelectedHorseHistory();
    if (!result.ok) {
      setStatus(`History error: ${result.error.message}`, true);
      return;
    }
    setStatus('Horse selected.');
  });
}

trainingHorseSelect.addEventListener('change', () => {
  const selectedHorse = findHorseById(trainingHorseSelect.value);
  trainingStatusSelect.value = normalizeTrainingStatus(selectedHorse?.training_status) || '';
});

if (horseGroupMembersSelect) {
  horseGroupMembersSelect.addEventListener('change', () => {
    syncHorseGroupMembersSelection();
  });
}

if (grazingGroupMoveInGroupSelect) {
  grazingGroupMoveInGroupSelect.addEventListener('change', () => {
    syncHorseGroupMoveSelectionContext();
  });
}

if (horseGroupMembersSearchInput) {
  horseGroupMembersSearchInput.addEventListener('input', () => {
    renderHorseGroupMembersChecklist(currentHorseRows);
  });
}

if (horseGroupMembersHorsesList) {
  horseGroupMembersHorsesList.addEventListener('change', (event) => {
    const checkbox = event.target.closest('input[data-group-member-checkbox]');
    if (!checkbox) {
      return;
    }

    const horseId = String(checkbox.value);
    if (checkbox.checked) {
      currentHorseGroupMemberSelection.add(horseId);
    } else {
      currentHorseGroupMemberSelection.delete(horseId);
    }

    updateHorseGroupMembersSummary();
  });
}

if (horseGroupStatusBody) {
  horseGroupStatusBody.addEventListener('click', (event) => {
    const editButton = event.target.closest('button[data-group-action="edit"]');
    if (!editButton) {
      return;
    }

    const groupId = editButton.getAttribute('data-group-id');
    const group = findHorseGroupById(groupId);
    if (!group) {
      setActionMessage('That group is no longer available to edit.', true, {
        card: 'action-card-horse-groups',
      });
      return;
    }

    setHorseGroupEditState(group, { scroll: false, focusName: false });
    const moveReady = focusHorseGroupMoveSection(group);
    setActionMessage(
      moveReady
        ? `Ready for ${group.name}. Choose destination paddock and move date, then move it or correct its current paddock history.`
        : `Editing group: ${group.name}. Activate it first if you want to move it to a paddock.`,
      false,
      {
        card: 'action-card-horse-groups',
      }
    );
  });
}

if (paddockStatusBody) {
  paddockStatusBody.addEventListener('click', (event) => {
    const editButton = event.target.closest('button[data-paddock-action="edit"]');
    if (!editButton) {
      return;
    }

    const paddockId = editButton.getAttribute('data-paddock-id');
    const paddock = findPaddockById(paddockId);
    if (!paddock) {
      setActionMessage('That paddock is no longer available to edit.', true, {
        card: 'action-card-paddocks',
      });
      return;
    }

    expandPanelForElement(actionHubPanel);
    expandActionCard(document.getElementById('action-card-paddocks'));
    setPaddockEditState(paddock, { scroll: true, focusName: true });
    setActionMessage(`Editing paddock: ${paddock.name}. Update it and save when ready.`, false, {
      card: 'action-card-paddocks',
    });
  });
}

if (paddockWorkHistoryBody) {
  paddockWorkHistoryBody.addEventListener('click', (event) => {
    const editButton = event.target.closest('button[data-paddock-work-action="edit"]');
    if (!editButton) {
      return;
    }

    const eventId = editButton.getAttribute('data-paddock-work-id');
    const workRow = findPaddockWorkById(eventId);
    if (!workRow) {
      setActionMessage('That field-work entry is no longer available to edit.', true, {
        card: 'action-card-paddocks',
      });
      return;
    }

    expandPanelForElement(actionHubPanel);
    expandActionCard(document.getElementById('action-card-paddocks'));
    setPaddockWorkEditState(workRow, { scroll: true, focus: true });
    setActionMessage(
      `Editing field work for ${workRow.paddock_name}. Update the scope, dates, or wait days, then save.`,
      false,
      {
        card: 'action-card-paddocks',
      }
    );
  });
}

if (horseGroupCancelEditButton) {
  horseGroupCancelEditButton.addEventListener('click', () => {
    clearHorseGroupEditState({ focus: true });
    setActionMessage('Group edit canceled.', false, {
      card: 'action-card-horse-groups',
    });
  });
}

if (paddockCancelEditButton) {
  paddockCancelEditButton.addEventListener('click', () => {
    clearPaddockEditState({ focus: true });
    setActionMessage('Paddock edit canceled.', false, {
      card: 'action-card-paddocks',
    });
  });
}

if (paddockWorkCancelEditButton) {
  paddockWorkCancelEditButton.addEventListener('click', () => {
    clearPaddockWorkEditState({ focus: true });
    setActionMessage('Field-work edit canceled.', false, {
      card: 'action-card-paddocks',
    });
  });
}

if (horseFeedPlanBody) {
  horseFeedPlanBody.addEventListener('input', (event) => {
    const fieldElement = event.target.closest('[data-feed-plan-field]');
    if (!fieldElement) {
      return;
    }

    const rowKey = fieldElement.getAttribute('data-feed-plan-row-key');
    const field = fieldElement.getAttribute('data-feed-plan-field');
    const rawValue =
      fieldElement instanceof HTMLInputElement && fieldElement.type === 'checkbox'
        ? fieldElement.checked
        : fieldElement.value;

    updateHorseFeedPlanDraftRow(rowKey, field, rawValue);
  });

  horseFeedPlanBody.addEventListener('change', (event) => {
    const fieldElement = event.target.closest('[data-feed-plan-field]');
    if (!fieldElement) {
      return;
    }

    const rowKey = fieldElement.getAttribute('data-feed-plan-row-key');
    const field = fieldElement.getAttribute('data-feed-plan-field');
    const rawValue =
      fieldElement instanceof HTMLInputElement && fieldElement.type === 'checkbox'
        ? fieldElement.checked
        : fieldElement.value;
    const updateResult = updateHorseFeedPlanDraftRow(rowKey, field, rawValue);

    if (updateResult.didAutoFillUnit || updateResult.didToggleStock) {
      renderHorseFeedPlanRows(currentHorseFeedPlanDraftRows);
    }
  });

  horseFeedPlanBody.addEventListener('click', (event) => {
    const addButton = event.target.closest('button[data-feed-plan-action="add-slot-row"]');
    if (addButton) {
      const horseId = horseSelect?.value || horseProfileSelect?.value || '';
      if (!horseId) {
        setHorseFeedPlanMessage('Choose a horse before adding mix ingredients.', true);
        return;
      }

      const feedSlot = addButton.getAttribute('data-feed-plan-slot');
      currentHorseFeedPlanDraftRows.push(buildHorseFeedPlanDraftRowForSlot(feedSlot));
      renderHorseFeedPlanRows(currentHorseFeedPlanDraftRows);
      setHorseFeedPlanMessage(
        `${getFeedSlotLabel(feedSlot)} ingredient added. Fill it in, then save the feed plan.`
      );
      return;
    }

    const removeButton = event.target.closest('button[data-feed-plan-action="remove"]');
    if (!removeButton) {
      return;
    }

    const rowKey = removeButton.getAttribute('data-feed-plan-row-key');
    currentHorseFeedPlanDraftRows = currentHorseFeedPlanDraftRows.filter(
      (row) => row.row_key !== rowKey
    );
    renderHorseFeedPlanRows(currentHorseFeedPlanDraftRows);
    setHorseFeedPlanMessage('Mix ingredient removed. Save to apply the change.');
  });
}

if (horseFeedPlanForm) {
  horseFeedPlanForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const horseId = horseSelect?.value || horseProfileSelect?.value || '';
    if (!horseId) {
      setHorseFeedPlanMessage('Choose a horse before saving a feed plan.', true);
      return;
    }

    try {
      pauseDashboardAutoRefresh();
      const items = buildHorseFeedPlanSaveItems();
      const data = await postJson(DATA_MUTATE_API_URL, {
        action: 'horse_feed_plan_save',
        horseId,
        items,
      });

      setHorseFeedPlanMessage(
        items.length > 0
          ? `Feed plan saved for ${data.horse.name}.`
          : `Feed plan cleared for ${data.horse.name}.`
      );

      const historyResult = await loadSelectedHorseHistory();
      if (!historyResult.ok) {
        setStatus(`History error: ${historyResult.error.message}`, true);
      }
    } catch (error) {
      if (handleAuthError(error, 'Session expired. Please log in to save feed plans.')) {
        clearDashboardView();
        return;
      }
      setHorseFeedPlanMessage(`Save failed: ${error.message}`, true);
    }
  });
}

if (horseFeedCalendarMonthInput) {
  horseFeedCalendarMonthInput.addEventListener('change', async () => {
    const nextMonth = normalizeYearMonth(horseFeedCalendarMonthInput.value);
    if (!nextMonth) {
      horseFeedCalendarMonthInput.value = selectedHorseFeedCalendarMonth;
      return;
    }

    selectedHorseFeedCalendarMonth = nextMonth;
    const result = await loadSelectedHorseHistory();
    if (!result.ok) {
      setStatus(`History error: ${result.error.message}`, true);
      return;
    }

    setHorseFeedPlanMessage(`Showing ${selectedHorseFeedCalendarMonth} feed calendar.`);
  });
}

if (horseFeedCalendarTodayButton) {
  horseFeedCalendarTodayButton.addEventListener('click', async () => {
    selectedHorseFeedCalendarMonth = currentYearMonthString();
    if (horseFeedCalendarMonthInput) {
      horseFeedCalendarMonthInput.value = selectedHorseFeedCalendarMonth;
    }

    const result = await loadSelectedHorseHistory();
    if (!result.ok) {
      setStatus(`History error: ${result.error.message}`, true);
      return;
    }

    setHorseFeedPlanMessage('Showing the current month feed calendar.');
  });
}

if (horseFeedCalendarGrid) {
  horseFeedCalendarGrid.addEventListener('change', async (event) => {
    const checkbox = event.target.closest('input[data-feed-calendar-toggle]');
    if (!checkbox) {
      return;
    }

    const horseId = horseSelect?.value || horseProfileSelect?.value || '';
    const feedSlot = checkbox.getAttribute('data-feed-calendar-slot');
    const eventDate = checkbox.getAttribute('data-feed-calendar-date');
    const checked = checkbox.checked;

    if (!horseId || !feedSlot || !eventDate) {
      checkbox.checked = !checked;
      setHorseFeedPlanMessage('Choose a horse and save a feed plan before using the calendar.', true);
      return;
    }

    pauseDashboardAutoRefresh();
    checkbox.disabled = true;

    try {
      const data = await postJson(DATA_MUTATE_API_URL, {
        action: 'horse_feed_slot_toggle',
        horseId,
        feedSlot,
        eventDate,
        checked,
      });

      setHorseFeedPlanMessage(
        `${getFeedSlotLabel(feedSlot)} ${checked ? 'checked' : 'unchecked'} for ${formatDate(
          eventDate
        )}.${formatHorseFeedCalendarStockSummary(data.stock_changes)}`
      );
      applyStockChangesToCachedDashboard(data.stock_changes);
      const historyResult = await loadSelectedHorseHistory();
      if (!historyResult.ok) {
        setStatus(`History error: ${historyResult.error.message}`, true);
      }
    } catch (error) {
      checkbox.checked = !checked;
      if (handleAuthError(error, 'Session expired. Please log in to use the feed calendar.')) {
        clearDashboardView();
        return;
      }
      setHorseFeedPlanMessage(`Calendar update failed: ${error.message}`, true);
    } finally {
      checkbox.disabled = false;
    }
  });
}

horseFeedHistoryBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-feed-action]');
  if (!button) {
    return;
  }

  const feedAction = button.getAttribute('data-feed-action');
  const feedEventId = button.getAttribute('data-feed-event-id');
  const feedEventRow = findFeedHistoryById(feedEventId);

  if (!feedEventId || !feedEventRow) {
    setHorseProfileMessage('Feed event not found in current table.', true);
    return;
  }

  if (feedAction === 'edit') {
    const quantityInput = window.prompt('New quantity', String(feedEventRow.quantity));
    if (quantityInput == null) {
      return;
    }

    const nextQuantity = Number(quantityInput.trim());
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      setHorseProfileMessage('Quantity must be a number greater than 0.', true);
      return;
    }

    const defaultDate = normalizeDateForDateInput(feedEventRow.event_date || feedEventRow.at);
    const dateInput = window.prompt('Date (YYYY-MM-DD)', defaultDate);
    if (dateInput == null) {
      return;
    }

    const nextDate = dateInput.trim();

    try {
      const data = await postJson(DATA_MUTATE_API_URL, {
        action: 'feed_event_update',
        horseId: horseSelect.value,
        feedEventId,
        quantity: nextQuantity,
        eventDate: nextDate || undefined,
      });

      setHorseProfileMessage(
        `Feed updated. ${data.stock.feed_item_name}: ${data.stock.current_stock} ${data.stock.unit} remaining.`
      );
      await loadDashboard();
    } catch (error) {
      if (handleAuthError(error, 'Session expired. Please log in to edit feed history.')) {
        clearDashboardView();
        return;
      }
      setHorseProfileMessage(`Edit failed: ${error.message}`, true);
    }
    return;
  }

  if (feedAction === 'delete') {
    const confirmed = window.confirm(
      `Delete this feed event (${feedEventRow.feed_item} ${feedEventRow.quantity} ${feedEventRow.unit})?`
    );
    if (!confirmed) {
      return;
    }

    try {
      const data = await postJson(DATA_MUTATE_API_URL, {
        action: 'feed_event_delete',
        horseId: horseSelect.value,
        feedEventId,
      });

      setHorseProfileMessage(
        `Feed event deleted. ${data.stock.feed_item_name}: ${data.stock.current_stock} ${data.stock.unit} remaining.`
      );
      await loadDashboard();
    } catch (error) {
      if (handleAuthError(error, 'Session expired. Please log in to delete feed history.')) {
        clearDashboardView();
        return;
      }
      setHorseProfileMessage(`Delete failed: ${error.message}`, true);
    }
  }
});

stockActionType.addEventListener('change', () => {
  stockQuantityInput.min = stockActionType.value === 'set' ? '0' : '0.01';
});

stockActionForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const payload = {
      action: stockActionType.value,
      itemName: stockItemInput.value.trim(),
      quantity: Number(stockQuantityInput.value),
      unit: stockUnitInput.value.trim(),
      eventDate: stockDateInput.value || undefined,
      notes: stockNotesInput.value.trim() || undefined,
    };

    const data = await postJson(STOCK_MUTATE_API_URL, payload);

    setActionMessage(
      `Stock ${data.action} applied to ${data.item.name}. New stock: ${data.item.current_stock} ${data.item.unit}`
    );
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to change stock.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Stock action failed: ${error.message}`, true);
  }
});

horseAddForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'horse_add',
      horseName: horseAddInput.value.trim(),
    });

    horseAddInput.value = '';
    setActionMessage(`Horse added: ${data.horse.name} (ID ${data.horse.id})`);
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to add horses.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Add horse failed: ${error.message}`, true);
  }
});

horseRenameForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'horse_rename',
      horseId: horseRenameSelect.value,
      newName: horseRenameInput.value.trim(),
    });

    horseRenameInput.value = '';
    setActionMessage(`Horse renamed to: ${data.horse.name}`);
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to rename horses.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Rename horse failed: ${error.message}`, true);
  }
});

horseGroupSaveForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const editingGroupId = horseGroupIdInput?.value || '';
    const previousGroup = editingGroupId ? findHorseGroupById(editingGroupId) : null;

    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'horse_group_save',
      groupId: editingGroupId || undefined,
      groupName: horseGroupNameInput.value.trim(),
      notes: horseGroupNotesInput.value.trim() || undefined,
      active: horseGroupActiveSelect.value,
    });

    clearHorseGroupEditState();

    if (previousGroup && previousGroup.name !== data.group.name) {
      setActionMessage(`Group renamed: ${previousGroup.name} -> ${data.group.name}`);
    } else {
      setActionMessage(`Group ${data.mode === 'created' ? 'saved' : 'updated'}: ${data.group.name}`);
    }

    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to save groups.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Save group failed: ${error.message}`, true);
  }
});

horseGroupMembersForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const selectedHorseIds = [...currentHorseGroupMemberSelection];
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'horse_group_memberships_set',
      groupId: horseGroupMembersSelect.value,
      horseIds: selectedHorseIds,
    });

    const reassignedCount = Array.isArray(data.reassigned_members) ? data.reassigned_members.length : 0;
    const removedCount = Array.isArray(data.removed_members) ? data.removed_members.length : 0;
    const reassignedSample = reassignedCount > 0 ? data.reassigned_members[0] : null;
    const removedSample = removedCount > 0 ? data.removed_members[0] : null;
    const reassignedMessage =
      reassignedCount > 0
        ? ` ${reassignedCount} horse(s) were moved from another group${
            reassignedSample?.previous_group_name
              ? `, starting with ${reassignedSample.horse_name} from ${
                  reassignedSample.previous_group_name
                }${reassignedSample.previous_group_days == null ? '' : ` after ${reassignedSample.previous_group_days} day(s)`}`
              : ''
          }.`
        : '';
    const removedMessage =
      removedCount > 0
        ? ` ${removedCount} horse(s) were removed from ${data.group.name}${
            removedSample?.horse_name
              ? `, starting with ${removedSample.horse_name}${
                  removedSample.previous_group_days == null ? '' : ` after ${removedSample.previous_group_days} day(s)`
                }`
              : ''
          }.`
        : '';
    setActionMessage(
      `Saved ${data.members.length} horse(s) in ${data.group.name}.${reassignedMessage}${removedMessage}`
    );
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to update group members.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Save members failed: ${error.message}`, true);
  }
});

if (paddockNameInput) {
  paddockNameInput.addEventListener('input', () => {
    syncPaddockParentSelectOptions();
  });
}

paddockSaveForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'paddock_save',
      paddockName: paddockNameInput.value.trim(),
      zone: paddockZoneInput.value.trim() || undefined,
      sizeHa: paddockSizeInput.value.trim() || undefined,
      notes: paddockNotesInput.value.trim() || undefined,
      active: paddockActiveSelect.value,
      parentPaddockId: paddockParentSelect.value || undefined,
    });

    clearPaddockEditState();
    setActionMessage(
      `Paddock ${data.mode === 'created' ? 'saved' : 'updated'}: ${data.paddock.name}${
        data.paddock.parent_paddock_name ? ` under ${data.paddock.parent_paddock_name}` : ''
      }`
    );
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to save paddocks.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Save paddock failed: ${error.message}`, true);
  }
});

paddockWorkForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const editingEventId = paddockWorkEventIdInput?.value || '';
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: editingEventId ? 'paddock_work_update' : 'paddock_work_save',
      eventId: editingEventId || undefined,
      paddockId: paddockWorkPaddockSelect.value,
      applyScope: paddockWorkScopeSelect?.value || 'single',
      eventType: paddockWorkTypeSelect.value,
      eventDate: paddockWorkDateInput.value || undefined,
      readyAfterDays: paddockWorkReadyDaysInput.value.trim() || undefined,
      notes: paddockWorkNotesInput.value.trim() || undefined,
    });

    clearPaddockWorkEditState();
    const workScopeLabel = data.paddock_work_event.applies_to_descendants ? ' for the whole block' : '';
    setActionMessage(
      data.paddock_work_event.ready_to_graze_on
        ? `${data.paddock.name} ${formatPaddockWorkTypeLabel(
            data.paddock_work_event.event_type
          ).toLowerCase()} ${editingEventId ? 'updated' : 'saved'}${workScopeLabel}. Ready to graze on ${formatDate(
            data.paddock_work_event.ready_to_graze_on
          )}.`
        : `${data.paddock.name} ${formatPaddockWorkTypeLabel(
            data.paddock_work_event.event_type
          ).toLowerCase()} ${editingEventId ? 'updated' : 'saved'}${workScopeLabel}.`
    );
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to save paddock work.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Save paddock work failed: ${error.message}`, true);
  }
});

grazingMoveInForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'grazing_move_in',
      horseId: grazingMoveInHorseSelect.value,
      paddockId: grazingMoveInPaddockSelect.value,
      eventDate: grazingMoveInDateInput.value || undefined,
      notes: grazingMoveInNotesInput.value.trim() || undefined,
    });

    grazingMoveInNotesInput.value = '';
    setActionMessage(
      `${data.horse.name} moved into ${data.paddock.name} on ${formatDate(data.grazing_event.entered_at)}.`
    );
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to record grazing moves.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Move in failed: ${error.message}`, true);
  }
});

grazingMoveOutForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'grazing_move_out',
      horseId: grazingMoveOutHorseSelect.value,
      eventDate: grazingMoveOutDateInput.value || undefined,
      notes: grazingMoveOutNotesInput.value.trim() || undefined,
    });

    grazingMoveOutNotesInput.value = '';
    setActionMessage(
      `${data.horse.name} moved out of ${data.paddock.name} on ${formatDate(
        data.grazing_event.exited_at
      )} after ${data.grazing_event.grazing_days} day(s).`
    );
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to record grazing exits.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Move out failed: ${error.message}`, true);
  }
});

if (grazingGroupMoveInForm) {
  grazingGroupMoveInForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const moveMode = event.submitter?.getAttribute('data-move-mode') === 'correct_current'
        ? 'correct_current'
        : 'move';
      const data = await postJson(DATA_MUTATE_API_URL, {
        action: moveMode === 'correct_current' ? 'grazing_group_correct_current' : 'grazing_group_move_in',
        groupId: grazingGroupMoveInGroupSelect.value,
        paddockId: grazingGroupMoveInPaddockSelect.value,
        eventDate: grazingGroupMoveInDateInput.value || undefined,
        notes: grazingGroupMoveInNotesInput.value.trim() || undefined,
      });

      grazingGroupMoveInNotesInput.value = '';
      if (moveMode === 'correct_current') {
        const correctedCount = Number(data.corrected_count || 0);
        const insertedCount = Number(data.inserted_count || 0);
        const updatedCount = Number(data.updated_count || 0);
        const unchangedCount = Number(data.unchanged_count || 0);
        const correctionParts = [];

        if (correctedCount > 0) {
          correctionParts.push(
            `${correctedCount} corrected${insertedCount > 0 || updatedCount > 0 ? ` (${updatedCount} updated, ${insertedCount} added)` : ''}`
          );
        }
        if (unchangedCount > 0) {
          correctionParts.push(`${unchangedCount} already matched`);
        }

        setActionMessage(
          `${data.group.name} corrected to ${data.paddock.name} from ${formatDate(
            data.entered_at || data.grazing_events?.[0]?.entered_at || grazingGroupMoveInDateInput.value
          )}. ${correctionParts.join(', ') || 'Current paddock history updated.'}`
        );
      } else {
        const movedCount = Number(data.moved_count || 0);
        const groupMemberCount = Number(data.group_member_count || movedCount);
        const alreadyThereCount = Number(data.already_in_paddock_count || 0);
        const movementSummary =
          alreadyThereCount > 0
            ? `${movedCount} moved, ${alreadyThereCount} already there`
            : `${groupMemberCount} horse(s) moved`;

        setActionMessage(
          `${data.group.name} moved to ${data.paddock.name} on ${formatDate(
            data.entered_at || data.grazing_events?.[0]?.entered_at || grazingGroupMoveInDateInput.value
          )}. ${movementSummary}.`
        );
      }
      await loadDashboard();
    } catch (error) {
      if (handleAuthError(error, 'Session expired. Please log in to record group grazing moves.')) {
        clearDashboardView();
        return;
      }
      const moveMode = event.submitter?.getAttribute('data-move-mode') === 'correct_current'
        ? 'correct_current'
        : 'move';
      setActionMessage(
        moveMode === 'correct_current'
          ? `Correct current paddock failed: ${error.message}`
          : `Move group failed: ${error.message}`,
        true
      );
    }
  });
}

if (grazingGroupMoveOutForm) {
  grazingGroupMoveOutForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const data = await postJson(DATA_MUTATE_API_URL, {
        action: 'grazing_group_move_out',
        groupId: grazingGroupMoveOutGroupSelect.value,
        paddockId: grazingGroupMoveOutPaddockSelect.value,
        eventDate: grazingGroupMoveOutDateInput.value || undefined,
        notes: grazingGroupMoveOutNotesInput.value.trim() || undefined,
      });

      grazingGroupMoveOutNotesInput.value = '';
      setActionMessage(
        `${data.group.name} moved out of ${data.paddock.name} on ${formatDate(
          data.grazing_events?.[0]?.exited_at || grazingGroupMoveOutDateInput.value
        )} (${data.moved_count} horse(s)).`
      );
      await loadDashboard();
    } catch (error) {
      if (handleAuthError(error, 'Session expired. Please log in to record group grazing exits.')) {
        clearDashboardView();
        return;
      }
      setActionMessage(`Group move out failed: ${error.message}`, true);
    }
  });
}

feedItemSaveForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'feed_item_save',
      itemName: feedItemNameInput.value.trim(),
      currentStock: Number(feedItemStockInput.value),
      unit: feedItemUnitInput.value.trim(),
    });

    setActionMessage(
      `Feed item ${data.mode}: ${data.feed_item.name} -> ${data.feed_item.current_stock} ${data.feed_item.unit}`
    );
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to save feed items.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Save feed item failed: ${error.message}`, true);
  }
});

feedEntryItemInput.addEventListener('change', () => {
  const feedItem = findFeedItemByName(feedEntryItemInput.value);
  if (feedItem) {
    feedEntryUnitInput.value = feedItem.unit || '';
  }
});

feedEntryAddForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'feed_event_add',
      horseId: feedEntryHorseSelect.value,
      itemName: feedEntryItemInput.value.trim(),
      quantity: Number(feedEntryQuantityInput.value),
      unit: feedEntryUnitInput.value.trim(),
      eventDate: feedEntryDateInput.value || undefined,
    });

    feedEntryQuantityInput.value = '';
    setActionMessage(
      `Feed entry saved for ${data.horse.name}: ${data.feed_event.quantity} ${data.feed_event.unit} ${data.feed_item.name}. Stock left: ${data.stock.current_stock} ${data.stock.unit}.`
    );
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to save feed events.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Save feed event failed: ${error.message}`, true);
  }
});

dewormEventAddForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'deworm_event_add',
      horseId: dewormHorseSelect.value,
      productName: dewormProductInput.value.trim(),
      eventDate: dewormDateInput.value || undefined,
      secondDoseDate: dewormSecondDoseInput ? dewormSecondDoseInput.value || undefined : undefined,
      nextDueDate: dewormNextDueInput ? dewormNextDueInput.value || undefined : undefined,
    });

    dewormProductInput.value = '';
    setActionMessage(
      `Deworming saved for ${data.horse.name}: ${data.deworming_event.product_name}. Next due ${formatDate(data.deworming_event.next_due_date)}.`
    );
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to save deworming events.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Save deworming failed: ${error.message}`, true);
  }
});

farrierEventAddForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'farrier_event_add',
      horseId: farrierHorseSelect.value,
      serviceType: farrierServiceInput.value.trim(),
      eventDate: farrierDateInput.value || undefined,
      nextDueDate: farrierNextDueInput.value || undefined,
    });

    farrierServiceInput.value = '';
    farrierNextDueInput.value = '';
    setActionMessage(
      `Farrier event saved for ${data.horse.name}: ${data.farrier_event.service_type}. Next due ${formatDate(data.farrier_event.next_due_date)}.`
    );
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to save farrier events.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Save farrier failed: ${error.message}`, true);
  }
});

healthEventAddForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'health_event_add',
      horseId: healthHorseSelect.value,
      eventType: healthTypeInput.value.trim(),
      description: healthDescriptionInput.value.trim(),
      eventDate: healthDateInput.value || undefined,
      notes: healthNotesInput.value.trim() || undefined,
    });

    healthTypeInput.value = '';
    healthDescriptionInput.value = '';
    healthNotesInput.value = '';
    setActionMessage(
      `Health event saved for ${data.horse.name}: ${data.health_event.event_type}.`
    );
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to save health events.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Save health event failed: ${error.message}`, true);
  }
});

trainingStatusForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'horse_training_set',
      horseId: trainingHorseSelect.value,
      trainingStatus: trainingStatusSelect.value || undefined,
    });

    setActionMessage(
      `Training status saved for ${data.horse.name}: ${data.horse.training_status || 'No status'}.`
    );
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to update training status.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Save training status failed: ${error.message}`, true);
  }
});

rainSaveForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'rain_save',
      eventDate: rainDateInput.value || undefined,
      rainMm: Number(rainMmInput.value),
      notes: rainNotesInput.value.trim() || undefined,
    });

    rainMmInput.value = '';
    rainNotesInput.value = '';
    setActionMessage(
      `Rain saved for ${formatDate(data.rain.event_date)}: ${data.rain.rain_mm} mm`
    );
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to save rain records.')) {
      clearDashboardView();
      return;
    }
    setActionMessage(`Save rain failed: ${error.message}`, true);
  }
});

if (rainSyncWeatherButton) {
  rainSyncWeatherButton.addEventListener('click', async () => {
    const originalLabel = rainSyncWeatherButton.textContent;
    rainSyncWeatherButton.disabled = true;
    rainSyncWeatherButton.textContent = 'Syncing...';

    try {
      const data = await postJson(DATA_MUTATE_API_URL, {
        action: 'rain_weather_sync',
      });

      const sync = data.weather_sync || {};
      setActionMessage(
        `Weather synced ${formatDate(sync.start_date)} - ${formatDate(sync.end_date)}. ${sync.row_count || 0} day(s) checked, ${sync.inserted_count || 0} inserted, ${sync.updated_count || 0} updated.`,
        false,
        { card: 'action-card-rain' }
      );
      await loadDashboard();
    } catch (error) {
      if (handleAuthError(error, 'Session expired. Please log in to sync weather.')) {
        clearDashboardView();
        return;
      }
      setActionMessage(`Weather sync failed: ${error.message}`, true, { card: 'action-card-rain' });
    } finally {
      rainSyncWeatherButton.disabled = false;
      rainSyncWeatherButton.textContent = originalLabel;
    }
  });
}

horseProfileDobInput.addEventListener('change', () => {
  horseProfileAgeInput.value = computeAgeYears(horseProfileDobInput.value);
});

horseProfileForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const horseId = horseProfileIdInput.value || horseSelect?.value || horseProfileSelect?.value;
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'horse_profile_save',
      horseId,
      horseName: horseProfileNameInput.value.trim(),
      dateOfBirth: horseProfileDobInput.value || undefined,
      color: horseProfileColorInput.value.trim() || undefined,
      activity: horseProfileActivityInput.value || undefined,
      sex: horseProfileSexInput.value || undefined,
      trainingStatus: isAdminModuleEnabled('training')
        ? horseProfileTrainingStatusInput.value || undefined
        : undefined,
    });

    setHorseProfileMessage(`Profile saved for ${data.horse.name}`);
    await loadDashboard();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to save horse profiles.')) {
      clearDashboardView();
      return;
    }
    setHorseProfileMessage(`Save failed: ${error.message}`, true);
  }
});

initSummaryCardCustomization();
syncAdminModuleSettings(getDefaultAdminModuleSettings());
initPanelAccordions();
initActionCardAccordions();
initActionCardMessages();
initRainRegistryAccordion();
initHorseFeedHistoryAccordion();
const todayDate = new Date().toISOString().slice(0, 10);
rainDateInput.value = todayDate;
feedEntryDateInput.value = todayDate;
dewormDateInput.value = todayDate;
if (dewormSecondDoseInput) {
  dewormSecondDoseInput.value = todayDate;
}
farrierDateInput.value = todayDate;
healthDateInput.value = todayDate;
if (grazingMoveInDateInput) {
  grazingMoveInDateInput.value = todayDate;
}
if (grazingMoveOutDateInput) {
  grazingMoveOutDateInput.value = todayDate;
}
if (grazingGroupMoveInDateInput) {
  grazingGroupMoveInDateInput.value = todayDate;
}
if (grazingGroupMoveOutDateInput) {
  grazingGroupMoveOutDateInput.value = todayDate;
}
if (paddockWorkDateInput) {
  paddockWorkDateInput.value = todayDate;
}
clearHorseGroupEditState();
clearPaddockEditState();
clearPaddockWorkEditState();

async function initializeAdminApp() {
  const session = await syncSessionState();
  if (!session?.authenticated) {
    clearDashboardView();
    setStatus('Please log in to access the admin dashboard.', true);
    return;
  }

  await loadDashboard();
}

initializeAdminApp();
initBackToTopButton();
setInterval(() => {
  if (sessionAuthenticated) {
    if (Date.now() < dashboardAutoRefreshPauseUntil) {
      return;
    }
    if (isFeedPlanningInteractionActive()) {
      return;
    }
    loadDashboard({ silent: true });
  }
}, 60000);
