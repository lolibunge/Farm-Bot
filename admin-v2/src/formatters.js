export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return String(value ?? '-');
  }

  return new Intl.NumberFormat('es-UY').format(parsed);
}

export function formatCurrency(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 'Sin datos';
  }

  return `$${new Intl.NumberFormat('es-UY', {
    maximumFractionDigits: 0,
  }).format(parsed)}`;
}

export function formatCompactDate(value) {
  if (!value) {
    return 'Sin datos';
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('es-UY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('es-UY', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

export function formatStockValue(currentStock, unit) {
  const parsed = Number(currentStock);
  const value = Number.isFinite(parsed) ? new Intl.NumberFormat('es-UY').format(parsed) : '-';
  return `${value} ${String(unit || '').trim()}`.trim();
}
