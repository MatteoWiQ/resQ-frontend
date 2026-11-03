import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { AdminOrganizacionService } from '../../../../core/services/admin-organizacion.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import {
  FiltroEstadoOrganizacion,
  OrganizacionAdmin,
} from '../../../../shared/models/organizacion-admin.model';

export const FILTROS_ORGANIZACION: readonly FiltroEstadoOrganizacion[] = [
  'PENDIENTE_VERIFICACION',
  'VERIFICADA',
  'RECHAZADA',
  'TODAS',
];

/**
 * HU-25: el administrador consulta las organizaciones registradas, identifica las
 * pendientes de verificación, revisa su información y las aprueba o rechaza.
 */
@Component({
  selector: 'app-organizaciones-admin',
  standalone: true,
  imports: [AppHeaderComponent, BackButtonComponent, TranslatePipe, DatePipe],
  templateUrl: './organizaciones-admin.component.html',
  styleUrl: './organizaciones-admin.component.css',
})
export class OrganizacionesAdminComponent implements OnInit {
  private readonly service = inject(AdminOrganizacionService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly filtros = FILTROS_ORGANIZACION;

  /** Lo primero que el administrador necesita ver son las pendientes. */
  readonly filtro = signal<FiltroEstadoOrganizacion>('PENDIENTE_VERIFICACION');
  readonly organizaciones = signal<OrganizacionAdmin[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly toast = signal('');

  readonly seleccionada = signal<OrganizacionAdmin | null>(null);
  readonly confirmandoRechazo = signal(false);
  readonly procesando = signal(false);

  readonly vacia = computed(
    () => !this.cargando() && !this.error() && this.organizaciones().length === 0,
  );
  readonly pendiente = computed(
    () => this.seleccionada()?.estadoVerificacion === 'PENDIENTE_VERIFICACION',
  );

  private temporizadorToast?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.temporizadorToast));
  }

  ngOnInit(): void {
    this.cargar();
  }

  elegirFiltro(filtro: FiltroEstadoOrganizacion): void {
    if (filtro === this.filtro()) {
      return;
    }
    this.filtro.set(filtro);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.service
      .listar(this.filtro())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.organizaciones.set(lista);
          this.cargando.set(false);
        },
        error: () => {
          this.organizaciones.set([]);
          this.error.set(this.translate.t('adminOrganizaciones.mensajes.errorCargar'));
          this.cargando.set(false);
        },
      });
  }

  verDetalle(idOrganizacion: number): void {
    this.service
      .detalle(idOrganizacion)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detalle) => {
          this.confirmandoRechazo.set(false);
          this.seleccionada.set(detalle);
        },
        error: () => this.error.set(this.translate.t('adminOrganizaciones.mensajes.errorDetalle')),
      });
  }

  cerrarDetalle(): void {
    this.seleccionada.set(null);
    this.confirmandoRechazo.set(false);
  }

  aprobar(): void {
    const actual = this.seleccionada();
    if (!actual || this.procesando()) {
      return;
    }
    this.procesando.set(true);
    this.service
      .aprobar(actual.idOrganizacion)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.trasDecision('adminOrganizaciones.mensajes.aprobada', actual.nombre),
        error: (e: HttpErrorResponse) => this.falloDecision(e),
      });
  }

  pedirRechazo(): void {
    this.confirmandoRechazo.set(true);
  }

  cancelarRechazo(): void {
    this.confirmandoRechazo.set(false);
  }

  confirmarRechazo(): void {
    const actual = this.seleccionada();
    if (!actual || this.procesando()) {
      return;
    }
    this.procesando.set(true);
    this.service
      .rechazar(actual.idOrganizacion)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.trasDecision('adminOrganizaciones.mensajes.rechazada', actual.nombre),
        error: (e: HttpErrorResponse) => this.falloDecision(e),
      });
  }

  // ============ Presentación ============

  etiquetaFiltro(filtro: FiltroEstadoOrganizacion): string {
    return this.translate.t(`adminOrganizaciones.filtros.${filtro}` as TranslationKey);
  }

  etiquetaEstado(estado: string): string {
    return this.traducirOCodigo(`adminOrganizaciones.estados.${estado}`, estado);
  }

  etiquetaTipo(tipo: string): string {
    return this.traducirOCodigo(`organizaciones.tipos.${tipo}`, tipo);
  }

  // ============ Utilidades ============

  private trasDecision(mensaje: TranslationKey, nombre: string): void {
    this.procesando.set(false);
    this.cerrarDetalle();
    this.mostrarToast(this.translate.t(mensaje, { nombre }));
    this.cargar();
  }

  /** 409: otro administrador decidió primero. Se avisa y se recarga para ver el estado real. */
  private falloDecision(error: HttpErrorResponse): void {
    this.procesando.set(false);
    if (error.status === 409) {
      this.cerrarDetalle();
      this.mostrarToast(this.translate.t('adminOrganizaciones.mensajes.yaRevisada'));
      this.cargar();
      return;
    }
    this.error.set(this.translate.t('adminOrganizaciones.mensajes.errorDecision'));
  }

  private mostrarToast(mensaje: string): void {
    this.toast.set(mensaje);
    clearTimeout(this.temporizadorToast);
    this.temporizadorToast = setTimeout(() => this.toast.set(''), 4000);
  }

  /** Un código que la app no conoce se muestra tal cual en vez de esconderlo. */
  private traducirOCodigo(clave: string, codigo: string): string {
    const texto = this.translate.t(clave as TranslationKey);
    return texto === clave ? codigo : texto;
  }
}
