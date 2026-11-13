import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';

import { LandingComponent } from './landing.component';
import { NotificacionService } from '../../core/services/notificacion.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { Reporte } from '../../shared/models/reporte.model';
import { webSocketServiceDoble } from '../../shared/testing/test-doubles';

function reporte(id: number, estado: Reporte['estado'], fechaCreacion: string): Reporte {
  return {
    idReporte: id,
    idUsuario: 1,
    tipoCaso: 'PERDIDA',
    descripcion: `Caso ${id}`,
    estado,
    fotoUrl: null,
    fechaCreacion,
  };
}

describe('LandingComponent (rediseño del Inicio)', () => {
  let fixture: ComponentFixture<LandingComponent>;
  let httpMock: HttpTestingController;

  async function crear(): Promise<void> {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WebSocketService, useValue: webSocketServiceDoble() },
        {
          provide: NotificacionService,
          useValue: { noLeidas: () => 0, cargar: () => of([]), limpiar: () => undefined },
        },
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
  }

  function responder(reportes: Reporte[]): void {
    const req = httpMock.expectOne((r) => r.url === '/api/reportes');
    expect(req.request.params.get('estado')).toBe('PENDIENTE,EN_PROCESO');
    req.flush(reportes);
    fixture.detectChanges();
  }

  const dom = () => fixture.nativeElement as HTMLElement;

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('muestra el titulo nuevo y las dos puertas', async () => {
    await crear();
    responder([]);

    expect(dom().querySelector('h1')?.textContent).toContain('Cada reporte acerca a un animal');
    const puertas = dom().querySelectorAll('.puerta');
    expect(puertas.length).toBe(2);
    expect(puertas[0].getAttribute('href')).toBe('/login');
    expect(puertas[1].getAttribute('href')).toBe('/mapa');
  });

  it('ya no muestra las estadisticas vacias ni el mapa', async () => {
    await crear();
    responder([]);

    expect(dom().querySelector('.stats')).toBeNull();
    expect(dom().querySelector('app-mapa')).toBeNull();
  });

  it('reparte los casos abiertos: 5 en el carrusel y 3 en urgentes, urgentes primero', async () => {
    await crear();
    responder([
      reporte(1, 'EN_PROCESO', '2026-11-12T10:00:00'),
      reporte(2, 'PENDIENTE', '2026-11-12T08:00:00'),
      reporte(3, 'PENDIENTE', '2026-11-12T09:00:00'),
      reporte(4, 'EN_PROCESO', '2026-11-12T07:00:00'),
      reporte(5, 'EN_PROCESO', '2026-11-12T06:00:00'),
      reporte(6, 'EN_PROCESO', '2026-11-12T05:00:00'),
    ]);

    const diapositivas = dom().querySelectorAll('.diapositiva');
    expect(diapositivas.length).toBe(5);
    expect(diapositivas[0].textContent).toContain('Caso 3');
    const tarjetas = Array.from(dom().querySelectorAll('.tarjeta h3')).map((h) => h.textContent);
    expect(tarjetas).toEqual(['Caso 3', 'Caso 2', 'Caso 1']);
    expect(dom().querySelector('.tarjeta .insignia')?.textContent).toContain('Urgente');
  });

  it('sin casos muestra el mensaje del carrusel y oculta las tarjetas', async () => {
    await crear();
    responder([]);

    expect(dom().querySelector('.carrusel-vacio')?.textContent).toContain('no hay casos abiertos');
    expect(dom().querySelector('.urgentes')).toBeNull();
  });

  it('si falla la carga no rompe el Inicio', async () => {
    await crear();
    httpMock.expectOne((r) => r.url === '/api/reportes').flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(dom().querySelector('.carrusel-vacio')).not.toBeNull();
    expect(dom().querySelector('#ayudar')).not.toBeNull();
  });

  it('la seccion de organizaciones invita a unirse y no lista nada hasta conectar el backend', async () => {
    await crear();
    responder([]);

    expect(dom().querySelector('.orgs-unete')?.getAttribute('href')).toBe('/organizaciones/registro');
    expect(dom().querySelector('.orgs-lista')).toBeNull();
  });
});
