import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  SolicitudVoluntarioDetalle,
  SolicitudVoluntarioResumen,
  SolicitudVoluntarioService,
} from '../../../../core/services/solicitud-voluntario.service';

/**
 * HU-35: el administrador revisa las solicitudes pendientes de voluntarios.
 * Lista + detalle inline; aprobar o rechazar (motivo obligatorio).
 */
@Component({
  selector: 'app-solicitudes-voluntarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './solicitudes-voluntarios.component.html',
  styleUrl: './solicitudes-voluntarios.component.css',
})
export class SolicitudesVoluntariosComponent implements OnInit {
  readonly cargando = signal(true);
  readonly procesando = signal(false);
  readonly error = signal<string | null>(null);
  readonly solicitudes = signal<SolicitudVoluntarioResumen[]>([]);
  readonly seleccionada = signal<SolicitudVoluntarioDetalle | null>(null);
  readonly modalRechazoAbierto = signal(false);
  readonly motivoRechazo = signal('');
  readonly toast = signal<string | null>(null);

  readonly sinSolicitudes = computed(
    () => !this.cargando() && this.solicitudes().length === 0,
  );
  readonly motivoInvalido = computed(
    () => this.motivoRechazo().trim().length === 0 || this.motivoRechazo().length > 500,
  );

  constructor(private readonly service: SolicitudVoluntarioService) {}

  ngOnInit(): void {
    this.cargarPendientes();
  }

  cargarPendientes(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.service.listarPendientes().subscribe({
      next: (lista) => {
        this.solicitudes.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las solicitudes.');
        this.cargando.set(false);
      },
    });
  }

  verDetalle(id: number): void {
    this.service.obtenerDetalle(id).subscribe({
      next: (detalle) => this.seleccionada.set(detalle),
      error: () => this.error.set('No se pudo cargar el detalle.'),
    });
  }

  cerrarDetalle(): void {
    this.seleccionada.set(null);
  }

  aprobar(): void {
    const actual = this.seleccionada();
    if (!actual || this.procesando()) return;
    this.procesando.set(true);
    this.service.aprobar(actual.idSolicitud).subscribe({
      next: () => this.trasResolucion('Solicitud aprobada. El usuario ahora es voluntario.'),
      error: () => this.falloResolucion(),
    });
  }

  abrirRechazo(): void {
    this.motivoRechazo.set('');
    this.modalRechazoAbierto.set(true);
  }

  cancelarRechazo(): void {
    this.modalRechazoAbierto.set(false);
  }

  confirmarRechazo(): void {
    const actual = this.seleccionada();
    if (!actual || this.procesando() || this.motivoInvalido()) return;
    this.procesando.set(true);
    this.service.rechazar(actual.idSolicitud, this.motivoRechazo().trim()).subscribe({
      next: () => {
        this.modalRechazoAbierto.set(false);
        this.trasResolucion('Solicitud rechazada. Se notificó al usuario.');
      },
      error: () => this.falloResolucion(),
    });
  }

  private trasResolucion(mensaje: string): void {
    this.procesando.set(false);
    this.seleccionada.set(null);
    this.toast.set(mensaje);
    this.cargarPendientes();
    setTimeout(() => this.toast.set(null), 4000);
  }

  private falloResolucion(): void {
    this.procesando.set(false);
    this.error.set('No se pudo procesar la resolución.');
  }
}
