(function initAdminV2() {
  const SESSION_API_URL = '/api/admin/session';
  const LOGIN_API_URL = '/api/admin/login';
  const LOGOUT_API_URL = '/api/admin/logout';
  const TELEGRAM_LINK_API_URL = '/api/admin-v2/telegram-link';
  const TELEGRAM_WEB_FALLBACK_URL = 'https://web.telegram.org/';

  const DEFAULT_ACTIVE_NAV = 'home';
  const DEFAULT_VIEWS = {
    paddocks: 'cards',
    horses: 'individual',
    owners: 'owners',
    stock: 'inventory',
    records: 'timeline',
    settings: 'telegram',
  };

  const MOBILE_PRIMARY_NAV_KEYS = ['home', 'paddocks', 'horses', 'owners', 'stock'];

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
      getSubtitle() {
        return `Resumen de tu campo - ${formatFriendlyDate(new Date())}`;
      },
      actions: [],
    },
    paddocks: {
      title: 'Gestión de Potreros',
      subtitle: '6 potreros · 3 ocupados',
      actions: [
        {
          label: 'Nuevo Potrero',
          tone: 'primary',
          icon: 'plus',
          trigger: { action: 'open-modal', value: 'paddock-create' },
        },
      ],
    },
    horses: {
      title: 'Caballos y Grupos',
      subtitle: '8 caballos · 4 grupos activos',
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
          trigger: { action: 'open-modal', value: 'horse-create' },
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
      subtitle: 'Gestión de inventario y finanzas del campo',
      actions: [
        {
          label: 'Nueva Compra',
          tone: 'secondary',
          icon: 'cart',
          trigger: { action: 'open-modal', value: 'purchase-create' },
        },
        {
          label: 'Nuevo Producto',
          tone: 'primary',
          icon: 'plus',
          trigger: { action: 'open-modal', value: 'product-create' },
        },
      ],
    },
    calendar: {
      title: 'Calendario de Actividades',
      subtitle: '1 tareas urgentes pendientes',
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
      subtitle: 'Administra las preferencias de tu campo',
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
        const error = new Error(
          (payload && payload.error) || `Request failed with status ${response.status}`
        );
        error.status = response.status;
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

  function formatMonthYear(date) {
    return new Intl.DateTimeFormat('es-UY', {
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  function totalAlertCount() {
    return DEMO_DATA.alerts.reduce((sum, item) => sum + item.count, 0);
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
          ${renderModalFooter([
            { label: options.cancelLabel || 'Cancelar', tone: 'secondary', trigger: { action: 'close-modal' } },
            { label: options.submitLabel || 'Guardar', tone: options.submitTone || 'primary', icon: options.submitIcon, submit: true },
          ])}
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

  function renderSidebar() {
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
                class="nav-item${item.key === store.getState().activeNav ? ' is-active' : ''}"
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
            ${DEMO_DATA.alerts
              .map(
                (alert) => `
                  <article class="sidebar-alert-card sidebar-alert-card--${escapeHtml(alert.tone)}">
                    <div class="sidebar-alert-icon">${renderIcon('bell')}</div>
                    <div class="sidebar-alert-copy">
                      <strong>${escapeHtml(alert.title)}</strong>
                      <span>${escapeHtml(alert.detail)}</span>
                    </div>
                    <span class="sidebar-alert-count">${escapeHtml(alert.count)}</span>
                  </article>
                `
              )
              .join('')}
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
            <span class="icon-badge">${escapeHtml(totalAlertCount())}</span>
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

        <div class="mobile-menu-footer">
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
      typeof meta.getSubtitle === 'function' ? meta.getSubtitle() : meta.subtitle;
    const sessionLabel =
      state.session && state.session.demo
        ? 'Modo demo'
        : state.session && state.session.username
          ? `@${state.session.username}`
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
            ${meta.actions
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

  function renderHomeView() {
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

  function renderHorsesView(state) {
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
                              value: 'group-form',
                              meta: { mode: 'manage', name: group.name },
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

  function renderInventoryView() {
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

  function renderMovementsView() {
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

  function renderAccountingView() {
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
    const activeView = getActiveView(state, 'stock');

    return `
      <div class="page-stack">
        ${renderMetricGrid(DEMO_DATA.stock.metrics)}
        ${renderNoticeCard(DEMO_DATA.stock.notice)}
        ${renderSegmentedTabs(state, 'stock', DEMO_DATA.stock.tabs)}
        ${
          activeView === 'movements'
            ? renderMovementsView()
            : activeView === 'accounting'
              ? renderAccountingView()
              : renderInventoryView()
        }
      </div>
    `;
  }

  function renderCalendarView(state) {
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
              <button type="button" class="btn btn-secondary btn-block" data-action="set-calendar-filter" data-value="all">Ver todas las tareas</button>
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

        <section class="panel">
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
          activeView === 'general'
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
        return renderFormModal({
          key: 'register-rain',
          title: 'Registrar Lluvia',
          subtitle: 'Guarda precipitaciones por potrero',
          submitLabel: 'Registrar Lluvia',
          submitIcon: 'rain',
          fields: [
            { label: 'Potrero', name: 'paddock', type: 'select', value: paddockOptions[0], options: paddockOptions },
            { label: 'Cantidad (mm)', name: 'millimeters', type: 'number', value: '12', min: '0', step: '0.1' },
            { label: 'Fecha', name: 'date', type: 'date', value: '2026-05-22' },
            { label: 'Notas (opcional)', name: 'notes', type: 'textarea', rows: 3, placeholder: 'Ejemplo: lluvia continua durante la noche.' },
          ],
        });

      case 'register-frost':
        return renderFormModal({
          key: 'register-frost',
          title: 'Registrar Helada',
          subtitle: 'Anota eventos climáticos críticos',
          submitLabel: 'Registrar Helada',
          submitIcon: 'snow',
          fields: [
            { label: 'Potrero', name: 'paddock', type: 'select', value: paddockOptions[0], options: paddockOptions },
            { label: 'Intensidad', name: 'intensity', type: 'select', value: 'Moderada', options: ['Leve', 'Moderada', 'Fuerte'] },
            { label: 'Fecha', name: 'date', type: 'date', value: '2026-05-22' },
            { label: 'Observaciones', name: 'notes', type: 'textarea', rows: 3, placeholder: 'Ejemplo: pasto escarchado a primera hora.' },
          ],
        });

      case 'field-work':
        return renderFormModal({
          key: 'field-work',
          title: 'Registrar Trabajo de Campo',
          subtitle: 'Documenta tareas operativas del potrero',
          submitLabel: 'Guardar Trabajo',
          submitIcon: 'work',
          fields: [
            { label: 'Tipo de trabajo', name: 'workType', type: 'select', value: 'Rastra', options: ['Rastra', 'Siembra', 'Fertilización', 'Corte', 'Fumigación'] },
            { label: 'Potrero', name: 'paddock', type: 'select', value: paddockOptions[0], options: paddockOptions },
            { label: 'Fecha', name: 'date', type: 'date', value: '2026-05-22' },
            { label: 'Responsable', name: 'owner', type: 'select', value: ownerOptions[0], options: ownerOptions },
            { label: 'Notas', name: 'notes', type: 'textarea', rows: 4, placeholder: 'Detalle del trabajo realizado...' },
          ],
        });

      case 'new-task':
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

      case 'horse-form': {
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
        return renderHomeView();
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
        return renderHomeView();
    }
  }

  function renderAuthenticatedShell(state) {
    return `
      <div class="screen-shell">
        ${renderSidebar()}
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
    session: null,
    loginPending: false,
    loginError: '',
    activeNav: DEFAULT_ACTIVE_NAV,
    views: { ...DEFAULT_VIEWS },
    calendarMonthOffset: 0,
    calendarTaskFilter: 'pending',
    refreshedAt: new Date().toISOString(),
  });

  function setState(patch) {
    store.setState(patch);
  }

  let toastTimer = 0;
  let telegramLinkPromise = null;

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
        message = `Registramos ${values.millimeters}mm en ${values.paddock}.`;
        break;
      case 'register-frost':
        message = `Helada ${String(values.intensity || '').toLowerCase()} registrada en ${values.paddock}.`;
        break;
      case 'field-work':
        message = `${values.workType} guardado para ${values.paddock}.`;
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
      session: {
        authenticated: true,
        username: 'demo',
        demo: true,
      },
      refreshedAt: new Date().toISOString(),
    });
  }

  async function hydrateSession() {
    try {
      const session = await requestJson(SESSION_API_URL);
      setState({
        session,
        booting: false,
        loading: false,
        refreshedAt: new Date().toISOString(),
      });
    } catch (_error) {
      setState({
        booting: false,
        loading: false,
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
      setState({
        loginPending: false,
        session,
        refreshedAt: new Date().toISOString(),
      });
    } catch (error) {
      setState({
        loginPending: false,
        loginError: error.message || 'No pudimos iniciar sesión.',
      });
    }
  }

  async function refreshView() {
    setState({ loading: true, mobileMenuOpen: false, modal: null });
    await wait(180);
    setState({ loading: false, refreshedAt: new Date().toISOString() });
    showToast('Pantalla refrescada en demo.', 'info');
  }

  async function submitLogout() {
    const currentState = store.getState();

    setState({ loading: true, mobileMenuOpen: false });

    if (!(currentState.session && currentState.session.demo)) {
      try {
        await requestJson(LOGOUT_API_URL, { method: 'POST' });
      } catch (_error) {
        // Keep local logout behavior even if the request fails.
      }
    }

    setState({
      loading: false,
      session: {
        authenticated: false,
        username: null,
        demo: false,
      },
      modal: null,
      toast: null,
      activeNav: DEFAULT_ACTIVE_NAV,
      views: { ...DEFAULT_VIEWS },
      calendarMonthOffset: 0,
      calendarTaskFilter: 'pending',
      refreshedAt: new Date().toISOString(),
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

    if (action === 'calendar-shift') {
      setState((currentState) => ({
        calendarMonthOffset: (currentState.calendarMonthOffset || 0) + Number(actionValue || 0),
      }));
      return;
    }

    if (action === 'set-calendar-filter') {
      setState({ calendarTaskFilter: actionValue || 'pending' });
      return;
    }

    if (action === 'refresh') {
      refreshView();
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
      submitModal(modalForm.getAttribute('data-modal-key'), new FormData(modalForm));
      return;
    }

    const form = event.target.closest('[data-login-form]');
    if (!form) {
      return;
    }

    event.preventDefault();
    submitLogin(new FormData(form));
  }

  store.subscribe((state) => {
    appRoot.innerHTML = renderApp(state);
  });

  appRoot.addEventListener('click', handleClick);
  appRoot.addEventListener('submit', handleSubmit);

  loadTelegramLink();
  hydrateSession();
})();
