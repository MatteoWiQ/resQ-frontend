/** HU-22: mensaje del chat de un caso, tal como lo devuelve el backend y lo difunde chat.message. */
export type TipoMensajeCaso = 'TEXTO' | 'UBICACION' | 'FOTO';

export interface MensajeCaso {
  idMensaje: number;
  idCaso: number;
  idEmisor: number;
  nombreEmisor: string | null;
  tipo: TipoMensajeCaso;
  contenido: string | null;
  latitud: number | null;
  longitud: number | null;
  fotoUrl: string | null;
  fechaEnvio: string;
}

export type RolParticipante = 'REPORTANTE' | 'ORGANIZACION' | 'VOLUNTARIO';

/** Participante del caso con su presencia, para el indicador "en linea / ultima vez". */
export interface ParticipanteChat {
  idUsuario: number;
  nombre: string | null;
  rol: RolParticipante;
  enLinea: boolean;
  ultimaVez: string | null;
}
