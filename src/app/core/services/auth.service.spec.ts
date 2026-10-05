import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { authInterceptor } from '../interceptors/auth.interceptor';

describe('AuthService: sesion y token (HU-23)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
    httpMock.verify();
  });

  function login(rol: string, token = 'jwt-de-prueba') {
    let respuesta: unknown;
    service
      .login({ email: 'a@b.com', password: 'x' })
      .subscribe((r) => (respuesta = r));

    httpMock
      .expectOne('/api/login')
      .flush({ idUsuario: 5, email: 'a@b.com', rol, token });

    return respuesta;
  }

  it('guarda el token al iniciar sesion', () => {
    login('ADMIN');

    expect(service.obtenerToken()).toBe('jwt-de-prueba');
  });

  it('normaliza el rol que devuelve el backend', () => {
    login('admin');

    expect(service.usuarioActual()?.rol).toBe('ADMIN');
    expect(service.esAdmin()).toBe(true);
  });

  it('borra el token al cerrar sesion', () => {
    login('ADMIN');

    service.logout();

    expect(service.obtenerToken()).toBeNull();
    expect(service.usuarioActual()).toBeNull();
    expect(localStorage.getItem('resq_usuario_actual')).toBeNull();
  });

  it('no restaura una sesion guardada si falta el token', () => {
    localStorage.setItem(
      'resq_usuario_actual',
      JSON.stringify({ idUsuario: 5, email: 'a@b.com', rol: 'ADMIN' })
    );

    const nuevo = new AuthService({} as never);

    expect(nuevo.usuarioActual()).toBeNull();
  });

  it('restaura una sesion guardada cuando hay token', () => {
    localStorage.setItem('resq_token', 'token-guardado');
    localStorage.setItem(
      'resq_usuario_actual',
      JSON.stringify({ idUsuario: 5, email: 'a@b.com', rol: 'admin' })
    );

    const nuevo = new AuthService({} as never);

    expect(nuevo.usuarioActual()).toEqual({ idUsuario: 5, email: 'a@b.com', rol: 'ADMIN' });
    expect(nuevo.esAdmin()).toBe(true);
  });
});
