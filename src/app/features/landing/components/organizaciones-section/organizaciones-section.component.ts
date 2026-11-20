
import { Component, input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { OrganizacionPublica } from '../../../../shared/models/organizacion.model';

/**
 * Inicio: refugios y organizaciones de la red.
 *
 * LandingComponent proporciona las organizaciones
 * verificadas obtenidas del backend.
 */
@Component({
  selector: 'app-landing-organizaciones',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './organizaciones-section.component.html',
  styleUrl: './organizaciones-section.component.css',
})
export class LandingOrganizacionesSection {
  readonly organizaciones = input<OrganizacionPublica[]>([]);

  private readonly translate = inject(TranslateService);

  /**
   * Traduce únicamente el nombre del refugio de prueba.
   * Las demás organizaciones mantienen su nombre original.
   */
  nombreOrganizacion(nombre: string): string {
    if (nombre.trim() === 'Refugio Verificado de Prueba') {
      return this.translate.t('inicio.organizaciones.refugioPrueba');
    }

    return nombre;
  }
}
