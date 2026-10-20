import { Notificacion } from './notificacion.model';

export type TipoEventoWebSocket =
  | 'notification.new'
  | 'chat.message'
  | 'chat.typing'
  | 'user.online';

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

/** Mapa tipo de evento -> payload, para que el bus quede tipado de punta a punta. */
export interface DatosPorTipoEvento {
  'notification.new': Notificacion;
  'chat.message': DatosChatMensaje;
  'chat.typing': DatosChatEscribiendo;
  'user.online': DatosUsuarioEnLinea;
}
