import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DetalleCasoComponent } from './detalle-caso.component';
import { AuthService } from '../../../../core/services/auth.service';
import { GeolocalizacionService } from '../../../../core/services/geolocalizacion.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { Reporte } from '../../../../shared/models/reporte.model';
import { authServiceDoble, webSocketServiceDoble } from '../../../../shared/testing/test-doubles';

const CASO: Reporte = {
  idReporte: 7,
  idUsuario: 2,
  tipoCaso: 'ABANDONADA',
  descripcion: 'Perro herido en la plaza. No apoya la pata trasera izquierda.',
  estado: 'PENDIENTE',
  fotoUrl: '/api/reportes/fotos/perro.jpg',
  fechaCreacion: '2026-11-12T09:12:00',
  latitud: -17.39,
  longitud: -66.15,
  idOrganizacion: null,
};

type Usuario = { idUsuario: number; email: string; rol: string } | null;

describe('DetalleCasoComponent (rediseño)', () => {
  let fixture: ComponentFixture<DetalleCasoComponent>;
  let httpMock: HttpTestingController;
  let mensajes: { abrirConversacion: ReturnType<typeof vi.fn> };
  let geo: { obtenerPosicionActual: ReturnType<typeof vi.fn> };

  async function crear(usuario: Usuario = null, id = '7'): Promise<void> {
    mensajes = { abrirConversacion: vi.fn(() => of({ idConversacion: 55 })) };
    geo = { obtenerPosicionActual: vi.fn(() => of({ latitud: -17.4, longitud: -66.15 })) };
    await TestBed.configureTestingModule({
      imports: [DetalleCasoComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceDoble(usuario) },
        { provide: MensajeService, useValue: mensajes },
        { provide: GeolocalizacionService, useValue: geo },
        { provide: WebSocketService, useValue: webSocketServiceDoble() },
        { provide: NotificacionService, useValue: { noLeidas: () => 0, cargar: () => of([]), limpiar: () => undefined } },
        { provide: ActivatedRoute, useValue: { paramMap: new BehaviorSubject(convertToParamMap({ idCaso: id })) } },
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DetalleCasoComponent);
    fixture.detectChanges();
  }

  function responder(caso: Reporte = CASO): void {
    httpMock.expectOne(`/api/reportes/${caso.idReporte}`).flush(caso);
    fixture.detectChanges();
  }

  const dom = () => fixture.nativeElement as HTMLElement;

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('muestra foto, insignia, tipo, titulo y lo que vio quien reporto', async () => {
    await crear();
    responder();

    expect(dom().querySelector('.detalle-foto img')?.getAttribute('src')).toBe('/api/reportes/fotos/perro.jpg');
    expect(dom().querySelector('.insignia-caso')?.textContent).toContain('Urgente');
    expect(dom().querySelector('.chip-tipo')?.textContent).toContain('Abandonada');
    expect(dom().querySelector('h1')?.textContent).toBe('Perro herido en la plaza');
    expect(dom().querySelector('.relato')?.textContent).toContain('No apoya la pata trasera izquierda.');
    expect(dom().querySelector('.migas a')?.getAttribute('href')).toBe('/casos');
  });

  it('la linea de tiempo empieza con el caso reportado', async () => {
    await crear();
    responder();

    const eventos = Array.from(dom().querySelectorAll('.evento-titulo')).map((e) => e.textContent?.trim());
    expect(eventos).toEqual(['Caso reportado']);
  });

  it('si el caso tiene organizacion pide sus novedades y las agrega; si no puede verlas, sigue igual', async () => {
    await crear();
    responder({ ...CASO, idOrganizacion: 3, estado: 'EN_PROCESO' });

    httpMock.expectOne('/api/reportes/7/seguimientos').flush({}, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(dom().querySelectorAll('.evento').length).toBe(1);
    expect(dom().querySelector('.tarjeta-org')?.textContent).toContain('Una organización de la red');
  });

  it('con sesion muestra el nombre de la organizacion y sus novedades', async () => {
    await crear({ idUsuario: 9, email: 'ana@resq.com', rol: 'USUARIO' });
    responder({ ...CASO, idOrganizacion: 3, estado: 'EN_PROCESO' });

    httpMock.expectOne('/api/reportes/7/seguimientos').flush([
      { idSeguimiento: 1, idReporte: 7, idOrganizacion: 3, nota: 'Lo llevamos al veterinario', fotoUrl: null, fechaCreacion: '2026-11-12T11:05:00' },
    ]);
    httpMock.expectOne('/api/organizaciones/3').flush({ idOrganizacion: 3, nombre: 'Refugio Patitas', logoUrl: null });
    httpMock.expectOne('/api/organizaciones/representante/9').flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(dom().querySelector('.evento-nota')?.textContent).toContain('Lo llevamos al veterinario');
    expect(dom().querySelector('.tarjeta-org strong')?.textContent).toContain('Refugio Patitas');
  });

  it('sin sesion "Ofrecer ayuda" lleva a iniciar sesion', async () => {
    await crear();
    responder();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const boton = dom().querySelector<HTMLButtonElement>('.boton-principal')!;
    expect(boton.textContent).toContain('Inicia sesión para ofrecer ayuda');
    boton.click();

    expect(navegar).toHaveBeenCalledWith(['/login']);
    expect(mensajes.abrirConversacion).not.toHaveBeenCalled();
  });

  it('con sesion "Ofrecer ayuda" abre una conversacion con quien reporto si nadie tomo el caso', async () => {
    await crear({ idUsuario: 9, email: 'ana@resq.com', rol: 'USUARIO' });
    responder();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    dom().querySelector<HTMLButtonElement>('.boton-principal')!.click();

    expect(mensajes.abrirConversacion).toHaveBeenCalledWith({ idUsuario: 2 });
    expect(navegar).toHaveBeenCalledWith(['/chat', 55]);
  });

  it('si no se puede abrir la conversacion avisa', async () => {
    await crear({ idUsuario: 9, email: 'ana@resq.com', rol: 'USUARIO' });
    responder();
    mensajes.abrirConversacion.mockReturnValue(throwError(() => new Error('x')));

    dom().querySelector<HTMLButtonElement>('.boton-principal')!.click();
    fixture.detectChanges();

    expect(dom().querySelector('.texto-error')?.textContent).toContain('No se pudo abrir la conversación');
  });

  it('quien reporto no ve "Ofrecer ayuda" sino el chat del caso', async () => {
    await crear({ idUsuario: 2, email: 'rep@resq.com', rol: 'USUARIO' });
    responder();

    expect(dom().querySelector('.boton-principal')).toBeNull();
    expect(dom().textContent).toContain('Este es tu reporte.');
    expect(dom().querySelector('a.boton-borde')?.getAttribute('href')).toBe('/casos/7/chat');
  });

  it('un caso resuelto ya no pide ayuda', async () => {
    await crear({ idUsuario: 9, email: 'ana@resq.com', rol: 'USUARIO' });
    responder({ ...CASO, estado: 'RESUELTO' });

    expect(dom().querySelector('.boton-principal')).toBeNull();
    expect(dom().textContent).toContain('Este caso ya está cerrado.');
    expect(dom().querySelector('.insignia-caso')?.textContent).toContain('Resuelto');
  });

  it('muestra el mini mapa, "Como llegar" y la distancia cuando se pide', async () => {
    await crear();
    responder();

    expect(dom().querySelector('.mini-mapa .detalle-punto')).not.toBeNull();
    expect(dom().querySelector('.mapa-pie a')?.getAttribute('href')).toContain('destination=-17.39,-66.15');

    dom().querySelector<HTMLButtonElement>('.mapa-pie .enlace-boton')!.click();
    fixture.detectChanges();
    expect(dom().querySelector('.mapa-pie')?.textContent).toContain('km de ti');
  });

  it('un caso sin ubicacion lo dice en lugar del mapa', async () => {
    await crear();
    responder({ ...CASO, latitud: null, longitud: null });

    expect(dom().querySelector('.mini-mapa')).toBeNull();
    expect(dom().textContent).toContain('Este caso no tiene ubicación en el mapa.');
  });

  it('compartir copia el enlace si el navegador no tiene menu de compartir', async () => {
    await crear();
    responder();
    const escribir = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: escribir }, configurable: true });

    const compartir = Array.from(dom().querySelectorAll<HTMLButtonElement>('button.boton-borde')).find((b) =>
      b.textContent?.includes('Compartir caso'),
    )!;
    compartir.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(escribir).toHaveBeenCalled();
    expect(compartir.textContent).toContain('Enlace copiado');
  });

  it('un caso inexistente muestra el aviso y el enlace a Casos', async () => {
    await crear();
    httpMock.expectOne('/api/reportes/7').flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(dom().textContent).toContain('Este caso no existe');
    expect(dom().querySelector('.detalle-estado a')?.getAttribute('href')).toBe('/casos');
  });

  it('si falla la carga permite reintentar', async () => {
    await crear();
    httpMock.expectOne('/api/reportes/7').flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    dom().querySelector<HTMLButtonElement>('.detalle-estado button')!.click();
    responder();

    expect(dom().querySelector('h1')?.textContent).toBe('Perro herido en la plaza');
  });
});
