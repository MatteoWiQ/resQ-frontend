import { Notificacion } from './notificacion.model';

export type TipoEventoWebSocket =
  | 'notification.new'
  | 'chat.message'
  | 'chat.typing'
  | 'user.online'
  | 'mensaje.nuevo'
  | 'mensaje.eliminado';

/**
 * HU-38b: sobre comun que manda el servidor por STOMP. `id` es la secuencia de
 * replay del usuario y solo viene en los eventos personales (sala del usuario).
 */
export interface EventoWebSocket<T = unknown> {
  id?: number | null;
  tipo: TipoEventoWebSocket;
  emitidoEn: string;
  datos: T;
}

export interface DatosChatEscribiendo {
  idCaso: number;
  idUsuario: number;
}

export interface DatosChatMensaje {
  idCaso: number;
  idMensaje: number;
  idEmisor: number;
  contenido: string;
}

export interface DatosUsuarioEnLinea {
  idUsuario: number;
  enLinea: boolean;
}

/** HU-27: payload de un mensaje nuevo en una conversacion entre usuarios. */
export interface DatosMensajeNuevo {
  idConversacion: number;
  idMensaje: number;
  idEmisor: number;
  tipo: string;
  contenido: string;
  urlAdjunto: string | null;
  nombreAdjunto: string | null;
  fechaEnvio: string;
}

/** HU-27: el emisor elimino un mensaje de la conversacion. */
export interface DatosMensajeEliminado {
  idConversacion: number;
  idMensaje: number;
}

/** Mapa tipo de evento -> payload, para que el bus quede tipado de punta a punta. */
export interface DatosPorTipoEvento {
  'notification.new': Notificacion;
  'chat.message': DatosChatMensaje;
  'chat.typing': DatosChatEscribiendo;
  'user.online': DatosUsuarioEnLinea;
  'mensaje.nuevo': DatosMensajeNuevo;
  'mensaje.eliminado': DatosMensajeEliminado;
}
