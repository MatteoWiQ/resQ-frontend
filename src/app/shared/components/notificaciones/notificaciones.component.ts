import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { Notificacion } from '../../models/notificacion.model';

/**
 * HU-19/HU-37: bandeja de notificaciones del usuario con sesion iniciada.
 *
 * Se usa en el perfil y en /notificaciones. Ademas de leer, permite volver a
 * marcarlas como no leidas, archivarlas y abrir el caso o la solicitud que las
 * origino.
 */
@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [DatePipe, TranslatePipe],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css',
})
export class NotificacionesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  readonly notificaciones = this.notificacionService.notificaciones;
  readonly sinLeer = this.notificacionService.noLeidas;
  readonly cargando = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();
    if (idUsuario === null) {
      this.cargando.set(false);
      return;
    }

    this.notificacionService.cargar(idUsuario).subscribe({
      next: () => this.cargando.set(false),
      error: () => {
        this.error.set(this.translate.t('notificaciones.errorCargar'));
        this.cargando.set(false);
      },
    });
  }

  marcarComoLeida(notificacion: Notificacion): void {
    if (notificacion.leida) {
      return;
    }

    this.notificacionService.marcarComoLeida(notificacion.idNotificacion).subscribe({
      error: () => this.error.set(this.translate.t('notificaciones.errorAccion')),
    });
  }

  marcarComoNoLeida(notificacion: Notificacion): void {
    if (!notificacion.leida) {
      return;
    }

    this.notificacionService.marcarComoNoLeida(notificacion.idNotificacion).subscribe({
      error: () => this.error.set(this.translate.t('notificaciones.errorAccion')),
    });
  }

  archivar(notificacion: Notificacion): void {
    this.notificacionService.archivar(notificacion.idNotificacion).subscribe({
      error: () => this.error.set(this.translate.t('notificaciones.errorAccion')),
    });
  }

  /** Lleva al caso, la solicitud o el chat que origino el aviso. */
  abrir(notificacion: Notificacion): void {
    if (!notificacion.leida) {
      this.marcarComoLeida(notificacion);
    }

    if (!notificacion.idReporte && notificacion.idSolicitud && this.authService.esAdmin()) {
      void this.router.navigate(['/admin/solicitudes-voluntarios']);
      return;
    }

    const queryParams: Record<string, number> = {};
    if (notificacion.idReporte) {
      queryParams['reporte'] = notificacion.idReporte;
    } else if (notificacion.idSolicitud) {
      queryParams['solicitud'] = notificacion.idSolicitud;
    }

    void this.router.navigate(['/perfil'], { queryParams });
  }

  claseTipo(notificacion: Notificacion): string {
    return notificacion.tipo.includes('RECHAZADA') ? 'notif-rechazada' : 'notif-aprobada';
  }
}
