import { signal } from '@angular/core';
import { of } from 'rxjs';

import { UsuarioActual } from '../models/usuario.model';

/**
 * Dobles de prueba compartidos.
 *
 * Al montar la cabecera (AppHeaderComponent) dentro del perfil y del panel, esos
 * componentes pasaron a depender de mas metodos de AuthService y de WebSocketService
 * que los dobles locales no tenian. En vez de repetir la lista en cada spec, vive
 * aca una sola vez y se mantiene al dia.
 */

/** Sesion opcional: null deja la app como si no hubiera login. */
export function sesionActual(sesion: { idUsuario: number; email: string; rol: string } | null) {
  return {
    idUsuario: sesion?.idUsuario ?? null,
    email: sesion?.email ?? '',
    rol: sesion?.rol ?? '',
  };
}

export function authServiceDoble(sesion: UsuarioActual | null = null) {
  const usuarioActual = signal<UsuarioActual | null>(sesion);
  return {
    usuarioActual,
    obtenerIdUsuarioActual: () => sesion?.idUsuario ?? null,
    obtenerToken: () => (sesion ? 'token-de-prueba' : null),
    esAdmin: () => (sesion?.rol ?? '').toUpperCase() === 'ADMIN',
    logout: () => usuarioActual.set(null),
  };
}

/** WebSocketService sin conexion real: el bus nunca emite. */
export function webSocketServiceDoble() {
  return {
    conectado: signal(false),
    enEvento: () => of(),
    suscribirCaso: () => () => undefined,
    avisarEscribiendo: () => false,
    enviar: () => false,
    conectar: () => undefined,
    desconectar: () => undefined,
  };
}
