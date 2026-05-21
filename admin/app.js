const API_URL = '/api/admin/overview';
const HORSE_HISTORY_API_URL = '/api/admin/horse-history';
const CALENDAR_EVENTS_API_URL = '/api/admin/calendar-events';
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
const MOBILE_NAV_VIEW_STORAGE_KEY = 'farm_bot_admin_mobile_nav_view';

const SUMMARY_METRICS = [
  { key: 'horses_count', defaultLabel: 'Horses' },
  { key: 'horse_groups_count', defaultLabel: 'Horse Groups' },
  { key: 'paddocks_count', defaultLabel: 'Paddocks' },
  { key: 'paddocks_occupied_count', defaultLabel: 'Paddocks Occupied' },
  { key: 'paddocks_resting_count', defaultLabel: 'Paddocks Resting' },
  { key: 'pasture_status', defaultLabel: 'Pasture' },
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
  horses_count: 'action-card-horse-profile',
  horse_groups_count: 'panel-horse-groups-status',
  paddocks_count: 'panel-paddock-status',
  paddocks_occupied_count: 'panel-paddock-status',
  paddocks_resting_count: 'panel-paddock-status',
  pasture_status: 'panel-pasture',
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
const MOBILE_NAV_VIEWS = {
  home: {
    title: 'Home',
    description: 'Daily overview with alerts, pending work, and the general farm status.',
    pageId: 'mobile-page-home',
    primaryTargetId: 'mobile-page-home',
    showIntro: false,
    blockSelectors: [
      '#dashboard-top',
      '.status-row',
      '.summary-toolbar',
      '#summary-editor',
      '#summary-cards',
      '#panel-in-training',
      '#panel-breaking-in',
      '#panel-deworming-alerts',
      '#panel-farrier-alerts',
    ],
    shortcuts: [
      { label: 'Quick View', targetId: 'summary-cards' },
      { label: 'Training', targetId: 'panel-in-training' },
      { label: 'Deworm', targetId: 'panel-deworming-alerts' },
      { label: 'Farrier', targetId: 'panel-farrier-alerts' },
    ],
  },
  potreros: {
    title: 'Potreros',
    description: 'Pasture cards, occupancy, grazing movement, and paddock readiness in one view.',
    pageId: 'mobile-page-potreros',
    primaryTargetId: 'mobile-page-potreros',
    blockSelectors: [
      '#panel-pasture',
      '#panel-horse-groups-status',
      '#panel-paddock-status',
      '#panel-paddock-work-history',
      '#panel-paddock-occupancy',
    ],
    shortcuts: [
      { label: 'Pasture', targetId: 'panel-pasture' },
      { label: 'Groups', targetId: 'panel-horse-groups-status' },
      { label: 'Status', targetId: 'panel-paddock-status' },
      { label: 'Occupancy', targetId: 'panel-paddock-occupancy' },
    ],
  },
  calendar: {
    title: 'Calendar',
    description: 'Date-based view for rain, feeding, field work, care, and movement across the month.',
    pageId: 'mobile-page-calendar',
    primaryTargetId: 'mobile-page-calendar',
    blockSelectors: [
      '#panel-admin-calendar',
      '#panel-deworm-history-registry',
      '#panel-farrier-history-registry',
    ],
    shortcuts: [
      { label: 'Month', targetId: 'panel-admin-calendar' },
      { label: 'Deworm', targetId: 'panel-deworm-history-registry' },
      { label: 'Farrier', targetId: 'panel-farrier-history-registry' },
    ],
  },
  logs: {
    title: 'Logs',
    description: 'Climate, recent activity, and inventory records grouped as one operational log page.',
    pageId: 'mobile-page-logs',
    primaryTargetId: 'mobile-page-logs',
    blockSelectors: [
      '#panel-low-stock',
      '#panel-current-inventory',
      '#panel-rain-registry',
      '#panel-recent-activity',
    ],
    shortcuts: [
      { label: 'Stock', targetId: 'panel-current-inventory' },
      { label: 'Rain', targetId: 'panel-rain-registry' },
      { label: 'Activity', targetId: 'panel-recent-activity' },
    ],
  },
  more: {
    title: 'More',
    description: 'Horse records, groups, stock actions, and admin setup live here.',
    pageId: 'mobile-page-more',
    primaryTargetId: 'mobile-page-more',
    blockSelectors: [
      '#action-hub-panel',
      '#panel-horse-history',
    ],
    shortcuts: [
      { label: 'Setup', targetId: 'action-card-farm-setup' },
      { label: 'Caballos', targetId: 'action-card-horse-profile' },
      { label: 'Grupos', targetId: 'action-card-horse-groups' },
      { label: 'Stock', targetId: 'action-card-feed' },
      { label: 'Config', targetId: 'action-card-admin-modules' },
    ],
  },
};
const MOBILE_NAV_TARGET_VIEW_OVERRIDES = {
  'mobile-page-home': 'home',
  'mobile-page-potreros': 'potreros',
  'mobile-page-calendar': 'calendar',
  'mobile-page-logs': 'logs',
  'mobile-page-more': 'more',
  'dashboard-top': 'home',
  'summary-editor': 'home',
  'summary-cards': 'home',
  'action-hub-panel': 'more',
  'action-card-paddocks': 'more',
  'action-card-farm-setup': 'more',
  'action-card-admin-modules': 'more',
  'action-card-horses-training': 'more',
  'action-card-horse-groups': 'more',
  'action-card-feed': 'more',
  'action-card-horse-profile': 'more',
  'paddock-save-form': 'more',
  'paddock-work-form': 'more',
  'horse-group-save-form': 'more',
  'horse-group-move-in-section': 'more',
  'panel-admin-calendar': 'calendar',
  'panel-horse-history': 'more',
  'panel-horse-groups-status': 'potreros',
  'panel-pasture': 'potreros',
  'panel-paddock-status': 'potreros',
  'panel-paddock-work-history': 'potreros',
  'panel-paddock-occupancy': 'potreros',
  'panel-in-training': 'home',
  'panel-breaking-in': 'home',
  'panel-deworming-alerts': 'home',
  'panel-farrier-alerts': 'home',
  'panel-deworm-history-registry': 'calendar',
  'panel-farrier-history-registry': 'calendar',
  'panel-rain-registry': 'logs',
  'panel-recent-activity': 'logs',
  'panel-low-stock': 'logs',
  'panel-current-inventory': 'logs',
};

const authForm = document.getElementById('auth-form');
const loginUsernameLabel = document.getElementById('login-username-label');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordLabel = document.getElementById('login-password-label');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-btn');
const logoutButton = document.getElementById('logout-btn');
const refreshButton = document.getElementById('refresh-btn');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingOverlayTitle = document.getElementById('loading-overlay-title');
const loadingOverlayDetail = document.getElementById('loading-overlay-detail');
const statusMessage = document.getElementById('status-message');
const lastUpdated = document.getElementById('last-updated');
const backToTopButton = document.getElementById('back-to-top-btn');
const dashboardMain = document.querySelector('.dashboard');
const actionHubPanel = document.querySelector('.action-hub-panel');
const desktopTopNav = document.getElementById('desktop-top-nav');
const desktopTopNavDescription = document.getElementById('desktop-nav-description');
const desktopTopNavItems = Array.from(document.querySelectorAll('.desktop-nav-item[data-view-key]'));
const mobileBottomNav = document.getElementById('mobile-bottom-nav');
const mobileBottomNavItems = Array.from(document.querySelectorAll('.mobile-nav-item[data-view-key]'));

const summaryCards = document.getElementById('summary-cards');
const adminCalendarMonthLabel = document.getElementById('admin-calendar-month-label');
const adminCalendarPrevButton = document.getElementById('admin-calendar-prev-btn');
const adminCalendarNextButton = document.getElementById('admin-calendar-next-btn');
const adminCalendarTodayButton = document.getElementById('admin-calendar-today-btn');
const adminCalendarGrid = document.getElementById('admin-calendar-grid');
const adminCalendarSelectedLabel = document.getElementById('admin-calendar-selected-label');
const adminCalendarSelectedMeta = document.getElementById('admin-calendar-selected-meta');
const adminCalendarFilterBar = document.getElementById('admin-calendar-filter-bar');
const adminCalendarDayEvents = document.getElementById('admin-calendar-day-events');
const adminCalendarDayPanel = document.querySelector('.admin-calendar-day-panel');
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
const frostBody = document.getElementById('frost-body');
const rainYearlyBody = document.getElementById('rain-yearly-body');
const rainChart = document.getElementById('rain-chart');
const rainChartWrap = document.getElementById('rain-chart-wrap');
const rainChartTooltip = document.getElementById('rain-chart-tooltip');
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
const horseActivityTimeline = document.getElementById('horse-activity-timeline');
const horseFeedSummary = document.getElementById('horse-feed-summary');
const horseFeedHistoryCard = document.getElementById('horse-history-feed-card');
const horseFeedHistoryToggle = document.getElementById('horse-feed-history-toggle');
const horseFeedHistoryPeriodFilter = document.getElementById('horse-feed-history-period');
const horseFeedHistorySlotFilter = document.getElementById('horse-feed-history-slot');
const horseFeedHistorySourceFilter = document.getElementById('horse-feed-history-source');
const horseFeedHistoryGroups = document.getElementById('horse-feed-history-groups');
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
const pastureOverviewBody = document.getElementById('pasture-overview-body');
const horseGroupStatusBody = document.getElementById('horse-group-status-body');
const horseGroupHistoryRegistryBody = document.getElementById('horse-group-history-registry-body');
const paddockStatusBody = document.getElementById('paddock-status-body');
const paddockWorkHistoryBody = document.getElementById('paddock-work-history-body');
const paddockOccupancyBody = document.getElementById('paddock-occupancy-body');
const paddockOccupancyCards = document.getElementById('paddock-occupancy-cards');
const paddockSaveForm = document.getElementById('paddock-save-form');
const paddockNameInput = document.getElementById('paddock-name-input');
const paddockZoneInput = document.getElementById('paddock-zone-input');
const paddockSizeInput = document.getElementById('paddock-size-input');
const paddockActiveSelect = document.getElementById('paddock-active-select');
const paddockParentSelect = document.getElementById('paddock-parent-select');
const paddockRestDaysInput = document.getElementById('paddock-rest-days-input');
const paddockRestScopeSelect = document.getElementById('paddock-rest-scope-select');
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
const horseGroupMembersContext = document.getElementById('horse-group-members-context');
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
const frostSaveForm = document.getElementById('frost-save-form');
const frostDateInput = document.getElementById('frost-date-input');
const frostIntensitySelect = document.getElementById('frost-intensity-select');
const frostNotesInput = document.getElementById('frost-notes-input');
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
let currentHorseFeedHistoryFilters = { period: '7d', slot: 'all', source: 'all' };
let currentPaddockOccupancyRows = [];
let currentDewormingHistoryRows = [];
let currentFarrierHistoryRows = [];
let currentHorseGroupMemberSelection = new Set();
let summaryCardConfig = [];
let currentFarmSettings = null;
let currentAdminModuleSettings = [];
let latestDashboardPayload = null;
let sessionAuthenticated = false;
let selectedRainWindow = '7d';
let selectedRainTooltipIndex = null;
let selectedHorseFeedCalendarMonth = new Date().toISOString().slice(0, 7);
let nextHorseFeedPlanDraftRowKey = 1;
let dashboardAutoRefreshPauseUntil = 0;
let lastActionCardId = null;
let loadingOverlayCount = 0;
let activeMobileNavView = 'home';
let originalDashboardChildOrder = [];
let mobilePageDeck = null;
let mobilePageLayoutActive = false;
let selectedAdminCalendarMonth = currentYearMonthString();
let selectedAdminCalendarDate = todayIsoDateString();
let selectedAdminCalendarFilter = 'all';
let adminCalendarLoadToken = 0;
let lastActionTrigger = null;
const adminCalendarMonthCache = new Map();
const mobilePageContainers = new Map();

const RAIN_RING_VIEWBOX_SIZE = 360;
const RAIN_BARS_VIEWBOX_WIDTH = 960;
const RAIN_BARS_VIEWBOX_HEIGHT = 250;
const FEED_SLOT_META = [
  { key: 'morning', label: 'M', title: 'Morning' },
  { key: 'afternoon', label: 'A', title: 'Afternoon' },
  { key: 'night', label: 'N', title: 'Night' },
];
const ADMIN_CALENDAR_EVENT_META = {
  rain: { label: 'Rain', shortLabel: 'RN', markerGroup: 'rain' },
  frost: { label: 'Frost', shortLabel: 'FS', markerGroup: 'frost' },
  feed: { label: 'Feed', shortLabel: 'FD', markerGroup: 'feed' },
  stock: { label: 'Stock', shortLabel: 'ST', markerGroup: 'feed' },
  paddock: { label: 'Field Work', shortLabel: 'FW', markerGroup: 'field' },
  grazing: { label: 'Movement', shortLabel: 'MV', markerGroup: 'movement' },
  group: { label: 'Group', shortLabel: 'GR', markerGroup: 'movement' },
  deworming: { label: 'Deworming', shortLabel: 'DW', markerGroup: 'care' },
  farrier: { label: 'Farrier', shortLabel: 'FR', markerGroup: 'care' },
  health: { label: 'Health', shortLabel: 'HL', markerGroup: 'care' },
  treatment: { label: 'Treatment', shortLabel: 'TR', markerGroup: 'care' },
  dose: { label: 'Dose', shortLabel: 'DS', markerGroup: 'care' },
};
const ADMIN_CALENDAR_MARKER_META = {
  rain: { label: 'Rain' },
  frost: { label: 'Frost' },
  feed: { label: 'Feed' },
  field: { label: 'Field' },
  care: { label: 'Care' },
  movement: { label: 'Movement' },
};
const ACTION_PROGRESS_META = {
  default: { pendingMessage: 'Working on it...', busyLabel: 'Working...' },
  set: { pendingMessage: 'Applying stock change...', busyLabel: 'Applying...' },
  add: { pendingMessage: 'Applying stock change...', busyLabel: 'Applying...' },
  use: { pendingMessage: 'Applying stock change...', busyLabel: 'Applying...' },
  horse_add: { pendingMessage: 'Adding horse...', busyLabel: 'Adding...' },
  horse_rename: { pendingMessage: 'Renaming horse...', busyLabel: 'Saving...' },
  horse_group_save: { pendingMessage: 'Saving group...', busyLabel: 'Saving...' },
  horse_group_memberships_set: { pendingMessage: 'Saving group members...', busyLabel: 'Saving...' },
  paddock_save: { pendingMessage: 'Saving paddock...', busyLabel: 'Saving...' },
  paddock_work_save: { pendingMessage: 'Saving field work...', busyLabel: 'Saving...' },
  paddock_work_update: { pendingMessage: 'Updating field work...', busyLabel: 'Saving...' },
  grazing_move_in: { pendingMessage: 'Moving horse into paddock...', busyLabel: 'Moving...' },
  grazing_move_out: { pendingMessage: 'Recording horse move out...', busyLabel: 'Saving...' },
  grazing_group_move_in: { pendingMessage: 'Moving group to paddock...', busyLabel: 'Moving...' },
  grazing_group_correct_current: {
    pendingMessage: 'Correcting current paddock and move date...',
    busyLabel: 'Correcting...',
  },
  grazing_group_move_out: { pendingMessage: 'Recording group move out...', busyLabel: 'Saving...' },
  feed_item_save: { pendingMessage: 'Saving feed item...', busyLabel: 'Saving...' },
  feed_event_add: { pendingMessage: 'Saving feed entry...', busyLabel: 'Saving...' },
  feed_event_update: { pendingMessage: 'Updating feed entry...', busyLabel: 'Saving...' },
  feed_event_delete: { pendingMessage: 'Deleting feed entry...', busyLabel: 'Deleting...' },
  horse_feed_plan_save: { pendingMessage: 'Saving feed plan...', busyLabel: 'Saving...' },
  horse_feed_slot_toggle: { pendingMessage: 'Updating feed calendar...', busyLabel: 'Updating...' },
  deworm_event_add: { pendingMessage: 'Saving deworming event...', busyLabel: 'Saving...' },
  farrier_event_add: { pendingMessage: 'Saving farrier event...', busyLabel: 'Saving...' },
  health_event_add: { pendingMessage: 'Saving health event...', busyLabel: 'Saving...' },
  horse_training_set: { pendingMessage: 'Saving training status...', busyLabel: 'Saving...' },
  rain_save: { pendingMessage: 'Saving rain entry...', busyLabel: 'Saving...' },
  frost_save: { pendingMessage: 'Saving frost day...', busyLabel: 'Saving...' },
  rain_weather_sync: { pendingMessage: 'Syncing weather data...', busyLabel: 'Syncing...' },
  horse_profile_save: { pendingMessage: 'Saving horse profile...', busyLabel: 'Saving...' },
  farm_settings_save: { pendingMessage: 'Saving farm setup...', busyLabel: 'Saving...' },
  admin_modules_save: { pendingMessage: 'Updating admin modules...', busyLabel: 'Saving...' },
};
const ACTIVITY_TIMELINE_META = {
  feed: { icon: '🍽', label: 'Feed', priority: 10 },
  deworming: { icon: '💊', label: 'Deworming', priority: 20 },
  health: { icon: '🩺', label: 'Health', priority: 30 },
  treatment_plan: { icon: '🩺', label: 'Treatment', priority: 32 },
  dose: { icon: '🩺', label: 'Treatment Dose', priority: 34 },
  farrier: { icon: '🦶', label: 'Farrier', priority: 40 },
  grazing: { icon: '🐎', label: 'Grazing', priority: 50 },
};
const ADMIN_MODULES = [
  {
    key: 'groups',
    label: 'Horse Groups',
    description: 'Group setup, assignments, and group history.',
  },
  {
    key: 'paddocks',
    label: 'Paddocks',
    description: 'Paddock setup, grazing moves, field work, paddock occupancy, and pasture readiness.',
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
  pasture_status: 'paddocks',
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
    '#horse-history-current-group',
    '#horse-history-group-card',
  ],
  paddocks: [
    '#action-card-paddocks',
    '#horse-group-move-in-section',
    '#horse-group-move-out-section',
    '#panel-pasture',
    '#panel-paddock-status',
    '#panel-paddock-work-history',
    '#panel-paddock-occupancy',
    '#horse-history-current-grazing',
    '#horse-history-grazing-card',
  ],
  feed: [
    '#action-card-feed',
    '#panel-low-stock',
    '#panel-current-inventory',
    '#horse-history-feed-plan-card',
    '#horse-history-feed-summary-card',
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

function formatPaddockRestDaysLabel(row) {
  if (row?.rest_days == null) {
    return '-';
  }

  const baseLabel = String(row.rest_days);
  if (row.rest_source === 'manual') {
    return `${baseLabel} (manual)`;
  }

  if (row.rest_source === 'baseline') {
    return `${baseLabel} (baseline)`;
  }

  return baseLabel;
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

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function differenceInIsoCalendarDays(laterValue, earlierValue) {
  const normalizedLater = normalizeDateForDateInput(laterValue);
  const normalizedEarlier = normalizeDateForDateInput(earlierValue);
  if (!normalizedLater || !normalizedEarlier) {
    return null;
  }

  const laterDate = new Date(`${normalizedLater}T00:00:00Z`);
  const earlierDate = new Date(`${normalizedEarlier}T00:00:00Z`);
  if (Number.isNaN(laterDate.getTime()) || Number.isNaN(earlierDate.getTime())) {
    return null;
  }

  return Math.floor((laterDate.getTime() - earlierDate.getTime()) / 86400000);
}

function compareIsoDateValues(leftValue, rightValue, direction = 'asc') {
  const leftNormalized = normalizeDateForDateInput(leftValue);
  const rightNormalized = normalizeDateForDateInput(rightValue);

  if (leftNormalized && rightNormalized) {
    if (leftNormalized === rightNormalized) {
      return 0;
    }

    if (direction === 'desc') {
      return leftNormalized < rightNormalized ? 1 : -1;
    }

    return leftNormalized < rightNormalized ? -1 : 1;
  }

  if (leftNormalized) {
    return -1;
  }

  if (rightNormalized) {
    return 1;
  }

  return 0;
}

function formatDaysLabel(dayCount, suffix) {
  const safeCount = Math.max(0, Number(dayCount || 0));
  const noun = safeCount === 1 ? 'day' : 'days';
  return suffix ? `${safeCount} ${noun} ${suffix}` : `${safeCount} ${noun}`;
}

function getPastureProgressSnapshot(row) {
  const targetDaysRaw = Number(row?.ready_after_days);
  let targetDays = Number.isFinite(targetDaysRaw) && targetDaysRaw >= 0 ? targetDaysRaw : null;

  if (targetDays == null) {
    const derivedTargetDays = differenceInIsoCalendarDays(row?.ready_to_graze_on, row?.latest_work_date);
    if (derivedTargetDays != null && derivedTargetDays >= 0) {
      targetDays = derivedTargetDays;
    }
  }

  if (targetDays == null) {
    return null;
  }

  const daysUntilReadyRaw = Number(row?.days_until_ready);
  const daysUntilReady = Number.isFinite(daysUntilReadyRaw) ? Math.max(0, daysUntilReadyRaw) : 0;
  const elapsedDays =
    targetDays > 0 ? clampNumber(targetDays - daysUntilReady, 0, targetDays) : targetDays;
  const percent = targetDays > 0 ? clampNumber((elapsedDays / targetDays) * 100, 0, 100) : 100;

  return {
    elapsed_days: elapsedDays,
    target_days: targetDays,
    percent,
  };
}

function buildPastureRyegrassCardData(rows) {
  const activeRows = (Array.isArray(rows) ? rows : []).filter((row) => row?.active);
  const trackedRows = activeRows.filter((row) => normalizeDateForDateInput(row?.ready_to_graze_on));
  const readyRows = trackedRows.filter(
    (row) => Number(row?.horse_count || 0) === 0 && Number(row?.days_until_ready) === 0
  );
  const growingRows = trackedRows.filter((row) => Number(row?.days_until_ready) > 0);
  const occupiedRows = trackedRows.filter((row) => Number(row?.horse_count || 0) > 0);
  const restingRows = activeRows.filter(
    (row) => row?.occupancy_state === 'resting' && Number(row?.horse_count || 0) === 0
  );

  const readyCount = readyRows.length;
  const growingCount = growingRows.length;
  const occupiedCount = occupiedRows.length;
  const restingCount = restingRows.length;

  if (!activeRows.length) {
    return {
      state: 'empty',
      status_title: 'No active paddocks',
      badge_class: 'neutral',
      badge_text: 'Waiting for setup',
      focus: 'Pasture tracking is not active yet.',
      copy: 'Create paddocks first to start tracking pasture readiness.',
      meta: [],
      progress: null,
    };
  }

  if (!trackedRows.length && restingRows.length) {
    const focusRow = [...restingRows].sort(
      (left, right) => Number(right.rest_days || 0) - Number(left.rest_days || 0)
    )[0];

    return {
      state: 'resting',
      status_title: 'Resting phase',
      badge_class: 'neutral',
      badge_text: formatDaysLabel(focusRow.rest_days || 0, 'resting'),
      focus: focusRow.name,
      copy:
        focusRow.effective_rest_started_on &&
        ['manual', 'baseline'].includes(String(focusRow.rest_source || ''))
          ? `Estimated resting since ${formatDate(focusRow.effective_rest_started_on)}.`
          : focusRow.last_exited_at
            ? `Last grazed ${formatDate(focusRow.last_exited_at)}.`
            : 'Recovery window in progress.',
      meta: [
        { label: 'Resting paddocks', value: String(restingCount) },
        { label: 'Active paddocks', value: String(activeRows.length) },
      ],
      progress: null,
    };
  }

  if (!trackedRows.length) {
    return {
      state: 'empty',
      status_title: 'No pasture cycle tracked',
      badge_class: 'neutral',
      badge_text: 'Needs field work',
      focus: 'Log seeding or field work with ready days.',
      copy:
        'Use Paddocks -> Field Work and fill in Days Until Ready To Graze to drive ryegrass readiness.',
      meta: [
        { label: 'Active paddocks', value: String(activeRows.length) },
        { label: 'Tracked cycles', value: '0' },
      ],
      progress: null,
    };
  }

  if (readyRows.length) {
    const focusRow = [...readyRows].sort((left, right) =>
      compareIsoDateValues(left.ready_to_graze_on, right.ready_to_graze_on, 'asc')
    )[0];
    const daysPastTarget = Math.max(
      0,
      Number(differenceInIsoCalendarDays(todayIsoDateString(), focusRow.ready_to_graze_on) || 0)
    );
    const progress = getPastureProgressSnapshot(focusRow);

    return {
      state: 'ready',
      status_title: 'Ready to graze',
      badge_class: daysPastTarget > 0 ? 'overdue' : 'ok',
      badge_text: daysPastTarget > 0 ? formatDaysLabel(daysPastTarget, 'past target') : 'Ready now',
      focus: focusRow.name,
      copy:
        readyCount > 1
          ? `${readyCount} paddocks are ready now. ${focusRow.name} has been ready the longest.`
          : `${focusRow.name} can take horses now.`,
      meta: [
        { label: 'Ready since', value: formatDate(focusRow.ready_to_graze_on) },
        { label: 'Ready paddocks', value: String(readyCount) },
        {
          label: 'Field cycle',
          value: formatPaddockWorkTypeLabel(focusRow.latest_work_type || 'seeding'),
        },
      ],
      progress,
    };
  }

  if (growingRows.length) {
    const focusRow = [...growingRows].sort((left, right) =>
      compareIsoDateValues(left.ready_to_graze_on, right.ready_to_graze_on, 'asc')
    )[0];
    const daysRemaining = Math.max(0, Number(focusRow.days_until_ready || 0));
    const progress = getPastureProgressSnapshot(focusRow);

    return {
      state: 'growing',
      status_title: 'Growing',
      badge_class: 'growing',
      badge_text: formatDaysLabel(daysRemaining, 'remaining'),
      focus: focusRow.name,
      copy: `${formatPaddockWorkTypeLabel(
        focusRow.latest_work_type || 'seeding'
      )} cycle in progress.`,
      meta: [
        { label: 'Estimated ready', value: formatDate(focusRow.ready_to_graze_on) },
        { label: 'Growing paddocks', value: String(growingCount) },
        { label: 'Ready next', value: focusRow.name },
      ],
      progress,
    };
  }

  if (occupiedRows.length) {
    const focusRow = [...occupiedRows].sort((left, right) => {
      const leftDays = Number(left.grazing_days || 0);
      const rightDays = Number(right.grazing_days || 0);
      if (leftDays !== rightDays) {
        return rightDays - leftDays;
      }
      return compareIsoDateValues(left.occupied_since, right.occupied_since, 'desc');
    })[0];
    const progress = getPastureProgressSnapshot(focusRow);

    return {
      state: 'occupied',
      status_title: 'Grazing active',
      badge_class: 'ok',
      badge_text: formatDaysLabel(focusRow.grazing_days || 0, 'grazing'),
      focus: focusRow.name,
      copy: focusRow.occupied_by ? `Occupied by ${focusRow.occupied_by}.` : 'Currently occupied.',
      meta: [
        { label: 'Entered', value: formatDate(focusRow.occupied_since) },
        { label: 'Occupied paddocks', value: String(occupiedCount) },
        { label: 'Ready since', value: formatDate(focusRow.ready_to_graze_on) },
      ],
      progress,
    };
  }

  if (restingRows.length) {
    const focusRow = [...restingRows].sort(
      (left, right) => Number(right.rest_days || 0) - Number(left.rest_days || 0)
    )[0];

    return {
      state: 'resting',
      status_title: 'Resting phase',
      badge_class: 'neutral',
      badge_text: formatDaysLabel(focusRow.rest_days || 0, 'resting'),
      focus: focusRow.name,
      copy:
        ['manual', 'baseline'].includes(String(focusRow.rest_source || '')) &&
        focusRow.effective_rest_started_on
          ? `Estimated resting since ${formatDate(focusRow.effective_rest_started_on)}.`
          : focusRow.last_exited_at
            ? `Last grazed ${formatDate(focusRow.last_exited_at)}.`
            : 'Recovery window in progress.',
      meta: [
        { label: 'Resting paddocks', value: String(restingCount) },
        { label: 'Ready paddocks', value: String(readyCount) },
        { label: 'Growing paddocks', value: String(growingCount) },
      ],
      progress: null,
    };
  }

  return {
    state: 'empty',
    status_title: 'Pasture data pending',
    badge_class: 'neutral',
    badge_text: 'No active cycle',
    focus: 'No ready-to-graze dates found yet.',
    copy: 'Save field work with ready days to start pasture readiness tracking.',
    meta: [
      { label: 'Tracked cycles', value: String(trackedRows.length) },
      { label: 'Active paddocks', value: String(activeRows.length) },
    ],
    progress: null,
  };
}

function renderPastureOverview(payload) {
  if (!pastureOverviewBody) {
    return;
  }

  if (!payload || typeof payload !== 'object') {
    pastureOverviewBody.innerHTML = '<p class="pasture-empty">Log in to view pasture readiness.</p>';
    return;
  }

  const paddockRows = Array.isArray(payload.paddocks) ? payload.paddocks : [];
  const ryegrassCard = buildPastureRyegrassCardData(paddockRows);
  const rainEnabled = isAdminModuleEnabled('rain');
  const summary = payload.summary || {};
  const rainCards = rainEnabled
    ? [
        {
          label: 'Rain Today',
          value: `${formatRainMm(summary.rain_today_mm || 0)} mm`,
          detail: 'Manual rain logged today',
        },
        {
          label: 'Rain 7d',
          value: `${formatRainMm(summary.rain_7d_mm || 0)} mm`,
          detail: 'Last 7 days total',
        },
        {
          label: 'Rainy Days',
          value: `${Number(summary.rain_days_7 || 0)}`,
          detail: 'Days with rain in the last 7 days',
        },
      ]
    : [];

  const gridClassName = rainCards.length
    ? 'pasture-overview-grid pasture-overview-grid-has-rain'
    : 'pasture-overview-grid';
  const progressMarkup =
    ryegrassCard.progress && ryegrassCard.progress.target_days > 0
      ? `
          <div class="pasture-progress">
            <div class="pasture-progress-label">
              <span>Day ${escapeHtml(ryegrassCard.progress.elapsed_days)} / ${escapeHtml(
          ryegrassCard.progress.target_days
        )}</span>
              <span>${escapeHtml(Math.round(ryegrassCard.progress.percent))}%</span>
            </div>
            <div class="pasture-progress-bar" aria-hidden="true">
              <span style="width: ${escapeHtml(ryegrassCard.progress.percent.toFixed(1))}%;"></span>
            </div>
          </div>
        `
      : '';

  pastureOverviewBody.className = gridClassName;
  pastureOverviewBody.innerHTML = `
    <article class="pasture-card pasture-card-feature pasture-state-${escapeHtml(ryegrassCard.state)}">
      <div class="pasture-card-head">
        <div>
          <p class="pasture-card-eyebrow">🌱 Ryegrass</p>
          <h3>${escapeHtml(ryegrassCard.status_title)}</h3>
        </div>
        <span class="badge ${escapeHtml(ryegrassCard.badge_class)}">${escapeHtml(
          ryegrassCard.badge_text
        )}</span>
      </div>
      <p class="pasture-card-focus">${escapeHtml(ryegrassCard.focus)}</p>
      <p class="pasture-card-copy">${escapeHtml(ryegrassCard.copy)}</p>
      ${progressMarkup}
      ${
        Array.isArray(ryegrassCard.meta) && ryegrassCard.meta.length
          ? `<dl class="pasture-card-meta">
              ${ryegrassCard.meta
                .map(
                  (item) => `
                    <div>
                      <dt>${escapeHtml(item.label)}</dt>
                      <dd>${escapeHtml(item.value)}</dd>
                    </div>
                  `
                )
                .join('')}
            </dl>`
          : ''
      }
    </article>
    ${rainCards
      .map(
        (card) => `
          <article class="pasture-card pasture-card-stat">
            <p class="pasture-card-eyebrow">${escapeHtml(card.label)}</p>
            <p class="pasture-card-stat-value">${escapeHtml(card.value)}</p>
            <p class="pasture-card-copy">${escapeHtml(card.detail)}</p>
          </article>
        `
      )
      .join('')}
  `;
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

function formatFrostIntensityLabel(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (normalized === 'light') {
    return 'Light Frost';
  }
  if (normalized === 'moderate') {
    return 'Moderate Frost';
  }
  if (normalized === 'heavy') {
    return 'Heavy Frost';
  }

  return normalized ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)} Frost` : '-';
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

function formatMonthYearLabel(yearMonth) {
  const normalizedYearMonth = normalizeYearMonth(yearMonth) || currentYearMonthString();
  const [year, month] = normalizedYearMonth.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));

  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function addMonthsToYearMonth(yearMonth, monthDelta) {
  const monthInfo = getMonthDateInfo(yearMonth);
  const date = new Date(Date.UTC(monthInfo.year, monthInfo.month_index + Number(monthDelta || 0), 1));
  return date.toISOString().slice(0, 7);
}

function formatAdminCalendarMetric(value, unit) {
  if (value == null || !Number.isFinite(Number(value))) {
    return '';
  }

  const numericValue = Number(value);
  const formattedValue =
    unit === 'mm' ? formatRainMm(numericValue) : numericValue.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return unit ? `${formattedValue} ${unit}` : formattedValue;
}

function formatAdminCalendarEventStamp(eventAt) {
  if (!eventAt) {
    return '';
  }

  const date = new Date(eventAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0) {
    return 'Day log';
  }

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatAdminCalendarSelectedDateLabel(isoDate) {
  if (!isoDate) {
    return '-';
  }

  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function getAdminCalendarEventMeta(category) {
  return ADMIN_CALENDAR_EVENT_META[String(category || '').trim().toLowerCase()] || {
    label: 'Activity',
    shortLabel: 'AC',
    markerGroup: 'movement',
  };
}

function getAdminCalendarMarkerGroup(category) {
  return getAdminCalendarEventMeta(category).markerGroup || 'movement';
}

function buildAdminCalendarEventsByDate(events) {
  const groupedEvents = new Map();

  (Array.isArray(events) ? events : []).forEach((event) => {
    const eventDate = normalizeDateForDateInput(event?.event_date);
    if (!eventDate) {
      return;
    }

    if (!groupedEvents.has(eventDate)) {
      groupedEvents.set(eventDate, []);
    }

    groupedEvents.get(eventDate).push(event);
  });

  groupedEvents.forEach((rows) => {
    rows.sort((left, right) => String(left.event_at || '').localeCompare(String(right.event_at || '')));
  });

  return groupedEvents;
}

function resolveAdminCalendarSelectedDate(payload, preferredDate = '') {
  const normalizedMonth = normalizeYearMonth(payload?.month) || currentYearMonthString();
  const normalizedPreferredDate = normalizeDateForDateInput(preferredDate);
  if (normalizedPreferredDate && normalizedPreferredDate.startsWith(normalizedMonth)) {
    return normalizedPreferredDate;
  }

  const todayIso = todayIsoDateString();
  if (todayIso.startsWith(normalizedMonth)) {
    return todayIso;
  }

  const groupedEvents = buildAdminCalendarEventsByDate(payload?.events || []);
  const firstEventDate = Array.from(groupedEvents.keys()).sort()[0];
  if (firstEventDate) {
    return firstEventDate;
  }

  return `${normalizedMonth}-01`;
}

function renderAdminCalendarStatus(message, detail = '') {
  if (adminCalendarMonthLabel) {
    adminCalendarMonthLabel.textContent = formatMonthYearLabel(selectedAdminCalendarMonth);
  }

  if (adminCalendarGrid) {
    adminCalendarGrid.innerHTML = `
      <div class="admin-calendar-status-card">
        <p>${escapeHtml(message)}</p>
        ${detail ? `<span>${escapeHtml(detail)}</span>` : ''}
      </div>
    `;
  }

  if (adminCalendarSelectedLabel) {
    adminCalendarSelectedLabel.textContent = message;
  }

  if (adminCalendarSelectedMeta) {
    adminCalendarSelectedMeta.textContent = detail || '';
  }

  if (adminCalendarFilterBar) {
    adminCalendarFilterBar.innerHTML = '';
  }

  if (adminCalendarDayEvents) {
    adminCalendarDayEvents.innerHTML = '';
  }
}

function renderAdminCalendarGrid(payload) {
  if (!adminCalendarGrid) {
    return;
  }

  const monthInfo = getMonthDateInfo(payload?.month || selectedAdminCalendarMonth);
  const groupedEvents = buildAdminCalendarEventsByDate(payload?.events || []);
  const visibleMonth = normalizeYearMonth(payload?.month) || selectedAdminCalendarMonth;
  const todayIso = todayIsoDateString();
  const gridStartDate = addDaysToIsoDateString(
    buildIsoDateFromParts(monthInfo.year, monthInfo.month_index, 1),
    -monthInfo.first_weekday
  );
  const weekdayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    .map((label) => `<div class="admin-calendar-weekday">${escapeHtml(label)}</div>`)
    .join('');
  const dayCells = [];

  for (let offset = 0; offset < 42; offset += 1) {
    const isoDate = addDaysToIsoDateString(gridStartDate, offset);
    const targetMonth = isoDate.slice(0, 7);
    const isOutsideMonth = targetMonth !== visibleMonth;
    const dayEvents = groupedEvents.get(isoDate) || [];
    const markerGroups = [...new Set(dayEvents.map((event) => getAdminCalendarMarkerGroup(event.category)))];
    const markerMarkup = markerGroups
      .slice(0, 5)
      .map(
        (markerGroup) =>
          `<span class="admin-calendar-day-marker is-${escapeHtml(markerGroup)}" aria-hidden="true"></span>`
      )
      .join('');
    const overflowMarker =
      markerGroups.length > 5
        ? `<span class="admin-calendar-day-marker is-overflow">+${escapeHtml(markerGroups.length - 5)}</span>`
        : '';
    const isSelected = isoDate === selectedAdminCalendarDate;
    const accessibleLabel = `${formatAdminCalendarSelectedDateLabel(isoDate)}${
      dayEvents.length ? `, ${dayEvents.length} activities` : ', no activities'
    }`;

    dayCells.push(`
      <button
        type="button"
        class="admin-calendar-day${isOutsideMonth ? ' is-outside-month' : ''}${isoDate === todayIso ? ' is-today' : ''}${
          isSelected ? ' is-selected' : ''
        }${dayEvents.length ? ' has-events' : ''}"
        data-admin-calendar-date="${escapeHtml(isoDate)}"
        data-admin-calendar-month="${escapeHtml(targetMonth)}"
        aria-label="${escapeHtml(accessibleLabel)}"
      >
        <span class="admin-calendar-day-number">${escapeHtml(String(Number(isoDate.slice(8, 10))))}</span>
        <span class="admin-calendar-day-markers">${markerMarkup}${overflowMarker}</span>
      </button>
    `);
  }

  adminCalendarGrid.innerHTML = `
    <div class="admin-calendar-weekdays">${weekdayHeaders}</div>
    <div class="admin-calendar-days">${dayCells.join('')}</div>
  `;
}

function renderAdminCalendarFilterBar(events) {
  if (!adminCalendarFilterBar) {
    return;
  }

  const groupedCounts = new Map();
  (Array.isArray(events) ? events : []).forEach((event) => {
    const markerGroup = getAdminCalendarMarkerGroup(event.category);
    groupedCounts.set(markerGroup, (groupedCounts.get(markerGroup) || 0) + 1);
  });

  if (!groupedCounts.size) {
    adminCalendarFilterBar.innerHTML = '';
    return;
  }

  const filters = [
    { key: 'all', label: 'All', count: events.length },
    ...Array.from(groupedCounts.entries()).map(([key, count]) => ({
      key,
      label: ADMIN_CALENDAR_MARKER_META[key]?.label || key,
      count,
    })),
  ];

  if (!filters.some((filter) => filter.key === selectedAdminCalendarFilter)) {
    selectedAdminCalendarFilter = 'all';
  }

  adminCalendarFilterBar.innerHTML = filters
    .map(
      (filter) => `
        <button
          type="button"
          class="admin-calendar-filter-btn${filter.key === selectedAdminCalendarFilter ? ' is-active' : ''}"
          data-admin-calendar-filter="${escapeHtml(filter.key)}"
        >
          ${escapeHtml(filter.label)} <span>${escapeHtml(String(filter.count))}</span>
        </button>
      `
    )
    .join('');
}

function getFilteredAdminCalendarDayEvents(events) {
  if (selectedAdminCalendarFilter === 'all') {
    return events;
  }

  return (Array.isArray(events) ? events : []).filter(
    (event) => getAdminCalendarMarkerGroup(event.category) === selectedAdminCalendarFilter
  );
}

function renderAdminCalendarEventCard(event) {
  const eventMeta = getAdminCalendarEventMeta(event.category);
  const markerGroup = getAdminCalendarMarkerGroup(event.category);
  const metric = formatAdminCalendarMetric(event.metric_value, event.metric_unit);
  const eventStamp = formatAdminCalendarEventStamp(event.event_at);

  return `
    <article class="admin-calendar-event-card is-${escapeHtml(markerGroup)}">
      <div class="admin-calendar-event-badge is-${escapeHtml(markerGroup)}">${escapeHtml(eventMeta.shortLabel)}</div>
      <div class="admin-calendar-event-copy">
        <div class="admin-calendar-event-head">
          <p class="admin-calendar-event-type">${escapeHtml(eventMeta.label)}</p>
          ${metric ? `<p class="admin-calendar-event-metric">${escapeHtml(metric)}</p>` : ''}
        </div>
        <h4>${escapeHtml(event.title || eventMeta.label)}</h4>
        ${event.subtitle ? `<p class="admin-calendar-event-subtitle">${escapeHtml(event.subtitle)}</p>` : ''}
        ${event.detail ? `<p class="admin-calendar-event-detail">${escapeHtml(event.detail)}</p>` : ''}
        <div class="admin-calendar-event-tags">
          ${event.meta ? `<span class="admin-calendar-event-tag">${escapeHtml(event.meta)}</span>` : ''}
          ${eventStamp ? `<span class="admin-calendar-event-tag">${escapeHtml(eventStamp)}</span>` : ''}
        </div>
        ${event.notes ? `<p class="admin-calendar-event-note">${escapeHtml(event.notes)}</p>` : ''}
      </div>
    </article>
  `;
}

function renderAdminCalendarDayDetails(payload) {
  const groupedEvents = buildAdminCalendarEventsByDate(payload?.events || []);
  const selectedEvents = groupedEvents.get(selectedAdminCalendarDate) || [];
  const filteredEvents = getFilteredAdminCalendarDayEvents(selectedEvents);

  if (adminCalendarSelectedLabel) {
    adminCalendarSelectedLabel.textContent = formatAdminCalendarSelectedDateLabel(selectedAdminCalendarDate);
  }

  if (adminCalendarSelectedMeta) {
    adminCalendarSelectedMeta.textContent = selectedEvents.length
      ? `${selectedEvents.length} activit${selectedEvents.length === 1 ? 'y' : 'ies'} recorded`
      : 'No activities recorded';
  }

  renderAdminCalendarFilterBar(selectedEvents);

  if (!adminCalendarDayEvents) {
    return;
  }

  if (!selectedEvents.length) {
    adminCalendarDayEvents.innerHTML = `
      <div class="admin-calendar-empty-state">
        <p>No activities were recorded for this day.</p>
        <span>When you log rain, feed, field work, treatments, or movements, they will show here.</span>
      </div>
    `;
    return;
  }

  if (!filteredEvents.length) {
    adminCalendarDayEvents.innerHTML = `
      <div class="admin-calendar-empty-state">
        <p>No activities matched this filter.</p>
        <span>Try another activity group for this day.</span>
      </div>
    `;
    return;
  }

  adminCalendarDayEvents.innerHTML = filteredEvents.map((event) => renderAdminCalendarEventCard(event)).join('');
}

function renderAdminCalendarPanel(payload) {
  if (!payload) {
    return;
  }

  selectedAdminCalendarMonth = normalizeYearMonth(payload.month) || currentYearMonthString();

  if (adminCalendarMonthLabel) {
    adminCalendarMonthLabel.textContent = formatMonthYearLabel(selectedAdminCalendarMonth);
  }

  renderAdminCalendarGrid(payload);
  renderAdminCalendarDayDetails(payload);
}

function getAdminCalendarMonthPayload(yearMonth = selectedAdminCalendarMonth) {
  return adminCalendarMonthCache.get(normalizeYearMonth(yearMonth) || currentYearMonthString()) || null;
}

function setAdminCalendarSelectedDate(isoDate, options = {}) {
  const normalizedDate = normalizeDateForDateInput(isoDate);
  if (!normalizedDate) {
    return;
  }

  selectedAdminCalendarDate = normalizedDate;
  if (options.preserveFilter !== true) {
    selectedAdminCalendarFilter = 'all';
  }

  const payload = getAdminCalendarMonthPayload(normalizedDate.slice(0, 7));
  if (payload) {
    renderAdminCalendarPanel(payload);
  }
}

function setAdminCalendarFilter(filterKey) {
  selectedAdminCalendarFilter = String(filterKey || 'all');
  const payload = getAdminCalendarMonthPayload(selectedAdminCalendarMonth);
  if (payload) {
    renderAdminCalendarDayDetails(payload);
  }
}

function revealAdminCalendarDayDetails() {
  if (!adminCalendarDayPanel) {
    return;
  }

  adminCalendarDayPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  adminCalendarDayPanel.classList.remove('panel-flash');
  void adminCalendarDayPanel.offsetWidth;
  adminCalendarDayPanel.classList.add('panel-flash');

  window.setTimeout(() => {
    adminCalendarDayPanel.classList.remove('panel-flash');
  }, 1400);
}

function getAdminCalendarPreferredDateForMonth(targetMonth) {
  const monthInfo = getMonthDateInfo(targetMonth);
  const currentDay = Number((selectedAdminCalendarDate || '').slice(8, 10) || 1);
  return buildIsoDateFromParts(monthInfo.year, monthInfo.month_index, Math.min(currentDay, monthInfo.total_days));
}

async function loadAdminCalendarMonth(yearMonth, options = {}) {
  const normalizedMonth = normalizeYearMonth(yearMonth) || currentYearMonthString();
  const preferredDate = options.selectedDate || getAdminCalendarPreferredDateForMonth(normalizedMonth);
  const force = Boolean(options.force);

  if (!force) {
    const cachedPayload = adminCalendarMonthCache.get(normalizedMonth);
    if (cachedPayload) {
      selectedAdminCalendarMonth = normalizedMonth;
      selectedAdminCalendarDate = resolveAdminCalendarSelectedDate(cachedPayload, preferredDate);
      if (options.preserveFilter !== true) {
        selectedAdminCalendarFilter = 'all';
      }
      renderAdminCalendarPanel(cachedPayload);
      return { ok: true, payload: cachedPayload };
    }
  }

  selectedAdminCalendarMonth = normalizedMonth;
  if (options.silent !== true) {
    renderAdminCalendarStatus('Loading month...', 'Pulling activities for this month.');
  }

  const requestToken = ++adminCalendarLoadToken;

  try {
    const response = await fetch(`${CALENDAR_EVENTS_API_URL}?month=${encodeURIComponent(normalizedMonth)}`, {
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

    adminCalendarMonthCache.set(normalizedMonth, payload);

    if (requestToken === adminCalendarLoadToken) {
      selectedAdminCalendarMonth = normalizedMonth;
      selectedAdminCalendarDate = resolveAdminCalendarSelectedDate(payload, preferredDate);
      if (options.preserveFilter !== true) {
        selectedAdminCalendarFilter = 'all';
      }
      renderAdminCalendarPanel(payload);
    }

    return { ok: true, payload };
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to view calendar.')) {
      clearDashboardView();
      return { ok: false, error };
    }

    if (requestToken === adminCalendarLoadToken) {
      renderAdminCalendarStatus('Calendar unavailable', error.message);
    }
    return { ok: false, error };
  }
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

function setLoadingOverlayContent(message, detail = 'This only takes a moment.') {
  if (loadingOverlayTitle) {
    loadingOverlayTitle.textContent = message || 'Loading dashboard...';
  }

  if (loadingOverlayDetail) {
    loadingOverlayDetail.textContent = detail || 'This only takes a moment.';
  }
}

function beginLoadingOverlay(message = 'Loading dashboard...', detail = 'Pulling the latest farm data.') {
  loadingOverlayCount += 1;
  setLoadingOverlayContent(message, detail);

  if (loadingOverlay) {
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.setAttribute('aria-hidden', 'false');
  }

  document.body.classList.add('loading-active');
}

function endLoadingOverlay() {
  loadingOverlayCount = Math.max(0, loadingOverlayCount - 1);
  if (loadingOverlayCount > 0) {
    return;
  }

  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
    loadingOverlay.setAttribute('aria-hidden', 'true');
  }

  document.body.classList.remove('loading-active');
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? 'var(--danger)' : 'var(--ink-soft)';
}

function applyMessageState(target, message, stateOrError = false) {
  if (!target) {
    return;
  }

  const hasMessage = Boolean(String(message || '').trim());
  const state = !hasMessage
    ? 'empty'
    : stateOrError === 'pending'
      ? 'pending'
      : stateOrError === 'warning'
        ? 'warning'
      : stateOrError === true || stateOrError === 'error'
        ? 'error'
        : 'success';

  target.textContent = message;
  target.classList.toggle('is-error', state === 'error');
  target.classList.toggle('is-success', state === 'success');
  target.classList.toggle('is-warning', state === 'warning');
  target.classList.toggle('is-pending', state === 'pending');
  target.classList.toggle('is-empty', state === 'empty');
}

function rememberActionTrigger(trigger) {
  if (trigger instanceof Element) {
    lastActionTrigger = trigger;
  }
}

function resolveActionRequestTrigger(explicitTrigger = null) {
  if (explicitTrigger instanceof Element) {
    return explicitTrigger;
  }

  if (lastActionTrigger instanceof Element && document.contains(lastActionTrigger)) {
    return lastActionTrigger;
  }

  return document.activeElement instanceof Element ? document.activeElement : null;
}

function resolveActionProgressMeta(url, payload, options = {}) {
  const inferredAction =
    options.actionKey ||
    (payload && typeof payload === 'object' && payload.action ? String(payload.action).trim() : '') ||
    (url === LOGIN_API_URL ? 'login' : '') ||
    (url === LOGOUT_API_URL ? 'logout' : '') ||
    'default';
  const meta = ACTION_PROGRESS_META[inferredAction] || ACTION_PROGRESS_META.default;

  return {
    actionKey: inferredAction,
    pendingMessage: options.pendingMessage || meta.pendingMessage || ACTION_PROGRESS_META.default.pendingMessage,
    busyLabel: options.busyLabel || meta.busyLabel || ACTION_PROGRESS_META.default.busyLabel,
  };
}

function resolveActionProgressTarget(trigger, options = {}) {
  if (options.targetKind === 'horseProfile') {
    return { kind: 'horseProfile' };
  }

  if (options.targetKind === 'horseFeedPlan') {
    return { kind: 'horseFeedPlan' };
  }

  if (options.targetKind === 'global') {
    return { kind: 'global' };
  }

  const explicitCard = resolveActionCard(options.card);
  if (explicitCard) {
    return { kind: 'action-card', card: explicitCard };
  }

  if (trigger instanceof Element) {
    if (horseFeedPlanForm?.contains(trigger) || horseFeedCalendarGrid?.contains(trigger)) {
      return { kind: 'horseFeedPlan' };
    }

    if (horseProfileForm?.contains(trigger) || horseFeedHistoryGroups?.contains(trigger)) {
      return { kind: 'horseProfile' };
    }

    const card = resolveActionCard(trigger) || resolveActionCard(lastActionCardId);
    if (card) {
      return { kind: 'action-card', card };
    }
  }

  const fallbackCard = resolveActionCard(lastActionCardId);
  if (fallbackCard) {
    return { kind: 'action-card', card: fallbackCard };
  }

  return { kind: 'global' };
}

function applyPendingMessageToTarget(targetConfig, message) {
  if (!String(message || '').trim()) {
    return;
  }

  if (targetConfig?.kind === 'horseProfile') {
    applyMessageState(horseProfileMessage, message, 'pending');
    return;
  }

  if (targetConfig?.kind === 'horseFeedPlan') {
    applyMessageState(horseFeedPlanMessage, message, 'pending');
    return;
  }

  if (targetConfig?.kind === 'action-card' && targetConfig.card) {
    applyMessageState(getActionCardMessageElement(targetConfig.card), message, 'pending');
    applyMessageState(actionMessage, '', false);
    return;
  }

  applyMessageState(actionMessage, message, 'pending');
}

function applyBusyStateToTrigger(trigger, busyLabel) {
  const form = trigger instanceof Element ? trigger.closest('form') : null;
  const primaryControl =
    trigger instanceof HTMLButtonElement ||
    (trigger instanceof HTMLInputElement && ['submit', 'button'].includes(trigger.type))
      ? trigger
      : form?.querySelector('button[type="submit"], button:not([type]), input[type="submit"]') || null;
  const controls = new Set();

  if (form) {
    form.querySelectorAll('button, input[type="submit"], input[type="button"]').forEach((element) => {
      controls.add(element);
    });
  }

  if (primaryControl instanceof Element) {
    controls.add(primaryControl);
  }

  if (trigger instanceof HTMLInputElement && trigger.type === 'checkbox') {
    controls.add(trigger);
  }

  const snapshots = [];
  controls.forEach((control) => {
    snapshots.push({
      control,
      disabled: Boolean(control.disabled),
      text: control instanceof HTMLInputElement ? control.value : control.textContent,
    });

    control.disabled = true;
    control.setAttribute('aria-busy', 'true');
    control.classList.add('is-busy');

    if (control === primaryControl && busyLabel) {
      if (control instanceof HTMLInputElement) {
        control.value = busyLabel;
      } else {
        control.textContent = busyLabel;
      }
    }
  });

  if (form) {
    form.classList.add('is-busy');
    form.setAttribute('aria-busy', 'true');
  }

  return () => {
    snapshots.forEach(({ control, disabled, text }) => {
      control.disabled = disabled;
      control.classList.remove('is-busy');
      control.removeAttribute('aria-busy');

      if (control === primaryControl && text != null) {
        if (control instanceof HTMLInputElement) {
          control.value = text;
        } else {
          control.textContent = text;
        }
      }
    });

    if (form) {
      form.classList.remove('is-busy');
      form.removeAttribute('aria-busy');
    }
  };
}

function beginActionRequestFeedback(url, payload, options = {}) {
  if (options.skipFeedback) {
    return () => {};
  }

  const trigger = resolveActionRequestTrigger(options.trigger);
  const meta = resolveActionProgressMeta(url, payload, options);
  const target = resolveActionProgressTarget(trigger, options);

  applyPendingMessageToTarget(target, meta.pendingMessage);
  pauseDashboardAutoRefresh();

  return applyBusyStateToTrigger(trigger, meta.busyLabel);
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

function initStoredSubpanelAccordion(panel, toggle, storageKey, options = {}) {
  if (!panel || !toggle || !storageKey) {
    return;
  }

  let collapsed = Boolean(options.defaultCollapsed);
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
    HORSE_FEED_HISTORY_COLLAPSED_STORAGE_KEY,
    { defaultCollapsed: true }
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
    if (paddockRestDaysInput) {
      paddockRestDaysInput.value = '';
    }
    if (paddockRestScopeSelect) {
      paddockRestScopeSelect.value = 'single';
    }
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
  if (paddockRestDaysInput) {
    paddockRestDaysInput.value = paddock.manual_rest_days == null ? '' : String(paddock.manual_rest_days);
  }
  if (paddockRestScopeSelect) {
    paddockRestScopeSelect.value = paddock.manual_rest_applies_to_descendants ? 'whole_block' : 'single';
  }
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

function openPaddockRestCorrection(paddock) {
  if (!paddock) {
    return;
  }

  withTargetViewVisible('paddock-save-form', () => {
    expandPanelForElement(actionHubPanel);
    expandActionCard(document.getElementById('action-card-paddocks'));
    setPaddockEditState(paddock, { scroll: true, focusName: false });

    if (paddockRestDaysInput) {
      paddockRestDaysInput.focus();
      paddockRestDaysInput.select();
    }

    setActionMessage(
      paddock.occupied_by
        ? `Reviewing rest correction for ${paddock.name}. This paddock is currently occupied, so the corrected rest days will show after it is empty again.`
        : `Correcting rest for ${paddock.name}. Enter the real current rest days and save. This manual correction overrides grazing history until you clear it.`,
      false,
      {
        card: 'action-card-paddocks',
      }
    );
  });
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
  horseGroupMoveContext.textContent = `Selected group: ${group.name}. ${horsesLabel}. Current state: ${currentPaddocks}.`;
  horseGroupMoveContext.classList.remove('hidden');
}

function syncHorseGroupMoveSelectionContext() {
  const selectedGroup = findHorseGroupById(grazingGroupMoveInGroupSelect?.value || '');
  syncHorseGroupMoveContext(selectedGroup);
  return selectedGroup;
}

function getHorseGroupCurrentLocations(group) {
  return Array.isArray(group?.current_locations)
    ? group.current_locations.filter((location) => String(location?.location_name || '').trim())
    : [];
}

function getHorseGroupCurrentPaddockIds(group) {
  return Array.isArray(group?.current_paddock_ids)
    ? group.current_paddock_ids
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)
    : [];
}

function getHorseGroupSingleCurrentLocation(group) {
  const currentLocations = getHorseGroupCurrentLocations(group);
  return currentLocations.length === 1 ? currentLocations[0] : null;
}

function resolveHorseGroupCurrentPaddockId(group) {
  const singleCurrentLocation = getHorseGroupSingleCurrentLocation(group);
  if (singleCurrentLocation?.location_id) {
    return String(singleCurrentLocation.location_id);
  }

  const currentPaddockIds = getHorseGroupCurrentPaddockIds(group);
  if (currentPaddockIds.length === 1) {
    return String(currentPaddockIds[0]);
  }

  const singleCurrentPaddockName = String(group?.current_paddock_names || '').trim();
  if (!singleCurrentPaddockName || singleCurrentPaddockName.includes(',')) {
    return '';
  }

  return String(findPaddockByName(singleCurrentPaddockName)?.id || '');
}

function syncHorseGroupMembersContext(group) {
  if (!horseGroupMembersContext) {
    return;
  }

  if (!group) {
    horseGroupMembersContext.textContent = '';
    horseGroupMembersContext.classList.add('hidden');
    return;
  }

  const currentPaddocks = formatHorseGroupCurrentPaddockSummary(group);
  const unassignedCount = Math.max(0, Number(group?.unassigned_member_count || 0));
  const hasSingleCurrentLocation = Boolean(getHorseGroupSingleCurrentLocation(group));
  const contextParts = [`Current state: ${currentPaddocks === '-' ? 'no paddock assigned yet' : currentPaddocks}.`];

  if (unassignedCount > 0 && hasSingleCurrentLocation) {
    contextParts.push(
      `${formatHorseCountLabel(
        unassignedCount
      )} need a paddock. After saving members, use Current State to place them back with the group.`
    );
  } else if (unassignedCount > 0) {
    contextParts.push(
      `${formatHorseCountLabel(
        unassignedCount
      )} need a paddock. After saving members, open Current State to choose where they should be now.`
    );
  } else if (hasSingleCurrentLocation) {
    contextParts.push('Horses returned to this group can be placed back with the group from Current State.');
  }

  horseGroupMembersContext.textContent = contextParts.join(' ');
  horseGroupMembersContext.classList.remove('hidden');
}

function focusHorseGroupMembersSection(group) {
  const horseGroupsCard = document.getElementById('action-card-horse-groups');
  const membersSection = document.getElementById('horse-group-members-section');
  expandPanelForElement(membersSection || horseGroupsCard);
  expandActionCard(horseGroupsCard);

  let hasSelectedGroupOption = false;
  if (group && horseGroupMembersSelect) {
    hasSelectedGroupOption = Array.from(horseGroupMembersSelect.options).some(
      (option) => String(option.value) === String(group.id)
    );
    if (hasSelectedGroupOption) {
      horseGroupMembersSelect.value = String(group.id);
      syncHorseGroupMembersSelection();
    }
  }

  if (group && !hasSelectedGroupOption) {
    syncHorseGroupMembersContext(group);
  }

  if (membersSection) {
    membersSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (horseGroupMembersSearchInput && !horseGroupMembersSearchInput.disabled) {
    horseGroupMembersSearchInput.focus();
  }

  return hasSelectedGroupOption;
}

function openHorseGroupMembersEditor(group) {
  if (!group) {
    return;
  }

  withTargetViewVisible('horse-group-members-section', () => {
    const membersReady = focusHorseGroupMembersSection(group);

    setActionMessage(
      membersReady
        ? `Editing members for ${group.name}. Save Members changes who belongs to the group; use Current State if those horses should also rejoin a paddock today.`
        : `Open ${group.name} in Assign Members to update who belongs to the group.`,
      false,
      {
        card: 'action-card-horse-groups',
      }
    );
  });
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

function openHorseGroupCurrentMoveCorrection(group) {
  if (!group) {
    return;
  }

  const preferredPaddockId = resolveHorseGroupCurrentPaddockId(group);
  const currentLocations = getHorseGroupCurrentLocations(group);
  const singleCurrentLocation = getHorseGroupSingleCurrentLocation(group);
  const currentPaddockIds = getHorseGroupCurrentPaddockIds(group);
  const memberCount = Math.max(0, Number(group?.member_count || 0));
  const unassignedCount = Math.max(0, Number(group?.unassigned_member_count || 0));
  const targetDate = normalizeDateForDateInput(
    singleCurrentLocation?.entered_at || group.current_grazing_entered_at || todayDate
  );

  withTargetViewVisible('horse-group-move-in-section', () => {
    const moveReady = focusHorseGroupMoveSection(group);

    if (!moveReady) {
      setActionMessage(`Activate ${group.name} before updating its current state.`, true, {
        card: 'action-card-horse-groups',
      });
      return;
    }

    if (grazingGroupMoveInDateInput) {
      grazingGroupMoveInDateInput.value = targetDate || todayDate;
    }

    let prefilledPaddock = false;
    if (preferredPaddockId && grazingGroupMoveInPaddockSelect) {
      const hasOption = Array.from(grazingGroupMoveInPaddockSelect.options).some(
        (option) => String(option.value) === preferredPaddockId
      );
      if (hasOption) {
        grazingGroupMoveInPaddockSelect.value = preferredPaddockId;
        prefilledPaddock = true;
      }
    }

    if (grazingGroupMoveInNotesInput) {
      grazingGroupMoveInNotesInput.value = '';
    }

    if (prefilledPaddock && grazingGroupMoveInDateInput) {
      grazingGroupMoveInDateInput.focus();
    } else if (grazingGroupMoveInPaddockSelect) {
      grazingGroupMoveInPaddockSelect.focus();
    }

    const currentPaddockSummary = formatHorseGroupCurrentPaddockSummary(group);
    const isSplit = currentLocations.length > 1;
    const hasNoCurrentPaddock = currentLocations.length === 0;

    setActionMessage(
      unassignedCount > 0 && singleCurrentLocation
        ? `Resolving current state for ${group.name}. ${formatHorseCountLabel(
            unassignedCount
          )} should rejoin ${singleCurrentLocation.location_name}. Review the date, then save with "Correct Current Paddock + Date".`
        : isSplit
          ? `Reviewing split state for ${group.name}. It is currently spread across ${currentPaddockSummary}. Choose the paddock that should stay current, then save with "Correct Current Paddock + Date".`
          : hasNoCurrentPaddock && memberCount > 0
            ? `Setting current state for ${group.name}. Choose the paddock where this group is now, then save with "Move Group".`
            : prefilledPaddock
              ? targetDate
                ? `Reviewing current state for ${group.name}. Confirm the paddock and move date, then use "Correct Current Paddock + Date" if this is a correction.`
                : `Reviewing current state for ${group.name}. Confirm the paddock and date, then save the correction.`
              : currentPaddockIds.length > 1
                ? `Fixing ${group.name}. Choose which paddock should stay current, then save with "Correct Current Paddock + Date".`
                : `Reviewing current state for ${group.name}. Choose the paddock and save the action that matches what really happened.`,
      false,
      {
        card: 'action-card-horse-groups',
      }
    );
  });
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

function getSummaryMetricValue(data, metricKey) {
  if (metricKey === 'pasture_status') {
    const pastureCard = buildPastureRyegrassCardData(data?.paddocks || []);

    if (pastureCard.state === 'ready') {
      return 'Ready';
    }
    if (pastureCard.state === 'growing') {
      return 'Growing';
    }
    if (pastureCard.state === 'occupied') {
      return 'Active';
    }
    if (pastureCard.state === 'resting') {
      return 'Resting';
    }
    return 'Setup';
  }

  return data?.summary?.[metricKey];
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
      const value = getSummaryMetricValue(data, item.key);
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

function focusSectionTarget(targetId, options = {}) {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  if (target.classList.contains('panel') && target.classList.contains('panel-collapsed')) {
    setPanelCollapsed(target, false);
    const stateMap = readPanelStateMap();
    const header = target.querySelector(':scope > h2');
    const panelId = target.dataset.panelId || panelIdFromTitle(header?.textContent, 0);
    target.dataset.panelId = panelId;
    stateMap[panelId] = false;
    savePanelStateMap(stateMap);
  }

  const offset = Number(options?.offset || 0);
  if (offset > 0) {
    const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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

function isMobileBottomNavActiveViewport() {
  return typeof window !== 'undefined' ? window.innerWidth <= 780 : false;
}

function isDesktopTopNavActiveViewport() {
  return typeof window !== 'undefined' ? window.innerWidth > 780 : false;
}

function getMobileNavViewConfig(viewKey) {
  return MOBILE_NAV_VIEWS[viewKey] || MOBILE_NAV_VIEWS.home;
}

function getDesktopTopNavScrollOffset() {
  if (!desktopTopNav || !isDesktopTopNavActiveViewport()) {
    return 0;
  }

  return desktopTopNav.offsetHeight + 22;
}

function buildMobilePageIntro(view) {
  if (view.showIntro === false) {
    return null;
  }

  const intro = document.createElement('section');
  intro.className = 'mobile-page-intro';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'mobile-page-eyebrow';
  eyebrow.textContent = 'Mobile View';

  const title = document.createElement('h2');
  title.textContent = view.title;

  const description = document.createElement('p');
  description.className = 'mobile-page-description';
  description.textContent = view.description;

  intro.append(eyebrow, title, description);

  if (Array.isArray(view.shortcuts) && view.shortcuts.length) {
    const shortcuts = document.createElement('div');
    shortcuts.className = 'mobile-page-shortcuts';

    view.shortcuts.forEach((shortcut) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mobile-page-shortcut';
      button.setAttribute('data-target-id', shortcut.targetId);
      button.textContent = shortcut.label;
      shortcuts.appendChild(button);
    });

    intro.appendChild(shortcuts);
  }

  return intro;
}

function ensureMobilePageDeck() {
  if (!dashboardMain) {
    return null;
  }

  if (!originalDashboardChildOrder.length) {
    originalDashboardChildOrder = Array.from(dashboardMain.children);
  }

  if (mobilePageDeck) {
    return mobilePageDeck;
  }

  mobilePageDeck = document.createElement('div');
  mobilePageDeck.id = 'mobile-page-deck';
  mobilePageDeck.className = 'mobile-page-deck';

  Object.entries(MOBILE_NAV_VIEWS).forEach(([viewKey, view]) => {
    const page = document.createElement('section');
    page.id = view.pageId;
    page.className = 'mobile-admin-page';
    page.setAttribute('data-mobile-page', viewKey);

    const intro = buildMobilePageIntro(view);
    if (intro) {
      page.appendChild(intro);
    }

    const content = document.createElement('div');
    content.className = 'mobile-admin-page-content';
    page.appendChild(content);

    mobilePageContainers.set(viewKey, { page, content });
    mobilePageDeck.appendChild(page);
  });

  mobilePageDeck.addEventListener('click', (event) => {
    const button = event.target.closest('.mobile-page-shortcut[data-target-id]');
    if (!button) {
      return;
    }

    const targetId = button.getAttribute('data-target-id');
    if (!targetId) {
      return;
    }

    const targetViewKey = findMobileNavViewKeyForTarget(targetId);
    if (targetViewKey !== activeMobileNavView) {
      applyMobileNavView(targetViewKey, { targetId });
      return;
    }

    focusSectionTarget(targetId);
  });

  dashboardMain.appendChild(mobilePageDeck);
  return mobilePageDeck;
}

function resolveMobileNavDashboardBlock(selector) {
  if (!dashboardMain) {
    return null;
  }

  const element = document.querySelector(selector);
  if (!element) {
    return null;
  }

  if (element.parentElement === dashboardMain) {
    return element;
  }

  let current = element;
  while (current && current.parentElement && current.parentElement !== dashboardMain) {
    current = current.parentElement;
  }

  return current?.parentElement === dashboardMain ? current : null;
}

function activateMobilePageLayout() {
  if (!dashboardMain) {
    return false;
  }

  ensureMobilePageDeck();

  if (!mobilePageDeck) {
    return false;
  }

  const assignedBlocks = new Set();

  Object.entries(MOBILE_NAV_VIEWS).forEach(([viewKey, view]) => {
    const pageContainer = mobilePageContainers.get(viewKey);
    if (!pageContainer) {
      return;
    }

    view.blockSelectors.forEach((selector) => {
      const block = resolveMobileNavDashboardBlock(selector);
      if (!block || assignedBlocks.has(block) || block === mobilePageDeck) {
        return;
      }

      assignedBlocks.add(block);
      pageContainer.content.appendChild(block);
    });
  });

  dashboardMain.setAttribute('data-mobile-page-layout', 'active');
  mobilePageLayoutActive = true;
  return true;
}

function deactivateMobilePageLayout() {
  if (!dashboardMain || !mobilePageDeck || !originalDashboardChildOrder.length) {
    return;
  }

  originalDashboardChildOrder.forEach((child) => {
    if (child === mobilePageDeck) {
      return;
    }

    dashboardMain.insertBefore(child, mobilePageDeck);
  });

  mobilePageContainers.forEach(({ page }) => {
    page.classList.remove('is-active');
  });

  dashboardMain.setAttribute('data-mobile-page-layout', 'inactive');
  mobilePageLayoutActive = false;
}

function readMobileNavView() {
  try {
    const stored = localStorage.getItem(MOBILE_NAV_VIEW_STORAGE_KEY);
    return MOBILE_NAV_VIEWS[stored] ? stored : 'home';
  } catch (_error) {
    return 'home';
  }
}

function saveMobileNavView(viewKey) {
  try {
    localStorage.setItem(MOBILE_NAV_VIEW_STORAGE_KEY, viewKey);
  } catch (_error) {
    // Ignore storage failures and keep the current in-memory state.
  }
}

function setActiveMobileBottomNavItem(viewKey) {
  if (!mobileBottomNavItems.length) {
    return;
  }

  mobileBottomNavItems.forEach((item) => {
    const isActive = item.getAttribute('data-view-key') === viewKey;
    item.classList.toggle('is-active', isActive);
    if (isActive) {
      item.setAttribute('aria-current', 'page');
    } else {
      item.removeAttribute('aria-current');
    }
  });
}

function setActiveDesktopTopNavItem(viewKey) {
  if (!desktopTopNavItems.length) {
    return;
  }

  desktopTopNavItems.forEach((item) => {
    const isActive = item.getAttribute('data-view-key') === viewKey;
    item.classList.toggle('is-active', isActive);
    if (isActive) {
      item.setAttribute('aria-current', 'page');
    } else {
      item.removeAttribute('aria-current');
    }
  });

  if (desktopTopNavDescription) {
    desktopTopNavDescription.textContent = getMobileNavViewConfig(viewKey).description || '';
  }
}

function setActiveMobilePage(viewKey) {
  mobilePageContainers.forEach(({ page }, key) => {
    page.classList.toggle('is-active', key === viewKey);
  });
}

function clearMobileNavHiddenState() {
  deactivateMobilePageLayout();
}

function clearDesktopNavHiddenState() {
  if (!dashboardMain) {
    return;
  }

  Array.from(dashboardMain.children).forEach((child) => {
    child.classList.remove('desktop-nav-hidden');
  });

  dashboardMain.removeAttribute('data-desktop-view-layout');
  dashboardMain.removeAttribute('data-desktop-active-view');
}

function findMobileNavViewKeyForTarget(targetId) {
  if (!targetId) {
    return 'home';
  }

  if (MOBILE_NAV_TARGET_VIEW_OVERRIDES[targetId]) {
    return MOBILE_NAV_TARGET_VIEW_OVERRIDES[targetId];
  }

  const targetSelector = `#${targetId}`;
  const matchingView = Object.entries(MOBILE_NAV_VIEWS).find(([, view]) => {
    return (
      view.primaryTargetId === targetId ||
      view.pageId === targetId ||
      view.blockSelectors.includes(targetSelector) ||
      view.shortcuts?.some((shortcut) => shortcut.targetId === targetId)
    );
  });

  return matchingView?.[0] || 'more';
}

function applyMobileNavView(viewKey, options = {}) {
  const resolvedViewKey = MOBILE_NAV_VIEWS[viewKey] ? viewKey : 'home';
  const view = getMobileNavViewConfig(resolvedViewKey);

  activeMobileNavView = resolvedViewKey;
  setActiveMobileBottomNavItem(resolvedViewKey);

  if (!isMobileBottomNavActiveViewport()) {
    clearMobileNavHiddenState();
    return;
  }

  if (!mobilePageLayoutActive) {
    activateMobilePageLayout();
  }

  setActiveMobilePage(resolvedViewKey);

  if (options.persist !== false) {
    saveMobileNavView(resolvedViewKey);
  }

  if (options.scrollToTarget !== false) {
    const targetId = options.targetId || view.primaryTargetId;
    window.requestAnimationFrame(() => {
      focusSectionTarget(targetId);
    });
  }
}

function applyDesktopTopNavView(viewKey, options = {}) {
  const resolvedViewKey = MOBILE_NAV_VIEWS[viewKey] ? viewKey : 'home';
  const view = getMobileNavViewConfig(resolvedViewKey);

  activeMobileNavView = resolvedViewKey;
  setActiveDesktopTopNavItem(resolvedViewKey);

  if (!isDesktopTopNavActiveViewport()) {
    clearDesktopNavHiddenState();
    return;
  }

  const visibleBlocks = new Set();
  ['#dashboard-top', '.status-row'].forEach((selector) => {
    const block = resolveMobileNavDashboardBlock(selector);
    if (block) {
      visibleBlocks.add(block);
    }
  });
  view.blockSelectors.forEach((selector) => {
    const block = resolveMobileNavDashboardBlock(selector);
    if (block) {
      visibleBlocks.add(block);
    }
  });

  Array.from(dashboardMain.children).forEach((child) => {
    if (child === desktopTopNav || child.tagName === 'DATALIST') {
      child.classList.remove('desktop-nav-hidden');
      return;
    }

    child.classList.toggle('desktop-nav-hidden', !visibleBlocks.has(child));
  });

  dashboardMain.setAttribute('data-desktop-view-layout', 'active');
  dashboardMain.setAttribute('data-desktop-active-view', resolvedViewKey);

  if (options.persist !== false) {
    saveMobileNavView(resolvedViewKey);
  }

  if (options.scrollToTarget !== false) {
    const targetId = options.targetId || view.primaryTargetId;
    window.requestAnimationFrame(() => {
      focusSectionTarget(targetId, { offset: getDesktopTopNavScrollOffset() });
    });
  }
}

function withTargetViewVisible(targetId, callback) {
  const runCallback = typeof callback === 'function' ? callback : null;
  const viewKey = targetId ? findMobileNavViewKeyForTarget(targetId) : null;

  if (isMobileBottomNavActiveViewport() && targetId) {
    applyMobileNavView(viewKey, { targetId, scrollToTarget: false });

    if (runCallback) {
      window.requestAnimationFrame(() => {
        runCallback();
      });
    }
    return;
  }

  if (isDesktopTopNavActiveViewport() && targetId) {
    applyDesktopTopNavView(viewKey, { targetId, scrollToTarget: false });

    if (runCallback) {
      window.requestAnimationFrame(() => {
        runCallback();
      });
      return;
    }

    window.requestAnimationFrame(() => {
      focusSectionTarget(targetId, { offset: getDesktopTopNavScrollOffset() });
    });
    return;
  }

  if (runCallback) {
    runCallback();
    return;
  }

  if (targetId) {
    focusSectionTarget(targetId);
  }
}

function syncDesktopTopNavForViewport() {
  if (!desktopTopNav || !desktopTopNavItems.length) {
    return;
  }

  if (!isDesktopTopNavActiveViewport()) {
    clearDesktopNavHiddenState();
    return;
  }

  applyDesktopTopNavView(activeMobileNavView || readMobileNavView(), {
    persist: false,
    scrollToTarget: false,
  });
}

function syncMobileNavForViewport() {
  if (!mobileBottomNav || !mobileBottomNavItems.length) {
    return;
  }

  if (!isMobileBottomNavActiveViewport()) {
    clearMobileNavHiddenState();
    return;
  }

  if (!mobilePageLayoutActive) {
    activateMobilePageLayout();
  }

  applyMobileNavView(activeMobileNavView || readMobileNavView(), {
    persist: false,
    scrollToTarget: false,
  });
}

function initMobileBottomNav() {
  if (!mobileBottomNav || !mobileBottomNavItems.length) {
    return;
  }

  activeMobileNavView = readMobileNavView();
  setActiveMobileBottomNavItem(activeMobileNavView);

  mobileBottomNavItems.forEach((item) => {
    item.addEventListener('click', () => {
      const viewKey = item.getAttribute('data-view-key') || 'home';
      const targetId = item.getAttribute('data-target-id') || getMobileNavViewConfig(viewKey).primaryTargetId;
      applyMobileNavView(viewKey, { targetId });
    });
  });

  window.addEventListener('resize', syncMobileNavForViewport);
  syncMobileNavForViewport();
}

function initDesktopTopNav() {
  if (!desktopTopNav || !desktopTopNavItems.length) {
    return;
  }

  activeMobileNavView = readMobileNavView();
  setActiveDesktopTopNavItem(activeMobileNavView);

  desktopTopNavItems.forEach((item) => {
    item.addEventListener('click', () => {
      const viewKey = item.getAttribute('data-view-key') || 'home';
      const targetId = item.getAttribute('data-target-id') || getMobileNavViewConfig(viewKey).primaryTargetId;
      applyDesktopTopNavView(viewKey, { targetId });
    });
  });

  window.addEventListener('resize', syncDesktopTopNavForViewport);
  syncDesktopTopNavForViewport();
}

function initAdminCalendarPanel() {
  if (adminCalendarGrid) {
    adminCalendarGrid.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-admin-calendar-date]');
      if (!button) {
        return;
      }

      const targetDate = button.getAttribute('data-admin-calendar-date');
      const targetMonth = button.getAttribute('data-admin-calendar-month') || selectedAdminCalendarMonth;
      if (!targetDate) {
        return;
      }
      const shouldRevealDetails = true;

      if (targetMonth !== selectedAdminCalendarMonth) {
        await loadAdminCalendarMonth(targetMonth, { selectedDate: targetDate });
        if (shouldRevealDetails) {
          window.requestAnimationFrame(() => {
            revealAdminCalendarDayDetails();
          });
        }
        return;
      }

      setAdminCalendarSelectedDate(targetDate);
      if (shouldRevealDetails) {
        window.requestAnimationFrame(() => {
          revealAdminCalendarDayDetails();
        });
      }
    });
  }

  if (adminCalendarFilterBar) {
    adminCalendarFilterBar.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-admin-calendar-filter]');
      if (!button) {
        return;
      }

      setAdminCalendarFilter(button.getAttribute('data-admin-calendar-filter') || 'all');
    });
  }

  if (adminCalendarPrevButton) {
    adminCalendarPrevButton.addEventListener('click', async () => {
      const previousMonth = addMonthsToYearMonth(selectedAdminCalendarMonth, -1);
      await loadAdminCalendarMonth(previousMonth, {
        selectedDate: getAdminCalendarPreferredDateForMonth(previousMonth),
      });
    });
  }

  if (adminCalendarNextButton) {
    adminCalendarNextButton.addEventListener('click', async () => {
      const nextMonth = addMonthsToYearMonth(selectedAdminCalendarMonth, 1);
      await loadAdminCalendarMonth(nextMonth, {
        selectedDate: getAdminCalendarPreferredDateForMonth(nextMonth),
      });
    });
  }

  if (adminCalendarTodayButton) {
    adminCalendarTodayButton.addEventListener('click', async () => {
      const todayMonth = currentYearMonthString();
      await loadAdminCalendarMonth(todayMonth, {
        selectedDate: todayIsoDateString(),
      });
    });
  }

  renderAdminCalendarStatus('Calendar ready', 'Log in to load the month view.');
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

    withTargetViewVisible(targetId);
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

