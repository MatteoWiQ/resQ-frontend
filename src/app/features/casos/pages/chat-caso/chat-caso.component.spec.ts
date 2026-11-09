import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Subject, filter, of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatCasoComponent } from './chat-caso.component';
import { AuthService } from '../../../../core/services/auth.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { GeolocalizacionService } from '../../../../core/services/geolocalizacion.service';
import { authServiceDoble } from '../../../../shared/testing/test-doubles';
import { EventoWebSocket } from '../../../../shared/models/evento-websocket.model';
import { MensajeCaso, ParticipanteChat } from '../../../../shared/models/mensaje-caso.model';

const BASE = '/api/casos/101/chat';

function mensaje(id: number, extra: Partial<MensajeCaso> = {}): MensajeCaso {
  return {
    idMensaje: id,
    idCaso: 101,
    idEmisor: 20,
    nombreEmisor: 'Refugio Patitas',
    tipo: 'TEXTO',
    contenido: `Mensaje ${id}`,
    latitud: null,
    longitud: null,
    fotoUrl: null,
    fechaEnvio: '2026-11-08T21:00:00',
    ...extra,
  };
}

const PARTICIPANTES: ParticipanteChat[] = [
  { idUsuario: 7, nombre: 'Ana Quiroga', rol: 'REPORTANTE', enLinea: true, ultimaVez: null },
  { idUsuario: 20, nombre: 'Refugio Patitas', rol: 'ORGANIZACION', enLinea: false, ultimaVez: '2026-11-07T18:30:00' },
];

