import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MapaComponent } from './mapa.component';
import { ReporteService } from '../../../../core/services/reporte.service';
import {
  ErrorGeolocalizacion,
  GeolocalizacionService,
  PosicionGeografica,
} from '../../../../core/services/geolocalizacion.service';
import { Reporte } from '../../../../shared/models/reporte.model';

const ORIGEN: PosicionGeografica = { latitud: -17.3895, longitud: -66.1568 };

/** Un grado de latitud mide ~111.195 km. */
const KM_POR_GRADO_LATITUD = 111.195;

function alNorte(km: number): { latitud: number; longitud: number } {
  return {
    latitud: Number((ORIGEN.latitud + km / KM_POR_GRADO_LATITUD).toFixed(6)),
    longitud: ORIGEN.longitud,
  };
}

function reporte(idReporte: number, coords: Partial<Reporte>): Reporte {
  return {
    idReporte,
    idUsuario: 1,
    tipoCaso: 'PERDIDA',
    descripcion: `caso ${idReporte}`,
    estado: 'PENDIENTE',
    fotoUrl: null,
    fechaCreacion: '2026-09-01T10:00:00',
    ...coords,
  };
}

const EN_EL_ORIGEN = reporte(1, { ...ORIGEN });
const A_550_M = reporte(2, alNorte(0.55));
const A_4_KM = reporte(3, alNorte(4));
const A_9_KM = reporte(4, alNorte(9));
const SIN_UBICACION = reporte(5, { latitud: null, longitud: null });

const TODOS_LOS_CASOS = [EN_EL_ORIGEN, A_550_M, A_4_KM, A_9_KM, SIN_UBICACION];

/**
 * Integracion del mapa con el panel de cercania: lo que el hijo ya no tiene que
 * probar solo, porque necesita Leaflet, el reporte real y los marcadores pintados.
 */
