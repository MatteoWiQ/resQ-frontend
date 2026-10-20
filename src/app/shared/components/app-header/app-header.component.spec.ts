import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AppHeaderComponent } from './app-header.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { WebSocketService } from '../../../core/services/websocket.service';

describe('AppHeaderComponent (HU-logout)', () => {
  let listarNotificaciones: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.clear();
    listarNotificaciones = vi.fn().mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        provideRouter([]),
        {
          provide: NotificacionService,
          useValue: { obtenerDeUsuario: listarNotificaciones, marcarComoLeida: () => of({}) },
        },
        {
          provide: WebSocketService,
          useValue: { enEvento: () => of() },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  function crearConSesion(rol = 'USUARIO'): void {
    localStorage.setItem('resq_token', 'token-x');
    localStorage.setItem(
      'resq_usuario_actual',
      JSON.stringify({ idUsuario: 5, email: 'a@b.com', rol }),
    );
  }

  it('sin sesion muestra "Reportar" que lleva a login y no muestra cerrar sesion', () => {
    const fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const reportar = compiled.querySelector('.primary-btn');
    expect(reportar?.textContent).toContain('Reportar');
    expect(reportar?.getAttribute('routerLink')).toBe('/login');
    expect(compiled.querySelector('.logout-btn')).toBeNull();
  });

  it('con sesion muestra "Cerrar sesion" en lugar de "Reportar"', () => {
    crearConSesion();
    const fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logout-btn')?.textContent).toContain('Cerrar sesión');
    expect(compiled.querySelector('.primary-btn')).toBeNull();
  });

  it('al hacer click en cerrar sesion limpia la sesion y navega a la raiz', () => {
    crearConSesion();
    const auth = TestBed.inject(AuthService);
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.logout-btn')?.click();

    expect(auth.usuarioActual()).toBeNull();
    expect(localStorage.getItem('resq_token')).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/']);
  });

  it('muestra el contador de notificaciones sin leer', () => {
    crearConSesion();
    listarNotificaciones.mockReturnValue(
      of([
        { idNotificacion: 1, leida: false },
        { idNotificacion: 2, leida: true },
        { idNotificacion: 3, leida: false },
      ]),
    );
    const fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.notif-badge')?.textContent).toBe('2');
  });

  it('un admin ve el acceso al panel administrativo', () => {
    crearConSesion('ADMIN');
    const fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.secondary-btn')?.textContent).toContain(
      'Panel administrativo',
    );
  });

  it('en variante landing muestra los enlaces de ancla; en app no', () => {
    const landing = TestBed.createComponent(AppHeaderComponent);
    landing.componentRef.setInput('variante', 'landing');
    landing.detectChanges();
    expect((landing.nativeElement as HTMLElement).querySelector('a[href="#inicio"]')).not.toBeNull();

    const app = TestBed.createComponent(AppHeaderComponent);
    app.detectChanges();
    expect((app.nativeElement as HTMLElement).querySelector('a[href="#inicio"]')).toBeNull();
  });
});
