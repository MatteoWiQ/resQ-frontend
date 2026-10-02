import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { PanelAdminComponent } from './panel-admin.component';

describe('PanelAdminComponent: pestanas (HU-23)', () => {
  async function crearPanel() {
    await TestBed.configureTestingModule({
      imports: [PanelAdminComponent],
      providers: [
        { provide: AuthService, useValue: { obtenerIdUsuarioActual: () => 1 } },
        { provide: UsuarioService, useValue: { obtenerTodos: () => of([]) } },
        { provide: ReporteService, useValue: { obtenerTodos: () => of([]) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PanelAdminComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function seccion(fixture: { nativeElement: HTMLElement }, id: string): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(`#${id}`)!;
  }

  function pestanas(fixture: { nativeElement: HTMLElement }): HTMLButtonElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.pestana'),
    );
  }

  it('abre en la gestion de usuarios y deja reportes oculta', async () => {
    const fixture = await crearPanel();

    expect(fixture.componentInstance.pestana()).toBe('usuarios');
    expect(seccion(fixture, 'seccion-usuarios').hidden).toBe(false);
    expect(seccion(fixture, 'seccion-reportes').hidden).toBe(true);
  });

  it('cambia de pestana al pulsar reportes y vuelve al pulsar usuarios', async () => {
    const fixture = await crearPanel();
    const [usuarios, reportes] = pestanas(fixture);

    reportes.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.pestana()).toBe('reportes');
    expect(seccion(fixture, 'seccion-reportes').hidden).toBe(false);
    expect(seccion(fixture, 'seccion-usuarios').hidden).toBe(true);

    usuarios.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.pestana()).toBe('usuarios');
    expect(seccion(fixture, 'seccion-usuarios').hidden).toBe(false);
  });

  it('mantiene el filtro de HU-15 en el DOM aunque la seccion este oculta', async () => {
    const fixture = await crearPanel();
    const select = (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(
      '#filtro-estado',
    );

    // Ocultar con [hidden] y no con @if es lo que permite esto: si la seccion de
    // reportes se saliera del DOM, las pruebas de HU-15 quedarian sin selector.
    expect(select).toBeTruthy();
  });
});
