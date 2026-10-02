import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PanelAdminComponent } from './panel-admin.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Reporte } from '../../../../shared/models/reporte.model';
import { EstadoReporte } from '../../../../shared/models/reporte.model';

const PENDIENTE: Reporte = {
  idReporte: 1,
  idUsuario: 1,
  tipoCaso: 'PERDIDA',
  descripcion: 'Perro perdido cerca a la plaza',
  estado: 'PENDIENTE',
  fotoUrl: null,
  fechaCreacion: '2026-09-01T10:00:00',
  latitud: -17.3895,
  longitud: -66.1568,
};

const EN_PROCESO: Reporte = {
  ...PENDIENTE,
  idReporte: 2,
  estado: 'EN_PROCESO',
};

describe('PanelAdminComponent: filtro por estado (HU-15)', () => {
  let solicitadosReporte: unknown[];
  let solicitadosUsuario = 0;

  async function crearPanel(respuesta: Reporte[] = [PENDIENTE]) {
    solicitadosReporte = [];
    solicitadosUsuario = 0;

    await TestBed.configureTestingModule({
      imports: [PanelAdminComponent],
      providers: [
        {
          provide: AuthService,
          useValue: { obtenerIdUsuarioActual: () => 99 },
        },
        {
          provide: ReporteService,
          useValue: {
            // El mock filtra igual que el backend, para comprobar que el
            // componente pinta exactamente lo que le devuelve la API.
            obtenerTodos: (estados?: EstadoReporte[]) => {
              solicitadosReporte.push(estados);
              const lista = estados?.length
                ? respuesta.filter((r) => estados.includes(r.estado))
                : respuesta;
              return of(lista);
            },
            actualizar: () => of(respuesta[0]),
          },
        },
        {
          provide: UsuarioService,
          useValue: {
            obtenerTodos: () => {
              solicitadosUsuario += 1;
              return of([]);
            },
            actualizar: () => of(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PanelAdminComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function opciones(fixture: { nativeElement: HTMLElement }): HTMLOptionElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLOptionElement>(
        '#filtro-estado option',
      ),
    );
  }

  function selector(fixture: { nativeElement: HTMLElement }): HTMLSelectElement {
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(
      '#filtro-estado',
    ) as HTMLSelectElement;
  }

  async function elegir(fixture: ReturnType<typeof TestBed.createComponent>, valor: string) {
    const select = selector(fixture as never);
    select.value = valor;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('debe pedir todos los reportes en la carga inicial', async () => {
    const fixture = await crearPanel();

    expect(solicitadosReporte).toEqual([[]]);
    expect(fixture.componentInstance.filtroReporte()).toBe('TODOS');
    expect(solicitadosUsuario).toBe(1);
  });

  it('debe ofrecer los cinco filtros con su etiqueta', async () => {
    const fixture = await crearPanel();

    expect(opciones(fixture).map((o) => o.textContent?.trim())).toEqual([
      'Todos',
      'Urgentes',
      'Activos',
      'Resueltos',
      'Cancelados',
    ]);
  });

  it('debe pedir solo los pendientes al elegir urgentes', async () => {
    const fixture = await crearPanel();
    solicitadosReporte = [];

    await elegir(fixture, 'URGENTES');

    expect(solicitadosReporte).toEqual([['PENDIENTE']]);
    expect(fixture.componentInstance.filtroReporte()).toBe('URGENTES');
  });

  it('debe pedir los estados combinados al elegir activos', async () => {
    const fixture = await crearPanel();
    solicitadosReporte = [];

    await elegir(fixture, 'ACTIVOS');

    expect(solicitadosReporte).toEqual([['PENDIENTE', 'EN_PROCESO']]);
  });

  it('debe pedir solo los resueltos al elegir resueltos', async () => {
    const fixture = await crearPanel();
    solicitadosReporte = [];

    await elegir(fixture, 'RESUELTOS');

    expect(solicitadosReporte).toEqual([['RESUELTO']]);
  });

  it('debe mostrar solo los reportes que devuelve el backend', async () => {
    const fixture = await crearPanel([EN_PROCESO]);

    expect(fixture.componentInstance.reportes()).toHaveLength(1);
    expect(fixture.componentInstance.reportes()[0].estado).toBe('EN_PROCESO');
  });

  it('debe actualizar el conteo de casos mostrados', async () => {
    const fixture = await crearPanel([PENDIENTE, EN_PROCESO]);
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.filtro-reportes__conteo')?.textContent).toContain('2');

    await elegir(fixture, 'URGENTES');

    expect(compiled.querySelector('.filtro-reportes__conteo')?.textContent).toContain('1');
  });

  it('debe seleccionar el filtro activo en el select', async () => {
    const fixture = await crearPanel();

    expect(selector(fixture as never).value).toBe('TODOS');

    await elegir(fixture, 'RESUELTOS');

    expect(selector(fixture as never).value).toBe('RESUELTOS');
  });

  it('debe cerrar la edicion en curso al cambiar de filtro', async () => {
    const fixture = await crearPanel();
    fixture.componentInstance.editarReporte(PENDIENTE);
    fixture.detectChanges();

    expect(fixture.componentInstance.editandoReporteId()).toBe(1);

    await elegir(fixture, 'RESUELTOS');

    expect(fixture.componentInstance.editandoReporteId()).toBeNull();
  });
});
