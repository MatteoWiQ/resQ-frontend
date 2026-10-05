import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';

import { PerfilComponent } from './perfil.component';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { ReporteService } from '../../../../core/services/reporte.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { Reporte } from '../../../../shared/models/reporte.model';
import { Usuario } from '../../../../shared/models/usuario.model';

function usuario(rol: string): Usuario {
  return {
    idUsuario: 10,
    nombre: 'Lucia Fernandez',
    email: 'lucia@correo.com',
    telefono: '70000000',
    rol,
    fechaRegistro: '2026-08-01',
    tiposAyuda: [],
  };
}

function reporte(extra: Partial<Reporte> = {}): Reporte {
  return {
    idReporte: 7,
    idUsuario: 10,
    tipoCaso: 'PERDIDA',
    descripcion: 'Perro perdido cerca a la plaza',
    estado: 'PENDIENTE',
    fotoUrl: null,
    fechaCreacion: '2026-09-01T10:00:00',
    ...extra,
  };
}

describe('PerfilComponent (HU-19: revision del caso)', () => {
  let fixture: ComponentFixture<PerfilComponent>;
  let componente: PerfilComponent;
  let reporteService: { obtenerMisReportes: (id: number) => Observable<Reporte[]> };

  async function crear(
    rol: string | null,
    reportes: Reporte[] = [reporte()],
  ): Promise<ComponentFixture<PerfilComponent>> {
    const sesion = rol === null ? null : { idUsuario: 10, email: 'lucia@correo.com', rol };
    reporteService.obtenerMisReportes = () => of(reportes);

    await TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            usuarioActual: () => sesion,
            obtenerIdUsuarioActual: () => sesion?.idUsuario ?? null,
          },
        },
        { provide: UsuarioService, useValue: { obtenerPorId: () => of(usuario(rol ?? 'USUARIO')) } },
        { provide: ReporteService, useValue: reporteService },
        {
          provide: NotificacionService,
          useValue: { obtenerDeUsuario: () => of([]), marcarComoLeida: () => of({}) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
    return fixture;
  }

  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(() => {
    reporteService = { obtenerMisReportes: () => of([]) };
  });

  describe('estado de la revision', () => {
    it('traduce el estado de revision del reporte, no muestra el valor crudo', async () => {
      await crear('USUARIO', [reporte({ estadoRevision: 'PENDIENTE_REVISION' })]);

      expect(texto()).toContain('En revisión');
      expect(texto()).not.toContain('PENDIENTE_REVISION');
    });

    it('muestra la nota del voluntario dentro del modal del reporte', async () => {
      await crear('USUARIO', [
        reporte({ estadoRevision: 'RECHAZADO', notaRevision: 'La foto no corresponde al animal' }),
      ]);

      componente.verDetalle(reporte({ estadoRevision: 'RECHAZADO', notaRevision: 'La foto no corresponde al animal' }));
      fixture.detectChanges();

      expect(texto()).toContain('Nota del voluntario');
      expect(texto()).toContain('La foto no corresponde al animal');
    });

    it('omite la nota cuando el caso fue revisado sin observaciones', async () => {
      await crear('USUARIO', [reporte({ estadoRevision: 'APROBADO' })]);

      componente.verDetalle(reporte({ estadoRevision: 'APROBADO' }));
      fixture.detectChanges();

      expect(texto()).toContain('Aprobado');
      expect(texto()).not.toContain('Nota del voluntario');
    });
  });

  describe('acceso a la pantalla de solicitudes', () => {
    it('un voluntario ve el boton de revisar', async () => {
      await crear('VOLUNTARIO');

      expect(componente.puedeRevisar()).toBe(true);
      expect(texto()).toContain('Revisar solicitudes');
    });

    it('un administrador tambien ve el boton de revisar', async () => {
      await crear('ADMIN');

      expect(componente.puedeRevisar()).toBe(true);
    });

    it('un ciudadano comun no ve el boton de revisar', async () => {
      await crear('USUARIO');

      expect(componente.puedeRevisar()).toBe(false);
      expect(texto()).not.toContain('Revisar solicitudes');
    });
  });

  describe('bandeja de notificaciones', () => {
    it('se monta cuando hay sesion', async () => {
      await crear('USUARIO');

      expect((fixture.nativeElement as HTMLElement).querySelector('app-notificaciones')).not.toBeNull();
    });

    it('no se monta sin sesion', async () => {
      await crear(null);

      expect((fixture.nativeElement as HTMLElement).querySelector('app-notificaciones')).toBeNull();
    });
  });
});