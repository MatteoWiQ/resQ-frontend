import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { Usuario } from '../../../../shared/models/usuario.model';
import { Reporte } from '../../../../shared/models/reporte.model';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [BackButtonComponent, FormsModule, TranslatePipe],
  templateUrl: './panel-admin.component.html',
  styleUrl: './panel-admin.component.css',
})
export class PanelAdminComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly reporteService = inject(ReporteService);
  private readonly translate = inject(TranslateService);

  usuarios = signal<Usuario[]>([]);
  reportes = signal<Reporte[]>([]);
  mensaje = signal('');

  editandoUsuarioId = signal<number | null>(null);
  editandoReporteId = signal<number | null>(null);

  usuarioEdit = { nombre: '', email: '', telefono: '', rol: 'USUARIO' };
  reporteEdit = {
    idUsuario: 0,
    tipoCaso: '',
    descripcion: '',
    estado: 'PENDIENTE',
    fotoUrl: null as string | null,
  };

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarReportes();
  }

  cargarUsuarios(): void {
    this.usuarioService.obtenerTodos().subscribe({
      next: (data) => this.usuarios.set(data),
      error: (err) =>
        this.mensaje.set(this.translate.t('admin.errorCargarUsuarios', { detalle: err.message })),
    });
  }

  cargarReportes(): void {
    this.reporteService.obtenerTodos().subscribe({
      next: (data) => this.reportes.set(data),
      error: (err) =>
        this.mensaje.set(this.translate.t('admin.errorCargarReportes', { detalle: err.message })),
    });
  }

  editarUsuario(u: Usuario): void {
    this.editandoUsuarioId.set(u.idUsuario);
    this.editandoReporteId.set(null);
    this.usuarioEdit = {
      nombre: u.nombre,
      email: u.email,
      telefono: u.telefono,
      rol: u.rol,
    };
  }

  guardarUsuario(id: number): void {
    this.usuarioService.actualizar(id, this.usuarioEdit).subscribe({
      next: () => {
        this.mensaje.set(this.translate.t('admin.usuarioActualizado'));
        this.cancelarEdicion();
        this.cargarUsuarios();
      },
      error: (err) =>
        this.mensaje.set(
          this.translate.t('admin.errorActualizarUsuario', { detalle: err.message })
        ),
    });
  }

  editarReporte(r: Reporte): void {
    this.editandoReporteId.set(r.idReporte);
    this.editandoUsuarioId.set(null);
    this.reporteEdit = {
      idUsuario: r.idUsuario,
      tipoCaso: r.tipoCaso,
      descripcion: r.descripcion,
      estado: r.estado,
      fotoUrl: r.fotoUrl,
    };
  }

  guardarReporte(id: number): void {
    this.reporteService.actualizar(id, this.reporteEdit).subscribe({
      next: () => {
        this.mensaje.set(this.translate.t('admin.reporteActualizado'));
        this.cancelarEdicion();
        this.cargarReportes();
      },
      error: (err) =>
        this.mensaje.set(
          this.translate.t('admin.errorActualizarReporte', { detalle: err.message })
        ),
    });
  }

  cancelarEdicion(): void {
    this.editandoUsuarioId.set(null);
    this.editandoReporteId.set(null);
  }
}