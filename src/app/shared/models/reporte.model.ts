export type EstadoReporte = 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'CANCELADO';

export interface Reporte {
  idReporte: number;
  idUsuario: number;
  tipoCaso: string;
  descripcion: string;
  estado: EstadoReporte;
  fotoUrl: string | null;
  fechaCreacion: string;
}