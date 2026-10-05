import { Routes } from '@angular/router';
import { revisorGuard } from '../../core/guards/revisor.guard';
import { SolicitudesComponent } from './pages/solicitudes/solicitudes.component';

export const voluntarioRoutes: Routes = [
  { path: 'voluntario/solicitudes', component: SolicitudesComponent, canActivate: [revisorGuard] },
];
