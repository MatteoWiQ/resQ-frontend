import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { vi } from 'vitest';

import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor (HU-23)', () => {
  let httpMock: HttpTestingController;
  let router: Router;
  let http: HttpClient;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    localStorage.clear();
  });

  function guardarSesion(token: string | null, rol: string): void {
    if (token) {
      localStorage.setItem('resq_token', token);
    }
    localStorage.setItem(
      'resq_usuario_actual',
      JSON.stringify({ idUsuario: 7, email: 'a@b.com', rol })
    );
  }

  it('agrega el header Authorization cuando hay token', () => {
    guardarSesion('token-abc', 'ADMIN');

    http.get('/api/usuarios').subscribe();

    const peticion = httpMock.expectOne('/api/usuarios');
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-abc');
    peticion.flush([]);
  });

  it('no agrega el header cuando no hay token', () => {
    http.get('/api/usuarios').subscribe();

    const peticion = httpMock.expectOne('/api/usuarios');
    expect(peticion.request.headers.has('Authorization')).toBe(false);
    peticion.flush([]);
  });

  it('cierra la sesion y manda a login cuando el backend responde 401', () => {
    guardarSesion('token-vencido', 'ADMIN');
    const auth = TestBed.inject(AuthService);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http.get('/api/usuarios').subscribe({ error: () => undefined });

    httpMock
      .expectOne('/api/usuarios')
      .flush({ message: 'x' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.usuarioActual()).toBeNull();
    expect(localStorage.getItem('resq_token')).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });

  it('no cierra la sesion cuando el 401 viene del propio login', () => {
    guardarSesion('token-abc', 'ADMIN');
    const auth = TestBed.inject(AuthService);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http
      .post('/api/login', { email: 'a@b.com', password: 'x' })
      .subscribe({ error: () => undefined });

    httpMock
      .expectOne('/api/login')
      .flush({ message: 'credenciales invalidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.usuarioActual()).not.toBeNull();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('deja la sesion intacta ante un 403', () => {
    guardarSesion('token-abc', 'USUARIO');
    const auth = TestBed.inject(AuthService);

    http.get('/api/usuarios').subscribe({ error: () => undefined });

    httpMock
      .expectOne('/api/usuarios')
      .flush({ message: 'x' }, { status: 403, statusText: 'Forbidden' });

    expect(auth.usuarioActual()).not.toBeNull();
  });
});
