import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import { MapaCercaniaComponent } from './mapa-cercania.component';
import {
  ErrorGeolocalizacion,
  GeolocalizacionService,
  PosicionGeografica,
} from '../../../../core/services/geolocalizacion.service';
import { ClaveRadio, ReporteCercano } from '../../../../shared/constants/cercania';
import { Punto } from '../../../../shared/constants/geo';
import { Reporte } from '../../../../shared/models/reporte.model';

const ORIGEN: PosicionGeografica = { latitud: -17.3895, longitud: -66.1568 };

function reporte(idReporte: number, estado: Reporte['estado'] = 'PENDIENTE'): Reporte {
  return {
    idReporte,
    idUsuario: 1,
    tipoCaso: 'PERDIDA',
    descripcion: `caso ${idReporte}`,
    estado,
    fotoUrl: null,
    fechaCreacion: '2026-09-01T10:00:00',
    latitud: ORIGEN.latitud,
    longitud: ORIGEN.longitud,
  };
}

const CASOS: ReporteCercano[] = [
  { reporte: reporte(1, 'PENDIENTE'), distanciaKm: 0 },
  { reporte: reporte(2, 'RESUELTO'), distanciaKm: 0.55 },
  { reporte: reporte(3, 'EN_PROCESO'), distanciaKm: 4 },
];

