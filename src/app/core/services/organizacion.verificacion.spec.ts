import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { OrganizacionService } from './organizacion.service';
import { AdminOrganizacionService } from './admin-organizacion.service';
import { FormularioOrganizacion } from '../../shared/models/organizacion.model';

const form: FormularioOrganizacion = {
  nombre: 'Refugio Patitas',
  tipo: 'REFUGIO',
  direccion: 'Av. América 123',
  telefono: '+591 70123456',
  email: 'contacto@patitas.org',
  descripcion: '',
  horarios: '',
  zonasCobertura: '',
};

const pdf = () => new File(['%PDF-1.7'], 'personeria.pdf', { type: 'application/pdf' });

describe('Servicios de verificación de organizaciones (HU-32)', () => {
  let organizaciones: OrganizacionService;
  let admin: AdminOrganizacionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    organizaciones = TestBed.inject(OrganizacionService);
    admin = TestBed.inject(AdminOrganizacionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('el registro adjunta el documento de verificación', () => {
    organizaciones.registrar(7, form, null, pdf()).subscribe();

    const datos = http.expectOne('/api/organizaciones').request.body as FormData;
    expect((datos.get('documento') as File).name).toBe('personeria.pdf');
    expect(datos.has('logo')).toBe(false);
  });

  it('sin documento no se envía el campo', () => {
    organizaciones.registrar(7, form, null).subscribe();

    const datos = http.expectOne('/api/organizaciones').request.body as FormData;
    expect(datos.has('documento')).toBe(false);
  });

  it('la edición puede reemplazar el documento', () => {
    organizaciones.actualizar(1, 7, form, null, false, pdf()).subscribe();

    const req = http.expectOne('/api/organizaciones/1');
    expect(req.request.method).toBe('PUT');
    expect(((req.request.body as FormData).get('documento') as File).name).toBe('personeria.pdf');
  });

  it('reenviar hace POST a /reenviar', () => {
    organizaciones.reenviar(1).subscribe();

    const req = http.expectOne('/api/organizaciones/1/reenviar');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('aprobar envía la nota solo si la hay', () => {
    admin.aprobar(7, '  Documentación en regla ').subscribe();
    expect(http.expectOne('/api/admin/organizaciones/7/aprobar').request.body).toEqual({
      nota: 'Documentación en regla',
    });

    admin.aprobar(8).subscribe();
    expect(http.expectOne('/api/admin/organizaciones/8/aprobar').request.body).toEqual({});
  });

  it('pide el historial y el documento (como Blob) de una organización', () => {
    admin.historial(7).subscribe();
    const historial = http.expectOne('/api/admin/organizaciones/7/revisiones');
    expect(historial.request.method).toBe('GET');
    historial.flush([]);

    admin.documento(7).subscribe();
    const documento = http.expectOne('/api/admin/organizaciones/7/documento');
    expect(documento.request.responseType).toBe('blob');
    documento.flush(new Blob(['%PDF']));
  });
});
