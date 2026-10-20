import { Component, computed, input, signal } from '@angular/core';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { COLORES_SERIE, marcasEjeY } from '../../../../shared/constants/metricas';
import { anchoDelContenedor, posicionTooltip } from './ancho-del-contenedor';
import { DetalleHover, SerieGrafico } from './grafico.model';

const ALTO = 240;
const MARGEN = { arriba: 12, derecha: 8, abajo: 40, izquierda: 36 };
const GROSOR_MAXIMO = 24;
const SEPARACION = 2;
const RADIO = 4;
/** Por debajo de este ancho por categoria, la etiqueta se parte en dos lineas. */
const ANCHO_ETIQUETA_EN_UNA_LINEA = 140;

interface Barra {
  ruta: string;
  color: string;
}

/**
 * HU-34: barras agrupadas por categoria (una barra por serie). Se usa para comparar
 * los indicadores de dos periodos. SVG propio para no sumar una libreria de graficos
 * al bundle por dos graficos.
 */
@Component({
  selector: 'app-grafico-barras',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './grafico-barras.component.html',
  styleUrls: ['./graficos-comunes.css'],
})
export class GraficoBarrasComponent {
  readonly titulo = input.required<string>();
  readonly categorias = input.required<string[]>();
  readonly series = input.required<SerieGrafico[]>();

  readonly ancho = anchoDelContenedor();
  readonly alto = ALTO;
  readonly margen = MARGEN;
  readonly colores = COLORES_SERIE;

  readonly hover = signal<DetalleHover | null>(null);

  readonly marcas = computed(() => marcasEjeY(Math.max(0, ...this.series().flatMap((s) => s.valores))));

  readonly anchoCategoria = computed(
    () => (this.ancho() - MARGEN.izquierda - MARGEN.derecha) / Math.max(1, this.categorias().length),
  );

  /** "Nuevas organizaciones" → ["Nuevas", "organizaciones"] cuando no entra en una linea. */
  readonly lineasCategoria = computed(() =>
    this.categorias().map((categoria) => {
      const espacio = categoria.indexOf(' ');
      return this.anchoCategoria() >= ANCHO_ETIQUETA_EN_UNA_LINEA || espacio < 0
        ? [categoria]
        : [categoria.slice(0, espacio), categoria.slice(espacio + 1)];
    }),
  );

  readonly barras = computed<Barra[]>(() => {
    const series = this.series();
    const anchoCategoria = this.anchoCategoria();
    const grosor = Math.min(
      GROSOR_MAXIMO,
      (anchoCategoria * 0.6 - SEPARACION * (series.length - 1)) / Math.max(1, series.length),
    );
    const anchoGrupo = grosor * series.length + SEPARACION * (series.length - 1);

    return this.categorias().flatMap((_, i) => {
      const inicioGrupo = this.inicioCategoria(i) + (anchoCategoria - anchoGrupo) / 2;
      return series
        .map((serie, s) => ({ valor: serie.valores[i] ?? 0, s }))
        .filter(({ valor }) => valor > 0)
        .map(({ valor, s }) => ({
          ruta: this.rutaBarra(inicioGrupo + s * (grosor + SEPARACION), this.y(valor), grosor),
          color: COLORES_SERIE[s % COLORES_SERIE.length],
        }));
    });
  });

  /** Coordenada vertical de un valor. */
  y(valor: number): number {
    const maximo = this.marcas().at(-1) ?? 1;
    const alturaUtil = ALTO - MARGEN.arriba - MARGEN.abajo;
    return MARGEN.arriba + (1 - valor / maximo) * alturaUtil;
  }

  inicioCategoria(i: number): number {
    return MARGEN.izquierda + i * this.anchoCategoria();
  }

  centroCategoria(i: number): number {
    return this.inicioCategoria(i) + this.anchoCategoria() / 2;
  }

  mostrar(i: number): void {
    this.hover.set({ indice: i, izquierda: posicionTooltip(this.centroCategoria(i), this.ancho()) });
  }

  /** Extremo de datos redondeado (4px) y base recta sobre el eje. */
  private rutaBarra(x: number, y: number, ancho: number): string {
    const base = ALTO - MARGEN.abajo;
    const radio = Math.min(RADIO, ancho / 2, base - y);
    return (
      `M${x},${base} V${y + radio} Q${x},${y} ${x + radio},${y} ` +
      `H${x + ancho - radio} Q${x + ancho},${y} ${x + ancho},${y + radio} V${base} Z`
    );
  }
}
