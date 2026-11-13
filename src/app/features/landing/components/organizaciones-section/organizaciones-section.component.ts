import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { Organizacion } from '../../../../shared/models/organizacion.model';

/**
 * Inicio: refugios y organizaciones de la red.
 *
 * El directorio del backend (GET /api/organizaciones) hoy pide sesion, asi que el
 * Inicio todavia no lo consulta y la lista llega vacia. Cuando el backend lo abra,
 * basta con pasarle las organizaciones verificadas desde LandingComponent: la
 * cuadricula de logos ya esta lista.
 */
@Component({
  selector: 'app-landing-organizaciones',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './organizaciones-section.component.html',
  styleUrl: './organizaciones-section.component.css',
})
export class LandingOrganizacionesSection {
  readonly organizaciones = input<Organizacion[]>([]);
}