function renderFrostRows(rows) {
  if (!frostBody) {
    return;
  }

  if (!rows.length) {
    frostBody.innerHTML = emptyStateRow(4, 'No frost days logged yet.');
    return;
  }

  frostBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(formatDate(row.event_date))}</td>
          <td>${escapeHtml(formatFrostIntensityLabel(row.intensity))}</td>
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

function rainChartUsesTapTooltip() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(hover: none), (pointer: coarse)').matches
    : false;
}

function clearRainChartInteractionData() {
  if (!rainChart) {
    return;
  }

  rainChart.removeAttribute('data-row-count');
  rainChart.removeAttribute('data-padding-left');
  rainChart.removeAttribute('data-slot-width');
}

function clearRainChartBarHighlight() {
  if (!rainChart) {
    return;
  }

  rainChart.querySelectorAll('.rain-bar.is-active').forEach((bar) => {
    bar.classList.remove('is-active');
  });
}

function hideRainChartTooltip() {
  selectedRainTooltipIndex = null;
  clearRainChartBarHighlight();

  if (!rainChartTooltip) {
    return;
  }

  rainChartTooltip.classList.remove('is-visible');
  rainChartTooltip.setAttribute('aria-hidden', 'true');
}

function positionRainChartTooltip(clientX, clientY) {
  if (!rainChartTooltip || !rainChartWrap) {
    return;
  }

  const wrapRect = rainChartWrap.getBoundingClientRect();
  if (wrapRect.width <= 0 || wrapRect.height <= 0) {
    return;
  }

  const tooltipWidth = rainChartTooltip.offsetWidth;
  const tooltipHeight = rainChartTooltip.offsetHeight;
  const maxLeft = Math.max(8, wrapRect.width - tooltipWidth - 8);
  const maxTop = Math.max(8, wrapRect.height - tooltipHeight - 8);
  const relativeX = clientX - wrapRect.left;
  const relativeY = clientY - wrapRect.top;
  const gap = 12;

  let left = relativeX - tooltipWidth / 2;
  let top = relativeY - tooltipHeight - gap;

  if (top < 8) {
    top = relativeY + gap;
  }

  left = Math.min(Math.max(left, 8), maxLeft);
  top = Math.min(Math.max(top, 8), maxTop);

  rainChartTooltip.style.left = `${left}px`;
  rainChartTooltip.style.top = `${top}px`;
}

