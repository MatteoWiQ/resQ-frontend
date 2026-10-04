import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PanelAdminComponent } from './panel-admin.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ConsultaReportes } from '../../../../core/services/reporte.service';
import { OrdenReporte } from '../../../../shared/constants/gestion-reportes';
import { Reporte } from '../../../../shared/models/reporte.model';

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

const EN_PROCESO: Reporte = { ...PENDIENTE, idReporte: 2, estado: 'EN_PROCESO' };

type Fixture = ReturnType<typeof TestBed.createComponent>;

describe('PanelAdminComponent: gestion de reportes (HU-24)', () => {
  let consultas: ConsultaReportes[];
  let eliminados: number[];
  let navegar: ReturnType<typeof vi.fn>;

  async function crearPanel(respuesta: Reporte[] = [PENDIENTE, EN_PROCESO]) {
    consultas = [];
    eliminados = [];
    navegar = vi.fn(() => Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [PanelAdminComponent],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: { navigate: navegar } },
        { provide: AuthService, useValue: { obtenerIdUsuarioActual: () => 99 } },
        {
          provide: ReporteService,
          useValue: {
            obtenerTodos: (_estados?: unknown, consulta?: ConsultaReportes) => {
              consultas.push(consulta ?? {});
              return of(respuesta);
            },
            actualizar: () => of(respuesta[0]),
            eliminar: (id: number) => {
              eliminados.push(id);
              return of(void 0);
            },
          },
        },
        {
          provide: UsuarioService,
          useValue: { obtenerTodos: () => of([]), actualizar: () => of() },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PanelAdminComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  async function crearPanelConErrorAlEliminar() {
    await TestBed.configureTestingModule({
      imports: [PanelAdminComponent],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: { navigate: navegar } },
        { provide: AuthService, useValue: { obtenerIdUsuarioActual: () => 99 } },
        {
          provide: ReporteService,
          useValue: {
            obtenerTodos: () => of([PENDIENTE]),
            actualizar: () => of(PENDIENTE),
            eliminar: () => throwError(() => new Error('no permitido')),
          },
        },
        {
          provide: UsuarioService,
          useValue: { obtenerTodos: () => of([]), actualizar: () => of() },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PanelAdminComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function root(fixture: Fixture): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function modal(fixture: Fixture): HTMLElement | null {
    return root(fixture).querySelector<HTMLElement>('.modal--reporte');
  }

  function botonEliminarDeFila(fixture: Fixture): HTMLButtonElement | null {
    return root(fixture).querySelector<HTMLButtonElement>(
      '#seccion-reportes .acciones .btn.eliminar',
    );
  }

  describe('busqueda', () => {
    it('debe pedir mas recientes en la carga inicial', async () => {
      await crearPanel();

      expect(consultas[0]).toEqual({ busqueda: '', orden: 'RECIENTES' });
    });

    it('debe enviar el texto buscado', async () => {
      const fixture = await crearPanel();

      fixture.componentInstance.buscar('perro');

      expect(fixture.componentInstance.busqueda()).toBe('perro');
      expect(consultas.at(-1)).toEqual({ busqueda: 'perro', orden: 'RECIENTES' });
    });

    it('debe buscar al pulsar Enter en el campo', async () => {
      const fixture = await crearPanel();
      const input = root(fixture).querySelector<HTMLInputElement>('#busqueda-reporte')!;

      input.value = 'plaza';
      input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
      await fixture.whenStable();
      fixture.detectChanges();

      expect(consultas.at(-1)?.busqueda).toBe('plaza');
    });

    it('debe limpiar la busqueda y volver a pedir todos los casos', async () => {
      const fixture = await crearPanel();
      fixture.componentInstance.buscar('perro');

      fixture.componentInstance.limpiarBusqueda();

      expect(fixture.componentInstance.busqueda()).toBe('');
      expect(fixture.componentInstance.hayBusqueda()).toBe(false);
      expect(consultas.at(-1)?.busqueda).toBe('');
    });

    it('no debe mostrar el boton limpiar cuando no hay busqueda', async () => {
      const fixture = await crearPanel();

      expect(root(fixture).querySelector('#seccion-reportes .btn.cancelar')).toBeNull();
    });

    it('debe avisar cuando ningun caso coincide', async () => {
      const fixture = await crearPanel([]);

      expect(root(fixture).querySelector('.tabla__vacia')).not.toBeNull();
      expect(root(fixture).textContent).toContain('Ningún reporte coincide');
    });
  });

  describe('orden', () => {
    it('debe ofrecer mas recientes y mas antiguos', async () => {
      const fixture = await crearPanel();
      const opciones = Array.from(
        root(fixture).querySelectorAll<HTMLOptionElement>('#orden-reportes option'),
      );

      expect(opciones.map((o) => o.textContent?.trim())).toEqual([
        'Más recientes',
        'Más antiguos',
      ]);
    });

    it('debe recargar con el orden elegido', async () => {
      const fixture = await crearPanel();

      fixture.componentInstance.cambiarOrden('ANTIGUOS');

      expect(fixture.componentInstance.orden()).toBe('ANTIGUOS');
      expect(consultas.at(-1)?.orden).toBe('ANTIGUOS' as OrdenReporte);
    });

    it('debe cerrar la edicion en curso al cambiar de orden', async () => {
      const fixture = await crearPanel();
      fixture.componentInstance.editarReporte(PENDIENTE);

      fixture.componentInstance.cambiarOrden('ANTIGUOS');

      expect(fixture.componentInstance.editandoReporteId()).toBeNull();
    });
  });

  describe('detalle', () => {
    it('debe abrir el detalle del reporte', async () => {
      const fixture = await crearPanel();

      fixture.componentInstance.verDetalle(PENDIENTE);

      expect(navegar).toHaveBeenCalledWith(['/admin/reportes', PENDIENTE.idReporte]);
    });

    it('debe mostrar el boton ver detalle en cada caso', async () => {
      const fixture = await crearPanel();
      // Cada fila tiene dos botones .btn.editar (ver detalle y editar), asi que
      // se cuenta por texto y no por clase.
      const etiquetas = Array.from(
        root(fixture).querySelectorAll('#seccion-reportes .acciones .btn.editar'),
      ).map((boton) => boton.textContent?.trim());

      expect(etiquetas).toEqual(['Ver detalle', 'Editar', 'Ver detalle', 'Editar']);
    });
  });

  describe('eliminar', () => {
    it('debe abrir el modal con el caso en vez de usar el aviso del navegador', async () => {
      const fixture = await crearPanel();

      botonEliminarDeFila(fixture)!.click();
      fixture.detectChanges();

      expect(modal(fixture)).not.toBeNull();
      expect(modal(fixture)?.textContent).toContain('#1');
      expect(eliminados).toEqual([]);
    });

    it('no debe eliminar si el administrador cancela', async () => {
      const fixture = await crearPanel();
      botonEliminarDeFila(fixture)!.click();
      fixture.detectChanges();

      modal(fixture)!.querySelector<HTMLButtonElement>('.btn.cancelar')!.click();
      fixture.detectChanges();

      expect(modal(fixture)).toBeNull();
      expect(eliminados).toEqual([]);
    });

    it('debe eliminar el caso confirmado y recargar la tabla', async () => {
      const fixture = await crearPanel();
      botonEliminarDeFila(fixture)!.click();
      fixture.detectChanges();

      modal(fixture)!.querySelector<HTMLButtonElement>('.btn.eliminar')!.click();
      fixture.detectChanges();

      expect(eliminados).toEqual([PENDIENTE.idReporte]);
      expect(fixture.componentInstance.mensaje()).toContain('eliminado');
      expect(modal(fixture)).toBeNull();
    });

    it('debe mostrar un mensaje si el backend rechaza el borrado', async () => {
      const fixture = await crearPanelConErrorAlEliminar();
      botonEliminarDeFila(fixture)!.click();
      fixture.detectChanges();

      modal(fixture)!.querySelector<HTMLButtonElement>('.btn.eliminar')!.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.mensaje()).toContain('Error al eliminar reporte');
    });

    it('no debe borrar nada si no hay caso confirmado', async () => {
      const fixture = await crearPanel();

      fixture.componentInstance.confirmarEliminarReporte();

      expect(eliminados).toEqual([]);
    });
  });
});