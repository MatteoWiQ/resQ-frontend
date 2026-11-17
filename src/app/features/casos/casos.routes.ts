import { Routes } from '@angular/router';

/**
 * Las paginas de casos se cargan recien al entrar (loadComponent): usan Leaflet y
 * no tienen que pesar en la carga inicial del sitio.
 */
export const casosRoutes: Routes = [
  // Rediseño: lista y mapa de casos juntos (reemplaza a /mapa).
  {
    path: 'casos',
    loadComponent: () => import('./pages/casos/casos.component').then((m) => m.CasosComponent),
  },
  // Rediseño: detalle de un caso. Usa GET /api/reportes/{id}, que es publico.
  {
    path: 'casos/:idCaso',
    loadComponent: () => import('./pages/detalle-caso/detalle-caso.component').then((m) => m.DetalleCasoComponent),
  },
  // HU-22: chat en vivo del caso. El backend decide quien puede verlo (403 si no participa).
  {
    path: 'casos/:idCaso/chat',
    loadComponent: () => import('./pages/chat-caso/chat-caso.component').then((m) => m.ChatCasoComponent),
  },
];
