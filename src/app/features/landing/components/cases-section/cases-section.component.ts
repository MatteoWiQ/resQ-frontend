import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import { Reporte } from '../../../../shared/models/reporte.model';
import { metaCaso, urgenciaDe } from '../../casos-inicio';

/**
 * Inicio: "Casos que necesitan ayuda ahora". Tarjetas con foto, insignia y tiempo.
 * Todavia no abren el detalle del caso (pagina pendiente). Sin casos no se muestra.
 */
@Component({
  selector: 'app-landing-cases',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './cases-section.component.html',
  styleUrl: './cases-section.component.css',
})
export class LandingCasesSection {
  readonly casos = input<Reporte[]>([]);

  private readonly translate = inject(TranslateService);

  urgencia(caso: Reporte): 'urgente' | 'activo' {
    return urgenciaDe(caso);
  }

  etiquetaUrgencia(caso: Reporte): string {
    return this.translate.t(`inicio.insignias.${urgenciaDe(caso)}`);
  }

  meta(caso: Reporte): string {
    return metaCaso(caso, (clave, params) => this.translate.t(clave as TranslationKey, params));
  }
}
