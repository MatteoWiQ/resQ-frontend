import { Routes } from '@angular/router';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { RegistrarOrganizacionComponent } from './pages/registrar-organizacion/registrar-organizacion.component';
import { GestionarCasosComponent } from './pages/gestionar-casos/gestionar-casos.component';

export const profileRoutes: Routes = [
  { path: 'perfil', component: PerfilComponent },
  // Rediseño: el formulario de 4 pasos usa Leaflet; se carga recien al entrar.
  {
    path: 'reportes/nuevo',
    loadComponent: () =>
      import('./pages/crear-reporte/crear-reporte.component').then((m) => m.CrearReporteComponent),
  },
  { path: 'organizaciones/registro', component: RegistrarOrganizacionComponent },
  { path: 'organizaciones/panel', component: GestionarCasosComponent },
];