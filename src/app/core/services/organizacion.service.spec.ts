import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { OrganizacionService } from './organizacion.service';
import { FormularioOrganizacion } from '../../shared/models/organizacion.model';

const form: FormularioOrganizacion = {
  nombre: '  Refugio Patitas ',
  tipo: 'REFUGIO',
  direccion: 'Av. América 123',
  telefono: '+591 70123456',
  email: 'contacto@patitas.org',
  descripcion: '',
};

describe('OrganizacionService (HU-20)', () => {
  let servicio: OrganizacionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(OrganizacionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('registra enviando los campos en un multipart, sin logo ni descripción vacíos', () => {
    servicio.registrar(7, form, null).subscribe();

    const req = httpMock.expectOne('/api/organizaciones');
    expect(req.request.method).toBe('POST');
    const datos = req.request.body as FormData;
    expect(datos.get('idRepresentante')).toBe('7');
    expect(datos.get('nombre')).toBe('Refugio Patitas');
    expect(datos.get('tipo')).toBe('REFUGIO');
    expect(datos.get('email')).toBe('contacto@patitas.org');
    expect(datos.has('descripcion')).toBe(false);
    expect(datos.has('logo')).toBe(false);
    req.flush({});
  });

  it('adjunta el logo y la descripción cuando existen', () => {
    const logo = new File([new Uint8Array(4)], 'logo.png', { type: 'image/png' });

    servicio.registrar(7, { ...form, descripcion: 'Perros y gatos' }, logo).subscribe();

    const datos = httpMock.expectOne('/api/organizaciones').request.body as FormData;
    expect(datos.get('descripcion')).toBe('Perros y gatos');
    expect((datos.get('logo') as File).name).toBe('logo.png');
  });

  it('consulta la organización del representante', () => {
    let resultado: unknown = 'sin respuesta';

    servicio.obtenerDeRepresentante(7).subscribe((r) => (resultado = r));
    httpMock.expectOne('/api/organizaciones/representante/7').flush({ idOrganizacion: 1 });

    expect(resultado).toEqual({ idOrganizacion: 1 });
  });

  it('devuelve null si el usuario no tiene organización (404)', () => {
    let resultado: unknown = 'sin respuesta';

    servicio.obtenerDeRepresentante(7).subscribe((r) => (resultado = r));
    httpMock
      .expectOne('/api/organizaciones/representante/7')
      .flush('no existe', { status: 404, statusText: 'Not Found' });

    expect(resultado).toBeNull();
  });

  it('propaga otros errores', () => {
    let status = 0;

    servicio.obtenerDeRepresentante(7).subscribe({ error: (e) => (status = e.status) });
    httpMock
      .expectOne('/api/organizaciones/representante/7')
      .flush('boom', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });
});
