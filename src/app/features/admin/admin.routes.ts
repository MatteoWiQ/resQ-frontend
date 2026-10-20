import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';
import { DetalleReporteComponent } from './pages/detalle-reporte/detalle-reporte.component';
import { MetricasComponent } from './pages/metricas/metricas.component';
import { PanelAdminComponent } from './pages/panel-admin/panel-admin.component';
import { SolicitudesVoluntariosComponent } from './pages/solicitudes-voluntarios/solicitudes-voluntarios.component';

/**
 * HU-24: el detalle de un reporte es una pantalla mas del ambito administrativo,
 * asi que lleva el mismo adminGuard que el panel. Sin el, un usuario normal podria
 * escribir /admin/reportes/1 en la barra de direcciones y ver el caso.
 */
export const adminRoutes: Routes = [
  { path: 'admin', component: PanelAdminComponent, canActivate: [adminGuard] },
  {
    path: 'admin/solicitudes-voluntarios',
    component: SolicitudesVoluntariosComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'admin/reportes/:id',
    component: DetalleReporteComponent,
    canActivate: [adminGuard],
  },
  // HU-34: metricas de la comunidad, solo para el administrador.
  { path: 'admin/metricas', component: MetricasComponent, canActivate: [adminGuard] },
];