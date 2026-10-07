export type TipoNotificacion = 'SOLICITUD_APROBADA' | 'SOLICITUD_RECHAZADA';

export interface Notificacion {
  idNotificacion: number;
  idUsuario: number;
  idReporte: number | null;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  fechaCreacion: string;
}
