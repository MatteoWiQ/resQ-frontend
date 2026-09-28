import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';

import { CrearReporteComponent } from './crear-reporte.component';
import { SelectorUbicacionComponent } from '../../../../shared/components/selector-ubicacion/selector-ubicacion.component';
import { AuthService } from '../../../../core/services/auth.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { Reporte } from '../../../../shared/models/reporte.model';

const REPORTE_CREADO: Reporte = {
  idReporte: 1,
  idUsuario: 7,
  tipoCaso: 'PERDIDA',
  descripcion: 'Perro perdido cerca a la plaza',
  estado: 'PENDIENTE',
  fotoUrl: null,
  fechaCreacion: '2026-09-01T10:00:00',
  latitud: -17.3895,
  longitud: -66.1568,
};

type DatosReporte = Parameters<ReporteService['crearReporte']>[0];

describe('CrearReporteComponent: enviar la ubicacion del reporte (HU-16)', () => {
  let fixture: ComponentFixture<CrearReporteComponent>;
  let enviados: DatosReporte[];

  beforeEach(async () => {
    enviados = [];

    await TestBed.configureTestingModule({
      imports: [CrearReporteComponent],
      providers: [
        { provide: AuthService, useValue: { obtenerIdUsuarioActual: () => 7 } },
        {
          provide: ReporteService,
          useValue: {
            crearReporte: (datos: DatosReporte): Observable<Reporte> => {
              enviados.push(datos);
              return of(REPORTE_CREADO);
            },
          },
        },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearReporteComponent);
    fixture.detectChanges();
  });

  function compiled(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function avanzarAlDetalle(): void {
    const componente = fixture.componentInstance;
    componente.seleccionarTipo('PERDIDA');
    componente.continuar();
    fixture.detectChanges();
  }

  function selector(): SelectorUbicacionComponent {
    return fixture.debugElement.query(By.directive(SelectorUbicacionComponent))
      .componentInstance as SelectorUbicacionComponent;
  }

  function crearReporte(): void {
    const componente = fixture.componentInstance;
    componente.form.descripcion = 'Perro perdido cerca a la plaza';
    componente.crearReporte();
    fixture.detectChanges();
  }

  it('debe ofrecer el selector de ubicacion en el paso de detalles', () => {
    avanzarAlDetalle();

    expect(fixture.debugElement.query(By.directive(SelectorUbicacionComponent))).toBeTruthy();
    expect(compiled().querySelector('.selector__mi-ubicacion')?.textContent?.trim()).toBe(
      'Usar mi ubicación actual',
    );
  });

  it('debe enviar al backend la ubicacion elegida en el selector', () => {
    avanzarAlDetalle();
    selector().latitud.set(-17.3895);
    selector().longitud.set(-66.1568);
    fixture.detectChanges();

    crearReporte();

    expect(enviados).toHaveLength(1);
    expect(enviados[0].latitud).toBe(-17.3895);
    expect(enviados[0].longitud).toBe(-66.1568);
  });

  it('debe enviar la ubicacion obtenida del dispositivo cuando el ciudadano elige la actual', () => {
    avanzarAlDetalle();
    selector().latitud.set(REPORTE_CREADO.latitud as number);
    selector().longitud.set(REPORTE_CREADO.longitud as number);
    fixture.detectChanges();

    crearReporte();

    expect(enviados[0].latitud).toBe(-17.3895);
    expect(enviados[0].longitud).toBe(-66.1568);
  });

  it('debe crear el reporte sin ubicacion cuando el ciudadano no marca ninguna', () => {
    avanzarAlDetalle();

    crearReporte();

    expect(enviados).toHaveLength(1);
    expect(enviados[0].latitud).toBeNull();
    expect(enviados[0].longitud).toBeNull();
  });

  it('debe dejar de enviar coordenadas a medias cuando el ciudadano quita la ubicacion', () => {
    avanzarAlDetalle();
    selector().latitud.set(-17.3895);
    selector().longitud.set(-66.1568);
    fixture.detectChanges();
    selector().quitar();
    fixture.detectChanges();

    crearReporte();

    expect(enviados[0].latitud).toBeNull();
    expect(enviados[0].longitud).toBeNull();
  });
});
