import { TranslationKey } from '../../core/i18n/strings';
import { TranslateParams } from '../../core/i18n/translate.service';

export type Traducir = (clave: TranslationKey, params?: TranslateParams) => string;

const METROS_POR_KM = 1000;

/**
 * Distancia en texto, en metros por debajo de un kilometro y en kilometros a
 * partir de ahi. Vive aca porque la necesitan tanto el panel de cercania como
 * el marcador y el detalle del mapa, y duplicarla los desincroniza.
 */
export function formatearDistancia(distanciaKm: number | null, traducir: Traducir): string {
  if (distanciaKm === null) {
    return traducir('landing.mapa.cercania.distanciaDesconocida');
  }

  if (distanciaKm < 1) {
    return traducir('landing.mapa.cercania.metros', {
      metros: Math.round(distanciaKm * METROS_POR_KM),
    });
  }

  return traducir('landing.mapa.cercania.kilometros', { km: distanciaKm.toFixed(1) });
}
