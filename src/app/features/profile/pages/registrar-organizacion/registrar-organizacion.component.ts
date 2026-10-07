import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import { AuthService } from '../../../../core/services/auth.service';
import { OrganizacionService } from '../../../../core/services/organizacion.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { FOTO_ACCEPT, validarFoto } from '../../../../shared/constants/foto';
import {
  DESCRIPCION_MAX,
  ErroresOrganizacion,
  TIPOS_ORGANIZACION,
  validarFormularioOrganizacion,
} from '../../../../shared/constants/organizacion';
import { FormularioOrganizacion, Organizacion } from '../../../../shared/models/organizacion.model';

/**
 * HU-20: el representante de un refugio, veterinaria o rescatista independiente registra
 * su organización. Si el usuario ya tiene una, se muestra su estado de verificación.
 */
@Component({
  selector: 'app-registrar-organizacion',
  standalone: true,
  imports: [FormsModule, RouterLink, BackButtonComponent, TranslatePipe],
  templateUrl: './registrar-organizacion.component.html',
  styleUrl: './registrar-organizacion.component.css',
})
export class RegistrarOrganizacionComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly organizacionService = inject(OrganizacionService);
  private readonly translate = inject(TranslateService);

  readonly tipos = TIPOS_ORGANIZACION;
  readonly logoAccept = FOTO_ACCEPT;
  readonly descripcionMax = DESCRIPCION_MAX;

  form: FormularioOrganizacion = {
    nombre: '',
    tipo: '',
    direccion: '',
    telefono: '',
    email: '',
    descripcion: '',
  };

  readonly hayUsuario = signal(false);
  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly organizacion = signal<Organizacion | null>(null);
  /** null hasta que se registra en esta sesión; luego indica si el correo salió. */
  readonly confirmacionEnviada = signal<boolean | null>(null);
  readonly errores = signal<Record<string, string>>({});
  readonly mensaje = signal('');

  readonly logo = signal<File | null>(null);
  readonly vistaPrevia = signal<string | null>(null);

  ngOnInit(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();
    this.hayUsuario.set(idUsuario !== null);
    if (idUsuario === null) {
      this.cargando.set(false);
      return;
    }

    this.organizacionService.obtenerDeRepresentante(idUsuario).subscribe({
      next: (organizacion) => {
        this.organizacion.set(organizacion);
        this.cargando.set(false);
      },
      error: () => {
        this.mensaje.set(this.translate.t('organizaciones.errorCargar'));
        this.cargando.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.liberarVistaPrevia();
  }

  etiquetaTipo(tipo: string): string {
    return this.translate.t(('organizaciones.tipos.' + tipo) as TranslationKey);
  }

  etiquetaEstado(estado: string): string {
    return this.translate.t(('organizaciones.estado.' + estado) as TranslationKey);
  }

  avisoEstado(estado: string): string {
    const clave =
      estado === 'VERIFICADA'
        ? 'organizaciones.estado.avisoVerificada'
        : estado === 'RECHAZADA'
          ? 'organizaciones.estado.avisoRechazada'
          : 'organizaciones.estado.avisoPendiente';
    return this.translate.t(clave);
  }

  // ============ Logo ============
  seleccionarLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) {
      return;
    }

    const error = validarFoto(archivo);
    if (error) {
      this.quitarLogo();
      this.fijarError(
        'logo',
        this.translate.t(error === 'FORMATO' ? 'organizaciones.logo.errorFormato' : 'organizaciones.logo.errorTamano'),
      );
      return;
    }

    this.liberarVistaPrevia();
    this.quitarError('logo');
    this.logo.set(archivo);
    this.vistaPrevia.set(URL.createObjectURL(archivo));
  }

  quitarLogo(): void {
    this.liberarVistaPrevia();
    this.logo.set(null);
    this.quitarError('logo');
  }

  private liberarVistaPrevia(): void {
    const url = this.vistaPrevia();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.vistaPrevia.set(null);
  }

  // ============ Envío ============
  registrar(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();
    if (idUsuario === null || this.enviando()) {
      return;
    }

    const erroresCampos: ErroresOrganizacion = validarFormularioOrganizacion(this.form);
    const traducidos: Record<string, string> = {};
    for (const [campo, codigo] of Object.entries(erroresCampos)) {
      traducidos[campo] = this.translate.t(('organizaciones.error.' + codigo) as TranslationKey);
    }
    if (this.errores()['logo']) {
      traducidos['logo'] = this.errores()['logo'];
    }
    this.errores.set(traducidos);

    if (Object.keys(traducidos).length > 0) {
      this.mensaje.set(this.translate.t('organizaciones.error.revisaFormulario'));
      return;
    }

    this.mensaje.set('');
    this.enviando.set(true);

    this.organizacionService.registrar(idUsuario, this.form, this.logo()).subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        this.organizacion.set(respuesta.organizacion);
        this.confirmacionEnviada.set(respuesta.confirmacionEnviada);
        this.quitarLogo();
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.manejarError(err);
      },
    });
  }

  private manejarError(err: HttpErrorResponse): void {
    const detalle = (err.error?.errors ?? {}) as Record<string, string>;

    if (err.status === 413) {
      this.fijarError('logo', this.translate.t('organizaciones.logo.errorTamano'));
    } else if (err.status === 415) {
      this.fijarError('logo', this.translate.t('organizaciones.logo.errorFormato'));
    } else if ((err.status === 400 || err.status === 409) && Object.keys(detalle).length > 0) {
      this.errores.set(detalle);
    }

    if (err.status === 409 && detalle['idRepresentante']) {
      this.mensaje.set(this.translate.t('organizaciones.error.yaRegistrada'));
    } else if (err.status === 403) {
      this.mensaje.set(this.translate.t('organizaciones.error.sinPermiso'));
    } else if (err.status === 400 || err.status === 409) {
      this.mensaje.set(this.translate.t('organizaciones.error.revisaFormulario'));
    } else if (err.status === 413 || err.status === 415) {
      this.mensaje.set(this.translate.t('organizaciones.error.revisaFormulario'));
    } else {
      this.mensaje.set(this.translate.t('organizaciones.error.generico'));
    }
  }

  private fijarError(campo: string, texto: string): void {
    this.errores.update((actuales) => ({ ...actuales, [campo]: texto }));
  }

  private quitarError(campo: string): void {
    this.errores.update((actuales) => {
      const { [campo]: _quitado, ...resto } = actuales;
      return resto;
    });
  }
}
