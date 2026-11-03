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
  /** HU-32: si adjuntó documento de verificación (se descarga con AdminOrganizacionService.documento). */
  tieneDocumento: boolean;
  estadoVerificacion: EstadoVerificacion;
  fechaRegistro: string;
  idRepresentante: number;
  nombreRepresentante: string | null;
  emailRepresentante: string | null;
  /** Null mientras ningún administrador la revisó. */
  idRevisor: number | null;
  nombreRevisor: string | null;
  fechaRevision: string | null;
  /** HU-32: nota de la última revisión; al rechazar es el motivo. */
  notaRevision: string | null;
}

/** Filtro del listado: un estado de verificación o todas. */
export type FiltroEstadoOrganizacion = EstadoVerificacion | 'TODAS';

/** HU-32: una entrada del historial de verificación. */
export type AccionRevision = 'APROBADA' | 'RECHAZADA' | 'REENVIADA';

export interface RevisionOrganizacion {
  idRevision: number;
  accion: AccionRevision | string;
  nota: string | null;
  /** El administrador que decidió o, en un reenvío, el representante. */
  idUsuario: number;
  nombreUsuario: string | null;
  fecha: string;
}
