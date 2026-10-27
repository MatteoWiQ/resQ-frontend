import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { SolicitudVoluntarioService } from '../../../../core/services/solicitud-voluntario.service';
import { FeatureToggleService } from '../../../../core/services/feature-toggle.service';

import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { NotificacionesComponent } from '../../../../shared/components/notificaciones/notificaciones.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import { esAdmin as comprobarAdmin, esGestorDeReportes, esVoluntario as comprobarVoluntario } from '../../../../shared/constants/roles';
import { normalizarTipoCaso } from '../../../../shared/constants/tipos-caso';
import { Usuario } from '../../../../shared/models/usuario.model';
import { Reporte } from '../../../../shared/models/reporte.model';
import { TIPOS_AYUDA_VALORES } from '../../../../shared/models/voluntario.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BackButtonComponent, AppHeaderComponent, NotificacionesComponent, TranslatePipe, FeatureToggleDirective],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly reporteService = inject(ReporteService);
  private readonly solicitudVoluntarioService = inject(SolicitudVoluntarioService);
  private readonly featureToggle = inject(FeatureToggleService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  readonly mostrarConfiguracion = signal(this.featureToggle.isEnabled('enableLanguageInProfile'));

  readonly usuario = signal<Usuario | null>(null);
  readonly reportes = signal<Reporte[]>([]);
  readonly cargandoPerfil = signal(true);
  readonly cargandoReportes = signal(true);
  readonly error = signal('');
  readonly reporteSeleccionado = signal<Reporte | null>(null);

  // ============ HU-13: actualizar estado ============
  readonly estadosValidos = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CANCELADO'];
  readonly nuevoEstado = signal<string>('');
  readonly guardandoEstado = signal(false);
  readonly mensajeEstado = signal('');

  // ============ HU-17: registrarse / editar como voluntario ============
  readonly tiposAyudaDisponibles = TIPOS_AYUDA_VALORES;
  readonly mostrarModalVoluntario = signal(false);
  readonly tiposSeleccionados = signal<string[]>([]);
  readonly enviandoVoluntario = signal(false);
  readonly errorVoluntario = signal('');
  // HU-35: la solicitud queda pendiente de revision por el administrador.
  readonly solicitudEnviada = signal(false);

  ngOnInit(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();

    if (!idUsuario) {
      this.error.set(this.translate.t('perfil.sinSesion'));
      this.cargandoPerfil.set(false);
      this.cargandoReportes.set(false);
      return;
    }

    this.usuarioService.obtenerPorId(idUsuario).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
        this.cargandoPerfil.set(false);
      },
      error: () => {
        this.error.set(this.translate.t('perfil.errorCargarPerfil'));
        this.cargandoPerfil.set(false);
      },
    });

    this.reporteService
      .obtenerMisReportes(idUsuario)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((reportes) => {
        this.reportes.set(reportes);
        this.cargandoReportes.set(false);
        this.abrirReporteDesdeUrl();
      });
  }

  private abrirReporteDesdeUrl(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('reporte'));
    if (!Number.isFinite(id) || id <= 0) {
      return;
    }
    const reporte = this.reportes().find((r) => r.idReporte === id);
    if (reporte) {
      this.verDetalle(reporte);
    }
  }

  iniciales(nombre: string | undefined): string {
    const valor = nombre;
    if (!valor) return '?';
    return valor
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  claseEstado(estado: string): string {
    return `estado estado-${estado.toLowerCase()}`;
  }

  // El valor interno (PENDIENTE, ADMIN, ...) va al backend; la etiqueta
  // visible sale del catalogo de strings.
  etiquetaEstado(estado: string): string {
    return this.translate.t(`shared.estados.${estado}` as TranslationKey);
  }

  etiquetaRol(rol: string): string {
    return this.translate.t(`shared.roles.${rol}` as TranslationKey);
  }

  // Normaliza lo que llega del backend (minusculas, espacios) y traduce si
  // existe en el catalogo; si no, muestra el valor original.
  etiquetaTipoCaso(tipo: string): string {
    const canonico = normalizarTipoCaso(tipo);
    return this.translate.t(`shared.tiposCaso.${canonico}` as TranslationKey);
  }

  // ============ HU-19: estado de la revisión del caso ============
  claseRevision(estado: string): string {
    return `estado estado-revision-${estado.toLowerCase()}`;
  }

  etiquetaRevision(estado: string): string {
    return this.translate.t(`shared.estadosRevision.${estado}` as TranslationKey);
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

  // ============ HU-13: solo voluntarios y admins pueden cambiar el estado ============
  // La regla vive en shared/constants/roles: aca no se compara el rol a mano, que
  // es lo que hacia que un ADMIN en minusculas no le vieran las acciones.
  puedeCambiarEstado(): boolean {
    return esGestorDeReportes(this.usuario()?.rol);
  }

  // ============ HU-19: mismos roles que pueden cambiar el estado (HU-13) ============
  // Nombre propio para que el template diga que es lo que habilita esta vista,
  // aunque la regla underneath sea la misma.
  puedeRevisar(): boolean {
    return esGestorDeReportes(this.usuario()?.rol);
  }

  actualizarEstado(): void {
    const reporte = this.reporteSeleccionado();
    if (!reporte) return;

    if (!this.nuevoEstado() || this.nuevoEstado() === reporte.estado) {
      this.mensajeEstado.set(this.translate.t('perfil.estado.errorDistinto'));
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
        latitud: reporte.latitud,
        longitud: reporte.longitud,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizado) => {
          this.guardandoEstado.set(false);
          this.mensajeEstado.set(this.translate.t('perfil.estado.ok'));

          this.reportes.update((lista) =>
            lista.map((r) => (r.idReporte === actualizado.idReporte ? actualizado : r))
          );

          this.reporteSeleccionado.set(actualizado);
        },
        error: (err) => {
          this.guardandoEstado.set(false);
          const detalle =
            err.status === 403
              ? this.translate.t('perfil.estado.sinPermisos')
              : this.translate.t('perfil.estado.reintentar');
          this.mensajeEstado.set(this.translate.t('perfil.estado.errorBase') + detalle);
        },
      });
  }

  // ============ HU-23: el administrador accede al panel desde su perfil ============
  esAdmin(): boolean {
    return comprobarAdmin(this.usuario()?.rol);
  }

  // ============ HU-17 ============

  esVoluntario(usuario: Usuario): boolean {
    return comprobarVoluntario(usuario.rol);
  }

  etiquetaTipoAyuda(valor: string): string {
    return this.translate.t(('voluntario.tipos.' + valor) as TranslationKey);
  }

  tituloModalVoluntario(): string {
    const usuario = this.usuario();
    const key =
      usuario && this.esVoluntario(usuario)
        ? 'voluntario.modalTituloEditar'
        : 'voluntario.modalTituloRegistro';
    return this.translate.t(key as TranslationKey);
  }

  abrirModalVoluntario(): void {
    const usuario = this.usuario();
    this.tiposSeleccionados.set(
      usuario && this.esVoluntario(usuario) ? [...usuario.tiposAyuda] : []
    );
    this.errorVoluntario.set('');
    this.mostrarModalVoluntario.set(true);
  }

  cerrarModalVoluntario(): void {
    this.mostrarModalVoluntario.set(false);
  }

  toggleTipoAyuda(valor: string): void {
    const actuales = this.tiposSeleccionados();
    this.tiposSeleccionados.set(
      actuales.includes(valor) ? actuales.filter((v) => v !== valor) : [...actuales, valor]
    );
  }

  confirmarVoluntario(): void {
    const usuario = this.usuario();
    if (!usuario) {
      return;
    }

    if (this.tiposSeleccionados().length === 0) {
      this.errorVoluntario.set(this.translate.t('voluntario.errorSeleccion'));
      return;
    }

    this.enviandoVoluntario.set(true);
    this.errorVoluntario.set('');

    if (this.esVoluntario(usuario)) {
      // Quien ya es voluntario solo edita sus tipos de ayuda (HU-17).
      this.usuarioService
        .actualizarTiposAyuda(usuario.idUsuario, this.tiposSeleccionados())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (usuarioActualizado) => {
            this.usuario.set(usuarioActualizado);
            this.enviandoVoluntario.set(false);
            this.cerrarModalVoluntario();
          },
          error: (error: HttpErrorResponse) => {
            this.enviandoVoluntario.set(false);
            this.errorVoluntario.set(
              error.error?.message ?? this.translate.t('voluntario.errorGenerico')
            );
          },
        });
      return;
    }

    // HU-35: el usuario envía una solicitud que el administrador aprueba o rechaza.
    this.solicitudVoluntarioService
      .crear(this.tiposSeleccionados().join(','))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.enviandoVoluntario.set(false);
          this.cerrarModalVoluntario();
          this.solicitudEnviada.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.enviandoVoluntario.set(false);
          if (error.status === 409) {
            this.errorVoluntario.set(
              error.error?.message ?? 'No puedes enviar una nueva solicitud todavía'
            );
            this.cerrarModalVoluntario();
          } else {
            this.errorVoluntario.set(
              error.error?.message ?? this.translate.t('voluntario.errorGenerico')
            );
          }
        },
      });
  }
}