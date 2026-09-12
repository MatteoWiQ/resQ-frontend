import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { LoginRequest, LoginResponse } from '../../shared/models/auth.models';
import { UsuarioActual } from '../../shared/models/usuario.model';

const CLAVE_STORAGE = 'resq_usuario_actual';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly loginEndpoint = '/api/login';
  private readonly registerEndpoint = '/api/usuarios';

  // Señal reactiva con el usuario logueado (null si no hay sesión activa).
  // Cualquier componente puede leerla con authService.usuarioActual()
  readonly usuarioActual = signal<UsuarioActual | null>(this.recuperarUsuarioGuardado());

  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.loginEndpoint, credentials).pipe(
      tap((respuesta) => this.guardarUsuario(respuesta))
    );
  }

  register(usuario: {
    nombre: string;
    email: string;
    password: string;
    telefono: string;
    rol: string;
  }): Observable<any> {
    return this.http.post(this.registerEndpoint, usuario);
  }

  logout(): void {
    localStorage.removeItem(CLAVE_STORAGE);
    this.usuarioActual.set(null);
  }

  /** Devuelve el idUsuario de la sesión activa, o null si no hay sesión. */
  obtenerIdUsuarioActual(): number | null {
    return this.usuarioActual()?.idUsuario ?? null;
  }

  private guardarUsuario(respuesta: LoginResponse): void {
    const usuario: UsuarioActual = {
      idUsuario: respuesta.idUsuario,
      email: respuesta.email,
      rol: respuesta.rol,
    };
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(usuario));
    this.usuarioActual.set(usuario);
  }

  private recuperarUsuarioGuardado(): UsuarioActual | null {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    return guardado ? (JSON.parse(guardado) as UsuarioActual) : null;
  }
}