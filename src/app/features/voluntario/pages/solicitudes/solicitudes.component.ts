import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { Reporte } from '../../../../shared/models/reporte.model';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule, BackButtonComponent],
  template: `
    <section class="solicitudes-page">
      <app-back-button ruta="/" />

      <div class="solicitudes-card">
        <h1>Solicitudes pendientes</h1>
        <p class="subtitle">Valida la información de los casos reportados por los usuarios.</p>

        @if (mensaje()) {
          <p class="mensaje">{{ mensaje() }}</p>
        }

        @if (!esVoluntario()) {
          <p class="error">No tienes permisos para ver esta sección.</p>
        } @else if (cargando()) {
          <p class="hint">Cargando solicitudes...</p>
        } @else if (solicitudes().length === 0) {
          <p class="hint">No hay solicitudes pendientes por revisar.</p>
        } @else {
          <ul class="solicitudes-lista">
            @for (s of solicitudes(); track s.idReporte) {
              <li class="solicitud-item">
                <div class="solicitud-info">
                  <strong>{{ s.tipoCaso }}</strong>
                  <p>{{ s.descripcion }}</p>
                  <small>Reporte #{{ s.idReporte }} · {{ s.fechaCreacion | date:'short' }}</small>
                </div>
                <div class="solicitud-acciones">
                  <button class="btn aceptar" (click)="aceptar(s)">Aceptar</button>
                  <button class="btn rechazar" (click)="abrirRechazo(s)">Rechazar</button>
                </div>
              </li>
            }
          </ul>
        }
      </div>

      @if (reporteARechazar(); as r) {
        <div class="modal-overlay" (click)="cerrarRechazo()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h3>Rechazar solicitud #{{ r.idReporte }}</h3>
            <label for="nota">Motivo del rechazo (opcional)</label>
            <textarea
              id="nota"
              [ngModel]="notaRechazo()"
              (ngModelChange)="notaRechazo.set($event)"
              rows="3"
              placeholder="Explica brevemente por qué se rechaza..."
            ></textarea>
            <div class="modal-acciones">
              <button class="btn cancelar" (click)="cerrarRechazo()">Cancelar</button>
              <button class="btn rechazar" (click)="confirmarRechazo()">Confirmar rechazo</button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .solicitudes-page { max-width: 900px; margin: 0 auto; padding: 24px; }
    .solicitudes-card {
      background: var(--panel); border: 1px solid var(--border);
      border-radius: 20px; padding: 28px; box-shadow: 0 20px 30px var(--shadow);
    }
    h1 { margin: 0 0 4px; color: var(--text); font-family: 'Poppins', sans-serif; }
    .subtitle { margin: 0 0 20px; color: var(--muted); }
    .mensaje {
      background: #e8f5e9; color: #2e7d32; padding: 10px 14px;
      border-radius: 10px; margin-bottom: 16px; font-weight: 500;
    }
    .error { color: #c62828; font-weight: 500; }
    .hint { color: var(--muted); }
    .solicitudes-lista {
      list-style: none; padding: 0; margin: 0;
      display: flex; flex-direction: column; gap: 12px;
    }
    .solicitud-item {
      display: flex; justify-content: space-between; align-items: center;
      gap: 16px; padding: 16px; border: 1px solid var(--border); border-radius: 14px;
    }
    .solicitud-info strong { color: var(--text); }
    .solicitud-info p { margin: 4px 0; color: var(--muted); font-size: 0.9rem; }
    .solicitud-info small { color: var(--muted); font-size: 0.75rem; }
    .solicitud-acciones { display: flex; gap: 8px; flex-shrink: 0; }
    .btn {
      border: 0; padding: 8px 14px; border-radius: 8px; cursor: pointer;
      font-weight: 500; font-family: inherit; font-size: 0.85rem;
    }
    .btn.aceptar { background: #2e7d32; color: #fff; }
    .btn.rechazar { background: #c62828; color: #fff; }
    .btn.cancelar { background: #999; color: #fff; }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: grid; place-items: center; z-index: 100;
    }
    .modal {
      background: var(--panel); border-radius: 16px; padding: 24px;
      width: min(500px, 90vw); display: flex; flex-direction: column; gap: 12px;
    }
    .modal h3 { margin: 0; color: var(--text); }
    .modal label { font-weight: 500; color: var(--text); font-size: 0.9rem; }
    .modal textarea {
      padding: 10px; border-radius: 8px; border: 1px solid var(--border);
      font-family: inherit; resize: vertical;
    }
    .modal-acciones { display: flex; justify-content: flex-end; gap: 8px; }
  `],
})
export class SolicitudesComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly reporteService = inject(ReporteService);

  readonly solicitudes = signal<Reporte[]>([]);
  readonly cargando = signal(true);
  readonly mensaje = signal('');
  readonly reporteARechazar = signal<Reporte | null>(null);
  readonly notaRechazo = signal('');

  ngOnInit(): void {
    if (!this.esVoluntario()) {
      this.cargando.set(false);
      return;
    }

    this.reporteService.obtenerTodos('PENDIENTE').subscribe({
      next: (data) => {
        this.solicitudes.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.mensaje.set('❌ No se pudieron cargar las solicitudes.');
        this.cargando.set(false);
      },
    });
  }

  esVoluntario(): boolean {
    const rol = this.authService.usuarioActual()?.rol;
    return rol === 'VOLUNTARIO' || rol === 'ADMIN';
  }

  aceptar(reporte: Reporte): void {
    this.actualizarEstado(reporte, 'EN_PROCESO', '✅ Solicitud aceptada correctamente.');
  }

  abrirRechazo(reporte: Reporte): void {
    this.reporteARechazar.set(reporte);
    this.notaRechazo.set('');
  }

  cerrarRechazo(): void {
    this.reporteARechazar.set(null);
    this.notaRechazo.set('');
  }

  confirmarRechazo(): void {
    const reporte = this.reporteARechazar();
    if (!reporte) return;

    const nota = this.notaRechazo().trim();
    const mensajeFinal = nota
      ? `✅ Solicitud rechazada. Nota: ${nota}`
      : '✅ Solicitud rechazada.';

    this.actualizarEstado(reporte, 'CANCELADO', mensajeFinal);
    this.cerrarRechazo();
  }

  private actualizarEstado(reporte: Reporte, nuevoEstado: string, mensajeOk: string): void {
    this.reporteService
      .actualizar(reporte.idReporte, {
        idUsuario: reporte.idUsuario,
        tipoCaso: reporte.tipoCaso,
        descripcion: reporte.descripcion,
        estado: nuevoEstado,
        fotoUrl: reporte.fotoUrl,
        latitud: reporte.latitud,
        longitud: reporte.longitud,
      })
      .subscribe({
        next: () => {
          this.mensaje.set(mensajeOk);
          this.solicitudes.update((lista) =>
            lista.filter((s) => s.idReporte !== reporte.idReporte)
          );
        },
        error: () => {
          this.mensaje.set('❌ No se pudo actualizar la solicitud. Inténtalo de nuevo.');
        },
      });
  }
}