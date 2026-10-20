import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Client, IFrame, IMessage, StompConfig, StompSubscription } from '@stomp/stompjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UsuarioActual } from '../../shared/models/usuario.model';
import { AuthService } from './auth.service';
import { FABRICA_CLIENTE_STOMP, WebSocketService } from './websocket.service';

class ClienteFalso {
  readonly suscripciones = new Map<
    string,
    { alRecibir: (mensaje: IMessage) => void; cancelada: boolean }
  >();
  readonly publicados: Array<{ destination: string; body: string }> = [];
  onConnect?: () => void;
  onWebSocketClose?: () => void;
  onStompError?: (frame: IFrame) => void;
  onWebSocketError?: (evento: Event) => void;
  active = false;
  connected = false;
  desactivaciones = 0;

  constructor(readonly config: StompConfig) {}

  activate(): void {
    this.active = true;
  }

  deactivate(): Promise<void> {
    this.active = false;
    this.connected = false;
    this.desactivaciones += 1;
    return Promise.resolve();
  }

  subscribe(destino: string, alRecibir: (mensaje: IMessage) => void): StompSubscription {
    const entrada = { alRecibir, cancelada: false };
    this.suscripciones.set(destino, entrada);
    return {
      id: destino,
      unsubscribe: () => {
        entrada.cancelada = true;
        this.suscripciones.delete(destino);
      },
    } as unknown as StompSubscription;
  }

  publish(mensaje: { destination: string; body: string }): void {
    this.publicados.push(mensaje);
  }

  abrir(): void {
    this.active = true;
    this.connected = true;
    this.onConnect?.();
  }

  cerrar(): void {
    this.connected = false;
    this.onWebSocketClose?.();
  }

  entregar(destino: string, evento: unknown): void {
    this.suscripciones
      .get(destino)
      ?.alRecibir({ body: JSON.stringify(evento) } as IMessage);
  }
}

const SALA_PERSONAL = '/topic/usuarios/7';

function evento(id: number | undefined, tipo: string, datos: unknown = {}) {
  return { id, tipo, emitidoEn: '2026-10-19T15:30:00Z', datos };
}

describe('WebSocketService: cliente compartido (HU-38b)', () => {
  let servicio: WebSocketService;
  let clientes: ClienteFalso[];

  const authFalso = {
    usuarioActual: signal<UsuarioActual | null>(null),
    obtenerToken: vi.fn<() => string | null>(() => 'jwt-de-prueba'),
    obtenerIdUsuarioActual: vi.fn<() => number | null>(() => 7),
  };

  beforeEach(() => {
    clientes = [];
    authFalso.obtenerToken.mockReturnValue('jwt-de-prueba');
    authFalso.obtenerIdUsuarioActual.mockReturnValue(7);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authFalso },
        {
          provide: FABRICA_CLIENTE_STOMP,
          useValue: (config: StompConfig) => {
            const cliente = new ClienteFalso(config);
            clientes.push(cliente);
            return cliente as unknown as Client;
          },
        },
      ],
    });

    servicio = TestBed.inject(WebSocketService);
  });

  afterEach(() => {
    servicio.desconectar();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('no abre conexion sin token', () => {
    authFalso.obtenerToken.mockReturnValue(null);

    servicio.conectar();

    expect(clientes).toHaveLength(0);
  });

  it('conecta con el JWT en las cabeceras y abre la sala personal', () => {
    servicio.conectar();

    expect(clientes).toHaveLength(1);
    const cliente = clientes[0];
    expect(cliente.config.connectHeaders).toEqual({
      Authorization: 'Bearer jwt-de-prueba',
    });
    expect(cliente.config.brokerURL).toMatch(/\/ws$/);
    expect(servicio.conectado()).toBe(false);

    cliente.abrir();

    expect(servicio.conectado()).toBe(true);
    expect([...cliente.suscripciones.keys()]).toEqual([SALA_PERSONAL]);
  });

  it('reconecta con backoff exponencial (1s, 2s, 4s)', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    servicio.conectar();
    clientes[0].cerrar();

    expect(servicio.conectado()).toBe(false);
    vi.advanceTimersByTime(999);
    expect(clientes).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(clientes).toHaveLength(2);

    clientes[1].cerrar();
    vi.advanceTimersByTime(1_999);
    expect(clientes).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(clientes).toHaveLength(3);

    clientes[2].cerrar();
    vi.advanceTimersByTime(3_999);
    expect(clientes).toHaveLength(3);
    vi.advanceTimersByTime(1);
    expect(clientes).toHaveLength(4);
  });

  it('al reconectar pide el replay con el ultimo id procesado', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    servicio.conectar();
    clientes[0].abrir();
    clientes[0].entregar(SALA_PERSONAL, evento(5, 'notification.new'));

    clientes[0].cerrar();
    vi.advanceTimersByTime(1_000);
    clientes[1].abrir();

    expect(clientes[1].publicados).toContainEqual({
      destination: '/app/replay',
      body: JSON.stringify({ ultimoId: 5 }),
    });
  });

  it('descarta eventos personales repetidos o ya procesados', () => {
    servicio.conectar();
    clientes[0].abrir();

    const recibidos: Array<number | null | undefined> = [];
    servicio.enEvento('notification.new').subscribe((e) => recibidos.push(e.id));

    clientes[0].entregar(SALA_PERSONAL, evento(4, 'notification.new'));
    clientes[0].entregar(SALA_PERSONAL, evento(4, 'notification.new'));
    clientes[0].entregar(SALA_PERSONAL, evento(6, 'notification.new'));

    expect(recibidos).toEqual([4, 6]);
  });

  it('enruta el bus por tipo de evento', () => {
    servicio.conectar();
    clientes[0].abrir();

    const escribiendo: unknown[] = [];
    servicio.enEvento('chat.typing').subscribe((e) => escribiendo.push(e));
    servicio.suscribirCaso(101);

    clientes[0].entregar('/topic/casos/101', evento(undefined, 'chat.message'));
    clientes[0].entregar('/topic/casos/101', evento(undefined, 'chat.typing'));

    expect(escribiendo).toHaveLength(1);
  });

  it('comparte una sola suscripcion por sala de caso y la cierra al salir el ultimo', () => {
    servicio.conectar();
    const cliente = clientes[0];

    const salir1 = servicio.suscribirCaso(101);
    const salir2 = servicio.suscribirCaso(101);
    cliente.abrir();

    expect(cliente.suscripciones.has('/topic/casos/101')).toBe(true);

    salir1();
    expect(cliente.suscripciones.has('/topic/casos/101')).toBe(true);

    salir2();
    expect(cliente.suscripciones.has('/topic/casos/101')).toBe(false);
  });

  it('avisa que esta escribiendo solo con conexion activa', () => {
    expect(servicio.avisarEscribiendo(101)).toBe(false);

    servicio.conectar();
    clientes[0].abrir();

    expect(servicio.avisarEscribiendo(101)).toBe(true);
    expect(clientes[0].publicados).toContainEqual({
      destination: '/app/caso/101/escribiendo',
      body: '{}',
    });
  });
});
