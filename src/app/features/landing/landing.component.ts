import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { ReporteService } from '../../core/services/reporte.service';
import { Reporte } from '../../shared/models/reporte.model';
import { Organizacion } from '../../shared/models/organizacion.model';
import { LandingHero } from './components/hero/hero.component';
import { LandingSteps } from './components/steps/steps.component';
import { LandingCasesSection } from './components/cases-section/cases-section.component';
import { LandingHelpSection } from './components/help-section/help-section.component';
import { LandingOrganizacionesSection } from './components/organizaciones-section/organizaciones-section.component';
import { LandingPie } from './components/pie/pie.component';
import { CASOS_CARRUSEL, CASOS_URGENTES, casosAbiertos } from './casos-inicio';

/**
 * Inicio rediseñado. Pide una sola vez los casos abiertos (GET /api/reportes,
 * publico) y los reparte entre el carrusel y las tarjetas de casos urgentes.
 *
 * Se quitaron del Inicio las estadisticas vacias y el mapa: el mapa vive en Casos.
 */
@Component({
  selector: 'app-landing',
  imports: [
    AppHeaderComponent,
    LandingHero,
    LandingCasesSection,
    LandingSteps,
    LandingHelpSection,
    LandingOrganizacionesSection,
    LandingPie,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit {
  private readonly reporteService = inject(ReporteService);
  private readonly destroyRef = inject(DestroyRef);

  readonly casos = signal<Reporte[]>([]);
  readonly casosCarrusel = computed(() => this.casos().slice(0, CASOS_CARRUSEL));
  readonly casosUrgentes = computed(() => this.casos().slice(0, CASOS_URGENTES));

  /**
   * Organizaciones verificadas para la seccion de la red. Queda vacia hasta que el
   * directorio del backend sea publico (hoy pide sesion).
   */
  readonly organizaciones = signal<Organizacion[]>([]);

  ngOnInit(): void {
    this.reporteService
      .obtenerTodos(['PENDIENTE', 'EN_PROCESO'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (reportes) => this.casos.set(casosAbiertos(reportes)),
        // Sin casos el carrusel muestra su mensaje y la seccion de urgentes se oculta.
        error: () => this.casos.set([]),
      });
  }
}