function showRainChartTooltipForBar(bar, options = {}) {
  if (!bar || !rainChartTooltip) {
    return;
  }

  const eventDate = bar.getAttribute('data-event-date') || '';
  const rainMm = Number(bar.getAttribute('data-rain-mm') || 0);

  clearRainChartBarHighlight();
  bar.classList.add('is-active');

  rainChartTooltip.innerHTML = `
    <p class="rain-chart-tooltip-date">${escapeHtml(formatDate(eventDate))}</p>
    <p class="rain-chart-tooltip-amount">${escapeHtml(formatRainMm(rainMm))} mm</p>
  `;
  rainChartTooltip.classList.add('is-visible');
  rainChartTooltip.setAttribute('aria-hidden', 'false');

  const barRect = bar.getBoundingClientRect();
  const clientX =
    Number.isFinite(options.clientX) && options.clientX != null
      ? options.clientX
      : barRect.left + barRect.width / 2;
  const clientY =
    Number.isFinite(options.clientY) && options.clientY != null
      ? options.clientY
      : barRect.top;

  positionRainChartTooltip(clientX, clientY);
}

function getRainChartBarFromClientPosition(clientX) {
  if (!rainChart) {
    return null;
  }

  const rowCount = Number.parseInt(rainChart.getAttribute('data-row-count') || '', 10);
  const paddingLeft = Number(rainChart.getAttribute('data-padding-left') || 0);
  const slotWidth = Number(rainChart.getAttribute('data-slot-width') || 0);
  if (!Number.isFinite(rowCount) || rowCount <= 0 || !Number.isFinite(slotWidth) || slotWidth <= 0) {
    return null;
  }

  const rect = rainChart.getBoundingClientRect();
  if (rect.width <= 0) {
    return null;
  }

  const scaledX = ((clientX - rect.left) / rect.width) * RAIN_BARS_VIEWBOX_WIDTH;
  if (!Number.isFinite(scaledX)) {
    return null;
  }

  const rawIndex = Math.floor((scaledX - paddingLeft) / slotWidth);
  const boundedIndex = Math.max(0, Math.min(rowCount - 1, rawIndex));
  return rainChart.querySelector(`.rain-bar[data-row-index="${boundedIndex}"]`);
}

