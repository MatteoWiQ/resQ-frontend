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
import { NecesidadCaso, NovedadCaso, Reporte } from '../../../../shared/models/reporte.model';
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

  /** El caso y lo que el detalle pide siempre: novedades y necesidades (publicas). */
  function responder(caso: Reporte = CASO, necesidades: NecesidadCaso[] = [], novedades: NovedadCaso[] = []): void {
    httpMock.expectOne(`/api/reportes/${caso.idReporte}`).flush(caso);
    httpMock.expectOne(`/api/reportes/${caso.idReporte}/novedades`).flush(novedades);
    httpMock.expectOne(`/api/reportes/${caso.idReporte}/necesidades`).flush(necesidades);
    fixture.detectChanges();
  }

  function necesidad(id: number, tipo: NecesidadCaso['tipo'], estado: NecesidadCaso['estado'], idAyudante: number | null = null): NecesidadCaso {
    return { idNecesidad: id, tipo, estado, idAyudante, nombreAyudante: idAyudante ? 'Jorge' : null };
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

  it('sin sesion muestra el nombre de la organizacion y las novedades publicas', async () => {
    await crear();
    responder({ ...CASO, idOrganizacion: 3, estado: 'EN_PROCESO' }, [], [
      { fechaCreacion: '2026-11-12T11:05:00', nota: 'Lo llevamos al veterinario', fotoUrl: null },
    ]);
    httpMock.expectOne('/api/organizaciones/publicas/3').flush({ idOrganizacion: 3, nombre: 'Refugio Patitas', tipo: 'REFUGIO', logoUrl: null, zonasCobertura: null });
    fixture.detectChanges();

    expect(dom().querySelector('.evento-nota')?.textContent).toContain('Lo llevamos al veterinario');
    expect(dom().querySelector('.tarjeta-org strong')?.textContent).toContain('Refugio Patitas');
  });

  it('si la organizacion no responde, dice "Una organizacion de la red"', async () => {
    await crear();
    responder({ ...CASO, idOrganizacion: 3, estado: 'EN_PROCESO' });
    httpMock.expectOne('/api/organizaciones/publicas/3').flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(dom().querySelector('.tarjeta-org')?.textContent).toContain('Una organización de la red');
  });

  it('muestra los datos del animal y la referencia del lugar', async () => {
    await crear();
    responder({ ...CASO, especie: 'PERRO', edad: 'ADULTO', tamano: 'MEDIANO', referencia: 'frente a la farmacia' });

    const chips = Array.from(dom().querySelectorAll('.chip-tipo')).map((c) => c.textContent?.trim());
    expect(chips).toContain('Perro · adulto · mediano');
    expect(dom().querySelector('.detalle-referencia')?.textContent).toContain('Referencia: frente a la farmacia');
  });

  // ---------------------------------------------------------------- que necesita

  it('muestra que necesita el caso con su progreso', async () => {
    await crear();
    responder(CASO, [necesidad(1, 'TRANSPORTE', 'CUBIERTA', 5), necesidad(2, 'VETERINARIO', 'BUSCADA'), necesidad(3, 'HOGAR_TEMPORAL', 'OFRECIDA', 5)]);

    const tarjeta = dom().querySelector('.tarjeta-necesidades')!;
    expect(tarjeta.textContent).toContain('1 de 3 cubierto');
    expect(tarjeta.querySelector('.barra-progreso')?.getAttribute('aria-valuenow')).toBe('33');
    const estados = Array.from(tarjeta.querySelectorAll('.necesidad-estado')).map((e) => e.textContent?.trim());
    expect(estados).toEqual(['Cubierto por Jorge', 'Se busca', 'Ofrecido por Jorge · falta confirmar']);
  });

  it('sin necesidades y sin poder gestionarlas no muestra la tarjeta', async () => {
    await crear();
    responder();

    expect(dom().querySelector('.tarjeta-necesidades')).toBeNull();
  });

  it('con sesion "Me ofrezco" ofrece ayuda y actualiza la lista', async () => {
    await crear({ idUsuario: 9, email: 'jorge@resq.com', rol: 'USUARIO' });
    responder(CASO, [necesidad(2, 'VETERINARIO', 'BUSCADA')]);

    dom().querySelector<HTMLButtonElement>('.necesidad .boton-mini.principal')!.click();
    const req = httpMock.expectOne('/api/reportes/7/necesidades/2/ofrecer');
    expect(req.request.method).toBe('POST');
    req.flush([necesidad(2, 'VETERINARIO', 'OFRECIDA', 9)]);
    fixture.detectChanges();

    expect(dom().querySelector('.necesidad-estado')?.textContent).toContain('Ofrecido por Jorge');
    expect(dom().querySelector('.necesidad .boton-mini')?.textContent).toContain('Retirar mi oferta');
  });

  it('sin sesion "Me ofrezco" lleva al login', async () => {
    await crear();
    responder(CASO, [necesidad(2, 'VETERINARIO', 'BUSCADA')]);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const boton = dom().querySelector<HTMLButtonElement>('.necesidad .boton-mini.principal')!;
    expect(boton.textContent).toContain('Inicia sesión para ofrecerte');
    boton.click();

    expect(navegar).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: TestBed.inject(Router).url },
    });
  });

  it('quien reporto confirma una oferta, agrega y quita necesidades', async () => {
    await crear({ idUsuario: 2, email: 'rep@resq.com', rol: 'USUARIO' });
    responder(CASO, [necesidad(1, 'TRANSPORTE', 'OFRECIDA', 9), necesidad(2, 'ALIMENTO', 'BUSCADA')]);

    expect(Array.from(dom().querySelectorAll('.necesidad .boton-mini.principal')).map((b) => b.textContent?.trim())).toEqual(['Confirmar']);
    dom().querySelector<HTMLButtonElement>('.necesidad .boton-mini.principal')!.click();
    httpMock.expectOne('/api/reportes/7/necesidades/1/confirmar').flush([necesidad(1, 'TRANSPORTE', 'CUBIERTA', 9), necesidad(2, 'ALIMENTO', 'BUSCADA')]);
    fixture.detectChanges();

    dom().querySelector<HTMLButtonElement>('.boton-quitar')!.click();
    const quitar = httpMock.expectOne('/api/reportes/7/necesidades/2');
    expect(quitar.request.method).toBe('DELETE');
    quitar.flush([necesidad(1, 'TRANSPORTE', 'CUBIERTA', 9)]);
    fixture.detectChanges();

    const select = dom().querySelector<HTMLSelectElement>('#necesidad-nueva')!;
    select.value = 'VETERINARIO';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    Array.from(dom().querySelectorAll<HTMLButtonElement>('.agregar-necesidad button'))[0].click();
    const agregar = httpMock.expectOne((r) => r.url === '/api/reportes/7/necesidades' && r.method === 'POST');
    expect(agregar.request.body).toEqual({ tipo: 'VETERINARIO' });
    agregar.flush([necesidad(1, 'TRANSPORTE', 'CUBIERTA', 9), necesidad(4, 'VETERINARIO', 'BUSCADA')]);
    fixture.detectChanges();

    expect(dom().querySelectorAll('.necesidad').length).toBe(2);
  });

  it('si alguien se ofrecio antes, muestra el motivo y recarga la lista', async () => {
    await crear({ idUsuario: 9, email: 'jorge@resq.com', rol: 'USUARIO' });
    responder(CASO, [necesidad(2, 'VETERINARIO', 'BUSCADA')]);

    dom().querySelector<HTMLButtonElement>('.necesidad .boton-mini.principal')!.click();
    httpMock.expectOne('/api/reportes/7/necesidades/2/ofrecer')
      .flush({ message: 'Alguien ya se ofreció para esta necesidad' }, { status: 409, statusText: 'Conflict' });
    httpMock.expectOne('/api/reportes/7/necesidades').flush([necesidad(2, 'VETERINARIO', 'OFRECIDA', 5)]);
    fixture.detectChanges();

    expect(dom().querySelector('.tarjeta-necesidades .texto-error')?.textContent).toContain('Alguien ya se ofreció');
    expect(dom().querySelector('.necesidad-estado')?.textContent).toContain('Ofrecido por Jorge');
  });

  it('sin sesion "Ofrecer ayuda" lleva a iniciar sesion', async () => {
    await crear();
    responder();
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const boton = dom().querySelector<HTMLButtonElement>('.boton-principal')!;
    expect(boton.textContent).toContain('Inicia sesión para ofrecer ayuda');
    boton.click();

    expect(navegar).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: TestBed.inject(Router).url },
    });
    expect(mensajes.abrirConversacion).not.toHaveBeenCalled();
  });

  it('sin sesion el boton de contactar organizacion redirige a login', async () => {
    await crear();
    responder({ ...CASO, idOrganizacion: 3 });
    httpMock.expectOne('/api/organizaciones/publicas/3').flush({
      idOrganizacion: 3,
      nombre: 'Refugio Patitas',
      tipo: 'REFUGIO',
      logoUrl: null,
      zonasCobertura: null,
    });
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.contactarOrganizacion();

    expect(navegar).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: TestBed.inject(Router).url },
    });
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

  // ---------------------------------------------------------------- contacto de quien reporto

  it('si quien reporto compartio contacto, sin sesion pide iniciar sesion', async () => {
    await crear();
    responder({ ...CASO, tieneContacto: true });

    expect(dom().querySelector('.tarjeta-contacto a')?.getAttribute('href')).toBe('/login');
    expect(dom().querySelector('.tarjeta-contacto')?.textContent).toContain('ResQ nunca pide dinero');
  });

  it('con sesion "Ver telefono" muestra nombre, insignia y botones de llamar y WhatsApp', async () => {
    await crear({ idUsuario: 9, email: 'ana@resq.com', rol: 'USUARIO' });
    responder({ ...CASO, tieneContacto: true });

    dom().querySelector<HTMLButtonElement>('.tarjeta-contacto button')!.click();
    httpMock.expectOne('/api/reportes/7/contacto').flush({
      nombre: 'Luis Meneses',
      insignia: 'VOLUNTARIO',
      telefonos: [{ numero: '71234567', origen: 'CUENTA' }, { numero: '60011122', origen: 'CASO' }],
    });
    fixture.detectChanges();

    const tarjeta = dom().querySelector('.tarjeta-contacto')!;
    expect(tarjeta.querySelector('.contacto-nombre')?.textContent).toContain('Luis Meneses');
    expect(tarjeta.querySelector('.chip-insignia')?.textContent).toContain('Voluntario');
    expect(tarjeta.querySelectorAll('.telefonos li').length).toBe(2);
    const enlaces = Array.from(tarjeta.querySelectorAll('.telefonos li:first-child a')).map((a) => a.getAttribute('href'));
    expect(enlaces).toEqual(['tel:71234567', 'https://wa.me/59171234567']);
  });

  it('si el contacto ya no esta disponible (204) lo dice', async () => {
    await crear({ idUsuario: 9, email: 'ana@resq.com', rol: 'USUARIO' });
    responder({ ...CASO, tieneContacto: true });

    dom().querySelector<HTMLButtonElement>('.tarjeta-contacto button')!.click();
    httpMock.expectOne('/api/reportes/7/contacto').flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(dom().querySelector('.tarjeta-contacto')?.textContent).toContain('no dejó un teléfono');
  });

  it('sin contacto compartido, en un caso cerrado o en tu propio reporte no hay tarjeta de contacto', async () => {
    await crear({ idUsuario: 2, email: 'rep@resq.com', rol: 'USUARIO' });
    responder({ ...CASO, tieneContacto: true });
    expect(dom().querySelector('.tarjeta-contacto')).toBeNull();

    TestBed.resetTestingModule();
    await crear();
    responder({ ...CASO, tieneContacto: true, estado: 'RESUELTO' });
    expect(dom().querySelector('.tarjeta-contacto')).toBeNull();

    TestBed.resetTestingModule();
    await crear();
    responder({ ...CASO, tieneContacto: false });
    expect(dom().querySelector('.tarjeta-contacto')).toBeNull();
  });
});
