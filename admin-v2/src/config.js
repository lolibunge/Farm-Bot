export const SESSION_API_URL = '/api/admin/session';
export const LOGIN_API_URL = SESSION_API_URL;
export const LOGOUT_API_URL = SESSION_API_URL;
export const DASHBOARD_API_URL = '/api/admin-v2/stock-dashboard';

export const DEFAULT_ACTIVE_NAV = 'stock';
export const DEFAULT_ACTIVE_TAB = 'inventory';

export const NAV_ITEMS = [
  { key: 'home', label: 'Inicio', badge: 'IN', status: 'planned' },
  { key: 'paddocks', label: 'Potreros', badge: 'PT', status: 'planned' },
  { key: 'horses', label: 'Caballos', badge: 'CB', status: 'planned' },
  { key: 'owners', label: 'Propietarios', badge: 'PR', status: 'planned' },
  { key: 'stock', label: 'Stock', badge: 'ST', status: 'ready' },
  { key: 'calendar', label: 'Calendario', badge: 'CL', status: 'planned' },
  { key: 'records', label: 'Registros', badge: 'RG', status: 'planned' },
  { key: 'settings', label: 'Configuracion', badge: 'CF', status: 'planned' },
];

export const NAV_COPY = {
  home: {
    title: 'Inicio',
    description: 'La shell nueva ya esta lista; falta conectar este modulo al read-model nuevo.',
  },
  paddocks: {
    title: 'Potreros',
    description: 'La estructura queda desacoplada para cuando armemos el dominio de ubicaciones.',
  },
  horses: {
    title: 'Caballos',
    description: 'Este modulo se conectara despues sobre el nuevo modelo canonico.',
  },
  owners: {
    title: 'Propietarios',
    description: 'Queda reservado para separar propiedad, historial y relaciones.',
  },
  stock: {
    title: 'Stock y Contabilidad',
    description: 'Primer modulo montado sobre la arquitectura nueva del admin.',
  },
  calendar: {
    title: 'Calendario',
    description: 'La vista futura va a reutilizar esta shell sin tocar el admin actual.',
  },
  records: {
    title: 'Registros',
    description: 'La arquitectura ya tiene espacio para timelines y auditoria.',
  },
  settings: {
    title: 'Configuracion',
    description: 'Queda preparado para settings desacoplados del dashboard viejo.',
  },
};
