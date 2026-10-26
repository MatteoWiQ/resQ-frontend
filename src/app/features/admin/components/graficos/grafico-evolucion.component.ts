import { Component, computed, input, signal } from '@angular/core';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { COLORES_SERIE, marcasEjeY } from '../../../../shared/constants/metricas';
import { anchoDelContenedor, posicionTooltip } from './ancho-del-contenedor';
import { DetalleHover, SerieGrafico } from './grafico.model';

const ALTO = 220;
const MARGEN = { arriba: 12, derecha: 16, abajo: 28, izquierda: 36 };
/** Espacio minimo por etiqueta del eje X ("05/10" o "10/2026"): con menos, se pisan. */
const ANCHO_POR_ETIQUETA_X = 64;

/**
 * HU-34: lineas de una o dos series a lo largo de los tramos de un periodo
 * (registros y usuarios activos). Al pasar el mouse muestra una guia vertical y
 * los valores del tramo.
 */
@Component({
  selector: 'app-grafico-evolucion',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './grafico-evolucion.component.html',
  styleUrls: ['./graficos-comunes.css'],
})
export class GraficoEvolucionComponent {
  readonly titulo = input.required<string>();
  readonly etiquetas = input.required<string[]>();
  readonly series = input.required<SerieGrafico[]>();

  readonly ancho = anchoDelContenedor();
  readonly alto = ALTO;
  readonly margen = MARGEN;
  readonly colores = COLORES_SERIE;

  readonly hover = signal<DetalleHover | null>(null);

  readonly marcas = computed(() => marcasEjeY(Math.max(0, ...this.series().flatMap((s) => s.valores))));

  readonly rutas = computed(() =>
    this.series().map((serie) =>
      serie.valores.map((valor, i) => `${i === 0 ? 'M' : 'L'}${this.x(i)},${this.y(valor)}`).join(' '),
    ),
  );

  /** Indices de los tramos que llevan etiqueta en el eje X, repartidos de forma pareja. */
  readonly etiquetasVisibles = computed(() => {
    const total = this.etiquetas().length;
    const maximo = Math.max(2, Math.floor(this.anchoUtil() / ANCHO_POR_ETIQUETA_X));
    const paso = Math.ceil(total / maximo);
    return this.etiquetas()
      .map((_, i) => i)
      .filter((i) => i % paso === 0);
  });

  private readonly anchoUtil = computed(() => this.ancho() - MARGEN.izquierda - MARGEN.derecha);

  private readonly anchoTramo = computed(() => this.anchoUtil() / Math.max(1, this.etiquetas().length));

  x(i: number): number {
    const total = this.etiquetas().length;
    const anchoUtil = this.anchoUtil();
    return total <= 1 ? MARGEN.izquierda + anchoUtil / 2 : MARGEN.izquierda + (i * anchoUtil) / (total - 1);
  }

  y(valor: number): number {
    const maximo = this.marcas().at(-1) ?? 1;
    const alturaUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
    return MARGEN.arriba + (1 - valor / maximo) * alturaUtil;
  }

  /** El objetivo de hover de cada tramo cubre la franja que lo rodea, no solo el punto. */
  inicioObjetivo(i: number): number {
    return Math.max(MARGEN.izquierda, this.x(i) - this.anchoTramo() / 2);
  }

  anchoObjetivo(): number {
    return this.anchoTramo();
  }

  /** Si una serie tiene menos tramos que el eje (periodo B mas corto), el hueco se marca con "—". */
  valorEn(serie: SerieGrafico, i: number): number | string {
    return i < serie.valores.length ? serie.valores[i] : '—';
  }

  mostrar(i: number): void {
    this.hover.set({ indice: i, izquierda: posicionTooltip(this.x(i), this.ancho()) });
  }
}