function renderRainChartEmpty(message) {
  clearRainChartInteractionData();
  hideRainChartTooltip();

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
  clearRainChartInteractionData();
  hideRainChartTooltip();
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
      const label = `${formatDate(row.event_date)}: ${formatRainMm(row.rain_mm)} mm`;
      return `
        <rect
          class="rain-bar ${row.rain_mm >= RAIN_TARGET_MET_MM ? 'is-target-met' : ''}"
          data-row-index="${index}"
          data-event-date="${escapeHtml(row.event_date)}"
          data-rain-mm="${escapeHtml(row.rain_mm)}"
          x="${x}"
          y="${y}"
          width="${barWidth}"
          height="${barHeight}"
          rx="${Math.min(3, barWidth / 2)}"
          fill="${fillGradient}"
          aria-label="${escapeHtml(label)}"
        />
      `;
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

  rainChart.setAttribute('data-row-count', String(rows.length));
  rainChart.setAttribute('data-padding-left', String(padding.left));
  rainChart.setAttribute('data-slot-width', String(slotWidth));

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
    <rect
      class="rain-chart-hit-area"
      x="${padding.left}"
      y="${padding.top}"
      width="${plotWidth}"
      height="${plotHeight}"
      fill="transparent"
    />
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

function formatActivityTimelineText(value) {
  return String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function truncateActivityTimelineText(value, maxLength = 72) {
  const normalized = String(value || '').trim().replace(/\s+/g, ' ');
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function buildActivityTimelineEntry({
  date,
  category,
  title,
  compactSummary = '',
  summaryLines = [],
  metaLines = [],
}) {
  const normalizedDate = normalizeDateForDateInput(date);
  if (!normalizedDate || !title) {
    return null;
  }

  const categoryMeta = ACTIVITY_TIMELINE_META[category] || {
    icon: '📌',
    label: formatActivityTimelineText(category),
    priority: 99,
  };

  return {
    date: normalizedDate,
    category,
    icon: categoryMeta.icon,
    category_label: categoryMeta.label,
    priority: categoryMeta.priority,
    title,
    compact_summary: compactSummary || summaryLines[0] || '',
    summary_lines: summaryLines.filter(Boolean),
    meta_lines: metaLines.filter(Boolean),
  };
}

function buildFeedActivityTimelineEntries(rows) {
  return groupFeedHistoryRows(Array.isArray(rows) ? rows : [])
    .map((dayGroup) => {
      const completedSlots = [];
      let manualEntryCount = 0;

      dayGroup.slotGroups.forEach((slotGroup) => {
        if (slotGroup.feed_slot) {
          completedSlots.push(getFeedSlotLabel(slotGroup.feed_slot));
          return;
        }

        manualEntryCount += slotGroup.rows.length;
      });

      const summaryLines = [
        ...completedSlots.map((slotLabel) => `${slotLabel} completed`),
        ...(manualEntryCount === 1
          ? ['1 manual feed entry logged']
          : manualEntryCount > 1
            ? [`${manualEntryCount} manual feed entries logged`]
            : []),
      ];

      const completedSlotCount = completedSlots.length;
      const completedSlotSummary = completedSlotCount
        ? `${completedSlotCount} slot${completedSlotCount === 1 ? '' : 's'} completed`
        : '';
      const manualSummary = manualEntryCount
        ? `${manualEntryCount} manual ${manualEntryCount === 1 ? 'entry' : 'entries'}`
        : '';
      const compactSummary = [completedSlotSummary, manualSummary].filter(Boolean).join(' + ');

      const title = completedSlotCount
        ? manualEntryCount > 0
          ? 'Feed Activity'
          : 'Feed Completed'
        : 'Manual Feed Logged';

      return buildActivityTimelineEntry({
        date: dayGroup.dateKey,
        category: 'feed',
        title,
        compactSummary,
        summaryLines,
      });
    })
    .filter(Boolean);
}

function buildDewormingActivityTimelineEntries(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) =>
      buildActivityTimelineEntry({
        date: row.event_date || row.at,
        category: 'deworming',
        title: 'Deworming',
        compactSummary: truncateActivityTimelineText(`${row.product_name} administered`),
        summaryLines: [`${row.product_name} administered`],
        metaLines: row.next_due_date ? [`Next due: ${formatDate(row.next_due_date)}`] : [],
      })
    )
    .filter(Boolean);
}

function buildFarrierActivityTimelineEntries(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) =>
      buildActivityTimelineEntry({
        date: row.at,
        category: 'farrier',
        title: 'Farrier Visit',
        compactSummary: truncateActivityTimelineText(String(row.service_type || '').trim()),
        summaryLines: [String(row.service_type || '').trim()],
        metaLines: row.next_due_date ? [`Next due: ${formatDate(row.next_due_date)}`] : [],
      })
    )
    .filter(Boolean);
}

