/** HU-34: respuesta de GET /api/metricas para un periodo (fechas ISO, ambos extremos inclusive). */
export interface Metricas {
  desde: string;
  hasta: string;
  agrupacion: AgrupacionMetricas;
  usuarios: MetricasUsuarios;
  voluntarios: MetricasVoluntarios;
  organizaciones: MetricasOrganizaciones;
  evolucion: PuntoEvolucion[];
}

/** Tamano de cada tramo de la evolucion; lo elige el backend segun lo largo del periodo. */
export type AgrupacionMetricas = 'DIA' | 'SEMANA' | 'MES';

export interface MetricasUsuarios {
  /** Cuentas creadas dentro del periodo. */
  registrados: number;
  /** Usuarios distintos que iniciaron sesion dentro del periodo. */
  activos: number;
  /** Cuentas que existian al terminar el periodo. */
  totalAlCierre: number;
}

export interface MetricasVoluntarios {
  /** Solicitudes de voluntario aprobadas dentro del periodo. */
  nuevos: number;
  /** Voluntarios de hoy; no depende del periodo. */
  actuales: number;
  porTipoAyuda: VoluntariosPorTipo[];
}

export interface VoluntariosPorTipo {
  tipoAyuda: string;
  nuevos: number;
  actuales: number;
}

export interface MetricasOrganizaciones {
  nuevas: number;
  totalAlCierre: number;
  porTipo: OrganizacionesPorTipo[];
}

export interface OrganizacionesPorTipo {
  tipo: string;
  nuevas: number;
  pendientes: number;
  verificadas: number;
  rechazadas: number;
  total: number;
}

export interface PuntoEvolucion {
  /** Primer dia del tramo (ISO). */
  inicio: string;
  registrados: number;
  activos: number;
}

/** Periodo con fechas ISO (aaaa-mm-dd), como las devuelve un <input type="date">. */
export interface Periodo {
  desde: string;
  hasta: string;
}

// ============================================================
// HU-33: métricas de casos y reportes
// ============================================================

/**
 * Respuesta de GET /api/metricas/casos para un periodo.
 *
 * Un reporte es todo aviso registrado; un caso es un reporte cuya revision fue
 * APROBADA (HU-19). Por eso los reportes se agrupan por estado de revision y los
 * casos por estado de atencion. Se cuentan los creados en el periodo con su estado
 * de hoy.
 */
export interface MetricasCasos {
  desde: string;
  hasta: string;
  reportes: IndicadoresReportes;
  casos: IndicadoresCasos;
}

export interface IndicadoresReportes {
  total: number;
  /** PENDIENTE_REVISION, APROBADO, RECHAZADO. */
  porEstado: Conteo[];
  /** PERDIDA, ENCONTRADA, ABANDONADA (y otros codigos historicos, si los hay). */
  porCategoria: Conteo[];
}

export interface IndicadoresCasos {
  total: number;
  /** PENDIENTE, EN_PROCESO, RESUELTO, CANCELADO. */
  porEstado: Conteo[];
  porCategoria: Conteo[];
  /** CENTRO, NORTE, SUR, ESTE, OESTE, AFUERAS y SIN_UBICACION si hay casos sin coordenadas. */
  porZona: Conteo[];
}

/** Una fila de una tabla agrupada; los valores conocidos llegan aunque esten en cero. */
export interface Conteo {
  clave: string;
  cantidad: number;
}
