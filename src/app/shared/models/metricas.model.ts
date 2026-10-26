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
