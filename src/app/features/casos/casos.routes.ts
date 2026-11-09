import { Routes } from '@angular/router';
import { ChatCasoComponent } from './pages/chat-caso/chat-caso.component';

export const casosRoutes: Routes = [
  // HU-22: chat en vivo del caso. El backend decide quien puede verlo (403 si no participa).
  { path: 'casos/:idCaso/chat', component: ChatCasoComponent },
];
