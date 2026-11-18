import { Routes } from '@angular/router';
import { LandingComponent } from './landing.component';
import { GuiaReporteComponent } from './pages/guia-reporte/guia-reporte.component';
import { MapaComponent } from './components/mapa/mapa.component';

export const landingRoutes: Routes = [
	{ path: '', component: LandingComponent },
	{ path: 'mapa', component: MapaComponent },
	{ path: 'guia-reporte', component: GuiaReporteComponent },
];