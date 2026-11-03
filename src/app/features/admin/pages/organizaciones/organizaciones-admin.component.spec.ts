import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';

import { AuthService } from '../../../../core/services/auth.service';
import { AdminOrganizacionService } from '../../../../core/services/admin-organizacion.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import {
  FiltroEstadoOrganizacion,
  OrganizacionAdmin,
} from '../../../../shared/models/organizacion-admin.model';
import { authServiceDoble, webSocketServiceDoble } from '../../../../shared/testing/test-doubles';
import { OrganizacionesAdminComponent } from './organizaciones-admin.component';

function organizacion(id: number, extra: Partial<OrganizacionAdmin> = {}): OrganizacionAdmin {
  return {
    idOrganizacion: id,
    nombre: `Refugio ${id}`,
    tipo: 'REFUGIO',
    direccion: 'Av. Heroínas 123',
    telefono: '70000000',
    email: `refugio${id}@resq.com`,
    descripcion: null,
    horarios: 'Lun a Vie 8:00-18:00',
    zonasCobertura: null,
    logoUrl: null,
    estadoVerificacion: 'PENDIENTE_VERIFICACION',
    fechaRegistro: '2026-10-20T10:00:00',
    idRepresentante: 20,
    nombreRepresentante: 'Ana Refugio',
    emailRepresentante: 'ana@resq.com',
    idRevisor: null,
    nombreRevisor: null,
    fechaRevision: null,
    ...extra,
  };
}

interface Doble {
  listar: ReturnType<typeof vi.fn>;
  detalle: ReturnType<typeof vi.fn>;
  aprobar: ReturnType<typeof vi.fn>;
  rechazar: ReturnType<typeof vi.fn>;
}

describe('OrganizacionesAdminComponent (HU-25)', () => {
  async function crear(
    listar?: (filtro: FiltroEstadoOrganizacion) => Observable<OrganizacionAdmin[]>,
  ) {
    const doble: Doble = {
      listar: vi.fn(
        listar ?? (() => of([organizacion(1), organizacion(2, { tipo: 'VETERINARIA' })])),
      ),
      detalle: vi.fn((id: number) => of(organizacion(id))),
      aprobar: vi.fn((id: number) => of(organizacion(id, { estadoVerificacion: 'VERIFICADA' }))),
      rechazar: vi.fn((id: number) => of(organizacion(id, { estadoVerificacion: 'RECHAZADA' }))),
    };

    await TestBed.configureTestingModule({
      imports: [OrganizacionesAdminComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: authServiceDoble({ idUsuario: 1, email: 'admin@resq.com', rol: 'ADMIN' }),
        },
        { provide: WebSocketService, useValue: webSocketServiceDoble() },
        { provide: AdminOrganizacionService, useValue: doble },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OrganizacionesAdminComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, doble };
  }

  const raiz = (f: ComponentFixture<OrganizacionesAdminComponent>) =>
    f.nativeElement as HTMLElement;

  async function abrirDetalle(f: ComponentFixture<OrganizacionesAdminComponent>, indice = 0) {
    (raiz(f).querySelectorAll('.fila')[indice] as HTMLButtonElement).click();
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
  }

  it('al abrir lista las pendientes de verificación con su tipo y representante', async () => {
    const { fixture, doble } = await crear();

    expect(doble.listar).toHaveBeenCalledWith('PENDIENTE_VERIFICACION');
    const filas = raiz(fixture).querySelectorAll('.fila');
    expect(filas).toHaveLength(2);
    expect(filas[0].textContent).toContain('Refugio 1');
    expect(filas[0].textContent).toContain('Ana Refugio');
    expect(filas[1].textContent).toContain('Veterinaria');
    expect(filas[0].querySelector('.badge')?.textContent).toContain('Pendiente de verificación');
  });

  it('el filtro "Todas" vuelve a consultar sin estado', async () => {
    const { fixture, doble } = await crear();

    (raiz(fixture).querySelector('#filtro-TODAS') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(doble.listar).toHaveBeenLastCalledWith('TODAS');
    expect(raiz(fixture).querySelector('#filtro-TODAS')?.getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('muestra un mensaje cuando no hay organizaciones en ese estado', async () => {
    const { fixture } = await crear(() => of([]));

    expect(raiz(fixture).textContent).toContain('No hay organizaciones en este estado.');
  });

  it('el detalle muestra los datos de la organización y que todavía no fue revisada', async () => {
    const { fixture, doble } = await crear();

    await abrirDetalle(fixture);

    expect(doble.detalle).toHaveBeenCalledWith(1);
    const modal = raiz(fixture).querySelector('.modal')!;
    expect(modal.textContent).toContain('refugio1@resq.com');
    expect(modal.textContent).toContain('Lun a Vie 8:00-18:00');
    expect(modal.textContent).toContain('ana@resq.com');
    expect(modal.textContent).toContain('Todavía no fue revisada');
  });

  it('aprobar una pendiente avisa y recarga la lista', async () => {
    const { fixture, doble } = await crear();
    await abrirDetalle(fixture);

    (raiz(fixture).querySelector('.btn-aprobar') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(doble.aprobar).toHaveBeenCalledWith(1);
    expect(raiz(fixture).querySelector('.modal')).toBeNull();
    expect(raiz(fixture).querySelector('.toast')?.textContent).toContain('Refugio 1 fue aprobada');
    expect(doble.listar).toHaveBeenCalledTimes(2);
  });

  it('rechazar pide confirmación antes de enviar', async () => {
    const { fixture, doble } = await crear();
    await abrirDetalle(fixture);

    (raiz(fixture).querySelector('.btn-rechazar') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(doble.rechazar).not.toHaveBeenCalled();
    expect(raiz(fixture).querySelector('.confirmacion')?.textContent).toContain(
      '¿Rechazar a Refugio 1?',
    );

    (raiz(fixture).querySelector('.btn-rechazar') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(doble.rechazar).toHaveBeenCalledWith(1);
    expect(raiz(fixture).querySelector('.toast')?.textContent).toContain('Refugio 1 fue rechazada');
  });

  it('una organización ya revisada muestra quién la revisó y no ofrece aprobar ni rechazar', async () => {
    const { fixture, doble } = await crear();
    doble.detalle.mockReturnValue(
      of(
        organizacion(1, {
          estadoVerificacion: 'VERIFICADA',
          idRevisor: 1,
          nombreRevisor: 'Admin Demo',
          fechaRevision: '2026-10-25T09:30:00',
        }),
      ),
    );

    await abrirDetalle(fixture);

    const modal = raiz(fixture).querySelector('.modal')!;
    expect(modal.textContent).toContain('Verificada por Admin Demo el 25/10/2026 09:30');
    expect(modal.querySelector('.btn-aprobar')).toBeNull();
    expect(modal.querySelector('.btn-rechazar')).toBeNull();
  });

  it('si otro administrador decidió primero (409) avisa y recarga en vez de mostrar un error', async () => {
    const { fixture, doble } = await crear();
    doble.aprobar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    await abrirDetalle(fixture);

    (raiz(fixture).querySelector('.btn-aprobar') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(raiz(fixture).querySelector('.toast')?.textContent).toContain('Otra persona ya revisó');
    expect(raiz(fixture).querySelector('.error')).toBeNull();
    expect(doble.listar).toHaveBeenCalledTimes(2);
  });

  it('avisa si no se pueden cargar las organizaciones', async () => {
    const { fixture } = await crear(() => throwError(() => new Error('sin red')));

    expect(raiz(fixture).querySelector('.error')?.textContent).toContain(
      'No se pudieron cargar las organizaciones.',
    );
  });
});
