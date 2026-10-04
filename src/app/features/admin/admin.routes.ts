import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';
import { PanelAdminComponent } from './pages/panel-admin/panel-admin.component';

export const adminRoutes: Routes = [
  { path: 'admin', component: PanelAdminComponent, canActivate: [adminGuard] }
];