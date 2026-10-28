import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';

import { AuthService } from '../../../../core/services/auth.service';
import { MetricasService } from '../../../../core/services/metricas.service';
import { MetricasCasosService } from '../../../../core/services/metricas-casos.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { Metricas, MetricasCasos, Periodo } from '../../../../shared/models/metricas.model';
import { authServiceDoble, webSocketServiceDoble } from '../../../../shared/testing/test-doubles';
import { MetricasComponent } from './metricas.component';

function metricas(periodo: Periodo, base: number, extra: Partial<Metricas> = {}): Metricas {
  return {
    desde: periodo.desde,
    hasta: periodo.hasta,
    agrupacion: 'DIA',
    usuarios: { registrados: base, activos: base + 1, totalAlCierre: 100 },
    voluntarios: {
      nuevos: 2,
      actuales: 9,
      porTipoAyuda: [
        { tipoAyuda: 'TRANSPORTE', nuevos: base, actuales: 4 },
        { tipoAyuda: 'SIN_TIPO', nuevos: 0, actuales: 1 },
      ],
    },
    organizaciones: {
      nuevas: 1,
      totalAlCierre: 6,
      porTipo: [
        { tipo: 'REFUGIO', nuevas: base, pendientes: 2, verificadas: 3, rechazadas: 1, total: 6 },
        { tipo: 'OTRO_TIPO', nuevas: 0, pendientes: 0, verificadas: 0, rechazadas: 0, total: 0 },
      ],
    },
    evolucion: [
      { inicio: periodo.desde, registrados: base, activos: 1 },
      { inicio: periodo.hasta, registrados: 0, activos: 2 },
    ],
    ...extra,
  };
}

/** HU-33: respuesta minima de la pestana de casos. */
function metricasCasos(periodo: Periodo): MetricasCasos {
  return {
    desde: periodo.desde,
    hasta: periodo.hasta,
    reportes: { total: 8, porEstado: [], porCategoria: [] },
    casos: { total: 5, porEstado: [], porCategoria: [], porZona: [] },
  };
}

