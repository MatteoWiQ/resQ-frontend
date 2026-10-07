import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { esGestorDeReportes } from '../../shared/constants/roles';

/**
 * HU-19: /voluntario/solicitudes solo se abre para cuentas con rol VOLUNTARIO o
 * ADMIN. Usa el predicado compartido del perfil (puedeRevisar) y de la pantalla de
 * solicitudes (esRevisor), para que la regla este escrita en un solo sitio.
 *
 * El backend igual rechaza esas peticiones (esta no es una barrera de seguridad,
 * solo evita mostrar una pantalla que va a fallar), asi que los dos lados se
 * mantienen cerrados.
 */
export const revisorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const usuario = auth.usuarioActual();

  if (!usuario) {
    return router.createUrlTree(['/login']);
  }

  return esGestorDeReportes(usuario.rol) ? true : router.createUrlTree(['/perfil']);
};