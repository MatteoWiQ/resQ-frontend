import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../../core/services/auth.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Usuario } from '../../../../shared/models/usuario.model';
import { PanelAdminComponent } from './panel-admin.component';

const ADMIN: Usuario = {
  idUsuario: 1,
  nombre: 'Admin',
  email: 'admin@resq.com',
  telefono: '70000000',
  rol: 'ADMIN',
  tiposAyuda: [],
};

const CIUDADANO: Usuario = {
  idUsuario: 2,
  nombre: 'Ana',
  email: 'ana@resq.com',
  telefono: '71111111',
  rol: 'USUARIO',
  tiposAyuda: [],
};

describe('PanelAdminComponent: eliminar usuarios (HU-23)', () => {
  let eliminados: number[];

  async function crearPanel(
    usuarios: Usuario[] = [ADMIN, CIUDADANO],
    idActual = ADMIN.idUsuario
  ) {
    eliminados = [];

    await TestBed.configureTestingModule({
      imports: [PanelAdminComponent],
      providers: [
        { provide: AuthService, useValue: { obtenerIdUsuarioActual: () => idActual } },
        {
          provide: UsuarioService,
          useValue: {
            obtenerTodos: () => of(usuarios),
            actualizar: () => of(usuarios[0]),
            eliminar: (id: number) => {
              eliminados.push(id);
              return of(void 0);
            },
          },
        },
        {
          provide: ReporteService,
          useValue: { obtenerTodos: () => of([]), actualizar: () => of() },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PanelAdminComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function botonEliminar(fixture: ReturnType<typeof TestBed.createComponent>): HTMLButtonElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.btn.eliminar');
  }

  it('muestra el boton eliminar en las cuentas de otros', async () => {
    const fixture = await crearPanel([CIUDADANO], 99);

    expect(botonEliminar(fixture)).not.toBeNull();
  });

  it('no muestra el boton eliminar en la propia cuenta', async () => {
    const fixture = await crearPanel([ADMIN, CIUDADANO], ADMIN.idUsuario);

    const filas = (fixture.nativeElement as HTMLElement).querySelectorAll('.tabla tbody tr');
    expect(filas.length).toBe(2);
    expect(filas[0].querySelector('.btn.eliminar')).toBeNull();
    expect(filas[1].querySelector('.btn.eliminar')).not.toBeNull();
  });

  it('no elimina si el administrador cancela la confirmacion', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const fixture = await crearPanel();

    fixture.componentInstance.eliminarUsuario(CIUDADANO);

    expect(eliminados).toEqual([]);
  });

  it('elimina la cuenta confirmada y recarga la lista', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fixture = await crearPanel();

    fixture.componentInstance.eliminarUsuario(CIUDADANO);

    expect(eliminados).toEqual([CIUDADANO.idUsuario]);
    expect(fixture.componentInstance.mensaje()).toContain('eliminado');
  });

  it('muestra un mensaje si el backend rechaza la eliminacion', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await TestBed.configureTestingModule({
      imports: [PanelAdminComponent],
      providers: [
        { provide: AuthService, useValue: { obtenerIdUsuarioActual: () => 1 } },
        {
          provide: UsuarioService,
          useValue: {
            obtenerTodos: () => of([CIUDADANO]),
            actualizar: () => of(CIUDADANO),
            eliminar: () => throwError(() => new Error('no permitido')),
          },
        },
        {
          provide: ReporteService,
          useValue: { obtenerTodos: () => of([]), actualizar: () => of() },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PanelAdminComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.eliminarUsuario(CIUDADANO);

    expect(fixture.componentInstance.mensaje()).toContain('Error al eliminar');
  });
});
