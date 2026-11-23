export type TipoMensaje = 'TEXTO' | 'IMAGEN' | 'ARCHIVO';

/** HU-27: conversacion entre el usuario y otro usuario (o una organizacion). */
export interface Conversacion {
  idConversacion: number;
  idOtroUsuario: number;
  nombre: string;
  esOrganizacion: boolean;
  ultimoMensaje: string;
  fechaUltimoMensaje: string | null;
}

/** HU-27: mensaje de una conversacion. */
export interface Mensaje {
  idMensaje: number;
  idConversacion: number;
  idEmisor: number;
  tipo: TipoMensaje;
  contenido: string;
  urlAdjunto: string | null;
  nombreAdjunto: string | null;
  fechaEnvio: string;
  eliminado: boolean;
}

/** Destinatario con el que se abre (o recupera) una conversacion. */
export interface DestinatarioConversacion {
  idUsuario?: number;
  idOrganizacion?: number;
}

/** Regla del backend: no se aceptan mensajes mas largos (Mensaje.MAX_CARACTERES). */
export const MAX_CARACTERES_MENSAJE = 2000;

/** TT-49: datos minimos de un usuario para iniciar una conversacion. */
export interface DirectorioUsuario {
  idUsuario: number;
  nombre: string;
  rol: string;
}
