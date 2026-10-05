import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { FOTO_ACCEPT, validarFoto } from '../../../../shared/constants/foto';
import { Reporte } from '../../../../shared/models/reporte.model';
import { SelectorUbicacionComponent } from '../../../../shared/components/selector-ubicacion/selector-ubicacion.component';
import { TIPOS_CASO } from '../../../../shared/constants/tipos-caso';

@Component({
  selector: 'app-crear-reporte',
  standalone: true,
  imports: [FormsModule, BackButtonComponent, TranslatePipe, SelectorUbicacionComponent],
  templateUrl: './crear-reporte.component.html',
  styleUrl: './crear-reporte.component.css',
})
export class CrearReporteComponent {
  // El catalogo canonico vive en shared/constants/tipos-caso.ts; el valor
  // interno va al backend y la etiqueta visible sale de shared.tiposCaso.
  readonly tiposCaso = TIPOS_CASO;

  readonly form = {
    tipoCaso: '',
    descripcion: '',
    latitud: null as number | null,
    longitud: null as number | null,
  };

  readonly paso = signal(1);
  readonly message = signal('');
  readonly enviando = signal(false);

  // HU-10: fotografía adjunta
  readonly fotoAccept = FOTO_ACCEPT;
  readonly foto = signal<File | null>(null);
  readonly vistaPrevia = signal<string | null>(null);
  readonly errorFoto = signal('');

  private readonly authService = inject(AuthService);
  private readonly reporteService = inject(ReporteService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  ngOnDestroy(): void {
    this.liberarVistaPrevia();
  }

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

  private liberarVistaPrevia(): void {
    const url = this.vistaPrevia();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.vistaPrevia.set(null);
  }

  descripcionValida(): boolean {
    return this.form.descripcion.trim().length > 0;
  }

  seleccionarTipo(tipo: string): void {
    this.form.tipoCaso = tipo;
    this.message.set('');
  }

  etiquetaTipoCaso(tipo: string): string {
    return this.translate.t(`shared.tiposCaso.${tipo}` as TranslationKey);
  }

  continuar(): void {
    if (!this.form.tipoCaso) {
      this.message.set(this.translate.t('reportes.nuevo.seleccionaTipo'));
      return;
    }
    this.message.set('');
    this.paso.set(2);
  }

  atras(): void {
    this.paso.set(1);
    this.message.set('');
  }

  crearReporte(): void {
    const idUsuario = this.authService.obtenerIdUsuarioActual();
    if (!idUsuario) {
      this.message.set(this.translate.t('reportes.nuevo.sinSesion'));
      return;
    }
    if (!this.form.tipoCaso) {
      this.message.set(this.translate.t('reportes.nuevo.seleccionaTipo'));
      return;
    }
    if (!this.descripcionValida()) {
      this.message.set(this.translate.t('reportes.nuevo.descripcionObligatoria'));
      return;
    }

    this.message.set('');
    this.enviando.set(true);

    const archivo = this.foto();
    const crear = (fotoUrl: string | null): Observable<Reporte> =>
      this.reporteService.crearReporte({
        idUsuario,
        tipoCaso: this.form.tipoCaso,
        descripcion: this.form.descripcion.trim(),
        fotoUrl,
        latitud: this.form.latitud,
        longitud: this.form.longitud,
      });

    // Si hay foto, primero se sube y luego se crea el reporte asociado a su fotoUrl.
    const peticion = archivo
      ? this.reporteService.subirFoto(archivo).pipe(switchMap((r) => crear(r.fotoUrl)))
      : crear(null);

    peticion.subscribe({
      next: () => this.router.navigate(['/perfil']),
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.message.set(this.mensajeDeError(err, !!archivo));
      },
    });
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
    return this.translate.t('reportes.nuevo.errorCrear');
  }
}
