import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('permite entrar al chat con sesion', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { usuarioActual: () => ({ idUsuario: 7 }) } }],
    });

    const resultado = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/chat/12' } as RouterStateSnapshot),
    );

    expect(resultado).toBe(true);
  });

  it('redirige al login y conserva la ruta solicitada sin sesion', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { usuarioActual: () => null } }],
    });
    const router = TestBed.inject(Router);

    const resultado = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/chat/12' } as RouterStateSnapshot),
    );

    expect(resultado).toEqual(router.parseUrl('/login?returnUrl=%2Fchat%2F12'));
  });
});
