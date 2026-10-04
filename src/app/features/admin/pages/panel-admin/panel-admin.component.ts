import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import {
  ClaveFiltro,
  FILTROS_REPORTE,
  filtroPorClave,
} from '../../../../shared/constants/filtros-reporte';
import { ROLES_VALIDOS } from '../../../../shared/constants/roles';
import { normalizarTipoCaso } from '../../../../shared/constants/tipos-caso';
import { Usuario } from '../../../../shared/models/usuario.model';
import { EstadoReporte, Reporte } from '../../../../shared/models/reporte.model';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [BackButtonComponent, FormsModule, TranslatePipe],
  templateUrl: './panel-admin.component.html',
  styleUrl: './panel-admin.component.css',
})
export class PanelAdminComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly reporteService = inject(ReporteService);
  private readonly translate = inject(TranslateService);

  usuarios = signal<Usuario[]>([]);
  reportes = signal<Reporte[]>([]);
  mensaje = signal('');

  // HU-23: roles que el panel ofrece al cambiar el de una cuenta.
  readonly roles = ROLES_VALIDOS;

  // El panel abre en la gestion de usuarios (HU-23) y reportes queda a un clic.
  // Las secciones se ocultan con [hidden] y no con @if: asi el DOM conserva el
  // filtro de HU-15 aunque la pestana no este visible, y sus pruebas siguen
  // encontrandolo sin tocarlas.
  readonly pestana = signal<'usuarios' | 'reportes'>('usuarios');

  // ============ HU15: filtrar reportes por estado ============
  readonly filtros = FILTROS_REPORTE;
  readonly filtroReporte = signal<ClaveFiltro>('TODOS');

  editandoUsuarioId = signal<number | null>(null);
  editandoReporteId = signal<number | null>(null);

  usuarioEdit = { nombre: '', email: '', telefono: '', rol: 'USUARIO' };
  reporteEdit = {
    idUsuario: 0,
    tipoCaso: '',
    descripcion: '',
    estado: 'PENDIENTE',
    fotoUrl: null as string | null,
    latitud: null as number | null,
    longitud: null as number | null,
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
    const { estados } = filtroPorClave(this.filtroReporte());

    this.reporteService.obtenerTodos(estados).subscribe({
      next: (data) => this.reportes.set(data),
      error: (err) =>
        this.mensaje.set(this.translate.t('admin.errorCargarReportes', { detalle: err.message })),
    });
  }

  // ============ HU15: cambiar el filtro recarga la tabla ============
  filtrarReportes(clave: ClaveFiltro): void {
    this.filtroReporte.set(clave);
    this.cancelarEdicion();
    this.cargarReportes();
  }

  etiquetaFiltro(clave: ClaveFiltro): string {
    return this.translate.t(`reportes.filtros.${clave}`);
  }

  // El valor interno (PENDIENTE, ADMIN, ...) se envia al backend; la etiqueta
  // visible sale del catalogo de strings.
  etiquetaEstado(estado: EstadoReporte): string {
    return this.translate.t(`shared.estados.${estado}`);
  }

  etiquetaRol(rol: string): string {
    return this.translate.t(`shared.roles.${rol}` as TranslationKey);
  }

  etiquetaTipoCaso(tipo: string): string {
    const canonico = normalizarTipoCaso(tipo);
    return this.translate.t(`shared.tiposCaso.${canonico}` as TranslationKey);
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
          this.translate.t('admin.errorActualizarUsuario', { detalle: err.message }),
        ),
    });
  }

  // ============ HU-23: eliminar una cuenta ============
  /** La cuenta con la que entraste no se puede borrar: el panel se quedaria sin acceso. */
  esLaPropiaCuenta(u: Usuario): boolean {
    return u.idUsuario === this.authService.obtenerIdUsuarioActual();
  }

  /**
   * El borrado se confirma en un modal propio y no con confirm() del navegador:
   * ese aviso no se puede estilar, no acepta acentos de la app y lo inyecta el
   * navegador encima de la pantalla.
   */
  readonly usuarioAEliminar = signal<Usuario | null>(null);

  abrirConfirmacionEliminar(u: Usuario): void {
    this.usuarioAEliminar.set(u);
  }

  cerrarConfirmacionEliminar(): void {
    this.usuarioAEliminar.set(null);
  }

  confirmarEliminarUsuario(): void {
    const usuario = this.usuarioAEliminar();
    if (!usuario) {
      return;
    }

    this.usuarioAEliminar.set(null);
    this.usuarioService.eliminar(usuario.idUsuario).subscribe({
      next: () => {
        this.mensaje.set(this.translate.t('admin.usuarioEliminado'));
        this.cancelarEdicion();
        this.cargarUsuarios();
      },
      error: (err) =>
        this.mensaje.set(this.translate.t('admin.errorEliminarUsuario', { detalle: err.message })),
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
      latitud: r.latitud ?? null,
      longitud: r.longitud ?? null,
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
          this.translate.t('admin.errorActualizarReporte', { detalle: err.message }),
        ),
    });
  }

  cancelarEdicion(): void {
    this.editandoUsuarioId.set(null);
    this.editandoReporteId.set(null);
  }
}
