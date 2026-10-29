import { Component, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

/**
 * HU-logout: cabecera compartida por landing, perfil y panel administrativo.
 *
 * Antes el boton de la esquina siempre decia "Reportar" y mandaba a /login aunque
 * hubiera sesion abierta, y ademas el perfil y el panel no tenian cabecera propia.
 * Aqui vive una sola vez: muestra "Reportar" sin sesion y "Cerrar sesion" con
 * sesion, y expone el contador de notificaciones sin leer (HU-19/HU-38b).
 *
 * La variante controla los enlaces de ancla de la landing. Fuera de ella solo se
 * muestran accesos reales (perfil, admin, guia), para no ofrecer saltos que no
 * existen en esas paginas.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css',
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  readonly variante = input<'landing' | 'app'>('app');

  protected readonly authService = inject(AuthService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly webSocket = inject(WebSocketService);
  private readonly router = inject(Router);

  readonly sinLeer = this.notificacionService.noLeidas;
  readonly haySesion = computed(() => this.authService.usuarioActual() !== null);

  // Menu desplegable de la cabecera en pantallas pequenas.
  readonly menuAbierto = signal(false);

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
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  cerrarSesion(): void {
    this.cerrarMenu();
    this.authService.logout();
    this.notificacionService.limpiar();
    void this.router.navigate(['/']);
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
