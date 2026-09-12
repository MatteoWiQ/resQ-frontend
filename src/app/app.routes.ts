import { Routes } from '@angular/router';
import { authRoutes } from './features/auth/auth.routes';
import { landingRoutes } from './features/landing/landing.routes';
import { dashboardRoutes } from './features/dashboard/dashboard.routes';
import { profileRoutes } from './features/profile/profile.routes';


export const routes: Routes = [...landingRoutes, ...authRoutes, ...dashboardRoutes, ...profileRoutes];