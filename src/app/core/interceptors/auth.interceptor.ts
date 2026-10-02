import { HttpInterceptorFn } from '@angular/common/http';
import { HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * HU-23: agrega el token JWT a cada peticion y limpia la sesion cuando el backend
 * responde 401, para que la interfaz no se quede creyendo que hay sesion abierta.
 */
export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.obtenerToken();
  const conToken = token
    ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : peticion;

  return siguiente(conToken).pipe(
    catchError((error) => {
      if (error?.status === 401 && !esPeticionPublica(peticion)) {
        auth.logout();
        void router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Un 401 en el login significa "credenciales invalidas", y en el alta publica de
 * cuentas el backend no exige sesion: en ninguno de los dos casos hay que cerrar
 * la sesion ni redirigir. Ojo: no alcanza con mirar la URL, porque /api/usuarios
 * tambien se usa autenticado (listar, editar, eliminar).
 */
function esPeticionPublica(peticion: HttpRequest<unknown>): boolean {
  if (peticion.url === '/api/login') {
    return true;
  }
  return peticion.method === 'POST' && peticion.url === '/api/usuarios';
}
