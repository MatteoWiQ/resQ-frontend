import { Reporte } from '../../shared/models/reporte.model';

export { haceCuanto, metaCaso } from '../../shared/utils/casos';
export type { TiempoRelativo } from '../../shared/utils/casos';

/** Cuantos casos muestra el carrusel del Inicio. */
export const CASOS_CARRUSEL = 5;
/** Cuantas tarjetas muestra "Casos que necesitan ayuda ahora". */
export const CASOS_URGENTES = 3;

/**
 * En el Inicio solo hay casos abiertos: urgente (PENDIENTE, nadie lo tomo) o
 * activo (EN_PROCESO).
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

export function fecha(reporte: Reporte): number {
  const t = new Date(reporte.fechaCreacion).getTime();
  return Number.isFinite(t) ? t : 0;
}
