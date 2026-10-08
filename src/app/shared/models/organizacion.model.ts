export type TipoOrganizacion = 'REFUGIO' | 'VETERINARIA' | 'RESCATISTA_INDEPENDIENTE';

export type EstadoVerificacion = 'PENDIENTE_VERIFICACION' | 'VERIFICADA' | 'RECHAZADA';

export interface Organizacion {
  idOrganizacion: number;
  idRepresentante: number;
  nombre: string;
  tipo: TipoOrganizacion;
  direccion: string;
  telefono: string;
  email: string;
  descripcion: string | null;
  horarios: string | null;
  zonasCobertura: string | null;
  logoUrl: string | null;
  estadoVerificacion: EstadoVerificacion;
  fechaRegistro: string;
  /** Regla del backend: solo una organización verificada puede gestionar casos. */
  puedeGestionarCasos: boolean;
}

/** Respuesta de POST /api/organizaciones. */
export interface OrganizacionRegistrada {
  organizacion: Organizacion;
  /** false si el registro quedó guardado pero el correo de confirmación no salió. */
  confirmacionEnviada: boolean;
}

export interface FormularioOrganizacion {
  nombre: string;
  tipo: TipoOrganizacion | '';
  direccion: string;
  telefono: string;
  email: string;
  descripcion: string;
  horarios: string;
  zonasCobertura: string;
}
