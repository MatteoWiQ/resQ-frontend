import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { INTERVALO_CARRUSEL_MS, LandingHero } from './hero.component';
import { AuthService } from '../../../../core/services/auth.service';
import { Reporte } from '../../../../shared/models/reporte.model';
import { authServiceDoble } from '../../../../shared/testing/test-doubles';

function caso(id: number, estado: Reporte['estado'] = 'PENDIENTE'): Reporte {
  return {
    idReporte: id,
    idUsuario: 1,
    tipoCaso: 'PERDIDA',
    descripcion: `Caso ${id}`,
    estado,
    fotoUrl: id === 1 ? '/api/reportes/fotos/uno.jpg' : null,
    fechaCreacion: '2026-11-12T10:00:00',
  };
}

describe('LandingHero: puertas y carrusel (rediseño)', () => {
  let fixture: ComponentFixture<LandingHero>;

  async function crear(casos: Reporte[], conSesion = false): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [LandingHero],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authServiceDoble(conSesion ? { idUsuario: 1, email: 'a@b.com', rol: 'USUARIO' } : null),
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LandingHero);
    fixture.componentRef.setInput('casos', casos);
    fixture.detectChanges();
  }

  const dom = () => fixture.nativeElement as HTMLElement;
  const activa = () => dom().querySelector('.diapositiva.activa')?.textContent ?? '';

  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('con sesion la puerta de reportar abre el formulario', async () => {
    await crear([], true);

    expect(dom().querySelector('.puerta-reportar')?.getAttribute('href')).toBe('/reportes/nuevo');
  });

  it('muestra un caso a la vez; los demas quedan ocultos para lectores de pantalla', async () => {
    await crear([caso(1), caso(2), caso(3)]);

    expect(dom().querySelectorAll('.diapositiva').length).toBe(3);
    expect(dom().querySelectorAll('.diapositiva[aria-hidden="false"]').length).toBe(1);
    expect(activa()).toContain('Caso 1');
    expect(dom().querySelector('.diapositiva.activa img')?.getAttribute('src')).toBe('/api/reportes/fotos/uno.jpg');
  });

  it('avanza solo cada 5 segundos y vuelve al primero al final', async () => {
    await crear([caso(1), caso(2)]);

    vi.advanceTimersByTime(INTERVALO_CARRUSEL_MS);
    fixture.detectChanges();
    expect(activa()).toContain('Caso 2');

    vi.advanceTimersByTime(INTERVALO_CARRUSEL_MS);
    fixture.detectChanges();
    expect(activa()).toContain('Caso 1');
  });

  it('se pausa mientras el mouse esta encima', async () => {
    await crear([caso(1), caso(2)]);
    const carrusel = dom().querySelector('.carrusel')!;

    carrusel.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(INTERVALO_CARRUSEL_MS * 3);
    fixture.detectChanges();
    expect(activa()).toContain('Caso 1');
    expect(carrusel.classList).toContain('con-flechas');

    carrusel.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(INTERVALO_CARRUSEL_MS);
    fixture.detectChanges();
    expect(activa()).toContain('Caso 2');
  });

  it('las flechas pasan al caso anterior y al siguiente', async () => {
    await crear([caso(1), caso(2), caso(3)]);

    dom().querySelector<HTMLButtonElement>('.flecha-anterior')!.click();
    fixture.detectChanges();
    expect(activa()).toContain('Caso 3');

    dom().querySelector<HTMLButtonElement>('.flecha-siguiente')!.click();
    fixture.detectChanges();
    expect(activa()).toContain('Caso 1');
  });

  it('marca Urgente o Activo segun el estado', async () => {
    await crear([caso(1, 'PENDIENTE'), caso(2, 'EN_PROCESO')]);

    expect(dom().querySelector('.diapositiva.activa .insignia')?.textContent).toContain('Urgente');
    dom().querySelector<HTMLButtonElement>('.flecha-siguiente')!.click();
    fixture.detectChanges();
    expect(dom().querySelector('.diapositiva.activa .insignia.activo')?.textContent).toContain('Activo');
  });

  it('con un solo caso no muestra flechas y sin casos muestra el mensaje', async () => {
    await crear([caso(1)]);
    expect(dom().querySelector('.flecha')).toBeNull();

    fixture.componentRef.setInput('casos', []);
    fixture.detectChanges();
    expect(dom().querySelector('.carrusel-vacio')).not.toBeNull();
  });
});
