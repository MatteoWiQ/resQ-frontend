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

/**
 * Roles con permiso para intervenir un caso: cambiar su estado (HU-13), marcarlo
 * como resuelto o aprobarlo/rechazarlo como revision (HU-19).
 *
 * Es el unico lugar donde se responde eso, para que el perfil, la pantalla de
 * solicitudes y el guard de la ruta no puedan divergir entre si. Si mas adelante
 * el negocio separa las dos capacidades (por ejemplo, que un administrador pueda
 * gestionar el estado pero no aprobar una revision), aqui se parte en dos
 * predicados y no en los componentes.
 */
export function esGestorDeReportes(rol: string | null | undefined): boolean {
  return esAdmin(rol) || esVoluntario(rol);
}
