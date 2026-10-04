import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DetalleReporteComponent } from './detalle-reporte.component';
import { ReporteService } from '../../../../core/services/reporte.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Usuario } from '../../../../shared/models/usuario.model';
import { Reporte } from '../../../../shared/models/reporte.model';

const REPORTE: Reporte = {
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

const AUTOR: Usuario = {
  idUsuario: 10,
  nombre: 'Lucia Fernandez',
  email: 'lucia@correo.com',
  telefono: '70000000',
  rol: 'USUARIO',
  fechaRegistro: '2026-08-01',
  tiposAyuda: [],
};

describe('DetalleReporteComponent: detalle administrativo (HU-24)', () => {
  let reporteService: {
    obtenerPorId: ReturnType<typeof vi.fn>;
    cambiarEstado: ReturnType<typeof vi.fn>;
    eliminar: ReturnType<typeof vi.fn>;
  };
  let usuarioService: { obtenerPorId: ReturnType<typeof vi.fn> };
  let navegar: ReturnType<typeof vi.fn>;

  async function crearDetalle(id = '7') {
    await TestBed.configureTestingModule({
      imports: [DetalleReporteComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => id } } } },
        { provide: ReporteService, useValue: reporteService },
        { provide: UsuarioService, useValue: usuarioService },
        { provide: Router, useValue: { navigate: navegar } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DetalleReporteComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    reporteService = {
      obtenerPorId: vi.fn(() => of(REPORTE)),
      cambiarEstado: vi.fn(() => of({ ...REPORTE, estado: 'EN_PROCESO' })),
      eliminar: vi.fn(() => of(undefined)),
    };
    usuarioService = { obtenerPorId: vi.fn(() => of(AUTOR)) };
    navegar = vi.fn(() => Promise.resolve(true));
  });

  it('debe pedir el reporte del id de la ruta', async () => {
    await crearDetalle('7');

    expect(reporteService.obtenerPorId).toHaveBeenCalledWith(7);
  });

  it('debe mostrar el estado actual del reporte', async () => {
    const fixture = await crearDetalle();

    expect(fixture.componentInstance.reporte()?.estado).toBe('PENDIENTE');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Pendiente');
  });

  it('debe resolver el autor del reporte', async () => {
    const fixture = await crearDetalle();

    expect(usuarioService.obtenerPorId).toHaveBeenCalledWith(10);
    expect(fixture.componentInstance.autor()?.nombre).toBe('Lucia Fernandez');
  });

  it('debe mostrar el caso igual cuando el autor ya no esta registrado', async () => {
    usuarioService.obtenerPorId.mockReturnValue(throwError(() => ({ status: 404 })));

    const fixture = await crearDetalle();

    expect(fixture.componentInstance.reporte()).not.toBeNull();
    expect(fixture.componentInstance.autor()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Usuario no registrado');
  });

  it('debe ofrecer solo los estados a los que se puede pasar', async () => {
    const fixture = await crearDetalle();

    expect(fixture.componentInstance.estadosDisponibles()).toEqual(['EN_PROCESO', 'CANCELADO']);
  });

  it('debe pedir el cambio de estado sin reenviar el resto del reporte', async () => {
    const fixture = await crearDetalle();
    const componente = fixture.componentInstance;

    componente.nuevoEstado.set('EN_PROCESO');
    componente.confirmarCambioEstado();

    expect(reporteService.cambiarEstado).toHaveBeenCalledWith(7, 'EN_PROCESO');
    expect(componente.reporte()?.estado).toBe('EN_PROCESO');
  });

  it('no debe pedir el cambio si el estado elegido es el mismo', async () => {
    const fixture = await crearDetalle();
    const componente = fixture.componentInstance;

    componente.nuevoEstado.set('PENDIENTE');
    componente.confirmarCambioEstado();

    expect(reporteService.cambiarEstado).not.toHaveBeenCalled();
  });

  it('debe mostrar el error cuando el backend rechaza el salto de estado', async () => {
    reporteService.cambiarEstado.mockReturnValue(
      throwError(() => ({ status: 409, error: { message: 'no se puede pasar de PENDIENTE a RESUELTO' } })),
    );

    const fixture = await crearDetalle();
    const componente = fixture.componentInstance;

    componente.nuevoEstado.set('EN_PROCESO');
    componente.confirmarCambioEstado();
    fixture.detectChanges();

    expect(componente.reporte()?.estado).toBe('PENDIENTE');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'no se puede pasar de PENDIENTE a RESUELTO',
    );
  });

  it('debe volver al panel despues de eliminar el reporte', async () => {
    const fixture = await crearDetalle();

    fixture.componentInstance.confirmarEliminar();

    expect(reporteService.eliminar).toHaveBeenCalledWith(7);
    expect(navegar).toHaveBeenCalledWith(['/admin']);
  });

  it('debe avisar que el reporte no existe sin pedirlo a la API', async () => {
    const fixture = await crearDetalle('no-es-un-numero');

    expect(reporteService.obtenerPorId).not.toHaveBeenCalled();
    expect(fixture.componentInstance.noEncontrado()).toBe(true);
  });

  it('debe avisar que el reporte no existe cuando el backend responde 404', async () => {
    reporteService.obtenerPorId.mockReturnValue(throwError(() => ({ status: 404 })));

    const fixture = await crearDetalle();

    expect(fixture.componentInstance.noEncontrado()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Ese reporte ya no existe',
    );
  });
});