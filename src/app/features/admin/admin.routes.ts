import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';
import { DetalleReporteComponent } from './pages/detalle-reporte/detalle-reporte.component';
import { PanelAdminComponent } from './pages/panel-admin/panel-admin.component';

/**
 * HU-24: el detalle de un reporte es una pantalla mas del ambito administrativo,
 * asi que lleva el mismo adminGuard que el panel. Sin el, un usuario normal podria
 * escribir /admin/reportes/1 en la barra de direcciones y ver el caso.
 */
export const adminRoutes: Routes = [
  { path: 'admin', component: PanelAdminComponent, canActivate: [adminGuard] },
  {
    path: 'admin/reportes/:id',
    component: DetalleReporteComponent,
    canActivate: [adminGuard],
  },
];