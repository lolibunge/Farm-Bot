(function initAdminV2() {
  const SESSION_API_URL = '/api/admin/session';
  const LOGIN_API_URL = SESSION_API_URL;
  const LOGOUT_API_URL = SESSION_API_URL;
  const HORSES_API_URL = '/api/admin-v2/horses';
  const PADDOCKS_API_URL = '/api/admin-v2/paddocks';
  const STOCK_DASHBOARD_API_URL = '/api/admin-v2/stock-dashboard';
  const CALENDAR_EVENTS_API_URL = '/api/admin/calendar-events';
  const HORSE_HISTORY_API_URL = '/api/admin/horse-history';
  const DATA_MUTATE_API_URL = '/api/admin/mutate-data';
  const TELEGRAM_LINK_API_URL = '/api/admin-v2/telegram-link';
  const TELEGRAM_WEB_FALLBACK_URL = 'https://web.telegram.org/';

  const DEFAULT_ACTIVE_NAV = 'home';
  const DEFAULT_VIEWS = {
    paddocks: 'cards',
    horses: 'individual',
    owners: 'owners',
    stock: 'inventory',
    records: 'timeline',
    settings: 'account',
  };

  const MOBILE_PRIMARY_NAV_KEYS = ['home', 'paddocks', 'horses', 'owners', 'stock'];

  const HORSE_COLOR_OPTIONS = [
    { value: '', label: 'Sin definir' },
    { value: 'bay', label: 'Bayo' },
    { value: 'gray', label: 'Tordillo' },
    { value: 'black', label: 'Negro' },
    { value: 'chestnut', label: 'Alazán' },
    { value: 'dune', label: 'Gateado' },
    { value: 'dark bay', label: 'Zaino oscuro' },
    { value: 'blue roan', label: 'Rosillo azulado' },
  ];

  const HORSE_ACTIVITY_OPTIONS = [
    { value: '', label: 'Sin definir' },
    { value: 'foal', label: 'Potrillo' },
    { value: 'colt', label: 'Potro' },
    { value: 'broke horse', label: 'Manso' },
    { value: 'new horse', label: 'Caballo nuevo' },
    { value: 'polo pony', label: 'Caballo de polo' },
    { value: 'ranch horse', label: 'Caballo de campo' },
    { value: 'brood stallion', label: 'Padrillo' },
    { value: 'brood mare', label: 'Yegua madre' },
  ];

  const HORSE_SEX_OPTIONS = [
    { value: '', label: 'Sin definir' },
    { value: 'mare', label: 'Yegua' },
    { value: 'stallion', label: 'Padrillo' },
    { value: 'gelding', label: 'Castrado' },
    { value: 'filly', label: 'Potranca' },
    { value: 'unknown', label: 'Desconocido' },
  ];

  const HORSE_TRAINING_OPTIONS = [
    { value: '', label: 'Sin estado' },
    { value: 'in training', label: 'En entrenamiento' },
    { value: 'breaking in', label: 'Amansando' },
  ];

  const FIELD_WORK_TYPE_OPTIONS = [
    { value: 'soil_prep', label: 'Rastra' },
    { value: 'seeding', label: 'Siembra' },
    { value: 'fertilizer', label: 'Fertilización' },
    { value: 'spraying', label: 'Fumigación' },
    { value: 'ready_check', label: 'Chequeo de ingreso' },
    { value: 'other', label: 'Otro' },
  ];

  const FROST_INTENSITY_OPTIONS = [
    { value: 'light', label: 'Leve' },
    { value: 'moderate', label: 'Moderada' },
    { value: 'heavy', label: 'Fuerte' },
  ];

  const RESPONSIBLE_KIND_OPTIONS = [
    { value: 'unspecified', label: 'Sin especificar' },
    { value: 'field_staff', label: 'Personal del campo' },
    { value: 'external', label: 'Externo / contratista' },
  ];

  const FEED_SLOT_META = [
    { key: 'morning', title: 'Mañana', label: 'AM' },
    { key: 'afternoon', title: 'Tarde', label: 'PM' },
    { key: 'night', title: 'Noche', label: 'N' },
  ];

  const REAL_HOME_CARE_WINDOW_DAYS = 5;
  const REAL_HOME_TASK_WINDOW_DAYS = 30;

  const NAV_ITEMS = [
    { key: 'home', label: 'Inicio', icon: 'home' },
    { key: 'paddocks', label: 'Potreros', icon: 'paddocks' },
    { key: 'horses', label: 'Caballos', icon: 'horses' },
    { key: 'owners', label: 'Propietarios', icon: 'owners' },
    { key: 'stock', label: 'Stock', icon: 'stock' },
    { key: 'calendar', label: 'Calendario', icon: 'calendar' },
    { key: 'records', label: 'Registros', icon: 'records' },
    { key: 'settings', label: 'Configuración', icon: 'settings' },
  ];

  const DEMO_DATA = {
    alerts: [
      {
        title: 'Stock Bajo',
        detail: 'Avena, alfalfa, balanceado',
        count: 3,
        tone: 'critical',
      },
      {
        title: 'Herrajes',
        detail: 'Atrasados',
        count: 2,
        tone: 'warning',
      },
      {
        title: 'Desparasitación',
        detail: 'Atrasada',
        count: 1,
        tone: 'warning',
      },
    ],
    home: {
      quickActions: [
        { label: 'Mover Grupo', icon: 'swap', modalKey: 'move-group' },
        { label: 'Mover Caballo', icon: 'arrow', modalKey: 'move-horse' },
        { label: 'Registrar Lluvia', icon: 'rain', modalKey: 'register-rain' },
        { label: 'Registrar Helada', icon: 'snow', modalKey: 'register-frost' },
        { label: 'Trabajo Campo', icon: 'work', modalKey: 'field-work' },
        { label: 'Nueva Tarea', icon: 'plus', modalKey: 'new-task' },
      ],
      notices: [
        {
          tone: 'critical',
          title: 'Stock Bajo de Alimento - 3 productos',
          rows: [
            'Alimento Balanceado: 80kg (mínimo: 200kg)',
            'Avena: 120kg (mínimo: 150kg)',
            'Alfalfa: 250kg (mínimo: 300kg)',
          ],
        },
        {
          tone: 'warning',
          title: 'Atención Veterinaria Atrasada - 3 caballos',
          rows: [
            'Atenea: Herraje vencido hace 8 días',
            'Estrella: Herraje vencido hace 16 días',
            'Sombra: Desparasitación vencida hace 23 días',
          ],
        },
      ],
      metrics: [
        { label: 'Potreros Activos', value: '12', detail: 'de 15 totales', tone: 'green', icon: 'seed' },
        { label: 'Caballos', value: '24', detail: 'en campo', tone: 'blue', icon: 'horses' },
        { label: 'Lluvia (30d)', value: '45mm', detail: '+12mm vs mes anterior', tone: 'teal', icon: 'rain' },
        { label: 'Alertas', value: '6', detail: 'requieren atención', tone: 'orange', icon: 'circleAlert' },
      ],
      paddocks: [
        {
          name: 'Potrero 1',
          status: 'Ocupado',
          statusTone: 'green',
          detail: '4 caballos · 12 días',
          condition: 'Bueno',
          conditionTone: 'blue',
        },
        {
          name: 'Potrero 2',
          status: 'Descanso',
          statusTone: 'blue',
          detail: 'Vacío · 45 días',
          condition: 'Excelente',
          conditionTone: 'green',
        },
        {
          name: 'Potrero 3',
          status: 'Ocupado',
          statusTone: 'green',
          detail: '2 caballos · 8 días',
          condition: 'Regular',
          conditionTone: 'orange',
        },
        {
          name: 'Potrero 4',
          status: 'Preparación',
          statusTone: 'gray',
          detail: 'Vacío · 3 días',
          condition: 'Bueno',
          conditionTone: 'blue',
        },
      ],
      upcomingTasks: [
        { tone: 'critical', title: 'Desparasitación Grupo B', date: '23 May' },
        { tone: 'warning', title: 'Herraje - Zeus, Apolo', date: '25 May' },
        { tone: 'green', title: 'Siembra Potrero 7', date: '28 May' },
      ],
      activity: [
        { icon: 'pin', title: 'Grupo A movido a Potrero 5', time: 'Hace 2 horas' },
        { icon: 'pulse', title: 'Rastra completada en Potrero 3', time: 'Hace 5 horas' },
        { icon: 'circleAlert', title: 'Desparasitación pendiente - 4 caballos', time: 'Hace 1 día' },
      ],
    },
    paddocks: {
      filters: ['Todos los estados', 'Ocupado', 'Descanso', 'Preparación'],
      tabs: [
        { key: 'cards', label: 'Vista Tarjetas' },
        { key: 'list', label: 'Vista Lista' },
      ],
      cards: [
        {
          name: 'Potrero Norte 1',
          area: '5.2 hectáreas',
          status: 'Ocupado',
          statusTone: 'green',
          horses: '4',
          occupiedDays: '12',
          restDays: '-',
          rain: '45mm',
          condition: 'Bueno',
          conditionTone: 'blue',
          work: 'Rastra - 15 Mar',
          cropTone: 'green',
          cropLabel: 'Sembrado',
          crop: 'Alfalfa',
          cropDate: '10 Mar 2026',
          rotation: 'Rotación: 3 días',
          rotationTone: 'green',
        },
        {
          name: 'Potrero Central',
          area: '8.5 hectáreas',
          status: 'Descanso',
          statusTone: 'blue',
          horses: 'Vacío',
          occupiedDays: '-',
          restDays: '45',
          rain: '52mm',
          condition: 'Excelente',
          conditionTone: 'green',
          work: 'Siembra - 2 Abr',
          cropTone: 'green',
          cropLabel: 'Sembrado',
          crop: 'Raigrás + Trébol',
          cropDate: '2 Abr 2026',
          rotation: 'Rotación: Listo',
          rotationTone: 'blue',
        },
        {
          name: 'Potrero Sur 3',
          area: '6 hectáreas',
          status: 'Ocupado',
          statusTone: 'green',
          horses: '2',
          occupiedDays: '8',
          restDays: '-',
          rain: '38mm',
          condition: 'Regular',
          conditionTone: 'orange',
          work: 'Fertilización - 10 Mar',
          cropTone: 'green',
          cropLabel: 'Sembrado',
          crop: 'Festuca',
          cropDate: '15 Feb 2026',
          rotation: 'Rotación: 5 días',
          rotationTone: 'green',
        },
        {
          name: 'Potrero Este',
          area: '4.8 hectáreas',
          status: 'Preparación',
          statusTone: 'orange',
          horses: 'Vacío',
          occupiedDays: '-',
          restDays: '30',
          rain: '41mm',
          condition: 'Bueno',
          conditionTone: 'blue',
          work: 'Corte - 20 Abr',
          cropTone: 'warning',
          cropLabel: 'Planificado',
          crop: 'Alfalfa',
          cropDate: '25 May 2026',
          rotation: 'Rotación: 2 días',
          rotationTone: 'orange',
        },
        {
          name: 'Potrero Oeste 1',
          area: '7.3 hectáreas',
          status: 'Ocupado',
          statusTone: 'green',
          horses: '6',
          occupiedDays: '15',
          restDays: '-',
          rain: '47mm',
          condition: 'Regular',
          conditionTone: 'orange',
          work: 'Rastra - 5 Mar',
          cropTone: 'green',
          cropLabel: 'Sembrado',
          crop: 'Raigrás',
          cropDate: '28 Feb 2026',
          rotation: 'Rotación: Urgente',
          rotationTone: 'critical',
        },
        {
          name: 'Potrero Bajo',
          area: '5.5 hectáreas',
          status: 'Descanso',
          statusTone: 'blue',
          horses: 'Vacío',
          occupiedDays: '-',
          restDays: '60',
          rain: '55mm',
          condition: 'Excelente',
          conditionTone: 'green',
          work: 'Siembra - 18 Mar',
          cropTone: 'green',
          cropLabel: 'Sembrado',
          crop: 'Trébol Blanco',
          cropDate: '18 Mar 2026',
          rotation: 'Rotación: Listo',
          rotationTone: 'blue',
        },
      ],
      rows: [
        {
          name: 'Potrero Norte 1',
          status: 'Ocupado',
          statusTone: 'green',
          area: '5.2 ha',
          horses: '4',
          condition: 'Bueno',
          conditionTone: 'blue',
          rotation: '3 días',
        },
        {
          name: 'Potrero Central',
          status: 'Descanso',
          statusTone: 'blue',
          area: '8.5 ha',
          horses: '-',
          condition: 'Excelente',
          conditionTone: 'green',
          rotation: 'Listo',
        },
        {
          name: 'Potrero Sur 3',
          status: 'Ocupado',
          statusTone: 'green',
          area: '6 ha',
          horses: '2',
          condition: 'Regular',
          conditionTone: 'orange',
          rotation: '5 días',
        },
        {
          name: 'Potrero Este',
          status: 'Preparación',
          statusTone: 'orange',
          area: '4.8 ha',
          horses: '-',
          condition: 'Bueno',
          conditionTone: 'blue',
          rotation: '2 días',
        },
        {
          name: 'Potrero Oeste 1',
          status: 'Ocupado',
          statusTone: 'green',
          area: '7.3 ha',
          horses: '6',
          condition: 'Regular',
          conditionTone: 'orange',
          rotation: 'Urgente',
        },
        {
          name: 'Potrero Bajo',
          status: 'Descanso',
          statusTone: 'blue',
          area: '5.5 ha',
          horses: '-',
          condition: 'Excelente',
          conditionTone: 'green',
          rotation: 'Listo',
        },
      ],
    },
    horses: {
      metrics: [
        { label: 'Total Caballos', value: '8', detail: '4 grupos activos', tone: 'blue', icon: 'horses' },
        { label: 'En Grupos', value: '6', detail: 'rotación activa', tone: 'green', icon: 'owners' },
        { label: 'Individuales', value: '2', detail: 'manejo especial', tone: 'orange', icon: 'singleHorse' },
        { label: 'Alertas Salud', value: '1', detail: 'próximas', tone: 'critical', icon: 'circleAlert' },
      ],
      notice: {
        tone: 'warning',
        title: 'Atención Veterinaria Atrasada - 1 caballo',
        rows: ['Sombra: Herraje vencido hace 8 días'],
      },
      tabs: [
        { key: 'individual', label: 'Vista Individual' },
        { key: 'groups', label: 'Vista por Grupos' },
      ],
      horses: [
        {
          name: 'Zeus',
          age: '8 años · Criollo',
          badge: 'Grupo A',
          badgeTone: 'blue',
          owner: 'Manuel García',
          paddock: 'Potrero Norte 1',
          parasite: '20 Jul 2026',
          shoeing: '5 Jul 2026',
          note: 'Última revisión OK',
          noteTone: 'blue',
        },
        {
          name: 'Apolo',
          age: '6 años · Criollo',
          badge: 'Grupo A',
          badgeTone: 'blue',
          owner: 'Manuel García',
          paddock: 'Potrero Norte 1',
          parasite: '20 Jul 2026',
          shoeing: '5 Jul 2026',
          note: 'En tratamiento preventivo',
          noteTone: 'blue',
        },
        {
          name: 'Atenea',
          age: '5 años · Árabe',
          badge: 'Grupo B',
          badgeTone: 'blue',
          owner: 'Manuel García',
          paddock: 'Potrero Central',
          parasite: '15 Ago 2026',
          shoeing: '20 Jun 2026',
          note: 'Herraje próximo',
          noteTone: 'blue',
        },
        {
          name: 'Luna',
          age: '7 años · Cuarto de Milla',
          badge: 'Grupo C',
          badgeTone: 'blue',
          owner: 'María López',
          paddock: 'Potrero Sur 3',
          parasite: '10 Ago 2026',
          shoeing: '15 Jul 2026',
          note: 'Control OK',
          noteTone: 'blue',
        },
        {
          name: 'Estrella',
          age: '4 años · Criollo',
          badge: 'Grupo C',
          badgeTone: 'blue',
          owner: 'María López',
          paddock: 'Potrero Sur 3',
          parasite: '10 Ago 2026',
          shoeing: '12 Jun 2026',
          note: 'Herraje urgente',
          noteTone: 'blue',
        },
        {
          name: 'Trueno',
          age: '9 años · Árabe',
          badge: 'Individual',
          badgeTone: 'gray',
          owner: 'Pedro Fernández',
          paddock: 'Potrero Este',
          parasite: '1 Ago 2026',
          shoeing: '18 Jul 2026',
          note: 'Sin novedades',
          noteTone: 'blue',
        },
        {
          name: 'Rayo',
          age: '5 años · Cuarto de Milla',
          badge: 'Individual',
          badgeTone: 'gray',
          owner: 'Pedro Fernández',
          paddock: 'Potrero Este',
          parasite: '1 Ago 2026',
          shoeing: '18 Jul 2026',
          note: 'Control OK',
          noteTone: 'blue',
        },
        {
          name: 'Sombra',
          age: '6 años · Criollo',
          badge: 'Grupo D',
          badgeTone: 'blue',
          owner: 'Laura Martínez',
          paddock: 'Potrero Oeste 1',
          parasite: '5 Jun 2026',
          shoeing: '10 May 2026',
          note: 'Desparasitación urgente',
          noteTone: 'blue',
        },
      ],
      groups: [
        {
          name: 'Grupo A',
          count: '2 caballos',
          paddock: 'Potrero Norte 1',
          days: '12 días en potrero',
          members: ['Zeus', 'Apolo'],
        },
        {
          name: 'Grupo B',
          count: '1 caballo',
          paddock: 'Potrero Central',
          days: '8 días en potrero',
          members: ['Atenea'],
        },
        {
          name: 'Grupo C',
          count: '2 caballos',
          paddock: 'Potrero Sur 3',
          days: '15 días en potrero',
          members: ['Luna', 'Estrella'],
        },
        {
          name: 'Grupo D',
          count: '1 caballo',
          paddock: 'Potrero Oeste 1',
          days: '5 días en potrero',
          members: ['Sombra'],
        },
      ],
    },
    owners: {
      metrics: [
        { label: 'Ingresos Mensuales', value: '$340,000', detail: '17 caballos en total', tone: 'green', icon: 'money' },
        { label: 'Propietarios al Día', value: '3', detail: 'de 5 totales', tone: 'blue', icon: 'check' },
        { label: 'Pagos Pendientes', value: '2', detail: 'requieren seguimiento', tone: 'orange', icon: 'clock' },
        { label: 'Saldo Pendiente', value: '$160,000', detail: 'a cobrar', tone: 'critical', icon: 'trendDown' },
      ],
      notice: {
        tone: 'warning',
        title: '2 propietarios con pagos pendientes',
        description: 'Total a cobrar: $160,000',
        action: 'Enviar recordatorios',
        actionKey: 'owner-reminders',
      },
      tabs: [
        { key: 'owners', label: 'Propietarios' },
        { key: 'distribution', label: 'Distribución de Gastos' },
        { key: 'payments', label: 'Historial de Pagos' },
      ],
      owners: [
        {
          initials: 'MG',
          name: 'Manuel García',
          status: 'Al día',
          statusTone: 'green',
          email: 'manuel@email.com',
          phone: '+54 9 11 234-5678',
          horses: '3 caballos',
          horsesList: ['Zeus', 'Apolo', 'Atenea'],
          monthlyFee: '$60,000',
          perHorse: '$20,000',
          paymentDate: '1 May 2026',
          balance: '',
          balanceTone: 'green',
        },
        {
          initials: 'ML',
          name: 'María López',
          status: 'Al día',
          statusTone: 'green',
          email: 'maria@email.com',
          phone: '+54 9 11 8765-4321',
          horses: '4 caballos',
          horsesList: ['Luna', 'Estrella', 'Cometa', 'Nube'],
          monthlyFee: '$80,000',
          perHorse: '$20,000',
          paymentDate: '1 May 2026',
          balance: '',
          balanceTone: 'green',
        },
        {
          initials: 'PF',
          name: 'Pedro Fernández',
          status: 'Pendiente',
          statusTone: 'warning',
          email: 'pedro@email.com',
          phone: '+54 9 11 5555-6666',
          horses: '2 caballos',
          horsesList: ['Trueno', 'Rayo'],
          monthlyFee: '$40,000',
          perHorse: '$20,000',
          paymentDate: '1 Abr 2026',
          balance: '$40,000',
          balanceTone: 'critical',
        },
        {
          initials: 'LM',
          name: 'Laura Martínez',
          status: 'Atrasado',
          statusTone: 'critical',
          email: 'laura@email.com',
          phone: '+54 11 9999-8888',
          horses: '3 caballos',
          horsesList: ['Sombra', 'Fuego', 'Viento'],
          monthlyFee: '$60,000',
          perHorse: '$20,000',
          paymentDate: '1 Mar 2026',
          balance: '$120,000',
          balanceTone: 'critical',
        },
        {
          initials: 'JR',
          name: 'Jorge Rodríguez',
          status: 'Al día',
          statusTone: 'green',
          email: 'jorge@email.com',
          phone: '+54 9 11 7777-4444',
          horses: '5 caballos',
          horsesList: ['Canela', 'Chocolate', 'Caramelo', 'Miel', 'Azúcar'],
          monthlyFee: '$100,000',
          perHorse: '$20,000',
          paymentDate: '1 May 2026',
          balance: '',
          balanceTone: 'green',
        },
      ],
      expenses: [
        { label: 'Alimento', value: '$240,500', tone: 'green', meter: 60 },
        { label: 'Salud', value: '$43,000', tone: 'critical', meter: 22 },
        { label: 'Mantenimiento Campo', value: '$85,000', tone: 'blue', meter: 34 },
        { label: 'Otros', value: '$32,000', tone: 'orange', meter: 18 },
      ],
      ownerExpenses: [
        { name: 'Manuel García', detail: '3 caballos', value: '$70,676' },
        { name: 'María López', detail: '4 caballos', value: '$94,235' },
        { name: 'Pedro Fernández', detail: '2 caballos', value: '$47,118' },
        { name: 'Laura Martínez', detail: '3 caballos', value: '$70,676' },
        { name: 'Jorge Rodríguez', detail: '5 caballos', value: '$117,794' },
      ],
      payments: [
        { name: 'Manuel García', date: '1 May 2026', amount: '$60,000', status: 'Al día', tone: 'green' },
        { name: 'María López', date: '1 May 2026', amount: '$80,000', status: 'Al día', tone: 'green' },
        { name: 'Pedro Fernández', date: '1 Abr 2026', amount: '$40,000', status: 'Pendiente', tone: 'warning' },
        { name: 'Laura Martínez', date: '1 Mar 2026', amount: '$60,000', status: 'Atrasado', tone: 'critical' },
        { name: 'Jorge Rodríguez', date: '1 May 2026', amount: '$100,000', status: 'Al día', tone: 'green' },
      ],
    },
    stock: {
      metrics: [
        { label: 'Ingresos del Mes', value: '$450,000', detail: '+8% vs mes anterior', tone: 'green', icon: 'trendUp' },
        { label: 'Gastos del Mes', value: '$240,500', detail: '-5% vs mes anterior', tone: 'critical', icon: 'trendDown' },
        { label: 'Balance', value: '$209,500', detail: 'Positivo', tone: 'blue', icon: 'money' },
        { label: 'Productos Bajo Stock', value: '1', detail: 'Requieren atención', tone: 'orange', icon: 'circleAlert' },
      ],
      notice: {
        tone: 'critical',
        title: 'Stock Bajo de Alimento - 1 producto',
        description: 'Productos por debajo del stock mínimo que necesitan reposición',
        focus: 'Fertilizante Orgánico',
        focusDetail: 'Stock actual: 80kg · Mínimo: 100kg',
        tag: 'Urgente',
      },
      tabs: [
        { key: 'inventory', label: 'Inventario' },
        { key: 'movements', label: 'Movimientos' },
        { key: 'accounting', label: 'Contabilidad' },
      ],
      categories: ['Todas las categorías', 'Alimento', 'Fertilizante', 'Herbicida'],
      products: [
        {
          name: 'Alimento Balanceado Premium',
          category: 'Alimento',
          categoryTone: 'green',
          icon: 'leaf',
          current: '450',
          unit: 'kg',
          minimum: '200 kg',
          meter: 100,
          cost: '$850',
          supplier: 'Agro San José',
          lastPurchase: '15 May 2026',
          tone: 'green',
        },
        {
          name: 'Fertilizante Orgánico',
          category: 'Fertilizante',
          categoryTone: 'blue',
          icon: 'flask',
          current: '80',
          unit: 'kg',
          minimum: '100 kg',
          meter: 68,
          cost: '$1,200',
          supplier: 'Campo Verde',
          lastPurchase: '10 May 2026',
          tone: 'orange',
        },
        {
          name: 'Herbicida Glifosato',
          category: 'Herbicida',
          categoryTone: 'orange',
          icon: 'fire',
          current: '25',
          unit: 'L',
          minimum: '15 L',
          meter: 100,
          cost: '$3,500',
          supplier: 'Agroquímica del Sur',
          lastPurchase: '8 May 2026',
          tone: 'green',
        },
        {
          name: 'Alimento Avena',
          category: 'Alimento',
          categoryTone: 'green',
          icon: 'leaf',
          current: '320',
          unit: 'kg',
          minimum: '150 kg',
          meter: 100,
          cost: '$450',
          supplier: 'Molino Central',
          lastPurchase: '18 May 2026',
          tone: 'green',
        },
        {
          name: 'Fertilizante NPK',
          category: 'Fertilizante',
          categoryTone: 'blue',
          icon: 'flask',
          current: '150',
          unit: 'kg',
          minimum: '100 kg',
          meter: 100,
          cost: '$1,800',
          supplier: 'Campo Verde',
          lastPurchase: '12 May 2026',
          tone: 'green',
        },
        {
          name: 'Heno Premium',
          category: 'Alimento',
          categoryTone: 'green',
          icon: 'leaf',
          current: '1200',
          unit: 'kg',
          minimum: '500 kg',
          meter: 100,
          cost: '$350',
          supplier: 'Forrajera del Campo',
          lastPurchase: '20 May 2026',
          tone: 'green',
        },
      ],
      movements: [
        {
          title: 'Compra Alimento Balanceado 50kg',
          tags: ['Alimento', 'Transferencia'],
          amount: '-$42,500',
          amountTone: 'critical',
          date: '15 May 2026',
        },
        {
          title: 'Pensión Caballos - Mayo (Cliente: García)',
          tags: ['Pensión', 'Transferencia'],
          amount: '+$180,000',
          amountTone: 'green',
          date: '1 May 2026',
        },
        {
          title: 'Compra Fertilizante Orgánico 100kg',
          tags: ['Fertilizante', 'Efectivo'],
          amount: '-$120,000',
          amountTone: 'critical',
          date: '10 May 2026',
        },
        {
          title: 'Pensión Caballos - Mayo (Cliente: López)',
          tags: ['Pensión', 'Transferencia'],
          amount: '+$150,000',
          amountTone: 'green',
          date: '1 May 2026',
        },
        {
          title: 'Compra Herbicida Glifosato 10L',
          tags: ['Herbicida', 'Débito'],
          amount: '-$35,000',
          amountTone: 'critical',
          date: '8 May 2026',
        },
        {
          title: 'Herraje 2 caballos',
          tags: ['Salud', 'Efectivo'],
          amount: '-$28,000',
          amountTone: 'critical',
          date: '7 May 2026',
        },
        {
          title: 'Desparasitación Grupo B',
          tags: ['Salud', 'Transferencia'],
          amount: '-$15,000',
          amountTone: 'critical',
          date: '5 May 2026',
        },
      ],
      incomeBars: [{ label: 'Pensión', value: '$450,000', meter: 100, tone: 'green' }],
      expenseBars: [
        { label: 'Alimento', value: '$42,500', meter: 18, tone: 'critical' },
        { label: 'Fertilizante', value: '$120,000', meter: 50, tone: 'critical' },
        { label: 'Herbicida', value: '$35,000', meter: 14, tone: 'critical' },
        { label: 'Salud', value: '$43,000', meter: 18, tone: 'critical' },
      ],
    },
    calendar: {
      notice: {
        tone: 'warning',
        title: 'Tienes 1 tareas urgentes pendientes',
        description: 'Revisa las actividades marcadas como prioritarias para evitar retrasos',
      },
      sidebarTasks: [
        {
          title: 'Siembra Potrero 7',
          date: '28 May',
          subtitle: 'Preparación completada',
          tag: 'Trabajo',
          tone: 'green',
        },
        {
          title: 'Rotación Grupo A',
          date: '22 May',
          subtitle: 'Mover a Potrero 5',
          tag: 'Movimiento',
          tone: 'critical',
        },
        {
          title: 'Fertilización Potrero 3',
          date: '30 May',
          subtitle: 'Listo para aplicar',
          tag: 'Trabajo',
          tone: 'warning',
        },
        {
          title: 'Control Veterinario',
          date: '2 Jun',
          subtitle: 'Revisión trimestral',
          tag: 'Salud',
          tone: 'warning',
        },
      ],
      summary: [
        { label: 'Tareas pendientes', value: '4', tone: 'neutral' },
        { label: 'Completadas', value: '2', tone: 'green' },
        { label: 'Urgentes', value: '1', tone: 'critical' },
        { label: 'Salud', value: '1', tone: 'neutral' },
        { label: 'Trabajos de campo', value: '2', tone: 'neutral' },
      ],
      tasks: [
        { title: 'Siembra Potrero 7', detail: 'Preparación completada', tag: 'Trabajo', date: '28 May', priority: 'Baja', priorityTone: 'green' },
        { title: 'Rotación Grupo A', detail: 'Mover a Potrero 5', tag: 'Movimiento', date: '22 May', priority: 'Alta', priorityTone: 'critical' },
        { title: 'Fertilización Potrero 3', detail: 'Listo para aplicar', tag: 'Trabajo', date: '30 May', priority: 'Media', priorityTone: 'warning' },
        { title: 'Control Veterinario', detail: 'Revisión trimestral', tag: 'Salud', date: '2 Jun', priority: 'Media', priorityTone: 'warning' },
      ],
      completedTasks: [
        { title: 'Desparasitación Grupo B', detail: 'Realizada vía Telegram', tag: 'Salud', date: '20 May', priority: 'Completada', priorityTone: 'green' },
        { title: 'Rastra Potrero 3', detail: 'Trabajo finalizado', tag: 'Trabajo', date: '21 May', priority: 'Completada', priorityTone: 'green' },
      ],
    },
    records: {
      metrics: [
        { label: 'Total Registros', value: '8', detail: '+12 esta semana', tone: 'neutral' },
        { label: 'Vía Telegram', value: '3', detail: '45% del total', tone: 'neutral' },
        { label: 'Movimientos', value: '3', detail: 'Último: hace 2h', tone: 'neutral' },
        { label: 'Trabajos de Campo', value: '2', detail: 'Último: hace 5h', tone: 'neutral' },
      ],
      infoBanner: {
        title: 'Registra desde el campo con Telegram',
        description: 'Envía comandos al bot mientras recorres el campo. Tus registros aparecerán aquí automáticamente.',
      },
      tabs: [
        { key: 'timeline', label: 'Línea de Tiempo' },
        { key: 'categories', label: 'Por Categoría' },
      ],
      timeline: [
        {
          title: 'Grupo A movido a Potrero 5',
          tag: 'Movimiento',
          tone: 'blue',
          detail: '4 caballos trasladados desde Potrero Norte 1',
          meta: '21 May 2026, 15:30 · Manual',
          age: 'Hace 2 horas',
          icon: 'pin',
        },
        {
          title: 'Rastra completada en Potrero 3',
          tag: 'Trabajo',
          tone: 'green',
          detail: 'Preparación del terreno finalizada',
          meta: '21 May 2026, 12:15 · Manuel García',
          age: 'Hace 5 horas',
          icon: 'work',
        },
        {
          title: 'Desparasitación Grupo B',
          tag: 'Salud',
          tone: 'critical',
          detail: '4 caballos desparasitados · Próxima dosis en 3 meses',
          meta: '20 May 2026, 09:00 · Telegram Bot · Telegram',
          age: 'Hace 1 día',
          icon: 'health',
        },
        {
          title: 'Registro de lluvia',
          tag: 'Clima',
          tone: 'teal',
          detail: '12mm acumulados en Potrero Central',
          meta: '20 May 2026, 14:20 · Sistema',
          age: 'Hace 1 día',
          icon: 'rain',
        },
        {
          title: 'Zeus y Apolo a Potrero Este',
          tag: 'Movimiento',
          tone: 'blue',
          detail: 'Movimiento individual desde Potrero Oeste',
          meta: '19 May 2026, 16:45 · Telegram Bot · Telegram',
          age: 'Hace 2 días',
          icon: 'pin',
        },
        {
          title: 'Fertilización Potrero Norte 1',
          tag: 'Trabajo',
          tone: 'green',
          detail: 'Aplicación de fertilizante orgánico · 500kg',
          meta: '18 May 2026, 10:30 · Manual',
          age: 'Hace 3 días',
          icon: 'work',
        },
        {
          title: 'Rotación Grupo C',
          tag: 'Movimiento',
          tone: 'blue',
          detail: '6 caballos a Potrero Bajo · Ciclo de pastoreo',
          meta: '17 May 2026, 08:00 · Manuel García',
          age: 'Hace 4 días',
          icon: 'horses',
        },
        {
          title: 'Herraje completado',
          tag: 'Salud',
          tone: 'critical',
          detail: 'Zeus y Apolo · Próximo herraje en 6 semanas',
          meta: '16 May 2026, 11:15 · Telegram Bot · Telegram',
          age: 'Hace 5 días',
          icon: 'health',
        },
      ],
      byCategory: [
        {
          name: 'Movimiento',
          items: [
            'Grupo A movido a Potrero 5',
            'Zeus y Apolo a Potrero Este',
            'Rotación Grupo C',
          ],
        },
        {
          name: 'Trabajo',
          items: ['Rastra completada en Potrero 3', 'Fertilización Potrero Norte 1'],
        },
        {
          name: 'Salud',
          items: ['Desparasitación Grupo B', 'Herraje completado'],
        },
        {
          name: 'Clima',
          items: ['Registro de lluvia'],
        },
      ],
    },
    settings: {
      tabs: [
        { key: 'account', label: 'Cuenta' },
        { key: 'security', label: 'Seguridad' },
        { key: 'telegram', label: 'Telegram' },
        { key: 'general', label: 'General' },
        { key: 'notifications', label: 'Notificaciones' },
        { key: 'users', label: 'Usuarios' },
      ],
      commands: [
        {
          command: '/mover [caballos] a [potrero]',
          description: 'Registra el movimiento de caballos a un potrero',
          example: '/mover Zeus, Apolo a Potrero 5',
        },
        {
          command: '/lluvia [cantidad]mm en [potrero]',
          description: 'Registra precipitaciones en un potrero específico',
          example: '/lluvia 15mm en Potrero Central',
        },
        {
          command: '/trabajo [tipo] en [potrero]',
          description: 'Registra trabajos de campo (rastra, siembra, etc.)',
          example: '/trabajo rastra en Potrero Norte 1',
        },
        {
          command: '/salud [acción] [caballos]',
          description: 'Registra actividades de salud (desparasitar, herraje)',
          example: '/salud desparasitar Grupo A',
        },
        {
          command: '/estado [potrero]',
          description: 'Consulta el estado actual de un potrero',
          example: '/estado Potrero 3',
        },
        {
          command: '/help',
          description: 'Muestra la lista completa de comandos',
          example: '/help',
        },
      ],
      notificationRules: [
        { title: 'Rotación de potreros', description: 'Aviso cuando un potrero necesita rotación', enabled: true, tone: 'neutral' },
        { title: 'Stock bajo de alimento', description: 'Alerta cuando avena, alfalfa o balanceado están bajo el mínimo', enabled: true, tone: 'warning', tag: 'Crítica' },
        { title: 'Herrajes próximos', description: 'Recordatorio de herrajes programados (7 días antes)', enabled: true, tone: 'warning', tag: 'Crítica' },
        { title: 'Desparasitaciones próximas', description: 'Recordatorio de desparasitaciones programadas (7 días antes)', enabled: true, tone: 'warning', tag: 'Crítica' },
        { title: 'Tareas pendientes', description: 'Recordatorio general de tareas programadas', enabled: true, tone: 'neutral' },
        { title: 'Registros de lluvia', description: 'Notificación de precipitaciones importantes', enabled: false, tone: 'neutral' },
        { title: 'Resumen semanal', description: 'Informe de actividades cada lunes', enabled: true, tone: 'neutral' },
      ],
      channels: [
        { title: 'Telegram', description: 'Recibe alertas en tiempo real', enabled: true, tone: 'blue' },
        { title: 'Email', description: 'Resumen diario por correo', enabled: false, tone: 'neutral' },
      ],
      users: [
        {
          initials: 'MG',
          name: 'Manuel García',
          email: 'manuel@campo.com',
          role: 'Administrador',
          handle: '@manuelg',
          status: '',
          statusTone: 'green',
        },
        {
          initials: 'ML',
          name: 'María López',
          email: 'maria@campo.com',
          role: 'Editor',
          handle: '@marial',
          status: '',
          statusTone: 'green',
        },
        {
          initials: 'PF',
          name: 'Pedro Fernández',
          email: 'pedro@campo.com',
          role: 'Visualizador',
          handle: '',
          status: 'Inactivo',
          statusTone: 'gray',
        },
      ],
    },
  };

  const MODULE_META = {
    home: {
      title: 'Bienvenido',
      getSubtitle(state) {
        if (isRealSession(state)) {
          const horseCount = Array.isArray(getRealHorseDashboard(state)?.horses)
            ? getRealHorseDashboard(state).horses.length
            : null;
          const paddockCount = Array.isArray(getRealPaddockDashboard(state)?.paddocks)
            ? getRealPaddockDashboard(state).paddocks.length
            : null;
          const alertCount = totalAlertCount(state);
          const parts = [
            horseCount == null ? null : `${horseCount} caballo(s)`,
            paddockCount == null ? null : `${paddockCount} potrero(s)`,
            `${alertCount} alerta(s) activas`,
          ].filter(Boolean);

          if (parts.length) {
            return `${parts.join(' · ')} · ${formatFriendlyDate(new Date())}`;
          }
        }

        return `Resumen de tu campo - ${formatFriendlyDate(new Date())}`;
      },
      actions: [],
    },
    paddocks: {
      title: 'Gestión de Potreros',
      getSubtitle(state) {
        if (
          state &&
          state.session &&
          !state.session.demo &&
          state.paddocksDashboard &&
          state.paddocksDashboard.paddocks_dashboard &&
          state.paddocksDashboard.paddocks_dashboard.header_subtitle
        ) {
          return state.paddocksDashboard.paddocks_dashboard.header_subtitle;
        }

        return 'Potreros conectados al nuevo módulo visual.';
      },
      actions: [
        {
          label: 'Nuevo Potrero',
          tone: 'primary',
          icon: 'plus',
          trigger: { action: 'open-modal', value: 'paddock-form', meta: { mode: 'create' } },
        },
      ],
    },
    horses: {
      title: 'Caballos y Grupos',
      getSubtitle(state) {
        if (
          state &&
          state.session &&
          !state.session.demo &&
          state.horsesDashboard &&
          state.horsesDashboard.horses_dashboard &&
          state.horsesDashboard.horses_dashboard.header_subtitle
        ) {
          return state.horsesDashboard.horses_dashboard.header_subtitle;
        }

        return 'Caballos conectados al nuevo módulo visual.';
      },
      actions: [
        {
          label: 'Mover Caballo',
          tone: 'secondary',
          icon: 'arrow',
          trigger: { action: 'open-modal', value: 'move-horse' },
        },
        {
          label: 'Nuevo Caballo',
          tone: 'primary',
          icon: 'plus',
          trigger: { action: 'open-modal', value: 'horse-form', meta: { mode: 'create' } },
        },
      ],
    },
    owners: {
      title: 'Propietarios de Caballos',
      subtitle: '5 propietarios · 17 caballos en pensión',
      actions: [
        {
          label: 'Nuevo Propietario',
          tone: 'primary',
          icon: 'plus',
          trigger: { action: 'open-modal', value: 'owner-create' },
        },
      ],
    },
    stock: {
      title: 'Stock y Contabilidad',
      getSubtitle(state) {
        if (isRealSession(state)) {
          return getRealStockSubtitle(state);
        }

        return 'Gestión de inventario y finanzas del campo';
      },
      getActions(state) {
        if (isRealSession(state)) {
          return getRealStockActions(state);
        }

        return [
          {
            label: 'Ingresar stock',
            tone: 'secondary',
            icon: 'cart',
            trigger: { action: 'open-modal', value: 'purchase-create' },
          },
          {
            label: 'Nuevo inventario',
            tone: 'primary',
            icon: 'plus',
            trigger: { action: 'open-modal', value: 'product-form' },
          },
        ];
      },
      actions: [
        {
          label: 'Ingresar stock',
          tone: 'secondary',
          icon: 'cart',
          trigger: { action: 'open-modal', value: 'purchase-create' },
        },
        {
          label: 'Nuevo inventario',
          tone: 'primary',
          icon: 'plus',
          trigger: { action: 'open-modal', value: 'product-form' },
        },
      ],
    },
    calendar: {
      title: 'Calendario de Actividades',
      getSubtitle(state) {
        if (isRealSession(state)) {
          return getRealCalendarSubtitle(state);
        }

        return '1 tareas urgentes pendientes';
      },
      actions: [
        {
          label: 'Nueva Tarea',
          tone: 'primary',
          icon: 'plus',
          trigger: { action: 'open-modal', value: 'new-task' },
        },
      ],
    },
    records: {
      title: 'Registros de Actividad',
      subtitle: 'Historial completo de todas las operaciones',
      actions: [
        {
          label: 'Filtros',
          tone: 'secondary',
          icon: 'filter',
          trigger: { action: 'open-modal', value: 'advanced-filters' },
        },
        {
          label: 'Exportar',
          tone: 'secondary',
          icon: 'download',
          trigger: { action: 'toast', value: 'Exportación dummy preparada. En la siguiente fase conectamos el archivo real.' },
        },
      ],
    },
    settings: {
      title: 'Configuración',
      subtitle: 'Cuenta, seguridad y preferencias del campo',
      actions: [],
    },
  };

  function requestJson(url, options) {
    return fetch(url, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...((options && options.headers) || {}),
      },
      ...(options || {}),
    }).then(async (response) => {
      let payload = null;

      try {
        payload = await response.json();
      } catch (_error) {
        payload = null;
      }

      if (!response.ok) {
        const rawMessage =
          (payload && payload.error) || `Request failed with status ${response.status}`;
        const error = new Error(rawMessage);
        error.status = response.status;

        if (response.status === 401) {
          if (url === LOGIN_API_URL) {
            error.message = 'Usuario o contraseña incorrectos.';
          } else {
            error.message =
              'Tu sesión venció o ya no es válida. Volvé a iniciar sesión para seguir usando el admin.';

            if (url !== LOGOUT_API_URL) {
              handleUnauthorizedSession(error.message);
            }
          }
        }

        throw error;
      }

      return payload;
    });
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function createStore(initialState) {
    let state = { ...initialState };
    const listeners = new Set();

    return {
      getState() {
        return state;
      },

      setState(patch) {
        state = {
          ...state,
          ...(typeof patch === 'function' ? patch(state) : patch),
        };

        listeners.forEach((listener) => listener(state));
      },

      subscribe(listener) {
        listeners.add(listener);
        listener(state);

        return () => {
          listeners.delete(listener);
        };
      },
    };
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatFriendlyDate(date) {
    return new Intl.DateTimeFormat('es-UY', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  }

  function formatTimeLabel(value) {
    return new Intl.DateTimeFormat('es-UY', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  function formatDateLabel(value) {
    if (!value) {
      return 'Sin fecha';
    }

    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat('es-UY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parsed);
  }

  function formatCompactDateLabel(value) {
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

  function formatMonthLabel(value) {
    const normalized = String(value || '').trim();
    if (!/^\d{4}-\d{2}$/.test(normalized)) {
      return normalized || 'mes actual';
    }

    const parsed = new Date(`${normalized}-01T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
      return normalized;
    }

    return new Intl.DateTimeFormat('es-UY', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(parsed);
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

  function addMonthsToYearMonth(yearMonth, monthDelta) {
    const monthInfo = getMonthDateInfo(yearMonth);
    const date = new Date(Date.UTC(monthInfo.year, monthInfo.month_index + Number(monthDelta || 0), 1));
    return date.toISOString().slice(0, 7);
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

  function formatNumberLabel(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return String(value ?? '-');
    }

    return new Intl.NumberFormat('es-UY').format(parsed);
  }

  function formatCurrencyLabel(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 'Sin datos';
    }

    return `$${new Intl.NumberFormat('es-UY', {
      maximumFractionDigits: 0,
    }).format(parsed)}`;
  }

  function formatDetailedCurrencyLabel(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 'Sin datos';
    }

    return `$${new Intl.NumberFormat('es-UY', {
      minimumFractionDigits: parsed % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(parsed)}`;
  }

  function formatStockValueLabel(currentStock, unit) {
    const parsed = Number(currentStock);
    const value = Number.isFinite(parsed) ? new Intl.NumberFormat('es-UY').format(parsed) : '-';
    return `${value} ${String(unit || '').trim()}`.trim();
  }

  function isStockGrainItem(item) {
    const categoryKey =
      item?.category?.key != null ? item.category.key : item?.category_key != null ? item.category_key : '';
    return String(categoryKey || '').trim().toLowerCase() === 'grano';
  }

  function getStockPurchaseProfile(item) {
    const explicitLabel = String(item?.purchase_unit_label || '').trim();
    const explicitSize = Number(item?.purchase_unit_size);

    if (explicitLabel || (Number.isFinite(explicitSize) && explicitSize > 0)) {
      return {
        label: explicitLabel || (isStockGrainItem(item) ? 'bolsa' : ''),
        size: Number.isFinite(explicitSize) && explicitSize > 0 ? explicitSize : null,
        derived: Boolean(item?.purchase_unit_derived),
      };
    }

    if (isStockGrainItem(item) && String(item?.unit || '').trim().toLowerCase() === 'kg') {
      return {
        label: 'bolsa',
        size: 25,
        derived: true,
      };
    }

    return {
      label: '',
      size: null,
      derived: false,
    };
  }

  function getStockPurchaseUnitSize(item) {
    const profile = getStockPurchaseProfile(item);
    return Number.isFinite(profile.size) && profile.size > 0 ? profile.size : null;
  }

  function getStockPurchaseUnitLabel(item) {
    return getStockPurchaseProfile(item).label;
  }

  function usesStockPurchaseUnit(item) {
    const purchaseProfile = getStockPurchaseProfile(item);
    return Boolean(purchaseProfile.label) || Number.isFinite(purchaseProfile.size);
  }

  function getStockBaseUnitCost(item) {
    const directCost = Number(item?.base_unit_cost);
    if (Number.isFinite(directCost)) {
      return directCost;
    }

    const purchaseCost = Number(item?.unit_cost);
    if (!Number.isFinite(purchaseCost)) {
      return null;
    }

    const purchaseUnitSize = getStockPurchaseUnitSize(item);
    return purchaseUnitSize > 0 ? purchaseCost / purchaseUnitSize : purchaseCost;
  }

  function formatStockPurchaseCostLabel(item) {
    const purchaseCost = Number(item?.unit_cost);
    if (!Number.isFinite(purchaseCost)) {
      return 'Sin costo';
    }

    const purchaseUnitLabel = getStockPurchaseUnitLabel(item);
    if (purchaseUnitLabel) {
      return `${formatCurrencyLabel(purchaseCost)} / ${purchaseUnitLabel}`;
    }

    if (usesStockPurchaseUnit(item)) {
      return `${formatCurrencyLabel(purchaseCost)} / compra`;
    }

    return formatCurrencyLabel(purchaseCost);
  }

  function formatStockEquivalentCostLabel(item) {
    const baseUnitCost = getStockBaseUnitCost(item);
    const baseUnit = String(item?.unit || '').trim();
    if (!Number.isFinite(baseUnitCost) || !baseUnit) {
      return 'Sin equivalencia';
    }

    return `${formatDetailedCurrencyLabel(baseUnitCost)} por ${baseUnit}`;
  }

  function formatStockPurchasePresentationLabel(item) {
    const purchaseUnitLabel = getStockPurchaseUnitLabel(item);
    const purchaseUnitSize = getStockPurchaseUnitSize(item);
    const baseUnit = String(item?.unit || '').trim();

    if (!baseUnit || !(purchaseUnitSize > 0)) {
      return 'Sin presentación cargada';
    }

    return `${formatStockValueLabel(purchaseUnitSize, baseUnit)} por ${purchaseUnitLabel || 'compra'}`;
  }

  function formatHorseAgeLabel(ageYears) {
    if (ageYears == null || ageYears === '') {
      return 'Edad sin cargar';
    }

    const parsed = Number(ageYears);
    if (!Number.isFinite(parsed)) {
      return 'Edad sin cargar';
    }

    return `${parsed} año${parsed === 1 ? '' : 's'}`;
  }

  function formatValueLabel(value, options) {
    const matched = (options || []).find((option) => option.value === (value || ''));
    return matched ? matched.label : value || 'Sin definir';
  }

  function formatHorseTrainingLabel(value) {
    return formatValueLabel(value || '', HORSE_TRAINING_OPTIONS);
  }

  function getFieldWorkMutationValue(value) {
    const normalized = String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ');

    if (!normalized) {
      return '';
    }

    if (normalized === 'soil prep' || normalized === 'rastra') {
      return 'soil_prep';
    }

    if (normalized === 'seeding' || normalized === 'siembra') {
      return 'seeding';
    }

    if (normalized === 'fertilizer' || normalized === 'fertilizacion' || normalized === 'fertilización') {
      return 'fertilizer';
    }

    if (normalized === 'spraying' || normalized === 'fumigacion' || normalized === 'fumigación') {
      return 'spraying';
    }

    if (
      normalized === 'ready check' ||
      normalized === 'ready' ||
      normalized === 'chequeo de ingreso'
    ) {
      return 'ready_check';
    }

    if (normalized === 'other' || normalized === 'otro') {
      return 'other';
    }

    return '';
  }

  function normalizeResponsibleKindValue(value) {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();

    if (normalized === 'field_staff' || normalized === 'staff' || normalized === 'campo') {
      return 'field_staff';
    }

    if (normalized === 'external' || normalized === 'contractor' || normalized === 'externo') {
      return 'external';
    }

    if (!normalized || normalized === 'unspecified' || normalized === 'sin especificar') {
      return 'unspecified';
    }

    return 'unspecified';
  }

  function formatResponsibleKindLabel(value) {
    return formatValueLabel(normalizeResponsibleKindValue(value), RESPONSIBLE_KIND_OPTIONS);
  }

  function formatAccountDisplayName(username) {
    const rawValue = String(username || '').trim();
    if (!rawValue) {
      return 'Administrador';
    }

    const safeValue = rawValue.includes('@') ? rawValue.split('@')[0] : rawValue;
    const tokens = safeValue.split(/[._-]+/).filter(Boolean);
    if (!tokens.length) {
      return rawValue;
    }

    return tokens
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(' ');
  }

  function getInitials(value) {
    const tokens = String(value || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (!tokens.length) {
      return 'FB';
    }

    return tokens
      .slice(0, 2)
      .map((token) => token.charAt(0).toUpperCase())
      .join('');
  }

  function getSessionAccount(state) {
    const sessionAccount = state?.session?.account || {};
    const username = sessionAccount.username || state?.session?.username || '';
    const displayName = sessionAccount.display_name || formatAccountDisplayName(username);
    const email = sessionAccount.email || (username.includes('@') ? username : '');
    const role = sessionAccount.role || (state?.session?.demo ? 'Modo demo' : 'Administrador');
    const farmName = sessionAccount.farm_name || 'Campo';

    return {
      username,
      displayName,
      email,
      role,
      farmName,
      initials: getInitials(displayName || username || 'FB'),
      isDemo: Boolean(state?.session?.demo),
    };
  }

  function isRealSession(state) {
    return Boolean(state && state.session && state.session.authenticated && !state.session.demo);
  }

  function getRealHorseDashboard(state) {
    return state && state.horsesDashboard ? state.horsesDashboard.horses_dashboard || null : null;
  }

  function getRealPaddockDashboard(state) {
    return state && state.paddocksDashboard ? state.paddocksDashboard.paddocks_dashboard || null : null;
  }

  function getRealStockDashboard(state) {
    return state && state.stockDashboard ? state.stockDashboard.stock_dashboard || null : null;
  }

  function getRealHorseCatalog(state) {
    const dashboard = getRealHorseDashboard(state);
    return dashboard && dashboard.catalog ? dashboard.catalog : null;
  }

  function getRealHorseHistoryState(state, horseId) {
    if (!(state && state.horseHistoryById)) {
      return null;
    }

    return state.horseHistoryById[String(horseId)] || null;
  }

  function getRealPaddockDetailState(state, paddockId) {
    if (!(state && state.paddockDetailById)) {
      return null;
    }

    return state.paddockDetailById[String(paddockId)] || null;
  }

  function getRealPaddockCatalogRows(state) {
    const catalog = getRealHorseCatalog(state);
    if (Array.isArray(catalog?.paddocks) && catalog.paddocks.length) {
      return catalog.paddocks;
    }

    const dashboard = getRealPaddockDashboard(state);
    return Array.isArray(dashboard?.paddocks) ? dashboard.paddocks : [];
  }

  function getRealPaddockCatalogById(state, paddockId) {
    return (
      getRealPaddockCatalogRows(state).find(
        (paddock) => Number(paddock.id) === Number(paddockId)
      ) || null
    );
  }

  function getRealGroupCatalogRows(state) {
    const catalog = getRealHorseCatalog(state);
    return Array.isArray(catalog?.groups) ? catalog.groups : [];
  }

  function getRealGroupCatalogById(state, groupId) {
    return (
      getRealGroupCatalogRows(state).find((group) => Number(group.id) === Number(groupId)) || null
    );
  }

  function getRealGroupCatalogByName(state, groupName) {
    const normalizedGroupName = String(groupName || '').trim().toLowerCase();
    if (!normalizedGroupName) {
      return null;
    }

    return (
      getRealGroupCatalogRows(state).find(
        (group) => String(group.name || '').trim().toLowerCase() === normalizedGroupName
      ) || null
    );
  }

  function todayDateString() {
    return new Date().toISOString().slice(0, 10);
  }

  function isValidDateString(value) {
    const stringValue = String(value || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
      return false;
    }

    const [year, month, day] = stringValue.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  function calculateInclusiveDays(dateString) {
    if (!dateString) {
      return null;
    }

    const startDate = new Date(`${dateString}T00:00:00Z`);
    if (Number.isNaN(startDate.getTime())) {
      return null;
    }

    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const startUtc = Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate()
    );

    return Math.max(1, Math.floor((todayUtc - startUtc) / 86400000) + 1);
  }

  function getRealHorseById(state, horseId) {
    const dashboard = getRealHorseDashboard(state);
    if (!dashboard || !Array.isArray(dashboard.horses)) {
      return null;
    }

    return dashboard.horses.find((horse) => Number(horse.id) === Number(horseId)) || null;
  }

  function getRealPaddockById(state, paddockId) {
    const dashboard = getRealPaddockDashboard(state);
    if (!dashboard || !Array.isArray(dashboard.paddocks)) {
      return null;
    }

    return dashboard.paddocks.find((paddock) => Number(paddock.id) === Number(paddockId)) || null;
  }

  function getRealStockItems(state) {
    const dashboard = getRealStockDashboard(state);
    return Array.isArray(dashboard?.inventory?.items) ? dashboard.inventory.items : [];
  }

  function getRealStockMovements(state) {
    const dashboard = getRealStockDashboard(state);
    return Array.isArray(dashboard?.movement_panel?.entries) ? dashboard.movement_panel.entries : [];
  }

  function getRealStockItemById(state, itemId) {
    if (!itemId) {
      return null;
    }

    return getRealStockItems(state).find((item) => Number(item.id) === Number(itemId)) || null;
  }

  function getRealStockMovementById(state, stockEventId) {
    if (!stockEventId) {
      return null;
    }

    return (
      getRealStockMovements(state).find((entry) => Number(entry.id) === Number(stockEventId)) || null
    );
  }

  function getRealStockItemByName(state, itemName) {
    const normalizedName = String(itemName || '').trim().toLowerCase();
    if (!normalizedName) {
      return null;
    }

    return (
      getRealStockItems(state).find(
        (item) => String(item.name || '').trim().toLowerCase() === normalizedName
      ) || null
    );
  }

  function buildHorseFeedPlanDraftRow(partial = {}) {
    return {
      row_key: partial.row_key || `draft-${nextHorseFeedPlanDraftRowKey++}`,
      id: partial.id == null ? null : Number(partial.id),
      feed_slot: getFeedSlotMeta(partial.feed_slot)?.key || 'morning',
      feed_item_name: partial.feed_item_name || '',
      quantity: partial.quantity == null ? '' : String(partial.quantity),
      unit: partial.unit || '',
      auto_deduct_stock:
        partial.auto_deduct_stock == null ? true : Boolean(partial.auto_deduct_stock),
    };
  }

  function buildHorseFeedPlanDraftRowsFromHistory(historyPayload) {
    const items = Array.isArray(historyPayload?.feed_plan?.items) ? historyPayload.feed_plan.items : [];
    return items.map((row) =>
      buildHorseFeedPlanDraftRow({
        row_key: row.id == null ? undefined : `saved-${row.id}`,
        id: row.id,
        feed_slot: row.feed_slot,
        feed_item_name: row.feed_item_name,
        quantity: row.quantity,
        unit: row.unit,
        auto_deduct_stock: row.auto_deduct_stock,
      })
    );
  }

  function sortHorseFeedPlanRows(rows) {
    return [...(Array.isArray(rows) ? rows : [])].sort((left, right) => {
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

  function getHorseFeedPlanDraftRowsForModal(payload, historyPayload) {
    const hasDraftRows = Boolean(
      payload && Object.prototype.hasOwnProperty.call(payload, 'feedPlanDraftRows')
    );

    return sortHorseFeedPlanRows(
      (hasDraftRows ? payload.feedPlanDraftRows : buildHorseFeedPlanDraftRowsFromHistory(historyPayload)).map(
        (row) => buildHorseFeedPlanDraftRow(row)
      )
    );
  }

  function buildHorseFeedPlanSaveItems(rows) {
    return sortHorseFeedPlanRows(rows)
      .filter((row) => {
        const feedItemName = String(row?.feed_item_name || '').trim();
        const unit = String(row?.unit || '').trim();
        return Boolean(feedItemName || unit || String(row?.quantity || '').trim());
      })
      .map((row) => ({
        feed_slot: row.feed_slot,
        feed_item_name: String(row.feed_item_name || '').trim(),
        quantity: Number(row.quantity),
        unit: String(row.unit || '').trim(),
        auto_deduct_stock: Boolean(row.auto_deduct_stock),
      }));
  }

  function updateHorseFeedPlanDraftRows(state, payload, rowKey, field, rawValue) {
    const historyPayload = getRealHorseHistoryState(state, payload?.horseId)?.data || null;
    const rows = getHorseFeedPlanDraftRowsForModal(payload, historyPayload);
    return rows.map((row) => {
      if (row.row_key !== rowKey) {
        return row;
      }

      const nextRow = { ...row };
      if (field === 'auto_deduct_stock') {
        nextRow.auto_deduct_stock = Boolean(rawValue);
        const feedItem = getRealStockItemByName(state, nextRow.feed_item_name);
        if (nextRow.auto_deduct_stock && feedItem?.unit) {
          nextRow.unit = feedItem.unit;
        }
        return nextRow;
      }

      const nextValue = typeof rawValue === 'string' ? rawValue : String(rawValue ?? '');
      nextRow[field] = nextValue;

      if (field === 'feed_item_name') {
        const feedItem = getRealStockItemByName(state, nextValue);
        if (feedItem?.unit && (nextRow.auto_deduct_stock || !String(nextRow.unit || '').trim())) {
          nextRow.unit = feedItem.unit;
        }
      }

      return nextRow;
    });
  }

  function getHorseFeedCalendarMonth(payload, historyPayload) {
    return (
      normalizeYearMonth(payload?.feedCalendarMonth) ||
      normalizeYearMonth(historyPayload?.feed_calendar?.month) ||
      currentYearMonthString()
    );
  }

  function getHorseFeedCalendarEntriesForMonth(historyPayload, selectedMonth) {
    const calendarMonth = normalizeYearMonth(historyPayload?.feed_calendar?.month);
    if (!selectedMonth || calendarMonth !== selectedMonth) {
      return [];
    }

    return Array.isArray(historyPayload?.feed_calendar?.entries) ? historyPayload.feed_calendar.entries : [];
  }

  function buildHorseFeedPlanSummary(draftRows, calendarEntries) {
    const ingredientCount = draftRows.filter((row) => String(row.feed_item_name || '').trim()).length;
    const plannedSlots = new Set(
      draftRows
        .filter((row) => String(row.feed_item_name || '').trim())
        .map((row) => row.feed_slot)
        .filter(Boolean)
    );
    const completedKeys = new Set(
      (Array.isArray(calendarEntries) ? calendarEntries : [])
        .map((entry) => `${entry.event_date}:${entry.feed_slot}`)
        .filter(Boolean)
    );

    return {
      ingredients: ingredientCount,
      slots: plannedSlots.size,
      completions: completedKeys.size,
    };
  }

  function getHorseFeedHistorySourceLabel(row) {
    return row?.calendar_slot_entry_id != null ? 'Plan' : 'Manual';
  }

  function formatHorseFeedStockChangeSummary(stockChanges) {
    if (!Array.isArray(stockChanges) || stockChanges.length === 0) {
      return '';
    }

    return stockChanges
      .map((row) => `${row.feed_item_name}: ${formatStockValueLabel(row.current_stock, row.unit)}`)
      .join(' · ');
  }

  function getRealStockActions(state) {
    if (!state?.stockDashboard?.meta?.feed_module_enabled) {
      return [];
    }

    return [
      {
        label: 'Ingresar stock',
        tone: 'primary',
        icon: 'cart',
        trigger: { action: 'open-modal', value: 'purchase-create' },
      },
      {
        label: 'Nuevo inventario',
        tone: 'secondary',
        icon: 'plus',
        trigger: { action: 'open-modal', value: 'product-form' },
      },
    ];
  }

  function getRealLowStockItems(state) {
    return getRealStockItems(state).filter((item) => item?.health?.key === 'critical');
  }

  function getRealStockSubtitle(state) {
    const dashboard = getRealStockDashboard(state);
    if (!dashboard) {
      return 'Lectura de inventario no disponible.';
    }

    const items = Array.isArray(dashboard.inventory?.items) ? dashboard.inventory.items : [];
    const lowStockItems = getRealLowStockItems(state);
    const recentMovementCard = Array.isArray(dashboard.summary_cards)
      ? dashboard.summary_cards.find((card) => card.key === 'inventory_recent_movements')
      : null;
    const recentMovements = Number(recentMovementCard?.value || 0) || 0;

    return `${items.length} producto${items.length === 1 ? '' : 's'} · ${lowStockItems.length} bajo stock · ${recentMovements} movimiento${recentMovements === 1 ? '' : 's'} en 7 días`;
  }

  function getStockMetricTone(tone) {
    if (tone === 'positive') {
      return 'green';
    }

    if (tone === 'critical') {
      return 'critical';
    }

    if (tone === 'warning') {
      return 'orange';
    }

    return 'blue';
  }

  function getStockMetricIcon(key) {
    switch (String(key || '').trim()) {
      case 'inventory_items':
        return 'stock';
      case 'inventory_low_stock':
        return 'circleAlert';
      case 'inventory_recent_movements':
        return 'trendUp';
      case 'inventory_latest_movement':
        return 'calendar';
      default:
        return 'stock';
    }
  }

  function buildRealStockMetrics(dashboard) {
    return (dashboard?.summary_cards || []).map((card) => ({
      ...card,
      value:
        card.key === 'inventory_latest_movement'
          ? formatCompactDateLabel(card.value)
          : typeof card.value === 'number'
            ? formatNumberLabel(card.value)
            : card.value,
      tone: getStockMetricTone(card.tone),
      icon: getStockMetricIcon(card.key),
    }));
  }

  function getStockCategoryTone(categoryKey) {
    switch (String(categoryKey || '').trim().toLowerCase()) {
      case 'alimento':
        return 'green';
      case 'grano':
        return 'blue';
      case 'herbicida':
        return 'orange';
      default:
        return 'blue';
    }
  }

  function getStockCategoryIcon(categoryKey) {
    switch (String(categoryKey || '').trim().toLowerCase()) {
      case 'grano':
        return 'seed';
      case 'alimento':
        return 'leaf';
      case 'salud':
        return 'health';
      case 'fertilizante':
      case 'herbicida':
        return 'flask';
      default:
        return 'stock';
    }
  }

  function getStockHealthTone(healthKey) {
    if (healthKey === 'critical') {
      return 'critical';
    }

    if (healthKey === 'warning') {
      return 'warning';
    }

    if (healthKey === 'healthy') {
      return 'green';
    }

    return 'blue';
  }

  function buildRealStockNotice(dashboard) {
    const alertBanner = dashboard?.alert_banner;
    if (!alertBanner) {
      return null;
    }

    const items = Array.isArray(alertBanner.items) ? alertBanner.items : [];
    const [primaryItem, ...remainingItems] = items;

    return {
      tone: alertBanner.tone === 'critical' ? 'critical' : 'green',
      title: alertBanner.title || 'Inventario',
      description: alertBanner.description || '',
      focus: primaryItem?.name || '',
      focusDetail: primaryItem?.detail || '',
      rows: remainingItems.map((item) => `${item.name}: ${item.detail}`),
      tag: alertBanner.tone === 'critical' ? 'Urgente' : '',
    };
  }

  function getFilteredRealStockItems(state, dashboard) {
    const items = Array.isArray(dashboard?.inventory?.items) ? dashboard.inventory.items : [];
    const query = String(state?.stockFilters?.query || '')
      .trim()
      .toLowerCase();
    const category = String(state?.stockFilters?.category || 'all').trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !query ||
        String(item.name || '').toLowerCase().includes(query) ||
        String(item.supplier || '').toLowerCase().includes(query) ||
        String(item.category?.label || '')
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        category === 'all' || String(item.category?.key || '').trim().toLowerCase() === category;

      return matchesQuery && matchesCategory;
    });
  }

  function getStockPanelStatusMeta(status) {
    switch (String(status || '').trim().toLowerCase()) {
      case 'ready':
        return { label: 'Listo', tone: 'green' };
      case 'partial':
        return { label: 'Parcial', tone: 'warning' };
      default:
        return { label: 'Pendiente', tone: 'orange' };
    }
  }

  function getStockMovementMeta(eventType) {
    switch (String(eventType || '').trim().toLowerCase()) {
      case 'add':
        return {
          label: 'Ingreso',
          icon: 'trendUp',
          tone: 'green',
          quantityPrefix: '+',
        };
      case 'use':
        return {
          label: 'Consumo',
          icon: 'trendDown',
          tone: 'critical',
          quantityPrefix: '-',
        };
      case 'set':
        return {
          label: 'Ajuste',
          icon: 'circleAlert',
          tone: 'blue',
          quantityPrefix: '=',
        };
      default:
        return {
          label: 'Movimiento',
          icon: 'stock',
          tone: 'blue',
          quantityPrefix: '',
        };
    }
  }

  function buildRealStockAccountingRows(dashboard) {
    const accountingPanel = dashboard?.accounting_panel || {};
    if (Array.isArray(accountingPanel.coverage_rows) && accountingPanel.coverage_rows.length) {
      return accountingPanel.coverage_rows;
    }

    const items = Array.isArray(dashboard?.inventory?.items) ? dashboard.inventory.items : [];
    const withUnitCost = items.filter((item) => item.unit_cost != null).length;
    const withSupplier = items.filter((item) => item.supplier).length;
    const withPurchaseDate = items.filter((item) => item.last_purchase_date).length;
    const estimatedInventoryValue = items.reduce((total, item) => {
      const unitCost = Number(getStockBaseUnitCost(item));
      const currentStock = Number(item.current_stock);
      if (!Number.isFinite(unitCost) || !Number.isFinite(currentStock)) {
        return total;
      }

      return total + unitCost * currentStock;
    }, 0);
    const latestMovementCard = Array.isArray(dashboard?.summary_cards)
      ? dashboard.summary_cards.find((card) => card.key === 'inventory_latest_movement')
      : null;

    return [
      {
        label: 'Productos con costo cargado',
        value: `${formatNumberLabel(withUnitCost)} / ${formatNumberLabel(items.length)}`,
      },
      {
        label: 'Valor estimado del inventario',
        value: withUnitCost > 0 ? formatCurrencyLabel(estimatedInventoryValue) : 'Sin costos cargados',
      },
      {
        label: 'Productos con proveedor cargado',
        value: `${formatNumberLabel(withSupplier)} / ${formatNumberLabel(items.length)}`,
      },
      {
        label: 'Productos con última compra cargada',
        value: `${formatNumberLabel(withPurchaseDate)} / ${formatNumberLabel(items.length)}`,
      },
      {
        label: 'Último movimiento disponible',
        value: formatCompactDateLabel(latestMovementCard?.value),
      },
    ];
  }

  function formatAccountingMetricValue(card) {
    if (!card) {
      return '-';
    }

    if (card.value_format === 'currency') {
      return formatCurrencyLabel(card.value);
    }

    return formatNumberLabel(card.value);
  }

  function getAccountingChartSourceMeta(source) {
    switch (String(source || '').trim().toLowerCase()) {
      case 'real':
        return { label: 'Mes real', tone: 'green' };
      case 'estimated':
        return { label: 'Estimado', tone: 'blue' };
      case 'inventory':
        return { label: 'Snapshot', tone: 'orange' };
      default:
        return { label: 'Parcial', tone: 'warning' };
    }
  }

  function buildAccountingDonutGradient(rows) {
    const segments = [];
    let cursor = 0;

    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const share = Number(row?.share_percent);
      if (!Number.isFinite(share) || share <= 0) {
        return;
      }

      const nextCursor = Math.min(100, cursor + share);
      segments.push(`${row.color} ${cursor}% ${nextCursor}%`);
      cursor = nextCursor;
    });

    if (!segments.length) {
      return 'conic-gradient(#e5e7eb 0% 100%)';
    }

    if (cursor < 100) {
      segments.push(`#e5e7eb ${cursor}% 100%`);
    }

    return `conic-gradient(${segments.join(', ')})`;
  }

  function renderAccountingChartPanel(chart, periodLabel) {
    const sourceMeta = getAccountingChartSourceMeta(chart?.source);
    const rows = Array.isArray(chart?.rows) ? chart.rows : [];

    if (!rows.length) {
      return `
        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>${escapeHtml(chart?.title || 'Distribución de costos')}</h2>
              <span class="subtle-text">${escapeHtml(chart?.message || 'Todavía no hay datos suficientes para construir la distribución.')}</span>
            </div>
            ${renderBadge(sourceMeta.label, sourceMeta.tone)}
          </div>
          <div class="empty-state-card">
            <strong>No hay datos suficientes para la gráfica todavía.</strong>
            <span>Cargá precios y consumos para ver cómo se reparte el gasto entre productos.</span>
          </div>
        </section>
      `;
    }

    return `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>${escapeHtml(chart.title || 'Distribución de costos')}</h2>
            ${chart.message ? `<span class="subtle-text">${escapeHtml(chart.message)}</span>` : ''}
          </div>
          ${renderBadge(sourceMeta.label, sourceMeta.tone)}
        </div>

        <div class="accounting-chart-layout">
          <div class="accounting-donut-shell">
            <div
              class="accounting-donut"
              style="--accounting-donut:${escapeHtml(buildAccountingDonutGradient(rows))}"
              aria-hidden="true"
            >
              <div class="accounting-donut-hole">
                <span>${escapeHtml(periodLabel)}</span>
                <strong>${escapeHtml(formatCurrencyLabel(chart.total_value))}</strong>
                <small>Total analizado</small>
              </div>
            </div>
          </div>

          <div class="accounting-legend">
            ${rows
              .map(
                (row) => `
                  <article class="accounting-legend-row">
                    <span
                      class="accounting-legend-swatch"
                      style="background:${escapeHtml(row.color || '#d0d5dd')}"
                      aria-hidden="true"
                    ></span>
                    <div class="accounting-legend-copy">
                      <strong>${escapeHtml(row.label)}</strong>
                      <span>${escapeHtml(row.detail || `${formatNumberLabel(row.share_percent)}% del total`)}</span>
                    </div>
                    <div class="accounting-legend-value">
                      <strong>${escapeHtml(formatCurrencyLabel(row.value))}</strong>
                      <span>${escapeHtml(`${formatNumberLabel(row.share_percent)}%`)}</span>
                    </div>
                  </article>
                `
              )
              .join('')}
          </div>
        </div>
      </section>
    `;
  }

  function renderAccountingHorseCostPanel(horseCosts, periodLabel) {
    const rows = Array.isArray(horseCosts?.rows) ? horseCosts.rows : [];

    return `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>${escapeHtml(horseCosts?.title || 'Costo por caballo')}</h2>
            ${
              horseCosts?.message
                ? `<span class="subtle-text">${escapeHtml(horseCosts.message)}</span>`
                : ''
            }
          </div>
          ${renderBadge(periodLabel, 'gray')}
        </div>

        ${
          rows.length
            ? `
              <div class="table-wrap">
                <table class="data-table horse-data-table">
                  <thead>
                    <tr>
                      <th>Caballo</th>
                      <th>Mes actual</th>
                      <th>Diario est.</th>
                      <th>Mensual est.</th>
                      <th>Anual est.</th>
                      <th>Cobertura</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows
                      .map((row) => {
                        const plannedCoverage =
                          row.planned_items_count > 0
                            ? `${formatNumberLabel(row.planned_items_with_cost)} / ${formatNumberLabel(
                                row.planned_items_count
                              )} insumos con precio`
                            : 'Sin plan cargado';
                        const actualCoverage =
                          row.actual_items_count > 0
                            ? `${formatNumberLabel(row.actual_items_with_cost)} / ${formatNumberLabel(
                                row.actual_items_count
                              )} líneas con precio este mes`
                            : 'Sin consumos reales en el mes';
                        const missingPriceLine =
                          Array.isArray(row.missing_price_items) && row.missing_price_items.length
                            ? `Falta costo para: ${row.missing_price_items.join(', ')}`
                            : 'Cobertura completa para alimento.';

                        return `
                          <tr>
                            <td>
                              <div class="table-primary">
                                <strong>${escapeHtml(row.horse_name)}</strong>
                                <span>${escapeHtml(actualCoverage)}</span>
                              </div>
                            </td>
                            <td>
                              <div class="table-primary">
                                <strong>${escapeHtml(
                                  row.actual_month_cost > 0
                                    ? formatCurrencyLabel(row.actual_month_cost)
                                    : 'Sin consumo'
                                )}</strong>
                                <span>${escapeHtml(periodLabel)}</span>
                              </div>
                            </td>
                            <td>${escapeHtml(
                              row.estimated_daily_cost > 0
                                ? formatCurrencyLabel(row.estimated_daily_cost)
                                : 'Sin plan'
                            )}</td>
                            <td>${escapeHtml(
                              row.estimated_monthly_cost > 0
                                ? formatCurrencyLabel(row.estimated_monthly_cost)
                                : 'Sin plan'
                            )}</td>
                            <td>${escapeHtml(
                              row.estimated_annual_cost > 0
                                ? formatCurrencyLabel(row.estimated_annual_cost)
                                : 'Sin plan'
                            )}</td>
                            <td>
                              <div class="table-primary">
                                <strong>${escapeHtml(plannedCoverage)}</strong>
                                <span>${escapeHtml(missingPriceLine)}</span>
                              </div>
                            </td>
                          </tr>
                        `;
                      })
                      .join('')}
                  </tbody>
                </table>
              </div>
            `
            : `
              <div class="empty-state-card">
                <strong>${escapeHtml(horseCosts?.empty_message || 'Todavía no hay costos por caballo disponibles.')}</strong>
                <span>Cargá planes de comida o consumos reales para que aparezca el detalle por caballo.</span>
              </div>
            `
        }
      </section>
    `;
  }

  function renderAccountingProductCostPanel(productCosts, periodLabel) {
    const rows = Array.isArray(productCosts?.rows) ? productCosts.rows : [];

    return `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>${escapeHtml(productCosts?.title || 'Costo por producto')}</h2>
            ${
              productCosts?.message
                ? `<span class="subtle-text">${escapeHtml(productCosts.message)}</span>`
                : ''
            }
          </div>
          ${renderBadge(periodLabel, 'gray')}
        </div>

        ${
          rows.length
            ? `
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio compra</th>
                      <th>Stock actual</th>
                      <th>Valor stock</th>
                      <th>Mes actual</th>
                      <th>Estimado mes</th>
                      <th>Proveedor</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows
                      .map((row) => {
                        const categoryTone = getStockCategoryTone(row.category_key);
                        const stockValueLabel =
                          row.inventory_value != null
                            ? formatCurrencyLabel(row.inventory_value)
                            : 'Sin costo';
                        const purchaseCostLabel = formatStockPurchaseCostLabel(row);
                        const equivalentCostLabel = formatStockEquivalentCostLabel(row);
                        const actualMonthLabel =
                          row.actual_month_cost > 0
                            ? formatCurrencyLabel(row.actual_month_cost)
                            : 'Sin consumo';
                        const estimatedMonthLabel =
                          row.estimated_monthly_cost > 0
                            ? formatCurrencyLabel(row.estimated_monthly_cost)
                            : 'Sin plan';

                        return `
                          <tr>
                            <td>
                              <div class="table-primary">
                                <strong>${escapeHtml(row.name)}</strong>
                                <div class="chip-row">
                                  ${renderBadge(row.category_label || 'General', categoryTone)}
                                  <span class="subtle-text">${
                                    row.last_purchase_date
                                      ? `Compra ${escapeHtml(formatCompactDateLabel(row.last_purchase_date))}`
                                      : 'Sin compra registrada'
                                  }</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div class="table-primary">
                                <strong>${escapeHtml(purchaseCostLabel)}</strong>
                                <span>${escapeHtml(
                                  row.unit_cost != null
                                    ? equivalentCostLabel
                                    : 'Falta cargar costo de compra'
                                )}</span>
                              </div>
                            </td>
                            <td>${escapeHtml(formatStockValueLabel(row.current_stock, row.unit))}</td>
                            <td>${escapeHtml(stockValueLabel)}</td>
                            <td>
                              <div class="table-primary">
                                <strong>${escapeHtml(actualMonthLabel)}</strong>
                                <span>${escapeHtml(
                                  row.actual_month_quantity > 0
                                    ? `${formatStockValueLabel(row.actual_month_quantity, row.unit)} consumidos`
                                    : periodLabel
                                )}</span>
                              </div>
                            </td>
                            <td>
                              <div class="table-primary">
                                <strong>${escapeHtml(estimatedMonthLabel)}</strong>
                                <span>${escapeHtml(
                                  row.estimated_monthly_quantity > 0
                                    ? `${formatStockValueLabel(row.estimated_monthly_quantity, row.unit)} proyectados`
                                    : 'Sin proyección cargada'
                                )}</span>
                              </div>
                            </td>
                            <td>${escapeHtml(row.supplier || 'Sin proveedor')}</td>
                          </tr>
                        `;
                      })
                      .join('')}
                  </tbody>
                </table>
              </div>
            `
            : `
              <div class="empty-state-card">
                <strong>${escapeHtml(productCosts?.empty_message || 'Todavía no hay productos suficientes para analizar costos.')}</strong>
                <span>Cargá costos unitarios y movimientos para ver el detalle por producto.</span>
              </div>
            `
        }
      </section>
    `;
  }

  function renderAccountingServiceGapPanel(serviceGaps, periodLabel) {
    const rows = Array.isArray(serviceGaps?.rows) ? serviceGaps.rows : [];

    return `
      <section class="panel panel--soft">
        <div class="panel-head">
          <div>
            <h2>${escapeHtml(serviceGaps?.title || 'Servicios fuera del cálculo')}</h2>
            ${
              serviceGaps?.message
                ? `<span class="subtle-text">${escapeHtml(serviceGaps.message)}</span>`
                : ''
            }
          </div>
          ${renderBadge(periodLabel, rows.length ? 'warning' : 'green')}
        </div>

        ${
          rows.length
            ? `
              <div class="mini-list">
                ${rows
                  .map(
                    (row) => `
                      <div class="mini-list-row">
                        <div>
                          <strong>${escapeHtml(row.label)}</strong>
                          <span>${escapeHtml(row.detail)}</span>
                        </div>
                        <strong>${escapeHtml(formatNumberLabel(row.count))}</strong>
                      </div>
                    `
                  )
                  .join('')}
              </div>
              <div class="note-bar note-bar--warning">
                Estos eventos todavía no entran al costo final porque aún no guardan monto.
              </div>
            `
            : `
              <div class="empty-state-card">
                <strong>${escapeHtml(serviceGaps?.empty_message || 'No hay servicios fuera del cálculo este mes.')}</strong>
                <span>Cuando empecemos a guardar montos de herrero, veterinaria y desparasitación, esta sección va a sumar directo al costo por caballo.</span>
              </div>
            `
        }
      </section>
    `;
  }

  function buildRealHorseCareAgenda(state) {
    const horses = Array.isArray(getRealHorseDashboard(state)?.horses)
      ? getRealHorseDashboard(state).horses
      : [];
    const today = todayDateString();
    const alertLimit = shiftIsoDateString(today, REAL_HOME_CARE_WINDOW_DAYS) || today;
    const entries = [];

    horses.forEach((horse) => {
      const careEntries = [
        { type: 'Desparasitación', dueDate: horse?.care?.deworming?.next_due_date || null },
        { type: 'Herraje', dueDate: horse?.care?.farrier?.next_due_date || null },
      ];

      careEntries.forEach((entry) => {
        if (!entry.dueDate) {
          return;
        }

        entries.push({
          horseId: horse.id,
          horseName: horse.name,
          type: entry.type,
          dueDate: entry.dueDate,
          overdue: entry.dueDate < today,
          soon: entry.dueDate >= today && entry.dueDate <= alertLimit,
        });
      });
    });

    return entries.sort((left, right) => getIsoSortValue(left.dueDate) - getIsoSortValue(right.dueDate));
  }

  function getHorseCareFilterOptions() {
    return [
      { value: 'all', label: 'Todos los cuidados' },
      { value: 'farrier-alert', label: 'Herraje pendiente' },
      { value: 'deworm-alert', label: 'Desparasitación pendiente' },
    ];
  }

  function horseMatchesCareFilter(horse, careFilter) {
    if (!horse || !careFilter || careFilter === 'all') {
      return true;
    }

    const today = todayDateString();
    const alertLimit = shiftIsoDateString(today, REAL_HOME_CARE_WINDOW_DAYS) || today;
    const farrierDueDate = horse?.care?.farrier?.next_due_date || null;
    const dewormDueDate = horse?.care?.deworming?.next_due_date || null;

    if (careFilter === 'farrier-alert') {
      return Boolean(
        farrierDueDate &&
          (farrierDueDate < today || (farrierDueDate >= today && farrierDueDate <= alertLimit))
      );
    }

    if (careFilter === 'deworm-alert') {
      return Boolean(
        dewormDueDate &&
          (dewormDueDate < today || (dewormDueDate >= today && dewormDueDate <= alertLimit))
      );
    }

    return true;
  }

  function resolveAlertContextKey(alert) {
    const explicitKey = String(alert?.alertKey || '').trim();
    if (explicitKey) {
      return explicitKey;
    }

    const normalizedTitle = String(alert?.title || '')
      .trim()
      .toLowerCase();

    if (normalizedTitle === 'stock bajo') {
      return 'stock-low';
    }

    if (normalizedTitle === 'herrajes') {
      return 'farrier-due';
    }

    if (normalizedTitle === 'desparasitación') {
      return 'deworm-due';
    }

    if (normalizedTitle === 'potreros') {
      return 'paddocks-growing';
    }

    if (normalizedTitle === 'sin alertas críticas') {
      return 'all-clear';
    }

    return '';
  }

  function getRealAlertCardTone(tone) {
    if (tone === 'critical') {
      return 'critical';
    }

    if (tone === 'green') {
      return 'green';
    }

    return 'warning';
  }

  function getRealAlertBadgeLabel(alert) {
    if (!alert) {
      return '';
    }

    if (alert.countLabel) {
      return alert.countLabel;
    }

    return String(alert.count || 0);
  }

  function buildRealAdminAlerts(state) {
    const horseDashboard = getRealHorseDashboard(state);
    const paddockDashboard = getRealPaddockDashboard(state);
    const stockDashboard = getRealStockDashboard(state);

    if (!(horseDashboard || paddockDashboard || stockDashboard)) {
      return [
        {
          title: 'Sin datos reales',
          detail: 'No pudimos cargar alertas desde la base en esta sesión.',
          count: 0,
          countLabel: '--',
          tone: 'warning',
          navKey: 'home',
        },
      ];
    }

    const today = todayDateString();
    const lowStockItems = getRealLowStockItems(state);
    const careAgenda = buildRealHorseCareAgenda(state);
    const farrierEntries = careAgenda.filter((entry) => entry.type === 'Herraje' && (entry.overdue || entry.soon));
    const dewormEntries = careAgenda.filter(
      (entry) => entry.type === 'Desparasitación' && (entry.overdue || entry.soon)
    );
    const paddocksPreparing = (getRealPaddockDashboard(state)?.paddocks || []).filter(
      (paddock) => paddock.occupancy_state === 'growing'
    );
    const alerts = [];

    if (lowStockItems.length) {
      alerts.push({
        alertKey: 'stock-low',
        title: 'Stock Bajo',
        detail: lowStockItems
          .slice(0, 3)
          .map((item) => item.name)
          .join(', '),
        count: lowStockItems.length,
        tone: 'critical',
        navKey: 'stock',
      });
    }

    if (farrierEntries.length) {
      const overdueCount = farrierEntries.filter((entry) => entry.overdue).length;
      alerts.push({
        alertKey: 'farrier-due',
        title: 'Herrajes',
        detail:
          overdueCount > 0
            ? `${overdueCount} atrasado(s)`
            : `${farrierEntries.length} próximo(s)`,
        count: farrierEntries.length,
        tone: 'warning',
        navKey: 'horses',
      });
    }

    if (dewormEntries.length) {
      const overdueCount = dewormEntries.filter((entry) => entry.overdue).length;
      alerts.push({
        alertKey: 'deworm-due',
        title: 'Desparasitación',
        detail:
          overdueCount > 0
            ? `${overdueCount} atrasada(s)`
            : `${dewormEntries.length} próxima(s)`,
        count: dewormEntries.length,
        tone: 'warning',
        navKey: 'horses',
      });
    }

    if (paddocksPreparing.length) {
      const nextReadyDate = paddocksPreparing
        .map((paddock) => paddock.ready_to_graze_on)
        .filter(Boolean)
        .sort()[0];

      alerts.push({
        alertKey: 'paddocks-growing',
        title: 'Potreros',
        detail: nextReadyDate
          ? `Preparación hasta ${formatDateLabel(nextReadyDate)}`
          : 'En preparación',
        count: paddocksPreparing.length,
        tone: 'warning',
        navKey: 'paddocks',
      });
    }

    if (!alerts.length) {
      alerts.push({
        alertKey: 'all-clear',
        title: 'Sin alertas críticas',
        detail: `Lectura real al ${formatDateLabel(today)} sin pendientes urgentes.`,
        count: 0,
        countLabel: 'OK',
        tone: 'green',
        navKey: 'home',
      });
    }

    return alerts.slice(0, 4);
  }

  function getVisibleAlerts(state) {
    return isRealSession(state) ? buildRealAdminAlerts(state) : DEMO_DATA.alerts;
  }

  function getHomePaddockConditionMeta(paddock) {
    if (paddock?.occupancy_state === 'growing') {
      return {
        label: formatPaddockWorkTypeText(paddock.latest_work_type || paddock.latest_work_type_label),
        tone: 'orange',
      };
    }

    if (paddock?.occupancy_state === 'occupied') {
      return {
        label: paddock.latest_work_type
          ? formatPaddockWorkTypeText(paddock.latest_work_type || paddock.latest_work_type_label)
          : 'En uso',
        tone: 'green',
      };
    }

    if (paddock?.active === false) {
      return {
        label: 'Inactivo',
        tone: 'blue',
      };
    }

    return {
      label: paddock?.latest_work_type
        ? formatPaddockWorkTypeText(paddock.latest_work_type || paddock.latest_work_type_label)
        : 'Listo',
      tone: 'blue',
    };
  }

  function buildRealHomeMetrics(state) {
    const horseDashboard = getRealHorseDashboard(state);
    const paddockDashboard = getRealPaddockDashboard(state);
    const stockDashboard = getRealStockDashboard(state);
    const horses = Array.isArray(horseDashboard?.horses) ? horseDashboard.horses : [];
    const paddocks = Array.isArray(paddockDashboard?.paddocks) ? paddockDashboard.paddocks : [];
    const lowStockItems = stockDashboard ? getRealLowStockItems(state) : [];
    const careAgenda = buildRealHorseCareAgenda(state).filter((entry) => entry.overdue || entry.soon);
    const careOverdueCount = careAgenda.filter((entry) => entry.overdue).length;
    const occupiedCount = paddocks.filter((paddock) => paddock.occupancy_state === 'occupied').length;
    const preparingCount = paddocks.filter((paddock) => paddock.occupancy_state === 'growing').length;
    const groupedCount = horses.filter((horse) => horse.current_group?.name).length;

    return [
      {
        label: 'Caballos',
        value: horseDashboard ? String(horses.length) : '--',
        detail: horseDashboard
          ? `${groupedCount} en grupos · ${Math.max(0, horses.length - groupedCount)} individuales.`
          : 'Lectura de caballos no disponible.',
        tone: 'blue',
        icon: 'horses',
      },
      {
        label: 'Potreros',
        value: paddockDashboard ? String(paddocks.length) : '--',
        detail: paddockDashboard
          ? `${occupiedCount} ocupados · ${preparingCount} en preparación.`
          : 'Lectura de potreros no disponible.',
        tone: !paddockDashboard ? 'blue' : preparingCount > 0 ? 'orange' : 'green',
        icon: 'paddocks',
      },
      {
        label: 'Stock Bajo',
        value: stockDashboard ? String(lowStockItems.length) : '--',
        detail: !stockDashboard
          ? 'Lectura de stock no disponible.'
          : lowStockItems.length
            ? 'Productos por debajo del mínimo.'
            : 'Inventario estable en esta lectura.',
        tone: !stockDashboard ? 'blue' : lowStockItems.length ? 'critical' : 'green',
        icon: 'stock',
      },
      {
        label: 'Alertas Salud',
        value: horseDashboard ? String(careAgenda.length) : '--',
        detail: !horseDashboard
          ? 'Lectura veterinaria no disponible.'
          : careOverdueCount > 0
            ? `${careOverdueCount} cuidado(s) vencido(s).`
            : careAgenda.length > 0
              ? `${careAgenda.length} próximo(s) a vencer.`
              : 'Sin cuidados inmediatos.',
        tone: !horseDashboard ? 'blue' : careAgenda.length ? 'orange' : 'teal',
        icon: 'circleAlert',
      },
    ];
  }

  function buildRealHomeNotices(state) {
    const horseDashboard = getRealHorseDashboard(state);
    const paddockDashboard = getRealPaddockDashboard(state);
    const stockDashboard = getRealStockDashboard(state);
    const notices = [];
    const lowStockItems = stockDashboard ? getRealLowStockItems(state) : [];
    const careAgenda = buildRealHorseCareAgenda(state).filter((entry) => entry.overdue || entry.soon);
    const paddocksPreparing = (paddockDashboard?.paddocks || []).filter(
      (paddock) => paddock.occupancy_state === 'growing'
    );

    if (lowStockItems.length) {
      const primaryItem = lowStockItems[0];
      notices.push({
        tone: 'critical',
        title: `Stock bajo - ${lowStockItems.length} producto(s)`,
        description: 'Lectura real del inventario para priorizar compras y reposición.',
        focus: primaryItem.name,
        focusDetail: `${primaryItem.current_stock} ${primaryItem.unit} disponibles · mínimo ${primaryItem.minimum_stock} ${primaryItem.unit}.`,
        rows: lowStockItems
          .slice(0, 4)
          .map(
            (item) =>
              `${item.name}: ${item.current_stock} ${item.unit} · mínimo ${item.minimum_stock} ${item.unit}`
          ),
      });
    }

    if (careAgenda.length) {
      const primaryEntry = careAgenda[0];
      notices.push({
        tone: careAgenda.some((entry) => entry.overdue) ? 'critical' : 'warning',
        title: `Cuidados por atender - ${careAgenda.length}`,
        description:
          'Próximos cuidados veterinarios y de herraje detectados desde los registros reales.',
        focus: primaryEntry.horseName,
        focusDetail: `${primaryEntry.type} ${primaryEntry.overdue ? 'vencido' : 'programado'} para ${formatDateLabel(primaryEntry.dueDate)}.`,
        rows: careAgenda
          .slice(0, 4)
          .map(
            (entry) =>
              `${entry.horseName}: ${entry.type} ${entry.overdue ? `vencido el ${formatDateLabel(entry.dueDate)}` : `programado el ${formatDateLabel(entry.dueDate)}`}`
          ),
      });
    }

    if (paddocksPreparing.length) {
      const primaryPaddock = paddocksPreparing[0];
      notices.push({
        tone: 'warning',
        title: `Potreros en preparación - ${paddocksPreparing.length}`,
        description:
          'Bloques con espera activa antes de volver a pastoreo según el historial operativo real.',
        focus: primaryPaddock.name,
        focusDetail: primaryPaddock.ready_to_graze_on
          ? `Listo desde ${formatDateLabel(primaryPaddock.ready_to_graze_on)}.`
          : 'Todavía sin fecha de habilitación cargada.',
        rows: paddocksPreparing
          .slice(0, 4)
          .map((paddock) =>
            paddock.ready_to_graze_on
              ? `${paddock.name}: listo desde ${formatDateLabel(paddock.ready_to_graze_on)}`
              : `${paddock.name}: esperando habilitación de pastoreo`
          ),
      });
    }

    if (!notices.length) {
      const missingModules = [
        horseDashboard ? null : 'caballos',
        paddockDashboard ? null : 'potreros',
        stockDashboard ? null : 'stock',
      ].filter(Boolean);

      if (missingModules.length) {
        notices.push({
          tone: 'warning',
          title: 'Resumen parcial del inicio',
          description: `Esta lectura no pudo cargar ${missingModules.join(', ')} en este momento.`,
          rows: [
            'Mostramos los datos reales disponibles sin mezclar con valores inventados.',
            'Probá refrescar la vista para completar el tablero.',
          ],
        });
      } else {
      notices.push({
        tone: 'green',
        title: 'Sin alertas urgentes en esta lectura real.',
        description:
          'Caballos, potreros y stock no muestran pendientes críticos al cargar este resumen.',
        rows: [
          'Podés usar las acciones rápidas para registrar movimientos o nuevos trabajos.',
          'Seguimos mostrando el estado general del campo desde Neon.',
        ],
      });
      }
    }

    return notices.slice(0, 3);
  }

  function buildRealHomePaddockRows(state) {
    const paddocks = Array.isArray(getRealPaddockDashboard(state)?.paddocks)
      ? getRealPaddockDashboard(state).paddocks
      : [];
    const severityOrder = {
      growing: 0,
      occupied: 1,
      resting: 2,
      ready: 3,
      inactive: 4,
    };

    return paddocks
      .slice()
      .sort((left, right) => {
        const leftRank = severityOrder[String(left.occupancy_state || 'ready')] ?? 99;
        const rightRank = severityOrder[String(right.occupancy_state || 'ready')] ?? 99;
        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }

        return (
          getIsoSortValue(right.latest_work_date || right.ready_to_graze_on) -
          getIsoSortValue(left.latest_work_date || left.ready_to_graze_on)
        );
      })
      .slice(0, 5)
      .map((paddock) => {
        const stateMeta = getPaddockStateMeta(paddock);
        const conditionMeta = getHomePaddockConditionMeta(paddock);

        return {
          name: paddock.name,
          status: stateMeta.label,
          statusTone:
            stateMeta.tone === 'critical'
              ? 'orange'
              : stateMeta.tone === 'teal'
                ? 'green'
                : stateMeta.tone === 'gray'
                  ? 'blue'
                  : stateMeta.tone,
          detail: `${formatPaddockAreaLabel(paddock.size_ha)} · ${stateMeta.detail}`,
          condition: conditionMeta.label,
          conditionTone: conditionMeta.tone,
        };
      });
  }

  function buildRealHomeTasks(state) {
    const today = todayDateString();
    const taskLimit = shiftIsoDateString(today, REAL_HOME_TASK_WINDOW_DAYS) || today;
    const careAgenda = buildRealHorseCareAgenda(state)
      .filter((entry) => entry.dueDate <= taskLimit)
      .map((entry) => ({
        sortAt: entry.dueDate,
        title: `${entry.horseName} · ${entry.type}`,
        date: entry.overdue
          ? `Vencido desde ${formatDateLabel(entry.dueDate)}`
          : `Programado ${formatDateLabel(entry.dueDate)}`,
        tone: entry.overdue ? 'critical' : entry.soon ? 'warning' : 'green',
      }));

    const paddockTasks = (getRealPaddockDashboard(state)?.paddocks || [])
      .filter(
        (paddock) =>
          paddock.ready_to_graze_on &&
          paddock.ready_to_graze_on >= today &&
          paddock.ready_to_graze_on <= taskLimit
      )
      .map((paddock) => ({
        sortAt: paddock.ready_to_graze_on,
        title: `${paddock.name} listo para pastoreo`,
        date: `Desde ${formatDateLabel(paddock.ready_to_graze_on)}`,
        tone: 'green',
      }));

    return [...careAgenda, ...paddockTasks]
      .sort((left, right) => getIsoSortValue(left.sortAt) - getIsoSortValue(right.sortAt))
      .slice(0, 6);
  }

  function buildRealHomeActivity(state) {
    const activities = [];
    const stockItems = getRealStockItems(state);
    const latestStockDate = stockItems
      .map((item) => item.last_movement_date)
      .filter(Boolean)
      .sort()
      .pop();

    if (latestStockDate) {
      activities.push({
        sortAt: latestStockDate,
        icon: 'stock',
        title: 'Movimiento de stock registrado',
        time: formatDateLabel(latestStockDate),
      });
    }

    (getRealPaddockDashboard(state)?.paddocks || []).forEach((paddock) => {
      if (!paddock.latest_work_date) {
        return;
      }

      activities.push({
        sortAt: paddock.latest_work_date,
        icon: 'work',
        title: `${paddock.name} · ${formatPaddockWorkTypeText(paddock.latest_work_type || paddock.latest_work_type_label)}`,
        time: formatDateLabel(paddock.latest_work_date),
      });
    });

    return activities
      .sort((left, right) => getIsoSortValue(right.sortAt) - getIsoSortValue(left.sortAt))
      .slice(0, 5);
  }

  function normalizeCalendarMonthValue(value) {
    const normalized = String(value || '').trim();
    if (!/^\d{4}-\d{2}$/.test(normalized)) {
      return todayDateString().slice(0, 7);
    }

    return normalized;
  }

  function getCalendarMonthDateByOffset(offset) {
    const baseDate = new Date();
    return new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + Number(offset || 0), 1));
  }

  function getCalendarMonthKeyFromOffset(offset) {
    return getCalendarMonthDateByOffset(offset).toISOString().slice(0, 7);
  }

  function getCalendarMonthRange(monthKey) {
    const normalizedMonth = normalizeCalendarMonthValue(monthKey);
    const [year, month] = normalizedMonth.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    return {
      month: normalizedMonth,
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      start_date_object: startDate,
      end_date_object: endDate,
      day_count: endDate.getUTCDate(),
    };
  }

  function buildCalendarEventsUrl(monthKey) {
    const normalizedMonth = normalizeCalendarMonthValue(monthKey);
    return `${CALENDAR_EVENTS_API_URL}?month=${encodeURIComponent(normalizedMonth)}`;
  }

  function getRealCalendarMonthState(state, monthKey) {
    const normalizedMonth = normalizeCalendarMonthValue(monthKey);
    return state?.calendarEventsByMonth?.[normalizedMonth] || null;
  }

  function getRealCalendarEvents(state, monthKey) {
    const monthState = getRealCalendarMonthState(state, monthKey);
    return Array.isArray(monthState?.data?.events) ? monthState.data.events : [];
  }

  function formatCalendarDayLabel(dateString) {
    if (!dateString) {
      return 'Sin fecha';
    }

    const parsed = new Date(`${dateString}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
      return String(dateString);
    }

    return new Intl.DateTimeFormat('es-UY', {
      day: 'numeric',
      month: 'short',
    }).format(parsed);
  }

  function formatCalendarPriorityLabel(priorityTone, completed) {
    if (completed) {
      return 'Completa';
    }

    if (priorityTone === 'critical') {
      return 'Alta';
    }

    if (priorityTone === 'warning') {
      return 'Media';
    }

    return 'Baja';
  }

  function getCalendarAgendaTone(priorityTone) {
    if (priorityTone === 'critical') {
      return 'critical';
    }

    if (priorityTone === 'green' || priorityTone === 'teal' || priorityTone === 'blue') {
      return 'green';
    }

    return 'warning';
  }

  function getCalendarCategoryMeta(category) {
    switch (String(category || '').trim().toLowerCase()) {
      case 'grazing':
      case 'group':
        return {
          tag: 'Movimiento',
          icon: 'owners',
          navKey: 'horses',
          tone: 'critical',
        };
      case 'deworming':
      case 'farrier':
      case 'health':
      case 'treatment':
      case 'dose':
        return {
          tag: 'Salud',
          icon: 'health',
          navKey: 'horses',
          tone: 'warning',
        };
      case 'paddock':
        return {
          tag: 'Trabajo',
          icon: 'work',
          navKey: 'paddocks',
          tone: 'warning',
        };
      case 'rain':
      case 'frost':
        return {
          tag: 'Clima',
          icon: category === 'frost' ? 'snow' : 'rain',
          navKey: 'records',
          tone: 'green',
        };
      case 'feed':
      case 'stock':
        return {
          tag: 'Stock',
          icon: 'stock',
          navKey: 'stock',
          tone: 'green',
        };
      default:
        return {
          tag: 'Registro',
          icon: 'records',
          navKey: 'records',
          tone: 'green',
        };
    }
  }

  function buildRealCalendarCompletedTasks(state, monthKey) {
    return getRealCalendarEvents(state, monthKey).map((event) => {
      const meta = getCalendarCategoryMeta(event.category);
      const detailLine = [event.subtitle, event.detail].filter(Boolean).join(' · ');
      const extraLines = [event.meta, event.notes].filter(Boolean).join(' · ');

      return {
        key: `event-${event.key}`,
        source: 'event',
        completed: true,
        title: event.title || 'Actividad registrada',
        detail: detailLine || 'Evento registrado en la base.',
        description: extraLines || detailLine || 'Evento registrado en la base.',
        notes: event.notes || '',
        tag: meta.tag,
        icon: meta.icon,
        navKey: meta.navKey,
        dateIso: event.event_date,
        dateLabel: formatCalendarDayLabel(event.event_date),
        priorityTone: 'green',
        priority: 'Completa',
        agendaTone: meta.tone,
        metaLine: event.meta || '',
        sortAt: event.event_date,
      };
    });
  }

  function buildRealCalendarPendingTasks(state, monthKey) {
    const monthRange = getCalendarMonthRange(monthKey);
    const isCurrentMonth = monthRange.month === todayDateString().slice(0, 7);
    const today = todayDateString();
    const pendingTasks = [];
    const horses = Array.isArray(getRealHorseDashboard(state)?.horses)
      ? getRealHorseDashboard(state).horses
      : [];
    const paddocks = Array.isArray(getRealPaddockDashboard(state)?.paddocks)
      ? getRealPaddockDashboard(state).paddocks
      : [];

    horses.forEach((horse) => {
      [
        { type: 'Desparasitación', dueDate: horse?.care?.deworming?.next_due_date || null },
        { type: 'Herraje', dueDate: horse?.care?.farrier?.next_due_date || null },
      ].forEach((careItem) => {
        if (!careItem.dueDate) {
          return;
        }

        const shouldInclude =
          (careItem.dueDate >= monthRange.start_date && careItem.dueDate <= monthRange.end_date) ||
          (isCurrentMonth && careItem.dueDate < monthRange.start_date);

        if (!shouldInclude) {
          return;
        }

        const overdue = careItem.dueDate < today;
        const near = !overdue && careItem.dueDate <= shiftIsoDateString(today, 7);
        const priorityTone = overdue ? 'critical' : near ? 'warning' : 'green';

        pendingTasks.push({
          key: `pending-care-${horse.id}-${careItem.type}-${careItem.dueDate}`,
          source: 'pending-care',
          completed: false,
          title: `${careItem.type} ${horse.name}`,
          detail: horse.current_location?.paddock_name || horse.current_group?.name || 'Sin ubicación activa',
          description: overdue
            ? `${careItem.type} vencido desde ${formatDateLabel(careItem.dueDate)}.`
            : `${careItem.type} programado para ${formatDateLabel(careItem.dueDate)}.`,
          notes: '',
          tag: 'Salud',
          icon: 'health',
          navKey: 'horses',
          dateIso: careItem.dueDate,
          dateLabel: formatCalendarDayLabel(careItem.dueDate),
          priorityTone,
          priority: formatCalendarPriorityLabel(priorityTone, false),
          agendaTone: getCalendarAgendaTone(priorityTone),
          metaLine: getHorseProfileSummary(horse),
          sortAt: careItem.dueDate,
        });
      });
    });

    paddocks.forEach((paddock) => {
      const readyDate = paddock?.ready_to_graze_on || null;
      if (!readyDate) {
        return;
      }

      const shouldInclude =
        (readyDate >= monthRange.start_date && readyDate <= monthRange.end_date) ||
        (isCurrentMonth && readyDate < monthRange.start_date && paddock.occupancy_state === 'growing');

      if (!shouldInclude) {
        return;
      }

      const overdue = readyDate < today && paddock.occupancy_state === 'growing';
      const near = !overdue && readyDate <= shiftIsoDateString(today, 7);
      const priorityTone = overdue ? 'critical' : near ? 'warning' : 'green';

      pendingTasks.push({
        key: `pending-paddock-${paddock.id}-${readyDate}`,
        source: 'pending-paddock',
        completed: false,
        title: `${paddock.name} listo para pastoreo`,
        detail: paddock.latest_work_type
          ? formatPaddockWorkTypeText(paddock.latest_work_type || paddock.latest_work_type_label)
          : 'Seguimiento del potrero',
        description: overdue
          ? `El potrero ya debía quedar habilitado desde ${formatDateLabel(readyDate)}.`
          : `Disponibilidad prevista para ${formatDateLabel(readyDate)}.`,
        notes: paddock.latest_work_notes || '',
        tag: 'Trabajo',
        icon: 'work',
        navKey: 'paddocks',
        dateIso: readyDate,
        dateLabel: formatCalendarDayLabel(readyDate),
        priorityTone,
        priority: formatCalendarPriorityLabel(priorityTone, false),
        agendaTone: getCalendarAgendaTone(priorityTone),
        metaLine: formatPaddockAreaLabel(paddock.size_ha),
        sortAt: readyDate,
      });
    });

    return pendingTasks.sort((left, right) => {
      const byDate = getIsoSortValue(left.sortAt) - getIsoSortValue(right.sortAt);
      if (byDate !== 0) {
        return byDate;
      }

      return String(left.title || '').localeCompare(String(right.title || ''), 'es');
    });
  }

  function buildRealCalendarData(state) {
    const monthKey = getCalendarMonthKeyFromOffset(state?.calendarMonthOffset || 0);
    const monthState = getRealCalendarMonthState(state, monthKey);
    const monthRange = getCalendarMonthRange(monthKey);
    const pendingTasks = buildRealCalendarPendingTasks(state, monthKey);
    const completedTasks = buildRealCalendarCompletedTasks(state, monthKey);
    const allTasks = [...pendingTasks, ...completedTasks].sort((left, right) => {
      if (left.completed !== right.completed) {
        return left.completed ? 1 : -1;
      }

      return getIsoSortValue(left.sortAt || left.dateIso) - getIsoSortValue(right.sortAt || right.dateIso);
    });
    const urgentCount = pendingTasks.filter((task) => task.priorityTone === 'critical').length;
    const healthCount = pendingTasks.filter((task) => task.tag === 'Salud').length;
    const workCount = pendingTasks.filter((task) => task.tag === 'Trabajo').length;
    const fallbackSelectedDate = allTasks[0]?.dateIso || monthRange.start_date;
    const selectedDate =
      state?.calendarSelectedDate && String(state.calendarSelectedDate).slice(0, 7) === monthKey
        ? state.calendarSelectedDate
        : monthState?.data?.today?.slice(0, 7) === monthKey
          ? monthState.data.today
          : fallbackSelectedDate;
    const selectedDateTasks = allTasks.filter((task) => task.dateIso === selectedDate);

    return {
      monthKey,
      monthRange,
      monthState,
      pendingTasks,
      completedTasks,
      allTasks,
      urgentCount,
      healthCount,
      workCount,
      selectedDate,
      selectedDateTasks,
    };
  }

  function getRealCalendarSubtitle(state) {
    const calendarData = buildRealCalendarData(state);
    return calendarData.urgentCount > 0
      ? `${calendarData.urgentCount} tareas urgentes pendientes`
      : 'Sin tareas urgentes pendientes';
  }

  function buildCalendarGridCells(calendarData) {
    const { monthRange, allTasks, selectedDate } = calendarData;
    const eventCountsByDay = allTasks.reduce((accumulator, task) => {
      if (!task.dateIso) {
        return accumulator;
      }

      accumulator[task.dateIso] = (accumulator[task.dateIso] || 0) + 1;
      return accumulator;
    }, {});
    const firstWeekday = monthRange.start_date_object.getUTCDay();
    const previousMonthDate = new Date(Date.UTC(
      monthRange.start_date_object.getUTCFullYear(),
      monthRange.start_date_object.getUTCMonth(),
      0
    ));
    const previousMonthDayCount = previousMonthDate.getUTCDate();
    const cells = [];

    for (let index = firstWeekday - 1; index >= 0; index -= 1) {
      cells.push({
        key: `prev-${index}`,
        label: String(previousMonthDayCount - index),
        inMonth: false,
      });
    }

    for (let day = 1; day <= monthRange.day_count; day += 1) {
      const dateIso = `${monthRange.month}-${String(day).padStart(2, '0')}`;
      const count = eventCountsByDay[dateIso] || 0;
      cells.push({
        key: dateIso,
        label: String(day),
        dateIso,
        inMonth: true,
        isSelected: dateIso === selectedDate,
        isToday: dateIso === todayDateString(),
        hasItems: count > 0,
        count,
      });
    }

    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - (firstWeekday + monthRange.day_count) + 1;
      cells.push({
        key: `next-${nextDay}`,
        label: String(nextDay),
        inMonth: false,
      });
    }

    return cells;
  }

  function getHorseStatusBadge(horse) {
    const status = horse && horse.status ? horse.status : null;
    if (!status) {
      return renderBadge('Perfil base', 'gray');
    }

    return renderBadge(status.label || 'Perfil base', status.tone || 'gray');
  }

  function formatHorseCareLine(careItem, prefix) {
    if (!(careItem && careItem.next_due_date)) {
      return `${prefix}: sin fecha`;
    }

    return `${prefix}: ${formatDateLabel(careItem.next_due_date)}`;
  }

  function getHorseNextCareDate(horse) {
    const dates = [horse?.care?.deworming?.next_due_date, horse?.care?.farrier?.next_due_date]
      .filter(Boolean)
      .sort();

    return dates.length ? dates[0] : null;
  }

  function formatHorseCountLabel(count) {
    const safeCount = Math.max(0, Number(count) || 0);
    return `${safeCount} caballo${safeCount === 1 ? '' : 's'}`;
  }

  function getHorseCardSubtitle(horse) {
    const parts = [formatHorseAgeLabel(horse.age_years)];
    const profileBits = [
      formatValueLabel(horse.activity || '', HORSE_ACTIVITY_OPTIONS),
      formatValueLabel(horse.sex || '', HORSE_SEX_OPTIONS),
    ].filter((item) => item && item !== 'Sin definir');

    if (profileBits.length) {
      parts.push(profileBits.join(' · '));
    }

    return parts.join(' · ');
  }

  function getHorseProfileSummary(horse) {
    return [
      formatValueLabel(horse.sex || '', HORSE_SEX_OPTIONS),
      formatValueLabel(horse.color || '', HORSE_COLOR_OPTIONS),
      formatValueLabel(horse.activity || '', HORSE_ACTIVITY_OPTIONS),
    ]
      .filter((item) => item && item !== 'Sin definir')
      .join(' · ') || 'Perfil básico';
  }

  function getHorseCardBadge(horse) {
    if (horse?.current_group?.name) {
      return renderBadge(horse.current_group.name, 'blue');
    }

    return renderBadge('Individual', 'gray');
  }

  function getHorseCareNote(horse) {
    const today = new Date().toISOString().slice(0, 10);
    const upcomingLimitDate = new Date();
    upcomingLimitDate.setDate(upcomingLimitDate.getDate() + 5);
    const upcomingLimit = upcomingLimitDate.toISOString().slice(0, 10);

    const checks = [
      { label: 'Desparasitación', next_due_date: horse?.care?.deworming?.next_due_date },
      { label: 'Herraje', next_due_date: horse?.care?.farrier?.next_due_date },
    ].filter((item) => item.next_due_date);

    const overdue = checks.find((item) => item.next_due_date < today);
    if (overdue) {
      return { label: `${overdue.label} atrasado`, tone: 'critical' };
    }

    const upcoming = checks.find(
      (item) => item.next_due_date >= today && item.next_due_date <= upcomingLimit
    );
    if (upcoming) {
      return { label: `${upcoming.label} próximo`, tone: 'warning' };
    }

    if (horse?.training_status) {
      return { label: formatHorseTrainingLabel(horse.training_status), tone: 'purple' };
    }

    return { label: 'Control OK', tone: 'blue' };
  }

  function getRealHorseFilterOptions(dashboard) {
    const groupNames = Array.from(
      new Set(
        (Array.isArray(dashboard?.horses) ? dashboard.horses : [])
          .map((horse) => horse.current_group?.name || '')
          .filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right, 'es'));

    return [
      { value: 'all', label: 'Todos' },
      ...groupNames.map((groupName) => ({ value: groupName, label: groupName })),
      { value: 'individual', label: 'Individuales' },
    ];
  }

  function getFilteredRealHorses(state, dashboard) {
    const horses = Array.isArray(dashboard?.horses) ? dashboard.horses : [];
    const query = String(state?.horseFilters?.query || '')
      .trim()
      .toLowerCase();
    const groupFilter = String(state?.horseFilters?.group || 'all');
    const careFilter = String(state?.horseFilters?.care || 'all');

    return horses.filter((horse) => {
      const searchableText = [
        horse.name,
        horse.current_group?.name || '',
        horse.current_location?.paddock_name || '',
        getHorseProfileSummary(horse),
        formatHorseTrainingLabel(horse.training_status || ''),
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = !query || searchableText.includes(query);
      const matchesGroup =
        groupFilter === 'all'
          ? true
          : groupFilter === 'individual'
            ? !horse.current_group?.name
            : horse.current_group?.name === groupFilter;
      const matchesCare = horseMatchesCareFilter(horse, careFilter);

      return matchesQuery && matchesGroup && matchesCare;
    });
  }

  function buildRealHorseGroups(dashboard) {
    const dashboardHorses = Array.isArray(dashboard?.horses) ? dashboard.horses : [];
    const horseById = new Map(
      dashboardHorses
        .filter((horse) => Number.isFinite(Number(horse.id)))
        .map((horse) => [Number(horse.id), horse])
    );
    const catalogGroups = Array.isArray(dashboard?.catalog?.groups) ? dashboard.catalog.groups : [];

    if (!catalogGroups.length) {
      const fallbackDashboard = {
        ...dashboard,
        catalog: null,
      };
      return buildRealHorseGroupsFromMemberships(fallbackDashboard);
    }

    return catalogGroups
      .map((group) => {
        const memberRows = Array.isArray(group.members)
          ? group.members
              .map((member) => {
                const realHorse = horseById.get(Number(member.id));
                if (realHorse) {
                  return realHorse;
                }

                return {
                  id: member.id,
                  name: member.name,
                  current_group: {
                    id: group.id,
                    name: group.name,
                  },
                  current_location: null,
                  status: null,
                };
              })
              .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'es'))
          : [];
        const firstLocation =
          Array.isArray(group.current_locations) && group.current_locations.length === 1
            ? group.current_locations[0]
            : null;
        const locationDays = firstLocation ? calculateInclusiveDays(firstLocation.entered_at) : null;

        return {
          id: group.id,
          name: group.name,
          notes: group.notes || null,
          count: Number(group.member_count || memberRows.length || 0),
          members: Array.isArray(group.member_names)
            ? group.member_names.slice().sort((left, right) => left.localeCompare(right, 'es'))
            : memberRows.map((horse) => horse.name),
          member_rows: memberRows,
          paddock_name:
            !Array.isArray(group.current_locations) || group.current_locations.length === 0
              ? 'Sin potrero asignado'
              : group.current_locations.length === 1
                ? group.current_locations[0].location_name || 'Sin potrero asignado'
                : 'Ubicaciones mixtas',
          location_detail:
            !Array.isArray(group.current_locations) || group.current_locations.length === 0
              ? group.member_count > 0
                ? 'Sin ubicación activa'
                : 'Esperando integrantes'
              : group.current_locations.length === 1
                ? locationDays
                  ? `${locationDays} día(s) en potrero`
                  : 'Ubicación activa'
                : `${group.current_locations.length} potreros activos`,
          alert_count: memberRows.filter((horse) => horse.status?.key === 'attention').length,
          current_group_days: calculateInclusiveDays(group.current_started_at),
          current_location_id: firstLocation?.location_id || null,
          current_location_state: group.location_state || null,
          unassigned_member_count: Number(group.unassigned_member_count || 0),
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name, 'es'));
  }

  function buildRealHorseGroupsFromMemberships(dashboard) {
    const groupMap = new Map();

    for (const horse of Array.isArray(dashboard?.horses) ? dashboard.horses : []) {
      const groupName = String(horse.current_group?.name || '').trim();
      if (!groupName) {
        continue;
      }

      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, {
          id: horse.current_group?.id || null,
          name: groupName,
          members: [],
        });
      }

      groupMap.get(groupName).members.push(horse);
    }

    return Array.from(groupMap.values())
      .map((group) => {
        const memberNames = group.members
          .map((horse) => horse.name)
          .sort((left, right) => left.localeCompare(right, 'es'));
        const uniqueLocations = Array.from(
          new Set(group.members.map((horse) => horse.current_location?.paddock_name || '').filter(Boolean))
        );
        const allSameLocation = uniqueLocations.length === 1;
        const referenceHorse = group.members[0] || null;
        const locationHorse =
          allSameLocation && referenceHorse
            ? group.members.find((horse) => horse.current_location?.paddock_name === uniqueLocations[0]) ||
              referenceHorse
            : null;

        return {
          id: group.id,
          name: group.name,
          count: group.members.length,
          members: memberNames,
          member_rows: group.members
            .slice()
            .sort((left, right) => left.name.localeCompare(right.name, 'es')),
          paddock_name:
            uniqueLocations.length === 0
              ? 'Sin potrero asignado'
              : allSameLocation
                ? uniqueLocations[0]
                : 'Ubicaciones mixtas',
          location_detail:
            uniqueLocations.length === 0
              ? 'Sin ubicación activa'
              : allSameLocation
                ? locationHorse?.current_location?.days
                  ? `${locationHorse.current_location.days} día(s) en potrero`
                  : 'Ubicación activa'
                : `${uniqueLocations.length} potreros activos`,
          alert_count: group.members.filter((horse) => horse.status?.key === 'attention').length,
          current_group_days: referenceHorse?.current_group?.days || null,
          current_location_id:
            allSameLocation && referenceHorse?.current_location?.paddock_id
              ? referenceHorse.current_location.paddock_id
              : null,
          current_location_state: uniqueLocations.length > 1 ? 'split' : 'cohesive',
          unassigned_member_count:
            uniqueLocations.length === 0 ? group.members.length : 0,
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name, 'es'));
  }

  function getRealHorseGroupByName(state, groupName) {
    return buildRealHorseGroups(getRealHorseDashboard(state)).find(
      (group) => group.name === groupName
    ) || null;
  }

  function getRealHorseGroupById(state, groupId) {
    return (
      buildRealHorseGroups(getRealHorseDashboard(state)).find(
        (group) => Number(group.id) === Number(groupId)
      ) || null
    );
  }

  function normalizeModalStringList(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || '')).filter(Boolean);
    }

    if (value == null || value === '') {
      return [];
    }

    return [String(value)];
  }

  function getGroupManageHorseKey(horse) {
    if (!horse) {
      return '';
    }

    if (horse.id != null && horse.id !== '') {
      return `horse-${horse.id}`;
    }

    return `horse-${String(horse.name || '').trim()}`;
  }

  function getDemoGroupManageSource(groupName) {
    const group = getGroupByName(groupName);
    if (!group) {
      return null;
    }

    return {
      mode: 'demo',
      name: group.name,
      paddock_name: group.paddock || 'Sin potrero asignado',
      location_detail: group.days || 'Sin ubicación activa',
      current_group_days: 14,
      alert_count: 0,
      base_members: (group.members || []).map((memberName) => getHorseByName(memberName)).filter(Boolean),
      all_horses: Array.isArray(DEMO_DATA.horses.horses) ? DEMO_DATA.horses.horses : [],
    };
  }

  function getGroupManageHorseSubline(horse, mode, variant) {
    if (!horse) {
      return '';
    }

    if (mode === 'demo') {
      if (variant === 'picker') {
        return [horse.owner || 'Sin propietario', horse.paddock || 'Sin potrero']
          .filter(Boolean)
          .join(' · ');
      }

      return horse.owner || 'Sin propietario cargado';
    }

    if (variant === 'picker') {
      return [getHorseProfileSummary(horse), horse.current_location?.paddock_name || 'Sin potrero']
        .filter(Boolean)
        .join(' · ');
    }

    return getHorseProfileSummary(horse);
  }

  function buildGroupManageModalState(state, payload) {
    const groupName = String(payload?.groupName || payload?.name || '').trim();
    const source = isRealSession(state)
      ? (() => {
          const group = getRealHorseGroupByName(state, groupName);
          const catalogGroup = group?.id ? getRealGroupCatalogById(state, group.id) : null;
          const dashboard = getRealHorseDashboard(state);
          if (!(group && dashboard)) {
            return null;
          }

          return {
            mode: 'real',
            id: group.id || null,
            name: group.name,
            notes: catalogGroup?.notes || '',
            paddock_name: group.paddock_name,
            location_detail: group.location_detail,
            current_group_days: group.current_group_days || 14,
            alert_count: group.alert_count || 0,
            current_location_id: group.current_location_id || null,
            location_state: group.current_location_state || null,
            unassigned_member_count: group.unassigned_member_count || 0,
            base_members: Array.isArray(group.member_rows) ? group.member_rows : [],
            all_horses: Array.isArray(dashboard.horses) ? dashboard.horses : [],
          };
        })()
      : getDemoGroupManageSource(groupName);

    if (!source) {
      return null;
    }

    const baseMemberKeys = new Set(
      (source.base_members || []).map((horse) => getGroupManageHorseKey(horse)).filter(Boolean)
    );
    const addedHorseKeys = new Set(normalizeModalStringList(payload?.addedHorseKeys));
    const removedHorseKeys = new Set(normalizeModalStringList(payload?.removedHorseKeys));
    const selectedHorseKeys = new Set(normalizeModalStringList(payload?.selectedHorseKeys));
    const allHorses = (source.all_horses || [])
      .slice()
      .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'es'));

    const extraMembers = allHorses.filter((horse) => {
      const horseKey = getGroupManageHorseKey(horse);
      return addedHorseKeys.has(horseKey) && !baseMemberKeys.has(horseKey);
    });

    const members = [...(source.base_members || []).filter((horse) => !removedHorseKeys.has(getGroupManageHorseKey(horse))), ...extraMembers]
      .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'es'));

    const activeMemberKeys = new Set(
      members.map((horse) => getGroupManageHorseKey(horse)).filter(Boolean)
    );
    const candidates = allHorses.filter((horse) => !activeMemberKeys.has(getGroupManageHorseKey(horse)));

    return {
      ...source,
      groupNameValue:
        payload?.groupNameDraft != null ? String(payload.groupNameDraft) : source.name,
      rotationDaysValue:
        payload?.rotationDaysDraft != null
          ? String(payload.rotationDaysDraft)
          : String(source.current_group_days || 14),
      base_member_keys: Array.from(baseMemberKeys),
      added_horse_keys: Array.from(addedHorseKeys),
      removed_horse_keys: Array.from(removedHorseKeys),
      selected_horse_key_set: selectedHorseKeys,
      group_picker_open: Boolean(payload?.groupPickerOpen),
      members,
      candidates,
      member_count: members.length,
    };
  }

  function renderGroupManageMemberRow(horse, modalState, options = {}) {
    const horseKey = getGroupManageHorseKey(horse);
    const isPicker = Boolean(options.picker);
    const isSelected = Boolean(options.selected);
    const isAdded = Boolean(options.added);
    const secondaryLine = getGroupManageHorseSubline(
      horse,
      modalState.mode,
      isPicker ? 'picker' : 'member'
    );
    const locationLine =
      modalState.mode === 'demo'
        ? horse.paddock || ''
        : horse.current_location?.paddock_name || '';

    if (isPicker) {
      return `
        <button
          type="button"
          class="group-manage-picker-item${isSelected ? ' is-selected' : ''}"
          ${renderActionAttributes({
            action: 'toggle-group-selection',
            meta: { horseKey },
          })}
        >
          <div class="group-manage-member-main">
            <div class="group-manage-member-avatar">${escapeHtml(getInitials(horse.name || ''))}</div>
            <div class="group-manage-member-copy">
              <strong>${escapeHtml(horse.name || 'Sin nombre')}</strong>
              <span>${escapeHtml(secondaryLine || 'Sin detalle')}</span>
            </div>
          </div>
          ${isSelected ? renderBadge('Seleccionado', 'blue') : ''}
        </button>
      `;
    }

    return `
      <article class="group-manage-member-row">
        <div class="group-manage-member-main">
          <div class="group-manage-member-avatar">${escapeHtml(getInitials(horse.name || ''))}</div>
          <div class="group-manage-member-copy">
            <div class="group-manage-member-title">
              <strong>${escapeHtml(horse.name || 'Sin nombre')}</strong>
              ${isAdded ? renderBadge('Nuevo', 'blue') : ''}
            </div>
            <span>${escapeHtml(secondaryLine || 'Sin detalle')}</span>
            ${locationLine ? `<small>${escapeHtml(locationLine)}</small>` : ''}
          </div>
        </div>
        <button
          type="button"
          class="table-icon-button table-icon-button--danger"
          ${renderActionAttributes({
            action: 'remove-group-horse',
            meta: { horseKey },
          })}
          aria-label="Quitar ${escapeHtml(horse.name || 'caballo')}"
        >
          ${renderIcon('trash')}
        </button>
      </article>
    `;
  }

  function renderGroupManageModal(state, payload) {
    const modalState = buildGroupManageModalState(state, payload);
    if (!modalState) {
      return '';
    }

    const selectedCandidateCount = modalState.candidates.filter((horse) =>
      modalState.selected_horse_key_set.has(getGroupManageHorseKey(horse))
    ).length;
    const addedHorseKeySet = new Set(modalState.added_horse_keys);

    return renderModalShell({
      size: 'group-manage',
      title: 'Gestionar Grupo',
      subtitle: 'Administra los caballos y configuración del grupo',
      content: `
        <form class="modal-form" data-modal-form data-modal-key="horse-group-manage">
          <input type="hidden" name="groupNameOriginal" value="${escapeHtml(modalState.name)}" />

          <div class="group-manage-shell">
            <section class="group-manage-summary">
              <div class="group-manage-summary-head">
                <div>
                  <strong>${escapeHtml(modalState.groupNameValue)}</strong>
                  <div class="group-manage-summary-meta">
                    <span>${renderIcon('pin')} ${escapeHtml(modalState.paddock_name || 'Sin potrero asignado')}</span>
                    <span>${renderIcon('calendar')} ${escapeHtml(modalState.location_detail || 'Sin ubicación activa')}</span>
                  </div>
                </div>
                ${renderBadge(`${modalState.member_count} caballos`, 'blue')}
              </div>
            </section>

            <section class="group-manage-section">
              <div class="group-manage-section-head">
                <strong>Caballos en el Grupo</strong>
                <button
                  type="button"
                  class="btn btn-secondary"
                  ${renderActionAttributes({
                    action: 'toggle-group-picker',
                  })}
                >
                  ${renderIcon('plus')}
                  <span>Agregar caballo</span>
                </button>
              </div>

              ${
                modalState.group_picker_open
                  ? `
                    <div class="group-manage-picker">
                      <p>Selecciona caballos para agregar al grupo:</p>
                      <div class="group-manage-picker-list">
                        ${
                          modalState.candidates.length
                            ? modalState.candidates
                                .map((horse) =>
                                  renderGroupManageMemberRow(horse, modalState, {
                                    picker: true,
                                    selected: modalState.selected_horse_key_set.has(
                                      getGroupManageHorseKey(horse)
                                    ),
                                  })
                                )
                                .join('')
                            : `
                              <div class="group-manage-empty">
                                <strong>No hay caballos disponibles para sumar.</strong>
                                <span>Todos los caballos visibles ya están asignados o quedan sin cambios pendientes.</span>
                              </div>
                            `
                        }
                      </div>
                      <div class="group-manage-picker-actions">
                        <button
                          type="button"
                          class="btn btn-secondary"
                          ${renderActionAttributes({
                            action: 'toggle-group-picker',
                          })}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          class="btn btn-blue"
                          ${renderActionAttributes({
                            action: 'add-group-horses',
                          })}
                          ${selectedCandidateCount ? '' : 'disabled'}
                        >
                          Agregar Seleccionados
                        </button>
                      </div>
                    </div>
                  `
                  : ''
              }

              <div class="group-manage-member-list">
                ${
                  modalState.members.length
                    ? modalState.members
                        .map((horse) =>
                          renderGroupManageMemberRow(horse, modalState, {
                            added: addedHorseKeySet.has(getGroupManageHorseKey(horse)),
                          })
                        )
                        .join('')
                    : `
                      <div class="group-manage-empty">
                        <strong>El grupo quedó sin integrantes en esta edición.</strong>
                        <span>Podés volver a sumar caballos antes de guardar los cambios.</span>
                      </div>
                    `
                }
              </div>
            </section>

            <section class="group-manage-section">
              <strong>Configuración del Grupo</strong>
              <div class="group-manage-config">
                <label class="field-block">
                  <span>Nombre del Grupo</span>
                  <input
                    type="text"
                    name="groupName"
                    value="${escapeHtml(modalState.groupNameValue)}"
                    data-group-config="groupNameDraft"
                  />
                </label>
                <label class="field-block">
                  <span>Días para Rotación</span>
                  <input
                    type="number"
                    name="rotationDays"
                    min="1"
                    step="1"
                    value="${escapeHtml(modalState.rotationDaysValue)}"
                    data-group-config="rotationDaysDraft"
                    disabled
                  />
                  <small>Queda visible como referencia hasta conectar la rotación real del grupo.</small>
                </label>
              </div>
            </section>
          </div>

          <div class="group-manage-footer">
            <button
              type="button"
              class="btn btn-danger"
              ${renderActionAttributes({
                action: 'delete-group',
                meta: { groupName: modalState.name },
              })}
            >
              ${renderIcon('trash')}
              <span>Eliminar Grupo</span>
            </button>
            <button type="button" class="btn btn-secondary" data-action="close-modal">Cancelar</button>
            <button type="submit" class="btn btn-primary">
              ${renderIcon('check')}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      `,
    });
  }

  function formatMonthYear(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return 'Sin mes';
    }

    return new Intl.DateTimeFormat('es-UY', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  function totalAlertCount(state) {
    return getVisibleAlerts(state).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  }

  function getActiveView(state, navKey) {
    const key = navKey || state.activeNav;
    return (state.views && state.views[key]) || DEFAULT_VIEWS[key] || '';
  }

  function renderIcon(iconKey) {
    const icons = {
      home:
        '<path d="M3.5 10.5 12 4l8.5 6.5v8A1.5 1.5 0 0 1 19 20H5A1.5 1.5 0 0 1 3.5 18.5Z" /><path d="M9 20v-6h6v6" />',
      paddocks:
        '<path d="M4 6.5 9 4l6 2.5 5-2.5v13L15 19.5 9 17 4 19.5Z" /><path d="M9 4v13" /><path d="M15 6.5v13" />',
      horses:
        '<path d="M7.5 10.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" /><path d="M2.5 18.5c0-2.8 2.4-5 5.2-5 1.4 0 2.6.4 3.6 1.2" /><path d="M16.5 11.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" /><path d="M13 18.5c.4-2.1 2.2-3.8 4.6-3.8S21.8 16.4 22 18.5" />',
      owners:
        '<path d="M12 10a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" /><path d="M4 19.5c0-3.4 3.3-6 8-6s8 2.6 8 6" />',
      stock:
        '<path d="M12 3.5 19.5 7 12 10.5 4.5 7Z" /><path d="M4.5 7v10L12 20.5 19.5 17V7" /><path d="M12 10.5v10" />',
      calendar:
        '<path d="M7 2.5v4" /><path d="M17 2.5v4" /><rect x="3.5" y="5.5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17" />',
      records:
        '<path d="M7 4.5h8l4 4v11A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5V6A1.5 1.5 0 0 1 6.5 4.5Z" /><path d="M15 4.5v4h4" /><path d="M8.5 12h7" /><path d="M8.5 16h5" />',
      settings:
        '<path d="m12 3 1.3 2.6 2.9.4-2.1 2.1.5 2.9-2.6-1.3-2.6 1.3.5-2.9L7.8 6l2.9-.4Z" /><circle cx="12" cy="12" r="3.5" /><path d="M4.5 13.5v-3l2.3-.8" /><path d="M19.5 10.5v3l-2.3.8" />',
      bell:
        '<path d="M6 9.5a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 18.5a2 2 0 0 0 4 0" />',
      menu: '<path d="M4 7.5h16" /><path d="M4 12h16" /><path d="M4 16.5h16" />',
      search: '<circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" />',
      plus: '<path d="M12 5v14" /><path d="M5 12h14" />',
      cart:
        '<circle cx="9" cy="19" r="1.4" /><circle cx="17" cy="19" r="1.4" /><path d="M3.5 4.5h2l2.1 9h9.8l2.1-6.5H7.1" />',
      arrow: '<path d="M5 12h14" /><path d="m13 6 6 6-6 6" />',
      chevronLeft: '<path d="m15 6-6 6 6 6" />',
      chevronRight: '<path d="m9 6 6 6-6 6" />',
      swap: '<path d="m7 7 3-3 3 3" /><path d="M10 4v12" /><path d="m17 17-3 3-3-3" /><path d="M14 20V8" />',
      edit: '<path d="m4 20 4.5-1 9-9-3.5-3.5-9 9Z" /><path d="m12.5 6 3.5 3.5" /><path d="M4 20h5" />',
      rain: '<path d="M12 4c2.8 3.3 5.5 6 5.5 9a5.5 5.5 0 0 1-11 0c0-3 2.7-5.7 5.5-9Z" /><path d="M9 16.5h6" />',
      snow: '<path d="M12 4v16" /><path d="m6.5 7 11 10" /><path d="m17.5 7-11 10" /><path d="M4 12h16" />',
      work:
        '<path d="M6 18.5h12" /><path d="m8.5 18.5 2-9h3l2 9" /><path d="M7.5 9.5h9" /><path d="m12 4.5 1.5 2" /><path d="m12 4.5-1.5 2" />',
      circleAlert: '<circle cx="12" cy="12" r="8" /><path d="M12 8v4" /><circle cx="12" cy="16.5" r=".5" fill="currentColor" stroke="none" />',
      seed: '<path d="M7 13c0-4 2.5-6.5 7.5-7.5 1 5-1.5 7.5-5.5 7.5H7Z" /><path d="M8 14.5c0 3.5 1.8 5.5 5 6.5" /><path d="M12 12c-1.2 2-1.6 4.4-1.2 8" />',
      singleHorse: '<circle cx="12" cy="7.5" r="3.2" /><path d="M6.5 19c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" />',
      money: '<path d="M12 3.5v17" /><path d="M16 7.5c0-1.6-1.8-3-4-3s-4 1.4-4 3 1.8 3 4 3 4 1.4 4 3-1.8 3-4 3-4-1.4-4-3" />',
      trendUp: '<path d="m5 16 5-5 3 3 6-6" /><path d="M15 8h4v4" />',
      trendDown: '<path d="m5 8 5 5 3-3 6 6" /><path d="M15 16h4v-4" />',
      leaf: '<path d="M7 7.5c3.5-2 7.5-1.5 10 .5-2 5-5.5 7.5-10 7.5-1.5-3.5-1-6 .5-8Z" /><path d="M7.5 15.5c2-2.5 4.8-4.4 8.5-6" />',
      flask: '<path d="M10 4v5l-4.5 7.8A2 2 0 0 0 7.2 20h9.6a2 2 0 0 0 1.7-3.2L14 9V4" /><path d="M9 13h6" />',
      fire: '<path d="M12 4c2 2.4 3 4.1 3 6.1 0 .8-.2 1.6-.5 2.4 1.3-.7 2.2-2 2.6-3.8 1.8 2 2.4 3.7 2.4 5.6A7.5 7.5 0 1 1 8 8.5c.5-1.7 1.8-3.2 4-4.5Z" />',
      filter: '<path d="M4.5 6.5h15l-6 6v5l-3 1v-6Z" />',
      download: '<path d="M12 4v10" /><path d="m8 10 4 4 4-4" /><path d="M5 19.5h14" />',
      check: '<circle cx="12" cy="12" r="8" /><path d="m8.5 12.5 2.2 2.2 4.8-5.2" />',
      clock: '<circle cx="12" cy="12" r="8" /><path d="M12 7.5v5l3 1.5" />',
      pin: '<path d="M12 20c4-4.8 6-8 6-10.5a6 6 0 1 0-12 0C6 12 8 15.2 12 20Z" /><circle cx="12" cy="9.5" r="2" />',
      pulse: '<path d="M4 12h3l2-4 3 8 2-4h6" />',
      health:
        '<path d="m4.5 14 4-4 3 3 7-7" /><path d="M13 6h5v5" /><path d="M6 19h12" />',
      telegram: '<path d="m20 5-17 6.5 5.5 2.1L18 8l-7 6 2 5 2.2-4.3L20 5Z" />',
      copy: '<rect x="9" y="9" width="10" height="10" rx="2" /><rect x="5" y="5" width="10" height="10" rx="2" />',
      trash: '<path d="M5.5 7.5h13" /><path d="M9 4.5h6" /><path d="M8.5 7.5v11a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-11" /><path d="M10.5 11v5" /><path d="M13.5 11v5" />',
      close: '<path d="m6 6 12 12" /><path d="m18 6-12 12" />',
      mail: '<rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="m4.5 7 7.5 6 7.5-6" />',
      phone: '<path d="M7 5.5c-.8 0-1.5.7-1.5 1.5 0 6.3 5.2 11.5 11.5 11.5.8 0 1.5-.7 1.5-1.5V15l-3.5-1.2-1.7 1.7c-2-.9-3.8-2.7-4.7-4.7l1.7-1.7L9 5.5Z" />',
      shield: '<path d="M12 3.5 18.5 6v5.5c0 4-2.6 6.8-6.5 9-3.9-2.2-6.5-5-6.5-9V6Z" />',
      cloud: '<path d="M7 18h9a4 4 0 0 0 .6-8A5.5 5.5 0 0 0 6 8.5 3.8 3.8 0 0 0 7 18Z" />',
    };

    return `
      <svg viewBox="0 0 24 24" class="app-icon" aria-hidden="true">
        ${icons[iconKey] || icons.circleAlert}
      </svg>
    `;
  }

  function renderBadge(label, tone) {
    return `<span class="badge badge--${escapeHtml(tone || 'gray')}">${escapeHtml(label)}</span>`;
  }

  function renderActionAttributes(trigger) {
    if (!trigger) {
      return '';
    }

    const attrs = [];

    if (trigger.action) {
      attrs.push(`data-action="${escapeHtml(trigger.action)}"`);
    }

    if (trigger.value != null) {
      attrs.push(`data-value="${escapeHtml(trigger.value)}"`);
    }

    if (trigger.message != null) {
      attrs.push(`data-message="${escapeHtml(trigger.message)}"`);
    }

    if (trigger.navKey) {
      attrs.push(`data-nav-key="${escapeHtml(trigger.navKey)}"`);
    }

    if (trigger.viewNav && trigger.viewKey) {
      attrs.push(`data-view-nav="${escapeHtml(trigger.viewNav)}"`);
      attrs.push(`data-view-key="${escapeHtml(trigger.viewKey)}"`);
    }

    Object.entries(trigger.meta || {}).forEach(([key, value]) => {
      if (value == null) {
        return;
      }

      const attrKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      attrs.push(`data-${attrKey}="${escapeHtml(value)}"`);
    });

    return attrs.length ? ` ${attrs.join(' ')}` : '';
  }

  function renderModalField(field) {
    const label = `<span>${escapeHtml(field.label)}</span>`;
    const hint = field.hint ? `<small>${escapeHtml(field.hint)}</small>` : '';
    const value = field.value ?? '';
    const readonly = field.readonly ? ' readonly' : '';
    const disabled = field.disabled ? ' disabled' : '';
    const required = field.required ? ' required' : '';

    let control = '';

    if (field.type === 'select') {
      control = `
        <select name="${escapeHtml(field.name)}"${disabled}${required}>
          ${(field.options || [])
            .map((option) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              const selected = optionValue === value ? ' selected' : '';
              return `<option value="${escapeHtml(optionValue)}"${selected}>${escapeHtml(optionLabel)}</option>`;
            })
            .join('')}
        </select>
      `;
    } else if (field.type === 'textarea') {
      control = `
        <textarea name="${escapeHtml(field.name)}" rows="${escapeHtml(field.rows || 3)}" placeholder="${escapeHtml(field.placeholder || '')}"${readonly}${required}>${escapeHtml(value)}</textarea>
      `;
    } else {
      control = `
        <input
          name="${escapeHtml(field.name)}"
          type="${escapeHtml(field.type || 'text')}"
          value="${escapeHtml(value)}"
          placeholder="${escapeHtml(field.placeholder || '')}"
          ${field.min != null ? `min="${escapeHtml(field.min)}"` : ''}
          ${field.max != null ? `max="${escapeHtml(field.max)}"` : ''}
          ${field.step != null ? `step="${escapeHtml(field.step)}"` : ''}
          ${readonly}${disabled}${required}
        />
      `;
    }

    return `
      <label class="modal-field${field.layout === 'wide' ? ' modal-field--wide' : ''}">
        ${label}
        ${control}
        ${hint}
      </label>
    `;
  }

  function renderModalFooter(buttons) {
    return `
      <div class="modal-footer">
        ${buttons
          .map((button) => {
            const icon = button.icon ? renderIcon(button.icon) : '';
            if (button.submit) {
              return `
                <button type="submit" class="btn btn-${escapeHtml(button.tone || 'primary')}">
                  ${icon}
                  <span>${escapeHtml(button.label)}</span>
                </button>
              `;
            }

            return `
              <button
                type="button"
                class="btn btn-${escapeHtml(button.tone || 'secondary')}"
                ${renderActionAttributes(button.trigger)}
              >
                ${icon}
                <span>${escapeHtml(button.label)}</span>
              </button>
            `;
          })
          .join('')}
      </div>
    `;
  }

  function renderModalShell(options) {
    return `
      <div class="modal-layer">
        <button type="button" class="modal-scrim" data-action="close-modal" aria-label="Cerrar modal"></button>
        <div class="modal-wrap">
          <section class="modal-panel modal-panel--${escapeHtml(options.size || 'default')}">
            <button type="button" class="modal-close-button" data-action="close-modal" aria-label="Cerrar modal">
              ${renderIcon('close')}
            </button>
            <header class="modal-header">
              <h2>${escapeHtml(options.title)}</h2>
              ${options.subtitle ? `<p>${escapeHtml(options.subtitle)}</p>` : ''}
            </header>
            ${options.content}
          </section>
        </div>
      </div>
    `;
  }

  function renderFormModal(options) {
    const footerButtons =
      options.footerButtons || [
        { label: options.cancelLabel || 'Cancelar', tone: 'secondary', trigger: { action: 'close-modal' } },
        { label: options.submitLabel || 'Guardar', tone: options.submitTone || 'primary', icon: options.submitIcon, submit: true },
      ];

    return renderModalShell({
      size: options.size,
      title: options.title,
      subtitle: options.subtitle,
      content: `
        <form class="modal-form" data-modal-form data-modal-key="${escapeHtml(options.key)}">
          ${
            options.callout
              ? `
                <div class="modal-callout">
                  <strong>${escapeHtml(options.callout.title)}</strong>
                  <span>${escapeHtml(options.callout.detail)}</span>
                </div>
              `
              : ''
          }
          <div class="modal-body${options.columns === 2 ? ' modal-body--two' : ''}">
            ${(options.fields || []).map((field) => renderModalField(field)).join('')}
            ${options.extraBody || ''}
          </div>
          ${renderModalFooter(footerButtons)}
        </form>
      `,
    });
  }

  function renderInfoModal(options) {
    return renderModalShell({
      size: options.size,
      title: options.title,
      subtitle: options.subtitle,
      content: `
        <div class="modal-content-stack">
          ${options.body}
          ${renderModalFooter(options.footerButtons || [{ label: 'Cerrar', tone: 'secondary', trigger: { action: 'close-modal' } }])}
        </div>
      `,
    });
  }

  function renderSidebar(state) {
    const account = getSessionAccount(state);
    const alerts = getVisibleAlerts(state);
    const accountSecondaryLabel =
      account.email || account.username || (account.isDemo ? 'Sesión local de prueba' : 'Acceso de administrador');

    return `
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-mark">
            <img src="/admin/farm-bot-logo.png" alt="Farm Bot" />
          </div>
          <div>
            <p class="sidebar-brand-title">Campo</p>
            <p class="sidebar-brand-subtitle">Gestión Integral</p>
          </div>
        </div>

        <nav class="sidebar-nav" aria-label="Navegación principal">
          ${NAV_ITEMS.map(
            (item) => `
              <button
                type="button"
                class="nav-item${item.key === state.activeNav ? ' is-active' : ''}"
                data-nav-key="${escapeHtml(item.key)}"
              >
                <span class="nav-item-icon">${renderIcon(item.icon)}</span>
                <span>${escapeHtml(item.label)}</span>
              </button>
            `
          ).join('')}
        </nav>

        <section class="sidebar-alerts">
          <p class="sidebar-section-title">Alertas activas</p>
          <div class="sidebar-alert-list">
            ${alerts
              .map(
                (alert) => `
                  <button
                    type="button"
                    class="sidebar-alert-card sidebar-alert-card--${escapeHtml(getRealAlertCardTone(alert.tone))}"
                    ${renderActionAttributes({
                      action: 'open-alert-context',
                      meta: {
                        alertKey: resolveAlertContextKey(alert),
                        alertNavKey: alert.navKey || 'home',
                      },
                    })}
                  >
                    <div class="sidebar-alert-icon">${renderIcon('bell')}</div>
                    <div class="sidebar-alert-copy">
                      <strong>${escapeHtml(alert.title)}</strong>
                      <span>${escapeHtml(alert.detail)}</span>
                    </div>
                    <span class="sidebar-alert-count sidebar-alert-count--${escapeHtml(getRealAlertCardTone(alert.tone))}">${escapeHtml(getRealAlertBadgeLabel(alert))}</span>
                  </button>
                `
              )
              .join('')}
          </div>
        </section>

        <div class="sidebar-footer-stack">
          <section class="sidebar-account-card">
            <div class="sidebar-account-main">
              <div class="sidebar-account-avatar">${escapeHtml(account.initials)}</div>
              <div class="sidebar-account-copy">
                <strong>${escapeHtml(account.displayName)}</strong>
                <span>${escapeHtml(accountSecondaryLabel)}</span>
                <small>${escapeHtml(`${account.role} · ${account.farmName}`)}</small>
              </div>
            </div>

            <div class="sidebar-account-actions">
              <button
                type="button"
                class="sidebar-account-action"
                ${renderActionAttributes({
                  navKey: 'settings',
                  viewNav: 'settings',
                  viewKey: 'account',
                })}
              >
                Mi cuenta
              </button>
              <button
                type="button"
                class="sidebar-account-action"
                ${renderActionAttributes({
                  navKey: 'settings',
                  viewNav: 'settings',
                  viewKey: 'security',
                })}
              >
                Seguridad
              </button>
              <button
                type="button"
                class="sidebar-account-action sidebar-account-action--danger"
                data-action="logout"
              >
                Cerrar sesión
              </button>
            </div>
          </section>

          <button
            type="button"
            class="telegram-button"
            data-action="open-telegram-bot"
          >
            ${renderIcon('telegram')}
            <span>Telegram Bot</span>
          </button>
        </div>
      </aside>
    `;
  }

  function renderMobileTopbar(state) {
    return `
      <header class="mobile-topbar">
        <div class="mobile-topbar-brand">
          <div class="mobile-topbar-mark">
            <img src="/admin/farm-bot-logo.png" alt="Farm Bot" />
          </div>
          <div>
            <p>Campo</p>
            <span>Gestión Integral</span>
          </div>
        </div>

        <div class="mobile-topbar-actions">
          <button
            type="button"
            class="icon-button"
            data-action="open-modal"
            data-value="alerts-center"
            aria-label="Alertas"
          >
            ${renderIcon('bell')}
            <span class="icon-badge">${escapeHtml(totalAlertCount(state))}</span>
          </button>
          <button
            type="button"
            class="icon-button${state.mobileMenuOpen ? ' is-active' : ''}"
            data-action="toggle-mobile-menu"
            aria-expanded="${state.mobileMenuOpen ? 'true' : 'false'}"
            aria-label="Abrir menú"
          >
            ${renderIcon('menu')}
          </button>
        </div>
      </header>
    `;
  }

  function renderMobileMenu(state) {
    const secondaryItems = NAV_ITEMS.filter(
      (item) => !MOBILE_PRIMARY_NAV_KEYS.includes(item.key)
    );
    const account = getSessionAccount(state);
    const accountSecondaryLabel =
      account.email || account.username || (account.isDemo ? 'Sesión local de prueba' : 'Acceso de administrador');

    return `
      <div class="mobile-menu-sheet">
        <div class="mobile-menu-head">
          <div>
            <strong>Más módulos</strong>
            <span>Accesos secundarios del admin nuevo</span>
          </div>
          <button type="button" class="mobile-close-button" data-action="toggle-mobile-menu">
            Cerrar
          </button>
        </div>

        <div class="mobile-menu-grid">
          ${secondaryItems
            .map(
              (item) => `
                <button
                  type="button"
                  class="mobile-menu-item${item.key === state.activeNav ? ' is-active' : ''}"
                  data-nav-key="${escapeHtml(item.key)}"
                >
                  ${renderIcon(item.icon)}
                  <span>${escapeHtml(item.label)}</span>
                </button>
              `
            )
            .join('')}
        </div>

        <section class="sidebar-account-card sidebar-account-card--mobile">
          <div class="sidebar-account-main">
            <div class="sidebar-account-avatar">${escapeHtml(account.initials)}</div>
            <div class="sidebar-account-copy">
              <strong>${escapeHtml(account.displayName)}</strong>
              <span>${escapeHtml(accountSecondaryLabel)}</span>
              <small>${escapeHtml(`${account.role} · ${account.farmName}`)}</small>
            </div>
          </div>
        </section>

        <div class="mobile-menu-footer">
          <button
            type="button"
            class="btn btn-secondary"
            ${renderActionAttributes({
              navKey: 'settings',
              viewNav: 'settings',
              viewKey: 'account',
            })}
          >
            Mi cuenta
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            ${renderActionAttributes({
              navKey: 'settings',
              viewNav: 'settings',
              viewKey: 'security',
            })}
          >
            Seguridad
          </button>
          <button type="button" class="btn btn-secondary" data-action="refresh">Refrescar</button>
          <button type="button" class="btn btn-ghost" data-action="logout">Salir</button>
        </div>
      </div>
    `;
  }

  function renderMobileBottomNav(state) {
    return `
      <nav class="mobile-bottom-nav" aria-label="Navegación principal móvil">
        ${NAV_ITEMS.filter((item) => MOBILE_PRIMARY_NAV_KEYS.includes(item.key))
          .map(
            (item) => `
              <button
                type="button"
                class="mobile-bottom-item${item.key === state.activeNav ? ' is-active' : ''}"
                data-nav-key="${escapeHtml(item.key)}"
              >
                ${renderIcon(item.icon)}
                <span>${escapeHtml(item.label)}</span>
              </button>
            `
          )
          .join('')}
      </nav>
    `;
  }

  function renderPageHeader(state) {
    const meta = MODULE_META[state.activeNav];
    const subtitle =
      typeof meta.getSubtitle === 'function' ? meta.getSubtitle(state) : meta.subtitle;
    const resolvedActions =
      typeof meta.getActions === 'function' ? meta.getActions(state) : meta.actions;
    const actions = Array.isArray(resolvedActions) ? resolvedActions : [];
    const account = getSessionAccount(state);
    const sessionLabel =
      state.session && state.session.demo
        ? 'Modo demo'
        : account.displayName
          ? `${account.displayName}`
          : 'Sesión';

    return `
      <header class="page-header">
        <div class="page-header-copy">
          <h1>${escapeHtml(meta.title)}</h1>
          <p>${escapeHtml(subtitle || '')}</p>
        </div>

        <div class="page-header-actions">
          <div class="page-meta">
            ${renderBadge(sessionLabel, state.session && state.session.demo ? 'orange' : 'gray')}
            ${renderBadge(`Actualizado ${formatTimeLabel(state.refreshedAt)}`, 'gray')}
          </div>
          <div class="action-row">
            ${actions
              .map(
                (action) => `
                  <button
                    type="button"
                    class="btn btn-${escapeHtml(action.tone)}"
                    ${renderActionAttributes(action.trigger)}
                  >
                    ${renderIcon(action.icon)}
                    <span>${escapeHtml(action.label)}</span>
                  </button>
                `
              )
              .join('')}
          </div>
        </div>
      </header>
    `;
  }

  function renderMetricGrid(items) {
    return `
      <section class="metric-grid">
        ${items
          .map(
            (item) => `
              <article class="metric-card">
                <div class="metric-card-top">
                  <div>
                    <p>${escapeHtml(item.label)}</p>
                    <h2>${escapeHtml(item.value)}</h2>
                  </div>
                  ${
                    item.icon
                      ? `<span class="metric-icon metric-icon--${escapeHtml(item.tone || 'gray')}">${renderIcon(item.icon)}</span>`
                      : ''
                  }
                </div>
                <span class="metric-detail">${escapeHtml(item.detail || '')}</span>
              </article>
            `
          )
          .join('')}
      </section>
    `;
  }

  function renderNoticeCard(notice) {
    if (!notice) {
      return '';
    }

    return `
      <section class="notice-card notice-card--${escapeHtml(notice.tone || 'gray')}">
        <div class="notice-card-head">
          <div class="notice-icon">${renderIcon('circleAlert')}</div>
          <div class="notice-copy">
            <h2>${escapeHtml(notice.title)}</h2>
            ${notice.description ? `<p>${escapeHtml(notice.description)}</p>` : ''}
          </div>
          ${
            notice.action
              ? `
                <button
                  type="button"
                  class="btn btn-secondary"
                  ${renderActionAttributes(
                    notice.actionTrigger ||
                      (notice.actionKey === 'owner-reminders'
                        ? {
                            action: 'toast',
                            message: 'Recordatorios dummy enviados. Luego conectamos WhatsApp, email o Telegram real.',
                          }
                        : null)
                  )}
                >
                  ${escapeHtml(notice.action)}
                </button>
              `
              : ''
          }
        </div>
        ${
          notice.focus
            ? `
              <div class="notice-focus">
                <strong>${escapeHtml(notice.focus)}</strong>
                <span>${escapeHtml(notice.focusDetail || '')}</span>
                ${notice.tag ? renderBadge(notice.tag, 'critical') : ''}
              </div>
            `
            : ''
        }
        ${
          notice.rows && notice.rows.length
            ? `
              <ul class="notice-list">
                ${notice.rows.map((row) => `<li>${escapeHtml(row)}</li>`).join('')}
              </ul>
            `
            : ''
        }
      </section>
    `;
  }

  function renderSegmentedTabs(state, navKey, tabs) {
    return `
      <div class="segmented-tabs" role="tablist" aria-label="Variantes">
        ${tabs
          .map(
            (tab) => `
              <button
                type="button"
                class="segmented-tab${getActiveView(state, navKey) === tab.key ? ' is-active' : ''}"
                data-view-nav="${escapeHtml(navKey)}"
                data-view-key="${escapeHtml(tab.key)}"
              >
                ${escapeHtml(tab.label)}
              </button>
            `
          )
          .join('')}
      </div>
    `;
  }

  function renderSearchRow(placeholder, selectOptions) {
    return `
      <section class="toolbar-card">
        <label class="search-field">
          ${renderIcon('search')}
          <input type="search" placeholder="${escapeHtml(placeholder)}" />
        </label>
        ${
          selectOptions && selectOptions.length
            ? `
              <label class="select-field">
                <select>
                  ${selectOptions
                    .map((option) => `<option>${escapeHtml(option)}</option>`)
                    .join('')}
                </select>
              </label>
            `
            : ''
        }
      </section>
    `;
  }

  function renderRealHomeView(state) {
    const metrics = buildRealHomeMetrics(state);
    const notices = buildRealHomeNotices(state);
    const paddocks = buildRealHomePaddockRows(state);
    const tasks = buildRealHomeTasks(state);
    const activity = buildRealHomeActivity(state);

    return `
      <div class="page-stack">
        <section class="panel panel--soft">
          <div class="panel-title">Acciones Rápidas</div>
          <div class="quick-actions-grid">
            ${DEMO_DATA.home.quickActions
              .map(
                (action) => `
                  <button
                    type="button"
                    class="quick-action-card"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: action.modalKey,
                    })}
                  >
                    ${renderIcon(action.icon)}
                    <span>${escapeHtml(action.label)}</span>
                  </button>
                `
              )
              .join('')}
          </div>
        </section>

        <div class="stack-gap">
          ${notices.map((notice) => renderNoticeCard(notice)).join('')}
        </div>

        ${renderMetricGrid(metrics)}

        <section class="home-layout">
          <article class="panel">
            <div class="panel-head">
              <h2>Estado de Potreros</h2>
              <button type="button" class="text-action" data-nav-key="paddocks">Ver todos</button>
            </div>
            ${
              paddocks.length
                ? `
                  <div class="status-list">
                    ${paddocks
                      .map(
                        (item) => `
                          <article class="status-row">
                            <div>
                              <div class="status-row-title">
                                <strong>${escapeHtml(item.name)}</strong>
                                ${renderBadge(item.status, item.statusTone)}
                              </div>
                              <span>${escapeHtml(item.detail)}</span>
                            </div>
                            <div class="status-pill status-pill--${escapeHtml(item.conditionTone)}">
                              ${escapeHtml(item.condition)}
                            </div>
                          </article>
                        `
                      )
                      .join('')}
                  </div>
                `
                : `
                  <div class="empty-state-card">
                    <strong>Todavía no hay potreros para mostrar.</strong>
                    <span>Cuando haya bloques cargados en Neon, el estado operativo va a aparecer acá.</span>
                  </div>
                `
            }
          </article>

          <div class="side-stack">
            <article class="panel">
              <div class="panel-head">
                <h2>Próximas Tareas</h2>
              </div>
              ${
                tasks.length
                  ? `
                    <div class="mini-list">
                      ${tasks
                        .map(
                          (task) => `
                            <div class="mini-list-row">
                              <span class="mini-dot mini-dot--${escapeHtml(task.tone)}"></span>
                              <div>
                                <strong>${escapeHtml(task.title)}</strong>
                                <span>${escapeHtml(task.date)}</span>
                              </div>
                            </div>
                          `
                        )
                        .join('')}
                    </div>
                  `
                  : `
                    <div class="empty-state-card">
                      <strong>Sin tareas próximas.</strong>
                      <span>No encontramos cuidados ni hitos cercanos en la lectura actual.</span>
                    </div>
                  `
              }
              <button type="button" class="btn btn-secondary btn-block" data-nav-key="calendar">Ver calendario completo</button>
            </article>

            <article class="panel">
              <div class="panel-head">
                <h2>Actividad Reciente</h2>
              </div>
              ${
                activity.length
                  ? `
                    <div class="activity-list">
                      ${activity
                        .map(
                          (item) => `
                            <div class="activity-row">
                              <span class="activity-icon">${renderIcon(item.icon)}</span>
                              <div>
                                <strong>${escapeHtml(item.title)}</strong>
                                <span>${escapeHtml(item.time)}</span>
                              </div>
                            </div>
                          `
                        )
                        .join('')}
                    </div>
                  `
                  : `
                    <div class="empty-state-card">
                      <strong>Sin actividad reciente.</strong>
                      <span>Cuando entren más movimientos, trabajos o compras van a aparecer acá.</span>
                    </div>
                  `
              }
            </article>
          </div>
        </section>
      </div>
    `;
  }

  function renderHomeView(state) {
    const hasRealHomeData =
      Boolean(getRealHorseDashboard(state)) ||
      Boolean(getRealPaddockDashboard(state)) ||
      Boolean(getRealStockDashboard(state));

    if (isRealSession(state) && hasRealHomeData) {
      return renderRealHomeView(state);
    }

    if (isRealSession(state)) {
      return `
        <div class="page-stack">
          <section class="panel panel--soft">
            <div class="empty-state-card">
              <strong>No pudimos cargar el resumen real del inicio.</strong>
              <span>La sesión está lista, pero esta vista todavía no recibió datos desde Neon. Probá refrescar.</span>
            </div>
          </section>
        </div>
      `;
    }

    return `
      <div class="page-stack">
        <section class="panel panel--soft">
          <div class="panel-title">Acciones Rápidas</div>
          <div class="quick-actions-grid">
            ${DEMO_DATA.home.quickActions
              .map(
                (action) => `
                  <button
                    type="button"
                    class="quick-action-card"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: action.modalKey,
                    })}
                  >
                    ${renderIcon(action.icon)}
                    <span>${escapeHtml(action.label)}</span>
                  </button>
                `
              )
              .join('')}
          </div>
        </section>

        <div class="stack-gap">
          ${DEMO_DATA.home.notices.map((notice) => renderNoticeCard(notice)).join('')}
        </div>

        ${renderMetricGrid(DEMO_DATA.home.metrics)}

        <section class="home-layout">
          <article class="panel">
            <div class="panel-head">
              <h2>Estado de Potreros</h2>
              <button type="button" class="text-action" data-nav-key="paddocks">Ver todos</button>
            </div>
            <div class="status-list">
              ${DEMO_DATA.home.paddocks
                .map(
                  (item) => `
                    <article class="status-row">
                      <div>
                        <div class="status-row-title">
                          <strong>${escapeHtml(item.name)}</strong>
                          ${renderBadge(item.status, item.statusTone)}
                        </div>
                        <span>${escapeHtml(item.detail)}</span>
                      </div>
                      <div class="status-pill status-pill--${escapeHtml(item.conditionTone)}">
                        ${escapeHtml(item.condition)}
                      </div>
                    </article>
                  `
                )
                .join('')}
            </div>
          </article>

          <div class="side-stack">
            <article class="panel">
              <div class="panel-head">
                <h2>Próximas Tareas</h2>
              </div>
              <div class="mini-list">
                ${DEMO_DATA.home.upcomingTasks
                  .map(
                    (task) => `
                      <div class="mini-list-row">
                        <span class="mini-dot mini-dot--${escapeHtml(task.tone)}"></span>
                        <div>
                          <strong>${escapeHtml(task.title)}</strong>
                          <span>${escapeHtml(task.date)}</span>
                        </div>
                      </div>
                    `
                  )
                  .join('')}
              </div>
              <button type="button" class="btn btn-secondary btn-block" data-nav-key="calendar">Ver calendario completo</button>
            </article>

            <article class="panel">
              <div class="panel-head">
                <h2>Actividad Reciente</h2>
              </div>
              <div class="activity-list">
                ${DEMO_DATA.home.activity
                  .map(
                    (item) => `
                      <div class="activity-row">
                        <span class="activity-icon">${renderIcon(item.icon)}</span>
                        <div>
                          <strong>${escapeHtml(item.title)}</strong>
                          <span>${escapeHtml(item.time)}</span>
                        </div>
                      </div>
                    `
                  )
                  .join('')}
              </div>
            </article>
          </div>
        </section>
      </div>
    `;
  }

  function renderPaddocksView(state) {
    const realSession = isRealSession(state);
    const realDashboard = realSession ? getRealPaddockDashboard(state) : null;
    if (realDashboard) {
      return renderRealPaddocksView(state, realDashboard);
    }

    if (realSession) {
      return `
        <div class="page-stack">
          <section class="panel panel--soft">
            <div class="empty-state-card">
              <strong>No pudimos cargar la lectura real de potreros.</strong>
              <span>La sesión está lista, pero este módulo no devolvió datos. Probá refrescar la vista.</span>
            </div>
          </section>
        </div>
      `;
    }

    const activeView = getActiveView(state, 'paddocks');

    return `
      <div class="page-stack">
        ${renderSearchRow('Buscar potreros...', DEMO_DATA.paddocks.filters)}
        ${renderSegmentedTabs(state, 'paddocks', DEMO_DATA.paddocks.tabs)}
        ${
          activeView === 'cards'
            ? `
              <section class="card-grid card-grid--three">
                ${DEMO_DATA.paddocks.cards
                  .map(
                    (item) => `
                      <article class="paddock-card paddock-card--${escapeHtml(item.statusTone)}">
                        <div class="paddock-card-head">
                          <div>
                            <h2>${escapeHtml(item.name)}</h2>
                            <span>${escapeHtml(item.area)}</span>
                          </div>
                          ${renderBadge(item.status, item.statusTone)}
                        </div>

                        <dl class="fact-list">
                          <div><dt>Caballos</dt><dd>${escapeHtml(item.horses)}</dd></div>
                          <div><dt>Días ocupado</dt><dd>${escapeHtml(item.occupiedDays)}</dd></div>
                          <div><dt>Días descanso</dt><dd>${escapeHtml(item.restDays)}</dd></div>
                          <div><dt>Lluvia (30d)</dt><dd>${escapeHtml(item.rain)}</dd></div>
                        </dl>

                        <div class="inline-strip">
                          <span>Condición</span>
                          ${renderBadge(item.condition, item.conditionTone)}
                        </div>
                        <span class="subtle-text">Último trabajo: ${escapeHtml(item.work)}</span>

                        <div class="crop-box crop-box--${escapeHtml(item.cropTone)}">
                          ${renderBadge(item.cropLabel, item.cropTone)}
                          <strong>${escapeHtml(item.crop)}</strong>
                          <span>${escapeHtml(item.cropDate)}</span>
                        </div>

                        <div class="inline-strip">
                          <strong class="rotation-text rotation-text--${escapeHtml(item.rotationTone)}">${escapeHtml(item.rotation)}</strong>
                        </div>

                        <div class="split-actions">
                          <button
                            type="button"
                            class="btn btn-secondary btn-grow"
                            ${renderActionAttributes({
                              action: 'open-modal',
                              value: 'paddock-detail',
                              meta: { name: item.name },
                            })}
                          >
                            ${renderIcon('pin')}
                            <span>Ver</span>
                          </button>
                          <button
                            type="button"
                            class="btn btn-secondary btn-grow"
                            ${renderActionAttributes({
                              action: 'open-modal',
                              value: 'paddock-form',
                              meta: { mode: 'edit', name: item.name },
                            })}
                          >
                            ${renderIcon('edit')}
                            <span>Editar</span>
                          </button>
                        </div>
                      </article>
                    `
                  )
                  .join('')}
              </section>
            `
            : `
              <section class="panel">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Estado</th>
                      <th>Hectáreas</th>
                      <th>Caballos</th>
                      <th>Condición</th>
                      <th>Rotación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${DEMO_DATA.paddocks.rows
                      .map(
                        (item) => `
                          <tr>
                            <td>${escapeHtml(item.name)}</td>
                            <td>${renderBadge(item.status, item.statusTone)}</td>
                            <td>${escapeHtml(item.area)}</td>
                            <td>${escapeHtml(item.horses)}</td>
                            <td>${renderBadge(item.condition, item.conditionTone)}</td>
                            <td>${escapeHtml(item.rotation)}</td>
                            <td>
                              <button
                                type="button"
                                class="table-icon-button"
                                ${renderActionAttributes({
                                  action: 'open-modal',
                                  value: 'paddock-form',
                                  meta: { mode: 'edit', name: item.name },
                                })}
                                aria-label="Editar ${escapeHtml(item.name)}"
                              >
                                ${renderIcon('edit')}
                              </button>
                            </td>
                          </tr>
                        `
                      )
                      .join('')}
                  </tbody>
                </table>
              </section>
            `
        }
      </div>
    `;
  }

  function getPaddockCardTone(paddock) {
    const tone = getPaddockStateMeta(paddock).tone;
    if (tone === 'green') {
      return 'green';
    }

    if (tone === 'orange' || tone === 'critical' || tone === 'gray') {
      return 'orange';
    }

    return 'blue';
  }

  function getPaddockNoteTone(tone) {
    if (tone === 'green') {
      return 'green';
    }

    if (tone === 'critical') {
      return 'critical';
    }

    if (tone === 'purple') {
      return 'purple';
    }

    if (tone === 'warning' || tone === 'orange') {
      return 'warning';
    }

    return 'blue';
  }

  function renderRealPaddockSearchRow(state, dashboard) {
    const filterOptions = getPaddockFilterOptions(dashboard);

    return `
      <section class="toolbar-card">
        <label class="search-field">
          ${renderIcon('search')}
          <input
            type="search"
            placeholder="Buscar por nombre, zona o grupo..."
            value="${escapeHtml(state?.paddockFilters?.query || '')}"
            data-paddock-filter="query"
          />
        </label>
        <label class="select-field">
          <select data-paddock-filter="status">
            ${filterOptions
              .map(
                (option) => `
                  <option value="${escapeHtml(option.value)}"${
                    option.value === (state?.paddockFilters?.status || 'all') ? ' selected' : ''
                  }>
                    ${escapeHtml(option.label)}
                  </option>
                `
              )
              .join('')}
          </select>
        </label>
      </section>
    `;
  }

  function renderRealPaddockCards(state, dashboard) {
    const paddocks = getFilteredRealPaddocks(state, dashboard);

    if (!paddocks.length) {
      return `
        <section class="panel panel--soft">
          <div class="empty-state-card">
            <strong>No encontramos potreros para ese filtro.</strong>
            <span>Probá limpiar la búsqueda o cambiar el estado seleccionado.</span>
          </div>
        </section>
      `;
    }

    return `
      <section class="card-grid card-grid--three">
        ${paddocks
          .map((paddock) => {
            const stateMeta = getPaddockStateMeta(paddock);
            const readiness = getPaddockReadinessSummary(paddock);
            const horseCountLabel =
              paddock.horse_count > 0 ? `${paddock.horse_count} caballo(s)` : 'Sin ocupación';
            const restLabel =
              paddock.rest_days != null
                ? `${paddock.rest_days} día(s)`
                : paddock.manual_rest_days != null
                  ? `${paddock.manual_rest_days} día(s)`
                  : '-';

            return `
              <article class="paddock-card paddock-card--${escapeHtml(getPaddockCardTone(paddock))}">
                <div class="paddock-card-head">
                  <div>
                    <h2>${escapeHtml(paddock.name)}</h2>
                    <span>${escapeHtml(formatPaddockAreaLabel(paddock.size_ha))}</span>
                  </div>
                  ${renderBadge(stateMeta.label, stateMeta.tone)}
                </div>

                <dl class="fact-list">
                  <div><dt>Caballos</dt><dd>${escapeHtml(horseCountLabel)}</dd></div>
                  <div><dt>Zona</dt><dd>${escapeHtml(paddock.zone || 'Sin zona')}</dd></div>
                  <div><dt>Descanso</dt><dd>${escapeHtml(restLabel)}</dd></div>
                  <div><dt>Bloque</dt><dd>${escapeHtml(paddock.parent_paddock_name || 'Raíz')}</dd></div>
                </dl>

                <div class="inline-strip">
                  ${renderBadge(paddock.active === false ? 'Inactivo' : 'Activo', paddock.active === false ? 'gray' : 'green')}
                  <span>${escapeHtml(stateMeta.detail)}</span>
                </div>

                <span class="subtle-text">Último trabajo: ${escapeHtml(getPaddockWorkSummary(paddock))}</span>

                <div class="note-bar note-bar--${escapeHtml(getPaddockNoteTone(readiness.tone))}">
                  ${escapeHtml(`${readiness.label}: ${readiness.value}`)}
                </div>

                ${
                  paddock.notes
                    ? `<span class="subtle-text">${escapeHtml(paddock.notes)}</span>`
                    : ''
                }

                <div class="split-actions">
                  <button
                    type="button"
                    class="btn btn-secondary btn-grow"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: 'paddock-detail',
                      meta: { paddockId: paddock.id },
                    })}
                  >
                    Ver
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-grow"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: 'paddock-form',
                      meta: { mode: 'edit', paddockId: paddock.id },
                    })}
                  >
                    Editar
                  </button>
                </div>
              </article>
            `;
          })
          .join('')}
      </section>
    `;
  }

  function renderRealPaddockTable(state, dashboard) {
    const paddocks = getFilteredRealPaddocks(state, dashboard);

    if (!paddocks.length) {
      return `
        <section class="panel panel--soft">
          <div class="empty-state-card">
            <strong>No encontramos potreros para ese filtro.</strong>
            <span>Probá limpiar la búsqueda o cambiar el estado seleccionado.</span>
          </div>
        </section>
      `;
    }

    return `
      <section class="panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Zona</th>
              <th>Hectáreas</th>
              <th>Caballos</th>
              <th>Trabajo</th>
              <th>Operativo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${paddocks
              .map((paddock) => {
                const stateMeta = getPaddockStateMeta(paddock);
                const readiness = getPaddockReadinessSummary(paddock);

                return `
                  <tr>
                    <td>
                      <div class="table-primary">
                        <strong>${escapeHtml(paddock.name)}</strong>
                        <span>${escapeHtml(paddock.parent_paddock_name || 'Bloque raíz')}</span>
                      </div>
                    </td>
                    <td>
                      <div class="table-status-stack">
                        ${renderBadge(stateMeta.label, stateMeta.tone)}
                        <span>${escapeHtml(stateMeta.detail)}</span>
                      </div>
                    </td>
                    <td>${escapeHtml(paddock.zone || 'Sin zona')}</td>
                    <td>${escapeHtml(formatPaddockAreaLabel(paddock.size_ha))}</td>
                    <td>
                      <div class="table-primary">
                        <strong>${escapeHtml(String(paddock.horse_count || 0))}</strong>
                        <span>${escapeHtml(paddock.occupied_by || 'Sin ocupación activa')}</span>
                      </div>
                    </td>
                    <td>${escapeHtml(getPaddockWorkSummary(paddock))}</td>
                    <td>
                      <div class="table-status-stack">
                        ${renderBadge(readiness.label, getPaddockNoteTone(readiness.tone))}
                        <span>${escapeHtml(readiness.value)}</span>
                      </div>
                    </td>
                    <td>
                      <div class="table-actions">
                        <button
                          type="button"
                          class="table-icon-button"
                          ${renderActionAttributes({
                            action: 'open-modal',
                            value: 'paddock-detail',
                            meta: { paddockId: paddock.id },
                          })}
                          aria-label="Ver ${escapeHtml(paddock.name)}"
                        >
                          ${renderIcon('pin')}
                        </button>
                        <button
                          type="button"
                          class="table-icon-button"
                          ${renderActionAttributes({
                            action: 'open-modal',
                            value: 'paddock-form',
                            meta: { mode: 'edit', paddockId: paddock.id },
                          })}
                          aria-label="Editar ${escapeHtml(paddock.name)}"
                        >
                          ${renderIcon('edit')}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </section>
    `;
  }

  function renderRealPaddocksView(state, dashboard) {
    const activeView = getActiveView(state, 'paddocks');

    return `
      <div class="page-stack">
        ${renderMetricGrid(dashboard.summary_cards || [])}
        ${dashboard.notice ? renderNoticeCard(dashboard.notice) : ''}
        ${renderSegmentedTabs(state, 'paddocks', dashboard.tabs || [])}
        ${renderRealPaddockSearchRow(state, dashboard)}
        ${
          activeView === 'list'
            ? renderRealPaddockTable(state, dashboard)
            : renderRealPaddockCards(state, dashboard)
        }
      </div>
    `;
  }

  function renderRealHorseSearchRow(state, dashboard) {
    const filterOptions = getRealHorseFilterOptions(dashboard);
    const careFilterOptions = getHorseCareFilterOptions();

    return `
      <section class="toolbar-card">
        <label class="search-field">
          ${renderIcon('search')}
          <input
            type="search"
            placeholder="Buscar por nombre, grupo o potrero..."
            value="${escapeHtml(state?.horseFilters?.query || '')}"
            data-horse-filter="query"
          />
        </label>
        <label class="select-field">
          <select data-horse-filter="group">
            ${filterOptions
              .map(
                (option) => `
                  <option value="${escapeHtml(option.value)}"${
                    option.value === (state?.horseFilters?.group || 'all') ? ' selected' : ''
                  }>
                    ${escapeHtml(option.label)}
                  </option>
                `
              )
              .join('')}
          </select>
        </label>
        <label class="select-field">
          <select data-horse-filter="care">
            ${careFilterOptions
              .map(
                (option) => `
                  <option value="${escapeHtml(option.value)}"${
                    option.value === (state?.horseFilters?.care || 'all') ? ' selected' : ''
                  }>
                    ${escapeHtml(option.label)}
                  </option>
                `
              )
              .join('')}
          </select>
        </label>
      </section>
    `;
  }

  function renderRealHorseCards(state, dashboard) {
    const horses = getFilteredRealHorses(state, dashboard);

    if (!horses.length) {
      return `
        <section class="panel panel--soft">
          <div class="empty-state-card">
            <strong>No encontramos caballos para ese filtro.</strong>
            <span>Probá limpiar la búsqueda o cambiar la vista de grupo.</span>
          </div>
        </section>
      `;
    }

    return `
      <section class="card-grid card-grid--three">
        ${horses
          .map((horse) => {
            const horseNote = getHorseCareNote(horse);

            return `
              <article class="horse-card">
                <div class="horse-card-head">
                  <div>
                    <h2>${escapeHtml(horse.name)}</h2>
                    <span>${escapeHtml(getHorseCardSubtitle(horse))}</span>
                  </div>
                  ${getHorseCardBadge(horse)}
                </div>

                <div class="stacked-info">
                  <span>${renderIcon('singleHorse')} ${escapeHtml(getHorseProfileSummary(horse))}</span>
                  <span>${renderIcon('pin')} ${escapeHtml(horse.current_location?.paddock_name || 'Sin potrero asignado')}</span>
                </div>

                <div class="health-grid">
                  <div>
                    <dt>Desparasitación</dt>
                    <dd>${escapeHtml(
                      horse.care?.deworming?.next_due_date
                        ? formatDateLabel(horse.care.deworming.next_due_date)
                        : 'Sin fecha'
                    )}</dd>
                  </div>
                  <div>
                    <dt>Herraje</dt>
                    <dd>${escapeHtml(
                      horse.care?.farrier?.next_due_date
                        ? formatDateLabel(horse.care.farrier.next_due_date)
                        : 'Sin fecha'
                    )}</dd>
                  </div>
                </div>

                <div class="note-bar note-bar--${escapeHtml(horseNote.tone)}">
                  ${escapeHtml(horseNote.label)}
                </div>

                <div class="split-actions">
                  <button
                    type="button"
                    class="btn btn-secondary btn-grow"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: 'horse-history',
                      meta: { horseId: horse.id },
                    })}
                  >
                    Ver ficha
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-grow"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: 'horse-form',
                      meta: { mode: 'edit', horseId: horse.id },
                    })}
                  >
                    Editar
                  </button>
                </div>
              </article>
            `;
          })
          .join('')}
      </section>
    `;
  }

  function renderRealHorseGroups(dashboard) {
    const groups = buildRealHorseGroups(dashboard);

    if (!groups.length) {
      return `
        <section class="panel panel--soft">
          <div class="empty-state-card">
            <strong>No hay grupos activos para mostrar.</strong>
            <span>Los caballos siguen disponibles en la vista individual aunque todavía no tengan membresía activa.</span>
          </div>
        </section>
      `;
    }

    return `
      <div class="align-end">
        <button
          type="button"
          class="btn btn-secondary"
          ${renderActionAttributes({
            action: 'open-modal',
            value: 'group-form',
            meta: { mode: 'create' },
          })}
        >
          ${renderIcon('plus')}
          <span>Crear Grupo</span>
        </button>
      </div>

      <section class="card-grid card-grid--two">
        ${groups
          .map(
            (group) => `
              <article class="group-card">
                <div class="group-card-head">
                  <div>
                    <h2>${escapeHtml(group.name)}</h2>
                    <span>${escapeHtml(formatHorseCountLabel(group.count))}</span>
                  </div>
                  ${renderBadge('Grupo', 'blue')}
                </div>

                <div class="location-box">
                  ${renderIcon('pin')}
                  <div>
                    <strong>${escapeHtml(group.paddock_name)}</strong>
                    <span>${escapeHtml(group.location_detail)}</span>
                  </div>
                </div>

                <div class="member-list">
                  <span>Caballos en el grupo:</span>
                  <div class="chip-row">
                    ${group.members
                      .map((member) => `<span class="mini-chip">${escapeHtml(member)}</span>`)
                      .join('')}
                  </div>
                </div>

                ${
                  group.alert_count > 0
                    ? `
                      <div class="note-bar note-bar--warning">
                        ${escapeHtml(`${group.alert_count} alerta(s) sanitaria(s)`)}
                      </div>
                    `
                    : group.unassigned_member_count > 0
                      ? `
                        <div class="note-bar note-bar--warning">
                          ${escapeHtml(`${group.unassigned_member_count} caballo(s) todavía sin ubicación activa`)}
                        </div>
                      `
                    : ''
                }

                <div class="split-actions">
                  <button
                    type="button"
                    class="btn btn-secondary btn-grow"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: 'move-group',
                      meta: {
                        groupId: group.id,
                        groupName: group.name,
                        paddockId: group.current_location_id,
                      },
                    })}
                  >
                    Mover grupo
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-grow"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: 'horse-group-detail',
                      meta: { groupName: group.name },
                    })}
                  >
                    Gestionar
                  </button>
                </div>
              </article>
            `
          )
          .join('')}
      </section>
    `;
  }

  function renderRealHorsesView(state, dashboard) {
    const activeView = getActiveView(state, 'horses');

    return `
      <div class="page-stack">
        ${renderMetricGrid(dashboard.summary_cards || [])}
        ${dashboard.notice ? renderNoticeCard(dashboard.notice) : ''}
        ${renderSegmentedTabs(state, 'horses', dashboard.tabs || [])}
        ${
          activeView === 'groups'
            ? renderRealHorseGroups(dashboard)
            : `${renderRealHorseSearchRow(state, dashboard)}${renderRealHorseCards(state, dashboard)}`
        }
      </div>
    `;
  }

  function renderHorsesView(state) {
    const realSession = isRealSession(state);
    const realDashboard = realSession ? getRealHorseDashboard(state) : null;
    if (realDashboard) {
      return renderRealHorsesView(state, realDashboard);
    }

    if (realSession) {
      return `
        <div class="page-stack">
          <section class="panel panel--soft">
            <div class="empty-state-card">
              <strong>No pudimos cargar la tabla real de caballos.</strong>
              <span>La sesión está lista, pero la lectura del módulo falló. Probá refrescar esta vista.</span>
            </div>
          </section>
        </div>
      `;
    }

    const activeView = getActiveView(state, 'horses');

    return `
      <div class="page-stack">
        ${renderMetricGrid(DEMO_DATA.horses.metrics)}
        ${renderNoticeCard(DEMO_DATA.horses.notice)}
        ${renderSegmentedTabs(state, 'horses', DEMO_DATA.horses.tabs)}
        ${
          activeView === 'individual'
            ? `
              ${renderSearchRow('Buscar por nombre o propietario...', ['Todos', 'Grupo A', 'Grupo B', 'Individual'])}
              <section class="card-grid card-grid--three">
                ${DEMO_DATA.horses.horses
                  .map(
                    (horse) => `
                      <article class="horse-card">
                        <div class="horse-card-head">
                          <div>
                            <h2>${escapeHtml(horse.name)}</h2>
                            <span>${escapeHtml(horse.age)}</span>
                          </div>
                          ${renderBadge(horse.badge, horse.badgeTone)}
                        </div>

                        <div class="stacked-info">
                          <span>${renderIcon('owners')} ${escapeHtml(horse.owner)}</span>
                          <span>${renderIcon('pin')} ${escapeHtml(horse.paddock)}</span>
                        </div>

                        <div class="health-grid">
                          <div>
                            <dt>Desparasitación</dt>
                            <dd>${escapeHtml(horse.parasite)}</dd>
                          </div>
                          <div>
                            <dt>Herraje</dt>
                            <dd>${escapeHtml(horse.shoeing)}</dd>
                          </div>
                        </div>

                        <div class="note-bar note-bar--${escapeHtml(horse.noteTone)}">
                          ${escapeHtml(horse.note)}
                        </div>

                        <div class="split-actions">
                          <button
                            type="button"
                            class="btn btn-secondary btn-grow"
                            ${renderActionAttributes({
                              action: 'open-modal',
                              value: 'horse-history',
                              meta: { name: horse.name },
                            })}
                          >
                            Ver historial
                          </button>
                          <button
                            type="button"
                            class="btn btn-primary btn-grow"
                            ${renderActionAttributes({
                              action: 'open-modal',
                              value: 'horse-form',
                              meta: { mode: 'edit', name: horse.name },
                            })}
                          >
                            Editar
                          </button>
                        </div>
                      </article>
                    `
                  )
                  .join('')}
              </section>
            `
            : `
              <div class="align-end">
                <button
                  type="button"
                  class="btn btn-secondary"
                  ${renderActionAttributes({
                    action: 'open-modal',
                    value: 'group-form',
                    meta: { mode: 'create' },
                  })}
                >
                  ${renderIcon('plus')}
                  <span>Crear Grupo</span>
                </button>
              </div>
              <section class="card-grid card-grid--two">
                ${DEMO_DATA.horses.groups
                  .map(
                    (group) => `
                      <article class="group-card">
                        <div class="group-card-head">
                          <div>
                            <h2>${escapeHtml(group.name)}</h2>
                            <span>${escapeHtml(group.count)}</span>
                          </div>
                          ${renderBadge('Grupo', 'blue')}
                        </div>

                        <div class="location-box">
                          ${renderIcon('pin')}
                          <div>
                            <strong>${escapeHtml(group.paddock)}</strong>
                            <span>${escapeHtml(group.days)}</span>
                          </div>
                        </div>

                        <div class="member-list">
                          <span>Caballos en el grupo:</span>
                          <div class="chip-row">
                            ${group.members
                              .map((member) => `<span class="mini-chip">${escapeHtml(member)}</span>`)
                              .join('')}
                          </div>
                        </div>

                        <div class="split-actions">
                          <button
                            type="button"
                            class="btn btn-secondary btn-grow"
                            ${renderActionAttributes({
                              action: 'open-modal',
                              value: 'move-group',
                              meta: { group: group.name, paddock: group.paddock },
                            })}
                          >
                            ${renderIcon('arrow')}
                            <span>Mover grupo</span>
                          </button>
                          <button
                            type="button"
                            class="btn btn-primary btn-grow"
                            ${renderActionAttributes({
                              action: 'open-modal',
                              value: 'horse-group-detail',
                              meta: { groupName: group.name },
                            })}
                          >
                            Gestionar
                          </button>
                        </div>
                      </article>
                    `
                  )
                  .join('')}
              </section>
            `
        }
      </div>
    `;
  }

  function renderOwnersOverview() {
    return `
      ${renderSearchRow('Buscar propietarios...', [])}
      <section class="card-grid card-grid--two">
        ${DEMO_DATA.owners.owners
          .map(
            (owner) => `
              <article class="owner-card">
                <div class="owner-head">
                  <div class="avatar">${escapeHtml(owner.initials)}</div>
                  <div>
                    <h2>${escapeHtml(owner.name)}</h2>
                    ${renderBadge(owner.status, owner.statusTone)}
                  </div>
                </div>

                <div class="stacked-info stacked-info--tight">
                  <span>${renderIcon('mail')} ${escapeHtml(owner.email)}</span>
                  <span>${renderIcon('phone')} ${escapeHtml(owner.phone)}</span>
                  <span>${renderIcon('horses')} ${escapeHtml(owner.horses)}</span>
                </div>

                <div class="horse-tags">
                  ${owner.horsesList.map((horse) => `<span class="mini-chip">${escapeHtml(horse)}</span>`).join('')}
                </div>

                <dl class="owner-stats">
                  <div><dt>Tarifa mensual</dt><dd>${escapeHtml(owner.monthlyFee)}</dd></div>
                  <div><dt>Por caballo</dt><dd>${escapeHtml(owner.perHorse)}</dd></div>
                  <div><dt>Último pago</dt><dd>${escapeHtml(owner.paymentDate)}</dd></div>
                  ${
                    owner.balance
                      ? `<div><dt>Saldo pendiente</dt><dd class="text-critical">${escapeHtml(owner.balance)}</dd></div>`
                      : ''
                  }
                </dl>

                <div class="split-actions">
                  <button
                    type="button"
                    class="btn btn-secondary btn-grow"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: 'owner-detail',
                      meta: { name: owner.name },
                    })}
                  >
                    Ver detalle
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-grow"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: 'invoice-create',
                      meta: { name: owner.name },
                    })}
                  >
                    ${renderIcon('records')}
                    <span>Facturar</span>
                  </button>
                </div>
              </article>
            `
          )
          .join('')}
      </section>
    `;
  }

  function renderOwnersDistribution() {
    return `
      <section class="panel">
        <div class="panel-head">
          <h2>Distribución de Gastos Mensual</h2>
        </div>
        <p class="panel-copy">Los gastos del campo se distribuyen proporcionalmente según la cantidad de caballos de cada propietario.</p>

        <div class="finance-hero">
          <div>
            <span>Total de Gastos Mensuales</span>
            <strong>Costo por caballo: $23,559 / mes</strong>
          </div>
          <h3>$400,500</h3>
        </div>

        <div class="bar-grid">
          ${DEMO_DATA.owners.expenses
            .map(
              (item) => `
                <article class="bar-card">
                  <div class="inline-strip">
                    <span>${escapeHtml(item.label)}</span>
                    <strong>${escapeHtml(item.value)}</strong>
                  </div>
                  <div class="progress-track">
                    <span class="progress-fill progress-fill--${escapeHtml(item.tone)}" style="width:${escapeHtml(item.meter)}%"></span>
                  </div>
                </article>
              `
            )
            .join('')}
        </div>

        <div class="owner-expense-list">
          <h3>Gastos por Propietario</h3>
          ${DEMO_DATA.owners.ownerExpenses
            .map(
              (item) => `
                <article class="split-row-card">
                  <div>
                    <strong>${escapeHtml(item.name)}</strong>
                    <span>${escapeHtml(item.detail)}</span>
                  </div>
                  <div class="split-row-value">${escapeHtml(item.value)}</div>
                </article>
              `
            )
            .join('')}
        </div>
      </section>
    `;
  }

  function renderOwnersPayments() {
    return `
      <section class="panel">
        <div class="panel-head">
          <h2>Historial de Pagos - Mayo 2026</h2>
        </div>
        <div class="payment-list">
          ${DEMO_DATA.owners.payments
            .map(
              (payment) => `
                <article class="payment-row">
                  <div class="payment-main">
                    <span class="payment-icon payment-icon--${escapeHtml(payment.tone)}">${renderIcon(payment.tone === 'green' ? 'check' : payment.tone === 'warning' ? 'clock' : 'circleAlert')}</span>
                    <div>
                      <strong>${escapeHtml(payment.name)}</strong>
                      <span>${escapeHtml(payment.date)}</span>
                    </div>
                  </div>
                  <div class="payment-side">
                    <strong>${escapeHtml(payment.amount)}</strong>
                    ${renderBadge(payment.status, payment.tone)}
                  </div>
                </article>
              `
            )
            .join('')}
        </div>
      </section>
    `;
  }

  function renderOwnersView(state) {
    const activeView = getActiveView(state, 'owners');

    return `
      <div class="page-stack">
        ${renderMetricGrid(DEMO_DATA.owners.metrics)}
        ${renderNoticeCard(DEMO_DATA.owners.notice)}
        ${renderSegmentedTabs(state, 'owners', DEMO_DATA.owners.tabs)}
        ${
          activeView === 'distribution'
            ? renderOwnersDistribution()
            : activeView === 'payments'
              ? renderOwnersPayments()
              : renderOwnersOverview()
        }
      </div>
    `;
  }

  function renderRealStockSearchRow(state, dashboard, filteredItems) {
    const inventory = dashboard?.inventory || {};
    const filters = Array.isArray(inventory.filters) && inventory.filters.length
      ? inventory.filters
      : [{ key: 'all', label: 'Todas las categorías' }];
    const allItems = Array.isArray(inventory.items) ? inventory.items : [];

    return `
      <section class="toolbar-card">
        <label class="search-field">
          ${renderIcon('search')}
          <input
            type="search"
            placeholder="Buscar productos..."
            value="${escapeHtml(state?.stockFilters?.query || '')}"
            data-stock-filter="query"
          />
        </label>
        <label class="select-field">
          <select data-stock-filter="category">
            ${filters
              .map(
                (filter) => `
                  <option value="${escapeHtml(filter.key)}"${
                    filter.key === (state?.stockFilters?.category || 'all') ? ' selected' : ''
                  }>
                    ${escapeHtml(filter.label)}
                  </option>
                `
              )
              .join('')}
          </select>
        </label>
        <span class="subtle-text">
          ${escapeHtml(formatNumberLabel(filteredItems.length))} de ${escapeHtml(
            formatNumberLabel(allItems.length)
          )} productos
        </span>
      </section>
    `;
  }

  function renderRealInventoryView(state, dashboard) {
    const inventory = dashboard?.inventory || {};
    const allItems = Array.isArray(inventory.items) ? inventory.items : [];
    const filteredItems = getFilteredRealStockItems(state, dashboard);
    const stockActions = getRealStockActions(state);
    const toolbar = renderRealStockSearchRow(state, dashboard, filteredItems);

    if (!allItems.length) {
      return `
        ${toolbar}
        <section class="panel panel--soft">
          <div class="empty-state-card">
            <strong>${escapeHtml(inventory.empty_message || 'Todavía no hay items cargados en inventario.')}</strong>
            <span>Esta vista ya no rellena productos de ejemplo cuando la base está vacía.</span>
            ${
              stockActions.length
                ? `
                  <div class="action-row">
                    ${stockActions
                      .map(
                        (action) => `
                          <button
                            type="button"
                            class="btn btn-${escapeHtml(action.tone)}"
                            ${renderActionAttributes(action.trigger)}
                          >
                            ${renderIcon(action.icon)}
                            <span>${escapeHtml(action.label)}</span>
                          </button>
                        `
                      )
                      .join('')}
                  </div>
                `
                : ''
            }
          </div>
        </section>
      `;
    }

    if (!filteredItems.length) {
      return `
        ${toolbar}
        <section class="panel panel--soft">
          <div class="empty-state-card">
            <strong>No encontramos productos para ese filtro.</strong>
            <span>Probá limpiar la búsqueda o cambiar la categoría seleccionada.</span>
          </div>
        </section>
      `;
    }

    return `
      ${toolbar}
      <section class="card-grid card-grid--three">
        ${filteredItems
          .map((item) => {
            const categoryTone = getStockCategoryTone(item.category?.key);
            const healthTone = getStockHealthTone(item.health?.key);
            const noteTone =
              healthTone === 'critical'
                ? 'critical'
                : healthTone === 'warning'
                  ? 'warning'
                  : healthTone === 'green'
                    ? 'green'
                    : 'blue';

            return `
              <article class="product-card">
                <div class="product-head">
                  <span class="product-icon product-icon--${escapeHtml(categoryTone)}">${renderIcon(
                    getStockCategoryIcon(item.category?.key)
                  )}</span>
                  <div>
                    <h2>${escapeHtml(item.name)}</h2>
                    <div class="chip-row">
                      ${renderBadge(item.category?.label || 'General', categoryTone)}
                      ${renderBadge(
                        item.health?.label || 'Sin estado',
                        healthTone === 'blue' ? 'gray' : healthTone
                      )}
                    </div>
                  </div>
                </div>

                <div class="stock-block">
                  <span>Stock actual</span>
                  <strong>${escapeHtml(formatStockValueLabel(item.current_stock, item.unit))}</strong>
                </div>
                <div class="progress-track" aria-hidden="true">
                  <span
                    class="progress-fill progress-fill--${escapeHtml(
                      healthTone === 'critical'
                        ? 'critical'
                        : healthTone === 'warning'
                          ? 'warning'
                          : healthTone === 'green'
                            ? 'green'
                            : 'blue'
                    )}"
                    style="width:${escapeHtml(String(item.health?.meter_percent || 0))}%"
                  ></span>
                </div>
                <span class="subtle-text">
                  Mínimo: ${escapeHtml(formatStockValueLabel(item.minimum_stock, item.unit))}
                </span>

                <dl class="product-facts">
                  <div><dt>Costo compra</dt><dd>${escapeHtml(formatStockPurchaseCostLabel(item))}</dd></div>
                  <div><dt>Equivale a</dt><dd>${escapeHtml(formatStockEquivalentCostLabel(item))}</dd></div>
                  <div><dt>Presentación</dt><dd>${escapeHtml(formatStockPurchasePresentationLabel(item))}</dd></div>
                  <div><dt>Proveedor</dt><dd>${escapeHtml(item.supplier || 'Sin datos')}</dd></div>
                  <div><dt>Última compra</dt><dd>${escapeHtml(formatCompactDateLabel(item.last_purchase_date))}</dd></div>
                  <div><dt>Último movimiento</dt><dd>${escapeHtml(formatCompactDateLabel(item.last_movement_date))}</dd></div>
                </dl>

                <div class="note-bar note-bar--${escapeHtml(noteTone)}">
                  ${escapeHtml(item.health?.helper || 'Sin observaciones operativas para este producto.')}
                </div>

                <div class="split-actions">
                  <button
                    type="button"
                    class="btn btn-secondary btn-grow"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: 'product-form',
                      meta: { mode: 'edit', itemId: item.id },
                    })}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-grow"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: 'purchase-create',
                      meta: { itemId: item.id },
                    })}
                  >
                    ${renderIcon('cart')}
                    <span>Ingresar stock</span>
                  </button>
                </div>
              </article>
            `;
          })
          .join('')}
      </section>
    `;
  }

  function renderRealMovementsView(dashboard) {
    const movementPanel = dashboard?.movement_panel || {};
    const entries = Array.isArray(movementPanel.entries) ? movementPanel.entries : [];
    const statusMeta = getStockPanelStatusMeta(movementPanel.status);

    return `
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>${escapeHtml(movementPanel.title || 'Movimientos de stock')}</h2>
            ${
              movementPanel.message
                ? `<span class="subtle-text">${escapeHtml(movementPanel.message)}</span>`
                : ''
            }
          </div>
          ${renderBadge(statusMeta.label, statusMeta.tone)}
        </div>

        ${
          entries.length
            ? `
              <div class="movement-list">
                ${entries
                  .map((entry) => {
                    const movementMeta = getStockMovementMeta(entry.event_type);
                    const quantityLabel = `${movementMeta.quantityPrefix}${formatStockValueLabel(
                      entry.quantity,
                      entry.unit
                    )}`;

                    return `
                      <article class="movement-row">
                        <div class="movement-main">
                          <span class="movement-icon movement-icon--${escapeHtml(movementMeta.tone)}">${renderIcon(
                            movementMeta.icon
                          )}</span>
                          <div>
                            <strong>${escapeHtml(entry.item_name)}</strong>
                            <div class="chip-row">
                              ${renderBadge(movementMeta.label, movementMeta.tone === 'blue' ? 'blue' : movementMeta.tone)}
                              ${entry.notes ? `<span class="subtle-text">${escapeHtml(entry.notes)}</span>` : ''}
                            </div>
                          </div>
                        </div>
                        <div class="movement-side">
                          <strong>${escapeHtml(quantityLabel)}</strong>
                          <span>${escapeHtml(formatCompactDateLabel(entry.event_date))}</span>
                          <button
                            type="button"
                            class="table-icon-button table-icon-button--danger"
                            title="Eliminar movimiento"
                            aria-label="Eliminar movimiento"
                            ${renderActionAttributes({
                              action: 'delete-stock-movement',
                              meta: { stockEventId: entry.id },
                            })}
                          >
                            ${renderIcon('close')}
                          </button>
                        </div>
                      </article>
                    `;
                  })
                  .join('')}
              </div>
            `
            : `
              <div class="empty-state-card">
                <strong>${escapeHtml(movementPanel.empty_message || 'Todavía no hay movimientos registrados.')}</strong>
                <span>Mostramos únicamente historial real cuando existe en la base.</span>
              </div>
            `
        }
      </section>
    `;
  }

  function renderRealAccountingView(state, dashboard) {
    const accountingPanel = dashboard?.accounting_panel || {};
    const statusMeta = getStockPanelStatusMeta(accountingPanel.status);
    const readinessRows = buildRealStockAccountingRows(dashboard);
    const stockActions = getRealStockActions(state);
    const periodLabel = formatMonthLabel(accountingPanel?.period?.month);
    const summaryCards = Array.isArray(accountingPanel.summary_cards)
      ? accountingPanel.summary_cards.map((card) => ({
          ...card,
          value: formatAccountingMetricValue(card),
        }))
      : [];

    return `
      <div class="page-stack">
        ${summaryCards.length ? renderMetricGrid(summaryCards) : ''}

        <section class="panel">
          <div class="panel-head">
            <div>
              <h2>${escapeHtml(accountingPanel.title || 'Contabilidad operativa')}</h2>
              ${
                accountingPanel.message
                  ? `<span class="subtle-text">${escapeHtml(accountingPanel.message)}</span>`
                  : ''
              }
            </div>
            <div class="action-row">
              ${renderBadge(statusMeta.label, statusMeta.tone)}
              ${stockActions
                .map(
                  (action) => `
                    <button
                      type="button"
                      class="btn btn-${escapeHtml(action.tone)}"
                      ${renderActionAttributes(action.trigger)}
                    >
                      ${renderIcon(action.icon)}
                      <span>${escapeHtml(action.label)}</span>
                    </button>
                  `
                )
                .join('')}
            </div>
          </div>

          <div class="summary-list">
            ${readinessRows
              .map(
                (row) => `
                  <div class="summary-list-row">
                    <span>${escapeHtml(row.label)}</span>
                    <strong>${escapeHtml(row.value)}</strong>
                  </div>
                `
              )
              .join('')}
          </div>
        </section>

        <div class="bar-grid">
          ${renderAccountingChartPanel(accountingPanel.monthly_cost_chart, periodLabel)}
          ${renderAccountingServiceGapPanel(accountingPanel.service_gaps, periodLabel)}
        </div>

        ${renderAccountingHorseCostPanel(accountingPanel.horse_costs, periodLabel)}
        ${renderAccountingProductCostPanel(accountingPanel.product_costs, periodLabel)}
      </div>
    `;
  }

  function renderRealStockView(state, dashboard) {
    const activeView = getActiveView(state, 'stock');

    return `
      <div class="page-stack">
        ${renderMetricGrid(buildRealStockMetrics(dashboard))}
        ${renderNoticeCard(buildRealStockNotice(dashboard))}
        ${renderSegmentedTabs(state, 'stock', dashboard.tabs || [])}
        ${
          activeView === 'movements'
            ? renderRealMovementsView(dashboard)
            : activeView === 'accounting'
              ? renderRealAccountingView(state, dashboard)
              : renderRealInventoryView(state, dashboard)
        }
      </div>
    `;
  }

  function renderDemoInventoryView() {
    return `
      ${renderSearchRow('Buscar productos...', DEMO_DATA.stock.categories)}
      <section class="card-grid card-grid--three">
        ${DEMO_DATA.stock.products
          .map(
            (product) => `
              <article class="product-card">
                <div class="product-head">
                  <span class="product-icon product-icon--${escapeHtml(product.categoryTone)}">${renderIcon(product.icon)}</span>
                  <div>
                    <h2>${escapeHtml(product.name)}</h2>
                    ${renderBadge(product.category, product.categoryTone)}
                  </div>
                </div>

                <div class="stock-block">
                  <span>Stock Actual</span>
                  <strong>${escapeHtml(product.current)}<small>${escapeHtml(product.unit)}</small></strong>
                </div>
                <div class="progress-track">
                  <span class="progress-fill progress-fill--${escapeHtml(product.tone)}" style="width:${escapeHtml(product.meter)}%"></span>
                </div>
                <span class="subtle-text">Mínimo: ${escapeHtml(product.minimum)}</span>

                <dl class="product-facts">
                  <div><dt>Costo unitario</dt><dd>${escapeHtml(product.cost)}</dd></div>
                  <div><dt>Proveedor</dt><dd>${escapeHtml(product.supplier)}</dd></div>
                  <div><dt>Última compra</dt><dd>${escapeHtml(product.lastPurchase)}</dd></div>
                </dl>

                <div class="split-actions">
                  <button
                    type="button"
                    class="btn btn-secondary btn-grow"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: 'product-form',
                      meta: { mode: 'edit', name: product.name },
                    })}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary btn-grow"
                    ${renderActionAttributes({
                      action: 'open-modal',
                      value: 'purchase-create',
                      meta: { name: product.name, supplier: product.supplier },
                    })}
                  >
                    ${renderIcon('cart')}
                    <span>Comprar</span>
                  </button>
                </div>
              </article>
            `
          )
          .join('')}
      </section>
    `;
  }

  function renderDemoMovementsView() {
    return `
      <section class="panel">
        <div class="panel-head">
          <h2>Últimos Movimientos</h2>
          <button
            type="button"
            class="btn btn-secondary"
            ${renderActionAttributes({
              action: 'toast',
              message: 'Exportación dummy preparada. Después la conectamos a CSV y PDF reales.',
            })}
          >
            ${renderIcon('download')}
            <span>Exportar</span>
          </button>
        </div>

        <div class="movement-list">
          ${DEMO_DATA.stock.movements
            .map(
              (item) => `
                <article class="movement-row">
                  <div class="movement-main">
                    <span class="movement-icon movement-icon--${escapeHtml(item.amountTone === 'green' ? 'green' : 'critical')}">${renderIcon(item.amountTone === 'green' ? 'trendUp' : 'trendDown')}</span>
                    <div>
                      <strong>${escapeHtml(item.title)}</strong>
                      <div class="chip-row">
                        ${item.tags
                          .map((tag, index) =>
                            index === 0
                              ? renderBadge(tag, tag === 'Pensión' ? 'purple' : tag === 'Alimento' ? 'green' : tag === 'Fertilizante' ? 'blue' : tag === 'Salud' ? 'critical' : 'orange')
                              : `<span class="subtle-text">${escapeHtml(tag)}</span>`
                          )
                          .join('')}
                      </div>
                    </div>
                  </div>
                  <div class="movement-side">
                    <strong class="text-${escapeHtml(item.amountTone)}">${escapeHtml(item.amount)}</strong>
                    <span>${escapeHtml(item.date)}</span>
                  </div>
                </article>
              `
            )
            .join('')}
        </div>
      </section>
    `;
  }

  function renderDemoAccountingView() {
    return `
      <div class="accounting-grid">
        <section class="panel">
          <div class="panel-head">
            <h2>Ingresos por Categoría</h2>
          </div>
          <div class="bar-stack">
            ${DEMO_DATA.stock.incomeBars
              .map(
                (item) => `
                  <article class="bar-row">
                    <div class="inline-strip">
                      <span>${escapeHtml(item.label)}</span>
                      <strong>${escapeHtml(item.value)}</strong>
                    </div>
                    <div class="progress-track">
                      <span class="progress-fill progress-fill--${escapeHtml(item.tone)}" style="width:${escapeHtml(item.meter)}%"></span>
                    </div>
                    <span class="subtle-text">100.0% del total</span>
                  </article>
                `
              )
              .join('')}
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Gastos por Categoría</h2>
          </div>
          <div class="bar-stack">
            ${DEMO_DATA.stock.expenseBars
              .map(
                (item) => `
                  <article class="bar-row">
                    <div class="inline-strip">
                      <span>${escapeHtml(item.label)}</span>
                      <strong class="text-critical">${escapeHtml(item.value)}</strong>
                    </div>
                    <div class="progress-track">
                      <span class="progress-fill progress-fill--${escapeHtml(item.tone)}" style="width:${escapeHtml(item.meter)}%"></span>
                    </div>
                  </article>
                `
              )
              .join('')}
          </div>
        </section>

        <section class="balance-banner">
          <div>
            <span>Balance Total del Mes</span>
            <h2>$209,500</h2>
            <p>Ingresos: $450,000 - Gastos: $240,500</p>
          </div>
          <div class="balance-watermark">$</div>
        </section>
      </div>
    `;
  }

  function renderStockView(state) {
    const realSession = isRealSession(state);
    const realDashboard = realSession ? getRealStockDashboard(state) : null;
    if (realDashboard) {
      return renderRealStockView(state, realDashboard);
    }

    if (realSession) {
      return `
        <div class="page-stack">
          <section class="panel panel--soft">
            <div class="empty-state-card">
              <strong>No pudimos cargar la lectura real de stock.</strong>
              <span>Probá refrescar la vista. Mientras tanto evitamos mezclar esta pantalla con datos inventados.</span>
            </div>
          </section>
        </div>
      `;
    }

    const activeView = getActiveView(state, 'stock');

    return `
      <div class="page-stack">
        ${renderMetricGrid(DEMO_DATA.stock.metrics)}
        ${renderNoticeCard(DEMO_DATA.stock.notice)}
        ${renderSegmentedTabs(state, 'stock', DEMO_DATA.stock.tabs)}
        ${
          activeView === 'movements'
            ? renderDemoMovementsView()
            : activeView === 'accounting'
              ? renderDemoAccountingView()
              : renderDemoInventoryView()
        }
      </div>
    `;
  }

  function renderRealCalendarView(state) {
    const weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    const calendarData = buildRealCalendarData(state);
    const taskFilter = state.calendarTaskFilter || 'pending';
    const visibleTasks =
      taskFilter === 'completed'
        ? calendarData.completedTasks
        : taskFilter === 'all'
          ? calendarData.allTasks
          : calendarData.pendingTasks;
    const agendaTasks = calendarData.pendingTasks.slice(0, 4);
    const summaryItems = [
      { label: 'Tareas pendientes', value: String(calendarData.pendingTasks.length), tone: 'neutral' },
      { label: 'Completadas', value: String(calendarData.completedTasks.length), tone: 'green' },
      { label: 'Urgentes', value: String(calendarData.urgentCount), tone: calendarData.urgentCount > 0 ? 'critical' : 'green' },
      { label: 'Salud', value: String(calendarData.healthCount), tone: 'neutral' },
      { label: 'Trabajos de campo', value: String(calendarData.workCount), tone: 'neutral' },
    ];
    const notice =
      calendarData.urgentCount > 0
        ? {
            tone: 'warning',
            title: `Tienes ${calendarData.urgentCount} tareas urgentes pendientes`,
            description: 'Revisa las actividades reales marcadas como prioritarias para evitar retrasos.',
          }
        : calendarData.pendingTasks.length > 0
          ? {
              tone: 'green',
              title: `${calendarData.pendingTasks.length} tareas pendientes en este mes`,
              description: 'El calendario combina vencimientos reales y eventos ya registrados en la base.',
            }
          : {
              tone: 'green',
              title: 'Sin tareas urgentes en el mes seleccionado',
              description: 'Seguimos mostrando eventos reales del calendario aunque no haya pendientes críticos.',
            };

    return `
      <div class="page-stack">
        ${renderNoticeCard(notice)}

        <section class="calendar-layout">
          <article class="panel panel--calendar">
            <div class="panel-head">
              <h2>Calendario</h2>
            </div>
            <div class="calendar-box">
              <div class="calendar-month">
                <button type="button" class="month-button" data-action="calendar-shift" data-value="-1">‹</button>
                <strong>${escapeHtml(formatMonthYear(calendarData.monthRange.start_date_object))}</strong>
                <button type="button" class="month-button" data-action="calendar-shift" data-value="1">›</button>
              </div>
              <div class="calendar-grid">
                ${weekDays.map((day) => `<span class="calendar-weekday">${day}</span>`).join('')}
                ${buildCalendarGridCells(calendarData)
                  .map((cell) =>
                    cell.inMonth
                      ? `
                        <button
                          type="button"
                          class="calendar-day calendar-day-button${cell.isSelected ? ' is-selected' : ''}${cell.isToday ? ' is-today' : ''}${cell.hasItems ? ' has-items' : ''}"
                          data-action="select-calendar-day"
                          data-value="${escapeHtml(cell.dateIso)}"
                        >
                          <span>${escapeHtml(cell.label)}</span>
                          <small class="calendar-day-meta">${cell.count > 0 ? escapeHtml(String(cell.count)) : ''}</small>
                        </button>
                      `
                      : `
                        <span class="calendar-day calendar-day--muted">
                          ${escapeHtml(cell.label)}
                        </span>
                      `
                  )
                  .join('')}
              </div>
            </div>
            ${
              calendarData.monthState?.loading
                ? `<div class="calendar-inline-banner">Cargando eventos reales del mes...</div>`
                : ''
            }
            ${
              calendarData.monthState?.error
                ? `<div class="calendar-inline-banner calendar-inline-banner--warning">${escapeHtml(
                    calendarData.monthState.error
                  )}</div>`
                : ''
            }
            <div class="calendar-day-panel">
              <h3>Actividades para ${escapeHtml(formatDateLabel(calendarData.selectedDate))}</h3>
              ${
                calendarData.selectedDateTasks.length
                  ? `
                    <div class="calendar-day-items">
                      ${calendarData.selectedDateTasks
                        .map(
                          (task) => `
                            <article class="calendar-day-item">
                              <div class="calendar-day-item-main">
                                <span class="task-icon">${renderIcon(task.icon)}</span>
                                <div>
                                  <strong>${escapeHtml(task.title)}</strong>
                                  <span>${escapeHtml(task.detail)}</span>
                                </div>
                              </div>
                              ${renderBadge(task.tag, task.priorityTone === 'critical' ? 'critical' : task.priorityTone === 'green' ? 'green' : 'warning')}
                            </article>
                          `
                        )
                        .join('')}
                    </div>
                  `
                  : `
                    <div class="calendar-empty">
                      <p>No hay actividades registradas para este día.</p>
                    </div>
                  `
              }
            </div>
          </article>

          <div class="side-stack">
            <article class="panel">
              <div class="panel-head">
                <h2>Próximas Tareas</h2>
              </div>
              ${
                agendaTasks.length
                  ? `
                    <div class="agenda-list">
                      ${agendaTasks
                        .map(
                          (task) => `
                            <article class="agenda-card agenda-card--${escapeHtml(task.agendaTone)}">
                              <strong>${escapeHtml(task.title)}</strong>
                              <span>${escapeHtml(task.dateLabel)}</span>
                              <p>${escapeHtml(task.detail)}</p>
                              ${renderBadge(task.tag, task.priorityTone === 'critical' ? 'critical' : task.priorityTone === 'green' ? 'green' : 'warning')}
                            </article>
                          `
                        )
                        .join('')}
                    </div>
                  `
                  : `
                    <div class="empty-state-card">
                      <strong>Sin próximas tareas.</strong>
                      <span>No encontramos pendientes reales para este mes.</span>
                    </div>
                  `
              }
              <button
                type="button"
                class="btn btn-secondary btn-block"
                data-action="set-calendar-filter"
                data-value="all"
                data-anchor-target="calendar-task-list"
              >
                Ver todas las tareas
              </button>
            </article>

            <article class="panel">
              <div class="panel-head">
                <h2>Resumen</h2>
              </div>
              <div class="summary-list">
                ${summaryItems
                  .map(
                    (item) => `
                      <div class="summary-list-row">
                        <span>${escapeHtml(item.label)}</span>
                        ${
                          item.tone === 'neutral'
                            ? `<strong>${escapeHtml(item.value)}</strong>`
                            : renderBadge(item.value, item.tone)
                        }
                      </div>
                    `
                  )
                  .join('')}
              </div>
            </article>
          </div>
        </section>

        <section id="calendar-task-list" class="panel calendar-task-section">
          <div class="panel-head">
            <h2>Todas las Tareas</h2>
          </div>
          <div class="wide-segments">
            <button type="button" class="wide-segment${taskFilter === 'pending' ? ' is-active' : ''}" data-action="set-calendar-filter" data-value="pending">Pendientes (${escapeHtml(String(calendarData.pendingTasks.length))})</button>
            <button type="button" class="wide-segment${taskFilter === 'completed' ? ' is-active' : ''}" data-action="set-calendar-filter" data-value="completed">Completadas (${escapeHtml(String(calendarData.completedTasks.length))})</button>
            <button type="button" class="wide-segment${taskFilter === 'all' ? ' is-active' : ''}" data-action="set-calendar-filter" data-value="all">Todas (${escapeHtml(String(calendarData.allTasks.length))})</button>
          </div>
          ${
            visibleTasks.length
              ? `
                <div class="task-list">
                  ${visibleTasks
                    .map(
                      (task) => `
                        <article class="task-row">
                          <div class="task-main">
                            <span class="task-icon">${renderIcon(task.icon)}</span>
                            <div>
                              <strong>${escapeHtml(task.title)}</strong>
                              <span>${escapeHtml(task.detail)}</span>
                            </div>
                          </div>
                          <div class="task-side">
                            <span>${escapeHtml(task.dateLabel)}</span>
                            ${renderBadge(task.priority, task.priorityTone === 'critical' ? 'critical' : task.priorityTone === 'green' ? 'green' : 'warning')}
                          </div>
                          <button
                            type="button"
                            class="text-action"
                            ${renderActionAttributes({
                              action: 'open-modal',
                              value: 'task-detail',
                              meta: {
                                taskKey: task.key,
                                month: calendarData.monthKey,
                              },
                            })}
                          >
                            Ver
                          </button>
                        </article>
                      `
                    )
                    .join('')}
                </div>
              `
              : `
                <div class="empty-state-card">
                  <strong>No hay elementos para este filtro.</strong>
                  <span>Probá cambiar entre pendientes, completadas o todas.</span>
                </div>
              `
          }
        </section>
      </div>
    `;
  }

  function renderCalendarView(state) {
    if (isRealSession(state)) {
      return renderRealCalendarView(state);
    }

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const cells = ['26', '27', '28', '29', '30', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '1', '2', '3', '4', '5', '6'];
    const monthDate = new Date(2026, 4 + (state.calendarMonthOffset || 0), 1);
    const taskFilter = state.calendarTaskFilter || 'pending';
    const visibleTasks =
      taskFilter === 'completed'
        ? DEMO_DATA.calendar.completedTasks
        : taskFilter === 'all'
          ? [...DEMO_DATA.calendar.tasks, ...DEMO_DATA.calendar.completedTasks]
          : DEMO_DATA.calendar.tasks;

    return `
      <div class="page-stack">
        ${renderNoticeCard(DEMO_DATA.calendar.notice)}

        <section class="calendar-layout">
          <article class="panel panel--calendar">
            <div class="panel-head">
              <h2>Calendario</h2>
            </div>
            <div class="calendar-box">
              <div class="calendar-month">
                <button type="button" class="month-button" data-action="calendar-shift" data-value="-1">‹</button>
                <strong>${escapeHtml(formatMonthYear(monthDate))}</strong>
                <button type="button" class="month-button" data-action="calendar-shift" data-value="1">›</button>
              </div>
              <div class="calendar-grid">
                ${weekDays.map((day) => `<span class="calendar-weekday">${day}</span>`).join('')}
                ${cells
                  .map(
                    (day) => `
                      <span class="calendar-day${day === '22' ? ' is-selected' : ''}">
                        ${escapeHtml(day)}
                      </span>
                    `
                  )
                  .join('')}
              </div>
            </div>
            <div class="calendar-empty">
              <h3>Tareas para 22 de mayo</h3>
              <p>No hay tareas programadas para este día</p>
            </div>
          </article>

          <div class="side-stack">
            <article class="panel">
              <div class="panel-head">
                <h2>Próximas Tareas</h2>
              </div>
              <div class="agenda-list">
                ${DEMO_DATA.calendar.sidebarTasks
                  .map(
                    (task) => `
                      <article class="agenda-card agenda-card--${escapeHtml(task.tone)}">
                        <strong>${escapeHtml(task.title)}</strong>
                        <span>${escapeHtml(task.date)}</span>
                        <p>${escapeHtml(task.subtitle)}</p>
                        ${renderBadge(task.tag, task.tone === 'critical' ? 'critical' : task.tone === 'green' ? 'green' : 'warning')}
                      </article>
                    `
                  )
                  .join('')}
              </div>
              <button
                type="button"
                class="btn btn-secondary btn-block"
                data-action="set-calendar-filter"
                data-value="all"
                data-anchor-target="calendar-task-list"
              >
                Ver todas las tareas
              </button>
            </article>

            <article class="panel">
              <div class="panel-head">
                <h2>Resumen</h2>
              </div>
              <div class="summary-list">
                ${DEMO_DATA.calendar.summary
                  .map(
                    (item) => `
                      <div class="summary-list-row">
                        <span>${escapeHtml(item.label)}</span>
                        ${item.tone === 'neutral' ? `<strong>${escapeHtml(item.value)}</strong>` : renderBadge(item.value, item.tone)}
                      </div>
                    `
                  )
                  .join('')}
              </div>
            </article>
          </div>
        </section>

        <section id="calendar-task-list" class="panel calendar-task-section">
          <div class="panel-head">
            <h2>Todas las Tareas</h2>
          </div>
          <div class="wide-segments">
            <button type="button" class="wide-segment${taskFilter === 'pending' ? ' is-active' : ''}" data-action="set-calendar-filter" data-value="pending">Pendientes (4)</button>
            <button type="button" class="wide-segment${taskFilter === 'completed' ? ' is-active' : ''}" data-action="set-calendar-filter" data-value="completed">Completadas (2)</button>
            <button type="button" class="wide-segment${taskFilter === 'all' ? ' is-active' : ''}" data-action="set-calendar-filter" data-value="all">Todas (6)</button>
          </div>
          <div class="task-list">
            ${visibleTasks
              .map(
                (task) => `
                  <article class="task-row">
                    <div class="task-main">
                      <span class="task-icon">${renderIcon(task.tag === 'Movimiento' ? 'owners' : task.tag === 'Salud' ? 'health' : 'work')}</span>
                      <div>
                        <strong>${escapeHtml(task.title)}</strong>
                        <span>${escapeHtml(task.detail)}</span>
                      </div>
                    </div>
                    <div class="task-side">
                      <span>${escapeHtml(task.date)}</span>
                      ${renderBadge(task.priority, task.priorityTone)}
                    </div>
                    <button
                      type="button"
                      class="text-action"
                      ${renderActionAttributes({
                        action: 'open-modal',
                        value: 'task-detail',
                        meta: {
                          title: task.title,
                          detail: task.detail,
                          tag: task.tag,
                          date: task.date,
                          priority: task.priority,
                        },
                      })}
                    >
                      Ver
                    </button>
                  </article>
                `
              )
              .join('')}
          </div>
        </section>
      </div>
    `;
  }

  function renderRecordsTimeline() {
    return `
      <section class="panel">
        <div class="timeline-list">
          ${DEMO_DATA.records.timeline
            .map(
              (item) => `
                <article class="timeline-row">
                  <span class="timeline-icon timeline-icon--${escapeHtml(item.tone)}">${renderIcon(item.icon)}</span>
                  <div class="timeline-body">
                    <div class="timeline-title">
                      <strong>${escapeHtml(item.title)}</strong>
                      ${renderBadge(item.tag, item.tone)}
                    </div>
                    <p>${escapeHtml(item.detail)}</p>
                    <span>${escapeHtml(item.meta)}</span>
                  </div>
                  <div class="timeline-age">${escapeHtml(item.age)}</div>
                </article>
              `
            )
            .join('')}
        </div>
      </section>
    `;
  }

  function renderRecordsCategories() {
    return `
      <div class="stack-gap">
        ${DEMO_DATA.records.byCategory
          .map(
            (group) => `
              <section class="panel">
                <div class="panel-head">
                  <h2>${escapeHtml(group.name)}</h2>
                </div>
                <div class="category-records">
                  ${group.items
                    .map(
                      (item) => `
                        <article class="category-record">
                          <span>${escapeHtml(item)}</span>
                        </article>
                      `
                    )
                    .join('')}
                </div>
              </section>
            `
          )
          .join('')}
      </div>
    `;
  }

  function renderRecordsView(state) {
    return `
      <div class="page-stack">
        ${renderMetricGrid(DEMO_DATA.records.metrics)}

        <section class="info-banner">
          <div class="info-banner-icon">${renderIcon('telegram')}</div>
          <div>
            <strong>${escapeHtml(DEMO_DATA.records.infoBanner.title)}</strong>
            <p>${escapeHtml(DEMO_DATA.records.infoBanner.description)}</p>
          </div>
          <button
            type="button"
            class="btn btn-secondary"
            ${renderActionAttributes({
              action: 'open-modal',
              value: 'commands',
            })}
          >
            Ver comandos disponibles
          </button>
        </section>

        ${renderSearchRow('Buscar en registros...', ['Todos los tipos'])}
        ${renderSegmentedTabs(state, 'records', DEMO_DATA.records.tabs)}
        ${getActiveView(state, 'records') === 'categories' ? renderRecordsCategories() : renderRecordsTimeline()}
      </div>
    `;
  }

  function renderSettingsAccount(state) {
    const account = getSessionAccount(state);
    const identityLine = account.email || account.username || 'Sin email configurado';

    return `
      <div class="stack-gap">
        <section class="hero-banner">
          <div class="hero-banner-main">
            <div class="account-avatar account-avatar--large">${escapeHtml(account.initials)}</div>
            <div>
              <div class="hero-title-row">
                <h2>${escapeHtml(account.displayName)}</h2>
                ${renderBadge(account.role, account.isDemo ? 'orange' : 'green')}
              </div>
              <p>Este es el acceso principal con el que entras al admin nuevo del campo.</p>
              <span class="subtle-text">${escapeHtml(`${identityLine} · ${account.farmName}`)}</span>
            </div>
          </div>
          <div class="action-row">
            <button
              type="button"
              class="btn btn-secondary"
              ${renderActionAttributes({
                navKey: 'settings',
                viewNav: 'settings',
                viewKey: 'security',
              })}
            >
              Ver seguridad
            </button>
            <button type="button" class="btn btn-primary" data-action="logout">Cerrar sesión</button>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Datos de la cuenta</h2>
          </div>
          <div class="form-stack">
            <label class="field-block">
              <span>Nombre visible</span>
              <input type="text" value="${escapeHtml(account.displayName)}" readonly />
            </label>
            <label class="field-block">
              <span>Email o usuario</span>
              <input type="text" value="${escapeHtml(identityLine)}" readonly />
            </label>
            <label class="field-block">
              <span>Rol</span>
              <input type="text" value="${escapeHtml(account.role)}" readonly />
            </label>
            <label class="field-block">
              <span>Campo actual</span>
              <input type="text" value="${escapeHtml(account.farmName)}" readonly />
            </label>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Accesos rápidos</h2>
          </div>
          <div class="toggle-list">
            <article class="toggle-card">
              <div>
                <strong>Credenciales y acceso</strong>
                <span>Cambia tu password y revisa cómo quieres proteger la cuenta.</span>
              </div>
              <button
                type="button"
                class="btn btn-secondary"
                ${renderActionAttributes({
                  navKey: 'settings',
                  viewNav: 'settings',
                  viewKey: 'security',
                })}
              >
                Abrir seguridad
              </button>
            </article>
            <article class="toggle-card">
              <div>
                <strong>Salir del admin</strong>
                <span>Cierra la sesión actual desde este mismo dispositivo.</span>
              </div>
              <button type="button" class="btn btn-secondary" data-action="logout">Cerrar sesión</button>
            </article>
          </div>
        </section>
      </div>
    `;
  }

  function renderSettingsSecurity(state) {
    const account = getSessionAccount(state);
    const identityLine = account.email || account.username || 'Sin email configurado';

    return `
      <div class="stack-gap">
        <section class="panel">
          <div class="panel-head">
            <h2>Seguridad de acceso</h2>
          </div>
          <div class="toggle-list">
            <article class="toggle-card">
              <div>
                <strong>Password</strong>
                <span>Actualiza la credencial con la que entras a este admin.</span>
              </div>
              <button
                type="button"
                class="btn btn-secondary"
                ${renderActionAttributes({
                  action: 'open-modal',
                  value: 'account-password',
                })}
              >
                Cambiar password
              </button>
            </article>
            <article class="toggle-card">
              <div>
                <strong>Sesión actual</strong>
                <span>${escapeHtml(`Conectado como ${identityLine}`)}</span>
              </div>
              <button type="button" class="btn btn-secondary" data-action="logout">Cerrar sesión</button>
            </article>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Zona de peligro</h2>
          </div>
          <article class="danger-card">
            <div class="danger-card-copy">
              <strong>Eliminar cuenta</strong>
              <span>Vamos a pedir confirmación reforzada y aclarar si se elimina tu usuario o la cuenta completa del campo.</span>
            </div>
            <button
              type="button"
              class="btn btn-danger"
              ${renderActionAttributes({
                action: 'open-modal',
                value: 'account-delete',
              })}
            >
              Eliminar cuenta
            </button>
          </article>
        </section>
      </div>
    `;
  }

  function renderSettingsTelegram(state) {
    return `
      <div class="stack-gap">
        <section class="hero-banner">
          <div class="hero-banner-main">
            <span class="hero-icon">${renderIcon('telegram')}</span>
            <div>
              <div class="hero-title-row">
                <h2>Telegram Bot</h2>
                ${renderBadge('Activo', 'green')}
              </div>
              <p>Registra actividades desde el campo enviando mensajes al bot. Perfecto cuando no tienes acceso a una computadora.</p>
              ${
                state.telegramLink && state.telegramLink.botUsername
                  ? `<span class="subtle-text">Bot conectado: @${escapeHtml(state.telegramLink.botUsername)}</span>`
                  : ''
              }
            </div>
          </div>
          <div class="action-row">
            <button
              type="button"
              class="btn btn-secondary"
              ${renderActionAttributes({
                action: 'open-modal',
                value: 'commands',
              })}
            >
              Ver comandos
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              ${renderActionAttributes({
                action: 'open-telegram-bot',
              })}
            >
              Abrir en Telegram
            </button>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Configuración del Bot</h2>
          </div>
          <div class="form-stack">
            <label class="field-block">
              <span>Token del Bot</span>
              <div class="field-inline">
                <input type="text" value="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz" readonly />
                <button
                  type="button"
                  class="icon-button icon-button--field"
                  ${renderActionAttributes({
                    action: 'toast',
                    message: 'Token copiado en demo. Luego conectamos el portapapeles real.',
                  })}
                >
                  ${renderIcon('copy')}
                </button>
              </div>
              <small>Token proporcionado por @BotFather en Telegram</small>
            </label>
            <label class="field-block">
              <span>Chat ID Autorizado</span>
              <input type="text" value="123456789" readonly />
              <small>Solo este usuario puede enviar comandos al bot</small>
            </label>
            <button
              type="button"
              class="btn btn-primary"
              ${renderActionAttributes({
                action: 'toast',
                message: 'Configuración del bot guardada en modo dummy.',
              })}
            >
              Guardar cambios
            </button>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Comandos Disponibles</h2>
          </div>
          <div class="command-list">
            ${DEMO_DATA.settings.commands
              .map(
                (item) => `
                  <article class="command-card">
                    <code>${escapeHtml(item.command)}</code>
                    <div>
                      <strong>${escapeHtml(item.description)}</strong>
                      <span>Ejemplo: ${escapeHtml(item.example)}</span>
                    </div>
                  </article>
                `
              )
              .join('')}
          </div>
        </section>
      </div>
    `;
  }

  function renderSettingsGeneral() {
    return `
      <div class="stack-gap">
        <section class="panel">
          <div class="panel-head">
            <h2>Información del Campo</h2>
          </div>
          <div class="form-stack">
            <label class="field-block">
              <span>Nombre del Campo</span>
              <input type="text" value="Mi Campo" readonly />
            </label>
            <label class="field-block">
              <span>Ubicación</span>
              <div class="field-inline">
                <input type="text" value="Buenos Aires, Argentina" readonly />
                <button
                  type="button"
                  class="icon-button icon-button--field"
                  ${renderActionAttributes({
                    action: 'toast',
                    message: 'Mapa y geolocalización quedan para la conexión real.',
                  })}
                >
                  ${renderIcon('pin')}
                </button>
              </div>
            </label>
            <label class="field-block">
              <span>Hectáreas Totales</span>
              <input type="text" value="47.3" readonly />
            </label>
            <button
              type="button"
              class="btn btn-primary"
              ${renderActionAttributes({
                action: 'toast',
                message: 'Datos generales guardados en demo.',
              })}
            >
              Guardar cambios
            </button>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Clima</h2>
          </div>
          <article class="toggle-card">
            <div>
              <strong>Estación meteorológica automática</strong>
              <span>Sincroniza datos de lluvia automáticamente</span>
            </div>
            <span class="toggle-switch"></span>
          </article>
          <label class="field-block">
            <span>API Key</span>
            <input type="text" placeholder="Ingresa tu API key" readonly />
          </label>
        </section>
      </div>
    `;
  }

  function renderSettingsNotifications() {
    return `
      <div class="stack-gap">
        <section class="panel">
          <div class="panel-head">
            <h2>Alertas</h2>
          </div>
          <div class="toggle-list">
            ${DEMO_DATA.settings.notificationRules
              .map(
                (item) => `
                  <article class="toggle-card toggle-card--${escapeHtml(item.tone)}">
                    <div>
                      <div class="toggle-title-row">
                        <strong>${escapeHtml(item.title)}</strong>
                        ${item.tag ? renderBadge(item.tag, 'warning') : ''}
                      </div>
                      <span>${escapeHtml(item.description)}</span>
                    </div>
                    <span class="toggle-switch${item.enabled ? ' is-on' : ''}"></span>
                  </article>
                `
              )
              .join('')}
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Canal de Notificaciones</h2>
          </div>
          <div class="toggle-list">
            ${DEMO_DATA.settings.channels
              .map(
                (item) => `
                  <article class="toggle-card">
                    <div>
                      <strong>${escapeHtml(item.title)}</strong>
                      <span>${escapeHtml(item.description)}</span>
                    </div>
                    <span class="toggle-switch${item.enabled ? ' is-on' : ''}"></span>
                  </article>
                `
              )
              .join('')}
          </div>
        </section>
      </div>
    `;
  }

  function renderSettingsUsers() {
    return `
      <div class="stack-gap">
        <section class="panel">
          <div class="panel-head">
            <h2>Usuarios Autorizados</h2>
            <button
              type="button"
              class="btn btn-primary"
              ${renderActionAttributes({
                action: 'open-modal',
                value: 'user-form',
                meta: { mode: 'create' },
              })}
            >
              ${renderIcon('owners')}
              <span>Agregar usuario</span>
            </button>
          </div>
          <div class="user-list">
            ${DEMO_DATA.settings.users
              .map(
                (user) => `
                  <article class="user-row">
                    <div class="user-main">
                      <div class="avatar">${escapeHtml(user.initials)}</div>
                      <div>
                        <div class="user-title-row">
                          <strong>${escapeHtml(user.name)}</strong>
                          ${user.status ? renderBadge(user.status, user.statusTone) : ''}
                        </div>
                        <span>${escapeHtml(user.email)}</span>
                        <div class="chip-row">
                          <span class="mini-chip">${escapeHtml(user.role)}</span>
                          ${user.handle ? `<span class="subtle-text">${escapeHtml(user.handle)}</span>` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="text-action"
                      ${renderActionAttributes({
                        action: 'open-modal',
                        value: 'user-form',
                        meta: { mode: 'edit', name: user.name },
                      })}
                    >
                      Editar
                    </button>
                  </article>
                `
              )
              .join('')}
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Permisos</h2>
          </div>
          <article class="toggle-card">
            <div>
              <strong>Autenticación de dos factores</strong>
              <span>Requiere código de verificación al iniciar sesión</span>
            </div>
            <span class="toggle-switch"></span>
          </article>
        </section>
      </div>
    `;
  }

  function renderSettingsView(state) {
    const activeView = getActiveView(state, 'settings');

    return `
      <div class="page-stack">
        <div class="settings-tabs">
          ${DEMO_DATA.settings.tabs
            .map(
              (tab) => `
                <button
                  type="button"
                  class="settings-tab${activeView === tab.key ? ' is-active' : ''}"
                  data-view-nav="settings"
                  data-view-key="${escapeHtml(tab.key)}"
                >
                  ${escapeHtml(tab.label)}
                </button>
              `
            )
            .join('')}
        </div>

        ${
          activeView === 'account'
            ? renderSettingsAccount(state)
            : activeView === 'security'
              ? renderSettingsSecurity(state)
              : activeView === 'general'
                ? renderSettingsGeneral()
                : activeView === 'notifications'
                  ? renderSettingsNotifications()
                  : activeView === 'users'
                    ? renderSettingsUsers()
                    : renderSettingsTelegram(state)
        }
      </div>
    `;
  }

  function getPaddockByName(name) {
    return (
      DEMO_DATA.paddocks.cards.find((item) => item.name === name) ||
      DEMO_DATA.paddocks.cards[0]
    );
  }

  function getHorseByName(name) {
    return (
      DEMO_DATA.horses.horses.find((item) => item.name === name) ||
      DEMO_DATA.horses.horses[0]
    );
  }

  function getGroupByName(name) {
    return (
      DEMO_DATA.horses.groups.find((item) => item.name === name) ||
      DEMO_DATA.horses.groups[0]
    );
  }

  function parsePositiveInt(value) {
    const parsed = Number.parseInt(String(value || ''), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }

  function getPaddockSelectionError(paddock, referenceDate = todayDateString()) {
    if (!paddock) {
      return 'No encontramos el potrero seleccionado.';
    }

    if (paddock.active === false) {
      return `El potrero ${paddock.name} está inactivo.`;
    }

    if (
      isValidDateString(referenceDate) &&
      paddock.ready_to_graze_on &&
      paddock.ready_to_graze_on > referenceDate
    ) {
      return `El potrero ${paddock.name} no está listo para pastoreo hasta ${formatDateLabel(
        paddock.ready_to_graze_on
      )}.`;
    }

    return '';
  }

  function formatPaddockAreaLabel(sizeHa) {
    if (sizeHa == null || sizeHa === '') {
      return 'Superficie sin cargar';
    }

    const parsed = Number(sizeHa);
    if (!Number.isFinite(parsed)) {
      return 'Superficie sin cargar';
    }

    const value = Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(1);
    return `${value} hectáreas`;
  }

  function getPaddockStateMeta(paddock) {
    switch (paddock?.occupancy_state) {
      case 'occupied':
        return {
          label: 'Ocupado',
          tone: 'green',
          detail: paddock?.grazing_days ? `${paddock.grazing_days} día(s) ocupado` : 'Con ocupación activa',
        };
      case 'growing':
        return {
          label: 'Preparación',
          tone: 'orange',
          detail: paddock?.ready_to_graze_on
            ? `Listo desde ${formatDateLabel(paddock.ready_to_graze_on)}`
            : 'Esperando habilitación de pastoreo',
        };
      case 'resting':
        return {
          label: 'Descanso',
          tone: 'blue',
          detail: paddock?.rest_days != null ? `${paddock.rest_days} día(s) de descanso` : 'Sin ocupación activa',
        };
      case 'inactive':
        return {
          label: 'Inactivo',
          tone: 'gray',
          detail: 'No disponible para movimientos',
        };
      default:
        return {
          label: 'Listo',
          tone: 'teal',
          detail: paddock?.ready_to_graze_on
            ? `Disponible desde ${formatDateLabel(paddock.ready_to_graze_on)}`
            : 'Disponible para pastoreo',
        };
    }
  }

  function getPaddockFilterOptions(dashboard) {
    const paddocks = Array.isArray(dashboard?.paddocks) ? dashboard.paddocks : [];
    const counts = paddocks.reduce(
      (accumulator, paddock) => {
        const key = String(paddock.occupancy_state || 'ready');
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      },
      {}
    );

    return [
      { value: 'all', label: 'Todos' },
      { value: 'occupied', label: `Ocupados (${counts.occupied || 0})` },
      { value: 'resting', label: `Descanso (${counts.resting || 0})` },
      { value: 'growing', label: `Preparación (${counts.growing || 0})` },
      { value: 'ready', label: `Listos (${counts.ready || 0})` },
      { value: 'inactive', label: `Inactivos (${counts.inactive || 0})` },
    ];
  }

  function getFilteredRealPaddocks(state, dashboard) {
    const paddocks = Array.isArray(dashboard?.paddocks) ? dashboard.paddocks : [];
    const query = String(state?.paddockFilters?.query || '')
      .trim()
      .toLowerCase();
    const statusFilter = String(state?.paddockFilters?.status || 'all');

    return paddocks.filter((paddock) => {
      const searchableText = [
        paddock.name,
        paddock.zone || '',
        paddock.parent_paddock_name || '',
        paddock.occupied_by || '',
        paddock.latest_work_type_label || '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = !query || searchableText.includes(query);
      const matchesStatus =
        statusFilter === 'all' ? true : String(paddock.occupancy_state || 'ready') === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }

  function formatPaddockWorkTypeText(value) {
    const normalized = String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, ' ');

    if (!normalized) {
      return 'Trabajo de campo';
    }

    if (normalized === 'soil prep' || normalized === 'soil preparation') {
      return 'Rastra';
    }

    if (normalized === 'seeding' || normalized === 'sowing' || normalized === 'seed') {
      return 'Siembra';
    }

    if (normalized === 'fertilizer' || normalized === 'fertilizing' || normalized === 'fertiliser') {
      return 'Fertilización';
    }

    if (normalized === 'spraying' || normalized === 'spray') {
      return 'Fumigación';
    }

    if (normalized === 'ready check' || normalized === 'ready') {
      return 'Chequeo de ingreso';
    }

    if (normalized === 'other') {
      return 'Trabajo de campo';
    }

    return value;
  }

  function getPaddockWorkSummary(paddock) {
    if (!(paddock && paddock.latest_work_type_label)) {
      return 'Sin trabajo registrado';
    }

    return `${formatPaddockWorkTypeText(paddock.latest_work_type || paddock.latest_work_type_label)} · ${formatDateLabel(paddock.latest_work_date)}`;
  }

  function getPaddockReadinessSummary(paddock) {
    const stateMeta = getPaddockStateMeta(paddock);

    if (paddock?.occupancy_state === 'growing' && paddock.ready_to_graze_on) {
      return {
        tone: 'warning',
        label: 'Pastoreo bloqueado',
        value: `Listo desde ${formatDateLabel(paddock.ready_to_graze_on)}`,
      };
    }

    if (paddock?.occupancy_state === 'occupied') {
      return {
        tone: 'green',
        label: 'Ocupación actual',
        value: paddock.occupied_by || 'Con ocupación activa',
      };
    }

    if (paddock?.occupancy_state === 'resting') {
      return {
        tone: 'blue',
        label: 'Descanso activo',
        value:
          paddock.rest_days != null
            ? `${paddock.rest_days} día(s) desde la última salida`
            : stateMeta.detail,
      };
    }

    return {
      tone: stateMeta.tone,
      label: 'Estado operativo',
      value: stateMeta.detail,
    };
  }

  function getPaddockConditionMeta(paddock) {
    if (paddock?.active === false || paddock?.occupancy_state === 'inactive') {
      return {
        label: 'Inactivo',
        tone: 'gray',
      };
    }

    if (paddock?.occupancy_state === 'occupied') {
      return {
        label: 'En uso',
        tone: 'green',
      };
    }

    if (paddock?.occupancy_state === 'growing') {
      return {
        label: 'Bueno',
        tone: 'blue',
      };
    }

    return {
      label: 'Bueno',
      tone: 'blue',
    };
  }

  function buildRealPaddockSelectOptions(state, options = {}) {
    const includeBlank = Boolean(options.includeBlank);
    const blankLabel = options.blankLabel || 'Sin potrero';
    const rows = getRealPaddockCatalogRows(state)
      .filter((paddock) => (options.includeInactive ? true : paddock.active !== false))
      .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'es'))
      .map((paddock) => ({
        value: String(paddock.id),
        label: paddock.name,
      }));

    return includeBlank ? [{ value: '', label: blankLabel }, ...rows] : rows;
  }

  function buildRealGroupSelectOptions(state, options = {}) {
    const includeBlank = Boolean(options.includeBlank);
    const blankLabel = options.blankLabel || 'Sin grupo';
    const rows = getRealGroupCatalogRows(state)
      .filter((group) => (options.includeInactive ? true : group.active !== false))
      .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'es'))
      .map((group) => ({
        value: String(group.id),
        label: group.name,
      }));

    return includeBlank ? [{ value: '', label: blankLabel }, ...rows] : rows;
  }

  function buildRealHorseSelectOptions(state, options = {}) {
    const includeBlank = Boolean(options.includeBlank);
    const blankLabel = options.blankLabel || 'Seleccionar caballo';
    const rows = (getRealHorseDashboard(state)?.horses || [])
      .slice()
      .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'es'))
      .map((horse) => ({
        value: String(horse.id),
        label: horse.name,
      }));

    return includeBlank ? [{ value: '', label: blankLabel }, ...rows] : rows;
  }

  function getPaddockActivationLabel(activeValue) {
    return String(activeValue) === 'false' ? 'Inactivo' : 'Activo';
  }

  function parseIsoDateValue(dateString) {
    if (!dateString) {
      return null;
    }

    const parsed = new Date(`${dateString}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function differenceInDays(startDateString, endDateString) {
    const start = parseIsoDateValue(startDateString);
    const end = parseIsoDateValue(endDateString);
    if (!start || !end) {
      return null;
    }

    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
  }

  function shiftIsoDateString(dateString, dayOffset) {
    const parsed = parseIsoDateValue(dateString);
    if (!parsed) {
      return null;
    }

    parsed.setUTCDate(parsed.getUTCDate() + dayOffset);
    return parsed.toISOString().slice(0, 10);
  }

  function getIsoSortValue(dateString) {
    const parsed = parseIsoDateValue(dateString);
    return parsed ? parsed.getTime() : 0;
  }

  function inferPaddockCropName(textValues) {
    const normalizedText = (textValues || []).filter(Boolean).join(' | ');
    if (!normalizedText) {
      return '';
    }

    const cropMatchers = [
      { pattern: /alfalfa/i, label: 'Alfalfa' },
      { pattern: /rei?grass|reygrass|raigr[aá]s/i, label: 'Raigrás' },
      { pattern: /festuca/i, label: 'Festuca' },
      { pattern: /tr[eé]bol/i, label: 'Trébol' },
      { pattern: /avena/i, label: 'Avena' },
      { pattern: /lotus/i, label: 'Lotus' },
    ];

    const matched = cropMatchers.find((entry) => entry.pattern.test(normalizedText));
    return matched ? matched.label : '';
  }

  function buildPaddockGrazingPeriods(detail) {
    const rows = Array.isArray(detail?.grazing_history) ? detail.grazing_history : [];
    const periodMap = new Map();

    rows.forEach((row) => {
      const key = `${row.entered_at || ''}|${row.exited_at || 'open'}`;
      if (!periodMap.has(key)) {
        periodMap.set(key, {
          entered_at: row.entered_at || null,
          exited_at: row.exited_at || null,
          grazing_days: row.grazing_days != null ? Number(row.grazing_days) : null,
          horse_names: [],
          horse_count: 0,
          group_names: new Set(),
          active: Boolean(row.active),
        });
      }

      const bucket = periodMap.get(key);
      if (row.horse_name) {
        bucket.horse_names.push(row.horse_name);
      }
      if (row.source_group_name) {
        bucket.group_names.add(row.source_group_name);
      }
      bucket.horse_count += 1;
      if (row.grazing_days != null) {
        bucket.grazing_days = Math.max(Number(bucket.grazing_days || 0), Number(row.grazing_days));
      }
      bucket.active = bucket.active || Boolean(row.active);
    });

    return Array.from(periodMap.values())
      .map((row) => ({
        ...row,
        group_names: Array.from(row.group_names).sort((left, right) => left.localeCompare(right, 'es')),
        horse_names: row.horse_names.slice().sort((left, right) => left.localeCompare(right, 'es')),
      }))
      .sort((left, right) => getIsoSortValue(right.entered_at) - getIsoSortValue(left.entered_at));
  }

  function buildPaddockRestTimeline(detail) {
    const periods = buildPaddockGrazingPeriods(detail)
      .slice()
      .sort((left, right) => getIsoSortValue(left.entered_at) - getIsoSortValue(right.entered_at));
    const rows = [];

    for (let index = 0; index < periods.length; index += 1) {
      const period = periods[index];
      const nextPeriod = periods[index + 1] || null;

      if (!(period && period.exited_at && nextPeriod?.entered_at)) {
        continue;
      }

      const restEnd = shiftIsoDateString(nextPeriod.entered_at, -1);
      const restDays = differenceInDays(period.exited_at, restEnd);
      if (restDays == null) {
        continue;
      }

      rows.push({
        title: 'Descanso',
        detail: `${restDays} día(s) · ${formatDateLabel(period.exited_at)} - ${formatDateLabel(restEnd)}`,
        meta: restDays >= 20 ? 'Recuperación completa' : 'Descanso corto',
        tone: restDays >= 20 ? 'green' : 'orange',
        tag: restDays >= 20 ? 'Completo' : 'Corto',
        start_at: period.exited_at,
        end_at: restEnd,
        days: restDays,
        current: false,
      });
    }

    const activePeriod = periods.find((period) => period.active);
    const latestClosedPeriod = periods
      .filter((period) => period.exited_at)
      .sort((left, right) => getIsoSortValue(right.exited_at) - getIsoSortValue(left.exited_at))[0];

    if (!activePeriod && latestClosedPeriod?.exited_at) {
      const restDays = differenceInDays(latestClosedPeriod.exited_at, todayDateString());
      rows.unshift({
        title: 'Descanso actual',
        detail: `${restDays != null ? restDays : 0} día(s) · Desde ${formatDateLabel(latestClosedPeriod.exited_at)}`,
        meta: 'En curso',
        tone: 'blue',
        tag: 'En curso',
        start_at: latestClosedPeriod.exited_at,
        end_at: todayDateString(),
        days: restDays != null ? restDays : 0,
        current: true,
      });
    }

    return rows
      .sort((left, right) => getIsoSortValue(right.end_at || right.start_at) - getIsoSortValue(left.end_at || left.start_at))
      .slice(0, 4);
  }

  function buildPaddockRestStats(restTimelineRows) {
    const completedRows = (restTimelineRows || []).filter((row) => !row.current && row.days != null);
    if (!completedRows.length) {
      return null;
    }

    const averageDays = Math.round(
      completedRows.reduce((sum, row) => sum + Number(row.days || 0), 0) / completedRows.length
    );

    return {
      average_days: averageDays,
      latest_days: Number(completedRows[0].days || 0),
    };
  }

  function buildPaddockCultivationState(paddock, detail) {
    const workHistory = Array.isArray(detail?.work_history) ? detail.work_history : [];
    const seedingEvent =
      workHistory.find((row) => row.event_type === 'seeding') ||
      (paddock?.latest_work_type === 'seeding'
        ? {
            event_type: 'seeding',
            event_date: paddock.latest_work_date || paddock.ready_to_graze_on || null,
            ready_to_graze_on: paddock.ready_to_graze_on || null,
            notes: paddock.latest_work_notes || '',
          }
        : null);

    if (!seedingEvent) {
      return null;
    }

    const fertilizerEvent = workHistory.find((row) => row.event_type === 'fertilizer') || null;
    const cropName = inferPaddockCropName([
      seedingEvent?.notes,
      fertilizerEvent?.notes,
      paddock?.latest_work_notes,
      paddock?.notes,
    ]);

    return {
      name: cropName || 'Implantación reciente',
      seeded_at: seedingEvent?.event_date || paddock?.latest_work_date || null,
      ready_to_graze_on: paddock?.ready_to_graze_on || seedingEvent?.ready_to_graze_on || null,
      maintenance_note:
        fertilizerEvent?.notes ||
        paddock?.latest_work_notes ||
        'Seguimiento de implantación pendiente de mayor detalle.',
    };
  }

  function buildPaddockOperationalTimeline(paddock, detail) {
    const workRows = Array.isArray(detail?.work_history) ? detail.work_history : [];
    const grazingPeriods = buildPaddockGrazingPeriods(detail);
    const rows = [];

    grazingPeriods.forEach((period) => {
      rows.push({
        sort_at: period.exited_at || period.entered_at,
        title: period.active ? 'Ocupación actual' : 'Período de pastoreo',
        detail:
          period.horse_count > 0
            ? `${period.horse_count} caballo(s)${period.group_names.length ? ` · ${period.group_names.join(', ')}` : ''}`
            : 'Sin detalle de caballos',
        meta: period.active
          ? `Desde ${formatDateLabel(period.entered_at)}`
          : `${period.grazing_days != null ? `${period.grazing_days} día(s)` : 'Período cerrado'} · ${formatDateLabel(period.entered_at)} - ${formatDateLabel(period.exited_at)}`,
        tone: period.active ? 'green' : 'blue',
        tag: period.active ? 'En curso' : 'Pastoreo',
      });
    });

    workRows.forEach((row) => {
      const responsibleBits = [];
      if (row.performed_by) {
        responsibleBits.push(
          row.performed_by_kind && row.performed_by_kind !== 'unspecified'
            ? `Responsable: ${row.performed_by} (${formatResponsibleKindLabel(row.performed_by_kind).toLowerCase()})`
            : `Responsable: ${row.performed_by}`
        );
      } else if (row.performed_by_kind && row.performed_by_kind !== 'unspecified') {
        responsibleBits.push(`Responsable: ${formatResponsibleKindLabel(row.performed_by_kind)}`);
      }

      const detailParts = [...responsibleBits, row.notes || ''].filter(Boolean);

      rows.push({
        sort_at: row.event_date,
        title: formatPaddockWorkTypeText(row.event_type || row.event_type_label),
        detail: detailParts.join(' · ') || 'Trabajo registrado sin observaciones adicionales.',
        meta: row.ready_to_graze_on
          ? `${formatDateLabel(row.event_date)} · habilita desde ${formatDateLabel(row.ready_to_graze_on)}`
          : formatDateLabel(row.event_date),
        tone: row.ready_to_graze_on ? 'orange' : 'gray',
        tag: row.ready_to_graze_on ? 'Espera' : 'Trabajo',
      });
    });

    if (paddock?.notes) {
      rows.push({
        sort_at: paddock.updated_at || paddock.created_at || null,
        title: 'Notas operativas',
        detail: paddock.notes,
        meta: paddock.zone ? `Zona ${paddock.zone}` : 'Sin zona definida',
        tone: 'gray',
        tag: 'Notas',
      });
    }

    return rows
      .sort((left, right) => getIsoSortValue(right.sort_at) - getIsoSortValue(left.sort_at))
      .slice(0, 6);
  }

  function renderRealPaddockDetailModal(state, payload) {
    const paddock = getRealPaddockById(state, payload.paddockId);
    if (!paddock) {
      return '';
    }

    const detailState = getRealPaddockDetailState(state, paddock.id);
    const detail = detailState?.data?.paddock_detail || null;
    const stateMeta = getPaddockStateMeta(paddock);
    const readiness = getPaddockReadinessSummary(paddock);
    const workSummary = getPaddockWorkSummary(paddock);
    const cultivationState = buildPaddockCultivationState(paddock, detail);
    const restTimelineRows = buildPaddockRestTimeline(detail);
    const operationalTimelineRows = buildPaddockOperationalTimeline(paddock, detail);
    const useRestTimeline = Boolean(cultivationState) && restTimelineRows.length > 1;
    const timelineRows = useRestTimeline ? restTimelineRows : operationalTimelineRows;
    const restStats = useRestTimeline ? buildPaddockRestStats(restTimelineRows) : null;
    const conditionMeta = getPaddockConditionMeta(paddock);
    const occupiedDays = paddock.grazing_days != null ? `${paddock.grazing_days}` : '-';
    const restDays =
      paddock.rest_days != null
        ? `${paddock.rest_days}`
        : paddock.manual_rest_days != null
          ? `${paddock.manual_rest_days}`
          : '-';
    const readinessValue =
      paddock.ready_to_graze_on && paddock.ready_to_graze_on > todayDateString()
        ? `Desde ${formatDateLabel(paddock.ready_to_graze_on)}`
        : stateMeta.label;
    const nextRotationValue =
      paddock.days_until_ready == null
        ? readinessValue
        : paddock.days_until_ready <= 0
          ? 'Listo ahora'
          : `${paddock.days_until_ready} día(s)`;
    const rainValue = '--';
    const rainDetail = 'Sin integración climática';

    return renderModalShell({
      size: 'paddock-detail',
      title: 'Detalles del Potrero',
      subtitle: 'Información completa del potrero',
      content: `
        <div class="modal-content-stack paddock-detail-shell">
          ${
            detailState?.loading
              ? `
                <div class="paddock-detail-banner paddock-detail-banner--info">
                  Cargando historial real del potrero...
                </div>
              `
              : ''
          }
          ${
            detailState?.error
              ? `
                <div class="paddock-detail-banner paddock-detail-banner--warning">
                  ${escapeHtml(detailState.error)}
                </div>
              `
              : ''
          }
          <section class="paddock-detail-summary">
            <div class="paddock-detail-summary-head">
              <div class="paddock-detail-summary-copy">
                <strong>${escapeHtml(paddock.name)}</strong>
                <span>${renderIcon('pin')} ${escapeHtml(formatPaddockAreaLabel(paddock.size_ha))}</span>
              </div>
              ${renderBadge(stateMeta.label, stateMeta.tone)}
            </div>
          </section>

          <section class="paddock-detail-section">
            <div class="paddock-detail-section-head">
              <strong>Ocupación</strong>
            </div>
            <div class="paddock-detail-metric-grid">
              <article class="paddock-detail-metric-card">
                <span class="paddock-detail-metric-label">${renderIcon('horses')} Caballos</span>
                <strong>${escapeHtml(String(paddock.horse_count || 0))}</strong>
                <small>${escapeHtml(paddock.occupied_by || 'Sin ocupación activa')}</small>
              </article>
              <article class="paddock-detail-metric-card">
                <span class="paddock-detail-metric-label">${renderIcon('calendar')} Días ocupado</span>
                <strong>${escapeHtml(occupiedDays)}</strong>
                <small>${escapeHtml(paddock.occupied_since ? `Desde ${formatDateLabel(paddock.occupied_since)}` : 'Sin ingreso activo')}</small>
              </article>
              <article class="paddock-detail-metric-card">
                <span class="paddock-detail-metric-label">${renderIcon('clock')} Días descanso</span>
                <strong>${escapeHtml(restDays)}</strong>
                <small>${escapeHtml(paddock.last_exited_at ? `Última salida ${formatDateLabel(paddock.last_exited_at)}` : 'Sin salida reciente')}</small>
              </article>
              <article class="paddock-detail-metric-card">
                <span class="paddock-detail-metric-label">
                  ${renderIcon(cultivationState ? 'cloud' : 'pulse')}
                  ${escapeHtml(cultivationState ? 'Lluvia 30d' : 'Estado actual')}
                </span>
                <strong class="${escapeHtml(cultivationState ? '' : 'paddock-detail-metric-value--wide')}">
                  ${escapeHtml(cultivationState ? rainValue : readinessValue)}
                </strong>
                <small>${escapeHtml(cultivationState ? rainDetail : readiness.value)}</small>
              </article>
            </div>
          </section>

          <section class="paddock-detail-section">
            <div class="paddock-detail-section-head">
              <strong>Estado y Mantenimiento</strong>
            </div>
            <div class="paddock-detail-status-line">
              <div class="paddock-detail-status-copy">
                <span>Condición del potrero</span>
                <strong>${escapeHtml(`Último trabajo: ${workSummary}`)}</strong>
                ${
                  cultivationState?.maintenance_note
                    ? `<small>${escapeHtml(cultivationState.maintenance_note)}</small>`
                    : ''
                }
              </div>
              ${renderBadge(conditionMeta.label, conditionMeta.tone)}
            </div>

            ${
              cultivationState
                ? `
                  <article class="paddock-detail-highlight paddock-detail-highlight--green">
                    <span class="paddock-detail-highlight-title">${renderIcon('leaf')} Cultivo actual</span>
                    <strong>${escapeHtml(cultivationState.name)}</strong>
                    <small>${escapeHtml(
                      cultivationState.seeded_at
                        ? `Siembra registrada el ${formatDateLabel(cultivationState.seeded_at)}`
                        : cultivationState.maintenance_note
                    )}</small>
                  </article>

                  <article class="paddock-detail-highlight paddock-detail-highlight--blue">
                    <span class="paddock-detail-highlight-title">${renderIcon('trendUp')} Próxima rotación</span>
                    <strong>${escapeHtml(nextRotationValue)}</strong>
                    <small>${escapeHtml(
                      useRestTimeline
                        ? readiness.value
                        : 'Todavía no hay suficiente descanso histórico para mostrar la línea de recuperación.'
                    )}</small>
                  </article>
                `
                : `
                  <article class="paddock-detail-highlight paddock-detail-highlight--blue">
                    <span class="paddock-detail-highlight-title">${renderIcon('pulse')} ${escapeHtml(readiness.label)}</span>
                    <strong>${escapeHtml(readiness.value)}</strong>
                    <small>${escapeHtml(
                      paddock.parent_paddock_name ? `Bloque ${paddock.parent_paddock_name}` : 'Bloque raíz'
                    )}</small>
                  </article>
                `
            }
          </section>

          <section class="paddock-detail-section">
            <div class="paddock-detail-section-head">
              <strong>${escapeHtml(useRestTimeline ? 'Historial de Descanso' : 'Historial del Potrero')}</strong>
              <span class="paddock-detail-section-note">
                ${escapeHtml(
                  useRestTimeline
                    ? 'Períodos de descanso para monitorear recuperación del potrero'
                    : 'Movimientos y trabajos registrados en este potrero'
                )}
              </span>
            </div>
            <div class="paddock-detail-timeline">
              ${
                timelineRows.length
                  ? timelineRows
                    .map((row, index) => {
                      const mainLine = useRestTimeline ? row.detail : row.meta;
                      const noteLine = useRestTimeline ? row.meta : row.detail;
                      const noteTone = useRestTimeline ? row.tone : 'gray';

                      return `
                        <article class="paddock-detail-timeline-row ${index === timelineRows.length - 1 ? 'is-last' : ''}">
                          <div class="paddock-detail-timeline-rail">
                            <div class="paddock-detail-timeline-dot paddock-detail-timeline-dot--${escapeHtml(row.tone)}"></div>
                          </div>
                          <div class="paddock-detail-timeline-copy">
                            <div class="paddock-detail-timeline-top">
                              <strong>${escapeHtml(row.title)}</strong>
                              ${renderBadge(row.tag, row.tone === 'gray' ? 'gray' : row.tone)}
                            </div>
                            <span class="paddock-detail-timeline-main">${escapeHtml(mainLine)}</span>
                            ${
                              noteLine
                                ? `<small class="paddock-detail-timeline-note paddock-detail-timeline-note--${escapeHtml(noteTone)}">${escapeHtml(noteLine)}</small>`
                                : ''
                            }
                          </div>
                        </article>
                      `;
                    })
                    .join('')
                  : `
                    <article class="paddock-detail-timeline-row is-last">
                      <div class="paddock-detail-timeline-rail">
                        <div class="paddock-detail-timeline-dot paddock-detail-timeline-dot--gray"></div>
                      </div>
                      <div class="paddock-detail-timeline-copy">
                        <div class="paddock-detail-timeline-top">
                          <strong>Sin historial suficiente</strong>
                          ${renderBadge('Vacío', 'gray')}
                        </div>
                        <span class="paddock-detail-timeline-main">Todavía no encontramos eventos suficientes para armar la línea de tiempo de este potrero.</span>
                        <small class="paddock-detail-timeline-note paddock-detail-timeline-note--gray">Cuando se carguen más trabajos o movimientos, van a aparecer acá.</small>
                      </div>
                    </article>
                  `
              }
            </div>
            ${
              useRestTimeline && restStats
                ? `
                  <div class="paddock-detail-stats-card">
                    <strong>Estadísticas de recuperación</strong>
                    <div class="paddock-detail-stats-grid">
                      <span>Promedio descanso: <strong>${escapeHtml(`${restStats.average_days} día(s)`)}</strong></span>
                      <span>Último período: <strong>${escapeHtml(`${restStats.latest_days} día(s)`)}</strong></span>
                    </div>
                  </div>
                `
                : ''
            }
          </section>

          <div class="modal-footer paddock-detail-footer">
            <button
              type="button"
              class="btn btn-secondary"
              ${renderActionAttributes({ action: 'close-modal' })}
            >
              <span>Cerrar</span>
            </button>
            <button
              type="button"
              class="btn btn-primary"
              ${renderActionAttributes({
                action: 'open-modal',
                value: 'paddock-form',
                meta: { mode: 'edit', paddockId: paddock.id },
              })}
            >
              <span>Editar Potrero</span>
            </button>
          </div>
        </div>
      `,
    });
  }

  function renderRealPaddockFormModal(state, payload) {
    const isEdit = payload.mode === 'edit';
    const paddock = isEdit ? getRealPaddockById(state, payload.paddockId) : null;
    if (isEdit && !paddock) {
      return renderInfoModal({
        title: 'Potrero no disponible',
        subtitle: 'No pudimos reconstruir el potrero que querés editar.',
        body: `
          <div class="modal-detail-card">
            <strong>Revisá la lectura actual</strong>
            <span>Probá refrescar la pantalla para volver a cargar el padrón de potreros.</span>
          </div>
        `,
      });
    }

    const referencePaddockRows = Array.isArray(getRealPaddockDashboard(state)?.paddocks)
      ? getRealPaddockDashboard(state).paddocks
      : getRealPaddockCatalogRows(state);
    const parentOptions = [
      { value: '', label: 'Sin padre / bloque raíz' },
      ...referencePaddockRows
        .filter((candidate) => Number(candidate.id) !== Number(paddock?.id))
        .slice()
        .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'es'))
        .map((candidate) => ({
          value: String(candidate.id),
          label: candidate.name,
        })),
    ];
    const activeOptions = [
      { value: 'true', label: 'Activo' },
      { value: 'false', label: 'Inactivo' },
    ];
    const restScopeOptions = [
      { value: 'single', label: 'Solo este potrero' },
      { value: 'whole_block', label: 'Todo el bloque / descendientes' },
    ];
    const stateMeta = paddock ? getPaddockStateMeta(paddock) : null;
    const workSummary = paddock ? getPaddockWorkSummary(paddock) : 'Sin trabajo registrado';
    const title = isEdit ? `Editar ${paddock?.name || 'Potrero'}` : 'Crear Nuevo Potrero';
    const subtitle = isEdit
      ? 'Actualiza la información del potrero'
      : 'Ingresa los datos del nuevo potrero';
    const createFields = [
      {
        label: 'Nombre',
        name: 'paddockName',
        type: 'text',
        value: '',
        placeholder: 'Potrero Norte 1',
        required: true,
      },
      {
        label: 'Hectáreas',
        name: 'sizeHa',
        type: 'number',
        value: '',
        min: '0',
        step: '0.1',
        placeholder: '5.2',
      },
      {
        label: 'Estado inicial',
        name: 'active',
        type: 'select',
        value: 'true',
        options: activeOptions,
      },
    ];
    const editFields = [
      {
        label: 'Nombre del Potrero',
        name: 'paddockName',
        type: 'text',
        value: paddock?.name || '',
        placeholder: 'Potrero Norte 1',
        required: true,
      },
      {
        label: 'Hectáreas',
        name: 'sizeHa',
        type: 'number',
        value: paddock?.size_ha != null ? String(paddock.size_ha) : '',
        min: '0',
        step: '0.1',
        placeholder: '5.2',
      },
      {
        label: 'Estado',
        name: 'active',
        type: 'select',
        value: paddock?.active === false ? 'false' : 'true',
        options: activeOptions,
      },
      {
        label: 'Zona',
        name: 'zone',
        type: 'text',
        value: paddock?.zone || '',
        placeholder: 'Norte / Fondo / Central',
      },
      {
        label: 'Bloque padre',
        name: 'parentPaddockId',
        type: 'select',
        value: paddock?.parent_paddock_id != null ? String(paddock.parent_paddock_id) : '',
        options: parentOptions,
      },
      {
        label: 'Descanso manual (días)',
        name: 'restDaysEstimate',
        type: 'number',
        value: paddock?.manual_rest_days != null ? String(paddock.manual_rest_days) : '',
        min: '0',
        step: '1',
        placeholder: '14',
      },
      {
        label: 'Alcance del descanso',
        name: 'restApplyScope',
        type: 'select',
        value: paddock?.manual_rest_applies_to_descendants ? 'whole_block' : 'single',
        options: restScopeOptions,
      },
      {
        label: 'Último trabajo',
        name: 'latestWorkPreview',
        type: 'text',
        value: workSummary,
        readonly: true,
        disabled: true,
      },
    ];

    return renderModalShell({
      size: 'paddock-form',
      title,
      subtitle,
      content: `
        <form class="modal-form paddock-form-stack" data-modal-form data-modal-key="paddock-form">
          ${
            isEdit && paddock && stateMeta
              ? `
                <div class="paddock-form-callout">
                  <strong>${escapeHtml(stateMeta.label)}</strong>
                  <span>${escapeHtml(`${stateMeta.detail} · ${paddock.occupied_by || 'Sin ocupación activa'}`)}</span>
                </div>
              `
              : ''
          }
          <div class="modal-body">
            ${(isEdit ? editFields : createFields).map((field) => renderModalField(field)).join('')}
          </div>
          <div class="modal-footer${isEdit ? '' : ' modal-footer--single'}">
            ${
              isEdit
                ? `
                  <button
                    type="button"
                    class="btn btn-secondary"
                    ${renderActionAttributes({ action: 'close-modal' })}
                  >
                    <span>Cancelar</span>
                  </button>
                `
                : ''
            }
            <button type="submit" class="btn btn-primary${isEdit ? '' : ' btn-block'}">
              <span>${escapeHtml(isEdit ? 'Guardar Cambios' : 'Crear Potrero')}</span>
            </button>
          </div>
        </form>
      `,
    });
  }

  function renderHorseFeedStatusBanner(payload, historyState) {
    const feedError = String(payload?.feedPlanError || '').trim();
    const feedMessage = String(payload?.feedPlanMessage || '').trim();
    const isRefreshing = Boolean(historyState?.loading);

    if (feedError) {
      return `
        <div class="horse-feed-status horse-feed-status--critical">
          <strong>No pudimos actualizar alimentación.</strong>
          <span>${escapeHtml(feedError)}</span>
        </div>
      `;
    }

    if (feedMessage) {
      return `
        <div class="horse-feed-status horse-feed-status--info">
          <strong>Plan por caballo</strong>
          <span>${escapeHtml(feedMessage)}</span>
        </div>
      `;
    }

    if (!isRefreshing) {
      return '';
    }

    return `
      <div class="horse-feed-status horse-feed-status--info">
        <strong>Actualizando alimentación</strong>
        <span>Estamos trayendo el plan, calendario y consumos más recientes desde Neon.</span>
      </div>
    `;
  }

  function renderHorseFeedPlanEditor(state, horse, payload, historyPayload, historyState) {
    if (!state?.stockDashboard?.meta?.feed_module_enabled) {
      return `
        <section class="horse-history-block">
          <div class="horse-history-block-head">
            <strong>Plan de Alimentación</strong>
          </div>
          <div class="modal-callout">
            <strong>El módulo de alimento está apagado.</strong>
            <span>Cuando lo activemos, acá vas a poder armar el plan diario por caballo.</span>
          </div>
        </section>
      `;
    }

    const selectedMonth = getHorseFeedCalendarMonth(payload, historyPayload);
    const draftRows = getHorseFeedPlanDraftRowsForModal(payload, historyPayload);
    const calendarEntries = getHorseFeedCalendarEntriesForMonth(historyPayload, selectedMonth);
    const summary = buildHorseFeedPlanSummary(draftRows, calendarEntries);
    const feedItems = getRealStockItems(state);
    const datalistId = `horse-feed-item-options-${horse.id}`;
    const isSaving = Boolean(payload?.feedPlanSaving);
    const isRefreshing = Boolean(historyState?.loading);
    const controlsDisabled = isSaving || Boolean(payload?.feedCalendarBusyKey) || isRefreshing;
    const disabledAttr = controlsDisabled ? ' disabled' : '';

    const rowsMarkup = FEED_SLOT_META.map((slot) => {
      const slotRows = draftRows.filter((row) => row.feed_slot === slot.key);
      return `
        <article class="horse-feed-slot-card">
          <div class="horse-feed-slot-head">
            <div>
              <strong>${escapeHtml(slot.title)}</strong>
              <span>Todo lo que cargues acá queda guardado solo para ${escapeHtml(horse.name)}.</span>
            </div>
            <button
              type="button"
              class="btn btn-secondary horse-feed-inline-btn"
              ${renderActionAttributes({
                action: 'add-horse-feed-plan-row',
                meta: { horseId: horse.id, feedSlot: slot.key },
              })}
              ${disabledAttr}
            >
              ${renderIcon('plus')}
              <span>Agregar</span>
            </button>
          </div>
          ${
            slotRows.length
              ? `
                <div class="horse-feed-grid-head">
                  <span>Producto</span>
                  <span>Cantidad</span>
                  <span>Unidad</span>
                  <span>Descontar stock</span>
                  <span>Acciones</span>
                </div>
                <div class="horse-feed-grid">
                  ${slotRows
                    .map((row) => `
                      <div class="horse-feed-grid-row">
                        <label class="horse-feed-field">
                          <span class="horse-feed-mobile-label">Producto</span>
                          <input
                            type="text"
                            list="${escapeHtml(datalistId)}"
                            value="${escapeHtml(row.feed_item_name || '')}"
                            placeholder="Ej. oats"
                            data-feed-plan-field="feed_item_name"
                            data-feed-plan-row-key="${escapeHtml(row.row_key)}"
                            ${disabledAttr}
                          />
                        </label>
                        <label class="horse-feed-field">
                          <span class="horse-feed-mobile-label">Cantidad</span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value="${escapeHtml(row.quantity || '')}"
                            placeholder="0"
                            data-feed-plan-field="quantity"
                            data-feed-plan-row-key="${escapeHtml(row.row_key)}"
                            ${disabledAttr}
                          />
                        </label>
                        <label class="horse-feed-field">
                          <span class="horse-feed-mobile-label">Unidad</span>
                          <input
                            type="text"
                            value="${escapeHtml(row.unit || '')}"
                            placeholder="kg"
                            data-feed-plan-field="unit"
                            data-feed-plan-row-key="${escapeHtml(row.row_key)}"
                            ${disabledAttr}
                          />
                        </label>
                        <label class="horse-feed-stock-toggle">
                          <span class="horse-feed-mobile-label">Descontar stock</span>
                          <input
                            type="checkbox"
                            ${row.auto_deduct_stock ? 'checked' : ''}
                            data-feed-plan-field="auto_deduct_stock"
                            data-feed-plan-row-key="${escapeHtml(row.row_key)}"
                            ${disabledAttr}
                          />
                          <span>${row.auto_deduct_stock ? 'Sí' : 'No'}</span>
                        </label>
                        <div class="horse-feed-row-actions">
                          <span class="horse-feed-mobile-label">Acciones</span>
                          <button
                            type="button"
                            class="btn btn-secondary horse-feed-inline-btn horse-feed-inline-btn--danger"
                            ${renderActionAttributes({
                              action: 'remove-horse-feed-plan-row',
                              meta: { horseId: horse.id, rowKey: row.row_key },
                            })}
                            ${disabledAttr}
                          >
                            ${renderIcon('trash')}
                            <span>Sacar</span>
                          </button>
                        </div>
                      </div>
                    `)
                    .join('')}
                </div>
              `
              : `
                <div class="horse-feed-empty-slot">
                  <strong>Sin mezcla en ${escapeHtml(slot.title.toLowerCase())}.</strong>
                  <span>Podés agregar avena, maíz, semitín o lo que corresponda para este slot.</span>
                </div>
              `
          }
        </article>
      `;
    }).join('');

    return `
      <section class="horse-history-block horse-feed-block">
        <div class="horse-history-block-head horse-feed-block-head">
          <div>
            <strong>Plan de Alimentación</strong>
            <span>Armá mezclas por mañana, tarde y noche. Al marcar el calendario, se registran juntos todos los ingredientes del slot.</span>
          </div>
          <button
            type="button"
            class="btn btn-primary"
            ${renderActionAttributes({
              action: 'save-horse-feed-plan',
              meta: { horseId: horse.id },
            })}
            ${disabledAttr}
          >
            ${renderIcon('check')}
            <span>${escapeHtml(isSaving ? 'Guardando...' : 'Guardar plan')}</span>
          </button>
        </div>

        <div class="modal-summary-grid horse-feed-summary-grid">
          <article class="modal-stat-card">
            <span>Slots activos</span>
            <strong>${escapeHtml(String(summary.slots))}</strong>
            <small>sobre ${escapeHtml(String(FEED_SLOT_META.length))} slots posibles</small>
          </article>
          <article class="modal-stat-card">
            <span>Ingredientes cargados</span>
            <strong>${escapeHtml(String(summary.ingredients))}</strong>
            <small>guardados para ${escapeHtml(horse.name)}</small>
          </article>
          <article class="modal-stat-card">
            <span>Marcas del mes</span>
            <strong>${escapeHtml(String(summary.completions))}</strong>
            <small>en ${escapeHtml(formatMonthLabel(selectedMonth))}</small>
          </article>
        </div>

        ${renderHorseFeedStatusBanner(payload, historyState)}

        <div class="modal-callout horse-feed-callout">
          <strong>Tip para granos y fardos</strong>
          <span>Usá el plan diario para consumo en kg o unidades chicas. Si terminás un fardo entero, registralo desde Stock para no mezclarlo con la ración diaria.</span>
        </div>

        <datalist id="${escapeHtml(datalistId)}">
          ${feedItems.map((item) => `<option value="${escapeHtml(item.name)}"></option>`).join('')}
        </datalist>

        <div class="horse-feed-slot-list">
          ${rowsMarkup}
        </div>
      </section>
    `;
  }

  function renderHorseFeedCalendar(state, horse, payload, historyPayload, historyState) {
    if (!state?.stockDashboard?.meta?.feed_module_enabled) {
      return '';
    }

    const selectedMonth = getHorseFeedCalendarMonth(payload, historyPayload);
    const draftRows = getHorseFeedPlanDraftRowsForModal(payload, historyPayload);
    const calendarEntries = getHorseFeedCalendarEntriesForMonth(historyPayload, selectedMonth);
    const entryMap = new Map(
      calendarEntries.map((row) => [`${row.event_date}:${row.feed_slot}`, row])
    );
    const validPlanRows = draftRows.filter(
      (row) =>
        row.feed_slot &&
        String(row.feed_item_name || '').trim() &&
        Number.isFinite(Number(row.quantity)) &&
        Number(row.quantity) > 0 &&
        String(row.unit || '').trim()
    );
    const slotSummaries = new Map();
    validPlanRows.forEach((row) => {
      const currentSummary = slotSummaries.get(row.feed_slot) || [];
      currentSummary.push(`${row.feed_item_name} ${row.quantity} ${row.unit}`);
      slotSummaries.set(row.feed_slot, currentSummary);
    });

    const monthInfo = getMonthDateInfo(selectedMonth);
    const weekdayHeaders = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
      .map((label) => `<div class="horse-feed-calendar-weekday">${escapeHtml(label)}</div>`)
      .join('');
    const leadingSpacers = Array.from(
      { length: monthInfo.first_weekday },
      () => '<div class="horse-feed-calendar-spacer"></div>'
    ).join('');
    const todayIso = todayDateString();
    const pendingKey = String(payload?.feedCalendarBusyKey || '').trim();
    const controlsDisabled =
      Boolean(payload?.feedPlanSaving) ||
      Boolean(payload?.feedCalendarBusyKey) ||
      Boolean(historyState?.loading);

    const dayCards = [];
    for (let day = 1; day <= monthInfo.total_days; day += 1) {
      const isoDate = buildIsoDateFromParts(monthInfo.year, monthInfo.month_index, day);
      const weekdayLabel = new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('es-UY', {
        weekday: 'short',
        timeZone: 'UTC',
      });

      const slotMarkup = FEED_SLOT_META.map((slot) => {
        const key = `${isoDate}:${slot.key}`;
        const checked = entryMap.has(key);
        const hasPlan = slotSummaries.has(slot.key);
        const slotSummary = (slotSummaries.get(slot.key) || []).join(' + ');
        const title = hasPlan
          ? `${slot.title}: ${slotSummary}`
          : `${slot.title}: sin plan guardado`;

        return `
          <label class="horse-feed-calendar-slot${checked ? ' is-checked' : ''}${hasPlan ? '' : ' is-disabled'}" title="${escapeHtml(
            title
          )}">
            <input
              type="checkbox"
              data-feed-calendar-toggle="true"
              data-horse-id="${escapeHtml(String(horse.id))}"
              data-feed-calendar-slot="${escapeHtml(slot.key)}"
              data-feed-calendar-date="${escapeHtml(isoDate)}"
              ${checked ? 'checked' : ''}
              ${hasPlan && pendingKey !== key && !controlsDisabled ? '' : 'disabled'}
            />
            <span>${escapeHtml(slot.label)}</span>
          </label>
        `;
      }).join('');

      dayCards.push(`
        <div class="horse-feed-calendar-day${isoDate === todayIso ? ' is-today' : ''}">
          <div class="horse-feed-calendar-day-head">
            <strong>${escapeHtml(String(day))}</strong>
            <span>${escapeHtml(weekdayLabel)}</span>
          </div>
          <div class="horse-feed-calendar-slots">${slotMarkup}</div>
        </div>
      `);
    }

    return `
      <section class="horse-history-block horse-feed-calendar-block">
        <div class="horse-history-block-head horse-feed-block-head">
          <div>
            <strong>Calendario de Alimentación</strong>
            <span>Marcá cada comida cuando realmente la das. Eso genera el consumo para este caballo.</span>
          </div>
          <div class="horse-feed-calendar-controls">
            <button
              type="button"
              class="btn btn-secondary horse-feed-inline-btn"
              ${renderActionAttributes({
                action: 'shift-horse-feed-calendar-month',
                meta: { horseId: horse.id, monthDelta: -1 },
              })}
              ${controlsDisabled ? ' disabled' : ''}
            >
              ${renderIcon('chevronLeft')}
            </button>
            <input
              type="month"
              value="${escapeHtml(selectedMonth)}"
              data-horse-feed-month="true"
              data-horse-id="${escapeHtml(String(horse.id))}"
              ${controlsDisabled ? ' disabled' : ''}
            />
            <button
              type="button"
              class="btn btn-secondary horse-feed-inline-btn"
              ${renderActionAttributes({
                action: 'set-horse-feed-calendar-month',
                meta: { horseId: horse.id, month: currentYearMonthString() },
              })}
              ${controlsDisabled ? ' disabled' : ''}
            >
              <span>Mes actual</span>
            </button>
            <button
              type="button"
              class="btn btn-secondary horse-feed-inline-btn"
              ${renderActionAttributes({
                action: 'shift-horse-feed-calendar-month',
                meta: { horseId: horse.id, monthDelta: 1 },
              })}
              ${controlsDisabled ? ' disabled' : ''}
            >
              ${renderIcon('chevronRight')}
            </button>
          </div>
        </div>

        ${
          validPlanRows.length
            ? ''
            : `
              <div class="horse-feed-empty-slot">
                <strong>Guardá al menos un ingrediente en el plan.</strong>
                <span>Cuando haya mezcla en mañana, tarde o noche, el calendario se habilita para ese slot.</span>
              </div>
            `
        }

        <div class="horse-feed-calendar-shell">
          <div class="horse-feed-calendar-header">
            <strong>${escapeHtml(formatMonthLabel(selectedMonth))}</strong>
            <span>${escapeHtml(validPlanRows.length ? 'Solo se activan los slots con mezcla guardada.' : 'Todavía no hay slots disponibles para marcar.')}</span>
          </div>
          <div class="horse-feed-calendar-grid">
            <div class="horse-feed-calendar-weekdays">${weekdayHeaders}</div>
            <div class="horse-feed-calendar-days">${leadingSpacers}${dayCards.join('')}</div>
          </div>
        </div>
      </section>
    `;
  }

  function renderHorseFeedRecentHistory(state, historyPayload) {
    if (!state?.stockDashboard?.meta?.feed_module_enabled) {
      return '';
    }

    const feedRows = Array.isArray(historyPayload?.feed_history)
      ? historyPayload.feed_history.slice(0, 8)
      : [];

    return `
      <section class="horse-history-block">
        <div class="horse-history-block-head">
          <strong>Últimos Consumos</strong>
        </div>
        ${
          feedRows.length
            ? `
              <div class="horse-feed-log-list">
                ${feedRows
                  .map((row) => `
                    <article class="horse-feed-log-row">
                      <div class="horse-feed-log-copy">
                        <strong>${escapeHtml(row.feed_item || 'Sin producto')}</strong>
                        <span>${escapeHtml(`${formatStockValueLabel(row.quantity, row.unit)} · ${formatDateLabel(row.event_date || String(row.at || '').slice(0, 10))}`)}</span>
                      </div>
                      <div class="horse-feed-log-meta">
                        ${row.feed_slot ? renderBadge(getFeedSlotLabel(row.feed_slot), 'blue') : renderBadge('Manual', 'gray')}
                        ${renderBadge(getHorseFeedHistorySourceLabel(row), row.calendar_slot_entry_id != null ? 'green' : 'gray')}
                      </div>
                    </article>
                  `)
                  .join('')}
              </div>
            `
            : `
              <div class="group-manage-empty">
                <strong>Este caballo todavía no tiene consumos registrados.</strong>
                <span>Cuando marques el calendario o cargues una ración manual, el historial va a aparecer acá.</span>
              </div>
            `
        }
      </section>
    `;
  }

  function renderRealHorseHistoryModal(state, payload) {
    const horse = getRealHorseById(state, payload.horseId);
    if (!horse) {
      return '';
    }

    const historyState = getRealHorseHistoryState(state, horse.id);
    const historyPayload = historyState?.data || null;

    if (!historyState || (!historyPayload && historyState?.loading)) {
      return renderInfoModal({
        size: 'wide',
        title: `Historial de ${horse.name}`,
        subtitle: 'Movimientos, alimentación y registros de salud',
        body: `
          <div class="modal-callout">
            <strong>Cargando historial real...</strong>
            <span>Estamos trayendo movimientos, plan de alimentación y controles de salud desde Neon.</span>
          </div>
        `,
        footerButtons: [
          { label: 'Cerrar', tone: 'secondary', trigger: { action: 'close-modal' } },
        ],
      });
    }

    if (!historyPayload && historyState?.error) {
      return renderInfoModal({
        size: 'wide',
        title: `Historial de ${horse.name}`,
        subtitle: 'Movimientos, alimentación y registros de salud',
        body: `
          <div class="modal-callout modal-callout--critical">
            <strong>No pudimos cargar el historial.</strong>
            <span>${escapeHtml(historyState.error)}</span>
          </div>
        `,
        footerButtons: [
          { label: 'Cerrar', tone: 'secondary', trigger: { action: 'close-modal' } },
          {
            label: 'Reintentar',
            tone: 'primary',
            trigger: { action: 'reload-horse-history', meta: { horseId: horse.id } },
          },
        ],
      });
    }

    const currentGroup = historyPayload?.current_group_membership || horse.current_group || null;
    const currentGrazing = historyPayload?.current_grazing || horse.current_location || null;
    const dewormRow = Array.isArray(historyPayload?.deworming_history)
      ? historyPayload.deworming_history[0] || null
      : null;
    const farrierRow = Array.isArray(historyPayload?.farrier_history)
      ? historyPayload.farrier_history[0] || null
      : null;
    const movementRows = Array.isArray(historyPayload?.grazing_history)
      ? historyPayload.grazing_history.slice(0, 6)
      : [];

    return renderInfoModal({
      size: 'wide',
      title: `Historial de ${horse.name}`,
      subtitle: 'Movimientos, alimentación y registros de salud',
      body: `
        <section class="horse-history-summary">
          <div class="horse-history-summary-head">
            <div>
              <strong>${escapeHtml(horse.name)}</strong>
              <span>${escapeHtml(getHorseCardSubtitle(horse))}</span>
            </div>
            ${currentGroup?.group_name || currentGroup?.name ? renderBadge(currentGroup.group_name || currentGroup.name, 'blue') : renderBadge('Individual', 'gray')}
          </div>
          <div class="horse-history-summary-meta">
            <span>${renderIcon('singleHorse')} ${escapeHtml(getHorseProfileSummary(horse))}</span>
            <span>${renderIcon('pin')} ${escapeHtml(currentGrazing?.paddock_name || 'Sin potrero asignado')}</span>
          </div>
        </section>

        <section class="horse-history-block">
          <div class="horse-history-block-head">
            <strong>Registros de Salud</strong>
          </div>
          <div class="horse-history-health-list">
            <article class="horse-history-health-card horse-history-health-card--purple">
              <div class="horse-history-health-icon">${renderIcon('shield')}</div>
              <div class="horse-history-health-copy">
                <strong>Desparasitación</strong>
                <span>Control veterinario</span>
                <dl>
                  <div>
                    <dt>Ultima aplicación:</dt>
                    <dd>${escapeHtml(dewormRow?.event_date ? formatDateLabel(dewormRow.event_date) : 'Sin registro')}</dd>
                  </div>
                  <div>
                    <dt>Próxima programada:</dt>
                    <dd>${escapeHtml(dewormRow?.next_due_date ? formatDateLabel(dewormRow.next_due_date) : 'Sin fecha')}</dd>
                  </div>
                </dl>
              </div>
            </article>
            <article class="horse-history-health-card horse-history-health-card--orange">
              <div class="horse-history-health-icon">${renderIcon('work')}</div>
              <div class="horse-history-health-copy">
                <strong>Herraje</strong>
                <span>Mantenimiento de cascos</span>
                <dl>
                  <div>
                    <dt>Ultimo herraje:</dt>
                    <dd>${escapeHtml(farrierRow?.at ? formatDateLabel(String(farrierRow.at).slice(0, 10)) : 'Sin registro')}</dd>
                  </div>
                  <div>
                    <dt>Próximo programado:</dt>
                    <dd>${escapeHtml(farrierRow?.next_due_date ? formatDateLabel(farrierRow.next_due_date) : 'Sin fecha')}</dd>
                  </div>
                </dl>
              </div>
            </article>
          </div>
        </section>

        ${renderHorseFeedPlanEditor(state, horse, payload, historyPayload, historyState)}
        ${renderHorseFeedCalendar(state, horse, payload, historyPayload, historyState)}
        ${renderHorseFeedRecentHistory(state, historyPayload)}

        <section class="horse-history-block">
          <div class="horse-history-block-head">
            <strong>Historial de Movimientos</strong>
          </div>
          <div class="horse-history-timeline">
            ${
              movementRows.length
                ? movementRows
                    .map((row) => {
                      const periodLabel = row.exited_at
                        ? `${row.days || row.grazing_days || 0} día(s) · ${formatDateLabel(row.entered_at)} - ${formatDateLabel(row.exited_at)}`
                        : `${row.days || row.grazing_days || 0} día(s) · Desde ${formatDateLabel(row.entered_at)}`;
                      const notes = [row.source_group_name ? `Grupo: ${row.source_group_name}` : '', row.entry_notes || '', row.exit_notes || '']
                        .filter(Boolean)
                        .join(' · ');

                      return `
                        <article class="horse-history-timeline-row">
                          <div class="horse-history-timeline-dot${row.exited_at ? '' : ' is-current'}"></div>
                          <div class="horse-history-timeline-copy">
                            <div class="horse-history-timeline-title">
                              <strong>${escapeHtml(row.paddock_name || 'Sin potrero')}</strong>
                              ${row.exited_at ? '' : renderBadge('Actual', 'gray')}
                            </div>
                            <span>${escapeHtml(periodLabel)}</span>
                            ${notes ? `<small>${escapeHtml(notes)}</small>` : ''}
                          </div>
                        </article>
                      `;
                    })
                    .join('')
                : `
                  <div class="group-manage-empty">
                    <strong>Este caballo todavía no tiene movimientos cargados.</strong>
                    <span>Cuando se mueva entre potreros, la línea temporal va a aparecer acá.</span>
                  </div>
                `
            }
          </div>
        </section>
      `,
      footerButtons: [
        { label: 'Cerrar', tone: 'secondary', trigger: { action: 'close-modal' } },
        {
          label: 'Editar Caballo',
          tone: 'primary',
          icon: 'edit',
          trigger: { action: 'open-modal', value: 'horse-form', meta: { mode: 'edit', horseId: horse.id } },
        },
      ],
    });
  }

  function renderRealHorseFormModal(state, payload) {
    const isEdit = payload.mode === 'edit';
    const horse = isEdit ? getRealHorseById(state, payload.horseId) : null;
    if (isEdit && !horse) {
      return '';
    }

    const groupOptions = buildRealGroupSelectOptions(state, {
      includeBlank: true,
      blankLabel: 'Sin grupo / Individual',
    });
    const paddockOptions = buildRealPaddockSelectOptions(state, {
      includeBlank: true,
      blankLabel: 'Sin potrero / Fuera del campo',
    });

    return renderFormModal({
      key: 'horse-form',
      size: 'wide',
      title: isEdit ? `Editar ${horse.name}` : 'Registrar Nuevo Caballo',
      subtitle: isEdit
        ? 'Actualiza la información del caballo'
        : 'Agrega un caballo al sistema',
      submitLabel: isEdit ? 'Guardar Cambios' : 'Crear Caballo',
      submitIcon: isEdit ? 'check' : 'plus',
      columns: 2,
      fields: [
        {
          label: 'Nombre',
          name: 'horseName',
          type: 'text',
          value: isEdit ? horse.name : '',
          placeholder: 'Ej: Zeus',
          required: true,
          layout: 'wide',
        },
        {
          label: 'Fecha de nacimiento',
          name: 'dateOfBirth',
          type: 'date',
          value: isEdit ? horse.date_of_birth || '' : '',
        },
        {
          label: 'Sexo',
          name: 'sex',
          type: 'select',
          value: isEdit ? horse.sex || '' : '',
          options: HORSE_SEX_OPTIONS,
        },
        {
          label: 'Pelaje',
          name: 'color',
          type: 'select',
          value: isEdit ? horse.color || '' : '',
          options: HORSE_COLOR_OPTIONS,
        },
        {
          label: 'Actividad',
          name: 'activity',
          type: 'select',
          value: isEdit ? horse.activity || '' : '',
          options: HORSE_ACTIVITY_OPTIONS,
        },
        {
          label: 'Entrenamiento',
          name: 'trainingStatus',
          type: 'select',
          value: isEdit ? horse.training_status || '' : '',
          options: HORSE_TRAINING_OPTIONS,
          disabled: !(state.horsesDashboard?.meta?.training_module_enabled),
        },
        {
          label: 'Potrero Actual',
          name: 'paddockId',
          type: 'select',
          value: isEdit ? String(horse.current_location?.paddock_id || '') : '',
          options: paddockOptions,
          hint: 'Si cambia, registramos el movimiento real del caballo.',
        },
        {
          label: 'Grupo',
          name: 'groupId',
          type: 'select',
          value: isEdit ? String(horse.current_group?.id || '') : '',
          options: groupOptions,
          hint: 'Si elegís otro grupo, actualizamos la membresía activa.',
        },
      ],
      extraBody:
        isEdit && horse
          ? `
            <div class="modal-detail-card modal-field--wide">
              <strong>Cuidados actuales</strong>
              <span>${escapeHtml(
                [
                  formatHorseCareLine(horse.care?.deworming, 'Desparasitación'),
                  formatHorseCareLine(horse.care?.farrier, 'Herraje'),
                ].join(' · ')
              )}</span>
            </div>
          `
          : '',
      footerButtons: [
        { label: 'Cancelar', tone: 'secondary', trigger: { action: 'close-modal' } },
        ...(isEdit
          ? [
              {
                label: 'Eliminar',
                tone: 'danger',
                icon: 'close',
                trigger: { action: 'delete-horse', meta: { horseId: horse.id } },
              },
            ]
          : []),
        {
          label: isEdit ? 'Guardar Cambios' : 'Crear Caballo',
          tone: 'primary',
          icon: isEdit ? 'check' : 'plus',
          submit: true,
        },
      ],
    });
  }

  function renderRealGroupCreateModal(state) {
    const paddockOptions = buildRealPaddockSelectOptions(state, {
      includeBlank: true,
      blankLabel: 'Seleccionar potrero',
    });

    return renderFormModal({
      key: 'group-form',
      title: 'Crear Nuevo Grupo',
      subtitle: 'Agrupa caballos para manejo conjunto',
      submitLabel: 'Crear Grupo',
      submitIcon: 'plus',
      fields: [
        {
          label: 'Nombre del Grupo',
          name: 'groupName',
          type: 'text',
          value: '',
          placeholder: 'Ej: Grupo E',
          required: true,
        },
        {
          label: 'Potrero Inicial',
          name: 'paddockId',
          type: 'select',
          value: '',
          options: paddockOptions,
          hint:
            'Si el grupo nace sin caballos, el potrero queda como referencia para el siguiente paso.',
        },
      ],
    });
  }

  function renderRealMoveHorseModal(state, payload) {
    const horseOptions = buildRealHorseSelectOptions(state, {
      includeBlank: true,
      blankLabel: 'Seleccionar caballo',
    });
    const paddockOptions = buildRealPaddockSelectOptions(state, {
      includeBlank: false,
    });
    const selectedHorse =
      payload?.horseId != null ? getRealHorseById(state, payload.horseId) : null;

    return renderFormModal({
      key: 'move-horse',
      title: 'Mover Caballo a Potrero',
      subtitle: 'Registra el movimiento de un caballo',
      submitLabel: 'Registrar Movimiento',
      submitIcon: 'arrow',
      fields: [
        {
          label: 'Caballo',
          name: 'horseId',
          type: 'select',
          value: payload?.horseId ? String(payload.horseId) : '',
          options: horseOptions,
          required: true,
        },
        {
          label: 'Potrero Destino',
          name: 'paddockId',
          type: 'select',
          value:
            payload?.paddockId != null
              ? String(payload.paddockId)
              : String(
                  paddockOptions[0]?.value ||
                    selectedHorse?.current_location?.paddock_id ||
                    ''
                ),
          options: paddockOptions,
          required: true,
        },
        {
          label: 'Notas (opcional)',
          name: 'notes',
          type: 'textarea',
          rows: 4,
          placeholder: 'Motivo del movimiento...',
          layout: 'wide',
        },
      ],
      extraBody: `
        <div class="modal-detail-card modal-field--wide">
          <strong>Fecha del movimiento</strong>
          <span>Se registra con fecha de hoy: ${escapeHtml(formatDateLabel(todayDateString()))}</span>
        </div>
      `,
    });
  }

  function renderRealMoveGroupModal(state, payload) {
    const groupOptions = buildRealGroupSelectOptions(state, {
      includeBlank: true,
      blankLabel: 'Seleccionar grupo',
    });
    const paddockOptions = buildRealPaddockSelectOptions(state, {
      includeBlank: false,
    });
    const group =
      payload?.groupId != null
        ? getRealHorseGroupById(state, payload.groupId)
        : getRealHorseGroupByName(state, payload?.groupName || '');
    const selectedPaddockId =
      payload?.paddockId != null && payload.paddockId !== ''
        ? String(payload.paddockId)
        : String(paddockOptions[0]?.value || '');

    return renderFormModal({
      key: 'move-group',
      title: 'Mover Grupo a Potrero',
      subtitle: group
        ? `Registra el movimiento de ${group.name} a un nuevo potrero`
        : 'Registra el movimiento de un grupo a un nuevo potrero',
      submitLabel: 'Mover Grupo',
      submitIcon: 'arrow',
      callout: group
        ? {
            title: `${group.name} - ${formatHorseCountLabel(group.count)}`,
            detail: `${group.paddock_name} · ${group.location_detail}`,
          }
        : null,
      fields: [
        {
          label: 'Grupo',
          name: 'groupId',
          type: 'select',
          value: group?.id ? String(group.id) : '',
          options: groupOptions,
          required: true,
        },
        {
          label: 'Potrero Destino',
          name: 'paddockId',
          type: 'select',
          value: selectedPaddockId,
          options: paddockOptions,
          required: true,
        },
        {
          label: 'Fecha del movimiento',
          name: 'eventDate',
          type: 'date',
          value: payload?.eventDate || todayDateString(),
          hint: 'Podés cargar una fecha anterior si registrás la movida unos días más tarde.',
          required: true,
        },
        {
          label: 'Notas (opcional)',
          name: 'notes',
          type: 'textarea',
          rows: 4,
          placeholder: 'Motivo del movimiento...',
          layout: 'wide',
        },
      ],
    });
  }

  function renderRealRainModal(payload) {
    return renderFormModal({
      key: 'register-rain',
      title: 'Registrar Lluvia',
      subtitle: 'Guarda precipitaciones para todo el campo',
      submitLabel: 'Registrar Lluvia',
      submitIcon: 'rain',
      callout: {
        title: 'Registro global',
        detail: 'La lluvia se guarda a nivel campo, no por potrero individual.',
      },
      fields: [
        {
          label: 'Cantidad (mm)',
          name: 'rainMm',
          type: 'number',
          value: payload?.rainMm || '',
          min: '0',
          step: '0.1',
          placeholder: '12',
          required: true,
        },
        {
          label: 'Fecha',
          name: 'eventDate',
          type: 'date',
          value: payload?.eventDate || todayDateString(),
          required: true,
        },
        {
          label: 'Notas (opcional)',
          name: 'notes',
          type: 'textarea',
          rows: 4,
          placeholder: 'Ejemplo: lluvia continua durante la noche.',
          layout: 'wide',
        },
      ],
    });
  }

  function renderRealFrostModal(payload) {
    return renderFormModal({
      key: 'register-frost',
      title: 'Registrar Helada',
      subtitle: 'Anota eventos climáticos para todo el campo',
      submitLabel: 'Registrar Helada',
      submitIcon: 'snow',
      callout: {
        title: 'Evento climático global',
        detail: 'La helada se registra a nivel campo y después la usamos en reportes generales.',
      },
      fields: [
        {
          label: 'Intensidad',
          name: 'intensity',
          type: 'select',
          value: payload?.intensity || 'moderate',
          options: FROST_INTENSITY_OPTIONS,
          required: true,
        },
        {
          label: 'Fecha',
          name: 'eventDate',
          type: 'date',
          value: payload?.eventDate || todayDateString(),
          required: true,
        },
        {
          label: 'Observaciones',
          name: 'notes',
          type: 'textarea',
          rows: 4,
          placeholder: 'Ejemplo: pasto escarchado a primera hora.',
          layout: 'wide',
        },
      ],
    });
  }

  function renderRealFieldWorkModal(state, payload) {
    const paddockOptions = buildRealPaddockSelectOptions(state, {
      includeBlank: true,
      blankLabel: 'Seleccionar potrero',
    });

    if (paddockOptions.length <= 1) {
      return renderInfoModal({
        title: 'Sin potreros disponibles',
        subtitle: 'Necesitamos al menos un potrero activo para registrar trabajos.',
        body: `
          <div class="modal-detail-card">
            <strong>No hay potreros cargados</strong>
            <span>Creá o activá un potrero antes de registrar trabajos de campo.</span>
          </div>
        `,
      });
    }

    return renderFormModal({
      key: 'field-work',
      title: 'Registrar Trabajo de Campo',
      subtitle: 'Documenta tareas operativas del potrero',
      submitLabel: 'Guardar Trabajo',
      submitIcon: 'work',
      callout: {
        title: 'Responsable flexible',
        detail: 'Podés cargar personal del campo o personas externas sin depender de un padrón fijo.',
      },
      fields: [
        {
          label: 'Tipo de trabajo',
          name: 'eventType',
          type: 'select',
          value: payload?.eventType || FIELD_WORK_TYPE_OPTIONS[0].value,
          options: FIELD_WORK_TYPE_OPTIONS,
          required: true,
        },
        {
          label: 'Potrero',
          name: 'paddockId',
          type: 'select',
          value:
            payload?.paddockId != null && payload.paddockId !== ''
              ? String(payload.paddockId)
              : '',
          options: paddockOptions,
          required: true,
        },
        {
          label: 'Fecha',
          name: 'eventDate',
          type: 'date',
          value: payload?.eventDate || todayDateString(),
          required: true,
        },
        {
          label: 'Tipo de responsable',
          name: 'performedByKind',
          type: 'select',
          value: payload?.performedByKind || 'unspecified',
          options: RESPONSIBLE_KIND_OPTIONS,
        },
        {
          label: 'Responsable (opcional)',
          name: 'performedBy',
          type: 'text',
          value: payload?.performedBy || '',
          placeholder: 'Ej: Manuel García o Contratista Pérez',
          hint: 'Podés escribir una persona del campo o un proveedor externo.',
        },
        {
          label: 'Notas',
          name: 'notes',
          type: 'textarea',
          rows: 4,
          placeholder: 'Detalle del trabajo realizado...',
          layout: 'wide',
        },
      ],
    });
  }

  function renderRealNewTaskModal() {
    return renderInfoModal({
      title: 'Nueva Tarea',
      subtitle: 'El calendario real todavía no tiene una tabla propia de tareas manuales.',
      body: `
        <div class="stack-gap">
          <div class="modal-detail-card">
            <strong>Cómo funciona hoy</strong>
            <span>Esta vista arma tareas reales desde vencimientos de salud, hitos de potreros y eventos ya registrados en la base.</span>
          </div>
          <div class="modal-role-help">
            <article>
              <strong>Trabajo de campo</strong>
              <span>Regístralo desde Potreros para que aparezca en el calendario.</span>
            </article>
            <article>
              <strong>Movimiento o cuidado</strong>
              <span>Usa Caballos para que el evento quede guardado con impacto real.</span>
            </article>
            <article>
              <strong>Lluvia o helada</strong>
              <span>Regístralo desde Potreros y se verá en el mes correspondiente.</span>
            </article>
          </div>
        </div>
      `,
      footerButtons: [
        { label: 'Cerrar', tone: 'secondary', trigger: { action: 'close-modal' } },
        { label: 'Ir a Potreros', tone: 'primary', trigger: { action: 'close-and-nav', value: 'paddocks' } },
      ],
    });
  }

  function renderRealCalendarTaskDetailModal(state, payload) {
    const modalMonth = normalizeCalendarMonthValue(payload?.month || getCalendarMonthKeyFromOffset(state?.calendarMonthOffset || 0));
    const allTasks = [
      ...buildRealCalendarPendingTasks(state, modalMonth),
      ...buildRealCalendarCompletedTasks(state, modalMonth),
    ];
    const task = allTasks.find((item) => item.key === payload?.taskKey);

    if (!task) {
      return renderInfoModal({
        title: 'Actividad no disponible',
        subtitle: 'No pudimos reconstruir el elemento seleccionado del calendario.',
        body: `
          <div class="modal-detail-card">
            <strong>Probá refrescar el calendario</strong>
            <span>Puede haber cambiado el mes cargado o los datos reales desde Neon.</span>
          </div>
        `,
      });
    }

    return renderInfoModal({
      title: task.completed ? 'Detalle de la Actividad' : 'Detalle de la Tarea',
      subtitle: task.completed
        ? 'Información completa del evento registrado'
        : 'Información completa de la tarea derivada desde la base',
      body: `
        <div class="modal-summary-grid">
          <article class="modal-stat-card">
            <span>Tipo</span>
            <strong>${escapeHtml(task.tag)}</strong>
          </article>
          <article class="modal-stat-card">
            <span>Fecha</span>
            <strong>${escapeHtml(task.dateLabel)}</strong>
          </article>
          <article class="modal-stat-card">
            <span>${escapeHtml(task.completed ? 'Estado' : 'Prioridad')}</span>
            <strong>${escapeHtml(task.priority)}</strong>
          </article>
        </div>
        <div class="modal-detail-card">
          <strong>${escapeHtml(task.title)}</strong>
          <span>${escapeHtml(task.detail)}</span>
        </div>
        ${
          task.description
            ? `
              <div class="modal-detail-card">
                <strong>Contexto</strong>
                <span>${escapeHtml(task.description)}</span>
              </div>
            `
            : ''
        }
        ${
          task.notes
            ? `
              <div class="modal-detail-card">
                <strong>Notas</strong>
                <span>${escapeHtml(task.notes)}</span>
              </div>
            `
            : ''
        }
      `,
      footerButtons: [
        { label: 'Cerrar', tone: 'secondary', trigger: { action: 'close-modal' } },
        ...(task.navKey
          ? [
              {
                label: task.completed ? 'Abrir módulo' : 'Resolver en módulo',
                tone: 'primary',
                trigger: { action: 'close-and-nav', value: task.navKey },
              },
            ]
          : []),
      ],
    });
  }

  function getOwnerByName(name) {
    return (
      DEMO_DATA.owners.owners.find((item) => item.name === name) ||
      DEMO_DATA.owners.owners[0]
    );
  }

  function getProductByName(name) {
    return (
      DEMO_DATA.stock.products.find((item) => item.name === name) ||
      DEMO_DATA.stock.products[0]
    );
  }

  function renderRealStockItemModal(state, payload) {
    const requestedItemId = parsePositiveInt(payload?.itemId);
    const requestedItem =
      getRealStockItemById(state, requestedItemId) || getRealStockItemByName(state, payload?.name);
    const isEdit = payload?.mode === 'edit' && Boolean(requestedItem);

    return renderFormModal({
      key: 'product-form',
      title: isEdit ? `Editar ${requestedItem.name}` : 'Nuevo inventario',
      subtitle: isEdit
        ? 'Actualizá stock base, presentación de compra, costo y proveedor del producto.'
        : 'Creá un producto real para inventario, compras y contabilidad.',
      submitLabel: isEdit ? 'Guardar inventario' : 'Crear inventario',
      submitIcon: isEdit ? 'edit' : 'plus',
      columns: 2,
      callout: isEdit
        ? {
            title: requestedItem.name,
            detail: `Stock actual ${formatStockValueLabel(
              requestedItem.current_stock,
              requestedItem.unit
            )} · Última compra ${formatCompactDateLabel(requestedItem.last_purchase_date)}`,
          }
        : null,
      fields: [
        {
          label: 'Producto',
          name: 'itemName',
          type: 'text',
          value: isEdit ? requestedItem.name : '',
          placeholder: 'Ej. oats, corn, alfalfa',
          required: true,
        },
        {
          label: 'Unidad base',
          name: 'unit',
          type: 'text',
          value: isEdit ? requestedItem.unit : '',
          placeholder: 'kg, L, fardos...',
          required: true,
          hint: 'La unidad base es la que usás para stock y consumo diario.',
        },
        {
          label: isEdit ? 'Stock actual' : 'Stock inicial',
          name: 'currentStock',
          type: 'number',
          value: isEdit ? String(requestedItem.current_stock ?? '') : '',
          min: '0',
          step: '0.01',
          required: true,
        },
        {
          label: 'Stock mínimo',
          name: 'minimumStock',
          type: 'number',
          value: isEdit && requestedItem.minimum_stock != null ? String(requestedItem.minimum_stock) : '',
          min: '0',
          step: '0.01',
          placeholder: 'Opcional',
        },
        {
          label: 'Proveedor',
          name: 'supplier',
          type: 'text',
          value: isEdit ? requestedItem.supplier || '' : '',
          placeholder: 'Proveedor habitual',
        },
        {
          label: 'Formato de compra',
          name: 'purchaseUnitLabel',
          type: 'text',
          value: isEdit ? requestedItem.purchase_unit_label || '' : '',
          placeholder: 'Ej. bolsa, fardo, bidón',
          hint: 'Cómo comprás este producto. Si lo comprás por bolsa, escribí bolsa.',
        },
        {
          label: 'Cantidad por compra',
          name: 'purchaseUnitSize',
          type: 'number',
          value:
            isEdit && requestedItem.purchase_unit_size != null
              ? String(requestedItem.purchase_unit_size)
              : '',
          min: '0.01',
          step: '0.01',
          placeholder: 'Ej. 25',
          hint: `Cuántos ${isEdit ? requestedItem.unit : 'kg'} trae cada compra. Si el costo ya es por unidad base, dejalo vacío o en 1.`,
        },
        {
          label: 'Costo por compra',
          name: 'unitCost',
          type: 'number',
          value: isEdit && requestedItem.unit_cost != null ? String(requestedItem.unit_cost) : '',
          min: '0',
          step: '0.01',
          placeholder: '0.00',
          hint: 'Ejemplo: si una bolsa trae 25 kg y vale 480, cargá 480 acá y 25 en cantidad por compra.',
        },
        {
          label: 'Última compra',
          name: 'lastPurchaseDate',
          type: 'date',
          value: isEdit ? requestedItem.last_purchase_date || '' : '',
        },
      ],
      extraBody:
        isEdit && requestedItem
          ? `<input type="hidden" name="itemId" value="${escapeHtml(String(requestedItem.id))}" />`
          : '',
    });
  }

  function renderRealStockPurchaseModal(state, payload) {
    const items = getRealStockItems(state);
    if (!items.length) {
      return renderInfoModal({
        title: 'Primero cargá un inventario',
        subtitle: 'Necesitamos al menos un producto para registrar una compra real.',
        body: `
          <div class="empty-state-card">
            <strong>No hay productos activos para sumar stock.</strong>
            <span>Creá el item de inventario primero y después registramos la compra con costo, proveedor y fecha.</span>
          </div>
        `,
        footerButtons: [
          { label: 'Cerrar', tone: 'secondary', trigger: { action: 'close-modal' } },
          {
            label: 'Nuevo inventario',
            tone: 'primary',
            icon: 'plus',
            trigger: { action: 'open-modal', value: 'product-form' },
          },
        ],
      });
    }

    const requestedItemId = parsePositiveInt(payload?.itemId);
    const selectedItem =
      getRealStockItemById(state, requestedItemId) ||
      getRealStockItemByName(state, payload?.name) ||
      items[0];
    const purchaseUnitSize = getStockPurchaseUnitSize(selectedItem);
    const purchaseUnitLabel = getStockPurchaseUnitLabel(selectedItem);
    const usesPurchaseUnit = usesStockPurchaseUnit(selectedItem);
    const quantityFieldLabel = usesPurchaseUnit
      ? `Cantidad comprada${purchaseUnitLabel ? ` (${purchaseUnitLabel})` : ''}`
      : 'Cantidad ingresada';
    const quantityFieldHint = usesPurchaseUnit
      ? `Cada ${purchaseUnitLabel || 'compra'} suma ${formatStockValueLabel(
          purchaseUnitSize,
          selectedItem.unit
        )} al stock.`
      : `Cargá la cantidad en ${selectedItem.unit}.`;
    const costFieldLabel = usesPurchaseUnit
      ? `Costo por ${purchaseUnitLabel || 'compra'}`
      : 'Costo por unidad base';
    const costFieldHint = usesPurchaseUnit
      ? `Guardamos el precio por ${purchaseUnitLabel || 'compra'} y lo convertimos a ${selectedItem.unit} para las cuentas.`
      : `Este costo se usa directo como precio por ${selectedItem.unit}.`;

    return renderFormModal({
      key: 'purchase-create',
      title: 'Ingresar stock',
      subtitle: usesPurchaseUnit
        ? 'Registrá una compra real por bolsa o presentación y actualizamos el stock base automáticamente.'
        : 'Registrá una compra real con cantidad, costo y proveedor.',
      submitLabel: 'Guardar ingreso',
      submitIcon: 'cart',
      columns: 2,
      callout: {
        title: 'Este ingreso actualiza stock y contabilidad',
        detail:
          usesPurchaseUnit
            ? `Guardamos ${purchaseUnitLabel || 'la compra'}, costo por compra, proveedor y fecha. El stock sube en ${selectedItem.unit} automáticamente.`
            : 'Guardamos cantidad, costo por unidad base, proveedor y fecha de compra del producto seleccionado.',
      },
      fields: [
        {
          label: 'Producto',
          name: 'itemId',
          type: 'select',
          value: String(selectedItem.id),
          options: items.map((item) => ({
            value: String(item.id),
            label: item.name,
          })),
          required: true,
          layout: 'wide',
        },
        {
          label: quantityFieldLabel,
          name: 'quantity',
          type: 'number',
          value: '',
          min: '0.01',
          step: '0.01',
          placeholder: usesPurchaseUnit ? 'Ej. 3' : `Ej. 50 ${selectedItem.unit}`,
          required: true,
          hint: quantityFieldHint,
        },
        {
          label: costFieldLabel,
          name: 'unitCost',
          type: 'number',
          value: selectedItem.unit_cost != null ? String(selectedItem.unit_cost) : '',
          min: '0',
          step: '0.01',
          placeholder: '0.00',
          hint: costFieldHint,
        },
        {
          label: 'Proveedor',
          name: 'supplier',
          type: 'text',
          value: selectedItem.supplier || '',
          placeholder: 'Proveedor o comercio',
        },
        {
          label: 'Fecha de compra',
          name: 'eventDate',
          type: 'date',
          value: payload?.eventDate || todayDateString(),
          required: true,
        },
        {
          label: 'Notas',
          name: 'notes',
          type: 'textarea',
          rows: 3,
          placeholder: 'Factura, lote, comentario o referencia...',
          layout: 'wide',
        },
      ],
      footerButtons: [
        { label: 'Cancelar', tone: 'secondary', trigger: { action: 'close-modal' } },
        {
          label: 'Nuevo inventario',
          tone: 'secondary',
          icon: 'plus',
          trigger: { action: 'open-modal', value: 'product-form' },
        },
        { label: 'Guardar ingreso', tone: 'primary', icon: 'cart', submit: true },
      ],
    });
  }

  function getUserByName(name) {
    return (
      DEMO_DATA.settings.users.find((item) => item.name === name) ||
      DEMO_DATA.settings.users[0]
    );
  }

  function renderActiveModal(state) {
    if (!(state.modal && state.modal.key)) {
      return '';
    }

    const payload = state.modal.payload || {};
    const paddockOptions = DEMO_DATA.paddocks.cards.map((item) => item.name);
    const groupOptions = DEMO_DATA.horses.groups.map((item) => item.name);
    const horseOptions = DEMO_DATA.horses.horses.map((item) => item.name);
    const ownerOptions = DEMO_DATA.owners.owners.map((item) => item.name);
    const productOptions = DEMO_DATA.stock.products.map((item) => item.name);

    switch (state.modal.key) {
      case 'alerts-center':
        if (isRealSession(state)) {
          const alerts = getVisibleAlerts(state);
          const primaryNav = alerts.find((alert) => alert.navKey && alert.navKey !== 'home')?.navKey || null;

          return renderInfoModal({
            size: 'wide',
            title: 'Alertas activas',
            subtitle: 'Resumen visual de los puntos que requieren atención',
            body: `
              <div class="modal-alert-list">
                ${alerts
                  .map(
                    (alert) => `
                      <article class="modal-alert-row modal-alert-row--${escapeHtml(getRealAlertCardTone(alert.tone))}">
                        <div class="modal-alert-main">
                          <span class="modal-alert-icon">${renderIcon('bell')}</span>
                          <div>
                            <strong>${escapeHtml(alert.title)}</strong>
                            <span>${escapeHtml(alert.detail)}</span>
                          </div>
                        </div>
                        ${renderBadge(
                          alert.countLabel || `${alert.count} item(s)`,
                          alert.tone === 'critical' ? 'critical' : alert.tone === 'green' ? 'green' : 'warning'
                        )}
                      </article>
                    `
                  )
                  .join('')}
              </div>
            `,
            footerButtons: [
              { label: 'Cerrar', tone: 'secondary', trigger: { action: 'close-modal' } },
              ...(primaryNav
                ? [
                    {
                      label: 'Ir al módulo',
                      tone: 'primary',
                      trigger: { action: 'close-and-nav', value: primaryNav },
                    },
                  ]
                : []),
            ],
          });
        }

        return renderInfoModal({
          size: 'wide',
          title: 'Alertas activas',
          subtitle: 'Resumen visual de los puntos que requieren atención',
          body: `
            <div class="modal-alert-list">
              ${DEMO_DATA.alerts
                .map(
                  (alert) => `
                    <article class="modal-alert-row modal-alert-row--${escapeHtml(alert.tone)}">
                      <div class="modal-alert-main">
                        <span class="modal-alert-icon">${renderIcon('bell')}</span>
                        <div>
                          <strong>${escapeHtml(alert.title)}</strong>
                          <span>${escapeHtml(alert.detail)}</span>
                        </div>
                      </div>
                      ${renderBadge(`${alert.count} items`, alert.tone === 'critical' ? 'critical' : 'warning')}
                    </article>
                  `
                )
                .join('')}
            </div>
          `,
          footerButtons: [
            { label: 'Cerrar', tone: 'secondary', trigger: { action: 'close-modal' } },
            { label: 'Ir a Stock', tone: 'primary', trigger: { action: 'close-and-nav', value: 'stock' } },
          ],
        });

      case 'move-group':
        if (isRealSession(state)) {
          return renderRealMoveGroupModal(state, payload);
        }

        return renderFormModal({
          key: 'move-group',
          title: 'Mover Grupo a Potrero',
          subtitle: 'Rotación de grupos entre potreros',
          submitLabel: 'Mover Grupo',
          submitIcon: 'arrow',
          callout: payload.group
            ? {
                title: payload.group,
                detail: `Ubicación actual: ${payload.paddock || 'Sin potrero asignado'}`,
              }
            : null,
          fields: [
            { label: 'Grupo', name: 'group', type: 'select', value: payload.group || groupOptions[0], options: groupOptions },
            { label: 'Potrero Destino', name: 'targetPaddock', type: 'select', value: paddockOptions[1] || paddockOptions[0], options: paddockOptions },
            { label: 'Notas (opcional)', name: 'notes', type: 'textarea', rows: 4, placeholder: 'Motivo de la rotación...' },
          ],
        });

      case 'move-horse':
        if (isRealSession(state)) {
          return renderRealMoveHorseModal(state, payload);
        }

        return renderFormModal({
          key: 'move-horse',
          title: 'Mover Caballo',
          subtitle: 'Traslada un caballo a otro potrero',
          submitLabel: 'Mover Caballo',
          submitIcon: 'arrow',
          fields: [
            { label: 'Caballo', name: 'horse', type: 'select', value: payload.name || horseOptions[0], options: horseOptions },
            { label: 'Potrero Destino', name: 'targetPaddock', type: 'select', value: paddockOptions[0], options: paddockOptions },
            { label: 'Fecha', name: 'date', type: 'date', value: '2026-05-22' },
            { label: 'Notas', name: 'notes', type: 'textarea', rows: 3, placeholder: 'Observaciones del movimiento...' },
          ],
        });

      case 'register-rain':
        if (isRealSession(state)) {
          return renderRealRainModal(payload);
        }

        return renderFormModal({
          key: 'register-rain',
          title: 'Registrar Lluvia',
          subtitle: 'Guarda precipitaciones para todo el campo',
          submitLabel: 'Registrar Lluvia',
          submitIcon: 'rain',
          callout: {
            title: 'Registro global',
            detail: 'La lluvia se guarda a nivel campo, no por potrero individual.',
          },
          fields: [
            { label: 'Cantidad (mm)', name: 'rainMm', type: 'number', value: '12', min: '0', step: '0.1', required: true },
            { label: 'Fecha', name: 'eventDate', type: 'date', value: '2026-05-22', required: true },
            { label: 'Notas (opcional)', name: 'notes', type: 'textarea', rows: 4, placeholder: 'Ejemplo: lluvia continua durante la noche.', layout: 'wide' },
          ],
        });

      case 'register-frost':
        if (isRealSession(state)) {
          return renderRealFrostModal(payload);
        }

        return renderFormModal({
          key: 'register-frost',
          title: 'Registrar Helada',
          subtitle: 'Anota eventos climáticos para todo el campo',
          submitLabel: 'Registrar Helada',
          submitIcon: 'snow',
          callout: {
            title: 'Evento climático global',
            detail: 'La helada se registra a nivel campo y después la usamos en reportes generales.',
          },
          fields: [
            { label: 'Intensidad', name: 'intensity', type: 'select', value: 'moderate', options: FROST_INTENSITY_OPTIONS, required: true },
            { label: 'Fecha', name: 'eventDate', type: 'date', value: '2026-05-22', required: true },
            { label: 'Observaciones', name: 'notes', type: 'textarea', rows: 4, placeholder: 'Ejemplo: pasto escarchado a primera hora.', layout: 'wide' },
          ],
        });

      case 'field-work':
        if (isRealSession(state)) {
          return renderRealFieldWorkModal(state, payload);
        }

        return renderFormModal({
          key: 'field-work',
          title: 'Registrar Trabajo de Campo',
          subtitle: 'Documenta tareas operativas del potrero',
          submitLabel: 'Guardar Trabajo',
          submitIcon: 'work',
          callout: {
            title: 'Responsable flexible',
            detail: 'Podés cargar personal del campo o personas externas sin depender de un padrón fijo.',
          },
          fields: [
            { label: 'Tipo de trabajo', name: 'eventType', type: 'select', value: FIELD_WORK_TYPE_OPTIONS[0].value, options: FIELD_WORK_TYPE_OPTIONS, required: true },
            { label: 'Potrero', name: 'paddock', type: 'select', value: paddockOptions[0], options: paddockOptions, required: true },
            { label: 'Fecha', name: 'eventDate', type: 'date', value: '2026-05-22', required: true },
            { label: 'Tipo de responsable', name: 'performedByKind', type: 'select', value: 'unspecified', options: RESPONSIBLE_KIND_OPTIONS },
            { label: 'Responsable (opcional)', name: 'performedBy', type: 'text', value: '', placeholder: 'Ej: Manuel García o Contratista Pérez', hint: 'Podés escribir personal del campo o un proveedor externo.' },
            { label: 'Notas', name: 'notes', type: 'textarea', rows: 4, placeholder: 'Detalle del trabajo realizado...', layout: 'wide' },
          ],
        });

      case 'new-task':
        if (isRealSession(state)) {
          return renderRealNewTaskModal();
        }

        return renderFormModal({
          key: 'new-task',
          title: 'Crear Tarea',
          subtitle: 'Programa una actividad',
          submitLabel: 'Crear Tarea',
          submitIcon: 'plus',
          fields: [
            { label: 'Título', name: 'title', type: 'text', value: payload.title || '', placeholder: 'Ejemplo: Rotación Grupo A', required: true },
            { label: 'Fecha', name: 'date', type: 'date', value: '2026-05-28', required: true },
            { label: 'Prioridad', name: 'priority', type: 'select', value: 'Media', options: ['Alta', 'Media', 'Baja'] },
            { label: 'Descripción', name: 'notes', type: 'textarea', rows: 3, placeholder: 'Añade instrucciones o contexto...' },
          ],
        });

      case 'paddock-detail': {
        if (isRealSession(state)) {
          return renderRealPaddockDetailModal(state, payload);
        }

        const paddock = getPaddockByName(payload.name);
        return renderInfoModal({
          size: 'wide',
          title: paddock.name,
          subtitle: 'Resumen visual del potrero',
          body: `
            <div class="modal-summary-grid">
              <article class="modal-stat-card">
                <span>Estado</span>
                <strong>${escapeHtml(paddock.status)}</strong>
                ${renderBadge(paddock.condition, paddock.conditionTone)}
              </article>
              <article class="modal-stat-card">
                <span>Superficie</span>
                <strong>${escapeHtml(paddock.area)}</strong>
                <small>${escapeHtml(paddock.horses)} en uso</small>
              </article>
              <article class="modal-stat-card">
                <span>Lluvia</span>
                <strong>${escapeHtml(paddock.rain)}</strong>
                <small>${escapeHtml(paddock.rotation)}</small>
              </article>
            </div>
            <div class="modal-detail-card">
              <strong>Último trabajo</strong>
              <span>${escapeHtml(paddock.work)}</span>
            </div>
            <div class="modal-detail-card">
              <strong>Cultivo actual</strong>
              <span>${escapeHtml(paddock.crop)} · ${escapeHtml(paddock.cropDate)}</span>
            </div>
          `,
          footerButtons: [
            { label: 'Cerrar', tone: 'secondary', trigger: { action: 'close-modal' } },
            {
              label: 'Editar Potrero',
              tone: 'primary',
              trigger: { action: 'open-modal', value: 'paddock-form', meta: { mode: 'edit', name: paddock.name } },
            },
          ],
        });
      }

      case 'paddock-form': {
        if (isRealSession(state)) {
          return renderRealPaddockFormModal(state, payload);
        }

        const isEdit = payload.mode === 'edit';
        const paddock = isEdit ? getPaddockByName(payload.name) : getPaddockByName();
        return renderFormModal({
          key: 'paddock-form',
          title: isEdit ? 'Editar Potrero' : 'Nuevo Potrero',
          subtitle: isEdit ? 'Ajusta la configuración del potrero' : 'Crea un nuevo potrero en el admin',
          submitLabel: isEdit ? 'Guardar cambios' : 'Crear Potrero',
          submitIcon: isEdit ? 'edit' : 'plus',
          fields: [
            { label: 'Nombre', name: 'name', type: 'text', value: isEdit ? paddock.name : '', placeholder: 'Potrero Norte 8', required: true },
            { label: 'Hectáreas', name: 'area', type: 'text', value: isEdit ? paddock.area.replace(' hectáreas', '') : '5.0', required: true },
            { label: 'Estado', name: 'status', type: 'select', value: isEdit ? paddock.status : 'Preparación', options: ['Ocupado', 'Descanso', 'Preparación'] },
            { label: 'Condición', name: 'condition', type: 'select', value: isEdit ? paddock.condition : 'Bueno', options: ['Excelente', 'Bueno', 'Regular'] },
            { label: 'Cultivo', name: 'crop', type: 'text', value: isEdit ? paddock.crop : '', placeholder: 'Alfalfa' },
            { label: 'Rotación', name: 'rotation', type: 'text', value: isEdit ? paddock.rotation : '3 días', placeholder: '3 días' },
          ],
        });
      }

      case 'horse-history': {
        if (isRealSession(state)) {
          return renderRealHorseHistoryModal(state, payload);
        }

        const horse = getHorseByName(payload.name);
        return renderInfoModal({
          size: 'wide',
          title: `Historial de ${horse.name}`,
          subtitle: 'Resumen dummy del caballo seleccionado',
          body: `
            <div class="modal-summary-grid">
              <article class="modal-stat-card">
                <span>Propietario</span>
                <strong>${escapeHtml(horse.owner)}</strong>
                <small>${escapeHtml(horse.age)}</small>
              </article>
              <article class="modal-stat-card">
                <span>Potrero actual</span>
                <strong>${escapeHtml(horse.paddock)}</strong>
                <small>${escapeHtml(horse.badge)}</small>
              </article>
              <article class="modal-stat-card">
                <span>Próximos cuidados</span>
                <strong>${escapeHtml(horse.shoeing)}</strong>
                <small>Desparasitación: ${escapeHtml(horse.parasite)}</small>
              </article>
            </div>
            <div class="modal-history-list">
              <article class="modal-history-row">
                <strong>21 May 2026</strong>
                <span>Chequeo general sin novedades.</span>
              </article>
              <article class="modal-history-row">
                <strong>18 May 2026</strong>
                <span>Rotación de grupo hacia ${escapeHtml(horse.paddock)}.</span>
              </article>
              <article class="modal-history-row">
                <strong>12 May 2026</strong>
                <span>${escapeHtml(horse.note)}</span>
              </article>
            </div>
          `,
          footerButtons: [
            { label: 'Cerrar', tone: 'secondary', trigger: { action: 'close-modal' } },
            {
              label: 'Editar Caballo',
              tone: 'primary',
              trigger: { action: 'open-modal', value: 'horse-form', meta: { mode: 'edit', name: horse.name } },
            },
          ],
        });
      }

      case 'horse-group-detail': {
        return renderGroupManageModal(state, payload);
      }

      case 'horse-form': {
        if (isRealSession(state)) {
          return renderRealHorseFormModal(state, payload);
        }

        const isEdit = payload.mode === 'edit';
        const horse = isEdit ? getHorseByName(payload.name) : getHorseByName();
        return renderFormModal({
          key: 'horse-form',
          title: isEdit ? `Editar ${horse.name}` : 'Nuevo Caballo',
          subtitle: isEdit ? 'Actualiza ficha y cuidados' : 'Carga un caballo al sistema',
          submitLabel: isEdit ? 'Guardar caballo' : 'Crear caballo',
          submitIcon: isEdit ? 'edit' : 'plus',
          fields: [
            { label: 'Nombre', name: 'name', type: 'text', value: isEdit ? horse.name : '', placeholder: 'Nombre del caballo', required: true },
            { label: 'Propietario', name: 'owner', type: 'select', value: isEdit ? horse.owner : ownerOptions[0], options: ownerOptions },
            { label: 'Potrero', name: 'paddock', type: 'select', value: isEdit ? horse.paddock : paddockOptions[0], options: paddockOptions },
            { label: 'Grupo', name: 'group', type: 'select', value: isEdit ? horse.badge : 'Individual', options: ['Individual', ...groupOptions] },
            { label: 'Próxima desparasitación', name: 'parasite', type: 'text', value: isEdit ? horse.parasite : '20 Ago 2026' },
            { label: 'Próximo herraje', name: 'shoeing', type: 'text', value: isEdit ? horse.shoeing : '15 Jul 2026' },
          ],
        });
      }

      case 'group-form': {
        if (isRealSession(state)) {
          return renderRealGroupCreateModal(state, payload);
        }

        const isManage = payload.mode === 'manage';
        const group = isManage ? getGroupByName(payload.name) : getGroupByName();
        return renderFormModal({
          key: 'group-form',
          title: isManage ? `Gestionar ${group.name}` : 'Crear Grupo',
          subtitle: isManage ? 'Ajusta miembros y ubicación del grupo' : 'Configura un nuevo grupo de caballos',
          submitLabel: isManage ? 'Guardar Grupo' : 'Crear Grupo',
          submitIcon: isManage ? 'edit' : 'plus',
          fields: [
            { label: 'Nombre del Grupo', name: 'name', type: 'text', value: isManage ? group.name : '', placeholder: 'Grupo E' },
            { label: 'Potrero actual', name: 'paddock', type: 'select', value: isManage ? group.paddock : paddockOptions[0], options: paddockOptions },
            { label: 'Miembros', name: 'members', type: 'text', value: isManage ? group.members.join(', ') : '', placeholder: 'Zeus, Apolo' },
            { label: 'Notas', name: 'notes', type: 'textarea', rows: 3, placeholder: 'Objetivo del grupo o indicaciones...' },
          ],
        });
      }

      case 'owner-detail': {
        const owner = getOwnerByName(payload.name);
        return renderInfoModal({
          size: 'wide',
          title: owner.name,
          subtitle: 'Detalle financiero y operativo',
          body: `
            <div class="modal-summary-grid">
              <article class="modal-stat-card">
                <span>Estado</span>
                <strong>${escapeHtml(owner.status)}</strong>
                <small>${escapeHtml(owner.paymentDate)}</small>
              </article>
              <article class="modal-stat-card">
                <span>Tarifa mensual</span>
                <strong>${escapeHtml(owner.monthlyFee)}</strong>
                <small>${escapeHtml(owner.perHorse)} por caballo</small>
              </article>
              <article class="modal-stat-card">
                <span>Contacto</span>
                <strong>${escapeHtml(owner.email)}</strong>
                <small>${escapeHtml(owner.phone)}</small>
              </article>
            </div>
            <div class="modal-detail-card">
              <strong>Caballos asociados</strong>
              <div class="modal-chip-row">
                ${owner.horsesList.map((horse) => `<span class="mini-chip">${escapeHtml(horse)}</span>`).join('')}
              </div>
            </div>
            ${
              owner.balance
                ? `
                  <div class="modal-callout modal-callout--critical">
                    <strong>Saldo pendiente</strong>
                    <span>${escapeHtml(owner.balance)}</span>
                  </div>
                `
                : ''
            }
          `,
          footerButtons: [
            { label: 'Cerrar', tone: 'secondary', trigger: { action: 'close-modal' } },
            {
              label: 'Generar factura',
              tone: 'primary',
              trigger: { action: 'open-modal', value: 'invoice-create', meta: { name: owner.name } },
            },
          ],
        });
      }

      case 'owner-form':
        return renderFormModal({
          key: 'owner-form',
          title: 'Nuevo Propietario',
          subtitle: 'Crea una ficha base para facturación y seguimiento',
          submitLabel: 'Crear Propietario',
          submitIcon: 'plus',
          fields: [
            { label: 'Nombre Completo', name: 'name', type: 'text', placeholder: 'Nombre y apellido', required: true },
            { label: 'Email', name: 'email', type: 'email', placeholder: 'correo@ejemplo.com', required: true },
            { label: 'Teléfono', name: 'phone', type: 'text', placeholder: '+54 9 11...' },
            { label: 'Tarifa mensual', name: 'monthlyFee', type: 'text', placeholder: '$60,000' },
            { label: 'Caballos iniciales', name: 'horses', type: 'text', placeholder: 'Zeus, Apolo' },
          ],
        });

      case 'invoice-create': {
        const owner = getOwnerByName(payload.name);
        return renderFormModal({
          key: 'invoice-create',
          title: 'Generar Factura',
          subtitle: 'Prepara una liquidación dummy para revisión visual',
          submitLabel: 'Generar factura',
          submitIcon: 'records',
          callout: {
            title: owner.name,
            detail: `Base mensual ${owner.monthlyFee} · ${owner.horses}`,
          },
          fields: [
            { label: 'Propietario', name: 'owner', type: 'select', value: owner.name, options: ownerOptions },
            { label: 'Período', name: 'period', type: 'text', value: 'Mayo 2026' },
            { label: 'Monto', name: 'amount', type: 'text', value: owner.monthlyFee },
            { label: 'Notas', name: 'notes', type: 'textarea', rows: 3, placeholder: 'Observaciones de la factura...' },
          ],
        });
      }

      case 'product-form': {
        if (isRealSession(state)) {
          return renderRealStockItemModal(state, payload);
        }

        const isEdit = payload.mode === 'edit';
        const product = isEdit ? getProductByName(payload.name) : getProductByName();
        return renderFormModal({
          key: 'product-form',
          title: isEdit ? `Editar ${product.name}` : 'Nuevo Producto',
          subtitle: 'Gestiona el inventario dummy del rediseño',
          submitLabel: isEdit ? 'Guardar producto' : 'Crear producto',
          submitIcon: isEdit ? 'edit' : 'plus',
          fields: [
            { label: 'Nombre', name: 'name', type: 'text', value: isEdit ? product.name : '', placeholder: 'Nombre del producto' },
            { label: 'Categoría', name: 'category', type: 'select', value: isEdit ? product.category : 'Alimento', options: ['Alimento', 'Fertilizante', 'Herbicida', 'Salud'] },
            { label: 'Stock mínimo', name: 'minimum', type: 'text', value: isEdit ? product.minimum : '100 kg' },
            { label: 'Proveedor', name: 'supplier', type: 'text', value: isEdit ? product.supplier : '', placeholder: 'Proveedor principal' },
            { label: 'Costo unitario', name: 'cost', type: 'text', value: isEdit ? product.cost : '$0' },
          ],
        });
      }

      case 'purchase-create': {
        if (isRealSession(state)) {
          return renderRealStockPurchaseModal(state, payload);
        }

        const product = getProductByName(payload.name);
        return renderFormModal({
          key: 'purchase-create',
          title: 'Nueva Compra',
          subtitle: 'Carga una compra dummy para el inventario',
          submitLabel: 'Registrar compra',
          submitIcon: 'cart',
          fields: [
            { label: 'Producto', name: 'product', type: 'select', value: product.name, options: productOptions },
            { label: 'Proveedor', name: 'supplier', type: 'text', value: payload.supplier || product.supplier },
            { label: 'Cantidad', name: 'quantity', type: 'text', value: `50 ${product.unit}` },
            { label: 'Total', name: 'total', type: 'text', value: '$42,500' },
            { label: 'Fecha', name: 'date', type: 'date', value: '2026-05-22' },
          ],
        });
      }

      case 'advanced-filters':
        return renderFormModal({
          key: 'advanced-filters',
          title: 'Filtros Avanzados',
          subtitle: 'Ajusta cómo quieres revisar los registros',
          submitLabel: 'Aplicar filtros',
          submitIcon: 'filter',
          fields: [
            { label: 'Módulo', name: 'module', type: 'select', value: 'Todos', options: ['Todos', 'Potreros', 'Caballos', 'Clima', 'Telegram'] },
            { label: 'Tipo', name: 'type', type: 'select', value: 'Todos', options: ['Todos', 'Movimiento', 'Trabajo', 'Salud', 'Clima'] },
            { label: 'Desde', name: 'from', type: 'date', value: '2026-05-01' },
            { label: 'Hasta', name: 'to', type: 'date', value: '2026-05-22' },
            { label: 'Canal', name: 'channel', type: 'select', value: 'Todos', options: ['Todos', 'Manual', 'Telegram', 'Sistema'] },
          ],
        });

      case 'task-detail':
        if (isRealSession(state)) {
          return renderRealCalendarTaskDetailModal(state, payload);
        }

        return renderInfoModal({
          title: payload.title || 'Detalle de tarea',
          subtitle: payload.detail || 'Resumen de la tarea seleccionada',
          body: `
            <div class="modal-summary-grid">
              <article class="modal-stat-card">
                <span>Tipo</span>
                <strong>${escapeHtml(payload.tag || 'Trabajo')}</strong>
              </article>
              <article class="modal-stat-card">
                <span>Fecha</span>
                <strong>${escapeHtml(payload.date || 'Sin fecha')}</strong>
              </article>
              <article class="modal-stat-card">
                <span>Prioridad</span>
                <strong>${escapeHtml(payload.priority || 'Media')}</strong>
              </article>
            </div>
            <div class="modal-detail-card">
              <strong>Descripción</strong>
              <span>${escapeHtml(payload.detail || 'Sin detalle')}</span>
            </div>
          `,
        });

      case 'account-password': {
        const account = getSessionAccount(store.getState());
        return renderFormModal({
          key: 'account-password',
          title: 'Cambiar password',
          subtitle: 'Preparamos la experiencia de seguridad sin tocar todavía la credencial real.',
          submitLabel: 'Actualizar password',
          submitIcon: 'shield',
          callout: {
            title: 'Siguiente conexión segura',
            detail:
              'Esta UI queda lista ahora. El cambio real de password se conecta después contra un backend seguro.',
          },
          fields: [
            {
              label: 'Cuenta',
              name: 'account',
              type: 'text',
              value: account.email || account.username || account.displayName,
              readonly: true,
              disabled: true,
            },
            {
              label: 'Password actual',
              name: 'currentPassword',
              type: 'password',
              placeholder: 'Ingresa tu password actual',
              required: true,
            },
            {
              label: 'Nuevo password',
              name: 'newPassword',
              type: 'password',
              placeholder: 'Mínimo 8 caracteres',
              required: true,
            },
            {
              label: 'Confirmar nuevo password',
              name: 'confirmPassword',
              type: 'password',
              placeholder: 'Repite el nuevo password',
              required: true,
            },
          ],
        });
      }

      case 'account-delete': {
        const account = getSessionAccount(store.getState());
        return renderFormModal({
          key: 'account-delete',
          title: 'Eliminar cuenta',
          subtitle: 'Acción sensible que debe diferenciar entre tu usuario y la cuenta completa del campo.',
          submitLabel: 'Solicitar eliminación',
          submitIcon: 'circleAlert',
          submitTone: 'danger',
          callout: {
            title: 'Zona sensible',
            detail:
              'No vamos a borrar nada real desde esta UI hasta conectar un flujo seguro con confirmación reforzada.',
          },
          fields: [
            {
              label: 'Cuenta actual',
              name: 'account',
              type: 'text',
              value: account.email || account.username || account.displayName,
              readonly: true,
              disabled: true,
            },
            {
              label: 'Escribe ELIMINAR para continuar',
              name: 'confirmation',
              type: 'text',
              placeholder: 'ELIMINAR',
              required: true,
              hint:
                'Esto deja el flujo preparado sin ejecutar todavía una eliminación real.',
            },
          ],
        });
      }

      case 'commands':
        return renderInfoModal({
          size: 'wide',
          title: 'Comandos disponibles',
          subtitle: 'Referencia dummy del bot de Telegram',
          body: `
            <div class="modal-command-list">
              ${DEMO_DATA.settings.commands.map((item) => `
                <article class="command-card">
                  <code>${escapeHtml(item.command)}</code>
                  <div>
                    <strong>${escapeHtml(item.description)}</strong>
                    <span>Ejemplo: ${escapeHtml(item.example)}</span>
                  </div>
                </article>
              `).join('')}
            </div>
          `,
        });

      case 'user-form': {
        const isEdit = payload.mode === 'edit';
        const user = isEdit ? getUserByName(payload.name) : getUserByName();
        return renderFormModal({
          key: 'user-form',
          title: isEdit ? 'Editar Usuario' : 'Agregar Nuevo Usuario',
          subtitle: isEdit ? 'Actualiza permisos y acceso' : 'Crea un nuevo usuario con acceso al sistema',
          submitLabel: isEdit ? 'Guardar usuario' : 'Agregar Usuario',
          submitIcon: isEdit ? 'edit' : 'owners',
          fields: [
            { label: 'Nombre Completo', name: 'name', type: 'text', value: isEdit ? user.name : '', placeholder: 'Nombre y apellido', required: true },
            { label: 'Email', name: 'email', type: 'email', value: isEdit ? user.email : '', placeholder: 'correo@campo.com', required: true },
            { label: 'Usuario de Telegram (opcional)', name: 'telegram', type: 'text', value: isEdit ? user.handle.replace('@', '') : '', placeholder: 'usuario_telegram' },
            { label: 'Rol', name: 'role', type: 'select', value: isEdit ? user.role : 'Editor', options: ['Administrador', 'Editor', 'Visualizador'] },
          ],
          extraBody: `
            <div class="modal-role-help">
              <article>
                <strong>Administrador</strong>
                <span>Acceso completo al sistema</span>
              </article>
              <article>
                <strong>Editor</strong>
                <span>Puede crear y editar registros</span>
              </article>
              <article>
                <strong>Visualizador</strong>
                <span>Solo puede ver información</span>
              </article>
            </div>
          `,
        });
      }

      default:
        return '';
    }
  }

  function renderPageBody(state) {
    switch (state.activeNav) {
      case 'home':
        return renderHomeView(state);
      case 'paddocks':
        return renderPaddocksView(state);
      case 'horses':
        return renderHorsesView(state);
      case 'owners':
        return renderOwnersView(state);
      case 'stock':
        return renderStockView(state);
      case 'calendar':
        return renderCalendarView(state);
      case 'records':
        return renderRecordsView(state);
      case 'settings':
        return renderSettingsView(state);
      default:
        return renderHomeView(state);
    }
  }

  function renderAuthenticatedShell(state) {
    return `
      <div class="screen-shell">
        ${renderSidebar(state)}
        <div class="screen-main">
          ${renderMobileTopbar(state)}
          ${state.mobileMenuOpen ? '<button type="button" class="app-backdrop" data-action="toggle-mobile-menu" aria-label="Cerrar menú"></button>' : ''}
          ${state.mobileMenuOpen ? renderMobileMenu(state) : ''}
          <main class="page-shell">
            ${renderPageHeader(state)}
            ${renderPageBody(state)}
          </main>
          ${renderMobileBottomNav(state)}
          ${renderActiveModal(state)}
          ${
            state.toast
              ? `
                <div class="toast-banner toast-banner--${escapeHtml(state.toast.tone || 'success')}">
                  ${renderIcon(state.toast.tone === 'critical' ? 'circleAlert' : 'check')}
                  <span>${escapeHtml(state.toast.message)}</span>
                </div>
              `
              : ''
          }
        </div>
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
              <p class="eyebrow">Redesign Farm Bot Admin</p>
              <h1>Nuevo admin visual</h1>
              <p>Esta ruta vive separada del admin actual y carga primero el prototipo dummy para validar diseño antes de conectar datos reales.</p>
            </div>
          </div>

          <form class="auth-form" data-login-form>
            <label>
              Usuario
              <input name="username" type="text" autocomplete="username" placeholder="admin" required />
            </label>
            <label>
              Password
              <input name="password" type="password" autocomplete="current-password" placeholder="Ingresa tu password" required />
            </label>
            <button type="submit" class="btn btn-primary btn-block"${state.loginPending ? ' disabled' : ''}>
              ${state.loginPending ? 'Ingresando...' : 'Entrar al admin nuevo'}
            </button>
          </form>

          <button type="button" class="btn btn-secondary btn-block" data-action="demo-login">
            Entrar en modo demo
          </button>

          ${
            state.loginError
              ? `<p class="auth-error">${escapeHtml(state.loginError)}</p>`
              : ''
          }
        </div>
      </section>
    `;
  }

  function renderApp(state) {
    if (state.booting) {
      return `
        <section class="boot-shell">
          <div class="boot-card">
            <p class="eyebrow">Farm Bot Admin V2</p>
            <h1>Cargando pantallas del rediseño...</h1>
            <p>Estamos validando tu sesión y preparando el prototipo visual de la nueva arquitectura.</p>
          </div>
        </section>
      `;
    }

    if (!(state.session && state.session.authenticated)) {
      return renderLoginScreen(state);
    }

    return renderAuthenticatedShell(state);
  }

  const appRoot = document.getElementById('app');
  if (!appRoot) {
    return;
  }

  const store = createStore({
    booting: true,
    loading: false,
    mobileMenuOpen: false,
    modal: null,
    toast: null,
    telegramLink: null,
    horsesDashboard: null,
    paddocksDashboard: null,
    stockDashboard: null,
    calendarEventsByMonth: {},
    horseHistoryById: {},
    paddockDetailById: {},
    session: null,
    loginPending: false,
    loginError: '',
    horseFilters: {
      query: '',
      group: 'all',
      care: 'all',
    },
    paddockFilters: {
      query: '',
      status: 'all',
    },
    stockFilters: {
      query: '',
      category: 'all',
    },
    activeNav: DEFAULT_ACTIVE_NAV,
    views: { ...DEFAULT_VIEWS },
    calendarMonthOffset: 0,
    calendarSelectedDate: '',
    calendarTaskFilter: 'pending',
    refreshedAt: new Date().toISOString(),
  });

  function setState(patch) {
    store.setState(patch);
  }

  function buildSignedOutState(overrides = {}) {
    return {
      loading: false,
      booting: false,
      loginPending: false,
      horsesDashboard: null,
      paddocksDashboard: null,
      stockDashboard: null,
      calendarEventsByMonth: {},
      horseHistoryById: {},
      paddockDetailById: {},
      session: {
        authenticated: false,
        username: null,
        demo: false,
      },
      modal: null,
      mobileMenuOpen: false,
      toast: null,
      activeNav: DEFAULT_ACTIVE_NAV,
      views: { ...DEFAULT_VIEWS },
      horseFilters: {
        query: '',
        group: 'all',
        care: 'all',
      },
      paddockFilters: {
        query: '',
        status: 'all',
      },
      stockFilters: {
        query: '',
        category: 'all',
      },
      calendarMonthOffset: 0,
      calendarSelectedDate: '',
      calendarTaskFilter: 'pending',
      refreshedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  function handleUnauthorizedSession(message) {
    const currentState = store.getState();
    if (!(currentState && currentState.session && currentState.session.authenticated)) {
      return;
    }

    window.clearTimeout(toastTimer);
    setState(
      buildSignedOutState({
        loginError:
          message ||
          'Tu sesión venció o ya no es válida. Volvé a iniciar sesión para seguir usando el admin.',
      })
    );
  }

  let toastTimer = 0;
  let telegramLinkPromise = null;
  let nextHorseFeedPlanDraftRowKey = 1;

  function getDatasetPayload(dataset) {
    const payload = { ...dataset };
    delete payload.action;
    delete payload.value;
    delete payload.message;
    delete payload.navKey;
    delete payload.viewKey;
    delete payload.viewNav;
    return payload;
  }

  function openModal(key, payload) {
    setState({
      modal: {
        key,
        payload: payload || {},
      },
      mobileMenuOpen: false,
    });
  }

  function closeModal() {
    setState({ modal: null });
  }

  function scrollToSectionById(sectionId) {
    if (!sectionId) {
      return;
    }

    window.requestAnimationFrame(() => {
      const target = document.getElementById(sectionId);
      if (!target) {
        return;
      }

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  function updateActiveModalPayload(updater) {
    setState((currentState) => {
      if (!currentState.modal) {
        return {};
      }

      const currentPayload = currentState.modal.payload || {};
      const nextPayload =
        typeof updater === 'function'
          ? updater(currentPayload, currentState)
          : {
              ...currentPayload,
              ...(updater || {}),
            };

      return {
        modal: {
          ...currentState.modal,
          payload: nextPayload,
        },
      };
    });
  }

  function showToast(message, tone) {
    if (!message) {
      return;
    }

    window.clearTimeout(toastTimer);
    setState({
      toast: {
        message,
        tone: tone || 'success',
      },
    });

    toastTimer = window.setTimeout(() => {
      setState((currentState) => (currentState.toast ? { toast: null } : {}));
    }, 3200);
  }

  function getTelegramFallbackLink() {
    return {
      botUsername: null,
      botUrl: TELEGRAM_WEB_FALLBACK_URL,
      fallback: true,
    };
  }

  function normalizeTelegramLink(payload) {
    const botUsername =
      payload && payload.botUsername
        ? String(payload.botUsername).trim().replace(/^@+/, '')
        : '';

    return {
      botUsername: botUsername || null,
      botUrl:
        (payload && payload.botUrl ? String(payload.botUrl) : '') ||
        (botUsername ? `https://t.me/${botUsername}` : TELEGRAM_WEB_FALLBACK_URL),
      fallback: !botUsername,
    };
  }

  async function loadTelegramLink() {
    if (!telegramLinkPromise) {
      telegramLinkPromise = requestJson(TELEGRAM_LINK_API_URL)
        .then((payload) => {
          const telegramLink = normalizeTelegramLink(payload);
          setState({ telegramLink });
          return telegramLink;
        })
        .catch((_error) => {
          const telegramLink = getTelegramFallbackLink();
          setState({ telegramLink });
          return telegramLink;
        })
        .finally(() => {
          telegramLinkPromise = null;
        });
    }

    return telegramLinkPromise;
  }

  function openTelegramBot() {
    const telegramLink = store.getState().telegramLink || getTelegramFallbackLink();

    if (typeof window !== 'undefined') {
      window.open(telegramLink.botUrl, '_blank', 'noopener');
    }

    if (telegramLink.botUsername) {
      showToast(`Abriendo @${telegramLink.botUsername} en Telegram.`, 'info');
      return;
    }

    showToast(
      'Abriendo Telegram. Cuando definamos el username del bot, este acceso irá directo al chat.',
      'info'
    );
  }

  async function loadHorsesDashboard(options = {}) {
    if (!isRealSession(store.getState())) {
      setState({ horsesDashboard: null });
      return null;
    }

    const payload = await requestJson(HORSES_API_URL);
    setState({
      horsesDashboard: payload,
      refreshedAt: payload?.meta?.refreshed_at || new Date().toISOString(),
      ...(options.closeModal ? { modal: null } : {}),
    });
    return payload;
  }

  async function loadPaddocksDashboard(options = {}) {
    if (!isRealSession(store.getState())) {
      setState({ paddocksDashboard: null });
      return null;
    }

    const payload = await requestJson(PADDOCKS_API_URL);
    setState({
      paddocksDashboard: payload,
      refreshedAt: payload?.meta?.refreshed_at || new Date().toISOString(),
      ...(options.closeModal ? { modal: null } : {}),
    });
    return payload;
  }

  async function loadAdminDashboards(options = {}) {
    if (!isRealSession(store.getState())) {
      setState({
        horsesDashboard: null,
        paddocksDashboard: null,
        stockDashboard: null,
        calendarEventsByMonth: {},
      });
      return null;
    }

    const currentCalendarMonth = getCalendarMonthKeyFromOffset(store.getState().calendarMonthOffset || 0);
    const [horsesResult, paddocksResult, stockResult, calendarResult] = await Promise.allSettled([
      requestJson(HORSES_API_URL),
      requestJson(PADDOCKS_API_URL),
      requestJson(STOCK_DASHBOARD_API_URL),
      requestJson(buildCalendarEventsUrl(currentCalendarMonth)),
    ]);

    if (
      horsesResult.status !== 'fulfilled' &&
      paddocksResult.status !== 'fulfilled' &&
      stockResult.status !== 'fulfilled' &&
      calendarResult.status !== 'fulfilled'
    ) {
      throw (
        horsesResult.reason ||
        paddocksResult.reason ||
        stockResult.reason ||
        calendarResult.reason ||
        new Error('No pudimos cargar el dashboard.')
      );
    }

    const horsesDashboard = horsesResult.status === 'fulfilled' ? horsesResult.value : null;
    const paddocksDashboard = paddocksResult.status === 'fulfilled' ? paddocksResult.value : null;
    const stockDashboard = stockResult.status === 'fulfilled' ? stockResult.value : null;
    const calendarMonthPayload = calendarResult.status === 'fulfilled' ? calendarResult.value : null;

    setState((currentState) => ({
      horsesDashboard,
      paddocksDashboard,
      stockDashboard,
      calendarEventsByMonth: {
        ...(currentState.calendarEventsByMonth || {}),
        ...(calendarMonthPayload
          ? {
              [currentCalendarMonth]: {
                loading: false,
                error: '',
                data: calendarMonthPayload,
              },
            }
          : {}),
      },
      refreshedAt:
        horsesDashboard?.meta?.refreshed_at ||
        paddocksDashboard?.meta?.refreshed_at ||
        stockDashboard?.meta?.refreshed_at ||
        new Date().toISOString(),
      ...(options.closeModal ? { modal: null } : {}),
    }));

    return {
      horsesDashboard,
      paddocksDashboard,
      stockDashboard,
      calendarMonthPayload,
    };
  }

  function buildHorseHistoryUrl(horseId, month = null) {
    const normalizedMonth = normalizeYearMonth(month) || todayDateString().slice(0, 7);
    const query = new URLSearchParams({
      horseId: String(horseId),
      month: normalizedMonth,
    });

    return `${HORSE_HISTORY_API_URL}?${query.toString()}`;
  }

  async function loadHorseHistory(horseId, options = {}) {
    const normalizedHorseId = parsePositiveInt(horseId);
    if (!normalizedHorseId) {
      return null;
    }

    const normalizedMonth = normalizeYearMonth(options?.month) || todayDateString().slice(0, 7);

    setState((currentState) => {
      const currentEntry = getRealHorseHistoryState(currentState, normalizedHorseId) || {};
      return {
        horseHistoryById: {
          ...(currentState.horseHistoryById || {}),
          [String(normalizedHorseId)]: {
            ...currentEntry,
            loading: true,
            error: '',
          },
        },
      };
    });

    try {
      const payload = await requestJson(buildHorseHistoryUrl(normalizedHorseId, normalizedMonth));
      setState((currentState) => ({
        horseHistoryById: {
          ...(currentState.horseHistoryById || {}),
          [String(normalizedHorseId)]: {
            loading: false,
            error: '',
            data: payload,
          },
        },
      }));
      return payload;
    } catch (error) {
      setState((currentState) => {
        const previousEntry = getRealHorseHistoryState(currentState, normalizedHorseId) || {};
        return {
          horseHistoryById: {
            ...(currentState.horseHistoryById || {}),
            [String(normalizedHorseId)]: {
              loading: false,
              error: error.message || 'No pudimos cargar el historial del caballo.',
              data: previousEntry.data || null,
            },
          },
        };
      });
      throw error;
    }
  }

  function buildPaddockDetailUrl(paddockId) {
    const query = new URLSearchParams({
      paddockId: String(paddockId),
    });

    return `${PADDOCKS_API_URL}?${query.toString()}`;
  }

  async function loadPaddockDetail(paddockId) {
    const normalizedPaddockId = parsePositiveInt(paddockId);
    if (!normalizedPaddockId) {
      return null;
    }

    setState((currentState) => {
      const currentEntry = getRealPaddockDetailState(currentState, normalizedPaddockId) || {};
      return {
        paddockDetailById: {
          ...(currentState.paddockDetailById || {}),
          [String(normalizedPaddockId)]: {
            ...currentEntry,
            loading: true,
            error: '',
          },
        },
      };
    });

    try {
      const payload = await requestJson(buildPaddockDetailUrl(normalizedPaddockId));
      setState((currentState) => ({
        paddockDetailById: {
          ...(currentState.paddockDetailById || {}),
          [String(normalizedPaddockId)]: {
            loading: false,
            error: '',
            data: payload,
          },
        },
      }));
      return payload;
    } catch (error) {
      setState((currentState) => ({
        paddockDetailById: {
          ...(currentState.paddockDetailById || {}),
          [String(normalizedPaddockId)]: {
            loading: false,
            error: error.message || 'No pudimos cargar el detalle del potrero.',
            data: null,
          },
        },
      }));
      throw error;
    }
  }

  async function loadCalendarMonthData(monthKey, options = {}) {
    const normalizedMonth = normalizeCalendarMonthValue(monthKey);
    const currentState = store.getState();

    if (!isRealSession(currentState)) {
      setState({ calendarEventsByMonth: {} });
      return null;
    }

    const existingEntry = getRealCalendarMonthState(currentState, normalizedMonth);
    if (existingEntry?.data && !options.force) {
      return existingEntry.data;
    }

    setState((state) => ({
      calendarEventsByMonth: {
        ...(state.calendarEventsByMonth || {}),
        [normalizedMonth]: {
          ...(state.calendarEventsByMonth?.[normalizedMonth] || {}),
          loading: true,
          error: '',
        },
      },
    }));

    try {
      const payload = await requestJson(buildCalendarEventsUrl(normalizedMonth));
      setState((state) => ({
        calendarEventsByMonth: {
          ...(state.calendarEventsByMonth || {}),
          [normalizedMonth]: {
            loading: false,
            error: '',
            data: payload,
          },
        },
        refreshedAt: new Date().toISOString(),
      }));
      return payload;
    } catch (error) {
      setState((state) => ({
        calendarEventsByMonth: {
          ...(state.calendarEventsByMonth || {}),
          [normalizedMonth]: {
            loading: false,
            error: error.message || 'No pudimos cargar el calendario real.',
            data: null,
          },
        },
      }));
      throw error;
    }
  }

  async function postMutation(body) {
    return requestJson(DATA_MUTATE_API_URL, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async function syncHorseGroupAssignment({
    state,
    horseId,
    currentGroupId = null,
    nextGroupId = null,
  }) {
    const normalizedHorseId = parsePositiveInt(horseId);
    const resolvedCurrentGroupId = parsePositiveInt(
      currentGroupId != null
        ? currentGroupId
        : getRealHorseById(state, normalizedHorseId)?.current_group?.id
    );
    const resolvedNextGroupId = parsePositiveInt(nextGroupId);

    if (resolvedCurrentGroupId === resolvedNextGroupId) {
      return { changed: false };
    }

    if (resolvedNextGroupId) {
      const targetGroup = getRealGroupCatalogById(state, resolvedNextGroupId);
      if (!targetGroup) {
        throw new Error('No encontramos el grupo seleccionado.');
      }

      const nextHorseIds = [
        ...new Set(
          [...(targetGroup.members || []).map((member) => Number(member.id)), normalizedHorseId].filter(
            (value) => Number.isFinite(value) && value > 0
          )
        ),
      ];

      const result = await postMutation({
        action: 'horse_group_memberships_set',
        groupId: resolvedNextGroupId,
        horseIds: nextHorseIds,
      });

      return {
        changed: true,
        result,
        targetGroup,
      };
    }

    if (resolvedCurrentGroupId) {
      const currentGroup =
        getRealGroupCatalogById(state, resolvedCurrentGroupId) ||
        getRealHorseGroupById(state, resolvedCurrentGroupId);
      if (!currentGroup) {
        throw new Error('No encontramos el grupo actual del caballo.');
      }

      const sourceMembers = Array.isArray(currentGroup.members)
        ? currentGroup.members
        : Array.isArray(currentGroup.member_rows)
          ? currentGroup.member_rows
          : [];
      const nextHorseIds = sourceMembers
        .map((member) => Number(member.id))
        .filter((value) => Number.isFinite(value) && value > 0 && value !== normalizedHorseId);

      const result = await postMutation({
        action: 'horse_group_memberships_set',
        groupId: resolvedCurrentGroupId,
        horseIds: nextHorseIds,
      });

      return {
        changed: true,
        result,
      };
    }

    return { changed: false };
  }

  async function syncHorsePaddockAssignment({
    state,
    horseId,
    currentPaddockId = null,
    nextPaddockId = null,
    notes = '',
  }) {
    const normalizedHorseId = parsePositiveInt(horseId);
    const resolvedCurrentPaddockId = parsePositiveInt(
      currentPaddockId != null
        ? currentPaddockId
        : getRealHorseById(state, normalizedHorseId)?.current_location?.paddock_id
    );
    const resolvedNextPaddockId = parsePositiveInt(nextPaddockId);

    if (resolvedCurrentPaddockId === resolvedNextPaddockId) {
      return { changed: false };
    }

    if (resolvedCurrentPaddockId) {
      await postMutation({
        action: 'grazing_move_out',
        horseId: normalizedHorseId,
        paddockId: resolvedCurrentPaddockId,
        eventDate: todayDateString(),
        notes: notes || undefined,
      });
    }

    if (resolvedNextPaddockId) {
      const moveInResult = await postMutation({
        action: 'grazing_move_in',
        horseId: normalizedHorseId,
        paddockId: resolvedNextPaddockId,
        eventDate: todayDateString(),
        notes: notes || undefined,
      });

      return {
        changed: true,
        result: moveInResult,
      };
    }

    return {
      changed: Boolean(resolvedCurrentPaddockId),
      result: null,
    };
  }

  async function submitPaddockForm(formData) {
    const currentState = store.getState();
    const isEdit = currentState.modal?.payload?.mode === 'edit';
    const paddockId = parsePositiveInt(currentState.modal?.payload?.paddockId);
    const values = formDataToObject(formData);
    const currentPaddock = isEdit ? getRealPaddockById(currentState, paddockId) : null;
    const paddockName = String(values.paddockName || '').trim();

    if (!paddockName) {
      showToast('El potrero necesita un nombre.', 'critical');
      return;
    }

    if (isEdit && !paddockId) {
      showToast('No encontramos el potrero que querés editar.', 'critical');
      return;
    }

    setState({ loading: true, modal: null });

    try {
      const payload = await requestJson(PADDOCKS_API_URL, {
        method: isEdit ? 'PATCH' : 'POST',
        body: JSON.stringify({
          ...(isEdit ? { paddockId } : {}),
          paddockName,
          zone:
            values.zone !== undefined
              ? values.zone || ''
              : currentPaddock?.zone || '',
          sizeHa:
            values.sizeHa !== undefined
              ? values.sizeHa || ''
              : currentPaddock?.size_ha != null
                ? String(currentPaddock.size_ha)
                : '',
          notes:
            values.notes !== undefined
              ? values.notes || ''
              : currentPaddock?.notes || '',
          active:
            values.active !== undefined
              ? values.active || 'true'
              : currentPaddock?.active === false
                ? 'false'
                : 'true',
          parentPaddockId:
            values.parentPaddockId !== undefined
              ? values.parentPaddockId || ''
              : currentPaddock?.parent_paddock_id != null
                ? String(currentPaddock.parent_paddock_id)
                : '',
          restDaysEstimate:
            values.restDaysEstimate !== undefined
              ? values.restDaysEstimate || ''
              : currentPaddock?.manual_rest_days != null
                ? String(currentPaddock.manual_rest_days)
                : '',
          restApplyScope:
            values.restApplyScope !== undefined
              ? values.restApplyScope || 'single'
              : currentPaddock?.manual_rest_applies_to_descendants
                ? 'whole_block'
                : 'single',
        }),
      });

      await loadAdminDashboards({ closeModal: true });
      showToast(
        isEdit
          ? `Potrero actualizado: ${payload?.paddock?.name || paddockName}`
          : `Potrero creado: ${payload?.paddock?.name || paddockName}`
      );
    } catch (error) {
      showToast(error.message || 'No pudimos guardar el potrero.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  async function submitHorseForm(formData) {
    const currentState = store.getState();
    const isEdit = currentState.modal?.payload?.mode === 'edit';
    const horseId = currentState.modal?.payload?.horseId;
    const values = formDataToObject(formData);
    const currentHorse = isEdit ? getRealHorseById(currentState, horseId) : null;
    const selectedGroupId = parsePositiveInt(values.groupId);
    const selectedPaddockId = parsePositiveInt(values.paddockId);

    setState({ loading: true });

    try {
      const payload = await requestJson(HORSES_API_URL, {
        method: isEdit ? 'PATCH' : 'POST',
        body: JSON.stringify({
          horseId,
          horseName: values.horseName || '',
          dateOfBirth: values.dateOfBirth || '',
          color: values.color || '',
          activity: values.activity || '',
          sex: values.sex || '',
          trainingStatus: values.trainingStatus || '',
        }),
      });

      const savedHorseId = Number(payload?.horse?.id || horseId);
      let resolvedPaddockId = selectedPaddockId;

      if (!resolvedPaddockId && !isEdit && selectedGroupId) {
        const targetGroup = getRealGroupCatalogById(currentState, selectedGroupId);
        if (Array.isArray(targetGroup?.current_locations) && targetGroup.current_locations.length === 1) {
          resolvedPaddockId = parsePositiveInt(targetGroup.current_locations[0].location_id);
        }
      }

      if (resolvedPaddockId) {
        const paddockError = getPaddockSelectionError(
          getRealPaddockCatalogById(currentState, resolvedPaddockId)
        );
        if (paddockError) {
          throw new Error(paddockError);
        }
      }

      await syncHorseGroupAssignment({
        state: currentState,
        horseId: savedHorseId,
        currentGroupId: currentHorse?.current_group?.id || null,
        nextGroupId: selectedGroupId,
      });

      await syncHorsePaddockAssignment({
        state: currentState,
        horseId: savedHorseId,
        currentPaddockId: currentHorse?.current_location?.paddock_id || null,
        nextPaddockId: resolvedPaddockId,
      });

      await loadAdminDashboards({ closeModal: true });
      showToast(
        isEdit
          ? `Caballo actualizado: ${payload?.horse?.name || values.horseName || 'sin nombre'}`
          : `Caballo creado: ${payload?.horse?.name || values.horseName || 'sin nombre'}`
      );
    } catch (error) {
      showToast(error.message || 'No pudimos guardar el caballo.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  async function submitGroupForm(formData) {
    const values = formDataToObject(formData);
    const groupName = String(values.groupName || '').trim();
    const selectedPaddockId = parsePositiveInt(values.paddockId);

    if (!groupName) {
      showToast('Necesitamos un nombre para crear el grupo.', 'critical');
      return;
    }

    setState({ loading: true });

    try {
      const payload = await postMutation({
        action: 'horse_group_save',
        groupName,
        active: true,
      });

      await loadAdminDashboards();
      openModal('horse-group-detail', { groupName: payload?.group?.name || groupName });

      showToast(
        selectedPaddockId
          ? `Grupo creado: ${payload?.group?.name || groupName}. Ahora sumá caballos para poder ubicarlo en el potrero elegido.`
          : `Grupo creado: ${payload?.group?.name || groupName}.`
      );
    } catch (error) {
      showToast(error.message || 'No pudimos crear el grupo.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  async function submitStockItemForm(formData) {
    const currentState = store.getState();
    const values = formDataToObject(formData);
    const itemId = parsePositiveInt(values.itemId);
    const itemName = String(values.itemName || '').trim();
    const unit = String(values.unit || '').trim();
    const currentStock = Number(values.currentStock);
    const minimumStockRaw = String(values.minimumStock || '').trim();
    const purchaseUnitLabel = String(values.purchaseUnitLabel || '').trim();
    const purchaseUnitSizeRaw = String(values.purchaseUnitSize || '').trim();
    const unitCostRaw = String(values.unitCost || '').trim();
    const lastPurchaseDate = String(values.lastPurchaseDate || '').trim();
    const supplier = String(values.supplier || '').trim();
    const isEdit = Boolean(itemId || currentState.modal?.payload?.mode === 'edit');

    if (!itemName) {
      showToast('El inventario necesita un nombre.', 'critical');
      return;
    }

    if (!unit) {
      showToast('Indicá la unidad del producto.', 'critical');
      return;
    }

    if (!Number.isFinite(currentStock) || currentStock < 0) {
      showToast('El stock tiene que ser un número mayor o igual a 0.', 'critical');
      return;
    }

    if (
      minimumStockRaw &&
      (!Number.isFinite(Number(minimumStockRaw)) || Number(minimumStockRaw) < 0)
    ) {
      showToast('El stock mínimo tiene que ser un número mayor o igual a 0.', 'critical');
      return;
    }

    if (unitCostRaw && (!Number.isFinite(Number(unitCostRaw)) || Number(unitCostRaw) < 0)) {
      showToast('El costo por compra tiene que ser un número mayor o igual a 0.', 'critical');
      return;
    }

    if (
      purchaseUnitSizeRaw &&
      (!Number.isFinite(Number(purchaseUnitSizeRaw)) || Number(purchaseUnitSizeRaw) <= 0)
    ) {
      showToast('La cantidad por compra tiene que ser un número mayor a 0.', 'critical');
      return;
    }

    if (purchaseUnitLabel && !purchaseUnitSizeRaw) {
      showToast('Si cargás un formato de compra, también indicá cuánta cantidad trae.', 'critical');
      return;
    }

    if (lastPurchaseDate && !isValidDateString(lastPurchaseDate)) {
      showToast('Elegí una fecha válida para la última compra.', 'critical');
      return;
    }

    setState({ loading: true });

    try {
      const payload = await postMutation({
        action: 'feed_item_save',
        itemId: itemId || undefined,
        itemName,
        unit,
        currentStock,
        minimumStock: minimumStockRaw || undefined,
        supplier: supplier || undefined,
        unitCost: unitCostRaw || undefined,
        purchaseUnitLabel: purchaseUnitLabel || undefined,
        purchaseUnitSize: purchaseUnitSizeRaw || undefined,
        lastPurchaseDate: lastPurchaseDate || undefined,
      });

      await loadAdminDashboards();
      showToast(
        isEdit
          ? `Inventario actualizado: ${payload?.feed_item?.name || itemName}`
          : `Inventario creado: ${payload?.feed_item?.name || itemName}`
      );
    } catch (error) {
      showToast(error.message || 'No pudimos guardar el inventario.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  async function submitStockPurchaseForm(formData) {
    const currentState = store.getState();
    const values = formDataToObject(formData);
    const itemId = parsePositiveInt(values.itemId);
    const item = itemId ? getRealStockItemById(currentState, itemId) : null;
    const enteredQuantity = Number(values.quantity);
    const unitCostRaw = String(values.unitCost || '').trim();
    const supplier = String(values.supplier || '').trim();
    const eventDate = String(values.eventDate || '').trim() || todayDateString();
    const notes = String(values.notes || '').trim();
    const usesPurchaseUnit = usesStockPurchaseUnit(item);
    const purchaseUnitSize = getStockPurchaseUnitSize(item);
    const purchaseUnitLabel = getStockPurchaseUnitLabel(item);

    if (!itemId || !item) {
      showToast('Elegí un producto válido para cargar stock.', 'critical');
      return;
    }

    if (!Number.isFinite(enteredQuantity) || enteredQuantity <= 0) {
      showToast('La cantidad ingresada tiene que ser mayor a 0.', 'critical');
      return;
    }

    if (unitCostRaw && (!Number.isFinite(Number(unitCostRaw)) || Number(unitCostRaw) < 0)) {
      showToast('El costo por compra tiene que ser un número mayor o igual a 0.', 'critical');
      return;
    }

    if (!isValidDateString(eventDate)) {
      showToast('Elegí una fecha válida para registrar la compra.', 'critical');
      return;
    }

    const stockQuantity = usesPurchaseUnit
      ? Number((enteredQuantity * purchaseUnitSize).toFixed(4))
      : enteredQuantity;
    const purchaseUnitCount = usesPurchaseUnit ? enteredQuantity : null;

    setState({ loading: true, modal: null });

    try {
      const effectiveUnitCost = unitCostRaw
        ? Number(unitCostRaw)
        : item.unit_cost != null && Number.isFinite(Number(item.unit_cost))
          ? Number(item.unit_cost)
          : null;
      await postMutation({
        action: 'stock_purchase_save',
        itemId,
        quantity: stockQuantity,
        purchaseUnitCount: purchaseUnitCount || undefined,
        unitCost: unitCostRaw || undefined,
        supplier: supplier || undefined,
        eventDate,
        notes: notes || undefined,
      });

      await loadAdminDashboards();

      const totalCost =
        effectiveUnitCost != null
          ? Number(
              (
                effectiveUnitCost * (purchaseUnitCount != null ? purchaseUnitCount : stockQuantity)
              ).toFixed(2)
            )
          : null;
      const quantitySummary =
        purchaseUnitCount != null
          ? `${formatNumberLabel(purchaseUnitCount)} ${purchaseUnitLabel || 'compra'} · ${formatStockValueLabel(
              stockQuantity,
              item.unit
            )}`
          : formatStockValueLabel(stockQuantity, item.unit);
      showToast(
        `Stock ingresado para ${item.name}: ${quantitySummary}${
          Number.isFinite(totalCost) ? ` por ${formatCurrencyLabel(totalCost)}` : ''
        }.`
      );
    } catch (error) {
      showToast(error.message || 'No pudimos registrar el ingreso de stock.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  async function saveHorseFeedPlan(horseId) {
    const normalizedHorseId = parsePositiveInt(horseId);
    if (!normalizedHorseId) {
      return;
    }

    const currentState = store.getState();
    const modalPayload =
      currentState.modal?.key === 'horse-history' &&
      Number(currentState.modal?.payload?.horseId) === normalizedHorseId
        ? currentState.modal.payload
        : {};
    const historyPayload = getRealHorseHistoryState(currentState, normalizedHorseId)?.data || null;
    const draftRows = getHorseFeedPlanDraftRowsForModal(modalPayload, historyPayload);
    const items = buildHorseFeedPlanSaveItems(draftRows);
    const selectedMonth = getHorseFeedCalendarMonth(modalPayload, historyPayload);

    updateActiveModalPayload((currentPayload) => {
      if (Number(currentPayload.horseId) !== normalizedHorseId) {
        return currentPayload;
      }

      return {
        ...currentPayload,
        feedPlanSaving: true,
        feedPlanError: '',
        feedPlanMessage: items.length
          ? 'Guardando plan de alimentación...'
          : 'Limpiando plan de alimentación...',
      };
    });

    try {
      const mutationPayload = await postMutation({
        action: 'horse_feed_plan_save',
        horseId: normalizedHorseId,
        items,
      });
      const refreshedPayload = await loadHorseHistory(normalizedHorseId, { month: selectedMonth });
      const savedHorseName =
        mutationPayload?.horse?.name || refreshedPayload?.horse?.name || getRealHorseById(store.getState(), normalizedHorseId)?.name || 'el caballo';

      updateActiveModalPayload((currentPayload) => {
        if (Number(currentPayload.horseId) !== normalizedHorseId) {
          return currentPayload;
        }

        return {
          ...currentPayload,
          feedPlanSaving: false,
          feedPlanError: '',
          feedCalendarMonth: selectedMonth,
          feedPlanDraftRows: buildHorseFeedPlanDraftRowsFromHistory(refreshedPayload),
          feedPlanMessage: items.length
            ? `Plan guardado para ${savedHorseName}.`
            : `Plan limpiado para ${savedHorseName}.`,
        };
      });

      showToast(items.length ? 'Plan de alimentación guardado.' : 'Plan de alimentación limpiado.', 'info');
    } catch (error) {
      updateActiveModalPayload((currentPayload) => {
        if (Number(currentPayload.horseId) !== normalizedHorseId) {
          return currentPayload;
        }

        return {
          ...currentPayload,
          feedPlanSaving: false,
          feedPlanError: error.message || 'No pudimos guardar el plan de alimentación.',
        };
      });
      showToast(error.message || 'No pudimos guardar el plan de alimentación.', 'critical');
    }
  }

  async function setHorseFeedCalendarMonth(horseId, nextMonth) {
    const normalizedHorseId = parsePositiveInt(horseId);
    const normalizedMonth = normalizeYearMonth(nextMonth);
    if (!normalizedHorseId || !normalizedMonth) {
      return;
    }

    const currentState = store.getState();
    const modalPayload =
      currentState.modal?.key === 'horse-history' &&
      Number(currentState.modal?.payload?.horseId) === normalizedHorseId
        ? currentState.modal.payload
        : {};
    const historyPayload = getRealHorseHistoryState(currentState, normalizedHorseId)?.data || null;
    const previousMonth = getHorseFeedCalendarMonth(modalPayload, historyPayload);

    updateActiveModalPayload((currentPayload) => {
      if (Number(currentPayload.horseId) !== normalizedHorseId) {
        return currentPayload;
      }

      return {
        ...currentPayload,
        feedCalendarMonth: normalizedMonth,
        feedPlanError: '',
        feedPlanMessage: `Cargando calendario de ${formatMonthLabel(normalizedMonth)}.`,
      };
    });

    try {
      await loadHorseHistory(normalizedHorseId, { month: normalizedMonth });
      updateActiveModalPayload((currentPayload) => {
        if (Number(currentPayload.horseId) !== normalizedHorseId) {
          return currentPayload;
        }

        return {
          ...currentPayload,
          feedCalendarMonth: normalizedMonth,
          feedPlanError: '',
          feedPlanMessage: `Mostrando ${formatMonthLabel(normalizedMonth)}.`,
        };
      });
    } catch (error) {
      updateActiveModalPayload((currentPayload) => {
        if (Number(currentPayload.horseId) !== normalizedHorseId) {
          return currentPayload;
        }

        return {
          ...currentPayload,
          feedCalendarMonth: previousMonth,
          feedPlanError: error.message || 'No pudimos cargar ese mes del calendario.',
        };
      });
      showToast(error.message || 'No pudimos cargar ese mes del calendario.', 'critical');
    }
  }

  async function toggleHorseFeedCalendarSlot(horseId, feedSlot, eventDate, checked) {
    const normalizedHorseId = parsePositiveInt(horseId);
    const normalizedSlot = getFeedSlotMeta(feedSlot)?.key || '';
    const normalizedDate = String(eventDate || '').trim();

    if (!normalizedHorseId || !normalizedSlot || !isValidDateString(normalizedDate)) {
      return;
    }

    const currentState = store.getState();
    const modalPayload =
      currentState.modal?.key === 'horse-history' &&
      Number(currentState.modal?.payload?.horseId) === normalizedHorseId
        ? currentState.modal.payload
        : {};
    const historyPayload = getRealHorseHistoryState(currentState, normalizedHorseId)?.data || null;
    const selectedMonth = getHorseFeedCalendarMonth(modalPayload, historyPayload);
    const pendingKey = `${normalizedDate}:${normalizedSlot}`;

    updateActiveModalPayload((currentPayload) => {
      if (Number(currentPayload.horseId) !== normalizedHorseId) {
        return currentPayload;
      }

      return {
        ...currentPayload,
        feedCalendarBusyKey: pendingKey,
        feedPlanError: '',
      };
    });

    try {
      const mutationPayload = await postMutation({
        action: 'horse_feed_slot_toggle',
        horseId: normalizedHorseId,
        feedSlot: normalizedSlot,
        eventDate: normalizedDate,
        checked: Boolean(checked),
      });
      await loadHorseHistory(normalizedHorseId, { month: selectedMonth });

      updateActiveModalPayload((currentPayload) => {
        if (Number(currentPayload.horseId) !== normalizedHorseId) {
          return currentPayload;
        }

        return {
          ...currentPayload,
          feedCalendarBusyKey: '',
          feedPlanError: '',
          feedPlanMessage: `${getFeedSlotLabel(normalizedSlot)} ${checked ? 'marcada' : 'desmarcada'} para ${formatDateLabel(normalizedDate)}.`,
        };
      });

      const stockSummary = formatHorseFeedStockChangeSummary(mutationPayload?.stock_changes);
      showToast(
        `${getFeedSlotLabel(normalizedSlot)} ${checked ? 'registrada' : 'desmarcada'} para ${formatDateLabel(
          normalizedDate
        )}${stockSummary ? ` · ${stockSummary}` : ''}.`,
        'info'
      );
    } catch (error) {
      updateActiveModalPayload((currentPayload) => {
        if (Number(currentPayload.horseId) !== normalizedHorseId) {
          return currentPayload;
        }

        return {
          ...currentPayload,
          feedCalendarBusyKey: '',
          feedPlanError: error.message || 'No pudimos actualizar esa comida.',
        };
      });
      showToast(error.message || 'No pudimos actualizar esa comida.', 'critical');
    }
  }

  async function submitMoveHorseForm(formData) {
    const currentState = store.getState();
    const values = formDataToObject(formData);
    const horseId = parsePositiveInt(values.horseId);
    const paddockId = parsePositiveInt(values.paddockId);
    const notes = String(values.notes || '').trim();
    const horse = horseId ? getRealHorseById(currentState, horseId) : null;
    const paddock = paddockId ? getRealPaddockCatalogById(currentState, paddockId) : null;

    if (!horseId || !horse) {
      showToast('Elegí un caballo válido para registrar el movimiento.', 'critical');
      return;
    }

    if (!paddockId || !paddock) {
      showToast('Elegí un potrero destino válido.', 'critical');
      return;
    }

    const paddockError = getPaddockSelectionError(paddock);
    if (paddockError) {
      showToast(paddockError, 'critical');
      return;
    }

    setState({ loading: true });

    try {
      const result = await syncHorsePaddockAssignment({
        state: currentState,
        horseId,
        nextPaddockId: paddockId,
        notes,
      });

      if (!result.changed) {
        setState({ modal: null });
        showToast(`${horse.name} ya está en ${paddock.name}.`, 'info');
        return;
      }

      await loadAdminDashboards({ closeModal: true });
      showToast(`${horse.name} movido a ${paddock.name}.`);
    } catch (error) {
      showToast(error.message || 'No pudimos mover el caballo.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  async function submitMoveGroupForm(formData) {
    const currentState = store.getState();
    const values = formDataToObject(formData);
    const groupId = parsePositiveInt(values.groupId);
    const paddockId = parsePositiveInt(values.paddockId);
    const eventDate = String(values.eventDate || '').trim() || todayDateString();
    const notes = String(values.notes || '').trim();
    const group = groupId ? getRealHorseGroupById(currentState, groupId) : null;
    const paddock = paddockId ? getRealPaddockCatalogById(currentState, paddockId) : null;

    if (!groupId || !group) {
      showToast('Elegí un grupo válido para registrar el movimiento.', 'critical');
      return;
    }

    if (!paddockId || !paddock) {
      showToast('Elegí un potrero destino válido.', 'critical');
      return;
    }

    if (!isValidDateString(eventDate)) {
      showToast('Elegí una fecha válida para registrar el movimiento.', 'critical');
      return;
    }

    const paddockError = getPaddockSelectionError(paddock, eventDate);
    if (paddockError) {
      showToast(paddockError, 'critical');
      return;
    }

    setState({ loading: true });

    try {
      const payload = await postMutation({
        action: 'grazing_group_move_in',
        groupId,
        paddockId,
        eventDate,
        notes: notes || undefined,
      });

      const movedCount = Number(payload?.moved_count || 0);
      const alreadyThereCount = Number(payload?.already_in_paddock_count || 0);
      const movementDetail =
        alreadyThereCount > 0
          ? `${movedCount} movido(s), ${alreadyThereCount} ya estaban ahí.`
          : `${Number(payload?.group_member_count || movedCount)} caballo(s) alineado(s).`;
      const successMessage = `${
        payload?.group?.name || group.name
      } movido a ${payload?.paddock?.name || paddock.name} el ${formatDateLabel(
        payload?.entered_at || eventDate
      )}. ${movementDetail}`;

      setState({ modal: null });

      try {
        await loadAdminDashboards({ closeModal: true });
        showToast(successMessage);
      } catch (refreshError) {
        showToast(
          `${successMessage} El movimiento quedó guardado, pero no pudimos refrescar el tablero: ${
            refreshError.message || 'error desconocido'
          }`,
          'warning'
        );
      }
    } catch (error) {
      showToast(error.message || 'No pudimos mover el grupo.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  async function submitRainForm(formData) {
    const values = formDataToObject(formData);
    const rainMm = Number(values.rainMm);
    const eventDate = String(values.eventDate || '').trim() || todayDateString();
    const notes = String(values.notes || '').trim();

    if (!Number.isFinite(rainMm) || rainMm < 0) {
      showToast('La lluvia tiene que ser un número mayor o igual a 0.', 'critical');
      return;
    }

    setState({ loading: true });

    try {
      const payload = await postMutation({
        action: 'rain_save',
        rainMm,
        eventDate,
        notes: notes || undefined,
      });

      await loadAdminDashboards({ closeModal: true });
      showToast(
        `Lluvia registrada para todo el campo: ${payload?.rain?.rain_mm ?? rainMm} mm el ${formatDateLabel(
          payload?.rain?.event_date || eventDate
        )}.`
      );
    } catch (error) {
      showToast(error.message || 'No pudimos guardar la lluvia.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  async function submitFrostForm(formData) {
    const values = formDataToObject(formData);
    const intensity = String(values.intensity || '').trim() || 'moderate';
    const eventDate = String(values.eventDate || '').trim() || todayDateString();
    const notes = String(values.notes || '').trim();

    setState({ loading: true });

    try {
      const payload = await postMutation({
        action: 'frost_save',
        intensity,
        eventDate,
        notes: notes || undefined,
      });

      await loadAdminDashboards({ closeModal: true });
      showToast(
        `Helada ${formatValueLabel(payload?.frost?.intensity || intensity, FROST_INTENSITY_OPTIONS).toLowerCase()} registrada para todo el campo el ${formatDateLabel(
          payload?.frost?.event_date || eventDate
        )}.`
      );
    } catch (error) {
      showToast(error.message || 'No pudimos guardar la helada.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  async function submitFieldWorkForm(formData) {
    const currentState = store.getState();
    const values = formDataToObject(formData);
    const paddockId = parsePositiveInt(values.paddockId || values.paddock);
    const paddock = paddockId ? getRealPaddockCatalogById(currentState, paddockId) : null;
    const eventType = getFieldWorkMutationValue(values.eventType || values.workType);
    const eventDate = String(values.eventDate || '').trim() || todayDateString();
    const performedByKind = normalizeResponsibleKindValue(values.performedByKind || '');
    const performedBy = String(values.performedBy || '').trim();
    const notes = String(values.notes || '').trim();

    if (!paddockId || !paddock) {
      showToast('Elegí un potrero válido para registrar el trabajo.', 'critical');
      return;
    }

    if (!eventType) {
      showToast('Elegí un tipo de trabajo válido.', 'critical');
      return;
    }

    setState({ loading: true });

    try {
      const payload = await postMutation({
        action: 'paddock_work_save',
        paddockId,
        eventType,
        eventDate,
        performedByKind,
        performedBy: performedBy || undefined,
        notes: notes || undefined,
      });

      setState({ paddockDetailById: {} });
      await loadAdminDashboards({ closeModal: true });

      const responsibleLabel = performedBy
        ? ` Responsable: ${performedBy}${
            performedByKind !== 'unspecified'
              ? ` (${formatResponsibleKindLabel(performedByKind).toLowerCase()})`
              : ''
          }.`
        : '';

      showToast(
        `${formatPaddockWorkTypeText(payload?.paddock_work_event?.event_type || eventType)} guardado para ${
          payload?.paddock?.name || paddock.name
        }.${responsibleLabel}`
      );
    } catch (error) {
      showToast(error.message || 'No pudimos guardar el trabajo de campo.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  async function submitHorseGroupManageForm(formData) {
    const currentState = store.getState();
    const currentPayload = currentState.modal?.payload || {};
    const modalState = buildGroupManageModalState(currentState, currentPayload);
    const values = formDataToObject(formData);

    if (!modalState || !modalState.id) {
      showToast('No pudimos reconstruir el grupo que estás editando.', 'critical');
      return;
    }

    const nextGroupName = String(values.groupName || values.groupNameOriginal || modalState.name).trim();
    if (!nextGroupName) {
      showToast('El grupo necesita un nombre.', 'critical');
      return;
    }

    const finalHorseIds = (modalState.members || [])
      .map((horse) => parsePositiveInt(horse.id))
      .filter((value) => Number.isFinite(value) && value > 0);

    setState({ loading: true });

    try {
      let savedGroupId = modalState.id;
      let savedGroupName = modalState.name;

      if (nextGroupName !== modalState.name) {
        const saveResult = await postMutation({
          action: 'horse_group_save',
          groupId: modalState.id,
          groupName: nextGroupName,
          active: true,
        });

        savedGroupId = Number(saveResult?.group?.id || modalState.id);
        savedGroupName = saveResult?.group?.name || nextGroupName;
      }

      const membershipResult = await postMutation({
        action: 'horse_group_memberships_set',
        groupId: savedGroupId,
        horseIds: finalHorseIds,
      });

      let alignmentResult = null;
      if (
        normalizeModalStringList(currentPayload.addedHorseKeys).length > 0 &&
        parsePositiveInt(modalState.current_location_id)
      ) {
        try {
          alignmentResult = await postMutation({
            action: 'grazing_group_move_in',
            groupId: savedGroupId,
            paddockId: parsePositiveInt(modalState.current_location_id),
            eventDate: todayDateString(),
            notes: `Alineación automática después de actualizar miembros de ${savedGroupName}.`,
          });
        } catch (error) {
          if (Number(error?.status) !== 409) {
            throw error;
          }
        }
      }

      await loadAdminDashboards({ closeModal: true });

      const reassignedCount = Array.isArray(membershipResult?.reassigned_members)
        ? membershipResult.reassigned_members.length
        : 0;
      const removedCount = Array.isArray(membershipResult?.removed_members)
        ? membershipResult.removed_members.length
        : 0;
      const alignedCount = Number(alignmentResult?.moved_count || 0);

      const messageParts = [
        `Grupo actualizado: ${savedGroupName}.`,
        `${finalHorseIds.length} caballo(s) en el grupo.`,
      ];

      if (reassignedCount > 0) {
        messageParts.push(`${reassignedCount} movido(s) desde otro grupo.`);
      }

      if (removedCount > 0) {
        messageParts.push(`${removedCount} quitado(s) del grupo.`);
      }

      if (alignedCount > 0 && alignmentResult?.paddock?.name) {
        messageParts.push(`${alignedCount} alineado(s) a ${alignmentResult.paddock.name}.`);
      }

      showToast(messageParts.join(' '));
    } catch (error) {
      showToast(error.message || 'No pudimos guardar los cambios del grupo.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  async function deleteHorseById(horseId) {
    const horse = getRealHorseById(store.getState(), horseId);
    if (!horse) {
      showToast('No encontramos ese caballo en la lectura actual.', 'critical');
      return;
    }

    const confirmed = window.confirm(
      `Vas a eliminar a ${horse.name}. Esto también puede borrar historial relacionado del caballo.`
    );
    if (!confirmed) {
      return;
    }

    setState({ loading: true });

    try {
      const payload = await requestJson(HORSES_API_URL, {
        method: 'DELETE',
        body: JSON.stringify({ horseId }),
      });

      await loadAdminDashboards({ closeModal: true });

      const relatedCount = Number(payload?.deleted_related_row_count || 0);
      showToast(
        relatedCount > 0
          ? `${payload?.horse?.name || horse.name} eliminado. Se limpiaron ${relatedCount} registro(s) relacionado(s).`
          : `${payload?.horse?.name || horse.name} eliminado.`
      );
    } catch (error) {
      showToast(error.message || 'No pudimos eliminar el caballo.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  async function deleteStockMovementById(stockEventId) {
    const currentState = store.getState();
    const movement = getRealStockMovementById(currentState, stockEventId);
    if (!movement) {
      showToast('No encontramos ese movimiento en la lectura actual.', 'critical');
      return;
    }

    const confirmed = window.confirm(
      `Vas a borrar este movimiento de ${movement.item_name} por ${formatStockValueLabel(
        movement.quantity,
        movement.unit
      )} del ${formatCompactDateLabel(
        movement.event_date
      )}. Esto también va a ajustar el stock actual del producto.`
    );
    if (!confirmed) {
      return;
    }

    setState({ loading: true });

    try {
      const payload = await postMutation({
        action: 'stock_event_delete',
        stockEventId,
      });

      await loadAdminDashboards({ closeModal: true });

      const adjustedStock = payload?.stock?.current_stock;
      const adjustedUnit = payload?.stock?.unit || movement.unit;
      showToast(
        Number.isFinite(Number(adjustedStock))
          ? `Movimiento eliminado de ${payload?.stock?.feed_item_name || movement.item_name}. Stock ajustado a ${formatStockValueLabel(
              adjustedStock,
              adjustedUnit
            )}.`
          : `Movimiento eliminado de ${payload?.stock?.feed_item_name || movement.item_name}.`
      );
    } catch (error) {
      showToast(error.message || 'No pudimos borrar ese movimiento de stock.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  function formDataToObject(formData) {
    const values = {};
    formData.forEach((value, key) => {
      values[key] = String(value);
    });
    return values;
  }

  function submitModal(modalKey, formData) {
    const values = formDataToObject(formData);
    let message = 'Acción guardada en modo demo.';
    let nextPatch = { modal: null };

    switch (modalKey) {
      case 'move-group':
        message = `${values.group} quedó programado hacia ${values.targetPaddock}.`;
        break;
      case 'move-horse':
        message = `${values.horse} quedó asignado a ${values.targetPaddock}.`;
        break;
      case 'register-rain':
        message = `Registramos ${values.rainMm || values.millimeters}mm para todo el campo.`;
        break;
      case 'register-frost':
        message = `Helada ${formatValueLabel(values.intensity || '', FROST_INTENSITY_OPTIONS).toLowerCase()} registrada para todo el campo.`;
        break;
      case 'field-work':
        message = `${formatPaddockWorkTypeText(values.eventType || values.workType)} guardado para ${values.paddockId || values.paddock}.`;
        break;
      case 'new-task':
        message = `Tarea "${values.title}" creada para ${values.date}.`;
        nextPatch = {
          ...nextPatch,
          activeNav: 'calendar',
          calendarTaskFilter: 'pending',
        };
        break;
      case 'paddock-form':
        message = `Potrero ${values.name} actualizado en demo.`;
        nextPatch = { ...nextPatch, activeNav: 'paddocks' };
        break;
      case 'horse-form':
        message = `Caballo ${values.name} actualizado en demo.`;
        nextPatch = { ...nextPatch, activeNav: 'horses' };
        break;
      case 'group-form':
        message = `Grupo ${values.name} guardado en demo.`;
        nextPatch = { ...nextPatch, activeNav: 'horses', views: { ...store.getState().views, horses: 'groups' } };
        break;
      case 'horse-group-manage':
        message = isRealSession(store.getState())
          ? `La vista de gestión de ${values.groupName || values.groupNameOriginal || 'este grupo'} quedó lista. Falta conectar el guardado real de grupos.`
          : `Gestión visual de ${values.groupName || values.groupNameOriginal || 'este grupo'} guardada en demo.`;
        nextPatch = {
          ...nextPatch,
          activeNav: 'horses',
          views: { ...store.getState().views, horses: 'groups' },
        };
        break;
      case 'account-password':
        if (String(values.newPassword || '').length < 8) {
          showToast('El nuevo password tiene que tener al menos 8 caracteres.', 'critical');
          return;
        }

        if (values.newPassword !== values.confirmPassword) {
          showToast('La confirmación del nuevo password no coincide.', 'critical');
          return;
        }

        message = isRealSession(store.getState())
          ? 'La pantalla quedó lista. Falta conectar el cambio real de password al backend seguro.'
          : 'Cambio de password simulado en modo demo.';
        nextPatch = {
          ...nextPatch,
          activeNav: 'settings',
          views: { ...store.getState().views, settings: 'security' },
        };
        break;
      case 'account-delete':
        if (String(values.confirmation || '').trim().toUpperCase() !== 'ELIMINAR') {
          showToast('Escribí ELIMINAR para habilitar esta confirmación.', 'critical');
          return;
        }

        message = isRealSession(store.getState())
          ? 'La confirmación quedó validada. Falta conectar la eliminación segura de la cuenta.'
          : 'Confirmación de eliminación simulada en modo demo.';
        nextPatch = {
          ...nextPatch,
          activeNav: 'settings',
          views: { ...store.getState().views, settings: 'security' },
        };
        break;
      case 'owner-form':
        message = `Propietario ${values.name} creado en demo.`;
        nextPatch = { ...nextPatch, activeNav: 'owners' };
        break;
      case 'invoice-create':
        message = `Factura dummy generada para ${values.owner}.`;
        nextPatch = { ...nextPatch, activeNav: 'owners' };
        break;
      case 'product-form':
        message = `Producto ${values.name} guardado en demo.`;
        nextPatch = { ...nextPatch, activeNav: 'stock', views: { ...store.getState().views, stock: 'inventory' } };
        break;
      case 'purchase-create':
        message = `Compra dummy registrada para ${values.product}.`;
        nextPatch = { ...nextPatch, activeNav: 'stock', views: { ...store.getState().views, stock: 'movements' } };
        break;
      case 'advanced-filters':
        message = 'Filtros aplicados en demo.';
        nextPatch = { ...nextPatch, activeNav: 'records' };
        break;
      case 'user-form':
        message = `Usuario ${values.name} guardado en demo.`;
        nextPatch = {
          ...nextPatch,
          activeNav: 'settings',
          views: { ...store.getState().views, settings: 'users' },
        };
        break;
      default:
        break;
    }

    setState(nextPatch);
    showToast(message);
  }

  async function enterDemoMode() {
    setState({ loading: true, loginError: '' });
    await wait(160);
    setState({
      loading: false,
      booting: false,
      mobileMenuOpen: false,
      modal: null,
      horsesDashboard: null,
      paddocksDashboard: null,
      stockDashboard: null,
      calendarEventsByMonth: {},
      horseHistoryById: {},
      paddockDetailById: {},
      horseFilters: {
        query: '',
        group: 'all',
        care: 'all',
      },
      paddockFilters: {
        query: '',
        status: 'all',
      },
      stockFilters: {
        query: '',
        category: 'all',
      },
      session: {
        authenticated: true,
        username: 'demo',
        demo: true,
      },
      calendarSelectedDate: '',
      refreshedAt: new Date().toISOString(),
    });
  }

  async function hydrateSession() {
    try {
      const session = await requestJson(SESSION_API_URL);
      let horsesDashboard = null;
      let paddocksDashboard = null;
      let stockDashboard = null;
      let calendarMonthPayload = null;

      if (Boolean(session && session.authenticated && !session.demo)) {
        const currentCalendarMonth = getCalendarMonthKeyFromOffset(0);
        const dashboardResults = await Promise.allSettled([
          requestJson(HORSES_API_URL),
          requestJson(PADDOCKS_API_URL),
          requestJson(STOCK_DASHBOARD_API_URL),
          requestJson(buildCalendarEventsUrl(currentCalendarMonth)),
        ]);

        horsesDashboard =
          dashboardResults[0].status === 'fulfilled' ? dashboardResults[0].value : null;
        paddocksDashboard =
          dashboardResults[1].status === 'fulfilled' ? dashboardResults[1].value : null;
        stockDashboard =
          dashboardResults[2].status === 'fulfilled' ? dashboardResults[2].value : null;
        calendarMonthPayload =
          dashboardResults[3].status === 'fulfilled' ? dashboardResults[3].value : null;
      }

      setState({
        session,
        horsesDashboard,
        paddocksDashboard,
        stockDashboard,
        calendarEventsByMonth: calendarMonthPayload
          ? {
              [getCalendarMonthKeyFromOffset(0)]: {
                loading: false,
                error: '',
                data: calendarMonthPayload,
              },
            }
          : {},
        horseHistoryById: {},
        paddockDetailById: {},
        booting: false,
        loading: false,
        calendarSelectedDate:
          calendarMonthPayload?.today &&
          calendarMonthPayload.today.slice(0, 7) === getCalendarMonthKeyFromOffset(0)
            ? calendarMonthPayload.today
            : '',
        refreshedAt:
          horsesDashboard?.meta?.refreshed_at ||
          paddocksDashboard?.meta?.refreshed_at ||
          stockDashboard?.meta?.refreshed_at ||
          new Date().toISOString(),
      });
    } catch (_error) {
      setState({
        booting: false,
        loading: false,
        horsesDashboard: null,
        paddocksDashboard: null,
        stockDashboard: null,
        calendarEventsByMonth: {},
        horseHistoryById: {},
        paddockDetailById: {},
        session: {
          authenticated: false,
          username: null,
          demo: false,
        },
        loginError:
          'No pudimos validar la sesión actual. Podés entrar en modo demo mientras armamos la parte visual.',
      });
    }
  }

  async function submitLogin(formData) {
    setState({ loginPending: true, loginError: '' });

    try {
      await requestJson(LOGIN_API_URL, {
        method: 'POST',
        body: JSON.stringify({
          username: formData.get('username') || '',
          password: formData.get('password') || '',
        }),
      });

      const session = await requestJson(SESSION_API_URL);
      const currentCalendarMonth = getCalendarMonthKeyFromOffset(0);
      const dashboardResults = await Promise.allSettled([
        requestJson(HORSES_API_URL),
        requestJson(PADDOCKS_API_URL),
        requestJson(STOCK_DASHBOARD_API_URL),
        requestJson(buildCalendarEventsUrl(currentCalendarMonth)),
      ]);
      const horsesDashboard =
        dashboardResults[0].status === 'fulfilled' ? dashboardResults[0].value : null;
      const paddocksDashboard =
        dashboardResults[1].status === 'fulfilled' ? dashboardResults[1].value : null;
      const stockDashboard =
        dashboardResults[2].status === 'fulfilled' ? dashboardResults[2].value : null;
      const calendarMonthPayload =
        dashboardResults[3].status === 'fulfilled' ? dashboardResults[3].value : null;

      setState({
        loginPending: false,
        session,
        horsesDashboard,
        paddocksDashboard,
        stockDashboard,
        calendarEventsByMonth: calendarMonthPayload
          ? {
              [currentCalendarMonth]: {
                loading: false,
                error: '',
                data: calendarMonthPayload,
              },
            }
          : {},
        horseHistoryById: {},
        paddockDetailById: {},
        calendarSelectedDate:
          calendarMonthPayload?.today && calendarMonthPayload.today.slice(0, 7) === currentCalendarMonth
            ? calendarMonthPayload.today
            : '',
        refreshedAt:
          horsesDashboard?.meta?.refreshed_at ||
          paddocksDashboard?.meta?.refreshed_at ||
          stockDashboard?.meta?.refreshed_at ||
          new Date().toISOString(),
      });
    } catch (error) {
      setState({
        loginPending: false,
        loginError: error.message || 'No pudimos iniciar sesión.',
      });
    }
  }

  async function refreshView() {
    const currentState = store.getState();
    setState({ loading: true, mobileMenuOpen: false, modal: null });

    try {
      if (isRealSession(currentState)) {
        await loadAdminDashboards();
        showToast('Datos refrescados desde Neon.', 'info');
        return;
      }

      await wait(180);
      setState({ refreshedAt: new Date().toISOString() });
      showToast('Pantalla refrescada en demo.', 'info');
    } catch (error) {
      showToast(error.message || 'No pudimos refrescar la vista.', 'critical');
    } finally {
      setState({ loading: false });
    }
  }

  async function submitLogout() {
    const currentState = store.getState();

    setState({ loading: true, mobileMenuOpen: false });

    if (!(currentState.session && currentState.session.demo)) {
      try {
        await requestJson(LOGOUT_API_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'logout' }),
        });
      } catch (_error) {
        // Keep local logout behavior even if the request fails.
      }
    }

    setState(buildSignedOutState({ loginError: '' }));
  }

  function openAlertContext(payload) {
    const currentState = store.getState();
    const alertKey = String(payload?.alertKey || '').trim();
    const alertNavKey = String(payload?.alertNavKey || '').trim() || 'home';

    if (alertKey === 'farrier-due') {
      setState({
        activeNav: 'horses',
        mobileMenuOpen: false,
        modal: null,
        views: {
          ...(currentState.views || {}),
          horses: 'individual',
        },
        horseFilters: {
          ...(currentState.horseFilters || {}),
          query: '',
          group: 'all',
          care: 'farrier-alert',
        },
      });
      return;
    }

    if (alertKey === 'deworm-due') {
      setState({
        activeNav: 'horses',
        mobileMenuOpen: false,
        modal: null,
        views: {
          ...(currentState.views || {}),
          horses: 'individual',
        },
        horseFilters: {
          ...(currentState.horseFilters || {}),
          query: '',
          group: 'all',
          care: 'deworm-alert',
        },
      });
      return;
    }

    if (alertKey === 'paddocks-growing') {
      setState({
        activeNav: 'paddocks',
        mobileMenuOpen: false,
        modal: null,
        views: {
          ...(currentState.views || {}),
          paddocks: 'cards',
        },
        paddockFilters: {
          ...(currentState.paddockFilters || {}),
          query: '',
          status: 'growing',
        },
      });
      return;
    }

    if (alertKey === 'stock-low') {
      setState({
        activeNav: 'stock',
        mobileMenuOpen: false,
        modal: null,
        views: {
          ...(currentState.views || {}),
          stock: 'inventory',
        },
        stockFilters: {
          ...(currentState.stockFilters || {}),
          query: '',
          category: 'all',
        },
      });
      return;
    }

    setState({
      activeNav: alertNavKey,
      mobileMenuOpen: false,
      modal: null,
    });
  }

  function handleClick(event) {
    const button = event.target.closest('[data-action], [data-nav-key], [data-view-key]');
    if (!button) {
      return;
    }

    const viewKey = button.getAttribute('data-view-key');
    const viewNav = button.getAttribute('data-view-nav');
    const navKey = button.getAttribute('data-nav-key');
    if (navKey) {
      const nextMonth = getCalendarMonthKeyFromOffset(store.getState().calendarMonthOffset || 0);
      setState((currentState) => ({
        activeNav: navKey,
        mobileMenuOpen: false,
        modal: null,
        views:
          viewKey && viewNav
            ? {
                ...(currentState.views || {}),
                [viewNav]: viewKey,
              }
            : currentState.views,
      }));

      if (navKey === 'calendar' && isRealSession(store.getState())) {
        loadCalendarMonthData(nextMonth).catch(() => {});
      }
      return;
    }

    if (viewKey && viewNav) {
      setState((currentState) => ({
        views: {
          ...(currentState.views || {}),
          [viewNav]: viewKey,
        },
      }));
      return;
    }

    const action = button.getAttribute('data-action');
    const actionValue = button.getAttribute('data-value');
    const actionMessage = button.getAttribute('data-message');
    const payload = getDatasetPayload(button.dataset);

    if (action === 'open-modal') {
      if (actionValue === 'horse-history' && isRealSession(store.getState()) && payload.horseId) {
        openModal(actionValue, payload);
        loadHorseHistory(payload.horseId).catch(() => {});
        return;
      }

      if (actionValue === 'paddock-detail' && isRealSession(store.getState()) && payload.paddockId) {
        openModal(actionValue, payload);
        loadPaddockDetail(payload.paddockId).catch(() => {});
        return;
      }

      openModal(actionValue, payload);
      return;
    }

    if (action === 'open-telegram-bot') {
      openTelegramBot();
      return;
    }

    if (action === 'close-modal') {
      closeModal();
      return;
    }

    if (action === 'close-and-nav') {
      setState({ modal: null, activeNav: actionValue, mobileMenuOpen: false });
      if (actionValue === 'calendar' && isRealSession(store.getState())) {
        loadCalendarMonthData(getCalendarMonthKeyFromOffset(store.getState().calendarMonthOffset || 0)).catch(() => {});
      }
      return;
    }

    if (action === 'toggle-mobile-menu') {
      setState((currentState) => ({ mobileMenuOpen: !currentState.mobileMenuOpen }));
      return;
    }

    if (action === 'toast') {
      showToast(actionMessage || actionValue || 'Acción demo ejecutada.');
      return;
    }

    if (action === 'open-alert-context') {
      openAlertContext(payload);
      return;
    }

    if (action === 'calendar-shift') {
      const currentOffset = store.getState().calendarMonthOffset || 0;
      const nextOffset = currentOffset + Number(actionValue || 0);
      const nextMonth = getCalendarMonthKeyFromOffset(nextOffset);
      setState({
        calendarMonthOffset: nextOffset,
        calendarSelectedDate: '',
      });

      if (isRealSession(store.getState())) {
        loadCalendarMonthData(nextMonth).catch(() => {});
      }
      return;
    }

    if (action === 'select-calendar-day') {
      setState({ calendarSelectedDate: actionValue || '' });
      return;
    }

    if (action === 'set-calendar-filter') {
      setState({ calendarTaskFilter: actionValue || 'pending' });
      scrollToSectionById(payload.anchorTarget || '');
      return;
    }

    if (action === 'refresh') {
      refreshView();
      return;
    }

    if (action === 'delete-horse') {
      deleteHorseById(payload.horseId);
      return;
    }

    if (action === 'delete-stock-movement') {
      deleteStockMovementById(payload.stockEventId);
      return;
    }

    if (action === 'add-horse-feed-plan-row') {
      const horseId = parsePositiveInt(payload.horseId);
      const feedSlot = getFeedSlotMeta(payload.feedSlot)?.key || 'morning';
      if (!horseId) {
        return;
      }

      updateActiveModalPayload((currentPayload, currentState) => {
        if (Number(currentPayload.horseId) !== horseId) {
          return currentPayload;
        }

        const historyPayload = getRealHorseHistoryState(currentState, horseId)?.data || null;
        const draftRows = getHorseFeedPlanDraftRowsForModal(currentPayload, historyPayload);
        return {
          ...currentPayload,
          feedPlanDraftRows: [...draftRows, buildHorseFeedPlanDraftRow({ feed_slot: feedSlot })],
          feedPlanError: '',
          feedPlanMessage: `${getFeedSlotLabel(feedSlot)} lista para sumar un ingrediente.`,
        };
      });
      return;
    }

    if (action === 'remove-horse-feed-plan-row') {
      const horseId = parsePositiveInt(payload.horseId);
      const rowKey = String(payload.rowKey || '').trim();
      if (!horseId || !rowKey) {
        return;
      }

      updateActiveModalPayload((currentPayload, currentState) => {
        if (Number(currentPayload.horseId) !== horseId) {
          return currentPayload;
        }

        const historyPayload = getRealHorseHistoryState(currentState, horseId)?.data || null;
        const draftRows = getHorseFeedPlanDraftRowsForModal(currentPayload, historyPayload);
        return {
          ...currentPayload,
          feedPlanDraftRows: draftRows.filter((row) => row.row_key !== rowKey),
          feedPlanError: '',
          feedPlanMessage: 'Ingrediente removido del plan. Guardá para aplicar el cambio.',
        };
      });
      return;
    }

    if (action === 'save-horse-feed-plan') {
      saveHorseFeedPlan(payload.horseId);
      return;
    }

    if (action === 'shift-horse-feed-calendar-month') {
      const horseId = parsePositiveInt(payload.horseId);
      if (!horseId) {
        return;
      }

      const currentHistoryPayload = getRealHorseHistoryState(store.getState(), horseId)?.data || null;
      const currentMonth = getHorseFeedCalendarMonth(store.getState().modal?.payload || {}, currentHistoryPayload);
      const nextMonth = addMonthsToYearMonth(currentMonth, Number(payload.monthDelta || 0));
      setHorseFeedCalendarMonth(horseId, nextMonth);
      return;
    }

    if (action === 'set-horse-feed-calendar-month') {
      setHorseFeedCalendarMonth(payload.horseId, payload.month);
      return;
    }

    if (action === 'reload-horse-history') {
      if (payload.horseId) {
        const currentHistoryPayload =
          getRealHorseHistoryState(store.getState(), payload.horseId)?.data || null;
        const selectedMonth = getHorseFeedCalendarMonth(
          store.getState().modal?.payload || {},
          currentHistoryPayload
        );
        loadHorseHistory(payload.horseId, { month: selectedMonth }).catch(() => {});
      }
      return;
    }

    if (action === 'toggle-group-picker') {
      updateActiveModalPayload((currentPayload) => ({
        ...currentPayload,
        groupPickerOpen: !currentPayload.groupPickerOpen,
        selectedHorseKeys: currentPayload.groupPickerOpen
          ? []
          : normalizeModalStringList(currentPayload.selectedHorseKeys),
      }));
      return;
    }

    if (action === 'toggle-group-selection') {
      const horseKey = String(payload.horseKey || '').trim();
      if (!horseKey) {
        return;
      }

      updateActiveModalPayload((currentPayload) => {
        const nextSelection = new Set(normalizeModalStringList(currentPayload.selectedHorseKeys));
        if (nextSelection.has(horseKey)) {
          nextSelection.delete(horseKey);
        } else {
          nextSelection.add(horseKey);
        }

        return {
          ...currentPayload,
          selectedHorseKeys: Array.from(nextSelection),
        };
      });
      return;
    }

    if (action === 'add-group-horses') {
      const selectedCount = normalizeModalStringList(
        store.getState().modal?.payload?.selectedHorseKeys
      ).length;

      updateActiveModalPayload((currentPayload, currentState) => {
        const modalState = buildGroupManageModalState(currentState, currentPayload);
        if (!modalState) {
          return currentPayload;
        }

        const selectedHorseKeys = normalizeModalStringList(currentPayload.selectedHorseKeys);
        const nextAdded = new Set(normalizeModalStringList(currentPayload.addedHorseKeys));
        const nextRemoved = new Set(normalizeModalStringList(currentPayload.removedHorseKeys));
        const baseMemberKeySet = new Set(modalState.base_member_keys || []);

        selectedHorseKeys.forEach((horseKey) => {
          if (baseMemberKeySet.has(horseKey)) {
            nextRemoved.delete(horseKey);
            return;
          }

          nextAdded.add(horseKey);
        });

        return {
          ...currentPayload,
          addedHorseKeys: Array.from(nextAdded),
          removedHorseKeys: Array.from(nextRemoved),
          selectedHorseKeys: [],
          groupPickerOpen: false,
        };
      });

      if (selectedCount > 0) {
        showToast('Caballos agregados a esta edición del grupo.', 'info');
      }
      return;
    }

    if (action === 'remove-group-horse') {
      const horseKey = String(payload.horseKey || '').trim();
      if (!horseKey) {
        return;
      }

      updateActiveModalPayload((currentPayload) => {
        const nextAdded = new Set(normalizeModalStringList(currentPayload.addedHorseKeys));
        const nextRemoved = new Set(normalizeModalStringList(currentPayload.removedHorseKeys));
        const nextSelected = new Set(normalizeModalStringList(currentPayload.selectedHorseKeys));

        if (nextAdded.has(horseKey)) {
          nextAdded.delete(horseKey);
        } else {
          nextRemoved.add(horseKey);
        }

        nextSelected.delete(horseKey);

        return {
          ...currentPayload,
          addedHorseKeys: Array.from(nextAdded),
          removedHorseKeys: Array.from(nextRemoved),
          selectedHorseKeys: Array.from(nextSelected),
        };
      });
      return;
    }

    if (action === 'delete-group') {
      showToast(
        isRealSession(store.getState())
          ? `La eliminación real del grupo ${payload.groupName || ''} la conectamos cuando entremos con el backend de grupos.`
          : `Eliminación de grupo lista para conectar. Por ahora queda como flujo visual.`,
        'critical'
      );
      return;
    }

    if (action === 'logout') {
      submitLogout();
      return;
    }

    if (action === 'demo-login') {
      enterDemoMode();
    }
  }

  function handleSubmit(event) {
    const modalForm = event.target.closest('[data-modal-form]');
    if (modalForm) {
      event.preventDefault();
      const modalKey = modalForm.getAttribute('data-modal-key');

      if (isRealSession(store.getState())) {
        if (modalKey === 'paddock-form') {
          submitPaddockForm(new FormData(modalForm));
          return;
        }

        if (modalKey === 'horse-form') {
          submitHorseForm(new FormData(modalForm));
          return;
        }

        if (modalKey === 'group-form') {
          submitGroupForm(new FormData(modalForm));
          return;
        }

        if (modalKey === 'product-form') {
          submitStockItemForm(new FormData(modalForm));
          return;
        }

        if (modalKey === 'purchase-create') {
          submitStockPurchaseForm(new FormData(modalForm));
          return;
        }

        if (modalKey === 'move-horse') {
          submitMoveHorseForm(new FormData(modalForm));
          return;
        }

        if (modalKey === 'move-group') {
          submitMoveGroupForm(new FormData(modalForm));
          return;
        }

        if (modalKey === 'horse-group-manage') {
          submitHorseGroupManageForm(new FormData(modalForm));
          return;
        }

        if (modalKey === 'register-rain') {
          submitRainForm(new FormData(modalForm));
          return;
        }

        if (modalKey === 'register-frost') {
          submitFrostForm(new FormData(modalForm));
          return;
        }

        if (modalKey === 'field-work') {
          submitFieldWorkForm(new FormData(modalForm));
          return;
        }
      }

      submitModal(modalKey, new FormData(modalForm));
      return;
    }

    const form = event.target.closest('[data-login-form]');
    if (!form) {
      return;
    }

    event.preventDefault();
    submitLogin(new FormData(form));
  }

  function handleFieldInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const horseFeedPlanField = target.getAttribute('data-feed-plan-field');
    if (horseFeedPlanField) {
      const rowKey = String(target.getAttribute('data-feed-plan-row-key') || '').trim();
      if (!rowKey) {
        return;
      }

      if (event.type !== 'change') {
        return;
      }

      const rawValue =
        target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;

      updateActiveModalPayload((currentPayload, currentState) => ({
        ...currentPayload,
        feedPlanError: '',
        feedPlanMessage: 'Hay cambios pendientes en este plan.',
        feedPlanDraftRows: updateHorseFeedPlanDraftRows(
          currentState,
          currentPayload,
          rowKey,
          horseFeedPlanField,
          rawValue
        ),
      }));
      return;
    }

    const horseFeedMonthInput = target.getAttribute('data-horse-feed-month');
    if (horseFeedMonthInput) {
      if (event.type !== 'change') {
        return;
      }

      const horseId = parsePositiveInt(target.getAttribute('data-horse-id'));
      if (!horseId || !('value' in target)) {
        return;
      }

      setHorseFeedCalendarMonth(horseId, String(target.value || ''));
      return;
    }

    const horseFeedCalendarToggle = target.getAttribute('data-feed-calendar-toggle');
    if (horseFeedCalendarToggle) {
      if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox' || event.type !== 'change') {
        return;
      }

      const horseId = parsePositiveInt(target.getAttribute('data-horse-id'));
      const feedSlot = String(target.getAttribute('data-feed-calendar-slot') || '').trim();
      const eventDate = String(target.getAttribute('data-feed-calendar-date') || '').trim();
      if (!horseId || !feedSlot || !eventDate) {
        return;
      }

      toggleHorseFeedCalendarSlot(horseId, feedSlot, eventDate, target.checked);
      return;
    }

    const modalConfigKey = target.getAttribute('data-group-config');
    if (modalConfigKey) {
      const nextValue = 'value' in target ? String(target.value || '') : '';
      updateActiveModalPayload((currentPayload) => ({
        ...currentPayload,
        [modalConfigKey]: nextValue,
      }));
      return;
    }

    const filterKey = target.getAttribute('data-horse-filter');
    if (filterKey) {
      const nextValue = 'value' in target ? String(target.value || '') : '';
      setState((currentState) => ({
        horseFilters: {
          ...(currentState.horseFilters || {}),
          [filterKey]: nextValue,
        },
      }));
      return;
    }

    const stockFilterKey = target.getAttribute('data-stock-filter');
    if (stockFilterKey) {
      const nextValue = 'value' in target ? String(target.value || '') : '';
      setState((currentState) => ({
        stockFilters: {
          ...(currentState.stockFilters || {}),
          [stockFilterKey]: nextValue,
        },
      }));
      return;
    }

    const paddockFilterKey = target.getAttribute('data-paddock-filter');
    if (!paddockFilterKey) {
      return;
    }

    const nextValue = 'value' in target ? String(target.value || '') : '';
    setState((currentState) => ({
      paddockFilters: {
        ...(currentState.paddockFilters || {}),
        [paddockFilterKey]: nextValue,
      },
    }));
  }

  store.subscribe((state) => {
    appRoot.innerHTML = renderApp(state);
  });

  appRoot.addEventListener('click', handleClick);
  appRoot.addEventListener('submit', handleSubmit);
  appRoot.addEventListener('input', handleFieldInput);
  appRoot.addEventListener('change', handleFieldInput);

  loadTelegramLink();
  hydrateSession();
})();