describe('MapaCercaniaComponent (HU-41)', () => {
  async function crearPanel(
    geolocalizacion: Partial<GeolocalizacionService> = {
      obtenerPosicionActual: () => of(ORIGEN),
    },
    inputs: {
      origen?: Punto | null;
      radioActivo?: ClaveRadio;
      casos?: ReporteCercano[];
    } = {}
  ): Promise<ComponentFixture<MapaCercaniaComponent>> {
    await TestBed.configureTestingModule({
      imports: [MapaCercaniaComponent],
      providers: [{ provide: GeolocalizacionService, useValue: geolocalizacion }],
    }).compileComponents();

    const fixture = TestBed.createComponent(MapaCercaniaComponent);
    fixture.componentRef.setInput('origen', inputs.origen ?? null);
    fixture.componentRef.setInput('radioActivo', inputs.radioActivo ?? 'SIN_LIMITE');
    fixture.componentRef.setInput('casos', inputs.casos ?? CASOS);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function compiled(fixture: ComponentFixture<MapaCercaniaComponent>): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function texto(fixture: ComponentFixture<MapaCercaniaComponent>, selector: string): string {
    return compiled(fixture).querySelector(selector)?.textContent?.trim() ?? '';
  }

  function radios(fixture: ComponentFixture<MapaCercaniaComponent>): HTMLButtonElement[] {
    return Array.from(compiled(fixture).querySelectorAll<HTMLButtonElement>('.cercania__radio'));
  }

  function radio(
    fixture: ComponentFixture<MapaCercaniaComponent>,
    etiqueta: string
  ): HTMLButtonElement {
    const encontrado = radios(fixture).find((b) => b.textContent?.trim() === etiqueta);
    if (!encontrado) {
      throw new Error(`No se encontro el radio "${etiqueta}"`);
    }
    return encontrado;
  }

  async function pulsarAccion(fixture: ComponentFixture<MapaCercaniaComponent>) {
    (compiled(fixture).querySelector('.cercania__accion') as HTMLButtonElement).click();
    await Promise.resolve();
    fixture.detectChanges();
  }

  it('no debe pedir la ubicacion hasta que el usuario lo acepte', async () => {
    let pedidos = 0;
    await crearPanel({
      obtenerPosicionActual: () => {
        pedidos += 1;
        return of(ORIGEN);
      },
    });

    expect(pedidos).toBe(0);
  });

  it('debe invitar a indicar la ubicacion antes de ordenar', async () => {
    const fixture = await crearPanel();

    expect(texto(fixture, '.cercania__ayuda')).toContain('Indica tu ubicación');
    expect(compiled(fixture).querySelector('.cercania__accion')).toBeTruthy();
    expect(compiled(fixture).querySelector('.cercania__radios')).toBeNull();
    expect(compiled(fixture).querySelector('.cercania__lista')).toBeNull();
  });

  it('debe avisar cuando la lista queda vacia', async () => {
    const fixture = await crearPanel(undefined, { origen: ORIGEN, casos: [] });

    expect(compiled(fixture).querySelector('.cercania__conteo')).toBeNull();
    expect(compiled(fixture).querySelector('.cercania__lista')).toBeNull();
  });

  it('debe emitir la posicion obtenida', async () => {
    const fixture = await crearPanel();
    const emitidos: (Punto | null)[] = [];
    fixture.componentInstance.origenCambiado.subscribe((punto) => emitidos.push(punto));

    await pulsarAccion(fixture);

    expect(emitidos).toEqual([ORIGEN]);
  });

  it('no debe pedir la ubicacion dos veces mientras la primera sigue en curso', async () => {
    const pendiente = new Subject<PosicionGeografica>();
    let pedidos = 0;
    const fixture = await crearPanel({
      obtenerPosicionActual: () => {
        pedidos += 1;
        return pendiente.asObservable();
      },
    });

    await pulsarAccion(fixture);
    await pulsarAccion(fixture);

    expect(pedidos).toBe(1);
  });

  it('debe cancelar la solicitud de ubicacion al destruirse', async () => {
    const pendiente = new Subject<PosicionGeografica>();
    const fixture = await crearPanel({
      obtenerPosicionActual: () => pendiente.asObservable(),
    });

    await pulsarAccion(fixture);
    expect(pendiente.observed).toBe(true);

    fixture.destroy();

    expect(pendiente.observed).toBe(false);
  });

  it('debe explicar el motivo cuando se deniega el permiso', async () => {
    const fixture = await crearPanel({
      obtenerPosicionActual: () =>
        throwError(() => new ErrorGeolocalizacion('PERMISO_DENEGADO')),
    });

    await pulsarAccion(fixture);

    expect(texto(fixture, '.cercania__error')).toContain('No diste permiso');
    expect(compiled(fixture).querySelector('.cercania__radios')).toBeNull();
  });

  it('debe explicar cuando hace falta una conexion segura', async () => {
    const fixture = await crearPanel({
      obtenerPosicionActual: () => throwError(() => new ErrorGeolocalizacion('CONTEXTO_SEGURO')),
    });

    await pulsarAccion(fixture);

    expect(texto(fixture, '.cercania__error')).toContain('conexión segura');
  });

  it('debe permitir reintentar despues de un fallo', async () => {
    let intentos = 0;
    const fixture = await crearPanel({
      obtenerPosicionActual: () => {
        intentos += 1;
        return intentos === 1
          ? throwError(() => new ErrorGeolocalizacion('TIEMPO_AGOTADO'))
          : of(ORIGEN);
      },
    });

    await pulsarAccion(fixture);
    const boton = compiled(fixture).querySelector('.cercania__accion') as HTMLButtonElement;
    expect(boton.disabled).toBe(false);
    expect(boton.textContent?.trim()).toBe('Usar mi ubicación actual');

    boton.click();
    await Promise.resolve();
    fixture.detectChanges();

    expect(intentos).toBe(2);
    expect(compiled(fixture).querySelector('.cercania__error')).toBeNull();
  });

  it('debe ofrecer los cuatro alcances acordados', async () => {
    const fixture = await crearPanel(undefined, { origen: ORIGEN });

    expect(radios(fixture).map((b) => b.textContent?.trim())).toEqual([
      'Sin límite',
      '1 km',
      '5 km',
      '10 km',
    ]);
  });

  it('debe marcar el alcance elegido', async () => {
    const fixture = await crearPanel(undefined, { origen: ORIGEN, radioActivo: 'KM_5' });

    expect(radio(fixture, '5 km').classList).toContain('cercania__radio--activo');
    expect(radio(fixture, '5 km').getAttribute('aria-pressed')).toBe('true');
    expect(radio(fixture, '1 km').getAttribute('aria-pressed')).toBe('false');
  });

  it('debe emitir el alcance elegido', async () => {
    const fixture = await crearPanel(undefined, { origen: ORIGEN });
    const emitidos: ClaveRadio[] = [];
    fixture.componentInstance.radioSeleccionado.subscribe((clave) => emitidos.push(clave));

    radio(fixture, '5 km').click();

    expect(emitidos).toEqual(['KM_5']);
  });

  it('debe listar los casos con su estado y su distancia', async () => {
    const fixture = await crearPanel(undefined, { origen: ORIGEN });
    const raiz = compiled(fixture);

    const ids = Array.from(raiz.querySelectorAll('.cercania__item-id')).map((e) =>
      e.textContent?.trim()
    );
    const distancias = Array.from(raiz.querySelectorAll('.cercania__item-distancia')).map((e) =>
      e.textContent?.trim()
    );
    const estados = Array.from(raiz.querySelectorAll('.cercania__item-estado')).map((e) =>
      e.textContent?.trim()
    );

    expect(ids).toEqual(['#1', '#2', '#3']);
    expect(distancias).toEqual(['a 0 m', 'a 550 m', 'a 4.0 km']);
    expect(estados[0]).toContain('Pendiente');
    expect(estados[1]).toContain('Resuelto');
    expect(texto(fixture, '.cercania__conteo')).toContain('3');
  });

  it('debe emitir el caso elegido', async () => {
    const fixture = await crearPanel(undefined, { origen: ORIGEN });
    const emitidos: number[] = [];
    fixture.componentInstance.reporteElegido.subscribe((r) => emitidos.push(r.idReporte));

    (compiled(fixture).querySelectorAll('.cercania__enlace')[2] as HTMLButtonElement).click();

    expect(emitidos).toEqual([3]);
  });

  it('debe pedir limpiar y devolver el panel al estado inicial', async () => {
    const fixture = await crearPanel(undefined, { origen: ORIGEN });
    let limpiezas = 0;
    fixture.componentInstance.limpiar.subscribe(() => (limpiezas += 1));

    (compiled(fixture).querySelector('.cercania__limpiar') as HTMLButtonElement).click();

    expect(limpiezas).toBe(1);
  });

  it('debe formatear la distancia en metros por debajo de un kilometro', async () => {
    const fixture = await crearPanel();

    expect(fixture.componentInstance.formatoDistancia(0)).toBe('a 0 m');
    expect(fixture.componentInstance.formatoDistancia(0.42)).toBe('a 420 m');
    expect(fixture.componentInstance.formatoDistancia(0.999)).toBe('a 999 m');
  });

  it('debe formatear la distancia en kilometros desde un kilometro', async () => {
    const fixture = await crearPanel();

    expect(fixture.componentInstance.formatoDistancia(1)).toBe('a 1.0 km');
    expect(fixture.componentInstance.formatoDistancia(4.26)).toBe('a 4.3 km');
  });

  it('debe avisar cuando la distancia no se conoce', async () => {
    const fixture = await crearPanel();

    expect(fixture.componentInstance.formatoDistancia(null)).toBe('Distancia no disponible');
  });

  it('debe indicar que no hay busqueda en curso sin origen', async () => {
    const fixture = await crearPanel();

    expect(fixture.componentInstance.buscando()).toBe(false);
  });

  it('debe indicar que hay busqueda en curso con origen', async () => {
    const fixture = await crearPanel(undefined, { origen: ORIGEN });

    expect(fixture.componentInstance.buscando()).toBe(true);
  });
});
