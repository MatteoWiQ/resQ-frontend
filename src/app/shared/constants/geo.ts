import { EstadoReporte } from '../models/reporte.model';

export const CENTRO_CIUDAD: [number, number] = [-17.3895, -66.1568];
export const ZOOM_CIUDAD = 13;

export const COLOR_POR_ESTADO: Record<EstadoReporte, string> = {
  PENDIENTE: '#c2410c',
  EN_PROCESO: '#1d4ed8',
  RESUELTO: '#15803d',
  CANCELADO: '#6b7280',
};

export const COLOR_FALLBACK = '#7f2a3f';

export const ESTADOS: EstadoReporte[] = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO', 'CANCELADO'];

export function colorEstado(estado: EstadoReporte): string {
  return COLOR_POR_ESTADO[estado] ?? COLOR_FALLBACK;
}

/* --------------------------------------------------------------------------
   HU-41: distancia entre puntos
   -------------------------------------------------------------------------- */

export interface Punto {
  latitud: number;
  longitud: number;
}

const RADIO_MEDIO_TIERRA_KM = 6371.0088;

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

/**
 * Distancia en linea recta entre dos puntos via Haversine.
 * La precision de un radio terrestre medio alcanza para ordenar y filtrar
 * casos dentro de una ciudad, que es el alcance de esta pantalla.
 */
export function distanciaEnKm(desde: Punto, hasta: Punto): number {
  const latitudDesde = aRadianes(desde.latitud);
  const latitudHasta = aRadianes(hasta.latitud);
  const deltaLatitud = latitudHasta - latitudDesde;
  const deltaLongitud = aRadianes(hasta.longitud - desde.longitud);

  const h =
    Math.sin(deltaLatitud / 2) ** 2 +
    Math.cos(latitudDesde) * Math.cos(latitudHasta) * Math.sin(deltaLongitud / 2) ** 2;

  // el clamp evita que el error de coma flotante lleve el argumento fuera de [0, 1]
  return 2 * RADIO_MEDIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
