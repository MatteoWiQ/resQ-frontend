import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { TextoEnriquecidoPipe } from '../../../../shared/pipes/texto-enriquecido.pipe';
import { MAX_CARACTERES_MENSAJE, Mensaje } from '../../../../shared/models/mensaje.model';

/**
 * HU-27: una conversacion con otro usuario o con una organizacion.
 *
 * El historial se muestra del mas reciente al mas antiguo, se envia texto
 * enriquecido con tope de caracteres, permite adjuntar imagenes o archivos y
 * eliminar los mensajes propios. Los mensajes que llegan por WebSocket entran sin
 * recargar la pagina.
 */
@Component({
  selector: 'app-conversacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    AppHeaderComponent,
    BackButtonComponent,
    TextoEnriquecidoPipe,
  ],
  templateUrl: './conversacion.component.html',
  styleUrl: './conversacion.component.css',
})
export class ConversacionComponent implements OnInit, OnDestroy {
  private readonly mensajeService = inject(MensajeService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly webSocket = inject(WebSocketService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly mensajes = signal<Mensaje[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly borrador = signal('');
  readonly adjunto = signal<File | null>(null);
  readonly enviando = signal(false);
  readonly maxCaracteres = MAX_CARACTERES_MENSAJE;
  /** Nombre del otro participante: es el remitente cuando el mensaje no es propio. */
  readonly nombreOtro = signal('');

  private idConversacion = 0;
  private idUsuario = 0;
  /** TT-53: clave del envio en curso, para que los reintentos sean idempotentes. */
  private readonly clavePendiente = signal<string | null>(null);
  private readonly suscripciones = new Subscription();

  get caracteres(): number {
    return this.borrador().length;
  }

  ngOnInit(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();
    if (idUsuario === null) {
      this.error.set(this.translate.t('mensajes.sinSesion'));
      this.cargando.set(false);
      return;
    }
    this.idUsuario = idUsuario;
    this.idConversacion = Number(this.route.snapshot.paramMap.get('id'));

    this.cargarMensajes();
    this.cargarNombreOtro();
    this.escucharEventos();
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }

  cargarMensajes(): void {
    this.cargando.set(true);
    this.suscripciones.add(
      this.mensajeService.obtenerMensajes(this.idConversacion)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (mensajes) => {
            this.mensajes.set(mensajes);
            this.cargando.set(false);
          },
          error: (err: HttpErrorResponse) => {
            this.cargando.set(false);
            this.error.set(
              err.status === 403
                ? this.translate.t('mensajes.errorSinPermiso')
                : this.translate.t('mensajes.errorCargar'),
            );
          },
        }),
    );
  }

  /** HU-27: el nombre del otro participante sale de la bandeja (remitente). */
  private cargarNombreOtro(): void {
    this.suscripciones.add(
      this.mensajeService.obtenerConversaciones().subscribe({
        next: (conversaciones) => {
          const conversacion = conversaciones.find((c) => c.idConversacion === this.idConversacion);
          this.nombreOtro.set(conversacion?.nombre ?? this.translate.t('mensajes.conversacion'));
        },
        error: () => this.nombreOtro.set(this.translate.t('mensajes.conversacion')),
      }),
    );
  }

  escribir(evento: Event): void {
    this.borrador.set((evento.target as HTMLTextAreaElement).value);
  }

  /**
   * HU-27: envuelve lo seleccionado (o la palabra bajo el cursor) con el marcador
   * de negrita, cursiva o monoespaciado. El backend guarda el texto tal cual.
   */
  envolver(marcador: string): void {
    const area = document.querySelector<HTMLTextAreaElement>('.redactar textarea');
    if (!area) {
      return;
    }
    const texto = this.borrador();
    const inicio = area.selectionStart ?? 0;
    const fin = area.selectionEnd ?? texto.length;
    const seleccion = texto.slice(inicio, fin);

    // Con seleccion se envuelve; sin ella se inserta el marcado sobre el cursor.
    const nuevo =
      seleccion.length > 0
        ? texto.slice(0, inicio) + marcador + seleccion + marcador + texto.slice(fin)
        : texto.slice(0, inicio) + marcador + 'texto' + marcador + texto.slice(inicio);
    this.borrador.set(nuevo.slice(0, MAX_CARACTERES_MENSAJE));

    const cursor = seleccion.length > 0 ? inicio + marcador.length + seleccion.length : inicio + marcador.length;
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(cursor, cursor);
    });
  }

  seleccionarAdjunto(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.adjunto.set(input.files && input.files.length > 0 ? input.files[0] : null);
  }

  quitarAdjunto(input?: HTMLInputElement): void {
    this.adjunto.set(null);
    if (input) {
      input.value = '';
    }
  }

  /** Envia el mensaje. El contador impide pasarse del limite antes de llamar al backend. */
  enviar(): void {
    if (this.enviando() || this.caracteres > this.maxCaracteres) {
      return;
    }
    const contenido = this.borrador().trim();
    if (!contenido && !this.adjunto()) {
      this.error.set(this.translate.t('mensajes.vacio'));
      return;
    }

    this.enviando.set(true);
    this.error.set('');
    // TT-53: la clave se conserva hasta que el envio se confirma, asi un reintento
    // (doble clic, reconexion) no crea un mensaje duplicado en el backend.
    const claveEnvio = this.clavePendiente() ?? this.nuevaClaveEnvio();
    this.clavePendiente.set(claveEnvio);
    this.suscripciones.add(
      this.mensajeService
        .enviarMensaje(this.idConversacion, contenido, this.adjunto(), claveEnvio)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (mensaje) => {
            this.mensajes.update((lista) => [mensaje, ...lista]);
            this.borrador.set('');
            this.adjunto.set(null);
            this.clavePendiente.set(null);
            this.enviando.set(false);
          },
          error: (err: HttpErrorResponse) => {
            this.enviando.set(false);
            this.error.set(
              err.status === 409
                ? this.translate.t('mensajes.claveRepetida')
                : err.status === 400
                  ? (err.error?.message ?? this.translate.t('mensajes.errorDemasiadoLargo'))
                  : this.translate.t('mensajes.errorEnviar'),
            );
          },
        }),
    );
  }

  private nuevaClaveEnvio(): string {
    const cripto = globalThis.crypto;
    if (typeof cripto?.randomUUID === 'function') {
      return cripto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (caracter) => {
      const azar = (Math.random() * 16) | 0;
      return (caracter === 'x' ? azar : (azar & 0x3) | 0x8).toString(16);
    });
  }

  eliminar(mensaje: Mensaje): void {
    this.suscripciones.add(
      this.mensajeService.eliminarMensaje(mensaje.idMensaje)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.cargarMensajes(),
          error: () => this.error.set(this.translate.t('mensajes.errorEliminar')),
        }),
    );
  }

  esMio(mensaje: Mensaje): boolean {
    return mensaje.idEmisor === this.idUsuario;
  }

  esImagen(mensaje: Mensaje): boolean {
    return mensaje.tipo === 'IMAGEN';
  }

  rutaAdjunto(mensaje: Mensaje): string | null {
    return mensaje.urlAdjunto;
  }

  formato(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private escucharEventos(): void {
    this.suscripciones.add(
      this.webSocket.enEvento('mensaje.nuevo').subscribe((evento) => {
        if (evento.datos.idConversacion === this.idConversacion) {
          this.cargarMensajes();
        }
      }),
    );
    this.suscripciones.add(
      this.webSocket.enEvento('mensaje.eliminado').subscribe((evento) => {
        if (evento.datos.idConversacion === this.idConversacion) {
          this.cargarMensajes();
        }
      }),
    );
  }
}
