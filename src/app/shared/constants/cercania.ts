import { Reporte } from '../models/reporte.model';
import { Punto, distanciaEnKm } from './geo';

/**
 * Los radios son una preferencia de la pantalla, no un dato persistido:
 * el calculo ocurre en el cliente porque el volumen de casos cabe en memoria
 * y asi se evita sumar PostGIS al backend.
 */
export type ClaveRadio = 'SIN_LIMITE' | 'KM_1' | 'KM_5' | 'KM_10';

export interface OpcionRadio {
  clave: ClaveRadio;
  km: number | null;
}

export const RADIOS_CERCANIA: OpcionRadio[] = [
  { clave: 'SIN_LIMITE', km: null },
  { clave: 'KM_1', km: 1 },
  { clave: 'KM_5', km: 5 },
  { clave: 'KM_10', km: 10 },
];

export const RADIO_TODOS: OpcionRadio = RADIOS_CERCANIA[0];

export function radioPorClave(clave: ClaveRadio): OpcionRadio {
  return RADIOS_CERCANIA.find((radio) => radio.clave === clave) ?? RADIO_TODOS;
}

/** Un caso sin coordenada no puede participar de una busqueda por cercania. */
export interface ReporteCercano {
  reporte: Reporte;
  distanciaKm: number | null;
}

export function reportesConDistancia(reportes: Reporte[], origen: Punto): ReporteCercano[] {
  const resultado: ReporteCercano[] = [];

  for (const reporte of reportes) {
    if (reporte.latitud == null || reporte.longitud == null) {
      continue;
    }

    resultado.push({
      reporte,
      distanciaKm: distanciaEnKm(origen, {
        latitud: reporte.latitud,
        longitud: reporte.longitud,
      }),
    });
  }

  return resultado;
}

export function ordenarPorDistancia(casos: ReporteCercano[]): ReporteCercano[] {
  return [...casos].sort(
    (a, b) => (a.distanciaKm ?? Infinity) - (b.distanciaKm ?? Infinity)
  );
}

export function dentroDelRadio(casos: ReporteCercano[], km: number | null): ReporteCercano[] {
  if (km === null) {
    return casos;
  }

  return casos.filter((caso) => caso.distanciaKm !== null && caso.distanciaKm <= km);
}
