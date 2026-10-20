import { Injectable, InjectionToken, NgZone, effect, inject, signal } from '@angular/core';
import { Client, IMessage, StompConfig, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject, filter, map } from 'rxjs';

import {
  DatosPorTipoEvento,
  EventoWebSocket,
  TipoEventoWebSocket,
} from '../../shared/models/evento-websocket.model';
import { AuthService } from './auth.service';

export type FabricaClienteStomp = (config: StompConfig) => Client;

/** Seam de testeabilidad: en produccion crea el cliente real de @stomp/stompjs. */
export const FABRICA_CLIENTE_STOMP = new InjectionToken<FabricaClienteStomp>(
  'FABRICA_CLIENTE_STOMP',
  {
    providedIn: 'root',
    factory: () => (config: StompConfig) => new Client(config),
  }
);

interface Sala {
  destino: string;
  referencias: number;
  suscripcion: StompSubscription | null;
}

const RETRASO_BASE_MS = 1_000;
const RETRASO_MAXIMO_MS = 30_000;
const JITTER = 0.2;

/**
 * HU-38b: cliente WebSocket compartido (STOMP). Una sola conexion por sesion,
 * autenticada con el JWT, que se reconecta con backoff exponencial, re-suscribe
 * las salas activas y pide el replay de los eventos personales perdidos.
 *
 * El resto de la app no habla STOMP: consume `enEvento(tipo)` y, para el chat,
 * `suscribirCaso(id)` / `avisarEscribiendo(id)`.
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private readonly auth = inject(AuthService);
  private readonly zona = inject(NgZone);
  private readonly crearCliente = inject(FABRICA_CLIENTE_STOMP);

  readonly conectado = signal(false);

  private cliente: Client | null = null;
  private suscripcionPersonal: StompSubscription | null = null;
  private temporizador: ReturnType<typeof setTimeout> | null = null;
  private intentos = 0;
  private ultimoId = 0;
  private yaConecto = false;
  private desconexionManual = false;
  private usuarioConectado: number | null = null;

  private readonly salas = new Map<string, Sala>();
  private readonly eventos = new Subject<EventoWebSocket>();

  constructor() {
    effect(() => {
      const idUsuario = this.auth.usuarioActual()?.idUsuario ?? null;
      if (idUsuario === null) {
        if (this.usuarioConectado !== null) {
          this.desconectar();
        }
        return;
      }
      if (this.usuarioConectado === idUsuario) {
        return;
      }
      this.usuarioConectado = idUsuario;
      this.ultimoId = 0;
      this.yaConecto = false;
      this.conectar();
    });
  }

  /** Abre la conexion si hay sesion. Es idempotente. */
  conectar(): void {
    if (this.cliente?.active) {
      return;
    }
    const token = this.auth.obtenerToken();
    const idUsuario = this.auth.obtenerIdUsuarioActual();
    if (!token || idUsuario === null) {
      return;
    }

    this.desconexionManual = false;
    this.limpiarTemporizador();

    const cliente = this.crearCliente({
      brokerURL: this.urlBroker(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 0,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      debug: () => undefined,
    });

    cliente.onConnect = () => this.alConectar();
    cliente.onWebSocketClose = () => this.alDesconectar();
    cliente.onStompError = () => this.alDesconectar();
    cliente.onWebSocketError = () => this.alDesconectar();

    this.cliente = cliente;
    cliente.activate();
  }

  /** Cierra la conexion y descarta el estado de replay (logout / fin de sesion). */
  desconectar(): void {
    this.desconexionManual = true;
    this.limpiarTemporizador();
    this.intentos = 0;
    this.yaConecto = false;
    this.ultimoId = 0;
    this.usuarioConectado = null;
    this.suscripcionPersonal = null;
    for (const sala of this.salas.values()) {
      sala.suscripcion = null;
    }
    this.zona.run(() => this.conectado.set(false));

    const cliente = this.cliente;
    this.cliente = null;
    if (cliente) {
      void cliente.deactivate();
    }
  }

  /** Bus tipado: emite solo los eventos del tipo pedido. */
  enEvento<T extends TipoEventoWebSocket>(
    tipo: T
  ): Observable<EventoWebSocket<DatosPorTipoEvento[T]>> {
    return this.eventos.pipe(
      filter((evento) => evento.tipo === tipo),
      map((evento) => evento as EventoWebSocket<DatosPorTipoEvento[T]>)
    );
  }

  /**
   * Se une a la sala del caso. Devuelve la funcion para salir; es segura de
   * llamar varias veces (refcount) y no duplica la suscripcion STOMP.
   */
  suscribirCaso(idCaso: number): () => void {
    return this.suscribirSala(`/topic/casos/${idCaso}`);
  }

  /** Avisa a los participantes del caso que el usuario esta escribiendo. */
  avisarEscribiendo(idCaso: number): boolean {
    return this.enviar(`/app/caso/${idCaso}/escribiendo`, {});
  }

  enviar(destino: string, cuerpo: unknown): boolean {
    if (!this.cliente?.connected) {
      return false;
    }
    this.cliente.publish({
      destination: destino,
      body: JSON.stringify(cuerpo ?? {}),
    });
    return true;
  }

  private alConectar(): void {
    this.intentos = 0;
    this.zona.run(() => this.conectado.set(true));

    const idUsuario = this.auth.obtenerIdUsuarioActual();
    if (idUsuario !== null) {
      this.suscripcionPersonal = this.suscribirDestino(
        `/topic/usuarios/${idUsuario}`,
        true
      );
    }

    for (const sala of this.salas.values()) {
      this.crearSuscripcionSala(sala);
    }

    if (this.yaConecto) {
      this.enviar('/app/replay', { ultimoId: this.ultimoId });
    }
    this.yaConecto = true;
  }

  private alDesconectar(): void {
    this.zona.run(() => this.conectado.set(false));
    this.suscripcionPersonal = null;
    for (const sala of this.salas.values()) {
      sala.suscripcion = null;
    }
    this.programarReconexion();
  }

  private programarReconexion(): void {
    if (this.desconexionManual || this.temporizador !== null) {
      return;
    }
    if (!this.auth.obtenerToken()) {
      return;
    }

    const exponencial = Math.min(
      RETRASO_MAXIMO_MS,
      RETRASO_BASE_MS * 2 ** this.intentos
    );
    const desvio = exponencial * JITTER * (Math.random() * 2 - 1);
    const retraso = Math.max(0, Math.round(exponencial + desvio));
    this.intentos += 1;

    this.temporizador = setTimeout(() => {
      this.temporizador = null;
      this.reintentar();
    }, retraso);
  }

  private reintentar(): void {
    if (this.desconexionManual || !this.auth.obtenerToken()) {
      return;
    }
    const anterior = this.cliente;
    this.cliente = null;
    if (anterior) {
      void anterior.deactivate();
    }
    this.conectar();
  }

  private suscribirSala(destino: string): () => void {
    let sala = this.salas.get(destino);
    if (!sala) {
      sala = { destino, referencias: 0, suscripcion: null };
      this.salas.set(destino, sala);
    }
    sala.referencias += 1;
    if (sala.referencias === 1) {
      this.crearSuscripcionSala(sala);
    }

    let liberada = false;
    return () => {
      if (liberada) {
        return;
      }
      liberada = true;
      this.liberarSala(destino);
    };
  }

  private liberarSala(destino: string): void {
    const sala = this.salas.get(destino);
    if (!sala) {
      return;
    }
    sala.referencias -= 1;
    if (sala.referencias > 0) {
      return;
    }
    sala.suscripcion?.unsubscribe();
    sala.suscripcion = null;
    this.salas.delete(destino);
  }

  private crearSuscripcionSala(sala: Sala): void {
    if (!this.cliente?.connected) {
      return;
    }
    sala.suscripcion?.unsubscribe();
    sala.suscripcion = this.suscribirDestino(sala.destino, false);
  }

  private suscribirDestino(
    destino: string,
    personal: boolean
  ): StompSubscription | null {
    if (!this.cliente?.connected) {
      return null;
    }
    return this.cliente.subscribe(destino, (mensaje) =>
      this.recibir(mensaje, personal)
    );
  }

  private recibir(mensaje: IMessage, personal: boolean): void {
    let evento: EventoWebSocket;
    try {
      evento = JSON.parse(mensaje.body) as EventoWebSocket;
    } catch {
      return;
    }
    if (!evento || typeof evento.tipo !== 'string') {
      return;
    }

    if (personal && typeof evento.id === 'number') {
      if (evento.id <= this.ultimoId) {
        return;
      }
      this.ultimoId = evento.id;
    }

    this.zona.run(() => this.eventos.next(evento));
  }

  private limpiarTemporizador(): void {
    if (this.temporizador !== null) {
      clearTimeout(this.temporizador);
      this.temporizador = null;
    }
  }

  /**
   * En desarrollo pasa por el proxy de Angular (`/ws`). En un despliegue donde el
   * WebSocket no comparte origen con la app se define `window.RESQ_WS_URL`.
   */
  private urlBroker(): string {
    const configurada = (globalThis as { RESQ_WS_URL?: string }).RESQ_WS_URL;
    if (configurada) {
      return configurada;
    }
    const ubicacion = globalThis.location;
    if (!ubicacion) {
      return 'ws://localhost:8080/ws';
    }
    const protocolo = ubicacion.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocolo}//${ubicacion.host}/ws`;
  }
}
