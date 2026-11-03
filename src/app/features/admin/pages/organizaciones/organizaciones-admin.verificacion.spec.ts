import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthService } from '../../../../core/services/auth.service';
import { AdminOrganizacionService } from '../../../../core/services/admin-organizacion.service';
import { WebSocketService } from '../../../../core/services/websocket.service';
import {
  OrganizacionAdmin,
  RevisionOrganizacion,
} from '../../../../shared/models/organizacion-admin.model';
import { authServiceDoble, webSocketServiceDoble } from '../../../../shared/testing/test-doubles';
import { OrganizacionesAdminComponent } from './organizaciones-admin.component';

function organizacion(extra: Partial<OrganizacionAdmin> = {}): OrganizacionAdmin {
  return {
    idOrganizacion: 1,
    nombre: 'Refugio Patitas',
    tipo: 'REFUGIO',
    direccion: 'Av. Heroínas 123',
    telefono: '70000000',
    email: 'patitas@resq.com',
    descripcion: null,
    horarios: null,
    zonasCobertura: null,
    logoUrl: null,
    tieneDocumento: true,
    estadoVerificacion: 'PENDIENTE_VERIFICACION',
    fechaRegistro: '2026-10-20T10:00:00',
    idRepresentante: 20,
    nombreRepresentante: 'Ana Refugio',
    emailRepresentante: 'ana@resq.com',
    idRevisor: null,
    nombreRevisor: null,
    fechaRevision: null,
    notaRevision: null,
    ...extra,
  };
}

const HISTORIAL: RevisionOrganizacion[] = [
  {
    idRevision: 2,
    accion: 'REENVIADA',
    nota: null,
    idUsuario: 20,
    nombreUsuario: 'Ana Refugio',
    fecha: '2026-10-22T09:00:00',
  },
  {
    idRevision: 1,
    accion: 'RECHAZADA',
    nota: 'Falta la personería jurídica',
    idUsuario: 1,
    nombreUsuario: 'Admin Demo',
    fecha: '2026-10-21T18:00:00',
  },
];

describe('OrganizacionesAdminComponent: verificación (HU-32)', () => {
  let doble: {
    listar: ReturnType<typeof vi.fn>;
    detalle: ReturnType<typeof vi.fn>;
    aprobar: ReturnType<typeof vi.fn>;
    rechazar: ReturnType<typeof vi.fn>;
    historial: ReturnType<typeof vi.fn>;
    documento: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:documento');
    URL.revokeObjectURL = vi.fn();
  });

  async function crearConDetalle(o: OrganizacionAdmin = organizacion()) {
    doble = {
      listar: vi.fn(() => of([o])),
      detalle: vi.fn(() => of(o)),
      aprobar: vi.fn(() => of(o)),
      rechazar: vi.fn(() => of({ ...o, estadoVerificacion: 'RECHAZADA' })),
      historial: vi.fn(() => of(HISTORIAL)),
      documento: vi.fn(() => of(new Blob(['%PDF'], { type: 'application/pdf' }))),
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
    (raiz(fixture).querySelector('.fila') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const raiz = (f: ComponentFixture<OrganizacionesAdminComponent>) =>
    f.nativeElement as HTMLElement;

  it('el detalle muestra el historial con quién hizo cada acción, cuándo y su nota', async () => {
    const fixture = await crearConDetalle();

    expect(doble.historial).toHaveBeenCalledWith(1);
    const items = raiz(fixture).querySelectorAll('.historial-lista li');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain(
      'Reenviada por la organización por Ana Refugio — 22/10/2026 09:00',
    );
    expect(items[1].textContent).toContain('Rechazada por Admin Demo');
    expect(items[1].textContent).toContain('Falta la personería jurídica');
  });

  it('"Ver documento" lo descarga con el servicio y lo abre en otra pestaña', async () => {
    const fixture = await crearConDetalle();
    const abrir = vi.spyOn(window, 'open').mockReturnValue(null);

    (raiz(fixture).querySelector('.btn-enlace') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(doble.documento).toHaveBeenCalledWith(1);
    expect(abrir).toHaveBeenCalledWith('blob:documento', '_blank', 'noopener');
    abrir.mockRestore();
  });

  it('avisa cuando la organización no adjuntó documento', async () => {
    const fixture = await crearConDetalle(organizacion({ tieneDocumento: false }));

    expect(raiz(fixture).querySelector('.btn-enlace')).toBeNull();
    expect(raiz(fixture).querySelector('.sin-documento')?.textContent).toContain(
      'No adjuntó un documento',
    );
  });

  it('si el documento no se puede abrir, lo explica', async () => {
    const fixture = await crearConDetalle();
    doble.documento.mockReturnValue(throwError(() => new Error('404')));

    (raiz(fixture).querySelector('.btn-enlace') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(raiz(fixture).querySelector('.error')?.textContent).toContain(
      'No se pudo abrir el documento.',
    );
  });

  it('no deja confirmar el rechazo sin motivo', async () => {
    const fixture = await crearConDetalle();

    (raiz(fixture).querySelector('.btn-rechazar') as HTMLButtonElement).click();
    fixture.detectChanges();
    const confirmar = raiz(fixture).querySelector('.btn-rechazar') as HTMLButtonElement;

    expect(raiz(fixture).querySelector('#motivo-rechazo')).not.toBeNull();
    expect(confirmar.disabled).toBe(true);

    fixture.componentInstance.motivo.set('   ');
    fixture.detectChanges();
    expect(confirmar.disabled).toBe(true);

    fixture.componentInstance.confirmarRechazo();
    expect(doble.rechazar).not.toHaveBeenCalled();
  });

  it('una organización revisada muestra la nota de la revisión', async () => {
    const fixture = await crearConDetalle(
      organizacion({
        estadoVerificacion: 'RECHAZADA',
        notaRevision: 'Falta la personería jurídica',
        nombreRevisor: 'Admin Demo',
        fechaRevision: '2026-10-21T18:00:00',
        idRevisor: 1,
      }),
    );

    expect(raiz(fixture).querySelector('.nota-revision')?.textContent).toContain(
      'Falta la personería jurídica',
    );
  });
});
