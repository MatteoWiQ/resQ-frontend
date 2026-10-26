import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';

import { AppHeaderComponent } from '../../../../shared/components/app-header/app-header.component';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';
import { MetricasService } from '../../../../core/services/metricas.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { TranslationKey } from '../../../../core/i18n/strings';
import {
  ClavePeriodo,
  PERIODOS_PREDEFINIDOS,
  PERIODO_POR_DEFECTO,
  etiquetaTramo,
  fechaCorta,
  periodoAnterior,
  periodoPredefinido,
  validarPeriodo,
  variacion,
} from '../../../../shared/constants/metricas';
import { Metricas, Periodo } from '../../../../shared/models/metricas.model';
import { GraficoBarrasComponent } from '../../components/graficos/grafico-barras.component';
import { GraficoEvolucionComponent } from '../../components/graficos/grafico-evolucion.component';
import { SerieGrafico } from '../../components/graficos/grafico.model';

const SIN_TIPO = 'SIN_TIPO';

/** Un indicador principal (tarjeta) con su valor en el periodo A y, si se compara, en el B. */
export interface Indicador {
  etiqueta: TranslationKey;
  valorA: number;
  valorB: number | null;
  detalle: string;
  ayuda?: TranslationKey;
}

/**
 * HU-34: el administrador consulta indicadores de usuarios, voluntarios y
 * organizaciones en un periodo, y puede compararlos con otro periodo.
 *
 * Graficos para la comparacion y la evolucion en el tiempo; tablas para los
 * indicadores agrupados (por tipo de ayuda y por tipo de organizacion).
 */
