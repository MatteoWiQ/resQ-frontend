import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';

import { SelectorUbicacionComponent } from './selector-ubicacion.component';
import {
  ErrorGeolocalizacion,
  GeolocalizacionService,
  PosicionGeografica,
} from '../../../core/services/geolocalizacion.service';

const TAMANO_MAPA: DOMRect = {
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  right: 800,
  bottom: 600,
  width: 800,
  height: 600,
  toJSON: () => ({}),
} as DOMRect;

const UBICACION_ACTUAL: PosicionGeografica = {
  latitud: -17.3895,
  longitud: -66.1568,
};

class GeolocalizacionStub {
  emisiones = new Subject<PosicionGeografica>();
  solicitudes = 0;

  obtenerPosicionActual(): Observable<PosicionGeografica> {
    this.solicitudes += 1;
    this.emisiones = new Subject<PosicionGeografica>();
    return this.emisiones;
  }
}

describe('SelectorUbicacionComponent: ubicacion actual del dispositivo (HU-16)', () => {
  let geolocalizacion: GeolocalizacionStub;
  let fixture: ComponentFixture<SelectorUbicacionComponent>;
  let mapa: HTMLElement;

  beforeEach(async () => {
    geolocalizacion = new GeolocalizacionStub();

    await TestBed.configureTestingModule({
      imports: [SelectorUbicacionComponent],
      providers: [{ provide: GeolocalizacionService, useValue: geolocalizacion }],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectorUbicacionComponent);
    mapa = (fixture.nativeElement as HTMLElement).querySelector(
      '.selector__mapa'
    ) as HTMLElement;

    mapa.getBoundingClientRect = () => TAMANO_MAPA;
    Object.defineProperties(mapa, {
      offsetWidth: { value: TAMANO_MAPA.width, configurable: true },
      offsetHeight: { value: TAMANO_MAPA.height, configurable: true },
      clientWidth: { value: TAMANO_MAPA.width, configurable: true },
      clientHeight: { value: TAMANO_MAPA.height, configurable: true },
    });

    fixture.detectChanges();
  });

  function compiled(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function botonUbicacionActual(): HTMLButtonElement {
    return compiled().querySelector<HTMLButtonElement>('.selector__mi-ubicacion') as HTMLButtonElement;
  }

  function textoDelError(): string {
    return compiled().querySelector('.selector__error')?.textContent?.trim() ?? '';
  }

  function pedirUbicacionActual(): void {
    botonUbicacionActual().click();
    fixture.detectChanges();
  }

  it('debe ofrecer el boton para usar la ubicacion actual', () => {
    expect(botonUbicacionActual().textContent?.trim()).toBe('Usar mi ubicación actual');
    expect(botonUbicacionActual().disabled).toBe(false);
  });

  it('debe pedir la ubicacion actual al dispositivo una sola vez por pulsacion', () => {
    pedirUbicacionActual();

    expect(geolocalizacion.solicitudes).toBe(1);
  });

  it('debe marcar el mapa con las coordenadas obtenidas del dispositivo', () => {
    pedirUbicacionActual();

    geolocalizacion.emisiones.next(UBICACION_ACTUAL);
    fixture.detectChanges();

    expect(fixture.componentInstance.latitud()).toBe(UBICACION_ACTUAL.latitud);
    expect(fixture.componentInstance.longitud()).toBe(UBICACION_ACTUAL.longitud);
    expect(compiled().querySelectorAll('.leaflet-marker-icon').length).toBe(1);
    expect(compiled().querySelector('.selector__coords')?.textContent).toContain('-17.3895');
    expect(compiled().querySelector('.selector__coords')?.textContent).toContain('-66.1568');
  });

  it('debe avisar que esta obteniendo la ubicacion y bloquear el boton', () => {
    pedirUbicacionActual();

    expect(fixture.componentInstance.obteniendo()).toBe(true);
    expect(botonUbicacionActual().textContent?.trim()).toBe('Obteniendo tu ubicación...');
    expect(botonUbicacionActual().disabled).toBe(true);

    geolocalizacion.emisiones.next(UBICACION_ACTUAL);
    fixture.detectChanges();

    expect(fixture.componentInstance.obteniendo()).toBe(false);
    expect(botonUbicacionActual().disabled).toBe(false);
  });

  it('debe informar que el dispositivo no permite obtener la ubicacion', () => {
    pedirUbicacionActual();

    geolocalizacion.emisiones.error(new ErrorGeolocalizacion('NO_SOPORTADA'));
    fixture.detectChanges();

    expect(textoDelError()).toContain('Este dispositivo no permite obtener la ubicación');
    expect(fixture.componentInstance.latitud()).toBeNull();
    expect(fixture.componentInstance.longitud()).toBeNull();
  });

  it('debe informar que el permiso fue denegado', () => {
    pedirUbicacionActual();

    geolocalizacion.emisiones.error(new ErrorGeolocalizacion('PERMISO_DENEGADO'));
    fixture.detectChanges();

    expect(textoDelError()).toContain('No diste permiso para usar tu ubicación');
  });

  it('debe informar que la posicion no esta disponible', () => {
    pedirUbicacionActual();

    geolocalizacion.emisiones.error(new ErrorGeolocalizacion('POSICION_NO_DISPONIBLE'));
    fixture.detectChanges();

    expect(textoDelError()).toContain('No se pudo determinar tu ubicación');
  });

  it('debe informar que se agoto el tiempo de espera', () => {
    pedirUbicacionActual();

    geolocalizacion.emisiones.error(new ErrorGeolocalizacion('TIEMPO_AGOTADO'));
    fixture.detectChanges();

    expect(textoDelError()).toContain('tardó demasiado');
  });

  it('debe informar que hace falta una conexion segura', () => {
    pedirUbicacionActual();

    geolocalizacion.emisiones.error(new ErrorGeolocalizacion('CONTEXTO_SEGURO'));
    fixture.detectChanges();

    expect(textoDelError()).toContain('conexión segura');
  });

  it('debe informar con un mensaje generico ante un error inesperado', () => {
    pedirUbicacionActual();

    geolocalizacion.emisiones.error(new Error('fallo raro'));
    fixture.detectChanges();

    expect(textoDelError()).toContain('No se pudo obtener tu ubicación');
    expect(fixture.componentInstance.obteniendo()).toBe(false);
  });

  it('debe avisar como alternativa que se puede marcar el punto en el mapa', () => {
    pedirUbicacionActual();

    geolocalizacion.emisiones.error(new ErrorGeolocalizacion('NO_SOPORTADA'));
    fixture.detectChanges();

    expect(textoDelError()).toContain('Marca el punto en el mapa');
  });

  it('debe limpiar el mensaje de error al quitar la ubicacion', () => {
    mapa.dispatchEvent(new MouseEvent('click', { clientX: 400, clientY: 300, bubbles: true }));
    fixture.detectChanges();

    pedirUbicacionActual();
    geolocalizacion.emisiones.error(new ErrorGeolocalizacion('PERMISO_DENEGADO'));
    fixture.detectChanges();
    expect(textoDelError()).not.toBe('');

    compiled().querySelector<HTMLButtonElement>('.selector__quitar')?.click();
    fixture.detectChanges();

    expect(textoDelError()).toBe('');
    expect(fixture.componentInstance.latitud()).toBeNull();
    expect(fixture.componentInstance.longitud()).toBeNull();
  });

  it('debe pedir la ubicacion actual de nuevo tras un fallo previo', () => {
    pedirUbicacionActual();
    geolocalizacion.emisiones.error(new ErrorGeolocalizacion('TIEMPO_AGOTADO'));
    fixture.detectChanges();

    pedirUbicacionActual();

    expect(geolocalizacion.solicitudes).toBe(2);
    expect(textoDelError()).toBe('');
    expect(fixture.componentInstance.obteniendo()).toBe(true);
  });
});
