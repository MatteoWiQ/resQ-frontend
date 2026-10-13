import { Routes } from '@angular/router';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { CrearReporteComponent } from './pages/crear-reporte/crear-reporte.component';
import { RegistrarOrganizacionComponent } from './pages/registrar-organizacion/registrar-organizacion.component';
import { GestionarCasosComponent } from './pages/gestionar-casos/gestionar-casos.component';

export const profileRoutes: Routes = [
  { path: 'perfil', component: PerfilComponent },
  { path: 'reportes/nuevo', component: CrearReporteComponent },
  { path: 'organizaciones/registro', component: RegistrarOrganizacionComponent },
  { path: 'organizaciones/panel', component: GestionarCasosComponent },
];