import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

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

  async function crearPanel(usuarios: Usuario[] = [ADMIN, CIUDADANO], idActual = ADMIN.idUsuario) {
    eliminados = [];

    await TestBed.configureTestingModule({
      imports: [PanelAdminComponent],
      providers: [
        // El panel navega al detalle del reporte (HU-24), asi que necesita el Router.
        provideRouter([]),
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

  async function crearPanelConError() {
    await TestBed.configureTestingModule({
      imports: [PanelAdminComponent],
      providers: [
        // El panel navega al detalle del reporte (HU-24), asi que necesita el Router.
        provideRouter([]),
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
    return fixture;
  }

  type Fixture = ReturnType<typeof TestBed.createComponent>;

  function root(fixture: Fixture): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  /** Boton de eliminar de una fila, sin contar el del modal. */
  function botonEliminar(fixture: Fixture): HTMLButtonElement | null {
    return root(fixture).querySelector<HTMLButtonElement>(
      '#seccion-usuarios .acciones .btn.eliminar',
    );
  }

  function modal(fixture: Fixture): HTMLElement | null {
    return root(fixture).querySelector<HTMLElement>('.modal');
  }

  function botonDelModal(fixture: Fixture, clase: string): HTMLButtonElement | null {
    return modal(fixture)?.querySelector<HTMLButtonElement>(`.btn.${clase}`) ?? null;
  }

  it('muestra el boton eliminar en las cuentas de otros', async () => {
    const fixture = await crearPanel([CIUDADANO], 99);

    expect(botonEliminar(fixture)).not.toBeNull();
  });

  it('no muestra el boton eliminar en la propia cuenta', async () => {
    const fixture = await crearPanel([ADMIN, CIUDADANO], ADMIN.idUsuario);

    // El selector se acota a la tabla de usuarios: la de reportes suma una fila
    // de "sin resultados" cuando no hay casos, y no es lo que se prueba aqui.
    const filas = root(fixture).querySelectorAll('#seccion-usuarios .tabla tbody tr');
    expect(filas.length).toBe(2);
    expect(filas[0].querySelector('.btn.eliminar')).toBeNull();
    expect(filas[1].querySelector('.btn.eliminar')).not.toBeNull();
  });

  it('abre el modal con la cuenta en vez de usar el aviso del navegador', async () => {
    const fixture = await crearPanel([CIUDADANO], 99);

    botonEliminar(fixture)!.click();
    fixture.detectChanges();

    expect(modal(fixture)).not.toBeNull();
    expect(modal(fixture)?.textContent).toContain(CIUDADANO.nombre);
    expect(modal(fixture)?.textContent).toContain(CIUDADANO.email);
    expect(eliminados).toEqual([]);
  });

  it('no elimina si el administrador cancela en el modal', async () => {
    const fixture = await crearPanel();

    botonEliminar(fixture)!.click();
    fixture.detectChanges();
    botonDelModal(fixture, 'cancelar')!.click();
    fixture.detectChanges();

    expect(modal(fixture)).toBeNull();
    expect(fixture.componentInstance.usuarioAEliminar()).toBeNull();
    expect(eliminados).toEqual([]);
  });

  it('cierra el modal al pulsar la capa de fondo sin eliminar', async () => {
    const fixture = await crearPanel();

    botonEliminar(fixture)!.click();
    fixture.detectChanges();
    root(fixture).querySelector<HTMLElement>('.modal-capa')!.click();
    fixture.detectChanges();

    expect(modal(fixture)).toBeNull();
    expect(eliminados).toEqual([]);
  });

  it('elimina la cuenta confirmada y recarga la lista', async () => {
    const fixture = await crearPanel();

    botonEliminar(fixture)!.click();
    fixture.detectChanges();
    botonDelModal(fixture, 'eliminar')!.click();
    fixture.detectChanges();

    expect(eliminados).toEqual([CIUDADANO.idUsuario]);
    expect(fixture.componentInstance.mensaje()).toContain('eliminado');
    expect(modal(fixture)).toBeNull();
  });

  it('muestra un mensaje si el backend rechaza la eliminacion', async () => {
    const fixture = await crearPanelConError();

    botonEliminar(fixture)!.click();
    fixture.detectChanges();
    botonDelModal(fixture, 'eliminar')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.mensaje()).toContain('Error al eliminar');
    expect(modal(fixture)).toBeNull();
  });
});
