import { Reporte } from '../../shared/models/reporte.model';

/** Cuantos casos muestra el carrusel del Inicio. */
export const CASOS_CARRUSEL = 5;
/** Cuantas tarjetas muestra "Casos que necesitan ayuda ahora". */
export const CASOS_URGENTES = 3;

/**
 * El backend no tiene un campo "urgente": en el Inicio se considera urgente lo que
 * nadie tomo todavia (PENDIENTE) y activo lo que ya esta en proceso.
 */
export type Urgencia = 'urgente' | 'activo';

export function urgenciaDe(reporte: Reporte): Urgencia {
  return reporte.estado === 'PENDIENTE' ? 'urgente' : 'activo';
}

/** Casos abiertos: primero los urgentes y, dentro de cada grupo, los mas recientes. */
export function casosAbiertos(reportes: Reporte[]): Reporte[] {
  return reportes
    .filter((r) => r.estado === 'PENDIENTE' || r.estado === 'EN_PROCESO')
    .sort((a, b) => {
      const porUrgencia = Number(b.estado === 'PENDIENTE') - Number(a.estado === 'PENDIENTE');
      return porUrgencia !== 0 ? porUrgencia : fecha(b) - fecha(a);
    });
}

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

function fecha(reporte: Reporte): number {
  const t = new Date(reporte.fechaCreacion).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Texto corto debajo del titulo de un caso: "Perdida · hace 40 min". */
export function metaCaso(
  reporte: Reporte,
  t: (clave: string, params?: Record<string, string | number>) => string,
  ahora: Date = new Date(),
): string {
  const tipo = t(`shared.tiposCaso.${reporte.tipoCaso}`);
  const tiempo = haceCuanto(reporte.fechaCreacion, ahora);
  return `${tipo} · ${t(tiempo.clave, { n: tiempo.n })}`;
}
