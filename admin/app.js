const API_URL = '/api/admin/overview';
const HORSE_HISTORY_API_URL = '/api/admin/horse-history';
const STOCK_MUTATE_API_URL = '/api/admin/mutate-stock';
const DATA_MUTATE_API_URL = '/api/admin/mutate-data';
const LOGIN_API_URL = '/api/admin/login';
const LOGOUT_API_URL = '/api/admin/logout';
const SESSION_API_URL = '/api/admin/session';
const PANEL_STATE_STORAGE_KEY = 'farm_bot_admin_panel_state';
const SUMMARY_PREFS_STORAGE_KEY = 'farm_bot_admin_summary_prefs';
const RAIN_REGISTRY_COLLAPSED_STORAGE_KEY = 'farm_bot_admin_rain_registry_collapsed';

const SUMMARY_METRICS = [
  { key: 'horses_count', defaultLabel: 'Horses' },
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

const summaryCards = document.getElementById('summary-cards');
const summaryEditToggleButton = document.getElementById('summary-edit-toggle-btn');
const summaryResetButton = document.getElementById('summary-reset-btn');
const summaryEditor = document.getElementById('summary-editor');
const summaryEditorList = document.getElementById('summary-editor-list');
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
const horseDewormingHistoryBody = document.getElementById('horse-deworming-history-body');
const horseFarrierHistoryBody = document.getElementById('horse-farrier-history-body');
const horseHealthHistoryBody = document.getElementById('horse-health-history-body');
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
const actionMessage = document.getElementById('action-message');
const feedItemOptions = document.getElementById('feed-item-options');

let currentHorseRows = [];
let currentFeedHistoryRows = [];
let currentDewormingHistoryRows = [];
let currentFarrierHistoryRows = [];
let summaryCardConfig = [];
let latestDashboardPayload = null;
let sessionAuthenticated = false;
let selectedRainWindow = '7d';

const RAIN_RING_VIEWBOX_SIZE = 360;
const RAIN_BARS_VIEWBOX_WIDTH = 960;
const RAIN_BARS_VIEWBOX_HEIGHT = 250;

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

function setActionMessage(message, isError = false) {
  actionMessage.textContent = message;
  actionMessage.style.color = isError ? 'var(--danger)' : 'var(--ok)';
}

function setHorseProfileMessage(message, isError = false) {
  horseProfileMessage.textContent = message;
  horseProfileMessage.style.color = isError ? 'var(--danger)' : 'var(--ok)';
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

function readPanelStateMap() {
  try {
    const raw = localStorage.getItem(PANEL_STATE_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function savePanelStateMap(stateMap) {
  localStorage.setItem(PANEL_STATE_STORAGE_KEY, JSON.stringify(stateMap));
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

function setRainRegistryCollapsed(collapsed) {
  if (!rainRegistryAccordion || !rainRegistryToggle) {
    return;
  }

  rainRegistryAccordion.classList.toggle('subpanel-collapsed', collapsed);
  rainRegistryToggle.setAttribute('aria-expanded', String(!collapsed));
}

function initRainRegistryAccordion() {
  if (!rainRegistryAccordion || !rainRegistryToggle) {
    return;
  }

  let collapsed = false;
  try {
    const raw = localStorage.getItem(RAIN_REGISTRY_COLLAPSED_STORAGE_KEY);
    if (raw != null) {
      collapsed = raw === '1';
    }
  } catch (_error) {
    collapsed = false;
  }

  setRainRegistryCollapsed(collapsed);

  rainRegistryToggle.addEventListener('click', () => {
    const nextCollapsed = !rainRegistryAccordion.classList.contains('subpanel-collapsed');
    setRainRegistryCollapsed(nextCollapsed);
    localStorage.setItem(RAIN_REGISTRY_COLLAPSED_STORAGE_KEY, nextCollapsed ? '1' : '0');
  });
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
  const visibleCards = summaryCardConfig.filter((item) => item.visible);

  if (!visibleCards.length) {
    summaryCards.innerHTML =
      '<article class="summary-card"><h3>Quick View</h3><p class="muted">No cards selected</p></article>';
    return;
  }

  summaryCards.innerHTML = visibleCards
    .map((item) => {
      const value = data.summary?.[item.key];
      const safeValue = value == null ? 0 : value;
      return `<article class="summary-card"><h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(safeValue)}</p></article>`;
    })
    .join('');
}

function renderSummaryEditor() {
  summaryEditorList.innerHTML = summaryCardConfig
    .map((item, index) => {
      return `
        <div class="summary-editor-row" data-key="${escapeHtml(item.key)}">
          <input type="checkbox" ${item.visible ? 'checked' : ''} aria-label="Show ${escapeHtml(item.label)}" />
          <input type="text" value="${escapeHtml(item.label)}" />
          <button type="button" data-move="up" ${index === 0 ? 'disabled' : ''}>Up</button>
          <button type="button" data-move="down" ${index === summaryCardConfig.length - 1 ? 'disabled' : ''}>Down</button>
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
    rainBody.innerHTML = emptyStateRow(4, 'No rain records yet.');
    return;
  }

  rainBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(formatDate(row.event_date))}</td>
          <td>${escapeHtml(row.rain_mm)}</td>
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
    rainChartLabel.textContent =
      rainMm >= RAIN_TARGET_MET_MM
        ? `Target met (>= ${RAIN_TARGET_MET_MM} mm)`
        : `${formatRainMm(remainder)} mm to reach ${RAIN_TARGET_MET_MM} mm target`;

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
  rainChartLabel.textContent = `Avg ${formatRainMm(averageRain)} mm/day • ${rainyDays}/${rows.length} rainy days • ${metDays} met target`;

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
          <td>${escapeHtml(row.feed_item)}</td>
          <td>${escapeHtml(`${row.quantity} ${row.unit}`)}</td>
          <td class="row-actions">
            <button type="button" class="inline-action-btn" data-feed-action="edit" data-feed-event-id="${escapeHtml(row.id)}">Edit</button>
            <button type="button" class="inline-action-btn danger" data-feed-action="delete" data-feed-event-id="${escapeHtml(row.id)}">Delete</button>
          </td>
        </tr>
      `
    )
    .join('');
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

function clearHorseCategoryHistories() {
  renderFeedHistoryRows([]);
  renderDewormingHistoryRows([]);
  renderFarrierHistoryRows([]);
  renderHealthHistoryRows([]);
}

function renderHorseCategoryHistories(payload) {
  renderFeedHistoryRows(payload.feed_history || []);
  renderDewormingHistoryRows(payload.deworming_history || []);
  renderFarrierHistoryRows(payload.farrier_history || []);
  renderHealthHistoryRows(payload.health_history || []);
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

function populateHorseActionSelects(rows) {
  [
    feedEntryHorseSelect,
    dewormHorseSelect,
    farrierHorseSelect,
    healthHorseSelect,
    trainingHorseSelect,
  ].forEach((selectElement) => populateSimpleHorseSelect(selectElement, rows));

  const selectedTrainingHorse = findHorseById(trainingHorseSelect.value);
  trainingStatusSelect.value = normalizeTrainingStatus(selectedTrainingHorse?.training_status) || '';
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
    const response = await fetch(SESSION_API_URL);
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
  currentFeedHistoryRows = [];
  currentDewormingHistoryRows = [];
  currentFarrierHistoryRows = [];
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
  rainBody.innerHTML = emptyStateRow(4, 'Log in to view data.');
  if (rainYearlyBody) {
    rainYearlyBody.innerHTML = emptyStateRow(6, 'Log in to view data.');
  }
  activityBody.innerHTML = emptyStateRow(4, 'Log in to view data.');
  horsesInTrainingBody.innerHTML = emptyStateRow(3, 'Log in to view data.');
  horsesBreakingInBody.innerHTML = emptyStateRow(3, 'Log in to view data.');
  renderHorseHistoryRows([]);
  clearHorseCategoryHistories();
  populateHorseSelect([]);
  populateHorseRenameSelect([]);
  populateHorseActionSelects([]);
  populateFeedItemOptions([]);
  populateHorseProfile(null);
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
  const horseFromList = findHorseById(horseId);
  if (horseFromList) {
    populateHorseProfile(horseFromList);
    setHorseHistorySelectedName(horseFromList);
  }

  try {
    const response = await fetch(`${HORSE_HISTORY_API_URL}?horseId=${encodeURIComponent(horseId)}`, {
      headers: getAuthHeaders(),
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
    clearHorseCategoryHistories();
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

async function loadDashboard() {
  if (!sessionAuthenticated) {
    setStatus('Please log in to access the admin dashboard.', true);
    clearDashboardView();
    return;
  }

  setStatus('Refreshing dashboard...');

  try {
    const response = await fetch(API_URL, { headers: getAuthHeaders() });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      const errorMessage = payload.error || `Request failed (${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    latestDashboardPayload = payload;
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
    currentHorseRows = currentHorseRows.map((horse) => ({
      ...horse,
      training_status: normalizeTrainingStatus(horse.training_status),
    }));
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
    populateFeedItemOptions(payload.stock?.all || []);
    const horseHistoryResult = await loadSelectedHorseHistory();

    const updatedAt = payload.meta?.refreshed_at || new Date().toISOString();
    lastUpdated.textContent = `Last updated: ${formatDateTime(updatedAt)}`;
    if (!horseHistoryResult.ok) {
      setStatus(`Dashboard loaded, but history failed: ${horseHistoryResult.error.message}`, true);
      return;
    }

    setStatus('Dashboard is up to date.');
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
      trainingStatus: horseProfileTrainingStatusInput.value || undefined,
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
initPanelAccordions();
initRainRegistryAccordion();
const todayDate = new Date().toISOString().slice(0, 10);
rainDateInput.value = todayDate;
feedEntryDateInput.value = todayDate;
dewormDateInput.value = todayDate;
if (dewormSecondDoseInput) {
  dewormSecondDoseInput.value = todayDate;
}
farrierDateInput.value = todayDate;
healthDateInput.value = todayDate;

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
setInterval(() => {
  if (sessionAuthenticated) {
    loadDashboard();
  }
}, 60000);
