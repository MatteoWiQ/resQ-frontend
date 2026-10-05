import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { SolicitudesComponent } from './solicitudes.component';
import { AuthService } from '../../../../core/services/auth.service';
import { Reporte } from '../../../../shared/models/reporte.model';

const URL_PENDIENTES = '/api/reportes/revision/pendientes';

function reporte(id: number, extra: Partial<Reporte> = {}): Reporte {
  return {
    idReporte: id,
    idUsuario: 10,
    tipoCaso: 'PERDIDA',
    descripcion: `Caso ${id}`,
    estado: 'PENDIENTE',
    fotoUrl: null,
    fechaCreacion: '2026-09-28T10:00:00',
    estadoRevision: 'PENDIENTE_REVISION',
    ...extra,
  };
}

describe('SolicitudesComponent (HU-19)', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<SolicitudesComponent>;
  let component: SolicitudesComponent;

  async function crear(usuario: { idUsuario: number; email: string; rol: string } | null) {
    await TestBed.configureTestingModule({
      imports: [SolicitudesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            usuarioActual: () => usuario,
            obtenerIdUsuarioActual: () => usuario?.idUsuario ?? null,
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(SolicitudesComponent);
    component = fixture.componentInstance;
  }

  function cargarPendientes(lista: Reporte[]): void {
    fixture.detectChanges();
    const req = httpMock.expectOne((r) => r.url === URL_PENDIENTES);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('idRevisor')).toBe('1');
    req.flush(lista);
    fixture.detectChanges();
  }

  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  afterEach(() => {
    httpMock.verify();
  });

  describe('como voluntario', () => {
    beforeEach(async () => {
      await crear({ idUsuario: 1, email: 'vol@test.com', rol: 'VOLUNTARIO' });
    });

    it('lista los casos pendientes de aprobación', () => {
      cargarPendientes([reporte(5), reporte(6)]);

      const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.solicitud-item');
      expect(items.length).toBe(2);
      expect(texto()).toContain('Caso 5');
    });

    it('muestra un mensaje cuando no hay casos pendientes', () => {
      cargarPendientes([]);

      expect(texto()).toContain('No hay solicitudes pendientes por revisar.');
    });

    it('puede seleccionar un caso y ver su detalle para revisarlo', () => {
      cargarPendientes([reporte(5, { descripcion: 'Perro café con collar rojo' })]);

      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.btn-detalle')!.click();
      fixture.detectChanges();

      expect(component.seleccionada()?.idReporte).toBe(5);
      expect((fixture.nativeElement as HTMLElement).querySelector('.modal')).not.toBeNull();
      expect(texto()).toContain('Perro café con collar rojo');
    });

    it('aprueba un caso: envía la decisión, lo quita de la lista y avisa', () => {
      cargarPendientes([reporte(5), reporte(6)]);

      component.revisar(component.solicitudes()[0]);
      component.nota.set('  Datos verificados  ');
      component.decidir('APROBAR');

      const req = httpMock.expectOne('/api/reportes/revision/5/decision');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ idRevisor: 1, decision: 'APROBAR', nota: 'Datos verificados' });
      req.flush(reporte(5, { estadoRevision: 'APROBADO' }));
      fixture.detectChanges();

      expect(component.solicitudes().map((s) => s.idReporte)).toEqual([6]);
      expect(component.seleccionada()).toBeNull();
      expect(component.mensaje()).toContain('aprobada');
      expect(component.mensajeEsError()).toBe(false);
    });

    it('rechaza un caso con una nota y lo quita de la lista', () => {
      cargarPendientes([reporte(5)]);

      component.revisar(component.solicitudes()[0]);
      component.nota.set('La foto no corresponde al animal');
      component.decidir('RECHAZAR');

      const req = httpMock.expectOne('/api/reportes/revision/5/decision');
      expect(req.request.body).toEqual({
        idRevisor: 1,
        decision: 'RECHAZAR',
        nota: 'La foto no corresponde al animal',
      });
      req.flush(reporte(5, { estadoRevision: 'RECHAZADO' }));

      expect(component.solicitudes().length).toBe(0);
      expect(component.mensaje()).toContain('rechazada');
    });

    it('no deja rechazar sin una nota y no llama al backend', () => {
      cargarPendientes([reporte(5)]);

      component.revisar(component.solicitudes()[0]);
      component.nota.set('   ');
      component.decidir('RECHAZAR');

      expect(component.errorNota()).toBe('Debes indicar el motivo del rechazo.');
      expect(component.solicitudes().length).toBe(1);
      // httpMock.verify() en afterEach comprueba que no se hizo ninguna petición
    });

    it('si el caso ya fue revisado por otra persona, refresca la lista', () => {
      cargarPendientes([reporte(5), reporte(6)]);

      component.revisar(component.solicitudes()[0]);
      component.decidir('APROBAR');
      httpMock
        .expectOne('/api/reportes/revision/5/decision')
        .flush({ message: 'ya revisada' }, { status: 409, statusText: 'Conflict' });

      expect(component.mensajeEsError()).toBe(true);
      expect(component.seleccionada()).toBeNull();

      const recarga = httpMock.expectOne((r) => r.url === URL_PENDIENTES);
      recarga.flush([reporte(6)]);
      expect(component.solicitudes().map((s) => s.idReporte)).toEqual([6]);
    });

    it('si el backend responde 403 muestra el error dentro del modal', () => {
      cargarPendientes([reporte(5)]);

      component.revisar(component.solicitudes()[0]);
      component.decidir('APROBAR');
      httpMock
        .expectOne('/api/reportes/revision/5/decision')
        .flush({ message: 'sin permiso' }, { status: 403, statusText: 'Forbidden' });

      expect(component.errorNota()).toContain('No tienes permisos');
      expect(component.seleccionada()).not.toBeNull();
      expect(component.enviando()).toBe(false);
    });

    it('muestra un error si no se pueden cargar las solicitudes', () => {
      fixture.detectChanges();
      httpMock
        .expectOne((r) => r.url === URL_PENDIENTES)
        .flush('error', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(component.mensajeEsError()).toBe(true);
      expect(component.cargando()).toBe(false);
    });
  });

  describe('sin rol de revisor', () => {
    it('un ciudadano común no ve solicitudes ni consulta el backend', async () => {
      await crear({ idUsuario: 2, email: 'ciudadano@test.com', rol: 'USUARIO' });

      fixture.detectChanges();

      expect(texto()).toContain('No tienes permisos para ver esta sección.');
      expect(component.solicitudes().length).toBe(0);
    });

    it('sin sesión tampoco consulta el backend', async () => {
      await crear(null);

      fixture.detectChanges();

      expect(texto()).toContain('No tienes permisos para ver esta sección.');
    });
  });

  describe('como administrador', () => {
    it('también puede revisar solicitudes', async () => {
      await crear({ idUsuario: 1, email: 'admin@test.com', rol: 'ADMIN' });

      cargarPendientes([reporte(5)]);

      expect(component.solicitudes().length).toBe(1);
    });
  });
});
