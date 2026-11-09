import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Subject, filter } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatCasoService } from './chat-caso.service';
import { WebSocketService } from './websocket.service';
import { EventoWebSocket } from '../../shared/models/evento-websocket.model';
import { MensajeCaso } from '../../shared/models/mensaje-caso.model';

function mensaje(id: number, idCaso = 101): MensajeCaso {
  return {
    idMensaje: id,
    idCaso,
    idEmisor: 7,
    nombreEmisor: 'Ana',
    tipo: 'TEXTO',
    contenido: `Mensaje ${id}`,
    latitud: null,
    longitud: null,
    fotoUrl: null,
    fechaEnvio: '2026-11-08T21:00:00',
  };
}

describe('ChatCasoService (HU-22)', () => {
  let servicio: ChatCasoService;
  let httpMock: HttpTestingController;
  const eventos = new Subject<EventoWebSocket>();
  const salir = vi.fn();
  const ws = {
    enEvento: (tipo: string) => eventos.pipe(filter((e) => e.tipo === tipo)),
    suscribirCaso: vi.fn(() => salir),
    avisarEscribiendo: vi.fn(() => true),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: WebSocketService, useValue: ws }],
    });
    servicio = TestBed.inject(ChatCasoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('pide el historial y los participantes del caso', () => {
    servicio.historial(101).subscribe();
    servicio.participantes(101).subscribe();

    expect(httpMock.expectOne('/api/casos/101/chat/mensajes').request.method).toBe('GET');
    expect(httpMock.expectOne('/api/casos/101/chat/participantes').request.method).toBe('GET');
  });

  it('envia un texto y una ubicacion al endpoint de mensajes', () => {
    servicio.enviarTexto(101, 'Voy en camino').subscribe();
    const texto = httpMock.expectOne('/api/casos/101/chat/mensajes');
    expect(texto.request.method).toBe('POST');
    expect(texto.request.body).toEqual({ contenido: 'Voy en camino' });
    texto.flush(mensaje(1));

    servicio.enviarUbicacion(101, -17.39, -66.15).subscribe();
    const ubicacion = httpMock.expectOne('/api/casos/101/chat/mensajes');
    expect(ubicacion.request.body).toEqual({ contenido: null, latitud: -17.39, longitud: -66.15 });
  });

  it('envia la foto como multipart con el comentario', () => {
    const foto = new File([new Uint8Array([1, 2, 3])], 'perro.jpg', { type: 'image/jpeg' });

    servicio.enviarFoto(101, foto, '  Así está  ').subscribe();

    const req = httpMock.expectOne('/api/casos/101/chat/fotos');
    expect(req.request.method).toBe('POST');
    const cuerpo = req.request.body as FormData;
    expect(cuerpo.get('foto')).toBeInstanceOf(File);
    expect(cuerpo.get('comentario')).toBe('Así está');
  });

  it('entrar se une a la sala del caso y devuelve la funcion para salir', () => {
    const salirDeSala = servicio.entrar(101);

    expect(ws.suscribirCaso).toHaveBeenCalledWith(101);
    salirDeSala();
    expect(salir).toHaveBeenCalled();
  });

  it('solo emite los mensajes en vivo del caso pedido', () => {
    const recibidos: number[] = [];
    servicio.mensajes(101).subscribe((m) => recibidos.push(m.idMensaje));

    eventos.next({ tipo: 'chat.message', emitidoEn: '', datos: mensaje(1, 101) });
    eventos.next({ tipo: 'chat.message', emitidoEn: '', datos: mensaje(2, 202) });
    eventos.next({ tipo: 'chat.typing', emitidoEn: '', datos: { idCaso: 101, idUsuario: 7 } });

    expect(recibidos).toEqual([1]);
  });

  it('avisa que el usuario esta escribiendo por el WebSocket', () => {
    servicio.avisarEscribiendo(101);

    expect(ws.avisarEscribiendo).toHaveBeenCalledWith(101);
  });
});
