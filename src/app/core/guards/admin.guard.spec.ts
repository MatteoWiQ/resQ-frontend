import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { adminGuard } from './admin.guard';

describe('adminGuard (HU-23)', () => {
  let authMock: { usuarioActual: () => { idUsuario: number; email: string; rol: string } | null };

  function configurar(usuario: { idUsuario: number; email: string; rol: string } | null) {
    authMock = { usuarioActual: () => usuario };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
    });
  }

  function ejecutar() {
    const ruta = {} as ActivatedRouteSnapshot;
    const estado = { url: '/' } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => adminGuard(ruta, estado));
  }

  it('permite el paso al administrador', () => {
    configurar({ idUsuario: 1, email: 'admin@resq.com', rol: 'ADMIN' });

    expect(ejecutar()).toBe(true);
  });

  it('reconoce el rol admin en minusculas', () => {
    configurar({ idUsuario: 1, email: 'admin@resq.com', rol: 'admin' });

    expect(ejecutar()).toBe(true);
  });

  it('manda a perfil a un usuario autenticado que no es admin', () => {
    configurar({ idUsuario: 2, email: 'u@resq.com', rol: 'USUARIO' });

    const resultado = ejecutar();
    expect(resultado).toBeInstanceOf(UrlTree);
    expect(String(resultado)).toBe('/perfil');
  });

  it('manda a login a quien no tiene sesion', () => {
    configurar(null);

    const resultado = ejecutar();
    expect(resultado).toBeInstanceOf(UrlTree);
    expect(String(resultado)).toBe('/login');
  });
});
