
/** Redesign: Cases page strings (list + map). Merged into `en` in strings.ts. */
export const casosEn = {
  tituloPagina: 'Cases',

  filtros: {
    ariaLabel: 'Filter cases',
    buscar: 'Search cases',
    buscarPlaceholder: 'Search cases...',
    estado: 'Status',
    tipo: 'Case type',
    tipoTodos: 'All types',
    distancia: 'Distance',
    distanciaCualquiera: 'Any distance',
    distanciaMenos: 'Within {{km}} km',
    animal: 'Animal',
    animalTodos: 'All animals',
    necesitaTodos: 'Any need',
    necesita: 'Needs',
    proximamente: 'Coming soon',
    pronto: 'Soon',
    limpiar: 'Clear filters',
  },

  estados: {
    ABIERTOS: 'Open',
    URGENTES: 'Urgent',
    EN_PROCESO: 'In progress',
    RESUELTOS: 'Resolved',
    TODOS: 'All',
  },

  vista: {
    ariaLabel: 'View',
    lista: 'List',
    listaMapa: 'List + map',
    mapa: 'Map',
  },

  orden: {
    etiqueta: 'Sort',
    URGENTES: 'Most urgent first',
    RECIENTES: 'Newest first',
    CERCANOS: 'Closest first',
  },

  resultados: {
    uno: '1 case',
    varios: '{{n}} cases',
    enZona: 'in this area',
    quitarZona: 'See all',
  },

  insignias: {
    urgente: 'Urgent',
    activo: 'Active',
    resuelto: 'Resolved',
    cancelado: 'Cancelled',
  },

  mapa: {
    ariaLabel: 'Cases map',
    leyenda: 'Legend',
    verCaso: 'View case →',
    buscarEnZona: 'Search this area',
    sinUbicacion: 'This case has no location on the map.',
    marcador: 'Case: {{titulo}} ({{estado}})',
  },

  ubicacion: {
    pidiendo: 'Finding your location...',
    denegada: 'We could not use your location. Check your browser permissions.',
  },

  cargando: 'Loading cases...',
  error: 'Could not load cases.',
  reintentar: 'Try again',
  vacio: 'No cases match these filters.',
  sinFoto: 'Case without a photo',
} as const;
