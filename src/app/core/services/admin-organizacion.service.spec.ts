import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AdminOrganizacionService } from './admin-organizacion.service';

describe('AdminOrganizacionService (HU-25)', () => {
  let servicio: AdminOrganizacionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AdminOrganizacionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista filtrando por estado', () => {
    servicio.listar('PENDIENTE_VERIFICACION').subscribe();
    const req = http.expectOne((r) => r.url === '/api/admin/organizaciones');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('estado')).toBe('PENDIENTE_VERIFICACION');
    req.flush([]);
  });

  it('con TODAS no envía filtro', () => {
    servicio.listar('TODAS').subscribe();
    const req = http.expectOne((r) => r.url === '/api/admin/organizaciones');
    expect(req.request.params.has('estado')).toBe(false);
    req.flush([]);
  });

  it('pide el detalle, aprueba y rechaza por id', () => {
    servicio.detalle(7).subscribe();
    http.expectOne('/api/admin/organizaciones/7').flush({});

    servicio.aprobar(7).subscribe();
    const aprobar = http.expectOne('/api/admin/organizaciones/7/aprobar');
    expect(aprobar.request.method).toBe('PUT');
    aprobar.flush({});

    servicio.rechazar(8, ' Falta documento ').subscribe();
    const rechazar = http.expectOne('/api/admin/organizaciones/8/rechazar');
    expect(rechazar.request.method).toBe('PUT');
    expect(rechazar.request.body).toEqual({ nota: 'Falta documento' });
    rechazar.flush({});
  });
});
