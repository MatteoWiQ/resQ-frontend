import { EstadoReporte } from '../models/reporte.model';

export type ClaveFiltro = 'TODOS' | 'URGENTES' | 'ACTIVOS' | 'RESUELTOS' | 'CANCELADOS';

export interface FiltroReporte {
  clave: ClaveFiltro;
  estados: EstadoReporte[];
}

/**
 * Los grupos son una convencion de negocio, no un dato persistido:
 * el backend solo conoce los estados sueltos.
 */
export const FILTROS_REPORTE: FiltroReporte[] = [
  { clave: 'TODOS', estados: [] },
  { clave: 'URGENTES', estados: ['PENDIENTE'] },
  { clave: 'ACTIVOS', estados: ['PENDIENTE', 'EN_PROCESO'] },
  { clave: 'RESUELTOS', estados: ['RESUELTO'] },
  { clave: 'CANCELADOS', estados: ['CANCELADO'] },
];

export const FILTRO_TODOS: FiltroReporte = FILTROS_REPORTE[0];

export function filtroPorClave(clave: ClaveFiltro): FiltroReporte {
  return FILTROS_REPORTE.find((filtro) => filtro.clave === clave) ?? FILTRO_TODOS;
}

export function claveFiltroPorEstados(estados: EstadoReporte[] | null | undefined): ClaveFiltro {
  if (!estados || estados.length === 0) {
    return 'TODOS';
  }

  const normalizados = [...new Set(estados)].sort().join(',');

  return (
    FILTROS_REPORTE.find((filtro) => [...filtro.estados].sort().join(',') === normalizados)
      ?.clave ?? 'TODOS'
  );
}
