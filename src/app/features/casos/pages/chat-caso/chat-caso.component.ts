import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ChatCasoService } from '../../../../core/services/chat-caso.service';
import { GeolocalizacionService } from '../../../../core/services/geolocalizacion.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { MensajeCaso, ParticipanteChat } from '../../../../shared/models/mensaje-caso.model';

const AVISO_ESCRIBIENDO_MS = 3_000;
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
const CONTENIDO_MAX = 1000;

/**
 * HU-22: chat en vivo del caso.
 *
 * Carga el historial y los participantes, se une a la sala del caso y agrega los
 * mensajes que llegan por chat.message. Permite enviar texto, la ubicacion actual o
 * una foto. Muestra quien esta en linea o cuando se conecto por ultima vez.
 */
@Component({
  selector: 'app-chat-caso',
  standalone: true,
  imports: [FormsModule, DatePipe, BackButtonComponent, TranslatePipe],
  templateUrl: './chat-caso.component.html',
  styleUrl: './chat-caso.component.css',
})
export class ChatCasoComponent implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly chat = inject(ChatCasoService);
  private readonly geo = inject(GeolocalizacionService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly lista = viewChild<ElementRef<HTMLElement>>('lista');

  readonly idCaso = signal<number | null>(null);
  readonly idUsuario = signal<number | null>(null);
  readonly mensajes = signal<MensajeCaso[]>([]);
  readonly participantes = signal<ParticipanteChat[]>([]);
  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly sinAcceso = signal(false);
  readonly escribiendo = signal<number | null>(null);
  readonly contenidoMax = CONTENIDO_MAX;

  texto = '';

  readonly otrosParticipantes = computed(() =>
    this.participantes().filter((p) => p.idUsuario !== this.idUsuario()),
  );

  readonly nombreEscribiendo = computed(() => {
    const id = this.escribiendo();
    return id === null ? null : this.nombreDe(id);
  });

  private ultimoAvisoEscribiendo = 0;
  private temporizadorEscribiendo: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    const idCaso = Number(this.ruta.snapshot.paramMap.get('idCaso'));
    this.idUsuario.set(this.auth.obtenerIdUsuarioActual());
    if (!Number.isInteger(idCaso) || idCaso <= 0) {
      this.cargando.set(false);
      this.error.set(this.translate.t('chatCaso.errores.noExiste'));
      return;
    }
    if (this.idUsuario() === null) {
      this.cargando.set(false);
      this.error.set(this.translate.t('chatCaso.errores.sinSesion'));
      return;
    }
    this.idCaso.set(idCaso);

    this.chat.historial(idCaso).subscribe({
      next: (historial) => {
        this.mensajes.update((actuales) => this.unir(historial, actuales));
        this.cargando.set(false);
        this.bajar();
      },
      error: (e: HttpErrorResponse) => {
        this.cargando.set(false);
        this.mostrarError(e);
      },
    });
    this.cargarParticipantes(idCaso);

    const salir = this.chat.entrar(idCaso);
    this.destroyRef.onDestroy(() => {
      salir();
      this.limpiarEscribiendo();
    });

    this.chat
      .mensajes(idCaso)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((mensaje) => {
        this.agregar(mensaje);
        if (mensaje.idEmisor === this.escribiendo()) {
          this.limpiarEscribiendo();
        }
      });

    this.chat
      .escribiendo(idCaso)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ idUsuario }) => {
        if (idUsuario !== this.idUsuario()) {
          this.mostrarEscribiendo(idUsuario);
        }
      });

    this.chat
      .presencia()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ idUsuario, enLinea }) => {
        this.participantes.update((lista) =>
          lista.map((p) =>
            p.idUsuario === idUsuario
              ? { ...p, enLinea, ultimaVez: enLinea ? null : new Date().toISOString() }
              : p,
          ),
        );
      });
  }

  esPropio(mensaje: MensajeCaso): boolean {
    return mensaje.idEmisor === this.idUsuario();
  }

  etiquetaRol(participante: ParticipanteChat): string {
    return this.translate.t(`chatCaso.roles.${participante.rol}`);
  }

  nombreDe(idUsuario: number): string {
    const participante = this.participantes().find((p) => p.idUsuario === idUsuario);
    return participante?.nombre ?? this.translate.t('chatCaso.alguien');
  }

  urlMapa(mensaje: MensajeCaso): string {
    return `https://www.openstreetmap.org/?mlat=${mensaje.latitud}&mlon=${mensaje.longitud}#map=17/${mensaje.latitud}/${mensaje.longitud}`;
  }

  alEscribir(): void {
    const idCaso = this.idCaso();
    const ahora = Date.now();
    if (idCaso === null || !this.texto.trim() || ahora - this.ultimoAvisoEscribiendo < AVISO_ESCRIBIENDO_MS) {
      return;
    }
    this.ultimoAvisoEscribiendo = ahora;
    this.chat.avisarEscribiendo(idCaso);
  }

  enviarTexto(): void {
    const idCaso = this.idCaso();
    const contenido = this.texto.trim();
    if (idCaso === null || !contenido || this.enviando()) {
      return;
    }
    if (contenido.length > CONTENIDO_MAX) {
      this.error.set(this.translate.t('chatCaso.errores.muyLargo'));
      return;
    }
    this.enviando.set(true);
    this.chat.enviarTexto(idCaso, contenido).subscribe({
      next: (mensaje) => {
        this.texto = '';
        this.alEnviar(mensaje);
      },
      error: (e: HttpErrorResponse) => this.alFallar(e),
    });
  }

  compartirUbicacion(): void {
    const idCaso = this.idCaso();
    if (idCaso === null || this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.geo.obtenerPosicionActual().subscribe({
      next: ({ latitud, longitud }) => {
        this.chat.enviarUbicacion(idCaso, latitud, longitud).subscribe({
          next: (mensaje) => this.alEnviar(mensaje),
          error: (e: HttpErrorResponse) => this.alFallar(e),
        });
      },
      error: () => {
        this.enviando.set(false);
        this.error.set(this.translate.t('chatCaso.errores.ubicacion'));
      },
    });
  }

  enviarFoto(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const foto = input.files?.[0];
    input.value = '';
    const idCaso = this.idCaso();
    if (!foto || idCaso === null || this.enviando()) {
      return;
    }
    if (!TIPOS_FOTO.includes(foto.type)) {
      this.error.set(this.translate.t('chatCaso.errores.formatoFoto'));
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.chat.enviarFoto(idCaso, foto, this.texto).subscribe({
      next: (mensaje) => {
        this.texto = '';
        this.alEnviar(mensaje);
      },
      error: (e: HttpErrorResponse) => this.alFallar(e),
    });
  }

  // ============================================================

  private cargarParticipantes(idCaso: number): void {
    this.chat.participantes(idCaso).subscribe({
      next: (lista) => this.participantes.set(lista),
      error: () => undefined,
    });
  }

  private alEnviar(mensaje: MensajeCaso): void {
    this.enviando.set(false);
    this.error.set('');
    this.agregar(mensaje);
  }

  private alFallar(e: HttpErrorResponse): void {
    this.enviando.set(false);
    this.mostrarError(e);
  }

  /** El mensaje propio llega dos veces (respuesta REST y chat.message): se agrega una sola. */
  private agregar(mensaje: MensajeCaso): void {
    if (this.mensajes().some((m) => m.idMensaje === mensaje.idMensaje)) {
      return;
    }
    this.mensajes.update((lista) => [...lista, mensaje]);
    this.bajar();
  }

  /** Une el historial con lo que haya llegado en vivo mientras cargaba, sin repetir. */
  private unir(historial: MensajeCaso[], enVivo: MensajeCaso[]): MensajeCaso[] {
    const ids = new Set(historial.map((m) => m.idMensaje));
    return [...historial, ...enVivo.filter((m) => !ids.has(m.idMensaje))];
  }

  private mostrarError(e: HttpErrorResponse): void {
    if (e.status === 403) {
      this.sinAcceso.set(true);
      this.error.set(this.translate.t('chatCaso.errores.sinAcceso'));
    } else if (e.status === 404) {
      this.error.set(this.translate.t('chatCaso.errores.noExiste'));
    } else {
      this.error.set(e.error?.message || this.translate.t('chatCaso.errores.generico'));
    }
  }

  private mostrarEscribiendo(idUsuario: number): void {
    this.limpiarEscribiendo();
    this.escribiendo.set(idUsuario);
    this.temporizadorEscribiendo = setTimeout(() => this.escribiendo.set(null), AVISO_ESCRIBIENDO_MS + 1_000);
  }

  private limpiarEscribiendo(): void {
    if (this.temporizadorEscribiendo !== null) {
      clearTimeout(this.temporizadorEscribiendo);
      this.temporizadorEscribiendo = null;
    }
    this.escribiendo.set(null);
  }

  private bajar(): void {
    setTimeout(() => {
      const lista = this.lista()?.nativeElement;
      if (lista) {
        lista.scrollTop = lista.scrollHeight;
      }
    });
  }
}
