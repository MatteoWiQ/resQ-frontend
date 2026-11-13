import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AppHeaderComponent } from './app-header.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Notificacion } from '../../../shared/models/notificacion.model';
import { OrganizacionService } from '../../../core/services/organizacion.service';

describe('AppHeaderComponent (rediseño de la navegacion)', () => {
  let organizacion: { idOrganizacion: number } | null = null;
  let listaActual: Notificacion[] = [];
  let notificacionesSignal: ReturnType<typeof signal<Notificacion[]>>;

  beforeEach(async () => {
    localStorage.clear();
    listaActual = [];
    organizacion = null;
    notificacionesSignal = signal<Notificacion[]>([]);

    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        provideRouter([]),
        {
          provide: NotificacionService,
          useValue: {
            notificaciones: notificacionesSignal.asReadonly(),
            noLeidas: computed(
              () => notificacionesSignal().filter((n) => !n.leida && !n.archivada).length,
            ),
            cargar: (_id: number) => {
              notificacionesSignal.set(listaActual);
              return of(listaActual);
            },
            limpiar: () => notificacionesSignal.set([]),
            marcarComoLeida: () => of({}),
            marcarComoNoLeida: () => of({}),
            archivar: () => of({}),
            obtenerDeUsuario: () => of(listaActual),
          },
        },
        {
          provide: OrganizacionService,
          useValue: { obtenerDeRepresentante: vi.fn(() => of(organizacion)) },
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

  function montar() {
    const fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();
    return { fixture, dom: fixture.nativeElement as HTMLElement };
  }

  function abrirCuenta(fixture: ReturnType<typeof montar>['fixture'], dom: HTMLElement): void {
    dom.querySelector<HTMLButtonElement>('.avatar-btn')!.click();
    fixture.detectChanges();
  }

  it('muestra un solo menu con Casos, Organizaciones y Como ayudar, sin "Inicio" ni "Mapa"', () => {
    const { dom } = montar();

    expect(dom.querySelectorAll('nav').length).toBe(1);
    const enlaces = Array.from(dom.querySelectorAll('nav a')).map((a) => a.textContent?.trim());
    expect(enlaces).toEqual(['Casos', 'Organizaciones', 'Cómo ayudar', 'Iniciar sesión']);
    expect(dom.querySelector('nav a[href="/mapa"]')).not.toBeNull();
    expect(dom.querySelector('nav a[href="/#ayudar"]')).not.toBeNull();
  });

  it('el logo lleva al inicio', () => {
    const { dom } = montar();

    expect(dom.querySelector('a.marca')?.getAttribute('href')).toBe('/');
  });

  it('sin sesion "Reportar un caso" lleva a iniciar sesion y no hay iconos ni avatar', () => {
    const { dom } = montar();

    const reportar = dom.querySelector('.acciones .reportar-btn');
    expect(reportar?.textContent).toContain('Reportar un caso');
    expect(reportar?.getAttribute('href')).toBe('/login');
    expect(dom.querySelector('.avatar-btn')).toBeNull();
    expect(dom.querySelector('.icono-btn')).toBeNull();
  });

  it('con sesion "Reportar un caso" abre el formulario y se ven los iconos y el avatar', () => {
    crearConSesion();
    const { dom } = montar();

    expect(dom.querySelector('.acciones .reportar-btn')?.getAttribute('href')).toBe('/reportes/nuevo');
    expect(dom.querySelector('.icono-btn[href="/chat"]')).not.toBeNull();
    expect(dom.querySelector('.icono-btn[href="/notificaciones"]')).not.toBeNull();
    expect(dom.querySelector('.avatar')?.textContent).toBe('A');
    expect(dom.querySelector('nav a[href="/login"]')).toBeNull();
  });

  it('con sesion ya no repite "Mensajes", "Notificaciones" ni "Mi Perfil" como texto en el menu', () => {
    crearConSesion();
    const { dom } = montar();

    const textos = Array.from(dom.querySelectorAll('nav a')).map((a) => a.textContent?.trim());
    expect(textos).toEqual(['Casos', 'Organizaciones', 'Cómo ayudar']);
  });

  it('muestra el contador de notificaciones sin leer', () => {
    crearConSesion();
    listaActual = [
      { idNotificacion: 1, idUsuario: 5, idReporte: 1, tipo: 'SISTEMA', mensaje: 'x', leida: false, fechaCreacion: '' },
      { idNotificacion: 2, idUsuario: 5, idReporte: 1, tipo: 'SISTEMA', mensaje: 'y', leida: true, fechaCreacion: '' },
    ];
    const { dom } = montar();

    expect(dom.querySelector('.notif-badge')?.textContent?.trim()).toBe('1');
    expect(dom.querySelector('.icono-btn[href="/notificaciones"]')?.getAttribute('aria-label')).toBe(
      'Notificaciones, 1 sin leer',
    );
  });

  it('el menu de la cuenta tiene Mi perfil, Mis casos e idioma, y se cierra con Escape', () => {
    crearConSesion();
    const { fixture, dom } = montar();
    expect(dom.querySelector('.menu-cuenta')).toBeNull();

    abrirCuenta(fixture, dom);

    expect(dom.querySelector('.avatar-btn')?.getAttribute('aria-expanded')).toBe('true');
    expect(dom.querySelector('.menu-cuenta a[href="/perfil"]')?.textContent).toContain('Mi perfil');
    const misCasos = Array.from(dom.querySelectorAll('.menu-cuenta a')).find((a) => a.textContent?.includes('Mis casos'));
    expect(misCasos?.getAttribute('href')).toBe('/perfil');
    expect(dom.querySelector('.menu-cuenta a[href="/voluntario/solicitudes"]')).toBeNull();
    expect(dom.querySelector('.menu-cuenta-idioma')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(dom.querySelector('.menu-cuenta')).toBeNull();
  });

  it('si la cuenta representa una organizacion, "Mis casos" lleva a su panel', () => {
    crearConSesion();
    organizacion = { idOrganizacion: 3 };
    const { fixture, dom } = montar();

    abrirCuenta(fixture, dom);

    const misCasos = Array.from(dom.querySelectorAll('.menu-cuenta a')).find((a) => a.textContent?.includes('Mis casos'));
    expect(misCasos?.getAttribute('href')).toBe('/organizaciones/panel');
  });

  it('un voluntario ve sus solicitudes por revisar en el menu de la cuenta', () => {
    crearConSesion('VOLUNTARIO');
    const { fixture, dom } = montar();

    abrirCuenta(fixture, dom);

    expect(dom.querySelector('.menu-cuenta a[href="/voluntario/solicitudes"]')).not.toBeNull();
  });

  it('cambia el idioma desde el menu de la cuenta', () => {
    crearConSesion();
    const { fixture, dom } = montar();
    abrirCuenta(fixture, dom);

    const en = Array.from(dom.querySelectorAll<HTMLButtonElement>('.menu-cuenta-idioma button')).find(
      (b) => b.textContent === 'EN',
    )!;
    en.click();
    fixture.detectChanges();

    expect(dom.querySelector('nav a')?.textContent?.trim()).toBe('Cases');
    expect(dom.querySelector('.menu-cuenta')).not.toBeNull();
  });

  it('al cerrar sesion limpia la sesion y navega a la raiz', () => {
    crearConSesion();
    const { fixture, dom } = montar();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    abrirCuenta(fixture, dom);
    dom.querySelector<HTMLButtonElement>('.menu-cuenta-salir')!.click();
    fixture.detectChanges();

    expect(localStorage.getItem('resq_token')).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/']);
  });

  it('el boton ☰ abre y cierra los enlaces en pantallas pequenas', () => {
    const { fixture, dom } = montar();
    const toggle = dom.querySelector<HTMLButtonElement>('.menu-toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(dom.querySelector('.header-panel.abierto')).toBeNull();

    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(dom.querySelector('.header-panel.abierto')).not.toBeNull();

    toggle.click();
    fixture.detectChanges();
    expect(dom.querySelector('.header-panel.abierto')).toBeNull();
  });

  it('un admin ve el acceso al panel administrativo', () => {
    crearConSesion('ADMIN');
    const { dom } = montar();

    expect(dom.querySelector('.admin-btn')?.textContent).toContain('Panel administrativo');
  });

  it('incluye "Reportar un caso" fijo para movil', () => {
    const { dom } = montar();

    expect(dom.querySelector('.reportar-fijo .reportar-btn')?.textContent).toContain('Reportar un caso');
  });
});
