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
}