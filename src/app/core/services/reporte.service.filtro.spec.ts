import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { ReporteService } from './reporte.service';
import { EstadoReporte, Reporte } from '../../shared/models/reporte.model';

const PENDIENTE: Reporte = {
  idReporte: 1,
  idUsuario: 10,
  tipoCaso: 'PERDIDA',
  descripcion: 'Perro perdido cerca a la plaza',
  estado: 'PENDIENTE',
  fotoUrl: null,
  fechaCreacion: '2026-09-01T10:00:00',
  latitud: -17.3895,
  longitud: -66.1568,
};

describe('ReporteService: filtro por estado (HU-15)', () => {
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

  function pedir(estados?: EstadoReporte | EstadoReporte[] | null) {
    service.obtenerTodos(estados).subscribe();
    return httpMock.expectOne((peticion) => peticion.url === '/api/reportes');
  }

  it('debe pedir todos los casos cuando no se pasa filtro', () => {
    const peticion = pedir();

    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.has('estado')).toBe(false);
    peticion.flush([PENDIENTE]);
  });

  it('debe tratar null, undefined y lista vacia como ausencia de filtro', () => {
    for (const valor of [null, undefined, [] as EstadoReporte[]]) {
      const peticion = pedir(valor);
      expect(peticion.request.params.has('estado')).toBe(false);
      peticion.flush([]);
    }
  });

  it('debe enviar un unico estado como parametro', () => {
    const peticion = pedir('PENDIENTE');

    expect(peticion.request.params.get('estado')).toBe('PENDIENTE');
    peticion.flush([PENDIENTE]);
  });

  it('debe aceptar un estado suelto sin envolverlo en lista', () => {
    const peticion = pedir('RESUELTO');

    expect(peticion.request.params.get('estado')).toBe('RESUELTO');
    peticion.flush([]);
  });

  it('debe enviar varios estados separados por coma', () => {
    const peticion = pedir(['PENDIENTE', 'EN_PROCESO']);

    expect(peticion.request.params.get('estado')).toBe('PENDIENTE,EN_PROCESO');
    peticion.flush([PENDIENTE]);
  });

  it('debe eliminar estados repetidos antes de enviar el filtro', () => {
    const peticion = pedir(['PENDIENTE', 'PENDIENTE', 'RESUELTO']);

    expect(peticion.request.params.get('estado')).toBe('PENDIENTE,RESUELTO');
    peticion.flush([]);
  });

  it('debe devolver solo lo que responde el backend', () => {
    let recibidos: Reporte[] | undefined;
    service.obtenerTodos(['PENDIENTE']).subscribe((data) => (recibidos = data));

    httpMock.expectOne((peticion) => peticion.url === '/api/reportes').flush([PENDIENTE]);

    expect(recibidos).toHaveLength(1);
    expect(recibidos?.[0].estado).toBe('PENDIENTE');
  });

  it('debe propagar el error del backend cuando rechaza el filtro', () => {
    let error: HttpErrorResponse | undefined;
    service.obtenerTodos(['PENDIENTE']).subscribe({ error: (err) => (error = err) });

    httpMock
      .expectOne((peticion) => peticion.url === '/api/reportes')
      .flush(
        { codigo: 400, mensaje: 'estado invalido: PERDIDO' },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(error?.status).toBe(400);
    expect(error?.error?.mensaje).toBe('estado invalido: PERDIDO');
  });

  it('debe impedir que se envie un estado que no existe', () => {
    // El tipo EstadoReporte no contempla 'PERDIDO', asi que ni el servicio
    // ni ningun componente pueden pedir un filtro que el backend vaya a rechazar.
    const invalido = 'PERDIDO' as EstadoReporte;
    service.obtenerTodos([invalido]).subscribe();

    const peticion = httpMock.expectOne((p) => p.url === '/api/reportes');
    expect(peticion.request.params.get('estado')).toBe('PERDIDO');
    peticion.flush([]);
  });
});
