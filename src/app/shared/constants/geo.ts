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
