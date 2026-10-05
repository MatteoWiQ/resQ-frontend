/**
 * HU-23: unico lugar donde vive la lista de roles y las comparaciones por rol.
 *
 * Antes cada componente comparaba el rol con su propia cadena ("ADMIN",
 * "ADMINISTRADOR", "VOLUNTARIO"), y por eso el enlace al panel administrativo
 * no le aparecia a los administradores reales.
 */
export const ROLES_VALIDOS = ['USUARIO', 'VOLUNTARIO', 'ADMIN'] as const;

export type RolCanonico = (typeof ROLES_VALIDOS)[number];

export const ROL_ADMIN: RolCanonico = 'ADMIN';
export const ROL_USUARIO: RolCanonico = 'USUARIO';
export const ROL_VOLUNTARIO: RolCanonico = 'VOLUNTARIO';

/** Normaliza el rol que llega del backend o de una sesión guardada. */
export function normalizarRol(rol: string | null | undefined): string | null {
  const limpio = rol?.trim();
  return limpio ? limpio.toUpperCase() : null;
}

export function esAdmin(rol: string | null | undefined): boolean {
  return normalizarRol(rol) === ROL_ADMIN;
}

export function esVoluntario(rol: string | null | undefined): boolean {
  return normalizarRol(rol) === ROL_VOLUNTARIO;
}
