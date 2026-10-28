import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';

import { MetricasCasosService } from '../../../../core/services/metricas-casos.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import { fechaCorta, variacion } from '../../../../shared/constants/metricas';
import { Conteo, MetricasCasos, Periodo } from '../../../../shared/models/metricas.model';
import { GraficoBarrasComponent } from '../graficos/grafico-barras.component';
import { SerieGrafico } from '../graficos/grafico.model';

/**
 * Lo que pide el panel: el periodo A, el B si se compara, y un numero que cambia en
 * cada "Consultar" para volver a pedir los datos aunque las fechas sean las mismas
 * (asi un reporte registrado, editado o eliminado se ve al actualizar el panel).
 */
export interface ConsultaMetricas {
  a: Periodo;
  b: Periodo | null;
  version: number;
}

/** Un indicador principal (tarjeta), con su valor en A y, si se compara, en B. */
export interface IndicadorCasos {
  etiqueta: TranslationKey;
  valorA: number;
  valorB: number | null;
  detalle: string;
  ayuda?: TranslationKey;
}

/** Fila de una tabla agrupada, ya traducida. */
export interface FilaConteo {
  clave: string;
  etiqueta: string;
  cantidadA: number;
  porcentajeA: number;
  cantidadB: number;
}

export interface TablaConteo {
  id: string;
  titulo: TranslationKey;
  columna: TranslationKey;
  filas: FilaConteo[];
  totalA: number;
  totalB: number;
}

type Agrupado = (m: MetricasCasos) => Conteo[];

const SIN_DATO = 'SIN_DATO';
const ESTADOS_ACTIVOS = ['PENDIENTE', 'EN_PROCESO'];

/**
 * HU-33: indicadores de casos y reportes del panel de metricas.
 *
 * El periodo lo elige la pagina de metricas (los mismos controles que HU-34); este
 * componente solo pide y presenta los datos: tarjetas con los totales, graficos de
 * barras para comparar zonas y estados, y tablas para cada agrupacion.
 */
@Component({
  selector: 'app-metricas-casos',
  standalone: true,
  imports: [TranslatePipe, GraficoBarrasComponent],
  templateUrl: './metricas-casos.component.html',
  styleUrls: ['../../pages/metricas/metricas.component.css', './metricas-casos.component.css'],
})
export class MetricasCasosComponent {
  private readonly metricasCasosService = inject(MetricasCasosService);
  private readonly translate = inject(TranslateService);

  readonly consulta = input.required<ConsultaMetricas>();

  readonly metricasA = signal<MetricasCasos | null>(null);
  readonly metricasB = signal<MetricasCasos | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');

  readonly comparando = computed(() => this.metricasB() !== null);

