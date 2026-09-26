import { TestBed } from '@angular/core/testing';

import { SelectorUbicacionComponent } from './selector-ubicacion.component';
import { CENTRO_CIUDAD } from '../../constants/geo';

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

describe('SelectorUbicacionComponent', () => {
  function crearComponente() {
    const fixture = TestBed.createComponent(SelectorUbicacionComponent);
    const contenedor = (fixture.nativeElement as HTMLElement).querySelector(
      '.selector__mapa'
    ) as HTMLElement;

    contenedor.getBoundingClientRect = () => TAMANO_MAPA;
    Object.defineProperties(contenedor, {
      offsetWidth: { value: TAMANO_MAPA.width, configurable: true },
      offsetHeight: { value: TAMANO_MAPA.height, configurable: true },
      clientWidth: { value: TAMANO_MAPA.width, configurable: true },
      clientHeight: { value: TAMANO_MAPA.height, configurable: true },
    });

    return { fixture, contenedor };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectorUbicacionComponent],
    }).compileComponents();
  });

  it('deberia crear el componente', () => {
    const fixture = TestBed.createComponent(SelectorUbicacionComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('no debe marcar ubicacion por defecto', () => {
    const { fixture } = crearComponente();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.latitud()).toBeNull();
    expect(fixture.componentInstance.longitud()).toBeNull();
    expect(compiled.querySelectorAll('.leaflet-marker-icon').length).toBe(0);
    expect(compiled.querySelector('.selector__quitar')).toBeNull();
  });

  it('debe tomar las coordenadas del punto donde se hace clic en el mapa', () => {
    const { fixture, contenedor } = crearComponente();
    fixture.detectChanges();

    contenedor.dispatchEvent(
      new MouseEvent('click', { clientX: 400, clientY: 300, bubbles: true })
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.latitud()).toBeCloseTo(CENTRO_CIUDAD[0], 3);
    expect(fixture.componentInstance.longitud()).toBeCloseTo(CENTRO_CIUDAD[1], 3);
  });

  it('debe mostrar el marcador y las coordenadas cuando ya viene una ubicacion', () => {
    const { fixture } = crearComponente();
    fixture.componentRef.setInput('latitud', -17.4);
    fixture.componentRef.setInput('longitud', -66.15);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.leaflet-marker-icon').length).toBe(1);
    expect(compiled.querySelector('.selector__coords')?.textContent).toContain('-17.4');
    expect(compiled.querySelector('.selector__coords')?.textContent).toContain('-66.15');
    expect(compiled.querySelector('.selector__quitar')).toBeTruthy();
  });

  it('debe quitar la ubicacion y el marcador al solicitarlo', () => {
    const { fixture, contenedor } = crearComponente();
    fixture.detectChanges();

    contenedor.dispatchEvent(
      new MouseEvent('click', { clientX: 400, clientY: 300, bubbles: true })
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.latitud()).not.toBeNull();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.selector__quitar'
    )?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.latitud()).toBeNull();
    expect(fixture.componentInstance.longitud()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.leaflet-marker-icon').length).toBe(0);
  });

  it('debe mover el mismo marcador al hacer otro clic', () => {
    const { fixture, contenedor } = crearComponente();
    fixture.detectChanges();

    contenedor.dispatchEvent(
      new MouseEvent('click', { clientX: 400, clientY: 300, bubbles: true })
    );
    fixture.detectChanges();
    const primero = { lat: fixture.componentInstance.latitud(), lng: fixture.componentInstance.longitud() };

    contenedor.dispatchEvent(new MouseEvent('click', { clientX: 600, clientY: 200, bubbles: true }));
    fixture.detectChanges();
    const segundo = { lat: fixture.componentInstance.latitud(), lng: fixture.componentInstance.longitud() };

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.leaflet-marker-icon').length).toBe(1);
    expect(segundo.lat).not.toBe(primero.lat);
    expect(segundo.lng).not.toBe(primero.lng);
    expect(segundo.lat).toBeGreaterThan(primero.lat as number);
    expect(segundo.lng).toBeGreaterThan(primero.lng as number);
  });
});
