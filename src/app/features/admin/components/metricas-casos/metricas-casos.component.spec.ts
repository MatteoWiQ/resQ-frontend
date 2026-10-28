import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';

import { MetricasCasosService } from '../../../../core/services/metricas-casos.service';
import { MetricasCasos, Periodo } from '../../../../shared/models/metricas.model';
import { ConsultaMetricas, MetricasCasosComponent, porcentaje } from './metricas-casos.component';

const PERIODO_A: Periodo = { desde: '2026-10-01', hasta: '2026-10-31' };
const PERIODO_B: Periodo = { desde: '2026-09-01', hasta: '2026-09-30' };

/** Con `base` 10: 20 reportes, 10 casos (4 pendientes, 2 en proceso, 3 resueltos, 1 cancelado). */
function metricasCasos(
  periodo: Periodo,
  base: number,
  extra: Partial<MetricasCasos> = {},
): MetricasCasos {
  return {
    desde: periodo.desde,
    hasta: periodo.hasta,
    reportes: {
      total: base * 2,
      porEstado: [
        { clave: 'PENDIENTE_REVISION', cantidad: base - 2 },
        { clave: 'APROBADO', cantidad: base },
        { clave: 'RECHAZADO', cantidad: 2 },
      ],
      porCategoria: [
        { clave: 'PERDIDA', cantidad: base },
        { clave: 'ENCONTRADA', cantidad: base - 4 },
        { clave: 'ABANDONADA', cantidad: 3 },
        { clave: 'SIN_DATO', cantidad: 1 },
      ],
    },
    casos: {
      total: base,
      porEstado: [
        { clave: 'PENDIENTE', cantidad: base - 6 },
        { clave: 'EN_PROCESO', cantidad: 2 },
        { clave: 'RESUELTO', cantidad: 3 },
        { clave: 'CANCELADO', cantidad: 1 },
      ],
      porCategoria: [
        { clave: 'PERDIDA', cantidad: base - 5 },
        { clave: 'ENCONTRADA', cantidad: 3 },
        { clave: 'ABANDONADA', cantidad: 2 },
      ],
      porZona: [
        { clave: 'CENTRO', cantidad: base - 4 },
        { clave: 'NORTE', cantidad: 3 },
        { clave: 'SUR', cantidad: 0 },
        { clave: 'ESTE', cantidad: 0 },
        { clave: 'OESTE', cantidad: 0 },
        { clave: 'AFUERAS', cantidad: 1 },
        { clave: 'ZONA_NUEVA', cantidad: 0 },
      ],
    },
    ...extra,
  };
}

