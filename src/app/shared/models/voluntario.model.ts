export type TipoAyuda = 'TRANSPORTE' | 'HOGAR_TEMPORAL' | 'ALIMENTO' | 'RESCATE';

// Las etiquetas visibles ahora viven en strings.ts, bajo la clave
// voluntario.tipos.<VALOR> (ej: voluntario.tipos.TRANSPORTE)
export const TIPOS_AYUDA_VALORES: TipoAyuda[] = [
  'TRANSPORTE',
  'HOGAR_TEMPORAL',
  'ALIMENTO',
  'RESCATE',
];