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
  // HU-19/HU-22: voluntario que reviso el reporte (participa del chat del caso).
  idRevisor?: number | null;
  // HU-21: la organización que tomó el caso, o null mientras nadie lo ha aceptado.
  // Lo controla el backend (ver PATCH /api/reportes/{id}/aceptar); nunca se manda al crear o editar.
  idOrganizacion?: number | null;
  // Contacto de quien reporta: el backend solo publica si hay contacto; los
  // telefonos se piden con sesion en GET /api/reportes/{id}/contacto.
  tieneContacto?: boolean;
  // Rediseño: datos opcionales del lugar y del animal.
  referencia?: string | null;
  especie?: Especie | null;
  edad?: EdadAnimal | null;
  tamano?: TamanoAnimal | null;
}

export const ESPECIES = ['PERRO', 'GATO', 'OTRO'] as const;
export const EDADES = ['CACHORRO', 'ADULTO', 'MAYOR'] as const;
export const TAMANOS = ['PEQUENO', 'MEDIANO', 'GRANDE'] as const;
export type Especie = (typeof ESPECIES)[number];
export type EdadAnimal = (typeof EDADES)[number];
export type TamanoAnimal = (typeof TAMANOS)[number];

/** Rediseño: lo que necesita un caso y quien lo cubre. */
export const TIPOS_NECESIDAD = ['TRANSPORTE', 'VETERINARIO', 'HOGAR_TEMPORAL', 'ALIMENTO', 'RESCATE'] as const;
export type TipoNecesidad = (typeof TIPOS_NECESIDAD)[number];
export type EstadoNecesidad = 'BUSCADA' | 'OFRECIDA' | 'CUBIERTA';

export interface NecesidadCaso {
  idNecesidad: number;
  tipo: TipoNecesidad;
  estado: EstadoNecesidad;
  idAyudante: number | null;
  /** Solo el primer nombre de quien ayuda. */
  nombreAyudante: string | null;
}

/** Rediseño: una novedad publica del caso (seguimiento de la organizacion). */
export interface NovedadCaso {
  fechaCreacion: string;
  nota: string | null;
  fotoUrl: string | null;
}

/** Contacto de quien reporto un caso (solo con sesion y si lo compartio). */
export interface ContactoReporte {
  nombre: string | null;
  /** VOLUNTARIO u ORGANIZACION verificada; null para una cuenta comun. */
  insignia: 'VOLUNTARIO' | 'ORGANIZACION' | null;
  telefonos: { numero: string; origen: 'CUENTA' | 'CASO' }[];
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