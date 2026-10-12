import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import { AuthService } from '../../../../core/services/auth.service';
import { DecisionSolicitud, SolicitudService } from '../../../../core/services/solicitud.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { esGestorDeReportes } from '../../../../shared/constants/roles';
import { normalizarTipoCaso } from '../../../../shared/constants/tipos-caso';
import { Reporte } from '../../../../shared/models/reporte.model';

/**
 * HU-19: el voluntario revisa los casos pendientes de aprobación, los aprueba
 * o rechaza dejando una nota, y el backend notifica al dueño del reporte.
 */
@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [FormsModule, DatePipe, BackButtonComponent, TranslatePipe],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.css',
})
export class SolicitudesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly solicitudService = inject(SolicitudService);
  private readonly translate = inject(TranslateService);

  readonly solicitudes = signal<Reporte[]>([]);
  readonly cargando = signal(true);
  readonly mensaje = signal('');
  readonly mensajeEsError = signal(false);

  // Solicitud abierta en el modal de revisión
  readonly seleccionada = signal<Reporte | null>(null);
  readonly nota = signal('');
  readonly errorNota = signal('');
  readonly enviando = signal(false);

  ngOnInit(): void {
    if (!this.esRevisor()) {
      this.cargando.set(false);
      return;
    }
    this.cargarPendientes();
  }

  // La misma regla que aplica el perfil (puedeRevisar) y el guard de la ruta,
  // resuelta con el predicado compartido de shared/constants/roles.
  esRevisor(): boolean {
    return esGestorDeReportes(this.authService.usuarioActual()?.rol);
  }

  etiquetaTipoCaso(tipo: string): string {
    const canonico = normalizarTipoCaso(tipo);
    return this.translate.t(`shared.tiposCaso.${canonico}` as TranslationKey);
  }

  cargarPendientes(): void {
    const idRevisor = this.authService.obtenerIdUsuarioActual();
    if (idRevisor === null) {
      this.cargando.set(false);
      return;
    }

    this.cargando.set(true);
    this.solicitudService.obtenerPendientes(idRevisor).subscribe({
      next: (lista) => {
        this.solicitudes.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.mostrarMensaje(this.translate.t('solicitudes.errorCargar'), true);
        this.cargando.set(false);
      },
    });
  }

  revisar(reporte: Reporte): void {
    this.seleccionada.set(reporte);
    this.nota.set('');
    this.errorNota.set('');
  }

  cerrar(): void {
    if (this.enviando()) {
      return;
    }
    this.seleccionada.set(null);
    this.nota.set('');
    this.errorNota.set('');
  }

  decidir(decision: DecisionSolicitud): void {
    const reporte = this.seleccionada();
    const idRevisor = this.authService.obtenerIdUsuarioActual();
    if (!reporte || idRevisor === null || this.enviando()) {
      return;
    }

    const nota = this.nota().trim();
    if (decision === 'RECHAZAR' && !nota) {
      this.errorNota.set(this.translate.t('solicitudes.notaObligatoria'));
      return;
    }

    this.enviando.set(true);
    this.errorNota.set('');

    this.solicitudService.decidir(reporte.idReporte, { idRevisor, decision, nota }).subscribe({
      next: () => {
        this.enviando.set(false);
        this.quitarDeLaLista(reporte.idReporte);
        this.seleccionada.set(null);
        this.mostrarMensaje(
          this.translate.t(
            decision === 'APROBAR' ? 'solicitudes.aprobada' : 'solicitudes.rechazada',
            { id: reporte.idReporte },
          ),
          false,
        );
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.manejarError(err);
      },
    });
  }

  private manejarError(err: HttpErrorResponse): void {
    if (err.status === 409 || err.status === 404) {
      // Alguien más ya resolvió este caso: se refresca la lista.
      this.seleccionada.set(null);
      this.mostrarMensaje(this.translate.t('solicitudes.errorYaRevisada'), true);
      this.cargarPendientes();
      return;
    }
    if (err.status === 403) {
      this.errorNota.set(this.translate.t('solicitudes.errorSinPermiso'));
      return;
    }
    this.errorNota.set(this.translate.t('solicitudes.errorDecidir'));
  }

  private quitarDeLaLista(idReporte: number): void {
    this.solicitudes.update((lista) => lista.filter((s) => s.idReporte !== idReporte));
  }

  private mostrarMensaje(texto: string, esError: boolean): void {
    this.mensaje.set(texto);
    this.mensajeEsError.set(esError);
  }
}
