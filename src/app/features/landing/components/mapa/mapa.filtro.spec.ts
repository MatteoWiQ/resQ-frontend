import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { MapaComponent } from './mapa.component';
import { ReporteService } from '../../../../core/services/reporte.service';
import { Reporte } from '../../../../shared/models/reporte.model';

const PERDIDA: Reporte = {
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

const RESUELTO: Reporte = {
  ...PERDIDA,
  idReporte: 2,
  estado: 'RESUELTO',
};

describe('MapaComponent: filtro por estado (HU-15)', () => {
  let solicitados: unknown[];

  async function crearMapa(respuesta: Reporte[] = [PERDIDA]) {
    solicitados = [];

    await TestBed.configureTestingModule({
      imports: [MapaComponent],
      providers: [
        provideRouter([]),
        {
          provide: ReporteService,
          useValue: {
            obtenerTodos: (estados?: unknown) => {
              solicitados.push(estados);
              return of(respuesta);
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MapaComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function botones(compiled: HTMLElement): HTMLButtonElement[] {
    return Array.from(compiled.querySelectorAll<HTMLButtonElement>('.filtros__btn'));
  }

  function botonDe(compiled: HTMLElement, texto: string): HTMLButtonElement {
    const boton = botones(compiled).find((b) => b.textContent?.trim() === texto);
    if (!boton) {
      throw new Error(`No se encontro el boton de filtro "${texto}"`);
    }
    return boton;
  }

  it('debe pedir todos los casos en la carga inicial', async () => {
    const fixture = await crearMapa();

    expect(solicitados).toEqual([[]]);
    expect(fixture.componentInstance.filtroActivo()).toBe('TODOS');
  });

  it('debe ofrecer los cinco filtros con su etiqueta', async () => {
    const fixture = await crearMapa();
    const lista = botones(fixture.nativeElement as HTMLElement);

    expect(lista.length).toBe(5);
    expect(lista.map((b) => b.textContent?.trim())).toEqual([
      'Todos',
      'Urgentes',
      'Activos',
      'Resueltos',
      'Cancelados',
    ]);
  });

  it('debe marcar como activo solo el filtro seleccionado', async () => {
    const fixture = await crearMapa();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(botonDe(compiled, 'Todos').classList).toContain('filtros__btn--activo');
    expect(botonDe(compiled, 'Urgentes').classList).not.toContain('filtros__btn--activo');
  });

  it('debe pedir solo los pendientes al elegir urgentes', async () => {
    const fixture = await crearMapa();
    solicitados = [];

    botonDe(fixture.nativeElement as HTMLElement, 'Urgentes').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(solicitados).toEqual([['PENDIENTE']]);
    expect(fixture.componentInstance.filtroActivo()).toBe('URGENTES');
  });

  it('debe pedir los estados combinados al elegir activos', async () => {
    const fixture = await crearMapa();
    solicitados = [];

    botonDe(fixture.nativeElement as HTMLElement, 'Activos').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(solicitados).toEqual([['PENDIENTE', 'EN_PROCESO']]);
  });

  it('debe pedir solo los resueltos al elegir resueltos', async () => {
    const fixture = await crearMapa();
    solicitados = [];

    botonDe(fixture.nativeElement as HTMLElement, 'Resueltos').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(solicitados).toEqual([['RESUELTO']]);
  });

  it('debe volver a pedir todos los casos al elegir el filtro todos', async () => {
    const fixture = await crearMapa();

    botonDe(fixture.nativeElement as HTMLElement, 'Urgentes').click();
    await fixture.whenStable();
    solicitados = [];

    botonDe(fixture.nativeElement as HTMLElement, 'Todos').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(solicitados).toEqual([[]]);
    expect(fixture.componentInstance.filtroActivo()).toBe('TODOS');
  });

  it('no debe volver a pedir cuando se elige el filtro que ya esta activo', async () => {
    const fixture = await crearMapa();
    solicitados = [];

    botonDe(fixture.nativeElement as HTMLElement, 'Todos').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(solicitados).toEqual([]);
  });

  it('debe mostrar solo los casos que devuelve el backend para el filtro', async () => {
    const fixture = await crearMapa([RESUELTO]);

    botonDe(fixture.nativeElement as HTMLElement, 'Resueltos').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.reportes()).toHaveLength(1);
    expect(fixture.componentInstance.reportes()[0].estado).toBe('RESUELTO');
  });

  it('debe avisar que el filtro activo no tiene resultados y ofrecer volver a todos', async () => {
    const fixture = await crearMapa([]);
    fixture.componentInstance.seleccionarFiltro('CANCELADOS');
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const overlay = compiled.querySelector('.mapa-overlay') as HTMLElement;

    expect(overlay.textContent).toContain('No hay casos con esos estados.');
    expect(overlay.querySelector('.primary-btn')?.textContent?.trim()).toBe('Todos');
  });

  it('debe mostrar el nombre del filtro activo junto a los contadores', async () => {
    const fixture = await crearMapa();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.header-filtro')?.textContent,
    ).toContain('Todos');

    botonDe(fixture.nativeElement as HTMLElement, 'Urgentes').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.header-filtro')?.textContent,
    ).toContain('Urgentes');
  });
});
