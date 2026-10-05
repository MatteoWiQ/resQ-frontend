import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, afterEach } from 'vitest';

import { NotificacionesComponent } from './notificaciones.component';
import { AuthService } from '../../../core/services/auth.service';
import { Notificacion } from '../../models/notificacion.model';

function notificacion(id: number, extra: Partial<Notificacion> = {}): Notificacion {
  return {
    idNotificacion: id,
    idUsuario: 10,
    idReporte: 55,
    tipo: 'SOLICITUD_RECHAZADA',
    mensaje: `Mensaje ${id}`,
    leida: false,
    fechaCreacion: '2026-09-28T10:00:00',
    ...extra,
  };
}

describe('NotificacionesComponent (HU-19)', () => {
  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<NotificacionesComponent>;
  let component: NotificacionesComponent;

  async function crear(idUsuario: number | null) {
    await TestBed.configureTestingModule({
      imports: [NotificacionesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { obtenerIdUsuarioActual: () => idUsuario } },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NotificacionesComponent);
    component = fixture.componentInstance;
  }

  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  afterEach(() => {
    httpMock.verify();
  });

  it('muestra las notificaciones del usuario y cuántas están sin leer', async () => {
    await crear(10);
    fixture.detectChanges();
    httpMock.expectOne('/api/notificaciones/usuario/10').flush([
      notificacion(1, { mensaje: 'Tu reporte #55 fue rechazado. Motivo: Foto borrosa' }),
      notificacion(2, { tipo: 'SOLICITUD_APROBADA', leida: true }),
    ]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.notif-item').length).toBe(2);
    expect(texto()).toContain('Tu reporte #55 fue rechazado. Motivo: Foto borrosa');
    expect(texto()).toContain('1 sin leer');
  });

  it('marca una notificación como leída', async () => {
    await crear(10);
    fixture.detectChanges();
    httpMock.expectOne('/api/notificaciones/usuario/10').flush([notificacion(1)]);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.btn-leida')!.click();

    const req = httpMock.expectOne('/api/notificaciones/1/leida');
    expect(req.request.method).toBe('PATCH');
    req.flush(notificacion(1, { leida: true }));
    fixture.detectChanges();

    expect(component.sinLeer()).toBe(0);
    expect((fixture.nativeElement as HTMLElement).querySelector('.btn-leida')).toBeNull();
  });

  it('muestra un mensaje cuando no hay notificaciones', async () => {
    await crear(10);
    fixture.detectChanges();
    httpMock.expectOne('/api/notificaciones/usuario/10').flush([]);
    fixture.detectChanges();

    expect(texto()).toContain('No tienes notificaciones.');
  });

  it('muestra un error si no se pueden cargar', async () => {
    await crear(10);
    fixture.detectChanges();
    httpMock
      .expectOne('/api/notificaciones/usuario/10')
      .flush('error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(texto()).toContain('No se pudieron cargar tus notificaciones.');
  });

  it('sin sesión no consulta el backend', async () => {
    await crear(null);

    fixture.detectChanges();

    expect(component.cargando()).toBe(false);
  });
});
