export type EstadoReporte = 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'CANCELADO';

/** HU-19: resultado de la revisión del caso por un voluntario. */
export type EstadoRevision = 'PENDIENTE_REVISION' | 'APROBADO' | 'RECHAZADO';

export interface Reporte {
  idReporte: number;
  idUsuario: number;
  tipoCaso: string;
  descripcion: string;
  estado: EstadoReporte;
  fotoUrl: string | null;
  fechaCreacion: string;
  latitud?: number | null;
  longitud?: number | null;
  // HU-19: los llena el backend al revisar la solicitud; null en reportes anteriores
  estadoRevision?: EstadoRevision | null;
  notaRevision?: string | null;
  fechaRevision?: string | null;
  // HU-21: la organización que tomó el caso, o null mientras nadie lo ha aceptado.
  // Lo controla el backend (ver PATCH /api/reportes/{id}/aceptar); nunca se manda al crear o editar.
  idOrganizacion?: number | null;
}

/** HU-21: una entrada del historial de seguimiento (nota + foto opcional) de un caso. */
export interface SeguimientoCaso {
  idSeguimiento: number;
  idReporte: number;
  idOrganizacion: number;
  nota: string | null;
  fotoUrl: string | null;
  fechaCreacion: string;
}