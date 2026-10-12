import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { Notificacion } from '../../models/notificacion.model';

/**
 * HU-19: bandeja de notificaciones del usuario con sesión iniciada.
 * Se usa en el perfil para que el dueño de un reporte vea si fue aprobado o rechazado.
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

  readonly notificaciones = signal<Notificacion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly sinLeer = computed(() => this.notificaciones().filter((n) => !n.leida).length);

  ngOnInit(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();
    if (idUsuario === null) {
      this.cargando.set(false);
      return;
    }

    this.notificacionService.obtenerDeUsuario(idUsuario).subscribe({
      next: (lista) => {
        this.notificaciones.set(lista);
        this.cargando.set(false);
      },
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
      next: (actualizada) =>
        this.notificaciones.update((lista) =>
          lista.map((n) => (n.idNotificacion === actualizada.idNotificacion ? actualizada : n)),
        ),
      error: () => this.error.set(this.translate.t('notificaciones.errorCargar')),
    });
  }

  claseTipo(notificacion: Notificacion): string {
    return notificacion.tipo === 'SOLICITUD_RECHAZADA' ? 'notif-rechazada' : 'notif-aprobada';
  }
}
