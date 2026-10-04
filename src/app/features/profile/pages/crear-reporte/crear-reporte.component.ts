import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
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
    fotoUrl: '',
    latitud: null as number | null,
    longitud: null as number | null,
  };

  readonly paso = signal(1);
  readonly message = signal('');
  readonly enviando = signal(false);

  private readonly authService = inject(AuthService);
  private readonly reporteService = inject(ReporteService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

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
    this.reporteService
      .crearReporte({
        idUsuario,
        tipoCaso: this.form.tipoCaso,
        descripcion: this.form.descripcion.trim(),
        fotoUrl: this.form.fotoUrl.trim() || null,
        latitud: this.form.latitud,
        longitud: this.form.longitud,
      })
      .subscribe({
        next: () => this.router.navigate(['/perfil']),
        error: () => {
          this.enviando.set(false);
          this.message.set(this.translate.t('reportes.nuevo.errorCrear'));
        },
      });
  }
}