function buildHealthActivityTimelineEntries(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const title = row.event_type ? formatActivityTimelineText(row.event_type) : 'Health Event';
      const detail = String(row.description || '').trim() || 'Health event logged';
      return buildActivityTimelineEntry({
        date: row.at,
        category: 'health',
        title,
        compactSummary: truncateActivityTimelineText(detail),
        summaryLines: [detail],
      });
    })
    .filter(Boolean);
}

function buildGrazingActivityTimelineEntries(rows) {
  const chronologicalRows = [...(Array.isArray(rows) ? rows : [])].sort((left, right) => {
    const leftDate = normalizeDateForDateInput(left.entered_at);
    const rightDate = normalizeDateForDateInput(right.entered_at);
    if (leftDate !== rightDate) {
      return leftDate < rightDate ? -1 : 1;
    }

    return Number(left.id || 0) - Number(right.id || 0);
  });

  const activities = [];

  chronologicalRows.forEach((row, index) => {
    const previous = chronologicalRows[index - 1] || null;
    const next = chronologicalRows[index + 1] || null;
    const movedFromPrevious =
      previous &&
      previous.exited_at &&
      row.entered_at &&
      normalizeDateForDateInput(previous.exited_at) === normalizeDateForDateInput(row.entered_at);

    const enteredMetaLines = row.source_group_name ? [`Via group: ${row.source_group_name}`] : [];

    activities.push(
      buildActivityTimelineEntry({
        date: row.entered_at,
        category: 'grazing',
        title: movedFromPrevious ? 'Moved Paddocks' : 'Entered Paddock',
        compactSummary: movedFromPrevious ? `${previous.paddock_name} -> ${row.paddock_name}` : row.paddock_name,
        summaryLines: [movedFromPrevious ? `${previous.paddock_name} -> ${row.paddock_name}` : row.paddock_name],
        metaLines: enteredMetaLines,
      })
    );

    const movedIntoNext =
      row.exited_at &&
      next &&
      next.entered_at &&
      normalizeDateForDateInput(row.exited_at) === normalizeDateForDateInput(next.entered_at);

    if (row.exited_at && !movedIntoNext) {
      activities.push(
        buildActivityTimelineEntry({
          date: row.exited_at,
          category: 'grazing',
          title: 'Exited Paddock',
          compactSummary: row.paddock_name,
          summaryLines: [row.paddock_name],
        })
      );
    }
  });

  return activities.filter(Boolean);
}

