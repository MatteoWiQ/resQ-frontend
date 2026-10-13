import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SolicitudVoluntarioService } from './solicitud-voluntario.service';

describe('SolicitudVoluntarioService (HU-35)', () => {
  let service: SolicitudVoluntarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SolicitudVoluntarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista las solicitudes pendientes', () => {
    service.listarPendientes().subscribe();
    const req = http.expectOne('/api/solicitudes-voluntarios/pendientes');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('crea una solicitud con tipo de ayuda y mensaje', () => {
    service.crear('TRANSPORTE,ALIMENTO', 'tengo auto').subscribe();
    const req = http.expectOne('/api/solicitudes-voluntarios');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      tipoAyuda: 'TRANSPORTE,ALIMENTO',
      mensaje: 'tengo auto',
    });
    req.flush({});
  });

  it('aprueba una solicitud por PUT', () => {
    service.aprobar(7).subscribe();
    const req = http.expectOne('/api/solicitudes-voluntarios/7/aprobar');
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('rechaza enviando el motivo obligatorio', () => {
    service.rechazar(7, 'docs incompletos').subscribe();
    const req = http.expectOne('/api/solicitudes-voluntarios/7/rechazar');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ motivo: 'docs incompletos' });
    req.flush({});
  });
});
