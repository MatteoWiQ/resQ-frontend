import { EstadoReporte } from '../models/reporte.model';

/**
 * HU-24: como el administrador consulta y modifica los casos desde el panel.
 *
 * Vive aca y no en los componentes para que el mapa, el panel y la vista de detalle
 * ofrezcan exactamente las mismas opciones.
 */
export type OrdenReporte = 'RECIENTES' | 'ANTIGUOS';

export interface OpcionOrden {
  clave: OrdenReporte;
  etiqueta: string;
}

export const ORDENES_REPORTE: OpcionOrden[] = [
  { clave: 'RECIENTES', etiqueta: 'admin.orden.recientes' },
  { clave: 'ANTIGUOS', etiqueta: 'admin.orden.antiguos' },
];

export const ORDEN_POR_DEFECTO: OrdenReporte = 'RECIENTES';

/**
 * Estados a los que se puede llevar un caso, en el mismo orden que acepta el
 * backend. Resuelto y cancelado no quedan bloqueados: siempre se puede reabrir el
 * caso, porque un animal que sigue en riesgo deja de estar resuelto.
 */
export const TRANSICIONES_ESTADO: Record<EstadoReporte, EstadoReporte[]> = {
  PENDIENTE: ['EN_PROCESO', 'CANCELADO'],
  EN_PROCESO: ['RESUELTO', 'CANCELADO', 'PENDIENTE'],
  RESUELTO: ['EN_PROCESO', 'PENDIENTE'],
  CANCELADO: ['PENDIENTE'],
};

/** A que estados puede pasar el caso que esta en `estado`. */
export function estadosSiguientes(estado: EstadoReporte): EstadoReporte[] {
  return TRANSICIONES_ESTADO[estado] ?? [];
}

/**
 * Un caso en un estado que el backend todavia no conoce (datos viejos, por
 * ejemplo) no tiene salida: antes que ofrecer un select vacio, la interfaz pide
 * revisar el caso antes de tocarlo.
 */
export function puedeCambiarEstado(estado: EstadoReporte): boolean {
  return estadosSiguientes(estado).length > 0;
}