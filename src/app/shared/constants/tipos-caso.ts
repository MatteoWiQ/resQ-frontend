/**
 * Catalogo de tipos de caso de un reporte.
 *
 * El backend guarda el valor interno en mayusculas (PERDIDA, ENCONTRADA,
 * ABANDONADA); este modulo es el unico lugar donde viven esos valores y la
 * comparacion por tipo. El texto visible sale del catalogo de strings
 * (`shared.tiposCaso`).
 */
export const TIPOS_CASO = ['PERDIDA', 'ENCONTRADA', 'ABANDONADA'] as const;

export type TipoCaso = (typeof TIPOS_CASO)[number];

/**
 * Normaliza el tipo tal como llega del backend (por ej. "perdida" o con
 * espacios). Devuelve el tipo canonico si existe en el catalogo; en caso
 * contrario devuelve la cadena original para no ocultar datos historicos.
 */
export function normalizarTipoCaso(tipo: string | null | undefined): TipoCaso | string {
  const limpio = (tipo ?? '').trim();
  if (!limpio) {
    return limpio;
  }
  const canonico = limpio.toUpperCase();
  return (TIPOS_CASO as readonly string[]).includes(canonico) ? (canonico as TipoCaso) : limpio;
}

export function esTipoCaso(tipo: string | null | undefined): tipo is TipoCaso {
  return (TIPOS_CASO as readonly string[]).includes((tipo ?? '').trim().toUpperCase());
}