function buildSupplementalActivityTimelineEntries(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const category = String(row.category || '').trim().toLowerCase();
      if (!['treatment_plan', 'dose'].includes(category)) {
        return null;
      }

      return buildActivityTimelineEntry({
        date: row.at,
        category,
        title: category === 'dose' ? 'Treatment Dose' : 'Treatment Plan',
        compactSummary: truncateActivityTimelineText(row.detail),
        summaryLines: [row.detail],
      });
    })
    .filter(Boolean);
}

function sortActivityTimelineEntries(entries) {
  return [...entries].sort((left, right) => {
    if (left.date !== right.date) {
      return left.date < right.date ? 1 : -1;
    }

    if (left.priority !== right.priority) {
      return Number(left.priority || 99) - Number(right.priority || 99);
    }

    return String(left.title || '').localeCompare(String(right.title || ''));
  });
}

function buildHorseActivityTimelineEntries(payload) {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  return [
    ...buildFeedActivityTimelineEntries(payload.feed_history || []),
    ...buildDewormingActivityTimelineEntries(payload.deworming_history || []),
    ...buildFarrierActivityTimelineEntries(payload.farrier_history || []),
    ...buildHealthActivityTimelineEntries(payload.health_history || []),
    ...buildGrazingActivityTimelineEntries(payload.grazing_history || []),
    ...buildSupplementalActivityTimelineEntries(payload.history || []),
  ];
}

function hasExpandableActivityTimelineDetails(entry) {
  const summaryLines = Array.isArray(entry?.summary_lines) ? entry.summary_lines.filter(Boolean) : [];
  const metaLines = Array.isArray(entry?.meta_lines) ? entry.meta_lines.filter(Boolean) : [];
  const compactSummary = String(entry?.compact_summary || '').trim();
  const firstSummaryLine = String(summaryLines[0] || '').trim();

  if (summaryLines.length > 1 || metaLines.length > 0) {
    return true;
  }

  return Boolean(firstSummaryLine && compactSummary && firstSummaryLine !== compactSummary);
}

function renderActivityTimelineDetails(entry) {
  const summaryLines = Array.isArray(entry?.summary_lines) ? entry.summary_lines.filter(Boolean) : [];
  const metaLines = Array.isArray(entry?.meta_lines) ? entry.meta_lines.filter(Boolean) : [];

  if (!summaryLines.length && !metaLines.length) {
    return '';
  }

  return `
    <div class="activity-row-details">
      ${
        summaryLines.length
          ? `<ul class="activity-row-list">${summaryLines
              .map((line) => `<li>${escapeHtml(line)}</li>`)
              .join('')}</ul>`
          : ''
      }
      ${
        metaLines.length
          ? `<div class="activity-row-meta">${metaLines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</div>`
          : ''
      }
    </div>
  `;
}

function renderActivityTimelineRow(entry) {
  const compactSummary = String(entry?.compact_summary || '').trim() || '-';
  const dateLabel = formatDate(entry.date);
  const summaryMarkup = `
    <span class="activity-row-main">
      <span class="activity-row-icon" aria-hidden="true">${escapeHtml(entry.icon)}</span>
      <span class="activity-row-copy">
        <strong>${escapeHtml(entry.title)}</strong>
        <span>${escapeHtml(compactSummary)}</span>
      </span>
    </span>
    <span class="activity-row-date">${escapeHtml(dateLabel)}</span>
  `;

  if (!hasExpandableActivityTimelineDetails(entry)) {
    return `
      <article class="activity-row activity-row-${escapeHtml(entry.category)} activity-row-static">
        <div class="activity-row-summary activity-row-summary-static">
          ${summaryMarkup}
        </div>
      </article>
    `;
  }

  return `
    <details class="activity-row activity-row-${escapeHtml(entry.category)}">
      <summary class="activity-row-summary">
        ${summaryMarkup}
      </summary>
      ${renderActivityTimelineDetails(entry)}
    </details>
  `;
}

function renderHorseActivityTimeline(payload) {
  if (!horseActivityTimeline) {
    return;
  }

  const hasHorse = Boolean(horseSelect?.value || horseProfileSelect?.value || '');
  if (!hasHorse) {
    horseActivityTimeline.innerHTML =
      '<p class="activity-timeline-empty">Choose a horse to review the activity timeline.</p>';
    return;
  }

  const entries = buildHorseActivityTimelineEntries(payload);

  if (!entries.length) {
    horseActivityTimeline.innerHTML =
      '<p class="activity-timeline-empty">No activity timeline for this horse yet.</p>';
    return;
  }

  const sortedEntries = sortActivityTimelineEntries(entries);

  horseActivityTimeline.innerHTML = sortedEntries.map((entry) => renderActivityTimelineRow(entry)).join('');
}

function todayIsoDateString() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToIsoDateString(dateString, dayOffset) {
  const normalized = normalizeDateForDateInput(dateString);
  if (!normalized) {
    return '';
  }

  const date = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  date.setUTCDate(date.getUTCDate() + Number(dayOffset || 0));
  return date.toISOString().slice(0, 10);
}

function getFeedHistorySourceKey(row) {
  const normalizedSource = String(row?.source || '')
    .trim()
    .toLowerCase();

  if (normalizedSource === 'calendar_plan' || row?.calendar_slot_entry_id != null) {
    return 'feed_plan';
  }

  return 'manual';
}

function getFeedHistorySourceLabel(sourceKey) {
  if (sourceKey === 'feed_plan') {
    return 'Feed Plan';
  }

  if (sourceKey === 'manual') {
    return 'Manual';
  }

  return 'Unknown';
}

function getFeedHistoryRowDate(row) {
  return normalizeDateForDateInput(row?.event_date || row?.at);
}

function getHorseFeedPlannedSlotKeys() {
  const plannedSlots = new Set();

  currentHorseFeedPlanRows.forEach((row) => {
    if (row?.feed_slot && row?.feed_item_name) {
      plannedSlots.add(row.feed_slot);
    }
  });

  return plannedSlots;
}

function getHorseFeedMainIngredients() {
  const ingredients = [];
  const seen = new Set();

  currentHorseFeedPlanRows.forEach((row) => {
    const ingredientName = String(row?.feed_item_name || '').trim();
    const ingredientKey = ingredientName.toLowerCase();
    if (!ingredientName || seen.has(ingredientKey)) {
      return;
    }

    seen.add(ingredientKey);
    ingredients.push(ingredientName);
  });

  return ingredients;
}

function getHorseFeedCompletedDatesBySlot(rows) {
  const completedDatesBySlot = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const feedSlot = row?.feed_slot;
    const eventDate = getFeedHistoryRowDate(row);
    if (!feedSlot || !eventDate) {
      return;
    }

    if (!completedDatesBySlot.has(feedSlot)) {
      completedDatesBySlot.set(feedSlot, new Set());
    }

    completedDatesBySlot.get(feedSlot).add(eventDate);
  });

  return completedDatesBySlot;
}

function getFeedSummaryTodayStatus(plannedSlots, completedDatesBySlot, todayIso, feedSlot) {
  if (!plannedSlots.has(feedSlot)) {
    return { label: 'Not planned', badgeClass: 'neutral' };
  }

  if (completedDatesBySlot.get(feedSlot)?.has(todayIso)) {
    return { label: 'Completed', badgeClass: 'ok' };
  }

  return { label: 'Pending', badgeClass: 'soon' };
}

function getFeedSummarySevenDayStatus(plannedSlots, completedDatesBySlot, startIso, todayIso, feedSlot) {
  if (!plannedSlots.has(feedSlot)) {
    return 'Not planned';
  }

  const completedDates = completedDatesBySlot.get(feedSlot) || new Set();
  let completedCount = 0;

  completedDates.forEach((dateKey) => {
    if (dateKey >= startIso && dateKey <= todayIso) {
      completedCount += 1;
    }
  });

  return `${completedCount}/7 completed`;
}

