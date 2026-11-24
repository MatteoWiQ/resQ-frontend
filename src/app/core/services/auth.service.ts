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
  private sesionExpiradaAlIniciar = false;

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
    const token = localStorage.getItem(CLAVE_TOKEN);
    if (token && this.tokenExpirado(token)) {
      this.sesionExpiradaAlIniciar = true;
      this.logout();
      return null;
    }
    return token;
  }

  /** Permite evitar peticiones protegidas cuando la sesion local ya vencio. */
  sesionExpirada(): boolean {
    if (this.sesionExpiradaAlIniciar) {
      return true;
    }
    const token = localStorage.getItem(CLAVE_TOKEN);
    if (token !== null && this.tokenExpirado(token)) {
      this.sesionExpiradaAlIniciar = true;
      return true;
    }
    return false;
  }

  esAdmin(): boolean {
    return esAdmin(this.usuarioActual()?.rol);
  }

  private guardarUsuario(respuesta: LoginResponse): void {
    this.sesionExpiradaAlIniciar = false;
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
      if (this.tokenExpirado(token)) {
        this.sesionExpiradaAlIniciar = true;
        localStorage.removeItem(CLAVE_STORAGE);
        localStorage.removeItem(CLAVE_TOKEN);
        return null;
      }
      return { ...usuario, rol: normalizarRol(usuario.rol) ?? usuario.rol };
    } catch {
      return null;
    }
  }

  private tokenExpirado(token: string): boolean {
    try {
      const partePayload = token.split('.')[1];
      if (!partePayload) {
        return false;
      }
      const base64 = partePayload.replace(/-/g, '+').replace(/_/g, '/');
      const base64ConPadding = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const payload = JSON.parse(atob(base64ConPadding)) as { exp?: unknown };
      return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
    } catch {
      return false;
    }
  }
}
