import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { LoginRequest, LoginResponse } from '../../shared/models/auth.models';
import { UsuarioActual } from '../../shared/models/usuario.model';
import { esAdmin, normalizarRol } from '../../shared/constants/roles';

const CLAVE_STORAGE = 'resq_usuario_actual';
const CLAVE_TOKEN = 'resq_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly loginEndpoint = '/api/login';
  private readonly registerEndpoint = '/api/usuarios';

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
    localStorage.removeItem(CLAVE_TOKEN);
    this.usuarioActual.set(null);
  }

  obtenerIdUsuarioActual(): number | null {
    return this.usuarioActual()?.idUsuario ?? null;
  }

  /** HU-23: token que el interceptor envia en Authorization: Bearer. */
  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  esAdmin(): boolean {
    return esAdmin(this.usuarioActual()?.rol);
  }

  private guardarUsuario(respuesta: LoginResponse): void {
    const usuario: UsuarioActual = {
      idUsuario: respuesta.idUsuario,
      email: respuesta.email,
      rol: normalizarRol(respuesta.rol) ?? respuesta.rol,
    };

    if (respuesta.token) {
      localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    }

    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(usuario));
    this.usuarioActual.set(usuario);
  }

  /**
   * Sin token la sesion guardada no sirve: el backend ya no acepta las peticiones
   * de ese usuario. Se descarta para que la interfaz pida iniciar sesion en vez de
   * mostrar datos que van a fallar al cargarlos.
   */
  private recuperarUsuarioGuardado(): UsuarioActual | null {
    const token = localStorage.getItem(CLAVE_TOKEN);
    const guardado = localStorage.getItem(CLAVE_STORAGE);

    if (!token || !guardado) {
      return null;
    }

    try {
      const usuario = JSON.parse(guardado) as UsuarioActual;
      return { ...usuario, rol: normalizarRol(usuario.rol) ?? usuario.rol };
    } catch {
      return null;
    }
  }
}