function renderHorseFeedSummary() {
  if (!horseFeedSummary) {
    return;
  }

  const hasHorse = Boolean(horseSelect?.value || horseProfileSelect?.value || '');
  if (!hasHorse) {
    horseFeedSummary.innerHTML = '<p class="feed-summary-empty">Choose a horse to review feed status.</p>';
    return;
  }

  const plannedSlots = getHorseFeedPlannedSlotKeys();
  const mainIngredients = getHorseFeedMainIngredients();
  const completedDatesBySlot = getHorseFeedCompletedDatesBySlot(currentFeedHistoryRows);
  const todayIso = todayIsoDateString();
  const sevenDayStartIso = addDaysToIsoDateString(todayIso, -6);
  const plannedSlotLabels = FEED_SLOT_META.filter((slot) => plannedSlots.has(slot.key)).map((slot) => slot.title);

  const noPlanMessage = plannedSlotLabels.length
    ? ''
    : '<p class="feed-summary-empty">No feed plan saved for this horse yet. Save a plan to track slot completion automatically.</p>';

  horseFeedSummary.innerHTML = `
    ${noPlanMessage}
    <div class="feed-summary-grid">
      <section class="feed-summary-section">
        <h4>Today</h4>
        <ul class="feed-summary-list">
          ${FEED_SLOT_META.map((slot) => {
            const status = getFeedSummaryTodayStatus(plannedSlots, completedDatesBySlot, todayIso, slot.key);
            return `
              <li>
                <span>${escapeHtml(slot.title)}</span>
                <span class="badge ${status.badgeClass}">${escapeHtml(status.label)}</span>
              </li>
            `;
          }).join('')}
        </ul>
      </section>

      <section class="feed-summary-section">
        <h4>Last 7 days</h4>
        <ul class="feed-summary-list">
          ${FEED_SLOT_META.map((slot) => `
            <li>
              <span>${escapeHtml(slot.title)}</span>
              <strong>${escapeHtml(
                getFeedSummarySevenDayStatus(plannedSlots, completedDatesBySlot, sevenDayStartIso, todayIso, slot.key)
              )}</strong>
            </li>
          `).join('')}
        </ul>
      </section>

      <section class="feed-summary-section">
        <h4>Planned slots</h4>
        <p class="feed-summary-copy">${
          plannedSlotLabels.length ? escapeHtml(plannedSlotLabels.join(', ')) : 'No slots planned yet.'
        }</p>
      </section>

      <section class="feed-summary-section">
        <h4>Main ingredients</h4>
        ${
          mainIngredients.length
            ? `<ul class="feed-summary-tag-list">${mainIngredients
                .map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`)
                .join('')}</ul>`
            : '<p class="feed-summary-copy">No ingredients saved yet.</p>'
        }
      </section>
    </div>
  `;
}

function syncHorseFeedHistoryFilterControls() {
  if (horseFeedHistoryPeriodFilter) {
    horseFeedHistoryPeriodFilter.value = currentHorseFeedHistoryFilters.period;
  }

  if (horseFeedHistorySlotFilter) {
    horseFeedHistorySlotFilter.value = currentHorseFeedHistoryFilters.slot;
  }

  if (horseFeedHistorySourceFilter) {
    horseFeedHistorySourceFilter.value = currentHorseFeedHistoryFilters.source;
  }
}

function resetHorseFeedHistoryFilters() {
  currentHorseFeedHistoryFilters = {
    period: '7d',
    slot: 'all',
    source: 'all',
  };
  syncHorseFeedHistoryFilterControls();
}

function getFilteredFeedHistoryRows(rows) {
  const period = currentHorseFeedHistoryFilters.period;
  const slotFilter = currentHorseFeedHistoryFilters.slot;
  const sourceFilter = currentHorseFeedHistoryFilters.source;
  const todayIso = todayIsoDateString();
  const periodStartIso =
    period === 'today'
      ? todayIso
      : period === '30d'
        ? addDaysToIsoDateString(todayIso, -29)
        : period === '7d'
          ? addDaysToIsoDateString(todayIso, -6)
          : '';

  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const eventDate = getFeedHistoryRowDate(row);
    if (!eventDate) {
      return false;
    }

    if (slotFilter !== 'all' && row.feed_slot !== slotFilter) {
      return false;
    }

    if (sourceFilter !== 'all' && getFeedHistorySourceKey(row) !== sourceFilter) {
      return false;
    }

    if (!periodStartIso) {
      return true;
    }

    return eventDate >= periodStartIso && eventDate <= todayIso;
  });
}

function groupFeedHistoryRows(rows) {
  const sortedRows = [...rows].sort((left, right) => {
    const leftDate = getFeedHistoryRowDate(left);
    const rightDate = getFeedHistoryRowDate(right);

    if (leftDate !== rightDate) {
      return leftDate < rightDate ? 1 : -1;
    }

    const slotDiff = getFeedSlotSortValue(left.feed_slot) - getFeedSlotSortValue(right.feed_slot);
    if (slotDiff !== 0) {
      return slotDiff;
    }

    return Number(left.id || 0) - Number(right.id || 0);
  });

  const dayMap = new Map();

  sortedRows.forEach((row) => {
    const dateKey = getFeedHistoryRowDate(row);
    if (!dateKey) {
      return;
    }

    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, {
        dateKey,
        slotMap: new Map(),
      });
    }

    const dayGroup = dayMap.get(dateKey);
    const slotKey = row.feed_slot || '__manual__';
    if (!dayGroup.slotMap.has(slotKey)) {
      dayGroup.slotMap.set(slotKey, {
        slotKey,
        feed_slot: row.feed_slot || null,
        rows: [],
      });
    }

    dayGroup.slotMap.get(slotKey).rows.push(row);
  });

  return Array.from(dayMap.values()).map((dayGroup) => ({
    dateKey: dayGroup.dateKey,
    slotGroups: Array.from(dayGroup.slotMap.values()).sort(
      (left, right) => getFeedSlotSortValue(left.feed_slot) - getFeedSlotSortValue(right.feed_slot)
    ),
  }));
}

function renderFeedHistoryGroups(rows) {
  if (!horseFeedHistoryGroups) {
    return;
  }

  const hasHorse = Boolean(horseSelect?.value || horseProfileSelect?.value || '');
  if (!hasHorse) {
    horseFeedHistoryGroups.innerHTML = '<p class="feed-history-empty">Choose a horse to review feed history.</p>';
    return;
  }

  const filteredRows = getFilteredFeedHistoryRows(rows);

  if (!filteredRows.length) {
    horseFeedHistoryGroups.innerHTML = '<p class="feed-history-empty">No feed history in this range.</p>';
    return;
  }

  const groupedRows = groupFeedHistoryRows(filteredRows);

  horseFeedHistoryGroups.innerHTML = groupedRows
    .map((dayGroup) => {
      const slotCount = dayGroup.slotGroups.length;

      return `
        <details class="feed-history-day">
          <summary>
            <span class="feed-history-day-title">${escapeHtml(formatDate(dayGroup.dateKey))}</span>
            <span class="feed-history-day-meta">${escapeHtml(
              `${slotCount} slot${slotCount === 1 ? '' : 's'}`
            )}</span>
          </summary>
          <div class="feed-history-day-body">
            ${dayGroup.slotGroups
              .map((slotGroup) => {
                const sourceLabels = [
                  ...new Set(slotGroup.rows.map((row) => getFeedHistorySourceLabel(getFeedHistorySourceKey(row)))),
                ];
                const slotLabel = slotGroup.feed_slot ? `${getFeedSlotLabel(slotGroup.feed_slot)} Mix` : 'Manual Entry';
                const sourceCopy =
                  sourceLabels.length === 1
                    ? `Source: ${sourceLabels[0]}`
                    : `Sources: ${sourceLabels.join(', ')}`;

                return `
                  <section class="feed-history-slot">
                    <div class="feed-history-slot-head">
                      <div>
                        <h4>${escapeHtml(slotLabel)}</h4>
                        <p>${escapeHtml(sourceCopy)}</p>
                      </div>
                    </div>
                    <ul class="feed-history-ingredient-list">
                      ${slotGroup.rows
                        .map((row) => `
                          <li class="feed-history-ingredient-row">
                            <div class="feed-history-ingredient-copy">
                              <strong>${escapeHtml(row.feed_item)}</strong>
                              <span>${escapeHtml(`${row.quantity} ${row.unit}`)}</span>
                            </div>
                            ${
                              row.calendar_slot_entry_id == null
                                ? `<div class="feed-history-ingredient-actions">
                                    <button
                                      type="button"
                                      class="inline-action-btn"
                                      data-feed-action="edit"
                                      data-feed-event-id="${escapeHtml(row.id)}"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      class="inline-action-btn danger"
                                      data-feed-action="delete"
                                      data-feed-event-id="${escapeHtml(row.id)}"
                                    >
                                      Delete
                                    </button>
                                  </div>`
                                : ''
                            }
                          </li>
                        `)
                        .join('')}
                    </ul>
                  </section>
                `;
              })
              .join('')}
          </div>
        </details>
      `;
    })
    .join('');
}

function renderFeedHistoryRows(rows) {
  currentFeedHistoryRows = Array.isArray(rows) ? rows : [];
  syncHorseFeedHistoryFilterControls();
  renderHorseFeedSummary();
  renderFeedHistoryGroups(currentFeedHistoryRows);
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
    horseGrazingHistoryBody.innerHTML = emptyStateRow(4, 'No grazing history for this horse yet.');
    return;
  }

  horseGrazingHistoryBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.paddock_name)}</td>
          <td>${escapeHtml(formatDate(row.entered_at))}</td>
          <td>${escapeHtml(row.exited_at ? formatDate(row.exited_at) : 'Current')}</td>
          <td>${escapeHtml(String(row.days ?? row.grazing_days ?? '-'))}</td>
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
  clearHorseFeedPlanningState(options);
  renderHorseActivityTimeline(null);
  renderFeedHistoryRows([]);
  renderDewormingHistoryRows([]);
  renderFarrierHistoryRows([]);
  renderHealthHistoryRows([]);
  renderHorseGrazingHistoryRows([]);
  renderHorseGroupHistoryRows([]);
  setHorseCurrentGrazing(null);
  setHorseCurrentGroup(null);
}

function renderHorseCategoryHistories(payload) {
  syncHorseFeedPlanningState(payload);
  renderHorseActivityTimeline(payload);
  renderFeedHistoryRows(payload.feed_history || []);
  renderDewormingHistoryRows(payload.deworming_history || []);
  renderFarrierHistoryRows(payload.farrier_history || []);
  renderHealthHistoryRows(payload.health_history || []);
  renderHorseGrazingHistoryRows(payload.grazing_history || []);
  renderHorseGroupHistoryRows(payload.group_history || []);
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
      let statusLabel = 'Ready';

      if (row.occupancy_state === 'occupied') {
        badgeClass = 'ok';
        statusLabel = 'Occupied';
      } else if (row.occupancy_state === 'growing') {
        badgeClass = 'growing';
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
          <td>${escapeHtml(formatPaddockRestDaysLabel(row))}</td>
          <td>${escapeHtml(formatPaddockReadySummary(row))}</td>
          <td>
            <button
              type="button"
              data-paddock-action="correct-rest"
              class="inline-action-btn"
              data-paddock-id="${escapeHtml(row.id)}"
            >
              Correct Rest
            </button>
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

function formatHorseCountLabel(count) {
  const safeCount = Math.max(0, Number(count || 0));
  return `${safeCount} horse${safeCount === 1 ? '' : 's'}`;
}

function formatDayCountLabel(count) {
  if (count == null) {
    return '-';
  }

  const safeCount = Math.max(0, Number(count || 0));
  return `${safeCount} day${safeCount === 1 ? '' : 's'}`;
}

function getPaddockOccupancyStatusBadgeClass(status) {
  const normalized = String(status || '')
    .trim()
    .toLowerCase();

  if (normalized === 'active') {
    return 'ok';
  }

  if (normalized === 'resting') {
    return 'soon';
  }

  if (normalized === 'inactive') {
    return 'overdue';
  }

  return 'neutral';
}

function renderPaddockOccupancyHorseDetails(horses) {
  if (!Array.isArray(horses) || !horses.length) {
    return '';
  }

  return `
    <details class="occupancy-horses-details">
      <summary>Show horses</summary>
      <ul class="occupancy-horse-list">
        ${horses
          .map((horse) => `<li>${escapeHtml(horse.name || `Horse ${horse.id}`)}</li>`)
          .join('')}
      </ul>
    </details>
  `;
}

function formatPaddockOccupancyGroupSummary(row) {
  const activeGroupNames = String(row?.active_group_names || '').trim();
  const ungroupedHorseCount = Math.max(0, Number(row?.ungrouped_horse_count || 0));
  const summaryParts = [];

  if (activeGroupNames) {
    summaryParts.push(activeGroupNames);
  }

  if (ungroupedHorseCount > 0) {
    summaryParts.push(`${ungroupedHorseCount} ungrouped`);
  }

  if (!summaryParts.length) {
    return 'No active group assigned';
  }

  return summaryParts.join(' + ');
}

function renderPaddockOccupancyRows(rows) {
  currentPaddockOccupancyRows = rows;

  const emptyMessage = 'No active paddock occupancy yet.';

  if (!rows.length) {
    paddockOccupancyBody.innerHTML = emptyStateRow(5, emptyMessage);
    if (paddockOccupancyCards) {
      paddockOccupancyCards.innerHTML = `<p class="paddock-occupancy-empty">${escapeHtml(emptyMessage)}</p>`;
    }
    return;
  }

  paddockOccupancyBody.innerHTML = rows
    .map((row) => {
      const horseCountLabel = formatHorseCountLabel(row.active_horse_count);
      const groupSummary = formatPaddockOccupancyGroupSummary(row);
      const statusLabel = row.status || 'Active';
      const statusClass = getPaddockOccupancyStatusBadgeClass(statusLabel);

      return `
        <tr>
          <td>${escapeHtml(row.paddock_name)}</td>
          <td>
            <div class="occupancy-count">${escapeHtml(horseCountLabel)}</div>
            <div class="occupancy-count-subtitle">${escapeHtml(groupSummary)}</div>
            ${renderPaddockOccupancyHorseDetails(row.active_horses)}
          </td>
          <td>${escapeHtml(formatDate(row.entered_at))}</td>
          <td>${escapeHtml(formatDayCountLabel(row.days_grazed))}</td>
          <td><span class="badge ${statusClass}">${escapeHtml(statusLabel)}</span></td>
        </tr>
      `;
    })
    .join('');

  if (paddockOccupancyCards) {
    paddockOccupancyCards.innerHTML = rows
      .map((row) => {
        const horseCountLabel = formatHorseCountLabel(row.active_horse_count);
        const groupSummary = formatPaddockOccupancyGroupSummary(row);
        const statusLabel = row.status || 'Active';
        const statusClass = getPaddockOccupancyStatusBadgeClass(statusLabel);

        return `
          <article class="paddock-occupancy-card">
            <div class="paddock-occupancy-card-head">
              <h3>${escapeHtml(row.paddock_name)}</h3>
              <span class="badge ${statusClass}">${escapeHtml(statusLabel)}</span>
            </div>
            <p class="paddock-occupancy-card-count">${escapeHtml(horseCountLabel)} currently grazing</p>
            <p class="paddock-occupancy-card-groups">${escapeHtml(groupSummary)}</p>
            <dl class="paddock-occupancy-card-meta">
              <div>
                <dt>Entered</dt>
                <dd>${escapeHtml(formatDate(row.entered_at))}</dd>
              </div>
              <div>
                <dt>Days grazed</dt>
                <dd>${escapeHtml(formatDayCountLabel(row.days_grazed))}</dd>
              </div>
            </dl>
            ${renderPaddockOccupancyHorseDetails(row.active_horses)}
          </article>
        `;
      })
      .join('');
  }
}

function formatHorseGroupCurrentPaddockSummary(row) {
  const currentLocations = Array.isArray(row?.current_locations) ? row.current_locations : [];
  const unassignedCount = Math.max(0, Number(row?.unassigned_member_count || 0));
  const summaryParts = [];

  if (currentLocations.length > 0) {
    summaryParts.push(
      currentLocations
        .map((location) => {
          const locationName = String(location?.location_name || '').trim();
          const horseCount = Math.max(0, Number(location?.horse_count || 0));

          if (!locationName) {
            return '';
          }

          if (horseCount > 0) {
            return `${locationName} (${formatHorseCountLabel(horseCount)})`;
          }

          return locationName;
        })
        .filter(Boolean)
        .join(', ')
    );
  } else {
    const currentNames = String(row?.current_paddock_names || '').trim();
    if (currentNames) {
      summaryParts.push(currentNames);
    }
  }

  if (unassignedCount > 0) {
    summaryParts.push(`${unassignedCount} unassigned`);
  }

  if (!summaryParts.length) {
    return '-';
  }

  return summaryParts.join(' + ');
}

function formatHorseGroupMemberCountLabel(count) {
  const safeCount = Math.max(0, Number(count || 0));
  return `${safeCount} horse${safeCount === 1 ? '' : 's'}`;
}

function formatHorseGroupLocationStateSummary(row) {
  const memberCount = Math.max(0, Number(row?.member_count || 0));
  const locatedCount = Math.max(
    0,
    Number(row?.located_member_count != null ? row.located_member_count : row?.grazing_member_count || 0)
  );
  const unassignedCount = Math.max(0, Number(row?.unassigned_member_count || 0));
  const currentLocationCount = Math.max(
    0,
    Number(
      row?.current_location_count != null
        ? row.current_location_count
        : Array.isArray(row?.current_locations)
          ? row.current_locations.length
          : 0
    )
  );

  if (memberCount <= 0) {
    return 'No horses assigned';
  }

  if (locatedCount <= 0) {
    return 'No current paddock assigned';
  }

  if (unassignedCount > 0) {
    return `${formatHorseCountLabel(locatedCount)} currently located, ${formatHorseCountLabel(
      unassignedCount
    )} unassigned`;
  }

  if (currentLocationCount > 1) {
    return `${formatHorseCountLabel(locatedCount)} split across ${currentLocationCount} paddocks`;
  }

  return `${formatHorseCountLabel(locatedCount)} together in 1 paddock`;
}

function formatHorseGroupStartedSummary(row) {
  if (row?.current_started_at) {
    return formatDate(row.current_started_at);
  }

  if (Number(row?.member_count || 0) > 0) {
    return 'Current members assigned';
  }

  return 'No current members';
}

function formatHorseGroupCurrentMoveDateSummary(row) {
  if (row?.current_paddock_names && row?.current_grazing_entered_at) {
    return formatDate(row.current_grazing_entered_at);
  }

  if (row?.current_paddock_names) {
    return Number(row?.current_location_count || 0) > 1 ? 'Multiple move dates' : 'Check current move';
  }

  return 'No paddock assigned';
}

function renderHorseGroupCurrentLocationList(row) {
  const currentLocations = Array.isArray(row?.current_locations) ? row.current_locations : [];

  if (!currentLocations.length) {
    return '<p class="group-management-empty-members">No current paddock assigned.</p>';
  }

  return `
    <ul class="group-management-location-list">
      ${currentLocations
        .map((location) => {
          const locationName = String(location?.location_name || '').trim() || 'Unknown paddock';
          const horseCount = Math.max(0, Number(location?.horse_count || 0));
          const horseNames = Array.isArray(location?.horse_names)
            ? location.horse_names.map((horseName) => String(horseName || '').trim()).filter(Boolean)
            : [];
          const locationSummary = horseNames.length
            ? horseNames.join(', ')
            : horseCount > 0
              ? formatHorseCountLabel(horseCount)
              : 'No horses';

          return `
            <li>
              <strong>${escapeHtml(locationName)}</strong>
              <span>${escapeHtml(locationSummary)}</span>
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
}

function renderHorseGroupUnassignedMembers(row) {
  const unassignedMembers = Array.isArray(row?.unassigned_members) ? row.unassigned_members : [];
  const unassignedCount = Math.max(0, Number(row?.unassigned_member_count || 0));

  if (unassignedCount <= 0) {
    return '';
  }

  return `
    <div class="group-management-members">
      <h4>Unassigned Members</h4>
      ${
        unassignedMembers.length
          ? `<ul class="group-management-member-list">
              ${unassignedMembers
                .map((member) => `<li>${escapeHtml(member.name || `Horse ${member.id}`)}</li>`)
                .join('')}
            </ul>`
          : `<p class="group-management-empty-members">${escapeHtml(
              `${unassignedCount} member${unassignedCount === 1 ? '' : 's'} without a current paddock.`
            )}</p>`
      }
    </div>
  `;
}

function getHorseGroupCurrentStateActionLabel(row) {
  const memberCount = Math.max(0, Number(row?.member_count || 0));
  const unassignedCount = Math.max(0, Number(row?.unassigned_member_count || 0));
  const currentLocationCount = Math.max(
    0,
    Number(
      row?.current_location_count != null
        ? row.current_location_count
        : Array.isArray(row?.current_locations)
          ? row.current_locations.length
          : 0
    )
  );

  if (memberCount <= 0) {
    return '';
  }

  if (unassignedCount > 0) {
    return 'Resolve Location';
  }

  if (currentLocationCount > 1) {
    return 'Review Split';
  }

  if (currentLocationCount <= 0) {
    return 'Set Paddock';
  }

  return 'Current State';
}

function renderHorseGroupRows(rows) {
  if (!horseGroupStatusBody) {
    return;
  }

  if (!rows.length) {
    horseGroupStatusBody.innerHTML = '<p class="group-management-empty">No groups saved yet.</p>';
    return;
  }

  horseGroupStatusBody.innerHTML = rows
    .map((row) => {
      const memberCountLabel = formatHorseGroupMemberCountLabel(row.member_count);
      const locationStateSummary = formatHorseGroupLocationStateSummary(row);
      const currentPaddocks = formatHorseGroupCurrentPaddockSummary(row);
      const members = Array.isArray(row.members) ? row.members : [];
      const startedSummary = formatHorseGroupStartedSummary(row);
      const currentMoveDateSummary = formatHorseGroupCurrentMoveDateSummary(row);
      const paddockSummary = currentPaddocks === '-' ? 'No paddock assigned' : currentPaddocks;
      const currentStateActionLabel = getHorseGroupCurrentStateActionLabel(row);
      const membersDisclosureLabel = members.length
        ? `View members (${members.length})`
        : row.notes || row.current_started_at
          ? 'View details'
          : 'View members';
      const membersMarkup = members.length
        ? `<ul class="group-management-member-list">
            ${members
              .map((member) => `<li>${escapeHtml(member.name || `Horse ${member.id}`)}</li>`)
              .join('')}
          </ul>`
        : '<p class="group-management-empty-members">No horses currently assigned.</p>';
      const notesMarkup = row.notes
        ? `<div>
            <dt>Notes</dt>
            <dd>${escapeHtml(row.notes)}</dd>
          </div>`
        : '';

      return `
        <article class="group-management-card">
          <div class="group-management-card-head">
            <div class="group-management-card-copy">
              <div class="group-management-card-title-row">
                <h3>${escapeHtml(row.name)}</h3>
                <span class="badge ${row.active ? 'ok' : 'neutral'}">${escapeHtml(
                  row.active ? 'Active' : 'Inactive'
                )}</span>
              </div>
              <p class="group-management-card-count">${escapeHtml(memberCountLabel)}</p>
              <p class="group-management-card-location-state">${escapeHtml(locationStateSummary)}</p>
              <p class="group-management-card-paddock">${escapeHtml(paddockSummary)}</p>
            </div>
            <div class="group-management-card-actions">
              ${
                currentStateActionLabel
                  ? `
                <button
                  type="button"
                  class="inline-action-btn"
                  data-group-action="current-state"
                  data-group-id="${escapeHtml(row.id)}"
                >
                  ${escapeHtml(currentStateActionLabel)}
                </button>
              `
                  : ''
              }
              <button
                type="button"
                class="inline-action-btn"
                data-group-action="members"
                data-group-id="${escapeHtml(row.id)}"
              >
                ${escapeHtml(members.length > 0 ? 'Members' : 'Add Members')}
              </button>
              <button
                type="button"
                class="inline-action-btn"
                data-group-action="edit"
                data-group-id="${escapeHtml(row.id)}"
              >
                Edit
              </button>
            </div>
          </div>

          <details class="group-management-disclosure">
            <summary>${escapeHtml(membersDisclosureLabel)}</summary>
            <div class="group-management-disclosure-body">
              <dl class="group-management-meta">
                <div>
                  <dt>Started</dt>
                  <dd>${escapeHtml(startedSummary)}</dd>
                </div>
                <div>
                  <dt>Location Status</dt>
                  <dd>${escapeHtml(locationStateSummary)}</dd>
                </div>
                <div>
                  <dt>Current Move Date</dt>
                  <dd>${escapeHtml(currentMoveDateSummary)}</dd>
                </div>
                <div>
                  <dt>Current Paddocks</dt>
                  <dd>${escapeHtml(paddockSummary)}</dd>
                </div>
                ${notesMarkup}
              </dl>

              <div class="group-management-members">
                <h4>Current Locations</h4>
                ${renderHorseGroupCurrentLocationList(row)}
              </div>

              ${renderHorseGroupUnassignedMembers(row)}

              <div class="group-management-members">
                <h4>Members</h4>
                ${membersMarkup}
              </div>
            </div>
          </details>
        </article>
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
  syncHorseGroupMembersContext(group);
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

async function postJson(url, payload, options = {}) {
  const feedbackCleanup = beginActionRequestFeedback(url, payload, options);

  try {
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
  } finally {
    feedbackCleanup();
  }
}

function handleAuthError(error, fallbackMessage) {
  if (Number(error?.status) !== 401) {
    return false;
  }

  setSessionAuthState(false);
  setStatus(fallbackMessage || 'Session expired. Please log in again.', true);
  return true;
}

function getActionErrorState(error) {
  return Number(error?.status) === 409 ? 'warning' : true;
}

function initActionRequestFeedback() {
  document.addEventListener(
    'click',
    (event) => {
      const trigger =
        event.target instanceof Element
          ? event.target.closest('button, input[type="submit"], input[type="button"], input[type="checkbox"]')
          : null;
      rememberActionTrigger(trigger);
    },
    true
  );

  document.addEventListener(
    'submit',
    (event) => {
      rememberActionTrigger(event.submitter instanceof Element ? event.submitter : event.target);
    },
    true
  );
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
  adminCalendarMonthCache.clear();
  selectedAdminCalendarMonth = currentYearMonthString();
  selectedAdminCalendarDate = todayIsoDateString();
  selectedAdminCalendarFilter = 'all';
  currentHorseRows = [];
  currentHorseGroupRows = [];
  currentPaddockRows = [];
  currentPaddockWorkRows = [];
  currentFarmSettings = null;
  currentAdminModuleSettings = getDefaultAdminModuleSettings();
  currentFeedHistoryRows = [];
  resetHorseFeedHistoryFilters();
  currentPaddockOccupancyRows = [];
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
  if (frostBody) {
    frostBody.innerHTML = emptyStateRow(4, 'Log in to view data.');
  }
  if (rainYearlyBody) {
    rainYearlyBody.innerHTML = emptyStateRow(6, 'Log in to view data.');
  }
  activityBody.innerHTML = emptyStateRow(4, 'Log in to view data.');
  if (horseGroupStatusBody) {
    horseGroupStatusBody.innerHTML = '<p class="group-management-empty">Log in to view data.</p>';
  }
  if (pastureOverviewBody) {
    pastureOverviewBody.className = 'pasture-overview-grid';
    pastureOverviewBody.innerHTML = '<p class="pasture-empty">Log in to view pasture readiness.</p>';
  }
  if (horseGroupHistoryRegistryBody) {
    horseGroupHistoryRegistryBody.innerHTML = emptyStateRow(6, 'Log in to view data.');
  }
  paddockStatusBody.innerHTML = emptyStateRow(10, 'Log in to view data.');
  if (paddockWorkHistoryBody) {
    paddockWorkHistoryBody.innerHTML = emptyStateRow(7, 'Log in to view data.');
  }
  if (paddockOccupancyBody) {
    paddockOccupancyBody.innerHTML = emptyStateRow(5, 'Log in to view data.');
  }
  if (paddockOccupancyCards) {
    paddockOccupancyCards.innerHTML = '<p class="paddock-occupancy-empty">Log in to view data.</p>';
  }
  horsesInTrainingBody.innerHTML = emptyStateRow(3, 'Log in to view data.');
  horsesBreakingInBody.innerHTML = emptyStateRow(3, 'Log in to view data.');
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
  renderAdminCalendarStatus('Calendar locked', 'Log in to view activities by day.');
}

async function loadSelectedHorseHistory(options = {}) {
  const horseId = horseSelect?.value || horseProfileSelect?.value || '';
  const showOverlay = Boolean(options?.showOverlay);
  if (!horseId) {
    setActiveHorseSelection('');
    resetHorseFeedHistoryFilters();
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
    if (showOverlay) {
      beginLoadingOverlay('Loading horse history...', 'Updating the horse timeline, feed, and care records.');
    }

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

    renderHorseCategoryHistories(payload);
    if (payload.horse) {
      setActiveHorseSelection(payload.horse.id || horseId);
      populateHorseProfile(payload.horse);
      setHorseHistorySelectedName(payload.horse);
    }
    return { ok: true };
  } catch (error) {
    clearHorseCategoryHistories({ resetMonth: false });
    if (handleAuthError(error, 'Session expired. Please log in to view horse history.')) {
      return { ok: false, error };
    }
    return { ok: false, error };
  } finally {
    if (showOverlay) {
      endLoadingOverlay();
    }
  }
}

function renderActivityRows(rows) {
  if (!rows.length) {
    activityBody.innerHTML = emptyStateRow(4, 'No recent activity found.');
    return;
  }

  const categoryLabels = {
    rain: 'Rain',
    frost: 'Frost',
    paddock: 'Field Work',
    grazing: 'Movement',
    stock: 'Stock',
    deworming: 'Deworming',
    farrier: 'Farrier',
    health: 'Health',
    feed: 'Feed',
    dose: 'Dose',
    treatment_plan: 'Treatment',
  };

  activityBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(formatDateTime(row.at))}</td>
          <td>${escapeHtml(categoryLabels[String(row.category || '').trim().toLowerCase()] || row.category)}</td>
          <td>${escapeHtml(row.horse_name || '-')}</td>
          <td>${escapeHtml(row.detail)}</td>
        </tr>
      `
    )
    .join('');
}

async function loadDashboard(options = {}) {
  const silent = Boolean(options?.silent);
  const showOverlay = !silent;

  if (!sessionAuthenticated) {
    setStatus('Please log in to access the admin dashboard.', true);
    clearDashboardView();
    return;
  }

  if (!silent) {
    setStatus('Refreshing dashboard...');
  }

  try {
    if (showOverlay) {
      beginLoadingOverlay('Loading dashboard...', 'Refreshing horses, paddocks, feed, and reminders.');
    }

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
    renderFrostRows(payload.frost?.recent || []);
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
    renderPastureOverview(payload);
    renderHorseGroupRows(currentHorseGroupRows);
    renderHorseGroupHistoryRegistryRows(payload.horse_group_history || []);
    renderPaddockStatusRows(currentPaddockRows);
    renderPaddockWorkHistoryRows(currentPaddockWorkRows);
    renderPaddockOccupancyRows(payload.paddock_occupancy || []);
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
    const [horseHistoryResult, calendarResult] = await Promise.all([
      loadSelectedHorseHistory({ showOverlay: false }),
      loadAdminCalendarMonth(selectedAdminCalendarMonth, {
        force: true,
        silent: true,
        selectedDate: selectedAdminCalendarDate,
        preserveFilter: true,
      }),
    ]);

    const updatedAt = payload.meta?.refreshed_at || new Date().toISOString();
    lastUpdated.textContent = `Last updated: ${formatDateTime(updatedAt)}`;
    if (!horseHistoryResult.ok) {
      setStatus(`Dashboard loaded, but history failed: ${horseHistoryResult.error.message}`, true);
      syncMobileNavForViewport();
      return;
    }

    if (!calendarResult.ok) {
      setStatus(`Dashboard loaded, but calendar failed: ${calendarResult.error.message}`, true);
      syncMobileNavForViewport();
      return;
    }

    if (!silent) {
      setStatus('Dashboard is up to date.');
    }

    syncMobileNavForViewport();
  } catch (error) {
    if (handleAuthError(error, 'Session expired. Please log in to continue.')) {
      clearDashboardView();
      return;
    }
    setStatus(`Dashboard error: ${error.message}`, true);
  } finally {
    if (showOverlay) {
      endLoadingOverlay();
    }
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
    beginLoadingOverlay('Signing in...', 'Verifying your account and opening the dashboard.');
    const data = await postJson(LOGIN_API_URL, { username, password }, { skipFeedback: true });
    setSessionAuthState(true, data.username || username);
    setStatus(`Logged in as ${data.username || username}.`);
    await loadDashboard();
  } catch (error) {
    setSessionAuthState(false);
    setStatus(`Login failed: ${error.message}`, true);
  } finally {
    endLoadingOverlay();
  }
});

logoutButton.addEventListener('click', async () => {
  try {
    beginLoadingOverlay('Signing out...', 'Closing the current admin session.');
    await postJson(LOGOUT_API_URL, {}, { skipFeedback: true });
  } catch (_error) {
    // Clear local UI even if logout API fails.
  } finally {
    endLoadingOverlay();
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

if (rainChart) {
  rainChart.addEventListener('mousemove', (event) => {
    if (rainChartUsesTapTooltip()) {
      return;
    }

    const hitArea = event.target.closest('.rain-chart-hit-area');
    if (!hitArea) {
      hideRainChartTooltip();
      return;
    }

    const bar = getRainChartBarFromClientPosition(event.clientX);
    if (!bar) {
      hideRainChartTooltip();
      return;
    }

    showRainChartTooltipForBar(bar, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
  });

  rainChart.addEventListener('click', (event) => {
    if (!rainChartUsesTapTooltip()) {
      return;
    }

    const hitArea = event.target.closest('.rain-chart-hit-area');
    if (!hitArea) {
      return;
    }

    const bar = getRainChartBarFromClientPosition(event.clientX);
    if (!bar) {
      hideRainChartTooltip();
      return;
    }

    const nextIndex = bar.getAttribute('data-row-index') || '';
    if (
      selectedRainTooltipIndex === nextIndex &&
      rainChartTooltip?.classList.contains('is-visible')
    ) {
      hideRainChartTooltip();
      return;
    }

    selectedRainTooltipIndex = nextIndex;
    showRainChartTooltipForBar(bar, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
  });
}

if (rainChartWrap) {
  rainChartWrap.addEventListener('mouseleave', () => {
    if (rainChartUsesTapTooltip()) {
      return;
    }

    hideRainChartTooltip();
  });
}

document.addEventListener('click', (event) => {
  if (!rainChartUsesTapTooltip() || !rainChartWrap) {
    return;
  }

  if (rainChartWrap.contains(event.target)) {
    return;
  }

  hideRainChartTooltip();
});

if (horseSelect) {
  horseSelect.addEventListener('change', async () => {
    setActiveHorseSelection(horseSelect.value);
    resetHorseFeedHistoryFilters();
    const result = await loadSelectedHorseHistory({ showOverlay: true });
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
    resetHorseFeedHistoryFilters();
    const result = await loadSelectedHorseHistory({ showOverlay: true });
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
    const currentStateButton = event.target.closest('button[data-group-action="current-state"]');
    if (currentStateButton) {
      const groupId = currentStateButton.getAttribute('data-group-id');
      const group = findHorseGroupById(groupId);
      if (!group) {
        setActionMessage('That group is no longer available to update.', true, {
          card: 'action-card-horse-groups',
        });
        return;
      }

      openHorseGroupCurrentMoveCorrection(group);
      return;
    }

    const membersButton = event.target.closest('button[data-group-action="members"]');
    if (membersButton) {
      const groupId = membersButton.getAttribute('data-group-id');
      const group = findHorseGroupById(groupId);
      if (!group) {
        setActionMessage('That group is no longer available to update.', true, {
          card: 'action-card-horse-groups',
        });
        return;
      }

      openHorseGroupMembersEditor(group);
      return;
    }

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

    withTargetViewVisible('horse-group-save-form', () => {
      expandPanelForElement(actionHubPanel);
      expandActionCard(document.getElementById('action-card-horse-groups'));
      setHorseGroupEditState(group, { scroll: true, focusName: true });
      setActionMessage(`Editing group: ${group.name}. Update its details and save when ready.`, false, {
        card: 'action-card-horse-groups',
      });
    });
  });
}

if (paddockStatusBody) {
  paddockStatusBody.addEventListener('click', (event) => {
    const correctRestButton = event.target.closest('button[data-paddock-action="correct-rest"]');
    if (correctRestButton) {
      const paddockId = correctRestButton.getAttribute('data-paddock-id');
      const paddock = findPaddockById(paddockId);
      if (!paddock) {
        setActionMessage('That paddock is no longer available to update.', true, {
          card: 'action-card-paddocks',
        });
        return;
      }

      openPaddockRestCorrection(paddock);
      return;
    }

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

    withTargetViewVisible('paddock-save-form', () => {
      expandPanelForElement(actionHubPanel);
      expandActionCard(document.getElementById('action-card-paddocks'));
      setPaddockEditState(paddock, { scroll: true, focusName: true });
      setActionMessage(`Editing paddock: ${paddock.name}. Update it and save when ready.`, false, {
        card: 'action-card-paddocks',
      });
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

    withTargetViewVisible('paddock-work-form', () => {
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

if (horseFeedHistoryPeriodFilter) {
  horseFeedHistoryPeriodFilter.addEventListener('change', () => {
    currentHorseFeedHistoryFilters.period = horseFeedHistoryPeriodFilter.value || '7d';
    renderFeedHistoryGroups(currentFeedHistoryRows);
  });
}

if (horseFeedHistorySlotFilter) {
  horseFeedHistorySlotFilter.addEventListener('change', () => {
    currentHorseFeedHistoryFilters.slot = horseFeedHistorySlotFilter.value || 'all';
    renderFeedHistoryGroups(currentFeedHistoryRows);
  });
}

if (horseFeedHistorySourceFilter) {
  horseFeedHistorySourceFilter.addEventListener('change', () => {
    currentHorseFeedHistoryFilters.source = horseFeedHistorySourceFilter.value || 'all';
    renderFeedHistoryGroups(currentFeedHistoryRows);
  });
}

if (horseFeedHistoryGroups) {
  horseFeedHistoryGroups.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-feed-action]');
    if (!button) {
      return;
    }

    const feedAction = button.getAttribute('data-feed-action');
    const feedEventId = button.getAttribute('data-feed-event-id');
    const feedEventRow = findFeedHistoryById(feedEventId);

    if (!feedEventId || !feedEventRow) {
      setHorseProfileMessage('Feed event not found in current history.', true);
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
        }, {
          trigger: button,
          targetKind: 'horseProfile',
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
        }, {
          trigger: button,
          targetKind: 'horseProfile',
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
}

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
    const singleCurrentLocation = getHorseGroupSingleCurrentLocation(data.group);
    const unassignedCount = Math.max(0, Number(data.group?.unassigned_member_count || 0));
    const locationFollowUp =
      unassignedCount > 0
        ? singleCurrentLocation?.location_name
          ? ` ${formatHorseCountLabel(
              unassignedCount
            )} now need a paddock. Use Current State to place them back into ${singleCurrentLocation.location_name}.`
          : ` ${formatHorseCountLabel(
              unassignedCount
            )} now need a paddock. Open Current State to choose where they should be now.`
        : '';
    setActionMessage(
      `Saved ${data.members.length} horse(s) in ${data.group.name}.${reassignedMessage}${removedMessage}${locationFollowUp}`,
      unassignedCount > 0 ? 'warning' : false
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
    const restEstimateValue = paddockRestDaysInput?.value.trim() || '';
    const restScopeValue = paddockRestScopeSelect?.value || 'single';
    const data = await postJson(DATA_MUTATE_API_URL, {
      action: 'paddock_save',
      paddockName: paddockNameInput.value.trim(),
      zone: paddockZoneInput.value.trim() || undefined,
      sizeHa: paddockSizeInput.value.trim() || undefined,
      restDaysEstimate: restEstimateValue || undefined,
      restApplyScope: restScopeValue,
      notes: paddockNotesInput.value.trim() || undefined,
      active: paddockActiveSelect.value,
      parentPaddockId: paddockParentSelect.value || undefined,
    });

    clearPaddockEditState();
    const restScopeLabel =
      restScopeValue === 'whole_block' ? ' for this paddock and child paddocks' : '';
    setActionMessage(
      `Paddock ${data.mode === 'created' ? 'saved' : 'updated'}: ${data.paddock.name}${
        data.paddock.parent_paddock_name ? ` under ${data.paddock.parent_paddock_name}` : ''
      }${
        restEstimateValue ? `. Manual rest correction set to ${restEstimateValue} day(s)${restScopeLabel}` : ''
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
      const messageState = getActionErrorState(error);
      const conflictPrefix =
        moveMode === 'correct_current' ? 'Current paddock unchanged' : 'No changes made';
      setActionMessage(
        Number(error?.status) === 409
          ? `${conflictPrefix}: ${error.message}`
          : moveMode === 'correct_current'
            ? `Correct current paddock failed: ${error.message}`
            : `Move group failed: ${error.message}`,
        messageState
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

if (frostSaveForm) {
  frostSaveForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const data = await postJson(DATA_MUTATE_API_URL, {
        action: 'frost_save',
        eventDate: frostDateInput.value || undefined,
        intensity: frostIntensitySelect.value || 'light',
        notes: frostNotesInput.value.trim() || undefined,
      });

      frostNotesInput.value = '';
      setActionMessage(
        `Frost saved for ${formatDate(data.frost.event_date)}: ${formatFrostIntensityLabel(
          data.frost.intensity
        )}.`,
        false,
        { card: 'action-card-rain' }
      );
      await loadDashboard();
    } catch (error) {
      if (handleAuthError(error, 'Session expired. Please log in to save frost records.')) {
        clearDashboardView();
        return;
      }
      setActionMessage(`Save frost failed: ${error.message}`, true, { card: 'action-card-rain' });
    }
  });
}

if (rainSyncWeatherButton) {
  rainSyncWeatherButton.addEventListener('click', async () => {
    try {
      const data = await postJson(DATA_MUTATE_API_URL, {
        action: 'rain_weather_sync',
      }, {
        trigger: rainSyncWeatherButton,
        card: 'action-card-rain',
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
initActionRequestFeedback();
initRainRegistryAccordion();
initHorseFeedHistoryAccordion();
initDesktopTopNav();
const todayDate = new Date().toISOString().slice(0, 10);
rainDateInput.value = todayDate;
if (frostDateInput) {
  frostDateInput.value = todayDate;
}
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
  beginLoadingOverlay('Loading dashboard...', 'Checking your session and pulling the latest farm data.');

  try {
    const session = await syncSessionState();
    if (!session?.authenticated) {
      clearDashboardView();
      setStatus('Please log in to access the admin dashboard.', true);
      return;
    }

    await loadDashboard();
  } finally {
    endLoadingOverlay();
  }
}

initializeAdminApp();
initBackToTopButton();
initMobileBottomNav();
initAdminCalendarPanel();
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
