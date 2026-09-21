import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ReporteService } from '../../../../core/services/reporte.service';

import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { Usuario } from '../../../../shared/models/usuario.model';
import { Reporte } from '../../../../shared/models/reporte.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BackButtonComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly reporteService = inject(ReporteService);

  readonly usuario = signal<Usuario | null>(null);
  readonly reportes = signal<Reporte[]>([]);
  readonly cargandoPerfil = signal(true);
  readonly cargandoReportes = signal(true);
  readonly error = signal('');
  readonly reporteSeleccionado = signal<Reporte | null>(null);

  // ============ HU13: actualizar estado ============
  readonly estadosValidos = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CANCELADO'];
  readonly nuevoEstado = signal<string>('');
  readonly guardandoEstado = signal(false);
  readonly mensajeEstado = signal('');

  ngOnInit(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();

    if (!idUsuario) {
      this.error.set('No hay una sesión activa.');
      this.cargandoPerfil.set(false);
      this.cargandoReportes.set(false);
      return;
    }

    this.usuarioService.obtenerPorId(idUsuario).subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
        this.cargandoPerfil.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar tu información de perfil.');
        this.cargandoPerfil.set(false);
      },
    });

    this.reporteService.obtenerMisReportes(idUsuario).subscribe((reportes) => {
      this.reportes.set(reportes);
      this.cargandoReportes.set(false);
    });
  }

  iniciales(nombre: string | undefined): string {
    if (!nombre) return '?';
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  claseEstado(estado: string): string {
    return `estado estado-${estado.toLowerCase()}`;
  }

  verDetalle(reporte: Reporte): void {
    this.reporteSeleccionado.set(reporte);
    this.nuevoEstado.set(reporte.estado);
    this.mensajeEstado.set('');
  }

  cerrarDetalle(): void {
    this.reporteSeleccionado.set(null);
    this.nuevoEstado.set('');
    this.mensajeEstado.set('');
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // ============ HU13: solo voluntarios y admins pueden cambiar el estado ============
  puedeCambiarEstado(): boolean {
    const rol = this.usuario()?.rol;
    return rol === 'VOLUNTARIO' || rol === 'ADMIN';
  }

  actualizarEstado(): void {
    const reporte = this.reporteSeleccionado();
    if (!reporte) return;

    if (!this.nuevoEstado() || this.nuevoEstado() === reporte.estado) {
      this.mensajeEstado.set('Selecciona un estado diferente al actual.');
      return;
    }

    this.guardandoEstado.set(true);
    this.mensajeEstado.set('');

    this.reporteService
      .actualizar(reporte.idReporte, {
        idUsuario: reporte.idUsuario,
        tipoCaso: reporte.tipoCaso,
        descripcion: reporte.descripcion,
        estado: this.nuevoEstado(),
        fotoUrl: reporte.fotoUrl,
      })
      .subscribe({
        next: (actualizado) => {
          this.guardandoEstado.set(false);
          this.mensajeEstado.set('✅ Estado actualizado correctamente.');

          // Reflejar el cambio en la lista de reportes
          this.reportes.update((lista) =>
            lista.map((r) => (r.idReporte === actualizado.idReporte ? actualizado : r))
          );

          // Reflejar el cambio en el modal abierto
          this.reporteSeleccionado.set(actualizado);
        },
        error: (err) => {
          this.guardandoEstado.set(false);
          this.mensajeEstado.set(
            '❌ No se pudo actualizar el estado. ' +
              (err.status === 403
                ? 'No tienes permisos para realizar esta acción.'
                : 'Inténtalo de nuevo.')
          );
        },
      });
  }
}