import { Routes } from '@angular/router';
import { casosRoutes } from './features/casos/casos.routes';
import { adminRoutes } from './features/admin/admin.routes';
import { authRoutes } from './features/auth/auth.routes';
import { landingRoutes } from './features/landing/landing.routes';
import { notificacionesRoutes } from './features/notificaciones/notificaciones.routes';
import { profileRoutes } from './features/profile/profile.routes';
import { voluntarioRoutes } from './features/voluntario/voluntario.routes';
import { BandejaChatComponent } from './features/chat/pages/bandeja-chat/bandeja-chat.component';
import { ConversacionComponent } from './features/chat/pages/conversacion/conversacion.component';

export const routes: Routes = [
  ...landingRoutes,
  ...authRoutes,
  ...profileRoutes,
  ...adminRoutes,
  ...voluntarioRoutes,
  ...notificacionesRoutes,
  ...casosRoutes,
  { path: 'chat', component: BandejaChatComponent },
  { path: 'chat/:id', component: ConversacionComponent },
];