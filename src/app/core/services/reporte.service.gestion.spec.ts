import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { ReporteService } from './reporte.service';
import { Reporte } from '../../shared/models/reporte.model';

const CASO: Reporte = {
  idReporte: 7,
  idUsuario: 10,
  tipoCaso: 'PERDIDA',
  descripcion: 'Perro perdido cerca a la plaza',
  estado: 'PENDIENTE',
  fotoUrl: null,
  fechaCreacion: '2026-09-01T10:00:00',
  latitud: -17.3895,
  longitud: -66.1568,
};

describe('ReporteService: gestion de reportes (HU-24)', () => {
  let service: ReporteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ReporteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('consulta', () => {
    it('debe enviar el texto de busqueda', () => {
      service.obtenerTodos(null, { busqueda: 'perro' }).subscribe();

      const peticion = httpMock.expectOne((p) => p.url === '/api/reportes');
      expect(peticion.request.params.get('busqueda')).toBe('perro');
      peticion.flush([CASO]);
    });

    it('debe recortar la busqueda antes de enviarla', () => {
      service.obtenerTodos(null, { busqueda: '  plaza  ' }).subscribe();

      const peticion = httpMock.expectOne((p) => p.url === '/api/reportes');
      expect(peticion.request.params.get('busqueda')).toBe('plaza');
      peticion.flush([]);
    });

    it('no debe mandar busqueda cuando el texto esta vacio', () => {
      service.obtenerTodos(null, { busqueda: '   ' }).subscribe();

      const peticion = httpMock.expectOne((p) => p.url === '/api/reportes');
      expect(peticion.request.params.has('busqueda')).toBe(false);
      peticion.flush([]);
    });

    it('debe combinar busqueda, orden y filtro por estado', () => {
      service.obtenerTodos('PENDIENTE', { busqueda: 'perro', orden: 'ANTIGUOS' }).subscribe();

      const peticion = httpMock.expectOne((p) => p.url === '/api/reportes');
      expect(peticion.request.params.get('estado')).toBe('PENDIENTE');
      expect(peticion.request.params.get('busqueda')).toBe('perro');
      expect(peticion.request.params.get('orden')).toBe('ANTIGUOS');
      peticion.flush([CASO]);
    });

    it('no debe mandar orden cuando no se pide', () => {
      service.obtenerTodos(null, { orden: null }).subscribe();

      const peticion = httpMock.expectOne((p) => p.url === '/api/reportes');
      expect(peticion.request.params.has('orden')).toBe(false);
      peticion.flush([]);
    });
  });

  describe('detalle', () => {
    it('debe pedir el reporte por su id', () => {
      let recibido: Reporte | undefined;
      service.obtenerPorId(7).subscribe((data) => (recibido = data));

      const peticion = httpMock.expectOne((p) => p.url === '/api/reportes/7');
      expect(peticion.request.method).toBe('GET');
      peticion.flush(CASO);

      expect(recibido?.idReporte).toBe(7);
    });

    it('debe propagar el 404 cuando el reporte no existe', () => {
      let error: HttpErrorResponse | undefined;
      service.obtenerPorId(99).subscribe({ error: (err) => (error = err) });

      httpMock
        .expectOne((p) => p.url === '/api/reportes/99')
        .flush({ status: 404 }, { status: 404, statusText: 'Not Found' });

      expect(error?.status).toBe(404);
    });
  });

  describe('cambio de estado', () => {
    it('debe hacer PATCH solo con el estado', () => {
      let recibido: Reporte | undefined;
      service.cambiarEstado(7, 'EN_PROCESO').subscribe((data) => (recibido = data));

      const peticion = httpMock.expectOne((p) => p.url === '/api/reportes/7/estado');
      expect(peticion.request.method).toBe('PATCH');
      expect(peticion.request.body).toEqual({ estado: 'EN_PROCESO' });
      peticion.flush({ ...CASO, estado: 'EN_PROCESO' });

      expect(recibido?.estado).toBe('EN_PROCESO');
    });

    it('debe dejar pasar el 409 cuando el salto no es valido', () => {
      let error: HttpErrorResponse | undefined;
      service.cambiarEstado(7, 'RESUELTO').subscribe({ error: (err) => (error = err) });

      httpMock
        .expectOne((p) => p.url === '/api/reportes/7/estado')
        .flush(
          { status: 409, message: 'no se puede pasar de PENDIENTE a RESUELTO' },
          { status: 409, statusText: 'Conflict' },
        );

      expect(error?.status).toBe(409);
      expect(error?.error?.message).toContain('no se puede pasar de PENDIENTE a RESUELTO');
    });
  });

  describe('borrado', () => {
    it('debe pedir el borrado del reporte', () => {
      service.eliminar(7).subscribe();

      const peticion = httpMock.expectOne((p) => p.url === '/api/reportes/7');
      expect(peticion.request.method).toBe('DELETE');
      peticion.flush(null);
    });
  });
});