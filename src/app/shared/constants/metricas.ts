import { TranslationKey } from '../../core/i18n/strings';
import { AgrupacionMetricas, Periodo } from '../models/metricas.model';

/**
 * HU-34: reglas de los periodos de las metricas. El limite debe coincidir con el
 * del backend (MetricasService.MAX_DIAS_PERIODO).
 */
export const MAX_DIAS_PERIODO = 731;

export type ClavePeriodo = 'ULTIMOS_7' | 'ULTIMOS_30' | 'MES_ACTUAL' | 'MES_ANTERIOR' | 'PERSONALIZADO';

export const PERIODO_POR_DEFECTO: Exclude<ClavePeriodo, 'PERSONALIZADO'> = 'ULTIMOS_30';

export const PERIODOS_PREDEFINIDOS: readonly { clave: ClavePeriodo; etiqueta: TranslationKey }[] = [
  { clave: 'ULTIMOS_7', etiqueta: 'metricas.periodo.ULTIMOS_7' },
  { clave: 'ULTIMOS_30', etiqueta: 'metricas.periodo.ULTIMOS_30' },
  { clave: 'MES_ACTUAL', etiqueta: 'metricas.periodo.MES_ACTUAL' },
  { clave: 'MES_ANTERIOR', etiqueta: 'metricas.periodo.MES_ANTERIOR' },
  { clave: 'PERSONALIZADO', etiqueta: 'metricas.periodo.PERSONALIZADO' },
];

/**
 * Colores de las series de los graficos, en orden fijo: la serie 1 es siempre el
 * periodo A (o "registrados") y la 2 el periodo B (o "activos"). El acento de la
 * marca y un azul: el par pasa el validador de paleta (separacion para daltonismo,
 * contraste >= 3:1 sobre blanco). El vino principal (--primary) es demasiado oscuro
 * para usarlo como serie.
 */
export const COLORES_SERIE = ['#aa5165', '#2a78d6'] as const;

/** Codigo del error; el componente lo traduce con i18n (metricas.errores.*). */
export type CodigoErrorPeriodo = 'incompleto' | 'invertido' | 'muyLargo';

// Las fechas se arman con la zona horaria local: con new Date('2026-10-01') el
// navegador la toma como UTC y en Bolivia (UTC-4) caeria el 30 de septiembre.

/** Date local → '2026-10-01'. */
export function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** '2026-10-01' → Date local a medianoche. */
export function desdeIso(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

/** Dias del periodo contando los dos extremos. */
export function diasDelPeriodo(periodo: Periodo): number {
  const milisegundos = desdeIso(periodo.hasta).getTime() - desdeIso(periodo.desde).getTime();
  return Math.round(milisegundos / 86_400_000) + 1;
}

/** Rango de un atajo, calculado respecto de `hoy`. PERSONALIZADO no tiene rango propio. */
export function periodoPredefinido(clave: Exclude<ClavePeriodo, 'PERSONALIZADO'>, hoy = new Date()): Periodo {
  const dia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  switch (clave) {
    case 'ULTIMOS_7':
      return { desde: aIso(sumarDias(dia, -6)), hasta: aIso(dia) };
    case 'ULTIMOS_30':
      return { desde: aIso(sumarDias(dia, -29)), hasta: aIso(dia) };
    case 'MES_ACTUAL':
      return { desde: aIso(new Date(dia.getFullYear(), dia.getMonth(), 1)), hasta: aIso(dia) };
    case 'MES_ANTERIOR':
      return {
        desde: aIso(new Date(dia.getFullYear(), dia.getMonth() - 1, 1)),
        hasta: aIso(new Date(dia.getFullYear(), dia.getMonth(), 0)),
      };
  }
}

/** El periodo de igual duracion que termina justo antes de `periodo`: el punto de comparacion natural. */
export function periodoAnterior(periodo: Periodo): Periodo {
  const dias = diasDelPeriodo(periodo);
  const hasta = sumarDias(desdeIso(periodo.desde), -1);
  return { desde: aIso(sumarDias(hasta, -(dias - 1))), hasta: aIso(hasta) };
}

export function validarPeriodo(periodo: Periodo): CodigoErrorPeriodo | null {
  if (!periodo.desde || !periodo.hasta) {
    return 'incompleto';
  }
  if (periodo.desde > periodo.hasta) {
    return 'invertido';
  }
  return diasDelPeriodo(periodo) > MAX_DIAS_PERIODO ? 'muyLargo' : null;
}

/**
 * Variacion porcentual de `actual` respecto de `base`, redondeada a entero.
 * Sin base (cero) no hay porcentaje que calcular: devuelve null.
 */
export function variacion(actual: number, base: number): number | null {
  if (base === 0) {
    return null;
  }
  return Math.round(((actual - base) / base) * 100);
}

/** '2026-10-05' → '05/10' por dia o semana; '10/2026' por mes. */
export function etiquetaTramo(inicio: string, agrupacion: AgrupacionMetricas): string {
  const [anio, mes, dia] = inicio.split('-');
  return agrupacion === 'MES' ? `${mes}/${anio}` : `${dia}/${mes}`;
}

/** '2026-10-05' → '05/10/2026'. */
export function fechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

/**
 * Marcas del eje Y: de 0 a un maximo "redondo" (1, 2, 5 o 10 por la potencia de 10)
 * que cubre `maximo`, en `divisiones` pasos enteros.
 */
export function marcasEjeY(maximo: number, divisiones = 4): number[] {
  const paso = pasoRedondo(Math.max(maximo, 1) / divisiones);
  return Array.from({ length: divisiones + 1 }, (_, i) => i * paso);
}

function pasoRedondo(valor: number): number {
  const potencia = 10 ** Math.floor(Math.log10(valor));
  const factor = [1, 2, 5, 10].find((candidato) => valor <= candidato * potencia) ?? 10;
  return Math.max(1, factor * potencia);
}
