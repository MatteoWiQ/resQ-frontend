import { Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import { FOTO_ACCEPT, validarFoto } from '../../../../shared/constants/foto';
import { Reporte } from '../../../../shared/models/reporte.model';
import { Usuario } from '../../../../shared/models/usuario.model';
import { SelectorUbicacionComponent } from '../../../../shared/components/selector-ubicacion/selector-ubicacion.component';
import { TIPOS_CASO } from '../../../../shared/constants/tipos-caso';
import { formatearTelefono, limpiarTelefono, telefonoValido } from '../../../../shared/utils/telefonos';

export type PasoReporte = 1 | 2 | 3 | 4;

/** Borrador guardado en este navegador con "Guardar y salir" (la foto no se guarda). */
export const CLAVE_BORRADOR = 'resq_borrador_reporte';

interface Borrador {
  paso: PasoReporte;
  tipoCaso: string;
  descripcion: string;
  referencia: string;
  latitud: number | null;
  longitud: number | null;
  compartirTelefonoCuenta: boolean;
  telefonoContacto: string;
}

/**
 * Rediseño: reportar un caso en 4 pasos, uno por pantalla
 * (Foto → Ubicacion → Situacion → Contacto), sin el menu del sitio.
 *
 * - Foto: opcional, con "Continuar sin foto".
 * - Ubicacion: pin arrastrable (HU-16) y una referencia en texto, que se agrega
 *   a la descripcion porque el backend todavia no tiene un campo para ella.
 * - Situacion: tipo de caso y lo que vio.
 * - Contacto: mostrar el telefono de la cuenta y/u otro solo para el caso; si
 *   la cuenta no tiene telefono se puede agregar ahi mismo.
 * - "Guardar y salir" deja un borrador en este navegador.
 * - Al enviar se abre el detalle del caso nuevo.
 */
@Component({
  selector: 'app-crear-reporte',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, SelectorUbicacionComponent],
  templateUrl: './crear-reporte.component.html',
  styleUrl: './crear-reporte.component.css',
})
export class CrearReporteComponent implements OnInit, OnDestroy {
  // El catalogo canonico vive en shared/constants/tipos-caso.ts; el valor
  // interno va al backend y la etiqueta visible sale de shared.tiposCaso.
  readonly tiposCaso = TIPOS_CASO;
  readonly pasos: { numero: PasoReporte; clave: TranslationKey }[] = [
    { numero: 1, clave: 'reportarCaso.pasos.foto' },
    { numero: 2, clave: 'reportarCaso.pasos.ubicacion' },
    { numero: 3, clave: 'reportarCaso.pasos.situacion' },
    { numero: 4, clave: 'reportarCaso.pasos.contacto' },
  ];

  readonly form = {
    tipoCaso: '',
    descripcion: '',
    referencia: '',
    latitud: null as number | null,
    longitud: null as number | null,
    compartirTelefonoCuenta: false,
    telefonoContacto: '',
    telefonoNuevo: '',
  };

  readonly paso = signal<PasoReporte>(1);
  readonly message = signal('');
  readonly enviando = signal(false);
  readonly borradorRecuperado = signal(false);

  // HU-10: fotografía adjunta
  readonly fotoAccept = FOTO_ACCEPT;
  readonly foto = signal<File | null>(null);
  readonly vistaPrevia = signal<string | null>(null);
  readonly errorFoto = signal('');

  // Contacto: datos de la cuenta que reporta
  readonly usuario = signal<Usuario | null>(null);
  readonly guardandoTelefono = signal(false);
  readonly errorTelefono = signal('');

