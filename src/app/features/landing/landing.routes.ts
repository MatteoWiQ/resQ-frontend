import { Routes } from '@angular/router';
import { LandingComponent } from './landing.component';
import { GuiaReporteComponent } from './pages/guia-reporte/guia-reporte.component';

export const landingRoutes: Routes = [
	{ path: '', component: LandingComponent },
	{ path: 'guia-reporte', component: GuiaReporteComponent },
];