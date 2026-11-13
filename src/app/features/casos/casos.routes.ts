import { Routes } from '@angular/router';
import { ChatCasoComponent } from './pages/chat-caso/chat-caso.component';
import { CasosComponent } from './pages/casos/casos.component';

export const casosRoutes: Routes = [
  // Rediseño: lista y mapa de casos juntos (reemplaza a /mapa).
  { path: 'casos', component: CasosComponent },
  // HU-22: chat en vivo del caso. El backend decide quien puede verlo (403 si no participa).
  { path: 'casos/:idCaso/chat', component: ChatCasoComponent },
];