describe('ChatCasoComponent (HU-22)', () => {
  let fixture: ComponentFixture<ChatCasoComponent>;
  let component: ChatCasoComponent;
  let httpMock: HttpTestingController;
  let eventos: Subject<EventoWebSocket>;
  let salir: ReturnType<typeof vi.fn>;
  let ws: Record<string, unknown>;
  let geo: { obtenerPosicionActual: ReturnType<typeof vi.fn> };

  async function crear(idCaso = '101') {
    eventos = new Subject<EventoWebSocket>();
    salir = vi.fn();
    ws = {
      conectado: () => true,
      enEvento: (tipo: string) => eventos.pipe(filter((e) => e.tipo === tipo)),
      suscribirCaso: vi.fn(() => salir),
      avisarEscribiendo: vi.fn(() => true),
    };
    geo = { obtenerPosicionActual: vi.fn(() => of({ latitud: -17.39, longitud: -66.15 })) };

    await TestBed.configureTestingModule({
      imports: [ChatCasoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceDoble({ idUsuario: 7, email: 'ana@resq.com', rol: 'USUARIO' }) },
        { provide: WebSocketService, useValue: ws },
        { provide: GeolocalizacionService, useValue: geo },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ idCaso }) } } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ChatCasoComponent);
    component = fixture.componentInstance;
  }

  function cargar(historial: MensajeCaso[] = [], participantes = PARTICIPANTES): void {
    fixture.detectChanges();
    httpMock.expectOne(`${BASE}/mensajes`).flush(historial);
    httpMock.expectOne(`${BASE}/participantes`).flush(participantes);
    fixture.detectChanges();
  }

  const dom = () => fixture.nativeElement as HTMLElement;

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('muestra el historial al entrar y se une a la sala del caso', async () => {
    await crear();
    cargar([mensaje(1, { idEmisor: 7, contenido: 'Hola' }), mensaje(2, { contenido: 'Vamos en camino' })]);

    expect(ws['suscribirCaso']).toHaveBeenCalledWith(101);
    const burbujas = dom().querySelectorAll('.mensaje');
    expect(burbujas.length).toBe(2);
    expect(burbujas[0].classList).toContain('propio');
    expect(burbujas[1].textContent).toContain('Refugio Patitas');
    expect(burbujas[1].textContent).toContain('Vamos en camino');
  });

  it('agrega en tiempo real los mensajes del caso que llegan por chat.message', async () => {
    await crear();
    cargar();

    eventos.next({ tipo: 'chat.message', emitidoEn: '', datos: mensaje(5, { contenido: '¿Siguen ahí?' }) });
    eventos.next({ tipo: 'chat.message', emitidoEn: '', datos: mensaje(6, { idCaso: 999 }) });
    fixture.detectChanges();

    expect(dom().querySelectorAll('.mensaje').length).toBe(1);
    expect(dom().textContent).toContain('¿Siguen ahí?');
  });

  it('envia un texto y no lo duplica cuando vuelve por el WebSocket', async () => {
    await crear();
    cargar();

    component.texto = 'Ya voy';
    component.enviarTexto();
    const req = httpMock.expectOne(`${BASE}/mensajes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ contenido: 'Ya voy' });
    req.flush(mensaje(9, { idEmisor: 7, contenido: 'Ya voy' }));
    eventos.next({ tipo: 'chat.message', emitidoEn: '', datos: mensaje(9, { idEmisor: 7, contenido: 'Ya voy' }) });
    fixture.detectChanges();

    expect(component.mensajes().length).toBe(1);
    expect(component.texto).toBe('');
  });

  it('comparte la ubicacion actual y la muestra como enlace al mapa', async () => {
    await crear();
    cargar();

    component.compartirUbicacion();
    const req = httpMock.expectOne(`${BASE}/mensajes`);
    expect(req.request.body).toEqual({ contenido: null, latitud: -17.39, longitud: -66.15 });
    req.flush(mensaje(10, { idEmisor: 7, tipo: 'UBICACION', contenido: null, latitud: -17.39, longitud: -66.15 }));
    fixture.detectChanges();

    const enlace = dom().querySelector<HTMLAnchorElement>('.ubicacion')!;
    expect(enlace.href).toContain('mlat=-17.39');
  });

  it('si no se puede obtener la ubicacion muestra el motivo y no envia nada', async () => {
    await crear();
    cargar();
    geo.obtenerPosicionActual.mockReturnValue(throwError(() => new Error('denegado')));

    component.compartirUbicacion();
    fixture.detectChanges();

    expect(dom().querySelector('.chat-error')?.textContent).toContain('ubicación');
    expect(component.enviando()).toBe(false);
  });

  it('envia una foto y la muestra en el chat', async () => {
    await crear();
    cargar();
    const foto = new File([new Uint8Array([1])], 'perro.jpg', { type: 'image/jpeg' });
    const input = { files: [foto], value: 'perro.jpg' } as unknown as HTMLInputElement;

    component.enviarFoto({ target: input } as unknown as Event);
    const req = httpMock.expectOne(`${BASE}/fotos`);
    expect((req.request.body as FormData).get('foto')).toBeInstanceOf(File);
    req.flush(mensaje(11, { idEmisor: 7, tipo: 'FOTO', contenido: null, fotoUrl: '/api/reportes/fotos/abc.jpg' }));
    fixture.detectChanges();

    expect(dom().querySelector<HTMLImageElement>('.foto')!.getAttribute('src')).toBe('/api/reportes/fotos/abc.jpg');
  });

  it('rechaza una foto con formato no permitido sin llamar al backend', async () => {
    await crear();
    cargar();
    const pdf = new File([new Uint8Array([1])], 'doc.pdf', { type: 'application/pdf' });

    component.enviarFoto({ target: { files: [pdf], value: '' } } as unknown as Event);
    fixture.detectChanges();

    expect(dom().querySelector('.chat-error')?.textContent).toContain('JPG');
  });

  it('muestra a los demas participantes con su rol y si estan en linea o su ultima vez', async () => {
    await crear();
    cargar();

    const participantes = dom().querySelectorAll('.participante');
    expect(participantes.length).toBe(1);
    expect(participantes[0].textContent).toContain('Refugio Patitas');
    expect(participantes[0].textContent).toContain('Organización');
    expect(participantes[0].textContent).toContain('Última vez activo: 07/11 18:30');

    eventos.next({ tipo: 'user.online', emitidoEn: '', datos: { idUsuario: 20, enLinea: true } });
    fixture.detectChanges();

    expect(dom().querySelector('.participante')!.textContent).toContain('En línea');
    expect(dom().querySelector('.punto')!.classList).toContain('en-linea');
  });

  it('avisa quien esta escribiendo', async () => {
    await crear();
    cargar();

    eventos.next({ tipo: 'chat.typing', emitidoEn: '', datos: { idCaso: 101, idUsuario: 20 } });
    fixture.detectChanges();

    expect(dom().querySelector('.escribiendo')!.textContent).toContain('Refugio Patitas está escribiendo');
  });

  it('a quien no participa del caso le muestra el motivo y no le deja escribir', async () => {
    await crear();
    fixture.detectChanges();
    httpMock
      .expectOne(`${BASE}/mensajes`)
      .flush({ message: 'Solo los involucrados' }, { status: 403, statusText: 'Forbidden' });
    httpMock.expectOne(`${BASE}/participantes`).flush({}, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(dom().textContent).toContain('Solo los involucrados en el caso pueden ver y usar este chat.');
    expect(dom().querySelector('textarea')).toBeNull();
  });

  it('al salir de la pagina deja la sala del caso', async () => {
    await crear();
    cargar();

    fixture.destroy();

    expect(salir).toHaveBeenCalled();
  });
});
