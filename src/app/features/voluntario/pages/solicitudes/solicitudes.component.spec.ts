import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { SolicitudesComponent } from './solicitudes.component';
import { AuthService } from '../../../../core/services/auth.service';
import { Reporte } from '../../../../shared/models/reporte.model';

describe('SolicitudesComponent', () => {
  let component: SolicitudesComponent;
  let httpMock: HttpTestingController;

  const mockVoluntario = { idUsuario: 1, email: 'vol@test.com', rol: 'VOLUNTARIO' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            usuarioActual: () => mockVoluntario,
            obtenerIdUsuarioActual: () => 1,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SolicitudesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar las solicitudes pendientes al iniciar', () => {
    const fixture = TestBed.createComponent(SolicitudesComponent);
    fixture.detectChanges();

    const req = httpMock.expectOne(
      (r) => r.url === '/api/reportes' && r.params.get('estado') === 'PENDIENTE'
    );
    expect(req.request.method).toBe('GET');

    const mockReportes: Reporte[] = [
      {
        idReporte: 1, idUsuario: 2, tipoCaso: 'PERDIDA', descripcion: 'Test',
        estado: 'PENDIENTE', fotoUrl: null, fechaCreacion: '2026-01-01',
      },
    ];
    req.flush(mockReportes);

    expect(component.solicitudes().length).toBe(1);
    expect(component.solicitudes()[0].estado).toBe('PENDIENTE');
  });

  it('debe aceptar una solicitud cambiando el estado a EN_PROCESO', () => {
    const fixture = TestBed.createComponent(SolicitudesComponent);
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === '/api/reportes').flush([]);

    const reporte: Reporte = {
      idReporte: 1, idUsuario: 2, tipoCaso: 'PERDIDA', descripcion: 'Test',
      estado: 'PENDIENTE', fotoUrl: null, fechaCreacion: '2026-01-01',
    };

    component.aceptar(reporte);

    const req = httpMock.expectOne('/api/reportes/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.estado).toBe('EN_PROCESO');
    req.flush({ ...reporte, estado: 'EN_PROCESO' });

    expect(component.mensaje()).toContain('aceptada');
    expect(component.solicitudes().length).toBe(0);
  });

  it('debe rechazar una solicitud cambiando el estado a CANCELADO', () => {
    const fixture = TestBed.createComponent(SolicitudesComponent);
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === '/api/reportes').flush([]);

    const reporte: Reporte = {
      idReporte: 2, idUsuario: 3, tipoCaso: 'ENCONTRADA', descripcion: 'Test',
      estado: 'PENDIENTE', fotoUrl: null, fechaCreacion: '2026-01-01',
    };

    component.abrirRechazo(reporte);
    component.notaRechazo.set('No cumple los requisitos');
    component.confirmarRechazo();

    const req = httpMock.expectOne('/api/reportes/2');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.estado).toBe('CANCELADO');
    req.flush({ ...reporte, estado: 'CANCELADO' });

    expect(component.mensaje()).toContain('rechazada');
    expect(component.mensaje()).toContain('No cumple los requisitos');
  });
});