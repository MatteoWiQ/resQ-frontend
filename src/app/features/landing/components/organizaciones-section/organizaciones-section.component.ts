import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { OrganizacionPublica } from '../../../../shared/models/organizacion.model';

/**
 * Inicio: refugios y organizaciones de la red.
 *
 * LandingComponent le pasa las organizaciones verificadas de
 * GET /api/organizaciones/publicas (sin sesion). Sin organizaciones se muestra solo
 * la invitacion a unirse.
 */
@Component({
  selector: 'app-landing-organizaciones',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './organizaciones-section.component.html',
  styleUrl: './organizaciones-section.component.css',
})
export class LandingOrganizacionesSection {
  readonly organizaciones = input<OrganizacionPublica[]>([]);
}
