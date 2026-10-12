import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { revisorGuard } from './revisor.guard';

describe('revisorGuard (HU-19)', () => {
  function configurar(usuario: { idUsuario: number; email: string; rol: string } | null) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { usuarioActual: () => usuario } }],
    });
  }

  function ejecutar() {
    const ruta = {} as ActivatedRouteSnapshot;
    const estado = { url: '/' } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => revisorGuard(ruta, estado));
  }

  it('permite el paso a un voluntario', () => {
    configurar({ idUsuario: 1, email: 'vol@resq.com', rol: 'VOLUNTARIO' });

    expect(ejecutar()).toBe(true);
  });

  it('permite el paso a un administrador', () => {
    configurar({ idUsuario: 2, email: 'admin@resq.com', rol: 'ADMIN' });

    expect(ejecutar()).toBe(true);
  });

  it('reconoce el rol voluntario en minusculas', () => {
    configurar({ idUsuario: 1, email: 'vol@resq.com', rol: 'voluntario' });

    expect(ejecutar()).toBe(true);
  });

  it('manda a perfil a un ciudadano autenticado', () => {
    configurar({ idUsuario: 3, email: 'u@resq.com', rol: 'USUARIO' });

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