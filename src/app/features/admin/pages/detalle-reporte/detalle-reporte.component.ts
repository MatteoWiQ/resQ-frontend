import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { ReporteService } from '../../../../core/services/reporte.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import { estadosSiguientes } from '../../../../shared/constants/gestion-reportes';
import { normalizarTipoCaso } from '../../../../shared/constants/tipos-caso';
import { Usuario } from '../../../../shared/models/usuario.model';
import { EstadoReporte, EstadoRevision, Reporte } from '../../../../shared/models/reporte.model';

/**
 * HU-24: detalle de un reporte para el administrador.
 *
 * Es una pagina propia y no un modal del panel porque el caso se puede abrir en
 * una pestaña aparte para revisarlo con calma, y porque las acciones
 * administrativas (cambiar el estado, eliminar) necesitan espacio para explicar
 * que van a hacer.
 *
 * La ruta que la abre lleva adminGuard, asi que un usuario que no es
 * administrador nunca llega hasta aqui.
 */
@Component({
  selector: 'app-detalle-reporte',
  imports: [BackButtonComponent, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './detalle-reporte.component.html',
  styleUrl: './detalle-reporte.component.css',
})
export class DetalleReporteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reporteService = inject(ReporteService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly translate = inject(TranslateService);

  readonly reporte = signal<Reporte | null>(null);
  readonly autor = signal<Usuario | null>(null);
  readonly cargando = signal(true);
  readonly noEncontrado = signal(false);
  readonly mensaje = signal('');
  readonly error = signal('');
  readonly confirmandoEliminar = signal(false);
  readonly guardandoEstado = signal(false);

  readonly nuevoEstado = signal<EstadoReporte | ''>('');

  /** Los destinos validos los decide el backend; la lista es solo para no ofrecerlos. */
  readonly estadosDisponibles = computed<EstadoReporte[]>(() => {
    const reporte = this.reporte();
    return reporte ? estadosSiguientes(reporte.estado) : [];
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.noEncontrado.set(true);
      this.cargando.set(false);
      return;
    }

    this.reporteService.obtenerPorId(id).subscribe({
      next: (reporte) => {
        this.reporte.set(reporte);
        this.nuevoEstado.set('');
        this.cargando.set(false);
        this.cargarAutor(reporte.idUsuario);
      },
      error: (err) => {
        this.cargando.set(false);
        if (err?.status === 404) {
          this.noEncontrado.set(true);
          return;
        }
        this.error.set(this.translate.t('admin.detalle.errorCargar', { detalle: err.message }));
      },
    });
  }

  /**
   * El reporte guarda solo el id de quien lo publico, asi que el autor se resuelve
   * aparte. Si la cuenta ya no existe se muestra el caso igual: el detalle del
   * reporte no puede desaparecer por un dato del autor.
   */
  private cargarAutor(idUsuario: number): void {
    this.usuarioService.obtenerPorId(idUsuario).subscribe({
      next: (usuario) => this.autor.set(usuario),
      error: () => this.autor.set(null),
    });
  }

  etiquetaEstado(estado: EstadoReporte): string {
    return this.translate.t(`shared.estados.${estado}`);
  }

  etiquetaTipoCaso(tipo: string): string {
    return this.translate.t(`shared.tiposCaso.${normalizarTipoCaso(tipo)}` as TranslationKey);
  }

  claseEstado(estado: EstadoReporte): string {
    return `estado estado-${estado.toLowerCase()}`;
  }

  /**
   * HU-19: el administrador ve en que quedo la revision del caso. Las etiquetas
   * salen del catalogo compartido (shared.estadosRevision) porque el mismo
   * estado_revision lo muestra tambien el perfil del ciudadano.
   */
  etiquetaRevision(estado: EstadoRevision): string {
    return this.translate.t(`shared.estadosRevision.${estado}` as TranslationKey);
  }

  claseRevision(estado: EstadoRevision): string {
    return `estado estado-revision-${estado.toLowerCase()}`;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  coordenadas(reporte: Reporte): string {
    if (reporte.latitud == null || reporte.longitud == null) {
      return '';
    }
    return `${reporte.latitud}, ${reporte.longitud}`;
  }

  puedeConfirmarEstado(): boolean {
    return Boolean(this.nuevoEstado()) && this.nuevoEstado() !== this.reporte()?.estado;
  }

  confirmarCambioEstado(): void {
    const reporte = this.reporte();
    const destino = this.nuevoEstado();

    if (!reporte || !destino || destino === reporte.estado) {
      this.error.set(this.translate.t('admin.cambioEstado.sinCambio'));
      return;
    }

    this.guardandoEstado.set(true);
    this.mensaje.set('');
    this.error.set('');

    this.reporteService.cambiarEstado(reporte.idReporte, destino).subscribe({
      next: (actualizado) => {
        this.guardandoEstado.set(false);
        this.reporte.set(actualizado);
        this.nuevoEstado.set('');
        this.mensaje.set(this.translate.t('admin.cambioEstado.ok'));
      },
      error: (err) => {
        this.guardandoEstado.set(false);
        this.error.set(
          this.translate.t('admin.cambioEstado.error', { detalle: err?.error?.message ?? err.message }),
        );
      },
    });
  }

  confirmarEliminar(): void {
    const reporte = this.reporte();
    if (!reporte) {
      return;
    }

    this.reporteService.eliminar(reporte.idReporte).subscribe({
      next: () => void this.router.navigate(['/admin']),
      error: (err) =>
        this.error.set(this.translate.t('admin.errorEliminarReporte', { detalle: err.message })),
    });
  }
}