  private readonly authService = inject(AuthService);
  private readonly reporteService = inject(ReporteService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly haySesion = computed(() => this.authService.obtenerIdUsuarioActual() !== null);
  readonly telefonoCuenta = computed(() => {
    const telefono = this.usuario()?.telefono;
    return telefono && telefonoValido(telefono) ? formatearTelefono(telefono) : null;
  });

  ngOnInit(): void {
    this.recuperarBorrador();
    const idUsuario = this.authService.obtenerIdUsuarioActual();
    if (idUsuario) {
      this.usuarioService
        .obtenerPorId(idUsuario)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: (u) => this.usuario.set(u), error: () => this.usuario.set(null) });
    }
  }

  ngOnDestroy(): void {
    this.liberarVistaPrevia();
  }

  // ============================================================ pasos

  continuar(): void {
    if (this.paso() === 3 && !this.validarSituacion()) {
      return;
    }
    this.message.set('');
    if (this.paso() < 4) {
      this.irA((this.paso() + 1) as PasoReporte);
    }
  }

  atras(): void {
    this.message.set('');
    if (this.paso() > 1) {
      this.irA((this.paso() - 1) as PasoReporte);
    }
  }

  /** Solo se puede volver a un paso ya hecho (o al actual). */
  irA(paso: PasoReporte): void {
    this.paso.set(paso);
    this.guardarBorrador();
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0 });
      } catch {
        // jsdom no implementa scrollTo
      }
    }
  }

  guardarYSalir(): void {
    this.guardarBorrador();
    void this.router.navigate(['/']);
  }

  empezarDeNuevo(): void {
    this.borrarBorrador();
    this.form.tipoCaso = '';
    this.form.descripcion = '';
    this.form.referencia = '';
    this.form.latitud = null;
    this.form.longitud = null;
    this.form.compartirTelefonoCuenta = false;
    this.form.telefonoContacto = '';
    this.quitarFoto();
    this.borradorRecuperado.set(false);
    this.paso.set(1);
  }

  // ============================================================ paso 1: foto

  seleccionarFoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) {
      return;
    }

    const error = validarFoto(archivo);
    if (error) {
      this.quitarFoto();
      this.errorFoto.set(
        this.translate.t(error === 'FORMATO' ? 'reportes.nuevo.fotoErrorFormato' : 'reportes.nuevo.fotoErrorTamano'),
      );
      return;
    }

    this.liberarVistaPrevia();
    this.errorFoto.set('');
    this.foto.set(archivo);
    this.vistaPrevia.set(URL.createObjectURL(archivo));
  }

  quitarFoto(): void {
    this.liberarVistaPrevia();
    this.foto.set(null);
    this.errorFoto.set('');
  }

  // ============================================================ paso 3: situacion

  seleccionarTipo(tipo: string): void {
    this.form.tipoCaso = tipo;
    this.message.set('');
  }

  etiquetaTipoCaso(tipo: string): string {
    return this.translate.t(`shared.tiposCaso.${tipo}` as TranslationKey);
  }

  descripcionValida(): boolean {
    return this.form.descripcion.trim().length > 0;
  }

  // ============================================================ paso 4: contacto

  /** Si la cuenta no tiene telefono, se agrega ahi mismo (PATCH /api/usuarios/me). */
  guardarTelefonoCuenta(): void {
    if (!telefonoValido(this.form.telefonoNuevo)) {
      this.errorTelefono.set(this.translate.t('reportarCaso.errores.telefono'));
      return;
    }
    this.guardandoTelefono.set(true);
    this.errorTelefono.set('');
    this.usuarioService.actualizarMiContacto({ telefono: limpiarTelefono(this.form.telefonoNuevo) }).subscribe({
      next: (u) => {
        this.guardandoTelefono.set(false);
        this.usuario.set(u);
        this.form.telefonoNuevo = '';
        this.form.compartirTelefonoCuenta = true;
      },
      error: () => {
        this.guardandoTelefono.set(false);
        this.errorTelefono.set(this.translate.t('reportarCaso.errores.guardarTelefono'));
      },
    });
  }

  otroTelefonoInvalido(): boolean {
    const otro = this.form.telefonoContacto.trim();
    return otro !== '' && !telefonoValido(otro);
  }

  textoMostrarCuenta(): string {
    return this.translate.t('reportarCaso.contacto.mostrarCuenta', { telefono: this.telefonoCuenta() ?? '' });
  }

  /** Lo que llega al backend: la referencia va al final de la descripcion. */
  descripcionFinal(): string {
    const descripcion = this.form.descripcion.trim();
    const referencia = this.form.referencia.trim();
    return referencia
      ? `${descripcion}\n\n${this.translate.t('reportarCaso.referenciaEnDescripcion', { texto: referencia })}`
      : descripcion;
  }

  // ============================================================ enviar

  crearReporte(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();
    if (!idUsuario) {
      this.message.set(this.translate.t('reportes.nuevo.sinSesion'));
      return;
    }
    if (!this.validarSituacion()) {
      this.paso.set(3);
      return;
    }
    if (this.otroTelefonoInvalido()) {
      this.message.set(this.translate.t('reportarCaso.errores.telefono'));
      return;
    }

    this.message.set('');
    this.enviando.set(true);

    const archivo = this.foto();
    const compartir = this.form.compartirTelefonoCuenta && this.telefonoCuenta() !== null;
    const otro = this.form.telefonoContacto.trim();
    const crear = (fotoUrl: string | null): Observable<Reporte> =>
      this.reporteService.crearReporte({
        idUsuario,
        tipoCaso: this.form.tipoCaso,
        descripcion: this.descripcionFinal(),
        fotoUrl,
        latitud: this.form.latitud,
        longitud: this.form.longitud,
        compartirTelefonoCuenta: compartir,
        telefonoContacto: otro ? limpiarTelefono(otro) : null,
      });

    // Si hay foto, primero se sube y luego se crea el reporte asociado a su fotoUrl.
    const peticion = archivo
      ? this.reporteService.subirFoto(archivo).pipe(switchMap((r) => crear(r.fotoUrl)))
      : crear(null);

    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (creado) => {
        this.borrarBorrador();
        void this.router.navigate(creado?.idReporte ? ['/casos', creado.idReporte] : ['/perfil']);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.message.set(this.mensajeDeError(err, !!archivo));
      },
    });
  }

  // ============================================================ apoyo

  private validarSituacion(): boolean {
    if (!this.form.tipoCaso) {
      this.message.set(this.translate.t('reportarCaso.errores.tipo'));
      return false;
    }
    if (!this.descripcionValida()) {
      this.message.set(this.translate.t('reportarCaso.errores.descripcion'));
      return false;
    }
    return true;
  }

  private mensajeDeError(err: HttpErrorResponse, conFoto: boolean): string {
    if (conFoto && err.status === 413) {
      return this.translate.t('reportes.nuevo.fotoErrorTamano');
    }
    if (conFoto && err.status === 415) {
      return this.translate.t('reportes.nuevo.fotoErrorFormato');
    }
    if (conFoto && err.url?.includes('/fotos')) {
      return this.translate.t('reportes.nuevo.fotoErrorSubir');
    }
    // Errores de validacion del backend (telefono, cuenta sin telefono...) traen su motivo.
    if (err.status === 400 || err.status === 403) {
      return err.error?.message || this.translate.t('reportarCaso.errores.enviar');
    }
    return this.translate.t('reportarCaso.errores.enviar');
  }

  private liberarVistaPrevia(): void {
    const url = this.vistaPrevia();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.vistaPrevia.set(null);
  }

  private guardarBorrador(): void {
    const borrador: Borrador = {
      paso: this.paso(),
      tipoCaso: this.form.tipoCaso,
      descripcion: this.form.descripcion,
      referencia: this.form.referencia,
      latitud: this.form.latitud,
      longitud: this.form.longitud,
      compartirTelefonoCuenta: this.form.compartirTelefonoCuenta,
      telefonoContacto: this.form.telefonoContacto,
    };
    try {
      localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
    } catch {
      // Sin almacenamiento (modo privado): el reporte sigue, solo no queda borrador.
    }
  }

  private recuperarBorrador(): void {
    let borrador: Partial<Borrador> | null = null;
    try {
      const guardado = localStorage.getItem(CLAVE_BORRADOR);
      borrador = guardado ? (JSON.parse(guardado) as Partial<Borrador>) : null;
    } catch {
      borrador = null;
    }
    if (!borrador) {
      return;
    }
    this.form.tipoCaso = borrador.tipoCaso ?? '';
    this.form.descripcion = borrador.descripcion ?? '';
    this.form.referencia = borrador.referencia ?? '';
    this.form.latitud = typeof borrador.latitud === 'number' ? borrador.latitud : null;
    this.form.longitud = typeof borrador.longitud === 'number' ? borrador.longitud : null;
    this.form.compartirTelefonoCuenta = borrador.compartirTelefonoCuenta === true;
    this.form.telefonoContacto = borrador.telefonoContacto ?? '';
    const paso = borrador.paso;
    this.paso.set(paso === 2 || paso === 3 || paso === 4 ? paso : 1);
    this.borradorRecuperado.set(true);
  }

  private borrarBorrador(): void {
    try {
      localStorage.removeItem(CLAVE_BORRADOR);
    } catch {
      // nada que borrar
    }
  }
}