describe('MapaComponent: buscar casos cercanos (HU-41)', () => {
  async function crearMapa(
    casos: Reporte[] = TODOS_LOS_CASOS,
    geolocalizacion: Partial<GeolocalizacionService> = {
      obtenerPosicionActual: () => of(ORIGEN),
    }
  ) {
    await TestBed.configureTestingModule({
      imports: [MapaComponent],
      providers: [
        provideRouter([]),
        { provide: ReporteService, useValue: { obtenerTodos: () => of(casos) } },
        { provide: GeolocalizacionService, useValue: geolocalizacion },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MapaComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function compiled(fixture: { nativeElement: HTMLElement }): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function idsVisibles(fixture: { nativeElement: HTMLElement }): number[] {
    return Array.from(
      compiled(fixture).querySelectorAll<HTMLElement>('.cercania__item-id')
    ).map((elemento) => Number(elemento.textContent?.replace('#', '')));
  }

  function marcadores(compiled: HTMLElement): NodeListOf<Element> {
    return compiled.querySelectorAll('.leaflet-marker-icon');
  }

  function radios(compiled: HTMLElement): HTMLButtonElement[] {
    return Array.from(compiled.querySelectorAll<HTMLButtonElement>('.cercania__radio'));
  }

  function radio(compiled: HTMLElement, etiqueta: string): HTMLButtonElement {
    const encontrado = radios(compiled).find((b) => b.textContent?.trim() === etiqueta);
    if (!encontrado) {
      throw new Error(`No se encontro el radio "${etiqueta}"`);
    }
    return encontrado;
  }

  async function buscarDesde(fixture: { nativeElement: HTMLElement; detectChanges: () => void }) {
    (compiled(fixture).querySelector('.cercania__accion') as HTMLButtonElement).click();
    await Promise.resolve();
    fixture.detectChanges();
  }

  it('debe listar todos los casos con ubicacion mientras no haya origen', async () => {
    const fixture = await crearMapa();

    expect(fixture.componentInstance.reportesVisibles()).toHaveLength(4);
    expect(
      fixture.componentInstance.reportesVisibles().every((caso) => caso.distanciaKm === null),
    ).toBe(true);
  });

  it('debe ordenar los casos por distancia al obtener la ubicacion', async () => {
    const fixture = await crearMapa();
    await buscarDesde(fixture);

    expect(fixture.componentInstance.origen()).toEqual(ORIGEN);
    expect(idsVisibles(fixture)).toEqual([1, 2, 3, 4]);
  });

  it('debe mostrar la distancia de cada caso', async () => {
    const fixture = await crearMapa();
    await buscarDesde(fixture);

    const distancias = Array.from(
      compiled(fixture).querySelectorAll('.cercania__item-distancia')
    ).map((elemento) => elemento.textContent?.trim());

    expect(distancias).toEqual(['a 0 m', 'a 550 m', 'a 4.0 km', 'a 9.0 km']);
  });

  it('debe marcar en el mapa donde esta el usuario', async () => {
    const fixture = await crearMapa();
    await buscarDesde(fixture);

    expect(compiled(fixture).querySelector('.resq-marker__origen')).toBeTruthy();
  });

  it('debe quedarse con los casos dentro de 1 km', async () => {
    const fixture = await crearMapa();
    await buscarDesde(fixture);
    radio(compiled(fixture), '1 km').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.radioActivo()).toBe('KM_1');
    expect(idsVisibles(fixture)).toEqual([1, 2]);
    expect(compiled(fixture).querySelectorAll('.resq-marker__pin').length).toBe(2);
    expect(compiled(fixture).querySelectorAll('.resq-marker__origen').length).toBe(1);
  });

  it('debe ampliar el alcance a 5 km', async () => {
    const fixture = await crearMapa();
    await buscarDesde(fixture);
    radio(compiled(fixture), '1 km').click();
    fixture.detectChanges();
    radio(compiled(fixture), '5 km').click();
    fixture.detectChanges();

    expect(idsVisibles(fixture)).toEqual([1, 2, 3]);
  });

  it('debe devolver todos los casos al elegir sin limite', async () => {
    const fixture = await crearMapa();
    await buscarDesde(fixture);
    radio(compiled(fixture), '1 km').click();
    fixture.detectChanges();
    radio(compiled(fixture), 'Sin límite').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.radioActivo()).toBe('SIN_LIMITE');
    expect(idsVisibles(fixture)).toEqual([1, 2, 3, 4]);
  });

  it('debe avisar cuando el alcance queda sin casos', async () => {
    const fixture = await crearMapa([reporte(9, alNorte(20))]);
    await buscarDesde(fixture);
    radio(compiled(fixture), '1 km').click();
    fixture.detectChanges();

    expect(compiled(fixture).querySelector('.mapa-overlay')?.textContent).toContain(
      'No hay casos registrados dentro de este alcance',
    );
  });

  it('debe ofrecer volver a sin limite cuando el alcance queda vacio', async () => {
    const fixture = await crearMapa([reporte(9, alNorte(20))]);
    await buscarDesde(fixture);
    radio(compiled(fixture), '1 km').click();
    fixture.detectChanges();
    (compiled(fixture).querySelector('.mapa-overlay .primary-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(idsVisibles(fixture)).toEqual([9]);
  });

  it('debe abrir el detalle con la distancia del caso', async () => {
    const fixture = await crearMapa();
    await buscarDesde(fixture);
    (compiled(fixture).querySelectorAll('.cercania__enlace')[2] as HTMLButtonElement).click();
    fixture.detectChanges();

    const panel = compiled(fixture).querySelector('.detalle-panel') as HTMLElement;
    expect(panel.textContent).toContain('#3');
    expect(panel.textContent).toContain('a 4.0 km');
  });

  it('debe volver a todos los casos al limpiar la busqueda', async () => {
    const fixture = await crearMapa();
    await buscarDesde(fixture);
    radio(compiled(fixture), '1 km').click();
    fixture.detectChanges();
    (compiled(fixture).querySelector('.cercania__limpiar') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.origen()).toBeNull();
    expect(fixture.componentInstance.radioActivo()).toBe('SIN_LIMITE');
    expect(compiled(fixture).querySelector('.cercania__radios')).toBeNull();
    expect(marcadores(compiled(fixture)).length).toBe(4);
  });

  it('debe mantener el mapa con todos los casos si la ubicacion falla', async () => {
    const fixture = await crearMapa(TODOS_LOS_CASOS, {
      obtenerPosicionActual: () => throwError(() => new ErrorGeolocalizacion('TIEMPO_AGOTADO')),
    });
    await buscarDesde(fixture);

    expect(marcadores(compiled(fixture)).length).toBe(4);
    expect(compiled(fixture).querySelector('.cercania__accion')).toBeTruthy();
  });

  it('debe comparar contra el origen activo y no contra el reporte', async () => {
    const fixture = await crearMapa();
    await buscarDesde(fixture);

    expect(fixture.componentInstance.distanciaDe(EN_EL_ORIGEN)).toBe(0);
    expect(fixture.componentInstance.distanciaDe(SIN_UBICACION)).toBeNull();
  });
});
