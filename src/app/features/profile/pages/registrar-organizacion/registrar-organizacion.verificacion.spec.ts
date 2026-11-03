import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, afterEach } from 'vitest';

import { RegistrarOrganizacionComponent } from './registrar-organizacion.component';
import { AuthService } from '../../../../core/services/auth.service';
import { Organizacion } from '../../../../shared/models/organizacion.model';

const URL_REPRESENTANTE = '/api/organizaciones/representante/7';

function organizacion(extra: Partial<Organizacion> = {}): Organizacion {
  return {
    idOrganizacion: 1,
    idRepresentante: 7,
    nombre: 'Refugio Patitas',
    tipo: 'REFUGIO',
    direccion: 'Av. América 123',
    telefono: '+591 70123456',
    email: 'contacto@patitas.org',
    descripcion: null,
    horarios: null,
    zonasCobertura: null,
    logoUrl: null,
    estadoVerificacion: 'PENDIENTE_VERIFICACION',
    fechaRegistro: '2026-10-04T10:00:00',
    puedeGestionarCasos: false,
    tieneDocumento: false,
    notaRevision: null,
    ...extra,
  };
}

describe('RegistrarOrganizacionComponent: documento y reenvío (HU-32)', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<RegistrarOrganizacionComponent>;
  let component: RegistrarOrganizacionComponent;

  async function crear(respuesta: Organizacion | null) {
    await TestBed.configureTestingModule({
      imports: [RegistrarOrganizacionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: { obtenerIdUsuarioActual: () => 7 } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RegistrarOrganizacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const req = http.expectOne(URL_REPRESENTANTE);
    if (respuesta) {
      req.flush(respuesta);
    } else {
      req.flush('no existe', { status: 404, statusText: 'Not Found' });
    }
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  const raiz = () => fixture.nativeElement as HTMLElement;
  const elegir = (f: File) =>
    component.seleccionarDocumento({ target: { files: [f], value: '' } } as unknown as Event);
  const llenar = () =>
    (component.form = {
      nombre: 'Refugio Patitas',
      tipo: 'REFUGIO',
      direccion: 'Av. América 123',
      telefono: '+591 70123456',
      email: 'contacto@patitas.org',
      descripcion: '',
      horarios: '',
      zonasCobertura: '',
    });

  it('el formulario de registro tiene el campo de documento de verificación', async () => {
    await crear(null);

    expect(raiz().querySelector('#documento')).not.toBeNull();
    expect(raiz().textContent).toContain('Documento de verificación');
  });

  it('rechaza un documento con formato no permitido o demasiado grande', async () => {
    await crear(null);

    elegir(new File(['GIF89a'], 'doc.gif', { type: 'image/gif' }));
    fixture.detectChanges();
    expect(component.documento()).toBeNull();
    expect(raiz().textContent).toContain('Formato no permitido. Sube un PDF, JPG o PNG.');

    elegir(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'doc.pdf', { type: 'application/pdf' }));
    fixture.detectChanges();
    expect(raiz().textContent).toContain('El documento supera el tamaño máximo de 5 MB.');
  });

  it('registra la organización enviando el documento elegido', async () => {
    await crear(null);
    llenar();
    elegir(new File(['%PDF-1.7'], 'personeria.pdf', { type: 'application/pdf' }));
    fixture.detectChanges();
    expect(raiz().textContent).toContain('personeria.pdf');

    component.registrar();
    const req = http.expectOne('/api/organizaciones');
    expect(((req.request.body as FormData).get('documento') as File).name).toBe('personeria.pdf');
    req.flush({ organizacion: organizacion({ tieneDocumento: true }), confirmacionEnviada: true });
    fixture.detectChanges();

    expect(raiz().textContent).toContain('Documento de verificación adjuntado');
  });

  it('un error de formato del documento en el backend se muestra en su campo', async () => {
    await crear(null);
    llenar();
    component.registrar();

    http
      .expectOne('/api/organizaciones')
      .flush(
        {
          status: 415,
          message: 'Formato no permitido',
          errors: { documento: 'Formato no permitido' },
        },
        { status: 415, statusText: 'Unsupported Media Type' },
      );
    fixture.detectChanges();

    expect(component.errores()['documento']).toContain('Sube un PDF, JPG o PNG');
    expect(component.errores()['logo']).toBeUndefined();
  });

  it('una organización rechazada ve el motivo y puede reenviar la solicitud', async () => {
    await crear(
      organizacion({
        estadoVerificacion: 'RECHAZADA',
        notaRevision: 'Falta la personería jurídica',
      }),
    );

    expect(raiz().querySelector('.rechazo-motivo')?.textContent).toContain(
      'Falta la personería jurídica',
    );
    (raiz().querySelector('.btn-reenviar') as HTMLButtonElement).click();

    const req = http.expectOne('/api/organizaciones/1/reenviar');
    expect(req.request.method).toBe('POST');
    req.flush(organizacion({ estadoVerificacion: 'PENDIENTE_VERIFICACION' }));
    fixture.detectChanges();

    expect(raiz().querySelector('.rechazo')).toBeNull();
    expect(raiz().textContent).toContain('Tu solicitud fue reenviada.');
  });

  it('si el reenvío falla, lo avisa y sigue rechazada', async () => {
    await crear(organizacion({ estadoVerificacion: 'RECHAZADA', notaRevision: 'Motivo' }));

    component.reenviar();
    http
      .expectOne('/api/organizaciones/1/reenviar')
      .flush('error', { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(raiz().textContent).toContain('No se pudo reenviar la solicitud.');
    expect(raiz().querySelector('.rechazo')).not.toBeNull();
  });

  it('una organización pendiente o verificada no muestra el reenvío', async () => {
    await crear(organizacion({ estadoVerificacion: 'PENDIENTE_VERIFICACION' }));

    expect(raiz().querySelector('.btn-reenviar')).toBeNull();
  });

  it('al editar la ficha puede reemplazar el documento', async () => {
    await crear(organizacion({ tieneDocumento: true }));
    component.iniciarEdicion();
    fixture.detectChanges();
    expect(raiz().textContent).toContain('Ya adjuntaste un documento');

    elegir(new File(['%PDF-1.7'], 'licencia.pdf', { type: 'application/pdf' }));
    component.guardar();

    const req = http.expectOne('/api/organizaciones/1');
    expect(((req.request.body as FormData).get('documento') as File).name).toBe('licencia.pdf');
    req.flush(organizacion({ tieneDocumento: true }));
  });
});
