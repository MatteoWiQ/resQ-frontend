import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { BandejaChatComponent } from './bandeja-chat.component';
import { AuthService } from '../../../../core/services/auth.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { OrganizacionService } from '../../../../core/services/organizacion.service';
import { DirectorioUsuario } from '../../../../shared/models/mensaje.model';
import { Organizacion } from '../../../../shared/models/organizacion.model';

const organizacion = (id: number, nombre: string): Organizacion =>
  ({ idOrganizacion: id, nombre, tipo: 'REFUGIO' }) as Organizacion;

const usuario = (id: number, nombre: string): DirectorioUsuario => ({
  idUsuario: id,
  nombre,
  rol: 'USUARIO',
});

describe('BandejaChatComponent (TT-49)', () => {
  let fixture: ComponentFixture<BandejaChatComponent>;
  let componente: BandejaChatComponent;
  let mensajeService: {
    obtenerConversaciones: () => Observable<unknown[]>;
    buscarUsuarios: ReturnType<typeof vi.fn>;
    abrirConversacion: ReturnType<typeof vi.fn>;
  };
  let organizacionService: { listarDirectorio: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    mensajeService = {
      obtenerConversaciones: () => of([]),
      buscarUsuarios: vi.fn(() => of([usuario(5, 'Ana Torres')])),
      abrirConversacion: vi.fn(() => of({ idConversacion: 12 })),
    };
    organizacionService = {
      listarDirectorio: vi.fn(() => of([organizacion(7, 'Patitas Felices')])),
    };

    TestBed.configureTestingModule({
      imports: [BandejaChatComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            obtenerIdUsuarioActual: () => 1,
            usuarioActual: () => ({ idUsuario: 1 }),
            obtenerToken: () => 'token',
            esAdmin: () => false,
            logout: () => undefined,
          },
        },
        { provide: MensajeService, useValue: mensajeService },
        { provide: OrganizacionService, useValue: organizacionService },
      ],
    });

    fixture = TestBed.createComponent(BandejaChatComponent);
    componente = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  const html = () => (fixture.nativeElement as HTMLElement);

  it('envía el texto de búsqueda como nombre, nunca como tipo', () => {
    componente.abrirNueva();
    componente.busqueda.set('patitas');
    componente.buscar();

    expect(organizacionService.listarDirectorio).toHaveBeenCalledWith({ nombre: 'patitas' });
  });

  it('lista usuarios y abre la conversación con su idUsuario', async () => {
    componente.abrirNueva();
    componente.busqueda.set('ana');
    componente.buscar();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mensajeService.buscarUsuarios).toHaveBeenCalledWith('ana');
    expect(componente.usuarios().length).toBe(1);
    expect(html().textContent).toContain('Ana Torres');

    componente.iniciarConUsuario(5);
    expect(mensajeService.abrirConversacion).toHaveBeenCalledWith({ idUsuario: 5 });
    expect(router.navigate).toHaveBeenCalledWith(['/chat', 12]);
  });

  it('no consulta usuarios con menos de dos caracteres', () => {
    componente.busqueda.set('a');
    componente.cargarUsuarios();

    expect(mensajeService.buscarUsuarios).not.toHaveBeenCalled();
    expect(componente.usuarios()).toEqual([]);
  });

  it('muestra un error visible si falla la búsqueda de organizaciones', () => {
    organizacionService.listarDirectorio.mockReturnValue(throwError(() => new Error('500')));
    componente.abrirNueva();
    componente.busqueda.set('patitas');
    componente.buscar();
    fixture.detectChanges();

    expect(componente.errorBusqueda()).not.toBe('');
    expect(html().querySelector('.error')?.textContent).toContain('búsqueda');
  });

  it('muestra un error visible si falla la búsqueda de usuarios', () => {
    mensajeService.buscarUsuarios.mockReturnValue(throwError(() => new Error('500')));
    componente.busqueda.set('ana');
    componente.cargarUsuarios();
    fixture.detectChanges();

    expect(componente.errorBusqueda()).not.toBe('');
    expect(componente.usuarios()).toEqual([]);
  });

  it('muestra un error si no se puede abrir la conversación', () => {
    mensajeService.abrirConversacion.mockReturnValue(throwError(() => new Error('403')));
    componente.iniciarConUsuario(5);
    fixture.detectChanges();

    expect(componente.error()).not.toBe('');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
