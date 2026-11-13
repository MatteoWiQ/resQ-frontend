import { Routes } from '@angular/router';
import { ChatCasoComponent } from './pages/chat-caso/chat-caso.component';
import { CasosComponent } from './pages/casos/casos.component';
import { DetalleCasoComponent } from './pages/detalle-caso/detalle-caso.component';

export const casosRoutes: Routes = [
  // Rediseño: lista y mapa de casos juntos (reemplaza a /mapa).
  { path: 'casos', component: CasosComponent },
  // Rediseño: detalle de un caso. Usa GET /api/reportes/{id}, que es publico.
  { path: 'casos/:idCaso', component: DetalleCasoComponent },
  // HU-22: chat en vivo del caso. El backend decide quien puede verlo (403 si no participa).
  { path: 'casos/:idCaso/chat', component: ChatCasoComponent },
];