describe('MetricasCasosComponent (HU-33)', () => {
  /** Por defecto el periodo A devuelve base 10 y el B base 5. */
  async function crear(
    consulta: ConsultaMetricas = { a: PERIODO_A, b: null, version: 0 },
    obtener?: (periodo: Periodo) => Observable<MetricasCasos>,
  ) {
    const espia = vi.fn(
      obtener ??
        ((periodo: Periodo) =>
          of(metricasCasos(periodo, periodo.desde === PERIODO_A.desde ? 10 : 5))),
    );

    await TestBed.configureTestingModule({
      imports: [MetricasCasosComponent],
      providers: [{ provide: MetricasCasosService, useValue: { obtener: espia } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(MetricasCasosComponent);
    fixture.componentRef.setInput('consulta', consulta);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, espia };
  }

  const raiz = (fixture: ComponentFixture<MetricasCasosComponent>) =>
    fixture.nativeElement as HTMLElement;
  const textoTabla = (fixture: ComponentFixture<MetricasCasosComponent>, id: string) =>
    raiz(fixture).querySelector(`#${id}`)?.textContent ?? '';

  it('consulta el periodo pedido y muestra los totales de reportes y casos', async () => {
    const { fixture, espia } = await crear();

    expect(espia).toHaveBeenCalledTimes(1);
    expect(espia).toHaveBeenCalledWith(PERIODO_A);

    const indicadores = raiz(fixture).querySelectorAll('.indicador');
    expect(indicadores).toHaveLength(4);
    const valores = Array.from(indicadores).map((i) =>
      i.querySelector('.indicador-valor')?.textContent?.trim(),
    );
    // 20 reportes, 10 casos, 6 activos (4 pendientes + 2 en proceso), 3 resueltos.
    expect(valores).toEqual(['20', '10', '6', '3']);
    expect(indicadores[1].textContent).toContain('50 % de los reportes');
    expect(indicadores[2].textContent).toContain('60 % de los casos');
  });

  it('muestra los casos por estado, categoria y zona, y los reportes por estado y categoria', async () => {
    const { fixture } = await crear();

    expect(raiz(fixture).querySelectorAll('table.tabla')).toHaveLength(5);

    const estados = textoTabla(fixture, 'tabla-casos-estado');
    expect(estados).toContain('Pendiente');
    expect(estados).toContain('En proceso');
    expect(estados).toContain('Resuelto');
    expect(estados).toContain('Cancelado');

    expect(textoTabla(fixture, 'tabla-casos-categoria')).toContain('Abandonada');
    expect(textoTabla(fixture, 'tabla-casos-zona')).toContain('Centro');
    expect(textoTabla(fixture, 'tabla-casos-zona')).toContain('Afueras');

    const revision = textoTabla(fixture, 'tabla-reportes-estado');
    expect(revision).toContain('En revisión');
    expect(revision).toContain('Aprobado');
    expect(revision).toContain('Rechazado');
  });

  it('traduce SIN_DATO y muestra por su codigo los valores que no conoce', async () => {
    const { fixture } = await crear();

    expect(textoTabla(fixture, 'tabla-reportes-categoria')).toContain('Sin dato');
    expect(textoTabla(fixture, 'tabla-casos-zona')).toContain('ZONA_NUEVA');
  });

  it('cada fila muestra su porcentaje sobre el total y la tabla cierra con el total', async () => {
    const { fixture } = await crear();
    const filas = raiz(fixture).querySelectorAll('#tabla-casos-estado tbody tr');

    // Pendiente: 4 de 10 casos.
    expect(filas[0].textContent).toContain('4');
    expect(filas[0].textContent).toContain('40 %');
    expect(raiz(fixture).querySelector('#tabla-casos-estado tfoot')?.textContent).toContain('10');
  });

  it('dibuja los graficos de casos por zona y por estado', async () => {
    const { fixture } = await crear();

    expect(raiz(fixture).querySelectorAll('app-grafico-barras')).toHaveLength(2);
    expect(fixture.componentInstance.zonasGrafico()).toContain('Centro');
    expect(fixture.componentInstance.seriesZonas()).toHaveLength(1);
    expect(fixture.componentInstance.seriesZonas()[0].valores[0]).toBe(6);
  });

  it('al comparar consulta los dos periodos, agrega la columna del B y la variacion', async () => {
    const { fixture, espia } = await crear({ a: PERIODO_A, b: PERIODO_B, version: 0 });

    expect(espia).toHaveBeenCalledTimes(2);
    expect(espia).toHaveBeenCalledWith(PERIODO_B);
    // 20 reportes contra 10: subio 100 %.
    expect(raiz(fixture).querySelectorAll('.indicador-variacion')[0].textContent).toContain(
      '▲ 100 %',
    );
    expect(raiz(fixture).textContent).toContain('Período B: 10');
    expect(raiz(fixture).querySelectorAll('#tabla-casos-estado thead th')).toHaveLength(4);
    expect(fixture.componentInstance.seriesZonas()).toHaveLength(2);
  });

  it('una fila que solo trae el periodo B tambien aparece en la tabla', async () => {
    const conSinUbicacion = (periodo: Periodo) => {
      const m = metricasCasos(periodo, 5);
      m.casos.porZona.push({ clave: 'SIN_UBICACION', cantidad: 2 });
      return m;
    };
    const { fixture } = await crear({ a: PERIODO_A, b: PERIODO_B, version: 0 }, (periodo) =>
      of(periodo.desde === PERIODO_A.desde ? metricasCasos(periodo, 10) : conSinUbicacion(periodo)),
    );

    expect(textoTabla(fixture, 'tabla-casos-zona')).toContain('Sin ubicación');
  });

  it('vuelve a consultar al actualizar el panel y refleja los datos nuevos', async () => {
    let base = 10;
    const { fixture, espia } = await crear(undefined, (periodo) =>
      of(metricasCasos(periodo, base)),
    );
    expect(raiz(fixture).querySelector('.indicador-valor')?.textContent?.trim()).toBe('20');

    // Se registraron reportes nuevos y el administrador pulsa "Consultar" con el mismo periodo.
    base = 12;
    fixture.componentRef.setInput('consulta', { a: PERIODO_A, b: null, version: 1 });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(espia).toHaveBeenCalledTimes(2);
    expect(raiz(fixture).querySelector('.indicador-valor')?.textContent?.trim()).toBe('24');
  });

  it('muestra la ultima consulta aunque la anterior responda despues', async () => {
    const lenta = new Subject<MetricasCasos>();
    let llamada = 0;
    const { fixture } = await crear(undefined, (periodo) =>
      ++llamada === 1 ? lenta : of(metricasCasos(periodo, 3)),
    );

    fixture.componentRef.setInput('consulta', { a: PERIODO_A, b: null, version: 1 });
    fixture.detectChanges();
    await fixture.whenStable();
    lenta.next(metricasCasos(PERIODO_A, 10));
    fixture.detectChanges();

    expect(fixture.componentInstance.metricasA()?.reportes.total).toBe(6);
  });

  it('avisa si el backend no responde y deja de cargar', async () => {
    const { fixture } = await crear(undefined, () => throwError(() => new Error('sin red')));

    expect(raiz(fixture).querySelector('.error')?.textContent).toContain(
      'No se pudieron cargar las métricas de casos',
    );
    expect(fixture.componentInstance.cargando()).toBe(false);
  });

  it('porcentaje redondea y no divide por cero', () => {
    expect(porcentaje(1, 3)).toBe(33);
    expect(porcentaje(2, 3)).toBe(67);
    expect(porcentaje(5, 0)).toBe(0);
  });
});
