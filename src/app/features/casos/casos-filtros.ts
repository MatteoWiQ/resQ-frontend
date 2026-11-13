import { EstadoReporte, Reporte } from '../../shared/models/reporte.model';
import { normalizarTipoCaso } from '../../shared/constants/tipos-caso';
import { Posicion, distanciaKm, tieneUbicacion } from '../../shared/utils/casos';

/**
 * Rediseño: una sola barra de filtros para Casos.
 *
 * El estado y el texto los filtra el backend (GET /api/reportes?estado=&busqueda=).
 * El tipo de caso, la distancia y "buscar en esta zona" se filtran en el navegador
 * sobre lo que llego, porque el backend no los conoce.
 */
export type ClaveEstado = 'ABIERTOS' | 'URGENTES' | 'EN_PROCESO' | 'RESUELTOS' | 'TODOS';

export const ESTADOS_POR_CLAVE: Record<ClaveEstado, EstadoReporte[]> = {
  ABIERTOS: ['PENDIENTE', 'EN_PROCESO'],
  URGENTES: ['PENDIENTE'],
  EN_PROCESO: ['EN_PROCESO'],
  RESUELTOS: ['RESUELTO'],
  TODOS: [],
};

export const CLAVES_ESTADO: ClaveEstado[] = ['ABIERTOS', 'URGENTES', 'EN_PROCESO', 'RESUELTOS', 'TODOS'];
export const ESTADO_POR_DEFECTO: ClaveEstado = 'ABIERTOS';

export const DISTANCIAS_KM = [1, 5, 10] as const;

export type Orden = 'URGENTES' | 'RECIENTES' | 'CERCANOS';

/** Rectangulo visible del mapa al tocar "Buscar en esta zona". */
export interface Zona {
  sur: number;
  oeste: number;
  norte: number;
  este: number;
}

export interface FiltrosLocales {
  tipo: string | null;
  distanciaMaxKm: number | null;
  posicion: Posicion | null;
  zona: Zona | null;
}

export function aplicarFiltros(casos: Reporte[], filtros: FiltrosLocales): Reporte[] {
  return casos.filter((caso) => {
    if (filtros.tipo && normalizarTipoCaso(caso.tipoCaso) !== filtros.tipo) {
      return false;
    }
    if (filtros.distanciaMaxKm != null && filtros.posicion) {
      if (!tieneUbicacion(caso) || distanciaKm(filtros.posicion, caso) > filtros.distanciaMaxKm) {
        return false;
      }
    }
    if (filtros.zona && !dentroDeZona(caso, filtros.zona)) {
      return false;
    }
    return true;
  });
}

export function dentroDeZona(caso: Reporte, zona: Zona): boolean {
  return (
    tieneUbicacion(caso) &&
    caso.latitud >= zona.sur &&
    caso.latitud <= zona.norte &&
    caso.longitud >= zona.oeste &&
    caso.longitud <= zona.este
  );
}

const PRIORIDAD: Record<EstadoReporte, number> = { PENDIENTE: 0, EN_PROCESO: 1, RESUELTO: 2, CANCELADO: 3 };

export function ordenar(casos: Reporte[], orden: Orden, posicion: Posicion | null): Reporte[] {
  const reciente = (a: Reporte, b: Reporte) => fecha(b) - fecha(a);
  const copia = [...casos];
  if (orden === 'CERCANOS' && posicion) {
    const distancia = (c: Reporte) => (tieneUbicacion(c) ? distanciaKm(posicion, c) : Number.POSITIVE_INFINITY);
    return copia.sort((a, b) => distancia(a) - distancia(b) || reciente(a, b));
  }
  if (orden === 'RECIENTES') {
    return copia.sort(reciente);
  }
  return copia.sort((a, b) => (PRIORIDAD[a.estado] ?? 9) - (PRIORIDAD[b.estado] ?? 9) || reciente(a, b));
}

function fecha(reporte: Reporte): number {
  const t = new Date(reporte.fechaCreacion).getTime();
  return Number.isFinite(t) ? t : 0;
}
