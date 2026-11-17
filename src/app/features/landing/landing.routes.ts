import { Routes } from '@angular/router';
import { LandingComponent } from './landing.component';
import { GuiaReporteComponent } from './pages/guia-reporte/guia-reporte.component';

export const landingRoutes: Routes = [
	{ path: '', component: LandingComponent },
	// Rediseño: el mapa ahora vive en Casos (lista + mapa).
	{ path: 'mapa', redirectTo: 'casos', pathMatch: 'full' },
	{ path: 'guia-reporte', component: GuiaReporteComponent },
];