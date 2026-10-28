/** HU-33: textos de las métricas de casos y reportes. Se incorpora a `es` en strings.ts. */
export const metricasCasosEs = {
  enlacePanel: 'Ver métricas de casos y reportes',
  titulo: 'Métricas de casos y reportes',
  vistas: {
    etiqueta: 'Tipo de métricas',
    comunidad: 'Comunidad',
    casos: 'Casos y reportes',
  },
  subtitulo: 'Detecta qué categorías, zonas y estados concentran más demanda.',
  definicion:
    'Un reporte es todo aviso registrado; un caso es un reporte que un voluntario aprobó en la revisión. Se cuentan los creados en el período, con su estado actual.',
  cargando: 'Cargando métricas de casos...',
  errorCargar: 'No se pudieron cargar las métricas de casos. Inténtalo de nuevo.',
  indicadores: {
    reportes: 'Reportes registrados',
    casos: 'Casos registrados',
    casosActivos: 'Casos activos',
    casosResueltos: 'Casos resueltos',
    ayudaCasos: 'Reportes aprobados en la revisión.',
    ayudaActivos: 'Casos pendientes o en proceso.',
    porcentajeAprobados: '{{n}} % de los reportes',
    porcentajeDeCasos: '{{n}} % de los casos',
  },
  graficos: {
    casosPorZona: 'Casos por zona',
    casosPorEstado: 'Casos por estado',
  },
  tablas: {
    casosPorEstado: 'Casos por estado',
    casosPorCategoria: 'Casos por categoría',
    casosPorZona: 'Casos por zona',
    reportesPorEstado: 'Reportes por estado de revisión',
    reportesPorCategoria: 'Reportes por categoría',
    estado: 'Estado',
    categoria: 'Categoría',
    zona: 'Zona',
    cantidadEn: 'Cantidad ({{periodo}})',
    porcentaje: '% del total',
    total: 'Total',
    sinDato: 'Sin dato',
    notaZonas:
      'La zona se calcula desde la Plaza 14 de Septiembre: centro hasta 1,5 km, luego norte, sur, este u oeste hasta 12 km, y afueras más allá.',
  },
  zonas: {
    CENTRO: 'Centro',
    NORTE: 'Norte',
    SUR: 'Sur',
    ESTE: 'Este',
    OESTE: 'Oeste',
    AFUERAS: 'Afueras',
    SIN_UBICACION: 'Sin ubicación',
  },
} as const;
