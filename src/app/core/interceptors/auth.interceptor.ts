import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.sesionExpirada() && !esPeticionPublica(peticion)) {
    auth.logout();
    void router.navigate(['/login']);
    return EMPTY;
  }

  const token = auth.obtenerToken();
  const conToken = token
    ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : peticion;

  return siguiente(conToken).pipe(
    catchError((error: HttpErrorResponse) => {
      // 1. MANEJO DE ERRORES DE AUTENTICACIÓN (401)
      if (error.status === 401 && !esPeticionPublica(peticion)) {
        auth.logout();
        void router.navigate(['/login']);
      }

      // 2. CENTRALIZACIÓN Y FORMATEO DE ERRORES (Para todos los demás estados)
      const errorFormateado = formatearError(error);
      
      // Aquí podrías llamar a un Servicio de Notificaciones (Toast/Snackbar) 
      // para mostrar 'errorFormateado.message' en pantalla de forma global.
      console.warn(`[Error HTTP ${error.status}]:`, errorFormateado.message);

      return throwError(() => errorFormateado);
    })
  );
};

/**
 * Transforma el ApiError del backend a un formato amigable para el usuario
 */
function formatearError(error: HttpErrorResponse): { status: number; message: string; erroresCampos?: any } {
  // Si el error viene del backend con nuestro formato ApiError
  if (error.error && typeof error.error.message === 'string') {
    return {
      status: error.status,
      message: error.error.message,
      erroresCampos: error.error.errors
    };
  }

  // Si el error es de red (el backend está apagado)
  if (error.status === 0) {
    return { status: 0, message: 'No se pudo conectar con el servidor. Revisa tu conexión.' };
  }

  // Mapeo de respaldo por si el backend no devuelve el ApiError
  switch (error.status) {
    case 400: return { status: 400, message: 'Los datos enviados no son válidos.' };
    case 403: return { status: 403, message: 'No tienes permisos para realizar esta acción.' };
    case 404: return { status: 404, message: 'El recurso solicitado no existe.' };
    case 409: return { status: 409, message: 'Hubo un conflicto con los datos actuales.' };
    case 500: return { status: 500, message: 'Error interno del servidor. Inténtalo más tarde.' };
    default: return { status: error.status, message: 'Ocurrió un error inesperado.' };
  }
}

function esPeticionPublica(peticion: HttpRequest<unknown>): boolean {
  const ruta = sinQuery(peticion.url);
  if (ruta === '/api/login') {
    return true;
  }
  return peticion.method === 'POST' && ruta === '/api/usuarios';
}

function sinQuery(url: string): string {
  const corte = url.indexOf('?');
  return corte === -1 ? url : url.slice(0, corte);
}