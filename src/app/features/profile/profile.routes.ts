import { Routes } from '@angular/router';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { CrearReporteComponent } from './pages/crear-reporte/crear-reporte.component';

export const profileRoutes: Routes = [
  { path: 'perfil', component: PerfilComponent },
  { path: 'reportes/nuevo', component: CrearReporteComponent }
];  