  constructor() {
    // switchMap: si se consulta otra vez antes de que llegue la respuesta, se descarta
    // la anterior y se muestra siempre la ultima consulta.
    toObservable(this.consulta)
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set('');
        }),
        switchMap(({ a, b }) =>
          forkJoin({
            a: this.metricasCasosService.obtener(a),
            b: b ? this.metricasCasosService.obtener(b) : of(null),
          }).pipe(
            map((respuesta) => ({ ok: true as const, ...respuesta })),
            catchError(() => of({ ok: false as const })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((resultado) => {
        if (resultado.ok) {
          this.metricasA.set(resultado.a);
          this.metricasB.set(resultado.b);
        } else {
          this.error.set(this.translate.t('metricasCasos.errorCargar'));
        }
        this.cargando.set(false);
      });
  }

  // ============ Indicadores ============

  readonly indicadores = computed<IndicadorCasos[]>(() => {
    const a = this.metricasA();
    if (!a) {
      return [];
    }
    const b = this.metricasB();
    const activos = (m: MetricasCasos) => sumar(m.casos.porEstado, ESTADOS_ACTIVOS);
    const resueltos = (m: MetricasCasos) => sumar(m.casos.porEstado, ['RESUELTO']);
    return [
      {
        etiqueta: 'metricasCasos.indicadores.reportes',
        valorA: a.reportes.total,
        valorB: b?.reportes.total ?? null,
        detalle: '',
      },
      {
        etiqueta: 'metricasCasos.indicadores.casos',
        valorA: a.casos.total,
        valorB: b?.casos.total ?? null,
        detalle: this.translate.t('metricasCasos.indicadores.porcentajeAprobados', {
          n: porcentaje(a.casos.total, a.reportes.total),
        }),
        ayuda: 'metricasCasos.indicadores.ayudaCasos',
      },
      {
        etiqueta: 'metricasCasos.indicadores.casosActivos',
        valorA: activos(a),
        valorB: b ? activos(b) : null,
        detalle: this.translate.t('metricasCasos.indicadores.porcentajeDeCasos', {
          n: porcentaje(activos(a), a.casos.total),
        }),
        ayuda: 'metricasCasos.indicadores.ayudaActivos',
      },
      {
        etiqueta: 'metricasCasos.indicadores.casosResueltos',
        valorA: resueltos(a),
        valorB: b ? resueltos(b) : null,
        detalle: this.translate.t('metricasCasos.indicadores.porcentajeDeCasos', {
          n: porcentaje(resueltos(a), a.casos.total),
        }),
      },
    ];
  });

  /** Mismo formato que las tarjetas de HU-34: "▲ 25 %", "▼ 10 %", "= sin cambio"... */
  textoVariacion(indicador: IndicadorCasos): string {
    if (indicador.valorB === null) {
      return '';
    }
    const cambio = variacion(indicador.valorA, indicador.valorB);
    if (cambio === null) {
      return indicador.valorA === 0
        ? this.translate.t('metricas.indicadores.igual')
        : this.translate.t('metricas.indicadores.sinBase');
    }
    if (cambio === 0) {
      return this.translate.t('metricas.indicadores.igual');
    }
    return this.translate.t(
      cambio > 0 ? 'metricas.indicadores.sube' : 'metricas.indicadores.baja',
      {
        n: Math.abs(cambio),
      },
    );
  }

  // ============ Graficos ============

  readonly zonasGrafico = computed(() => this.categoriasGrafico((m) => m.casos.porZona, 'zona'));
  readonly seriesZonas = computed(() => this.seriesGrafico((m) => m.casos.porZona));

  readonly estadosGrafico = computed(() =>
    this.categoriasGrafico((m) => m.casos.porEstado, 'estadoCaso'),
  );
  readonly seriesEstados = computed(() => this.seriesGrafico((m) => m.casos.porEstado));

  // ============ Tablas ============

  readonly tablas = computed<TablaConteo[]>(() => {
    if (!this.metricasA()) {
      return [];
    }
    return [
      this.tabla(
        'tabla-casos-estado',
        'metricasCasos.tablas.casosPorEstado',
        'metricasCasos.tablas.estado',
        (m) => m.casos.porEstado,
        (m) => m.casos.total,
        'estadoCaso',
      ),
      this.tabla(
        'tabla-casos-categoria',
        'metricasCasos.tablas.casosPorCategoria',
        'metricasCasos.tablas.categoria',
        (m) => m.casos.porCategoria,
        (m) => m.casos.total,
        'categoria',
      ),
      this.tabla(
        'tabla-casos-zona',
        'metricasCasos.tablas.casosPorZona',
        'metricasCasos.tablas.zona',
        (m) => m.casos.porZona,
        (m) => m.casos.total,
        'zona',
      ),
      this.tabla(
        'tabla-reportes-estado',
        'metricasCasos.tablas.reportesPorEstado',
        'metricasCasos.tablas.estado',
        (m) => m.reportes.porEstado,
        (m) => m.reportes.total,
        'estadoRevision',
      ),
      this.tabla(
        'tabla-reportes-categoria',
        'metricasCasos.tablas.reportesPorCategoria',
        'metricasCasos.tablas.categoria',
        (m) => m.reportes.porCategoria,
        (m) => m.reportes.total,
        'categoria',
      ),
    ];
  });

  nombrePeriodo(indice: 0 | 1): string {
    return this.translate.t(
      indice === 0 ? 'metricas.periodo.periodoA' : 'metricas.periodo.periodoB',
    );
  }

  // ============ Utilidades ============

  private tabla(
    id: string,
    titulo: TranslationKey,
    columna: TranslationKey,
    agrupado: Agrupado,
    total: (m: MetricasCasos) => number,
    tipo: TipoEtiqueta,
  ): TablaConteo {
    const a = this.metricasA()!;
    const b = this.metricasB();
    const totalA = total(a);
    return {
      id,
      titulo,
      columna,
      filas: this.clavesDe(agrupado).map((clave) => {
        const cantidadA = cantidad(agrupado(a), clave);
        return {
          clave,
          etiqueta: this.etiqueta(clave, tipo),
          cantidadA,
          porcentajeA: porcentaje(cantidadA, totalA),
          cantidadB: b ? cantidad(agrupado(b), clave) : 0,
        };
      }),
      totalA,
      totalB: b ? total(b) : 0,
    };
  }

  /** Filas de A y, si el B trae alguna que A no tiene (p. ej. SIN_UBICACION), tambien esa. */
  private clavesDe(agrupado: Agrupado): string[] {
    const claves = (this.metricasA() ? agrupado(this.metricasA()!) : []).map((fila) => fila.clave);
    const b = this.metricasB();
    for (const fila of b ? agrupado(b) : []) {
      if (!claves.includes(fila.clave)) {
        claves.push(fila.clave);
      }
    }
    return claves;
  }

  private categoriasGrafico(agrupado: Agrupado, tipo: TipoEtiqueta): string[] {
    return this.clavesDe(agrupado).map((clave) => this.etiqueta(clave, tipo));
  }

  private seriesGrafico(agrupado: Agrupado): SerieGrafico[] {
    const claves = this.clavesDe(agrupado);
    return [this.metricasA(), this.metricasB()]
      .filter((m): m is MetricasCasos => m !== null)
      .map((m, i) => ({
        nombre: `${this.nombrePeriodo(i as 0 | 1)} (${fechaCorta(m.desde)} – ${fechaCorta(m.hasta)})`,
        nombreCorto: this.nombrePeriodo(i as 0 | 1),
        valores: claves.map((clave) => cantidad(agrupado(m), clave)),
      }));
  }

  /** Traduce un codigo; uno que la app no conoce se muestra tal cual en vez de esconderlo. */
  private etiqueta(clave: string, tipo: TipoEtiqueta): string {
    if (clave === SIN_DATO) {
      return this.translate.t('metricasCasos.tablas.sinDato');
    }
    const ruta = `${PREFIJOS[tipo]}.${clave}`;
    const texto = this.translate.t(ruta as TranslationKey);
    return texto === ruta ? clave : texto;
  }
}

type TipoEtiqueta = 'estadoCaso' | 'estadoRevision' | 'categoria' | 'zona';

const PREFIJOS: Record<TipoEtiqueta, string> = {
  estadoCaso: 'shared.estados',
  estadoRevision: 'shared.estadosRevision',
  categoria: 'shared.tiposCaso',
  zona: 'metricasCasos.zonas',
};

function cantidad(filas: Conteo[], clave: string): number {
  return filas.find((fila) => fila.clave === clave)?.cantidad ?? 0;
}

function sumar(filas: Conteo[], claves: string[]): number {
  return claves.reduce((total, clave) => total + cantidad(filas, clave), 0);
}

/** Porcentaje entero de `parte` sobre `total`; sin total, 0. */
export function porcentaje(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((parte / total) * 100);
}
