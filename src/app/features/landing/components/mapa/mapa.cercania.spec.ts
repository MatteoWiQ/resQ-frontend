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

  function texto(compiled: HTMLElement, selector: string): string {
    return compiled.querySelector(selector)?.textContent?.trim() ?? '';
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

  function idsVisibles(fixture: { nativeElement: HTMLElement }): number[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.cercania__item-id'),
    ).map((elemento) => Number(elemento.textContent?.replace('#', '')));
  }

  async function buscarDesde(compiled: HTMLElement) {
    (compiled.querySelector('.cercania__accion') as HTMLButtonElement).click();
    await Promise.resolve();
  }

  it('debe pedir la ubicacion solo cuando el usuario lo acepta', async () => {
    let pedidos = 0;
    await crearMapa(TODOS_LOS_CASOS, {
      obtenerPosicionActual: () => {
        pedidos += 1;
        return of(ORIGEN);
      },
    });

    expect(pedidos).toBe(0);
  });

  it('debe invitar a indicar la ubicacion antes de ordenar', async () => {
    const fixture = await crearMapa();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(texto(compiled, '.cercania__ayuda')).toContain('Indica tu ubicación');
    expect(compiled.querySelector('.cercania__accion')).toBeTruthy();
    expect(compiled.querySelector('.cercania__radios')).toBeNull();
    expect(compiled.querySelector('.cercania__lista')).toBeNull();
  });

  it('debe listar todos los casos con ubicacion mientras no haya origen', async () => {
    const fixture = await crearMapa();

    expect(fixture.componentInstance.reportesVisibles()).toHaveLength(4);
    expect(
      fixture.componentInstance.reportesVisibles().every((caso) => caso.distanciaKm === null),
    ).toBe(true);
  });

  it('debe ordenar los casos por distancia al obtener la ubicacion', async () => {
    const fixture = await crearMapa();
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    expect(fixture.componentInstance.origen()).toEqual(ORIGEN);
    expect(idsVisibles(fixture)).toEqual([1, 2, 3, 4]);
  });

  it('debe mostrar la distancia de cada caso', async () => {
    const fixture = await crearMapa();
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    const distancias = Array.from(compiled.querySelectorAll('.cercania__item-distancia')).map(
      (elemento) => elemento.textContent?.trim(),
    );

    expect(distancias[0]).toBe('a 0 m');
    expect(distancias[1]).toBe('a 550 m');
    expect(distancias[2]).toBe('a 4.0 km');
    expect(distancias[3]).toBe('a 9.0 km');
  });

  it('debe marcar en el mapa donde esta el usuario', async () => {
    const fixture = await crearMapa();
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    expect(compiled.querySelector('.resq-marker__origen')).toBeTruthy();
  });

  it('debe ofrecer los cuatro alcances acordados', async () => {
    const fixture = await crearMapa();
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    expect(radios(compiled).map((b) => b.textContent?.trim())).toEqual([
      'Sin límite',
      '1 km',
      '5 km',
      '10 km',
    ]);
  });

  it('debe quedarse con los casos dentro de 1 km', async () => {
    const fixture = await crearMapa();
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    radio(compiled, '1 km').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.radioActivo()).toBe('KM_1');
    expect(idsVisibles(fixture)).toEqual([1, 2]);
    expect(compiled.querySelectorAll('.resq-marker__pin').length).toBe(2);
    expect(compiled.querySelectorAll('.resq-marker__origen').length).toBe(1);
  });

  it('debe ampliar el alcance a 5 km', async () => {
    const fixture = await crearMapa();
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    radio(compiled, '1 km').click();
    fixture.detectChanges();
    radio(compiled, '5 km').click();
    fixture.detectChanges();

    expect(idsVisibles(fixture)).toEqual([1, 2, 3]);
  });

  it('debe devolver todos los casos al elegir sin limite', async () => {
    const fixture = await crearMapa();
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    radio(compiled, '1 km').click();
    fixture.detectChanges();
    radio(compiled, 'Sin límite').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.radioActivo()).toBe('SIN_LIMITE');
    expect(idsVisibles(fixture)).toEqual([1, 2, 3, 4]);
  });

  it('debe marcar el alcance elegido', async () => {
    const fixture = await crearMapa();
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    radio(compiled, '5 km').click();
    fixture.detectChanges();

    expect(radio(compiled, '5 km').classList).toContain('cercania__radio--activo');
    expect(radio(compiled, '1 km').getAttribute('aria-pressed')).toBe('false');
  });

  it('debe avisar cuando el alcance queda sin casos', async () => {
    const fixture = await crearMapa([reporte(9, alNorte(20))]);
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    radio(compiled, '1 km').click();
    fixture.detectChanges();

    expect(compiled.querySelector('.mapa-overlay')?.textContent).toContain(
      'No hay casos registrados dentro de este alcance',
    );
  });

  it('debe ofrecer volver a sin limite cuando el alcance queda vacio', async () => {
    const fixture = await crearMapa([reporte(9, alNorte(20))]);
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();
    radio(compiled, '1 km').click();
    fixture.detectChanges();

    (compiled.querySelector('.mapa-overlay .primary-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(idsVisibles(fixture)).toEqual([9]);
  });

  it('debe abrir el detalle con la distancia del caso', async () => {
    const fixture = await crearMapa();
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    (compiled.querySelectorAll('.cercania__enlace')[2] as HTMLButtonElement).click();
    fixture.detectChanges();

    const panel = compiled.querySelector('.detalle-panel') as HTMLElement;
    expect(panel.textContent).toContain('#3');
    expect(panel.textContent).toContain('a 4.0 km');
  });

  it('debe volver a todos los casos al limpiar la busqueda', async () => {
    const fixture = await crearMapa();
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();
    radio(compiled, '1 km').click();
    fixture.detectChanges();

    (compiled.querySelector('.cercania__limpiar') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.origen()).toBeNull();
    expect(fixture.componentInstance.radioActivo()).toBe('SIN_LIMITE');
    expect(compiled.querySelector('.cercania__radios')).toBeNull();
    expect(compiled.querySelectorAll('.leaflet-marker-icon').length).toBe(4);
  });

  it('debe explicar el motivo cuando se deniega el permiso', async () => {
    const fixture = await crearMapa(TODOS_LOS_CASOS, {
      obtenerPosicionActual: () =>
        throwError(() => new ErrorGeolocalizacion('PERMISO_DENEGADO')),
    });
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    expect(texto(compiled, '.cercania__error')).toContain('No diste permiso');
    expect(fixture.componentInstance.origen()).toBeNull();
    expect(compiled.querySelector('.cercania__radios')).toBeNull();
  });

  it('debe explicar cuando hace falta una conexion segura', async () => {
    const fixture = await crearMapa(TODOS_LOS_CASOS, {
      obtenerPosicionActual: () => throwError(() => new ErrorGeolocalizacion('CONTEXTO_SEGURO')),
    });
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    expect(texto(compiled, '.cercania__error')).toContain('conexión segura');
  });

  it('debe mantener el mapa con todos los casos si la ubicacion falla', async () => {
    const fixture = await crearMapa(TODOS_LOS_CASOS, {
      obtenerPosicionActual: () => throwError(() => new ErrorGeolocalizacion('TIEMPO_AGOTADO')),
    });
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.leaflet-marker-icon').length).toBe(4);
    expect(compiled.querySelector('.cercania__accion')).toBeTruthy();
  });

  it('debe formatear la distancia en metros por debajo de un kilometro', async () => {
    const fixture = await crearMapa();

    expect(fixture.componentInstance.formatoDistancia(0)).toBe('a 0 m');
    expect(fixture.componentInstance.formatoDistancia(0.42)).toBe('a 420 m');
    expect(fixture.componentInstance.formatoDistancia(0.999)).toBe('a 999 m');
  });

  it('debe formatear la distancia en kilometros desde un kilometro', async () => {
    const fixture = await crearMapa();

    expect(fixture.componentInstance.formatoDistancia(1)).toBe('a 1.0 km');
    expect(fixture.componentInstance.formatoDistancia(4.26)).toBe('a 4.3 km');
  });

  it('debe avisar cuando la distancia no se conoce', async () => {
    const fixture = await crearMapa();

    expect(fixture.componentInstance.formatoDistancia(null)).toBe('Distancia no disponible');
  });

  it('debe comparar contra el origen activo y no contra el reporte', async () => {
    const fixture = await crearMapa();
    const compiled = fixture.nativeElement as HTMLElement;
    await buscarDesde(compiled);
    fixture.detectChanges();

    expect(fixture.componentInstance.distanciaDe(EN_EL_ORIGEN)).toBe(0);
    expect(fixture.componentInstance.distanciaDe(SIN_UBICACION)).toBeNull();
  });
});