describe('MetricasComponent (HU-34)', () => {
  /** Por defecto el periodo A devuelve base 10 y cualquier otro (el B) base 5. */
  async function crear(obtener?: (periodo: Periodo) => Observable<Metricas>, vista?: string) {
    const espiaCasos = vi.fn((periodo: Periodo) => of(metricasCasos(periodo)));
    const espia = vi.fn(
      obtener ??
        ((periodo: Periodo) =>
          of(metricas(periodo, periodo.hasta === fixtureActual?.componentInstance.periodoA().hasta ? 10 : 5))),
    );

    await TestBed.configureTestingModule({
      imports: [MetricasComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceDoble({ idUsuario: 1, email: 'admin@resq.com', rol: 'ADMIN' }) },
        { provide: WebSocketService, useValue: webSocketServiceDoble() },
        { provide: MetricasService, useValue: { obtener: espia } },
        { provide: MetricasCasosService, useValue: { obtener: espiaCasos } },
        ...(vista
          ? [{ provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ vista }) } } }]
          : []),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MetricasComponent);
    fixtureActual = fixture;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, espia, espiaCasos };
  }

  let fixtureActual: ComponentFixture<MetricasComponent> | undefined;

  const texto = (fixture: ComponentFixture<MetricasComponent>) =>
    (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('al abrir consulta los ultimos 30 dias y muestra los cuatro indicadores', async () => {
    const { fixture, espia } = await crear();

    expect(espia).toHaveBeenCalledTimes(1);
    const indicadores = (fixture.nativeElement as HTMLElement).querySelectorAll('.indicador');
    expect(indicadores).toHaveLength(4);
    expect(indicadores[0].textContent).toContain('Usuarios registrados');
    expect(indicadores[0].querySelector('.indicador-valor')?.textContent?.trim()).toBe('10');
    expect(indicadores[1].querySelector('.indicador-valor')?.textContent?.trim()).toBe('11');
  });

  it('sin comparar no muestra el grafico de comparacion, pero si la evolucion', async () => {
    const { fixture } = await crear();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('app-grafico-barras')).toBeNull();
    expect(raiz.querySelectorAll('app-grafico-evolucion')).toHaveLength(2);
  });

  it('muestra los agrupados en tablas, con nombres traducidos y los tipos desconocidos por su codigo', async () => {
    const { fixture } = await crear();
    const raiz = fixture.nativeElement as HTMLElement;

    const voluntarios = raiz.querySelector('#tabla-voluntarios')!.textContent!;
    expect(voluntarios).toContain('Transporte');
    expect(voluntarios).toContain('Sin tipo');

    const organizaciones = raiz.querySelector('#tabla-organizaciones')!.textContent!;
    expect(organizaciones).toContain('Refugio');
    expect(organizaciones).toContain('OTRO_TIPO');
  });

  it('al comparar consulta los dos periodos y muestra la variacion y el grafico de barras', async () => {
    const { fixture, espia } = await crear();

    fixture.componentInstance.cambiarComparar(true);
    fixture.detectChanges();

    expect(espia).toHaveBeenCalledTimes(3);
    // El periodo B propuesto es el anterior de igual duracion.
    const periodoB = espia.mock.calls[2][0] as Periodo;
    expect(periodoB.hasta < fixture.componentInstance.periodoA().desde).toBe(true);

    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('app-grafico-barras')).not.toBeNull();
    // 10 contra 5: subio 100 %.
    expect(raiz.querySelectorAll('.indicador-variacion')[0].textContent).toContain('▲ 100 %');
    expect(texto(fixture)).toContain('Período B: 5');
    expect(raiz.querySelectorAll('#tabla-voluntarios thead th')).toHaveLength(4);
  });

  it('si los periodos se agrupan distinto, la evolucion muestra solo el periodo A', async () => {
    const { fixture } = await crear((periodo) =>
      of(metricas(periodo, 3, { agrupacion: periodo.desde === '2025-01-01' ? 'MES' : 'DIA' })),
    );

    fixture.componentInstance.comparar.set(true);
    fixture.componentInstance.periodoB.set({ desde: '2025-01-01', hasta: '2025-12-31' });
    fixture.componentInstance.consultar();
    fixture.detectChanges();

    expect(fixture.componentInstance.evolucionSoloA()).toBe(true);
    expect(fixture.componentInstance.seriesRegistrados()).toHaveLength(1);
    expect(texto(fixture)).toContain('la evolución muestra solo el período A');
  });

  it('no consulta un periodo invertido y explica el motivo', async () => {
    const { fixture, espia } = await crear();

    fixture.componentInstance.cambiarFechaA('desde', '2026-12-31');
    fixture.componentInstance.cambiarFechaA('hasta', '2026-01-01');
    fixture.componentInstance.consultar();
    fixture.detectChanges();

    expect(espia).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.clavePeriodo()).toBe('PERSONALIZADO');
    expect((fixture.nativeElement as HTMLElement).querySelector('.error')?.textContent).toContain(
      'Período A: la fecha inicial no puede ser posterior a la final.',
    );
  });

  it('avisa si el backend no responde', async () => {
    const { fixture } = await crear(() => throwError(() => new Error('sin red')));

    expect((fixture.nativeElement as HTMLElement).querySelector('.error')?.textContent).toContain(
      'No se pudieron cargar las métricas',
    );
    expect(fixture.componentInstance.cargando()).toBe(false);
  });

  it('un atajo de periodo consulta enseguida', async () => {
    const { fixture, espia } = await crear();

    fixture.componentInstance.elegirPeriodo('MES_ANTERIOR');

    expect(espia).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.periodoA().desde.endsWith('-01')).toBe(true);
  });

  // ============ HU-33: pestana de casos y reportes ============

  it('abre en la pestana Comunidad y no consulta las metricas de casos', async () => {
    const { fixture, espiaCasos } = await crear();
    const raiz = fixture.nativeElement as HTMLElement;

    const pestanas = raiz.querySelectorAll('[role="tab"]');
    expect(Array.from(pestanas).map((p) => p.textContent?.trim())).toEqual(['Comunidad', 'Casos y reportes']);
    expect(pestanas[0].getAttribute('aria-selected')).toBe('true');
    expect(raiz.querySelector('app-metricas-casos')).toBeNull();
    expect(espiaCasos).not.toHaveBeenCalled();
  });

  it('la pestana Casos y reportes muestra sus indicadores con el periodo elegido', async () => {
    const { fixture, espiaCasos } = await crear();

    fixture.componentInstance.elegirVista('casos');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const raiz = fixture.nativeElement as HTMLElement;
    expect(raiz.querySelector('h1')?.textContent).toContain('Métricas de casos y reportes');
    expect(raiz.querySelector('app-metricas-casos')).not.toBeNull();
    expect(raiz.querySelector('#tabla-voluntarios')).toBeNull();
    expect(espiaCasos).toHaveBeenCalledWith(fixture.componentInstance.periodoA());
    expect(raiz.textContent).toContain('Reportes registrados');
  });

  it('?vista=casos abre directamente la pestana de casos', async () => {
    const { fixture } = await crear(undefined, 'casos');

    expect(fixture.componentInstance.vista()).toBe('casos');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-metricas-casos')).not.toBeNull();
  });

  it('cada Consultar valido pasa a la pestana de casos una consulta nueva, con el periodo B si se compara', async () => {
    const { fixture } = await crear();
    const antes = fixture.componentInstance.consultaCasos().version;

    fixture.componentInstance.comparar.set(true);
    fixture.componentInstance.consultar();

    const consulta = fixture.componentInstance.consultaCasos();
    expect(consulta.version).toBe(antes + 1);
    expect(consulta.a).toEqual(fixture.componentInstance.periodoA());
    expect(consulta.b).toEqual(fixture.componentInstance.periodoB());
  });

  it('un periodo invalido no se consulta en la pestana de casos y muestra el motivo', async () => {
    const { fixture } = await crear(undefined, 'casos');
    const antes = fixture.componentInstance.consultaCasos().version;

    fixture.componentInstance.cambiarFechaA('desde', '2026-12-31');
    fixture.componentInstance.cambiarFechaA('hasta', '2026-01-01');
    fixture.componentInstance.consultar();
    fixture.detectChanges();

    expect(fixture.componentInstance.consultaCasos().version).toBe(antes);
    expect((fixture.nativeElement as HTMLElement).querySelector('.error')?.textContent).toContain(
      'la fecha inicial no puede ser posterior a la final',
    );
  });

  it('en la pestana de casos no muestra el error de carga de las metricas de la comunidad', async () => {
    const { fixture } = await crear(() => throwError(() => new Error('sin red')), 'casos');

    expect(fixture.componentInstance.errorDeCarga()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'No se pudieron cargar las métricas. Inténtalo de nuevo.',
    );
  });
});
