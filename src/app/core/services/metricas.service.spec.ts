import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { MetricasService } from './metricas.service';

describe('MetricasService (HU-34)', () => {
  let servicio: MetricasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(MetricasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('pide las metricas del periodo con las fechas como parametros', () => {
    servicio.obtener({ desde: '2026-10-01', hasta: '2026-10-31' }).subscribe();

    const req = httpMock.expectOne((r) => r.url === '/api/metricas');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('desde')).toBe('2026-10-01');
    expect(req.request.params.get('hasta')).toBe('2026-10-31');
    req.flush({});
  });
});
