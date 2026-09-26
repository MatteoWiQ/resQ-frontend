import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { MapaComponent } from './mapa.component';
import { ReporteService } from '../../../../core/services/reporte.service';
import { colorEstado } from '../../../../shared/constants/geo';
import { Reporte } from '../../../../shared/models/reporte.model';

const REPORTE_PERDIDA: Reporte = {
  idReporte: 1,
  idUsuario: 1,
  tipoCaso: 'PERDIDA',
  descripcion: 'Perro perdido cerca de la plaza 14 de Septiembre',
  estado: 'PENDIENTE',
  fotoUrl: null,
  fechaCreacion: '2026-09-01T10:00:00',
  latitud: -17.3895,
  longitud: -66.1568,
};

const REPORTE_RESCATADO: Reporte = {
  idReporte: 2,
  idUsuario: 2,
  tipoCaso: 'ENCONTRADA',
  descripcion: 'Gata encontrada en el barrio Cercado',
  estado: 'RESUELTO',
  fotoUrl: null,
  fechaCreacion: '2026-09-02T15:30:00',
  latitud: -17.42,
  longitud: -66.18,
};

const REPORTE_SIN_UBICACION: Reporte = {
  idReporte: 3,
  idUsuario: 3,
  tipoCaso: 'ABANDONADA',
  descripcion: 'Cachorro abandonado sin coordenadas',
  estado: 'EN_PROCESO',
  fotoUrl: null,
  fechaCreacion: '2026-09-03T09:00:00',
  latitud: null,
  longitud: null,
};

function aRgb(color: string): string {
  const auxiliar = document.createElement('div');
  auxiliar.style.backgroundColor = color;
  return auxiliar.style.backgroundColor;
}

describe('MapaComponent', () => {
  let reportes: Reporte[];

  function marcadorDe(compiled: HTMLElement, idReporte: number): HTMLElement {
    const marcador = Array.from(compiled.querySelectorAll<HTMLElement>('.leaflet-marker-icon')).find(
      (elemento) => elemento.textContent?.includes(`Reporte ${idReporte}`)
    );
    if (!marcador) {
      throw new Error(`No se encontro el marcador del reporte ${idReporte}`);
    }
    return marcador;
  }

  beforeEach(async () => {
    reportes = [REPORTE_PERDIDA, REPORTE_RESCATADO, REPORTE_SIN_UBICACION];

    await TestBed.configureTestingModule({
      imports: [MapaComponent],
      providers: [
        provideRouter([]),
        { provide: ReporteService, useValue: { obtenerTodos: () => of(reportes) } },
      ],
    }).compileComponents();
  });

  it('deberia crear el componente con su vista de mapa', () => {
    const fixture = TestBed.createComponent(MapaComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('.mapa-container')).toBeTruthy();
  });

  it('debe representar solo los reportes que poseen ubicacion', async () => {
    const fixture = TestBed.createComponent(MapaComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(fixture.componentInstance.reportesConUbicacion().length).toBe(2);
    expect(compiled.querySelectorAll('.leaflet-marker-icon').length).toBe(2);
  });

  it('debe crear un marcador por cada caso y permitir identificar el reporte', async () => {
    const fixture = TestBed.createComponent(MapaComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const marcador = marcadorDe(compiled, 1);
    expect(marcador.querySelector('.resq-marker__pin')).toBeTruthy();
    expect(marcador.textContent).toContain('Reporte 1');
    expect(marcador.textContent).toContain('Pendiente');
  });

  it('debe diferenciar los casos segun su estado', async () => {
    const fixture = TestBed.createComponent(MapaComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const pinPerdida = marcadorDe(compiled, 1).querySelector<HTMLElement>('.resq-marker__pin');
    const pinRescatado = marcadorDe(compiled, 2).querySelector<HTMLElement>('.resq-marker__pin');

    expect(pinPerdida?.style.backgroundColor).toBe(aRgb(colorEstado('PENDIENTE')));
    expect(pinRescatado?.style.backgroundColor).toBe(aRgb(colorEstado('RESUELTO')));
    expect(pinPerdida?.style.backgroundColor).not.toBe(pinRescatado?.style.backgroundColor);
  });

  it('debe listar los cuatro estados en la leyenda', async () => {
    const fixture = TestBed.createComponent(MapaComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const items = compiled.querySelectorAll('.leyenda__item');
    expect(items.length).toBe(4);
    expect(items[0].textContent).toContain('Pendiente');
    expect(items[3].textContent).toContain('Cancelado');
  });

  it('debe mostrar la informacion del reporte al seleccionar un caso', async () => {
    const fixture = TestBed.createComponent(MapaComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.detalle-panel')).toBeNull();

    marcadorDe(compiled, 1).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    const panel = compiled.querySelector('.detalle-panel') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.textContent).toContain('#1');
    expect(panel.textContent).toContain('PERDIDA');
    expect(panel.textContent).toContain(REPORTE_PERDIDA.descripcion);
    expect(panel.textContent).toContain('-17.3895');
  });

  it('debe cerrar el detalle del reporte', async () => {
    const fixture = TestBed.createComponent(MapaComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    marcadorDe(compiled, 1).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(compiled.querySelector('.detalle-panel')).toBeTruthy();

    (compiled.querySelector('.detalle-cerrar') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(compiled.querySelector('.detalle-panel')).toBeNull();
  });

  it('debe avisar cuando no hay casos con ubicacion registrada', async () => {
    reportes = [REPORTE_SIN_UBICACION];

    const fixture = TestBed.createComponent(MapaComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.leaflet-marker-icon').length).toBe(0);
    expect(compiled.querySelector('.mapa-overlay')?.textContent).toContain(
      'No hay casos con ubicación'
    );
  });
});
