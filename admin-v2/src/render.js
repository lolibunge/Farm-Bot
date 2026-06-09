import { NAV_COPY, NAV_ITEMS } from './config.js';
import {
  escapeHtml,
  formatCompactDate,
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatStockValue,
} from './formatters.js';

function filterInventoryItems(state, dashboard) {
  const items = dashboard?.stock_dashboard?.inventory?.items || [];
  const query = String(state.query || '')
    .trim()
    .toLowerCase();
  const category = String(state.category || 'all');

  return items.filter((item) => {
    const matchesQuery =
      !query ||
      String(item.name || '').toLowerCase().includes(query) ||
      String(item.supplier || '').toLowerCase().includes(query) ||
      String(item.category?.label || '')
        .toLowerCase()
        .includes(query);

    const matchesCategory = category === 'all' || item.category?.key === category;

    return matchesQuery && matchesCategory;
  });
}

function renderStatusPill(label, tone) {
  return `<span class="status-pill status-pill--${escapeHtml(tone)}">${escapeHtml(label)}</span>`;
}

function renderSidebar(state, dashboard) {
  const alertItems = dashboard?.stock_dashboard?.alert_banner?.items || [];

  return `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-mark">
          <img src="/admin/farm-bot-logo.png" alt="Farm Bot" />
        </div>
        <div>
          <p class="sidebar-brand-title">Campo</p>
          <p class="sidebar-brand-subtitle">Gestion Integral</p>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Navegacion principal">
        ${NAV_ITEMS.map((item) => {
          const isActive = item.key === state.activeNav;
          return `
            <button
              type="button"
              class="nav-item${isActive ? ' is-active' : ''}"
              data-nav-key="${escapeHtml(item.key)}"
            >
              <span class="nav-item-badge">${escapeHtml(item.badge)}</span>
              <span>${escapeHtml(item.label)}</span>
              ${item.status === 'ready' ? '<span class="nav-item-dot"></span>' : ''}
            </button>
          `;
        }).join('')}
      </nav>

      <section class="sidebar-section">
        <div class="sidebar-section-head">
          <p>Alertas activas</p>
          ${renderStatusPill(alertItems.length ? `${alertItems.length}` : '0', alertItems.length ? 'critical' : 'positive')}
        </div>
        <div class="sidebar-alert-list">
          ${
            alertItems.length
              ? alertItems
                  .map(
                    (item) => `
                      <article class="sidebar-alert-card">
                        <strong>${escapeHtml(item.name)}</strong>
                        <span>${escapeHtml(item.detail)}</span>
                      </article>
                    `
                  )
                  .join('')
              : '<p class="sidebar-empty">Sin alertas criticas en esta lectura.</p>'
          }
        </div>
      </section>

      <div class="sidebar-footer">
        <button type="button" class="telegram-button" disabled>
          Telegram Bot
        </button>
      </div>
    </aside>
  `;
}

function renderHeader(state, dashboard) {
  const shell = dashboard?.shell || {};
  const copy = NAV_COPY[state.activeNav] || NAV_COPY.stock;
  const sessionName = state.session?.username ? `@${state.session.username}` : 'Sesion local';

  return `
    <header class="content-header">
      <div>
        <p class="eyebrow">${escapeHtml(shell.title || 'Farm Bot Admin Next')}</p>
        <h1>${escapeHtml(copy.title)}</h1>
        <p class="header-copy">${escapeHtml(copy.description)}</p>
      </div>

      <div class="header-actions">
        <div class="header-session">
          ${renderStatusPill(sessionName, 'neutral')}
          <span class="header-refresh-label">
            ${dashboard?.meta?.refreshed_at ? `Actualizado ${escapeHtml(formatDateTime(dashboard.meta.refreshed_at))}` : 'Sin refresco aun'}
          </span>
        </div>

        <div class="header-action-row">
          <button type="button" class="btn btn-muted" data-action="refresh">
            Refrescar
          </button>
          <button type="button" class="btn btn-primary" disabled>
            Nueva Compra
          </button>
          <button type="button" class="btn btn-primary" disabled>
            Nuevo Producto
          </button>
          <button type="button" class="btn btn-ghost" data-action="logout">
            Salir
          </button>
        </div>
      </div>
    </header>
  `;
}

function renderSummaryCards(cards) {
  return `
    <section class="summary-grid">
      ${cards
        .map(
          (card) => `
            <article class="summary-card summary-card--${escapeHtml(card.tone || 'neutral')}">
              <p class="summary-label">${escapeHtml(card.label)}</p>
              <h2>${escapeHtml(typeof card.value === 'number' ? formatNumber(card.value) : card.value)}</h2>
              <p class="summary-detail">${escapeHtml(card.detail || '')}</p>
            </article>
          `
        )
        .join('')}
    </section>
  `;
}

