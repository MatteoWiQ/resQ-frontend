import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { of } from 'rxjs';

import { PerfilComponent } from './perfil.component';
import { AuthService } from '../../../../core/services/auth.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { Usuario } from '../../../../shared/models/usuario.model';
import { Reporte } from '../../../../shared/models/reporte.model';

describe('PerfilComponent', () => {
  let component: PerfilComponent;
  let fixture: ComponentFixture<PerfilComponent>;
  let reportes: Reporte[];

  const usuario: Usuario = {
    idUsuario: 1,
    nombre: 'Mateo WiQ',
    email: 'mateo@correo.com',
    telefono: '3001234567',
    rol: 'USUARIO',
  };

  const reporte: Reporte = {
    idReporte: 7,
    idUsuario: 1,
    tipoCaso: 'ABANDONADA',
    descripcion: 'Un perro abandonado en la calle.',
    estado: 'PENDIENTE',
    fotoUrl: null,
    fechaCreacion: '2026-09-24T12:00:00.000Z',
  };

  beforeEach(async () => {
    reportes = [reporte];
    await TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideLocationMocks(),
        { provide: AuthService, useValue: { obtenerIdUsuarioActual: () => 1 } },
        { provide: UsuarioService, useValue: { obtenerPorId: () => of(usuario) } },
        { provide: ReporteService, useValue: { obtenerMisReportes: () => of(reportes) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilComponent);
    component = fixture.componentInstance;
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  it('muestra la fecha del reporte debajo del tipo de caso en cada ítem', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    const items = elemento.querySelectorAll('.reporte-item');
    expect(items.length).toBe(1);

    const info = items[0].querySelector('.reporte-info') as HTMLElement;
    const tipo = info.querySelector('strong')?.textContent?.trim();
    expect(tipo).toBe('ABANDONADA');

    const fecha = info.querySelector('.reporte-fecha') as HTMLElement;
    expect(fecha).toBeTruthy();
    expect(fecha.textContent).toContain('Fecha del reporte');
    expect(fecha.textContent).toContain(component.formatearFecha(reporte.fechaCreacion));
  });

  it('no rompe cuando no hay reportes', async () => {
    reportes = [];

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelectorAll('.reporte-item').length).toBe(0);
  });

  it('formatearFecha devuelve un formato legible con día, mes y año', () => {
    const fecha = component.formatearFecha(reporte.fechaCreacion);
    expect(fecha).toContain('24');
    expect(fecha).toContain('sept');
    expect(fecha).toContain('2026');
  });
});