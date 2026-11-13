import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CasosComponent, ESPERA_BUSQUEDA_MS } from './casos.component';
import { GeolocalizacionService } from '../../../../core/services/geolocalizacion.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import { Reporte } from '../../../../shared/models/reporte.model';
import { webSocketServiceDoble } from '../../../../shared/testing/test-doubles';

function caso(id: number, extra: Partial<Reporte> = {}): Reporte {
  return {
    idReporte: id,
    idUsuario: 1,
    tipoCaso: 'PERDIDA',
    descripcion: `Caso ${id}`,
    estado: 'PENDIENTE',
    fotoUrl: null,
    fechaCreacion: '2026-11-12T10:00:00',
    latitud: -17.39 - id / 100,
    longitud: -66.15,
    ...extra,
  };
}

describe('CasosComponent: lista + mapa (rediseño)', () => {
  let fixture: ComponentFixture<CasosComponent>;
  let component: CasosComponent;
  let httpMock: HttpTestingController;
  let geo: { obtenerPosicionActual: ReturnType<typeof vi.fn> };

  async function crear(): Promise<void> {
    localStorage.clear();
    geo = { obtenerPosicionActual: vi.fn(() => of({ latitud: -17.39, longitud: -66.15 })) };
    await TestBed.configureTestingModule({
      imports: [CasosComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GeolocalizacionService, useValue: geo },
        { provide: WebSocketService, useValue: webSocketServiceDoble() },
        { provide: NotificacionService, useValue: { noLeidas: () => 0, cargar: () => of([]), limpiar: () => undefined } },
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CasosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function pedido(): TestRequest {
    return httpMock.expectOne((r) => r.url === '/api/reportes');
  }

  function responder(casos: Reporte[]): TestRequest {
    const req = pedido();
    req.flush(casos);
    fixture.detectChanges();
    return req;
  }

  const dom = () => fixture.nativeElement as HTMLElement;
  const titulos = () => Array.from(dom().querySelectorAll('.tarjeta-caso-titulo')).map((e) => e.textContent?.trim());

  afterEach(() => {
    vi.useRealTimers();
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('por defecto pide los casos abiertos y los muestra con su insignia, urgentes primero', async () => {
    await crear();
    const req = responder([caso(1, { estado: 'EN_PROCESO' }), caso(2)]);

    expect(req.request.params.get('estado')).toBe('PENDIENTE,EN_PROCESO');
    expect(titulos()).toEqual(['Caso 2', 'Caso 1']);
    expect(dom().querySelector('.tarjeta-caso .insignia-caso')?.textContent).toContain('Urgente');
    expect(dom().querySelector('.lista-total')?.textContent).toContain('2 casos');
  });

  it('una sola barra de filtros, con Animal y Necesita deshabilitados', async () => {
    await crear();
    responder([]);

    expect(dom().querySelectorAll('form.barra-filtros').length).toBe(1);
    const proximamente = dom().querySelectorAll<HTMLButtonElement>('.filtro-proximamente');
    expect(proximamente.length).toBe(2);
    expect(Array.from(proximamente).every((b) => b.disabled)).toBe(true);
  });

  it('cambiar el estado vuelve a pedir al backend', async () => {
    await crear();
    responder([]);

    const select = dom().querySelector<HTMLSelectElement>('select[name="estado"]')!;
    select.value = 'RESUELTOS';
    select.dispatchEvent(new Event('change'));

    expect(pedido().request.params.get('estado')).toBe('RESUELTO');
  });

  it('la busqueda espera a que se deje de escribir y viaja al backend', async () => {
    await crear();
    responder([]);
    vi.useFakeTimers();

    component.alBuscar('per');
    component.alBuscar('perro');
    vi.advanceTimersByTime(ESPERA_BUSQUEDA_MS);

    const req = pedido();
    expect(req.request.params.get('busqueda')).toBe('perro');
    req.flush([]);
  });

  it('el tipo de caso filtra en el navegador sin volver a pedir', async () => {
    await crear();
    responder([caso(1), caso(2, { tipoCaso: 'ENCONTRADA' })]);

    component.cambiarTipo('ENCONTRADA');
    fixture.detectChanges();

    expect(titulos()).toEqual(['Caso 2']);
  });

  it('la distancia usa la ubicacion del navegador y muestra los km en cada caso', async () => {
    await crear();
    responder([caso(1), caso(30)]);

    component.cambiarDistancia('5');
    fixture.detectChanges();

    expect(geo.obtenerPosicionActual).toHaveBeenCalledTimes(1);
    expect(titulos()).toEqual(['Caso 1']);
    expect(dom().querySelector('.tarjeta-caso-meta')?.textContent).toContain('km');
  });

  it('si no hay permiso de ubicacion avisa y no filtra por distancia', async () => {
    await crear();
    responder([caso(1), caso(30)]);
    geo.obtenerPosicionActual.mockReturnValue(throwError(() => new Error('denegado')));

    component.cambiarDistancia('5');
    fixture.detectChanges();

    expect(dom().querySelector('.aviso-error')?.textContent).toContain('ubicación');
    expect(component.distanciaMaxKm()).toBeNull();
    expect(titulos().length).toBe(2);
  });

  it('pinta un punto por caso con ubicacion, del color de su estado, y la leyenda', async () => {
    await crear();
    responder([caso(1), caso(2, { estado: 'EN_PROCESO' }), caso(3, { latitud: null, longitud: null })]);

    expect(dom().querySelectorAll('.punto-caso').length).toBe(2);
    expect(dom().querySelector('.punto-urgente')).not.toBeNull();
    expect(dom().querySelector('.punto-activo')).not.toBeNull();
    const leyenda = Array.from(dom().querySelectorAll('.leyenda li')).map((li) => li.textContent?.trim());
    expect(leyenda).toEqual(['Urgente', 'Activo', 'Resuelto']);
    expect(dom().textContent).toContain('Este caso no tiene ubicación en el mapa.');
  });

  it('cada tarjeta abre el detalle del caso y al pasar el mouse resalta su punto', async () => {
    await crear();
    responder([caso(1)]);

    const tarjeta = dom().querySelector<HTMLAnchorElement>('a.tarjeta-caso')!;
    expect(tarjeta.getAttribute('href')).toBe('/casos/1');

    tarjeta.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(dom().querySelector('.punto-caso.resaltado')).not.toBeNull();
  });

  it('al tocar un punto se abre la vista previa con "Ver caso", sin interpretar HTML del texto', async () => {
    await crear();
    responder([caso(1, { descripcion: '<b>Perro</b> herido' })]);

    dom().querySelector<HTMLElement>('.leaflet-marker-icon')!.click();
    fixture.detectChanges();

    const vista = dom().querySelector('.vista-previa-titulo');
    expect(vista?.textContent).toBe('<b>Perro</b> herido');
    expect(vista?.querySelector('b')).toBeNull();
    expect(dom().querySelector('.punto-caso.seleccionado')).not.toBeNull();
    expect(dom().querySelector('.vista-previa-enlace')?.getAttribute('href')).toBe('/casos/1');
  });

  it('"Buscar en esta zona" limita la lista a lo visible en el mapa', async () => {
    await crear();
    responder([caso(1), caso(2)]);

    component.mapaMovido.set(true);
    fixture.detectChanges();
    const getBounds = vi.spyOn((component as unknown as { mapa: { getBounds: () => unknown } }).mapa, 'getBounds');
    getBounds.mockReturnValue({ getSouth: () => -17.405, getWest: () => -66.2, getNorth: () => -17.39, getEast: () => -66.1 });
    dom().querySelector<HTMLButtonElement>('.buscar-zona')!.click();
    fixture.detectChanges();

    expect(titulos()).toEqual(['Caso 1']);
    expect(dom().querySelector('.lista-total')?.textContent).toContain('en esta zona');

    dom().querySelector<HTMLButtonElement>('.enlace-boton')!.click();
    fixture.detectChanges();
    expect(titulos().length).toBe(2);
  });

  it('sin resultados ofrece quitar los filtros', async () => {
    await crear();
    responder([caso(1)]);

    component.cambiarTipo('ABANDONADA');
    fixture.detectChanges();
    expect(dom().querySelector('.estado-lista')?.textContent).toContain('No hay casos con estos filtros.');

    // El estado y el texto no cambiaron: no hace falta volver a pedir al backend.
    dom().querySelector<HTMLButtonElement>('.estado-lista button')!.click();
    fixture.detectChanges();
    expect(titulos()).toEqual(['Caso 1']);
  });

  it('si falla la carga muestra el error y reintenta la misma consulta', async () => {
    await crear();
    pedido().flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(dom().querySelector('.estado-lista')?.textContent).toContain('No se pudieron cargar los casos.');

    dom().querySelector<HTMLButtonElement>('.estado-lista button')!.click();
    const req = responder([caso(1)]);
    expect(req.request.params.get('estado')).toBe('PENDIENTE,EN_PROCESO');
    expect(titulos()).toEqual(['Caso 1']);
  });

  it('el selector de vista oculta el mapa en "Lista"', async () => {
    await crear();
    responder([]);

    const [lista] = Array.from(dom().querySelectorAll<HTMLButtonElement>('.selector-vista button'));
    lista.click();
    fixture.detectChanges();

    expect(dom().querySelector('.casos-page')?.classList).toContain('solo-lista');
    expect(lista.getAttribute('aria-pressed')).toBe('true');
  });
});
