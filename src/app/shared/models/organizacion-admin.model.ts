import { EstadoVerificacion, TipoOrganizacion } from './organizacion.model';

/**
 * HU-25: una organización tal como la ve el administrador (GET /api/admin/organizaciones).
 * Suma a los datos de la organización su representante y su última revisión.
 */
export interface OrganizacionAdmin {
  idOrganizacion: number;
  nombre: string;
  tipo: TipoOrganizacion | string;
  direccion: string;
  telefono: string;
  email: string;
  descripcion: string | null;
  horarios: string | null;
  zonasCobertura: string | null;
  logoUrl: string | null;
  estadoVerificacion: EstadoVerificacion;
  fechaRegistro: string;
  idRepresentante: number;
  nombreRepresentante: string | null;
  emailRepresentante: string | null;
  /** Null mientras ningún administrador la revisó. */
  idRevisor: number | null;
  nombreRevisor: string | null;
  fechaRevision: string | null;
}

/** Filtro del listado: un estado de verificación o todas. */
export type FiltroEstadoOrganizacion = EstadoVerificacion | 'TODAS';
