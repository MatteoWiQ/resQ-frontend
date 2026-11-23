import { Component, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { OrganizacionService } from '../../../../core/services/organizacion.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { Conversacion, DirectorioUsuario } from '../../../../shared/models/mensaje.model';
import { Organizacion } from '../../../../shared/models/organizacion.model';

/**
 * HU-39/HU-27: bandeja de conversaciones entre usuarios.
 *
 * Lista las conversaciones del usuario y permite abrir una nueva con una
 * organizacion verificada o con otro usuario.
 */
@Component({
  selector: 'app-bandeja-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, AppHeaderComponent, BackButtonComponent],
  templateUrl: './bandeja-chat.component.html',
  styleUrl: './bandeja-chat.component.css',
})
export class BandejaChatComponent implements OnInit, OnDestroy {
  private static readonly DEBOUNCE_RECARGA_MS = 300;

  private readonly mensajeService = inject(MensajeService);
  private readonly organizacionService = inject(OrganizacionService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly webSocket = inject(WebSocketService);

  readonly conversaciones = signal<Conversacion[]>([]);
  readonly organizaciones = signal<Organizacion[]>([]);
  readonly usuarios = signal<DirectorioUsuario[]>([]);
  readonly cargando = signal(true);
  readonly cargandoOrganizaciones = signal(false);
  readonly cargandoUsuarios = signal(false);
  readonly error = signal('');
  readonly errorBusqueda = signal('');
  readonly mostrarNueva = signal(false);
  readonly busqueda = signal('');
  readonly busquedaConversaciones = signal('');
  readonly verArchivadas = signal(false);
  readonly accionando = signal<number | null>(null);

  private readonly suscripciones = new Subscription();
  private recargaPendiente: ReturnType<typeof setTimeout> | null = null;
  private conectadoAntes = false;
  private conexiones = 0;

  constructor() {
    // TT-52: al recuperar la conexion se refresca la bandeja por si se
    // perdieron eventos mientras el socket estaba caido.
    effect(() => {
      const conectado = this.webSocket.conectado();
      if (conectado && !this.conectadoAntes) {
        this.conexiones += 1;
        if (this.conexiones > 1) {
          this.programarRecarga();
        }
      }
      this.conectadoAntes = conectado;
    });
  }

  ngOnInit(): void {
    if (this.authService.obtenerIdUsuarioActual() === null) {
      this.error.set(this.translate.t('mensajes.sinSesion'));
      this.cargando.set(false);
      return;
    }
    this.cargarConversaciones();
    this.escucharEventos();
  }

  ngOnDestroy(): void {
    if (this.recargaPendiente !== null) {
      clearTimeout(this.recargaPendiente);
      this.recargaPendiente = null;
    }
    this.suscripciones.unsubscribe();
  }

  cargarConversaciones(): void {
    this.cargando.set(true);
    this.error.set('');
    this.suscripciones.add(
      this.mensajeService
        .obtenerConversaciones({
          busqueda: this.busquedaConversaciones() || undefined,
          archivadas: this.verArchivadas(),
        })
        .subscribe({
          next: (conversaciones) => {
            this.conversaciones.set(conversaciones);
            this.cargando.set(false);
          },
          error: () => {
            this.error.set(this.translate.t('mensajes.errorCargar'));
            this.cargando.set(false);
          },
        }),
    );
  }

  /** TT-50: aplica el texto de búsqueda a la bandeja de conversaciones. */
  buscarConversaciones(): void {
    this.cargarConversaciones();
  }

  /** TT-50: alterna entre bandeja activa y archivadas. */
  cambiarVista(archivadas: boolean): void {
    if (this.verArchivadas() === archivadas) {
      return;
    }
    this.verArchivadas.set(archivadas);
    this.cargarConversaciones();
  }

  /** TT-50: archiva o desarchiva la conversación y recarga la bandeja. */
  archivar(chat: Conversacion): void {
    if (this.accionando() !== null) {
      return;
    }
    this.accionando.set(chat.idConversacion);
    this.suscripciones.add(
      this.mensajeService.archivarConversacion(chat.idConversacion, !chat.archivada).subscribe({
        next: () => {
          this.accionando.set(null);
          this.cargarConversaciones();
        },
        error: () => {
          this.accionando.set(null);
          this.error.set(this.translate.t('mensajes.errorArchivar'));
        },
      }),
    );
  }

  /** Abre el selector y trae el directorio completo de organizaciones. */
  abrirNueva(): void {
    this.mostrarNueva.set(true);
    if (this.organizaciones().length === 0) {
      this.cargarOrganizaciones();
    }
  }

  /** TT-49: busca organizaciones y usuarios con el mismo texto. */
  buscar(): void {
    this.errorBusqueda.set('');
    this.cargarOrganizaciones();
    this.cargarUsuarios();
  }

  cargarOrganizaciones(): void {
    this.cargandoOrganizaciones.set(true);
    this.suscripciones.add(
      this.organizacionService
        .listarDirectorio({ nombre: this.busqueda() || undefined })
        .subscribe({
          next: (organizaciones) => {
            this.organizaciones.set(organizaciones);
            this.cargandoOrganizaciones.set(false);
          },
          error: () => {
            this.organizaciones.set([]);
            this.cargandoOrganizaciones.set(false);
            this.errorBusqueda.set(this.translate.t('mensajes.errorBuscar'));
          },
        }),
    );
  }

  cargarUsuarios(): void {
    const texto = this.busqueda().trim();
    if (texto.length < 2) {
      this.usuarios.set([]);
      return;
    }
    this.cargandoUsuarios.set(true);
    this.suscripciones.add(
      this.mensajeService.buscarUsuarios(texto).subscribe({
        next: (usuarios) => {
          this.usuarios.set(usuarios);
          this.cargandoUsuarios.set(false);
        },
        error: () => {
          this.usuarios.set([]);
          this.cargandoUsuarios.set(false);
          this.errorBusqueda.set(this.translate.t('mensajes.errorBuscar'));
        },
      }),
    );
  }

  iniciarConOrganizacion(idOrganizacion: number): void {
    this.abrir({ idOrganizacion });
  }

  iniciarConUsuario(idUsuario: number): void {
    this.abrir({ idUsuario });
  }

  private abrir(destino: { idUsuario?: number; idOrganizacion?: number }): void {
    this.suscripciones.add(
      this.mensajeService.abrirConversacion(destino).subscribe({
        next: (conversacion) => {
          this.mostrarNueva.set(false);
          void this.router.navigate(['/chat', conversacion.idConversacion]);
        },
        error: () => this.error.set(this.translate.t('mensajes.errorAbrir')),
      }),
    );
  }

  /**
   * TT-52: los mensajes nuevos o eliminados llegan por el bus personal del
   * socket; se agrupan en una sola recarga para no pedir la bandeja por cada
   * evento de una rafaga.
   */
  private escucharEventos(): void {
    this.suscripciones.add(
      this.webSocket.enEvento('mensaje.nuevo').subscribe(() => this.programarRecarga()),
    );
    this.suscripciones.add(
      this.webSocket.enEvento('mensaje.eliminado').subscribe(() => this.programarRecarga()),
    );
  }

  private programarRecarga(): void {
    if (this.recargaPendiente !== null) {
      return;
    }
    this.recargaPendiente = setTimeout(() => {
      this.recargaPendiente = null;
      this.cargarConversaciones();
    }, BandejaChatComponent.DEBOUNCE_RECARGA_MS);
  }
}
