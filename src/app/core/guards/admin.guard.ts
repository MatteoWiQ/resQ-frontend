import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { esAdmin } from '../../shared/constants/roles';

/**
 * HU-23: el panel administrativo solo se abre para cuentas con rol ADMIN.
 *
 * El backend igual rechaza esas peticiones (esta no es una barrera de seguridad,
 * solo evita mostrar una pantalla que va a fallar), asi que los dos lados se
 * mantienen cerrados.
 */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const usuario = auth.usuarioActual();

  if (!usuario) {
    return router.createUrlTree(['/login']);
  }

  return esAdmin(usuario.rol) ? true : router.createUrlTree(['/perfil']);
};
