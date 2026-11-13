import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription, filter, map } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { esGestorDeReportes } from '../../constants/roles';

/** Rutas donde no se muestra el boton fijo "Reportar un caso" en movil. */
const SIN_REPORTAR_FIJO = ['/reportes/nuevo', '/login', '/register'];

/**
 * Cabecera compartida (rediseño de la navegacion).
 *
 * - Logo que lleva al inicio y tres enlaces: Casos, Organizaciones y Como ayudar.
 * - Un boton principal "Reportar un caso".
 * - Con sesion: mensajes, notificaciones (con contador, HU-37/HU-38b) y el menu
 *   de la cuenta (Mi perfil, Mis casos, Solicitudes para revisores, idioma y
 *   Cerrar sesion).
 * - En pantallas angostas los enlaces quedan detras de ☰ y "Reportar un caso"
 *   queda fijo abajo.
 *
 * `variante` se mantiene por compatibilidad con las paginas que la pasan; la
 * navegacion ahora es la misma en todas.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css',
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  readonly variante = input<'landing' | 'app'>('app');

  protected readonly authService = inject(AuthService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly organizacionService = inject(OrganizacionService);
  private readonly webSocket = inject(WebSocketService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly sinLeer = this.notificacionService.noLeidas;
  readonly haySesion = computed(() => this.authService.usuarioActual() !== null);
  readonly email = computed(() => this.authService.usuarioActual()?.email ?? '');
  readonly esRevisor = computed(() => esGestorDeReportes(this.authService.usuarioActual()?.rol));
  readonly idioma = this.translate.lang;

  /** Iniciales para el avatar, a partir del correo (la sesion no guarda el nombre). */
  readonly iniciales = computed(() => {
    const local = this.email().split('@')[0] ?? '';
    const partes = local.split(/[._\-+]/).filter(Boolean);
    const letras = partes.length > 1 ? partes[0][0] + partes[1][0] : local.slice(0, 2);
    return (letras || '?').toUpperCase();
  });

  /** Quien representa una organizacion gestiona sus casos en el panel; el resto ve sus reportes. */
  readonly esOrganizacion = signal(false);
  private organizacionConsultada = false;
  readonly rutaMisCasos = computed(() => (this.esOrganizacion() ? '/organizaciones/panel' : '/perfil'));
  readonly rutaReportar = computed(() => (this.haySesion() ? '/reportes/nuevo' : '/login'));

  readonly menuAbierto = signal(false);
  readonly cuentaAbierta = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  readonly mostrarReportarFijo = computed(
    () => !SIN_REPORTAR_FIJO.some((ruta) => (this.url() ?? '').startsWith(ruta)),
  );

  private readonly suscripciones = new Subscription();

  ngOnInit(): void {
    if (this.haySesion()) {
      this.cargarNotificaciones();
    }
    // HU-38b: el servidor empuja "notification.new"; al llegar, sube el contador
    // sin obligar a recargar la pagina.
    this.suscripciones.add(
      this.webSocket.enEvento('notification.new').subscribe(() => this.cargarNotificaciones()),
    );
  }

  ngOnDestroy(): void {
    this.suscripciones.unsubscribe();
  }

  esAdmin(): boolean {
    return this.authService.esAdmin();
  }

  alternarMenu(): void {
    this.cuentaAbierta.set(false);
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  alternarCuenta(): void {
    this.menuAbierto.set(false);
    this.cuentaAbierta.update((abierta) => !abierta);
    // Se consulta recien al abrir el menu, para no sumar una peticion en cada pagina.
    if (this.cuentaAbierta() && !this.organizacionConsultada) {
      this.organizacionConsultada = true;
      this.detectarOrganizacion();
    }
  }

  cerrarTodo(): void {
    this.menuAbierto.set(false);
    this.cuentaAbierta.set(false);
  }

  cambiarIdioma(idioma: 'es' | 'en'): void {
    this.translate.setLang(idioma);
  }

  cerrarSesion(): void {
    this.cerrarTodo();
    this.authService.logout();
    this.notificacionService.limpiar();
    this.esOrganizacion.set(false);
    this.organizacionConsultada = false;
    void this.router.navigate(['/']);
  }

  /** Cierra el menu de la cuenta al hacer click fuera de el. */
  @HostListener('document:click', ['$event'])
  alHacerClickFuera(evento: MouseEvent): void {
    if (!this.cuentaAbierta()) {
      return;
    }
    const cuenta = (this.host.nativeElement as HTMLElement).querySelector('.cuenta');
    if (cuenta && !cuenta.contains(evento.target as Node)) {
      this.cuentaAbierta.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    this.cerrarTodo();
  }

  private detectarOrganizacion(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();
    if (idUsuario === null) {
      return;
    }
    this.suscripciones.add(
      this.organizacionService.obtenerDeRepresentante(idUsuario).subscribe({
        next: (organizacion) => this.esOrganizacion.set(organizacion !== null),
        error: () => this.esOrganizacion.set(false),
      }),
    );
  }

  private cargarNotificaciones(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();
    if (idUsuario === null) {
      this.notificacionService.limpiar();
      return;
    }
    this.suscripciones.add(
      this.notificacionService.cargar(idUsuario).subscribe({ error: () => {} }),
    );
  }
}