function renderAlertBanner(alertBanner) {
  return `
    <section class="alert-banner alert-banner--${escapeHtml(alertBanner.tone || 'healthy')}">
      <div class="alert-banner-copy">
        <p class="alert-banner-eyebrow">Arquitectura nueva</p>
        <h2>${escapeHtml(alertBanner.title)}</h2>
        <p>${escapeHtml(alertBanner.description)}</p>
      </div>
      <div class="alert-banner-list">
        ${
          alertBanner.items?.length
            ? alertBanner.items
                .map(
                  (item) => `
                    <article class="alert-banner-item">
                      <strong>${escapeHtml(item.name)}</strong>
                      <span>${escapeHtml(item.detail)}</span>
                    </article>
                  `
                )
                .join('')
            : '<p class="alert-banner-empty">No hay items criticos cargados en este momento.</p>'
        }
      </div>
    </section>
  `;
}

function renderTabBar(state, tabs) {
  return `
    <div class="tab-bar" role="tablist" aria-label="Vistas de stock">
      ${tabs
        .map((tab) => {
          const isActive = tab.key === state.activeTab;
          return `
            <button
              type="button"
              class="tab-pill${isActive ? ' is-active' : ''}"
              data-tab-key="${escapeHtml(tab.key)}"
            >
              ${escapeHtml(tab.label)}
            </button>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderInventoryControls(state, dashboard, filteredItems) {
  const filters = dashboard?.stock_dashboard?.inventory?.filters || [];
  const totalItems = dashboard?.stock_dashboard?.inventory?.items?.length || 0;

  return `
    <section class="inventory-toolbar">
      <div class="inventory-search">
        <input
          type="search"
          placeholder="Buscar productos..."
          value="${escapeHtml(state.query || '')}"
          data-filter="query"
        />
      </div>

      <label class="inventory-select">
        <select data-filter="category">
          ${filters
            .map(
              (filter) => `
                <option value="${escapeHtml(filter.key)}"${filter.key === state.category ? ' selected' : ''}>
                  ${escapeHtml(filter.label)}
                </option>
              `
            )
            .join('')}
        </select>
      </label>

      <div class="inventory-count">
        ${escapeHtml(formatNumber(filteredItems.length))} de ${escapeHtml(formatNumber(totalItems))} items
      </div>
    </section>
  `;
}

function renderInventoryGrid(items, emptyMessage) {
  if (!items.length) {
    return `<div class="empty-panel">${escapeHtml(emptyMessage)}</div>`;
  }

  return `
    <section class="product-grid">
      ${items
        .map(
          (item) => `
            <article class="product-card product-card--${escapeHtml(item.health?.key || 'healthy')}">
              <div class="product-card-head">
                <div class="product-card-icon">${escapeHtml(String(item.category?.label || 'General').slice(0, 2).toUpperCase())}</div>
                <div class="product-card-copy">
                  <h3>${escapeHtml(item.name)}</h3>
                  <span class="product-chip">${escapeHtml(item.category?.label || 'General')}</span>
                </div>
              </div>

              <div class="product-stock">
                <span>Stock actual</span>
                <p>${escapeHtml(formatStockValue(item.current_stock, item.unit))}</p>
              </div>

              <div class="stock-meter" aria-hidden="true">
                <span style="width: ${escapeHtml(String(item.health?.meter_percent || 0))}%"></span>
              </div>

              <p class="product-helper">
                Minimo: ${escapeHtml(formatStockValue(item.minimum_stock, item.unit))}
              </p>

              <dl class="product-facts">
                <div>
                  <dt>Costo unitario</dt>
                  <dd>${escapeHtml(formatCurrency(item.unit_cost))}</dd>
                </div>
                <div>
                  <dt>Proveedor</dt>
                  <dd>${escapeHtml(item.supplier || 'Sin datos')}</dd>
                </div>
                <div>
                  <dt>Ultimo movimiento</dt>
                  <dd>${escapeHtml(formatCompactDate(item.last_movement_date))}</dd>
                </div>
              </dl>

              <div class="product-actions">
                <button type="button" class="btn btn-muted" disabled>
                  Editar
                </button>
                <button type="button" class="btn btn-primary" disabled>
                  Comprar
                </button>
              </div>
            </article>
          `
        )
        .join('')}
    </section>
  `;
}

function renderPlannedPanel(panel) {
  return `
    <section class="placeholder-panel">
      <div class="placeholder-panel-head">
        <div>
          <p class="eyebrow">Siguiente fase</p>
          <h2>${escapeHtml(panel.title)}</h2>
        </div>
        ${renderStatusPill(panel.status === 'planned' ? 'Planned' : 'Partial', panel.status === 'planned' ? 'warning' : 'neutral')}
      </div>
      <p class="placeholder-copy">${escapeHtml(panel.message)}</p>
      <div class="placeholder-grid">
        <article>
          <strong>Contrato listo</strong>
          <span>La UI ya tiene un contenedor propio fuera del admin legacy.</span>
        </article>
        <article>
          <strong>Acciones separadas</strong>
          <span>Los botones quedan visibles pero sin mutaciones hasta la fase siguiente.</span>
        </article>
        <article>
          <strong>Sin deuda visual</strong>
          <span>Podemos iterar el layout sin tocar `admin/` ni romper lo actual.</span>
        </article>
      </div>
    </section>
  `;
}

function renderStockView(state, dashboard) {
  const stockDashboard = dashboard?.stock_dashboard;
  const filteredItems = filterInventoryItems(state, dashboard);

  let tabContent = '';

  if (state.activeTab === 'inventory') {
    tabContent = `
      ${renderInventoryControls(state, dashboard, filteredItems)}
      ${renderInventoryGrid(filteredItems, stockDashboard.inventory?.empty_message || 'Sin items')}
    `;
  } else if (state.activeTab === 'movements') {
    tabContent = renderPlannedPanel(stockDashboard.movement_panel);
  } else {
    tabContent = renderPlannedPanel(stockDashboard.accounting_panel);
  }

  return `
    <section class="view-stack">
      ${renderSummaryCards(stockDashboard.summary_cards || [])}
      ${renderAlertBanner(stockDashboard.alert_banner || { tone: 'healthy', title: 'Sin alertas', description: '', items: [] })}
      ${renderTabBar(state, stockDashboard.tabs || [])}
      ${tabContent}
    </section>
  `;
}

function renderPlaceholderView(state) {
  const copy = NAV_COPY[state.activeNav] || NAV_COPY.home;

  return `
    <section class="placeholder-panel placeholder-panel--full">
      <div class="placeholder-panel-head">
        <div>
          <p class="eyebrow">Modulo reservado</p>
          <h2>${escapeHtml(copy.title)}</h2>
        </div>
        ${renderStatusPill('Arquitectura lista', 'neutral')}
      </div>
      <p class="placeholder-copy">${escapeHtml(copy.description)}</p>
      <div class="placeholder-grid">
        <article>
          <strong>Ruta nueva</strong>
          <span>Todo esto vive en `/admin-v2/` para no tocar el admin actual.</span>
        </article>
        <article>
          <strong>Backend separado</strong>
          <span>La siguiente lectura puede entrar por `api/admin-v2/*` sin mezclar contratos.</span>
        </article>
        <article>
          <strong>Escalable por modulo</strong>
          <span>Cada vista futura puede tener su propio adaptador y sus propias acciones.</span>
        </article>
      </div>
    </section>
  `;
}

function renderAuthenticatedShell(state) {
  const dashboard = state.dashboard;

  return `
    <div class="screen-shell">
      ${renderSidebar(state, dashboard)}
      <main class="content-shell">
        ${renderHeader(state, dashboard)}
        ${
          state.dashboardError
            ? `<div class="inline-error">${escapeHtml(state.dashboardError)}</div>`
            : ''
        }
        ${state.activeNav === 'stock' && dashboard ? renderStockView(state, dashboard) : renderPlaceholderView(state)}
      </main>
      ${state.loading ? '<div class="loading-bar" aria-hidden="true"></div>' : ''}
    </div>
  `;
}

function renderLoginScreen(state) {
  return `
    <section class="auth-shell">
      <div class="auth-card">
        <div class="auth-brand">
          <img src="/admin/farm-bot-logo.png" alt="Farm Bot" />
          <div>
            <p class="eyebrow">Farm Bot Admin Next</p>
            <h1>Nueva ruta desacoplada</h1>
            <p>Entramos primero con la misma sesion del admin actual y despues seguimos con acciones nuevas.</p>
          </div>
        </div>

        <form class="auth-form" data-login-form>
          <label>
            Usuario
            <input name="username" type="text" autocomplete="username" placeholder="admin" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="Ingresa tu password"
              required
            />
          </label>
          <button type="submit" class="btn btn-primary btn-block"${state.loginPending ? ' disabled' : ''}>
            ${state.loginPending ? 'Ingresando...' : 'Entrar al admin nuevo'}
          </button>
        </form>

        ${
          state.loginError
            ? `<p class="auth-error">${escapeHtml(state.loginError)}</p>`
            : ''
        }
      </div>
    </section>
  `;
}

export function renderApp(state) {
  if (state.booting) {
    return `
      <section class="boot-shell">
        <div class="boot-card">
          <p class="eyebrow">Farm Bot Admin Next</p>
          <h1>Cargando la arquitectura nueva...</h1>
          <p>Estamos validando sesion y preparando la nueva ruta aislada del admin actual.</p>
        </div>
      </section>
    `;
  }

  if (!state.session?.authenticated) {
    return renderLoginScreen(state);
  }

  return renderAuthenticatedShell(state);
}
