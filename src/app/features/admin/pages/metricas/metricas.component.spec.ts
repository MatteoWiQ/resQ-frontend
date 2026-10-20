import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';

import { AuthService } from '../../../../core/services/auth.service';
import { MetricasService } from '../../../../core/services/metricas.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { Metricas, Periodo } from '../../../../shared/models/metricas.model';
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

describe('MetricasComponent (HU-34)', () => {
  /** Por defecto el periodo A devuelve base 10 y cualquier otro (el B) base 5. */
  async function crear(obtener?: (periodo: Periodo) => Observable<Metricas>) {
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
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MetricasComponent);
    fixtureActual = fixture;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, espia };
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
});
