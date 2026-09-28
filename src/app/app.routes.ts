import { Routes } from '@angular/router';
import { adminRoutes } from './features/admin/admin.routes';
import { authRoutes } from './features/auth/auth.routes';
import { landingRoutes } from './features/landing/landing.routes';
import { profileRoutes } from './features/profile/profile.routes';
import { voluntarioRoutes } from './features/voluntario/voluntario.routes';

export const routes: Routes = [
  ...landingRoutes,
  ...authRoutes,
  ...profileRoutes,
  ...adminRoutes,
  ...voluntarioRoutes,
];