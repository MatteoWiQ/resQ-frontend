export type TipoNotificacion =
  | 'SOLICITUD_APROBADA'
  | 'SOLICITUD_RECHAZADA'
  | 'SOLICITUD_VOLUNTARIO'
  | 'SISTEMA';

export interface Notificacion {
  idNotificacion: number;
  idUsuario: number;
  idReporte: number | null;
  /** HU-37: solicitud de voluntario que origino el aviso, si aplica. */
  idSolicitud?: number | null;
  tipo: TipoNotificacion;
  mensaje: string;
  leida: boolean;
  /** HU-37: las archivadas no se muestran en la bandeja. */
  archivada?: boolean;
  fechaCreacion: string;
}
