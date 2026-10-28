import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { MetricasCasosService } from './metricas-casos.service';

describe('MetricasCasosService (HU-33)', () => {
  let servicio: MetricasCasosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(MetricasCasosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('pide los indicadores de casos del periodo con las fechas como parametros', () => {
    let respuesta: unknown;
    servicio.obtener({ desde: '2026-10-01', hasta: '2026-10-31' }).subscribe((r) => (respuesta = r));

    const req = httpMock.expectOne((r) => r.url === '/api/metricas/casos');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('desde')).toBe('2026-10-01');
    expect(req.request.params.get('hasta')).toBe('2026-10-31');
    req.flush({ desde: '2026-10-01', hasta: '2026-10-31', reportes: { total: 3 } });

    expect(respuesta).toMatchObject({ reportes: { total: 3 } });
  });
});
