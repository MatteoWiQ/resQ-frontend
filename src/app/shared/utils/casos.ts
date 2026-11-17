import { Reporte } from '../models/reporte.model';
import { normalizarTipoCaso } from '../constants/tipos-caso';

/**
 * Rediseño: reglas de presentacion de un caso compartidas por Inicio y Casos.
 *
 * El backend no tiene un campo "urgente": se considera urgente lo que nadie tomo
 * todavia (PENDIENTE) y activo lo que ya esta en proceso.
 */
export type Insignia = 'urgente' | 'activo' | 'resuelto' | 'cancelado';

export function insigniaDe(reporte: Reporte): Insignia {
  switch (reporte.estado) {
    case 'PENDIENTE':
      return 'urgente';
    case 'EN_PROCESO':
      return 'activo';
    case 'RESUELTO':
      return 'resuelto';
    default:
      return 'cancelado';
  }
}

/** Color del punto en el mapa por insignia (paleta del rediseño). */
export const COLOR_INSIGNIA: Record<Insignia, string> = {
  urgente: '#d9621a',
  activo: '#237a57',
  resuelto: '#93a29c',
  cancelado: '#b8c2bd',
};

export type TiempoRelativo =
  | { clave: 'inicio.tiempo.ahora'; n: 0 }
  | { clave: 'inicio.tiempo.minutos' | 'inicio.tiempo.horas' | 'inicio.tiempo.dias'; n: number };

/** "hace 40 min", "hace 3 h"... como clave de traduccion y numero. */
export function haceCuanto(fechaIso: string, ahora: Date = new Date()): TiempoRelativo {
  const minutos = Math.floor((ahora.getTime() - new Date(fechaIso).getTime()) / 60_000);
  if (!Number.isFinite(minutos) || minutos < 1) {
    return { clave: 'inicio.tiempo.ahora', n: 0 };
  }
  if (minutos < 60) {
    return { clave: 'inicio.tiempo.minutos', n: minutos };
  }
  const horas = Math.floor(minutos / 60);
  if (horas < 24) {
    return { clave: 'inicio.tiempo.horas', n: horas };
  }
  return { clave: 'inicio.tiempo.dias', n: Math.floor(horas / 24) };
}

type Traducir = (clave: string, params?: Record<string, string | number>) => string;

/** Nombre visible del tipo de caso; si no tiene traduccion se muestra tal cual. */
export function etiquetaTipo(tipoCaso: string, t: Traducir): string {
  const tipo = normalizarTipoCaso(tipoCaso);
  const clave = `shared.tiposCaso.${tipo}`;
  const traducido = t(clave);
  return traducido === clave ? tipoCaso : traducido;
}

/** Texto corto debajo del titulo de un caso: "Perdida · 1,2 km · hace 40 min". */
export function metaCaso(reporte: Reporte, t: Traducir, ahora: Date = new Date(), distanciaKm?: number | null): string {
  const tiempo = haceCuanto(reporte.fechaCreacion, ahora);
  const partes = [etiquetaTipo(reporte.tipoCaso, t)];
  if (distanciaKm != null) {
    partes.push(formatearDistancia(distanciaKm));
  }
  partes.push(t(tiempo.clave, { n: tiempo.n }));
  return partes.join(' · ');
}

export interface Posicion {
  latitud: number;
  longitud: number;
}

export function tieneUbicacion(reporte: Reporte): reporte is Reporte & { latitud: number; longitud: number } {
  return typeof reporte.latitud === 'number' && typeof reporte.longitud === 'number';
}

/** Distancia en km entre dos puntos (formula del haversine). */
export function distanciaKm(a: Posicion, b: Posicion): number {
  const radianes = (g: number) => (g * Math.PI) / 180;
  const dLat = radianes(b.latitud - a.latitud);
  const dLon = radianes(b.longitud - a.longitud);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(radianes(a.latitud)) * Math.cos(radianes(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "850 m", "1,2 km", "12 km". */
export function formatearDistancia(km: number): string {
  if (km < 1) {
    return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  }
  return km < 10 ? `${km.toFixed(1).replace('.', ',')} km` : `${Math.round(km)} km`;
}