@Component({
  selector: 'app-metricas',
  standalone: true,
  imports: [
    AppHeaderComponent,
    BackButtonComponent,
    FormsModule,
    TranslatePipe,
    GraficoBarrasComponent,
    GraficoEvolucionComponent,
  ],
  templateUrl: './metricas.component.html',
  styleUrl: './metricas.component.css',
})
export class MetricasComponent implements OnInit {
  private readonly metricasService = inject(MetricasService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly periodos = PERIODOS_PREDEFINIDOS;

  readonly clavePeriodo = signal<ClavePeriodo>(PERIODO_POR_DEFECTO);
  readonly periodoA = signal<Periodo>(periodoPredefinido(PERIODO_POR_DEFECTO));
  readonly comparar = signal(false);
  readonly periodoB = signal<Periodo>(periodoAnterior(this.periodoA()));

  readonly metricasA = signal<Metricas | null>(null);
  readonly metricasB = signal<Metricas | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');

  /** Lo que se muestra sigue a lo ultimo consultado, no al checkbox todavia sin consultar. */
  readonly comparando = computed(() => this.metricasB() !== null);

  readonly indicadores = computed<Indicador[]>(() => {
    const a = this.metricasA();
    if (!a) {
      return [];
    }
    const b = this.metricasB();
    return [
      {
        etiqueta: 'metricas.indicadores.registrados',
        valorA: a.usuarios.registrados,
        valorB: b?.usuarios.registrados ?? null,
        detalle: this.translate.t('metricas.indicadores.totalUsuarios', { n: a.usuarios.totalAlCierre }),
      },
      {
        etiqueta: 'metricas.indicadores.activos',
        valorA: a.usuarios.activos,
        valorB: b?.usuarios.activos ?? null,
        detalle: '',
        ayuda: 'metricas.indicadores.ayudaActivos',
      },
      {
        etiqueta: 'metricas.indicadores.nuevosVoluntarios',
        valorA: a.voluntarios.nuevos,
        valorB: b?.voluntarios.nuevos ?? null,
        detalle: this.translate.t('metricas.indicadores.voluntariosActuales', { n: a.voluntarios.actuales }),
        ayuda: 'metricas.indicadores.ayudaNuevosVoluntarios',
      },
      {
        etiqueta: 'metricas.indicadores.nuevasOrganizaciones',
        valorA: a.organizaciones.nuevas,
        valorB: b?.organizaciones.nuevas ?? null,
        detalle: this.translate.t('metricas.indicadores.totalOrganizaciones', {
          n: a.organizaciones.totalAlCierre,
        }),
      },
    ];
  });

  // ============ Graficos ============

  readonly categoriasComparacion = computed(() =>
    (
      [
        'metricas.graficos.registrados',
        'metricas.graficos.activos',
        'metricas.graficos.nuevosVoluntarios',
        'metricas.graficos.nuevasOrganizaciones',
      ] as const
    ).map((clave) => this.translate.t(clave)),
  );

  readonly seriesComparacion = computed<SerieGrafico[]>(() =>
    [this.metricasA(), this.metricasB()]
      .filter((m): m is Metricas => m !== null)
      .map((m, i) => ({
        nombre: this.nombrePeriodo(i, m),
        nombreCorto: this.nombreCortoPeriodo(i),
        valores: [m.usuarios.registrados, m.usuarios.activos, m.voluntarios.nuevos, m.organizaciones.nuevas],
      })),
  );

  /** El periodo B se superpone alineado por tramo solo si se agrupa igual que el A. */
  readonly evolucionSoloA = computed(() => {
    const b = this.metricasB();
    return b !== null && b.agrupacion !== this.metricasA()?.agrupacion;
  });

  private readonly periodosEnEvolucion = computed(() =>
    [this.metricasA(), this.evolucionSoloA() ? null : this.metricasB()].filter(
      (m): m is Metricas => m !== null,
    ),
  );

  /** Eje X: las fechas del periodo A; si el B tiene mas tramos, se completa con las suyas. */
  readonly etiquetasEvolucion = computed(() => {
    const [a, b] = this.periodosEnEvolucion().map((m) => this.etiquetasDe(m));
    return b && b.length > a.length ? [...a, ...b.slice(a.length)] : (a ?? []);
  });

  readonly agrupacionEvolucion = computed(() => {
    const agrupacion = this.metricasA()?.agrupacion ?? 'DIA';
    return this.translate.t(`metricas.graficos.agrupacion.${agrupacion}` as TranslationKey);
  });

  readonly seriesRegistrados = computed(() => this.seriesEvolucion((p) => p.registrados));
  readonly seriesActivos = computed(() => this.seriesEvolucion((p) => p.activos));

  // ============ Tablas ============

  readonly filasVoluntarios = computed(() => {
    const a = this.metricasA();
    const b = this.metricasB();
    return (a?.voluntarios.porTipoAyuda ?? []).map((fila) => ({
      ...fila,
      nuevosB: b?.voluntarios.porTipoAyuda.find((otra) => otra.tipoAyuda === fila.tipoAyuda)?.nuevos ?? 0,
    }));
  });

  readonly filasOrganizaciones = computed(() => {
    const a = this.metricasA();
    const b = this.metricasB();
    return (a?.organizaciones.porTipo ?? []).map((fila) => ({
      ...fila,
      nuevasB: b?.organizaciones.porTipo.find((otra) => otra.tipo === fila.tipo)?.nuevas ?? 0,
    }));
  });

  ngOnInit(): void {
    this.consultar();
  }

  // ============ Periodos ============

  /** Los atajos consultan enseguida; las fechas a mano esperan al boton Consultar. */
  elegirPeriodo(clave: ClavePeriodo): void {
    this.clavePeriodo.set(clave);
    if (clave === 'PERSONALIZADO') {
      return;
    }
    this.periodoA.set(periodoPredefinido(clave));
    this.periodoB.set(periodoAnterior(this.periodoA()));
    this.consultar();
  }

  cambiarFechaA(campo: keyof Periodo, valor: string): void {
    this.periodoA.update((periodo) => ({ ...periodo, [campo]: valor }));
    this.clavePeriodo.set('PERSONALIZADO');
  }

  cambiarFechaB(campo: keyof Periodo, valor: string): void {
    this.periodoB.update((periodo) => ({ ...periodo, [campo]: valor }));
  }

  /** Al activar la comparacion se propone el periodo anterior de igual duracion. */
  cambiarComparar(activo: boolean): void {
    this.comparar.set(activo);
    if (activo && !validarPeriodo(this.periodoA())) {
      this.periodoB.set(periodoAnterior(this.periodoA()));
    }
    this.consultar();
  }

  consultar(): void {
    const errorPeriodo = this.errorDePeriodos();
    if (errorPeriodo) {
      this.error.set(errorPeriodo);
      return;
    }

    this.cargando.set(true);
    this.error.set('');
    forkJoin({
      a: this.metricasService.obtener(this.periodoA()),
      b: this.comparar() ? this.metricasService.obtener(this.periodoB()) : of(null),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ a, b }) => {
          this.metricasA.set(a);
          this.metricasB.set(b);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(this.translate.t('metricas.errores.cargar'));
          this.cargando.set(false);
        },
      });
  }

  // ============ Presentacion ============

  /** "▲ 25 %", "▼ 10 %", "= sin cambio" o "sin base para comparar" (el B era cero). */
  textoVariacion(indicador: Indicador): string {
    if (indicador.valorB === null) {
      return '';
    }
    const porcentaje = variacion(indicador.valorA, indicador.valorB);
    if (porcentaje === null) {
      return indicador.valorA === 0
        ? this.translate.t('metricas.indicadores.igual')
        : this.translate.t('metricas.indicadores.sinBase');
    }
    if (porcentaje === 0) {
      return this.translate.t('metricas.indicadores.igual');
    }
    return this.translate.t(porcentaje > 0 ? 'metricas.indicadores.sube' : 'metricas.indicadores.baja', {
      n: Math.abs(porcentaje),
    });
  }

  etiquetaTipoAyuda(tipo: string): string {
    return this.etiquetaDeTipo(tipo, 'voluntario.tipos');
  }

  etiquetaTipoOrganizacion(tipo: string): string {
    return this.etiquetaDeTipo(tipo, 'organizaciones.tipos');
  }

  rangoDe(periodo: Periodo): string {
    return `${fechaCorta(periodo.desde)} – ${fechaCorta(periodo.hasta)}`;
  }

  private nombrePeriodo(indice: number, metricas: Metricas): string {
    return `${this.nombreCortoPeriodo(indice)} (${this.rangoDe(metricas)})`;
  }

  private nombreCortoPeriodo(indice: number): string {
    return this.translate.t(indice === 0 ? 'metricas.periodo.periodoA' : 'metricas.periodo.periodoB');
  }

  private etiquetasDe(metricas: Metricas): string[] {
    return metricas.evolucion.map((punto) => etiquetaTramo(punto.inicio, metricas.agrupacion));
  }

  private seriesEvolucion(valor: (punto: Metricas['evolucion'][number]) => number): SerieGrafico[] {
    return this.periodosEnEvolucion().map((m, i) => ({
      nombre: this.nombrePeriodo(i, m),
      nombreCorto: this.nombreCortoPeriodo(i),
      valores: m.evolucion.map(valor),
      etiquetas: this.etiquetasDe(m),
    }));
  }

  /** Un tipo que la app no conoce se muestra con su codigo en vez de esconderlo. */
  private etiquetaDeTipo(tipo: string, prefijo: string): string {
    if (tipo === SIN_TIPO) {
      return this.translate.t('metricas.tablas.sinTipo');
    }
    const clave = `${prefijo}.${tipo}`;
    const texto = this.translate.t(clave as TranslationKey);
    return texto === clave ? tipo : texto;
  }

  private errorDePeriodos(): string | null {
    const periodos: [Periodo, TranslationKey][] = [[this.periodoA(), 'metricas.periodo.periodoA']];
    if (this.comparar()) {
      periodos.push([this.periodoB(), 'metricas.periodo.periodoB']);
    }
    for (const [periodo, nombre] of periodos) {
      const codigo = validarPeriodo(periodo);
      if (codigo) {
        return this.translate.t(`metricas.errores.${codigo}` as TranslationKey, {
          periodo: this.translate.t(nombre),
        });
      }
    }
    return null;
  }
}
